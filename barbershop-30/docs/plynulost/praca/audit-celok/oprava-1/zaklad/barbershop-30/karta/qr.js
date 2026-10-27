/* QR kód (ISO/IEC 18004) – kódovanie po bajtoch, úroveň opravy M, verzie 1 až 10, výber masky podľa penalizácie.
 * Výstup: matica true/false. Stačí na adresu karty (do 213 bajtov). Bez knižníc. */
const EC_M = [[10, 1], [16, 1], [26, 1], [18, 2], [24, 2], [16, 4], [18, 4], [22, 2, 2], [22, 3, 2], [26, 4, 1]];
// [ec kódové slová na blok, počet blokov skupiny 1, (počet blokov skupiny 2)] pre verziu 1..10, úroveň M
const DATA_M = [16, 28, 44, 64, 86, 108, 124, 154, 182, 216];   // dátové kódové slová spolu
const ZAROVNANIE = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

const EXP = new Array(512), LOG = new Array(256);
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const nas = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

function rsGen(n) {
  let g = [1];
  for (let i = 0; i < n; i++) { const r = new Array(g.length + 1).fill(0); g.forEach((c, j) => { r[j] ^= c; r[j + 1] ^= nas(c, EXP[i]); }); g = r; }
  return g;
}
function rsZvysok(data, n) {
  const g = rsGen(n), r = data.concat(new Array(n).fill(0));
  for (let i = 0; i < data.length; i++) { const c = r[i]; if (c) for (let j = 0; j < g.length; j++) r[i + j] ^= nas(g[j], c); }
  return r.slice(data.length);
}

export function qr(text, vynutenaMaska) {
  const bajty = [...new TextEncoder().encode(text)];
  let v = 0;
  while (v < 10 && 4 + (v < 9 ? 8 : 16) + bajty.length * 8 > DATA_M[v] * 8) v++;
  if (v === 10) throw new Error('Text je pre QR príliš dlhý.');
  const ver = v + 1, kapacita = DATA_M[v] * 8, bity = [];
  const pis = (val, n) => { for (let i = n - 1; i >= 0; i--) bity.push((val >>> i) & 1); };
  pis(4, 4); pis(bajty.length, ver < 10 ? 8 : 16); bajty.forEach((b) => pis(b, 8));
  pis(0, Math.min(4, kapacita - bity.length));
  while (bity.length % 8) bity.push(0);
  const slova = [];
  for (let i = 0; i < bity.length; i += 8) slova.push(parseInt(bity.slice(i, i + 8).join(''), 2));
  for (let p = 0; slova.length < DATA_M[v]; p++) slova.push(p % 2 ? 0x11 : 0xec);
  // rozdelenie do blokov, oprava chýb, prekladanie
  const [ec, g1, g2 = 0] = EC_M[v], spolu = g1 + g2, kratky = Math.floor(DATA_M[v] / spolu), bloky = [], ecb = [];
  for (let b = 0, pos = 0; b < spolu; b++) { const dl = kratky + (b >= g1 ? 1 : 0); const d = slova.slice(pos, pos + dl); pos += dl; bloky.push(d); ecb.push(rsZvysok(d, ec)); }
  const vysledok = [];
  for (let i = 0; i <= kratky; i++) bloky.forEach((d) => { if (i < d.length) vysledok.push(d[i]); });
  for (let i = 0; i < ec; i++) ecb.forEach((e) => vysledok.push(e[i]));
  // matica
  const n = ver * 4 + 17, m = [...Array(n)].map(() => new Array(n).fill(null)), funkcia = [...Array(n)].map(() => new Array(n).fill(false));
  const daj = (x, y, c) => { m[y][x] = c; funkcia[y][x] = true; };
  const vyhladavac = (x0, y0) => { for (let dy = -1; dy <= 7; dy++) for (let dx = -1; dx <= 7; dx++) { const x = x0 + dx, y = y0 + dy; if (x < 0 || y < 0 || x >= n || y >= n) continue;
    const vnutri = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6; daj(x, y, vnutri && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4))); } };
  vyhladavac(0, 0); vyhladavac(n - 7, 0); vyhladavac(0, n - 7);
  for (let i = 8; i < n - 8; i++) { daj(i, 6, i % 2 === 0); daj(6, i, i % 2 === 0); }
  const zar = ZAROVNANIE[v];
  const na = zar.length;
  zar.forEach((cy, a) => zar.forEach((cx, b) => { if ((a === 0 && b === 0) || (a === 0 && b === na - 1) || (a === na - 1 && b === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) daj(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
  for (let i = 0; i < 9; i++) { if (!funkcia[8][i]) daj(i, 8, false); if (!funkcia[i][8]) daj(8, i, false); }
  for (let i = 0; i < 8; i++) { daj(n - 1 - i, 8, false); daj(8, n - 1 - i, false); }
  daj(8, n - 8, true);
  if (ver >= 7) { let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25); const bits = (ver << 12) | r;
    for (let i = 0; i < 18; i++) { const b = ((bits >>> i) & 1) === 1, a = n - 11 + (i % 3), c = Math.floor(i / 3); daj(a, c, b); daj(c, a, b); } }
  // dáta (cikcak po dvojstĺpcoch zdola nahor a späť)
  let i = 0; const vsetky = vysledok.flatMap((s) => [7, 6, 5, 4, 3, 2, 1, 0].map((k) => (s >>> k) & 1));
  for (let x = n - 1; x >= 1; x -= 2) { if (x === 6) x = 5;
    for (let k = 0; k < n; k++) for (let j = 0; j < 2; j++) { const xx = x - j, hore = ((x + 1) & 2) === 0, y = hore ? n - 1 - k : k;
      if (!funkcia[y][xx]) { m[y][xx] = i < vsetky.length ? vsetky[i] === 1 : false; i++; } } }
  const MASKY = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];
  const format = (maska) => { const d = (0 << 3) | maska; let r = d; for (let k = 0; k < 10; k++) r = (r << 1) ^ ((r >>> 9) * 0x537); return ((d << 10) | r) ^ 0x5412; };
  const formatuj = (t, maska) => {
    const f = format(maska), bit = (k) => ((f >>> k) & 1) === 1, set = (x, y, b) => { t[y][x] = b; };
    for (let k = 0; k <= 5; k++) set(8, k, bit(k));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let k = 9; k < 15; k++) set(14 - k, 8, bit(k));
    for (let k = 0; k < 8; k++) set(n - 1 - k, 8, bit(k));
    for (let k = 8; k < 15; k++) set(8, n - 15 + k, bit(k));
    set(8, n - 8, true);
  };
  let najlepsia = null, najmensia = Infinity;
  for (let mk = 0; mk < 8; mk++) {
    if (vynutenaMaska !== undefined && mk !== vynutenaMaska) continue;
    const t = m.map((r, y) => r.map((c, x) => (funkcia[y][x] ? c : c !== MASKY[mk](x, y))));
    formatuj(t, mk);
    const p = penalizacia(t);
    if (p < najmensia) { najmensia = p; najlepsia = t; }
  }
  return najlepsia;
}

function penalizacia(t) {
  const n = t.length; let p = 0;
  const riadky = (get) => { for (let a = 0; a < n; a++) { let beh = 1;
    for (let b = 1; b < n; b++) { if (get(a, b) === get(a, b - 1)) { beh++; if (beh === 5) p += 3; else if (beh > 5) p++; } else beh = 1; }
    for (let b = 0; b + 10 < n; b++) { const vz = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0].map((x) => x === 1);
      const a1 = vz.every((x, k) => get(a, b + k) === x), a2 = vz.slice().reverse().every((x, k) => get(a, b + k) === x); if (a1) p += 40; if (a2) p += 40; } } };
  riadky((a, b) => t[a][b]); riadky((a, b) => t[b][a]);
  for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) { const c = t[y][x]; if (c === t[y][x + 1] && c === t[y + 1][x] && c === t[y + 1][x + 1]) p += 3; }
  const tmave = t.flat().filter(Boolean).length;
  p += Math.floor(Math.abs(tmave * 20 - n * n * 10) / (n * n)) * 10;
  return p;
}

/* SVG s tichou zónou 4 moduly */
export function qrSvg(text, farba = '#111', pozadie = '#fff') {
  const t = qr(text), n = t.length, z = 4;
  let d = '';
  t.forEach((r, y) => r.forEach((c, x) => { if (c) d += `M${x + z} ${y + z}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2 * z} ${n + 2 * z}" shape-rendering="crispEdges" role="img" aria-label="QR kód karty"><rect width="100%" height="100%" fill="${pozadie}"/><path d="${d}" fill="${farba}"/></svg>`;
}
