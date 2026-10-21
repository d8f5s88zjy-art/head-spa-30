// Tlačidlo Hudba, keď prehliadač drží kontext zastavený (iOS: ťuknutie pred načítaním modulu). Simulácia: AudioContext sa hneď po vzniku zastaví a resume() mimo ťuknutia nič neurobí.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const port = process.argv[2] || 8400;
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
const page = await ctx.newPage();
await page.addInitScript(() => {
  const AC = window.AudioContext; let blok = true;
  window.__odblokuj = () => { blok = false; };
  window.AudioContext = function (...a) { const c = new AC(...a); c.suspend(); const r = c.resume.bind(c); c.resume = () => (blok ? Promise.resolve() : r()); window.__ctx = c; return c; };
  window.AudioContext.prototype = AC.prototype;
});
await page.goto(`http://127.0.0.1:${port}/barbershop-30/index.html?uvod=off`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__renderDone !== false);
await page.waitForTimeout(300);
await page.touchscreen.tap(200, 300);                       // 1. ťuknutie pred načítaním modulu: kontext vznikne mimo obsluhy, ostane zastavený
await page.waitForTimeout(3000);
const stav = () => page.evaluate(() => ({ pressed: document.querySelector('.hudba').getAttribute('aria-pressed'), title: document.querySelector('.hudba').title, ctx: window.__ctx && window.__ctx.state, ulozene: localStorage.getItem('b30-hudba') }));
console.log('po 1. ťuknutí      ', JSON.stringify(await stav()));
await page.evaluate(() => window.__odblokuj());
await page.tap('.hudba');                                   // 2. ťuknutie na tlačidlo Hudba (vyzerá vypnuté: aria-pressed=false)
await page.waitForTimeout(1500);
console.log('po ťuknutí na Hudba', JSON.stringify(await stav()));
await browser.close();
