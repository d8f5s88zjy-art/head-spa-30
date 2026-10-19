#!/usr/bin/env node
// Typografia telefón vs počítač (?film=off, celá stránka po 0,9 okna): každý viditeľný textový uzol (krytie ≥ 0,5,
// v okne) raz, s veľkosťou písma, triedou, počtom znakov a riadkov; súhrn podielu znakov pod 14 / 13 / 12 px,
// najmenšie písmo podľa prvkov, dĺžka riadku odsekov (znaky na riadok) a vodorovné pretečenie stránky.
//   node typo.mjs [--port=8211]  -> merania/typo.json + výpis
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const HERE = path.dirname(new URL(import.meta.url).pathname);
const DEVS = { p360: [360, 780, true], p390: [390, 844, true], d1440: [1440, 900, false], d1920: [1920, 1080, false] };
const browser = await chromium.launch();
const out = {};
for (const [dn, [w, h, mob]] of Object.entries(DEVS)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob, locale: 'sk-SK' });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${opt.port || 8211}/barbershop-30/?film=off`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (mob) await page.touchscreen.tap(5, 400); else await page.mouse.move(10, 300);
  await page.waitForTimeout(1500);
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const seen = new Map();
  for (let y = 0; y <= max + 1; y += Math.round(h * 0.9)) {
    await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, Math.min(y, max));
    await page.waitForTimeout(700);
    const items = await page.evaluate(() => {
      const vis = (el) => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden'; };
      const res = [];
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        const t = n.nodeValue.replace(/\s+/g, ' ').trim(); if (!t) continue;
        const el = n.parentElement; if (!el || el.closest('.visually-hidden,script,style,noscript,template,.marquee')) continue;
        const r = el.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= innerHeight || r.width < 1) continue;
        let o = 1, ok = true; for (let e = el; e; e = e.parentElement) { if (!vis(e)) { ok = false; break; } o *= parseFloat(getComputedStyle(e).opacity); }
        if (!ok || o < 0.5) continue;
        const s = getComputedStyle(el);
        const rg = document.createRange(); rg.selectNodeContents(n); const lines = new Set([...rg.getClientRects()].map((q) => Math.round(q.top))).size || 1;
        // kľúč: cesta prvku (aby sa ten istý text nerátal dvakrát)
        let key = '', e = el; for (let i = 0; e && i < 6; i++, e = e.parentElement) key = (e.className && typeof e.className === 'string' ? e.className.split(' ')[0] : e.nodeName) + '/' + key;
        res.push({ key: key + t.slice(0, 30), cls: (el.className && typeof el.className === 'string' && el.className.split(' ')[0]) || el.nodeName.toLowerCase(), par: (el.parentElement.className && typeof el.parentElement.className === 'string' && el.parentElement.className.split(' ')[0]) || '', fs: parseFloat(s.fontSize), fw: s.fontWeight, ls: s.letterSpacing, tt: s.textTransform, n: t.length, lines, w: Math.round(r.width), t: t.slice(0, 40) });
      }
      return res;
    });
    for (const it of items) if (!seen.has(it.key)) seen.set(it.key, it);
  }
  const ov = await page.evaluate(() => ({ sw: document.scrollingElement.scrollWidth, iw: innerWidth, pageH: document.documentElement.scrollHeight, screens: +(document.documentElement.scrollHeight / innerHeight).toFixed(1) }));
  const all = [...seen.values()];
  const chars = all.reduce((a, x) => a + x.n, 0);
  const share = (lim) => +(all.filter((x) => x.fs < lim).reduce((a, x) => a + x.n, 0) / chars * 100).toFixed(1);
  const byCls = {};
  for (const x of all) { const k = x.cls + (x.par ? '<' + x.par : ''); const b = byCls[k] || (byCls[k] = { fs: x.fs, n: 0, fw: x.fw, tt: x.tt, ls: x.ls, cpl: [] }); b.n += x.n; if (x.n > 40) b.cpl.push(Math.round(x.n / x.lines)); }
  const small = Object.entries(byCls).filter(([, b]) => b.fs < 14).sort((a, b) => a[1].fs - b[1].fs).map(([k, b]) => `${k} ${b.fs}px ${b.fw}${b.tt === 'uppercase' ? ' VERZÁLKY' : ''} (${b.n} zn.)`);
  const cpl = Object.entries(byCls).filter(([, b]) => b.cpl.length).map(([k, b]) => [k, b.fs, Math.round(b.cpl.reduce((a, v) => a + v, 0) / b.cpl.length)]).sort((a, b) => a[2] - b[2]);
  out[dn] = { viewport: [w, h], overflow: ov, znakov: chars, podielPod14: share(14), podielPod13: share(13), podielPod12: share(12), minPismo: Math.min(...all.map((x) => x.fs)), male: small, znakyNaRiadok: cpl };
  console.log(`\n== ${dn} ${w}×${h}: strana ${ov.pageH}px (${ov.screens} okien), scrollWidth ${ov.sw} vs ${ov.iw}; znakov ${chars}; pod 14 px ${share(14)} %, pod 13 px ${share(13)} %, pod 12 px ${share(12)} %`);
  console.log(' malé písmo (< 14 px):', small.join(' | '));
  console.log(' znaky na riadok (odseky > 40 zn.):', cpl.map(([k, f, c]) => `${k} ${f}px ${c}`).join(' | '));
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(HERE, 'merania', 'typo.json'), JSON.stringify(out, null, 1));
