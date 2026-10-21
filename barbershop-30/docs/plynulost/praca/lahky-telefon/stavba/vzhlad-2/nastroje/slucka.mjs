// Slučka Tím: skrol prstom do záberu Tím, zastavenie, screencast 3 s; zapisuje čas štartu videa a snímky (skok obrazu pri štarte?).
// node slucka.mjs <port> <w>x<h> <outdir>
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [port, size, OUT] = process.argv.slice(2); const [W, H] = size.split('x').map(Number);
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
await page.goto(`http://127.0.0.1:${port}/barbershop-30/`, { waitUntil: 'load' });
await page.waitForTimeout(1500);
const cieľ = await page.evaluate(() => { const el = document.querySelector('#tim .film-shot'); const r = el.getBoundingClientRect(); return Math.round(r.top + scrollY + (r.height - innerHeight) * 0.3); });
// ťahy prstom až k cieľu
for (let k = 0; k < 20; k++) { const y = await page.evaluate(() => scrollY); const d = Math.min(cieľ - y, H * 0.7); if (d < 30) break;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: W / 2, y: H * 0.85 }] });
  for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: W / 2, y: H * 0.85 - d * i / 12 }] }); await new Promise((r) => setTimeout(r, 16)); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(120); }
const frames = [];
cdp.on('Page.screencastFrame', (f) => { const file = path.join(OUT, `f${String(frames.length).padStart(4, '0')}.jpg`); fs.writeFileSync(file, Buffer.from(f.data, 'base64')); frames.push({ file, ts: f.metadata.timestamp * 1000 }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
await page.evaluate(() => { window.__vs = []; const v = document.querySelector('#tim video'); if (v) { for (const e of ['play', 'playing', 'loadeddata']) v.addEventListener(e, () => window.__vs.push([e, Date.now()])); } });
const t0 = Date.now();
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: W, maxHeight: H });
await page.waitForTimeout(3000);
await cdp.send('Page.stopScreencast');
const info = await page.evaluate(() => { const v = document.querySelector('#tim video'); return { y: Math.round(scrollY), vs: window.__vs, poster: v && v.getAttribute('poster'), paused: v && v.paused, t: v && v.currentTime, src: v && v.currentSrc.split('/').pop(), vop: v && getComputedStyle(v).opacity }; });
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ W, H, t0, frames, info }, null, 1));
console.log(JSON.stringify({ ...info, vs: info.vs.map(([e, t]) => [e, t - t0]), frames: frames.length }));
await browser.close();
