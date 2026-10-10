/* Motívy pre jednotlivé rituály: ovocie, bylinky, hviezdy a zlaté lístky v zlatej razbe,
   rovnako ako lotos, vetvička a pečať. Každá funkcia vracia SVG, ktoré na poukážke nahradí
   olivovú vetvičku (ovocie, bylinky) alebo ju doplní (hviezdy, zlato). */

const r1 = (n) => Math.round(n * 10) / 10;

// spoločné prechody zlatej razby (rovnaké definície, preto nevadí, že sa na stránke opakujú)
export const defs = `<defs>
  <linearGradient id="mg" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#f6e2a8"/><stop offset=".45" stop-color="#d9b56a"/><stop offset="1" stop-color="#9a7434"/></linearGradient>
  <linearGradient id="mgl" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="#fbeec4"/><stop offset=".55" stop-color="#e6c983"/><stop offset="1" stop-color="#b48d45"/></linearGradient>
  <radialGradient id="mgr" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#fff3cf"/><stop offset=".35" stop-color="#e2c27a"/><stop offset="1" stop-color="#8f6a2c"/></radialGradient>
</defs>`;

// list s hlavnou žilkou
const leaf = (x, y, len, ang, w = 0.32) => {
  const h = len * w;
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(ang)})">
    <path d="M0 0C${r1(len * .25)} ${r1(-h)} ${r1(len * .7)} ${r1(-h)} ${len} 0C${r1(len * .7)} ${r1(h)} ${r1(len * .25)} ${r1(h)} 0 0Z" fill="url(#mg)"/>
    <path d="M${r1(len * .06)} 0L${r1(len * .9)} 0" stroke="#5c431b" stroke-width=".9" stroke-linecap="round" opacity=".75"/>
    ${[0.3, 0.5, 0.7].map((t) => `<path d="M${r1(len * t)} 0l${r1(len * .12)} ${r1(-h * .55)}M${r1(len * t)} 0l${r1(len * .12)} ${r1(h * .55)}" stroke="#5c431b" stroke-width=".6" opacity=".5"/>`).join('')}
  </g>`;
};

// plátok citrusu: šupka, biela dužina a dieliky
const citrus = (cx, cy, r, n = 10, light = false) => {
  const g = light ? 'url(#mgl)' : 'url(#mg)';
  let seg = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 + 0.06, a1 = ((i + 1) / n) * Math.PI * 2 - 0.06, ri = r * 0.13, ro = r * 0.78;
    const p = (a, rr) => `${r1(cx + rr * Math.cos(a))} ${r1(cy + rr * Math.sin(a))}`;
    seg += `<path d="M${p(a0, ri)}L${p(a0, ro)}A${r1(ro)} ${r1(ro)} 0 0 1 ${p(a1, ro)}L${p(a1, ri)}Z" fill="${g}" opacity=".92"/>`;
    // šťavnaté vlákna v dieliku
    const am = (a0 + a1) / 2;
    seg += `<path d="M${p(am, ri + r * .14)}L${p(am, ro - r * .12)}" stroke="#fff4d2" stroke-width=".8" opacity=".45" stroke-linecap="round"/>`;
  }
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${g}"/>
    <circle cx="${cx}" cy="${cy}" r="${r1(r * 0.9)}" fill="#1b140b"/>
    <circle cx="${cx}" cy="${cy}" r="${r1(r * 0.86)}" fill="none" stroke="${g}" stroke-width="${r1(r * 0.05)}" opacity=".7"/>
    ${seg}
    <circle cx="${cx}" cy="${cy}" r="${r1(r * 0.07)}" fill="${g}"/>
  </g>`;
};

// jahoda: plod so semienkami a kalich
const strawberry = (x, y, s, ang) => {
  let seeds = '';
  for (let row = 0; row < 5; row++) {
    const yy = -18 + row * 11, half = [16, 19, 17, 12, 6][row], cnt = [3, 4, 3, 2, 1][row];
    for (let i = 0; i < cnt; i++) {
      const xx = cnt === 1 ? 0 : -half + (2 * half * i) / (cnt - 1) + (row % 2 ? 3 : 0);
      seeds += `<path d="M${r1(xx)} ${yy}c1.2 1.6 1.2 3.4 0 4.6c-1.2-1.2-1.2-3 0-4.6z" fill="#4a3415" opacity=".8"/>`;
    }
  }
  return `<g transform="translate(${x} ${y}) rotate(${ang}) scale(${s})">
    <path d="M0 -26C20 -30 33 -14 27 6C22 22 9 33 0 40C-9 33 -22 22 -27 6C-33 -14 -20 -30 0 -26Z" fill="url(#mgr)"/>
    ${seeds}
    <path d="M0 -24C-6 -34 -16 -36 -24 -32C-16 -30 -10 -27 -6 -23C-14 -24 -22 -20 -26 -14C-16 -17 -8 -19 -2 -21C-4 -16 -4 -10 -2 -5C2 -10 3 -16 2 -21C8 -19 16 -17 26 -14C22 -20 14 -24 6 -23C10 -27 16 -30 24 -32C16 -36 6 -34 0 -24Z" fill="url(#mg)"/>
    <path d="M0 -26C0 -32 2 -38 6 -42" stroke="url(#mg)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  </g>`;
};

// čerešne: dva plody na stopkách s lístkom
const cherries = (x, y, s, ang) => `<g transform="translate(${x} ${y}) rotate(${ang}) scale(${s})">
    <path d="M-14 10C-12 -12 -2 -30 8 -40M14 14C10 -8 8 -28 8 -40" stroke="url(#mg)" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    ${leaf(8, -40, 30, -28, 0.36)}
    <circle cx="-14" cy="20" r="12" fill="url(#mgr)"/><circle cx="14" cy="24" r="12" fill="url(#mgr)"/>
    <ellipse cx="-18" cy="15" rx="3.2" ry="2" fill="#fff6dc" opacity=".7" transform="rotate(-30 -18 15)"/>
    <ellipse cx="10" cy="19" rx="3.2" ry="2" fill="#fff6dc" opacity=".7" transform="rotate(-30 10 19)"/>
  </g>`;

// bylinka (rozmarín): stonka a husté úzke lístky
const herb = (x, y, len, ang) => {
  let n = '';
  for (let i = 0; i < 16; i++) {
    const t = 0.08 + i * 0.056, xx = len * t, side = i % 2 ? 1 : -1, l = 15 - i * 0.45;
    n += `<path d="M${r1(xx)} 0q${r1(l * .35)} ${r1(side * l * .55)} ${r1(l * .95)} ${r1(side * l * .62)}q${r1(-l * .4)} ${r1(-side * l * .05)} ${r1(-l * .95)} ${r1(-side * l * .62)}z" fill="url(#mg)" opacity=".95"/>`;
  }
  return `<g transform="translate(${x} ${y}) rotate(${ang})"><path d="M0 0L${len} 0" stroke="url(#mg)" stroke-width="1.6" stroke-linecap="round"/>${n}</g>`;
};

// lístok mäty: oblý so žilkami
const mint = (x, y, len, ang) => leaf(x, y, len, ang, 0.46);

// iskra (štvorcípa hviezda)
const spark = (x, y, r, o = 1) => `<path d="M${x} ${r1(y - r)}C${r1(x + r * .14)} ${r1(y - r * .14)} ${r1(x + r * .14)} ${r1(y - r * .14)} ${r1(x + r)} ${y}C${r1(x + r * .14)} ${r1(y + r * .14)} ${r1(x + r * .14)} ${r1(y + r * .14)} ${x} ${r1(y + r)}C${r1(x - r * .14)} ${r1(y + r * .14)} ${r1(x - r * .14)} ${r1(y + r * .14)} ${r1(x - r)} ${y}C${r1(x - r * .14)} ${r1(y - r * .14)} ${r1(x - r * .14)} ${r1(y - r * .14)} ${x} ${r1(y - r)}Z" fill="url(#mgl)" opacity="${o}"/>`;

// zlatý lístok (plátkové zlato): plochý zubatý úlomok s lineárnym prechodom a jemným ohybom
const flake = (x, y, s, ang, k) => {
  const n = 11, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, rr = 10 * (0.55 + (((k * 13 + i * 7) % 9) / 9) * 0.6) * (i % 2 ? 0.78 : 1);
    pts.push([rr * Math.cos(a) * 1.25, rr * Math.sin(a) * 0.8]);
  }
  const d = 'M' + pts.map((p) => p.map(r1).join(' ')).join('L') + 'Z';
  return `<g transform="translate(${x} ${y}) rotate(${ang}) scale(${s})"><path d="${d}" fill="url(#mg)"/><path d="M${r1(pts[2][0] * .7)} ${r1(pts[2][1] * .7)}L${r1(pts[7][0] * .6)} ${r1(pts[7][1] * .6)}" stroke="#fff3cf" stroke-width=".8" opacity=".55"/></g>`;
};

const svg = (cls, w, h, inner) => `<svg class="${cls}" viewBox="0 0 ${w} ${h}" fill="none">${defs}${inner}</svg>`;

/* Ovocná vetvička: rovnaký oblúk ako olivová vetvička (ide pozdĺž zlatého kruhu fotky), lístky v razbe
   a na nej ovocie. viewBox 250 × 225, na poukážke vľavo dole od fotky. */
const P = [[14, 8], [84, 34], [140, 96], [196, 168]];
const at = (t) => { const m = 1 - t; return [0, 1].map((k) => m * m * m * P[0][k] + 3 * m * m * t * P[1][k] + 3 * m * t * t * P[2][k] + t * t * t * P[3][k]); };
const tan = (t) => { const a = at(Math.max(0, t - 0.01)), b = at(Math.min(1, t + 0.01)); return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; };
const stem = (w = 1.7) => `<path d="M${P[0]}C${P[1]} ${P[2]} ${P[3]}" stroke="url(#mg)" stroke-width="${w}" stroke-linecap="round"/>`;
const leaves = (kind, from, to, n) => {
  let out = '';
  for (let i = 0; i < n; i++) {
    const t = from + (i * (to - from)) / (n - 1), [x, y] = at(t), side = i % 2 ? 1 : -1;
    if (kind === 'ihlice') {
      const ang = tan(t) + side * 52, l = 21 - i * 0.3;
      out += `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(ang)})"><path d="M0 0C${r1(l * .3)} -2.4 ${r1(l * .75)} -2.4 ${r1(l)} 0C${r1(l * .75)} 2.4 ${r1(l * .3)} 2.4 0 0Z" fill="url(#mg)"/></g>`;
    } else out += leaf(x, y, 34 - i * 0.8, tan(t) + side * 42 - 6, kind === 'mata' ? 0.44 : 0.36);
  }
  return out;
};
const on = (t, dx, dy) => { const [x, y] = at(t); return [r1(x + dx), r1(y + dy)]; };
const fruitSvg = (inner) => svg('motif', 250, 225, inner);

/* Kompozície. Ovocie a bylinky nahrádzajú olivovú vetvičku, hviezdy a plátkové zlato ju dopĺňajú. */
export const MOTIVY = {
  // Head Spa Fruit & Fresh: vetvička s lístkami, čerešne, plátok pomaranča a jahoda
  ovocie: () => { const [cx, cy] = on(.55, 30, -22), [sx, sy] = on(.84, -26, -2), [kx, ky] = on(.24, -8, 30);
    return fruitSvg(`${stem()}${leaves('list', .06, .9, 8)}${cherries(kx, ky, 1.05, -6)}${citrus(cx, cy, 38)}${strawberry(sx, sy, .95, -28)}`); },
  // Little Fruit Head Spa: čerešne pri texte, veľká jahoda na oblúku a malá na konci vetvičky
  detske: () => { const [a, b] = on(.5, -12, 26), [c, d] = on(.22, 0, 46), [e, f] = on(.85, -18, -2);
    return fruitSvg(`${stem()}${leaves('list', .06, .9, 8)}${cherries(c, d, 1.08, -12)}${strawberry(a, b, 1, 10)}${strawberry(e, f, .72, -34)}`); },
  // Ovocný a bylinkový rituál pre chodidlá: rozmarín, plátky citróna a pomaranča, mäta
  bylinky: () => { const [cx, cy] = on(.5, 30, -22), [lx, ly] = on(.86, -24, -2);
    return fruitSvg(`${stem(1.4)}${leaves('ihlice', .04, .97, 28)}${citrus(cx, cy, 37, 9, true)}${citrus(lx, ly, 25, 8)}${mint(...on(.18, 6, -6), 30, -64)}${mint(...on(.22, 0, 2), 26, 20)}`); },
  // Spoločný rituál pod hviezdami: hviezdna obloha nad oblúkom fotky
  hviezdy: () => svg('motif-sky', 1080, 525, [
    [606, 64, 11], [646, 104, 6, .85], [586, 122, 5, .75], [676, 46, 5, .8], [530, 40, 7, .9], [560, 70, 3.5, .65],
    [704, 136, 3.5, .7], [566, 176, 4, .7], [620, 196, 2.6, .6], [742, 70, 3, .6], [500, 96, 3, .55], [640, 150, 2.4, .55],
  ].map(([x, y, r, o]) => spark(x, y, r, o ?? 1)).join('') + [[520, 150], [594, 32], [690, 92], [612, 140], [548, 112], [660, 182], [726, 110]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#f3dc9f" opacity=".7"/>`).join('')),
  // Zlatý rituál 24K: plátkové zlato pri oblúku fotky
  zlato: () => svg('motif-sky', 1080, 525, [
    [600, 82, 1.5, 18, 1], [640, 128, .95, -30, 2], [574, 150, .8, 50, 3], [668, 58, .85, 70, 4], [536, 48, 1.05, -10, 5],
    [700, 168, .7, 25, 6], [612, 190, .6, -60, 7], [560, 100, .55, 80, 8],
  ].map(([x, y, s, a, k]) => flake(x, y, s, a, k)).join('') + spark(624, 104, 6, .9) + spark(552, 128, 4, .7) + spark(684, 112, 3.5, .7)),
};
