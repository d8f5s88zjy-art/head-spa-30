#!/usr/bin/env node
// Prvý dojem: prológ (fasáda → dvere → rohožka) na telefóne 390×844 DPR 3 a počítači 1440×900, zastavený
// na polohách 0 / 0,35 / 0,5 / 0,65 / 1 (BS30_FILM.proFreeze), plus prvý obraz pred filmom (záloha) a ?film=off.
//   node uvod.mjs [--port=8211] [--only=p390|d1440]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const PORT = opt.port || 8211;
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), 'shots', 'uvod2');
fs.mkdirSync(OUT, { recursive: true });
const DEVS = { p390: { vp: { width: 390, height: 844 }, dsf: 3, mob: true }, d1440: { vp: { width: 1440, height: 900 }, dsf: 1, mob: false } };
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [name, D] of Object.entries(DEVS)) {
  if (opt.only && opt.only !== name) continue;
  const ctx = await browser.newContext({ viewport: D.vp, deviceScaleFactor: D.dsf, isMobile: D.mob, hasTouch: D.mob, colorScheme: 'dark', locale: 'sk-SK' });
  const page = await ctx.newPage();
  await page.route('**/assets/film.js*', async (route) => {
    const r = await route.fetch(); const body = (await r.text()).replace('if (dpr > DPR_MIN) { dpr = Math.max(', 'if (false && dpr > DPR_MIN) { dpr = Math.max(');
    await route.fulfill({ response: r, body, headers: { ...r.headers(), 'content-type': 'text/javascript' } });
  });
  await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/?uvod=znova&film=on`, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  // prvý obraz (záloha fasády, film ešte nebeží): to vidí každý návštevník ako prvé
  await page.screenshot({ path: path.join(OUT, `${name}-0-zaloha.jpg`), type: 'jpeg', quality: 90, timeout: 120000 });
  // zastav prológ hneď na začiatku, kým sa film rozbehne
  await page.waitForFunction(() => window.BS30_FILM && window.BS30_FILM.state && window.BS30_FILM.state.on && window.BS30_FILM.state.pro, null, { timeout: 120000 }).catch(() => console.log(name, 'prológ nebeží'));
  await page.evaluate(() => window.BS30_FILM.proFreeze(0));
  for (const s of [0, 0.35, 0.5, 0.65, 1]) {
    await page.evaluate((s) => window.BS30_FILM.proFreeze(s), s);
    await page.waitForFunction(() => { const st = window.BS30_FILM.state; return st.ready.filter((r) => r.ready).length >= 2; }, null, { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);
    const st = await page.evaluate(() => { const s = window.BS30_FILM.state; return { S: +s.S.toFixed(3), mix: s.mix, cur: s.current, dpr: s.dpr, pro: s.pro }; });
    const cls = await page.evaluate(() => document.documentElement.className);
    await page.screenshot({ path: path.join(OUT, `${name}-s${String(Math.round(s * 100)).padStart(3, '0')}.jpg`), type: 'jpeg', quality: 90, timeout: 120000 });
    console.log(name, s, JSON.stringify(st), cls);
  }
  await page.evaluate(() => window.BS30_FILM.proFreeze(null));
  await ctx.close();
  // pokojná verzia: prvý obraz bez filmu
  const c2 = await browser.newContext({ viewport: D.vp, deviceScaleFactor: D.dsf, isMobile: D.mob, hasTouch: D.mob, colorScheme: 'dark', locale: 'sk-SK' });
  const p2 = await c2.newPage();
  await p2.goto(`http://127.0.0.1:${PORT}/barbershop-30/?film=off`, { waitUntil: 'load', timeout: 120000 });
  await p2.evaluate(() => document.fonts.ready); await p2.waitForTimeout(2500);
  await p2.screenshot({ path: path.join(OUT, `${name}-filmoff.jpg`), type: 'jpeg', quality: 90, timeout: 120000 });
  await c2.close();
}
await browser.close();
