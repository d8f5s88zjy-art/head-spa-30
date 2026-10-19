#!/usr/bin/env node
// Zastavené strihy filmu (BS30_FILM.cutFreeze) telefón 390×844 DPR 3 vs počítač 1440×900: preblikávanie, dvojexpozícia, šero.
//   node strihy.mjs [--cuts=rohozka,cakaren,sala-rano,kava] [--mixes=0.3,0.5,0.7] [--only=p390|d1440]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), 'shots', 'strihy'); fs.mkdirSync(OUT, { recursive: true });
const CUTS = (opt.cuts || 'rohozka,cakaren,sala-rano,kava').split(','); const MIX = (opt.mixes || '0.3,0.5,0.7').split(',').map(Number);
const DEVS = { p390: { vp: { width: 390, height: 844 }, dsf: 3, mob: true }, d1440: { vp: { width: 1440, height: 900 }, dsf: 1, mob: false } };
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [dn, D] of Object.entries(DEVS)) {
  if (opt.only && opt.only !== dn) continue;
  const ctx = await browser.newContext({ viewport: D.vp, deviceScaleFactor: D.dsf, isMobile: D.mob, hasTouch: D.mob, locale: 'sk-SK' });
  const p = await ctx.newPage();
  await p.route('**/assets/film.js*', async (route) => { const r = await route.fetch(); const body = (await r.text()).replace('if (dpr > DPR_MIN) { dpr = Math.max(', 'if (false && dpr > DPR_MIN) { dpr = Math.max('); await route.fulfill({ response: r, body, headers: { ...r.headers(), 'content-type': 'text/javascript' } }); });
  await p.goto(`http://127.0.0.1:${opt.port || 8211}/barbershop-30/?film=on&uvod=off`, { waitUntil: 'load', timeout: 120000 });
  if (D.mob) await p.touchscreen.tap(5, 400); else await p.mouse.move(100, 100);
  await p.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 120000 });
  for (const c of CUTS) {
    for (const m of MIX) {
      const ok = await p.evaluate(([c, m]) => window.BS30_FILM.cutFreeze(c, m) || window.BS30_FILM.cutFreeze(c + '-video', m), [c, m]);
      if (!ok) { console.log(dn, c, 'strih nie je'); break; }
      await p.waitForFunction(() => { const s = window.BS30_FILM.state; return s.ready.filter((r) => r.ready).length >= 2 && !s.ready.some((r) => r.loading); }, null, { timeout: 60000 }).catch(() => {});
      await p.waitForTimeout(3500);
      const st = await p.evaluate(() => { const s = window.BS30_FILM.state; return { cur: s.current, mix: +(s.mix || 0).toFixed(2), cut: s.cut }; });
      const f = path.join(OUT, `${dn}-${c}-m${String(Math.round(m * 100)).padStart(3, '0')}.jpg`);
      await p.screenshot({ path: f, type: 'jpeg', quality: 88, timeout: 120000 });
      console.log(dn, c, m, JSON.stringify(st));
    }
  }
  await p.evaluate(() => window.BS30_FILM.cutFreeze(null));
  await ctx.close();
}
await browser.close();
