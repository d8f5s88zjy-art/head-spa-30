#!/usr/bin/env node
// Ukážkové video na kontrolu (telefón 390 × 844): úvod, plynulý skrol cez tím, cenník, galériu a rezerváciu, potom
// AI asistent so skúšobným serverom (asistent/testy/mock-api.php v režime MOCK_DEMO a skúšobný kalendár). Pokojná verzia
// bez 3D filmu (laboratórny prehliadač nemá grafickú kartu). Výstup MP4 (H.264).
//   node source/tools/video-nahlad.mjs [--out=subor.mp4]
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASI = path.resolve(SITE, '..', 'asistent');
const { startStaticServer, PRESETS } = await import(path.join(SITE, 'source', 'shot.mjs'));
const require = createRequire(path.join(SITE, 'source', 'shot.mjs'));
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true]; }));
const OUT = path.resolve(opt.out || path.join(SITE, 'docs', 'screenshots', 'nahlad', 'telefon.mp4'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const srv = await startStaticServer(SITE);
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'vid-'));
fs.mkdirSync(path.join(T, 'kal'));
fs.writeFileSync(path.join(T, 'config.php'), `<?php return ['kluc' => 'sk-ant-test', 'db' => '${T}/a.sqlite', 'povody' => ['${srv.origin}'], 'cache_dir' => '${T}/kal', 'kalendar' => ['url' => 'http://127.0.0.1:8963', 'timeout' => 3.0]];`);
fs.writeFileSync(path.join(T, 'scen.json'), '{}');
const env = { ...process.env, MOCK_DEMO: '1', MOCK_LOG: path.join(T, 'api.log'), MOCK_SCEN: path.join(T, 'scen.json'), PHP_CLI_SERVER_WORKERS: '3' };
const deti = [
  spawn('php', ['-S', '127.0.0.1:8961', path.join(ASI, 'testy', 'mock-api.php')], { env, stdio: 'ignore' }),
  spawn('php', ['-S', '127.0.0.1:8963', path.join(ASI, 'testy', 'mock-rezervacie.php')], { env, stdio: 'ignore' }),
  spawn('php', ['-S', '127.0.0.1:8962', '-t', ASI], { env: { ...env, ANTHROPIC_BASE_URL: 'http://127.0.0.1:8961', ASISTENT_CONFIG: path.join(T, 'config.php') }, stdio: 'ignore' }),
];
await sleep(800);
const browser = await chromium.launch(PRESETS[0]);
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'sk-SK', colorScheme: 'dark', recordVideo: { dir: T, size: { width: 780, height: 1688 } } });
const page = await ctx.newPage();
await page.goto(`${srv.origin}/index.html?uvod=off&film=off&hudba=off&asistent=${encodeURIComponent('http://127.0.0.1:8962/api.php')}`, { waitUntil: 'load' });
await sleep(3200);                                                 // úvod: nadpis, riadok, tlačidlá
// plynulý skrol ako prstom: krok každú snímku s rozbehom a dobehom, na zaujímavých miestach pauza
const jazda = (ciel, ms) => page.evaluate(([ciel, ms]) => new Promise((ok) => {
  const y0 = scrollY, y1 = typeof ciel === 'number' ? ciel : document.querySelector(ciel).getBoundingClientRect().top + scrollY - innerHeight * 0.25, t0 = performance.now();
  const krok = (t) => { const x = Math.min(1, (t - t0) / ms), e = x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2; window.scrollTo({ top: y0 + (y1 - y0) * e, behavior: 'instant' }); x < 1 ? requestAnimationFrame(krok) : ok(); };
  requestAnimationFrame(krok);
}), [ciel, ms]);
await jazda('#vstup-dnu', 2600); await sleep(900);
await jazda('.band-team', 3200); await sleep(2200);              // linka strihu, portréty sa odhalia
await page.evaluate(() => { const g = document.querySelector('.team-grid'); g.scrollTo({ left: g.scrollWidth * 0.42, behavior: 'smooth' }); });
await sleep(1800);
await jazda('#sluzby', 3200); await sleep(1400);
await jazda('.price-list', 2200); await sleep(1600);
await jazda('.band-gallery', 3600); await sleep(2200);            // galéria: odhalenie maskou
await jazda('#rezervacia .title-card', 3600); await sleep(2200); // Objednať sa a Zavolať a potvrdiť termín
// AI asistent: návrh otázky na voľný termín u Adriána
await page.locator('.asi-btn').click();
await sleep(1400);
await page.locator('.asi-chips button', { hasText: 'Adrián' }).click();
await page.waitForFunction(() => document.querySelector('.asi-kal') && !document.querySelector('.asi-send').disabled, null, { timeout: 20000 });
await sleep(3500);
const video = page.video();
await ctx.close();
const webm = await video.path();
await browser.close();
deti.forEach((d) => d.kill());
srv.close && srv.close();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
// prvá pol sekunda je prázdne načítanie; H.264 pre telefóny, 30 snímok (záznam obrazovky laboratórneho prehliadača)
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '0.6', '-i', webm, '-vf', 'fps=30,scale=780:-2', '-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', OUT]);
fs.rmSync(T, { recursive: true, force: true });
console.log('video:', OUT, Math.round(fs.statSync(OUT).size / 1024) + ' kB');
process.exit(0);
