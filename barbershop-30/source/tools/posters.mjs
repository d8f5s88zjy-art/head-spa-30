#!/usr/bin/env node
// Vyrenderuje postery 3D kresla cez source/chair-dev.html (API renderPoster) a zapíše
// assets/img/poster-<view>-<w>.{avif,webp,jpg} + sekciu "posters" v assets/img/manifest.json.
//
//   node source/tools/posters.mjs                 # všetky pohľady
//   node source/tools/posters.mjs uvod-desktop    # len jeden pohľad
//   --out=<dir>     priečinok pre PNG medzivýsledky (default scratchpad/posters)
//   --procedural    ignoruje assets/model/kreslo.glb (postery z procedurálneho kresla)
//   --yaw=<deg>     otočenie GLB okolo Y (rovnaká hodnota musí ísť do options.modelYaw v app.js)
//
// Prevod PNG → AVIF/WebP/JPG robí Pillow (python3), pozri encode() nižšie.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { startStaticServer, PRESETS } from '../shot.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const IMG = path.join(ROOT, 'assets', 'img');

// Rovnaký záber ako 3D v scéne 1 (uvod) a 7 (rezervacia); šírky podľa CONTRACT §1.
export const POSTERS = {
  'uvod-desktop': { aspect: [16, 9], sizes: [[2200, 1238], [1600, 900], [1080, 608]] },
  'uvod-mobile': { aspect: [9, 19.5], sizes: [[1080, 2340], [640, 1387]] },
  'rezervacia-desktop': { aspect: [16, 9], sizes: [[2200, 1238], [1600, 900], [1080, 608]] },
  'rezervacia-mobile': { aspect: [9, 19.5], sizes: [[1080, 2340], [640, 1387]] },
};

function parseArgs(argv) {
  const pos = [], opt = {};
  for (const a of argv) { if (a.startsWith('--')) { const [k, v] = a.slice(2).split('='); opt[k] = v ?? true; } else pos.push(a); }
  return { pos, opt };
}

async function renderAll(views, outDir, extra = '') {
  fs.mkdirSync(outDir, { recursive: true });
  const srv = await startStaticServer(ROOT);
  const browser = await chromium.launch(PRESETS[0]);
  const files = [];
  try {
    for (const view of views) {
      const mobile = view.endsWith('mobile');
      const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, colorScheme: 'dark' });
      const page = await ctx.newPage();
      page.on('pageerror', (e) => console.error('[pageerror]', e.message));
      await page.goto(`${srv.origin}/source/chair-dev.html?view=${view}&dpr=1${extra}`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__renderDone === true, null, { timeout: 120000 });
      console.log(`${view}: model = ${await page.evaluate(() => window.__model)}`);
      for (const [w, h] of POSTERS[view].sizes) {
        const t0 = Date.now();
        const dataUrl = await page.evaluate(([w, h, view]) => window.__stage.renderPoster(w, h, view), [w, h, view]);
        const file = path.join(outDir, `poster-${view}-${w}.png`);
        fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
        files.push({ view, w, h, file });
        console.log(`${view} ${w}x${h} -> ${file} (${Date.now() - t0} ms)`);
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
    srv.server.close();
  }
  return files;
}

// Pillow: podklad = CSS gradient javiska (.stage-bg v style.css, rovnaké vrstvy), alfa‑kompozícia renderu, export 3 formátov.
function encode(files) {
  const py = `
import sys, json, io
from PIL import Image
import numpy as np
INK=np.array((0x0E,0x0D,0x0C),np.float32); WARM=np.array((0x1A,0x15,0x11),np.float32); LAMP=np.array((224,96,28),np.float32)
def backdrop(w,h):
    # PRESNE rovnaké vrstvy ako .stage-bg v assets/style.css (poster → 3D bez skoku):
    #   radial-gradient(60% 50% at 88% 30%, rgba(224,96,28,.08) 0%, transparent 70%),
    #   radial-gradient(120% 90% at 18% 100%, #1a1511 0%, transparent 60%), #0e0d0c
    x=(np.arange(w,dtype=np.float32)[None,:]+0.5)
    y=(np.arange(h,dtype=np.float32)[:,None]+0.5)
    # spodná vrstva: farba --ink, nad ňou teplý gradient s alfa 1 → 0
    r1=np.sqrt(((x-0.18*w)/(1.20*w))**2+((y-h)/(0.90*h))**2)/0.60
    a1=np.clip(1-r1,0,1)[...,None]
    base=INK*(1-a1)+WARM*a1
    # horná vrstva: oranžový závoj s alfa 0.08 → 0
    r2=np.sqrt(((x-0.88*w)/(0.60*w))**2+((y-0.30*h)/(0.50*h))**2)/0.70
    a2=(0.08*np.clip(1-r2,0,1))[...,None]
    rgb=base*(1-a2)+LAMP*a2
    return Image.fromarray(np.round(rgb).astype(np.uint8),'RGB')
out={}
for f in json.loads(sys.argv[1]):
    im=Image.open(f['file']).convert('RGBA')
    bg=backdrop(im.width,im.height).convert('RGBA')
    comp=Image.alpha_composite(bg,im).convert('RGB')
    base=f"${IMG.replace(/\\/g, '/')}/poster-{f['view']}-{f['w']}"
    comp.save(base+'.avif',quality=55,speed=4)
    comp.save(base+'.webp',quality=78,method=6)
    comp.save(base+'.jpg',quality=82,progressive=True,optimize=True)
    import os
    out.setdefault(f['view'],{})[str(f['w'])]={k:os.path.getsize(base+'.'+k) for k in ('avif','webp','jpg')}
print(json.dumps(out))
`;
  const r = spawnSync('python3', ['-I', '-c', py, JSON.stringify(files)], { encoding: 'utf-8', maxBuffer: 1 << 26 });
  if (r.status !== 0) { console.error(r.stderr); throw new Error('Pillow encode failed'); }
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

function writeManifest(sizes) {
  const mf = path.join(IMG, 'manifest.json');
  const json = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf-8')) : {};
  json.posters = json.posters || {};
  for (const [view, bySize] of Object.entries(sizes)) {
    json.posters[view] = {
      aspect: POSTERS[view].aspect,
      widths: POSTERS[view].sizes.map(([w]) => w),
      heights: POSTERS[view].sizes.map(([, h]) => h),
      formats: ['avif', 'webp', 'jpg'],
      scene: view.startsWith('uvod') ? 1 : 7,
      t: 0,
      alt: 'Štylizované barberské kreslo s čiernou prešívanou kožou a mosadzným rámom',
      background: 'zhodné s .stage-bg v assets/style.css (dve radiálne vrstvy nad #0e0d0c)',
      files: bySize,
    };
  }
  fs.writeFileSync(mf, JSON.stringify(json, null, 1) + '\n');
  console.log('manifest.json: posters =', Object.keys(json.posters).join(', '));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  const views = pos.length ? pos.filter((v) => POSTERS[v]) : Object.keys(POSTERS);
  const outDir = opt.out ? path.resolve(opt.out) : path.join(process.env.CLAUDE_SCRATCHPAD || os.tmpdir(), 'posters');
  const extra = (opt.procedural ? '&glb=0' : '') + (opt.yaw ? `&yaw=${Number(opt.yaw)}` : '');
  renderAll(views, outDir, extra).then((files) => { writeManifest(encode(files)); }).catch((e) => { console.error(e); process.exit(1); });
}
