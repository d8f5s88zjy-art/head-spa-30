#!/usr/bin/env node
// Plynulý skrol kolieskom (počítač): po jednom zatočení (300 px) stránka nedoskočí naraz, ale dobieha;
// kolieskom nahor na vrchu sa vyjde na ulicu (film). Vypíše vzorky scrollY v čase a stavy filmu.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer, PRESETS } from '../shot.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const srv = await startStaticServer(ROOT);
const browser = await chromium.launch(PRESETS[0]);
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(`${srv.origin}/index.html?uvod=off&film=on`, { waitUntil: 'load' });
await page.mouse.move(720, 450);
await page.mouse.wheel(0, 300);
const samples = [];
const t0 = Date.now();
for (let i = 0; i < 14; i++) { samples.push([Date.now() - t0, await page.evaluate(() => Math.round(window.scrollY))]); await page.waitForTimeout(50); }
console.log('scrollY po zatočení o 300 px:', samples.map(([t, y]) => `${t}ms:${y}`).join(' '));
const smooth = samples.filter(([, y]) => y > 0 && y < 300).length >= 3 && samples[samples.length - 1][1] >= 295;
console.log(smooth ? 'OK   koliesko: stránka dobieha plynulo' : 'FAIL koliesko: stránka doskočila naraz alebo nedošla');
// naspäť hore a film: koliesko nahor na vrchu = von na ulicu
try { await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 40000 }); } catch { console.log('film sa nerozbehol'); }
await page.mouse.wheel(0, -600);
try { await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 15000 }); } catch { console.log('FAIL stránka sa nevrátila na vrch'); }
await page.waitForTimeout(300);
console.log('scrollY po návrate hore:', await page.evaluate(() => window.scrollY));
await page.mouse.wheel(0, -100);
try { await page.waitForFunction(() => window.BS30_FILM.state.leaving || window.BS30_FILM.state.outside, null, { timeout: 8000 }); console.log('OK   koliesko nahor na vrchu: kamera ide von'); } catch { console.log('FAIL koliesko nahor na vrchu nevyviedlo von', JSON.stringify(await page.evaluate(() => { const s = window.BS30_FILM.state; return { S: s.S, outside: s.outside, leaving: s.leaving, pro: s.pro }; }))); }
try { await page.waitForFunction(() => window.BS30_FILM.state.outside, null, { timeout: 8000 }); } catch {}
await page.mouse.wheel(0, 100);
try { await page.waitForFunction(() => window.BS30_FILM.state.pro, null, { timeout: 5000 }); console.log('OK   koliesko nadol z ulice: prológ beží'); } catch { console.log('FAIL koliesko nadol z ulice nespustilo prológ'); }
try { await page.waitForFunction(() => !window.BS30_FILM.state.pro && Math.abs(window.BS30_FILM.state.S - 1) < 0.05, null, { timeout: 15000 }); console.log('OK   prológ dobehol na rohožku (S≈1), scrollY', await page.evaluate(() => window.scrollY)); } catch { console.log('FAIL prológ nedobehol', JSON.stringify(await page.evaluate(() => { const s = window.BS30_FILM.state; return { S: s.S, T: s.T, pro: s.pro }; }))); }
if (errs.length) console.log('chyby:', errs);
await browser.close(); srv.server.close();
