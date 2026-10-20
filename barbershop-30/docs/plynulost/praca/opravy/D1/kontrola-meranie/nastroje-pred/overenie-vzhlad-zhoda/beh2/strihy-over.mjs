#!/usr/bin/env node
// Overenie VZ-04: druh strihu, ktorý film naozaj kreslí (state.cut počas prechodu), telefón vs počítač.
//   node strihy-over.mjs --dev=p390|d1440
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const DEVS = { p390: { vp: { width: 390, height: 844 }, dsf: 3, mob: true }, d1440: { vp: { width: 1440, height: 900 }, dsf: 1, mob: false } };
const dn = opt.dev || 'p390', DEV = DEVS[dn];
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'snimky', `strihy-${dn}`); fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: DEV.vp, deviceScaleFactor: DEV.dsf, isMobile: DEV.mob, hasTouch: DEV.mob });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:8430/barbershop-30/?film=on&uvod=off', { waitUntil: 'load' });
if (DEV.mob) await page.touchscreen.tap(5, 400); else await page.mouse.move(200, 300);
await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 120000 });
const tab = await page.evaluate(() => BS30_FILM.cuts.map((c) => `${c.from}>${c.to} ${c.cut}`));
const out = { dev: dn, tabulka: tab, kreslene: [] };
for (const name of ['sala', 'cakaren']) {
  const shot = await page.evaluate((n) => BS30_FILM.state.ready.map((r) => r.shot).find((s) => s === n || s === n + '-m' || s === n + '-video'), name);
  await page.evaluate((s) => BS30_FILM.cutFreeze(s, 0.5), shot);
  await page.waitForFunction(() => { const st = BS30_FILM.state; return st.cut && Math.abs(st.mix - 0.5) < 0.05; }, null, { timeout: 150000, polling: 300 }).catch(() => {});
  await page.waitForTimeout(1500);
  const st = await page.evaluate(() => { const s = BS30_FILM.state; return { cut: s.cut, mix: s.mix }; });
  await page.screenshot({ path: path.join(OUT, `${name}-mix50.jpg`), type: 'jpeg', quality: 88, timeout: 120000 });
  out.kreslene.push({ from: name, ...st });
  console.log(name, JSON.stringify(st));
  await page.evaluate(() => BS30_FILM.cutFreeze(null));
}
console.log(JSON.stringify(tab));
fs.writeFileSync(path.join(OUT, 'strihy.json'), JSON.stringify(out, null, 1));
await browser.close();
