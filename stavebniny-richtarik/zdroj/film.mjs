// Výpočty pre úvodný film ovládaný skrolovaním (volá ich zdroj/film.sh).
//   node film.mjs pohyb <klip.mp4>                   rozdiel susedných snímok klipu pri 320×180 (JSON)
//   node film.mjs plan <pohyb.json> [N] [w]           výber N snímok, výrezy a ohniská (JSON)
//   node film.mjs data <plan.json>                    údaje pre stránku (počet snímok, ohniská)
//   node film.mjs bg <t720/000.png> <p1920/000.png> <plan.json>   štýl podkladu úvodu (farba, malý náhľad, ohnisko)
//   node film.mjs vloz <index.html> <data.json> [bg.txt]  vloží údaje do <script id="film-data"> a štýl podkladu
//   node film.mjs rozdiely <priečinok> <N> [pripona]   rozdiel susedných hotových snímok (kontrola plynulosti)
//   node film.mjs vyrez4k <plan.json> <W> <H>           výrezy telefónu priamo zo 4K pásu (afinná projekcia pre convert)
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

// Medzisnímky: klip 4K (3830×2160) zmenšený na 2880×1624 a dopočítaný na 48 snímok/s (minterpolate), polovičný krok
// zdroja = 1 index. Výrezy sú v pixeloch tohto rozmeru.
const MW = 2880, MH = 1624, POL = 480;            // posledný polovičný index (241 snímok zdroja = 0..480)
const TW = Math.round(MH * 9 / 19.5);             // výrez telefónu 9:19,5 na plnú výšku (750 px)
const LH = Math.round(MW * 9 / 16);               // počítač 16:9 (1620 px, 2 px hore a dole preč)

// Kľúčové body auta odčítané zo snímok každých 0,5 s (mriežka po 5 % šírky a 10 % výšky):
// t [s], stred výrezu telefónu x [%], stred auta x [%], stred auta y [%].
// Prvé 2,5 s je auto (bokom, 30 % šírky) širšie než výrez telefónu (26 %): ľavý okraj výrezu je 1,5 % pred kabínou
// (kabína, nápis a žeriav celé), odreže sa len koniec korby. Od 3 s je výrez na strede auta.
const KLUC = [
  [0.0, 52.5, 55.0, 63.0], [0.5, 53.5, 56.5, 64.0], [1.0, 56.5, 59.5, 65.0], [1.5, 59.5, 62.0, 65.0],
  [2.0, 62.5, 64.0, 63.5], [2.5, 65.5, 65.2, 63.0], [3.0, 66.0, 66.0, 62.5], [3.5, 66.5, 66.5, 62.0],
  [4.0, 66.0, 66.0, 61.0], [4.5, 66.5, 66.5, 61.0], [5.0, 67.0, 67.0, 57.0], [5.5, 68.3, 68.3, 53.5],
  [6.0, 68.7, 68.7, 52.0], [6.5, 68.5, 68.5, 49.0], [7.0, 68.0, 68.0, 45.0], [7.5, 67.0, 67.0, 43.5],
  [8.0, 65.5, 65.5, 38.0], [8.5, 64.1, 64.1, 36.0], [9.0, 62.7, 62.7, 28.0], [9.5, 60.9, 60.9, 28.0],
  [10.0, 60.0, 60.0, 30.0],
];

const r3 = (x) => Math.round(x * 1000) / 1000;

// Ostrejšia sada telefónu (t960): výrez sa berie zo 4K klipu (3830×2160), nie z medzisnímok 2880. Medzisnímky 48/s sa
// pre ňu počítajú len v páse, kde výrez telefónu kedy je (PAS_X…PAS_X + PAS_W v 4K), na plnom rozlíšení. Výrez je ten
// istý ako v pláne (P.x v pixeloch 2880), len prepočítaný: rovnaké zábery, viac pixelov.
export const K4 = 3830 / MW, PAS_X = 1440, PAS_W = 1760;
// Ostrý štart (start-ulica.png, 2688×1520) leží na 4K snímke s mierkou 1,424 a posunom +1/−4 px (nájdené pri štarte 2880).
const START_A = 1.424, START_TX = 1, START_TY = -4;
function vyrez4k(pl, W, H) {
  return pl.snimky.map((o) => {
    const x0 = o.P.x * K4 - PAS_X, sx = W / (o.P.w * K4), sy = H / (o.P.h * K4);
    const k = String(o.k).padStart(3, '0');
    if (o.src === 'start') return ['start', [START_A * sx, 0, 0, START_A * sy, (START_TX - PAS_X - x0) * sx, START_TY * sy].map((v) => +v.toFixed(6)).join(','), k].join(' ');
    return [`m48t/${String(o.h).padStart(4, '0')}.png`, [sx, 0, 0, sy, -x0 * sx, 0].map((v) => +v.toFixed(6)).join(','), k].join(' ');
  }).join('\n');
}

function pohyb(src) {
  const W = 320, H = 180, N = W * H;
  return new Promise((ok) => {
    const p = spawn('ffmpeg', ['-v', 'error', '-i', src, '-vf', `scale=${W}:${H}:flags=area,format=gray`, '-f', 'rawvideo', '-'], { stdio: ['ignore', 'pipe', 'inherit'] });
    let buf = Buffer.alloc(0), prev = null; const d = [];
    p.stdout.on('data', (c) => {
      buf = Buffer.concat([buf, c]);
      while (buf.length >= N) {
        const f = buf.subarray(0, N); buf = buf.subarray(N);
        if (prev) { let s = 0; for (let i = 0; i < N; i++) s += Math.abs(f[i] - prev[i]); d.push(r3(s / N)); }
        prev = Buffer.from(f);
      }
    });
    p.on('close', () => ok(d));
  });
}

// Catmull-Rom cez kľúčové body (stĺpec col), potom Gaussovo vyhladenie sigma [s] na mriežke 48 snímok/s.
function krivka(col, sigma) {
  const raw = [];
  for (let h = 0; h <= POL; h++) {
    const t = h / 48; let i = Math.min(KLUC.length - 2, Math.floor(t / 0.5));
    const u = (t - KLUC[i][0]) / 0.5;
    const p0 = KLUC[Math.max(0, i - 1)][col], p1 = KLUC[i][col], p2 = KLUC[i + 1][col], p3 = KLUC[Math.min(KLUC.length - 1, i + 2)][col];
    raw.push(0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u));
  }
  const s = sigma * 48, R = Math.ceil(s * 3), out = [];
  for (let h = 0; h <= POL; h++) {
    let a = 0, wsum = 0;
    for (let j = -R; j <= R; j++) { const w = Math.exp(-(j * j) / (2 * s * s)); a += w * raw[Math.min(POL, Math.max(0, h + j))]; wsum += w; }
    out.push(a / wsum);
  }
  return out;
}

// Výber snímok: hustota = (1 − w) · čas + w · pohyb (rozdiel vyhladený oknom 9 snímok). Rovnaký krok skrolovania
// tak znamená podobne veľkú zmenu obrazu (pomalá ulica má redšie snímky, rýchly prelet dvorom hustejšie).
function plan(d, N, w) {
  const n = d.length, ds = d.map((_, i) => { let a = 0, c = 0; for (let j = i - 4; j <= i + 4; j++) if (j >= 0 && j < n) { a += d[j]; c++; } return a / c; });
  const sum = ds.reduce((a, b) => a + b, 0), C = [0];
  for (let i = 0; i < n; i++) C.push(C[i] + (1 - w) / n + w * ds[i] / sum);
  const tz = (target) => { let i = 0; while (i < n - 1 && C[i + 1] < target) i++; const f = (target - C[i]) / Math.max(1e-9, C[i + 1] - C[i]); return i + Math.min(1, Math.max(0, f)); };
  const fxP = krivka(1, 0.3), fxA = krivka(2, 0.3), fyA = krivka(3, 0.3);
  const out = []; let last = -1;
  for (let k = 0; k < N; k++) {
    const hi = k === N - 1 ? POL : 2 * tz(k / (N - 1));   // ideálny (nezaokrúhlený) polovičný index
    let h = Math.round(hi);
    if (h <= last) h = last + 1;
    last = h;
    const cx = fxP[h] / 100 * MW, x = Math.round(Math.min(MW - TW, Math.max(0, cx - TW / 2)));
    out.push({
      k, h, hi: Math.round(hi * 100) / 100, t: r3(h / 48), src: k === 0 ? 'start' : `m48/${String(h).padStart(4, '0')}.png`,
      P: { x, y: 0, w: TW, h: MH },                       // telefón: výrez 9:19,5 so stredom na aute
      L: { x: 0, y: Math.round((MH - LH) / 2), w: MW, h: LH }, // počítač: celý záber 16:9
      // ohnisko pre object-position (pomer 0–1) pri okne iného pomeru strán než snímka
      oxL: r3(fxA[h] / 100), oyL: r3(fyA[h] / 100), oyP: r3(fyA[h] / 100),
    });
  }
  return { N, w, kroky: out.map((o, i) => (i ? o.h - out[i - 1].h : 0)), snimky: out };
}

function data(pl) {
  const s = pl.snimky;
  // h = skutočný čas snímky, hi = ideálny čas (v polovičných snímkach zdroja): prehrávač podľa nich prelína tak,
  // aby pohyb sledoval plynulú krivku času aj tam, kde sa krok striedavo zaokrúhlil na 2 a 3
  // koniec: posledná snímka filmu. Ku koncu klipu kamera nízko nad dvorom zrýchľuje a obraz je čoraz rozmazanejší
  // (Laplace 4K pásu, auto / zem: h 408 → 2,08 / 1,33, h 440 → 1,71 / 0,87, h 480 → 1,77 / 0,46), film preto stojí na
  // pôvodnej snímke klipu h 408 (KONIEC_H), z nej je aj ostrý posledný záber (film.sh 4c); snímky za ňou sa nekreslia
  // ani nesťahujú
  const kh = +(process.env.KONIEC_H || 408), koniec = Math.max(0, s.findLastIndex((o) => o.h <= kh));
  return { n: s.length, blok: 8, h: s.map((o) => o.h), hi: s.map((o) => o.hi), oxL: s.map((o) => o.oxL), oyL: s.map((o) => o.oyL), oyP: s.map((o) => o.oyP), koniec };
}

function vloz(html, json, bgf) {
  let t = readFileSync(html, 'utf8');
  const d = readFileSync(json, 'utf8').trim();
  const re = /(<script type="application\/json" id="film-data">)[\s\S]*?(<\/script>)/;
  if (!re.test(t)) throw new Error('v index.html chýba <script type="application/json" id="film-data">');
  t = t.replace(re, (_, a, b) => a + d + b);
  if (bgf) {
    const bg = readFileSync(bgf, 'utf8').trim(), rb = /(<div class="bg" data-film-bg style=")[^"]*(")/;
    if (!rb.test(t)) throw new Error('v index.html chýba <div class="bg" data-film-bg style="">');
    t = t.replace(rb, (_, a, b) => a + bg + b);
  }
  writeFileSync(html, t);
}

// Podklad pod prvým obrazom, kým sa načíta: priemerná farba a malý rozmazaný náhľad (WebP v base64) toho istého
// obrazu, plus ohnisko snímky 0 pre object-position (telefón: zvislé, počítač: obe osi).
function bg(ft, fp, planf) {
  const s0 = JSON.parse(readFileSync(planf, 'utf8')).snimky[0];
  const farba = (f) => { const b = execFileSync('ffmpeg', ['-v', 'error', '-i', f, '-vf', 'scale=1:1:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']); return '#' + [...b.subarray(0, 3)].map((x) => x.toString(16).padStart(2, '0')).join(''); };
  const nahlad = (f, w, h) => 'url(data:image/webp;base64,' + execFileSync('ffmpeg', ['-v', 'error', '-i', f, '-vf', `scale=${w}:${h}:flags=area`, '-c:v', 'libwebp', '-quality', '40', '-f', 'webp', '-']).toString('base64') + ')';
  const pc = (x) => Math.round(x * 1000) / 10 + '%';
  return [`--farba-t:${farba(ft)}`, `--nahlad-t:${nahlad(ft, 16, 35)}`, `--oy-t:${pc(s0.oyP)}`,
    `--farba-p:${farba(fp)}`, `--nahlad-p:${nahlad(fp, 32, 18)}`, `--ox-p:${pc(s0.oxL)}`, `--oy-p:${pc(s0.oyL)}`].join(';');
}

// Rozdiel susedných hotových snímok (priemerný absolútny rozdiel jasu pri šírke 320 px).
function rozdiely(dir, N, pr) {
  const out = [];
  let prev = null;
  for (let k = 0; k < N; k++) {
    const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', `${dir}/${String(k).padStart(3, '0')}${pr}`, '-vf', 'scale=320:-2:flags=area,format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 26 });
    if (prev) { let s = 0; for (let i = 0; i < buf.length; i++) s += Math.abs(buf[i] - prev[i]); out.push(r3(s / buf.length)); }
    prev = buf;
  }
  return out;
}

const [, , cmd, a, b, c] = process.argv;
if (cmd === 'pohyb') console.log(JSON.stringify(await pohyb(a)));
else if (cmd === 'plan') console.log(JSON.stringify(plan(JSON.parse(readFileSync(a, 'utf8')), +(b || 144), +(c || 0.55))));
else if (cmd === 'data') console.log(JSON.stringify(data(JSON.parse(readFileSync(a, 'utf8')))));
else if (cmd === 'vloz') vloz(a, b, c);
else if (cmd === 'bg') console.log(bg(a, b, c));
else if (cmd === 'rozdiely') console.log(JSON.stringify(rozdiely(a, +b, c || '.png')));
else if (cmd === 'vyrez4k') console.log(vyrez4k(JSON.parse(readFileSync(a, 'utf8')), +b, +c));
else { console.error('neznámy príkaz'); process.exit(1); }
