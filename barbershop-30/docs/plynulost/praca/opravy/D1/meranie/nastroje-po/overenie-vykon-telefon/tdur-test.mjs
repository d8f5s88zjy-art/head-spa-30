// Overenie metodiky: ako sa čas vlákna (tdur) správa pri CDP spomalení CPU 1× vs 4×
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const rate of [1, 4, 1, 4]) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8312/barbershop-30/robots.txt');
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
  const wall = await page.evaluate(() => new Promise((r) => setTimeout(() => {
    const t0 = performance.now(); let x = 0; for (let i = 0; i < 3e7; i++) x += Math.sqrt(i); const t1 = performance.now(); r([t1 - t0, x]);
  }, 50)));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.end');
  const { stream } = await done;
  let data = ''; for (;;) { const c = await cdp.send('IO.read', { handle: stream }); data += c.data; if (c.eof) break; }
  const ev = JSON.parse(data).traceEvents || JSON.parse(data);
  const tasks = ev.filter((e) => e.name === 'TimerFire' || (e.name === 'RunTask' && e.dur > 20000)).map((e) => [e.name, (e.dur / 1000).toFixed(1), e.tdur != null ? (e.tdur / 1000).toFixed(1) : null]);
  console.log('rate', rate, 'JS wall', wall[0].toFixed(1), 'ms', JSON.stringify(tasks.slice(0, 4)));
  await ctx.close();
}
await browser.close();
