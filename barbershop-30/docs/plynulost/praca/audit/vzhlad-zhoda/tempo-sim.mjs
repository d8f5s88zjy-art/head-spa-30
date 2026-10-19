// Simulácia tempa: skok skrolu cez hranicu kariet (rohozka → sala, telefón 390×844, kotvy zo synchro-p390.json).
// Text karty: app.js lerp k = 0,16 na snímku 60 Hz (app.js:243) a krytie karty CARD_IN/CARD_OUT (app.js:19, 186-189).
// Film: pružina w0 = 6,5 (film.js:1238-1239) a vyhladenie prelínania fade += (goal − fade)(1 − 0,02^dt) (film.js:1095).
import fs from 'node:fs';
const J = JSON.parse(fs.readFileSync('merania/synchro-p390.json'));
const A = J.anchors, cards = J.cards, vh = J.vh;
const h = J.hranice[0];                       // rohozka → sala
const y0 = 600, y1 = 1100;                    // švih: z polovice úvodu na kartu Poď ďalej
const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const e01 = (v) => sm(0, 1, v);
const c1 = cards[1];
const textO = (y) => Math.min(e01((y - c1.top) / c1.free / 0.12), 1);
const Sof = (y) => { for (let k = 1; k < A.length; k++) if (y < A[k]) return k - 1 + (y - A[k - 1]) / (A[k] - A[k - 1]); return A.length - 1; };
const [f0, f1] = h.film_strih; const k = Math.floor(Sof(f0));
const want = (S) => { const y = A[k] + (S - k) * (A[k + 1] - A[k]); return sm(f0, f1, y); };
let yt = y0, S = Sof(y0), V = 0, fade = want(S); const dt = 1 / 60;
const T = Sof(y1); const rows = []; let tText = null, tFilm = null, tText90 = null, tFilm90 = null;
for (let i = 0; i <= 120; i++) {
  const t = i * dt; const o = textO(yt); const f = fade;
  if (tText === null && o >= 0.5) tText = t; if (tText90 === null && o >= 0.9) tText90 = t;
  if (tFilm === null && f >= 0.5) tFilm = t; if (tFilm90 === null && f >= 0.9) tFilm90 = t;
  if (i % 6 === 0) rows.push(`${(t * 1000).toFixed(0).padStart(5)} ms  text ${o.toFixed(2)}  film mix ${f.toFixed(2)}`);
  yt += (y1 - yt) * 0.16;
  V += ((T - S) * 6.5 * 6.5 - 2 * 6.5 * V) * dt; S += V * dt;
  fade += (want(S) - fade) * (1 - Math.pow(0.02, dt));
}
console.log(rows.join('\n'));
console.log(`nový text 50 % za ${(tText * 1000).toFixed(0)} ms, 90 % za ${(tText90 * 1000).toFixed(0)} ms; nový záber 50 % za ${(tFilm * 1000).toFixed(0)} ms, 90 % za ${(tFilm90 * 1000).toFixed(0)} ms`);
