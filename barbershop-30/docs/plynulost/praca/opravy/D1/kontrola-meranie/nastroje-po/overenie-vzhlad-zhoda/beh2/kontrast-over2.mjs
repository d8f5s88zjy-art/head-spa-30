#!/usr/bin/env node
// Overenie VZ-11: kontrast textu karty úvodu voči pozadiu pod ním (fotka + stmavenie karty, bez textu a jeho tieňa).
// node kontrast-over.mjs --dev=p390|d1440 --mode=off|on
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const DEVS = { p390: { vp: { width: 390, height: 844 }, dsf: 3, mob: true }, d1440: { vp: { width: 1440, height: 900 }, dsf: 1, mob: false } };
const dn = opt.dev || 'p390', DEV = DEVS[dn], MODE = opt.mode || 'off';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: DEV.vp, deviceScaleFactor: DEV.dsf, isMobile: DEV.mob, hasTouch: DEV.mob });
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:8432/barbershop-30/${MODE === 'on' ? '?film=on&uvod=off' : '?film=off'}`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
if (MODE === 'on') { if (DEV.mob) await page.touchscreen.tap(5, 300); else await page.mouse.move(5, 300); await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 120000 }); await page.waitForTimeout(3000); await page.evaluate(() => BS30_FILM.pause(true)); }
await page.waitForTimeout(2500);
const rects = await page.evaluate(() => [...document.querySelectorAll('.title-hero .kicker, .title-hero .title, .title-hero .title-sub')].map((el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return { cls: el.className.split(' ')[0], x: r.left, y: r.top, w: r.width, h: r.height, color: s.color, fs: s.fontSize }; }));
// beh 2: aj bežná snímka (text s tieňom halo), z nej kontrast písmen voči okoliu tesne za hranou písma
await page.screenshot({ path: `snimky/kontrast-${dn}-${MODE}-bezne.png`, timeout: 120000 });
// maska písmen: text čisto biely bez tieňa (snímka A) proti priehľadnému textu (snímka B)
const tA = await page.addStyleTag({ content: '.title-card .kicker,.title-card .title,.title-card .title-sub,.title-card .title *{color:#fff!important;text-shadow:none!important;animation:none!important;filter:none!important}' });
await page.waitForTimeout(400);
await page.screenshot({ path: `snimky/kontrast-${dn}-${MODE}-biely.png`, timeout: 120000 });
await tA.evaluate((n) => n.remove());
await page.addStyleTag({ content: '.title-card .kicker,.title-card .title,.title-card .title-sub,.title-card .title *{color:transparent!important;text-shadow:none!important;animation:none!important;filter:none!important}.title-card .kicker::before,.title-card .kicker::after{visibility:hidden!important}' });
await page.waitForTimeout(500);
const f = `snimky/kontrast-${dn}-${MODE}-pozadie.png`;
await page.screenshot({ path: f, timeout: 120000 });
fs.writeFileSync(`merania/kontrast-${dn}-${MODE}.json`, JSON.stringify({ dsf: DEV.dsf, file: f, rects }, null, 1));
console.log(JSON.stringify(rects.map((r) => [r.cls, Math.round(r.y), Math.round(r.h), r.color])));
await browser.close();
