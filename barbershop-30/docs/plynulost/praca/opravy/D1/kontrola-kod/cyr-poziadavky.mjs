// Kontrola kódu D1: koľkokrát sa pri ?lang=uk naozaj stiahne Manrope-cyr-700.woff2 (rezy 600 a 700 majú ten istý súbor)
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
const sit = [];
cdp.on('Network.responseReceived', (e) => { if (/Manrope-cyr/.test(e.response.url)) sit.push({ u: e.response.url.split('/').pop(), zCache: e.response.fromDiskCache || e.response.fromMemoryCache || false, kod: e.response.status }); });
cdp.on('Network.requestServedFromCache', (e) => sit.push({ cache: e.requestId }));
await page.goto(process.argv[2] + '?lang=uk&uvod=off&hudba=off', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 4000));
console.log(JSON.stringify(sit));
await browser.close();
