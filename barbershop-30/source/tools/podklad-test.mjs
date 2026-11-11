#!/usr/bin/env node
// Test podkladu pod plávajúcou lištou a ikonou Barbera (nález S-1, 11. 11. 2026; zákazník 9. 11.: „musí byť 0 prekrývaní
// všade“). Plávajúca lišta Zavolať / Objednať sa (#mobile-cta) a ikona Barbera (.asi-btn) ležia nad stránkou; pri zastavení
// skrolu nesmie medzi tlačidlami ani okolo ikony presvitať text stránky.
//
// Kritérium: pri zastavení skrolu v ľubovoľnom mieste stránky nie je VIDITEĽNÝ žiadny znak textu stránky v obdĺžniku
// lišty (spojenie jej tlačidiel) ani ikony, každý zväčšený o 8 px. Viditeľný = bod na riadku textu, ktorý nie je prekrytý
// nepriehľadným podkladom (alfa ≥ 0,9 v tom bode). Na úplnom spodku stránky musí byť celý obsah pätičky (logá, odkazy,
// copyright) nad lištou aj ikonou, nie schovaný pod nimi (dolná polovica okna; hore je pätička pod hlavičkou ako pri skrole).
//
//   node source/tools/podklad-test.mjs [--okna=320x568,390x844] [--jazyk=sk,en] [--film=off,on] [--naraz=4] [--out=<priečinok>] [--url=<iná adresa koreňa>]
//
// Ako meria: v každom okne (7 okien × slovensky a en/ × bez filmu a s ?film=on) zastavenia po 0,7 výšky okna cez celú
// stránku a úplný spodok. Na každé zastavenie sa skroluje v 12 snímkach (ako prst), čaká 0,9 s a zavolá sa zastavenie
// Kina (BS30_KINO.stoj, ako po 1,8 s bez skrolu). Potom v stránke: riadky viditeľného textu (Range.getClientRects,
// orezané predkami s overflow) v zóne lišty a ikony sa navzorkujú po 3 px a v každom bode document.elementsFromPoint
// (pointer-events sa na meranie zapnú všetkým prvkom, lišta má inak pointer-events: none) povie, čo leží nad textom.
// Bod je zakrytý, ak niektorý prvok nad ním (nie predok textu) má v tom bode farbu podkladu s alfou × krytie ≥ 0,9,
// alebo je to fotka (img/video/canvas) s krytím ≥ 0,9. Prechody (background-image) sa nerátajú – test je prísnejší,
// nie mäkší. Bod mimo obdĺžnika prvku (pseudoprvok) sa prvku nepripíše.
// Test nesmie prejsť naprázdno: v každom okne telefónu (≤ 900 px) sa lišta musí aspoň raz ukázať a ikona v každom okne.
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
const OKNA = String(arg.okna || '320x568,360x640,390x664,390x844,430x932,768x1024,1440x900').split(',').map((s) => s.split('x').map(Number));
const JAZYKY = String(arg.jazyk || 'sk,en').split(',');
const FILMY = String(arg.film || 'off,on').split(',');
const NARAZ = Number(arg.naraz || 4), OKRAJ = 8, ALFA = 0.9;
const OUT = path.resolve(arg.out || path.join(os.tmpdir(), 'podklad-test'));
fs.mkdirSync(OUT, { recursive: true });

let failed = 0;
const ok = (c, m, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}${x ? '  ' + x : ''}`); if (!c) failed++; };

/* ---- v stránke: zóny lišty a ikony, body textu v nich a čo leží nad každým bodom ---- */
const V_STRANKE = ({ OKRAJ, ALFA, spodok }) => {
  const vw = innerWidth, vh = innerHeight;
  const styl = new Map();
  const cs = (el) => { let s = styl.get(el); if (!s) { s = getComputedStyle(el); styl.set(el, s); } return s; };
  const kr = new Map();
  const krytie = (el) => {          // súčin opacity po koreň; display none / visibility hidden = 0
    if (kr.has(el)) return kr.get(el);
    let o = 1;
    for (let e = el; o && e && e.nodeType === 1; e = e.parentElement) {
      const s = cs(e);
      if (s.display === 'none' || s.visibility === 'hidden' || s.visibility === 'collapse') { o = 0; break; }
      o *= parseFloat(s.opacity);
    }
    kr.set(el, o); return o;
  };
  const orezRect = (el) => {        // viditeľná časť: prienik s predkami, ktoré orezávajú (overflow ≠ visible)
    let r = { l: 0, t: 0, r: vw, b: vh };
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const s = cs(e);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        const q = e.getBoundingClientRect();
        if (s.overflowX !== 'visible') r = { ...r, l: Math.max(r.l, q.left), r: Math.min(r.r, q.right) };
        if (s.overflowY !== 'visible') r = { ...r, t: Math.max(r.t, q.top), b: Math.min(r.b, q.bottom) };
      }
    }
    return r;
  };
  const alfaFarby = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return 0; const p = m[1].split(/[\s,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) * (p[3].endsWith('%') ? 0.01 : 1) : 1; };
  const zony = [];
  const cta = document.querySelector('#mobile-cta');
  const ctaVidno = !!cta && !cta.classList.contains('is-hidden') && krytie(cta) > 0.05;
  if (ctaVidno) {
    const b = [...cta.querySelectorAll('.btn')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 1);
    if (b.length) zony.push({ k: 'lišta', el: cta, l: Math.min(...b.map((r) => r.left)) - OKRAJ, t: Math.min(...b.map((r) => r.top)) - OKRAJ, r: Math.max(...b.map((r) => r.right)) + OKRAJ, b: Math.max(...b.map((r) => r.bottom)) + OKRAJ });
  }
  const ik = document.querySelector('.asi-btn');
  const ikVidno = !!ik && krytie(ik) > 0.05;
  if (ikVidno) { const r = ik.getBoundingClientRect(); if (r.width > 1) zony.push({ k: 'ikona', el: ik, l: r.left - OKRAJ, t: r.top - OKRAJ, r: r.right + OKRAJ, b: r.bottom + OKRAJ }); }

  // na meranie zachytávajú bod všetky prvky (lišta a jej podklad majú pointer-events: none)
  const pe = document.createElement('style'); pe.textContent = '*,*::before,*::after{pointer-events:auto!important}'; document.head.append(pe);
  const zakryty = (x, y, uzol) => {
    for (const el of document.elementsFromPoint(x, y)) {
      if (el.contains(uzol)) return null;                         // pod týmto je už text sám
      const r = el.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;   // zásah pseudoprvku mimo prvku
      const o = krytie(el); if (o <= 0) continue;
      const a = /^(IMG|VIDEO|CANVAS)$/.test(el.tagName) ? o : alfaFarby(cs(el).backgroundColor) * o;
      if (a >= ALFA) return el;
    }
    return null;
  };
  const popis = (el) => el ? el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '') : '';
  const nalezy = [], pata = [];
  const pataEl = document.querySelector('footer');
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) {
    const rod = n.parentElement;
    if (!n.nodeValue.trim() || !rod || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|OPTION)$/.test(rod.tagName)) continue;
    if (zony.some((z) => z.el.contains(n))) continue;              // vlastný text lišty a ikony (Zavolať, AI)
    const vPate = spodok && pataEl && pataEl.contains(n);
    if (!vPate && !zony.length) continue;
    if (krytie(rod) <= 0.05) continue;
    if (cs(rod).color && alfaFarby(cs(rod).color) <= 0.05) continue;   // priehľadné písmo
    const rg = document.createRange(); rg.selectNodeContents(n);
    let c = null;
    for (const q of rg.getClientRects()) {
      if (q.width <= 2 || q.height <= 2) continue;                   // text len pre čítačku (1 px)
      if (!c) c = orezRect(rod);
      const l = Math.max(q.left, c.l), t = Math.max(q.top, c.t), r = Math.min(q.right, c.r), b = Math.min(q.bottom, c.b);
      if (r - l <= 1 || b - t <= 1) continue;
      // zóny lišty a ikony: body po 3 px vo vodorovnom smere, 3 výšky v riadku
      for (const z of zony) {
        const zl = Math.max(l, z.l), zt = Math.max(t, z.t), zr = Math.min(r, z.r), zb = Math.min(b, z.b);
        if (zr - zl <= 0 || zb - zt <= 0) continue;
        let bod = null;
        for (const fy of [0.3, 0.5, 0.7]) {
          const y = t + (b - t) * fy; if (y < zt || y > zb) continue;
          for (let x = zl + 0.5; x <= zr && !bod; x += 3) if (!zakryty(x, y, n)) bod = { x: Math.round(x), y: Math.round(y) };
          if (bod) break;
        }
        if (bod) nalezy.push({ zona: z.k, text: n.nodeValue.trim().replace(/\s+/g, ' ').slice(0, 40), ...bod });
      }
      // spodok: text pätičky nesmie byť pod lištou, ikonou ani ich podkladom (čokoľvek pevné s alfou ≥ 0,1 nad ním)
      if (vPate && (t + b) / 2 > vh / 2) {   // horná polovica: pod hornou lištou stránky je to bežný skrol
        for (let x = l + 1; x < r; x += 6) {
          const y = (t + b) / 2;
          for (const el of document.elementsFromPoint(x, y)) {
            if (el.contains(n)) break;
            const rr = el.getBoundingClientRect(); if (x < rr.left || x > rr.right || y < rr.top || y > rr.bottom) continue;
            let pevny = false; for (let e = el; e && e.nodeType === 1; e = e.parentElement) if (cs(e).position === 'fixed') { pevny = true; break; }
            if (!pevny || krytie(el) <= 0.05) continue;
            const a = /^(IMG|VIDEO|CANVAS|svg)$/.test(el.tagName) ? 1 : alfaFarby(cs(el).backgroundColor) + (cs(el).backgroundImage !== 'none' ? 1 : 0);
            if (a >= 0.1) { pata.push({ text: n.nodeValue.trim().slice(0, 40), nad: popis(el), x: Math.round(x), y: Math.round(y) }); x = r; break; }
          }
        }
        for (const z of zony) if (Math.min(r, z.r) - Math.max(l, z.l) > 0 && Math.min(b, z.b) - Math.max(t, z.t) > 0) pata.push({ text: n.nodeValue.trim().slice(0, 40), nad: 'zóna ' + z.k });
      }
    }
  }
  pe.remove();
  return { y: Math.round(scrollY), lista: zony.some((z) => z.k === 'lišta'), ikona: zony.some((z) => z.k === 'ikona'), zony: zony.map(({ k, l, t, r, b }) => ({ k, l, t, r, b })), nalezy, pata };
};

const srv = arg.url ? null : await startStaticServer(SITE);
const KOREN = arg.url || srv.origin;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function okno(w, h, jazyk, film) {
  const mobil = w < 700, meno = `${w}×${h} ${jazyk} film=${film}`;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobil, hasTouch: mobil, colorScheme: 'dark', locale: jazyk === 'en' ? 'en-US' : 'sk-SK' });
  await ctx.route((u) => !u.href.startsWith(KOREN), (r) => r.abort());     // nič von (rezervačný systém, mapy, Instagram)
  const page = await ctx.newPage(); const chyby = [];
  page.on('pageerror', (e) => chyby.push(String(e.message).slice(0, 160)));
  let zastaveni = 0, listaVidno = 0, ikonaVidno = 0; const zle = [], pataZle = [];
  try {
    await page.goto(`${KOREN}/${jazyk === 'en' ? 'en/' : ''}index.html?uvod=off&hudba=off&film=${film}&asistent=ukazka`, { waitUntil: 'load', timeout: 120000 });
    if (mobil) await page.touchscreen.tap(w / 2, h * 0.3); else { await page.mouse.move(w / 2, h / 2); await page.mouse.move(w / 2 + 20, h / 2 + 10); }
    await page.waitForTimeout(1500);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const ciele = []; for (let y = 0; y < max; y += Math.round(h * 0.7)) ciele.push(y); ciele.push('spodok');
    for (const c of ciele) {
      await page.evaluate(async (c) => {
        const y = c === 'spodok' ? document.documentElement.scrollHeight - innerHeight : c, y0 = scrollY;
        for (let i = 1; i <= 12; i++) { scrollTo({ top: y0 + (y - y0) * i / 12, behavior: 'instant' }); await new Promise((r) => requestAnimationFrame(r)); }
      }, c);
      await page.waitForTimeout(900);
      if (await page.evaluate(() => typeof (window.BS30_KINO || {}).stoj === 'function')) { await page.evaluate(() => window.BS30_KINO.stoj()); await page.waitForTimeout(250); }
      if (c === 'spodok') {   // spodok sa mohol posunúť (lenivé obrázky): dorovnať
        await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await page.waitForTimeout(600);
      }
      const r = await page.evaluate(V_STRANKE, { OKRAJ, ALFA, spodok: c === 'spodok' });
      zastaveni++; if (r.lista) listaVidno++; if (r.ikona) ikonaVidno++;
      if (r.nalezy.length || r.pata.length) {
        for (const n of r.nalezy.slice(0, 3)) zle.push(`y=${r.y} ${n.zona} cez „${n.text}“ (${n.x},${n.y})`);
        for (const n of r.pata.slice(0, 3)) pataZle.push(`„${n.text}“ pod ${n.nad}`);
        const subor = path.join(OUT, `${w}x${h}-${jazyk}-${film}-y${r.y}.png`);
        if (!fs.existsSync(subor) && zle.length + pataZle.length <= 6) {
          await page.evaluate(({ zony, body }) => {
            for (const z of zony) { const d = document.createElement('div'); d.className = '__podklad'; d.style.cssText = `position:fixed;z-index:2147483647;pointer-events:none;left:${z.l}px;top:${z.t}px;width:${z.r - z.l}px;height:${z.b - z.t}px;outline:2px dashed #2979ff`; document.body.append(d); }
            for (const b of body) { const d = document.createElement('div'); d.className = '__podklad'; d.style.cssText = `position:fixed;z-index:2147483647;pointer-events:none;left:${b.x - 5}px;top:${b.y - 5}px;width:10px;height:10px;border:2px solid #ff1744;border-radius:50%`; document.body.append(d); }
          }, { zony: r.zony, body: r.nalezy.filter((n) => n.x != null) });
          await page.screenshot({ path: subor });
          await page.evaluate(() => document.querySelectorAll('.__podklad').forEach((e) => e.remove()));
        }
      }
    }
  } catch (e) { chyby.push('test: ' + String(e.message).slice(0, 160)); }
  await ctx.close();
  ok(!zle.length && !chyby.length, `${meno}: ${zastaveni} zastavení, lišta ${listaVidno}×, ikona ${ikonaVidno}× – text pod nimi nepresvitá`, [...zle.slice(0, 6), ...chyby].join(' | '));
  ok(!pataZle.length, `${meno}: spodok – celá pätička nad lištou a ikonou`, pataZle.slice(0, 4).join(' | '));
  ok(ikonaVidno > 0 && (w > 900 || listaVidno > 0), `${meno}: test nie naprázdno (lišta aj ikona sa ukázali)`);
}

const ulohy = [];
for (const film of FILMY) for (const jazyk of JAZYKY) for (const [w, h] of OKNA) ulohy.push([w, h, jazyk, film]);
const t0 = Date.now();
let dalsia = 0;
await Promise.all(Array.from({ length: Math.min(NARAZ, ulohy.length) }, async () => { while (dalsia < ulohy.length) { const u = ulohy[dalsia++]; await okno(...u); } }));
await browser.close();
if (srv) srv.server.close();
console.log(`${failed ? 'FAIL' : 'OK  '} podklad pod lištou a ikonou Barbera: ${ulohy.length} okien, ${failed} chýb, ${Math.round((Date.now() - t0) / 1000)} s${failed ? ', snímky nálezov: ' + OUT : ''}`);
process.exit(failed ? 1 : 0);
