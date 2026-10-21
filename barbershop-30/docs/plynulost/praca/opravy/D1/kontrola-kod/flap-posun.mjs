// Kontrola kódu D1: tabuľa hodín sa po D1 vyplní až pri priblížení (IO rootMargin 100 %). Pred D1 bola vyplnená
// od štartu. Meria, či sa pri skoku na Kontakt (okamžitom aj plynulom z menu) zmení výška tabule a posunie obsah
// pod ňou (adresa, telefón), kým je na obrazovke: výška .flap, horný okraj .contact-list, počet políčok, zmeny
// scrollHeight a záznamy layout-shift (aj s hadRecentInput). Telefón 390×844 DPR 3, dotyk, ?uvod=off&hudba=off&film=off.
//   node flap-posun.mjs --base=http://127.0.0.1:8400/barbershop-30/ --meno=po [--cpu=4]
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const BASE = opt.base;
const OUT = new URL('./flap-posun/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
const init = () => {
  window.__k = { ls: [] };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__k.ls.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), rec: e.hadRecentInput, src: (e.sources || []).map((s) => s.node ? (s.node.nodeName + '.' + (s.node.className || '')).slice(0, 40) : '?') }); }).observe({ type: 'layout-shift', buffered: true });
};
const stav = (page) => page.evaluate(() => {
  const f = document.querySelector('[data-flap]'), cl = document.querySelector('.contact-list'), fr = f.getBoundingClientRect();
  return { t: Math.round(performance.now() - (window.__k.t0 || 0)), y: Math.round(scrollY), flapTop: Math.round(fr.top), flapH: Math.round(fr.height), listTop: Math.round(cl.getBoundingClientRect().top),
    b: f.querySelectorAll('.flap-cells b').length, sh: document.documentElement.scrollHeight, cells: f.querySelector('.flap-cells').textContent.slice(0, 40) };
});
const res = { meno: opt.meno, base: BASE };
for (const sposob of ['okamzity', 'menu']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
  const page = await ctx.newPage(); await page.addInitScript(init);
  const cdp = await ctx.newCDPSession(page);
  if (opt.cpu) await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(opt.cpu) });
  await page.goto(BASE + '?uvod=off&hudba=off&film=off', { waitUntil: 'load' });
  await sleep(2500);
  const pred = await stav(page);
  await page.evaluate(() => { window.__k.ls = []; window.__k.t0 = performance.now(); });
  if (sposob === 'okamzity') {
    // skok ako z adresy s kotvou (D2 plánuje okamžitý skok z menu)
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; location.hash = '#kontakt'; });
  } else {
    await page.tap('.nav-toggle'); await sleep(400);
    await page.tap('#nav a[href="#kontakt"]');
  }
  const vzorky = []; let snimkaPred = false, snimkaPo = false;
  for (let i = 0; i < 30; i++) {
    const s = await stav(page); vzorky.push(s);
    if (!snimkaPred && s.b === 0 && s.flapTop < 844 && s.flapTop > -100 && s.y > 1000) { snimkaPred = true; await page.screenshot({ path: `${OUT}${opt.meno}-${sposob}-pred-vyplnenim.png` }); }
    if (!snimkaPo && s.b > 0 && s.y > 1000) { snimkaPo = true; await page.screenshot({ path: `${OUT}${opt.meno}-${sposob}-po-vyplneni.png` }); }
    await sleep(100);
  }
  const ls = await page.evaluate(() => window.__k.ls);
  const prvy = vzorky.find((s) => s.y > 1000) || vzorky[0], posl = vzorky[vzorky.length - 1];
  res[sposob] = { pred_skokom: pred, po_skoku_prve: prvy, na_konci: posl, zmena_vysky_tabule_px: posl.flapH - prvy.flapH, posun_zoznamu_px: posl.listTop - prvy.listTop + (posl.y - prvy.y),
    zmena_scrollHeight_px: posl.sh - prvy.sh, layout_shift: ls, cls_bez_vstupu: +ls.filter((e) => !e.rec).reduce((a, e) => a + e.v, 0).toFixed(4), cls_spolu: +ls.reduce((a, e) => a + e.v, 0).toFixed(4),
    vzorky: vzorky.filter((s, i) => i < 20).map((s) => `${s.t}ms y${s.y} flapTop${s.flapTop} h${s.flapH} list${s.listTop} b${s.b}`) };
  await ctx.close();
}
fs.writeFileSync(`${OUT}${opt.meno}.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await browser.close();
