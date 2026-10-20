// Interakcie na telefóne (390×844 @3, CPU 4×, Fast 4G): menu, skok z menu na pätičku a späť hore (plynulý skrol),
// prepnutie jazyka, galéria. Event Timing (INP kandidáti), dlhé snímky (LoAF), obrázky stiahnuté počas skoku,
// koľko kotiev prešlo is-near/is-shown počas skoku.
//   node interakcie.mjs [--q=uvod=off] [--cpu=4] [--net=fast4g]
import fs from 'fs';
import { opt, BASE, launch, open, sleep } from './spolocne.mjs';
const q = opt.q || 'uvod=off', cpu = Number(opt.cpu || 4);
const browser = await launch();
const { page, cdp, ctx } = await open(browser, { cpu: 1, net: opt.net || 'fast4g' });
await page.addInitScript(() => {
  window.__ev = []; window.__loaf = []; window.__cls = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ev.push({ n: e.name, t: Math.round(e.startTime), d: Math.round(e.duration), delay: Math.round(e.processingStart - e.startTime), proc: Math.round(e.processingEnd - e.processingStart), pres: Math.round(e.startTime + e.duration - e.processingEnd), id: e.interactionId }); }).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__loaf.push({ t: Math.round(e.startTime), d: Math.round(e.duration), s: (e.scripts || []).filter((s) => s.duration > 3).map((s) => `${(s.sourceURL || '').split('/').pop()}:${s.sourceFunctionName}:${s.invoker.slice(0, 30)} ${Math.round(s.duration)}/${Math.round(s.forcedStyleAndLayoutDuration)}`) }); }).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) {}
  addEventListener('DOMContentLoaded', () => { const mo = new MutationObserver((ls) => { for (const m of ls) if (m.target.classList && m.target.classList.contains('film-shot')) window.__cls.push({ t: Math.round(performance.now()), s: m.target.dataset.shot, c: m.target.className.replace(/film-shot|is-title|title-long/g, '').trim() }); }); document.querySelectorAll('.film-shot').forEach((el) => mo.observe(el, { attributes: true, attributeFilter: ['class'] })); });
});
const reqs = [];
page.on('request', (r) => { if (r.resourceType() === 'image') reqs.push({ t: Date.now(), u: r.url().split('/').pop() }); });
await page.goto(BASE + '?' + q, { waitUntil: 'load', timeout: 120000 });
await sleep(4500);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
const res = { parametre: { q, cpu, net: opt.net || 'fast4g' }, kroky: [] };
const now = () => page.evaluate(() => performance.now());
async function krok(meno, fn, wait = 1500) {
  const t = await now(); const tr = Date.now();
  await page.evaluate(() => { window.__fr = []; let l = 0; window.__frStop = false; const f = (x) => { if (l) window.__fr.push(x - l); l = x; if (!window.__frStop) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await fn();
  await sleep(wait);
  const m = await page.evaluate((t) => { window.__frStop = true; const fr = [...window.__fr].sort((a, b) => a - b); return { ev: window.__ev.filter((e) => e.t >= t), loaf: window.__loaf.filter((e) => e.t >= t && e.d > 50), cls: window.__cls.filter((e) => e.t >= t), fr: { n: fr.length, p95: Math.round(fr[Math.floor(fr.length * 0.95)] || 0), max: Math.round(fr[fr.length - 1] || 0), nad33: fr.filter((x) => x > 33.4).length } }; }, t);
  const y = await page.evaluate(() => Math.round(scrollY));
  const near = new Set(m.cls.filter((c) => /is-near/.test(c.c)).map((c) => c.s));
  const shown = new Set(m.cls.filter((c) => /is-shown/.test(c.c)).map((c) => c.s));
  res.kroky.push({ krok: meno, y, udalosti: m.ev.map((e) => `${e.n} ${e.d} ms (čakanie ${e.delay}, spracovanie ${e.proc}, vykreslenie ${e.pres})`), loaf: m.loaf, snimky: m.fr, obrazky: reqs.filter((r) => r.t >= tr).map((r) => r.u), kotvy_near: [...near], kotvy_shown: [...shown] });
}
await krok('otvoriť menu', () => page.tap('.nav-toggle'), 900);
await krok('skok z menu na Kontakt (pätička)', () => page.tap('#nav a[href="#kontakt"]'), 3000);
await krok('Späť hore z pätičky', () => page.tap('.footer-top'), 3500);
await krok('otvoriť menu 2', () => page.tap('.nav-toggle'), 900);
await krok('jazyk EN v menu', () => page.tap('[data-lang-pick="en"]'), 2500);
await krok('jazyk SK v menu', () => page.tap('[data-lang-pick="sk"]'), 2500);
await krok('zavrieť menu', () => page.tap('.nav-toggle'), 900);
await krok('skok z menu na Galériu', async () => { await page.tap('.nav-toggle'); await sleep(500); await page.tap('#nav a[href="#galeria"]'); }, 3000);
await krok('fotka v galérii (lightbox)', async () => { await page.evaluate(() => document.querySelector('.gallery').scrollIntoView({ behavior: 'instant', block: 'center' })); await sleep(800); await page.tap('.gallery-btn'); }, 2000);
await krok('zavrieť lightbox', () => page.tap('.lightbox-close'), 1000);
fs.writeFileSync(new URL('./interakcie.json', import.meta.url), JSON.stringify(res, null, 1));
for (const k of res.kroky) {
  console.log(`--- ${k.krok} (y ${k.y}) snímky n=${k.snimky.n} p95 ${k.snimky.p95} max ${k.snimky.max} >33ms ${k.snimky.nad33}`);
  for (const u of k.udalosti) console.log('    udalosť', u);
  for (const l of k.loaf) console.log('    LoAF', l.d, 'ms', l.s.join(' | '));
  if (k.obrazky.length) console.log('    obrázky:', k.obrazky.length, k.obrazky.slice(0, 12).join(', '));
  if (k.kotvy_near.length || k.kotvy_shown.length) console.log('    kotvy is-near:', k.kotvy_near.join(','), '| is-shown:', k.kotvy_shown.join(','));
}
await ctx.close(); await browser.close();
