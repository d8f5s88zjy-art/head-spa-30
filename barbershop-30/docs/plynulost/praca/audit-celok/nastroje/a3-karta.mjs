#!/usr/bin/env node
// A3: čo uvidí zákazník po ťuknutí na „Vernostná kartička“ v pätičke, keď server kartičiek odpovedá 404
// (stav https://www.headspa30.sk/vernost/api/ k dátumu auditu). Server kartičiek sa napodobní odpoveďou 404.
//   node a3-karta.mjs [--port=8886] [--out=dir]
import path from 'node:path'; import { spawn } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny', PORT = +(opt.port || 8886), OUT = path.resolve(opt.out || '.');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('python3', ['-I', '-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/barbershop-30/index.html`)).ok) break; } catch (e) { await sleep(200); } }
const b = await chromium.launch({ headless: true });
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const p = await ctx.newPage();
  const api = [];
  await ctx.route('https://www.headspa30.sk/**', (r) => { api.push(r.request().url()); r.fulfill({ status: 404, contentType: 'text/html', body: '<!DOCTYPE html><title>Stránka sa nenašla | HEAD SPA 30 Nitra</title>' }); });
  await p.goto(`http://127.0.0.1:${PORT}/barbershop-30/index.html?uvod=off&film=off`, { waitUntil: 'load' });
  await sleep(1500);
  const odkaz = p.locator('footer a[data-vernost-karta]');
  console.log('odkaz v pätičke viditeľný:', await odkaz.isVisible(), '| text:', await odkaz.innerText());
  await odkaz.scrollIntoViewIfNeeded();
  await Promise.all([p.waitForLoadState('load'), odkaz.click()]);
  await sleep(6000);
  console.log('adresa po ťuknutí:', p.url().replace(`http://127.0.0.1:${PORT}`, ''));
  console.log('text stránky:', (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 300));
  console.log('požiadavky na server kartičiek:', api.join(', ') || '-');
  const f = path.join(OUT, 'karta-po-tuknuti-390.jpg');
  await p.screenshot({ path: f, type: 'jpeg', quality: 70 });
  console.log('snímka:', f);
} finally { await b.close(); srv.kill(); }
