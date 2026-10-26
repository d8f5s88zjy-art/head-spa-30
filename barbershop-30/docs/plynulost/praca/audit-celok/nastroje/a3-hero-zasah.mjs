#!/usr/bin/env node
// A3: dá sa v úvode (skrol 0) ťuknúť na hodnotenie Google, Objednať sa a Zavolať? elementFromPoint v strede a plocha.
//   node a3-hero-zasah.mjs [--port=8887]
import { spawn } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
const PORT = +((process.argv.find((a) => a.startsWith('--port=')) || '').split('=')[1] || 8887);
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('python3', ['-I', '-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/barbershop-30/index.html`)).ok) break; } catch (e) { await sleep(200); } }
const b = await chromium.launch({ headless: true });
try {
  for (const q of ['?uvod=off', '']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
    const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:${PORT}/barbershop-30/index.html${q}`, { waitUntil: 'load' });
    await sleep(3000);
    const r = await p.evaluate(() => [...document.querySelectorAll('#uvod .hero-rating, #uvod .title-actions a, .site-header a.brand')].map((el) => {
      const b = el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const zasah = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
      let hore = 0, dole = 0; while (hore < 40 && zasah(cx, cy - hore - 1)) hore++; while (dole < 40 && zasah(cx, cy + dole + 1)) dole++;
      const t = document.elementFromPoint(cx, cy);
      return `${el.className}: stred ${zasah(cx, cy) ? 'zasiahne' : 'ZAKRYTÝ (' + (t ? t.tagName.toLowerCase() + '.' + t.className : '-') + ')'}, výška plochy ${hore + dole + 1} px, viditeľný ${Math.round(b.width)}×${Math.round(b.height)} na y ${Math.round(b.top)}`;
    }));
    console.log(`úvod ${q || '(prológ)'}:\n  ${r.join('\n  ')}`);
    await ctx.close();
  }
} finally { await b.close(); srv.kill(); }
