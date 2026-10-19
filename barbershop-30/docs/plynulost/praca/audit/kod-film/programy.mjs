#!/usr/bin/env node
/* Ktoré shaderové programy sa prvýkrát použijú až počas skrolu (synchronné čakanie na preklad/zoznam uniformov).
   Každý program sa označí podľa časti zdrojového kódu fragment shadera (záber, sekvencia, strih, zjemnenie hĺbky),
   zapíše sa čas linkProgram, každé getProgramParameter (pname, trvanie) a prvé useProgram.
   node programy.mjs [--cpu=4] [--port=8248] [--out=programy.json] */
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PORT = opt.port || 8248, CPU = Number(opt.cpu || 4);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  const P = WebGL2RenderingContext.prototype, now = () => performance.now();
  const L = window.__PG = [];
  const lbl = (src) => /uMap2/.test(src) ? 'záber-sekvencia (FRAG_SEQ)' : /uDepth|uVig/.test(src) && /uMap/.test(src) ? 'záber-fotka (FRAG)' : /uKind/.test(src) ? 'strih (post)' : /tSrc/.test(src) ? 'zjemnenie-hĺbky (soft)' : 'iný';
  const ss = P.shaderSource; P.shaderSource = function (s, src) { s.__src = src; return ss.apply(this, arguments); };
  const at = P.attachShader; P.attachShader = function (p, s) { if (s.__src && /gl_FragColor|out highp vec4|pc_fragColor/.test(s.__src) && /void main/.test(s.__src) && !/gl_Position/.test(s.__src)) p.__lbl = lbl(s.__src); return at.apply(this, arguments); };
  const lp = P.linkProgram; P.linkProgram = function (p) { L.push([+now().toFixed(0), 'link', p.__lbl || '?', 0]); return lp.apply(this, arguments); };
  const gp = P.getProgramParameter; P.getProgramParameter = function (p, pn) { const s = now(); const r = gp.apply(this, arguments); const d = now() - s; L.push([+s.toFixed(0), 'getProgramParameter 0x' + pn.toString(16), p.__lbl || '?', +d.toFixed(1)]); return r; };
  const up = P.useProgram; P.useProgram = function (p) { if (p && !p.__used) { p.__used = 1; L.push([+now().toFixed(0), 'prvé useProgram', p.__lbl || '?', 0]); } return up.apply(this, arguments); };
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/?film=on&uvod=off`, { waitUntil: 'load' });
await sleep(2500);
const swipe = async (dist, ms) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700 }] });
  const t0 = Date.now(); for (;;) { const e = Math.min(1, (Date.now() - t0) / ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - dist * e }] }); if (e >= 1) break; await sleep(8); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
const marks = [];
await swipe(160, 300); marks.push(['prvý dotyk', await page.evaluate(() => performance.now())]);
for (let i = 0; i < 40; i++) { const s = await page.evaluate(() => window.BS30_FILM.state.shown); if (s) break; await sleep(250); }
marks.push(['prvý snímok filmu', await page.evaluate(() => performance.now())]);
await sleep(3000);
// pomalý skrol k prvej sekvencii a cez prvý strih
for (let i = 0; i < 14; i++) { await swipe(300, 450); await sleep(600); const st = await page.evaluate(() => { const s = window.BS30_FILM.state; return [performance.now(), s.S, s.current, s.cut]; }); marks.push(['ťah ' + i + ' S=' + st[1].toFixed(2) + ' ' + st[2] + ' ' + (st[3] || ''), st[0]]); }
const L = await page.evaluate(() => window.__PG);
const r = { marks: marks.map(([n, t]) => [n, +t.toFixed(0)]), programy: L.filter((x) => x[1] !== 'getProgramParameter 0x91b1' || x[3] > 2) };
console.log(JSON.stringify(r, null, 0).replace(/\],\[/g, '],\n['));
if (opt.out) fs.writeFileSync(opt.out, JSON.stringify(r, null, 1));
await browser.close();
