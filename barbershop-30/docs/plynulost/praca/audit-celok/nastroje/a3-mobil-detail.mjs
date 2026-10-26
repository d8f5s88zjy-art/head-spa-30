#!/usr/bin/env node
// A3: podrobnosti použiteľnosti na telefóne 390×844 – text pod 12 px (s rodičmi) a dotykové ciele pod 44 px podľa tried
// (výška/šírka, či majú rozostup ≥ 24 px podľa WCAG 2.5.8).   node a3-mobil-detail.mjs [--port=8885] [--stranka=index.html]
import { spawn } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny', PORT = +(opt.port || 8885), S = opt.stranka || 'index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('python3', ['-I', '-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/barbershop-30/${S}`)).ok) break; } catch (e) { await sleep(200); } }
const b = await chromium.launch({ headless: true });
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/barbershop-30/${S}?uvod=off`, { waitUntil: 'load' });
  await sleep(1500);
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 800) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(120); }
  const r = await p.evaluate(() => {
    const vis = (el) => { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const cesta = (el) => { const a = []; for (let e = el; e && e !== document.body && a.length < 3; e = e.parentElement) a.unshift(e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : '')); return a.join(' > '); };
    const male = [];
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) { const t = n.nodeValue.trim(); if (t.length < 2) continue; const el = n.parentElement; if (!vis(el) || el.closest('[aria-hidden="true"],.visually-hidden,script,style,noscript,template')) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 12) male.push(`${fs.toFixed(1)}px ${cesta(el)} „${t.slice(0, 40)}“`); }
    const ciele = new Map();
    const els = [...document.querySelectorAll('a[href], button, summary')].filter(vis);
    const rect = els.map((e) => e.getBoundingClientRect());
    els.forEach((el, i) => {
      const b = rect[i];
      if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && el.parentElement.innerText.trim().length > el.innerText.trim().length + 3) return;
      if (b.width >= 44 && b.height >= 44) return;
      // WCAG 2.5.8: kruh s priemerom 24 px okolo stredu nesmie zasiahnuť iný cieľ
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const prekryv = rect.some((o, j) => j !== i && Math.max(o.left - cx, 0, cx - o.right) ** 2 + Math.max(o.top - cy, 0, cy - o.bottom) ** 2 < 12 * 12);
      const k = `${cesta(el)} ${Math.round(b.width)}×${Math.round(b.height)}${b.width < 24 || b.height < 24 ? ' POD 24 px' : ''}${prekryv ? ' BLÍZKO INÉHO CIEĽA' : ''}`;
      ciele.set(k, (ciele.get(k) || 0) + 1);
    });
    return { male, ciele: [...ciele].map(([k, v]) => `${v}× ${k}`) };
  });
  // skutočná ťukacia plocha (aj neviditeľný presah cez ::before/::after): od stredu cieľa hore, dole, doľava a doprava,
  // kým elementFromPoint vracia ten istý odkaz
  const plochy = await p.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const vis = (el) => { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const out = new Map();
    for (const el of [...document.querySelectorAll('a[href], button, summary')].filter(vis)) {
      const b0 = el.getBoundingClientRect();
      if (b0.width >= 44 && b0.height >= 44) continue;
      if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && el.parentElement.innerText.trim().length > el.innerText.trim().length + 3) continue;
      el.scrollIntoView({ block: 'center', behavior: 'instant' }); await sleep(30);
      const b = el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const zasah = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
      if (!zasah(cx, cy)) { const k = `${el.className ? String(el.className).split(' ')[0] : el.tagName} ZAKRYTÝ v strede`; out.set(k, (out.get(k) || 0) + 1); continue; }
      let hore = 0, dole = 0, vl = 0, vp = 0;
      while (hore < 40 && zasah(cx, cy - hore - 1)) hore++;
      while (dole < 40 && zasah(cx, cy + dole + 1)) dole++;
      while (vl < 60 && zasah(cx - vl - 1, cy)) vl++;
      while (vp < 60 && zasah(cx + vp + 1, cy)) vp++;
      const h = hore + dole + 1, w = vl + vp + 1;
      const k = `${el.tagName.toLowerCase()}.${el.className ? String(el.className).split(' ')[0] : ''} viditeľný ${Math.round(b.width)}×${Math.round(b.height)} → ťukacia plocha ${w}×${h}${h < 44 || w < 44 ? ' POD 44' : ''}${h < 24 || w < 24 ? ' POD 24' : ''}`;
      out.set(k, (out.get(k) || 0) + 1);
    }
    return [...out].map(([k, v]) => `${v}× ${k}`);
  });
  console.log('skutočné ťukacie plochy (elementFromPoint):\n  ' + plochy.join('\n  '));
  console.log(`${S} 390 px – text pod 12 px:\n  ${r.male.join('\n  ') || '-'}\ndotykové ciele pod 44×44 px:\n  ${r.ciele.join('\n  ')}`);
  await ctx.close();
} finally { await b.close(); srv.kill(); }
