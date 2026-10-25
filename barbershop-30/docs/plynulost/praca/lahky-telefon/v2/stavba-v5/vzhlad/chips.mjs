import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, out] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'sk-SK', colorScheme: 'dark' });
const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' });
await p.locator('.recepcia-btn').waitFor({ state: 'attached' });
const st = (n) => p.evaluate((n) => { const c = document.querySelector('.rc-chips'), f = c.firstElementChild.getBoundingClientRect(), a = document.activeElement; return { n, scrollLeft: Math.round(c.scrollLeft), prvaX: Math.round(f.x), fokus: a.className + ' ' + a.textContent.trim().slice(0, 15) }; }, n);
await p.tap('.recepcia-btn'); await p.locator('#rc-panel[open]').waitFor(); await sleep(400);
console.log(JSON.stringify(await st('1. otvorenie')));
// ťahom/šípkou: ťuknutie na poslednú voľbu (Zavolať je odkaz) – namiesto toho fokus Tabom na poslednú voľbu
for (let i = 0; i < 4; i++) await p.keyboard.press('Tab');
console.log(JSON.stringify(await st('po 4× Tab')));
await p.keyboard.press('Escape'); await sleep(300);
await p.tap('.recepcia-btn'); await p.locator('#rc-panel[open]').waitFor(); await sleep(400);
console.log(JSON.stringify(await st('2. otvorenie')));
await p.screenshot({ path: `${out}/po-telefon-volby-znova.png`, clip: { x: 0, y: 500, width: 390, height: 130 } });
// prstom vodorovne v rade volieb
await p.keyboard.press('Escape'); await sleep(300);
await b.close();
