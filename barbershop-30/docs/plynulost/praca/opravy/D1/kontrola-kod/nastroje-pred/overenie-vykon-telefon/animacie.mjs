#!/usr/bin/env node
/* Overenie T4: tikajú nekonečné animácie (ekvalizér hudby, lesk tlačidla, obiehajúce svetlo, pás služieb)
   na hlavnom vlákne? Stránka stojí (bez skrolu) N s na danom mieste; počíta sa UpdateLayoutTree, Paint a čas
   vlákna (CPU 1× = bez čakania na GPU). Hudba sa pustí ťuknutím (ako návštevník), alebo ?hudba=off.
   node animacie.mjs --y=0 [--hudba=on|off] [--sekund=8] [--film=off] [--cpu=1] [--css="..."] */
import { createRequire } from 'module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const CPU = Number(opt.cpu || 1), SEK = Number(opt.sekund || 8), Y = Number(opt.y || 0), FILM = opt.film || 'off';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(`http://127.0.0.1:8402/barbershop-30/?film=${FILM}&uvod=off${opt.hudba === 'on' ? '' : '&hudba=off'}`, { waitUntil: 'load' });
await page.waitForTimeout(1500);
await page.touchscreen.tap(200, 380);   // ťuknutie: pustí hudbu (atmosfera.js touchend/click)
await page.waitForTimeout(1500);
if (opt.css) await page.addStyleTag({ content: opt.css });
await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Y);
await page.waitForTimeout(3000);
const pred = await page.evaluate(() => ({ hudba: (document.querySelector('.hudba') || {}).ariaPressed || (document.querySelector('.hudba') && document.querySelector('.hudba').getAttribute('aria-pressed')), anim: document.getAnimations().filter((a) => a.playState === 'running').map((a) => { const t = a.effect && a.effect.target; return (t ? (t.tagName.toLowerCase() + '.' + [...t.classList].join('.')) : '?') + (a.effect.pseudoElement || '') + ' ' + a.animationName; }) }));
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.invalidationTracking', transferMode: 'ReturnAsStream' });
await page.waitForTimeout(SEK * 1000);
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end'); const { stream } = await done;
let raw = ''; for (;;) { const c = await cdp.send('IO.read', { handle: stream }); raw += c.data; if (c.eof) break; }
// vrstvy: animácie na kompozítore (Animation.* nemá priamy zoznam; použijeme LayerTree)
await browser.close();
const evs = JSON.parse(raw).traceEvents;
const tn = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
const M = evs.filter((e) => e.pid === tn.pid && e.tid === tn.tid);
const X = M.filter((e) => e.ph === 'X' && e.dur != null);
const ult = X.filter((e) => e.name === 'UpdateLayoutTree'), pnt = X.filter((e) => e.name === 'Paint');
const tasks = X.filter((e) => e.name === 'RunTask'); const top = []; let end = -1; for (const t of tasks.sort((a, b) => a.ts - b.ts)) if (t.ts >= end) { top.push(t); end = t.ts + t.dur; }
const inval = M.filter((e) => e.name === 'StyleRecalcInvalidationTracking' || e.name === 'StyleInvalidatorInvalidationTracking');
const reasons = {}; for (const e of inval) { const d = e.args && e.args.data; if (!d) continue; const k = (d.reason || d.invalidationList && 'list' || e.name) + ' | ' + (d.nodeName || ''); reasons[k] = (reasons[k] || 0) + 1; }
const td = (a) => a.reduce((s, e) => s + (e.tdur ?? e.dur), 0) / 1000;
const out = { y: Y, hudba: pred.hudba, cpu: CPU, sekund: SEK, css: opt.css || null, bezia: pred.anim,
  prepoctovStyluZaS: +(ult.length / SEK).toFixed(1), stylMsZaS: +(td(ult) / SEK).toFixed(2), paintZaS: +(pnt.length / SEK).toFixed(1), hlavneVlaknoMsZaS: +(td(top) / SEK).toFixed(1),
  dovody: Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 10) };
fs.writeFileSync(`vysledky/animacie-y${Y}-hudba-${opt.hudba || 'off'}${opt.meno ? '-' + opt.meno : ''}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
