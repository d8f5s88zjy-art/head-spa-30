// K2 (kód a shadery): cielené pokusy s upravenými kópiami assets/film.js.
// Strom sa nemení: upravený film.js sa podstrčí cez page.route, zvyšok stránky ide zo servera.
// Použitie: node k2-pokusy.mjs <variant> <výstupný priečinok> [port] [koreň stromu] [desk|phone]
//   varianty: zaklad | alfa | oprava | diery | rub | prazdna
//   alfa    = renderer s alpha:true + preserveDrawingBuffer: číta sa skutočná alfa, ktorú film píše do plátna
//   oprava  = alfa + priamy prechod píše alfu 1 (navrhovaná oprava)
//   diery   = farba čistenia plátna a cieľov zelená (0,255,0): každé nepokryté miesto (orezanie, odvrátené
//             trojuholníky, okraj mriežky) je zelené
//   rub     = mriežka obojstranná a odvrátená strana tyrkysová: ukáže, či je preklopená strana niekde vidieť
//   prazdna = prázdna textúra (blank) a plochá hĺbka zvýraznené: blank purpurová
//   okraj   = diery + poistka okraja (hĺbka v krajných 3 % fotky → 0); okrajoprava = oprava + poistka okraja
//   premenné: NODRIFT=1 bez stáleho pohybu kamery, RAW=1 uloží aj bezstratové RGB (PNG) na porovnanie variantov
//   dieryrt = diery + po každom stave sa prečítajú aj textúry strihu rtA/rtB (kde v nich ostala farba čistenia)
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const VARIANT = process.argv[2] || 'zaklad';
const OUT = process.argv[3] || './pokus-' + VARIANT;
const PORT = +(process.argv[4] || 8810);
const ROOT = process.argv[5] || '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny';
const MODE = process.argv[6] || 'desk';
fs.mkdirSync(OUT, { recursive: true });
const FILM = fs.readFileSync(path.join(ROOT, 'barbershop-30/assets/film.js'), 'utf8');

function must(s, a, b) { if (!s.includes(a)) throw new Error('vo film.js chýba: ' + a); return s.split(a).join(b); }
const alfa = (s) => must(s, 'alpha: false, depth: true', 'alpha: true, preserveDrawingBuffer: true, depth: true');
const VARIANTS = {
  zaklad: (s) => s,
  alfa,
  oprava: (s) => must(alfa(s), 'gl_FragColor = vec4(c, vZ);', 'gl_FragColor = vec4(c, uVig.w > 0.5 ? 1.0 : vZ);'),
  diery: (s) => must(alfa(s), 'renderer.setClearColor(0x0e0d0c, 1);', 'renderer.setClearColor(0x00ff00, 1);'),
  rub: (s) => must(must(alfa(s), 'vertexShader: VERT, fragmentShader: sq ? FRAG_SEQ : FRAG,', 'vertexShader: VERT, fragmentShader: sq ? FRAG_SEQ : FRAG, side: THREE.DoubleSide,'),
    'gl_FragColor = vec4(c, vZ);', 'gl_FragColor = vec4(c, vZ); if (!gl_FrontFacing) gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);'),
  prazdna: (s) => must(alfa(s), 'const blank = px(14, 13, 12)', 'const blank = px(255, 0, 255)'),
  // poistka okraja: hĺbka sa v krajných 3 % fotky stiahne na 0, okraj mriežky ostane na rovine steny a pri bočnom
  // posune kamery sa nevtiahne do záberu (okno v pokoji je od okraja fotky aspoň 4,8 %)
  okraj: (s) => must(VARIANTS.diery(s), 'float z = texture2D(uDepth, vUv).r;', 'float z = texture2D(uDepth, vUv).r; vec2 k2e = min(uv, 1.0 - uv); z *= smoothstep(0.0, 0.03, min(k2e.x, k2e.y));'),
  okrajoprava: (s) => must(VARIANTS.oprava(s), 'float z = texture2D(uDepth, vUv).r;', 'float z = texture2D(uDepth, vUv).r; vec2 k2e = min(uv, 1.0 - uv); z *= smoothstep(0.0, 0.03, min(k2e.x, k2e.y));'),
  // diery + sprístupnené textúry strihu rtA/rtB (čítajú sa po každom stave): kde v nich ostala farba čistenia
  dieryrt: (s) => must(VARIANTS.diery(s), 'const rtA = new THREE.WebGLRenderTarget(1, 1, rtOpt), rtB = new THREE.WebGLRenderTarget(1, 1, rtOpt);',
    'const rtA = new THREE.WebGLRenderTarget(1, 1, rtOpt), rtB = new THREE.WebGLRenderTarget(1, 1, rtOpt); window.__k2 = { renderer, rtA, rtB };'),
};
if (!VARIANTS[VARIANT]) throw new Error('neznámy variant ' + VARIANT);
let film = VARIANTS[VARIANT](FILM);
// NODRIFT=1: bez stáleho pohybu kamery (porovnanie dvoch variantov pixel po pixeli v tom istom stave)
if (process.env.NODRIFT) film = must(film, 'const DRIFT = phone ? 0.6 : 1;', 'const DRIFT = 0;');

const browser = await chromium.launch({
  executablePath: undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});
const ctx = await browser.newContext(MODE === 'phone'
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
  : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const log = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => log.push('pageerror: ' + e.message));
await page.route('**/barbershop-30/assets/film.js*', (r) => r.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: film }));
const url = `http://127.0.0.1:${PORT}/barbershop-30/index.html?asistent=ukazka&objednavka=ukazka&film=on&uvod=off`;
await page.goto(url, { waitUntil: 'load' });
await page.mouse.move(700, 450); await page.mouse.wheel(0, 1); await page.mouse.wheel(0, -1);
const ok = await page.evaluate(() => Promise.race([window.BS30_FILM.ready, new Promise((r) => setTimeout(() => r('timeout'), 60000))]));
console.log('film ready:', ok, await page.evaluate(() => { const s = window.BS30_FILM.state; return JSON.stringify({ on: s.on, shown: s.shown, phone: s.phone, dpr: s.dpr }); }));
if (ok !== true) { console.log(log.join('\n')); await browser.close(); process.exit(2); }

// stav plátna: surové pixely (s alfou), počty podľa variantu, obrázok so zvýraznením
async function grab(tag) {
  await page.evaluate(() => window.BS30_FILM.pause(true));
  await page.waitForTimeout(60);
  const r = await page.evaluate(({ VARIANT, RAW }) => {
    const c = document.querySelector('canvas.film-canvas');
    const gl = c.getContext('webgl2');
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let a0 = 0, aLow = 0, green = 0, cyan = 0, mag = 0, dark = 0, greenX = 0, cyanX = 0, magX = 0;
    const oc = new OffscreenCanvas(w, h), x = oc.getContext('2d'), id = x.createImageData(w, h), sim = x.createImageData(w, h), raw = RAW ? x.createImageData(w, h) : null;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const i = (yy * w + xx) * 4, o = ((h - 1 - yy) * w + xx) * 4;
      const R = px[i], G = px[i + 1], B = px[i + 2], A = px[i + 3];
      let oR = R, oG = G, oB = B;
      if (A === 0) a0++;
      if (A < 128) aLow++;
      if (R + G + B < 24) dark++;
      if (G > 110 && R < 25 && B < 25 && G > 4 * (R + B + 1)) green++;
      if (G > 110 && B > 110 && R < 25) cyan++;
      if (R > 110 && B > 110 && G < 20) mag++;
      // presné farby pokusov (bez vinetácie: farba čistenia v priamom prechode, rub a prázdna textúra)
      if (R <= 2 && G >= 253 && B <= 2) greenX++;
      if (R <= 2 && G >= 253 && B >= 253) cyanX++;
      if (R >= 253 && G <= 2 && B >= 253) magX++;
      if (A === 0 && (VARIANT === 'alfa' || VARIANT === 'oprava')) { oR = 255; oG = 0; oB = 255; }
      id.data[o] = oR; id.data[o + 1] = oG; id.data[o + 2] = oB; id.data[o + 3] = 255;
      if (raw) { raw.data[o] = R; raw.data[o + 1] = G; raw.data[o + 2] = B; raw.data[o + 3] = 255; }
      // napodobenina zobrazenia, ktoré pixel s alfou 0 nahradí podkladom stránky (--ink)
      const z = A === 0; sim.data[o] = z ? 14 : R; sim.data[o + 1] = z ? 13 : G; sim.data[o + 2] = z ? 12 : B; sim.data[o + 3] = 255;
    }
    const st = window.BS30_FILM.state;
    const toUrl = async (d) => { x.putImageData(d, 0, 0); const b = await oc.convertToBlob({ type: 'image/jpeg', quality: 0.82 }); const ab = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let k = 0; k < ab.length; k += 8192) s += String.fromCharCode.apply(null, ab.subarray(k, k + 8192)); return btoa(s); };
    const toPng = async (d) => { if (!d) return null; x.putImageData(d, 0, 0); const b = await oc.convertToBlob({ type: 'image/png' }); const ab = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let k = 0; k < ab.length; k += 8192) s += String.fromCharCode.apply(null, ab.subarray(k, k + 8192)); return btoa(s); };
    return (async () => ({ raw: await toPng(raw), w, h, a0, aLow, green, cyan, mag, dark, greenX, cyanX, magX, mix: st.mix, cut: st.cut, current: st.current, S: st.S, img: await toUrl(id), sim: await toUrl(sim) }))();
  }, { VARIANT, RAW: !!process.env.RAW });
  if (VARIANT === 'dieryrt') {
    const rt = await page.evaluate(async () => {
      const { renderer, rtA, rtB } = window.__k2, res = {};
      for (const [n, t] of [['A', rtA], ['B', rtB]]) {
        const w = t.width, h = t.height, px = new Uint8Array(w * h * 4);
        renderer.readRenderTargetPixels(t, 0, 0, w, h, px);
        let g = 0; const oc = new OffscreenCanvas(w, h), x = oc.getContext('2d'), id = x.createImageData(w, h);
        for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
          const i = (yy * w + xx) * 4, o = ((h - 1 - yy) * w + xx) * 4;
          if (px[i] <= 2 && px[i + 1] >= 253 && px[i + 2] <= 2) g++;
          id.data[o] = px[i]; id.data[o + 1] = px[i + 1]; id.data[o + 2] = px[i + 2]; id.data[o + 3] = 255;
        }
        x.putImageData(id, 0, 0);
        const b = new Uint8Array(await (await oc.convertToBlob({ type: 'image/jpeg', quality: 0.8 })).arrayBuffer());
        let s = ''; for (let k = 0; k < b.length; k += 8192) s += String.fromCharCode.apply(null, b.subarray(k, k + 8192));
        res[n] = { g, n: w * h, img: btoa(s) };
      }
      return res;
    });
    for (const n of ['A', 'B']) { fs.writeFileSync(path.join(OUT, tag + '-rt' + n + '.jpg'), Buffer.from(rt[n].img, 'base64')); console.log(`   rt${n}: farba čistenia (zelená) ${rt[n].g} px = ${(100 * rt[n].g / rt[n].n).toFixed(2)} %`); }
  }
  await page.evaluate(() => window.BS30_FILM.pause(false));
  fs.writeFileSync(path.join(OUT, tag + '.jpg'), Buffer.from(r.img, 'base64'));
  if (VARIANT === 'alfa') fs.writeFileSync(path.join(OUT, tag + '-safari-napodobenina.jpg'), Buffer.from(r.sim, 'base64'));
  if (r.raw) fs.writeFileSync(path.join(OUT, tag + '-rgb.png'), Buffer.from(r.raw, 'base64'));
  delete r.img; delete r.sim; delete r.raw;
  const n = r.w * r.h;
  const line = `${tag.padEnd(34)} S=${r.S.toFixed(3)} mix=${(+r.mix).toFixed(3)} cut=${r.cut || '-'} ` +
    `alfa0=${(100 * r.a0 / n).toFixed(2)}% alfa<0.5=${(100 * r.aLow / n).toFixed(2)}% zelená=${r.green}/${r.greenX} tyrkys=${r.cyan}/${r.cyanX} purpur=${r.mag}/${r.magX} tmavé=${(100 * r.dark / n).toFixed(2)}%`;
  console.log(line);
  return r;
}
const waitReady = async (name) => {
  for (let i = 0; i < 200; i++) {
    const ok = await page.evaluate((n) => { const s = window.BS30_FILM.state; return s.ready.some((x) => (x.shot === n || x.shot === n + '-m') && x.ready); }, name);
    if (ok) return true;
    await page.waitForTimeout(150);
  }
  return false;
};
const shots = await page.evaluate(() => window.BS30_FILM.shots);
console.log('zábery:', shots.join(', '));
const rows = [];
const only = process.env.ZABERY ? process.env.ZABERY.split(',') : null;
for (const s of shots) {
  if (only && !only.includes(s)) continue;
  for (const t of (process.env.TT || '0.5').split(',').map(Number)) {
    await page.evaluate(([n, tt]) => window.BS30_FILM.goTo(n, tt), [s, t]);
    await waitReady(s);
    await page.waitForTimeout(+(process.env.SETTLE || 2500));
    rows.push(await grab(`${s}-t${t}`));
    if (process.env.MYS) {
      for (const [mx, my] of [[0, 0], [1439, 0], [0, 899], [1439, 899]]) {
        await page.mouse.move(mx, my); await page.waitForTimeout(1500);
        rows.push(await grab(`${s}-t${t}-mys${mx}x${my}`));
      }
      await page.mouse.move(720, 450);
    }
  }
}
// posledný záber (vstup na konci stránky): goTo('vstup') nájde prológ, preto skrol na koniec
if (!only || only.includes('koniec')) {
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(+(process.env.SETTLE || 2500) + 4000);
  rows.push(await grab('koniec-vstup'));
}
if (process.env.STRIHY) {
  const cuts = await page.evaluate(() => window.BS30_FILM.cuts);
  for (const [ci, c] of cuts.entries()) {
    if (only && !only.includes(c.from)) continue;
    // prvý strih je z prológu (fasáda): cutFreeze ho pozná pod menom 'pro'
    const from = ci === 0 && c.from === 'vstup' ? 'pro' : c.from;
    for (const m of process.env.STRIHY.split(',').map(Number)) {
      const ok = await page.evaluate(([n, v]) => window.BS30_FILM.cutFreeze(n, v), [from, m]);
      if (!ok) continue;
      await waitReady(c.from); await waitReady(c.to);
      await page.waitForTimeout(+(process.env.SETTLE || 2500));
      rows.push(await grab(`strih-${c.from}-${c.to}-m${m}`));
    }
  }
  await page.evaluate(() => window.BS30_FILM.cutFreeze(null));
}
fs.writeFileSync(path.join(OUT, 'vysledky.json'), JSON.stringify(rows, null, 1));
if (log.length) console.log('konzola:\n' + log.slice(0, 20).join('\n'));
await browser.close();
