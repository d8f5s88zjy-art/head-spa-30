#!/usr/bin/env node
/* Overenie T2: čo robí film, keď sa návštevník nehýbe (jedno ťuknutie, potom N s bez pohybu).
   Počet nakreslených snímok (BS30_FILM.state.frames), kreslení a prechodov do render targetu na snímku,
   čas vlákna hlavného vlákna (pri CPU 1× bez čakania na GPU), CPU procesov GPU a renderera (/proc).
   node necinnost.mjs [--cpu=1] [--sekund=15] [--y=0] */
import { createRequire } from 'module';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const CPU = Number(opt.cpu || 1), SEK = Number(opt.sekund || 15), Y = Number(opt.y || 0);
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
await ctx.addInitScript({ content: fs.readFileSync('ab/gl-kreslenie.js', 'utf8') });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto('http://127.0.0.1:8544/barbershop-30/?film=on&uvod=off&hudba=off', { waitUntil: 'load' });
await page.touchscreen.tap(30, 450);
for (let i = 0; i < 60; i++) { if (await page.evaluate(() => document.documentElement.classList.contains('world-in'))) break; await page.waitForTimeout(500); }
if (Y) await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Y);
await page.waitForTimeout(10000);                                // načítanie záberov dobehne
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await page.touchscreen.tap(200, 300);                            // jedno ťuknutie (bez posunu)
await page.waitForTimeout(500);
const gpuPid = () => { try { return execSync("pgrep -f 'type=gpu-process' -n").toString().trim(); } catch (e) { return null; } };
const cpuOf = (pid) => { try { const f = fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1].split(' '); return (Number(f[11]) + Number(f[12])) / 100; } catch (e) { return 0; } };
const gp = gpuPid();
const s0 = await page.evaluate(() => ({ fr: BS30_FILM.state.frames, d: window.__glDraw.snimky.length }));
const g0 = cpuOf(gp), w0 = Date.now();
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
await page.waitForTimeout(SEK * 1000);
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end'); const { stream } = await done;
let raw = ''; for (;;) { const c = await cdp.send('IO.read', { handle: stream }); raw += c.data; if (c.eof) break; }
const g1 = cpuOf(gp), w1 = Date.now();
const s1 = await page.evaluate((d0) => ({ fr: BS30_FILM.state.frames, mix: BS30_FILM.state.mix, dpr: BS30_FILM.state.dpr, snimky: window.__glDraw.snimky.slice(d0) }), s0.d);
await browser.close();
const evs = JSON.parse(raw).traceEvents;
const tn = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
const M = evs.filter((e) => e.pid === tn.pid && e.tid === tn.tid && e.ph === 'X' && e.dur != null);
const tasks = M.filter((e) => e.name === 'RunTask'); const top = []; let end = -1; for (const t of tasks.sort((a, b) => a.ts - b.ts)) if (t.ts >= end) { top.push(t); end = t.ts + t.dur; }
const filmF = M.filter((e) => e.name === 'FunctionCall' && e.args && e.args.data && /film\.js/.test(e.args.data.url || '') && e.args.data.functionName === 'frame');
const td = (a) => a.reduce((s, e) => s + (e.tdur ?? e.dur), 0) / 1000;
const fr = s1.fr - s0.fr;
const pas = s1.snimky.map((x) => x.f);
const out = { cpu: CPU, sekund: SEK, y: Y, nakreslenychSnimok: fr, snimokZaSekundu: +(fr / SEK).toFixed(1), dpr: s1.dpr, mixNaKonci: s1.mix,
  kresleniNaSnimku: s1.snimky.length ? +(s1.snimky.reduce((a, x) => a + x.d, 0) / s1.snimky.length).toFixed(2) : 0,
  snimokSRenderTargetom: pas.filter((x) => x > 0).length, snimokBezRenderTargetu: pas.filter((x) => x === 0).length,
  hlavneVlaknoMsSpolu: +td(top).toFixed(0), hlavneVlaknoPodiel: +(100 * td(top) / (SEK * 1000)).toFixed(1),
  filmFrameMsNaSnimku: filmF.length ? +(td(filmF) / filmF.length).toFixed(2) : null, filmFrameVolani: filmF.length,
  gpuProcesCpuPodiel: +(100 * (g1 - g0) / ((w1 - w0) / 1000)).toFixed(0), zataz: fs.readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3) };
fs.writeFileSync(`vysledky/necinnost-cpu${CPU}-y${Y}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
