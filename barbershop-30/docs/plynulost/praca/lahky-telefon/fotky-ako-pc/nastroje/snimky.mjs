// Snímky a údaje o ostrosti pre ?foto=A|B|B-css|C na telefóne a referencia PC (?film=off).
// node snimky.mjs <port> <výstupný priečinok> [šírka výška]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const port = process.argv[2], out = process.argv[3];
const W = +(process.argv[4] || 390), H = +(process.argv[5] || 844);
fs.mkdirSync(out, { recursive: true });
const base = `http://127.0.0.1:${port}/barbershop-30/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const cards = ['cakaren', 'sala', 'stol'];
const modes = [
  { id: 'A', q: '?foto=A' }, { id: 'B', q: '?foto=B' }, { id: 'Bcss', q: '?foto=B&rozmaz=css' }, { id: 'C', q: '?foto=C' },
  { id: 'PC', q: '?film=off', pc: true },
];
const only = process.env.MODES ? process.env.MODES.split(',') : null;
const res = {};
for (const m of modes) {
  if (only && !only.includes(m.id)) continue;
  const ctx = await browser.newContext(m.pc
    ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'dark', locale: 'sk-SK' }
    : { viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark', locale: 'sk-SK' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror', m.id, e.message));
  await page.goto(base + m.q, { waitUntil: 'load' });
  await sleep(1500);
  const cls = await page.evaluate(() => document.documentElement.className);
  res[m.id] = { cls, cards: {} };
  for (const c of cards) {
    await page.evaluate((c) => {
      const el = document.querySelector(`.film-shot[data-shot="${c}"]`);
      const r = el.getBoundingClientRect(); const top = r.top + scrollY;
      const free = Math.max(1, r.height - (el.classList.contains('title-long') ? innerHeight : 0));
      scrollTo({ top: top + free * 0.5, behavior: 'instant' });
    }, c);
    // počkať na dekódovanú, celú fotku a celú kartu
    await page.waitForFunction((c) => {
      const el = document.querySelector(`.film-shot[data-shot="${c}"]`);
      const st = el.querySelector('.film-still'), img = st.querySelector('img.foto-main') || st.querySelector('img');
      const fr = el.querySelector('.title-frame');
      return img.complete && img.naturalWidth > 0 && getComputedStyle(st).opacity === '1' && getComputedStyle(fr).opacity === '1';
    }, c, { timeout: 15000 }).catch(() => console.error('timeout', m.id, c));
    await sleep(700);
    const info = await page.evaluate(async (c) => {
      const el = document.querySelector(`.film-shot[data-shot="${c}"]`);
      const st = el.querySelector('.film-still'), img = st.querySelector('img.foto-main') || st.querySelector('img');
      const bg = st.querySelector('.foto-bg');
      const r = img.getBoundingClientRect(); const cs = getComputedStyle(img);
      // skutočné pixely súboru (naturalWidth je pri srcset s w deskriptormi delené hustotou)
      const real = new Image(); real.src = img.currentSrc; await real.decode().catch(() => {});
      const nw = real.naturalWidth, nh = real.naturalHeight;
      // CSS rozmer rámika (bez transformu): offsetWidth/Height
      const bw = img.offsetWidth, bh = img.offsetHeight;
      const fit = cs.objectFit;
      const sc = fit === 'cover' ? Math.max(bw / nw, bh / nh) : fit === 'fill' ? bw / nw : Math.min(bw / nw, bh / nh);
      const tr = new DOMMatrix(cs.transform === 'none' ? undefined : cs.transform);
      // viditeľná časť fotky v percentách šírky/výšky zdroja
      const visW = Math.min(1, Math.min(innerWidth, bw * tr.a) / (nw * sc * tr.a));
      const visH = Math.min(1, Math.min(innerHeight, bh * tr.d) / (nh * sc * tr.d));
      return {
        src: img.currentSrc.split('/').pop(), nat: [nw, nh], mp: +(nw * nh / 1e6).toFixed(2),
        box: [bw, bh], top: Math.round(r.top), fit, scaleNow: +tr.a.toFixed(4),
        pxPerCss: +(1 / sc).toFixed(2), pxPerCssWithZoom: +(1 / (sc * tr.a)).toFixed(2),
        visW: +(visW * 100).toFixed(1), visH: +(visH * 100).toFixed(1),
        bg: bg ? (bg.tagName === 'CANVAS' ? { canvas: [bg.width, bg.height], painted: bg.classList.contains('is-painted') } : { img: bg.currentSrc.split('/').pop(), filter: getComputedStyle(bg).filter }) : null,
        text: (() => { const t = el.querySelector('.title-card').getBoundingClientRect(); return [Math.round(t.top), Math.round(t.bottom)]; })(),
        sp: img.style.getPropertyValue('--sp'),
      };
    }, c);
    res[m.id].cards[c] = info;
    if (m.id === 'C') {
      const ok = await page.evaluate((c) => {
        const img = document.querySelector(`.film-shot[data-shot="${c}"] img.foto-main`);
        const a = img.getAnimations(); a.forEach((x) => x.pause()); return a.length;
      }, c);
      info.animations = ok;
      for (const [lab, t] of [['zaciatok', 0], ['stred', 9000], ['koniec', 17999]]) {
        await page.evaluate(([c, t]) => {
          const img = document.querySelector(`.film-shot[data-shot="${c}"] img.foto-main`);
          img.getAnimations().forEach((x) => { x.currentTime = t; });
        }, [c, t]);
        await sleep(400);
        info['tx_' + lab] = await page.evaluate((c) => new DOMMatrix(getComputedStyle(document.querySelector(`.film-shot[data-shot="${c}"] img.foto-main`)).transform).e, c);
        await page.screenshot({ path: `${out}/${m.id}-${c}-${lab}.png` });
      }
    } else {
      await page.screenshot({ path: `${out}/${m.id}-${c}.png` });
    }
  }
  await ctx.close();
}
fs.writeFileSync(`${out}/udaje-${W}x${H}.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await browser.close();
