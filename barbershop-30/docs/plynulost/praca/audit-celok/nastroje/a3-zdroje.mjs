#!/usr/bin/env node
// A3: zdroje úvodnej stránky – poradie a čas načítania (bez spomalenia), veľkosť na disku a po gzip (GitHub Pages
// posiela text komprimovaný, python http.server nie), počet prvkov DOM.
//   node a3-zdroje.mjs [--port=8884] [--stranka=index.html]
import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib'; import { spawn } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny', PORT = +(opt.port || 8884), S = opt.stranka || 'index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('python3', ['-I', '-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/barbershop-30/${S}`)).ok) break; } catch (e) { await sleep(200); } }
const b = await chromium.launch({ headless: true });
try {
  const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/barbershop-30/${S}`, { waitUntil: 'load' });
  await sleep(8000);
  const r = await p.evaluate(() => ({
    dom: document.getElementsByTagName('*').length,
    hlbka: (() => { let m = 0; const w = (n, d) => { m = Math.max(m, d); for (const c of n.children) w(c, d + 1); }; w(document.documentElement, 1); return m; })(),
    load: Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd),
    zdroje: performance.getEntriesByType('resource').map((e) => ({ u: e.name.replace(location.origin + '/barbershop-30/', ''), typ: e.initiatorType, start: Math.round(e.startTime), koniec: Math.round(e.responseEnd), blok: e.renderBlockingStatus })),
  }));
  console.log(`${S}: prvkov DOM ${r.dom}, hĺbka ${r.hlbka}, load ${r.load} ms`);
  let spolu = 0, spoluGz = 0;
  const riadky = [{ u: S, typ: 'document', start: 0, koniec: 0, blok: '' }, ...r.zdroje].map((z) => {
    const f = path.join(ROOT, 'barbershop-30', decodeURIComponent(z.u.split('?')[0]));
    let raw = 0, gz = 0;
    try { const d = fs.readFileSync(f); raw = d.length; gz = /\.(html|css|js|mjs|json|svg|webmanifest|vcf)$/.test(f) ? zlib.gzipSync(d, { level: 9 }).length : raw; } catch (e) {}
    spolu += raw; spoluGz += gz;
    return `${String(z.start).padStart(6)}–${String(z.koniec).padEnd(6)} ${z.typ.padEnd(10)} ${String(z.blok || '').padEnd(14)} ${String(Math.round(raw / 1024)).padStart(5)} kB → gzip ${String(Math.round(gz / 1024)).padStart(4)} kB  ${z.u}`;
  });
  console.log(riadky.join('\n'));
  console.log(`spolu ${Math.round(spolu / 1024)} kB na disku, ${Math.round(spoluGz / 1024)} kB pri gzip textu (obrázky a písma bez zmeny)`);
  await ctx.close();
} finally { await b.close(); srv.kill(); }
