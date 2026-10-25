// skeptik 2 – panel v prehliadači: telefón (dotyk) a počítač s filmom (koliesko, klávesy), triedy N1 a V1 v paneli,
// výrez cenníka, voľby, XSS, sieť, úložisko, Esc a fokus.  node prehliadac-s2.mjs <url> <priečinok>
import { createRequire } from 'node:module'; import { writeFileSync } from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
const [url, dir] = process.argv.slice(2); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const V = { url, cas: new Date().toISOString() };
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const init = () => { window.__st = 0; window.__cls = 0; window.__clsPo = 0; window.__tap = 0;
  const o = Storage.prototype.setItem; Storage.prototype.setItem = function (...a) { window.__st++; return o.apply(this, a); };
  const d = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie'); window.__ck = 0;
  Object.defineProperty(document, 'cookie', { get() { return d.get.call(this); }, set(v) { window.__ck++; d.set.call(this, v); } });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { if (window.__tap) window.__clsPo += e.value; else window.__cls += e.value; } }).observe({ type: 'layout-shift', buffered: true }); };
const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
async function sada(p, tag) {
  const st = () => p.evaluate(() => ({ sy: Math.round(scrollY), c: document.documentElement.className.replace(/\s+/g, ' ').slice(0, 80), open: !!document.querySelector('#rc-panel[open]'), bodyOv: document.body.style.overflow }));
  const posledna = () => p.evaluate(() => { const li = [...document.querySelectorAll('.rc-log > li.rc-a')].pop(); const cen = li?.querySelector('.rc-cen');
    return { text: li?.innerText.replace(/\s+/g, ' ').slice(0, 170), cennik: cen && [...cen.querySelectorAll('p:not(.rc-sk)')].map((r) => (r.classList.contains('rc-hl') ? '▶ ' : '  ') + r.innerText.replace(/\s+/g, ' ')),
      volby: [...li.querySelectorAll('.rc-akcie button, .rc-akcie a')].map((x) => { const r = x.getBoundingClientRect(); return `${x.textContent} [${Math.round(r.width)}×${Math.round(r.height)}]`; }) }; });
  const spytaj = async (q) => { await p.fill('#rc-q', q); await p.press('#rc-q', 'Enter'); await sleep(300); return [q, await posledna()]; };
  const o = { odpovede: [] };
  for (const q of ['Koľko stojí strih, vlasy mám dlhé 7 cm?', 'Koľko stojí oholenie hlavy pre ňu?', 'Koľko stojí strih a melír?', 'Kde máte barbershop?', 'Koľko stojí úprava brady?', '<img src=x onerror=alert(1)>'])
    o.odpovede.push(await spytaj(q));
  o.imgVPaneli = await p.evaluate(() => document.querySelectorAll('#rc-panel img').length);
  o.poOtazkach = await st();
  return o;
}
try {
  // ---------- TELEFÓN ----------
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
    const p = await ctx.newPage(); const req = []; let faza = 'pred'; const chyby = [];
    p.on('request', (r) => req.push([faza, r.url()])); p.on('pageerror', (e) => chyby.push(String(e)));
    p.on('console', (m) => m.type() === 'error' && chyby.push('console ' + m.text())); p.on('dialog', (d) => { chyby.push('dialog ' + d.message()); d.dismiss(); });
    await p.addInitScript(init);
    const t0 = Date.now(); await p.goto(url, { waitUntil: 'load' }); const tl = Date.now();
    await p.locator('.recepcia-btn').waitFor({ state: 'visible', timeout: 20000 }); const T = { tlacidloPoLoadMs: Date.now() - tl };
    await sleep(1500);
    T.btn = await p.evaluate(() => { const e = document.querySelector('.recepcia-btn'), r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, z: getComputedStyle(e).zIndex, aria: e.getAttribute('aria-label') }; });
    T.clsPredTuknutim = await p.evaluate(() => +window.__cls.toFixed(4));
    await p.evaluate(() => window.scrollTo(0, 4000)); await sleep(700);
    const st = () => p.evaluate(() => ({ sy: Math.round(scrollY), open: !!document.querySelector('#rc-panel[open]'), bodyOv: document.body.style.overflow, sw: document.documentElement.scrollWidth }));
    T.predOtvorenim = await st(); faza = 'po';
    await p.evaluate(() => { window.__tap = 1; });
    await p.locator('.recepcia-btn').tap(); await p.locator('#rc-panel[open]').waitFor({ timeout: 8000 }); await sleep(600);
    T.poOtvoreni = { ...(await st()), fokus: await p.evaluate(() => document.activeElement?.className + ' ' + document.activeElement?.textContent.slice(0, 20)), chipsScroll: await p.evaluate(() => document.querySelector('.rc-chips').scrollLeft), panel: await p.evaluate(() => { const d = document.querySelector('#rc-panel'); const r = d.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, lang: d.lang, noI18n: d.hasAttribute('data-no-i18n') }; }) };
    T.panelOdpovede = await sada(p, 'telefon');
    await p.screenshot({ path: `${dir}/s2-telefon-panel.png` });
    // dotykové ťahy cez CDP: na logu oboma smermi a cez pozadie
    const cdp = await ctx.newCDPSession(p);
    const drag = async (x0, y0, x1, y1) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] }); for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / 12, y: y0 + (y1 - y0) * i / 12 }] }); await sleep(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(500); };
    const L = await p.evaluate(() => { const r = document.querySelector('.rc-log').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, top: r.top }; });
    T.tahy = [];
    for (const [n, a] of [['log nahor', [L.x, L.y + 120, L.x, L.y - 200]], ['log nadol', [L.x, L.y - 120, L.x, L.y + 300]], ['log nadol 2', [L.x, L.y - 120, L.x, L.y + 300]], ['pozadie', [200, Math.max(30, L.top - 60), 200, Math.max(30, L.top - 60) + 250]]]) { await drag(...a); T.tahy.push([n, (await st()).sy]); }
    // voľby: posun radu prstom, zavrieť krížikom, otvoriť znova
    const cb = await p.evaluate(() => { const r = document.querySelector('.rc-chips').getBoundingClientRect(); return { x: r.x, y: r.y + r.height / 2, w: r.width }; });
    await drag(cb.x + cb.w - 20, cb.y, cb.x + 20, cb.y); T.chipsPoTahu = await p.evaluate(() => document.querySelector('.rc-chips').scrollLeft);
    await p.locator('.rc-x').tap(); await sleep(400); T.poZavreti = await st();
    await p.locator('.recepcia-btn').tap(); await p.locator('#rc-panel[open]').waitFor({ timeout: 5000 }); await sleep(500);
    T.znovaOtvorene = { chipsScroll: await p.evaluate(() => document.querySelector('.rc-chips').scrollLeft), fokusX: await p.evaluate(() => Math.round(document.activeElement.getBoundingClientRect().x)), logPoloziek: await p.evaluate(() => document.querySelectorAll('.rc-log > li').length) };
    await p.keyboard.press('Escape'); await sleep(400);
    T.poEsc = { ...(await st()), fokus: await p.evaluate(() => document.activeElement.className), expanded: await p.evaluate(() => document.querySelector('.recepcia-btn').getAttribute('aria-expanded')), clsPoTuknuti: await p.evaluate(() => +window.__clsPo.toFixed(4)), st: await p.evaluate(() => window.__st), ck: await p.evaluate(() => window.__ck) };
    T.chyby = chyby;
    T.recepciaPredTuknutim = req.filter((r) => r[0] === 'pred' && /recepcia/.test(r[1])).map((r) => r[1]);
    T.ziadostiPoTuknuti = [...new Set(req.filter((r) => r[0] === 'po').map((r) => r[1].replace(url, '/')))];
    T.cudzie = [...new Set(req.map((r) => r[1]).filter((u) => !u.startsWith(url) && !u.startsWith('data:') && !u.startsWith('blob:')))];
    V.telefon = T; await ctx.close(); }
  // ---------- POČÍTAČ S FILMOM ----------
  { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sk-SK', colorScheme: 'dark' });
    const p = await ctx.newPage(); const chyby = []; p.on('pageerror', (e) => chyby.push(String(e))); p.on('console', (m) => m.type() === 'error' && chyby.push('console ' + m.text()));
    await p.addInitScript(init);
    await p.goto(url + '?film=on', { waitUntil: 'load' });
    await p.locator('.recepcia-btn').waitFor({ state: 'visible', timeout: 20000 });
    const cls = () => p.evaluate(() => ({ c: document.documentElement.className.replace(/\s+/g, ' ').slice(0, 90), sy: Math.round(scrollY), open: !!document.querySelector('#rc-panel[open]') }));
    for (let i = 0; i < 24; i++) { const c = await cls(); if (!/\bpro\b/.test(c.c)) break; await sleep(500); }
    await sleep(1200);
    await p.evaluate(() => window.scrollTo(0, 2500)); await sleep(1500);
    const D = { pred: await cls(), btn: await p.evaluate(() => { const r = document.querySelector('.recepcia-btn').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, odPravej: innerWidth - r.right, odSpodu: innerHeight - r.bottom }; }), clsPredTuknutim: await p.evaluate(() => +window.__cls.toFixed(4)) };
    await p.evaluate(() => { window.__tap = 1; });
    await p.click('.recepcia-btn'); await p.locator('#rc-panel[open]').waitFor({ timeout: 8000 }); await sleep(600);
    D.poOtvoreni = await cls();
    D.panelOdpovede = await sada(p, 'pocitac');
    await p.screenshot({ path: `${dir}/s2-pocitac-panel.png` });
    const L = await p.evaluate(() => { const r = document.querySelector('.rc-log').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    D.vstupy = [];
    await p.mouse.move(L.x, L.y); await p.mouse.wheel(0, 800); await sleep(1200); D.vstupy.push(['koliesko nadol nad logom', await cls()]);
    await p.mouse.wheel(0, -2500); await sleep(1200); D.vstupy.push(['koliesko nahor nad logom', await cls()]);
    await p.mouse.move(300, 400); await p.mouse.wheel(0, 800); await sleep(1200); D.vstupy.push(['koliesko nadol nad pozadím', await cls()]);
    await p.mouse.wheel(0, -800); await sleep(1200); D.vstupy.push(['koliesko nahor nad pozadím', await cls()]);
    await p.click('.rc-log li.rc-a', { position: { x: 20, y: 8 } });
    for (const k of ['ArrowDown', 'PageDown', 'ArrowUp', 'End', 'Home', 'Space']) { await p.keyboard.press(k); await sleep(700); D.vstupy.push([`kláves ${k}`, await cls()]); }
    await p.keyboard.press('Escape'); await sleep(500);
    D.poEsc = { ...(await cls()), fokus: await p.evaluate(() => document.activeElement.className), clsPoTuknuti: await p.evaluate(() => +window.__clsPo.toFixed(4)) };
    D.chyby = chyby; V.pocitac = D; await ctx.close(); }
} finally { await b.close(); }
writeFileSync(`${dir}/prehliadac-s2.json`, JSON.stringify(V, null, 1)); console.log(JSON.stringify(V, null, 1));
