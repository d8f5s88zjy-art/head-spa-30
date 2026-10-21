// K03: hudba na dotyku len po ťuknutí. Scenáre na telefóne (390x844, dotyk). node hudba-dotyk.mjs --port=8400
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
import { swipe } from './pom.mjs';
const opt = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const port = opt.port || 8400;
const browser = await chromium.launch({ args: ['--no-sandbox'] });
async function novy(url = '?uvod=off') {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__ac = [];
    const AC = window.AudioContext;
    window.AudioContext = function (...a) { const c = new AC(...a); window.__ac.push({ t: Math.round(performance.now()), active: navigator.userActivation && navigator.userActivation.isActive, ev: window.event ? window.event.type : null }); window.__ctx = c; return c; };
    window.AudioContext.prototype = AC.prototype;
    window.__dec = [];
    const dd = AC.prototype.decodeAudioData; AC.prototype.decodeAudioData = function (...a) { window.__dec.push({ t: Math.round(performance.now()), ev: window.event ? window.event.type : null }); return dd.apply(this, a); };
  });
  await page.goto(`http://127.0.0.1:${port}/barbershop-30/index.html${url}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__renderDone !== false);
  return { ctx, page, cdp: await ctx.newCDPSession(page) };
}
const stav = (page) => page.evaluate(() => ({ y: Math.round(scrollY), ac: window.__ac.length, state: window.__ctx ? window.__ctx.state : null, pressed: (document.querySelector('.hudba') || {}).getAttribute ? document.querySelector('.hudba').getAttribute('aria-pressed') : 'nie je tlacidlo', dec: window.__dec.length, eq: document.querySelector('.hudba') ? getComputedStyle(document.querySelector('.hudba .hudba-eq i')).animationName : null }));
const vysl = {};
async function scen(nazov, f, pocka = 4200) {
  const { ctx, page, cdp } = await novy();
  await page.waitForTimeout(500);
  await f(page, cdp);
  await page.waitForTimeout(pocka);   // atmosfera.js sa načíta, hudba sa stiahne
  const s = await stav(page);
  const ex = await page.evaluate(() => ({ ac: window.__ac, dec: window.__dec }));
  vysl[nazov] = { ...s, vznik: ex.ac, dekod: ex.dec };
  console.log(nazov.padEnd(34), JSON.stringify(vysl[nazov]));
  await ctx.close();
}
await scen('S1 zvislý ťah (skrol)', async (p, c) => { await swipe(c, { dy: 400, speed: 900 }); });
await scen('S2 vodorovný švih', async (p, c) => { await swipe(c, { dy: 0, dx: 250, speed: 1500, y0: 500 }); });
await scen('S3 ťuknutie na prázdnu plochu', async (p) => { await p.touchscreen.tap(200, 300); });
await scen('S4 ťah, potom ťuknutie', async (p, c) => { await swipe(c, { dy: 300, speed: 900 }); await p.waitForTimeout(3000); await p.touchscreen.tap(200, 300); });
await scen('S5 dlhý stisk 700 ms', async (p, c) => { await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 300 }] }); await p.waitForTimeout(700); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); });
await scen('S6 ťuknutie po načítaní atmosféry', async (p, c) => { await swipe(c, { dy: 200, speed: 900 }); await p.waitForTimeout(4500); await p.touchscreen.tap(200, 300); }, 3000);
await browser.close();
