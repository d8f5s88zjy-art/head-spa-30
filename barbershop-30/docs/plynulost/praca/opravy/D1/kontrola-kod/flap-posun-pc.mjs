// Kontrola kódu D1: tabuľa hodín na počítači 1440×900 – skok na #kontakt (okamžitý z adresy a kliknutím na odkaz
// Kontakt v lište, plynulý): je tabuľa pri pristátí na obrazovke? Zmení sa jej výška pri vyplnení a posunie obsah pod ňou
// (adresa, telefón, tlačidlá)? Záznamy layout-shift (CLS) po skoku.
//   node flap-posun-pc.mjs --base=http://127.0.0.1:8400/barbershop-30/ --meno=po
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
  const f = document.querySelector('[data-flap]'), cl = document.querySelector('.contact-list'), ac = document.querySelector('.contact-actions'), fr = f.getBoundingClientRect();
  return { t: Math.round(performance.now() - (window.__k.t0 || 0)), y: Math.round(scrollY), flapTop: Math.round(fr.top), flapH: Math.round(fr.height), listTop: Math.round(cl.getBoundingClientRect().top), btnTop: Math.round(ac.getBoundingClientRect().top),
    b: f.querySelectorAll('.flap-cells b').length, sh: document.documentElement.scrollHeight, ih: innerHeight };
});
const res = { meno: opt.meno, base: BASE };
for (const sposob of ['okamzity', 'lista']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'sk-SK' });
  const page = await ctx.newPage(); await page.addInitScript(init);
  await page.goto(BASE + '?uvod=off&hudba=off&film=off', { waitUntil: 'load' });
  await sleep(2500);
  const pred = await stav(page);
  await page.evaluate(() => { window.__k.ls = []; window.__k.t0 = performance.now(); });
  if (sposob === 'okamzity') await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; location.hash = '#kontakt'; });
  else await page.click('.site-header a[href="#kontakt"]');
  const vzorky = []; let snimka = false;
  for (let i = 0; i < 25; i++) {
    const s = await stav(page); vzorky.push(s);
    if (!snimka && s.b > 0 && s.y > 1000) { snimka = true; await page.screenshot({ path: `${OUT}${opt.meno}-pc-${sposob}.png` }); }
    await sleep(100);
  }
  const ls = await page.evaluate(() => window.__k.ls);
  const prvy = vzorky.find((s) => s.y > 1000) || vzorky[0], posl = vzorky[vzorky.length - 1];
  res[sposob] = { pred_skokom: pred, po_skoku_prve: prvy, na_konci: posl, zmena_vysky_tabule_px: posl.flapH - prvy.flapH, posun_tlacidiel_na_obrazovke_px: posl.btnTop - prvy.btnTop, posun_scrollY_px: posl.y - prvy.y,
    layout_shift: ls, cls_bez_vstupu: +ls.filter((e) => !e.rec).reduce((a, e) => a + e.v, 0).toFixed(4), cls_spolu: +ls.reduce((a, e) => a + e.v, 0).toFixed(4),
    vzorky: vzorky.slice(0, 12).map((s) => `${s.t}ms y${s.y} flapTop${s.flapTop} h${s.flapH} list${s.listTop} btn${s.btnTop} b${s.b}`) };
  await ctx.close();
}
fs.writeFileSync(`${OUT}${opt.meno}-pc.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await browser.close();
