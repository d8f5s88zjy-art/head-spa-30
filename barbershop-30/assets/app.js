/*
 * BARBERSHOP 30 – režisér stránky (docs/CONTRACT.md §3, §6; docs/TOUR_DIRECTION.md; docs/ART_DIRECTION.md §8).
 *
 * Jediný zdroj pravdy je scroll. Jedna slučka requestAnimationFrame číta window.scrollY, počíta celkový
 * progress --p a lokálne t každého záberu (.film-shot), zapisuje CSS premenné, prepína stavy
 * (is-in, data-scene-active, lišta, linka príbehu, mobilné CTA) a riadi tiché videoslučky, menu a lightbox.
 * Film zo skutočných fotiek (assets/film.js) je samostatný modul: číta kotvy .film-shot a triedy world /
 * world-in / world-off na <html> – tento súbor ich nenastavuje ani nečíta.
 * Žiadne externé požiadavky, žiadna analytika, žiadne globálne premenné
 * (iba window.__renderDone / window.__scrollSettled pre source/shot.mjs a testy).
 */

const html = document.documentElement;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// shot.mjs čaká, kým nebude true – stránka je čitateľná hneď po prvom nastavení stavu (bez 3D)
window.__renderDone = false;
window.__scrollSettled = false; // true, keď slučka dobehla cieľ (scrollY) – testy čakajú na túto hodnotu

/* ----------------------------------------------------------------------------
   1. Brána pohybu
   ---------------------------------------------------------------------------- */
const params = new URLSearchParams(location.search);
const mqReduced = matchMedia('(prefers-reduced-motion: reduce)');
const mqMobile = matchMedia('(max-width: 900px)');
const mqFinePointer = matchMedia('(hover: hover) and (pointer: fine)');
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

function parseAt(value) {
  const parts = String(value || '').split(',').map((s) => parseFloat(s));
  const a = Number.isFinite(parts[0]) ? parts[0] : 0;
  const b = Number.isFinite(parts[1]) ? parts[1] : 1;
  return { a: Math.min(a, b), b: Math.max(a, b) };
}

function measure() {
  vh = window.innerHeight || 1;
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
    return { el, top: r.top + y, height: Math.max(1, r.height), items };
  });

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
  const key = el === html ? name : el;
  const last = el === html ? varCache.get(key) : el.__v;
  // zapisuj len pri zmene > 0.002; krajné hodnoty 0 a 1 vždy dosadni presne
  if (last !== undefined && Math.abs(v - last) <= 0.002 && !((v === 0 || v === 1) && v !== last)) return;
  if (el === html) varCache.set(key, v); else el.__v = v;
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
let lastHeaderScrolled = null;

function readTarget() {
  targetP = clamp01((window.scrollY || 0) / maxScroll);
}

// Aktívna sekcia: tá, v ktorej leží bod 40 % výšky okna (sekcie sú rôzne dlhé – záber + pás);
// pred prvou je prvá, za poslednou posledná. Pätička vyhráva pre navigáciu, keď bod leží v nej.
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
  setVar('--p', p);

  // lokálne t záberu: 0 keď stred obrazovky vstúpi na jeho horný okraj, 1 keď vyjde spodným okrajom.
  // Z neho CSS odvodí jemný prejazd zálohy (scale 1 → 1.06, premenná --sp na kotve) a stav data-at prvkov.
  for (const s of shots) {
    const t = clamp01((y + vh * 0.5 - s.top) / s.height);
    setVar('--sp', t, s.el);
    for (const it of s.items) setClass(it.el, 'is-in', t >= it.a && t <= it.b);
  }

  // aktívna kapitola
  const { section, footerWins } = closestSection(y);
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

  // lišta, linka príbehu, plávajúce CTA
  const scrolled = (window.scrollY || 0) > 80;
  if (scrolled !== lastHeaderScrolled) { lastHeaderScrolled = scrolled; setClass(header, 'is-scrolled', scrolled); }
  setClass(storyLine, 'is-visible', p > 0.02);
  setClass(mobileCta, 'is-hidden', activeScene === lastScene || menuOpen);
}

function tick(now) {
  rafId = 0;
  const dt = lastFrame ? Math.min(100, now - lastFrame) : 16.667;
  lastFrame = now;
  readTarget();

  if (motionOff || now < snapUntil) {
    shownP = targetP;
  } else {
    // frame-rate-nezávislý lerp: k = 0.16 pri 60 fps
    shownP += (targetP - shownP) * (1 - Math.pow(1 - 0.16, dt / 16.667));
  }

  if (Math.abs(targetP - shownP) < 0.0005) {
    shownP = targetP;
    apply(shownP);
    lastFrame = 0; // slučka sa zastaví; ďalší štart začne čistým dt
    window.__scrollSettled = true;
    return;
  }
  apply(shownP);
  rafId = requestAnimationFrame(tick);
}

function start() {
  window.__scrollSettled = false;
  if (rafId || document.visibilityState === 'hidden') return;
  rafId = requestAnimationFrame(tick);
}

function snapNow(ms = 0) {
  snapUntil = Math.max(snapUntil, performance.now() + ms);
  start();
}

/* ----------------------------------------------------------------------------
   6. Udalosti: scroll, resize, viditeľnosť karty, kotvy
   ---------------------------------------------------------------------------- */
window.addEventListener('scroll', start, { passive: true });

let resizeTimer = 0;
function scheduleMeasure() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    measure();
    snapNow(0); // po zmene rozmerov bez dobiehania
  }, 120);
}
window.addEventListener('resize', scheduleMeasure);
window.addEventListener('orientationchange', scheduleMeasure);
if ('ResizeObserver' in window && document.body) {
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
   7. Kurzor (iba desktop s hover a presným ukazovateľom) – --pointer-x/y pre CSS
   ---------------------------------------------------------------------------- */
function setPointerVars(x, y) {
  setVar('--pointer-x', x);
  setVar('--pointer-y', y);
}
setPointerVars(0.5, 0.5);

let pointerBound = false;
function onPointerMove(e) {
  if (e.pointerType && e.pointerType !== 'mouse') return;
  setPointerVars(clamp01(e.clientX / (window.innerWidth || 1)), clamp01(e.clientY / (window.innerHeight || 1)));
}
function bindPointer() {
  const want = mqFinePointer.matches && motionOn;
  if (want && !pointerBound) { window.addEventListener('pointermove', onPointerMove, { passive: true }); pointerBound = true; }
  if (!want && pointerBound) { window.removeEventListener('pointermove', onPointerMove); pointerBound = false; setPointerVars(0.5, 0.5); }
}
bindPointer();
mqFinePointer.addEventListener?.('change', bindPointer);

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
   9. Menu (mobil)
   ---------------------------------------------------------------------------- */
let bodyOverflowBefore = '';
function lockScroll(lock) {
  if (lock) { bodyOverflowBefore = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
  else document.body.style.overflow = bodyOverflowBefore || '';
}

function setMenu(open, { restoreFocus = true } = {}) {
  if (!header || !navToggle || !nav) return;
  open = !!open;
  if (open === menuOpen) return;
  menuOpen = open;
  header.dataset.menu = open ? 'open' : 'closed';
  navToggle.setAttribute('aria-expanded', String(open));
  if (!navToggle.getAttribute('aria-controls') && nav.id) navToggle.setAttribute('aria-controls', nav.id);
  lockScroll(open);
  setClass(mobileCta, 'is-hidden', open || activeScene === lastScene);
  if (open) {
    const first = $('a, button', nav);
    first?.focus({ preventScroll: true });
  } else if (restoreFocus) {
    navToggle.focus({ preventScroll: true });
  }
}

if (navToggle && nav && header) {
  if (!navToggle.getAttribute('aria-controls') && nav.id) navToggle.setAttribute('aria-controls', nav.id);
  navToggle.addEventListener('click', () => setMenu(!menuOpen, { restoreFocus: false }));
  nav.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('a')) setMenu(false, { restoreFocus: false });
  });
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
    img.alt = alt;
    if (caption) caption.textContent = alt;
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
   11. Tiché videoslučky (Remeslo, Tím)
   Pravidlá: play pri viditeľnosti >= 35 %, pause mimo viewportu a pri skrytej karte; súčasne hrá
   najviac jedno video; video v prvku s data-at alebo .reveal hrá, len kým je prvok zobrazený (.is-in);
   pri data-motion=off a prefers-reduced-motion sa nič nesťahuje ani neprehráva (ostáva poster).
   ---------------------------------------------------------------------------- */
(function setupVideos() {
  const vids = $$('video[data-video]');
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
