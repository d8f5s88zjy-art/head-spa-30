#!/usr/bin/env node
// A3: ktoré znaky chýbajú vo woff2 písmach webu (podmnožiny): canvas measureText „písmo, monospace“ vs „monospace“.
// Znak, ktorý má v oboch rovnakú šírku pri dvoch rôznych záložných písmach, v písme webu nie je.
//   node a3-glyfy.mjs [--port=8889] [--znaky=...]
import { spawn } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const PORT = +(opt.port || 8889);
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny';
const ZNAKY = opt.znaky || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789€–—·’\'"?!.,:;()&@/+%áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('python3', ['-I', '-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/barbershop-30/index.html`)).ok) break; } catch (e) { await sleep(200); } }
const b = await chromium.launch({ headless: true });
try {
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/barbershop-30/index.html?film=off&uvod=off`, { waitUntil: 'load' });
  const r = await p.evaluate(async (ZNAKY) => {
    const F = [['Manrope', '400', 'normal'], ['Manrope', '600', 'normal'], ['Manrope', '700', 'normal'], ['Fraunces', '500', 'normal'], ['Fraunces', '800', 'normal'], ['Fraunces', '500', 'italic']];
    for (const [f, w, s] of F) await document.fonts.load(`${s} ${w} 40px ${f}`, ZNAKY);
    const c = document.createElement('canvas').getContext('2d');
    const out = {};
    for (const [f, w, s] of F) {
      const chyba = [];
      for (const ch of ZNAKY) {
        const m = (fam) => { c.font = `${s} ${w} 40px ${fam}`; return c.measureText(ch).width; };
        if (m(`"${f}", monospace`) === m('monospace') && m(`"${f}", serif`) === m('serif')) chyba.push(ch);
      }
      out[`${f} ${w}${s === 'italic' ? 'i' : ''}`] = chyba.join('');
    }
    return out;
  }, ZNAKY);
  for (const [k, v] of Object.entries(r)) console.log(`${k.padEnd(14)} chýba: ${v || '-'}`);
} finally { await b.close(); srv.kill(); }
