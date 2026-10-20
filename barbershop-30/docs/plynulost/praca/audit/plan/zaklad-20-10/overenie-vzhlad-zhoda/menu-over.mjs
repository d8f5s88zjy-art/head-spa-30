#!/usr/bin/env node
// Overenie VZ-12: priesvitnosť menu na telefóne (?film=off, y=3000, ťuknutie na menu). Jas pozadia menu mimo položiek.
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:8581/barbershop-30/?film=off', { waitUntil: 'load' });
await page.waitForTimeout(1200);
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 3000); });
await page.waitForTimeout(1500);
await page.tap('.nav-toggle');
await page.waitForTimeout(1200);
const bg = await page.evaluate(() => { const n = document.querySelector('#nav') || document.querySelector('.nav'); const s = getComputedStyle(n); return { bg: s.backgroundColor, bf: s.backdropFilter }; });
console.log(JSON.stringify(bg));
await page.screenshot({ path: 'snimky/menu-p390.png' });
await browser.close();
