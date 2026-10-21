// Funkčná kontrola L6 (staviteľ B), bez časových meraní: node kontrola-L6.mjs <port> <out-dir>
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [port, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const base = `http://127.0.0.1:${port}/barbershop-30/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// posuny rozloženia (CLS) a počet naraz hrajúcich videí v každej snímke
const HOOK = `(() => { window.__ls = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__ls.push(+e.value.toFixed(4)); })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  window.__maxPlay = 0; const f = () => { const n = [...document.querySelectorAll('video')].filter((v) => !v.paused).length; if (n > window.__maxPlay) window.__maxPlay = n; requestAnimationFrame(f); }; requestAnimationFrame(f); })();`;
const TEL = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const res = {};
const stav = (page) => page.evaluate(() => {
  const v = document.querySelector('.film-loop'); const sh = v && v.closest('.film-shot');
  return v ? { near: sh.classList.contains('is-near'), shown: sh.classList.contains('is-shown'), ready: v.classList.contains('is-ready'), poster: v.poster.split('/').pop(), src: v.currentSrc.split('/').pop() || v.src.split('/').pop(),
    paused: v.paused, t: +v.currentTime.toFixed(2), op: getComputedStyle(v).opacity, disp: getComputedStyle(sh.querySelector('.film-still')).display, preload: v.getAttribute('preload'),
    box: (() => { const r = v.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); })(), y: Math.round(scrollY) } : null;
});
const vreq = (reqs) => reqs.filter((u) => /tim-slucka/.test(u));
async function go(page, sel, off) { await page.evaluate(([sel, off]) => { const e = document.querySelector(sel); scrollTo({ top: e.getBoundingClientRect().top + scrollY + off * innerHeight, behavior: 'instant' }); }, [sel, off]); await sleep(900); }
try {
  {
    const ctx = await browser.newContext(TEL); await ctx.addInitScript(HOOK);
    const page = await ctx.newPage(); const reqs = [], errs = [];
    page.on('request', (r) => reqs.push(r.url().replace(base, ''))); page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(base, { waitUntil: 'load' }); await sleep(1500);
    res.typ = await page.evaluate(() => { const t = document.createElement('video'); return { mp4: t.canPlayType('video/mp4; codecs="avc1.640028"'), webm: t.canPlayType('video/webm; codecs="vp9"') }; });
    res.start = { cls: await page.evaluate(() => document.documentElement.className), loops: await page.evaluate(() => document.querySelectorAll('.film-loop').length), stav: await stav(page), req: vreq(reqs) };
    // karta pred Tímom (Čakáreň): záber Tím je v okolí -> plagát áno, video sa ešte nesťahuje
    await go(page, '[data-shot="cakaren"]', 0.3);
    res.pred = { stav: await stav(page), req: vreq(reqs) };
    // Tím: kotva cez celé okno, záloha zobrazená -> hrá
    await go(page, '[data-shot="sala-rano"]', 0.35);
    const s1 = await stav(page); await sleep(1200); const s2 = await stav(page);
    res.tim = { s1, s2, ide: s2.t > s1.t, req: vreq(reqs) };
    await page.screenshot({ path: `${out}/tim-hra.png` });
    // pás tímu (kotva pod 60 % okna) -> stojí
    await go(page, '.band-team', 0.1);
    res.pas = { stav: await stav(page) };
    // ďalšia karta (Kreslo) zakryje zábery -> stojí; späť na Čakáreň -> stojí
    await go(page, '[data-shot="kreslo-stred"]', 0.4);
    res.kreslo = { stav: await stav(page) };
    await go(page, '[data-shot="cakaren"]', 0.3);
    res.spat = { stav: await stav(page) };
    await go(page, '[data-shot="sala-rano"]', 0.35); await sleep(600);
    res.znova = { stav: await stav(page) };
    res.cls = await page.evaluate(() => window.__ls); res.maxPlay = await page.evaluate(() => window.__maxPlay);
    res.errs = errs;
    await ctx.close();
  }
  // úsporný režim: play() odmietnuté -> ostáva plagát, bez chýb
  {
    const ctx = await browser.newContext(TEL);
    await ctx.addInitScript(() => { HTMLMediaElement.prototype.play = function () { return Promise.reject(new DOMException('NotAllowedError', 'NotAllowedError')); }; });
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(base, { waitUntil: 'load' }); await sleep(800);
    await go(page, '[data-shot="cakaren"]', 0.3);
    await go(page, '[data-shot="sala-rano"]', 0.35); await sleep(800);
    res.usporny = { stav: await stav(page), errs };
    await page.screenshot({ path: `${out}/tim-plagat.png` });
    await ctx.close();
  }
  // obmedzený pohyb, ?film=on na telefóne, počítač: žiadna slučka
  for (const [name, opt, q] of [['reduced', { ...TEL, reducedMotion: 'reduce' }, ''], ['filmOn', TEL, '?film=on'], ['pc', { viewport: { width: 1440, height: 900 } }, ''], ['pc600', { viewport: { width: 600, height: 900 } }, '']]) {
    const ctx = await browser.newContext(opt); const page = await ctx.newPage(); const reqs = [];
    page.on('request', (r) => reqs.push(r.url().replace(base, '')));
    await page.goto(base + q, { waitUntil: 'load' }); await sleep(800);
    res[name] = { cls: await page.evaluate(() => document.documentElement.className), loops: await page.evaluate(() => document.querySelectorAll('.film-loop').length), req: vreq(reqs) };
    await ctx.close();
  }
} finally { await browser.close(); }
fs.writeFileSync(`${out}/kontrola-L6.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
