// Funkčná kontrola L5 (staviteľ B), bez časových meraní: node kontrola-L5.mjs <port> <out.json>
// telefón 390×844 @3 dotyk (lite): rozmazanie textu, lerp na dotyku, measure() pri lište Safari, lesk spodného tlačidla,
// atmosfera.js nie pri prvom švihu; počítač 1440×900 myš: lerp pri koliesku ostáva, atmosfera pri pohybe myši.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [port, out] = process.argv.slice(2);
const base = `http://127.0.0.1:${port}/barbershop-30/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// počítadlo getBoundingClientRect (measure() ho volá na všetkých sekciách a kartách) a zápisov --sp
const HOOK = `(() => { window.__gbcr = 0; const g = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function () { window.__gbcr++; return g.call(this); }; })();`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const res = {};
try {
  // ---------------- telefón
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  await ctx.addInitScript(HOOK);
  const page = await ctx.newPage();
  const reqs = [], errs = [];
  page.on('request', (r) => reqs.push({ u: r.url().replace(base, ''), t: Date.now() }));
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(base, { waitUntil: 'load' });
  await sleep(300);
  res.cls = await page.evaluate(() => document.documentElement.className);
  // 1) prvý švih hneď po načítaní (dotyk, CDP synthesizeScrollGesture): atmosfera.js sa počas neho nestiahne
  const cdp = await ctx.newCDPSession(page);
  const t0 = Date.now();
  await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -1500, speed: 2500, gestureSourceType: 'touch' });
  const t1 = Date.now();
  res.atmosferaPocasSvihu = reqs.filter((r) => /atmosfera/.test(r.u) && r.t >= t0 && r.t <= t1 + 50).map((r) => r.u);
  // 2) lerp na dotyku: hneď po dobehnutí švihu je stav (slučka) usadený bez ďalšieho dobiehania
  await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 10000 }).catch(() => {});
  // presnejšie: programový posun + jedna snímka -> karta má --o zodpovedajúce polohe (bez lerpu = už v prvej snímke)
  res.lerpDotyk = await page.evaluate(() => new Promise((r) => {
    const sh = [...document.querySelectorAll('.film-shot.is-title')][3];
    const top = sh.getBoundingClientRect().top + scrollY;
    // dotyk už bol (švih), takže lerp je vypnutý; posun do stredu karty
    scrollTo({ top: top + 200, behavior: 'instant' });
    let n = 0;
    const f = () => { n++; if (n < 3) { requestAnimationFrame(f); return; }
      r({ settled: window.__scrollSettled, o: sh.querySelector('.title-frame').style.getPropertyValue('--o') }); };
    requestAnimationFrame(f);
  }));
  // 3) lišta Safari: v Chromiu zmena okna mení aj svh (dĺžky kariet), na iPhone nie. Preto sa výška okna podvrhne
  //    (innerHeight) a pošle sa resize: dokument ostane rovnaký ako pri lište Safari. Ráta sa getBoundingClientRect.
  await sleep(500);
  const resizeH = (h) => page.evaluate((h) => new Promise((r) => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => h });
    const g0 = window.__gbcr; dispatchEvent(new Event('resize'));
    setTimeout(() => r(window.__gbcr - g0), 400);
  }), h);
  res.measure = { lista60: await resizeH(784), lista60spat: await resizeH(844), lista115: await resizeH(729), vyska150: await resizeH(694), spat150: await resizeH(844) };
  await page.evaluate(() => { delete window.innerHeight; });
  // 4) rozmazanie textu: žiadny filter na slovách nadpisov, krokoch ani v úvode (aj počas nástupu)
  res.filter = await page.evaluate(() => {
    const f = (sel) => [...document.querySelectorAll(sel)].map((e) => getComputedStyle(e).filter).filter((v) => v !== 'none');
    return { kw: f('.kin .kw'), steps: f('.steps li'), hero: f('.title-hero h1 .w') };
  });
  // nástup slova: posun najviac 24 px
  res.kwPosun = await page.evaluate(() => { const e = document.querySelector('.kin:not(.is-in) .kw'); return e ? getComputedStyle(e).transform : 'vsetky-is-in'; });
  // 5) lesk spodného tlačidla: raz po zobrazení, potom animation-name none
  await page.evaluate(() => { const s = [...document.querySelectorAll('.film-shot.is-title')][2]; scrollTo({ top: s.getBoundingClientRect().top + scrollY + 100, behavior: 'instant' }); });
  await sleep(300);
  const leskPred = await page.evaluate(() => { const c = document.getElementById('mobile-cta'); const a = getComputedStyle(c.querySelector('.btn-primary'), '::after'); return { hidden: c.classList.contains('is-hidden'), name: a.animationName, iter: a.animationIterationCount }; });
  await sleep(8500);   // oneskorenie 1,8 s + trvanie 6 s
  const leskPo = await page.evaluate(() => { const c = document.getElementById('mobile-cta'); const a = getComputedStyle(c.querySelector('.btn-primary'), '::after'); return { raz: c.classList.contains('lesk-raz'), name: a.animationName, anim: document.getAnimations().filter((x) => x.animationName === 'lesk' && x.effect?.target?.closest?.('#mobile-cta')).length }; });
  res.lesk = { leskPred, leskPo };
  // 6) atmosfera sa načíta v pokoji (nie pri švihu) a tlačidlo Hudba je v lište
  await page.waitForFunction(() => document.querySelector('.hudba'), null, { timeout: 15000 }).catch(() => {});
  res.atmosferaPotom = { req: reqs.filter((r) => /atmosfera/.test(r.u)).map((r) => r.u), hudba: await page.evaluate(() => !!document.querySelector('.hudba')) };
  res.errs = errs;
  await ctx.close();
  // ---------------- počítač: lerp pri koliesku ostáva (stav dobieha viac snímok), atmosfera pri pohybe myši
  const dc = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  const dp = await dc.newPage();
  const dreqs = [];
  dp.on('request', (r) => dreqs.push(r.url().replace(base, '')));
  await dp.goto(base + '?film=off', { waitUntil: 'load' }); await sleep(800);
  await dp.mouse.move(700, 450); await sleep(500);
  res.pcAtmosfera = dreqs.filter((u) => /atmosfera/.test(u));
  res.pcLerp = await dp.evaluate(() => new Promise((r) => {
    scrollTo({ top: 3000, behavior: 'instant' });
    let n = 0; const seen = [];
    const f = () => { n++; seen.push(window.__scrollSettled); if (n < 4) requestAnimationFrame(f); else r({ settledPo4: window.__scrollSettled, seen }); };
    requestAnimationFrame(f);
  }));
  await dc.close();
} finally { await browser.close(); }
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
