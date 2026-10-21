// Náklady hlavného vlákna adminu HEAD SPA na pomalom telefóne (CPU 4×): prvý obraz, prihlásenie, prepnutie záložky, písanie.
import { createRequire } from 'module'; import fs from 'node:fs'; import path from 'node:path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-tool';
const ADMIN = 'http://localhost:8940/admin/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => { window.__lt = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) {} });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 10 * 1024 * 1024 / 8, uploadThroughput: 5 * 1024 * 1024 / 8 });
await page.route('https://api.github.com/**', async (route) => {
  const req = route.request(); const p = new URL(req.url()).pathname.replace(/^\/repos\/[^/]+\/[^/]+/, ''); const m = req.method();
  const json = (o, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(o) });
  if (p === '' && m === 'GET') return json({ permissions: { push: true } });
  if (p.startsWith('/git/ref/heads/')) return json({ object: { sha: 'abc' } });
  if (p.startsWith('/contents/')) { const rel = decodeURIComponent(p.slice(10)); const abs = path.join(ROOT, rel); if (!fs.existsSync(abs)) return json({}, 404); if (fs.statSync(abs).isDirectory()) return json(fs.readdirSync(abs).map((n) => ({ path: rel + '/' + n }))); return json({ sha: 'f', encoding: 'base64', content: fs.readFileSync(abs).toString('base64') }); }
  return json({});
});
// 1) prvý obraz prihlasovacej stránky
await page.goto(ADMIN, { waitUntil: 'load' }); await page.waitForTimeout(500);
const first = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const p = Object.fromEntries(performance.getEntriesByType('paint').map((e) => [e.name, Math.round(e.startTime)])); return { prenesené: n.transferSize, dekódované: n.decodedBodySize, dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), paint: p, dlhéÚlohy: window.__lt }; });
console.log('PRVÝ OBRAZ (CPU 4×, Fast 4G):', JSON.stringify(first));
// 2) prihlásenie: od reload po #app viditeľný
await page.evaluate(() => sessionStorage.setItem('hs30.admin', 'github_pat_test'));
await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('#app:not([hidden])', { timeout: 60000 });
const lg = await page.evaluate(() => ({ app: Math.round(performance.now()), dlhéÚlohy: window.__lt, súčetDlhých: window.__lt.reduce((a, x) => a + x[1], 0) }));
console.log('PO PRIHLÁSENÍ: #app viditeľný v ms', lg.app, '| dlhé úlohy [štart, trvanie]', JSON.stringify(lg.dlhéÚlohy), '| súčet', lg.súčetDlhých);
// 3) prepnutie na Texty (grow na 209 textarea) a Rituály
for (const t of ['texty', 'ritualy', 'tim', 'oznam']) {
  await page.evaluate(() => { window.__lt.length = 0; });
  const t0 = Date.now(); await page.click(`#tabs button[data-tab="${t}"]`); await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))); const dt = Date.now() - t0;
  console.log(`ZÁLOŽKA ${t}: klik → druhá snímka ms`, dt, '| dlhé úlohy', JSON.stringify(await page.evaluate(() => window.__lt)));
}
// 4) písanie do poľa oznamu: čas obsluhy jedného znaku (input → refresh)
await page.click('#tabs button[data-tab="oznam"]');
const typ = await page.evaluate(() => { const ta = document.querySelector('#ozBox textarea'); const out = []; for (let i = 0; i < 8; i++) { ta.value = 'Dovolenka ' + 'x'.repeat(i); const t0 = performance.now(); ta.dispatchEvent(new Event('input', { bubbles: true })); out.push(+(performance.now() - t0).toFixed(1)); } return out; });
console.log('PÍSANIE: obsluha jedného znaku ms (8 znakov)', JSON.stringify(typ));
// 5) pamäť a DOM
const mem = await cdp.send('Runtime.evaluate', { expression: 'performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : -1', returnByValue: true });
console.log('JS halda MB', mem.result.value, '| uzlov DOM', await page.evaluate(() => document.querySelectorAll('*').length));
await b.close();
