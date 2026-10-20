// D1 – vrstva svetla po okraji kontaktnej karty (T4/K12): veľkosť kompozitnej vrstvy s animáciou transformácie
// (obeh svetla) oproti ploche karty .contact-main, telefón 390×844 @3, ?film=off&uvod=off&hudba=off, pred (8310) aj po (8312).
//   node vrstva-svetla.mjs
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
for (const [strom, port] of [['pred', 8310], ['po', 8312]]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(`http://127.0.0.1:${port}/barbershop-30/?film=off&uvod=off&hudba=off`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const karta = await page.evaluate(() => { const k = document.querySelector('.band-contact .contact-main'); const r = k.getBoundingClientRect(); scrollTo({ top: r.top + scrollY - 120, behavior: 'instant' }); return { w: Math.round(r.width), h: Math.round(r.height) }; });
  await page.waitForTimeout(1500);
  let layers = [];
  cdp.on('LayerTree.layerTreeDidChange', (e) => { if (e.layers) layers = e.layers; });
  await cdp.send('DOM.enable'); await cdp.send('LayerTree.enable');
  await page.waitForTimeout(1500);
  const anim = [];
  for (const l of layers) {
    if (!l.drawsContent) continue;
    try { const { compositingReasons } = await cdp.send('LayerTree.compositingReasons', { layerId: l.layerId }); if (compositingReasons.some((r) => /animation/i.test(r))) anim.push({ w: Math.round(l.width), h: Math.round(l.height), dovod: compositingReasons.join(',') }); } catch (e) { /* vrstva zmizla */ }
  }
  const plocha = karta.w * karta.h;
  const svetlo = anim.sort((a, b) => b.w * b.h - a.w * a.h)[0] || null;
  console.log(JSON.stringify({ strom, karta, plocha_karty_css: plocha, vrstvy_s_animaciou: anim.slice(0, 5), najvacsia: svetlo, pomer_k_karte: svetlo ? +(svetlo.w * svetlo.h / plocha).toFixed(2) : null, mpx_zariadenia: svetlo ? +(svetlo.w * svetlo.h * 9 / 1e6).toFixed(1) : null }));
  await ctx.close();
}
await browser.close();
