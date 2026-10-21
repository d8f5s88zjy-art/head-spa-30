import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const port = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [W, H] of [[390, 844], [430, 932], [375, 667]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark', locale: 'sk-SK' });
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${port}/barbershop-30/?foto=B&uvod=off`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 1200));
  const r = await p.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((e) => {
    const t = e.querySelector('.title-card'); const s = getComputedStyle(t);
    const cue = e.querySelector('.scroll-cue, .cue, [class*="cue"]');
    return [e.dataset.shot, e.dataset.card, Math.round(t.offsetHeight), cue ? Math.round(cue.offsetHeight) : 0];
  }));
  console.log(W, H, JSON.stringify(r));
  await ctx.close();
}
await b.close();
