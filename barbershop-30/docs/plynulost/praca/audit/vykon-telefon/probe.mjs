// rýchla sonda: stav filmu, výška stránky, sekcie, test dotykového švihu
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://127.0.0.1:8433/barbershop-30/?film=on';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on('console', (m) => console.log('konzola', m.type(), m.text().slice(0, 200)));
page.on('pageerror', (e) => console.log('chyba', e.message));
const t0 = Date.now();
await page.goto(url, { waitUntil: 'load' });
console.log('load', Date.now() - t0);
await page.waitForTimeout(4000);
const info = await page.evaluate(() => ({
  cls: document.documentElement.className, sh: document.scrollingElement.scrollHeight, ih: innerHeight,
  dm: navigator.deviceMemory, hc: navigator.hardwareConcurrency, ua: navigator.userAgent,
  secs: [...document.querySelectorAll('section[data-scene], footer')].map((e) => { const r = e.getBoundingClientRect(); return [e.id, Math.round(r.top + scrollY), Math.round(r.height)]; }),
  st: window.BS30_FILM && window.BS30_FILM.state,
}));
console.log(JSON.stringify(info, null, 1).slice(0, 4000));
const cdp = await ctx.newCDPSession(page);
const t1 = Date.now();
await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -600, speed: 1200, gestureSourceType: 'touch' });
console.log('gesto ms', Date.now() - t1, await page.evaluate(() => scrollY));
const t2 = Date.now();
await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 700, yDistance: -500, speed: 5000, gestureSourceType: 'touch', preventFling: false });
await page.waitForTimeout(1500);
console.log('švih ms', Date.now() - t2, await page.evaluate(() => scrollY));
console.log(JSON.stringify(await page.evaluate(() => window.BS30_FILM && window.BS30_FILM.state && { S: window.BS30_FILM.state.S, dpr: window.BS30_FILM.state.dpr, frames: window.BS30_FILM.state.frames, ready: window.BS30_FILM.state.ready })).slice(0, 1500));
await browser.close();
