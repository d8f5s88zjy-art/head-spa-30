// Oprava 5 – overenie panela recepcie v prehliadači: S7, S3, S2, V1, D1, D2, D8, P2, P3, P4, CLS.
//   node panel-o5.mjs <url> <priečinok na snímky>
// Jeden prehliadač (Chromium z /opt/pw-browsers, voľby swiftshader ako PRESETS[0] v source/shot.mjs), po sebe zavrie.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const V = { url, cas: new Date().toISOString() };
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const stav = (p) => p.evaluate(() => ({ sy: Math.round(scrollY), cls: document.documentElement.className, ov: document.body.style.overflow, sg: document.documentElement.style.scrollbarGutter, cw: document.documentElement.clientWidth, iw: innerWidth, open: !!document.querySelector('#rc-panel[open]') }));
const posledna = (p) => p.evaluate(() => {
  const li = [...document.querySelectorAll('.rc-log > li.rc-a')].pop();
  const cen = li && li.querySelector('.rc-cen');
  return li && { text: li.innerText.replace(/\s+/g, ' ').slice(0, 220), cennik: cen && { nadpis: cen.querySelector('.rc-sk').textContent, riadky: [...cen.querySelectorAll('p:not(.rc-sk)')].map((r) => (r.classList.contains('rc-hl') ? '▶ ' : '  ') + r.innerText.replace(/\s+/g, ' ')), current: cen.querySelectorAll('[aria-current="true"]').length }, volby: [...li.querySelectorAll('.rc-akcie button')].map((x) => x.textContent), odkazy: [...li.querySelectorAll('.rc-akcie a')].map((x) => x.textContent) };
});
async function spytaj(p, q) { await p.fill('#rc-q', q); await p.press('#rc-q', 'Enter'); await sleep(250); return posledna(p); }

async function telefon() {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'sk-SK', colorScheme: 'dark' });
  const p = await ctx.newPage(), T = { chyby: [] };
  p.on('pageerror', (e) => T.chyby.push(String(e)));
  await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
  await p.goto(url, { waitUntil: 'load' });
  await p.locator('.recepcia-btn').waitFor({ state: 'visible', timeout: 15000 });
  await sleep(600);
  T.clsPredTuknutim = await p.evaluate(() => +window.__cls.toFixed(4));
  T.tlacidlo = await p.evaluate(() => { const e = document.querySelector('.recepcia-btn'), r = e.getBoundingClientRect(); return { x: r.x, y: Math.round(r.y), w: r.width, h: r.height, z: getComputedStyle(e).zIndex, anim: getComputedStyle(e).animationName }; });
  await p.evaluate(() => scrollTo(0, 5304)); await sleep(800);
  const s0 = await stav(p);
  await p.tap('.recepcia-btn'); await p.locator('#rc-panel[open]').waitFor({ timeout: 8000 }); await sleep(500);
  T.S7_otvorenie = { pred: s0, po: await stav(p) };
  // S7: dotykový ťah nadol cez log (log je na začiatku) a cez pozadie nad panelom
  const cdp = await ctx.newCDPSession(p);
  const tah = async (x, y0, y1) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] }); for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + ((y1 - y0) * i) / 8 }] }); await sleep(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(600); };
  const L = await p.evaluate(() => { const r = document.querySelector('.rc-log').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + 10 }; });
  await tah(L.x, L.y, L.y + 300); T.S7_tahLog = await stav(p);
  await tah(195, 120, 520); T.S7_tahPozadie = await stav(p);
  await p.screenshot({ path: `${out}/o5-telefon-panel.png` });
  // P3: cena vo výreze cenníka
  T.cenaStrih = await spytaj(p, 'Koľko stojí strih?');
  await p.screenshot({ path: `${out}/o5-telefon-vyrez.png` });
  T.cenaObocie = await spytaj(p, 'Koľko stojí úprava obočia?');
  // P2: Myslíš toto?
  T.strihMelir = await spytaj(p, 'Koľko stojí strih a melír?');
  await p.screenshot({ path: `${out}/o5-telefon-myslis.png` });
  await p.locator('.rc-log > li.rc-a').last().locator('.rc-akcie button').first().tap(); await sleep(300);
  T.poTuknutiNaVolbu = await posledna(p);
  // P4: trvanie
  T.trvanieBrada = await spytaj(p, 'Ako dlho trvá úprava brady?');
  T.trvanieRezervacia = await spytaj(p, 'Ako dlho trvá rezervácia?');
  T.trvanieStrihBrady = await spytaj(p, 'Koľko minút trvá strih brady?');
  await p.screenshot({ path: `${out}/o5-telefon-trvanie.png` });
  T.prilplatok = await spytaj(p, 'Je príplatok za sobotu?');
  // V1: rad volieb – posun na koniec, zavrieť, znova otvoriť
  await p.evaluate(() => { const c = document.querySelector('.rc-chips'); c.scrollLeft = c.scrollWidth; });
  T.V1_predZatvorenim = await p.evaluate(() => document.querySelector('.rc-chips').scrollLeft);
  await p.keyboard.press('Escape'); await sleep(500);
  T.S7_poZatvoreni = await stav(p);
  await p.tap('.recepcia-btn'); await p.locator('#rc-panel[open]').waitFor({ timeout: 5000 }); await sleep(500);
  T.V1_poOtvoreni = await p.evaluate(() => { const c = document.querySelector('.rc-chips'), a = document.activeElement, r = a.getBoundingClientRect(), cr = c.getBoundingClientRect(); return { scrollLeft: c.scrollLeft, fokus: a.textContent, fokusX: Math.round(r.x), radX: Math.round(cr.x), odsadenie: Math.round(r.x - cr.x), viditelny: r.x >= 0 && r.right <= innerWidth }; });
  await p.keyboard.press('Escape'); await sleep(300);
  await ctx.close();
  return T;
}

async function pocitac(q, film) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sk-SK', colorScheme: 'dark' });
  const p = await ctx.newPage(), D = { chyby: [] };
  p.on('pageerror', (e) => D.chyby.push(String(e)));
  await p.goto(url + q, { waitUntil: 'load' });
  await p.locator('.recepcia-btn').waitFor({ state: 'visible', timeout: 15000 });
  await sleep(400);
  const meraj = () => p.evaluate(() => { const e = document.querySelector('.recepcia-btn'), r = e.getBoundingClientRect(), bar = document.querySelector('.film-bars i:last-child'); const t = document.elementFromPoint(r.x + r.width / 2, r.bottom - 6); const br = bar && bar.getBoundingClientRect(); return { cls: document.documentElement.className, btn: { x: r.x, y: Math.round(r.y), w: r.width, right: r.right, z: getComputedStyle(e).zIndex, anim: getComputedStyle(e).animationName }, pas: br && { y: Math.round(br.y), h: Math.round(br.height), z: getComputedStyle(bar.parentNode).zIndex }, dolnyOkrajTlacidla: t === e || e.contains(t) ? 'tlačidlo' : String(t && (t.className || t.nodeName)) }; });
  D.priObjaveni = await meraj();
  await p.screenshot({ path: `${out}/o5-pocitac${film ? '-film' : ''}-tlacidlo.png`, clip: { x: 1200, y: 700, width: 240, height: 200 } });
  if (!film) {
    await p.evaluate(() => scrollTo(0, 6466)); await sleep(800);
    const s0 = await stav(p), logo = await p.evaluate(() => Math.round(document.querySelector('.site-header a, header a').getBoundingClientRect().x));
    await p.click('.recepcia-btn'); await p.locator('#rc-panel[open]').waitFor({ timeout: 8000 }); await sleep(500);
    D.S7_otvorenie = { pred: s0, po: await stav(p), logoPred: logo, logoPo: await p.evaluate(() => Math.round(document.querySelector('.site-header a, header a').getBoundingClientRect().x)) };
    await sleep(1200); // nábeh panela (240 ms) na vyťaženom stroji dobieha neskôr
    D.D2 = await p.evaluate(() => { const a = document.querySelector('#rc-panel').getBoundingClientRect(), t = document.querySelector('.recepcia-btn').getBoundingClientRect(); return { panelRight: a.right, tlacidloRight: t.right, panelBottom: a.bottom, tlacidloTop: t.top }; });
    await p.mouse.move(200, 300); await p.mouse.wheel(0, 500); await sleep(900); D.S7_kolieskoPozadie = await stav(p);
    const L = await p.evaluate(() => { const r = document.querySelector('.rc-log').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await p.mouse.move(L.x, L.y); await p.mouse.wheel(0, 500); await sleep(900); D.S7_kolieskoLog = await stav(p);
    D.cenaHlava = await spytaj(p, 'Koľko stojí oholenie hlavy?');
    D.cenaUltra = await spytaj(p, 'Čo je Ultra inclusive?');
    await p.screenshot({ path: `${out}/o5-pocitac-panel.png` });
    await p.keyboard.press('Escape'); await sleep(400);
    D.S7_poZatvoreni = await stav(p);
  } else {
    // S3 počas úvodu ako film, S2: klávesy a koliesko pri otvorenom paneli na vrchu stránky
    await p.click('.recepcia-btn'); await p.locator('#rc-panel[open]').waitFor({ timeout: 8000 }); await sleep(400);
    for (let i = 0; i < 24; i++) { const c = await stav(p); if (!/\bpro\b/.test(c.cls)) break; await sleep(500); }
    await p.keyboard.press('Escape'); await sleep(300);
    await p.evaluate(() => scrollTo(0, 0)); await sleep(2500);
    D.vnutriNaVrchu = await stav(p);
    await p.click('.recepcia-btn'); await p.locator('#rc-panel[open]').waitFor({ timeout: 5000 }); await sleep(400);
    await p.click('#rc-panel .rc-a'); // fokus na dialóg (klik do textu bubliny)
    await p.keyboard.press('ArrowUp'); await sleep(1200); D.S2_sipkaHore = await stav(p);
    const L = await p.evaluate(() => { const r = document.querySelector('.rc-log').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await p.mouse.move(L.x, L.y); await p.mouse.wheel(0, -400); await sleep(1500); D.S2_kolieskoNahor = await stav(p);
    await p.mouse.move(300, 300); await p.mouse.wheel(0, -400); await sleep(1500); D.S2_kolieskoPozadie = await stav(p);
    await p.keyboard.press('Escape'); await sleep(400);
    D.poZatvoreni = await stav(p);
  }
  await ctx.close();
  return D;
}

try {
  V.telefon = await telefon();
  V.pocitac = await pocitac('', false);
  V.pocitacFilm = await pocitac('?film=on', true);
  for (const [q, m] of [['?motion=off', null], ['', 'reduce']]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: m || 'no-preference' });
    const p = await ctx.newPage(); await p.goto(url + q, { waitUntil: 'load' });
    await p.locator('.recepcia-btn').waitFor({ state: 'attached', timeout: 15000 });
    V[`D1_${q || m}`] = await p.evaluate(() => ({ motion: document.documentElement.dataset.motion, anim: getComputedStyle(document.querySelector('.recepcia-btn')).animationName }));
    await ctx.close();
  }
} finally { await b.close(); }
writeFileSync(`${out}/panel-o5.json`, JSON.stringify(V, null, 1));
console.log(JSON.stringify(V, null, 1));
