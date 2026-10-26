#!/usr/bin/env node
// A3: odkiaľ je blokovanie hlavného vlákna (TBT) na úvodnej stránke – varianty adresy a s/bez WebGL, dlhé úlohy a skripty.
//   node a3-tbt-rozbor.mjs [--port=8882] [--cpu=4] [--stranka=index.html]
import { spawn } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny', PORT = +(opt.port || 8882), CPU = +(opt.cpu || 4), S = opt.stranka || 'index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('python3', ['-I', '-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/barbershop-30/${S}`)).ok) break; } catch (e) { await sleep(200); } }
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const init = () => { const M = (window.__a3 = { long: [], fcp: 0 }); new PerformanceObserver((l) => { for (const e of l.getEntries()) M.long.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') M.fcp = e.startTime; }).observe({ type: 'paint', buffered: true }); };
try {
  for (const [meno, args, q] of [['predvolené (WebGL)', GL, ''], ['?uvod=off', GL, '?uvod=off'], ['?film=off', GL, '?film=off'], ['?motion=off', GL, '?motion=off'], ['bez WebGL (--disable-3d-apis)', ['--disable-gpu', '--disable-3d-apis'], '']]) {
    const b = await chromium.launch({ headless: true, args });
    const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, colorScheme: 'dark' });
    const p = await ctx.newPage(); await p.addInitScript(init);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    const js = [];
    p.on('response', (r) => { if (/\.(m?js)(\?|$)/.test(r.url())) js.push(r.url().split('/').pop()); });
    await p.goto(`http://127.0.0.1:${PORT}/barbershop-30/${S}${q}`, { waitUntil: 'load' });
    await sleep(9000);
    const m = await p.evaluate(() => ({ ...window.__a3, cls: document.documentElement.className }));
    const tbt = m.long.reduce((a, [t, d]) => a + Math.max(0, t + d - Math.max(t + 50, m.fcp)), 0);
    console.log(`${meno.padEnd(30)} CPU ${CPU}× TBT ${Math.round(tbt)} ms, FCP ${Math.round(m.fcp)} ms, dlhé úlohy [štart ms, trvanie ms]: ${m.long.map((x) => x.join('/')).join(' ')}\n   html.class: ${m.cls}\n   skripty: ${js.join(', ')}`);
    await b.close();
  }
} finally { srv.kill(); }
