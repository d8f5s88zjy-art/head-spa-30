#!/usr/bin/env node
// Prehliadka stránky na telefóne: snímky okna po krokoch skrolu (360/390/430 px, tablet, počítač) a prehľad.
//   node source/tools/mobil-audit.mjs [--q=uvod=off&film=off] [--w=360,390,430,768,1440] [--out=dir] [--krok=0.85]
// Na každej šírke: vodorovné pretekanie, prekryv pevných ovládačov, podiel takmer čiernych bodov v každej snímke.
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { startStaticServer, PRESETS } = await import(path.join(SITE, 'source', 'shot.mjs'));
const require = createRequire(path.join(SITE, 'source', 'shot.mjs'));
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const OUT = path.resolve(opt.out || path.join(SITE, 'docs', 'screenshots', 'mobil'));
fs.mkdirSync(OUT, { recursive: true });
const Q = opt.q || 'uvod=off&film=off&hudba=off';
const WS = String(opt.w || '360,390,430,768,1440').split(',').map(Number);
const KROK = Number(opt.krok || 0.85);
const srv = await startStaticServer(SITE);
const browser = await chromium.launch(PRESETS[0]);
const report = {};
for (const w of WS) {
  const mobile = w < 700, h = w >= 1000 ? 900 : w >= 700 ? 1024 : (w === 360 ? 780 : w === 390 ? 844 : 932);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${srv.origin}/index.html?${Q}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1500);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const files = [];
  for (let y = 0, i = 0; y < H; y += Math.round(h * KROK), i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await page.waitForTimeout(450);
    const f = path.join(OUT, `w${w}-${String(i).padStart(2, '0')}.png`);
    await page.screenshot({ path: f });
    files.push(f);
  }
  const info = await page.evaluate(() => {
    const over = document.documentElement.scrollWidth - innerWidth;
    const fixed = [...document.querySelectorAll('body *')].filter((e) => { const s = getComputedStyle(e); return (s.position === 'fixed' || s.position === 'sticky') && s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.05 && e.getBoundingClientRect().height > 0; })
      .map((e) => ({ el: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ').slice(0, 2).join('.') : ''), r: e.getBoundingClientRect().toJSON() }));
    // prázdne kontajnery médií (video/obrázok skrytý alebo bez rozmeru, rámik ostal)
    const media = [...document.querySelectorAll('figure, .media, .video-window, picture')].map((e) => { const r = e.getBoundingClientRect(); const m = e.querySelector('img, video'); const mr = m ? m.getBoundingClientRect() : null; const ms = m ? getComputedStyle(m) : null;
      return { el: e.className || e.tagName, w: Math.round(r.width), h: Math.round(r.height), media: m ? m.tagName : null, mw: mr ? Math.round(mr.width) : 0, mh: mr ? Math.round(mr.height) : 0, hidden: ms ? (ms.display === 'none' || ms.visibility === 'hidden' || ms.opacity === '0') : null, loaded: m && m.tagName === 'IMG' ? m.complete && m.naturalWidth > 0 : m && m.tagName === 'VIDEO' ? m.readyState : null }; })
      .filter((x) => x.h > 40 && (!x.media || x.hidden || x.mw < x.w - 2 || x.mh < x.h - 2 || x.loaded === false || x.loaded === 0));
    return { over, fixed, media, H: document.documentElement.scrollHeight };
  });
  const tma = execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image\nfor f in sys.argv[1:]: h = Image.open(f).convert("L").histogram(); print(round(100 * sum(h[:18]) / sum(h)))', ...files]).toString().trim().split('\n').map(Number);
  report[w] = { ...info, tma, errs };
  // prehľad: snímky vedľa seba
  execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
fs = sys.argv[2:]; out = sys.argv[1]
ims = [Image.open(f).convert('RGB') for f in fs]
th = 520; ims = [i.resize((round(i.width * th / i.height), th)) for i in ims]
cols = min(len(ims), 8 if ims[0].width < 400 else 4); rows = (len(ims) + cols - 1) // cols
W = cols * (ims[0].width + 10) + 10; Hh = rows * (th + 34) + 10
c = Image.new('RGB', (W, Hh), (255, 255, 255)); d = ImageDraw.Draw(c)
for k, im in enumerate(ims):
    x = 10 + (k % cols) * (im.width + 10); y = 10 + (k // cols) * (th + 34)
    c.paste(im, (x, y)); d.text((x, y + th + 6), str(k), fill=(0, 0, 0))
c.save(out, quality=80)`, path.join(OUT, `prehlad-w${w}.jpg`), ...files]);
  console.log(`w${w}: výška ${info.H}, pretekanie ${info.over}px, snímok ${files.length}, tmavé (>70 % čiernej): ${tma.map((t, i) => t > 70 ? i + ':' + t + '%' : null).filter(Boolean).join(' ') || 'žiadne'}`);
  console.log('   pevné prvky:', info.fixed.map((f) => `${f.el} [${Math.round(f.r.left)},${Math.round(f.r.top)} ${Math.round(f.r.width)}x${Math.round(f.r.height)}]`).join(' | '));
  if (info.media.length) console.log('   médiá s medzerou/skryté:', JSON.stringify(info.media));
  if (errs.length) console.log('   chyby:', errs.join(' | '));
  await ctx.close();
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
await browser.close();
srv.close && srv.close();
process.exit(0);
