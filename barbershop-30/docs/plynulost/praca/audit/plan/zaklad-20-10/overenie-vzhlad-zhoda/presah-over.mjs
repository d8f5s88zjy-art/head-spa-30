#!/usr/bin/env node
// Overenie rizika opravy VZ-03/VZ-08 (presah fotiek na telefóne 1,12 namiesto 1,24): film sa v teste kreslí s
// fialovou farbou mazania (0xff00ff), takže každé miesto, kde kamera vidí za okraj fotky, je na snímke fialové.
// Pre každý strih telefónu sa prechod zastaví (cutFreeze) na niekoľkých miestach a spočíta sa podiel fialových pixelov.
//   node presah-over.mjs --over=0.12|0.06   (0.12 = dnešný stav, 0.06 = navrhovaná oprava)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const OVER = opt.over || '0.12';
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'snimky', `presah-${OVER}`); fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.route('**/assets/film.js*', async (route) => {
  const r = await route.fetch(); let body = await r.text(); const n0 = body.length;
  body = body.replace('const OVER = 0.12;', `const OVER = ${OVER};`)
    .replace('renderer.setClearColor(0x0e0d0c, 1);', 'renderer.setClearColor(0xff00ff, 1);')
    .replace('if (dpr > DPR_MIN) { dpr = Math.max(', 'if (false && dpr > DPR_MIN) { dpr = Math.max(');
  if (body.length === n0) console.error('POZOR: náhrada nenájdená');
  await route.fulfill({ response: r, body, headers: { ...r.headers(), 'content-type': 'text/javascript' } });
});
await page.goto('http://127.0.0.1:8581/barbershop-30/?film=on&uvod=off', { waitUntil: 'load' });
// bez textu, lišty a vinetácie stránky: na snímke je len plátno filmu
await page.addStyleTag({ content: 'body > *:not(canvas.film-canvas){visibility:hidden!important} body::after{display:none!important}' });
await page.touchscreen.tap(5, 400);
await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 120000 });
const shots = await page.evaluate(() => BS30_FILM.state.ready.map((r) => r.shot));
const rows = [];
const MIX = opt.mix ? opt.mix.split(',').map(Number) : [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1];
for (const name of shots.slice(1, -1).filter((n) => !opt.len || new RegExp(opt.len).test(n))) {
  for (const m of MIX) {
    await page.evaluate(([n, m]) => BS30_FILM.cutFreeze(n, m), [name, m]);
    // oba zábery prechodu načítané a nakreslené
    await page.waitForFunction(([m]) => { const s = BS30_FILM.state; const k = Math.floor(s.S); const a = s.ready[k], b = s.ready[k + 1]; return a && a.ready && (!b || b.ready) && (m <= 0 || m >= 1 || Math.abs(s.mix - m) < 0.03); }, [m], { timeout: 150000, polling: 300 }).catch(() => console.error('  neustálené', name, m));
    await page.waitForTimeout(900);
    const f = path.join(OUT, `${name}-${String(Math.round(m * 100)).padStart(3, '0')}.png`);
    await page.screenshot({ path: f, timeout: 120000 });
    rows.push({ name, m, file: f });
  }
  await page.evaluate(() => BS30_FILM.cutFreeze(null));
  console.log('hotovo', name);
}
fs.writeFileSync(path.join(OUT, 'presah.json'), JSON.stringify(rows, null, 1));
await browser.close();
