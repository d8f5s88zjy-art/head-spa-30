// Menu na telefóne (otvorené, s jazykmi) a lišta na počítači; ?film=off
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8211/barbershop-30/?film=off', { waitUntil: 'load' });
await p.touchscreen.tap(5, 400); await p.waitForTimeout(1500);
await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 3000); }); await p.waitForTimeout(1500);
await p.tap('.nav-toggle'); await p.waitForTimeout(1200);
await p.screenshot({ path: 'shots/menu-p390.jpg', type: 'jpeg', quality: 88 });
const m = await p.evaluate(() => { const n = document.querySelector('#nav'); const r = n.getBoundingClientRect(); const s = getComputedStyle(n); return { top: r.top, bottom: r.bottom, h: r.height, vh: innerHeight, height: s.height, lang: !!document.querySelector('.lang-v-menu') }; });
console.log(JSON.stringify(m));
await b.close();
