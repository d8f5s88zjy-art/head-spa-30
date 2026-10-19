#!/usr/bin/env node
// Odovzdanie zálohy filmu (html.world-in): jas obrazu v čase, keď statická záloha mizne a plátno filmu nabieha.
// Záznam obrazovky cez CDP Page.startScreencast (každá snímka s časom), čas pridania triedy world-in z MutationObserver.
//   node odovzdanie.mjs --dev=p390|d1440 [--port=8211] [--q=?film=on&uvod=off]
// Výstup: merania/odovzdanie-<dev>.json (čas od world-in v ms, priemerný jas stredu obrazu 0–255) a snímky shots/odovzdanie-<dev>/.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const dev = opt.dev || 'p390';
const D = { p390: { vp: { width: 390, height: 844 }, mob: true }, d1440: { vp: { width: 1440, height: 900 }, mob: false } }[dev];
const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, 'shots', `odovzdanie-${dev}`); fs.mkdirSync(OUT, { recursive: true });
const q = opt.q || '?film=on&uvod=off';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// DPR 1: rýchlejšie softvérové kreslenie; prechody CSS idú v čase rovnako
const ctx = await browser.newContext({ viewport: D.vp, deviceScaleFactor: 1, isMobile: D.mob, hasTouch: D.mob, locale: 'sk-SK' });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__wi = 0; window.__op = [];
  const smp = () => {
    const st = document.querySelector('.film-shot.is-title.is-shown .film-still, .film-shot[data-pro] .film-still');
    const cv = document.querySelector('.film-canvas');
    if (st || cv) window.__op.push([Date.now(), st ? +getComputedStyle(st).opacity : null, cv ? +getComputedStyle(cv).opacity : null, st ? getComputedStyle(st).visibility : '']);
    requestAnimationFrame(smp);
  };
  requestAnimationFrame(smp);
  new MutationObserver(() => { if (!window.__wi && document.documentElement.classList.contains('world-in')) window.__wi = Date.now(); })
    .observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });   // <html> pri spustení ešte nemusí byť
});
await page.goto(`http://127.0.0.1:${opt.port || 8211}/barbershop-30/${q}`, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter((i) => i.getBoundingClientRect().top < innerHeight && i.offsetParent).map((i) => i.decode().catch(() => {}))); });
await page.waitForTimeout(800);
const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', async (f) => {
  frames.push({ t: f.metadata.timestamp * 1000, data: f.data });
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 });
await page.waitForTimeout(500);
// pohyb návštevníka: film bez prológu čaká naň
if (D.mob) await page.touchscreen.tap(5, Math.round(D.vp.height * 0.5)); else await page.mouse.move(200, 300);
await page.waitForFunction(() => window.__wi > 0, null, { timeout: 120000 }).catch(() => console.error('world-in neprišlo'));
await page.waitForTimeout(2500);
await cdp.send('Page.stopScreencast');
const wi = await page.evaluate(() => window.__wi);
const op = await page.evaluate(() => window.__op);
await browser.close();
// jas: stred obrazu (30–70 % šírky, 15–45 % výšky: fotka bez textu karty a lišty)
const { execFileSync } = await import('node:child_process');
const rows = [];
let k = 0;
for (const f of frames) {
  const p = path.join(OUT, `f${String(k).padStart(3, '0')}.jpg`);
  fs.writeFileSync(p, Buffer.from(f.data, 'base64'));
  rows.push({ ms: Math.round(f.t - wi), file: path.basename(p) });
  k++;
}
const py = `
import sys, json
from PIL import Image, ImageStat
rows = json.load(open(sys.argv[1]))
for r in rows:
    im = Image.open(sys.argv[2] + '/' + r['file']).convert('L'); W, H = im.size
    r['jas'] = round(ImageStat.Stat(im.crop((int(W*.3), int(H*.15), int(W*.7), int(H*.45)))).mean[0], 1)
print(json.dumps(rows))
`;
const tmp = path.join(OUT, 'rows.json'); fs.writeFileSync(tmp, JSON.stringify(rows));
const res = JSON.parse(execFileSync('python3', ['-I', '-c', py, tmp, OUT]).toString());
const base = res.filter((r) => r.ms < 0).slice(-5);
const j0 = base.reduce((a, r) => a + r.jas, 0) / Math.max(1, base.length);
const after = res.filter((r) => r.ms >= 0 && r.ms <= 2000);
const mn = after.reduce((m, r) => (r.jas < m.jas ? r : m), { jas: 999 });
const end = res.filter((r) => r.ms > 1500);
const j1 = end.reduce((a, r) => a + r.jas, 0) / Math.max(1, end.length);
// krytie zálohy a plátna (vypočítaný štýl v každej snímke) a z nich jas rovnakého obrazu: α_z + α_p·(1 − α_z)
const opr = op.filter((o) => o[0] - wi > -300 && o[0] - wi < 1600).map((o) => ({ ms: o[0] - wi, zaloha: o[3] === 'hidden' ? 0 : o[1], platno: o[2] })).map((o) => ({ ...o, jas: +((o.zaloha ?? 0) + (o.platno ?? 0) * (1 - (o.zaloha ?? 0))).toFixed(3) }));
const omn = opr.reduce((m, o) => (o.jas < m.jas ? o : m), { jas: 9 });
console.log('krytie: najnižší podiel jasu', omn.jas, 'v', omn.ms, 'ms po world-in; vzoriek', opr.length);
for (const o of opr.filter((_, i) => i % 3 === 0)) console.log('  ', String(o.ms).padStart(5), 'záloha', o.zaloha, 'plátno', o.platno, 'jas', o.jas);
fs.writeFileSync(path.join(HERE, 'merania', `odovzdanie-${dev}.json`), JSON.stringify({ dev, q, krytie: opr, krytieMin: omn, jasPred: +j0.toFixed(1), jasPo: +j1.toFixed(1), min: mn, snimky: res.filter((r) => r.ms > -600 && r.ms < 2200) }, null, 1));
console.log(dev, 'jas pred', j0.toFixed(1), 'po', j1.toFixed(1), 'minimum', mn.jas, 'v', mn.ms, 'ms po world-in', `(${(mn.jas / Math.max(1, (j0 + j1) / 2) * 100).toFixed(0)} % priemeru pred/po)`, 'snímok', res.length);
for (const r of res.filter((r) => r.ms > -300 && r.ms < 1600)) console.log(String(r.ms).padStart(6), r.jas, r.file);
