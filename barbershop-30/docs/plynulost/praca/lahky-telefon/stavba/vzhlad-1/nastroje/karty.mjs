// Snímky titulných kariet (rovnaké polohy ako source/tools/karty-shot.mjs: tretina pripnutia) pre porovnanie stromov.
// node karty.mjs <port> <query> <w>x<h> <mob 0|1> <dsf> <outprefix> [indexy čiarkou] [film 0|1]
import fs from 'node:fs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [port, Q, size, mob, dsf, OUT, idx, film] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const url = `http://127.0.0.1:${port}/barbershop-30/${Q}`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: +dsf, isMobile: mob === '1', hasTouch: mob === '1', colorScheme: 'dark', locale: 'sk-SK' });
await ctx.addInitScript(`(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (k, ...a) { const c = g.call(this, k, ...a); if (c && /webgl/.test(k)) window.__gl = (window.__gl || 0) + 1; return c; }; })();`);
const page = await ctx.newPage();
const req = []; page.on('request', (r) => req.push(r.url()));
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts && document.fonts.ready);
let worldIn = null;
if (film === '1') worldIn = await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 60000 }).then(() => true).catch(() => false);
await page.waitForTimeout(1000);
const n = await page.evaluate(() => document.querySelectorAll('.film-shot').length);
const zoznam = idx ? idx.split(',').map(Number) : [...Array(n).keys()];
const out = [];
for (const i of zoznam) {
  const a = await page.evaluate((i) => { const el = document.querySelectorAll('.film-shot')[i]; const r = el.getBoundingClientRect(); const long = el.classList.contains('title-long'); const free = r.height - (long ? innerHeight : 0);
    return { shot: el.dataset.shot, y: i === 0 ? 0 : Math.round(r.top + scrollY + free * 0.35) }; }, i);
  await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, a.y);
  await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(film === '1' ? 2500 : 1800);
  const f = `${OUT}-${String(i).padStart(2, '0')}-${a.shot}.jpg`;
  await page.screenshot({ path: f, type: 'jpeg', quality: 85, scale: 'css' });
  const st = await page.evaluate(() => { const v = (el) => el ? [el.querySelector('.title, h2, h1')?.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)] : null;
    const shown = [...document.querySelectorAll('.film-shot.is-title .film-still')].filter((s) => getComputedStyle(s).display !== 'none' && +getComputedStyle(s).opacity > 0.5).map((s) => [s.closest('.film-shot').dataset.shot, (s.querySelector('img')?.currentSrc || '').split('/').pop()]);
    const fs = window.BS30_FILM && window.BS30_FILM.state; return { y: Math.round(scrollY), shown, film: fs ? { S: +(fs.S || 0).toFixed(2), cur: fs.current } : null }; });
  out.push({ i, ...a, f, ...st });
  console.log(i, a.shot, JSON.stringify(st));
}
const cls = await page.evaluate(() => document.documentElement.className);
const gl = await page.evaluate(() => window.__gl || 0);
const filmReq = req.filter((u) => /three|film\.js|film-worker|\/seq\/|hlbka/.test(u)).map((u) => u.split('/barbershop-30/')[1]);
fs.writeFileSync(`${OUT}.json`, JSON.stringify({ url, W, H, cls, worldIn, gl, filmReq: filmReq.slice(0, 20), filmReqN: filmReq.length, errs, out }, null, 1));
console.log(JSON.stringify({ cls, worldIn, gl, filmReqN: filmReq.length, errs }));
await browser.close();
