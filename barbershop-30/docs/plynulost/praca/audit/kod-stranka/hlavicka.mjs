// Pred spustením app.js (data-scene-active ešte nie je): má lišta na telefóne backdrop-filter? (style.css:945)
import { BASE, launch, sleep } from './spolocne.mjs';
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.route('**/assets/app.js', (r) => r.abort());
await page.goto(BASE + '?uvod=off', { waitUntil: 'load' });
await sleep(500);
console.log('bez app.js (stav pred jeho spustením), lišta:', await page.evaluate(() => { const s = getComputedStyle(document.querySelector('.site-header')); return { backdropFilter: s.backdropFilter, animation: s.animationName }; }));
await ctx.close(); await browser.close();
