// Plocha udalostí Paint počas nástupu a odchodu karty (lite 390×844 @3, dotyk): node paint-karty.mjs <port>
// Bez časov: počíta len udalosti Paint s plochou >= 50 % okna (podklad pre bod L5.2 „krytie na .title-card“).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const base = `http://127.0.0.1:${process.argv[2]}/barbershop-30/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
await ctx.addInitScript(() => { try { localStorage.setItem('b30.lang', 'sk'); localStorage.setItem('b30.langAsked', '1'); } catch (e) {} });
const page = await ctx.newPage();
await page.goto(base, { waitUntil: 'load' }); await sleep(1500);
const from = await page.evaluate(() => { const e = document.querySelector('[data-shot="cakaren"]'); return e.getBoundingClientRect().top + scrollY + 0.3 * innerHeight; });
const to = await page.evaluate(() => { const e = document.querySelector('[data-shot="kreslo-stred"]'); return e.getBoundingClientRect().top + scrollY + 0.4 * innerHeight; });
await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), from); await sleep(1500);
const cdp = await ctx.newCDPSession(page);
const events = [];
cdp.on('Tracing.dataCollected', (d) => events.push(...d.value));
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });
const steps = 60;
for (let i = 1; i <= steps; i++) { await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), from + (to - from) * i / steps); await sleep(50); }
await sleep(500);
await cdp.send('Tracing.end'); await done;
const vw = 390 * 3, vh = 844 * 3, va = vw * vh;
const paints = events.filter((e) => e.name === 'Paint' && e.args?.data?.clip);
const area = (q) => { const xs = [q[0], q[2], q[4], q[6]], ys = [q[1], q[3], q[5], q[7]]; return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)); };
const big = paints.filter((e) => area(e.args.data.clip) >= 0.5 * va);
const ids = {};
for (const e of big) { const k = e.args.data.nodeId ?? '?'; ids[k] = (ids[k] || 0) + 1; }
const desc = {};
for (const id of Object.keys(ids)) {
  try { const { node } = await cdp.send('DOM.describeNode', { backendNodeId: +id }); desc[id] = node.nodeName + '.' + ((node.attributes || []).join(' ').match(/class (\S+(?: \S+)*)/) || [])[0]; } catch (e) { desc[id] = '?'; }
}
console.log(JSON.stringify({ snimkySkrolu: steps, paint: paints.length, paintAspon50: big.length, podlaUzla: Object.fromEntries(Object.entries(ids).map(([k, v]) => [desc[k] || k, v])) }, null, 1));
await browser.close();
