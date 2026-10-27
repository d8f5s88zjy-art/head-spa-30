#!/usr/bin/env node
// Headless screenshots (desktop 1440x900 + mobile 390x844) of a page in this project.
//
// Usage:
//   node source/shot.mjs <url> <name> [scrollY] [waitMs]
//   node source/shot.mjs /source/webgl-test.html webgl-test
//   node source/shot.mjs /index.html home 1200 800
//   node source/shot.mjs https://example.com/ remote
//
// Options (anywhere in argv):
//   --scroll=<px>     scroll window to Y before the shot (same as positional scrollY); uses scrollTo({behavior:'instant'})
//   --wait=<ms>       extra settle time after load / render (default 400)
//   --preset=<n>      Chromium launch preset index (see PRESETS below; default 0)
//   --dpr=<n>         deviceScaleFactor for both viewports (default 1)
//   --full            full-page screenshot instead of viewport only
//   --out=<dir>       output dir (default <project>/docs/screenshots)
//   --only=desktop|mobile
//
// <url> may be:
//   - a path starting with "/" -> served from the project root by a built-in static server (free port)
//   - an absolute http(s) URL -> opened directly, no server started
//
// Output: <out>/<name>-desktop.png and <out>/<name>-mobile.png
//
// Pages that render WebGL can set window.__renderDone = false at module start and = true after the
// first frame; this script waits for it (max 20 s). Pages without the flag are not delayed.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Playwright is installed globally (not in this project). ESM `import` ignores NODE_PATH,
// CommonJS resolution honours it, so resolve the global package via createRequire.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Chromium launch presets. Index 0 is the one verified to produce a lit WebGL scene (SwiftShader via ANGLE).
export const PRESETS = [
  { headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  { headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox'] },
  { headless: true, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] },
  { headless: true, args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  { headless: true, args: ['--headless=new', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  { headless: true, args: [] },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream',
  '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
};

function parseArgs(argv) {
  const pos = [];
  const opt = {};
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      opt[k] = v === undefined ? true : v;
    } else pos.push(a);
  }
  return { pos, opt };
}

export function startStaticServer(root) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        if (urlPath.endsWith('/')) urlPath += 'index.html';
        const abs = path.normalize(path.join(root, urlPath));
        if (!abs.startsWith(root + path.sep) && abs !== root) { res.writeHead(403); return res.end('forbidden'); }
        fs.stat(abs, (err, st) => {
          if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('not found: ' + urlPath); }
          res.writeHead(200, {
            'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream',
            'Content-Length': st.size,
            'Cache-Control': 'no-store',
          });
          fs.createReadStream(abs).pipe(res);
        });
      } catch (e) { res.writeHead(500); res.end(String(e)); }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port, origin: `http://127.0.0.1:${port}` });
    });
  });
}

export async function shoot({ url, name, scrollY = 0, waitMs = 400, preset = 0, dpr = 1, full = false, outDir, only }) {
  outDir = outDir || path.join(PROJECT_ROOT, 'docs', 'screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  let srv = null;
  let target = url;
  if (!/^https?:\/\//i.test(url)) {
    srv = await startStaticServer(PROJECT_ROOT);
    target = srv.origin + (url.startsWith('/') ? url : '/' + url);
  }

  const launch = PRESETS[preset] || PRESETS[0];
  const tLaunch = Date.now();
  const browser = await chromium.launch(launch);
  const results = [];
  try {
    for (const [kind, vp] of Object.entries(VIEWPORTS)) {
      if (only && only !== kind) continue;
      const ctx = await browser.newContext({
        viewport: vp,
        deviceScaleFactor: Number(dpr) || 1,
        isMobile: kind === 'mobile',
        hasTouch: kind === 'mobile',
        colorScheme: 'dark',
        reducedMotion: 'no-preference',
      });
      const page = await ctx.newPage();
      const logs = [];
      page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
      page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

      const t0 = Date.now();
      await page.goto(target, { waitUntil: 'load', timeout: 60000 });
      // wait for an explicit render flag if the page exposes one (undefined -> no wait)
      try {
        await page.waitForFunction(() => window.__renderDone !== false, null, { timeout: 20000 });
      } catch { logs.push('[shot] timeout waiting for window.__renderDone'); }
      await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
      if (scrollY) {
        // okamžitý scroll (nie plynulý) – inak html{scroll-behavior:smooth} spôsobí čierne/rozbehnuté snímky
        await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Number(scrollY));
        await page.waitForTimeout(150);
      }
      if (waitMs > 0) await page.waitForTimeout(Number(waitMs));
      const info = await page.evaluate(() => ({
        renderMs: window.__renderMs ?? null,
        renderError: window.__renderError ?? null,
        renderDone: window.__renderDone ?? null,
      }));
      const file = path.join(outDir, `${name}-${kind}.png`);
      // pred snímkou dočasne vypni plynulé scrollovanie (screenshot s fullPage scrolluje stránku)
      await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
      await page.screenshot({ path: file, fullPage: !!full });
      const elapsed = Date.now() - t0;
      results.push({ kind, file, elapsedMs: elapsed, ...info, logs });
      console.log(`${kind.padEnd(7)} ${vp.width}x${vp.height}@${dpr}  ->  ${file}  (page ${elapsed} ms, renderMs=${info.renderMs ?? 'n/a'})`);
      for (const l of logs) console.log('   ', l);
      await ctx.close();
    }
  } finally {
    await browser.close();
    if (srv) srv.server.close();
  }
  console.log(`launch preset #${preset}: headless=${launch.headless} args=${JSON.stringify(launch.args)}; total ${Date.now() - tLaunch} ms`);
  return results;
}

// CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  const [url, name, scrollPos, waitPos] = pos;
  if (!url || !name) {
    console.error('usage: node source/shot.mjs <url|/path> <name> [scrollY] [waitMs] [--preset=n] [--dpr=n] [--full] [--out=dir] [--only=desktop|mobile]');
    process.exit(2);
  }
  shoot({
    url,
    name,
    scrollY: Number(opt.scroll ?? scrollPos ?? 0),
    waitMs: Number(opt.wait ?? waitPos ?? 400),
    preset: Number(opt.preset ?? 0),
    dpr: Number(opt.dpr ?? 1),
    full: !!opt.full,
    outDir: opt.out ? path.resolve(opt.out) : undefined,
    only: opt.only,
  }).catch((e) => { console.error(e); process.exit(1); });
}
