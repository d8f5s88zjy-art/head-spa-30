// Kontrola webu VISIONARY LIVING v prehliadači (Playwright, Chromium, bez grafickej karty).
// Spustenie z priečinka visionary-living/: node source/kontrola.mjs [--url=https://…/visionary-living/]
// Overí: každá stránka bez chýb v konzole a bez zlyhaných požiadaviek, všetky odkazy a obrázky existujú,
// žiadne vodorovné pretekanie pri 320, 375, 390, 768 a 1440 px, výber bytu (filter, klávesnica, panel),
// prezeranie obrázkov, formulár, beh bez JavaScriptu a s obmedzeným pohybom, základná prístupnosť.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
// Playwright: najprv z projektu (npm i playwright), inak z globálnych modulov Node (npm i -g playwright)
const { chromium } = (() => { try { return require('playwright'); } catch { return createRequire(path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'x'))('playwright'); } })();
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml' };

function server(root) {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const abs = path.normalize(path.join(root, p));
      if (!abs.startsWith(root) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { res.writeHead(404); res.end('nie'); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(abs)] || 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(abs).pipe(res);
    }).listen(0, '127.0.0.1', () => resolve({ s, url: `http://127.0.0.1:${s.address().port}/` }));
  });
}

const argUrl = process.argv.find((a) => a.startsWith('--url='));
const srv = argUrl ? null : await server(ROOT);
const BASE = argUrl ? argUrl.slice(6) : srv.url;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'OK   ' : 'CHYBA'} ${name}${info !== undefined ? '  ' + JSON.stringify(info) : ''}`); if (!cond) fails++; };

const STRANKY = ['index.html', 'o-projekte.html', 'byty.html', 'financovanie.html', 'galeria.html', 'kontakt.html', 'ochrana-sukromia.html', 'cookies.html', ...['a1', 'b1', 'c1', 'd1', 'e2', 'f2', 'g2', 'h2', 'i3', 'j3', 'k3', 'l3'].map((b) => `byt/${b}.html`)];

async function stranka(opts, url) {
  const p = await browser.newPage(opts);
  const chyby = [];
  p.on('pageerror', (e) => chyby.push('js: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') chyby.push('konzola: ' + m.text().slice(0, 160)); });
  p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(BASE)) chyby.push(`${r.status()} ${r.url().slice(BASE.length)}`); });
  p.on('requestfailed', (r) => { if (r.url().startsWith(BASE)) chyby.push('zlyhalo ' + r.url().slice(BASE.length)); });
  await p.goto(BASE + url, { waitUntil: 'load' });
  return { p, chyby };
}

// prejde stránku po krokoch (lenivé obrázky sa načítajú), vráti sa hore a počká, kým sú všetky obrázky hotové
async function prejdi(p) {
  await p.evaluate(async () => {
    const krok = Math.max(400, innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += krok) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 60)); }
    scrollTo({ top: 0, behavior: 'instant' });
  });
  await p.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(200);
}

// 1. každá stránka: bez chýb, odkazy a obrázky existujú, prístupnosť základov
const videne = new Set();
for (const s of STRANKY) {
  const { p, chyby } = await stranka({ viewport: { width: 1440, height: 900 } }, s);
  await prejdi(p);
  const info = await p.evaluate(() => {
    const odkazy = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => !/^(https?:|mailto:|tel:|#)/.test(h));
    const obrazky = [...document.querySelectorAll('img')].filter((i) => i.getAttribute('src') || i.srcset).map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0, alt: i.hasAttribute('alt') }));
    return { h1: document.querySelectorAll('h1').length, title: document.title, lang: document.documentElement.lang, odkazy, obrazky: obrazky.filter((o) => !o.ok || !o.alt).length, nadpisySkok: (() => { const hs = [...document.querySelectorAll('h1,h2,h3')].map((h) => +h.tagName[1]); return hs.some((h, i) => i && h - hs[i - 1] > 1); })(), sample: document.querySelector('.sample, [class*="Sample"]') ? 1 : 0, lorem: /lorem ipsum|Sample Subtitle/i.test(document.body.innerText) };
  });
  // odkazy existujú na disku (lokálne) alebo odpovedajú (naživo)
  const base = path.dirname(s);
  const chybne = [];
  for (const h of new Set(info.odkazy)) {
    const cesta = path.normalize(path.join(base, h.split('?')[0].split('#')[0]));
    if (cesta === '.' || cesta === '') continue;
    if (!argUrl) { if (!fs.existsSync(path.join(ROOT, cesta))) chybne.push(h); }
    videne.add(cesta);
  }
  ok(`[${s}] bez chýb v konzole a sieti`, chyby.length === 0, chyby.slice(0, 4));
  ok(`[${s}] jeden h1, title, lang=sk, nadpisy bez skoku, bez šablónových textov`, info.h1 === 1 && info.title.length > 10 && info.lang === 'sk' && !info.nadpisySkok && !info.lorem, { h1: info.h1, skok: info.nadpisySkok, lorem: info.lorem });
  ok(`[${s}] obrázky načítané a s alt`, info.obrazky === 0, { chybne: info.obrazky });
  ok(`[${s}] odkazy vedú na existujúce súbory`, chybne.length === 0, chybne.slice(0, 5));
  await p.close();
}
ok('každá stránka je dosiahnuteľná odkazom', STRANKY.filter((s) => s !== 'index.html').every((s) => videne.has(s)), STRANKY.filter((s) => s !== 'index.html' && !videne.has(s)));

// 2. šírky: žiadne vodorovné pretekanie, lišta sa zmestí
for (const w of [320, 375, 390, 768, 1024, 1440]) {
  for (const s of ['index.html', 'byty.html', 'byt/a1.html', 'kontakt.html']) {
    const { p, chyby } = await stranka({ viewport: { width: w, height: 800 }, ...(w < 800 ? { isMobile: true, hasTouch: true } : {}) }, s);
    await p.waitForTimeout(400);
    for (let y = 0; y < 9000; y += 700) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(60); }
    const r = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth; const out = [];
      document.querySelectorAll('body *').forEach((el) => { const b = el.getBoundingClientRect(); if (b.width && (b.right > vw + 1 || b.left < -1) && getComputedStyle(el).position !== 'fixed' && !el.closest('.polica, [data-posuvne]')) out.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ':' + Math.round(b.left) + '..' + Math.round(b.right)); });
      const tl = document.querySelector('.menu-prepinac'); const tb = tl ? tl.getBoundingClientRect() : null;
      return { vw, sw: document.documentElement.scrollWidth, iw: innerWidth, out: [...new Set(out)].slice(0, 6), menu: tb ? { w: Math.round(tb.width), r: Math.round(tb.right), vis: getComputedStyle(tl).display !== 'none' } : null };
    });
    ok(`[${w} px ${s}] bez pretekania`, r.sw <= r.vw && r.iw === w && r.out.length === 0, { sw: r.sw, out: r.out });
    if (w < 900) ok(`[${w} px ${s}] tlačidlo menu 44 px na obrazovke`, r.menu && r.menu.vis && r.menu.w >= 44 && r.menu.r <= r.vw, r.menu);
    ok(`[${w} px ${s}] bez chýb`, chyby.length === 0, chyby.slice(0, 3));
    await p.close();
  }
}

// 3. výber bytu: panel, filter, klávesnica, dotyk, tabuľka
{
  const { p, chyby } = await stranka({ viewport: { width: 1440, height: 900 } }, 'byty.html');
  await p.waitForTimeout(400);
  const z0 = await p.evaluate(() => ({ on: document.querySelector('.fasada .byt.je-on')?.dataset.id, pressed: document.querySelector('.fasada .byt[data-id=A1]').getAttribute('aria-pressed'), panel: document.querySelector('.panel-byt').textContent, riadok: document.querySelector('.tabulka-bytov tr.je-on')?.dataset.id }));
  ok('výber: predvolene je zvolený A1 (fasáda, panel, tabuľka)', z0.on === 'A1' && z0.pressed === 'true' && /A1/.test(z0.panel) && z0.riadok === 'A1', z0);
  await p.click('.fasada .byt[data-id="E2"]'); await p.waitForTimeout(400);
  const e2 = await p.evaluate(() => ({ on: document.querySelector('.fasada .byt.je-on')?.dataset.id, panel: document.querySelector('.panel-vnutro').innerText.replace(/\s+/g, ' ').slice(0, 160), obr: (document.querySelector('.panel-plan img').currentSrc || '').split('/').pop(), live: document.querySelector('.panel-live').textContent, detail: document.querySelector('.panel-detail').getAttribute('href'), zaujem: document.querySelector('.panel-zaujem').getAttribute('href'), riadok: document.querySelector('.tabulka-bytov tr.je-on')?.dataset.id }));
  ok('výber: klik na E2 prepíše panel (cena, výrez pôdorysu, odkazy, stavový riadok, tabuľka)', e2.on === 'E2' && /Byt E2/.test(e2.panel) && /114/.test(e2.panel) && /byt-e2/.test(e2.obr) && /Byt E2/.test(e2.live) && /byt\/e2\.html$/.test(e2.detail) && /byt=E2$/.test(e2.zaujem) && e2.riadok === 'E2', e2);
  await p.click('.filter [data-filter="t3"]'); await p.waitForTimeout(500);
  const f = await p.evaluate(() => ({ off: document.querySelectorAll('.fasada .byt.je-off').length, riadky: document.querySelectorAll('.tabulka-bytov tr.je-off').length, pocet: document.querySelector('.filter-pocet').textContent, checked: document.querySelector('.filter [data-filter="t3"]').getAttribute('aria-checked'), on: document.querySelector('.fasada .byt.je-on')?.dataset.id, hash: location.hash, tab: [...document.querySelectorAll('.fasada .byt')].filter((b) => b.tabIndex === 0).length }));
  ok('výber: filter Trojizbové stlmí 6 bytov, prepíše počet, presunie výber na B1, zapíše #trojizbove', f.off === 6 && f.riadky === 6 && /6 bytov/.test(f.pocet) && f.checked === 'true' && f.on === 'B1' && f.hash === '#trojizbove' && f.tab === 6, f);
  await p.click('.filter [data-filter="vsetky"]'); await p.waitForTimeout(300);
  const f2 = await p.evaluate(() => ({ off: document.querySelectorAll('.je-off').length, pocet: document.querySelector('.filter-pocet').textContent }));
  ok('výber: filter Všetky vráti 12 bytov', f2.off === 0 && /12 bytov/.test(f2.pocet), f2);
  await p.focus('.fasada .byt[data-id="A1"]'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowUp');
  const k = await p.evaluate(() => document.activeElement.dataset.id);
  ok('výber: šípky na klávesnici idú A1 → B1 → F2', k === 'F2', { k });
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  const en = await p.evaluate(() => ({ on: document.querySelector('.fasada .byt.je-on')?.dataset.id, panel: document.querySelector('.panel-byt').textContent, url: location.pathname }));
  ok('výber: Enter zvolí F2 bez prechodu na inú stránku', en.on === 'F2' && /F2/.test(en.panel) && /byty\.html$/.test(en.url), en);
  await p.click('.panel-detail'); await p.waitForURL(/byt\/f2\.html/, { timeout: 5000 }).catch(() => {});
  ok('výber: Detail bytu F2 otvorí jeho stránku', /byt\/f2\.html/.test(p.url()), p.url());
  ok('výber: bez chýb', chyby.length === 0, chyby.slice(0, 3));
  await p.close();
  const { p: m, chyby: ch2 } = await stranka({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, 'byty.html');
  await m.locator('.fasada .byt[data-id="C1"]').scrollIntoViewIfNeeded(); await m.tap('.fasada .byt[data-id="C1"]'); await m.waitForTimeout(600);
  const t1 = await m.evaluate(() => ({ url: location.pathname, on: document.querySelector('.fasada .byt.je-on')?.dataset.id, panel: document.querySelector('.panel-byt').textContent, panelY: Math.round(document.querySelector('.panel').getBoundingClientRect().top) }));
  ok('výber na dotyku: ťuknutie zvolí C1, panel sa posunie do okna', /byty\.html$/.test(t1.url) && t1.on === 'C1' && /C1/.test(t1.panel) && t1.panelY >= 0 && t1.panelY < 400, t1);
  await m.tap('.panel-detail'); await m.waitForURL(/byt\/c1\.html/, { timeout: 5000 }).catch(() => {});
  ok('výber na dotyku: Detail bytu otvorí stránku C1', /byt\/c1\.html/.test(m.url()), m.url());
  ok('výber na dotyku: bez chýb', ch2.length === 0, ch2.slice(0, 3));
  await m.close();
}

// 4. prezeranie obrázkov, pôdorys, pásy miestností
{
  const { p, chyby } = await stranka({ viewport: { width: 1440, height: 900 } }, 'galeria.html');
  await p.click('.lupa >> nth=1'); await p.waitForTimeout(400);
  const o = await p.evaluate(() => { const d = document.querySelector('dialog.prezeranie'); const i = d.querySelector('img'); return { open: d.open, src: i.currentSrc.split('/').pop(), pocet: d.querySelector('.prezeranie-pocet').textContent, fokus: document.activeElement.className }; });
  ok('prezeranie: otvorí druhý obrázok, počítadlo 2 / 6, fokus na zatvoriť', o.open && o.src && /2 \/ 6/.test(o.pocet) && /zavriet/.test(o.fokus), o);
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
  const n = await p.evaluate(() => ({ pocet: document.querySelector('.prezeranie-pocet').textContent, src: document.querySelector('dialog.prezeranie img').currentSrc.split('/').pop() }));
  ok('prezeranie: šípka doprava ide na tretí', /3 \/ 6/.test(n.pocet) && /exterier-03/.test(n.src), n);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  const z = await p.evaluate(() => ({ open: document.querySelector('dialog.prezeranie').open, fokus: document.activeElement.className }));
  ok('prezeranie: Escape zavrie a vráti fokus na tlačidlo galérie', !z.open && /lupa/.test(z.fokus), z);
  ok('prezeranie: bez chýb', chyby.length === 0, chyby.slice(0, 3));
  await p.close();
  const { p: b, chyby: ch } = await stranka({ viewport: { width: 1440, height: 900 } }, 'byt/j3.html');
  await b.click('.lupa[data-galeria="podorys"]'); await b.waitForTimeout(400);
  const pd = await b.evaluate(() => { const d = document.querySelector('dialog.prezeranie'); return { open: d.open, src: d.querySelector('img').currentSrc.split('/').pop(), jeden: d.querySelector('.prezeranie-dal').hidden }; });
  ok('pôdorys J3: zväčšenie otvorí správny pôdorys bez šípok', pd.open && /podorys-j3/.test(pd.src) && pd.jeden, pd);
  await b.keyboard.press('Escape');
  const pasy = await b.evaluate(() => ({ n: document.querySelectorAll('.miestnosti-pasy li i').length, mini: document.querySelector('.fasada-mini .byt[aria-current]')?.dataset.id, akcie: !!document.querySelector('.byt-akcie a[href$="byt=J3"]') }));
  ok('byt J3: 9 pásov miestností, mini fasáda zvýrazní J3, výzva s bytom J3', pasy.n === 9 && pasy.mini === 'J3' && pasy.akcie, pasy);
  ok('byt J3: bez chýb', ch.length === 0, ch.slice(0, 3));
  await b.close();
}

// 5. formulár: predvyplnenie z adresy, overenie pod poľami, mailto
{
  const { p, chyby } = await stranka({ viewport: { width: 1440, height: 900 } }, 'kontakt.html?byt=H2');
  const pre = await p.evaluate(() => ({ byt: document.querySelector('[name=byt]').value, sprava: document.querySelector('[name=sprava]').value }));
  ok('formulár: ?byt=H2 predvyplní byt aj správu', pre.byt === 'H2' && /H2/.test(pre.sprava), pre);
  await p.fill('[name=sprava]', '');
  await p.click('#formular button[type=submit]'); await p.waitForTimeout(100);
  const ch = await p.evaluate(() => ({ chyba: document.querySelectorAll('.pole[data-chyba]').length, texty: [...document.querySelectorAll('.pole-chyba')].map((x) => x.textContent).filter(Boolean), pozn: document.querySelector('#formular-pozn').textContent, fokus: document.activeElement.name, aria: document.querySelector('[name=email]').getAttribute('aria-invalid') }));
  ok('formulár: prázdne meno, e-mail a správa sa označia s textom pod poľom, fokus na prvé', ch.chyba === 3 && ch.texty.length === 3 && /Doplňte/.test(ch.pozn) && ch.fokus === 'meno' && ch.aria === 'true', ch);
  await p.fill('[name=meno]', 'Test Testovič'); await p.fill('[name=email]', 'zle'); await p.fill('[name=sprava]', 'Dobrý deň'); await p.click('#formular button[type=submit]'); await p.waitForTimeout(100);
  const em = await p.evaluate(() => ({ n: document.querySelectorAll('.pole[data-chyba]').length, pole: document.querySelector('.pole[data-chyba] input')?.name, text: document.querySelector('.pole[data-chyba] .pole-chyba')?.textContent }));
  ok('formulár: neplatný e-mail sa označí s pokynom', em.n === 1 && em.pole === 'email' && /meno@domena/.test(em.text || ''), em);
  p.on('request', (r) => { if (r.url().startsWith('mailto:')) mailto = r.url(); });
  let mailto = '';
  await p.fill('[name=email]', 'test@example.sk'); await p.click('#formular button[type=submit]'); await p.waitForTimeout(400);
  const href = await p.evaluate(() => ({ pozn: document.querySelector('#formular-pozn').textContent, chyby: document.querySelectorAll('.pole[data-chyba]').length }));
  ok('formulár: po vyplnení pripraví e-mail bez chýb', /Otvárame/.test(href.pozn) && href.chyby === 0, href);
  ok('formulár: bez chýb', chyby.filter((c) => !/mailto/.test(c)).length === 0, chyby.slice(0, 3));
  await p.close();
}

// 6. cesta na Financovaní: čiara sa odvinie so skrolom, krokomer, bez JS a s obmedzeným pohybom je všetko viditeľné
{
  const { p, chyby } = await stranka({ viewport: { width: 1440, height: 900 } }, 'financovanie.html');
  await p.waitForTimeout(300);
  const c0 = await p.evaluate(() => ({ p: getComputedStyle(document.querySelector('.cesta-ciara i')).getPropertyValue('--p').trim(), on: document.querySelectorAll('.krok.je-on').length }));
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(500);
  const c1 = await p.evaluate(() => ({ p: getComputedStyle(document.querySelector('.cesta-ciara i')).getPropertyValue('--p').trim(), on: document.querySelectorAll('.krok.je-on').length, krokomer: document.querySelector('.krokomer-cislo').textContent, akt: document.querySelector('.krok.je-aktualny')?.dataset.krok }));
  ok('cesta: hore je čiara krátka, dole celá, 4 uzly zapnuté, krokomer 4', +c0.p < 0.9 && +c1.p >= 0.99 && c1.on === 4 && c1.krokomer === '4' && c1.akt === '4', { c0, c1 });
  ok('cesta: bez chýb', chyby.length === 0, chyby.slice(0, 3));
  await p.close();
  const n = await browser.newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  await n.goto(BASE + 'index.html'); await n.waitForTimeout(300);
  const r = await n.evaluate(() => ({ h1: getComputedStyle(document.querySelector('.titul h1 .riadok > span')).opacity, id: getComputedStyle(document.querySelector('.fasada .byt-id')).opacity, ciara: getComputedStyle(document.querySelector('.podlazie::after') || document.querySelector('.podlazie'), '::after').transform, menu: getComputedStyle(document.querySelector('.menu')).visibility, panel: document.querySelector('.panel-byt').textContent, kota: getComputedStyle(document.querySelector('.kota-znacka')).opacity }));
  ok('bez JS: nadpis, fasáda, kóta aj menu sú viditeľné, panel ukazuje A1', +r.h1 === 1 && +r.id === 1 && r.ciara === 'none' && r.menu === 'visible' && /A1/.test(r.panel) && +r.kota === 1, r);
  await n.close();
  const q = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await q.goto(BASE + 'index.html'); await q.waitForTimeout(300);
  const r2 = await q.evaluate(() => ({ id: [...document.querySelectorAll('.fasada .byt-id')].every((e) => getComputedStyle(e).opacity === '1'), h1: getComputedStyle(document.querySelector('.titul h1 .riadok > span')).opacity, peciatka: getComputedStyle(document.querySelector('.peciatka')).opacity }));
  ok('obmedzený pohyb: všetko viditeľné hneď', r2.id && +r2.h1 === 1 && +r2.peciatka === 1, r2);
  await q.close();
}

// 7. úvodná sekvencia dobehne a klávesnica: Tab prejde lištou s viditeľným fokusom
{
  const { p } = await stranka({ viewport: { width: 1440, height: 900 } }, 'index.html');
  await p.waitForTimeout(1600);
  const u = await p.evaluate(() => ({ podtitul: getComputedStyle(document.querySelector('.titul-podtitul')).opacity, peciatka: getComputedStyle(document.querySelector('.peciatka')).opacity, kota: getComputedStyle(document.querySelectorAll('.kota-titul .kota-znacka')[4]).opacity, foto: getComputedStyle(document.querySelector('.titul-foto img')).transform }));
  ok('úvod: po 1,6 s je podtitul, kóta aj pečiatka viditeľná a fotka usadená', +u.podtitul === 1 && +u.peciatka === 1 && +u.kota === 1 && (u.foto === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(u.foto)), u);
  const z = [];
  for (let i = 0; i < 9; i++) { await p.keyboard.press('Tab'); z.push(await p.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return (a.textContent.trim().slice(0, 18) || a.className) + (cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' ? '' : ' (bez fokusu)'); })); }
  ok('klávesnica: poradie Tab a viditeľný fokus', z.every((t) => !/bez fokusu/.test(t)) && /Preskočiť/.test(z[0]) && /Visionary/.test(z[1]) && /Úvod/.test(z[2]), z);
  await p.close();
}

await browser.close();
if (srv) srv.s.close();
console.log(fails ? `\n${fails} kontrol zlyhalo` : '\nVšetky kontroly prešli');
process.exit(fails ? 1 : 0);
