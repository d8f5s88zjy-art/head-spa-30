// Počítač 1440×900 s filmom: pásy filmu (S3) a gestá filmu pri otvorenom paneli (S2). node film.mjs <url> <out> <pred|po>
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, out, tag] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sk-SK', colorScheme: 'dark' });
const p = await ctx.newPage();
const V = { tag, chyby: [] };
p.on('pageerror', (e) => V.chyby.push(String(e)));
await p.goto(url, { waitUntil: 'load' });
const merania = () => p.evaluate(() => {
  const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  const btn = document.querySelector('.recepcia-btn'), bar = document.querySelector('.film-bars i:last-child');
  const o = { c: document.documentElement.className, btn: R(btn), bar: R(bar), barZ: bar && getComputedStyle(bar.parentNode).zIndex, barT: bar && getComputedStyle(bar).transform, btnZ: btn && getComputedStyle(btn).zIndex };
  if (btn && bar) { const b = o.btn, r = o.bar; o.prekrytiePx = Math.max(0, Math.min(b.y + b.h, r.y + r.h) - Math.max(b.y, r.y)) * (Math.max(0, Math.min(b.x + b.w, r.x + r.w) - Math.max(b.x, r.x)) > 0 ? 1 : 0); const t = document.elementFromPoint(b.x + b.w / 2, b.y + b.h - 6); o.klikDole = t === btn || btn.contains(t) ? 'tlačidlo' : (t && (t.className || t.nodeName) + ''); }
  return o;
});
const cls = () => p.evaluate(() => ({ c: document.documentElement.className, sy: Math.round(scrollY) }));
V.poLoad = await cls();
const ma = await p.locator('.recepcia-btn').waitFor({ state: 'attached', timeout: 10000 }).then(() => true, () => false);
await sleep(350);
V.priObjaveni = await merania();
await p.screenshot({ path: `${out}/${tag}-pocitac-film-uvod.png` });
// počkať, kým úvod ako film skončí
for (let i = 0; i < 30; i++) { const c = await cls(); if (!/\bpro\b/.test(c.c)) break; await sleep(500); }
await sleep(1500);
V.vnutri = await cls();
V.vnutriMerania = await merania();
await p.screenshot({ path: `${out}/${tag}-pocitac-film-vnutri.png` });
// von na ulicu (tlačidlo dverí)
await p.evaluate(() => scrollTo(0, 0)); await sleep(500);
const door = p.locator('.film-door');
V.dvere = await door.isVisible();
if (V.dvere) { await door.click(); await sleep(2500); }
V.ulica = await merania();
await p.screenshot({ path: `${out}/${tag}-pocitac-film-ulica.png` });
if (ma) {
  // S3: tlačidlo pod pásom sa dá stlačiť; S2 a: koliesko nadol nad panelom na ulici
  await p.click('.recepcia-btn', { force: true });
  V.panelNaUlici = await p.locator('#rc-panel[open]').waitFor({ timeout: 5000 }).then(() => true, () => false);
  await sleep(400);
  await p.screenshot({ path: `${out}/${tag}-pocitac-film-ulica-panel.png` });
  const L = await p.evaluate(() => { const r = document.querySelector('.rc-log').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(L.x, L.y); await p.mouse.wheel(0, 300); await sleep(2500);
  V.S2_ulica_kolieskoNadolNadLogom = await cls();
  V.S2_ulica_panelOtvoreny = await p.evaluate(() => !!document.querySelector('#rc-panel[open]'));
  await p.keyboard.press('Escape'); await sleep(400);
  // späť dnu, ak treba
  if (/\boutside\b/.test((await cls()).c)) { await door.click(); await sleep(1000); }
  for (let i = 0; i < 30; i++) { const c = await cls(); if (!/\bpro\b|\boutside\b/.test(c.c)) break; await sleep(500); }
  await p.evaluate(() => scrollTo(0, 0)); await sleep(2500);
  V.spatDnu = await cls();
  // S2 b: na vrchu stránky, koliesko nahor nad panelom (log aj pozadie)
  await p.click('.recepcia-btn'); await p.locator('#rc-panel[open]').waitFor({ timeout: 5000 }); await sleep(400);
  await p.mouse.move(L.x, L.y); await p.mouse.wheel(0, -300); await sleep(2500);
  V.S2_vnutri_kolieskoNahorNadLogom = { ...(await cls()), panel: await p.evaluate(() => !!document.querySelector('#rc-panel[open]')) };
  await p.screenshot({ path: `${out}/${tag}-pocitac-film-koliesko.png` });
  await p.keyboard.press('Escape'); await sleep(400);
  if (/\boutside\b/.test((await cls()).c)) { await door.click(); await sleep(1000); for (let i = 0; i < 30; i++) { const c = await cls(); if (!/\bpro\b|\boutside\b/.test(c.c)) break; await sleep(500); } await p.evaluate(() => scrollTo(0, 0)); await sleep(2500); }
  await p.click('.recepcia-btn'); await p.locator('#rc-panel[open]').waitFor({ timeout: 5000 }); await sleep(400);
  await p.mouse.move(200, 300); await p.mouse.wheel(0, -300); await sleep(2500);
  V.S2_vnutri_kolieskoNahorNadPozadim = { ...(await cls()), panel: await p.evaluate(() => !!document.querySelector('#rc-panel[open]')) };
  await p.keyboard.press('Escape'); await sleep(400);
  if (/\boutside\b/.test((await cls()).c)) { await door.click(); await sleep(1000); for (let i = 0; i < 30; i++) { const c = await cls(); if (!/\bpro\b|\boutside\b/.test(c.c)) break; await sleep(500); } await p.evaluate(() => scrollTo(0, 0)); await sleep(2500); }
  // S2 c: klik do textu bubliny, potom šípka hore
  await p.click('.recepcia-btn'); await p.locator('#rc-panel[open]').waitFor({ timeout: 5000 }); await sleep(400);
  await p.click('.rc-log li.rc-a', { position: { x: 30, y: 10 } });
  V.S2_fokusPoKlikuDoBubliny = await p.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.className || a.tagName) : null; });
  await p.keyboard.press('ArrowUp'); await sleep(2500);
  V.S2_vnutri_sipkaHore = { ...(await cls()), panel: await p.evaluate(() => !!document.querySelector('#rc-panel[open]')) };
  await p.keyboard.press('Escape'); await sleep(300);
}
await b.close();
console.log(JSON.stringify(V, null, 1));
