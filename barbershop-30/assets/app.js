/*
 * BARBERSHOP 30 – režisér stránky (docs/CONTRACT.md §3, §6; TOUR_DIRECTION.md; ART_DIRECTION.md §8).
 * Jediný zdroj pravdy je scroll: jedna slučka rAF číta scrollY, počíta t každého záberu (.film-shot), píše CSS
 * premenné na kotvy a ich prvky (nikdy na <html>), prepína stavy a riadi videá, menu a lightbox. Film (film.js) je samostatný
 * modul (triedy world, world-in, world-off). Bez externých požiadaviek a analytiky; globálne len __renderDone a
 * __scrollSettled pre testy.
 */

const html = document.documentElement;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease01 = (v) => { const x = clamp01(v); return x * x * (3 - 2 * x); };
// titulná karta: nábeh a odchod ako podiel jej voľnej dĺžky (referencia: nový text za 0,12 až 0,18 obrazovky, starý za 0,1)
const CARD_IN = 0.12, CARD_OUT = 0.08;

// shot.mjs čaká, kým nebude true – stránka je čitateľná hneď po prvom nastavení stavu (bez 3D)
window.__renderDone = false;
window.__scrollSettled = false; // true, keď slučka dobehla cieľ (scrollY) – testy čakajú na túto hodnotu

/* ----------------------------------------------------------------------------
   1. Brána pohybu
   ---------------------------------------------------------------------------- */
const params = new URLSearchParams(location.search);
const mqReduced = matchMedia('(prefers-reduced-motion: reduce)');
const mqMobile = matchMedia('(max-width: 900px)');
// telefón na výšku: fotka scény v hornom páse, text pod ňou (P16 v style.css, rovnaký prah)
const mqPas = matchMedia('(max-width: 720px) and (orientation: portrait)');
const mqFinePointer = matchMedia('(hover: hover) and (pointer: fine)');
// dotykové zariadenie (telefón, tablet): stav stránky ide presne so skrolom, bez dobiehania (pozri tick())
const mqDotyk = matchMedia('(pointer: coarse)');
const deviceMemory = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : undefined;

const motionOff = params.get('motion') === 'off'
  || (params.get('motion') !== 'on' && (
    mqReduced.matches
    || !!navigator.connection?.saveData
    || (deviceMemory !== undefined && deviceMemory < 4)
  ));
const motionOn = !motionOff;
html.dataset.motion = motionOn ? 'on' : 'off';

/* ----------------------------------------------------------------------------
   2. DOM
   ---------------------------------------------------------------------------- */
const header = $('.site-header');
const navToggle = $('.nav-toggle');
const nav = $('#nav') || $('.nav');
const storyLine = $('.story-line');
const storyLinks = storyLine ? $$('a[data-chapter]', storyLine) : [];
const navLinks = nav ? $$('a[href^="#"]', nav) : [];
const mobileCta = $('#mobile-cta');
/* pás kapitol ako vo videoprehrávači (KF-01): .story-line dostane výplň kapitol, názov kapitoly a ▶ Kino (lenivý
   kino.js); výplň a stav sa kreslia v slučke apply(), pás nemá vlastný poslucháč skrolu. Bez skriptu ostanú odkazy. */
const kino = storyLine && storyLinks.length ? (() => {
  html.classList.add('kino');
  const play = document.createElement('button');
  play.type = 'button'; play.className = 'kino-play'; play.setAttribute('aria-label', 'Prehrať prehliadku');
  play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="i-play" d="M8 5.5v13l11-6.5z"/><path class="i-pause" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
  const label = document.createElement('span'); label.className = 'kino-label'; label.setAttribute('aria-hidden', 'true');
  // draggable = false: myšou sa inak ťahá odkaz (dragstart → pointercancel) a pás sa nedá pretáčať
  const fills = storyLinks.map((a) => { a.draggable = false; const i = document.createElement('i'); i.className = 'kino-fill'; i.setAttribute('aria-hidden', 'true'); a.append(i); return i; });
  storyLine.prepend(play); storyLine.append(label);
  return { play, label, fills, f: fills.map(() => -1), cur: -1, tenky: null, pasy: [], barY: 0, barH: 0, q: 100, skok: -1, skokDo: 0 };
})() : null;
const footer = $('.site-footer');

/* ----------------------------------------------------------------------------
   3. Meranie rozsahov (resize, obrázky, fonty)
   ---------------------------------------------------------------------------- */
let vh = window.innerHeight;
let maxScroll = 1;
let shots = [];     // .film-shot: { el, top, height, items: [{ el, a, b }] }
let sections = [];  // section[data-scene]: { el, scene, id, top, height }
let lastScene = 0;  // číslo poslednej kapitoly (rezervácia) – tam sa skryje mobilné CTA
let footerBox = null;
let titles = [];    // kotvy s titulnou kartou v poradí dokumentu (zábery bez filmu sa prelínajú medzi nimi)
// nízky telefón: tlačidlá titulnej karty úvodu siahajú až k plávajúcej lište, tá sa ukáže až keď karta zhasne (K1-1)
let heroNaraz = false, heroO = 1;
let pricesBox = null; // pás cenníka: tam sa plávajúce tlačidlo skryje (každá služba má vlastné Objednať)
let pas = false;     // telefón na výšku s pásom fotky (mqPas), zisťuje sa v measure()
let pasK = 1;        // výška pásu fotky ako podiel okna (meria sa z --pas v style.css)
/* Mierky: výška okna, s ktorou ráta rozloženie (100svh: malé okno; lišta prehliadača na telefóne ju pri skrole nemení,
   innerHeight áno), a výška pásu fotky (--pas). Neviditeľné pevné prvky, čítajú sa len v measure(). */
const mierka = (css) => { const e = document.createElement('i'); e.setAttribute('aria-hidden', 'true'); e.style.cssText = 'position:fixed;top:0;left:0;width:0;visibility:hidden;pointer-events:none;' + css; document.body.append(e); return e; };
const mOkno = mierka('height:100vh;height:100svh'), mPas = mierka('height:var(--pas,0px)');

function parseAt(value) {
  const parts = String(value || '').split(',').map((s) => parseFloat(s));
  const a = Number.isFinite(parts[0]) ? parts[0] : 0;
  const b = Number.isFinite(parts[1]) ? parts[1] : 1;
  return { a: Math.min(a, b), b: Math.max(a, b) };
}

function measure() {
  vh = mOkno.getBoundingClientRect().height || window.innerHeight || 1;
  pas = mqPas.matches;
  pasK = pas ? mPas.getBoundingClientRect().height / vh || 1 : 1;
  const scrollH = Math.max(html.scrollHeight, document.body?.scrollHeight || 0);
  maxScroll = Math.max(1, scrollH - vh);
  const y = window.scrollY || 0;

  sections = $$('section[data-scene]').map((el) => {
    const r = el.getBoundingClientRect();
    return { el, id: el.id, scene: Number(el.dataset.scene) || 0, top: r.top + y, height: r.height };
  });
  lastScene = sections.reduce((m, s) => Math.max(m, s.scene), 0);

  shots = $$('.film-shot').map((el) => {
    const r = el.getBoundingClientRect();
    const items = $$('[data-at]', el).map((node) => ({ el: node, ...parseAt(node.dataset.at) }));
    // titulná karta (P11): first = úvod, ten je viditeľný hneď od vrchu stránky (bez nábehu)
    const top = r.top + y, title = el.classList.contains('is-title');
    // voľná dĺžka karty: celá kotva, pri .title-long (za kartou je pás) bez poslednej výšky okna
    const long = el.classList.contains('title-long');
    const free = Math.max(1, r.height - (long ? vh : 0));
    // pred kartou je pás (tím, cenník, galéria): záber sa vymení ešte pod ním, v strede úseku (ako film.js)
    const prev = el.previousElementSibling || (el.parentElement.previousElementSibling || {}).lastElementChild;
    const afterBand = !!(title && prev && prev.classList && prev.classList.contains('band'));
    let swap = 0;
    if (afterBand) { const b = prev.getBoundingClientRect(); swap = y + (b.top + b.bottom - (pas ? pasK : 1) * vh) / 2; }
    // kapitola, do ktorej záber patrí (aktívna kapitola sa berie z ukázanej karty, KF-10)
    const secEl = el.closest('section[data-scene]'), sec = sections.find((x) => x.el === secEl) || null;
    // prvky, ktoré čítajú --sp (fotka zálohy, karta): premenná sa píše priamo na ne (pozri apply())
    return { el, top, height: Math.max(1, r.height), items, title, free, long, afterBand, swap, first: title && top < 1, sec, img: $('.film-still img', el), card: $('.title-card', el) };
  });

  const pr = $('.band-prices');
  if (pr) { const r = pr.getBoundingClientRect(); pricesBox = { top: r.top + y, bottom: r.bottom + y }; }

  titles = shots.filter((s) => s.title);
  // tlačidlá úvodu stoja v pripnutom ráme (sticky top 0), ich spodok v okne je stály; lišta je pri spodnom okraji okna.
  // Poloha z offsetTop (bez transformácií: nábeh tlačidiel a posun karty pri skrole by meranie skreslili)
  const ha = shots[0] && shots[0].first ? $('.title-actions', shots[0].el) : null, hf = ha && ha.closest('.title-frame');
  let hb = ha ? ha.offsetHeight : 0;
  for (let e = ha; e && e !== hf; e = e.offsetParent) hb += e.offsetTop;
  heroNaraz = !!(ha && hf && mobileCta && mobileCta.offsetHeight) && hb + 8 > vh - mobileCta.offsetHeight;
  // pás kapitol: pásy s textom (tím, cenník, galéria, kontakt, pätička), nad nimi je pás len tenká čiara
  if (kino) {
    kino.pasy = $$('.band, .site-footer').map((el) => { const r = el.getBoundingClientRect(); return [r.top + y, r.bottom + y]; });
    // pás kapitol s názvom kapitoly: celý jeho obdĺžnik (nie len stred), aby sa schoval skôr, než k nemu dôjde text pásu
    const r = storyLine.getBoundingClientRect(); kino.barY = r.top + r.height / 2; kino.barH = r.height / 2;
    // výplň kapitoly po celých CSS px dielika (nie po 0,001): pri skrole sa zapíše len raz za niekoľko snímok
    kino.q = Math.max(8, Math.min(100, Math.round(storyLinks[0].getBoundingClientRect().width) || 100));
  }

  if (footer) {
    const r = footer.getBoundingClientRect();
    footerBox = { top: r.top + y, height: r.height };
  }
}

/* ----------------------------------------------------------------------------
   4. Zápis CSS premenných a stavov (len pri zmene)
   ---------------------------------------------------------------------------- */
const varCache = new Map();
function setVar(name, value, el = html) {
  const v = clamp01(value);
  // posledná zapísaná hodnota pre každú premennú zvlášť (kotva má --sp aj --o)
  const cache = el === html ? varCache : (el.__v || (el.__v = new Map()));
  const last = cache.get(name);
  // zapisuj len pri zmene > 0.002; krajné hodnoty 0 a 1 vždy dosadni presne
  if (last !== undefined && Math.abs(v - last) <= 0.002 && !((v === 0 || v === 1) && v !== last)) return;
  cache.set(name, v);
  el.style.setProperty(name, v.toFixed(4));
}

function setClass(el, cls, on) {
  if (!el) return;
  if (el.classList.contains(cls) !== !!on) el.classList.toggle(cls, !!on);
}

function setAttr(el, name, value) {
  if (!el) return;
  if (value === null || value === undefined) { if (el.hasAttribute(name)) el.removeAttribute(name); return; }
  if (el.getAttribute(name) !== String(value)) el.setAttribute(name, String(value));
}

/* ----------------------------------------------------------------------------
   5. Stav slučky
   ---------------------------------------------------------------------------- */
let targetP = 0;       // skutočný progress zo scrollY
let shownP = 0;        // zobrazený (dobieha lerpom)
let rafId = 0;
let lastFrame = 0;
let snapUntil = performance.now() + 600; // do tohto času sa stav nastavuje okamžite (bez lerpu)
let menuOpen = false;
let activeScene = 0;
let posScene = 0;      // kapitola podľa polohy (40 % okna): spodné tlačidlo sa skryje v rezervácii hneď, ako do nej zákazník príde
let lastHeaderScrolled = null;

let curY = 0;
function readTarget() {
  curY = window.scrollY || 0;
  targetP = clamp01(curY / maxScroll);
}

// aktívna sekcia: tá s bodom 40 % výšky okna; pätička vyhráva pre navigáciu, keď bod leží v nej
function closestSection(y) {
  const mark = y + vh * 0.4;
  let best = null;
  for (const s of sections) {
    if (mark >= s.top && mark < s.top + s.height) { best = s; break; }
    if (mark < s.top) { best = best || s; break; }
    best = s;
  }
  const footerWins = !!(footerBox && footerBox.height > 0 && mark >= footerBox.top);
  return { section: best, footerWins };
}

function apply(p) {
  const y = p * maxScroll;
  // výzva a dvere v úvode zmiznú v prvých 2 % skrolu (premenná len na kotvu úvodu, na <html> by prepočítala celú stránku)
  if (shots[0] && shots[0].first) setVar('--hint', 1 - p / 0.02, shots[0].el);

  // t záberu: 0 keď stred okna vstúpi na horný okraj kotvy, 1 keď vyjde spodným (--sp pre CSS a data-at prvky).
  // --sp sa píše na fotku a kartu, nie na kotvu: zdedená premenná na kotve prepočítala pri každej snímke štýl
  // všetkých prvkov záberu (v style.css je --sp registrovaná ako nededená)
  for (const s of shots) {
    const t = clamp01((y + vh * 0.5 - s.top) / s.height);
    if (s.img) setVar('--sp', t, s.img);
    if (s.card) setVar('--sp', t, s.card);
    for (const it of s.items) setClass(it.el, 'is-in', t >= it.a && t <= it.b);
    // titulná karta: u = 0 pri pripnutí, 1 na konci kotvy; mení sa len krytie (nábeh 0–0,12, odchod 0,92–1).
    // Telefón na výšku (P18): karta za pásom je vidieť už zdola, karta pred pásom zhasne až pod ním (bez prázdna).
    if (s.title) {
      const u = (y - s.top) / s.free;
      const inO = s.first || (pas && s.afterBand) ? 1 : ease01(u / CARD_IN);
      const outO = pas && s.long ? ease01(((s.top + s.height - y) / vh - pasK) / 0.08) : 1 - ease01((u - 1 + CARD_OUT) / CARD_OUT);
      const o = Math.min(inO, outO);
      setVar('--o', o, s.el);
      if (s.first) heroO = o;
      setClass(s.el, 'is-on', o > 0.01);
    }
  }
  // zábery bez filmu stoja cez celé okno; ďalší sa prelína navrch počas nábehu svojej karty, starý zmizne až potom
  const footerIn = !!footerBox && y + vh > footerBox.top;
  // aktuálna karta: posledná s horným okrajom nad stredom okna (okolie v kartách, nie v px – rozloženie sa dopočítava)
  let cur = 0;
  for (let i = 0; i < titles.length; i++) if (titles[i].top <= y + vh * 0.5) cur = i;
  // telefón na výšku: za pásom sa záber vymení ešte pod ním (P18); inde sa prelína počas nábehu karty
  const prelinanie = (s) => (pas && s.afterBand ? ease01((y - s.swap) / (0.2 * vh) + 0.5) : ease01((y - s.top) / s.free / CARD_IN));
  let karta = null, kartaSo = 0;
  for (let i = 0; i < titles.length; i++) {
    const s = titles[i], n = titles[i + 1];
    const fin = s.first ? 1 : prelinanie(s);
    const nextIn = n ? prelinanie(n) : 0;
    const so = footerIn || nextIn >= 1 ? 0 : fin;
    setVar('--so', so, s.el);
    setClass(s.el, 'is-shown', so > 0.001);
    // ukázaná karta: pri prelínaní tá, ktorá už prevažuje (neskoršia s krytím aspoň 0,5)
    if (so > 0.001 && (!karta || so >= 0.5 || kartaSo < 0.5)) { karta = s; kartaSo = so; }
    // okolie: záloha sa načíta pri aktuálnej, dvoch ďalších a jednej predchádzajúcej karte; pred load len úvod
    setClass(s.el, 'is-near', document.readyState === 'complete' ? i >= cur - 1 && i <= cur + 2 : i === 0);
  }

  // aktívna kapitola z ukázanej karty (KF-10), bez nej (pätička) podľa polohy
  const blizko = closestSection(y), footerWins = blizko.footerWins;
  posScene = blizko.section ? blizko.section.scene : 0;
  const section = (!footerWins && karta && karta.sec) || blizko.section;
  const scene = section ? section.scene : 0;
  if (scene) {
    if (scene !== activeScene) {
      activeScene = scene;
      setAttr(html, 'data-scene-active', scene);
      for (const a of storyLinks) setAttr(a, 'aria-current', Number(a.dataset.chapter) === scene ? 'true' : null);
    }
    const currentHash = footerWins && footer?.id ? `#${footer.id}` : `#${section.id}`;
    for (const a of navLinks) setAttr(a, 'aria-current', a.getAttribute('href') === currentHash ? 'true' : null);
  }

  if (kino) { kresliPas(y, section, !!(karta && karta.first)); if (kino.krok) kino.krok(y); }

  // lišta, linka príbehu, plávajúce CTA
  const scrolled = curY > 80;                               // nečítať scrollY po zápisoch štýlu
  if (scrolled !== lastHeaderScrolled) { lastHeaderScrolled = scrolled; setClass(header, 'is-scrolled', scrolled); }
  setClass(storyLine, 'is-visible', p > 0.02);
  setClass(mobileCta, 'is-hidden', ctaHidden(y));
}

// pás kapitol: aktuálna kapitola plná po polohu v nej, predošlé plné, ďalšie prázdne (len transform, zápis iba pri zmene)
function kresliPas(y, section, uvod) {
  const c = section ? Math.max(0, Math.min(kino.fills.length - 1, section.scene - 1)) : 0;
  for (let i = 0; i < kino.fills.length; i++) {
    const s = i === c ? sections.find((x) => x.scene === i + 1) : null;
    const f = i < c ? 1 : i > c ? 0 : s ? Math.round(kino.q * Math.max(0.02, Math.min(1, (y + vh * 0.5 - s.top) / s.height))) / kino.q : 0;
    if (f !== kino.f[i]) { kino.f[i] = f; kino.fills[i].style.transform = `scaleX(${f})`; }
  }
  // po ťuku na kapitolu ukáže štítok hneď cieľ skoku (plynulý skok inak cestou ukáže kapitoly, cez ktoré ide)
  let lc = c;
  if (kino.skok >= 0) { if (c === kino.skok || performance.now() > kino.skokDo) kino.skok = -1; else lc = kino.skok; }
  if (lc !== kino.cur) { kino.cur = lc; kino.label.textContent = String(lc + 1).padStart(2, '0') + ' · ' + storyLinks[lc].getAttribute('aria-label'); }
  // nad pásom s textom sa pás kapitol schová: podľa skutočnej polohy skrolu (curY), nie dobiehanej (y) – pri pomalých
  // snímkach by dobiehaná poloha meškala a názov kapitoly by svietil cez text pásu
  // (celý pás s rezervou 8 px: pás s textom sa ho nesmie dotknúť ani okrajom)
  const yb = curY + kino.barY, m = kino.barH + 8, tenky = kino.pasy.some((b) => yb + m > b[0] && yb - m < b[1]);
  if (tenky !== kino.tenky) { kino.tenky = tenky; html.classList.toggle('kino-tenky', tenky); }
  // ukázaná karta úvodu: na nízkom telefóne by pás ležal na jej nadpise (CSS ho vtedy skryje)
  if (uvod !== kino.uvod) { kino.uvod = uvod; html.classList.toggle('kino-uvod', uvod); }
}

// spodné tlačidlo: nie v úvode (titulná karta má vlastné tlačidlá), nie v rezervácii, nie pri menu
function ctaHidden(y = window.scrollY || 0) {
  const hero = shots[0] && shots[0].first && (y < shots[0].height * 0.6 || (heroNaraz && heroO > 0.001));
  const mid = y + vh * 0.5, prices = !!pricesBox && mid > pricesBox.top && mid < pricesBox.bottom;
  return activeScene === lastScene || posScene === lastScene || menuOpen || !!hero || prices;
}

function tick(now) {
  rafId = 0;
  const dt = lastFrame ? Math.min(100, now - lastFrame) : 16.667;
  lastFrame = now;
  readTarget();

  // dotyk: bez dobiehania. Telefón posúva stránku sám (prst, zotrvačnosť); pevné fotky a karty, ktoré by za skrolom
  // dobiehali, sa voči obsahu oneskorujú a pri každej neskoršej snímke poskočia („trasenie“). Dobieha len koliesko myši.
  if (motionOff || mqDotyk.matches || now < snapUntil) {
    shownP = targetP;
  } else {
    // frame-rate-nezávislý lerp: k = 0.16 pri 60 fps
    shownP += (targetP - shownP) * (1 - Math.pow(1 - 0.16, dt / 16.667));
  }

  if (Math.abs(targetP - shownP) < 0.0005) {
    shownP = targetP;
    apply(shownP);
    lastFrame = 0; // slučka sa zastaví; ďalší štart začne čistým dt
    usadene = true; window.__scrollSettled = true;
    return;
  }
  apply(shownP);
  rafId = requestAnimationFrame(tick);
}

// zrkadlo window.__scrollSettled: do globálu sa zapisuje len pri zmene, nie pri každej udalosti scroll
let usadene = false;
function start() {
  if (usadene) { usadene = false; window.__scrollSettled = false; }
  if (rafId || document.visibilityState === 'hidden') return;
  rafId = requestAnimationFrame(tick);
}

function snapNow(ms = 0) {
  snapUntil = Math.max(snapUntil, performance.now() + ms);
  start();
}

/* ----------------------------------------------------------------------------
   5b. Lenivé moduly (C5): po načítaní po jednom v nečinnosti a mimo skrolu, n-tý najneskôr 0,7·n s po spustení
   plánu (Barber a Hudba do 4 s aj pri švihaní); gesto plán len spustí skôr. Hneď len jazyk, ▶ Kino a Objednať.
   ---------------------------------------------------------------------------- */
let skrolT = 0;   // posledný skrol alebo dotyk
const plan = (() => {
  const rad = []; let bezi = false, od = 0, n = 0;   // od: čas spustenia plánu
  const krok = () => {
    if (bezi || !od || !rad.length) return;
    bezi = true;
    const najneskor = od + 700 * ++n;
    const skus = () => {
      const f = () => {
        if (performance.now() - skrolT < 250 && performance.now() < najneskor) { setTimeout(skus, 100); return; }
        Promise.resolve().then(rad.shift().f).catch(() => {}).then(() => { bezi = false; krok(); });
      };
      if (window.requestIdleCallback) requestIdleCallback(f, { timeout: Math.max(1, najneskor - performance.now()) }); else setTimeout(f, 100);
    };
    skus();
  };
  const spusti = () => { if (!od) { od = performance.now(); krok(); } };
  let gesto = false;
  const zacni = () => { if (document.readyState === 'complete') spusti(); else gesto = true; };
  ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach((t) => addEventListener(t, zacni, { once: true, passive: true }));
  // myš len skutočným pohybom (pointermove chodí aj po zmene rozloženia pod kurzorom)
  const mys = (e) => { if (e.movementX || e.movementY) { removeEventListener('pointermove', mys); zacni(); } };
  addEventListener('pointermove', mys, { passive: true });
  addEventListener('touchstart', () => { skrolT = performance.now(); }, { passive: true });
  const poLoad = () => (gesto ? spusti() : setTimeout(spusti, 1000));
  if (document.readyState === 'complete') poLoad(); else addEventListener('load', poLoad, { once: true });
  return { pridaj(f, poradie) { rad.push({ f, poradie }); rad.sort((x, y) => x.poradie - y.poradie); krok(); } };
})();

/* ----------------------------------------------------------------------------
   6. Udalosti: scroll, resize, viditeľnosť karty, kotvy
   ---------------------------------------------------------------------------- */
window.addEventListener('scroll', () => { skrolT = performance.now(); start(); }, { passive: true });

/* pás kapitol: ťuk skočí (bežný odkaz), ťah pretáča film (pointer capture), šípky ←/→ skáču po kapitolách;
   ▶ pustí Kino (kino.js, načíta sa v nečinnosti alebo hneď pri ťuku) */
if (kino) {
  const N = storyLinks.length;
  const sec = (i) => sections.find((x) => x.scene === i + 1);
  // titulná karta kapitoly; cieľ kapitoly: karta je celá na obrazovke
  const karta = (i) => { const s = sec(i); return s && shots.find((x) => x.title && x.top >= s.top - 1); };
  const ciel = (i) => {
    const s = sec(i); if (!i || !s) return 0;
    const t = karta(i);
    return Math.min(maxScroll, (t ? t.top : s.top) + vh * 0.25, s.top + s.height - vh * 0.1);
  };
  let tah = null;
  storyLine.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.kino-play')) return;
    tah = { x0: e.clientX, moved: false, a: storyLinks[0].getBoundingClientRect(), b: storyLinks[N - 1].getBoundingClientRect(), id: e.pointerId };
  });
  storyLine.addEventListener('pointermove', (e) => {
    if (!tah || e.pointerId !== tah.id) return;
    if (!tah.moved && Math.abs(e.clientX - tah.x0) < 8) return;
    if (!tah.moved) { tah.moved = true; storyLine.setPointerCapture(e.pointerId); html.classList.add('kino-tah'); }
    // poloha v kapitole i ide od jej cieľa po cieľ ďalšej (ťah doprava nikdy neskočí o kapitolu späť)
    const f = Math.max(0, Math.min(0.9999, (e.clientX - tah.a.left) / (tah.b.right - tah.a.left))), i = Math.floor(f * N);
    const y0 = ciel(i), y1 = i + 1 < N ? ciel(i + 1) - 1 : maxScroll;
    window.scrollTo({ top: Math.max(0, y0 + (f * N - i) * Math.max(0, y1 - y0)), behavior: 'instant' });
  });
  storyLine.addEventListener('dragstart', (e) => e.preventDefault());
  const koniecTahu = () => { if (tah && tah.moved) setTimeout(() => html.classList.remove('kino-tah'), 0); tah = null; };
  storyLine.addEventListener('pointerup', koniecTahu); storyLine.addEventListener('pointercancel', koniecTahu);
  storyLine.addEventListener('click', (e) => {
    if (html.classList.contains('kino-tah')) { e.preventDefault(); return; }
    const a = e.target instanceof Element ? e.target.closest('a[data-chapter]') : null;
    if (a) { kino.skok = storyLinks.indexOf(a); kino.skokDo = performance.now() + 1500; }
  }, true);
  storyLine.addEventListener('keydown', (e) => {
    const i = storyLinks.indexOf(document.activeElement);
    if (i < 0 || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    e.preventDefault();
    const j = Math.max(0, Math.min(N - 1, i + (e.key === 'ArrowRight' ? 1 : -1)));
    storyLinks[j].focus({ preventScroll: true });
    window.scrollTo({ top: ciel(j), behavior: motionOff || Math.abs(j - i) > 1 ? 'instant' : 'smooth' });
  });
  // karta(i): [začiatok, dĺžka] karty kapitoly; krok: funkcia kino.js volaná v slučke (titulky Remesla, B5)
  // bezi: slučka ešte dobieha za skrolom (kino.js s „Ďalej“ počká na pokoj)
  window.BS30_PAS = { ciel, get kapitola() { return kino.cur; }, get N() { return N; }, get bezi() { return !!rafId; }, karta: (i) => { const t = karta(i); return t && [t.top, t.free]; }, set krok(f) { kino.krok = f; apply(shownP); } };
  const modul = () => import('./kino.js');
  kino.play.addEventListener('click', () => modul().then((m) => m.prepni()).catch(() => {}));
  // Kino a „Ďalej“ (kino.js) ako posledný v pláne lenivých modulov (5b)
  plan.pridaj(() => modul().then((m) => { m.zapni(); }), 6);
  document.addEventListener('langchange', () => { kino.cur = -1; apply(shownP); });
}

let resizeTimer = 0;
function scheduleMeasure() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    measure();
    snapNow(0); // po zmene rozmerov bez dobiehania
  }, 120);
}
/* Lišta prehliadača na telefóne sa pri skrole schováva a zakaždým pošle resize (mení sa len výška okna). Rozloženie
   stojí na malom okne (svh) a pevné vrstvy na veľkom (lvh), takže sa nič nezmenilo: bez merania a bez skoku stavu
   uprostred gesta. Skutočnú zmenu (šírka, otočenie, výška dokumentu) ohlási šírka okna alebo ResizeObserver tela. */
const maRO = 'ResizeObserver' in window && !!document.body;
let sirkaOkna = window.innerWidth;
window.addEventListener('resize', () => {
  if (maRO && mqDotyk.matches && window.innerWidth === sirkaOkna) return;
  sirkaOkna = window.innerWidth;
  scheduleMeasure();
});
window.addEventListener('orientationchange', scheduleMeasure);
if (maRO) {
  // obrázky, fonty, neskorší obsah – mení sa výška dokumentu
  new ResizeObserver(scheduleMeasure).observe(document.body);
}
document.fonts?.ready?.then(scheduleMeasure);
window.addEventListener('load', () => { scheduleMeasure(); snapNow(400); });
window.addEventListener('pageshow', () => snapNow(300));

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    lastFrame = 0;
  } else {
    snapNow(0);
  }
});

// Skok cez kotvu: natívny scroll (pri motion=on smooth v CSS), stav sledujeme bez lerpu.
document.addEventListener('click', (e) => {
  const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
  if (!a || a.getAttribute('href') === '#') return;
  snapNow(motionOn ? 900 : 100);
});
window.addEventListener('hashchange', () => snapNow(motionOn ? 900 : 100));

/* ----------------------------------------------------------------------------
   6b. Plynulý skrol kolieskom (počítač s myšou): koliesko posúva cieľ, stránka k nemu dobieha (140 ms).
   Dotyk, klávesy a kotvy natívne; pri obmedzenom pohybe, lupe, vodorovnom skrole, menu či lightboxe prehliadač.
   ---------------------------------------------------------------------------- */
if (motionOn && mqFinePointer.matches) {
  const lightbox = $('#lightbox');
  let target = 0, cur = 0, raf = 0, last = 0, ours = false;
  const maxY = () => Math.max(0, (document.scrollingElement || html).scrollHeight - window.innerHeight);
  const step = (now) => {
    raf = 0;
    const dt = last ? Math.min(100, now - last) : 16.667; last = now;
    cur += (target - cur) * (1 - Math.exp(-dt / 140));
    // na krajoch (vrch, spodok) dobehne hneď, aby koliesko nahor na vrchu bez čakania viedlo von na ulicu
    if (Math.abs(target - cur) < 0.5 || ((target === 0 || target >= maxY()) && Math.abs(target - cur) < 12)) cur = target;
    ours = true; window.scrollTo({ top: cur, left: 0, behavior: 'instant' }); ours = false;
    if (cur !== target) raf = requestAnimationFrame(step); else last = 0;
  };
  window.addEventListener('wheel', (e) => {
    // otvorený dialóg (napr. prihláška k vernostnej kartičke) sa posúva sám, stránka za ním nie
    if (e.ctrlKey || e.metaKey || menuOpen || (lightbox && !lightbox.hidden) || document.body.style.overflow === 'hidden' || document.querySelector('dialog[open]')) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    e.preventDefault();
    if (!raf) { cur = target = window.scrollY; }
    target = Math.min(maxY(), Math.max(0, target + e.deltaY * unit));
    if (!raf) raf = requestAnimationFrame(step);
  }, { passive: false });
  // posun odinakiaľ (posuvník, klávesy, skok na kotvu): cieľ sa vyrovná so skutočnou polohou
  window.addEventListener('scroll', () => { if (!ours && !raf) cur = target = window.scrollY; }, { passive: true });
}

/* 7. (kurzor) zrušené: --pointer-x/y na <html> prepočítavali celú stránku a nič ich nečítalo */

/* ----------------------------------------------------------------------------
   7b. Atmosféra (atmosfera.js: kurzor, svetlo, hudba, strihnutie) v pláne 5b; ťuk pred načítaním sa odovzdá.
   ---------------------------------------------------------------------------- */
(function atmosfera() {
  let gesture = false;
  plan.pridaj(() => import('./atmosfera.js').then((m) => { m.spusti(gesture); }), 4);
  // gesto pre hudbu: klik myšou alebo ťuk, nie švih ani kláves; ovládač nie, ▶ Kino áno (C6, ako atmosfera.js)
  const naOvladac = (e) => e.target instanceof Element && !!e.target.closest('a, button, [role="button"], summary, input, select, textarea, label') && !e.target.closest('.kino-play');
  addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && !e.button && !naOvladac(e)) gesture = true; }, { passive: true });
  addEventListener('click', (e) => { if (e.detail && !naOvladac(e)) gesture = true; }, { passive: true });
})();

/* ----------------------------------------------------------------------------
   7b2. Recenzie (recenzie.js): citácie z Google mimo HTML (prvé okno TCP); bez skriptu ostáva odkaz.
   ---------------------------------------------------------------------------- */
(function recenzie() {
  const zoznam = document.querySelector('[data-recenzie]');
  if (!zoznam) return;
  // hneď: obsah pod nimi sa posunie ešte pred load, nie počas skrolu, a kotvy sa merajú už s nimi
  import('./recenzie.js').then((m) => m.spusti(zoznam)).catch(() => {});
})();

/* ----------------------------------------------------------------------------
   7b3. Asistent (asistent.js): zapne ho data-asistent na <html> (pages.yml, len s kľúčom API), inak nič nesťahuje.
   Lokálne ?asistent=<adresa>; ?asistent=off vypne, ?asistent=ukazka pripravené odpovede bez servera (označené).
   ---------------------------------------------------------------------------- */
(function asistent() {
  const q = new URLSearchParams(location.search).get('asistent');
  const lokal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const api = q === 'off' ? '' : q === 'ukazka' ? q : (lokal && q) || html.dataset.asistent || '';
  if (api !== 'ukazka' && !/^https?:\/\//.test(api)) return;
  plan.pridaj(() => import('./asistent.js').then((m) => { m.spusti(api); }), 2);
})();

/* ----------------------------------------------------------------------------
   7b4. Objednávka (objednavka.js): jediná cesta k objednaniu (Lajko 9. 11. 2026, bod 7). Každý odkaz Objednať sa
   (v HTML vedie do rezervačného systému, to je cesta bez skriptu) otvorí okno na tejto stránke; ?objednat=1 ho otvorí
   po načítaní (rezervacia.html, 404, odkazy s ?sluzba= a ?barber=). Voľné časy ukáže okno len so serverom
   s pripojeným kalendárom (data-objednavka na <html> z pages.yml so súhlasom prevádzky, lokálne ?objednavka=<adresa>),
   inak „Objednávka cez web teraz nejde – zavolaj“. ?objednavka=ukazka ukážka bez servera, ?objednavka=off len na skúšku
   bez okna. Modul (47 kB) a jeho štýl sa stiahnu až na požiadanie: pri dotyku odkazu, fokuse klávesnicou alebo keď nad
   ním prejde myš, a pri ?objednat=1 – nie v nečinnosti každému (A/B 11. 11. 2026: s modulom v pláne lenivých modulov
   viac dlhých snímok pri skrole telefónu); klik pred načítaním počká naň.
   ---------------------------------------------------------------------------- */
(function objednavka() {
  const q = new URLSearchParams(location.search), o = q.get('objednavka');
  if (o === 'off') return;
  const lokal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const api = o === 'ukazka' ? 'ukazka' : (lokal && o) || html.dataset.objednavka || '';
  const ODKAZY = 'a[href*="barbershop30.sk/rezervacia"]';
  let m = null;
  const load = () => m || (m = (() => {
    // štýl okna sa sťahuje súbežne s modulom (nie až po ňom): na pomalej sieti o jeden okruh skôr
    const l = document.createElement('link');
    l.rel = 'preload'; l.as = 'style'; l.href = new URL('objednavka.css', import.meta.url).href;
    document.head.append(l);
    return import('./objednavka.js').then((x) => x.spusti(api).then((ok) => { if (!ok) throw new Error('bez okna'); return x; }));
  })());
  const vopred = (e) => { if (e.target instanceof Element && e.target.closest(ODKAZY)) load().catch(() => {}); };
  addEventListener('pointerdown', vopred, { passive: true });
  addEventListener('focusin', vopred);
  addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') vopred(e); }, { passive: true });
  // zachytenie skôr ako prihláška vernostnej kartičky (tá je na document); Dokončiť v okne (data-obj-priamo) ide ďalej;
  // klávesy s Ctrl/Cmd/Shift a stredné tlačidlo nechajú rezervačný systém v novej karte
  addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element && e.target.closest(ODKAZY);
    if (!a || a.hasAttribute('data-obj-priamo')) return;
    e.preventDefault();
    // kým sa modul prvý raz sťahuje, odkaz ukáže, že sa niečo deje (aria-busy, style.css)
    a.setAttribute('aria-busy', 'true');
    // okno sa nedá (starý prehliadač bez <dialog>, modul sa nestiahol): rezervačný systém ako doteraz
    load().then((x) => x.otvorOdkaz(a)).catch(() => { const w = window.open(a.href, '_blank'); if (w) w.opener = null; else location.assign(a.href); })
      .finally(() => a.removeAttribute('aria-busy'));
  }, true);
  if (q.get('objednat')) {
    const z = new URLSearchParams(q);
    load().then((x) => x.otvorZAdresy(z)).catch(() => {});
    // adresa bez ?objednat (obnovenie stránky či Späť okno znova neotvorí)
    ['objednat', 'sluzba', 'barber'].forEach((k) => q.delete(k));
    history.replaceState(history.state, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
  }
})();

/* ----------------------------------------------------------------------------
   7b5. Vizitka a vernostná kartička (karty.js) pod kontaktom; kontakt bez skriptu je nad nimi a v pätičke.
   ---------------------------------------------------------------------------- */
(function karty() {
  const kontakt = document.querySelector('.band-contact');
  if (!kontakt) return;
  // ďaleko pod prvou obrazovkou: v pláne lenivých modulov (5b)
  plan.pridaj(() => import('./karty.js').then((m) => { m.spusti(kontakt); }), 5);
})();

/* ----------------------------------------------------------------------------
   7c. Jazyky (assets/i18n.js, slovníky assets/i18n/*.json). Pri ?lang= alebo uloženej voľbe sa modul načíta hneď
   (úvod je zatiaľ skrytý triedou t-wait z hlavičky), inak v pláne lenivých modulov (5b; prepínač, ponuka).
   ---------------------------------------------------------------------------- */
(function jazyky() {
  let lang = new URLSearchParams(location.search).get('lang');
  try { lang = lang || localStorage.getItem('b30.lang'); } catch (e) { /* súkromné okno */ }
  const load = () => import('./i18n.js').then((m) => { m.spusti(); }).catch(() => html.classList.remove('t-wait'));
  // anglická stránka (en/): slovník hneď, aby aj texty skladané skriptmi boli po anglicky
  if ((lang && lang !== 'sk') || html.dataset.zdroj) load(); else plan.pridaj(load, 3);
})();

/* ----------------------------------------------------------------------------
   8. Prvky .reveal (dosky, karty) – IntersectionObserver, jednorazový nástup
   ---------------------------------------------------------------------------- */
(function setupReveal() {
  const nodes = $$('.reveal');
  if (!nodes.length) return;
  if (motionOff || !('IntersectionObserver' in window)) {
    nodes.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  nodes.forEach((el) => io.observe(el));
})();

/* ----------------------------------------------------------------------------
   8b. Filmové strihy (P14): pás nastúpi linkou, fotky tímu a galérie maskou zdola, po sebe (--i). Len pri pohybe;
   js-odhal skryje prvky až tu, bez skriptu je všetko vidieť.
   ---------------------------------------------------------------------------- */
(function strihy() {
  const nodes = $$('.odhal, .band');
  if (!nodes.length || motionOff || !('IntersectionObserver' in window)) return;
  $$('.odhal').forEach((el) => {
    const row = el.closest('ul');
    const i = row ? $$('.odhal', row).indexOf(el) : 0;
    el.style.setProperty('--i', String(i % 4));
  });
  html.classList.add('js-odhal');
  // prvok zakrytý maskou (clip-path) prehliadač neráta ako viditeľný, preto sa sleduje jeho rodič
  const ciel = new Map(nodes.map((el) => [el.classList.contains('odhal') ? el.parentElement : el, el]));
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) { ciel.get(en.target).classList.add('is-in'); io.unobserve(en.target); }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  ciel.forEach((_, sledovany) => io.observe(sledovany));
})();

/* ----------------------------------------------------------------------------
   9. Menu (mobil)
   ---------------------------------------------------------------------------- */
let bodyOverflowBefore = '';
let menuInert = [];   // prvky, ktorým otvorené menu dalo inert (po zavretí sa vrátia)
function lockScroll(lock) {
  if (lock) { bodyOverflowBefore = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
  else document.body.style.overflow = bodyOverflowBefore || '';
}

// po vykreslení snímky (rAF + úloha): práca, ktorá nemá zdržať prvý obraz po ťuku
const poSnimke = (f) => requestAnimationFrame(() => setTimeout(f, 0));
function setMenu(open, { restoreFocus = true } = {}) {
  if (!header || !navToggle || !nav) return;
  open = !!open;
  if (open === menuOpen) return;
  menuOpen = open;
  header.dataset.menu = open ? 'open' : 'closed';
  navToggle.setAttribute('aria-expanded', String(open));
  if (!navToggle.getAttribute('aria-controls') && nav.id) navToggle.setAttribute('aria-controls', nav.id);
  lockScroll(open);
  setClass(mobileCta, 'is-hidden', ctaHidden(curY)); // poloha zo slučky: čítanie scrollY by tu vynútilo rozloženie (C4)
  // C4: fokus v snímke po zápise, inert (prepočet ~850 prvkov) až po vykreslení; inert je všetko mimo lišty
  requestAnimationFrame(() => {
    if (menuOpen !== open) return;
    // prvý viditeľný prvok menu (tlačidlo jazyka je na telefóne skryté, jazyky sú v menu ako rad skratiek)
    if (open) [...nav.querySelectorAll('a, button')].find((e) => !e.closest('[hidden]'))?.focus({ preventScroll: true });
    else if (restoreFocus) navToggle.focus({ preventScroll: true });
  });
  poSnimke(() => {
    if (menuOpen !== open) return;
    if (open) { menuInert = [...document.body.children].filter((e) => e !== header && !e.hasAttribute('inert') && !/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(e.tagName)); menuInert.forEach((e) => e.setAttribute('inert', '')); }
    else { menuInert.forEach((e) => e.removeAttribute('inert')); menuInert = []; }
  });
}

if (navToggle && nav && header) {
  if (!navToggle.getAttribute('aria-controls') && nav.id) navToggle.setAttribute('aria-controls', nav.id);
  navToggle.addEventListener('click', () => setMenu(!menuOpen, { restoreFocus: false }));
  nav.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('a')) setMenu(false, { restoreFocus: false });
  });
  // ťuk na stmavenú stránku pod panelom menu (pseudo-prvok lišty, P16 v style.css) menu zavrie
  header.addEventListener('click', (e) => { if (menuOpen && e.target === header) setMenu(false, { restoreFocus: false }); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) { e.preventDefault(); setMenu(false); }
  });
  // pri prechode na desktop menu zavri (navigácia je viditeľná v lište)
  mqMobile.addEventListener?.('change', (e) => { if (!e.matches) setMenu(false, { restoreFocus: false }); });
}

/* ----------------------------------------------------------------------------
   10. Lightbox galérie
   ---------------------------------------------------------------------------- */
(function setupLightbox() {
  const lb = $('#lightbox');
  if (!lb) return;
  const img = $('#lightbox-img', lb) || $('img', lb);
  const caption = $('#lightbox-caption', lb) || $('figcaption', lb);
  const btnClose = $('[data-lightbox="close"]:not(.lightbox-backdrop), .lightbox-close', lb);
  const btnPrev = $('[data-lightbox="prev"], .lightbox-prev', lb);
  const btnNext = $('[data-lightbox="next"], .lightbox-next', lb);

  // tlačidlá galérie: .gallery-item ako button, alebo button vnútri .gallery-item
  const triggers = $$('.gallery-item, .gallery-btn')
    .map((el) => (el.matches('button, a') ? el : $('button', el)))
    .filter((el, i, arr) => el && arr.indexOf(el) === i);
  const srcOf = (el) => el.dataset.full || el.dataset.lightboxSrc || '';
  const items = triggers.filter(srcOf);
  if (!items.length || !img) return;

  let index = -1;
  let opener = null;
  let open = false;

  lb.setAttribute('role', lb.getAttribute('role') || 'dialog');
  lb.setAttribute('aria-modal', 'true');

  function show(i) {
    index = (i + items.length) % items.length;
    const btn = items[index];
    const alt = btn.dataset.alt || btn.dataset.lightboxAlt || $('img', btn)?.alt || '';
    // obrázok sa načíta až teraz
    img.removeAttribute('srcset');
    img.src = srcOf(btn);
    if (btn.dataset.lightboxSrcset) { img.srcset = btn.dataset.lightboxSrcset; img.sizes = '100vw'; }
    if (btn.dataset.lightboxW && btn.dataset.lightboxH) { img.width = Number(btn.dataset.lightboxW); img.height = Number(btn.dataset.lightboxH); }
    const popis = window.B30_LANG ? window.B30_LANG.t(alt) : alt;   // popis fotky v jazyku stránky
    img.alt = popis;
    if (caption) caption.textContent = popis;
    const single = items.length < 2;
    if (btnPrev) btnPrev.hidden = single;
    if (btnNext) btnNext.hidden = single;
  }

  function openAt(i, from) {
    opener = from || document.activeElement;
    show(i);
    lb.hidden = false;
    open = true;
    lockScroll(true);
    (btnClose || lb).focus?.({ preventScroll: true });
  }

  function close() {
    if (!open) return;
    open = false;
    lb.hidden = true;
    lockScroll(false);
    img.removeAttribute('src');
    img.removeAttribute('srcset');
    opener?.focus?.({ preventScroll: true });
    opener = null;
  }

  items.forEach((btn, i) => btn.addEventListener('click', (e) => { e.preventDefault(); openAt(i, btn); }));
  btnClose?.addEventListener('click', close);
  btnPrev?.addEventListener('click', () => show(index - 1));
  btnNext?.addEventListener('click', () => show(index + 1));
  // klik na pozadie (mimo obrázka a tlačidiel) zatvára
  lb.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t === lb || t.classList.contains('lightbox-backdrop') || t.closest('[data-lightbox="close"]') === t) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); return; }
    if (e.key === 'Tab') {
      // pasca fokusu vnútri lightboxu
      const focusables = $$('button, [href], [tabindex]:not([tabindex="-1"])', lb).filter((el) => !el.hidden && el.offsetParent !== null);
      if (!focusables.length) { e.preventDefault(); return; }
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || !lb.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();

/* ----------------------------------------------------------------------------
   11. Tiché videoslučky (Remeslo, Tím): hrá najviac jedno, pri viditeľnosti ≥ 35 % a zobrazenom prvku (.is-in);
   pri obmedzenom pohybe nič (ostáva poster).
   ---------------------------------------------------------------------------- */
(function setupVideos() {
  const vids = $$('video[data-video]');
  // plagát sa načíta až keď je okno s videom do dvoch obrazoviek od okna (nie hneď pri štarte stránky);
  // pri obmedzenom pohybe a bez IntersectionObserver sa dá hneď, aby okno nebolo prázdne
  const posters = vids.filter((v) => v.dataset.poster);
  const setPoster = (v) => { if (!v.poster) v.poster = v.dataset.poster; };
  if (posters.length) {
    if ('IntersectionObserver' in window) {
      const pio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { setPoster(e.target); pio.unobserve(e.target); } }), { rootMargin: '200% 0px' });
      posters.forEach((v) => pio.observe(v));
    } else posters.forEach(setPoster);
  }
  if (!vids.length || motionOff || !('IntersectionObserver' in window)) return;
  const ratio = new Map(vids.map((v) => [v, 0]));

  const pause = (v) => { if (!v.paused) v.pause(); };
  const play = (v) => { if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => { /* autoplay zamietnutý – ostáva poster */ }); } };
  const gateOf = (v) => v.closest('[data-at], .reveal');
  const wanted = (v) => {
    if ((ratio.get(v) || 0) < 0.35) return false;
    const gate = gateOf(v);
    return !gate || gate.classList.contains('is-in');
  };
  function sync() {
    if (document.visibilityState !== 'visible') { vids.forEach(pause); return; }
    let best = null, bestRatio = 0;
    for (const v of vids) {
      if (wanted(v) && ratio.get(v) > bestRatio) { best = v; bestRatio = ratio.get(v); }
    }
    for (const v of vids) if (v !== best) pause(v);
    if (best) play(best);
  }

  const io = new IntersectionObserver((entries) => {
    for (const en of entries) ratio.set(en.target, en.isIntersecting ? en.intersectionRatio : 0);
    sync();
  }, { threshold: [0, 0.2, 0.35, 0.5, 0.75, 1] });
  vids.forEach((v) => io.observe(v));

  // brány menia triedu is-in (slučka alebo IntersectionObserver) – sleduj zmenu a prehodnoť
  const mo = 'MutationObserver' in window ? new MutationObserver(sync) : null;
  new Set(vids.map(gateOf).filter(Boolean)).forEach((g) => mo?.observe(g, { attributes: true, attributeFilter: ['class'] }));
  document.addEventListener('visibilitychange', sync);
})();

/* ----------------------------------------------------------------------------
   12. Rok v pätičke
   ---------------------------------------------------------------------------- */
$$('.year').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

/* ----------------------------------------------------------------------------
   13. Štart – stav okamžite (aj po obnovení stránky uprostred príbehu)
   ---------------------------------------------------------------------------- */
measure();
readTarget();
shownP = targetP;
apply(shownP);
window.__renderDone = true;
start();

/* ----------------------------------------------------------------------------
   12. Pohyblivé detaily (style.css P12): nadpis po slovách, kroky strihu, pás služieb len keď je
   vidieť, tabuľa dnešných hodín podľa otváracích hodín. Pri obmedzenom pohybe všetko stojí.
   ---------------------------------------------------------------------------- */
(() => {
  const d = document, root = d.documentElement;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.motion === 'off';
  const io = (els, fn, opt) => { if (!('IntersectionObserver' in window)) { els.forEach((el) => fn(el, true)); return; } const o = new IntersectionObserver((es) => es.forEach((e) => fn(e.target, e.isIntersecting, o)), opt); els.forEach((el) => o.observe(el)); };

  // nadpis po slovách: každé slovo do <span class="kw"> s poradím --i (oneskorenie), zalomenia a vnorené značky ostanú
  const kins = [...d.querySelectorAll('.kin')];
  const rozdel = (h) => {
    let i = 0;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/), f = d.createDocumentFragment();
        parts.forEach((p) => { if (!p) return; if (/^\s+$/.test(p)) { f.append(p); return; } const w = d.createElement('span'); w.className = 'kw'; w.style.setProperty('--i', i++); w.textContent = p; f.append(w); });
        n.replaceWith(f);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(h);
  };
  // jazyky: slová sa po delení prekladať nedajú (slovosled), preto si nadpis pamätá pôvodné riadky
  // a pri zmene jazyka sa preloží celý riadok (kľúč = pôvodný riadok) a rozdelí znova
  kins.forEach((h) => { h.__sk = h.cloneNode(true); h.setAttribute('data-no-i18n', ''); rozdel(h); });
  d.addEventListener('langchange', () => {
    const T = window.B30_LANG ? window.B30_LANG.t : (k) => k;
    kins.forEach((h) => {
      const c = h.__sk.cloneNode(true), tw = d.createTreeWalker(c, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        const k = n.nodeValue.replace(/\s+/g, ' ').trim(); if (!k) continue;
        n.nodeValue = (n.nodeValue.match(/^\s*/) || [''])[0] + T(k) + (n.nodeValue.match(/\s*$/) || [''])[0];
      }
      h.replaceChildren(...c.childNodes); rozdel(h);
    });
  });
  if (!still && kins.length) { root.classList.add('js-kin'); io(kins.filter((h) => !h.closest('.film-shot.is-title')), (el, on, o) => { if (on) { el.classList.add('is-in'); o && o.unobserve(el); } }, { threshold: 0.4 }); }

  // zoznam krokov: položky po jednej, keď je zoznam z tretiny na obrazovke
  const steps = [...d.querySelectorAll('.steps')];
  steps.forEach((ul) => [...ul.children].forEach((li, i) => li.style.setProperty('--i', i)));
  if (!still && steps.length) { root.classList.add('js-steps'); io(steps, (el, on, o) => { if (on) { el.classList.add('is-in'); o && o.unobserve(el); } }, { threshold: 0.35 }); }

  // pás služieb beží len na obrazovke (batéria)
  // nekonečné animácie bežia len na obrazovke: mimo okna ich Chrome nepustí na kompozitor a tikajú v hlavnom vlákne
  io([...d.querySelectorAll('.marquee, .beam, .btn-primary')], (el, on) => el.classList.toggle('is-off', !on));

  // tabuľa dnešných hodín podľa otváracích hodín v Nitre (Po–Pi 9–19, So 9–14, Ne zatvorené)
  const HOURS = { 1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 14], 0: null };
  // formátovač s časovým pásmom sa vytvorí raz (pri každom volaní stál na telefóne s CPU 4× desiatky ms hlavného vlákna)
  let fmtNitra = null;
  const nowNitra = () => {
    fmtNitra = fmtNitra || new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bratislava', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const p = Object.fromEntries(fmtNitra.formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), h: +p.hour + +p.minute / 60 };
  };
  // slová tabule po slovensky; ostatné jazyky ich majú v slovníku (assets/i18n/<jazyk>.json, kľúč __tabula)
  const SK = { zatvorene: 'ZATVORENÉ', dni: ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'], zajtra: 'zajtra',
    dalsi: '{kedy} od {cas}', terazOtvorene: 'Teraz otvorené', otvarameO: 'Otvárame o {cas}', terazZatvorene: 'Teraz zatvorené, {dalsi}',
    aria: 'Dnes {od} až {do}. {stav}.', ariaZatvorene: 'Dnes zatvorené. {stav}.' };
  const vypln = (sablona, v) => sablona.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
  const tabula = (box, ticho) => {
    const W = (window.B30_LANG && window.B30_LANG.data('__tabula')) || SK;
    const GLYPHS = '0123456789:–' + W.zatvorene.replace(/\s/g, '');
    const { dow, h } = nowNitra(), t = HOURS[dow];
    const text = t ? `${t[0]}:00 – ${t[1]}:00` : W.zatvorene;
    // najbližší otvorený deň po dnešku (sobota → pondelok), pomenovaný ako v reči: zajtra, v pondelok
    let n = (dow + 1) % 7; while (!HOURS[n]) n = (n + 1) % 7;
    const dalsi = vypln(W.dalsi, { kedy: n === (dow + 1) % 7 ? W.zajtra : W.dni[n], cas: `${HOURS[n][0]}:00` });
    let state;
    if (t && h >= t[0] && h < t[1]) state = W.terazOtvorene;
    else if (t && h < t[0]) state = vypln(W.otvarameO, { cas: `${t[0]}:00` });
    else state = vypln(W.terazZatvorene, { dalsi });
    const cells = box.querySelector('.flap-cells'), st = box.querySelector('.flap-state'), lab = box.querySelector('.flap-label');
    box.setAttribute('data-no-i18n', '');
    box.setAttribute('aria-label', t ? vypln(W.aria, { od: `${t[0]}:00`, do: `${t[1]}:00`, stav: state }) : vypln(W.ariaZatvorene, { stav: state }));
    if (lab) lab.textContent = window.B30_LANG ? window.B30_LANG.t('Dnes') : 'Dnes';
    cells.setAttribute('aria-hidden', 'true');
    cells.textContent = '';
    const bs = [...text].map((c) => { const b = d.createElement('b'); if (c === ' ') b.className = 'sp'; b.textContent = ticho ? c : (c === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * 10)]); cells.append(b); return [b, c]; });
    if (st) st.textContent = state;
    if (ticho) return null;
    return () => bs.forEach(([b, c], i) => {
      if (c === ' ') return;
      let n = 4 + i * 2;
      // preklopenie políčka cez Web Animations (to isté ako @keyframes preklop): opakovanie triedy s čítaním
      // offsetWidth vynútilo rozloženie stránky pri každom z ~150 preklopení; starý prehliadač ostáva pri triede
      const preklop = () => { if (b.animate) b.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.2)' }, { transform: 'scaleY(1)' }], 90); else { b.classList.remove('flip'); void b.offsetWidth; b.classList.add('flip'); } };
      const tick = () => { preklop(); b.textContent = --n <= 0 ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; if (n > 0) setTimeout(tick, 70); };
      setTimeout(tick, i * 40);
    });
  };
  d.querySelectorAll('[data-flap]').forEach((box) => {
    const run = tabula(box, still);
    d.addEventListener('langchange', () => tabula(box, true));
    if (!run) return;
    io([box], (el, on, o) => { if (on) { run(); o && o.unobserve(el); } }, { threshold: 0.6 });
  });

  // úvod (P15): živý stav otváracích hodín, ten istý výpočet a slová ako tabuľa (__tabula), každú minútu znova
  const zive = d.querySelector('[data-zive]');
  const stavTeraz = () => {
    const W = (window.B30_LANG && window.B30_LANG.data('__tabula')) || SK;
    const { dow, h } = nowNitra(), t = HOURS[dow];
    let n = (dow + 1) % 7; while (!HOURS[n]) n = (n + 1) % 7;
    const dalsi = vypln(W.dalsi, { kedy: n === (dow + 1) % 7 ? W.zajtra : W.dni[n], cas: `${HOURS[n][0]}:00` });
    const otv = !!(t && h >= t[0] && h < t[1]);
    zive.textContent = otv ? `${W.terazOtvorene} · ${t[0]}:00 – ${t[1]}:00` : t && h < t[0] ? vypln(W.otvarameO, { cas: `${t[0]}:00` }) : vypln(W.terazZatvorene, { dalsi });
    zive.classList.toggle('is-otvorene', otv);
    zive.hidden = false;
  };
  if (zive) { zive.setAttribute('data-no-i18n', ''); stavTeraz(); d.addEventListener('langchange', stavTeraz); setInterval(stavTeraz, 60000); }

  // cenník na telefóne (P15): záložky skupín s vyznačením tej, ktorá je na obrazovke, popis služby na dva riadky
  // (ťuk ho rozbalí), riadky nastúpia pri prvom zobrazení; záložky sú odkazy na skupiny, bez skriptu nie sú
  const cennik = d.getElementById('cennik');
  const skupiny = cennik ? [...cennik.querySelectorAll('.price-group[aria-labelledby]')] : [];
  if (skupiny.length > 1) {
    root.classList.add('js-cennik');
    const lista = d.createElement('nav');
    lista.className = 'price-tabs';
    lista.setAttribute('aria-label', (d.querySelector('#sluzby .kicker') || {}).textContent || 'Služby a ceny');
    const zalozky = skupiny.map((g) => {
      const id = g.getAttribute('aria-labelledby'), a = d.createElement('a');
      a.href = '#' + id; a.textContent = (d.getElementById(id) || {}).textContent || '';
      a.addEventListener('click', (e) => { e.preventDefault(); g.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' }); });
      lista.append(a);
      return a;
    });
    cennik.before(lista);
    // nadpisy skupín sa prekladajú, záložky preberú ich text
    d.addEventListener('langchange', () => skupiny.forEach((g, i) => { zalozky[i].textContent = (d.getElementById(g.getAttribute('aria-labelledby')) || {}).textContent || ''; }));
    io(skupiny, (g, on) => {
      if (!on) return;
      const i = skupiny.indexOf(g);
      zalozky.forEach((a, j) => a.setAttribute('aria-current', String(i === j)));
      const a = zalozky[i];
      lista.scrollTo({ left: a.offsetLeft - (lista.clientWidth - a.offsetWidth) / 2, behavior: still ? 'auto' : 'smooth' });
    }, { rootMargin: '-35% 0px -60% 0px' });
    cennik.addEventListener('click', (e) => { const p = e.target.closest('.price-desc'); if (p) p.closest('.price-row').classList.toggle('is-otvorene'); });
    io([...cennik.querySelectorAll('.price-row')], (el, on, o) => { if (on) { el.classList.add('is-in'); o && o.unobserve(el); } }, { threshold: 0.12 });
  }

  // tím a galéria na telefóne (P15): pás sa pri prvom zobrazení raz jemne posunie a vráti, aby bolo vidieť,
  // že pokračuje; len kým ho návštevník sám neposunul
  if (!still && matchMedia('(max-width: 640px)').matches) {
    io([...d.querySelectorAll('.team-grid, .gallery-grid')], (el, on, o) => {
      if (!on) return;
      o && o.unobserve(el);
      if (el.scrollLeft < 4) el.classList.add('is-nudge');
    }, { threshold: 0.6 });
  }
})();
