// CO-6: ako dlho a na akej ploche je pri skoku/skrole obsah pásov skrytý (.reveal tímu, .steps) – telefón, CPU 4×.
// Skok na polohu (scrollTo instant), potom každých 50 ms: podiel okna, kde je skrytý obsah, a snímka.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const p = await ctx.newPage(); const c = await ctx.newCDPSession(p);
await p.goto('http://127.0.0.1:8402/barbershop-30/?film=off', { waitUntil: 'load' });
await sleep(2000);
await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const geo = await p.evaluate(() => {
  const y = scrollY, r = (s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return [Math.round(q.top + y), Math.round(q.bottom + y)]; };
  return { team: r('.band-team .team-list, .band-team ul'), steps: r('.steps'), teamBand: r('.band-team'), prices: r('.band-prices') };
});
console.log(JSON.stringify(geo));
const probe = () => p.evaluate(() => {
  let hid = 0, vis = 0; const H = innerHeight;
  document.querySelectorAll('.team-card, .steps li').forEach((el) => {
    const r = el.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= H || r.width === 0) return;
    if (r.right <= 0 || r.left >= innerWidth) return;
    const a = (Math.min(r.bottom, H) - Math.max(r.top, 0)) * (Math.min(r.right, innerWidth) - Math.max(r.left, 0));
    const o = +getComputedStyle(el).opacity;
    if (o < 0.15) hid += a; else vis += a;
  });
  return { hid: +(hid / (innerWidth * H)).toFixed(2), vis: +(vis / (innerWidth * H)).toFixed(2) };
});
for (const [nm, y] of [['tim', geo.team[0] - 500], ['kroky', geo.steps[0] - 600], ['kroky-spodok', geo.steps[0] - 760]]) {
  const rows = await p.evaluate((yy) => new Promise((res) => {
    const out = []; const t0 = performance.now();
    scrollTo({ top: yy, behavior: 'instant' });
    const f = () => {
      let hid = 0; const H = innerHeight, W = innerWidth;
      document.querySelectorAll('.team-card, .steps li').forEach((el) => {
        const r = el.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W || !r.width) return;
        if (+getComputedStyle(el).opacity < 0.15) hid += (Math.min(r.bottom, H) - Math.max(r.top, 0)) * (Math.min(r.right, W) - Math.max(r.left, 0));
      });
      out.push([Math.round(performance.now() - t0), +(hid / (W * H)).toFixed(2)]);
      if (performance.now() - t0 < 2500) requestAnimationFrame(f); else res(out);
    };
    requestAnimationFrame(f);
  }), y);
  const firstOk = rows.find((r) => r[1] < 0.05);
  const mx = Math.max(...rows.map((r) => r[1]));
  console.log(nm, 'y', y, 'najviac skrytej plochy', mx, '| pod 5 % po', firstOk ? firstOk[0] : '>2500', 'ms |', rows.filter((r, i) => i % 4 === 0).slice(0, 12).map((r) => r.join(':')).join(' '));
  await p.screenshot({ path: `dokazy/co6-${nm}-po.png` });
  await sleep(600);
}
await b.close();
