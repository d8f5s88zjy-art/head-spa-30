// GYM KLUB – prechádzka fitkom ako skrolovací film.
// Skrolovanie posúva „kameru“: záber sa pomaly približuje k miestu, kam sa ide, pri prechode sa prelietne
// do ďalšieho priestoru (predošlý záber sa zväčší a zmizne, pod ním je už nasledujúci). Texty sa odkrývajú
// a skrývajú podľa polohy, takže pri skrolovaní späť sa všetko prehrá obrátene.
// Výkon: jedna slučka requestAnimationFrame beží len vtedy, keď sa poloha mení; mení sa iba transform
// a opacity a do DOM sa zapisuje, len keď sa hodnota naozaj zmenila.

const root = document.documentElement;
const film = document.getElementById('prehliadka');
const stage = document.getElementById('stage');
const hero = document.getElementById('hero');
const bar = document.getElementById('progBar');
const scenes = [...film.querySelectorAll('.sc')];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

const D = 0.45;                 // dĺžka prechodu medzi zábermi (v obrazovkách skrolovania)
const ZOOM = 0.14;              // pomalé priblíženie počas celého záberu
const PUSH = 0.22;              // doplnkové priblíženie pri prelete do ďalšieho priestoru
const FADE = 0.2;               // dĺžka odkrytia textu
const TAU = 0.085;              // zotrvačnosť kamery v sekundách

// časová os: začiatok a dĺžka každého záberu
let C = 0;
const S = scenes.map((el, k) => {
  const len = parseFloat(el.dataset.len) || 1;
  const img = el.querySelector('img');
  const s = { el, img, k, len, start: C, on: false, op: -1, sc: -1, z: scenes.length - k };
  el.style.zIndex = s.z;
  C += len;
  return s;
});
const END = C;

const B = [...film.querySelectorAll('.bt')].map(el => ({
  el, k: +el.dataset.sc, a: +el.dataset.a, b: +el.dataset.b, center: el.classList.contains('bt-c'),
  kids: [...el.children].map(c => ({ c, o: -1, y: 1e9 }))
}));

// vrstvy stmavenia: pod záverečným textom a na konci filmu
const dimEl = document.createElement('div'); dimEl.className = 'fx-dim';
const outEl = document.createElement('div'); outEl.className = 'fx-out';
stage.append(dimEl, outEl);

let unit = 1, top0 = 0, x = 0, target = 0, raf = 0, last = 0;
const cache = new Map();
const set = (el, key, v) => { if (cache.get(el)?.[key] === v) return; (cache.get(el) || cache.set(el, {}).get(el))[key] = v; el.style[key] = v; };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const smooth = t => t * t * (3 - 2 * t);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const ready = s => !!s && s.img.complete && s.img.naturalWidth > 0;

// jednotka skrolovania = výška scény (100lvh), ktorá sa pri skrývaní adresného riadka nemení
function layout() {
  unit = stage.offsetHeight || innerHeight;
  film.style.height = Math.round(END * unit + unit) + 'px';
  top0 = film.getBoundingClientRect().top + scrollY;
  target = clamp((scrollY - top0) / unit, 0, END);
}

// ktoré zábery majú byť v DOM vykreslené: viditeľné a dva nasledujúce (tie sa medzitým načítajú a dekódujú)
function mount(cur) {
  for (const s of S) {
    const want = s.k >= cur - 1 && s.k <= cur + 2;
    if (want !== s.on) {
      s.on = want;
      s.el.classList.toggle('on', want);
      if (want) {
        s.img.loading = 'eager';
        const dec = () => s.img.decode().catch(() => {});
        s.img.complete ? dec() : s.img.addEventListener('load', dec, { once: true });
      } else { s.op = s.sc = -1; }
    }
  }
}

function render() {
  const rm = reduce.matches;
  let cur = 0;
  while (cur < S.length - 1 && x >= S[cur + 1].start - D) cur++;
  // pri prechode je aktuálny ešte predošlý záber (ten sa práve preletí)
  if (cur > 0 && x < S[cur].start) cur--;
  mount(cur);

  for (const s of S) {
    if (!s.on) continue;
    const u = x - s.start;
    const lastScene = s.k === S.length - 1;
    const v = clamp((u + D) / (s.len + D), 0, 1);
    const e = lastScene ? 0 : clamp((u - (s.len - D)) / D, 0, 1);
    let op = u < -D ? 0 : 1;
    if (e > 0) op = ready(S[s.k + 1]) ? 1 - smooth(e) : 1;     // kým nie je ďalší záber pripravený, predošlý nezmizne
    if (u > s.len) op = 0;
    const sc = rm ? 1 : (1 + ZOOM * v) * (1 + PUSH * e * e);
    if (op !== s.op) { s.op = op; s.el.style.opacity = op; s.el.style.visibility = op > 0 ? 'visible' : 'hidden'; }
    if (Math.abs(sc - s.sc) > 1e-4) { s.sc = sc; s.img.style.transform = `translate3d(0,0,0) scale(${sc.toFixed(4)})`; }
  }

  // úvodný titulok odíde hneď na začiatku skrolovania
  const h = clamp(x / 0.4, 0, 1);
  set(hero, 'opacity', (1 - smooth(h)).toFixed(3));
  set(hero, 'transform', rm ? 'none' : `translate3d(0,${(-48 * h).toFixed(1)}px,0)`);
  set(hero, 'visibility', h >= 1 ? 'hidden' : 'visible');

  let dim = 0;
  for (const b of B) {
    const u = x - S[b.k].start;
    const out = clamp((b.b - u) / FADE, 0, 1);
    const n = b.kids.length;
    for (let i = 0; i < n; i++) {
      const kid = b.kids[i];
      const inn = clamp((u - b.a - i * 0.06) / FADE, 0, 1);
      const o = +Math.min(easeOut(inn), smooth(out)).toFixed(3);
      const y = rm ? 0 : Math.round(inn < 1 ? (1 - easeOut(inn)) * 34 : -(1 - smooth(out)) * 18);
      if (o !== kid.o) { kid.o = o; kid.c.style.opacity = o; }
      if (y !== kid.y) { kid.y = y; kid.c.style.transform = y ? `translate3d(0,${y}px,0)` : 'none'; }
      if (b.center && i === 0) dim = Math.max(dim, o);
    }
  }
  set(dimEl, 'opacity', (dim * 0.62).toFixed(3));
  set(outEl, 'opacity', smooth(clamp((x - (END - D)) / D, 0, 1)).toFixed(3));
  set(bar, 'transform', `scaleX(${(x / END).toFixed(4)})`);
}

function tick(t) {
  raf = 0;
  const dt = last ? Math.min((t - last) / 1000, 0.05) : 1 / 60;
  last = t;
  const d = target - x;
  // veľký skok (odkaz, klávesa End) kamera nepreletí, iba ho dorovná
  if (Math.abs(d) > 2 || reduce.matches) x = target;
  else x += d * (1 - Math.exp(-dt / TAU));
  if (Math.abs(target - x) < 1e-4) x = target;
  render();
  if (x !== target) raf = requestAnimationFrame(tick);
  else last = 0;
}
const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

addEventListener('scroll', () => { target = clamp((scrollY - top0) / unit, 0, END); kick(); }, { passive: true });

// prepočet len pri zmene šírky alebo veľkej zmene výšky (nie pri skrývaní adresného riadka)
let lastW = innerWidth, lastH = stage.offsetHeight;
addEventListener('resize', () => {
  if (innerWidth === lastW && Math.abs(stage.offsetHeight - lastH) < 1) return;
  lastW = innerWidth; lastH = stage.offsetHeight;
  layout(); x = target; render();
});
reduce.addEventListener?.('change', () => { x = target; render(); });

layout();
x = target;
render();

// úvod začne, keď je prvý záber dekódovaný; poistka po 2,5 s
const first = S[0].img;
const go = () => root.classList.add('ready');
Promise.race([
  (first.complete ? Promise.resolve() : new Promise(r => first.addEventListener('load', r, { once: true }))).then(() => first.decode()).catch(() => {}),
  new Promise(r => setTimeout(r, 2500))
]).then(() => requestAnimationFrame(go));

// po načítaní písma a obrázkov sa môže posunúť poloha sekcie
addEventListener('load', () => { layout(); x = target; render(); });
