#!/usr/bin/env node
// Dizajn audit hotovej stránky v prehliadači: typografia, rozostupy, kontrast, dotykové plochy, štruktúra,
// rozloženie, pohyb a chyby konzoly na viacerých šírkach. Všeobecný nástroj, nie je viazaný na konkrétny web.
//
//   node dizajn-audit.mjs <url-alebo-cesta-k-html> <výstupný-priečinok> [--sirky=390,768,1440] [--bez-snimok] [--cakaj=ms]
//
//   <url-alebo-cesta-k-html>  http(s):// adresa, alebo cesta k .html (aj file://). Pre súbor sa spustí malý statický
//                             server (node:http, voľný port) nad jeho priečinkom: cez file:// prehliadač blokuje
//                             písma (CORS) a fetch, výsledok by nezodpovedal webu.
//   <výstupný-priečinok>      sem idú sprava.json, sprava.md a snimka-<šírka>.png (priečinok sa vytvorí)
//   --sirky                   šírky okna v px; výška 844 pri 390 (a pod 600), 1024 pri 768 (a pod 1024), inak 900
//   --bez-snimok              bez snímok celej stránky (rýchlejšie)
//   --cakaj                   ms čakania po načítaní a písmach, kým dobehne úvod stránky (predvolené 1500)
//
// Pre každú šírku: 1) typografia (veľkosti písma, rodiny a či sa naozaj kreslia, dĺžka riadku, riadkovanie),
// 2) rozostupy (margin, padding, gap a škála 4 px), 3) kontrast podľa WCAG proti skutočnému pozadiu pod textom,
// 4) dotykové plochy pod 44 × 44 px (šírky pod 600), 5) štruktúra (h1, poradie nadpisov, alt, prístupné mená,
// jazyk), 6) rozloženie (vodorovné pretečenie a jeho pôvodcovia), 7) pohyb (druhý beh s prefers-reduced-motion),
// 8) chyby konzoly a neúspešné požiadavky. Podrobnosti a obmedzenia: ../references/audit.md.
//
// Návratový kód: 0 bez závažných nálezov, 1 pri závažných (kontrast pod 3:1 v bežnom texte, vodorovné
// pretečenie, žiadny alebo viac ako jeden h1, obrázok bez alt, chyby konzoly a zlyhané požiadavky), 2 chyba nástroja.
//
// Playwright: najprv modul z node_modules projektu (aktuálny priečinok a priečinok skriptu), potom NODE_PATH,
// globálny `npm root -g` a známe cesty (/opt/node22/lib/node_modules, /usr/local/lib/node_modules ...).
// Nič sa neinštaluje. Chromium: najprv podľa Playwrightu (PLAYWRIGHT_BROWSERS_PATH); keď ho nenájde, hľadá
// chrome-linux/chrome v /opt/pw-browsers, $PLAYWRIGHT_BROWSERS_PATH a ~/.cache/ms-playwright (executablePath).
// Prehliadač beží so SwiftShaderom (WebGL bez grafickej karty), ako ostatné nástroje v toolboxe.
//
// Zásahy do stránky počas merania (len v tomto prehliadači): obal requestAnimationFrame (počítadlo snímok),
// html{scroll-behavior:auto}, počas merania kontrastu dočasne pointer-events:auto (aby elementsFromPoint videl
// aj vrstvy s pointer-events:none) a na snímku pozadia dočasne priehľadný text bez tieňa.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const VERZIA = 'dizajn-audit 1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- argumenty
const argv = process.argv.slice(2);
const volby = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const poz = argv.filter((a) => !a.startsWith('--'));
if (poz.length < 2 || volby.help || volby.pomoc) {
  console.error('použitie: node dizajn-audit.mjs <url-alebo-cesta-k-html> <výstupný-priečinok> [--sirky=390,768,1440] [--bez-snimok] [--cakaj=ms]');
  process.exit(2);
}
const CIEL = poz[0];
const VYSTUP = path.resolve(poz[1]);
const SIRKY = String(volby.sirky || '390,768,1440').split(',').map((s) => parseInt(s, 10)).filter((n) => n > 0);
const BEZ_SNIMOK = !!volby['bez-snimok'];
const CAKAJ = Number(volby.cakaj ?? 1500);
if (!SIRKY.length || !Number.isFinite(CAKAJ)) { console.error('neplatné --sirky alebo --cakaj'); process.exit(2); }
const vyskaPre = (w) => (w < 600 ? 844 : w < 1024 ? 1024 : 900);

// ---------------------------------------------------------------- Playwright a Chromium
function nacitajPlaywright() {
  const req = createRequire(import.meta.url);
  const skusane = [];
  // 1) node_modules projektu (aktuálny priečinok, priečinok skriptu a ich rodičia)
  for (const zaklad of [path.join(process.cwd(), 'x.js'), fileURLToPath(import.meta.url)]) {
    try { return { pw: createRequire(zaklad)('playwright'), odkial: 'node_modules projektu' }; } catch (e) { skusane.push(zaklad); }
  }
  // 2) globálne priečinky s balíkmi
  const korene = [...(process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)];
  try { korene.push(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 }).toString().trim()); } catch { /* npm nemusí byť */ }
  korene.push('/opt/node22/lib/node_modules', '/usr/local/lib/node_modules', '/usr/lib/node_modules', '/usr/local/lib/node_modules_global', path.join(os.homedir(), '.npm-global/lib/node_modules'));
  for (const k of korene) {
    const p = path.join(k, 'playwright');
    if (fs.existsSync(path.join(p, 'package.json'))) { try { return { pw: req(p), odkial: p }; } catch (e) { skusane.push(p); } }
  }
  throw new Error('modul playwright sa nenašiel (skúšané: ' + skusane.concat(korene).join(', ') + '); nainštaluj ho do projektu alebo nastav NODE_PATH');
}
function najdiChromium() {
  const korene = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers', path.join(os.homedir(), '.cache/ms-playwright')].filter(Boolean);
  const nalez = [];
  for (const k of korene) {
    let polozky = [];
    try { polozky = fs.readdirSync(k); } catch { continue; }
    for (const p of polozky) {
      const m = /^(chromium|chromium_headless_shell)-(\d+)$/.exec(p);
      if (!m) continue;
      for (const rel of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-linux/headless_shell', 'chrome-headless-shell-linux64/chrome-headless-shell']) {
        const f = path.join(k, p, rel);
        if (fs.existsSync(f)) nalez.push({ f, rev: Number(m[2]), plny: m[1] === 'chromium' });
      }
    }
  }
  nalez.sort((a, b) => (b.plny - a.plny) || (b.rev - a.rev));
  return nalez[0]?.f || null;
}
const LAUNCH = { headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
async function spustiPrehliadac(chromium) {
  try { return await chromium.launch(LAUNCH); } catch (e) {
    const exe = najdiChromium();
    if (!exe) throw e;
    return chromium.launch({ ...LAUNCH, executablePath: exe });
  }
}

// ---------------------------------------------------------------- statický server pre súbor
const MIME = { '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.vtt': 'text/vtt' };
function spustiServer(koren) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        if (p.endsWith('/')) p += 'index.html';
        const abs = path.normalize(path.join(koren, p));
        if (abs !== koren && !abs.startsWith(koren + path.sep)) { res.writeHead(403); return res.end('zakázané'); }
        fs.stat(abs, (err, st) => {
          if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('nenájdené: ' + p); }
          const typ = MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream';
          // Range kvôli videu (prehliadač si pýta časti súboru)
          const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
          if (m && (m[1] || m[2])) {
            let a = m[1] ? Number(m[1]) : st.size - Number(m[2]);
            let b = m[1] && m[2] ? Number(m[2]) : st.size - 1;
            a = Math.max(0, a); b = Math.min(b, st.size - 1);
            if (a > b) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
            res.writeHead(206, { 'Content-Type': typ, 'Content-Length': b - a + 1, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
            return fs.createReadStream(abs, { start: a, end: b }).pipe(res);
          }
          res.writeHead(200, { 'Content-Type': typ, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
          fs.createReadStream(abs).pipe(res);
        });
      } catch (e) { res.writeHead(500); res.end(String(e)); }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` }));
  });
}

// ---------------------------------------------------------------- PNG (snímky z Chromia: 8 bit, RGB/RGBA, bez prekladania)
function dekodujPng(buf) {
  let pos = 8, w = 0, h = 0, hlbka = 0, typ = 0, prekl = 0;
  const idat = [];
  while (pos < buf.length) {
    const dlzka = buf.readUInt32BE(pos), meno = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + dlzka);
    if (meno === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); hlbka = data[8]; typ = data[9]; prekl = data[12]; }
    else if (meno === 'IDAT') idat.push(data);
    else if (meno === 'IEND') break;
    pos += 12 + dlzka;
  }
  if (hlbka !== 8 || (typ !== 2 && typ !== 6) || prekl) throw new Error('nepodporovaný PNG');
  const bpp = typ === 6 ? 4 : 3, riadok = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(h * riadok);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (riadok + 1)], src = y * (riadok + 1) + 1, dst = y * riadok;
    for (let x = 0; x < riadok; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0, b = y ? out[dst - riadok + x] : 0, c = x >= bpp && y ? out[dst - riadok + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[dst + x] = v & 255;
    }
  }
  return { w, h, bpp, data: out };
}
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const jas = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
// kontrast textu proti pixelom pozadia (text bez tieňa a priehľadný počas snímky): medián a najhorších 10 %
function kontrastZPixelov(png, obdlzniky, farba) {
  const pomery = [];
  let plocha = 0;
  for (const [x, y, w, h] of obdlzniky) plocha += w * h;
  const krok = Math.max(1, Math.round(Math.sqrt(plocha / 4000)));
  for (const [x0, y0, w, h] of obdlzniky) {
    for (let y = y0; y < y0 + h && y < png.h; y += krok) {
      for (let x = x0; x < x0 + w && x < png.w; x += krok) {
        if (x < 0 || y < 0) continue;
        const i = (y * png.w + x) * png.bpp;
        const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
        const tr = farba.r * farba.a + r * (1 - farba.a), tg = farba.g * farba.a + g * (1 - farba.a), tb = farba.b * farba.a + b * (1 - farba.a);
        const l1 = jas(tr, tg, tb), l2 = jas(r, g, b);
        pomery.push((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05));
      }
    }
  }
  if (!pomery.length) return null;
  pomery.sort((a, b) => a - b);
  const q = (p) => pomery[Math.min(pomery.length - 1, Math.floor(p * pomery.length))];
  return { median: q(0.5), najhorsich10: q(0.1), najmenej: pomery[0], vzoriek: pomery.length };
}

// ---------------------------------------------------------------- knižnica v stránke (window.__da)
// Celá sa prenesie do stránky cez page.evaluate, preto nesmie siahať na nič mimo seba.
function kniznica() {
  if (window.__da) return;
  const D = document;
  const gcs = (e) => getComputedStyle(e);
  const BEZ = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TITLE', 'HEAD', 'META', 'LINK', 'OPTION', 'OPTGROUP', 'DATALIST', 'IFRAME', 'OBJECT', 'EMBED', 'CANVAS', 'VIDEO', 'AUDIO', 'IMG', 'PICTURE', 'SOURCE', 'TRACK', 'BR', 'WBR', 'HR', 'TEXTAREA', 'INPUT', 'SELECT', 'MAP', 'AREA']);
  const MEDIA = new Set(['IMG', 'VIDEO', 'CANVAS', 'PICTURE', 'IFRAME', 'EMBED', 'OBJECT']);
  const ZNAK = /[\p{L}\p{N}]/u;
  const esc = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : s);
  const kolo = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

  // krátky selektor: id, inak značka s dvoma triedami (a poradím); skupina = bez poradia (opakované komponenty)
  function selektor(el, bezPoradia) {
    if (!el || el.nodeType !== 1) return '';
    const casti = [];
    let e = el;
    for (let i = 0; e && e.nodeType === 1 && i < 4; i++) {
      if (e.id && !/\s/.test(e.id)) { casti.unshift('#' + esc(e.id)); break; }
      const tag = e.tagName.toLowerCase();
      if (tag === 'html' || tag === 'body') { casti.unshift(tag); break; }
      let s = tag;
      const tr = [...e.classList].filter((c) => c.length < 40).slice(0, 2);
      if (tr.length) s += '.' + tr.map(esc).join('.');
      const p = e.parentElement;
      if (!bezPoradia && p) {
        const rov = [...p.children].filter((c) => c.tagName === e.tagName);
        if (rov.length > 1) s += `:nth-of-type(${rov.indexOf(e) + 1})`;
      }
      casti.unshift(s);
      e = p;
    }
    return casti.join(' > ');
  }
  const vlastnyText = (el) => { let t = ''; for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue; return t.replace(/\s+/g, ' ').trim(); };
  // vykreslený = nie display:none, visibility:hidden ani content-visibility:hidden (priehľadnosť sa tu neráta)
  function vykresleny(el) {
    if (!el || !el.isConnected) return false;
    if (el.checkVisibility) return el.checkVisibility({ visibilityProperty: true });
    return el.getClientRects().length > 0 && gcs(el).visibility !== 'hidden';
  }
  // vzor „len pre čítačky“: clip: rect(0 0 0 0) alebo clip-path: inset(50 %)
  function skrytyOrezom(s) {
    if (s.position === 'absolute' || s.position === 'fixed') {
      const m = /^rect\(([^)]*)\)/.exec(s.clip || '');
      if (m) { const v = m[1].split(/[\s,]+/).map(parseFloat); if (v.length === 4 && v.every(Number.isFinite) && (v[1] - v[3] <= 1 || v[2] - v[0] <= 1)) return true; }
    }
    const c = /^inset\(\s*([\d.]+)%/.exec(s.clipPath || '');
    return !!(c && parseFloat(c[1]) >= 50);
  }
  // viditeľná časť prvku po orezaní predkami (overflow, contain: paint), v súradniciach okna; null = nevidno.
  // dovod (nepovinné pole) dostane príčinu: 'malý', 'len pre čítačky', 'orezaný' a predka, ktorý orezal
  function obdlznik(el, min = 1.5, dovod) {
    const r = el.getBoundingClientRect();
    if (r.width < min || r.height < min) { if (dovod) dovod.push('nulová veľkosť', el); return null; }
    let L = r.left, T = r.top, R = r.right, B = r.bottom;
    const s = gcs(el);
    if (skrytyOrezom(s)) { if (dovod) dovod.push('len pre čítačky', el); return null; }
    if (s.position === 'fixed') return { L, T, R, B };
    const hs = gcs(D.documentElement);
    const teloNaOkno = hs.overflowX === 'visible' && hs.overflowY === 'visible';
    let abs = s.position === 'absolute';
    for (let a = el.parentElement; a && a !== D.documentElement; a = a.parentElement) {
      const as = gcs(a);
      if (skrytyOrezom(as)) { if (dovod) dovod.push('len pre čítačky', a); return null; }
      const blok = as.position !== 'static' || as.transform !== 'none' || as.filter !== 'none' || as.perspective !== 'none' || /layout|paint|strict|content/.test(as.contain);
      if (abs && !blok) continue;   // absolútny prvok uniká z orezania predkov, ktoré nie sú jeho kontajnerom
      abs = false;
      const telo = a === D.body && teloNaOkno;   // overflow tela prechádza na okno, telo samo neoreže
      const inl = as.display === 'inline' || as.display === 'contents';
      const cp = /paint|strict|content/.test(as.contain);
      const ox = !telo && !inl && (as.overflowX !== 'visible' || cp), oy = !telo && !inl && (as.overflowY !== 'visible' || cp);
      if (ox || oy) {
        const ar = a.getBoundingClientRect(), x0 = ar.left + a.clientLeft, y0 = ar.top + a.clientTop;
        if (ox) { L = Math.max(L, x0); R = Math.min(R, x0 + (a.clientWidth || ar.width)); }
        if (oy) { T = Math.max(T, y0); B = Math.min(B, y0 + (a.clientHeight || ar.height)); }
        if (R - L < 1 || B - T < 1) { if (dovod) dovod.push('orezaný predkom', a); return null; }
      }
      if (as.position === 'fixed') break;
      if (as.position === 'absolute') abs = true;
    }
    return { L, T, R, B };
  }
  const ariaSkryty = (el) => !!el.closest('[aria-hidden="true"], [inert], [hidden]');
  // obsah stránky pre typografiu a rozostupy: vykreslený, nie len pre čítačky; orezaný predkom sa ráta
  // (zavretý akordeón alebo panel je obsah, ktorý sa ukáže po otvorení)
  function obsahovy(el, min = 1.5) {
    if (!vykresleny(el)) return false;
    const dv = [];
    return !!obdlznik(el, min, dv) || dv[0] === 'orezaný predkom';
  }

  // farby: rgb()/rgba() priamo, ostatné zápisy (oklch, color-mix ...) cez plátno
  const plat = D.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const farbyCache = new Map();
  function farba(str) {
    let f = farbyCache.get(str);
    if (f) return f;
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(str || '');
    if (m) f = { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]) };
    else if (!str || str === 'transparent') f = { r: 0, g: 0, b: 0, a: 0 };
    else { plat.clearRect(0, 0, 1, 1); plat.fillStyle = '#000'; plat.fillStyle = str; plat.fillRect(0, 0, 1, 1); const d = plat.getImageData(0, 0, 1, 1).data; f = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 }; }
    farbyCache.set(str, f);
    return f;
  }
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const jas = (f) => 0.2126 * lin(f.r) + 0.7152 * lin(f.g) + 0.0722 * lin(f.b);
  const pomer = (a, b) => { const x = jas(a), y = jas(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const zmiesaj = (hore, dole) => ({ r: hore.r * hore.a + dole.r * (1 - hore.a), g: hore.g * hore.a + dole.g * (1 - hore.a), b: hore.b * hore.a + dole.b * (1 - hore.a), a: 1 });
  const hex = (f) => '#' + [f.r, f.g, f.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('') + (f.a < 0.999 ? Math.round(f.a * 255).toString(16).padStart(2, '0') : '');

  let opCache = new Map();
  const op = (e) => { let v = opCache.get(e); if (v === undefined) { v = parseFloat(gcs(e).opacity); if (!Number.isFinite(v)) v = 1; opCache.set(e, v); } return v; };
  const kumulOp = (e) => { let p = 1; for (let a = e; a && a.nodeType === 1; a = a.parentElement) p *= op(a); return p; };

  // ------------------------------------------------ čakanie na dobehnutie konečných animácií a prechodov
  async function dobehni(maxMs) {
    const koniec = performance.now() + maxMs;
    for (;;) {
      const bez = D.getAnimations().filter((a) => {
        if (a.playState !== 'running') return false;
        const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
        return t && Number.isFinite(t.endTime);
      });
      if (!bez.length || performance.now() > koniec) return bez.length;
      await Promise.race([Promise.all(bez.map((a) => a.finished.catch(() => 0))), new Promise((r) => setTimeout(r, Math.max(0, koniec - performance.now())))]);
    }
  }
  // ------------------------------------------------ pohyb: bežiace animácie (Web Animations) v tejto chvíli
  function animacie() {
    let beziace = 0, nekonecne = 0;
    const druhy = {}, mena = {};
    for (const a of D.getAnimations()) {
      if (a.playState !== 'running') continue;
      beziace++;
      const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
      const nek = !!(t && t.endTime === Infinity);
      if (nek) nekonecne++;
      const k = a.constructor ? a.constructor.name : 'Animation';
      druhy[k] = (druhy[k] || 0) + 1;
      const meno = a.animationName || a.transitionProperty || a.id || k;
      const kluc = meno + (nek ? ' (nekonečná)' : '');
      mena[kluc] = (mena[kluc] || 0) + 1;
    }
    let reduceCss = null;   // či štýly vôbec obsahujú @media (prefers-reduced-motion)
    try {
      reduceCss = false;
      const prejdi = (pravidla) => { for (const p of pravidla) { if (p.media && /prefers-reduced-motion/.test(p.media.mediaText)) reduceCss = true; if (p.cssRules) prejdi(p.cssRules); } };
      for (const sh of D.styleSheets) { try { prejdi(sh.cssRules); } catch { /* cudzí pôvod */ } }
    } catch { reduceCss = null; }
    return { beziace, nekonecne, druhy, mena, raf: typeof window.__daRaf === 'function' ? window.__daRaf() : null, reduceCss, plynulySkrol: gcs(D.documentElement).scrollBehavior };
  }

  // ------------------------------------------------ textové prvky (majú vlastný text s písmenom alebo číslicou)
  let T = [];
  function zoznamTextov() {
    T = [];
    const w = D.createTreeWalker(D.body || D.documentElement, NodeFilter.SHOW_ELEMENT, { acceptNode: (e) => (e instanceof SVGElement || BEZ.has(e.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    for (let e = w.currentNode; e; e = w.nextNode()) { const t = vlastnyText(e); if (t && ZNAK.test(t)) T.push(e); }
    return T.length;
  }
  const vaha = (s) => parseInt(s.fontWeight, 10) || (s.fontWeight === 'bold' ? 700 : 400);
  const velkyText = (s) => { const fs = parseFloat(s.fontSize); return fs >= 24 || (fs >= 18.66 && vaha(s) >= 700); };
  // obdĺžniky vlastného textu prvku (textové uzly) orezané na okno
  function textoveObdlzniky(el, vw, vh) {
    const out = [];
    const rng = D.createRange();
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !ZNAK.test(n.nodeValue)) continue;
      rng.selectNodeContents(n);
      for (const r of rng.getClientRects()) {
        const L = Math.max(0, r.left), T2 = Math.max(0, r.top), R = Math.min(vw, r.right), B = Math.min(vh, r.bottom);
        if (R - L >= 2 && B - T2 >= 2) out.push([Math.round(L), Math.round(T2), Math.round(R - L), Math.round(B - T2)]);
      }
    }
    return out;
  }

  // ------------------------------------------------ 1) typografia
  function typografia(W) {
    const velkosti = {}, rodiny = {}, riadkovanie = {};
    const fontPrvky = [];
    let pocet = 0;
    T.forEach((el, i) => {
      if (!obsahovy(el)) return;
      const s = gcs(el);
      pocet++;
      const fs = kolo(parseFloat(s.fontSize), 2);
      velkosti[fs] = (velkosti[fs] || 0) + 1;
      const prva = s.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
      const kluc = `${prva}|${vaha(s)}|${s.fontStyle}`;
      if (!rodiny[kluc]) rodiny[kluc] = { rodina: prva, zasobnik: s.fontFamily, vaha: vaha(s), rez: s.fontStyle, prvkov: 0, velkosti: {} };
      rodiny[kluc].prvkov++;
      rodiny[kluc].velkosti[fs] = (rodiny[kluc].velkosti[fs] || 0) + 1;
      fontPrvky.push({ i, kluc });
    });
    // odseky: blokové prvky bez blokových potomkov s textom aspoň 80 znakov a aspoň dvoma riadkami
    const odseky = [];
    const BLOK = /^(block|list-item|table-cell|flow-root)$/;
    const VNUTRO = /^(block|flex|grid|list-item|table|flow-root)/;
    const vsetky = D.body ? D.body.getElementsByTagName('*') : [];
    for (const el of vsetky) {
      if (el instanceof SVGElement || BEZ.has(el.tagName)) continue;
      const s = gcs(el);
      if (!BLOK.test(s.display)) continue;
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length < 80 || !ZNAK.test(text)) continue;
      let maBlok = false;
      for (const c of el.children) { if (VNUTRO.test(gcs(c).display) && (c.textContent || '').trim()) { maBlok = true; break; } }
      if (maBlok || !obsahovy(el)) continue;
      const fs = parseFloat(s.fontSize);
      const lh = s.lineHeight === 'normal' ? fs * 1.2 : parseFloat(s.lineHeight);
      const pl = parseFloat(s.paddingLeft) || 0, pr = parseFloat(s.paddingRight) || 0, pt = parseFloat(s.paddingTop) || 0, pb = parseFloat(s.paddingBottom) || 0;
      const sirka = el.clientWidth - pl - pr, vyska = el.clientHeight - pt - pb;
      if (sirka <= 0 || !lh) continue;
      const riadkov = Math.round(vyska / lh);
      if (riadkov < 2) continue;
      plat.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      const vzor = text.slice(0, 400);
      const ls = s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing) || 0;
      const znak = plat.measureText(vzor).width / vzor.length + ls;
      if (!znak) continue;
      const pomerLh = lh / fs;
      if (fs <= 24) { const k = kolo(pomerLh, 2); riadkovanie[k] = (riadkovanie[k] || 0) + 1; }
      odseky.push({ sel: selektor(el), skupina: selektor(el, true), znakov: Math.round(sirka / znak), riadkov, velkost: kolo(fs, 2), riadkovanie: kolo(pomerLh, 2), lhNormal: s.lineHeight === 'normal', text: text.slice(0, 50) });
    }
    const fonty = [...D.fonts].map((f) => ({ rodina: f.family.replace(/^["']|["']$/g, ''), vaha: f.weight, rez: f.style, stav: f.status, unicodeRange: f.unicodeRange }));
    return { pocet, velkosti, rodiny, riadkovanie, odseky, fonty, fontPrvky, sirka: W };
  }

  // ------------------------------------------------ 2) rozostupy
  function rozostupy() {
    const hodnoty = {}, priklady = {};
    let prvkov = 0;
    const pridaj = (v, el, vlast) => {
      v = Math.abs(v);
      if (!(v > 0.05)) return;
      const k = kolo(v, 1);
      hodnoty[k] = (hodnoty[k] || 0) + 1;
      if (!priklady[k]) priklady[k] = selektor(el) + ' {' + vlast + '}';
    };
    const vsetky = D.body ? D.body.getElementsByTagName('*') : [];
    for (const el of vsetky) {
      if (el instanceof SVGElement || BEZ.has(el.tagName) && !MEDIA.has(el.tagName)) continue;
      if (!obsahovy(el, 0.5)) continue;
      const s = gcs(el);
      if (s.display === 'contents') continue;
      prvkov++;
      const inl = s.display === 'inline';
      const ml = parseFloat(s.marginLeft) || 0, mr = parseFloat(s.marginRight) || 0;
      // centrovanie cez margin: auto nie je rozostup (rovnaké okraje dopĺňajú šírku rodiča)
      let auto = false;
      const p = el.parentElement;
      if (p && ml > 0 && Math.abs(ml - mr) < 1) { const ps = gcs(p); const vnutro = p.clientWidth - (parseFloat(ps.paddingLeft) || 0) - (parseFloat(ps.paddingRight) || 0); if (Math.abs(vnutro - el.getBoundingClientRect().width - ml - mr) < 1.5) auto = true; }
      if (!auto) { pridaj(ml, el, 'margin-left'); pridaj(mr, el, 'margin-right'); }
      if (!inl) { pridaj(parseFloat(s.marginTop) || 0, el, 'margin-top'); pridaj(parseFloat(s.marginBottom) || 0, el, 'margin-bottom'); }
      for (const v of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) pridaj(parseFloat(s[v]) || 0, el, v.replace(/[A-Z]/, (c) => '-' + c.toLowerCase()));
      if (/flex|grid/.test(s.display)) {
        if (s.rowGap !== 'normal') pridaj(parseFloat(s.rowGap) || 0, el, 'row-gap');
        if (s.columnGap !== 'normal') pridaj(parseFloat(s.columnGap) || 0, el, 'column-gap');
      }
    }
    return { prvkov, hodnoty, priklady };
  }

  // ------------------------------------------------ 4) dotykové plochy
  function dotyk() {
    const SEL = 'a[href], button, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="switch"], [role="radio"], input:not([type="hidden"]), select, textarea, summary';
    const out = [];
    let spolu = 0;
    for (const el of D.querySelectorAll(SEL)) {
      if (!vykresleny(el) || ariaSkryty(el) || el.closest('[disabled]')) continue;
      const o = obdlznik(el, 1);
      if (!o) continue;
      const r = el.getBoundingClientRect();
      if (r.right <= 0 || r.bottom + scrollY <= 0) continue;   // odložené mimo stránky (napr. odkaz na preskočenie)
      spolu++;
      let w = r.width, h = r.height;
      // pole vnútri <label> alebo s label[for]: ťuká sa na celý popis
      if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
        const lab = el.closest('label') || (el.id && D.querySelector(`label[for="${esc(el.id)}"]`));
        if (lab) { const lr = lab.getBoundingClientRect(); w = Math.max(w, lr.width); h = Math.max(h, lr.height); }
      }
      if (w >= 44 && h >= 44) continue;
      const s = gcs(el);
      const p = el.parentElement;
      const voVete = s.display === 'inline' && p && vlastnyText(p).length > 0;
      out.push({ sel: selektor(el), skupina: selektor(el, true), w: kolo(w, 1), h: kolo(h, 1), voVete, text: (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 40) });
    }
    return { spolu, male: out };
  }

  // ------------------------------------------------ 5) štruktúra (nadpisy, alt, jazyk); prístupné mená idú cez CDP
  function struktura() {
    const nadpisy = [];
    for (const el of D.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')) {
      if (!vykresleny(el) || ariaSkryty(el)) continue;
      const rola = el.getAttribute('role');
      if (rola && rola !== 'heading') continue;
      const lvl = parseInt(el.getAttribute('aria-level'), 10) || (/^H\d$/.test(el.tagName) ? +el.tagName[1] : 2);
      nadpisy.push({ uroven: lvl, sel: selektor(el), text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), lenCitacky: !obdlznik(el) });
    }
    const bezAlt = [];
    for (const img of D.querySelectorAll('img:not([alt]), input[type="image"]:not([alt])')) {
      if (!vykresleny(img) || ariaSkryty(img)) continue;
      const rola = img.getAttribute('role');
      if (rola === 'presentation' || rola === 'none') continue;
      if (img.getAttribute('aria-label') || img.getAttribute('aria-labelledby')) continue;
      bezAlt.push({ sel: selektor(img), skupina: selektor(img, true), src: (img.currentSrc || img.getAttribute('src') || '').split('/').pop().slice(0, 60) });
    }
    return { jazyk: D.documentElement.getAttribute('lang') || '', nadpisy, bezAlt };
  }

  // ------------------------------------------------ 6) rozloženie (vodorovné pretečenie)
  function rozlozenie(W) {
    scrollTo(0, scrollY);
    const de = D.documentElement;
    const hs = gcs(de), bs = D.body ? gcs(D.body) : hs;
    const korenOx = hs.overflowX !== 'visible' ? hs.overflowX : bs.overflowX;
    const korenOreze = korenOx === 'hidden' || korenOx === 'clip';
    const sw = de.scrollWidth, iw = innerWidth, mierka = window.visualViewport ? visualViewport.scale : 1;
    const zaSirkou = sw > W + 1;
    const pretecenie = (zaSirkou && !korenOreze) || iw > W + 1;
    const pricinne = [], orezane = [], pevne = [];
    const vsetky = D.body ? D.body.getElementsByTagName('*') : [];
    const nahlasene = new Set();
    for (const el of vsetky) {
      if (el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg') continue;
      if (BEZ.has(el.tagName) && !MEDIA.has(el.tagName)) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0 || r.right <= W + 1) continue;
      if (!vykresleny(el)) continue;
      // je v oreze predka (nie html/body)? absolútne prvky ignorujú predkov, ktorí nie sú ich kontajnerom
      let s = gcs(el), abs = s.position === 'absolute', pevny = s.position === 'fixed', zachyteny = false;
      for (let a = el.parentElement; a && a !== D.body && a !== de && !pevny; a = a.parentElement) {
        const as = gcs(a);
        const blok = as.position !== 'static' || as.transform !== 'none' || as.filter !== 'none' || /layout|paint|strict|content/.test(as.contain);
        if (abs && !blok) continue;
        abs = false;
        if (as.overflowX !== 'visible' && as.display !== 'inline' || /paint|strict|content/.test(as.contain)) { zachyteny = true; break; }
        if (as.position === 'fixed') pevny = true;
        if (as.position === 'absolute') abs = true;
      }
      if (zachyteny) continue;
      let predok = false;
      for (let a = el.parentElement; a; a = a.parentElement) if (nahlasene.has(a)) { predok = true; break; }
      if (predok) continue;
      nahlasene.add(el);
      const zaznam = { sel: selektor(el), skupina: selektor(el, true), vpravo: Math.round(r.right), sirka: Math.round(r.width), celyMimo: r.left >= W, priehladny: kumulOp(el) < 0.02 };
      if (pevny) pevne.push(zaznam); else if (korenOreze) orezane.push(zaznam); else pricinne.push(zaznam);
    }
    return { sirka: W, scrollWidth: sw, innerWidth: iw, mierka, korenOx, korenOreze, zaSirkou, pretecenie, pricinne: pricinne.slice(0, 25), orezane: orezane.slice(0, 25), pevne: pevne.slice(0, 25) };
  }

  // ------------------------------------------------ 3) kontrast: meranie textov, ktoré sú práve v okne
  const vysledky = new Map();   // index textu -> najlepšie meranie (najvyššia priehľadnosť)
  const hotove = new Set();
  function kontrastKrok() {
    opCache = new Map();
    const vw = D.documentElement.clientWidth, vh = innerHeight;
    const naSnimku = [];
    let zmerane = 0;
    T.forEach((el, i) => {
      if (hotove.has(i) || !el.isConnected) return;
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw || r.width < 1.5 || r.height < 1.5) return;
      if (el.closest('[disabled], [aria-disabled="true"]')) { hotove.add(i); return; }
      const obd = textoveObdlzniky(el, vw, vh);
      if (!obd.length) return;
      const [bx, by, bw, bh] = obd[0];
      const z = D.elementsFromPoint(bx + bw / 2, by + bh / 2);
      const k = z.indexOf(el);
      if (k < 0) return;   // prekryté iným prvkom alebo orezané, skúsi sa pri ďalšej polohe
      const kop = kumulOp(el);
      if (kop < 0.05) return;
      const s = gcs(el);
      const nejiste = [];
      // vrstvy nad textom (nie jeho potomkovia)
      for (let j = 0; j < k; j++) {
        const e = z[j];
        if (el.contains(e)) continue;
        const ko = kumulOp(e);
        if (ko < 0.03) continue;
        const es = gcs(e);
        if (MEDIA.has(e.tagName)) return;   // text je pod obrázkom, nevidno ho
        const bg = farba(es.backgroundColor), a = bg.a * ko;
        if (a >= 0.95) return;
        if (a > 0.03 || es.backgroundImage !== 'none') nejiste.push('vrstva nad textom ' + selektor(e));
      }
      // vrstvy pod textom: od samotného prvku nadol, po prvú nepriehľadnú
      const vrstvy = [];
      let zaklad = null, zakladEl = null;
      for (let j = k; j < z.length; j++) {
        const e = z[j];
        if (j > k && (MEDIA.has(e.tagName) || (e instanceof SVGElement))) {
          if (kumulOp(e) < 0.03) continue;
          if (e instanceof SVGElement && !MEDIA.has(e.tagName)) { if (!nejiste.includes('grafika SVG pod textom')) nejiste.push('grafika SVG pod textom'); continue; }
          nejiste.push(e.tagName === 'CANVAS' ? 'plátno (canvas) pod textom' : e.tagName === 'VIDEO' ? 'video pod textom' : 'obrázok pod textom');
          zakladEl = e; break;
        }
        const es = gcs(e);
        const bg = farba(es.backgroundColor), a = bg.a * op(e);
        if (es.backgroundImage && es.backgroundImage !== 'none' && kumulOp(e) > 0.03) {
          nejiste.push(/url\(/.test(es.backgroundImage) ? 'obrázok v pozadí' : 'prechod farieb v pozadí');
          if (a >= 0.995) zaklad = bg;
          zakladEl = e; break;
        }
        if (a > 0.003) { if (a >= 0.995) { zaklad = bg; zakladEl = e; break; } vrstvy.push({ ...bg, a }); }
      }
      let poz = zaklad ? { ...zaklad, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
      for (let j = vrstvy.length - 1; j >= 0; j--) poz = zmiesaj(vrstvy[j], poz);
      // priehľadnosť textu: prvok a predkovia, ktorí neobsahujú základ pozadia
      let top = 1;
      for (let a = el; a && a.nodeType === 1; a = a.parentElement) { if (zakladEl && a.contains(zakladEl)) break; top *= op(a); }
      for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
        const as = gcs(a);
        if (as.mixBlendMode && as.mixBlendMode !== 'normal') { nejiste.push('mix-blend-mode ' + as.mixBlendMode); break; }
      }
      if (/text/.test(s.backgroundClip || '') || /text/.test(s.webkitBackgroundClip || '')) nejiste.push('text s výplňou z pozadia (background-clip: text)');
      const tf = farba(s.webkitTextFillColor || s.color);
      const textF = { ...tf, a: tf.a * top };
      const p = pomer(zmiesaj(textF, poz), poz);
      const fs = parseFloat(s.fontSize);
      const zaznam = {
        i, sel: selektor(el), skupina: selektor(el, true), text: vlastnyText(el).slice(0, 50), velkost: kolo(fs, 2), vaha: vaha(s), velky: velkyText(s),
        farba: hex(textF), pozadie: hex(poz), pomer: kolo(p, 2), nejiste, tien: s.textShadow !== 'none', priehladnost: kolo(kop, 3),
        dekorativny: ariaSkryty(el), videnychPriehl: [kolo(kop, 3)],
      };
      const pred = vysledky.get(i);
      if (pred) { zaznam.videnychPriehl = pred.videnychPriehl.concat(zaznam.videnychPriehl); if (pred.priehladnost >= kop) { pred.videnychPriehl = zaznam.videnychPriehl; return; } }
      vysledky.set(i, zaznam);
      zmerane++;
      if (kop >= 0.99) hotove.add(i);
      if (nejiste.some((n) => /pod textom|v pozadí/.test(n))) naSnimku.push({ i, obd, farba: { r: tf.r, g: tf.g, b: tf.b, a: tf.a * top } });
    });
    return { zmerane, naSnimku };
  }
  // pozadie celej stránky je obrázok, video alebo plátno (pevné a cez aspoň polovicu okna)?
  function mediaPodStrankou() {
    const plocha = innerWidth * innerHeight;
    for (const e of D.querySelectorAll('img, video, canvas, picture, iframe')) {
      if (!vykresleny(e) || kumulOp(e) < 0.05) continue;
      const r = e.getBoundingClientRect();
      const w = Math.max(0, Math.min(innerWidth, r.right) - Math.max(0, r.left)), h = Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top));
      if (w * h < plocha * 0.5) continue;
      for (let a = e; a; a = a.parentElement) if (gcs(a).position === 'fixed') return selektor(e);
    }
    return '';
  }
  // záloha pre text, ktorý v žiadnej polohe nebol navrchu (zavretý panel, <details>, stále prekrytý):
  // pozadie z predkov v DOM, priehľadnosť sa ignoruje (zavretý panel býva aj priehľadný, otvorený nie)
  function kontrastZPredkov(el, i, dovod, media) {
    const s = gcs(el);
    const nejiste = dovod === 'orezaný predkom' || dovod === 'zavretý <details>' ? [] : ['v žiadnej polohe nebol navrchu'];
    const vrstvy = [];
    let zaklad = null, zakladEl = null;
    for (let a = el; a; a = a.parentElement) {
      const as = gcs(a);
      const bg = farba(as.backgroundColor);
      if (as.backgroundImage && as.backgroundImage !== 'none') {
        nejiste.push(/url\(/.test(as.backgroundImage) ? 'obrázok v pozadí' : 'prechod farieb v pozadí');
        if (bg.a >= 0.995) zaklad = bg;
        zakladEl = a; break;
      }
      if (bg.a > 0.003) { if (bg.a >= 0.995) { zaklad = bg; zakladEl = a; break; } vrstvy.push(bg); }
    }
    if ((!zakladEl || zakladEl === D.body || zakladEl === D.documentElement) && media) nejiste.push('pod stránkou je ' + media);
    let poz = zaklad ? { ...zaklad, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
    for (let j = vrstvy.length - 1; j >= 0; j--) poz = zmiesaj(vrstvy[j], poz);
    if (/text/.test(s.backgroundClip || '') || /text/.test(s.webkitBackgroundClip || '')) nejiste.push('text s výplňou z pozadia (background-clip: text)');
    const tf = farba(s.webkitTextFillColor || s.color);
    const p = pomer(zmiesaj(tf, poz), poz);
    return {
      i, sel: selektor(el), skupina: selektor(el, true), text: vlastnyText(el).slice(0, 50), velkost: kolo(parseFloat(s.fontSize), 2), vaha: vaha(s), velky: velkyText(s),
      farba: hex(tf), pozadie: hex(poz), pomer: kolo(p, 2), nejiste, tien: s.textShadow !== 'none', priehladnost: 1, dekorativny: ariaSkryty(el), videnychPriehl: [1],
      metoda: 'predkovia', dovod,
    };
  }
  function kontrastVysledky() {
    opCache = new Map();
    const media = mediaPodStrankou();
    for (const v of vysledky.values()) v.metoda = 'okno';
    T.forEach((el, i) => {
      if (vysledky.has(i) || !el.isConnected || el.closest('[disabled], [aria-disabled="true"]')) return;
      const vZavretom = !!el.closest('details:not([open])') && !el.closest('summary');
      if (!vykresleny(el) && !vZavretom) return;
      let dovod = vZavretom ? 'zavretý <details>' : null;
      if (!dovod) { const dv = []; const o = obdlznik(el, 1.5, dv); dovod = o ? 'nebol navrchu' : dv[0]; }
      if (dovod === 'len pre čítačky' || dovod === 'nulová veľkosť') return;
      vysledky.set(i, kontrastZPredkov(el, i, dovod, media));
    });
    const out = [...vysledky.values()];
    // prečo ostali texty bez merania: nevykreslené, skryté, orezané (napr. zavretý akordeón), prekryté
    const dovody = {}, priklady = {};
    T.forEach((el, i) => {
      if (vysledky.has(i)) return;
      let d, kde = '';
      if (!el.isConnected) d = 'odstránený zo stránky';
      else if (!vykresleny(el)) { d = 'nevykreslený (display: none, visibility: hidden)'; let a = el; while (a && a !== D.body) { if (gcs(a).display === 'none' || gcs(a).visibility === 'hidden') kde = selektor(a, true); a = a.parentElement; } }
      else if (el.closest('[disabled], [aria-disabled="true"]')) d = 'neaktívny ovládací prvok (WCAG výnimka)';
      else { const dv = []; const o = obdlznik(el, 1.5, dv); if (!o) { d = dv[0] || 'nevidno'; kde = dv[1] ? selektor(dv[1], true) : ''; } else d = 'v žiadnej polohe nebol navrchu (prekrytý alebo priehľadný)'; }
      dovody[d] = (dovody[d] || 0) + 1;
      const k = d + '|' + kde;
      if (!priklady[k]) priklady[k] = { dovod: d, kde, n: 0, text: vlastnyText(el).slice(0, 40) };
      priklady[k].n++;
    });
    for (const v of out) {
      const mn = Math.min(...v.videnychPriehl), mx = Math.max(...v.videnychPriehl);
      if (mx < 0.99) v.nejiste.push(mx - mn > 0.05 ? 'priehľadnosť sa mení so skrolom' : `priehľadnosť ${mx}`);
      delete v.videnychPriehl;
    }
    return { texty: T.length, zmerane: out.length, nezmerane: dovody, nezmeranePriklady: Object.values(priklady).sort((a, b) => b.n - a.n).slice(0, 15), vysledky: out };
  }
  // znaky textu, ktoré prvé písmo zo zásobníka nemá: s dvoma rôznymi záložnými rodinami vyjde iná šírka
  function chybajuceZnaky(i) {
    const el = T[i];
    if (!el) return '';
    const s = gcs(el);
    const prva = s.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
    const znaky = [...new Set((el.textContent || '').replace(/\s/g, ''))].slice(0, 200);
    const sirka = (ch, zal) => { plat.font = `${s.fontStyle} ${s.fontWeight} 40px "${prva}", ${zal}`; return plat.measureText(ch).width; };
    return znaky.filter((ch) => Math.abs(sirka(ch, 'monospace') - sirka(ch, 'serif')) > 0.01).join('');
  }
  // popis prvku pre nálezy z CDP (prístupný strom)
  function popis(el) { return { sel: selektor(el), skupina: selektor(el, true), tag: el.tagName, vykresleny: vykresleny(el), text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40), html: el.outerHTML.slice(0, 120) }; }

  window.__da = { dobehni, animacie, zoznamTextov, typografia, rozostupy, dotyk, struktura, rozlozenie, kontrastKrok, kontrastVysledky, popis, selektor, chybajuceZnaky, get T() { return T; } };
}

// počítadlo snímok requestAnimationFrame (pred skriptmi stránky)
const RAF_SKRIPT = `(() => { const o = window.requestAnimationFrame; if (!o || window.__daRaf) return; let n = 0;
  window.__daRaf = () => n; window.requestAnimationFrame = function (cb) { n++; return o.call(window, cb); }; })();`;
const STYL_SKROL = 'html, body { scroll-behavior: auto !important; }';
const STYL_KLIK = '*, *::before, *::after { pointer-events: auto !important; }';
const STYL_BEZ_PRECHODOV = '*, *::before, *::after { transition: none !important; }';
const STYL_BEZ_TEXTU = '*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; }';

// ---------------------------------------------------------------- beh jednej šírky
async function otvor(browser, url, W, reduced, zaznamy) {
  const H = vyskaPre(W), mob = W < 1024;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob, reducedMotion: reduced ? 'reduce' : 'no-preference', colorScheme: 'light' });
  await ctx.addInitScript(RAF_SKRIPT);
  const page = await ctx.newPage();
  const beh = reduced ? 'reduce' : 'bežný';
  page.on('pageerror', (e) => zaznamy.push({ druh: 'pageerror', beh, sirka: W, text: String(e.message || e).slice(0, 300) }));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/^Failed to load resource/.test(t)) return;   // tú istú chybu zapíše záznam požiadavky nižšie
    zaznamy.push({ druh: 'console.error', beh, sirka: W, text: t.slice(0, 300) });
  });
  page.on('requestfailed', (r) => { const chyba = r.failure()?.errorText || ''; zaznamy.push({ druh: 'requestfailed', beh, sirka: W, text: `${r.url().slice(0, 200)} ${chyba}`, prerusena: /ERR_ABORTED/.test(chyba) }); });
  page.on('response', (r) => { if (r.status() >= 400) zaznamy.push({ druh: 'http', beh, sirka: W, text: `HTTP ${r.status()} ${r.url().slice(0, 200)}` }); });
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await sleep(CAKAJ);
  await page.evaluate(kniznica);
  await page.evaluate((ms) => window.__da.dobehni(ms), 5000);
  await page.addStyleTag({ content: STYL_SKROL }).catch(() => {});
  return { ctx, page, H };
}
async function rafZaSekundu(page) {
  const a = await page.evaluate(() => (typeof window.__daRaf === 'function' ? window.__daRaf() : null));
  await sleep(1000);
  const b = await page.evaluate(() => (typeof window.__daRaf === 'function' ? window.__daRaf() : null));
  return a === null || b === null ? null : b - a;
}
async function pohybVBode(page) {
  const a = await page.evaluate(() => window.__da.animacie());
  a.rafZaSek = await rafZaSekundu(page);
  delete a.raf;
  return a;
}
const vyskaStranky = (page) => page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0));
async function skrolNa(page, y) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}
async function pridajStyl(page, css) { return page.evaluate((css) => { const s = document.createElement('style'); s.dataset.da = '1'; s.textContent = css; document.head.appendChild(s); return true; }, css); }
async function odoberStyly(page) { return page.evaluate(() => { document.querySelectorAll('style[data-da]').forEach((s) => s.remove()); getComputedStyle(document.body).color; }); }

async function behSirky(browser, url, W, zaznamy) {
  const t0 = Date.now();
  const vysledok = { sirka: W, vyska: vyskaPre(W) };
  const { ctx, page, H } = await otvor(browser, url, W, false, zaznamy);
  const cdp = await ctx.newCDPSession(page);
  try {
    // pohyb hore na stránke (pred skrolom)
    const pohybHore = await pohybVBode(page);
    // 1. prechod: odkryje obsah, ktorý sa ukáže až pri skrolovaní (IntersectionObserver, lenivé obrázky)
    let vyska = await vyskaStranky(page);
    const krok1 = Math.max(H * 0.8, vyska / 80);
    let pohybStred = null;
    for (let y = 0; y < vyska; y += krok1) {
      await skrolNa(page, y);
      await sleep(180);
      if (!pohybStred && y >= vyska / 2) { await page.evaluate((ms) => window.__da.dobehni(ms), 1500); pohybStred = await pohybVBode(page); }
      vyska = await vyskaStranky(page);
    }
    await skrolNa(page, 0);
    await page.evaluate((ms) => window.__da.dobehni(ms), 3000);
    await sleep(300);

    // merania bez skrolu
    await page.evaluate(() => window.__da.zoznamTextov());
    const typo = await page.evaluate((W) => window.__da.typografia(W), W);
    vysledok.rozostupy = await page.evaluate(() => window.__da.rozostupy());
    vysledok.dotyk = W < 600 ? await page.evaluate(() => window.__da.dotyk()) : null;
    vysledok.struktura = await page.evaluate(() => window.__da.struktura());
    vysledok.rozlozenie = await page.evaluate((W) => window.__da.rozlozenie(W), W);

    // písma, ktoré prehliadač naozaj kreslí (CDP CSS.getPlatformFontsForNode), vrátane náhradných pre chýbajúce znaky
    const kreslene = {};
    try {
      await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); await cdp.send('DOM.getDocument', { depth: 0 });
      for (const { i, kluc } of typo.fontPrvky.slice(0, 1500)) {
        const { result } = await cdp.send('Runtime.evaluate', { expression: `window.__da.T[${i}]`, objectGroup: 'da' });
        if (!result.objectId) continue;
        const { nodeId } = await cdp.send('DOM.requestNode', { objectId: result.objectId });
        if (!nodeId) continue;
        const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
        const k = (kreslene[kluc] ||= { fonty: {}, uzly: [] });
        const uzol = [];
        for (const f of fonts) {
          const meno = `${f.familyName}${f.isCustomFont ? '' : ' (systémové)'}`;
          k.fonty[meno] = (k.fonty[meno] || 0) + f.glyphCount;
          if (f.glyphCount > 0) uzol.push([meno, f.glyphCount]);
        }
        if (uzol.length > 1) k.uzly.push({ i, uzol });
      }
      await cdp.send('Runtime.releaseObjectGroup', { objectGroup: 'da' });
      // hlavné písmo = najviac nakreslených znakov; prvky, kde sa miešajú iné písma, majú znaky mimo hlavného
      for (const k of Object.values(kreslene)) {
        const hlavne = Object.entries(k.fonty).sort((a, b) => b[1] - a[1])[0]?.[0];
        k.hlavne = hlavne;
        k.nahradne = [];
        k.nahradnychPrvkov = 0;
        for (const { i, uzol } of k.uzly) {
          const ine = uzol.filter(([m]) => m !== hlavne);
          if (!ine.length) continue;
          k.nahradnychPrvkov++;
          if (k.nahradne.length >= 5) continue;
          const sel = await page.evaluate((i) => window.__da.selektor(window.__da.T[i]), i);
          const znaky = await page.evaluate((i) => window.__da.chybajuceZnaky(i), i);
          k.nahradne.push({ sel, fonty: ine.map(([m, g]) => `${m} ${g}×`).join(', '), znaky, systemove: ine.some(([m]) => m.endsWith('(systémové)')) });
        }
        delete k.uzly;
      }
    } catch (e) { typo.chybaFontov = String(e.message || e).slice(0, 200); }
    typo.kreslene = kreslene;
    delete typo.fontPrvky;
    vysledok.typografia = typo;

    // prístupné mená ovládacích prvkov (CDP prístupný strom: mená počíta prehliadač)
    const bezMena = [];
    try {
      await cdp.send('Accessibility.enable');
      const { nodes } = await cdp.send('Accessibility.getFullAXTree');
      const ROLY = new Set(['link', 'button', 'menuitem', 'tab', 'checkbox', 'radio', 'switch', 'combobox', 'textbox', 'searchbox', 'slider', 'spinbutton', 'listbox', 'image', 'img']);
      for (const n of nodes) {
        if (n.ignored || !n.role || !ROLY.has(n.role.value) || !n.backendDOMNodeId) continue;
        if (String(n.name?.value || '').trim()) continue;
        try {
          const { object } = await cdp.send('DOM.resolveNode', { backendNodeId: n.backendDOMNodeId, objectGroup: 'da' });
          const { result } = await cdp.send('Runtime.callFunctionOn', { objectId: object.objectId, functionDeclaration: 'function () { return window.__da.popis(this); }', returnByValue: true });
          const p = result.value;
          if (!p || !p.vykresleny || p.tag === 'IMG') continue;   // <img> rieši kontrola alt
          bezMena.push({ rola: n.role.value, ...p });
        } catch { /* uzol medzitým zmizol */ }
      }
      await cdp.send('Runtime.releaseObjectGroup', { objectGroup: 'da' });
    } catch (e) { vysledok.struktura.chybaMien = String(e.message || e).slice(0, 200); }
    vysledok.struktura.bezMena = bezMena;

    // 2. prechod: kontrast textov proti skutočnému pozadiu, okno po okne
    await pridajStyl(page, STYL_KLIK);
    vyska = await vyskaStranky(page);
    const krok2 = Math.max(H * 0.6, vyska / 150);
    const pixely = {};
    let snimokPozadia = 0;
    for (let y = 0; y < vyska; y += krok2) {
      await skrolNa(page, y);
      await page.evaluate((ms) => window.__da.dobehni(ms), 1200);
      const { naSnimku } = await page.evaluate(() => window.__da.kontrastKrok());
      if (naSnimku.length) {
        // text a jeho tieň dočasne priehľadné, snímka okna = čisté pozadie pod textom
        await pridajStyl(page, STYL_BEZ_PRECHODOV);
        await pridajStyl(page, STYL_BEZ_TEXTU);
        const buf = await page.screenshot({ type: 'png', animations: 'allow', caret: 'initial', timeout: 30000 }).catch(() => null);
        await page.evaluate(() => { const s = [...document.querySelectorAll('style[data-da]')]; s[s.length - 1].remove(); getComputedStyle(document.body).color; });
        await page.evaluate(() => { const s = [...document.querySelectorAll('style[data-da]')]; s[s.length - 1].remove(); });
        if (buf) {
          snimokPozadia++;
          const png = dekodujPng(buf);
          for (const n of naSnimku) { const k = kontrastZPixelov(png, n.obd, n.farba); if (k) pixely[n.i] = k; }
        }
      }
      vyska = await vyskaStranky(page);
    }
    await odoberStyly(page);
    await page.addStyleTag({ content: STYL_SKROL }).catch(() => {});
    const kontrast = await page.evaluate(() => window.__da.kontrastVysledky());
    for (const v of kontrast.vysledky) if (pixely[v.i]) v.pixely = { median: +pixely[v.i].median.toFixed(2), najhorsich10: +pixely[v.i].najhorsich10.toFixed(2), vzoriek: pixely[v.i].vzoriek };
    kontrast.snimokPozadia = snimokPozadia;
    vysledok.kontrast = kontrast;

    // snímka celej stránky
    if (!BEZ_SNIMOK) {
      await skrolNa(page, 0);
      await page.evaluate((ms) => window.__da.dobehni(ms), 2000);
      const subor = path.join(VYSTUP, `snimka-${W}.png`);
      try { await page.screenshot({ path: subor, fullPage: true, timeout: 120000 }); vysledok.snimka = path.basename(subor); }
      catch (e) {
        await page.screenshot({ path: subor, timeout: 30000 }).catch(() => {});
        vysledok.snimka = path.basename(subor);
        vysledok.snimkaPozn = 'len okno, celá stránka zlyhala: ' + String(e.message || e).slice(0, 120);
      }
    }
    vysledok.pohyb = { bezny: { hore: pohybHore, stred: pohybStred } };
  } finally {
    await ctx.close();
  }
  // 7) druhý beh s prefers-reduced-motion: reduce, rovnaké body merania
  const r = await otvor(browser, url, W, true, zaznamy);
  try {
    const hore = await pohybVBode(r.page);
    const vyska = await vyskaStranky(r.page);
    await skrolNa(r.page, vyska / 2);
    await r.page.evaluate((ms) => window.__da.dobehni(ms), 1500);
    const stred = await pohybVBode(r.page);
    vysledok.pohyb.reduce = { hore, stred };
  } finally {
    await r.ctx.close();
  }
  vysledok.trvanieMs = Date.now() - t0;
  return vysledok;
}

// ---------------------------------------------------------------- vyhodnotenie
const LIMIT_RIADOK = (W) => (W < 600 ? [30, 75] : [45, 75]);
function vyhodnot(sirky, zaznamy) {
  const N = [];
  // kluc: čo musí byť rovnaké, aby sa nálezy zlúčili (okrem závažnosti, oblasti, kódu a skupiny selektora)
  const pridaj = (zavaznost, oblast, kod, sirka, sel, hodnota, popis, skupina, kluc) => N.push({ zavaznost, oblast, kod, sirka, selektor: sel || '', skupina: skupina || sel || '', hodnota, popis, kluc: kluc ?? (sel ? '' : hodnota) });
  for (const S of sirky) {
    const W = S.sirka;
    // typografia
    const t = S.typografia;
    if (t) {
      const vel = Object.keys(t.velkosti).map(Number).sort((a, b) => a - b);
      t.pocetVelkosti = vel.length;
      // susedné veľkosti bližšie ako 1 px: oko ich nerozlíši, stupnica sa rozpadá (typicky clamp() s vw)
      t.blizkeDvojice = vel.slice(1).filter((v, i) => v - vel[i] < 1).length;
      if (vel.length > 12) pridaj('pozor', 'typografia', 'vela-velkosti', W, '', `${vel.length} veľkostí, ${t.blizkeDvojice} susedných bližších ako 1 px`, 'veľa rôznych veľkostí písma, stupnica nie je zjavná (zvyčajne stačí 6 až 9)');
      else pridaj('info', 'typografia', 'velkosti', W, '', `${vel.length} veľkostí: ${vel.join(', ')} px`, 'použité veľkosti písma');
      const male = vel.filter((v) => v < 12);
      if (male.length) pridaj('pozor', 'typografia', 'maly-text', W, '', `${male.join(', ')} px (${male.reduce((s, v) => s + t.velkosti[v], 0)} prvkov)`, 'text pod 12 px je ťažko čitateľný');
      const deklarovane = new Set(t.fonty.map((f) => f.rodina.toLowerCase()));
      const rodiny = new Set(Object.values(t.rodiny).map((r) => r.rodina.toLowerCase()));
      if (rodiny.size > 3) pridaj('pozor', 'typografia', 'vela-rodin', W, '', [...rodiny].join(', '), 'viac ako tri rodiny písma');
      for (const f of t.fonty) if (f.stav === 'error') pridaj('pozor', 'typografia', 'pismo-chyba', W, '', `${f.rodina} ${f.vaha} ${f.rez}`, 'písmo sa nepodarilo načítať (FontFace status error)');
      for (const [kluc, r] of Object.entries(t.rodiny)) {
        const k = t.kreslene?.[kluc];
        if (!k) continue;
        const vlastne = Object.keys(k.fonty).filter((m) => !m.endsWith('(systémové)'));
        if (deklarovane.has(r.rodina.toLowerCase())) {
          if (!vlastne.length) pridaj('pozor', 'typografia', 'pismo-nekresli', W, '', `${r.rodina} ${r.vaha} ${r.rez}: ${Object.keys(k.fonty).join(', ')}`, `písmo ${r.rodina} je v @font-face, ale kreslí sa náhradné (${r.prvkov} prvkov)`);
          for (const n of k.nahradne) pridaj(n.systemove ? 'pozor' : 'info', 'typografia', 'pismo-znaky', W, n.sel, `${n.fonty}${n.znaky ? `, znaky „${n.znaky}“` : ''}`, `znaky chýbajú v písme ${r.rodina} ${r.vaha} ${r.rez} (podmnožina?), kreslí ich ${n.systemove ? 'systémové písmo (na každom zariadení iné)' : 'ďalšie písmo zo zásobníka'}; prvkov s náhradou ${k.nahradnychPrvkov}`, `${r.rodina} ${r.vaha} ${r.rez}`, n.znaky);
        } else if (!/^(serif|sans-serif|monospace|system-ui|cursive|fantasy|-apple-system|ui-)/i.test(r.rodina)) {
          pridaj('info', 'typografia', 'pismo-systemove', W, '', `${r.rodina}: ${Object.keys(k.fonty).join(', ')}`, `${r.rodina} nie je v @font-face; na tomto stroji sa kreslí systémovým písmom`);
        }
      }
      const [lo, hi] = LIMIT_RIADOK(W);
      for (const o of t.odseky) {
        if (o.znakov > hi) pridaj('pozor', 'typografia', 'riadok-dlhy', W, o.sel, `${o.znakov} znakov, ${o.velkost} px`, `dlhý riadok (nad ${hi} znakov)`, o.skupina);
        else if (o.znakov < lo) pridaj('info', 'typografia', 'riadok-kratky', W, o.sel, `${o.znakov} znakov, ${o.velkost} px`, `krátky riadok (pod ${lo} znakov)`, o.skupina);
        if (o.velkost <= 20 && o.riadkovanie < 1.3) pridaj('pozor', 'typografia', 'riadkovanie-tesne', W, o.sel, `${o.riadkovanie} × ${o.velkost} px`, 'tesné riadkovanie bežného textu (pod 1,3)', o.skupina);
        else if (o.riadkovanie > 2) pridaj('info', 'typografia', 'riadkovanie-velke', W, o.sel, `${o.riadkovanie}`, 'veľké riadkovanie (nad 2)', o.skupina);
      }
    }
    // rozostupy
    const r = S.rozostupy;
    if (r) {
      const hod = Object.entries(r.hodnoty).map(([v, n]) => [Number(v), n]);
      const spolu = hod.reduce((s, [, n]) => s + n, 0);
      const mimoMriezky = (q) => hod.filter(([v]) => Math.abs(v - Math.round(v / q) * q) > 0.5);
      const mimo = mimoMriezky(4);
      const mimoN = mimo.reduce((s, [, n]) => s + n, 0);
      const podiel = (q) => (spolu ? +(mimoMriezky(q).reduce((s, [, n]) => s + n, 0) / spolu).toFixed(3) : 0);
      r.podielMimo2 = podiel(2); r.podielMimo8 = podiel(8);
      r.rozne = hod.length; r.vyskytov = spolu; r.mimo4 = mimo.length; r.mimo4Vyskytov = mimoN;
      r.podielMimo4 = spolu ? +(mimoN / spolu).toFixed(3) : 0;
      r.najcastejsie = hod.sort((a, b) => b[1] - a[1]).slice(0, 12).map(([v, n]) => ({ px: v, n }));
      r.najcastejsieMimo = mimo.sort((a, b) => b[1] - a[1]).slice(0, 8).map(([v, n]) => ({ px: v, n, priklad: r.priklady[v] }));
      delete r.priklady;
      const pct = Math.round(r.podielMimo4 * 100);
      pridaj(r.podielMimo4 > 0.3 ? 'pozor' : 'info', 'rozostupy', 'skala-4', W, '', `${r.rozne} rôznych hodnôt, mimo 4 px ${pct} % výskytov (${r.mimo4} hodnôt)`, r.podielMimo4 > 0.3 ? 'rozostupy často mimo škály 4 px' : 'rozostupy prevažne na škále 4 px');
    }
    // kontrast
    const k = S.kontrast;
    if (k) {
      let pod = 0, neiste = 0;
      for (const v of k.vysledky) {
        const limit = v.velky ? 3 : 4.5;
        const popisT = `${v.velky ? 'veľký' : 'bežný'} text ${v.velkost} px${v.vaha >= 700 ? ' tučný' : ''}, „${v.text}“${v.metoda === 'predkovia' ? `; pozadie zo štýlov predkov (${v.dovod === 'orezaný predkom' ? 'text v zavretom alebo orezanom paneli' : v.dovod})` : ''}`;
        const kl = `${v.farba}|${v.pozadie}|${v.velky}`;
        if (v.nejiste.length) {
          neiste++;
          if (v.pixely) {
            const slabe = v.pixely.median < limit;
            if (slabe) pridaj(v.tien || v.dekorativny ? 'info' : 'pozor', 'kontrast', 'kontrast-neisty', W, v.sel, `~${fmt(v.pixely.median)}:1 (najhorších 10 %: ${fmt(v.pixely.najhorsich10)}:1), text ${v.farba}`, `neisté (${v.nejiste.join('; ')}); ${popisT}; pomer z pixelov pod textom${v.tien ? ', text má tieň' : ''}`, v.skupina, `${v.farba}|${v.velky}`);
          } else if (v.pomer < limit) pridaj('info', 'kontrast', 'kontrast-neisty', W, v.sel, `${fmt(v.pomer)}:1 (bez pixelov), ${v.farba} na ${v.pozadie}`, `neisté (${v.nejiste.join('; ')}); ${popisT}`, v.skupina, kl);
          continue;
        }
        if (v.pomer >= limit) continue;
        pod++;
        const zav = v.dekorativny ? 'info' : !v.velky && v.pomer < 3 ? 'závažné' : 'pozor';
        pridaj(zav, 'kontrast', 'kontrast', W, v.sel, `${fmt(v.pomer)}:1, ${v.farba} na ${v.pozadie}`, `${popisT}; treba ${fmt(limit)}:1${v.dekorativny ? ' (aria-hidden, dekoratívny)' : ''}`, v.skupina, kl);
      }
      k.podLimit = pod; k.neiste = neiste;
      k.nezmeranePocet = k.texty - k.zmerane;
    }
    // dotyk
    const d = S.dotyk;
    if (d) {
      for (const m of d.male) pridaj(m.voVete ? 'info' : 'pozor', 'dotyk', 'dotyk-maly', W, m.sel, `${fmt(m.w)} × ${fmt(m.h)} px`, `${m.voVete ? 'odkaz vo vete (WCAG výnimka), ' : ''}dotyková plocha pod 44 × 44 px${Math.min(m.w, m.h) < 24 ? ', pod 24 px (WCAG 2.5.8)' : ''}; „${m.text}“`, m.skupina);
    }
    // štruktúra
    const st = S.struktura;
    if (st) {
      const h1 = st.nadpisy.filter((n) => n.uroven === 1);
      if (h1.length !== 1) pridaj('závažné', 'struktura', 'h1', W, h1.map((n) => n.sel).join(', '), `${h1.length}× h1`, h1.length ? 'viac ako jeden h1' : 'chýba h1');
      st.nadpisy.forEach((n, i) => {
        if (i === 0) { if (n.uroven > 1) pridaj('info', 'struktura', 'prvy-nadpis', W, n.sel, `h${n.uroven}`, `prvý nadpis nie je h1: „${n.text}“`); return; }
        const pred = st.nadpisy[i - 1].uroven;
        if (n.uroven > pred + 1) pridaj('pozor', 'struktura', 'preskok', W, n.sel, `h${pred} → h${n.uroven}`, `preskočená úroveň nadpisu: „${n.text}“`);
      });
      for (const b of st.bezAlt) pridaj('závažné', 'struktura', 'alt', W, b.sel, b.src, 'obrázok bez atribútu alt (dekoratívny má alt="")', b.skupina);
      for (const b of st.bezMena) pridaj('pozor', 'struktura', 'meno', W, b.sel, `${b.rola}`, `${b.rola === 'image' || b.rola === 'img' ? 'grafika' : 'ovládací prvok'} bez prístupného mena: ${b.html}`, b.skupina);
      if (!st.jazyk) pridaj('pozor', 'struktura', 'jazyk', W, 'html', '(chýba)', 'dokument nemá atribút lang');
    }
    // rozloženie
    const l = S.rozlozenie;
    if (l) {
      if (l.pretecenie) pridaj('závažné', 'rozlozenie', 'pretecenie', W, l.pricinne.map((p) => p.sel).slice(0, 3).join(', '), `scrollWidth ${l.scrollWidth} px, innerWidth ${l.innerWidth} px pri šírke ${W}`, l.pricinne.length ? 'vodorovné pretečenie stránky' : 'vodorovné pretečenie stránky (pôvodca sa nenašiel, možno pseudo-prvok)');
      for (const p of l.pricinne) pridaj(l.pretecenie ? 'závažné' : 'pozor', 'rozlozenie', 'pretieka', W, p.sel, `pravý okraj ${p.vpravo} px`, p.celyMimo ? 'prvok celý mimo obrazovky vpravo' : 'prvok presahuje šírku okna', p.skupina);
      if (l.zaSirkou && l.korenOreze) pridaj('pozor', 'rozlozenie', 'orezane', W, l.orezane.map((p) => p.sel).slice(0, 3).join(', '), `scrollWidth ${l.scrollWidth} px, overflow-x: ${l.korenOx}`, 'obsah je širší ako okno, skrýva ho overflow-x na html/body (zakrytá chyba)');
      for (const p of l.orezane) if (p.celyMimo && !p.priehladny) pridaj('info', 'rozlozenie', 'mimo-vpravo', W, p.sel, `pravý okraj ${p.vpravo} px`, 'prvok celý mimo obrazovky vpravo (orezaný koreňom)', p.skupina);
      for (const p of l.pevne) if (!p.priehladny) pridaj('info', 'rozlozenie', 'pevny-mimo', W, p.sel, `pravý okraj ${p.vpravo} px`, 'pevný prvok mimo obrazovky vpravo (napr. vysúvacie menu); over, či nie je dosiahnuteľný klávesnicou', p.skupina);
    }
    // pohyb
    const po = S.pohyb;
    if (po && po.reduce) {
      const sucet = (x) => ({ beziace: (x?.beziace || 0), nekonecne: (x?.nekonecne || 0), raf: (x?.rafZaSek || 0) });
      const b1 = sucet(po.bezny.hore), b2 = sucet(po.bezny.stred), r1 = sucet(po.reduce.hore), r2 = sucet(po.reduce.stred);
      const bez = { beziace: b1.beziace + b2.beziace, nekonecne: b1.nekonecne + b2.nekonecne, raf: Math.max(b1.raf, b2.raf) };
      const red = { beziace: r1.beziace + r2.beziace, nekonecne: r1.nekonecne + r2.nekonecne, raf: Math.max(r1.raf, r2.raf) };
      po.porovnanie = { bezny: bez, reduce: red };
      const hodnota = `animácie ${bez.beziace} → ${red.beziace}, nekonečné ${bez.nekonecne} → ${red.nekonecne}, rAF ${bez.raf} → ${red.raf}/s`;
      const mena = Object.keys({ ...(po.reduce.hore?.mena || {}), ...(po.reduce.stred?.mena || {}) }).filter((m) => /nekonečná/.test(m)).slice(0, 5).join(', ');
      if (red.nekonecne > 0) pridaj('pozor', 'pohyb', 'reduce-nekonecne', W, '', hodnota, `pri prefers-reduced-motion bežia nekonečné animácie (${mena})`);
      if (red.raf >= 20) pridaj('pozor', 'pohyb', 'reduce-raf', W, '', hodnota, 'pri prefers-reduced-motion beží slučka requestAnimationFrame');
      if (!(red.nekonecne > 0) && red.raf < 20) pridaj('info', 'pohyb', 'reduce-ok', W, '', hodnota, bez.beziace + bez.raf === 0 ? 'stránka sa po načítaní nehýbe' : 'pri prefers-reduced-motion pohyb ustane');
      if (po.bezny.hore?.reduceCss === false) pridaj('info', 'pohyb', 'reduce-css', W, '', 'nie', 'štýly nemajú @media (prefers-reduced-motion)');
    }
  }
  // 8) konzola a požiadavky (oba behy)
  const videne = new Set();
  for (const z of zaznamy) {
    const kluc = z.druh + z.text;
    if (videne.has(kluc)) continue;
    videne.add(kluc);
    const sirkyZ = [...new Set(zaznamy.filter((x) => x.druh + x.text === kluc).map((x) => x.sirka))];
    const behy = [...new Set(zaznamy.filter((x) => x.druh + x.text === kluc).map((x) => x.beh))];
    pridaj(z.prerusena ? 'info' : 'závažné', 'konzola', z.druh, sirkyZ.join(', '), '', z.text, `${z.druh === 'requestfailed' ? (z.prerusena ? 'prerušená požiadavka (zvyčajne neškodné)' : 'neúspešná požiadavka') : z.druh === 'http' ? 'odpoveď s chybou' : 'chyba v konzole'} (beh: ${behy.join(', ')})`);
  }
  return N;
}
const fmt = (x, d = 2) => (Number.isFinite(x) ? String(+x.toFixed(d)).replace('.', ',') : String(x));

// zlúčenie rovnakých nálezov naprieč šírkami a opakovanými komponentmi
const PORADIE = { 'závažné': 0, pozor: 1, info: 2 };
function zluc(nalezy) {
  const m = new Map();
  for (const n of nalezy) {
    const kluc = [n.zavaznost, n.oblast, n.kod, n.skupina || n.selektor, n.kluc].join('|');
    const z = m.get(kluc);
    if (!z) { const { kluc: _k, ...bez } = n; m.set(kluc, { ...bez, sirky: [n.sirka], pocet: 1, hodnoty: [n.hodnota] }); continue; }
    if (!z.sirky.includes(n.sirka)) z.sirky.push(n.sirka);
    z.pocet++;
    if (z.hodnoty.length < 4 && !z.hodnoty.includes(n.hodnota)) z.hodnoty.push(n.hodnota);
  }
  return [...m.values()].sort((a, b) => PORADIE[a.zavaznost] - PORADIE[b.zavaznost] || b.pocet - a.pocet);
}

// ---------------------------------------------------------------- správa
const OBLASTI = [['typografia', 'Typografia'], ['rozostupy', 'Rozostupy'], ['kontrast', 'Farby a kontrast'], ['dotyk', 'Dotykové plochy'], ['struktura', 'Štruktúra'], ['rozlozenie', 'Rozloženie'], ['pohyb', 'Pohyb'], ['konzola', 'Konzola a požiadavky']];
function spravaMd(sprava) {
  const L = [];
  const z = sprava.suhrn;
  L.push(`# Dizajn audit`, '', `- Stránka: ${sprava.adresa}${sprava.subor ? ` (súbor ${sprava.subor})` : ''}`, `- Čas: ${sprava.cas}, ${sprava.nastroj}, Chromium ${sprava.prehliadac}`, `- Šírky: ${sprava.sirky.map((s) => `${s.sirka} × ${s.vyska}`).join(', ')}`, `- Výsledok: **${z['závažné']} závažné, ${z.pozor} pozor, ${z.info} info** (zlúčené naprieč šírkami), návratový kód ${z['závažné'] ? 1 : 0}`, '');
  L.push('## Súhrn po oblastiach', '', '| Oblasť | závažné | pozor | info | čísla |', '| --- | --- | --- | --- | --- |');
  for (const [k, meno] of OBLASTI) {
    const o = sprava.nalezy.filter((n) => n.oblast === k);
    const c = (zv) => o.filter((n) => n.zavaznost === zv).length;
    L.push(`| ${meno} | ${c('závažné')} | ${c('pozor')} | ${c('info')} | ${cislaOblasti(k, sprava.sirky)} |`);
  }
  L.push('');
  const top = sprava.nalezy.filter((n) => n.zavaznost !== 'info').slice(0, 30);
  L.push('## Hlavné nálezy', '');
  if (!top.length) L.push('Žiadne závažné nálezy ani nálezy na pozor.');
  for (const n of top) L.push(`- **${n.zavaznost}** [${n.oblast}] ${n.selektor ? '`' + n.selektor + '` ' : ''}(${n.sirky.join(', ')}${n.pocet > 1 ? `, ${n.pocet}×` : ''}): ${n.hodnoty.join(' | ')}. ${n.popis}`);
  L.push('');
  L.push('## Po šírkach', '');
  for (const S of sprava.sirky) {
    L.push(`### ${S.sirka} × ${S.vyska}${S.snimka ? ` (${S.snimka})` : ''}`, '');
    const t = S.typografia;
    if (t) {
      const vel = Object.entries(t.velkosti).map(([v, n]) => [Number(v), n]).sort((a, b) => a[0] - b[0]);
      L.push(`- Typografia: ${t.pocet} textových prvkov, ${vel.length} veľkostí (${vel.map(([v, n]) => `${fmt(v)} px ×${n}`).join(', ')})`);
      for (const [kl, r] of Object.entries(t.rodiny)) L.push(`  - ${r.rodina} ${r.vaha} ${r.rez}: ${r.prvkov} prvkov, kreslí sa ${Object.entries(t.kreslene?.[kl]?.fonty || {}).map(([m, g]) => `${m} (${g} znakov)`).join(', ') || '?'}`);
      const ods = t.odseky.map((o) => o.znakov).sort((a, b) => a - b);
      if (ods.length) L.push(`  - Odseky: ${ods.length}, znakov na riadok ${ods[0]} až ${ods[ods.length - 1]}, medián ${ods[Math.floor(ods.length / 2)]}`);
      const rl = Object.entries(t.riadkovanie).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (rl.length) L.push(`  - Riadkovanie bežného textu (násobok veľkosti): ${rl.map(([v, n]) => `${fmt(Number(v))} ×${n}`).join(', ')}`);
      L.push(`  - Písma v dokumente: ${t.fonty.map((f) => `${f.rodina} ${f.vaha} ${f.rez} ${f.stav}`).join(', ') || 'žiadne @font-face'}`);
    }
    const r = S.rozostupy;
    if (r) {
      L.push(`- Rozostupy: ${r.prvkov} prvkov, ${r.rozne} rôznych hodnôt, mimo škály 4 px ${Math.round(r.podielMimo4 * 100)} % výskytov (mimo 2 px ${Math.round(r.podielMimo2 * 100)} %, mimo 8 px ${Math.round(r.podielMimo8 * 100)} %)`);
      L.push(`  - najčastejšie: ${r.najcastejsie.map((h) => `${fmt(h.px)} ×${h.n}`).join(', ')}`);
      if (r.najcastejsieMimo.length) L.push(`  - najčastejšie mimo 4 px: ${r.najcastejsieMimo.map((h) => `${fmt(h.px)} ×${h.n} (\`${h.priklad}\`)`).join(', ')}`);
    }
    const k = S.kontrast;
    if (k) {
      const zOkna = k.vysledky.filter((v) => v.metoda === 'okno').length;
      L.push(`- Kontrast: ${k.zmerane} z ${k.texty} textov zmeraných (${zOkna} v okne proti skutočnému pozadiu, ${k.zmerane - zOkna} zo štýlov predkov), pod limitom ${k.podLimit}, neisté ${k.neiste} (pozadie zo snímky: ${k.snimokPozadia} okien), nezmerané ${k.nezmeranePocet}`);
      for (const [d, n] of Object.entries(k.nezmerane || {}).sort((a, b) => b[1] - a[1])) L.push(`  - nezmerané, ${d}: ${n}${(k.nezmeranePriklady || []).filter((p) => p.dovod === d && p.kde).slice(0, 3).map((p) => ` · \`${p.kde}\` ×${p.n}`).join('')}`);
    }
    if (S.dotyk) L.push(`- Dotyk: ${S.dotyk.male.length} z ${S.dotyk.spolu} ovládacích prvkov pod 44 × 44 px (vo vete ${S.dotyk.male.filter((m) => m.voVete).length})`);
    const st = S.struktura;
    if (st) {
      L.push(`- Štruktúra: lang="${st.jazyk}", nadpisov ${st.nadpisy.length}, h1 ${st.nadpisy.filter((n) => n.uroven === 1).length}, obrázkov bez alt ${st.bezAlt.length}, bez mena ${st.bezMena.length}`);
      L.push(`  - Osnova: ${st.nadpisy.slice(0, 40).map((n) => `h${n.uroven} ${n.text.slice(0, 28)}`).join(' / ')}${st.nadpisy.length > 40 ? ' ...' : ''}`);
    }
    const l = S.rozlozenie;
    if (l) L.push(`- Rozloženie: scrollWidth ${l.scrollWidth} px, innerWidth ${l.innerWidth} px, overflow-x koreňa ${l.korenOx}, pretečenie ${l.pretecenie ? 'áno' : 'nie'}${l.orezane.length ? `, orezaných prvkov ${l.orezane.length}` : ''}`);
    const po = S.pohyb?.porovnanie;
    if (po) L.push(`- Pohyb (hore + stred stránky): bežný beh ${po.bezny.beziace} animácií (nekonečných ${po.bezny.nekonecne}), rAF ${po.bezny.raf}/s; reduce ${po.reduce.beziace} (nekonečných ${po.reduce.nekonecne}), rAF ${po.reduce.raf}/s`);
    L.push(`- Trvanie: ${Math.round(S.trvanieMs / 1000)} s${S.snimkaPozn ? '; ' + S.snimkaPozn : ''}`, '');
  }
  const info = sprava.nalezy.filter((n) => n.zavaznost === 'info');
  L.push('## Info', '');
  for (const n of info.slice(0, 60)) L.push(`- [${n.oblast}] ${n.selektor ? '`' + n.selektor + '` ' : ''}(${n.sirky.join(', ')}${n.pocet > 1 ? `, ${n.pocet}×` : ''}): ${n.hodnoty.join(' | ')}. ${n.popis}`);
  if (info.length > 60) L.push(`- ... ďalších ${info.length - 60} v sprava.json`);
  L.push('');
  return L.join('\n');
}
function cislaOblasti(k, sirky) {
  const po = (f) => sirky.map((s) => { try { return `${s.sirka}: ${f(s)}`; } catch { return `${s.sirka}: ?`; } }).join('; ');
  switch (k) {
    case 'typografia': return po((s) => `${s.typografia.pocetVelkosti} veľkostí, ${Object.keys(s.typografia.rodiny).length} rezov`);
    case 'rozostupy': return po((s) => `${s.rozostupy.rozne} hodnôt, mimo 4 px ${Math.round(s.rozostupy.podielMimo4 * 100)} %`);
    case 'kontrast': return po((s) => `${s.kontrast.podLimit} pod limitom, ${s.kontrast.neiste} neistých z ${s.kontrast.zmerane}`);
    case 'dotyk': return po((s) => (s.dotyk ? `${s.dotyk.male.length} z ${s.dotyk.spolu}` : 'nemeria sa'));
    case 'struktura': return po((s) => `h1 ${s.struktura.nadpisy.filter((n) => n.uroven === 1).length}, bez alt ${s.struktura.bezAlt.length}, bez mena ${s.struktura.bezMena.length}`);
    case 'rozlozenie': return po((s) => `pretečenie ${s.rozlozenie.pretecenie ? 'áno' : 'nie'}`);
    case 'pohyb': return po((s) => `${s.pohyb.porovnanie.bezny.beziace} → ${s.pohyb.porovnanie.reduce.beziace} animácií, rAF ${s.pohyb.porovnanie.bezny.raf} → ${s.pohyb.porovnanie.reduce.raf}/s`);
    default: return '';
  }
}

// ---------------------------------------------------------------- hlavný beh
async function main() {
  fs.mkdirSync(VYSTUP, { recursive: true });
  let url = CIEL, subor = null, srv = null;
  if (!/^https?:\/\//i.test(CIEL)) {
    subor = path.resolve(CIEL.startsWith('file://') ? fileURLToPath(CIEL) : CIEL);
    if (fs.existsSync(subor) && fs.statSync(subor).isDirectory()) subor = path.join(subor, 'index.html');
    if (!fs.existsSync(subor)) throw new Error('súbor neexistuje: ' + subor);
    srv = await spustiServer(path.dirname(subor));
    url = `${srv.origin}/${encodeURIComponent(path.basename(subor))}`;
  }
  const { pw, odkial } = nacitajPlaywright();
  const browser = await spustiPrehliadac(pw.chromium);
  const zaznamy = [];
  const sirky = [];
  try {
    for (const W of SIRKY) {
      process.stderr.write(`šírka ${W} ... `);
      const S = await behSirky(browser, url, W, zaznamy);
      process.stderr.write(`${Math.round(S.trvanieMs / 1000)} s\n`);
      sirky.push(S);
    }
  } finally {
    await browser.close().catch(() => {});
    if (srv) srv.server.close();
  }
  const nalezy = zluc(vyhodnot(sirky, zaznamy));
  const suhrn = { 'závažné': 0, pozor: 0, info: 0, podlaOblasti: {} };
  for (const n of nalezy) {
    suhrn[n.zavaznost]++;
    const o = (suhrn.podlaOblasti[n.oblast] ||= { 'závažné': 0, pozor: 0, info: 0 });
    o[n.zavaznost]++;
  }
  const sprava = { nastroj: VERZIA, cas: new Date().toISOString(), adresa: url, subor, playwright: odkial, prehliadac: browser.version(), suhrn, nalezy, sirky, konzola: zaznamy };
  fs.writeFileSync(path.join(VYSTUP, 'sprava.json'), JSON.stringify(sprava, null, 2));
  fs.writeFileSync(path.join(VYSTUP, 'sprava.md'), spravaMd(sprava));
  console.log(`${suhrn['závažné']} závažné, ${suhrn.pozor} pozor, ${suhrn.info} info -> ${path.join(VYSTUP, 'sprava.md')}`);
  for (const n of nalezy.filter((x) => x.zavaznost !== 'info').slice(0, 12)) console.log(`  ${n.zavaznost.padEnd(8)} ${n.oblast.padEnd(11)} ${n.selektor ? n.selektor + '  ' : ''}${n.hodnoty[0]}`);
  return suhrn['závažné'] ? 1 : 0;
}
main().then((kod) => process.exit(kod)).catch((e) => { console.error('chyba nástroja:', e && e.stack || e); process.exit(2); });
