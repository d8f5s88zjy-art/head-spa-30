// GYM KLUB 3D – jedna časová os pre celú stránku.
// Všetko (3D scéna, texty, clona, pás médií, zvuk) sa počíta z polohy skrolovania,
// preto ide stránka rovnako dopredu aj dozadu, po obnovení v strede aj po zmene veľkosti okna.
// Bez knižníc; 3D scéna (intro.js) sa načíta len ak ju zariadenie zvládne.

const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// Časová os úvodu (zhodná s src/intro.js)
const T = { impact: 0.72, settle: 0.8, irisStart: 0.83, irisEnd: 0.97 };

// ——— Médiá: len autentické zábery z prevádzky (26. 9. 2026). Popis = alt text. ———
const MEDIA = {
  'vchod':        { v: 'vchod',  alt: 'Dvere pod tabuľou GYM KLUB & caffee a za nimi recepcia s policou na obuv' },
  'terasa':       { v: 'terasa', alt: 'Krytá terasa Lipa Centra so stolmi a stoličkami pred vchodom do fitka' },
  'sala-a':       { v: 'sala-a', alt: 'Tmavá zóna fitka so šprintérskou dráhou a nakladacími strojmi' },
  'sala-c':       { v: 'sala-c', alt: 'Šprintérska dráha s červenými čiarami a stroje pri oknách' },
  'hlavna-sala':  { i: 'hlavna-sala',  alt: 'Hlavná sála s tyrkysovými a zelenými strojmi a nástennou maľbou GYM KLUB' },
  'kardio-okna':  { i: 'kardio-okna',  alt: 'Rad bežeckých pásov pri veľkých oknách' },
  'cinky':        { i: 'cinky',        alt: 'Stojan s jednoručkami, lavice a zrkadlová stena' },
  'plate-loaded': { i: 'plate-loaded', alt: 'Nakladacie stroje a racky pod šesťuholníkovým stropným svetlom' },
  'jednorucky':   { i: 'jednorucky',   alt: 'Stojan jednoručiek do 20 kg a schodíkový trenažér' },
  'ring':         { i: 'ring',         alt: 'Rig Life Fitness s TRX, fitloptami, kettlebellami a boxovacím vrecom' },
  'tatami':       { i: 'tatami',       alt: 'Miestnosť s čierno-ružovým tatami a rebrinou' },
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection && navigator.connection.saveData;
root.classList.toggle('rm', reduced);

const intro = $('#intro');
const stage = $('#stage');
const frame = $('#frame');
const plate = $('#plateRing');
const loader = $('#loader');
const steps = $$('.step');
const beats = $$('[data-from]', intro);
const tour = $('#tour');
const skipBtn = $('#skipIntro');

// ——— vrstvy médií ———
const layers = {};
for (const [id, m] of Object.entries(MEDIA)) {
  const el = document.createElement('div');
  el.className = 'm'; el.dataset.id = id;
  if (m.v) {
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.poster = `media/${m.v}-poster.jpg`;
    v.setAttribute('aria-label', m.alt);
    v.width = 720; v.height = 1280;
    el.append(v);
    el._video = v;
  } else {
    el.innerHTML = `<picture><source type="image/avif" srcset="media/${m.i}-640.avif 640w, media/${m.i}-1280.avif 1280w" sizes="(max-width: 820px) 100vw, 46vh"><source type="image/webp" srcset="media/${m.i}-640.webp 640w, media/${m.i}-1280.webp 1280w" sizes="(max-width: 820px) 100vw, 46vh"><img src="media/${m.i}-1280.jpg" srcset="media/${m.i}-640.jpg 640w, media/${m.i}-1280.jpg 1280w" sizes="(max-width: 820px) 100vw, 46vh" width="1280" height="1707" alt="${m.alt}" loading="lazy" decoding="async"></picture>`;
  }
  frame.append(el);
  layers[id] = el;
}
function loadVideo(el) {
  const v = el._video;
  if (!v || v.dataset.loaded) return;
  v.dataset.loaded = '1';
  const id = el.dataset.id, name = MEDIA[id].v;
  v.innerHTML = `<source src="media/${name}-720.webm" type="video/webm"><source src="media/${name}-720.mp4" type="video/mp4">`;
  v.preload = 'auto';
  v.load();
}
let activeId = null;
function setActive(id) {
  if (id === activeId) return;
  activeId = id;
  for (const [k, el] of Object.entries(layers)) {
    const on = k === id;
    el.classList.toggle('on', on);
    const v = el._video;
    if (!v) continue;
    if (on) { loadVideo(el); if (!reduced && !saveData) v.play().catch(() => {}); }
    else if (!v.paused) v.pause();
  }
}
// dopredu načítať len nasledujúce médium (nikdy viac videí naraz v plnom rozlíšení)
function preloadNext(i) {
  const next = steps[i + 1];
  if (next && layers[next.dataset.media]) loadVideo(layers[next.dataset.media]);
}

// ——— 3D scéna ———
let gl = null;
function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2')); } catch { return false; }
}
function hideLoader() { loader.classList.add('done'); setTimeout(() => loader.remove(), 700); }
if (!reduced && webglOK()) {
  root.classList.add('webgl');
  import('./intro.js').then(mod => {
    gl = mod.mount($('#gl'));
    root.classList.add('gl-ready');
    $('#sound').hidden = false;
    hideLoader();
    update(true);
  }).catch(err => {
    console.warn('3D scéna sa nenačítala, zobrazujem statický obraz.', err);
    root.classList.remove('webgl');
    hideLoader();
  });
} else {
  hideLoader();
}

// ——— zvuk (vypnutý, zapína sa len tlačidlom) ———
const sound = { on: false, ctx: null, wind: null, windGain: null };
const soundBtn = $('#sound');
soundBtn.addEventListener('click', () => {
  sound.on = !sound.on;
  soundBtn.setAttribute('aria-pressed', String(sound.on));
  soundBtn.querySelector('.tool-txt').textContent = sound.on ? 'Zvuk zap.' : 'Zvuk vyp.';
  if (sound.on && !sound.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = sound.ctx = new AC();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(lp).connect(g).connect(ctx.destination); src.start();
    sound.wind = lp; sound.windGain = g;
  }
  if (sound.ctx) sound.on ? sound.ctx.resume() : sound.ctx.suspend();
});
function thump() {
  if (!sound.on || !sound.ctx) return;
  const ctx = sound.ctx, t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(78, t); o.frequency.exponentialRampToValueAtTime(34, t + 0.35);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.75);
  // krátky šum = štrk a prach
  const n = ctx.createBufferSource(), b = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  n.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.7;
  const ng = ctx.createGain(); ng.gain.value = 0.18;
  n.connect(f).connect(ng).connect(ctx.destination); n.start(t);
}

// ——— hlavná časová os ———
let vh = innerHeight, vw = innerWidth, lastP = -1, lastTime = performance.now(), ticking = false;
const isNarrow = () => vw <= 820;

function introProgress() {
  const r = intro.getBoundingClientRect();
  const span = r.height - vh;
  return span > 0 ? clamp(-r.top / span) : 1;
}

function frameRect(dock) {
  // dock 0 = celá obrazovka (pokračovanie clony), 1 = rám vpravo (na úzkom displeji zostáva celá obrazovka)
  if (isNarrow()) return { l: 0, t: 0, w: vw, h: vh, r: 0 };
  const h = Math.min(vh * 0.84, vw * 0.62);
  const w = h * 0.75;
  const l = vw - w - Math.max(24, vw * 0.06), t = (vh - h) / 2 + 20;
  const k = dock;
  return { l: l * k, t: t * k, w: vw + (w - vw) * k, h: vh + (h - vh) * k, r: 18 * k };
}

function update(force) {
  ticking = false;
  const now = performance.now();
  const p = reduced ? 1 : introProgress();

  // 3D + texty úvodu
  if (gl && (force || p !== lastP)) {
    gl.setProgress(p);
    if (p >= 1) gl.pause(); else gl.resume();
  }
  if (!reduced) {
    for (const b of beats) {
      const a = +b.dataset.from, z = +b.dataset.to, w = (z - a) * 0.22;
      const o = a === 0 ? 1 - smooth(z - w, z, p) : smooth(a, a + w, p) * (1 - smooth(z - w, z, p));
      b.style.opacity = o.toFixed(3);
      b.style.transform = `translate3d(0,${((1 - o) * (p < a + w ? 14 : -14)).toFixed(1)}px,0)`;
      b.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    }
    // zvuk: vietor podľa rýchlosti skrolovania počas pádu, úder pri prechode dopadom
    if (sound.on && sound.windGain) {
      const dt = Math.max(16, now - lastTime) / 1000;
      const speed = Math.abs(p - Math.max(lastP, 0)) / dt;
      const target = p < T.impact ? clamp(speed * 1.6) * 0.35 : 0;
      sound.windGain.gain.setTargetAtTime(target, sound.ctx.currentTime, 0.15);
    }
    if (lastP >= 0 && lastP < T.impact && p >= T.impact) thump();
  }

  // clona do skutočného záberu: kruh ako obrys kotúča, stred v mieste dopadu
  const tr = tour.getBoundingClientRect();
  const dockP = smooth(0, vh * 0.7, -tr.top);
  const fr = frameRect(dockP);
  frame.style.transform = `translate3d(${fr.l.toFixed(1)}px,${fr.t.toFixed(1)}px,0)`;
  frame.style.width = fr.w.toFixed(1) + 'px';
  frame.style.height = fr.h.toFixed(1) + 'px';
  frame.style.borderRadius = fr.r.toFixed(1) + 'px';
  frame.style.setProperty('--scrim', isNarrow() ? '0' : (1 - dockP).toFixed(3));

  let clip = 'none', plateO = 0;
  if (!reduced && p < 1) {
    const ip = smooth(T.irisStart, T.irisEnd, p);
    const pt = gl ? gl.impactScreenPoint() : { x: 0.5, y: 0.6 };
    const cx = pt.x * vw, cy = pt.y * vh;
    const maxR = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy));
    const r = ip * maxR;
    clip = `circle(${r.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
    plateO = ip > 0 && ip < 1 ? Math.sin(ip * Math.PI) : 0;
    plate.style.transform = `translate3d(${(cx - r).toFixed(1)}px,${(cy - r).toFixed(1)}px,0)`;
    plate.style.width = plate.style.height = (2 * r).toFixed(1) + 'px';
  }
  stage.style.clipPath = clip;
  plate.style.opacity = plateO.toFixed(3);

  // koniec prehliadky: pás médií sa stiahne, obsah pokračuje ako normálna stránka
  const outP = smooth(vh * 0.85, vh * 0.2, tr.bottom);
  stage.style.opacity = (1 - outP).toFixed(3);
  root.classList.toggle('past-intro', p >= 1);
  root.classList.toggle('in-tour', tr.top < vh && tr.bottom > vh * 0.2);
  skipBtn.hidden = p >= T.irisEnd;

  // aktívne médium = krok najbližšie stredu obrazovky
  let best = 0, bestD = Infinity;
  steps.forEach((s, i) => {
    const r = s.getBoundingClientRect();
    const d = Math.abs(r.top + r.height / 2 - vh * 0.55);
    if (d < bestD) { bestD = d; best = i; }
    s.classList.toggle('near', r.top < vh * 0.85 && r.bottom > vh * 0.15);
  });
  const id = p < T.irisStart ? steps[0].dataset.media : steps[best].dataset.media;
  if (p >= T.impact - 0.08) loadVideo(layers[steps[0].dataset.media]);
  setActive(id);
  if (p >= T.irisStart) preloadNext(best);

  lastP = p; lastTime = now;
}

function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(() => update()); } }
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => {
  vh = innerHeight; vw = innerWidth;
  gl?.resize();
  update(true);
});
// zastaviť videá a scénu, keď je karta skrytá
document.addEventListener('visibilitychange', () => {
  const v = activeId && layers[activeId]._video;
  if (document.hidden) { gl?.pause(); v?.pause(); sound.ctx?.suspend(); }
  else { if (introProgress() < 1) gl?.resume(); if (v && !reduced && !saveData) v.play().catch(() => {}); if (sound.on) sound.ctx?.resume(); }
});

// mapa sa načíta až na požiadanie (žiadne cudzie požiadavky bez kliknutia)
$('#mapLoad').addEventListener('click', () => {
  const f = document.createElement('iframe');
  f.title = 'Mapa: GYM KLUB, Výstavná 6, Nitra';
  f.loading = 'lazy';
  f.referrerPolicy = 'no-referrer-when-downgrade';
  f.src = 'https://www.google.com/maps?q=' + encodeURIComponent('GYM KLUB, Výstavná 6, 949 01 Nitra') + '&z=16&output=embed';
  $('#map').replaceChildren(f);
});

update(true);
