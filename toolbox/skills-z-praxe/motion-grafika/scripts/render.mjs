#!/usr/bin/env node
// Render pohyblivej grafiky po snímkach: HTML kompozícia + JSON parametre -> PNG s alfou -> ProRes 4444 .mov
// (yuva444p10le), WebM VP9 s alfou (yuva420p), náhľad MP4 na šachovnici a voliteľne na zábere, prehľad snímok
// s časovou osou vrstiev a detail na kontrolu ostrosti a okrajov alfy.
//
//   node scripts/render.mjs <parametre.json> [--von <priečinok>] [--meno <základ>]
//        [--zaber <video|fotka> --zaber-od <s>] [--format 9:16|16:9|1:1] [--sirka --vyska --fps 30 --dlzka 4]
//        [--text kluc=hodnota ...] [--nastav kluc=hodnota ...] [--html <subor.html>]
//        [--len-snimky] [--nechaj-snimky] [--detail-cas <s>] [--koren <repozitár>] [--chromium <cesta>]
//
// Deterministické: Chromium kreslí každú snímku osve. Všetky animácie stoja (MG.seek nastaví currentTime),
// nič sa nenahráva v reálnom čase. Potrebuje node, Playwright (require('playwright') cez NODE_PATH),
// Chromium (PLAYWRIGHT_BROWSERS_PATH, predvolene /opt/pw-browsers, alebo --chromium), ffmpeg s prores_ks
// a libvpx-vp9, python3 s Pillow a fontTools (kontrola písma a alfy). Sieť netreba.
// Návratový kód: 0 hotovo, 1 chyba (písmo, chýbajúci znak, ffmpeg, stránka), 2 zlé argumenty.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const TU = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(TU, '..');
const SABLONY = path.join(SKILL, 'sablony');
const HOST = 'http://mg.local';

// ---------- argumenty ----------
const argv = process.argv.slice(2);
const A = { text: [], nastav: [] };
const poz = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) { poz.push(a); continue; }
  const [k, v0] = a.slice(2).split(/=(.*)/s);
  const bool = ['len-snimky', 'nechaj-snimky', 'bez-kontroly', 'pomoc', 'help'];
  const v = bool.includes(k) ? true : (v0 !== undefined ? v0 : argv[++i]);
  if (k === 'text' || k === 'nastav') A[k].push(v); else A[k] = v;
}
if (A.help) A.pomoc = true;
if (A.pomoc || poz.length !== 1) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 12).map((r) => r.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(A.pomoc ? 0 : 2);
}
const zle = (s) => { console.error('chyba: ' + s); process.exit(2); };
const PARAM = path.resolve(poz[0]);
if (!fs.existsSync(PARAM)) zle(`parametre ${PARAM} neexistujú`);
const PDIR = path.dirname(PARAM);
let P;
try { P = JSON.parse(fs.readFileSync(PARAM, 'utf8')); } catch (e) { zle(`parametre nie sú platný JSON: ${e.message}`); }
for (const kv of A.text) { const [k, v] = kv.split(/=(.*)/s); (P.texty ||= {})[k] = v ?? ''; }
for (const kv of A.nastav) { const [k, v] = kv.split(/=(.*)/s); (P.nastavenia ||= {})[k] = v !== undefined && v !== '' && !isNaN(+v) ? +v : v; }
// formát ako FORMATY v kratke-video/scripts/reel.py: reel.py prekrytie natiahne na svoj rozmer bez ohľadu
// na pomer strán, preto 9:16 prekrytie v reele 1:1 vyjde stlačené (overené); renderuj v rozmere reelu
const FORMATY = { '9:16': [1080, 1920], '16:9': [1920, 1080], '1:1': [1080, 1080] };
const FMT = A.format || P.format;
if (FMT) {
  if (!FORMATY[FMT]) zle(`formát "${FMT}" nepoznám (9:16, 16:9, 1:1 ako kratke-video)`);
  if (A.format || P.sirka === undefined) P.sirka = FORMATY[FMT][0];
  if (A.format || P.vyska === undefined) P.vyska = FORMATY[FMT][1];
}
for (const k of ['sirka', 'vyska', 'fps', 'dlzka']) if (A[k] !== undefined) P[k] = +A[k];
const VON = path.resolve(A.von || P.vystup || path.join(process.cwd(), 'mg-vystup'));
const MENO = A.meno || P.meno || path.basename(PARAM, '.json');
fs.mkdirSync(VON, { recursive: true });

// ---------- šablóna a značka ----------
function najdi(meno, priecinok, pripona) {
  if (!meno) return null;
  const kand = [path.resolve(PDIR, meno), path.join(priecinok, meno), path.join(priecinok, meno + pripona)];
  return kand.find((k) => fs.existsSync(k) && fs.statSync(k).isFile()) || null;
}
const SABLONA = najdi(A.sablona || P.sablona, SABLONY, '.html');
if (!SABLONA) zle(`šablóna "${A.sablona || P.sablona}" sa nenašla (v ${SABLONY} alebo vedľa parametrov)`);
let Z = {};
const znM = A.znacka || P.znacka;
if (typeof znM === 'object' && znM) Z = znM;
else if (znM) {
  const zp = najdi(znM, path.join(SABLONY, 'znacky'), '.json');
  if (!zp) zle(`značka "${znM}" sa nenašla (sablony/znacky/<meno>.json alebo cesta)`);
  Z = JSON.parse(fs.readFileSync(zp, 'utf8'));
}
// koreň repozitára: odtiaľ sa berú style.css a písma značky
function koren() {
  const kand = [A.koren, process.env.MG_KOREN, path.resolve(SKILL, '..', '..', '..'), process.cwd()].filter(Boolean).map((k) => path.resolve(k));
  return kand.find((k) => Z.css && fs.existsSync(path.join(k, Z.css))) || kand.find((k) => (Z.fonty || []).every((f) => fs.existsSync(path.resolve(k, f.subor)))) || process.cwd();
}
const KOREN = koren();
const varovania = [];

// premenné z :root (len na najvyššej úrovni súboru, neskoršie prepíšu skoršie)
function premenneCss(subor) {
  const s = fs.readFileSync(subor, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const out = {};
  let hlbka = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{') hlbka++;
    else if (s[i] === '}') hlbka--;
    else if (hlbka === 0 && s.startsWith(':root', i)) {
      const a = s.indexOf('{', i);
      const sel = s.slice(i, a).trim();
      if (sel !== ':root') continue;
      const b = s.indexOf('}', a);
      for (const m of s.slice(a + 1, b).matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) out[m[1]] = m[2].trim();
      i = b; hlbka = 0;
    }
  }
  return out;
}
const CSSV = Z.css && fs.existsSync(path.join(KOREN, Z.css)) ? premenneCss(path.join(KOREN, Z.css)) : null;
if (Z.css && !CSSV) varovania.push(`style.css značky (${Z.css}) sa nenašiel pod ${KOREN}: farby zo zálohy v JSON značky, nie zo súboru`);
function dosad(hodnota, zaloha, kde) {
  if (typeof hodnota !== 'string') return hodnota;
  let chyba = null;
  let v = hodnota.replace(/\{(--[\w-]+)\}/g, (_, n) => {
    if (CSSV && CSSV[n] !== undefined) return CSSV[n];
    chyba = n; return '';
  });
  for (let k = 0; k < 4 && /var\(--/.test(v); k++) v = v.replace(/var\((--[\w-]+)(?:,\s*([^)]*))?\)/g, (_, n, d) => (CSSV && CSSV[n]) || d || (chyba = n, ''));
  if (chyba) {
    if (zaloha === undefined) throw new Error(`${kde}: premenná ${chyba} nie je v ${Z.css || 'css'} a záloha chýba`);
    if (CSSV) varovania.push(`${kde}: premenná ${chyba} chýba v ${Z.css}, použitá záloha ${zaloha}`);
    return zaloha;
  }
  return v;
}
const ms = (v, d) => { if (v === undefined || v === null || v === '') return d; const s = String(v).trim(); const n = parseFloat(s); return /\d\s*s$/.test(s) && !/ms$/.test(s) ? n * 1000 : n; };
const zn = { nazov: Z.nazov || '', farby: {}, premenne: {}, pohyb: {}, fonty: [] };
const zdrojFarieb = [];
for (const [k, v] of Object.entries(Z.farby || {})) {
  zn.farby[k] = dosad(v, (Z.farby_zaloha || {})[k], `farba ${k}`);
  zdrojFarieb.push(`${k} = ${zn.farby[k]}${/\{--/.test(v) ? '  (' + v.replace(/[{}]/g, '') + ')' : ''}`);
}
for (const [k, v] of Object.entries(Z.premenne || {})) zn.premenne[k] = dosad(v, (Z.premenne_zaloha || {})[k], k);
for (const [k, v] of Object.entries(Z.pohyb || {})) zn.pohyb[k] = dosad(v, (Z.pohyb_zaloha || {})[k], `pohyb ${k}`);
zn.pohyb.vstup_ms = ms(zn.pohyb.vstup_ms, 600);
zn.pohyb.odchod_ms = ms(zn.pohyb.odchod_ms, 400);
const PISMA = (Z.fonty || []).map((f) => {
  const subor = path.isAbsolute(f.subor) ? f.subor : path.resolve(KOREN, f.subor);
  if (!fs.existsSync(subor)) { console.error(`chyba: písmo ${f.rodina} ${f.vaha} chýba: ${subor}\n  daj --koren <priečinok s webom značky> (alebo MG_KOREN), prípadne absolútnu cestu v JSON značky`); process.exit(1); }
  return { ...f, subor };
});
zn.fonty = PISMA.map((f) => ({ rodina: f.rodina, vaha: f.vaha, styl: f.styl, url: HOST + encodeURI(f.subor) }));

// ---------- prehliadač ----------
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync('/opt/pw-browsers')) process.env.PLAYWRIGHT_BROWSERS_PATH = '/opt/pw-browsers';
const req = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = req('playwright')); } catch {
  for (const d of [process.env.NODE_PATH, '/opt/node22/lib/node_modules', '/usr/local/lib/node_modules'].filter(Boolean).flatMap((x) => x.split(':'))) {
    try { ({ chromium } = createRequire(path.join(d, 'x.js'))('playwright')); break; } catch {}
  }
}
if (!chromium) { console.error('chyba: Playwright sa nenašiel (nastav NODE_PATH na priečinok s node_modules/playwright)'); process.exit(1); }

const TYPY = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm' };
const POVOLENE = [KOREN, SKILL, PDIR, VON, path.dirname(SABLONA)].map((d) => path.resolve(d) + path.sep);
const STRANKY = new Map();
async function server(page) {
  await page.route(HOST + '/**', async (route) => {
    const u = new URL(route.request().url());
    if (STRANKY.has(u.pathname)) return route.fulfill({ status: 200, contentType: TYPY['.html'], body: STRANKY.get(u.pathname) });
    const p = path.resolve(decodeURIComponent(u.pathname));
    if (!POVOLENE.some((d) => p.startsWith(d)) || !fs.existsSync(p) || !fs.statSync(p).isFile()) return route.fulfill({ status: 404, body: 'nenájdené' });
    route.fulfill({ status: 200, contentType: TYPY[path.extname(p).toLowerCase()] || 'application/octet-stream', body: fs.readFileSync(p) });
  });
}
const browser = await chromium.launch({
  executablePath: A.chromium || undefined,
  args: ['--font-render-hinting=none', '--force-color-profile=srgb', '--disable-lcd-text', '--hide-scrollbars'],
});

function ffmpeg(args, popis) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...args], { encoding: 'utf8', maxBuffer: 64 << 20 });
  if (r.error || r.status !== 0) { console.error(`chyba ffmpeg (${popis}): ${r.error ? r.error.message : r.stderr}`); throw new Error('ffmpeg'); }
  return r;
}
const python = (args) => spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 64 << 20 });
const sek = (t) => t.toFixed(2).replace('.', ',') + ' s';

let kod = 0;
try {
  const parametre = { ...P, render: true, znacka: zn };
  delete parametre.sablona; delete parametre.vystup; delete parametre.meno;
  const sirka = +(P.sirka || 1080), vyska = +(P.vyska || 1920);
  const ctx = await browser.newContext({ viewport: { width: sirka, height: vyska }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await server(page);
  const chybyStranky = [];
  page.on('pageerror', (e) => chybyStranky.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') chybyStranky.push(m.text()); });
  await page.addInitScript((p) => { window.MG_PARAMETRE = p; }, parametre);
  await page.goto(HOST + encodeURI(SABLONA), { waitUntil: 'load' });
  const stav = await page.evaluate(() => window.MG ? window.MG.ready.then(() => 'ok', (e) => 'chyba: ' + e.message) : 'chyba: chýba window.MG (načítala sa mg.js?)');
  if (stav !== 'ok' || chybyStranky.length) throw new Error(`kompozícia sa nespustila: ${stav}${chybyStranky.length ? '\n  ' + chybyStranky.join('\n  ') : ''}`);
  const info = await page.evaluate(() => window.MG.info());
  // skutočná bezpečná zóna šablóny (pri zarovnaní na stred súmerná), na čiary v prehľade
  const zonaR = await page.evaluate(() => { const z = document.querySelector('#kompozicia .zona'); if (!z) return null; const r = z.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const vrstvy = await page.evaluate(() => window.MG.vrstvy());
  varovania.push(...(await page.evaluate(() => window.MG.varovania)));
  const { fps, dlzka } = info;
  const N = Math.round(dlzka * fps);

  // písmo: každý znak textov musí byť v súbore písma, ktorým sa kreslí (diakritika bez náhrady)
  const pouzite = await page.evaluate(() => {
    const out = [];
    const prvy = (f) => f.split(',')[0].trim().replace(/^["']|["']$/g, '');
    for (const el of document.querySelectorAll('#kompozicia [data-text], #kompozicia [data-text] em')) {
      if (el.closest('.mg-prazdna')) continue;
      const cs = getComputedStyle(el);
      const t = el.tagName === 'EM' ? el.textContent : [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('');
      if (t.trim()) out.push({ rodina: prvy(cs.fontFamily), vaha: +cs.fontWeight, styl: cs.fontStyle === 'italic' ? 'italic' : 'normal', text: t });
    }
    for (const el of document.querySelectorAll('#kompozicia [data-pocitadlo]')) {
      const cs = getComputedStyle(el);
      out.push({ rodina: prvy(cs.fontFamily), vaha: +cs.fontWeight, styl: 'normal', text: '0123456789,:% ' + (el.dataset.format || '') });
    }
    return out;
  });
  const vahaSedi = (f, w) => { const [a, b] = String(f.vaha ?? 400).split(/\s+/).map(Number); return b ? w >= a && w <= b : w === a; };
  const kontrolaPisma = [];
  const naSubor = new Map();
  for (const u of pouzite) {
    const f = PISMA.find((x) => x.rodina === u.rodina && (x.styl || 'normal') === u.styl && vahaSedi(x, u.vaha));
    if (!f) { kontrolaPisma.push(`text "${u.text.trim()}" chce ${u.rodina} ${u.vaha} ${u.styl}, značka také písmo nemá (prehliadač ho dopočíta alebo nahradí)`); continue; }
    naSubor.set(f.subor, (naSubor.get(f.subor) || '') + u.text);
  }
  for (const [subor, text] of naSubor) {
    const r = python([path.join(TU, 'fonty.py'), '--json', '--znaky', text, subor]);
    if (r.error) { varovania.push('python3 nie je k dispozícii: znaky v písme neoverené'); break; }
    try {
      const [v] = JSON.parse(r.stdout);
      if (v.chyba) kontrolaPisma.push(`${path.basename(subor)}: ${v.chyba}`);
      else if (v.chyba_znaky) kontrolaPisma.push(`${path.basename(subor)} nemá znaky: ${v.chyba_znaky}`);
    } catch { kontrolaPisma.push(`fonty.py zlyhal: ${r.stderr}`); }
  }
  if (kontrolaPisma.length && !A['bez-kontroly']) throw new Error('písmo:\n  ' + kontrolaPisma.join('\n  '));
  varovania.push(...kontrolaPisma);

  // ---------- snímky ----------
  const SN = path.join(VON, `.snimky-${MENO}`);
  fs.rmSync(SN, { recursive: true, force: true });
  fs.mkdirSync(SN, { recursive: true });
  const krokKontroly = Math.max(1, Math.round(fps / 6));
  const zona = new Map();
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const t = i / fps;
    const ch = await page.evaluate(async ([t, k]) => { await window.MG.seek(t); return k ? window.MG.kontrola(t) : null; }, [t, i % krokKontroly === 0 || i === N - 1]);
    if (ch) for (const c of ch) if (!zona.has(c)) zona.set(c, t);
    fs.writeFileSync(path.join(SN, `f${String(i).padStart(5, '0')}.png`), await page.screenshot({ omitBackground: true, type: 'png' }));
  }
  const casSnimok = (Date.now() - t0) / 1000;
  for (const [c, t] of zona) varovania.push(`${c} (prvýkrát v ${sek(t)})`);

  // čas detailu: najviac vrstiev v pokoji (po nástupe, pred odchodom)
  let tD = A['detail-cas'] !== undefined ? +A['detail-cas'] : null;
  if (tD === null) {
    let naj = -1;
    for (let i = 0; i < N; i++) {
      const t = i / fps;
      const n = vrstvy.filter((v) => !v.prazdna && !v.mimoZony && t >= v.in + v.vstupMs / 1000 && t < v.out - v.odchodMs / 1000).length;
      if (n > naj) { naj = n; tD = t; }
    }
  }
  const kD = Math.min(N - 1, Math.max(0, Math.round(tD * fps)));
  tD = kD / fps;
  const ramec = await page.evaluate(async (t) => { await window.MG.seek(t); return window.MG.ramec(t); }, tD);
  await ctx.close();

  // ---------- zoznam vrstiev ako časová os After Effects ----------
  const riadky = [`${MENO}: ${path.basename(SABLONA)}, ${zn.nazov || 'bez značky'}, ${sirka} x ${vyska}, ${fps} snímok/s, ${sek(dlzka)} (${N} snímok)`, '', '#   vrstva            in       out      nástup              odchod            čo robí'];
  for (const v of vrstvy) {
    riadky.push(`${String(v.poradie).padEnd(4)}${v.meno.padEnd(18)}${sek(v.in).padEnd(9)}${sek(v.out).padEnd(9)}${(v.vstup === 'nic' ? '-' : `${v.vstup} ${v.vstupMs} ms`).padEnd(20)}${(v.odchod === 'nic' ? '-' : `${v.odchod} ${v.odchodMs} ms`).padEnd(18)}${v.prazdna ? '(vynechaná: prázdny text alebo skry) ' : ''}${v.popis}`);
  }
  riadky.push('', 'farby značky:', ...zdrojFarieb.map((r) => '  ' + r));
  fs.writeFileSync(path.join(VON, `${MENO}-vrstvy.txt`), riadky.join('\n') + '\n');

  if (A['len-snimky']) {
    console.log(riadky.join('\n'));
    console.log(`\nsnímky: ${SN} (${N} PNG s alfou, ${casSnimok.toFixed(1)} s)`);
    const zoz = [...new Set(varovania)];
    console.log(zoz.length ? '\nvarovania:\n  ' + zoz.join('\n  ') : '\nbez varovaní');
  } else {
    // ---------- kódovanie ----------
    const VSTUP = ['-framerate', String(fps), '-i', path.join(SN, 'f%05d.png')];
    const BT709 = ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv'];
    const mov = path.join(VON, `${MENO}.mov`), webm = path.join(VON, `${MENO}.webm`);
    ffmpeg([...VSTUP, '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuva444p10le', '-c:v', 'prores_ks', '-profile:v', '4444', '-alpha_bits', '16', '-vendor', 'apl0', '-pix_fmt', 'yuva444p10le', ...BT709, mov], 'ProRes 4444');
    ffmpeg([...VSTUP, '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuva420p', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-crf', '18', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-auto-alt-ref', '0', ...BT709, webm], 'WebM VP9');
    // šachovnica (jedna snímka, potom slučka)
    const sach = path.join(SN, 'sachovnica.png');
    ffmpeg(['-f', 'lavfi', '-i', `color=c=gray:s=${sirka}x${vyska}`, '-vf', `format=gray,geq=lum='if(mod(floor(X/48)+floor(Y/48),2),118,86)'`, '-frames:v', '1', sach], 'šachovnica');
    const H264 = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-profile:v', 'high', '-pix_fmt', 'yuv420p', ...BT709, '-movflags', '+faststart', '-an'];
    const nahlad = path.join(VON, `${MENO}-nahlad.mp4`);
    ffmpeg(['-loop', '1', '-framerate', String(fps), '-i', sach, '-i', mov, '-filter_complex', `[0:v]scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[p];[p][1:v]overlay=format=yuv420:shortest=1,format=yuv420p`, '-t', String(dlzka), ...H264, nahlad], 'náhľad na šachovnici');
    let nahladZ = null;
    const zaber = A.zaber || P.zaber;
    if (zaber) {
      const zp = path.resolve(A.zaber ? process.cwd() : PDIR, zaber);
      if (!fs.existsSync(zp)) throw new Error(`záber ${zp} neexistuje`);
      const od = +(A['zaber-od'] ?? P.zaber_od ?? 0);
      nahladZ = path.join(VON, `${MENO}-nahlad-zaber.mp4`);
      // fotka (HEAD SPA 30 má len fotky): jedna snímka, na celú dĺžku ju natiahne tpad nižšie; -ss by z nej
      // nechal 0 snímok a -loop nefunguje pri AVIF (číta ho demuxer mov, nie image2)
      const FOTO = /\.(jpe?g|png|webp|avif|tiff?|bmp)$/i.test(zp);
      let vstupZ = ['-i', zp];
      if (!FOTO) {
        vstupZ = ['-ss', String(od), '-t', String(dlzka), '-i', zp];
        const pr = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', zp], { encoding: 'utf8' });
        const trv = parseFloat(pr.stdout);
        if (trv && trv - od < dlzka - 0.5 / fps) varovania.push(`záber ${path.basename(zp)} má od ${sek(od)} len ${sek(Math.max(0, trv - od))}, grafika ${sek(dlzka)}: v náhľade sa posledná snímka záberu drží (v reele daj dlhší úsek alebo kratšiu grafiku)`);
      }
      // zväčšenie záberu: lanczos + CAS (overené vo video-a-sekvencie), výrez na rozmer výstupu;
      // tpad drží poslednú snímku krátkeho záberu, aby náhľad mal vždy celú dĺžku grafiky
      const UP = `scale=${sirka}:${vyska}:force_original_aspect_ratio=increase:flags=lanczos+accurate_rnd+full_chroma_int,crop=${sirka}:${vyska},cas=strength=0.5,setsar=1,fps=${fps},format=yuv420p,tpad=stop_mode=clone:stop_duration=${dlzka}`;
      ffmpeg([...vstupZ, '-i', mov, '-filter_complex', `[0:v]${UP}[z];[z][1:v]overlay=format=yuv420:eof_action=repeat,format=yuv420p`, '-t', String(dlzka), ...H264, nahladZ], 'náhľad na zábere');
    }

    // ---------- kontrola: alfa v .mov a .webm, okraje, plynulosť ----------
    const KD = path.join(SN, 'kontrola');
    fs.mkdirSync(KD, { recursive: true });
    const tS = Math.max(0, (kD - 0.25) / fps).toFixed(4);
    const NA_RGB = 'scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24';
    const naPodklade = (vid, farba, out, dek) => ffmpeg([...(dek || []), '-ss', tS, '-i', vid, '-f', 'lavfi', '-i', `color=c=${farba}:s=${sirka}x${vyska}`, '-filter_complex', `[0:v]setpts=PTS-STARTPTS[o];[1:v]format=yuv444p[b];[b][o]overlay=format=yuv444,${NA_RGB}`, '-frames:v', '1', out], `snímka ${path.basename(vid)} na ${farba}`);
    const subory = {
      movB: path.join(KD, 'mov-biela.png'), movC: path.join(KD, 'mov-cierna.png'),
      webmB: path.join(KD, 'webm-biela.png'), webmC: path.join(KD, 'webm-cierna.png'),
    };
    naPodklade(mov, 'white', subory.movB); naPodklade(mov, 'black', subory.movC);
    // WebM s alfou dekóduje len libvpx-vp9; vstavaný dekodér vp9 alfu zahodí
    naPodklade(webm, 'white', subory.webmB, ['-c:v', 'libvpx-vp9']); naPodklade(webm, 'black', subory.webmC, ['-c:v', 'libvpx-vp9']);
    const ref = path.join(SN, `f${String(kD).padStart(5, '0')}.png`);
    const rm = ramec ? [Math.max(0, Math.floor(ramec.x - 24)), Math.max(0, Math.floor(ramec.y - 24)), Math.min(sirka, Math.ceil(ramec.x + ramec.w + 24)), Math.min(vyska, Math.ceil(ramec.y + ramec.h + 24))] : [0, 0, sirka, vyska];
    const kr = python([path.join(TU, 'kontrola.py'), '--snimky', SN, '--fps', String(fps), '--ref', ref, '--ramec', rm.join(','),
      '--par', `mov:${subory.movB}:${subory.movC}`, '--par', `webm:${subory.webmB}:${subory.webmC}`]);
    let K = null;
    if (kr.error) varovania.push('python3 nie je k dispozícii: alfa a plynulosť neoverené');
    else { try { K = JSON.parse(kr.stdout); } catch { varovania.push('kontrola.py zlyhala: ' + kr.stderr.slice(0, 400)); } }
    if (K) varovania.push(...K.varovania);

    // ---------- prehľad snímok a detail (kreslí Chromium, písmo značky) ----------
    const nVz = Math.min(8, N);
    const idx = [...new Set(Array.from({ length: nVz }, (_, k) => Math.round((k * (N - 1)) / Math.max(1, nVz - 1))))];
    const vzorky = (vid, pred) => {
      ffmpeg(['-i', vid, '-vf', `select='${idx.map((i) => `eq(n,${i})`).join('+')}',scale=${Math.round(sirka / 4)}:-2:flags=lanczos,${NA_RGB}`, '-fps_mode', 'vfr', path.join(KD, `${pred}-%02d.png`)], 'vzorky');
      return idx.map((_, k) => path.join(KD, `${pred}-${String(k + 1).padStart(2, '0')}.png`));
    };
    const rady = [['na šachovnici (.mov)', vzorky(nahlad, 'sach')]];
    if (nahladZ) rady.push(['na zábere (.mov)', vzorky(nahladZ, 'zaber')]);
    let detZ = null;
    if (nahladZ) { detZ = path.join(KD, 'zaber-detail.png'); ffmpeg(['-ss', tS, '-i', nahladZ, '-vf', NA_RGB, '-frames:v', '1', detZ], 'detail záberu'); }
    const pismoText = PISMA.find((f) => f.styl !== 'italic' && /manrope/i.test(f.rodina)) || PISMA[0];
    const ff = pismoText ? `@font-face{font-family:Pismo;src:url("${HOST + encodeURI(pismoText.subor)}")}` : '';
    const u = (p) => HOST + encodeURI(p);
    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const sir = Math.round(sirka / 4);
    const farbyV = ['#6f8fb8', '#b88f6f', '#7fae86', '#b07fae', '#a9a463', '#6fb0b0', '#b8707a', '#8f8fb8'];
    const os2 = vrstvy.map((v, i) => `<div class="r"><span class="m">${v.poradie}. ${esc(v.meno)}</span><span class="pas">${v.prazdna ? '<em>vynechaná</em>' : `<i style="left:${(v.in / dlzka) * 100}%;width:${((v.out - v.in) / dlzka) * 100}%;background:${farbyV[i % farbyV.length]}"><u style="width:${Math.min(100, (v.vstupMs / 1000 / Math.max(0.001, v.out - v.in)) * 100)}%"></u><u class="o" style="width:${Math.min(100, (v.odchodMs / 1000 / Math.max(0.001, v.out - v.in)) * 100)}%"></u></i>`}${idx.map((n) => `<b style="left:${((n / fps) / dlzka) * 100}%"></b>`).join('')}<b class="d" style="left:${(tD / dlzka) * 100}%"></b></span></div>`).join('');
    const zoznam = [...new Set(varovania)];
    const kStr = K ? K.riadky.map((r) => `<li>${esc(r)}</li>`).join('') : '<li>kontrola alfy neprebehla</li>';
    const sheet = `<!doctype html><meta charset="utf-8"><style>${ff}
      body{margin:0;background:#141414;color:#e8e8e8;font:15px/1.45 Pismo,sans-serif;padding:24px;width:${sir * idx.length + 24 * 2 + 8 * (idx.length - 1)}px}
      h1{font-size:20px;margin:0 0 4px}p{margin:0 0 14px;color:#aaa}.rad{display:flex;gap:8px;margin:6px 0 4px}.rad figure{margin:0}
      .rad figure{position:relative}.rad img{display:block;width:${sir}px}.rad .zo{position:absolute;border:1px dashed rgba(240,192,64,.75);pointer-events:none}.rad figcaption{font-size:12px;color:#aaa;text-align:center}h2{font-size:14px;margin:14px 0 2px;color:#ccc;font-weight:600}
      .os{margin-top:10px}.r{display:grid;grid-template-columns:200px 1fr;gap:10px;align-items:center;height:22px}.m{font-size:13px;white-space:nowrap}
      .pas{position:relative;height:16px;background:#232323}.pas i{position:absolute;top:2px;bottom:2px;display:flex;justify-content:space-between}
      .pas u{display:block;height:100%;background:rgba(255,255,255,.28)}.pas b{position:absolute;top:-3px;bottom:-3px;width:1px;background:rgba(255,255,255,.35)}
      .pas b.d{background:#f0c040;width:2px}.pas em{font-size:11px;color:#777;padding-left:6px}
      .kr{display:grid;grid-template-columns:200px 1fr;gap:10px;font-size:11px;color:#888;height:18px}.kr .st{position:relative}.kr i{position:absolute;top:2px;font-style:normal;white-space:nowrap;transform:translateX(-50%)}
      ul{margin:6px 0;padding-left:20px}li{margin:2px 0}.v li{color:#f0c070}</style>
      <h1>${esc(MENO)}: ${esc(path.basename(SABLONA))}, ${esc(zn.nazov)}</h1><p>${sirka} x ${vyska}, ${fps} snímok/s, ${sek(dlzka)} (${N} snímok). Žltá čiara = čas detailu ${sek(tD)}, čiarkovaný rámik = bezpečná zóna (hore ${info.zona.hore}, dole ${info.zona.dole}, vľavo ${info.zona.vlavo}, vpravo ${info.zona.vpravo} px; pri strede ${info.zona.bok} px z oboch strán).</p>
      ${rady.map(([n, obr]) => `<h2>${n}</h2><div class="rad">${obr.map((o, k) => `<figure><img src="${u(o)}">${zonaR ? `<span class="zo" style="left:${zonaR.x / 4}px;top:${zonaR.y / 4}px;width:${zonaR.w / 4}px;height:${zonaR.h / 4}px"></span>` : ''}<figcaption>${sek(idx[k] / fps)}</figcaption></figure>`).join('')}</div>`).join('')}
      <h2>vrstvy (časová os, svetlejší úsek = nástup a odchod)</h2><div class="os">${os2}<div class="kr"><span></span><span class="st">${Array.from({ length: Math.floor(dlzka * 2) + 1 }, (_, s) => `<i style="left:${((s / 2) / dlzka) * 100}%">${sek(s / 2)}</i>`).join('')}</span></div></div>
      <h2>kontrola</h2><ul>${kStr}</ul>${zoznam.length ? `<h2>varovania</h2><ul class="v">${zoznam.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p>bez varovaní</p>'}`;
    const [x0, y0, x1, y1] = rm;
    const cw = x1 - x0, ch = y1 - y0;
    const vyrez = (src, popis) => `<figure><div class="v" style="width:${cw}px;height:${ch}px"><img src="${u(src)}" style="left:${-x0}px;top:${-y0}px"></div><figcaption>${popis}</figcaption></figure>`;
    const det = `<!doctype html><meta charset="utf-8"><style>${ff}body{margin:0;background:#141414;color:#ddd;font:14px/1.4 Pismo,sans-serif;padding:16px;width:max-content}
      figure{margin:0 0 14px}.v{position:relative;overflow:hidden}.v img{position:absolute;image-rendering:pixelated}figcaption{color:#aaa;margin-top:4px}
      .z{display:flex;gap:16px}.z .v{width:${Math.round(cw / 2)}px;height:${Math.round(ch / 2)}px}.z .v img{transform:scale(2);transform-origin:0 0}</style>
      <p>${esc(MENO)}: detail v čase ${sek(tD)}, výrez ${cw} x ${ch} px v mierke 1 : 1 (zdroj ${x0},${y0}).</p>
      ${detZ ? vyrez(detZ, 'na zábere (náhľad MP4 z .mov)') : ''}${vyrez(subory.movB, '.mov na bielej (tmavý lem by tu bol vidno)')}${vyrez(subory.movC, '.mov na čiernej (svetlý lem by tu bol vidno)')}${vyrez(subory.webmB, '.webm na bielej (dekodér libvpx-vp9)')}`;
    STRANKY.set('/__prehlad__', sheet);
    STRANKY.set('/__detail__', det);
    const c2 = await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
    const p2 = await c2.newPage();
    await server(p2);
    for (const [cesta, sub] of [['/__prehlad__', `${MENO}-prehlad.png`], ['/__detail__', `${MENO}-detail.png`]]) {
      await p2.goto(HOST + cesta, { waitUntil: 'load' });
      await p2.evaluate(() => document.fonts.ready);
      await p2.screenshot({ path: path.join(VON, sub), fullPage: true });
    }
    await c2.close();

    console.log(riadky.join('\n'));
    console.log(`\nsnímky ${casSnimok.toFixed(1)} s, ${(casSnimok / N * 1000).toFixed(0)} ms na snímku`);
    if (K) console.log('\nkontrola:\n  ' + K.riadky.join('\n  '));
    console.log(zoznam.length ? '\nvarovania:\n  ' + zoznam.join('\n  ') : '\nbez varovaní');
    const vel = (p) => `${(fs.statSync(p).size / 1048576).toFixed(2)} MB`;
    console.log('\nvýstup:');
    for (const p of [mov, webm, nahlad, nahladZ, path.join(VON, `${MENO}-prehlad.png`), path.join(VON, `${MENO}-detail.png`), path.join(VON, `${MENO}-vrstvy.txt`)].filter(Boolean)) console.log(`  ${p}  ${vel(p)}`);
    if (!A['nechaj-snimky']) fs.rmSync(SN, { recursive: true, force: true });
    else console.log(`  ${SN}  (PNG snímky s alfou)`);
  }

  // ---------- samostatný náhľad v jednom HTML súbore (písma a skript vložené) ----------
  if (A.html) {
    let h = fs.readFileSync(SABLONA, 'utf8');
    const dnu = (sub) => fs.readFileSync(path.resolve(path.dirname(SABLONA), sub), 'utf8');
    h = h.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, s) => `<style>\n${dnu(s)}\n</style>`);
    const zn2 = { ...zn, fonty: PISMA.map((f) => ({ rodina: f.rodina, vaha: f.vaha, styl: f.styl, url: `data:font/woff2;base64,${fs.readFileSync(f.subor).toString('base64')}` })) };
    const par = JSON.stringify({ ...parametre, render: false, nahlad: true, znacka: zn2 }).replace(/</g, '\\u003c');
    h = h.replace(/<script src="([^"]+)"><\/script>/g, (_, s) => `<script>window.MG_PARAMETRE = ${par};</script>\n<script>\n${dnu(s)}\n</script>`);
    fs.writeFileSync(path.resolve(A.html), h);
    console.log(`  ${path.resolve(A.html)}  (samostatný náhľad s časovou osou, otvor v prehliadači)`);
  }
} catch (e) {
  console.error('chyba: ' + (e.message === 'ffmpeg' ? 'kódovanie zlyhalo' : e.message));
  kod = 1;
} finally {
  await browser.close();
}
process.exit(kod);
