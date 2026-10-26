#!/usr/bin/env node
// A3: úvod bez JavaScriptu po dobehnutí animácií (CSS) – viditeľnosť H1, tlačidiel a hodnotenia; snímky JPEG.
//   node a3-bezjs-detail.mjs [--port=8881] [--out=dir] [--stranka=index.html]
import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny', PORT = +(opt.port || 8881), OUT = path.resolve(opt.out || '.'), S = opt.stranka || 'index.html';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('python3', ['-I', '-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/barbershop-30/${S}`)).ok) break; } catch (e) { await sleep(200); } }
const b = await chromium.launch({ headless: true });
try {
  for (const js of [false, true]) {
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, javaScriptEnabled: js, colorScheme: 'dark' });
      const p = await ctx.newPage();
      await p.goto(`http://127.0.0.1:${PORT}/barbershop-30/${S}${js ? '?uvod=off' : ''}`, { waitUntil: 'load' });
      await sleep(5000);
      const r = await p.evaluate(() => [...document.querySelectorAll('#uvod h1 .w, #uvod .title-sub, #uvod .hero-proof, #uvod .title-actions a, .site-header .nav a.btn')].map((e) => { const cs = getComputedStyle(e), bx = e.getBoundingClientRect(); return `${e.className || e.tagName}: opacity ${cs.opacity}, filter ${cs.filter}, visibility ${cs.visibility}, display ${cs.display}, y ${Math.round(bx.top)}–${Math.round(bx.bottom)}, okno ${innerHeight}`; }));
      const f = path.join(OUT, `uvod-${js ? 'sjs' : 'bezjs'}-${w}.jpg`);
      await p.screenshot({ path: f, type: 'jpeg', quality: 70 });
      console.log(`JS ${js ? 'zapnutý' : 'vypnutý'} ${w}px: ${f}\n  ` + r.join('\n  '));
      await ctx.close();
    }
  }
} finally { await b.close(); srv.kill(); }
