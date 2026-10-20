#!/usr/bin/env node
// Overenie VZ-05: časová os textu karty (--o z app.js) a obrazu filmu (prelínanie state.mix) pri skutočnom ťahu.
// Aby softvérové kreslenie (SwiftShader) nespomalilo pružinu filmu (dt je orezané na 0,1 s), plátno filmu sa
// v teste zmenší na DPR 0,25 – logika času (pružina, prelínanie) od rozlíšenia nezávisí. Zaznamenáva sa každá snímka.
//   node tempo-over.mjs --dev=p390|d1440 --tah=svih|stredne|pomaly|koliesko
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const DEVS = { p390: { vp: { width: 390, height: 844 }, dsf: 3, mob: true }, d1440: { vp: { width: 1440, height: 900 }, dsf: 1, mob: false } };
const dn = opt.dev || 'p390', DEV = DEVS[dn], TAH = opt.tah || (DEV.mob ? 'stredne' : 'koliesko');
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'merania'); fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// DPR 1: časovanie nezávisí od hustoty, softvérové skladanie stránky 3× by snímky spomalilo pod 30 za sekundu
const ctx = await browser.newContext({ viewport: DEV.vp, deviceScaleFactor: 1, isMobile: DEV.mob, hasTouch: DEV.mob });
const page = await ctx.newPage();
await page.route('**/assets/film.js*', async (route) => {
  const r = await route.fetch(); let body = await r.text(); const n0 = body.length;
  body = body.replace('const DPR_MAX = Math.min(devicePixelRatio || 1, 2);', 'const DPR_MAX = 0.25;')
    .replace('if (dpr > DPR_MIN) { dpr = Math.max(', 'if (false && dpr > DPR_MIN) { dpr = Math.max(')
    // menšie textúry: nahrávanie fotiek do softvérovej grafiky by inak zabralo snímky počas merania
    .replace('const CAP = phone ? 1448 : 2896;', 'const CAP = 1086;');
  if (body.length === n0) console.error('POZOR: náhrada nenájdená');
  await route.fulfill({ response: r, body, headers: { ...r.headers(), 'content-type': 'text/javascript' } });
});
await page.goto('http://127.0.0.1:8430/barbershop-30/?film=on&uvod=off', { waitUntil: 'load' });
// len pre rýchlosť softvérového skladania (nemení logiku času): bez rozmazania lišty a filtrov textu
await page.addStyleTag({ content: '*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;filter:none!important}' });
if (DEV.mob) await page.touchscreen.tap(5, 400); else await page.mouse.move(200, 300);
await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 120000 });
// štart: y = 560 (úvod, pred hranicou úvod → Poď ďalej), film ustálený a záber sály načítaný
const Y0 = 560;
await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, Y0);
await page.waitForFunction(() => { const s = BS30_FILM.state; return Math.abs(s.S - s.T) < 0.0005 && s.ready[2] && s.ready[2].ready; }, null, { timeout: 120000, polling: 200 });
// susedné zábery načítané a nahraté (nič sa nenahráva počas merania)
await page.waitForFunction(() => BS30_FILM.state.ready.every((r) => !r.loading), null, { timeout: 120000, polling: 300 });
await page.waitForTimeout(2500);
const meta = await page.evaluate(() => {
  const c = [...document.querySelectorAll('.film-shot.is-title')];
  const r = c[1].getBoundingClientRect();
  return { top1: Math.round(r.top + scrollY), anchors: BS30_FILM.state.anchors.map(Math.round), fps: 0 };
});
await page.evaluate(() => {
  window.__rec = []; const t0 = performance.now(); window.__t0 = t0;
  const c = [...document.querySelectorAll('.film-shot.is-title')];
  const f = (now) => {
    const s = BS30_FILM.state; const k = Math.floor(s.S);
    window.__rec.push({ t: Math.round(now - t0), y: Math.round(scrollY), o0: +c[0].style.getPropertyValue('--o') || 0, o1: +c[1].style.getPropertyValue('--o') || 0, S: +s.S.toFixed(4), T: +s.T.toFixed(4), img: +(k - 1 + (s.mix > 0.001 ? s.mix : (s.S - k > 0.74 ? 1 : 0))).toFixed(4), mix: +s.mix.toFixed(3) });
    if (now - t0 < 4500) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
});
const cdp = await ctx.newCDPSession(page);
const G = { svih: [560, 7000], stredne: [420, 2333], pomaly: [300, 667] };
if (TAH === 'koliesko') {
  for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(40); }
} else {
  // ťah prstom (Input.dispatchTouchEvent), po pustení dobeh zotrvačnosťou prehliadača
  const P = { svih: { dist: 560, ms: 80, hold: 0 }, stredne: { dist: 420, ms: 180, hold: 0 }, pomaly: { dist: 300, ms: 450, hold: 80 } }[TAH];
  const x = 195, y00 = 700, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y00 }] });
  const ts = Date.now(); let y = y00;
  for (;;) { const e = Math.min(1, (Date.now() - ts) / P.ms); y = y00 - P.dist * e; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); if (e >= 1) break; await sleep(8); }
  if (P.hold) { await sleep(P.hold); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
await page.waitForTimeout(4800);
const rec = await page.evaluate(() => window.__rec);
// prvý pohyb skrolu = čas 0
const s0 = rec.find((r) => r.y !== rec[0].y);
const t0 = s0 ? s0.t : 0;
const cross = (key, v) => { const r = rec.find((x) => x.t >= t0 && x[key] >= v); return r ? r.t - t0 : null; };
const crossDown = (key, v) => { const r = rec.find((x) => x.t >= t0 && x[key] <= v); return r ? r.t - t0 : null; };
const res = {
  dev: dn, tah: TAH, hranica_y: meta.top1, koniec_y: rec[rec.length - 1].y,
  snimky_za_s: +(rec.length / 4.5).toFixed(0),
  text_novy_50: cross('o1', 0.5), text_novy_90: cross('o1', 0.9), text_stary_pod_50: crossDown('o0', 0.5),
  obraz_50: cross('img', 0.5), obraz_90: cross('img', 0.9),
  koniec: { o0: rec[rec.length - 1].o0, o1: rec[rec.length - 1].o1, img: rec[rec.length - 1].img },
};
res.rozdiel_t50_ms = res.obraz_50 != null && res.text_novy_50 != null ? res.obraz_50 - res.text_novy_50 : null;
// čas, keď je nový nadpis viditeľný nad starým záberom (o1 ≥ 0,5 a obraz < 0,5)
res.novy_nadpis_nad_starym_ms = rec.filter((x, i) => i > 0 && x.t >= t0 && x.o1 >= 0.5 && x.img < 0.5).reduce((a, x, i, arr) => a + (i ? x.t - arr[i - 1].t : 0), 0);
console.log(JSON.stringify(res));
fs.writeFileSync(path.join(OUT, `tempo-${dn}-${TAH}.json`), JSON.stringify({ res, rec }, null, 0));
await browser.close();
