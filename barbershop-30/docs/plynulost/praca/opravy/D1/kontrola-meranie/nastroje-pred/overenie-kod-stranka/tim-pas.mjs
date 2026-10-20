// Pás tímu na telefóne: vodorovný ťah prstom po páse (.team-grid), snímky 0,1 / 0,3 / 0,7 / 1,5 s po ťahu;
// koľko kariet je viditeľných (.reveal is-in) a koľko portrétov je načítaných (complete) v okne pásu.
import { opt, BASE, launch, open, sleep } from './spolocne.mjs';
const browser = await launch();
const { page, cdp, ctx } = await open(browser, { cpu: Number(opt.cpu || 4), net: opt.net || 'fast4g' });
await page.goto(BASE + '?uvod=off', { waitUntil: 'load' });
await sleep(4000);
await page.evaluate(() => { const g = document.querySelector('.team-grid'); window.scrollTo({ top: g.getBoundingClientRect().top + scrollY - 200, behavior: 'instant' }); });
await sleep(2500);
const stav = () => page.evaluate(() => {
  const g = document.querySelector('.team-grid'), gr = g.getBoundingClientRect();
  return [...g.children].map((li, i) => { const r = li.getBoundingClientRect(); const img = li.querySelector('img'); const vis = r.right > gr.left + 4 && r.left < gr.right - 4; return vis ? `${i}:${li.classList.contains('is-in') ? 'is-in' : 'SKRYTÁ'}/${img.complete && img.naturalWidth ? 'foto' : 'BEZ FOTKY'}/op ${(+getComputedStyle(li).opacity).toFixed(2)}` : null; }).filter(Boolean).join('  ');
});
console.log('pred ťahom:', await stav());
const y = await page.evaluate(() => { const r = document.querySelector('.team-grid').getBoundingClientRect(); return Math.round(r.top + r.height / 2); });
// vodorovný švih sprava doľava cez pás
const sent = [cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 360, y }] })];
for (let k = 1; k <= 8; k++) { await sleep(16); sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 360 - k * 40, y }] })); }
sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }));
await Promise.all(sent);
const t0 = Date.now();
for (const ms of [100, 300, 700, 1500]) {
  await sleep(Math.max(0, ms - (Date.now() - t0)));
  await page.screenshot({ path: new URL(`./snimky/tim-pas-${ms}ms.jpg`, import.meta.url).pathname, type: 'jpeg', quality: 60, scale: 'css' });
  console.log(`${ms} ms po ťahu (scrollLeft ${await page.evaluate(() => document.querySelector('.team-grid').scrollLeft)}):`, await stav());
}
await ctx.close(); await browser.close();
