/*
 * BARBERSHOP 30 – režisér stránky (docs/CONTRACT.md §3, §6; docs/ART_DIRECTION.md §8).
 *
 * Jediný zdroj pravdy je scroll. Jedna slučka requestAnimationFrame číta window.scrollY,
 * počíta celkový progress --p a lokálne t filmových scén, zapisuje CSS premenné na <html>,
 * prepína stavy (is-in, data-scene-active, lišta, javisko) a volá 3D javisko (chair.js).
 * Žiadne externé požiadavky, žiadna analytika, žiadne globálne premenné
 * (iba window.__stage na ladenie a window.__renderDone pre source/shot.mjs).
 */

const html = document.documentElement;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// shot.mjs čaká, kým nebude true (prvý 3D snímok alebo rozhodnutie motion/webgl = off)
window.__renderDone = false;

/* ----------------------------------------------------------------------------
   1. Brána pohybu
   ---------------------------------------------------------------------------- */
const params = new URLSearchParams(location.search);
const mqReduced = matchMedia('(prefers-reduced-motion: reduce)');
const mqMobile = matchMedia('(max-width: 900px)');
const mqCoarse = matchMedia('(pointer: coarse)');
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
   2. DOM (prvky nemusia existovať – stránka vzniká paralelne)
   ---------------------------------------------------------------------------- */
const header = $('.site-header');
const navToggle = $('.nav-toggle');
const nav = $('#nav') || $('.nav');
const storyLine = $('.story-line');
const storyLinks = storyLine ? $$('a[data-chapter]', storyLine) : [];
const navLinks = nav ? $$('a[href^="#"]', nav) : [];
const stageEl = $('#stage');
const canvas = $('#stage-canvas');
const mobileCta = $('#mobile-cta');
const footer = $('.site-footer');

// Filmové scény s 3D kreslom (1, 2, 7) a scéna 3 (len CSS).
const FILM_DEFS = [
  { id: 'uvod', scene: 1, cssVar: '--t1' },
  { id: 'remeslo', scene: 2, cssVar: '--t2' },
  { id: 'miesto', scene: 3, cssVar: '--t3' },
  { id: 'rezervacia', scene: 7, cssVar: '--t7' },
];
const STAGE_SCENES = new Set([1, 2, 7]);

/* ----------------------------------------------------------------------------
   3. Meranie rozsahov (resize, obrázky, fonty)
   ---------------------------------------------------------------------------- */
let vh = window.innerHeight;
let maxScroll = 1;
let films = [];     // { el, scene, cssVar, top, height, range, items: [{ el, a, b }] }
let sections = [];  // všetky .scene[data-scene]: { el, scene, id, top, height }
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

  sections = $$('.scene[data-scene]').map((el) => {
    const r = el.getBoundingClientRect();
    return { el, id: el.id, scene: Number(el.dataset.scene) || 0, top: r.top + y, height: r.height };
  });

  films = FILM_DEFS.map((def) => {
    const el = document.getElementById(def.id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const items = $$('[data-at]', el).map((node) => ({ el: node, ...parseAt(node.dataset.at) }));
    return { el, scene: def.scene, cssVar: def.cssVar, top: r.top + y, height: r.height, range: Math.max(1, r.height - vh), items };
  }).filter(Boolean);

  if (footer) {
    const r = footer.getBoundingClientRect();
    footerBox = { top: r.top + y, height: r.height };
  }
}

/* ----------------------------------------------------------------------------
   4. Zápis CSS premenných a stavov (len pri zmene)
   ---------------------------------------------------------------------------- */
const varCache = new Map();
function setVar(name, value) {
  const v = clamp01(value);
  const last = varCache.get(name);
  // zapisuj len pri zmene > 0.002; krajné hodnoty 0 a 1 vždy dosadni presne
  if (last !== undefined && Math.abs(v - last) <= 0.002 && !((v === 0 || v === 1) && v !== last)) return;
  varCache.set(name, v);
  html.style.setProperty(name, v.toFixed(4));
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
let textGate = motionOff;                // nástup textu scény 1 až 450 ms po štarte
let menuOpen = false;
let activeScene = 0;
let stage = null;        // API z chair.js
let stageVisible = null; // posledná hodnota odovzdaná stage.setVisible
let lastStageKey = '';
let lastHeaderScrolled = null;

function readTarget() {
  targetP = clamp01((window.scrollY || 0) / maxScroll);
}

// Scéna a lokálne t, ktoré dostane 3D javisko (len scény 1, 2, 7).
// Medzi dvoma 3D scénami sa prepne v polovici medzery, keď je canvas skrytý.
function stageTarget(y) {
  const f3d = films.filter((f) => STAGE_SCENES.has(f.scene));
  if (!f3d.length) return { scene: 1, t: 0 };
  if (y < f3d[0].top) return { scene: f3d[0].scene, t: 0 };
  for (let i = 0; i < f3d.length; i++) {
    const f = f3d[i];
    if (y >= f.top && y < f.top + f.height) return { scene: f.scene, t: clamp01((y - f.top) / f.range) };
    const next = f3d[i + 1];
    if (next && y < next.top) {
      const mid = (f.top + f.height + next.top) / 2;
      return y > mid ? { scene: next.scene, t: 0 } : { scene: f.scene, t: 1 };
    }
  }
  const last = f3d[f3d.length - 1];
  return { scene: last.scene, t: 1 };
}

// Sekcia, ktorej stred je najbližšie k stredu viewportu (+ pätička pre navigáciu).
function closestSection(y) {
  const mid = y + vh / 2;
  let best = null, bestD = Infinity;
  for (const s of sections) {
    const d = Math.abs(s.top + s.height / 2 - mid);
    if (d < bestD) { bestD = d; best = s; }
  }
  let footerWins = false;
  if (footerBox && footerBox.height > 0) {
    const d = Math.abs(footerBox.top + footerBox.height / 2 - mid);
    if (d < bestD) footerWins = true;
  }
  return { section: best, footerWins };
}

function apply(p) {
  const y = p * maxScroll;
  setVar('--p', p);

  // lokálne t + data-at prvky filmových scén
  for (const f of films) {
    const t = clamp01((y - f.top) / f.range);
    setVar(f.cssVar, t);
    for (const it of f.items) {
      const inside = t >= it.a && t <= it.b;
      if (inside && !textGate) continue; // pred otvorením brány len neodkrývame
      setClass(it.el, 'is-in', inside);
    }
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
  setClass(mobileCta, 'is-hidden', activeScene === 7 || menuOpen);

  // javisko
  const visible = STAGE_SCENES.has(activeScene);
  setAttr(stageEl, 'data-visible', visible ? '1' : '0');
  if (stage) {
    const st = stageTarget(y);
    const key = `${st.scene}:${st.t.toFixed(4)}`;
    if (key !== lastStageKey) { lastStageKey = key; stage.setProgress(st); }
    const shouldRender = visible && document.visibilityState !== 'hidden';
    if (shouldRender !== stageVisible) { stageVisible = shouldRender; stage.setVisible(shouldRender); }
  }
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
    return;
  }
  apply(shownP);
  rafId = requestAnimationFrame(tick);
}

function start() {
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
    stage?.resize();
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
    if (stage && stageVisible) { stageVisible = false; stage.setVisible(false); }
  } else {
    stageVisible = null; // apply() znovu rozhodne
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
   7. Kurzor (iba desktop s hover a presným ukazovateľom)
   ---------------------------------------------------------------------------- */
function setPointerVars(x, y) {
  setVar('--pointer-x', x);
  setVar('--pointer-y', y);
}
setPointerVars(0.5, 0.5);

let pointerBound = false;
function onPointerMove(e) {
  if (e.pointerType && e.pointerType !== 'mouse') return;
  const x = clamp01(e.clientX / (window.innerWidth || 1));
  const y = clamp01(e.clientY / (window.innerHeight || 1));
  setPointerVars(x, y);
  stage?.setPointer(x, y);
}
function bindPointer() {
  const want = mqFinePointer.matches && motionOn;
  if (want && !pointerBound) { window.addEventListener('pointermove', onPointerMove, { passive: true }); pointerBound = true; }
  if (!want && pointerBound) { window.removeEventListener('pointermove', onPointerMove); pointerBound = false; setPointerVars(0.5, 0.5); stage?.setPointer(0.5, 0.5); }
}
bindPointer();
mqFinePointer.addEventListener?.('change', bindPointer);

/* ----------------------------------------------------------------------------
   8. Prvky .reveal a data-at mimo filmových scén – IntersectionObserver
   ---------------------------------------------------------------------------- */
(function setupReveal() {
  const nodes = $$('.reveal, [data-at]').filter((el) => !el.closest('.scene-film'));
  if (!nodes.length) return;
  if (motionOff || !('IntersectionObserver' in window)) {
    nodes.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }
  }, { rootMargin: '-10% 0px -10% 0px', threshold: 0 });
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
  setClass(mobileCta, 'is-hidden', open || activeScene === 7);
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
   11. Rok v pätičke
   ---------------------------------------------------------------------------- */
$$('.year').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

/* ----------------------------------------------------------------------------
   12. 3D javisko (iba motion=on, po load + idle)
   ---------------------------------------------------------------------------- */
function hasWebGL() {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch (_) {
    return false;
  }
}

function markRenderDone() { window.__renderDone = true; }

async function init3D() {
  if (!canvas || !stageEl || !hasWebGL()) {
    html.dataset.webgl = 'off';
    markRenderDone();
    return;
  }
  try {
    const mobile = mqMobile.matches || mqCoarse.matches;
    const quality = (deviceMemory !== undefined && deviceMemory < 6) || mqCoarse.matches ? 'low' : 'high';
    const { createChairStage } = await import('./chair.js');
    const created = await createChairStage(canvas, {
      dpr: mobile ? 1.25 : 1.5,
      mobile,
      quality,
      onFirstFrame: () => {
        html.dataset.webgl = 'on';
        stageEl.classList.add('is-3d');
        markRenderDone();
      },
    });
    stage = created;
    window.__stage = created; // len na ladenie
    lastStageKey = '';
    stageVisible = null;
    apply(shownP); // odovzdaj aktuálny stav (scéna, t, viditeľnosť)
    if (pointerBound) stage.setPointer(0.5, 0.5);
    if (shownP < 0.05) stage.playIntroSweep();
  } catch (err) {
    console.warn('3D javisko sa nepodarilo spustiť, ostáva poster.', err);
    stage = null;
    html.dataset.webgl = 'off';
    markRenderDone();
  }
}

function whenIdle(fn) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 1500 });
  else setTimeout(fn, 300);
}

if (motionOff) {
  html.dataset.webgl = 'off';
  markRenderDone();
} else {
  const afterLoad = () => whenIdle(() => { init3D(); });
  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad, { once: true });
}

/* ----------------------------------------------------------------------------
   13. Štart – stav okamžite (aj po obnovení stránky uprostred príbehu)
   ---------------------------------------------------------------------------- */
measure();
readTarget();
shownP = targetP;
if (!textGate) {
  // nástup textu scény 1: 450 ms po štarte; pri obnovení uprostred príbehu hneď
  if (targetP >= 0.05) textGate = true;
  else setTimeout(() => { textGate = true; start(); }, 450);
}
apply(shownP);
start();
