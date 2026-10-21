// N2: tabuľa hodín – zmena výšky pri vyplnení a posun obsahu po skoku na Kontakt (pred 8402 vs po 8400)
// node flap-cls.mjs --port=8400 --zar=tel|pc --cesta=skok|menu
import { createRequire } from 'module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const port = opt.port || 8400, zar = opt.zar || 'tel', cesta = opt.cesta || 'skok';
const out = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/kontrola-kod/pokus-21-10/flap';
fs.mkdirSync(out, { recursive: true });
const tel = zar === 'tel';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext(tel ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' } : { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__ls = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ls.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), recent: e.hadRecentInput, src: (e.sources || []).map((s) => ((s.node && (s.node.className || s.node.nodeName)) + '').slice(0, 24) + ':' + Math.round(s.previousRect.y) + '>' + Math.round(s.currentRect.y)).slice(0, 4) }); }).observe({ type: 'layout-shift', buffered: true });
});
await page.goto(`http://127.0.0.1:${port}/barbershop-30/index.html?uvod=off&hudba=off&film=off`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__renderDone !== false);
await page.waitForTimeout(1200);
const flapInfo = () => page.evaluate(() => { const f = document.querySelector('.flap'); const b = document.querySelector('.contact-actions .btn-primary'); const r = f.getBoundingClientRect(); return { t: Math.round(performance.now()), flapH: +r.height.toFixed(1), flapTop: Math.round(r.top), btnTop: Math.round(b.getBoundingClientRect().top), cells: f.querySelector('.flap-cells').children.length, y: Math.round(scrollY), sh: document.documentElement.scrollHeight }; });
const pred = await flapInfo();
const samples = [];
if (cesta === 'skok') {
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('#kontakt').scrollIntoView({ behavior: 'instant', block: 'start' }); });
} else {
  await page.tap('.nav-toggle'); await page.waitForTimeout(700);
  await page.tap('#nav a[href="#kontakt"]');
}
for (let i = 0; i < 50; i++) { samples.push(await flapInfo()); await page.waitForTimeout(60); }
const po = samples[samples.length - 1];
const maxBtnShift = Math.max(...samples.map((s) => s.btnTop)) - Math.min(...samples.slice(Math.max(0, samples.findIndex((s) => s.y === po.y))).map((s) => s.btnTop));
const ls = await page.evaluate(() => window.__ls);
const res = { port, zar, cesta, flapH_pred_skokom: pred.flapH, flapH_po_skoku: po.flapH, cells_po: po.cells, rast_scrollHeight: po.sh - pred.sh, y_koniec: po.y, btnTop_rozsah_po_pristati: maxBtnShift, layoutShift: ls, sucet: +ls.reduce((a, b) => a + b.v, 0).toFixed(4), sucet_bez_vstupu: +ls.filter((x) => !x.recent).reduce((a, b) => a + b.v, 0).toFixed(4) };
console.log(JSON.stringify(res));
fs.writeFileSync(`${out}/flap-${port}-${zar}-${cesta}.json`, JSON.stringify({ ...res, samples }, null, 1));
await page.screenshot({ path: `${out}/flap-${port}-${zar}-${cesta}.png` });
await browser.close();
