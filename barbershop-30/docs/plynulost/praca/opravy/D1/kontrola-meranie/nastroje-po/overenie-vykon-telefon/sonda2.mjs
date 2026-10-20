// Sonda T11/T9/T4: aktívne animácie lišty a nadpisu, data-scene-active, dosky s backdrop-filter na počítači, beam vrstva
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch();
for (const [meno, o] of [['telefon', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['pocitac', { viewport: { width: 1440, height: 900 } }]]) {
  const ctx = await browser.newContext({ ...o, locale: 'sk-SK' });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8432/barbershop-30/?film=off&uvod=off&hudba=off', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const anim = (sel) => document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.matches && a.effect.target.matches(sel)).map((a) => a.animationName + ':' + a.playState);
    const hdr = document.querySelector('.site-header');
    const out = { sceneActive: document.documentElement.getAttribute('data-scene-active'), headerAnim: anim('.site-header'), headerBackdrop: getComputedStyle(hdr).backdropFilter, heroW: anim('.title-hero h1 .w') };
    // dosky s backdrop-filter: veľkosť a koľko je naraz v okne pri rôznych polohách
    const boards = [...document.querySelectorAll('*')].filter((el) => { const b = getComputedStyle(el).backdropFilter; return b && b !== 'none'; });
    out.backdrop = boards.map((el) => { const r = el.getBoundingClientRect(); return `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${Math.round(r.width)}×${Math.round(r.height)}`; });
    return out;
  });
  // počas skrolu: koľko plochy backdrop-filter je v okne (počítač)
  const vis = [];
  for (const y of [0, 900, 2000, 4000, 6000, 8000, 10000, 12000]) {
    await page.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y); await page.waitForTimeout(300);
    vis.push(await page.evaluate((yy) => { let a = 0; for (const el of document.querySelectorAll('*')) { const b = getComputedStyle(el).backdropFilter; if (!b || b === 'none') continue; const r = el.getBoundingClientRect(); const w = Math.max(0, Math.min(innerWidth, r.right) - Math.max(0, r.left)), h = Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top)); a += w * h; } return [yy, +(a / (innerWidth * innerHeight) * 100).toFixed(0)]; }, y));
  }
  console.log(meno, JSON.stringify(r), 'backdrop % okna pri y:', JSON.stringify(vis));
  await ctx.close();
}
await browser.close();
