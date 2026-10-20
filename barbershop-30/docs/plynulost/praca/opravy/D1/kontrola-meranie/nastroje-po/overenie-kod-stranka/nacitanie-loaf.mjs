// Dlhé snímky (LoAF) počas načítania na telefóne (CPU 4×, Fast 4G, studená cache, bez dotyku), so zdrojom skriptu;
// 3 behy, aby bolo vidieť rozptyl
import { opt, BASE, launch, open, sleep } from './spolocne.mjs';
const browser = await launch();
for (let i = 0; i < 3; i++) {
  const { page, ctx } = await open(browser, { cpu: 4, net: 'fast4g', cache: false });
  await page.addInitScript(() => { window.__l = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__l.push(e); }).observe({ type: 'long-animation-frame', buffered: true }); });
  await page.goto(BASE + '?' + (opt.q || 'uvod=off'), { waitUntil: 'commit' });
  await sleep(7000);
  const r = await page.evaluate(() => window.__l.filter((e) => e.duration > 60).map((e) => `${Math.round(e.startTime)} ms: ${Math.round(e.duration)} ms (blok ${Math.round(e.blockingDuration)}) ` + (e.scripts || []).filter((s) => s.duration > 5).map((s) => `[${s.invoker.slice(0, 28)} ${(s.sourceURL || '').split('/').pop()}:${s.sourceFunctionName} ${Math.round(s.duration)} ms, vynútený štýl/layout ${Math.round(s.forcedStyleAndLayoutDuration)}]`).join(' ')));
  console.log(`--- beh ${i + 1}`); r.forEach((x) => console.log('  ', x));
  await ctx.close();
}
await browser.close();
