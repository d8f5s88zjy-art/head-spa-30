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

// 1. každá stránka: bez chýb, odkazy a obrázky existujú, prístupnosť základov
const videne = new Set();
for (const s of STRANKY) {
  const { p, chyby } = await stranka({ viewport: { width: 1440, height: 900 } }, s);
  await p.waitForTimeout(500);
  const info = await p.evaluate(() => {
    const odkazy = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => !/^(https?:|mailto:|tel:|#)/.test(h));
    const obrazky = [...document.querySelectorAll('img')].map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0, alt: i.hasAttribute('alt') }));
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

// 3. výber bytu: filter, panel, klávesnica, dotyk
{
  const { p, chyby } = await stranka({ viewport: { width: 1440, height: 900 } }, 'byty.html');
  await p.hover('.bunka[data-id="E2"]'); await p.waitForTimeout(200);
  const panel = await p.evaluate(() => ({ hidden: document.querySelector('.vyber-detail-obsah').hidden, text: document.querySelector('.vyber-detail-obsah').innerText.replace(/\s+/g, ' ').slice(0, 120), vybrana: document.querySelector('.bunka.je-vybrana')?.dataset.id }));
  ok('výber: ukázanie myšou naplní panel bytom E2', !panel.hidden && /Byt E2/.test(panel.text) && /114/.test(panel.text) && panel.vybrana === 'E2', panel);
  await p.click('.filter[data-filter="t3"]'); await p.waitForTimeout(200);
  const f = await p.evaluate(() => ({ mimo: document.querySelectorAll('.bunka.je-mimo').length, karty: [...document.querySelectorAll('.byt-karta')].filter((k) => !k.hidden).length, pocet: document.querySelector('.vyber-pocet')?.textContent, pressed: document.querySelector('.filter[data-filter="t3"]').getAttribute('aria-pressed') }));
  ok('výber: filter Trojizbové nechá 6 bytov', f.mimo === 6 && f.karty === 6 && /6/.test(f.pocet || '') && f.pressed === 'true', f);
  await p.click('.filter[data-filter="p1"]'); await p.waitForTimeout(100);
  const f2 = await p.evaluate(() => ({ mimo: document.querySelectorAll('.bunka.je-mimo').length, akt: document.querySelector('.podlazie.je-aktivne')?.dataset.podlazie }));
  ok('výber: filter 1. podlažie nechá 4 byty a zvýrazní podlažie', f2.mimo === 8 && f2.akt === '1', f2);
  await p.click('.filter[data-filter="vsetky"]');
  await p.focus('.bunka[data-id="A1"]'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowUp');
  const k = await p.evaluate(() => document.activeElement.dataset.id);
  ok('výber: šípky na klávesnici idú A1 → B1 → F2', k === 'F2', { k });
  await p.keyboard.press('Enter'); await p.waitForURL(/byt\/f2\.html/, { timeout: 5000 }).catch(() => {});
  ok('výber: Enter otvorí detail bytu F2', /byt\/f2\.html/.test(p.url()), p.url());
  ok('výber: bez chýb', chyby.length === 0, chyby.slice(0, 3));
  await p.close();
  const { p: m, chyby: ch2 } = await stranka({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, 'byty.html');
  await m.locator('.bunka[data-id="C1"]').scrollIntoViewIfNeeded(); await m.tap('.bunka[data-id="C1"]'); await m.waitForTimeout(300);
  const t1 = await m.evaluate(() => ({ url: location.pathname, hidden: document.querySelector('.vyber-detail-obsah').hidden, text: document.querySelector('.vyber-detail-obsah').innerText.slice(0, 40) }));
  ok('výber na dotyku: prvé ťuknutie ukáže údaje bez prechodu', /byty\.html$/.test(t1.url) && !t1.hidden && /C1/.test(t1.text), t1);
  await m.tap('.bunka[data-id="C1"]'); await m.waitForURL(/byt\/c1\.html/, { timeout: 5000 }).catch(() => {});
  ok('výber na dotyku: druhé ťuknutie otvorí detail', /byt\/c1\.html/.test(m.url()), m.url());
  ok('výber na dotyku: bez chýb', ch2.length === 0, ch2.slice(0, 3));
  await m.close();
}

// 4. prezeranie obrázkov a pôdorys
{
  const { p, chyby } = await stranka({ viewport: { width: 1440, height: 900 } }, 'galeria.html');
  await p.click('.galeria-polozka >> nth=1'); await p.waitForTimeout(400);
  const o = await p.evaluate(() => { const d = document.querySelector('dialog.prezeranie'); const i = d.querySelector('img'); return { open: d.open, src: i.currentSrc.split('/').pop(), pocet: d.querySelector('.prezeranie-pocet').textContent, fokus: document.activeElement.className }; });
  ok('prezeranie: otvorí druhý obrázok, počítadlo, fokus na zatvoriť', o.open && o.src && /2 \//.test(o.pocet) && /zavriet/.test(o.fokus), o);
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100);
  const n = await p.evaluate(() => document.querySelector('.prezeranie-pocet').textContent);
  ok('prezeranie: šípka doprava ide na tretí', /3 \//.test(n), n);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  const z = await p.evaluate(() => ({ open: document.querySelector('dialog.prezeranie').open, fokus: document.activeElement.className }));
  ok('prezeranie: Escape zavrie a vráti fokus na tlačidlo galérie', !z.open && /galeria-polozka/.test(z.fokus), z);
  ok('prezeranie: bez chýb', chyby.length === 0, chyby.slice(0, 3));
  await p.close();
  const { p: b, chyby: ch } = await stranka({ viewport: { width: 1440, height: 900 } }, 'byt/j3.html');
  await b.click('.podorys-zvacsit'); await b.waitForTimeout(400);
  const pd = await b.evaluate(() => { const d = document.querySelector('dialog.prezeranie'); return { open: d.open, src: d.querySelector('img').currentSrc.split('/').pop(), jeden: d.querySelector('.prezeranie-dal').hidden }; });
  ok('pôdorys J3: zväčšenie otvorí správny pôdorys bez šípok', pd.open && /podorys-j3/.test(pd.src) && pd.jeden, pd);
  const pasy = await b.evaluate(() => [...document.querySelectorAll('.miestnosti-pasy li i')].length);
  ok('byt J3: 9 pásov miestností', pasy === 9, pasy);
  ok('byt J3: bez chýb', ch.length === 0, ch.slice(0, 3));
  await b.close();
}

// 5. formulár: predvyplnenie z adresy, overenie, mailto
{
  const { p, chyby } = await stranka({ viewport: { width: 1440, height: 900 } }, 'kontakt.html?byt=H2');
  const pre = await p.evaluate(() => ({ byt: document.querySelector('[name=byt]').value, sprava: document.querySelector('[name=sprava]').value }));
  ok('formulár: ?byt=H2 predvyplní byt aj správu', pre.byt === 'H2' && /H2/.test(pre.sprava), pre);
  await p.click('#formular button[type=submit]'); await p.waitForTimeout(100);
  const ch = await p.evaluate(() => ({ chyba: document.querySelectorAll('.pole[data-chyba]').length, pozn: document.querySelector('#formular-pozn').textContent, fokus: document.activeElement.name }));
  ok('formulár: prázdne meno a e-mail sa označia, fokus na prvé', ch.chyba >= 2 && /Vyplňte/.test(ch.pozn) && ch.fokus === 'meno', ch);
  await p.fill('[name=meno]', 'Test Testovič'); await p.fill('[name=email]', 'zle'); await p.click('#formular button[type=submit]'); await p.waitForTimeout(100);
  const em = await p.evaluate(() => document.querySelector('.pole[data-chyba] input')?.name);
  ok('formulár: neplatný e-mail sa označí', em === 'email', em);
  let mailto = '';
  await p.route('**/*', (r) => r.continue());
  p.on('request', (r) => { if (r.url().startsWith('mailto:')) mailto = r.url(); });
  await p.fill('[name=email]', 'test@example.sk'); await p.click('#formular button[type=submit]'); await p.waitForTimeout(400);
  const href = await p.evaluate(() => document.querySelector('#formular-pozn').textContent);
  ok('formulár: po vyplnení pripraví e-mail', /Otvárame/.test(href), href);
  ok('formulár: bez chýb', chyby.filter((c) => !/mailto/.test(c)).length === 0, chyby.slice(0, 3));
  await p.close();
}

// 6. bez JavaScriptu a s obmedzeným pohybom: obsah je viditeľný
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  await p.goto(BASE + 'index.html'); await p.waitForTimeout(300);
  const r = await p.evaluate(() => ({ h1: getComputedStyle(document.querySelector('.uvod-nadpis .riadok > span')).opacity, odhal: getComputedStyle(document.querySelector('[data-odhal]')).opacity, bunka: getComputedStyle(document.querySelector('.bunka')).opacity }));
  ok('bez JS: nadpis, odhaľované prvky aj byty sú viditeľné', +r.h1 === 1 && +r.odhal === 1 && +r.bunka === 1, r);
  await p.close();
  const q = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await q.goto(BASE + 'index.html'); await q.waitForTimeout(300);
  const r2 = await q.evaluate(() => ({ odhal: [...document.querySelectorAll('[data-odhal]')].every((e) => getComputedStyle(e).opacity === '1'), h1: getComputedStyle(document.querySelector('.uvod-nadpis .riadok > span')).opacity }));
  ok('obmedzený pohyb: všetko viditeľné hneď', r2.odhal && +r2.h1 === 1, r2);
  await q.close();
}

// 7. klávesnica: Tab prejde lištou a prvým tlačidlom úvodu s viditeľným fokusom
{
  const { p } = await stranka({ viewport: { width: 1440, height: 900 } }, 'index.html');
  const z = [];
  for (let i = 0; i < 9; i++) { await p.keyboard.press('Tab'); z.push(await p.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return (a.textContent.trim().slice(0, 18) || a.className) + (cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' ? '' : ' (bez fokusu)'); })); }
  ok('klávesnica: poradie Tab a viditeľný fokus', z.every((t) => !/bez fokusu/.test(t)) && /Preskočiť/.test(z[0]), z);
  await p.close();
}

await browser.close();
if (srv) srv.s.close();
console.log(fails ? `\n${fails} kontrol zlyhalo` : '\nVšetky kontroly prešli');
process.exit(fails ? 1 : 0);
