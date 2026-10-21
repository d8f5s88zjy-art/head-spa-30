// Krátka kontrola staviteľa A: node kontrola.mjs <port> <out-dir> [faza]
// telefón 390×844 DPR3 dotyk (triedy, WebGL kontexty, požiadavky, pätička, lišta), počítač 1440×900 a 600×900 s myšou.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [port, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const base = `http://127.0.0.1:${port}/barbershop-30/`;
const HOOK = `(() => { window.__gl = 0; const g = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/i.test(String(t))) window.__gl++; return g.call(this, t, ...a); }; })();`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const res = {};
async function open(name, ctxOpt, q = '') {
  const ctx = await browser.newContext({ colorScheme: 'dark', ...ctxOpt });
  await ctx.addInitScript(HOOK);
  const page = await ctx.newPage();
  const reqs = [], errs = [];
  page.on('request', (r) => reqs.push(r.url().replace(base, '')));
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const first = [];
  // stav po prvom vykreslení (triedy, viditeľnosť nadpisu a fotky úvodu)
  await page.goto(base + q, { waitUntil: 'commit' });
  await page.waitForFunction(() => document.querySelector('.title-actions'), null, { timeout: 30000 });
  const f0 = await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => {
    const op = (s) => { const el = document.querySelector(s); return el ? +getComputedStyle(el).opacity : null; };
    r({ cls: document.documentElement.className, h1: op('.title-hero h1 .w'), act: op('.title-hero .title-actions'), still: op('#uvod .film-still') });
  })));
  await page.waitForLoadState('load');
  await page.waitForTimeout(2500);
  const st = await page.evaluate(() => ({ cls: document.documentElement.className, gl: window.__gl, film: !!window.BS30_FILM,
    near: [...document.querySelectorAll('.film-shot.is-near')].map((e) => e.dataset.shot),
    shown: [...document.querySelectorAll('.film-still')].filter((e) => getComputedStyle(e).display !== 'none').length,
    uvod: (document.querySelector('#uvod .film-still img') || {}).currentSrc?.split('/').pop() }));
  return { ctx, page, reqs, errs, f0, st };
}
// telefón
{
  const { ctx, page, reqs, errs, f0, st } = await open('tel', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const bad = reqs.filter((u) => /three\.module|film\.js|film-worker|\/seq\/|hlbka|tim-slucka/.test(u));
  // koniec stránky: pätička, lišta
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.evaluate(() => scrollTo(0, document.scrollingElement.scrollHeight));
  await page.waitForTimeout(1200);
  const end = await page.evaluate(() => { const f = document.querySelector('.site-footer'), h = document.querySelector('.site-header');
    return { rezerva: Math.round(document.scrollingElement.scrollHeight - (f.getBoundingClientRect().bottom + scrollY)), lista: getComputedStyle(h).backgroundColor,
      scrolled: h.classList.contains('is-scrolled'), pad: getComputedStyle(f).paddingBottom, tien: getComputedStyle(f).boxShadow, bodyPad: getComputedStyle(document.body).paddingBottom }; });
  await page.screenshot({ path: `${out}/tel-koniec.png` });
  res.telefon = { prvySnimok: f0, poNacitani: st, zakazanePoziadavky: bad, pocetPoziadaviek: reqs.length, chyby: errs, koniec: end };
  await ctx.close();
}
// počítač 1440×900 a úzke okno s myšou 600×900 (bez ?film=on: v kontajneri softvérová grafika → world-frame; s ?film=on film beží)
for (const [name, vp, q] of [['pc', { width: 1440, height: 900 }, ''], ['pc-film', { width: 1440, height: 900 }, '?film=on'], ['uzke', { width: 600, height: 900 }, '']]) {
  const { ctx, page, reqs, errs, f0, st } = await open(name, { viewport: vp }, q);
  let worldIn = null;
  if (q) { await page.mouse.move(300, 300); await page.mouse.wheel(0, 10); worldIn = await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 60000 }).then(() => true, () => false); }
  const end = await page.evaluate(() => { const h = document.querySelector('.site-header'); scrollTo(0, 400); return null; });
  await page.waitForTimeout(800);
  const lista = await page.evaluate(() => { const h = document.querySelector('.site-header'); return { bg: getComputedStyle(h).backgroundColor, bf: getComputedStyle(h).backdropFilter, tien: getComputedStyle(document.querySelector('.site-footer')).boxShadow, bodyPad: getComputedStyle(document.body).paddingBottom }; });
  res[name] = { prvySnimok: f0.cls, poNacitani: st, worldIn, gl: await page.evaluate(() => window.__gl), threeJs: reqs.some((u) => /three\.module/.test(u)), filmJs: reqs.some((u) => /film\.js/.test(u)), lista, chyby: errs };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(res, null, 1));
