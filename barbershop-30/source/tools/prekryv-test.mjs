#!/usr/bin/env node
// Test prekrývania textov (zákazník 9. 11. 2026: „prekrývajúce sa texty sú neprofesionálne“). Prejde úvodnú stránku
// v oknách 320/360/390/430/768/1440 px bez filmu aj s filmom (?film=on) a v nízkych oknách telefónu (iPhone s lištou
// Safari: 390×664, 360×614, 430×733, 320×447) a hľadá dva viditeľné texty z rôznych vetiev stránky, ktoré ležia cez
// seba (riadkové obdĺžniky sa pretínajú o viac ako 2 px v oboch osiach a medzi nimi nie je nepriehľadná plocha).
// 0 prekrytí = OK.
//
//   node source/tools/prekryv-test.mjs [--w=320,390] [--film=oba|on|off] [--nizke=ano|nie|len] [--krok=150] [--vrstvy=nie] [--lista=nie] [--vyzva=nie] [--len=vrstvy]
//                                      [--naraz=3] [--out=<priečinok na snímky nálezov>] [--url=<iná adresa>]
//
// Ako meria: v každom okne tri prechody.
//  1. Stránka po krokoch (--krok px): po každom kroku 650 ms (prechody textov trvajú do 0,45 s), potom sa zavolá
//     zastavenie Kina (BS30_KINO.stoj, tá istá funkcia, ktorú po 1,8 s bez skrolu volá časovač) a po 250 ms sa meria
//     (text sa ráta za viditeľný už od krytia 0,05, teda aj uprostred nábehu).
//  2. Hrany pásov: horný a spodný okraj každého pásu s textom (tím, cenník, galéria, kontakt, otázky, pätička) prejde
//     po 16 px cez miesto, kde svieti „Ďalej“ a pás kapitol – tam vzniklo prekrytie zo snímky zákazníka („Ďalej“ cez
//     štítok sekcie), ktoré krok 150 px netrafí.
//  3. Skutočné čakanie 2,6 s na cieli každej kapitoly: „Ďalej“ sa musí aspoň raz ukázať samo (test nesmie prejsť len
//     preto, že sa „Ďalej“ neukazuje vôbec) a pri prvom pohybe skrolu hneď zhasnúť (krytie 0 v najbližšej snímke).
// Výsledok nesmie závisieť od časovania (záťaž, pomalé snímky): „Ďalej“ svieti len na mieste bez viditeľného textu
// (kino.js volno()) a pás kapitol sa nad pásom s textom schová v tej istej snímke (style.css bez doznievania).
// Text pod nepriehľadnou plochou (lišta, pás, pripnuté záložky cenníka) je zakrytý, to nie je nález. Pri náleze sa uloží
// snímka s rámikmi (červený prienik, modrý a zelený prvok) do --out (predvolene dočasný priečinok, nie docs/).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { startStaticServer } = await import(path.join(SITE, 'source', 'shot.mjs'));
const require = createRequire(path.join(SITE, 'source', 'shot.mjs'));
const { chromium } = require('playwright');

const arg = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)=?(.*)$/.exec(a); return m ? [m[1], m[2] === '' ? true : m[2]] : [a, true]; }));
const VYSKA = { 320: 568, 360: 780, 390: 844, 430: 932, 768: 1024, 1440: 900 };
const WS = String(arg.w || '320,360,390,430,768,1440').split(',').map(Number);
// nízke okná: telefón s viditeľnou lištou prehliadača (malé okno, jednotka svh); 320×447 je iPhone SE s lištou
const NIZKE = [[390, 664], [360, 614], [430, 733], [320, 447]];
const FILM = arg.film || 'oba', KROK = Number(arg.krok || 150), PRAH = 2, NARAZ = Number(arg.naraz || 3);
const OUT = path.resolve(arg.out || path.join(os.tmpdir(), 'prekryv-test'));
fs.mkdirSync(OUT, { recursive: true });

let failed = 0;
const ok = (c, m, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}${x ? '  ' + x : ''}`); if (!c) failed++; };

/* ---- v stránke: viditeľné textové prvky, prieniky a poradie vrstiev ---- */
const V_STRANKE = ({ PRAH }) => {
  const vw = innerWidth, vh = innerHeight;
  const styl = new Map();
  const cs = (el) => { let s = styl.get(el); if (!s) { s = getComputedStyle(el); styl.set(el, s); } return s; };
  // účinné krytie: súčin opacity po koreň; visibility hidden, display none a content-visibility = 0
  const vid = new Map();
  const viditelnost = (el) => {
    if (vid.has(el)) return vid.get(el);
    let o = 1;
    if (el.checkVisibility && !el.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })) o = 0;
    for (let e = el; o && e && e !== document; e = e.parentElement) {
      const s = cs(e);
      if (s.display === 'none' || s.visibility === 'hidden' || s.visibility === 'collapse') { o = 0; break; }
      o *= parseFloat(s.opacity);
      if (o <= 0.05) { o = 0; break; }
      if (s.clipPath && /inset\(\s*100%/.test(s.clipPath)) { o = 0; break; }
    }
    vid.set(el, o); return o;
  };
  // orez predkami s overflow iným než visible: viditeľná časť prvku je prienik s ich obdĺžnikmi
  const orez = new Map();
  const orezRect = (el) => {
    if (orez.has(el)) return orez.get(el);
    let r = { l: 0, t: 0, r: vw, b: vh };
    for (let e = el.parentElement; e && e !== document.documentElement; e = e.parentElement) {
      const s = cs(e);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        const q = e.getBoundingClientRect();
        if (s.overflowX !== 'visible') r = { ...r, l: Math.max(r.l, q.left), r: Math.min(r.r, q.right) };
        if (s.overflowY !== 'visible') r = { ...r, t: Math.max(r.t, q.top), b: Math.min(r.b, q.bottom) };
      }
    }
    orez.set(el, r); return r;
  };
  const sel = (el) => {
    const parts = [];
    for (let e = el; e && e !== document.body && parts.length < 4; e = e.parentElement) {
      let p = e.tagName.toLowerCase();
      if (e.id) { p += '#' + e.id; parts.unshift(p); break; }
      const cl = [...e.classList].filter((c) => !/^(is-|js-|kw$|on$)/.test(c)).slice(0, 2);
      if (cl.length) p += '.' + cl.join('.');
      if (e.parentElement) { const sib = [...e.parentElement.children].filter((x) => x.tagName === e.tagName); if (sib.length > 1) p += `:nth-of-type(${sib.indexOf(e) + 1})`; }
      parts.unshift(p);
    }
    return parts.join(' > ');
  };
  const text = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  // tok textu: najbližší predok, ktorý nie je inline – dva inline kusy jedného odseku či nadpisu nie sú prekrytie
  const tok = (el) => { let e = el; while (e && e !== document.body && /^inline/.test(cs(e).display)) e = e.parentElement; return e; };
  const prvky = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT|SVG|PATH|BR|OPTION)$/i.test(el.tagName)) continue;
    if (el.classList.contains('__prekryv')) continue;
    let own = false;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) { own = true; break; }
    if (!own) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) continue;                       // text len pre čítačku a prázdne prvky
    if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) continue;
    const o = viditelnost(el); if (!o) continue;
    const c = orezRect(el);
    // riadkové obdĺžniky (nie celá škatuľa: medzery medzi riadkami nie sú text), orezané predkami
    const rg = document.createRange(); rg.selectNodeContents(el);
    const riadky = [...rg.getClientRects()].map((x) => ({ l: Math.max(x.left, c.l), t: Math.max(x.top, c.t), r: Math.min(x.right, c.r), b: Math.min(x.bottom, c.b) })).filter((x) => x.r - x.l > 1 && x.b - x.t > 1);
    if (!riadky.length) continue;
    prvky.push({ el, sel: sel(el), text: text(el), riadky, o: +o.toFixed(2), tok: tok(el) });
  }
  const prienik = (a, b) => {
    let best = null;
    for (const x of a.riadky) for (const y of b.riadky) {
      const l = Math.max(x.l, y.l), t = Math.max(x.t, y.t), r = Math.min(x.r, y.r), bb = Math.min(x.b, y.b);
      if (r - l > PRAH && bb - t > PRAH && (!best || (r - l) * (bb - t) > best.w * best.h)) best = { l: Math.round(l), t: Math.round(t), w: Math.round(r - l), h: Math.round(bb - t) };
    }
    return best;
  };
  // nepriehľadná plocha: pozadie s krytím aspoň 0,8, obrázkové pozadie, obrázok, video, plátno, backdrop-filter
  const alfa = (bg) => { const m = /rgba?\(([^)]+)\)/.exec(bg); if (!m) return bg && bg !== 'transparent' ? 1 : 0; const p = m[1].split(/[\s,/]+/).map(parseFloat); return p.length > 3 ? p[3] : 1; };
  const nepriehladny = (e) => {
    if (/^(IMG|VIDEO|CANVAS|PICTURE)$/.test(e.tagName)) return 'obrázok';
    const s = cs(e);
    if (alfa(s.backgroundColor) >= 0.8) return 'pozadie';
    if (s.backgroundImage && s.backgroundImage !== 'none') return 'pozadie-obrázok';
    const bf = s.backdropFilter || s.webkitBackdropFilter; if (bf && bf !== 'none') return 'backdrop-filter';
    return null;
  };
  // vrstvy v strede prieniku: pointer-events dočasne zapnuté všade (elementsFromPoint ich inak vynechá)
  const st = document.createElement('style'); st.className = '__prekryv'; st.textContent = '*{pointer-events:auto!important}'; document.head.append(st);
  const vrstvy = (a, b, p) => {
    const list = document.elementsFromPoint(p.l + p.w / 2, p.t + p.h / 2);
    const inA = (e) => e === a.el || a.el.contains(e) || (e.contains(a.el) && !e.contains(b.el));
    const inB = (e) => e === b.el || b.el.contains(e) || (e.contains(b.el) && !e.contains(a.el));
    let iA = -1, iB = -1;
    for (let i = 0; i < list.length; i++) { if (iA < 0 && inA(list[i])) iA = i; if (iB < 0 && inB(list[i])) iB = i; }
    if (iA < 0 || iB < 0) return { druh: 'mimo' };
    const low = Math.max(iA, iB), spodny = iA < iB ? b : a;
    for (let i = 0; i < low; i++) {
      const e = list[i];
      if (e === spodny.el || spodny.el.contains(e)) continue;   // potomkovia spodného textu ho nezakrývajú
      if (e.classList && e.classList.contains('__prekryv')) continue;
      const n = nepriehladny(e);
      if (n) return { druh: 'zakryte', rez: spodny.o > 0.3 && e.classList.contains('band') };
    }
    return { druh: 'prekryte' };
  };
  const prekryte = []; let zakryte = 0, rezy = 0;
  for (let i = 0; i < prvky.length; i++) for (let j = i + 1; j < prvky.length; j++) {
    const a = prvky[i], b = prvky[j];
    if (a.el.contains(b.el) || b.el.contains(a.el) || a.tok === b.tok) continue;
    const p = prienik(a, b); if (!p) continue;
    const v = vrstvy(a, b, p);
    if (v.druh === 'prekryte') prekryte.push({ a: { sel: a.sel, text: a.text, o: a.o }, b: { sel: b.sel, text: b.text, o: b.o }, prienik: p });
    else if (v.druh === 'zakryte') { zakryte++; if (v.rez) rezy++; }
  }
  st.remove();
  const chip = document.querySelector('.kino-next'), tit = document.querySelector('.kino-tit li.on');
  const svieti = (e) => { if (!e || e.hidden) return false; let o = 1; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const s = getComputedStyle(x); if (s.display === 'none' || s.visibility === 'hidden') return false; o *= +s.opacity; } return o > 0.5; };
  return { prekryte, zakryte, rezy, pocet: prvky.length, dalej: svieti(chip), titulok: svieti(tit) };
};
// rámiky pre snímku nálezu: červený prienik, modrý prvok A, zelený prvok B
const RAMIKY = ({ p, a, b }) => {
  const box = (r, css) => { const d = document.createElement('div'); d.className = '__prekryv'; d.style.cssText = `position:fixed;left:${r.l}px;top:${r.t}px;width:${r.w}px;height:${r.h}px;z-index:99999;pointer-events:none;box-sizing:border-box;${css}`; document.body.append(d); };
  const el = (s) => { try { return document.querySelector(s.replace(/ > /g, '>')); } catch (e) { return null; } };
  for (const [s, c] of [[a, '#3d8bff'], [b, '#2ecc71']]) { const e = el(s); if (e) { const r = e.getBoundingClientRect(); box({ l: r.left - 2, t: r.top - 2, w: r.width + 4, h: r.height + 4 }, `border:2px dashed ${c}`); } }
  box({ l: p.l - 3, t: p.t - 3, w: p.w + 6, h: p.h + 6 }, 'border:3px solid #ff1744;box-shadow:0 0 0 2px #fff,0 0 12px #000');
};
const ODSTRAN = () => document.querySelectorAll('.__prekryv').forEach((e) => e.remove());

const srv = arg.url ? null : await startStaticServer(SITE);
const URL0 = arg.url || `${srv.origin}/index.html`;
// softvérová grafika: aby film (?film=on) bežal aj v prehliadači bez grafickej karty
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function okno(w, h, film) {
  const mobil = w < 700, meno = `${w}×${h} film=${film}`;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobil, hasTouch: mobil, colorScheme: 'dark', locale: 'sk-SK' });
  const page = await ctx.newPage(); const chyby = [];
  page.on('pageerror', (e) => chyby.push(String(e.message).slice(0, 160)));
  const nalezy = new Map(); let merani = 0, zakryte = 0, rezy = 0, dalejVidno = 0, titulkyVidno = 0;
  try {
    await page.goto(`${URL0}?uvod=off&hudba=off&film=${film}`, { waitUntil: 'load', timeout: 120000 });
    // lenivé moduly (kino.js: „Ďalej“ a titulky krok za krokom) prídu po prvom geste návštevníka
    if (mobil) await page.touchscreen.tap(w / 2, h * 0.3); else { await page.mouse.move(w / 2, h / 2); await page.mouse.move(w / 2 + 20, h / 2 + 10); }
    const kino = await page.waitForFunction(() => !!window.BS30_KINO && !!document.querySelector('.kino-next'), null, { timeout: 30000 }).then(() => true, () => false);
    const stoj = await page.evaluate(() => typeof (window.BS30_KINO || {}).stoj === 'function');
    const meraj = async (y, cakaj) => {
      await page.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y);
      await page.waitForTimeout(cakaj);
      // zastavenie Kina hneď (tá istá funkcia ako časovač po 1,8 s bez skrolu); bez nej skutočné čakanie
      if (stoj) { await page.evaluate(() => window.BS30_KINO.stoj()); await page.waitForTimeout(250); } else await page.waitForTimeout(1900);
      const r = await page.evaluate(V_STRANKE, { PRAH });
      merani++; zakryte += r.zakryte; rezy += r.rezy; if (r.dalej) dalejVidno++; if (r.titulok) titulkyVidno++;
      for (const n of r.prekryte) {
        const k = `${n.a.sel} × ${n.b.sel}`;
        let z = nalezy.get(k);
        if (!z) {
          z = { ...n, y, krokov: 0, snimka: '' }; nalezy.set(k, z);
          if (nalezy.size <= 12) {
            const f = path.join(OUT, `w${w}x${h}-${film}-y${Math.round(y)}-${nalezy.size}.png`);
            try { await page.evaluate(RAMIKY, { p: n.prienik, a: n.a.sel, b: n.b.sel }); await page.screenshot({ path: f, timeout: 20000 }); z.snimka = f; } catch (e) { /* snímka je len pomôcka */ }
            await page.evaluate(ODSTRAN);
          }
        }
        z.krokov++;
      }
      return r;
    };
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    // 1. stránka po krokoch
    for (let y = 0; ; y += KROK) { const yy = Math.min(y, H - h); await meraj(yy, 650); if (yy >= H - h) break; }
    // 2. hrany pásov cez miesto „Ďalej“ a pásu kapitol (po 16 px)
    const geo = await page.evaluate(() => {
      const r = (e) => { if (!e) return null; const q = e.getBoundingClientRect(); return q.height ? [q.top, q.bottom] : null; };
      const zony = [r(document.querySelector('.kino-next')), r(document.querySelector('.story-line'))].filter(Boolean);
      return { zony, pasy: [...document.querySelectorAll('.band, .site-footer')].map((e) => { const q = e.getBoundingClientRect(); return [q.top + scrollY, q.bottom + scrollY]; }), max: document.documentElement.scrollHeight - innerHeight };
    });
    // „Ďalej“ je pred prvým zobrazením skryté (hidden), jeho miesto je z CSS: telefón pod pásom kapitol, počítač vľavo dole
    if (geo.zony.length < 2) geo.zony.push(mobil ? [96, 150] : [h - 130, h - 60]);
    const zT = Math.min(...geo.zony.map((z) => z[0])), zB = Math.max(...geo.zony.map((z) => z[1]));
    const body = new Set();
    for (const [t, b] of geo.pasy) {
      for (let v = zB + 16; v >= zT - 96; v -= 16) body.add(Math.round(t - v));   // horný okraj pásu (štítok, nadpis) cez zónu
      for (let v = zT - 16; v <= zB + 96; v += 16) body.add(Math.round(b - v));   // spodný okraj pásu (posledný text) cez zónu
    }
    for (const y of [...body].filter((y) => y >= 0 && y <= geo.max).sort((a, b) => a - b)) await meraj(y, 200);
    // 3. skutočné čakanie na cieli kapitol: „Ďalej“ sa musí ukázať samo. Keď svieti, prvý pohyb skrolu ho musí zhasnúť
    //    hneď (v najbližšej vykreslenej snímke krytie 0, bez doznievania) – inak by pod ním prešiel text pásu.
    let samo = 0, doznieva = 0;
    const ciele = await page.evaluate(() => (window.BS30_KINO ? window.BS30_KINO.state.ciele : []));
    for (const y of ciele.slice(1, -1)) {
      await page.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y);
      await page.waitForTimeout(2600);
      const r = await page.evaluate(V_STRANKE, { PRAH });
      merani++; if (r.dalej) samo++;
      for (const n of r.prekryte) { const k = `${n.a.sel} × ${n.b.sel}`; if (!nalezy.has(k)) nalezy.set(k, { ...n, y, krokov: 1, snimka: '' }); }
      if (r.dalej) {
        const o = await page.evaluate(() => new Promise((ok) => { scrollBy({ top: 40, behavior: 'instant' }); requestAnimationFrame(() => requestAnimationFrame(() => ok(+getComputedStyle(document.querySelector('.kino-next')).opacity))); }));
        if (o > 0.01) doznieva++;
      }
    }
    const zoznam = [...nalezy.values()];
    ok(!zoznam.length && !chyby.length, `${meno}: 0 prekrytí textov`, `${merani} meraní, výška ${H} px, „Ďalej“ svietilo ${dalejVidno}× (samo ${samo}×), titulky ${titulkyVidno}×, zakrytých pod plochou ${zakryte}, rezov pásom ${rezy}${chyby.length ? ', chyby: ' + chyby.join(' | ') : ''}`);
    for (const n of zoznam) console.log(`     PREKRYTIE y ${Math.round(n.y)} (${n.krokov}×): „${n.a.text}“ × „${n.b.text}“ | ${n.a.sel} × ${n.b.sel} | prienik ${n.prienik.w}×${n.prienik.h} px${n.snimka ? ' | ' + n.snimka : ''}`);
    // „Ďalej“ a titulky žijú: bez nich by test nič nestrážil (nízke okno ich smie skryť, tam sa nevyžadujú)
    if (h >= 700 && film === 'off') {
      ok(kino && stoj, `${meno}: Kino je načítané a dá sa zastaviť (BS30_KINO.stoj)`);
      ok(samo > 0, `${meno}: „Ďalej“ sa po 1,8 s státia ukáže samo`, `${samo} z ${Math.max(0, ciele.length - 2)} kapitol`);
      ok(samo > 0 && doznieva === 0, `${meno}: „Ďalej“ pri prvom pohybe skrolu zhasne hneď (bez doznievania)`, `${samo - doznieva} z ${samo}`);
      if (mobil || w >= 1024) ok(titulkyVidno > 0, `${meno}: titulky krok za krokom v Remesle svietia`, `${titulkyVidno}×`);
    }
  } catch (e) {
    ok(false, `${meno}: prechod stránkou`, String(e.message || e).split('\n')[0].slice(0, 200));
  }
  await ctx.close();
}

/* ---- vrstvy nad stránkou (L3, Lajko 9. 11. 2026, snímky z iPhonu 10. 11.): bublina Barbera („Ahoj, som Barber…“)
   a ponuka jazyka („This page is also in English.“) ležali cez nadpis, vetu a háčik titulnej karty. Majú nepriehľadné
   pozadie, preto ich hlavný prechod ráta ako zakrytie, nie prekrytie. Tu: kým svietia, ich obdĺžnik nesmie pretínať
   žiadny riadok viditeľného textu stránky (karty ani iného), ponuka v jazykoch en, de, uk, bublina v slovenčine
   (?asistent=ukazka); bublina sa po posune stránky schová a ponuka pri skrole zhasne hneď. ---- */
const VRSTVY = () => {
  const vid = (e) => { if (!e || e.hidden) return 0; let o = 1; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const s = getComputedStyle(x); if (s.display === 'none' || s.visibility === 'hidden') return 0; o *= +s.opacity; } return o; };
  const vrstvy = [['bublina', document.querySelector('.asi-oznam')], ['ponuka', document.querySelector('.lang-offer')]].filter(([, e]) => vid(e) > 0.05);
  const prieniky = [];
  for (const [meno, v] of vrstvy) {
    const r = v.getBoundingClientRect();
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), rg = document.createRange();
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const p = n.parentElement;
      if (!p || !n.nodeValue.trim() || p.closest('.asi-btn, .asi-oznam, .lang-offer, script, style, noscript, template') || vid(p) <= 0.05) continue;
      rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) {
        const w = Math.min(q.right, r.right) - Math.max(q.left, r.left), h = Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top);
        if (w > 2 && h > 2) { prieniky.push(`${meno} × „${n.nodeValue.trim().slice(0, 40)}“${p.closest('.title-card') ? ' (karta)' : ''}`); break; }
      }
    }
  }
  return { vrstvy: vrstvy.map(([m]) => m), prieniky };
};
async function vrstvy() {
  const POLOHY = ['uvod', 'vstup-dnu', 'vstup-dnu+karta', 'remeslo+karta', 'cakaren+karta', 'tim+karta'];
  // poloha: začiatok scény, alebo cieľ kapitoly (karta celá na očiach, BS30_KINO.state.ciele) – zistí sa raz pre okno
  const ciele = new Map();
  const zisti = async (w, h) => {
    const k = `${w}x${h}`; if (ciele.has(k)) return ciele.get(k);
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, colorScheme: 'dark', locale: 'sk-SK' });
    const page = await ctx.newPage();
    await page.goto(`${URL0}?uvod=off&hudba=off&film=off`, { waitUntil: 'load' });
    if (w < 700) await page.touchscreen.tap(w / 2, h * 0.3); else await page.mouse.move(w / 2, h / 2);
    await page.waitForFunction(() => !!window.BS30_KINO, null, { timeout: 30000 }).catch(() => {});
    const m = await page.evaluate(() => {
      const c = window.BS30_KINO ? window.BS30_KINO.state.ciele : [], o = { uvod: 0 };
      ['vstup-dnu', 'remeslo', 'cakaren', 'tim'].forEach((id, i) => { const s = document.getElementById(id); o[id] = Math.round(s.getBoundingClientRect().top + scrollY); if (c[i + 1] != null) o[id + '+karta'] = c[i + 1]; });
      return o;
    });
    await ctx.close(); ciele.set(k, m); return m;
  };
  const ulohyV = [];
  for (const locale of ['en-US', 'de-DE', 'uk-UA']) for (const [w, h] of [[390, 844], [1440, 900]]) for (const p of POLOHY) ulohyV.push(['ponuka', w, h, locale, p]);
  for (const [w, h] of [[320, 568], [430, 932]]) for (const p of POLOHY) ulohyV.push(['ponuka', w, h, 'en-US', p]);
  for (const [w, h] of [[390, 844], [320, 568], [1440, 900]]) for (const p of POLOHY.slice(1)) ulohyV.push(['bublina', w, h, 'sk-SK', p]);
  const vysledky = [];
  const jedna = async ([druh, w, h, locale, poloha]) => {
    const y = (await zisti(w, h))[poloha];
    if (y == null) return;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, colorScheme: 'dark', locale });
    const page = await ctx.newPage(); const chyby = [];
    page.on('pageerror', (e) => chyby.push(String(e.message).slice(0, 120)));
    await page.route(/barbershop30\.sk|headspa30\.sk|booqme|instagram|facebook|google/, (r) => r.abort());
    const r = { druh, okno: `${w}×${h}`, locale, poloha, svietila: false, prieniky: [], hned: null, chyby };
    try {
      await page.goto(`${URL0}?uvod=off&hudba=off&film=off${druh === 'bublina' ? '&asistent=ukazka' : ''}`, { waitUntil: 'load' });
      await page.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y);
      // gesto na fotke záberu (hore), nie na karte
      if (w < 700) await page.touchscreen.tap(w / 2, h * 0.25); else await page.mouse.move(w * 0.7, h * 0.4);
      const sel = druh === 'bublina' ? '.asi-oznam' : '.lang-offer';
      // bublina: 8 s na očiach + meranie; ponuka: modul jazykov po geste a meranie po zastavení. Meria sa každých 500 ms.
      const koniec = Date.now() + (druh === 'bublina' ? 12500 : 6000);
      while (Date.now() < koniec) {
        await page.waitForTimeout(500);
        const v = await page.evaluate(VRSTVY);
        if (v.vrstvy.includes(druh)) { r.svietila = true; r.prieniky.push(...v.prieniky); }
      }
      if (r.svietila && await page.locator(sel).count()) {
        // posun o 40 px: bublina sa schová, ponuka zhasne v najbližšej snímke (krytie 0 alebo skrytá)
        r.hned = await page.evaluate((s) => new Promise((ok) => { scrollBy({ top: 40, behavior: 'instant' }); requestAnimationFrame(() => requestAnimationFrame(() => {
          const e = document.querySelector(s); if (!e || e.hidden) return ok(true);
          const c = getComputedStyle(e); ok(c.display === 'none' || c.visibility === 'hidden' || +c.opacity < 0.01);
        })); }), sel);
      }
    } catch (e) { r.chyby.push(String(e.message || e).split('\n')[0].slice(0, 160)); }
    vysledky.push(r);
    await ctx.close();
  };
  let i = 0;
  await Promise.all(Array.from({ length: NARAZ }, async () => { while (i < ulohyV.length) await jedna(ulohyV[i++]); }));
  for (const druh of ['ponuka', 'bublina']) {
    const rr = vysledky.filter((x) => x.druh === druh), zle = rr.filter((x) => x.prieniky.length || x.chyby.length || x.hned === false);
    ok(!zle.length, `${druh}: nikdy cez text stránky ani karty`, `${rr.length} polôh, svietila v ${rr.filter((x) => x.svietila).length}, prienikov ${zle.reduce((a, x) => a + x.prieniky.length, 0)}`);
    for (const x of zle) console.log(`     ${x.okno} ${x.locale} ${x.poloha}: ${[...new Set(x.prieniky)].join(' | ')}${x.hned === false ? ' | po posune nezhasla' : ''}${x.chyby.length ? ' | chyby: ' + x.chyby.join(' | ') : ''}`);
    // test musí niečo strážiť: vrstva sa aspoň niekde ukáže (na voľnom mieste) a po posune zhasne
    ok(rr.some((x) => x.svietila) && rr.filter((x) => x.svietila).every((x) => x.hned !== false), `${druh}: na voľnom mieste sa ukáže a po posune hneď zhasne`, rr.filter((x) => x.svietila).map((x) => `${x.okno} ${x.locale} ${x.poloha}`).join(', '));
  }
  if (arg.vypis) for (const x of vysledky) console.log('     ', JSON.stringify(x));
}

/* ---- plávajúca lišta Zavolať/Objednať sa (telefón) × tlačidlá titulnej karty úvodu (kontrola K1-1, 11. 11. 2026): na
   nízkom telefóne ležala lišta cez „Zavolať a potvrdiť termín“. Lišta je nepriehľadné tlačidlo, hlavný prechod to ráta ako
   zakrytie. Tu: skrol 0–1 400 px po 50 px, kým lišta svieti, jej tlačidlá nesmú pretínať viditeľné tlačidlo karty. ---- */
async function lista() {
  const okna = [[320, 568], [360, 614], [375, 667], [390, 664], [390, 844], [430, 932]], zle = [];
  for (const [w, h] of okna) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, colorScheme: 'dark', locale: 'sk-SK' });
    const page = await ctx.newPage();
    await page.route(/barbershop30\.sk|headspa30\.sk|booqme|instagram|facebook|google/, (r) => r.abort());
    await page.goto(`${URL0}?uvod=off&hudba=off&film=off`, { waitUntil: 'load' });
    await page.touchscreen.tap(w / 2, h / 2); await page.waitForTimeout(1500);
    let od = null;
    for (let y = 0; y <= 1400; y += 50) {
      await page.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y); await page.waitForTimeout(600);
      const r = await page.evaluate(() => {
        const kryt = (e) => { let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity; return o; };
        const cta = document.querySelector('#mobile-cta');
        const lb = cta && !cta.classList.contains('is-hidden') && kryt(cta) > 0.5 ? [...cta.querySelectorAll('.btn')].map((e) => e.getBoundingClientRect()) : [];
        const kb = [...document.querySelectorAll('.title-actions .btn')].filter((e) => kryt(e) > 0.01).map((e) => [e.textContent.trim(), e.getBoundingClientRect()]);
        for (const c of lb) for (const [t, b] of kb) if (Math.min(c.right, b.right) - Math.max(c.left, b.left) > 0 && Math.min(c.bottom, b.bottom) - Math.max(c.top, b.top) > 0) return { lista: true, cez: t };
        return { lista: lb.length > 0 };
      });
      if (r.lista && od == null) od = y;
      if (r.cez) { zle.push(`${w}×${h} y=${y}: lišta cez „${r.cez}“`); break; }
    }
    if (od == null) zle.push(`${w}×${h}: lišta sa do 1 400 px neukázala`);
    await ctx.close();
  }
  ok(!zle.length, 'plávajúca lišta nikdy cez tlačidlá titulnej karty úvodu (6 okien telefónu)', zle.join(' | '));
}

/* ---- výzva „Prejdi si podnik“ × karta úvodu na počítači (kontrola K2-1, 12. 11. 2026): pri 1280×720 a 1366×768 vo všetkých
   jazykoch a pri 1440×900 a 1536×864 v maďarčine a ukrajinčine ležala výzva cez „Zavolať a potvrdiť termín“. Hlavný prechod
   meria počítač len pri 1440×900 po slovensky. Tu: 6 okien počítača × 5 jazykov (najdlhšie texty hu, uk, de + sk, en);
   svietiaca výzva nesmie pretínať tlačidlá, riadok pod nadpisom ani vetu karty a aspoň v jednom okne musí svietiť. ---- */
async function vyzva() {
  const okna = [[1024, 768], [1280, 720], [1366, 768], [1440, 900], [1536, 864], [1920, 1080]], jazyky = ['sk', 'en', 'de', 'hu', 'uk'];
  const ulohyH = []; for (const j of jazyky) for (const o of okna) ulohyH.push([j, ...o]);
  const zle = [], svieti = []; let k = 0;
  await Promise.all(Array.from({ length: NARAZ }, async () => { while (k < ulohyH.length) { const [j, w, h] = ulohyH[k++];
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'dark', locale: 'sk-SK' });
    const page = await ctx.newPage();
    await page.route(/barbershop30\.sk|headspa30\.sk|booqme|instagram|facebook|google/, (r) => r.abort());
    const u = j === 'en' ? URL0.replace(/index\.html$/, 'en/index.html') + '?' : `${URL0}?${j === 'sk' ? '' : 'lang=' + j + '&'}`;
    await page.goto(`${u}uvod=off&hudba=off&film=off`, { waitUntil: 'load' });
    await page.waitForTimeout(2500);   // jazyk, riadok „Teraz otvorené“, meranie app.js (120 ms po zmene veľkosti karty)
    const r = await page.evaluate(() => {
      const vid = (e) => { if (!e) return null; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity < 0.05) return null; } const b = e.getBoundingClientRect(); return b.height ? b : null; };
      const hint = vid(document.querySelector('.title-frame .scroll-hint'));
      if (!hint) return { svieti: false, cez: [] };
      const cez = [...document.querySelectorAll('.title-hero .title-actions .btn, .title-hero .hero-proof > li, .title-hero .title-sub, .title-hero .hero-live')]
        .map((e) => [e.textContent.trim().slice(0, 24), vid(e)]).filter(([, b]) => b && Math.min(b.right, hint.right) - Math.max(b.left, hint.left) > 0.5 && Math.min(b.bottom, hint.bottom) - Math.max(b.top, hint.top) > 0.5)
        .map(([t]) => t);
      return { svieti: true, cez };
    });
    if (r.svieti) svieti.push(`${j} ${w}×${h}`);
    if (r.cez.length) zle.push(`${j} ${w}×${h}: výzva cez „${r.cez.join('“, „')}“`);
    await ctx.close(); } }));
  ok(!zle.length, `výzva „Prejdi si podnik“ nikdy cez kartu úvodu (${ulohyH.length} okien počítača × jazyk)`, zle.join(' | '));
  ok(svieti.length > 0, 'výzva „Prejdi si podnik“ sa na počítači ukáže, kde je pod kartou voľno', `svieti v ${svieti.length} z ${ulohyH.length}`);
}

const filmy = FILM === 'oba' ? ['off', 'on'] : [FILM];
const ulohy = [];
if (arg.len !== 'vrstvy') {
  if (arg.nizke !== 'len') for (const film of filmy) for (const w of WS) ulohy.push([w, VYSKA[w] || (w < 700 ? 844 : 900), film]);
  if (arg.nizke !== 'nie') for (const [w, h] of NIZKE) if (arg.nizke === 'len' || !arg.w || WS.includes(w)) ulohy.push([w, h, 'off']);
}
const t0 = Date.now();
// najviac NARAZ okien súbežne (film so softvérovou grafikou zaťaží všetky jadrá)
let dalsia = 0;
await Promise.all(Array.from({ length: Math.min(NARAZ, ulohy.length) }, async () => { while (dalsia < ulohy.length) { const u = ulohy[dalsia++]; await okno(...u); } }));
if (arg.vrstvy !== 'nie') await vrstvy();
if (arg.lista !== 'nie' && arg.len !== 'vrstvy') await lista();
if (arg.vyzva !== 'nie' && arg.len !== 'vrstvy') await vyzva();
await browser.close();
if (srv) srv.server.close();
console.log(`${failed ? 'FAIL' : 'OK  '} prekrývanie textov: ${ulohy.length} okien${arg.vrstvy !== 'nie' ? ' + vrstvy (bublina Barbera, ponuka jazyka)' : ''}, ${failed} chýb, ${Math.round((Date.now() - t0) / 1000)} s${failed ? ', snímky nálezov: ' + OUT : ''}`);
process.exit(failed ? 1 : 0);
