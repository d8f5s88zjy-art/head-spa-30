// Kompozitné vrstvy na telefóne (CDP LayerTree): počet, plocha v pixeloch displeja (odhad pamäte 4 B/px),
// najväčšie vrstvy s prvkom a dôvodom vytvorenia. Polohy: vrch, karta Remeslo, pás tímu, cenník, galéria, kontakt.
//   node vrstvy.mjs [--q=uvod=off]
import fs from 'fs';
import { opt, BASE, launch, open, sleep } from './spolocne.mjs';
const q = opt.q || 'uvod=off';
const tag = opt.tag || '';
const browser = await launch();
const { page, cdp, ctx } = await open(browser, { cpu: 1, net: 'none' });
await page.goto(BASE + '?' + q, { waitUntil: 'load' });
await sleep(4500);
if (opt.css) await page.addStyleTag({ content: String(opt.css) });
await cdp.send('DOM.enable');
await cdp.send('LayerTree.enable');
let last = null;
cdp.on('LayerTree.layerTreeDidChange', (e) => { if (e.layers) last = e.layers; });
const DPR = 3;
const desc = async (id) => {
  if (!id) return '';
  try { const { node } = await cdp.send('DOM.describeNode', { backendNodeId: id }); const a = node.attributes || []; const i = a.indexOf('class'); return `${node.nodeName.toLowerCase()}${a.includes('id') ? '#' + a[a.indexOf('id') + 1] : ''}${i >= 0 ? '.' + a[i + 1].trim().split(/\s+/).slice(0, 3).join('.') : ''}${node.pseudoType ? '::' + node.pseudoType : ''}`; } catch (e) { return '?'; }
};
const out = [];
for (const [kde, sel] of [['vrch', null], ['remeslo', '#remeslo'], ['tim', '.band-team'], ['cennik', '.band-prices'], ['galeria', '.band-gallery'], ['kontakt', '.band-contact']]) {
  await page.evaluate((sel) => { const y = sel ? document.querySelector(sel).getBoundingClientRect().top + scrollY + 80 : 0; window.scrollTo({ top: y, behavior: 'instant' }); }, sel);
  await sleep(1800);
  // vynútená zmena stromu vrstiev (pomocný 1 px prvok s will-change), aby prišla aktuálna udalosť layerTreeDidChange
  await page.evaluate(() => new Promise((r) => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;will-change:transform;pointer-events:none'; document.body.append(d); requestAnimationFrame(() => requestAnimationFrame(() => { d.remove(); requestAnimationFrame(() => requestAnimationFrame(r)); })); }));
  await sleep(1200);
  // vlastný pomocný prvok sa nepočíta
  const layers = (last || []).filter((l) => l.drawsContent);
  let area = 0; const rows = [];
  for (const l of layers) { const a = l.width * l.height * DPR * DPR; area += a; rows.push({ l, a }); }
  rows.sort((x, y) => y.a - x.a);
  const top = [];
  for (const { l, a } of rows.slice(0, 8)) {
    let reasons = [];
    try { reasons = (await cdp.send('LayerTree.compositingReasons', { layerId: l.layerId })).compositingReasonIds || []; } catch (e) {}
    top.push({ prvok: await desc(l.backendNodeId), css_px: `${Math.round(l.width)}×${Math.round(l.height)}`, MB: +(a * 4 / 1048576).toFixed(1), dovod: reasons.slice(0, 3).join(',') });
  }
  const dovody = {};
  for (const l of (last || [])) { try { const r = (await cdp.send('LayerTree.compositingReasons', { layerId: l.layerId })).compositingReasonIds || []; for (const x of r) dovody[x] = (dovody[x] || 0) + 1; } catch (e) {} }
  out.push({ dovody, kde, y: await page.evaluate(() => Math.round(scrollY)), vrstiev: (last || []).length, kresliacich: layers.length, MB_spolu: +(area * 4 / 1048576).toFixed(1), top });
}
fs.writeFileSync(new URL(`./vrstvy-${q.replace(/[^a-z0-9]+/gi, '_')}${tag}.json`, import.meta.url), JSON.stringify(out, null, 1));
for (const o of out) { console.log(`--- ${o.kde} y=${o.y}: vrstiev ${o.vrstiev}, kreslí ${o.kresliacich}, plocha vrstiev ${o.MB_spolu} MB (horná hranica, rastrujú sa len dlaždice pri okne)`); console.log('   dôvody:', JSON.stringify(o.dovody)); for (const t of o.top) console.log(`   ${t.MB} MB  ${t.css_px}  ${t.prvok}  [${t.dovod}]`); }
await ctx.close(); await browser.close();
