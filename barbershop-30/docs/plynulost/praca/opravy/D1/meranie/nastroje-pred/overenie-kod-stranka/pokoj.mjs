// Pokoj (nikto neskroluje) 5 s na karte Remeslo a pri kontakte: koľko snímok vyrobí kompozitor (DrawFrame) a koľko práce
// má hlavné vlákno, so zapnutými nekonečnými animáciami (hudba po prvom dotyku, lesk tlačidla, svetlo okraja) a bez nich.
import { opt, BASE, launch, open, sleep, swipe, traceStart, CATS } from './spolocne.mjs';
import { patch } from './zaplaty.mjs';
import { mainThread } from './analyza.mjs';
const browser = await launch();
const rows = [];
for (const p of ['', 'bezanim']) for (const kde of ['#remeslo', '.band-contact']) {
  const { page, cdp, ctx } = await open(browser, { cpu: 1, net: 'none' });
  if (p) await patch(page, [p]);
  await page.goto(BASE + '?uvod=off', { waitUntil: 'load' });
  await sleep(1000);
  await swipe(cdp, { dy: 200, speed: 1000 });          // prvý dotyk (hudba)
  await sleep(4000);
  await page.evaluate((s) => { const e = document.querySelector(s); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY + 100, behavior: 'instant' }); }, kde);
  await sleep(4000);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const stop = await traceStart(cdp, CATS);
  await sleep(5000);
  const ev = await stop();
  const mt = mainThread(ev);
  const draw = ev.filter((e) => e.name === 'DrawFrame').length;
  const begin = ev.filter((e) => e.name === 'BeginMainThreadFrame' || e.name === 'BeginFrame').length;
  const main = ev.filter((e) => `${e.pid}:${e.tid}` === mt && e.ph === 'X' && e.name === 'RunTask').reduce((a, e) => a + e.dur / 1000, 0);
  const ult = ev.filter((e) => `${e.pid}:${e.tid}` === mt && e.ph === 'X' && e.name === 'UpdateLayoutTree').length;
  rows.push({ variant: p || 'zaklad', kde, DrawFrame_za_5s: draw, BeginFrame: begin, hlavne_vlakno_ms: Math.round(main), prepoctov_stylu: ult, hudba: await page.evaluate(() => document.querySelector('.hudba')?.getAttribute('aria-pressed')) });
  await ctx.close();
}
await browser.close();
console.log('pokoj 5 s, telefón, CPU 4×');
console.table(rows);
