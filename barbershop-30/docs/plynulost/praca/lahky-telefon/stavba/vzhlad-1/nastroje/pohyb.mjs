// prefers-reduced-motion na telefóne: triedy, slučka Tímu, priblíženie fotky (transform zálohy) pri skrole.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [port, rm] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: rm });
const page = await ctx.newPage(); const req = []; page.on('request', (r) => req.push(r.url()));
await page.goto(`http://127.0.0.1:${port}/barbershop-30/`, { waitUntil: 'load' });
const res = [];
for (const f of [0.2, 0.5]) {
  const y = await page.evaluate((f) => { const el = document.querySelector('#tim .film-shot'); const r = el.getBoundingClientRect(); return Math.round(r.top + scrollY + (r.height - innerHeight) * f); }, f);
  await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y);
  await page.waitForTimeout(2500);
  res.push(await page.evaluate(() => { const s = document.querySelector('#tim .film-still'); const i = s && s.querySelector('img'); const v = s && s.querySelector('video');
    return { y: Math.round(scrollY), cls: document.documentElement.className, motion: document.documentElement.dataset.motion, imgTransform: i && getComputedStyle(i).transform, sp: i && i.style.getPropertyValue('--sp'), video: !!v, hra: v ? !v.paused : null, anim: getComputedStyle(document.querySelector('#h-uvod')).animationName }; }));
}
console.log(rm, JSON.stringify(res), 'slucka-req', req.filter((u) => /tim-slucka-864\.(mp4|webm)/.test(u)).length);
await browser.close();
