// Ktoré animácie bežia počas skrolu na telefóne (document.getAnimations): cieľ, názov, stav, či je cieľ v okne.
// Bežiaca animácia (aj na kompozitore) pri každej snímke s rAF (app.js tick) prepočíta štýl svojho cieľa.
import { opt, BASE, launch, open, sleep, swipe } from './spolocne.mjs';
const browser = await launch();
const { page, cdp, ctx } = await open(browser, { cpu: 1, net: 'none' });
await page.goto(BASE + '?' + (opt.q || 'uvod=off'), { waitUntil: 'load' });
await sleep(1000);
await swipe(cdp, { dy: 300, speed: 1000 });   // prvý dotyk návštevníka (načíta atmosféru, pustí hudbu)
await sleep(4500);
const list = async (kde) => page.evaluate((kde) => {
  const vis = (el) => { const r = (el.nodeType === 1 ? el : el.parentElement).getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0; };
  return { kde, y: Math.round(scrollY), hudba: document.querySelector('.hudba')?.getAttribute('aria-pressed'), anim: document.getAnimations().filter((a) => a.playState === 'running').map((a) => {
    const t = a.effect && a.effect.target; const pe = a.effect && a.effect.pseudoElement;
    const name = a.animationName || (a.transitionProperty ? 'prechod ' + a.transitionProperty : '?');
    const desc = t ? (t.tagName.toLowerCase() + (t.id ? '#' + t.id : '') + (t.className && typeof t.className === 'string' ? '.' + t.className.trim().split(/\s+/).slice(0, 3).join('.') : '') + (pe || '')) : '?';
    return `${name} ${a.effect.getComputedTiming().iterations === Infinity ? '∞' : ''} ${desc} ${t && vis(t) ? 'V OKNE' : 'mimo'}`;
  }) };
}, kde);
const r = [];
r.push(await list('vrch'));
for (const [kde, sel] of [['remeslo', '#remeslo'], ['tim', '.band-team'], ['cennik', '.band-prices'], ['galeria', '.band-gallery'], ['kontakt', '.band-contact']]) {
  await page.evaluate((sel) => { const e = document.querySelector(sel); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY + 60, behavior: 'instant' }); }, sel);
  await sleep(1500);
  r.push(await list(kde));
}
for (const x of r) { console.log(`--- ${x.kde} (y ${x.y}, hudba ${x.hudba}): ${x.anim.length} bežiacich`); const c = new Map(); for (const a of x.anim) c.set(a, (c.get(a) || 0) + 1); for (const [a, n] of c) console.log(`   ${n}× ${a}`); }
await ctx.close(); await browser.close();
