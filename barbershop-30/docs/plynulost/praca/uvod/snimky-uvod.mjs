// Snímky úvodu (titulná karta) webu Barbershop 30: telefón 390×844 DPR 3 a počítač 1440×900, sk a en.
//   node snimky-uvod.mjs <základná adresa> <výstupný priečinok> <označenie pred|po>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [base, out, label] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const VP = {
  telefon: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  pocitac: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [kind, opts] of Object.entries(VP)) {
  for (const [jazyk, cesta] of [['sk', 'index.html'], ['en', 'en/index.html']]) {
    const ctx = await b.newContext({ ...opts, colorScheme: 'dark', locale: jazyk === 'sk' ? 'sk-SK' : 'en-GB' });
    const p = await ctx.newPage();
    const chyby = [];
    p.on('pageerror', (e) => chyby.push(String(e)));
    await p.goto(`${base}/barbershop-30/${cesta}?asistent=ukazka&objednavka=ukazka&uvod=off`, { waitUntil: 'load' });
    await p.waitForTimeout(3500);
    const h1 = await p.evaluate(() => {
      const h = document.querySelector('#h-uvod');
      const r = h.getBoundingClientRect();
      const w = [...h.querySelectorAll('.w')].map((e) => { const b = e.getBoundingClientRect(); return `${e.textContent}=${Math.round(b.width)}×${Math.round(b.height)}@${Math.round(b.left)},${Math.round(b.top)}`; });
      return `${h.textContent.trim()} | H1 ${Math.round(r.width)}×${Math.round(r.height)} | ${w.join('; ')} | scrollWidth ${document.documentElement.scrollWidth} | og:title ${document.querySelector('meta[property="og:title"]').content}`;
    });
    await p.screenshot({ path: path.join(out, `${label}-uvod-${jazyk}-${kind}.jpg`), type: 'jpeg', quality: 82 });
    console.log(`${label} ${jazyk} ${kind}: ${h1} | chyby ${chyby.length}${chyby.length ? ' ' + chyby.slice(0, 2).join(' | ') : ''}`);
    await ctx.close();
  }
}
await b.close();
