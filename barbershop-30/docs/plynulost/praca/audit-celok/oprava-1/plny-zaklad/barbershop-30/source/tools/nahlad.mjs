#!/usr/bin/env node
// Náhľad na kontrolu: kľúčové miesta stránky (úvod, okraj pásu tímu, cenník, galéria, rezervácia) na 360, 390, 430 px,
// tablete a počítači, plus úvod pri obmedzení pohybu; overí tel: a Objednať sa na každej šírke a uloží prehľady.
//   node source/tools/nahlad.mjs [--out=dir] [--q=uvod=off&film=off&hudba=off]
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { startStaticServer, PRESETS } = await import(path.join(SITE, 'source', 'shot.mjs'));
const require = createRequire(path.join(SITE, 'source', 'shot.mjs'));
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true]; }));
const OUT = path.resolve(opt.out || path.join(SITE, 'docs', 'screenshots', 'nahlad'));
fs.mkdirSync(OUT, { recursive: true });
const Q = opt.q || 'uvod=off&film=off&hudba=off';
const SIRKY = [[360, 780], [390, 844], [430, 932], [768, 1024], [1440, 900]];
const MIESTA = [
  ['uvod', () => 0],
  ['tim', () => document.querySelector('.band-team').getBoundingClientRect().top + scrollY - innerHeight * 0.45],
  ['cennik', () => document.querySelector('.price-list').getBoundingClientRect().top + scrollY - 80],
  ['galeria', () => document.querySelector('.band-gallery').getBoundingClientRect().top + scrollY - innerHeight * 0.2],
  ['rezervacia', () => document.querySelector('#rezervacia .film-shot').getBoundingClientRect().top + scrollY + innerHeight * 0.3],
];
let zle = 0;
const ok = (c, m) => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}`); if (!c) zle++; };
const srv = await startStaticServer(SITE);
const browser = await chromium.launch(PRESETS[0]);
for (const [w, h] of SIRKY) {
  const mobil = w < 700;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobil ? 2 : 1, isMobile: mobil, hasTouch: mobil, colorScheme: 'dark', locale: 'sk-SK' });
  const page = await ctx.newPage();
  await page.goto(`${srv.origin}/index.html?${Q}`, { waitUntil: 'load' });
  await page.waitForTimeout(1600);
  const subory = [];
  for (const [meno, kde] of MIESTA) {
    const y = await page.evaluate(`(${kde})()`);
    await page.evaluate((y) => window.scrollTo({ top: Math.max(0, y), behavior: 'instant' }), y);
    await page.waitForTimeout(1300);                      // strihy a odhalenia dobehnú
    const f = path.join(OUT, `w${w}-${meno}.png`);
    await page.screenshot({ path: f });
    subory.push(f);
  }
  const info = await page.evaluate(() => ({
    over: document.documentElement.scrollWidth - innerWidth,
    tel: [...document.querySelectorAll('a[href^="tel:"]')].every((a) => a.getAttribute('href') === 'tel:+421951267203'),
    telN: document.querySelectorAll('a[href^="tel:"]').length,
    obj: [...document.querySelectorAll('a')].filter((a) => /Objednať sa/.test(a.textContent)).every((a) => a.href === 'https://www.barbershop30.sk/rezervacia'),
    potvrd: [...document.querySelectorAll('a[href^="tel:"]')].some((a) => /Zavolať a potvrdiť termín/.test(a.textContent + (a.getAttribute('aria-label') || ''))),
  }));
  ok(info.over <= 0, `w${w}: žiadne vodorovné pretekanie (${info.over}px)`);
  ok(info.tel && info.telN >= 4, `w${w}: všetky tel: odkazy na +421951267203 (${info.telN})`);
  ok(info.obj, `w${w}: všetky „Objednať sa“ vedú do rezervačného systému`);
  ok(info.potvrd, `w${w}: „Zavolať a potvrdiť termín“ je na stránke`);
  // úvod: obe tlačidlá sú celé v prvej obrazovke
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(400);
  const cta = await page.evaluate(() => [...document.querySelectorAll('#uvod .title-actions .btn')].map((b) => { const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.height >= 44; }));
  ok(cta.length === 2 && cta.every(Boolean), `w${w}: v úvode sú Objednať sa aj Zavolať a potvrdiť termín celé na prvej obrazovke, výška aspoň 44 px`);
  execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
out = sys.argv[1]; fs = sys.argv[2:]
ims = [Image.open(f).convert('RGB') for f in fs]
th = 640; ims = [i.resize((round(i.width * th / i.height), th)) for i in ims]
W = sum(i.width for i in ims) + 10 * (len(ims) + 1); c = Image.new('RGB', (W, th + 20), (255, 255, 255)); x = 10
for i in ims: c.paste(i, (x, 10)); x += i.width + 10
c.save(out, quality=82)`, path.join(OUT, `prehlad-w${w}.jpg`), ...subory]);
  await ctx.close();
}
// obmedzený pohyb: úvod je hneď celý, odhalenia nič neskryjú
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce', locale: 'sk-SK' });
  const page = await ctx.newPage();
  await page.goto(`${srv.origin}/index.html?uvod=off&hudba=off`, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'w390-obmedzeny-pohyb.png') });
  const r = await page.evaluate(() => ({ js: document.documentElement.classList.contains('js-odhal'), motion: document.documentElement.dataset.motion, skryte: [...document.querySelectorAll('.odhal')].filter((e) => getComputedStyle(e).clipPath !== 'none').length }));
  ok(!r.js && r.motion === 'off' && r.skryte === 0, `obmedzený pohyb: žiadne odhalenia, nič skryté (${JSON.stringify(r)})`);
  await ctx.close();
}
// bez skriptu: obsah a tlačidlá sú vidieť
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false, locale: 'sk-SK' });
  const page = await ctx.newPage();
  await page.goto(`${srv.origin}/index.html`, { waitUntil: 'load' });
  const r = await page.evaluate(() => ({ skryte: [...document.querySelectorAll('.odhal')].filter((e) => getComputedStyle(e).clipPath !== 'none').length, cta: [...document.querySelectorAll('#uvod .title-actions .btn')].map((b) => getComputedStyle(b).visibility) }));
  ok(r.skryte === 0 && r.cta.length === 2 && r.cta.every((v) => v === 'visible'), `bez skriptu: fotky aj tlačidlá úvodu vidieť (${JSON.stringify(r)})`);
  await page.screenshot({ path: path.join(OUT, 'w390-bez-skriptu.png') });
  await ctx.close();
}
await browser.close();
srv.close && srv.close();
console.log(zle ? `${zle} FAIL` : 'všetko OK');
process.exit(zle ? 1 : 0);
