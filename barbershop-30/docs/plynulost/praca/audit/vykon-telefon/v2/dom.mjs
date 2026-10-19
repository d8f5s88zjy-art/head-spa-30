// Veľkosť DOM a vrstiev (telefón 390×844): prvky spolu, v kotvách filmu, slová .kw, prvky s animáciou, will-change
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
for (const film of ['off', 'predvolene']) {
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8433/barbershop-30/' + (film === 'off' ? '?film=off' : ''), { waitUntil: 'load' });
  await page.touchscreen.tap(20, 500); await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const all = document.querySelectorAll('*').length;
    const shots = [...document.querySelectorAll('.film-shot')].map((s) => [s.dataset.shot, s.querySelectorAll('*').length, Math.round(s.getBoundingClientRect().height)]);
    const kw = document.querySelectorAll('.kw').length;
    const anim = document.getAnimations().map((a) => (a.effect && a.effect.target ? (a.effect.target.className || a.effect.target.nodeName) + '' : '?') + ' ' + (a.animationName || a.transitionProperty || '')).slice(0, 30);
    const wc = [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).willChange !== 'auto').map((e) => e.className || e.nodeName).length;
    const bf = [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).backdropFilter !== 'none').map((e) => String(e.className));
    const hudba = document.querySelector('.hudba'); 
    return { prvkov: all, kotvy: shots, slovKw: kw, animacieBezia: anim.length, animacie: anim, willChange: wc, backdropFilter: bf, hudba: hudba ? hudba.getAttribute('aria-pressed') : null, vyska: document.scrollingElement.scrollHeight, triedy: document.documentElement.className };
  });
  console.log(film, JSON.stringify(r));
  await page.close();
}
await browser.close();
