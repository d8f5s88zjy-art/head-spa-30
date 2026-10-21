import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const port = process.argv[2], base = `http://127.0.0.1:${port}/barbershop-30/index.html`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const st = () => p.evaluate(() => { const r = (q) => { const e = document.querySelector(q); return e ? Math.round(e.getBoundingClientRect().top) : null; };
  return { y: Math.round(scrollY), h: location.hash, footer: r('.site-footer'), band: r('#rezervacia .band'), vstup: r('[data-shot="vstup"]'), vh: innerHeight,
    stills: [...document.querySelectorAll('.film-shot.is-title')].map((s) => { const st = s.querySelector('.film-still'), cs = getComputedStyle(st);
      return cs.display === 'none' ? null : `${s.dataset.shot}:${cs.visibility}:${(+cs.opacity).toFixed(2)}:${s.querySelector('img').complete}`; }).filter(Boolean) }; });
await p.goto(base, { waitUntil: 'load' }); await p.waitForTimeout(1500);
await p.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
const cak = await p.evaluate(() => { const el = document.querySelector('[data-shot="cakaren"]'); const r = el.getBoundingClientRect(); return r.top + scrollY + r.height * 0.3; });
await p.evaluate((y) => scrollTo(0, y), cak); await p.waitForTimeout(800);
await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
console.log('po reload', JSON.stringify(await st()));
await p.goto(base + '#kontakt', { waitUntil: 'load' }); await p.waitForTimeout(800);
console.log('kontakt', JSON.stringify(await st()));
await p.goBack({ waitUntil: 'load' }).catch((e) => console.log('goBack', e.message));
for (const t of [100, 500, 1500, 3000]) { await p.waitForTimeout(t === 100 ? 100 : t - 100); console.log('spat', t, JSON.stringify(await st())); }
await b.close();
