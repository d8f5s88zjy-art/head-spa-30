// Metodika: či CDP spomalenie CPU pripočíta čas vlákna aj počas blokujúceho čakania (synchrónne XHR 500 ms)
import { createRequire } from 'module';
import http from 'node:http';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const srv = http.createServer((q, s) => { if (q.url === '/pomaly') setTimeout(() => s.end('ok'), 500); else { s.setHeader('content-type', 'text/html'); s.end('<p>x</p>'); } }).listen(8582);
const browser = await chromium.launch();
for (const rate of [1, 4, 1, 4]) {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8582/');
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
  await page.evaluate(() => new Promise((r) => setTimeout(() => { const x = new XMLHttpRequest(); x.open('GET', '/pomaly', false); x.send(); r(); }, 50)));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.end'); const { stream } = await done;
  let d = ''; for (;;) { const c = await cdp.send('IO.read', { handle: stream }); d += c.data; if (c.eof) break; }
  const tf = JSON.parse(d).traceEvents.filter((e) => e.name === 'TimerFire' && e.ph === 'X').map((e) => [(e.dur / 1000).toFixed(0), (e.tdur / 1000).toFixed(0)]);
  console.log('rate', rate, 'TimerFire [stena, vlákno] ms', JSON.stringify(tf));
  await ctx.close();
}
await browser.close(); srv.close();
