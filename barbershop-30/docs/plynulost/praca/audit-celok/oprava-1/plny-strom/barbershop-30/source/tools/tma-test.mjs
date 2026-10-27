#!/usr/bin/env node
// Film nikdy neukáže čierne plátno: rýchly skrol a skoky cez menu na pomalej sieti (zábery sa ešte načítavajú).
//   node source/tools/tma-test.mjs [--only=desktop|mobile] [--out=dir]
// Po každom kroku snímka samotného filmu (stránka skrytá); viac ako 85 % takmer čiernych bodov (jas pod 22) = FAIL.
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { startStaticServer, PRESETS } = await import(path.join(SITE, 'source', 'shot.mjs'));
const require = createRequire(path.join(SITE, 'source', 'shot.mjs'));
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const OUT = path.resolve(opt.out || path.join(SITE, 'docs', 'screenshots', 'tma'));
fs.mkdirSync(OUT, { recursive: true });
const VIEW = { desktop: { width: 1440, height: 900, dpr: 1 }, mobile: { width: 390, height: 844, dpr: 2 } };
const hide = 'html{scroll-behavior:auto !important} body > *:not(.film-canvas){visibility:hidden !important} .film-place,.film-bars{display:none !important}';
const srv = await startStaticServer(SITE);
const browser = await chromium.launch(PRESETS[0]);
let failed = 0;
for (const kind of opt.only ? [opt.only] : ['desktop', 'mobile']) {
  const vp = VIEW[kind];
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, isMobile: kind === 'mobile', hasTouch: kind === 'mobile', colorScheme: 'dark' });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(`${srv.origin}/index.html?uvod=off&film=on`, { waitUntil: 'load', timeout: 60000 });
  await page.addStyleTag({ content: hide });
  await page.evaluate(() => { window.scrollTo(0, 10); window.scrollTo(0, 0); });
  await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  // pomalá sieť: ďalšie zábery sa načítavajú aj niekoľko sekúnd
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 250 * 1024, uploadThroughput: 64 * 1024 });
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  // rýchly skrol po krokoch, potom skoky tam a späť (ako cez menu)
  const steps = [];
  for (let i = 1; i <= 8; i++) steps.push(['skrol', Math.round((H * i) / 16)]);
  steps.push(['skok', H], ['skok', Math.round(H * 0.1)], ['skok', Math.round(H * 0.7)], ['skok', 0], ['skok', Math.round(H * 0.45)]);
  const files = [];
  for (const [i, [how, y]] of steps.entries()) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    for (const ms of [60, 400]) {
      await page.waitForTimeout(ms);
      const f = path.join(OUT, `${kind}-${String(i).padStart(2, '0')}-${how}-${ms}.png`);
      await page.screenshot({ path: f });
      files.push(f);
    }
  }
  const jas = execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image, ImageStat\nfor f in sys.argv[1:]: h = Image.open(f).convert("L").histogram(); print(round(100 * sum(h[:22]) / sum(h)))', ...files]).toString().trim().split('\n').map(Number);
  files.forEach((f, i) => {
    const bad = jas[i] > 85;
    if (bad) failed++;
    console.log(`${bad ? 'FAIL' : 'OK  '} ${kind} ${path.basename(f)} tma ${jas[i]} %`);
  });
  await ctx.close();
}
await browser.close();
srv.close && srv.close();
console.log(failed ? `${failed} čiernych snímok` : 'bez čiernej plochy');
process.exit(failed ? 1 : 0);
