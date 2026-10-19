// Sonda: triedy <html>, poloha kotiev, počet potomkov kotiev, režim filmu (telefón 390×844)
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const film = process.argv[2] || 'off';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
const page = await ctx.newPage();
const q = film === 'predvolene' ? '?uvod=off&hudba=off' : `?film=${film}&uvod=off&hudba=off`;
await page.goto('http://127.0.0.1:8544/barbershop-30/' + q, { waitUntil: 'load' });
await page.waitForTimeout(2500);
const r = await page.evaluate(() => {
  const y = scrollY;
  const shots = [...document.querySelectorAll('.film-shot')].map((el) => { const b = el.getBoundingClientRect(); return { shot: el.dataset.shot, top: Math.round(b.top + y), h: Math.round(b.height), potomkov: el.querySelectorAll('*').length, title: el.classList.contains('is-title'), video: el.dataset.videoMode || null }; });
  const secs = [...document.querySelectorAll('section[id]')].map((el) => { const b = el.getBoundingClientRect(); return [el.id, Math.round(b.top + y), Math.round(b.bottom + y)]; });
  return { cls: document.documentElement.className, vsetkych: document.querySelectorAll('*').length, vyska: document.documentElement.scrollHeight, shots, secs, anim: document.getAnimations().length };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
