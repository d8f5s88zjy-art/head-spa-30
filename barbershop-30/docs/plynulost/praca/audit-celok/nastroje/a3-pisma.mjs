#!/usr/bin/env node
// A3: načítanie písiem na sk a en stránke (document.fonts) tesne po load a po 4 s, písmo tlačidla Objednať sa; snímka úvodu.
//   node a3-pisma.mjs [--port=8888] [--out=dir]
import path from 'node:path'; import { spawn } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const PORT = +(opt.port || 8888), OUT = path.resolve(opt.out || '.');
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('python3', ['-I', '-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/barbershop-30/index.html`)).ok) break; } catch (e) { await sleep(200); } }
const b = await chromium.launch({ headless: true });
try {
  for (const s of ['index.html', 'en/index.html']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
    const p = await ctx.newPage();
    const fonty = [];
    p.on('response', (r) => { if (/woff2/.test(r.url())) fonty.push(`${r.status()} ${r.url().split('/barbershop-30/')[1]}`); });
    await p.goto(`http://127.0.0.1:${PORT}/barbershop-30/${s}?uvod=off`, { waitUntil: 'load' });
    const stav = () => p.evaluate(() => ({ m700: document.fonts.check('700 16px Manrope'), m600: document.fonts.check('600 16px Manrope'), nacitane: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}${f.style === 'italic' ? 'i' : ''}`).join(', '), btn: getComputedStyle(document.querySelector('#uvod .title-actions .btn-primary')).fontFamily + ' ' + getComputedStyle(document.querySelector('#uvod .title-actions .btn-primary')).fontWeight }));
    const a = await stav(); await sleep(4000); const c = await stav();
    const f = path.join(OUT, `pisma-${s.replace(/\W+/g, '-')}-390.jpg`);
    await p.screenshot({ path: f, type: 'jpeg', quality: 70 });
    console.log(`${s}: po load ${JSON.stringify(a)}\n   po 4 s ${JSON.stringify(c)}\n   stiahnuté: ${fonty.join(', ')}\n   ${f}`);
    await ctx.close();
  }
} finally { await b.close(); srv.kill(); }
