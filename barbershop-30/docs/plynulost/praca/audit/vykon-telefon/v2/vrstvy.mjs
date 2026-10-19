// Kompozičné vrstvy na telefóne (390×844, DPR 3) v niekoľkých polohách skrolu: počet, plocha v pixeloch zariadenia,
// najväčšie vrstvy s dôvodmi a počtom prekreslení (paintCount) po krátkom skrole. node vrstvy.mjs [--film=off]
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto('http://127.0.0.1:8433/barbershop-30/?film=' + (opt.film || 'off'), { waitUntil: 'load' });
await page.touchscreen.tap(20, 500); await page.waitForTimeout(1500);
let layers = [];
cdp.on('LayerTree.layerTreeDidChange', (e) => { if (e.layers) layers = e.layers; });
await cdp.send('DOM.enable'); await cdp.send('LayerTree.enable');
const DPR = 3;
for (const y of [0, 1100, 2300, 3300, 5200, 10000, 13300]) {
  await page.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y);
  await page.waitForTimeout(900);
  // krátky skrol prstom, aby sa ukázalo, čo sa prekresľuje
  const pc0 = new Map(layers.map((l) => [l.layerId, l.paintCount || 0]));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 600 }] });
  for (let k = 1; k <= 10; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 600 - 12 * k }] }); await page.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(700);
  const draw = layers.filter((l) => l.drawsContent);
  const area = draw.reduce((s, l) => s + l.width * l.height, 0) * DPR * DPR;
  const big = [...draw].sort((a, b) => b.width * b.height - a.width * a.height).slice(0, 6);
  const out = [];
  for (const l of big) {
    let why = [];
    try { why = (await cdp.send('LayerTree.compositingReasons', { layerId: l.layerId })).compositingReasons || []; } catch (e) { /* vrstva zanikla */ }
    out.push(`${Math.round(l.width)}×${Math.round(l.height)} css (${(l.width * l.height * DPR * DPR / 1e6).toFixed(1)} Mpx) prekreslení +${(l.paintCount || 0) - (pc0.get(l.layerId) || 0)} [${why.slice(0, 3).join(',')}]`);
  }
  const repaint = draw.filter((l) => (l.paintCount || 0) - (pc0.get(l.layerId) || 0) > 0).reduce((s, l) => s + l.width * l.height, 0) * DPR * DPR;
  console.log(`y=${y}: vrstiev ${layers.length}, kresliacich ${draw.length}, plocha ${(area / 1e6).toFixed(1)} Mpx (okno ${(390 * 844 * 9 / 1e6).toFixed(1)} Mpx), prekreslené pri skrole ${(repaint / 1e6).toFixed(1)} Mpx`);
  for (const s of out) console.log('   ', s);
  // ktoré vrstvy sa pri skrole prekreslili (s uzlom DOM, ak sa dá zistiť)
  const rp = draw.filter((l) => (l.paintCount || 0) - (pc0.get(l.layerId) || 0) > 0).sort((p, q) => q.width * q.height - p.width * p.height).slice(0, 5);
  for (const l of rp) {
    let why = [], node = '';
    try { why = (await cdp.send('LayerTree.compositingReasons', { layerId: l.layerId })).compositingReasons || []; } catch (e) { /* nič */ }
    if (l.backendNodeId) { try { const r = await cdp.send('DOM.resolveNode', { backendNodeId: l.backendNodeId }); const d = await cdp.send('Runtime.callFunctionOn', { objectId: r.object.objectId, functionDeclaration: 'function(){return this.nodeName+"."+String(this.className||"").slice(0,50)+" < "+(this.parentElement?this.parentElement.className:"")}', returnByValue: true }); node = d.result.value; } catch (e) { /* uzol bez backendu */ } }
    console.log(`    PREKRESLENÁ ${Math.round(l.width)}×${Math.round(l.height)} css +${(l.paintCount || 0) - (pc0.get(l.layerId) || 0)}× ${node} [${why.slice(0, 2).join(',')}]`);
  }
}
await browser.close();
