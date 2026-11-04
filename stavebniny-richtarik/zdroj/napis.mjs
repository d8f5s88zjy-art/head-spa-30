// Ostrý nápis na aute v prvých snímkach filmu. Snímka 0 je ostrý prvý záber (start-ulica.png) s čitateľným
// „STAVEBNINY RICHTÁRIK / PREDAJ STAVEBNÉHO MATERIÁLU AUTODOPRAVA“; v klipe je už od snímky 1 písmo pokrivené
// (aj v zdroji „STAVEDNINY“). Bočnica korby je rovina: jej homografia snímka 0 → snímka k sa sleduje snímku po snímke
// (premietnutie snímky 0 predchádzajúcou homografiou, lokálne posuny NCC v mriežke na bočnici, robustné spresnenie)
// a bočnica zo snímky 0 sa vloží do snímky k (mäkká maska, svetlo prispôsobené rovinou po kanáloch). Váha w(k):
// plná do snímky K1, potom lineárne na 0 v snímke K2 (bočnica sa natáča, písmo je už malé a šikmé).
// Celá bočnica (oba panely) do snímky K1, prvý panel s nápisom STAVEBNINY RICHTÁRIK (štvoruholník QA) do KA1; po K1
// sa sleduje len prvý panel (zadný panel sa natáča a homografia celej bočnice by sa naň nepresne predĺžila).
//   node napis.mjs <priečinok sady> <výstupný priečinok> <Q celá bočnica> K1 K2 <QA prvý panel> KA1 KA2 [rozsah=12]
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
const [dir, outDir, quadS, K1s, K2s, quadAS, KA1s, KA2s, rozS = '12'] = process.argv.slice(2);
const K1 = +K1s, K2 = +K2s, KA1 = +KA1s, KA2 = +KA2s, ROZ = +rozS;
mkdirSync(outDir, { recursive: true });
const im = (a) => execFileSync('convert', a, { maxBuffer: 1 << 30 });
const f = (k) => `${dir}/${String(k).padStart(3, '0')}.png`;
const [W, H] = execFileSync('identify', ['-format', '%w %h', f(0)]).toString().split(' ').map(Number);
const Q = quadS.split(';').map((p) => p.split(',').map(Number)), QA = quadAS.split(';').map((p) => p.split(',').map(Number));
const sk = +(process.env.SK || W / 960);   // mierka auta voči t960 (veľkosť okien); počítačové sady majú auto menšie

function fitH(B) {
  const norm = (P) => { const mx = P.reduce((a, p) => a + p[0], 0) / P.length, my = P.reduce((a, p) => a + p[1], 0) / P.length;
    return [Math.SQRT2 / (P.reduce((a, p) => a + Math.hypot(p[0] - mx, p[1] - my), 0) / P.length), mx, my]; };
  const [sp, mpx, mpy] = norm(B.map((b) => [b[0], b[1]])), [st, mtx, mty] = norm(B.map((b) => [b[2], b[3]]));
  const M = Array.from({ length: 8 }, () => Array(9).fill(0));
  for (const [x0, y0, u0, v0] of B) {
    const x = (x0 - mpx) * sp, y = (y0 - mpy) * sp, u = (u0 - mtx) * st, v = (v0 - mty) * st;
    for (const [r, b] of [[[x, y, 1, 0, 0, 0, -u * x, -u * y], u], [[0, 0, 0, x, y, 1, -v * x, -v * y], v]])
      for (let i = 0; i < 8; i++) { for (let j = 0; j < 8; j++) M[i][j] += r[i] * r[j]; M[i][8] += r[i] * b; }
  }
  for (let i = 0; i < 8; i++) { let p = i; for (let k = i + 1; k < 8; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k; [M[i], M[p]] = [M[p], M[i]];
    for (let k = 0; k < 8; k++) if (k !== i) { const q = M[k][i] / M[i][i]; for (let j = i; j < 9; j++) M[k][j] -= q * M[i][j]; } }
  const hn = [...M.map((r, i) => r[8] / r[i]), 1];
  const mul = (a, b) => [0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => a[3 * i] * b[j] + a[3 * i + 1] * b[3 + j] + a[3 * i + 2] * b[6 + j]));
  const h = mul([1 / st, 0, mtx, 0, 1 / st, mty, 0, 0, 1], mul(hn, [sp, 0, -sp * mpx, 0, sp, -sp * mpy, 0, 0, 1]));
  return h.map((v) => v / h[8]);
}
const ap = (h, x, y) => { const w = h[6] * x + h[7] * y + h[8]; return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]; };
function inv(h) {
  const [a, b, c, d, e, g0, g, k, l] = h, A = e * l - g0 * k, B = -(d * l - g0 * g), C = d * k - e * g, det = a * A + b * B + c * C;
  const r = [A, -(b * l - c * k), b * g0 - c * e, B, a * l - c * g, -(a * g0 - c * d), C, -(a * k - b * g), a * e - b * d].map((v) => v / det);
  return r.map((v) => v / r[8]);
}
const box = [Math.min(...Q.map((p) => p[0])) - 40 * sk, Math.min(...Q.map((p) => p[1])) - 40 * sk, Math.max(...Q.map((p) => p[0])) + 40 * sk, Math.max(...Q.map((p) => p[1])) + 40 * sk];
function premietni(src, h, fmt = 'rgba:-', extra = []) {
  const P = [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]];
  const arg = P.map(([x, y]) => { const [u, v] = ap(h, x, y); return `${x.toFixed(2)},${y.toFixed(2)} ${u.toFixed(3)},${v.toFixed(3)}`; }).join('  ');
  return im([...(Array.isArray(src) ? src : [src]), '-alpha', 'set', '-virtual-pixel', 'transparent', '-define', `distort:viewport=${W}x${H}+0+0`, '-filter', 'Lanczos', '-distort', 'Perspective', arg, ...extra, '-depth', '8', fmt]);
}
const gray = (file) => Float32Array.from(im([file, '-colorspace', 'gray', '-depth', '8', 'gray:-']));
const S0 = f(0);
const maskS = `${outDir}/maska0.png`;
im(['-size', `${W}x${H}`, 'xc:black', '-fill', 'white', '-draw', 'polygon ' + Q.map((p) => p.join(',')).join(' '), '-depth', '8', maskS]);
const maskA = `${outDir}/maskaA0.png`;
im(['-size', `${W}x${H}`, 'xc:black', '-fill', 'white', '-draw', 'polygon ' + QA.map((p) => p.join(',')).join(' '), '-depth', '8', maskA]);
let h = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const log = [];
for (let k = 1; k <= Math.max(K2, KA2); k++) {
  const T = gray(f(k)), sledMaska = k <= K1 ? maskS : maskA;
  for (let iter = 0; iter < 3; iter++) {
    const Wp = premietni(S0, h), Mw = premietni(sledMaska, h, 'gray:-', ['-alpha', 'off']);
    const G = new Float32Array(W * H); for (let i = 0; i < W * H; i++) G[i] = 0.299 * Wp[4 * i] + 0.587 * Wp[4 * i + 1] + 0.114 * Wp[4 * i + 2];
    const R = Math.round(14 * sk), S = Math.round((iter ? 4 : ROZ) * sk), krok = Math.max(6, Math.round(14 * sk)), pts = [];
    const [bx0, by0] = ap(h, box[0], box[1]), [bx1, by1] = ap(h, box[2], box[3]);
    for (let cy = Math.max(R + S, Math.floor(Math.min(by0, by1))); cy < Math.min(H - R - S, Math.ceil(Math.max(by0, by1))); cy += krok)
      for (let cx = Math.max(R + S, Math.floor(Math.min(bx0, bx1))); cx < Math.min(W - R - S, Math.ceil(Math.max(bx0, bx1))); cx += krok) {
        // celé okno na bočnici (nie zadné čelo s tehlami ani podvozok, inak sa homografia stiahne k inej rovine)
        if (Mw[cy * W + cx] < 200 || Mw[(cy - R) * W + cx - R] < 200 || Mw[(cy - R) * W + cx + R] < 200 || Mw[(cy + R) * W + cx - R] < 200 || Mw[(cy + R) * W + cx + R] < 200) continue;
        let s = 0, s2 = 0, n = 0;
        for (let y = -R; y <= R; y += 2) for (let x = -R; x <= R; x += 2) { const v = G[(cy + y) * W + cx + x]; s += v; s2 += v * v; n++; }
        const mg = s / n, sg = Math.sqrt(Math.max(1e-6, s2 / n - mg * mg)); if (sg < 14) continue;
        let best = -2, bx = 0, by = 0;
        for (let dy = -S; dy <= S; dy++) for (let dx = -S; dx <= S; dx++) {
          let a = 0, a2 = 0, c = 0;
          for (let y = -R; y <= R; y += 2) for (let x = -R; x <= R; x += 2) { const v = T[(cy + dy + y) * W + cx + dx + x]; a += v; a2 += v * v; c += v * G[(cy + y) * W + cx + x]; }
          const mt = a / n, st = Math.sqrt(Math.max(1e-6, a2 / n - mt * mt)), ncc = (c / n - mt * mg) / (st * sg);
          if (ncc > best) { best = ncc; bx = dx; by = dy; }
        }
        if (best > 0.6) pts.push([cx, cy, cx + bx, cy + by, best]);
      }
    if (pts.length < 8) { log.push(`snímka ${k}: málo bodov (${pts.length}), homografia z predchádzajúcej`); break; }
    const hi = inv(h);
    let C = pts.map(([x, y, u, v]) => { const [px, py] = ap(hi, x, y); return [px, py, u, v]; });
    let hh = h;
    for (let r = 0; r < 4; r++) {
      hh = fitH(C); const e = C.map(([px, py, u, v]) => { const [a, b] = ap(hh, px, py); return Math.hypot(a - u, b - v); });
      const med = e.slice().sort((a, b) => a - b)[e.length >> 1]; C = C.filter((_, i) => e[i] < Math.max(1.2 * sk, 2.5 * med));
    }
    const e = C.map(([px, py, u, v]) => { const [a, b] = ap(hh, px, py); return Math.hypot(a - u, b - v); }).sort((a, b) => a - b);
    h = hh;
    if (iter === 2) log.push(`snímka ${k}: bodov ${pts.length}, ponechaných ${C.length}, rezíduum medián ${e[e.length >> 1].toFixed(2)} px`);
  }
  // vloženie: bočnica zo snímky 0 (maska zúžená o 3 px, mäkký okraj), svetlo prispôsobené rovinou po kanáloch
  const w = k <= K1 ? 1 : Math.max(0, (K2 - k) / (K2 - K1)), wA = k <= KA1 ? 1 : Math.max(0, (KA2 - k) / (KA2 - KA1));
  const er = ['-morphology', 'Erode', `Disk:${Math.max(2, Math.round(3 * sk))}`, '-blur', `0x${(1.6 * sk).toFixed(2)}`];
  const Wp = premietni(S0, h), Mf = premietni([maskS, ...er], h, 'gray:-', ['-alpha', 'off']), MA = premietni([maskA, ...er], h, 'gray:-', ['-alpha', 'off']);
  const Mw = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) Mw[i] = k <= K1 ? Mf[i] : MA[i];
  const F = im([f(k), '-depth', '8', 'rgb:-']), O = Buffer.from(F);
  const body = [];
  for (let i = 0; i < W * H; i += 3) if (Mw[i] > 250 && Wp[4 * i + 3] > 250) body.push(i);
  const pl = [0, 1, 2].map((c) => {
    // rovina rozdielu (cieľ − vložené) cez rozmazané hodnoty: a + b·x + c·y
    const s = Array(9).fill(0), t = [0, 0, 0];
    for (const i of body) { const x = (i % W) / W, y = Math.floor(i / W) / H, d = F[3 * i + c] - Wp[4 * i + c], r = [1, x, y];
      for (let a = 0; a < 3; a++) { t[a] += r[a] * d; for (let b = 0; b < 3; b++) s[3 * a + b] += r[a] * r[b]; } }
    const det = (m) => m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);
    const D = det(s); return [0, 1, 2].map((q) => { const m = s.slice(); for (let a = 0; a < 3; a++) m[3 * a + q] = t[a]; return det(m) / D; });
  });
  for (let i = 0; i < W * H; i++) {
    const a = Math.max(Mf[i] / 255 * w, MA[i] / 255 * wA) * (Wp[4 * i + 3] / 255); if (a <= 0) continue;
    const x = (i % W) / W, y = Math.floor(i / W) / H;
    for (let c = 0; c < 3; c++) { const v = Wp[4 * i + c] + pl[c][0] + pl[c][1] * x + pl[c][2] * y; O[3 * i + c] = Math.max(0, Math.min(255, Math.round(F[3 * i + c] * (1 - a) + v * a))); }
  }
  writeFileSync(`${outDir}/tmp.rgb`, O);
  im(['-size', `${W}x${H}`, '-depth', '8', `rgb:${outDir}/tmp.rgb`, `${outDir}/${String(k).padStart(3, '0')}.png`]);
  console.log(log.at(-1), `váha bočnica ${w.toFixed(2)} panel ${wA.toFixed(2)}`);
}
execFileSync('rm', ['-f', `${outDir}/tmp.rgb`]);
writeFileSync(`${outDir}/sledovanie.log`, log.join('\n') + '\n');
