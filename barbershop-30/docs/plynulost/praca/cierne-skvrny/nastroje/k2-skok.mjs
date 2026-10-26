// K2: čo je na plátne tesne po skoku na záber (goTo, ako pri skoku z menu) – farba čistenia je zelená (0,255,0),
// každých ~150 ms sa spočíta zelená vo viditeľnej časti (telefón: horných 45 % plátna, počítač: celé plátno).
// Použitie: node k2-skok.mjs [port] [desk|phone] [záber,záber,...]
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const PORT = +(process.argv[2] || 8810), MODE = process.argv[3] || 'phone';
const SHOTS = (process.argv[4] || 'kreslo-stred,sala-rano,vstup,sud').split(',');
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny';
let film = fs.readFileSync(ROOT + '/barbershop-30/assets/film.js', 'utf8');
const must = (s, a, b) => { if (!s.includes(a)) throw new Error('chýba: ' + a); return s.split(a).join(b); };
film = must(film, 'alpha: false, depth: true', 'alpha: true, preserveDrawingBuffer: true, depth: true');
film = must(film, 'renderer.setClearColor(0x0e0d0c, 1);', 'renderer.setClearColor(0x00ff00, 1);');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await browser.newContext(MODE === 'phone'
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
  : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.route('**/barbershop-30/assets/film.js*', (r) => r.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: film }));
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/index.html?asistent=ukazka&objednavka=ukazka&film=on&uvod=off`, { waitUntil: 'load' });
await page.mouse.wheel(0, 1); await page.mouse.wheel(0, -1);
console.log('film ready:', await page.evaluate(() => Promise.race([window.BS30_FILM.ready, new Promise((r) => setTimeout(() => r('timeout'), 60000))])));
await page.waitForTimeout(3000);
for (const name of SHOTS) {
  await page.evaluate((n) => window.BS30_FILM.goTo(n, 0.5), name);
  const t0 = Date.now(), rows = [];
  while (Date.now() - t0 < 3500) {
    rows.push(await page.evaluate(([phone]) => {
      const c = document.querySelector('canvas.film-canvas'), gl = c.getContext('webgl2');
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, hv = phone ? Math.round(h * 0.45) : h;
      const px = new Uint8Array(w * hv * 4);
      gl.readPixels(0, h - hv, w, hv, gl.RGBA, gl.UNSIGNED_BYTE, px);   // horná časť plátna (GL ráta zdola)
      let g = 0; for (let i = 0; i < px.length; i += 4) if (px[i + 1] > 110 && px[i] < 70 && px[i + 2] < 70) g++;
      const s = window.BS30_FILM.state, cv = getComputedStyle(c).opacity;
      return { g: +(100 * g / (w * hv)).toFixed(1), mix: +(+s.mix).toFixed(2), cur: s.current, op: cv, worldIn: document.documentElement.classList.contains('world-in') };
    }, [MODE === 'phone']));
    rows[rows.length - 1].ms = Date.now() - t0;
    await page.waitForTimeout(120);
  }
  console.log(name.padEnd(13), rows.map((r) => `${r.ms}ms:${r.g}%${r.op !== '1' ? '(op' + r.op + ')' : ''}${r.worldIn ? '' : '(bez world-in)'}`).join(' '));
  await page.waitForTimeout(1500);
}
await browser.close();
