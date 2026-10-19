// prístup na živý web z headless prehliadača cez proxy
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true, proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const t = Date.now();
try { const r = await page.goto('https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/', { waitUntil: 'load', timeout: 60000 }); console.log('stav', r.status(), Date.now() - t, 'ms', await page.title()); } catch (e) { console.log('chyba', e.message.slice(0, 200)); }
await browser.close();
