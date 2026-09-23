/* HEAD SPA 30. Vanilla JS, no build step. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smoothstep = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  /* Časti stránky pod prvou obrazovkou sa spúšťajú až keď má prehliadač voľnú chvíľu. */
  const idle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 200));
  function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const phoneMQ = matchMedia('(max-width: 640px)');   // telefón má vlastné hranice kapitol, kameru, rampy a dobiehanie

  /* ============ úvod: jeden záber miestnosti ============
     Po otvorení dverí sa miestnosť pomaly vynorí z tmy (CSS). Pri skrolovaní text ide so stránkou
     a fotka zaostáva (paralaxa), takže úvod plynulo prejde do obsahu, bez stmavnutia a bez medzery. */
  function makeReel(root) {
    const shot = $('.reel .fs', root);
    let last = '';
    function draw(p) {
      const key = p.toFixed(3); if (key === last) return; last = key;
      shot.style.transform = `translate3d(0,${(p * 30).toFixed(2)}%,0)`;
    }
    return { resize() { last = ''; }, draw, setCuts() {} };
  }

  /* ============ text splitting with seeded offsets ============ */
  function splitLine(el, mode, seed, spread) {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    const R = rng(seed);
    const total = text.replace(/\s/g, '').length;
    let ci = 0;
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    words.forEach((w) => {
      const ws = document.createElement('span'); ws.className = 'w';
      if (/[A-ZÁČĎÉÍĽŇÓŠŤÚÝŽ]{3,}/.test(w) || w.endsWith('.') && words.length <= 4) ws.classList.add('em');
      if (mode === 'scatter') {
        [...w].forEach((ch) => {
          const cs = document.createElement('span'); cs.className = 'c'; cs.textContent = ch;
          cs.style.setProperty('--th', (R() * 0.55).toFixed(3));
          cs.style.setProperty('--jx', ((R() * 2 - 1) * 60).toFixed(1) + 'px');
          cs.style.setProperty('--jy', ((R() * 2 - 1) * 40 - 30).toFixed(1) + 'px');
          cs.style.setProperty('--jr', ((R() * 2 - 1) * 24).toFixed(1) + 'deg');
          ws.appendChild(cs); ci++;
        });
      } else {
        ws.textContent = w;
        const th = (ci / Math.max(1, total)) * (spread || 0.5) + R() * 0.06;
        ws.style.setProperty('--th', th.toFixed(3));
        ci += w.length;
      }
      if (vis.childNodes.length) vis.appendChild(document.createTextNode(' '));
      vis.appendChild(ws);
    });
    const sr = document.createElement('span'); sr.className = 'vh'; sr.textContent = text;
    el.textContent = ''; el.appendChild(sr); el.appendChild(vis);
  }

  /* ============ headlines rise out of a masked slot, line by line ============ */
  function wrapLines(h) {
    const nodes = [...h.childNodes];
    const lines = []; let buf = '';
    const flush = () => { const t = buf.replace(/\s+/g, ' ').trim(); if (t) lines.push({ text: t }); buf = ''; };
    nodes.forEach((n) => {
      if (n.nodeType === 3) buf += n.textContent;
      else if (n.nodeName === 'BR') flush();
      else if (n.nodeName === 'EM') { flush(); lines.push({ em: n }); }
      else buf += n.textContent;
    });
    flush();
    if (!lines.length) return;
    h.textContent = '';
    lines.forEach((l) => {
      const ln = document.createElement('span'); ln.className = 'ln';
      if (l.em) { l.em.classList.add('li'); ln.appendChild(l.em); }
      else { const li = document.createElement('span'); li.className = 'li'; li.textContent = l.text; ln.appendChild(li); }
      h.appendChild(ln);
    });
    h.classList.add('lines');
    if (!h.classList.contains('part')) { const p = h.closest('.part'); if (p) p.classList.add('has-h2'); }
  }
  $$('.h2').forEach(wrapLines);

  /* ============ hero scrub ============ */
  const hero = $('.hero'), stage = $('.stage'), env = $('.env');
  const bands = $$('.band', stage).map((el, i) => ({
    el, a: +el.dataset.a, b: +el.dataset.b, i,
    ramp: el.dataset.ramp ? +el.dataset.ramp : null, op: -1, k: -1, u: -1, on: false, live: false
  }));
  // telefón číta vlastné hranice kapitol (data-ma, data-mb), ktoré sa prekrývajú; počítač pôvodné data-a, data-b
  function bandBounds() {
    const ph = phoneMQ.matches;
    bands.forEach((b) => {
      b.a = ph && b.el.dataset.ma != null ? +b.el.dataset.ma : +b.el.dataset.a;
      b.b = ph && b.el.dataset.mb != null ? +b.el.dataset.mb : +b.el.dataset.b;
      b.op = -1; b.k = -1; b.u = -1; b.on = false; b.live = false;
    });
  }
  const reelCuts = () => bands.slice(1).map((b, i) => (bands[i].b + b.a) / 2);
  const hud = $('.hud'), chapters = $$('.hud .ch'), cue = $('.cue');
  let scene = null, scrubOn = false, heroOnScreen = true, inited = false, covered = false;
  let target = 0, shown = 0, rafId = null, lastTick = 0, loadK = 1, loadStart = 0;
  let lastHud = '', lastHudAt = 0;

  function heroProgress() {
    const r = hero.getBoundingClientRect();
    // rozsah podľa výšky lepiacej scény (100svh), nie okna: pri zložení lišty v Safari progres neskočí
    const range = hero.offsetHeight - stage.offsetHeight;
    const c = r.top <= 0 && r.bottom >= window.innerHeight;
    if (c !== covered) { covered = c; env.classList.toggle('covered', c); }
    // úvod na jednu obrazovku: progres je, koľko z neho už odišlo hore
    return range > 0 ? clamp(-r.top / range, 0, 1) : clamp(-r.top / hero.offsetHeight, 0, 1);
  }
  function updateCaptions(p, now) {
    const ph = phoneMQ.matches;
    for (const b of bands) {
      // telefón: prelínačka 0.06 leží na prekryve kapitol; starý text odíde v prvej polovici, nový príde v druhej,
      // takže sa dva odseky nikdy neprekrývajú (predtým boli chvíľu viditeľné oba cez seba)
      const f = Math.min(ph ? 0.06 : 0.02, (b.b - b.a) / 3), h = ph ? f / 2 : 0;
      let op = (b.i === 0 ? 1 : smoothstep(p, b.a + h, b.a + f)) * (b.i === bands.length - 1 ? 1 : 1 - smoothstep(p, b.b - f, b.b - h));
      // telefón: rampa slov cca 200 px, aby choreografiu bolo vidieť v rámci jedného švihu palcom
      const ramp = ph ? Math.min(0.09, (b.b - b.a) * 0.35) : (b.ramp || Math.min(0.025, (b.b - b.a) * 0.35));
      let k = clamp((p - b.a) / ramp, 0, 1);
      if (b.i === 0) k = Math.max(k, loadK);
      if (Math.abs(op - b.op) > 0.005 || (op === 0 && b.op !== 0) || (op === 1 && b.op !== 1)) { b.op = op; b.el.style.opacity = op.toFixed(3); }
      const on = op > 0.5, live = op > 0;
      if (on !== b.on) { b.on = on; b.el.classList.toggle('on', on); b.el.inert = !on; }
      if (live !== b.live) { b.live = live; b.el.classList.toggle('live', live); }   // vrstvy vznikajú pred prelínačkou, nie v nej
      if (Math.abs(k - b.k) > 0.008 || (k === 1 && b.k !== 1) || (k === 0 && b.k !== 0)) { b.k = k; b.el.style.setProperty('--k', k.toFixed(3)); }
      {
        // pomalý posun bloku textu cez celú kapitolu, aby stred kapitoly nestál (na počítači aj na telefóne)
        const u = live ? clamp((p - b.a) / (b.b - b.a), 0, 1) : 0;
        if (Math.abs(u - b.u) > 0.01 || (u === 0 && b.u !== 0) || (u === 1 && b.u !== 1)) { b.u = u; b.el.style.setProperty('--u', u.toFixed(2)); }
      }
    }
    if (hud && now !== undefined && now - lastHudAt > 80) {
      const t = p.toFixed(3);
      if (t !== lastHud) {
        lastHud = t; lastHudAt = now; hud.style.setProperty('--p', t);
        chapters.forEach((ch, i) => { const on = bands[i] && bands[i].on; if (ch.classList.contains('on') !== on) ch.classList.toggle('on', on); });
      }
    }
    if (cue) { const show = p < 0.04; if (cue.classList.contains('show') !== show) cue.classList.toggle('show', show); }
  }
  function tick(now) {
    const dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    // telefón drží krok s palcom (časová konštanta cca 40 ms), počítač si necháva mäkšie dobiehanie kolieska
    const gap = Math.abs(target - shown);
    const k = phoneMQ.matches ? (gap > 0.1 ? 0.5 : 0.35) : 0.16;
    shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
    if (!heroOnScreen) shown = target;   // pri skoku na kotvu sa mimo obrazovky nič nedobieha
    let busy = true;
    if (Math.abs(target - shown) < 0.0005) { shown = target; busy = false; }
    if (busy) rafId = requestAnimationFrame(tick); else { rafId = null; lastTick = 0; }
    scene.draw(shown);
    updateCaptions(shown, now);
  }
  function onScroll() {
    target = heroProgress();
    if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
  }
  function initHeroOnce() {
    if (inited) return; inited = true;
    scene = makeReel(stage);
    scene.resize();
    scene.setCuts(reelCuts());
    bands.forEach((b) => {
      const fx = b.el.dataset.fx;
      const spread = b.el.dataset.spread ? +b.el.dataset.spread : undefined;
      /* prvý nadpis je rozdelený už v HTML, aby sa vykreslil bez čakania na skript */
      $$('[data-split]', b.el).forEach((el, j) => { if (!$('.vh', el)) splitLine(el, fx === 'scatter' ? 'scatter' : 'word', 30 + b.i * 7 + j, spread); });
      if (fx === 'blur') {
        const stack = $('.stack', b.el);
        const sharp = $('.sharp', stack);
        const soft = sharp.cloneNode(true); soft.className = 'soft'; soft.setAttribute('aria-hidden', 'true');
        $$('.vh', soft).forEach((n) => n.remove());
        stack.appendChild(soft);
      }
    });
    new IntersectionObserver((es) => {
      heroOnScreen = es[0].isIntersecting;
      // po skoku na kotvu a späť sa scéna postaví rovno na aktuálny progres, cesta sa neprehráva dozadu
      if (heroOnScreen && scrubOn) { target = shown = heroProgress(); onScroll(); }
    }, { threshold: 0 }).observe(hero);
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { scene.resize(); if (scrubOn) scene.draw(shown); }, 120); }, { passive: true });
  }
  /* the gallery lightbox: only real photographs open, drawn shots stay in the grid */
  const lb = $('#lightbox');
  if (lb) {
    const lbImg = $('img', lb), lbCap = $('.lb-cap', lb);
    $$('.shot .open').forEach((btn) => btn.addEventListener('click', () => {
      const fig = btn.closest('.shot'), img = $('img', fig);
      if (!img) return;
      lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt;
      lbCap.textContent = $('.cap b', fig) ? $('.cap b', fig).textContent + '. ' + $('.cap span', fig).textContent : img.alt;
      if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    }));
    $('.lb-close', lb).addEventListener('click', () => lb.close());
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  }
  function enableScrub() {
    if (scrubOn) return; scrubOn = true;
    initHeroOnce();
    addEventListener('scroll', onScroll, { passive: true });
    bandBounds();
    unpinFinalStates();
    loadStart = performance.now(); loadK = 1;
    target = shown = heroProgress();
    scene.setCuts(reelCuts());
    scene.draw(shown);
    updateCaptions(shown, loadStart);
    onScroll();
  }
  function disableScrub() {
    if (!scrubOn) return; scrubOn = false;
    removeEventListener('scroll', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    if (covered) { covered = false; env.classList.remove('covered'); }
  }
  // the journey now runs on phones too; only a short landscape screen and reduced motion get the still
  const GATES = [
    '(max-height: 500px)',
    '(prefers-reduced-motion: reduce)'
  ];
  function applyHeroMode() {
    if (GATES.some((q) => matchMedia(q).matches)) disableScrub(); else enableScrub();
  }
  const MQLS = GATES.map((q) => matchMedia(q));
  MQLS.forEach((m) => m.addEventListener('change', applyHeroMode));
  // pri prechode cez 640 px (otočenie tabletu) sa hranice kapitol prepočítajú bez obnovenia stránky
  phoneMQ.addEventListener('change', () => { if (scrubOn) { bandBounds(); scene.resize(); scene.setCuts(reelCuts()); target = shown = heroProgress(); scene.draw(shown); updateCaptions(shown); } });

  /* ============ dvere: raz za návštevu sa značka nakreslí a dvere sa otvoria ============ */
  const veil = $('.veil'), veilMark = veil && $('.mark', veil), navMark = $('.nav .mark');
  let veilMs = 0, veilDone = false;
  /* o dverách rozhodol krátky skript v hlavičke, aby sa vykreslili hneď pri prvom snímku */
  if (veil && document.documentElement.classList.contains('door')) {
    veilMs = 620; document.body.classList.add('veiling');
  }
  document.documentElement.style.setProperty('--veil', veilMs + 'ms');
  function endVeil() {
    if (veilDone) return; veilDone = true;
    document.body.classList.remove('veiling');
    document.documentElement.classList.remove('door');
    document.documentElement.style.setProperty('--veil', '0ms');
    if (veil) veil.classList.add('gone');
    veilMs = 0;
    dispatchEvent(new Event('hs30veilend'));   // scéna hero na telefóne čaká na koniec dverí
  }
  function flipVeil() {
    if (veilDone) return;
    const n = navMark.getBoundingClientRect(), m = veilMark.getBoundingClientRect();
    const dx = n.left + n.width / 2 - (m.left + m.width / 2), dy = n.top + n.height / 2 - (m.top + m.height / 2), s = n.width / 96;
    veilMark.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${s.toFixed(4)})`;
    veil.classList.add('lift');                                  // obe krídla sa otvoria dnu
    setTimeout(() => { if (!veilDone) veil.classList.add('through'); }, 260);   // a prejdeš cez ne
  }

  /* ============ nav: solid after the top, and it holds your place ============ */
  const nav = $('.nav');
  let navSolid = false;
  function navCheck() {
    const s = scrollY > 40;
    if (s !== navSolid) { navSolid = s; nav.classList.toggle('solid', s); }
  }
  addEventListener('scroll', navCheck, { passive: true }); navCheck();
  // the bar steps aside while you read downward and comes back the moment you scroll up
  let lastY = scrollY, navHidden = false, navT = 0;
  addEventListener('scroll', () => {
    const y = scrollY, down = y > lastY + 4, up = y < lastY - 4;
    if (down && y > 260 && !navHidden && !(menu && menu.open)) { navHidden = true; nav.classList.add('hide'); }
    else if ((up || y < 120) && navHidden) { navHidden = false; nav.classList.remove('hide'); }
    if (down || up) lastY = y;
    clearTimeout(navT); navT = setTimeout(() => { lastY = scrollY; }, 200);
  }, { passive: true });
  nav.addEventListener('focusin', () => { if (navHidden) { navHidden = false; nav.classList.remove('hide'); } });

  /* ============ the hand: magnetic primary buttons, a light under the cursor on cards (fine pointers only) ============ */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced.matches) {
    $$('.btn.primary').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.setProperty('--mx', (dx * 8).toFixed(1) + 'px'); btn.style.setProperty('--my', (dy * 6).toFixed(1) + 'px');
      });
      btn.addEventListener('pointerleave', () => { btn.style.setProperty('--mx', '0px'); btn.style.setProperty('--my', '0px'); });
    });
    $$('.card,.scard').forEach((el) => el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--lx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); el.style.setProperty('--ly', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }, { passive: true }));
  }
  let atBottom = false;
  /* reading progress: one hairline, driven by the scroll listener that is already here */
  const prog = document.createElement('div');
  prog.className = 'prog'; prog.setAttribute('aria-hidden', 'true');
  if (!reduced.matches) document.body.appendChild(prog);
  let progRaf = 0;
  function drawProg() {
    progRaf = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const k = max > 40 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    prog.style.transform = 'scaleX(' + k.toFixed(4) + ')';
    prog.classList.toggle('on', scrollY > 120);
  }
  addEventListener('scroll', () => {
    const b = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    if (b !== atBottom) { atBottom = b; if (b) document.body.dataset.scene = 'footer'; else sceneUpdate(); }
    if (!reduced.matches && !progRaf) progRaf = requestAnimationFrame(drawProg);
  }, { passive: true });
  const navLinks = $$('.links a');
  const spied = new Set();
  const spy = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) spied.add(e.target); else spied.delete(e.target); });
    let cur = null; $$('#cennik,#rezervacia,#poukaz,#ritual,#salon,#galeria,#faq,#kontakt').forEach((s) => { if (spied.has(s)) cur = s; });
    navLinks.forEach((a) => a.classList.toggle('cur', !!cur && a.getAttribute('href') === '#' + cur.id));
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  $$('#cennik,#rezervacia,#poukaz,#ritual,#salon,#galeria,#faq,#kontakt').forEach((s) => spy.observe(s));

  /* ============ the light is handed from room to room ============ */
  const scenes = $$('[data-scene]');
  const inScene = new Set();
  document.body.dataset.scene = 'hero';
  function sceneUpdate() {
    if (atBottom) return;
    let last = null; scenes.forEach((s) => { if (inScene.has(s)) last = s; });
    if (last && document.body.dataset.scene !== last.dataset.scene) document.body.dataset.scene = last.dataset.scene;
  }
  const sceneIO = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) inScene.add(e.target); else inScene.delete(e.target); });
    sceneUpdate();
  }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
  scenes.forEach((s) => sceneIO.observe(s));

  /* ============ stillness: sections rest off screen, the page rests when the visitor does ============ */
  const liveIO = new IntersectionObserver((es) => { es.forEach((e) => e.target.classList.toggle('live', e.isIntersecting)); if (typeof driveLines === 'function') driveLines(); }, { threshold: 0 });
  $$('.gift,.book,.contact').forEach((s) => liveIO.observe(s));
  let idleT;
  function wake() {
    const wasIdle = document.body.classList.contains('idle');
    document.body.classList.remove('idle');
    if (wasIdle) dispatchEvent(new Event('hs30wake'));
    clearTimeout(idleT);
    idleT = setTimeout(() => document.body.classList.add('idle'), 45000);
  }
  ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'].forEach((ev) => addEventListener(ev, wake, { passive: true }));

  /* ============ entrances ============ */
  const rv = $$('.rv');
  const rio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); rio.unobserve(e.target);
    setTimeout(() => e.target.classList.add('done'), 1600);
  }), { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  rv.forEach((el) => rio.observe(el));

  /* ============ scroll drives: the water line, the lit numerals, the quote (no extra loops) ============ */
  /* every .steps block runs its own water line, independently of the others */
  let pinned = false;
  const streams = $$('.steps').map((box) => {
    const path = $('.stream .draw', box);
    const steps = $$('.step', box).map((el) => ({ el, n: $('.n', el), at: 0, lit: null }));
    const len = path ? path.getTotalLength() : 0;
    if (path) { path.style.strokeDasharray = len; path.style.strokeDashoffset = len; }
    return { box, path, steps, len, lastDash: -1 };
  }).filter((s) => s.path && s.steps.length);
  function measureSteps() {
    streams.forEach((s) => {
      const h = s.box.offsetHeight - 16;
      s.steps.forEach((x) => { x.at = h > 0 ? (x.el.offsetTop + x.n.offsetTop + x.n.offsetHeight / 2 - 8) / h : 0; });
    });
  }
  measureSteps();
  let mrt; addEventListener('resize', () => { clearTimeout(mrt); mrt = setTimeout(measureSteps, 150); }, { passive: true });
  function driveLines() {
    if (pinned) return;
    streams.forEach((s) => {
      const r = s.box.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;   // off screen, nothing to draw
      const p = clamp((innerHeight * 0.78 - r.top) / r.height, 0, 1);
      const d = Math.round(s.len * (1 - p));
      if (d !== s.lastDash) { s.lastDash = d; s.path.style.strokeDashoffset = d; }
      s.steps.forEach((x) => { const lit = p >= x.at; if (lit !== x.lit) { x.lit = lit; x.el.classList.toggle('lit', lit); } });
    });
  }
  addEventListener('scroll', driveLines, { passive: true }); driveLines();

  /* ============ counters (ledger numerals) ============ */
  const counters = $$('[data-count]');
  const counted = new Set();
  function runCounter(el) {
    if (counted.has(el)) return; counted.add(el);
    const end = +el.dataset.count, suf = el.dataset.suffix || '', dur = 1200;
    const group = el.closest('.stats'); const idx = group ? $$('[data-count]', group).indexOf(el) : 0;
    setTimeout(() => {
      if (pinned) return;
      const t0 = performance.now(); let last = '';
      (function step(now) {
        const t = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - t, 3);
        const s = Math.round(end * e) + suf;
        if (s !== last) { last = s; el.textContent = s; }
        if (t < 1) requestAnimationFrame(step);
      })(t0);
    }, idx * 120);
  }
  const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } }), { threshold: 0.6 });
  counters.forEach((c) => cio.observe(c));

  function pinToFinalStates() {
    pinned = true;
    streams.forEach((s) => { s.path.style.strokeDashoffset = 0; s.steps.forEach((x) => { x.lit = true; x.el.classList.add('lit'); }); });
    counters.forEach((c) => { counted.add(c); c.textContent = c.dataset.count + (c.dataset.suffix || ''); });
    rv.forEach((el) => el.classList.add('in', 'done'));
    endVeil();
  }
  function unpinFinalStates() {
    pinned = false;
    streams.forEach((s) => { s.lastDash = -1; s.steps.forEach((x) => { x.lit = null; }); });
    driveLines();
  }
  reduced.addEventListener('change', (e) => { if (e.matches) pinToFinalStates(); else { unpinFinalStates(); applyHeroMode(); } });

  /* ============ price list: filters, finder, details, the cascade ============ */
  const cards = $$('.card'), cats = $$('.cat'), count = $('.count');
  let activeCat = 'all';
  function cascade(list) {
    if (reduced.matches) return;
    list.forEach((c) => c.classList.remove('pop'));
    void document.body.offsetWidth;
    list.forEach((c, i) => { c.style.setProperty('--i', i); c.classList.add('pop'); }); sweepPop();
  }
  // animationend can be missed (hidden tab, a card filtered out mid-animation), so a timer sweeps up too
  let popSweep = 0;
  function sweepPop() { clearTimeout(popSweep); popSweep = setTimeout(() => cards.forEach((c) => c.classList.remove('pop')), 1400); }
  cards.forEach((c) => c.addEventListener('animationend', (e) => { if (e.animationName === 'cardIn') c.classList.remove('pop'); }));
  if (!reduced.matches) {
    const pio = new IntersectionObserver((es) => {
      const hits = es.filter((e) => e.isIntersecting).map((e) => e.target);
      hits.forEach((c, i) => { c.style.setProperty('--i', i); c.classList.add('pop'); pio.unobserve(c); }); sweepPop();
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    cards.forEach((c) => pio.observe(c));
  }
  // rituál pre dvoch nájdeš pod Pre dvoch aj vtedy, keď patrí do luxusnej kategórie
  const inCat = (c) => activeCat === 'all' || c.dataset.cat === activeCat || (activeCat === 'couple' && c.dataset.duo === '1');
  /* Tento riadok sa skladá až v prehliadači, preto má vlastné preklady. */
  const COUNT_WORDS = {
    sk: { all: (t) => `Zobrazených všetkých ${t} rituálov`, some: (n, t) => `Zobrazených ${n} z ${t} rituálov` },
    cs: { all: (t) => `Zobrazeno všech ${t} rituálů`, some: (n, t) => `Zobrazeno ${n} z ${t} rituálů` },
    pl: { all: (t) => `Pokazano wszystkie ${t} rytuały`, some: (n, t) => `Pokazano ${n} z ${t} rytuałów` },
    hu: { all: (t) => `Mind a ${t} rituálé látszik`, some: (n, t) => `${t} rituáléból ${n} látszik` },
    de: { all: (t) => `Alle ${t} Rituale angezeigt`, some: (n, t) => `${n} von ${t} Ritualen angezeigt` },
    uk: { all: (t) => `Показано всі ${t} ритуали`, some: (n, t) => `Показано ${n} з ${t} ритуалів` },
    en: { all: (t) => `Showing all ${t} rituals`, some: (n, t) => `Showing ${n} of ${t} rituals` },
  };

  /* Čas a rozpočet, aby sa dalo z 34 rituálov vybrať bez čítania všetkých. */
  const fTime = $('#f-time'), fPrice = $('#f-price'), fClear = $('#f-clear'), noHit = $('#noHit');
  let maxMin = Infinity, maxEur = Infinity;
  const limited = () => maxMin !== Infinity || maxEur !== Infinity;
  const fits = (c) => +c.dataset.min <= maxMin && +c.dataset.price <= maxEur;

  function applyFilter(fromChip) {
    let n = 0; const shown = [];
    cards.forEach((c) => { const show = inCat(c) && fits(c); c.classList.toggle('hidden', !show); if (show) { n++; shown.push(c); } else c.classList.remove('pop'); });
    /* nadpis kategórie zmizne aj vtedy, keď v nej po obmedzení nič nezostalo */
    cats.forEach((l) => {
      const zije = shown.some((c) => c.dataset.cat === l.dataset.cat);
      l.classList.toggle('hidden', !zije);
    });
    if (count) {
      const W = COUNT_WORDS[(document.documentElement.lang || 'sk').slice(0, 2)] || COUNT_WORDS.sk;
      count.textContent = (activeCat === 'all' && !limited()) ? W.all(cards.length) : W.some(n, cards.length);
    }
    if (noHit) noHit.hidden = n > 0;
    if (fClear) fClear.hidden = !limited();
    if (fromChip) cascade(shown);
  }
  function readLimits() {
    maxMin = fTime ? (+fTime.value || Infinity) : Infinity;
    maxEur = fPrice ? (+fPrice.value || Infinity) : Infinity;
    if (maxMin >= 999) maxMin = Infinity;
    if (maxEur >= 9999) maxEur = Infinity;
  }
  [fTime, fPrice].forEach((s) => s && s.addEventListener('change', () => { readLimits(); applyFilter(true); }));
  if (fClear) fClear.addEventListener('click', () => {
    if (fTime) fTime.value = '999';
    if (fPrice) fPrice.value = '9999';
    readLimits(); applyFilter(true);
  });
  function pickCat(cat, fromChip) {
    $$('.tools .chip').forEach((x) => x.setAttribute('aria-pressed', x.dataset.filter === cat ? 'true' : 'false'));
    activeCat = cat; applyFilter(fromChip);
  }
  $$('.tools .chip').forEach((b) => b.addEventListener('click', () => pickCat(b.dataset.filter, true)));
  /* a link elsewhere on the page can open the list already filtered by category */
  $$('[data-cat-jump]').forEach((a) => a.addEventListener('click', () => {
    pickCat(a.dataset.catJump, true);
    const id = (a.getAttribute('href') || '').slice(1), target = id && document.getElementById(id);
    if (target && target.classList.contains('card')) {
      const open = !target.classList.contains('open');
      if (open) { const b = $('.card-toggle', target); if (b) b.click(); }
    }
  }));
  applyFilter(false);
  document.addEventListener('langchange', () => applyFilter(false));
  $$('.card .panel ol').forEach((ol) => [...ol.children].forEach((li, i) => li.style.setProperty('--i', i)));
  $$('.card-toggle').forEach((b) => b.addEventListener('click', () => {
    const c = b.closest('.card'); const open = !c.classList.contains('open');
    c.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
    $('.panel', c).setAttribute('aria-hidden', String(!open));
  }));

  /* ============ faq ============ */
  $$('.faq-q').forEach((b) => b.addEventListener('click', () => {
    const it = b.closest('.faq-item'); const open = !it.classList.contains('open');
    it.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
    $('.faq-a', it).setAttribute('aria-hidden', String(!open));
  }));

  /* ============ vouchers: pick, preview on the ticket, send as an e-mail order ============ */
  idle(function poukazy() {
    const vform = $('#vform');
    if (vform) {
      const sel = $('#v-ritual', vform), tVal = $('#t-val'), tFor = $('#t-for'), tVen = $('#t-ven');
      const err = $('.err', vform), done = $('.sent', vform), emailField = $('#v-email', vform);
      const val = (name) => (vform.querySelector(`input[name="${name}"]:checked`) || {}).value || '';
      const ritualName = () => (sel.options[sel.selectedIndex] || {}).value || '';
      const fieldVal = (id) => ($(id, vform).value || '').trim();
      function preview() {
        // náhľad na lístku, keď na stránke je (inak je poukážka hotový obrázok od salónu)
        if (!tVal) return;
        // poukaz je vždy na konkrétny rituál z ponuky
        const shown = ritualName().replace(/\s*\(.*$/, '');
        tVal.textContent = shown; tVal.classList.toggle('long', shown.length > 12);
        const pre = fieldVal('#v-pre');
        if (tFor) tFor.textContent = pre ? `Pre: ${pre}` : 'Daruj oddych.';
        const ven = fieldVal('#v-ven');
        if (tVen) tVen.textContent = ven || 'Mostná 30 · prémiový relaxačný zážitok';
      }
      vform.addEventListener('input', preview); vform.addEventListener('change', preview); preview();
      vform.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = fieldVal('#v-email'), ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
        err.hidden = ok; emailField.closest('.field').classList.toggle('invalid', !ok);
        if (!ok) { emailField.focus(); return; }
        const what = `Rituál: ${ritualName()}`;
        const lines = ['Dobrý deň,', '', 'objednávam darčekový poukaz HEAD SPA 30.', '', what,
          `Pre: ${fieldVal('#v-pre') || '(nevyplnené)'}`, `Od: ${fieldVal('#v-od') || '(nevyplnené)'}`,
          `E-mail: ${email}`, `Telefón: ${fieldVal('#v-tel') || '(nevyplnené)'}`,
          `Doručenie: ${val('dorucenie')}`, `Venovanie: ${fieldVal('#v-ven') || '(bez venovania)'}`, '',
          'Prosím o zaslanie platobných údajov.', 'Ďakujem.'];
        const subject = `Objednávka poukazu: ${ritualName().replace(/\s*\(.*$/, '')}`;
        track('voucher_order', { value: ritualName(), delivery: val('dorucenie') });
        done.hidden = false;
        location.href = `mailto:info@salon30.sk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      });
    }
  });

  /* ============ booking: pick one of the 17 rituals, a day and a time window; the message leaves from the guest's own phone ============ */

  /* ============ rezervácia: každé tlačidlo vedie do online kalendára ============
     Adresa je na jedinom mieste, v atribúte data-booking na <html>. Formulár na
     stránke zostáva ako záloha, vedie naň položka Rezervácia v menu. Bez
     JavaScriptu tlačidlá stále fungujú, len skončia pri formulári. */
  const BOOKING = (document.documentElement.dataset.booking || '').trim();
  function toBooking(a) {
    if (!a || !BOOKING) return;
    a.href = BOOKING; a.target = '_blank'; a.rel = 'noopener';
  }
  if (BOOKING) {
    $$('a[data-booking-link], a.btn[href="#rezervacia"], .mbar a[href="#rezervacia"]').forEach(toBooking);
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="http"][target="_blank"]');
      if (a && a.href === BOOKING) track('booking_open', { from: (a.dataset.book || a.className || 'cta').slice(0, 40) });
    });
  }

  /* ============ poradca: tri otázky nad cenníkom, odporúčanie z kariet ============ */
  idle(function advisor() {
    const box = $('#poradca'); if (!box) return;
    const res = $('#advRes', box);
    const answer = {};
    // rituály čítame z kariet, aby cenník a poradca nikdy nešli od seba
    const list = $$('.card').map((c) => ({
      id: c.dataset.id, cat: c.dataset.cat, goal: c.dataset.goal || 'relax', duo: c.dataset.duo === '1' || c.dataset.cat === 'couple',
      min: +c.dataset.min, eur: +c.dataset.price,
      name: ($('h3', c) || {}).textContent || '', tag: ($('.tag', c) || {}).textContent || '',
      dur: ($('.meta span', c) || {}).textContent || '', price: ($('.meta strong', c) || {}).textContent || '',
    })).filter((r) => r.id);

    const FITS = { self: (r) => r.cat !== 'kids' && r.cat !== 'gentlemen' && !r.duo, men: (r) => r.cat === 'gentlemen' && !r.duo, kid: (r) => r.cat === 'kids', duo: (r) => r.duo };
    function pick() {
      const kto = answer.kto, cas = +answer.cas, ciel = answer.ciel;
      let pool = list.filter(FITS[kto] || (() => true));
      if (!pool.length) pool = list.slice();
      const scored = pool.map((r) => {
        let sc = 0;
        // to, čo človek chce, váži viac než presné dodržanie času; keď sa rituál do okna nezmestí, povieme to
        if (r.goal === ciel) sc += 8;
        else if ((ciel === 'lux' && r.eur >= 109) || (ciel === 'relax' && r.goal === 'beauty')) sc += 2;
        if (r.min <= cas) sc += 4 - Math.min(3, (cas - r.min) / 20);
        else sc -= 1.5 + (r.min - cas) / 60;
        return { r, sc };
      }).sort((a, b) => b.sc - a.sc || a.r.eur - b.r.eur);
      return scored.map((x) => x.r);
    }
    function show() {
      if (!answer.kto || !answer.cas || !answer.ciel) return;
      const [best, second] = pick();
      if (!best) return;
      const fits = best.min <= +answer.cas;
      const why = best.tag + (fits ? '.' : '. Trvá ' + best.min + ' minút, takže si treba vyhradiť o niečo viac času.');
      res.hidden = false;
      res.innerHTML = '<span class="r-lbl">Odporúčame</span>'
        + '<p class="r-name">' + best.name + '</p>'
        + '<p class="r-meta"><span>' + best.dur + '</span><b>' + best.price + '</b></p>'
        + '<p class="r-why">' + why + '</p>'
        + '<div class="r-cta"><a class="btn primary small" href="#rezervacia" data-book="' + best.id + '">Rezervovať</a>'
        + '<a class="btn ghost small" href="#' + best.id + '" data-jump="' + best.id + '">Pozrieť rituál</a></div>'
        + (second ? '<p class="r-alt">Alebo <a href="#' + second.id + '" data-jump="' + second.id + '">' + second.name + '</a>, ' + second.dur + ' · ' + second.price + '.</p>' : '');
      const go = $('.btn.primary', res); if (typeof toBooking === 'function') toBooking(go);
      track('advisor_result', { ritual: best.id, kto: answer.kto, cas: answer.cas, ciel: answer.ciel });
    }
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.adv-opts .chip');
      if (b) {
        const q = b.closest('.adv-q').dataset.q;
        $$('.chip', b.parentElement).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        answer[q] = b.dataset.v; show(); return;
      }
      const j = e.target.closest('[data-jump]');
      if (j) {
        const card = document.getElementById(j.dataset.jump);
        if (card) { $$('.card.pick').forEach((c) => c.classList.remove('pick')); card.classList.add('pick'); setTimeout(() => card.classList.remove('pick'), 3000); }
      }
    });
  });

  idle(function rezervacia() {
    const rform = $('#rform');
    if (rform) {
      const sel = $('#r-ritual'), rHint = $('#r-ritual-hint'), osobyWrap = $('#r-osoby-wrap'), osobyHint = $('#r-osoby-hint');
      const datum = $('#r-datum'), datumHint = $('#r-datum-hint'), casBox = $('#r-cas'), casHint = $('#r-cas-hint');
      const presnyWrap = $('#r-presny'), presny = $('#r-cas-presny'), presnyHint = $('#r-presny-hint');
      const nahradny = $('#r-nahradny'), datum2 = $('#r-datum2'), cas2Box = $('#r-cas2');
      const meno = $('#r-meno'), tel = $('#r-tel'), email = $('#r-email'), poukaz = $('#r-poukaz'), pozn = $('#r-pozn'), poznHint = $('#r-pozn-hint');
      const err = $('.err', rform), wa = $('#r-wa'), sent = $('#r-sent'), sentText = $('#r-sent-text'), copyBtn = $('#r-copy'), copyText = $('#r-copytext'), sms = $('#r-sms');
      const tVal = $('#rt-val'), tFor = $('#rt-for'), tWhen = $('#rt-when'), confirmEl = $('#r-confirm');
      const HOURS = { 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [9, 15] };
      const DAYS = ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota'];
      const WINDOW = { any: 'kedykoľvek', am: 'dopoludnia (9 až 12)', pm: 'popoludní (12 až 16)', eve: 'podvečer (16 až 18)' };
      const WINDOW_SAT = { any: 'kedykoľvek', am: 'dopoludnia (9 až 12)', pm: 'popoludní (12 až 15)' };
      const NOTE_PH = { kids: 'Vek dieťaťa a čo má rado.', couple: 'Meno druhej osoby, alergie, darček.', deep: 'Čo ťa na pokožke hlavy trápi.', base: 'napr. citlivá pokožka, tehotenstvo, alergia, darček' };
      const pad = (n) => String(n).padStart(2, '0');
      const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
      const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const parse = (v) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return null; const [y, m, d] = v.split('-').map(Number); const dt = new Date(y, m - 1, d); return isNaN(dt) || dt.getDate() !== d ? null : dt; };
      const fmt = (d) => `${DAYS[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
      const hm = (h) => `${pad(Math.floor(h))}:${pad(Math.round((h - Math.floor(h)) * 60))}`;
      const val = (name) => (rform.querySelector(`input[name="${name}"]:checked`) || {}).value || 'any';
      const setVal = (name, v) => { const i = rform.querySelector(`input[name="${name}"][value="${v}"]`); if (i) i.checked = true; };
      const ritual = () => { const o = sel.options[sel.selectedIndex]; return o && o.value ? { slug: o.value, name: o.dataset.name, min: +o.dataset.min, price: o.dataset.price, cat: o.dataset.cat } : null; };
      const isCouple = () => { const r = ritual(); return !!r && r.cat === 'couple'; };
      const persons = () => (isCouple() ? 2 : +val('osoby'));
      const duration = () => { const r = ritual(); return r ? r.min * (isCouple() ? 1 : persons()) : 0; };
      const lastStart = (d) => { const h = HOURS[d.getDay()]; return h ? h[1] - duration() / 60 : null; };
      const REF = 'HS30-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const t0 = today(), tMax = new Date(t0); tMax.setDate(tMax.getDate() + 180);
      [datum, datum2].forEach((i) => { i.min = iso(t0); i.max = iso(tMax); });
      let message = '', shortMessage = '', opened = 0, dayNote = '', dayNoteUntil = 0;
      const note = (t) => { dayNote = t; dayNoteUntil = Date.now() + 6000; };

      // ---- slová pre dni a pre vetu o potvrdení (dynamické, preto nie v i18n súboroch)
      const DAY_WORDS = {
        sk: { today: 'Dnes', tomorrow: 'Zajtra', d: ['ne', 'po', 'ut', 'st', 'št', 'pi', 'so'] },
        cs: { today: 'Dnes', tomorrow: 'Zítra', d: ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'] },
        pl: { today: 'Dziś', tomorrow: 'Jutro', d: ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'] },
        hu: { today: 'Ma', tomorrow: 'Holnap', d: ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'] },
        de: { today: 'Heute', tomorrow: 'Morgen', d: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] },
        uk: { today: 'Сьогодні', tomorrow: 'Завтра', d: ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'] },
        en: { today: 'Today', tomorrow: 'Tomorrow', d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
      };
      const CONFIRM_WORDS = {
        sk: { open: 'Sme otvorení. Ozveme sa ti dnes, zvyčajne do pár hodín.', soon: 'Dnes otvárame o {t}, vtedy ti napíšeme.', shut: 'Teraz máme zatvorené. Ozveme sa ti {d} po {t}.', tomorrow: 'zajtra', days: ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'] },
        cs: { open: 'Máme otevřeno. Ozveme se ti dnes, obvykle do pár hodin.', soon: 'Dnes otevíráme v {t}, tehdy ti napíšeme.', shut: 'Teď máme zavřeno. Ozveme se ti {d} po {t}.', tomorrow: 'zítra', days: ['v neděli', 'v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu'] },
        pl: { open: 'Jesteśmy otwarci. Odezwiemy się dziś, zwykle w ciągu kilku godzin.', soon: 'Dziś otwieramy o {t}, wtedy napiszemy.', shut: 'Teraz jest zamknięte. Odezwiemy się {d} po {t}.', tomorrow: 'jutro', days: ['w niedzielę', 'w poniedziałek', 'we wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę'] },
        hu: { open: 'Nyitva vagyunk. Ma jelentkezünk, általában pár órán belül.', soon: 'Ma {t}-kor nyitunk, akkor írunk.', shut: 'Most zárva vagyunk. {d} {t} után jelentkezünk.', tomorrow: 'holnap', days: ['vasárnap', 'hétfőn', 'kedden', 'szerdán', 'csütörtökön', 'pénteken', 'szombaton'] },
        de: { open: 'Wir haben geöffnet. Wir melden uns heute, meist innerhalb weniger Stunden.', soon: 'Wir öffnen heute um {t} und melden uns dann.', shut: 'Gerade ist geschlossen. Wir melden uns {d} nach {t}.', tomorrow: 'morgen', days: ['am Sonntag', 'am Montag', 'am Dienstag', 'am Mittwoch', 'am Donnerstag', 'am Freitag', 'am Samstag'] },
        uk: { open: 'Ми відчинені. Відповімо сьогодні, зазвичай за кілька годин.', soon: 'Сьогодні відчиняємо о {t}, тоді й напишемо.', shut: 'Зараз зачинено. Відповімо {d} після {t}.', tomorrow: 'завтра', days: ['у неділю', 'у понеділок', 'у вівторок', 'у середу', 'у четвер', 'у п\'ятницю', 'у суботу'] },
        en: { open: 'We are open. We will get back to you today, usually within a few hours.', soon: 'We open today at {t} and will write to you then.', shut: 'We are closed right now. We will get back to you {d} after {t}.', tomorrow: 'tomorrow', days: ['on Sunday', 'on Monday', 'on Tuesday', 'on Wednesday', 'on Thursday', 'on Friday', 'on Saturday'] },
      };
      const lang = () => (document.documentElement.lang || 'sk').slice(0, 2);
      const words = (map) => map[lang()] || map.sk;

      // ---- deň sa vyberá ťuknutím: desať najbližších otvorených dní
      const dniBox = $('#r-dni'), inyBtn = $('#r-iny'), datumWrap = $('#r-datum-wrap');
      function buildDays() {
        const W = words(DAY_WORDS), list = [], d = new Date(t0);
        while (list.length < 10) { if (HOURS[d.getDay()]) list.push(new Date(d)); d.setDate(d.getDate() + 1); }
        dniBox.innerHTML = list.map((dt) => {
          const diff = Math.round((dt - t0) / 86400000);
          const top = diff === 0 ? W.today : diff === 1 ? W.tomorrow : W.d[dt.getDay()];
          return `<label class="day"><input type="radio" name="den" value="${iso(dt)}"><span><b>${top}</b><i>${dt.getDate()}. ${dt.getMonth() + 1}.</i></span></label>`;
        }).join('');
        syncDays();
      }
      // chip zapnutý podľa dátumu; dnešok zhasne, keď už rituál nestihneme
      function syncDays() {
        const v = datum.value, now = new Date();
        $$('input[name="den"]', dniBox).forEach((i) => {
          i.checked = i.value === v;
          const d = parse(i.value), late = d && d.getTime() === t0.getTime() && ritual() && now.getHours() + now.getMinutes() / 60 > lastStart(d);
          i.disabled = !!late; i.closest('.day').classList.toggle('off', !!late);
          if (late && i.checked) { i.checked = false; datum.value = ''; note('Dnes už tento rituál nestihneme, vyber ďalší deň alebo nám zavolaj.'); }
        });
        const known = !!v && $$('input[name="den"]', dniBox).some((i) => i.value === v);
        if (v && !known && datumWrap.hidden) openIny(true);
      }
      function openIny(open) { datumWrap.hidden = !open; inyBtn.setAttribute('aria-expanded', String(open)); }
      dniBox.addEventListener('change', (e) => {
        const i = e.target.closest('input[name="den"]'); if (!i) return;
        datum.value = i.value; openIny(false); refresh();
      });
      inyBtn.addEventListener('click', () => {
        const open = datumWrap.hidden; openIny(open);
        if (open) datum.focus({ preventScroll: true }); else { datum.value = ''; refresh(); }
      });

      // ---- kedy sa ozveme, podľa skutočných otváracích hodín
      // čas salónu, nie čas návštevníkovho telefónu
      function salonNow() {
        try {
          const parts = new Intl.DateTimeFormat('sk-SK', { timeZone: 'Europe/Bratislava', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
          const get = (t) => (parts.find((x) => x.type === t) || {}).value;
          const map = { ne: 0, po: 1, ut: 2, st: 3, št: 4, pi: 5, so: 6 };
          const wd = map[(get('weekday') || '').toLowerCase().replace('.', '').slice(0, 2)];
          const cur = (+get('hour') % 24) + (+get('minute') || 0) / 60;
          if (wd !== undefined && !isNaN(cur)) return { wd, cur };
        } catch (e) { /* staršie prehliadače: použijeme lokálny čas */ }
        const d = new Date(); return { wd: d.getDay(), cur: d.getHours() + d.getMinutes() / 60 };
      }
      function confirmText() {
        const W = words(CONFIRM_WORDS), now = salonNow(), h = HOURS[now.wd], cur = now.cur;
        if (h && cur >= h[0] && cur < h[1]) return { text: W.open, open: true };
        if (h && cur < h[0]) return { text: W.soon.replace('{t}', hm(h[0])), open: false };
        let d = (now.wd + 1) % 7, n = 1;
        while (!HOURS[d]) { d = (d + 1) % 7; n++; }
        return { text: W.shut.replace('{d}', n === 1 ? W.tomorrow : W.days[d]).replace('{t}', hm(HOURS[d][0])), open: false };
      }

      // ---- rozpísaný formulár prežije obnovenie stránky (24 hodín, len v prehliadači)
      const DRAFT = 'hs30-rezervacia';
      const FIELDS = ['r-ritual', 'r-datum', 'r-cas-presny', 'r-datum2', 'r-meno', 'r-tel', 'r-email', 'r-poukaz', 'r-pozn'];
      function saveDraft() {
        try {
          const v = {}; FIELDS.forEach((id) => { const el = $('#' + id); if (el && el.value) v[id] = el.value; });
          ['osoby', 'cas', 'cas2'].forEach((n) => { v[n] = val(n); });
          localStorage.setItem(DRAFT, JSON.stringify({ t: Date.now(), v }));
        } catch (e) { /* súkromný režim: koncept sa jednoducho neuloží */ }
      }
      function loadDraft() {
        let d; try { d = JSON.parse(localStorage.getItem(DRAFT) || 'null'); } catch (e) { return; }
        if (!d || !d.v || Date.now() - d.t > 864e5) return;
        const v = d.v;
        FIELDS.forEach((id) => { const el = $('#' + id); if (el && v[id]) el.value = v[id]; });
        ['osoby', 'cas', 'cas2'].forEach((n) => { if (v[n]) setVal(n, v[n]); });
        const dd = parse(datum.value); if (!dd || dd < t0) datum.value = '';
        if (v['r-cas-presny']) { presnyWrap.hidden = false; const b = rform.querySelector('[data-more="r-presny"]'); if (b) b.setAttribute('aria-expanded', 'true'); }
        if (v['r-datum2']) { nahradny.hidden = false; const b = rform.querySelector('[data-more="r-nahradny"]'); if (b) b.setAttribute('aria-expanded', 'true'); }
        if (v['r-poukaz']) { $('#r-poukaz-wrap').hidden = false; const b = rform.querySelector('[data-more="r-poukaz-wrap"]'); if (b) b.setAttribute('aria-expanded', 'true'); }
      }
      const clearDraft = () => { try { localStorage.removeItem(DRAFT); } catch (e) { /* nič */ } };

      // ---- pick a ritual from a card: same slug on the card and the option
      function selectRitual(slug, flash) {
        if (!rform.querySelector(`option[value="${slug}"]`)) return false;
        sel.value = slug; refresh();
        if (flash && !reduced.matches) { sel.classList.remove('flash'); void sel.offsetWidth; sel.classList.add('flash'); }
        return true;
      }
      document.addEventListener('click', (e) => {
        const a = e.target.closest('[data-book]'); if (!a) return;
        selectRitual(a.dataset.book, true);
        track('reservation_open', { ritual: a.dataset.book });
      });
      const fromUrl = new URLSearchParams(location.search).get('ritual');
      if (fromUrl) selectRitual(fromUrl, false);

      // ---- "more" toggles: exact time, alternative date, voucher code
      $$('[data-more]', rform).forEach((b) => b.addEventListener('click', () => {
        const box = $('#' + b.dataset.more); const open = box.hidden;
        box.hidden = !open; b.setAttribute('aria-expanded', String(open));
        if (!open) { $$('input,textarea', box).forEach((i) => { if (i.type === 'radio') { if (i.value === 'any') i.checked = true; } else i.value = ''; }); }
        else { const f = $('input,select,textarea', box); if (f) f.focus({ preventScroll: true }); }
        refresh();
      }));

      // ---- time windows: a chip is out when its window starts after the last possible start
      function tuneWindows(box, d) {
        const sat = d && d.getDay() === 6, last = d ? lastStart(d) : null;
        $$('input', box).forEach((i) => {
          const from = +i.dataset.from || 0, labels = sat ? WINDOW_SAT : WINDOW;
          const out = i.value !== 'any' && (!(i.value in labels) || (last !== null && from >= last));
          i.disabled = out; i.closest('.choice').hidden = i.value !== 'any' && !(i.value in labels);
          if (i.nextElementSibling) i.nextElementSibling.textContent = (labels[i.value] || WINDOW[i.value]).replace(/^./, (c) => c.toUpperCase()).replace(/ \(.*\)$/, '');
          if (out && i.checked) { setVal(i.name, 'any'); }
        });
      }
      const windowText = (v, d) => ((d && d.getDay() === 6 ? WINDOW_SAT : WINDOW)[v] || WINDOW.any);

      // ---- everything derived from the form, recomputed on every change
      function refresh() {
        const r = ritual(), d = parse(datum.value), d2 = parse(datum2.value), n = persons();
        // ritual hint, persons, note placeholder
        if (r) {
          const base = `Vybraný rituál: ${r.name}, ${r.min} min`;
          rHint.textContent = r.cat === 'couple' ? `${base}. Cena ${r.price} platí za obe osoby. Ležíte vedľa seba, rozprávať sa nemusíte. Meno druhej osoby napíš do poznámky.`
            : r.cat === 'kids' ? `${base}, ${r.price}. Rodič môže zostať v miestnosti po celý čas, vek dieťaťa napíš do poznámky.`
            : `${base}, ${r.price}.`;
        } else rHint.textContent = 'Vyber rituál zo zoznamu alebo ťukni na Rezervovať pri rituáli v cenníku.';
        $('.choices', osobyWrap).hidden = !!r && r.cat === 'couple'; osobyHint.hidden = !(r && r.cat === 'couple');
        pozn.placeholder = r ? (NOTE_PH[r.cat] || (/hĺbkov/i.test(r.name) ? NOTE_PH.deep : NOTE_PH.base)) : NOTE_PH.base;
        poznHint.hidden = !(r && r.cat === 'kids' && !pozn.value.trim());
        if (!poznHint.hidden) poznHint.textContent = 'Napíš prosím vek dieťaťa, pomôže nám pripraviť rituál.';
        // day and windows
        tuneWindows(casBox, d); tuneWindows(cas2Box, d2);
        const last = d ? lastStart(d) : null;
        if (d && d.getDay() === 6 && r && last !== null && last < 15) casHint.textContent = `V sobotu máme do 15:00. Tento rituál trvá ${duration()} min, preto je posledný začiatok o ${hm(last)}.`;
        else if (d && r && last !== null && last < HOURS[d.getDay()][1]) casHint.textContent = `Tento rituál trvá ${duration()} min, posledný začiatok je o ${hm(last)}.`;
        else casHint.textContent = '';
        const now = new Date(), openNow = HOURS[now.getDay()] && now.getHours() + now.getMinutes() / 60 >= HOURS[now.getDay()][0] && now.getHours() + now.getMinutes() / 60 < HOURS[now.getDay()][1];
        datumHint.textContent = (dayNote && Date.now() < dayNoteUntil ? dayNote : '') || (d && d.getTime() === t0.getTime() && openNow ? 'Na dnes ti termín potvrdíme rýchlejšie telefonicky: 0911 153 136.' : 'Po až Pi 9:00 až 18:00, So 9:00 až 15:00, v nedeľu máme zatvorené.');
        // exact time bounds
        if (d && last !== null) { presny.max = hm(Math.max(9, last)); presnyHint.textContent = r ? `Tento rituál trvá ${duration()} min, posledný začiatok je o ${hm(last)}.` : ''; }
        else { presny.removeAttribute('max'); presnyHint.textContent = ''; }
        // the message
        const lines = ['Dobrý deň, chcem si rezervovať termín v HEAD SPA 30.', ''];
        lines.push(r ? `Rituál: ${r.name} (${r.min} min, ${r.cat === 'couple' ? `2 osoby, ${r.price} za obe osoby` : r.price})` : 'Rituál: (nevybraný)');
        let when = '';
        if (d) {
          const isToday = d.getTime() === t0.getTime();
          if (presny.value && !presnyWrap.hidden) { const [hh, mm] = presny.value.split(':').map(Number); const end = hh + mm / 60 + duration() / 60; when = `${isToday ? 'DNES ' : ''}${fmt(d)} o ${presny.value} (koniec cca ${hm(end)})`; }
          else when = `${isToday ? 'DNES ' : ''}${fmt(d)}, ${windowText(val('cas'), d)}`;
        }
        lines.push(`Termín: ${when || '(nevybraný)'}`);
        if (d2 && !nahradny.hidden) lines.push(`Náhradný termín: ${fmt(d2)}, ${windowText(val('cas2'), d2)}`);
        if (r && r.cat !== 'couple' && n === 2) lines.push('Osoby: 2, každý svoj rituál');
        lines.push(`Meno: ${meno.value.trim() || '(nevyplnené)'}`, `Telefón: ${tel.value.trim() || '(nevyplnený)'}`);
        if (email.value.trim()) lines.push(`E-mail: ${email.value.trim()}`);
        if (poukaz.value.trim() && !$('#r-poukaz-wrap').hidden) lines.push(`Kód poukazu: ${poukaz.value.trim().toUpperCase().replace(/\s+/g, '')}`);
        if (pozn.value.trim()) lines.push(`Poznámka: ${pozn.value.trim()}`);
        lines.push('', 'Prosím o potvrdenie termínu. Ďakujem.', `Ref: ${REF}`);
        message = lines.join('\n');
        shortMessage = `Rezervácia HEAD SPA 30: ${r ? `${r.name} (${r.min} min)` : 'rituál'}, ${when || 'termín'}. ${meno.value.trim()}, ${tel.value.trim()}. Ref ${REF}. Prosím o potvrdenie.`;
        wa.href = `https://wa.me/421911153136?text=${encodeURIComponent(message)}`;
        sms.href = `sms:+421911153136?&body=${encodeURIComponent(shortMessage)}`;
        // the ticket
        tVal.textContent = r ? r.name : 'Tvoja rezervácia'; tVal.classList.toggle('long', !r || r.name.length > 12);
        tFor.textContent = r ? `${r.min} min · ${r.price}${r.cat === 'couple' ? ' za obe osoby' : n === 2 ? ' · 2 osoby' : ''}` : 'Vyber si rituál z cenníka alebo zo zoznamu.';
        tWhen.textContent = when || 'Mostná 30 · termín potvrdíme správou';
        // deň, kedy sa ozveme, a koncept
        syncDays();
        if (confirmEl) { const c = confirmText(); confirmEl.textContent = c.text; confirmEl.classList.toggle('shut', !c.open); }
        saveDraft();
      }

      // ---- validation: one list of plain sentences, focus on the first wrong field
      function validate() {
        const problems = []; let first = null;
        const bad = (el, msg) => { problems.push(msg); const f = el.closest('.field'); if (f) f.classList.add('invalid'); el.setAttribute('aria-invalid', 'true'); if (!first) first = el; };
        $$('.field.invalid', rform).forEach((f) => f.classList.remove('invalid')); $$('[aria-invalid]', rform).forEach((i) => i.removeAttribute('aria-invalid'));
        const r = ritual(); if (!r) bad(sel, 'Vyber rituál zo zoznamu.');
        const d = parse(datum.value);
        if (!datum.value) bad(datum, 'Vyber deň, kedy chceš prísť.');
        else if (!d || d < t0) bad(datum, 'Tento deň už prešiel, vyber iný.');
        else if (d > tMax) bad(datum, 'Tak ďaleko kalendár ešte neotvárame, vyber termín do pol roka.');
        else if (d.getDay() === 0) bad(datum, 'V nedeľu máme zatvorené, vyber iný deň.');
        else if (d.getTime() === t0.getTime() && r) { const now = new Date(); if (now.getHours() + now.getMinutes() / 60 > lastStart(d)) bad(datum, 'Dnes už nestíhame, vyber ďalší deň alebo nám zavolaj.'); }
        if (d && r && presny.value && !presnyWrap.hidden) { const [hh, mm] = presny.value.split(':').map(Number), t = hh + mm / 60, last = lastStart(d); if (t < 9 || t > last) bad(presny, `Tento rituál trvá ${duration()} min, posledný začiatok je o ${hm(last)}.`); }
        if (!nahradny.hidden && datum2.value) {
          const d2 = parse(datum2.value);
          if (!d2 || d2 < t0) bad(datum2, 'Náhradný deň už prešiel, vyber iný.');
          else if (d2 > tMax) bad(datum2, 'Náhradný termín je príliš ďaleko, vyber termín do pol roka.');
          else if (d2.getDay() === 0) bad(datum2, 'V nedeľu máme zatvorené, vyber iný náhradný deň.');
          else if (d && d2.getTime() === d.getTime() && val('cas2') === val('cas')) bad(datum2, 'Náhradný termín je rovnaký ako hlavný, vyber iný deň alebo čas.');
        }
        if (meno.value.trim().length < 2) bad(meno, 'Napíš svoje meno.');
        const digits = tel.value.replace(/[\s\-().]/g, '');
        if (!/^\+?\d{9,15}$/.test(digits)) bad(tel, 'Napíš telefón, na ktorom ťa zastihneme, napr. 0900 123 456.');
        if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) bad(email, 'E-mail nevyzerá správne, oprav ho alebo ho nechaj prázdny.');
        if (message.length > 1500) bad(pozn, 'Skráť prosím poznámku.');
        if (problems.length) {
          err.hidden = false; err.innerHTML = problems.length === 1 ? problems[0] : 'Ešte doplň:<ul>' + problems.map((p) => `<li>${p}</li>`).join('') + '</ul>';
          if (first) first.focus({ preventScroll: false });
          return false;
        }
        err.hidden = true; return true;
      }

      // ---- sending: WhatsApp is a real link (a native gesture), e-mail is the submit; both share the validation
      function showSent(kind) {
        const r = ritual(), d = parse(datum.value);
        const what = r && d ? ` ${r.name}, ${fmt(d)}${presny.value && !presnyWrap.hidden ? ' o ' + presny.value : ', ' + windowText(val('cas'), d)}.` : '';
        sentText.textContent = kind === 'wa' ? `Otvorili sme WhatsApp s tvojou požiadavkou, stačí ju odoslať.${what} Termín ti potvrdíme do 24 hodín. Ak sa WhatsApp neotvoril:`
          : kind === 'mail' ? `Otvorili sme e-mail pre info@salon30.sk s tvojou požiadavkou, stačí ho odoslať.${what} Termín ti potvrdíme do 24 hodín. Ak sa nič neotvorilo:`
          : `Vyzerá to, že tento prehliadač nemá nastavený e-mail. Skopíruj správu a pošli ju cez WhatsApp na 0911 153 136, alebo nám zavolaj. Termín ti potvrdíme rovnako rýchlo.`;
        sent.hidden = false; copyText.value = message;
        sms.hidden = !matchMedia('(pointer: coarse)').matches;
        opened += 1;
        if (opened > 1) { sentText.textContent += ' Správu si už raz otvoril. Ak ju vo WhatsApp nevidíš, pošli ju e-mailom alebo si ju skopíruj.'; }
      }
      wa.addEventListener('click', (e) => {
        refresh();
        if (!validate()) { e.preventDefault(); return; }
        track('reservation_send', { channel: 'whatsapp', ritual: ritual().slug });
        showSent('wa'); clearDraft();
      });
      rform.addEventListener('submit', (e) => {
        e.preventDefault(); refresh();
        if (!validate()) return;
        const r = ritual(), d = parse(datum.value);
        const subject = `Rezervácia: ${r.name}, ${fmt(d)}, ${meno.value.trim()}`.replace(/[&#?]/g, ' ');
        track('reservation_send', { channel: 'email', ritual: r.slug });
        let left = false; const mark = () => { left = true; };
        addEventListener('blur', mark, { once: true }); document.addEventListener('visibilitychange', mark, { once: true });
        showSent('mail'); clearDraft();
        location.href = `mailto:info@salon30.sk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        setTimeout(() => { removeEventListener('blur', mark); document.removeEventListener('visibilitychange', mark); if (!left && !document.hidden) showSent('fail'); }, 1500);
      });
      copyBtn.addEventListener('click', async () => {
        let ok = false;
        try { await navigator.clipboard.writeText(message); ok = true; } catch (e) { try { copyText.classList.remove('vh'); copyText.select(); ok = document.execCommand('copy'); copyText.classList.add('vh'); } catch (e2) { ok = false; } }
        const old = copyBtn.textContent; copyBtn.textContent = ok ? 'Skopírované' : 'Nepodarilo sa, označ text ručne';
        if (!ok) { copyText.classList.remove('vh'); copyText.removeAttribute('aria-hidden'); copyText.removeAttribute('tabindex'); copyText.rows = 8; copyText.focus(); copyText.select(); }
        setTimeout(() => { copyBtn.textContent = old; }, 2200);
      });
      rform.addEventListener('input', refresh); rform.addEventListener('change', refresh);
      document.addEventListener('langchange', () => { buildDays(); refresh(); });
      datum.addEventListener('change', () => { const d = parse(datum.value); if (d && d.getDay() === 0) { const m = new Date(d); m.setDate(m.getDate() + 1); datum.value = iso(m); note('V nedeľu máme zatvorené, posunuli sme ti deň na pondelok.'); refresh(); } });
      buildDays(); loadDraft(); refresh();
    }
  });

  /* ============ analytics hooks (dataLayer only; nothing is sent anywhere) ============ */
  function track(event, data) { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event, site: 'headspa30' }, data || {})); }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a'); if (!a) return;
    const h = a.getAttribute('href') || '';
    if (h.includes('/rezervacia')) track('reservation_click', { label: a.textContent.trim() });
    else if (h.startsWith('tel:')) track('phone_click');
    else if (h.startsWith('mailto:')) track('email_click');
    else if (h.includes('google.com/maps')) track('map_click');
  });

  /* ============ mobile menu (native dialog: focus trap and Escape for free) ============ */
  const menu = $('#drawer'), menuBtn = $('.menu-btn');
  if (menu && menuBtn) {
    $$('.drawer-links a', menu).forEach((a, i) => a.style.setProperty('--i', i));
    const openMenu = () => { if (menu.open) return; menu.showModal(); document.body.classList.add('drawer-open'); menuBtn.setAttribute('aria-expanded', 'true'); track('menu_open'); };
    const closeMenu = () => { if (!menu.open) return; menu.close(); };
    menuBtn.addEventListener('click', () => (menu.open ? closeMenu() : openMenu()));
    $('.drawer-close', menu).addEventListener('click', closeMenu);
    menu.addEventListener('click', (e) => { if (e.target === menu) closeMenu(); });
    menu.addEventListener('close', () => { document.body.classList.remove('drawer-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus({ preventScroll: true }); });
    $$('a[href^="#"]', menu).forEach((a) => a.addEventListener('click', () => { closeMenu(); }));
    matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) closeMenu(); });
  }

  /* ============ today's hours, computed in the salon's own time zone ============ */
  /* Tento text vzniká až v prehliadači, preto má vlastné preklady, nie je v assets/i18n. */
  const TODAY_WORDS = {
    sk: { open: 'Dnes otvorené do', soon: 'Dnes otvárame o', shut: 'Dnes už zatvorené', none: 'Dnes máme zatvorené',
          next: 'otvárame', at: 'o', tomorrow: 'zajtra',
          days: ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'] },
    cs: { open: 'Dnes otevřeno do', soon: 'Dnes otevíráme v', shut: 'Dnes už zavřeno', none: 'Dnes máme zavřeno',
          next: 'otevíráme', at: 'v', tomorrow: 'zítra',
          days: ['v neděli', 'v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu'] },
    pl: { open: 'Dziś otwarte do', soon: 'Dziś otwieramy o', shut: 'Dziś już zamknięte', none: 'Dziś mamy zamknięte',
          next: 'otwieramy', at: 'o', tomorrow: 'jutro',
          days: ['w niedzielę', 'w poniedziałek', 'we wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę'] },
    hu: { open: 'Ma nyitva eddig:', soon: 'Ma nyitunk ekkor:', shut: 'Ma már zárva', none: 'Ma zárva vagyunk',
          next: 'nyitás', at: '', tomorrow: 'holnap',
          days: ['vasárnap', 'hétfőn', 'kedden', 'szerdán', 'csütörtökön', 'pénteken', 'szombaton'] },
    de: { open: 'Heute geöffnet bis', soon: 'Heute öffnen wir um', shut: 'Heute schon geschlossen', none: 'Heute haben wir geschlossen',
          next: 'wir öffnen', at: 'um', tomorrow: 'morgen',
          days: ['am Sonntag', 'am Montag', 'am Dienstag', 'am Mittwoch', 'am Donnerstag', 'am Freitag', 'am Samstag'] },
    uk: { open: 'Сьогодні відчинено до', soon: 'Сьогодні відчиняємо о', shut: 'Сьогодні вже зачинено', none: 'Сьогодні зачинено',
          next: 'відчиняємо', at: 'о', tomorrow: 'завтра',
          days: ['у неділю', 'у понеділок', 'у вівторок', 'у середу', 'у четвер', 'у п\'ятницю', 'у суботу'] },
    en: { open: 'Open today until', soon: 'We open today at', shut: 'Closed for today', none: 'We are closed today',
          next: 'we open', at: 'at', tomorrow: 'tomorrow',
          days: ['on Sunday', 'on Monday', 'on Tuesday', 'on Wednesday', 'on Thursday', 'on Friday', 'on Saturday'] },
  };
  (function todayStatus() {
    const els = $$('[data-today]'); if (!els.length) return;
    const HOURS = { 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [9, 15], 0: null };
    function render(lang) {
      const W = TODAY_WORDS[lang] || TODAY_WORDS.sk;
      let parts;
      try { parts = new Intl.DateTimeFormat('sk-SK', { timeZone: 'Europe/Bratislava', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()); } catch (e) { return; }
      const get = (t) => (parts.find((p) => p.type === t) || {}).value;
      const wdMap = { ne: 0, po: 1, ut: 2, st: 3, št: 4, pi: 5, so: 6 };
      const wd = wdMap[(get('weekday') || '').toLowerCase().replace('.', '').slice(0, 2)];
      const now = (+get('hour') % 24) + (+get('minute') || 0) / 60;
      if (wd === undefined || isNaN(now)) return;
      const h = HOURS[wd]; const hm = (x) => `${String(Math.floor(x)).padStart(2, '0')}:${String(Math.round((x % 1) * 60)).padStart(2, '0')}`;
      let text, open = false;
      if (h && now >= h[0] && now < h[1]) { open = true; text = `${W.open} ${hm(h[1])}`; }
      else if (h && now < h[0]) text = `${W.soon} ${hm(h[0])}`;
      else {
        let d = (wd + 1) % 7, n = 1; while (!HOURS[d]) { d = (d + 1) % 7; n++; }
        const when = n === 1 ? W.tomorrow : W.days[d];
        // a day we never opened reads differently from a day that has just ended
        text = `${h ? W.shut : W.none}, ${W.next} ${when} ${W.at ? W.at + ' ' : ''}${hm(HOURS[d][0])}`;
      }
      els.forEach((el) => { el.innerHTML = `<span class="dot" aria-hidden="true"></span>${text}`; el.classList.toggle('closed', !open); });
    }
    render((document.documentElement.lang || 'sk').slice(0, 2));
    document.addEventListener('langchange', (e) => render(e.detail.lang));
  })();

  /* ============ housekeeping ============ */
  document.addEventListener('visibilitychange', () => { document.body.classList.toggle('paused', document.hidden); if (!document.hidden) wake(); });
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* scéna hero sekcie sa zapne až keď má prehliadač voľnú chvíľu, prvé vykreslenie textu tak nič nebrzdí */
  let heroStarted = false;
  function heroStart() {
    if (heroStarted) return;
    // počas dverí patrí hlavné vlákno dverám; scéna štartuje hneď po nich (aj keď návštevník medzitým skroluje)
    if (phoneMQ.matches && document.body.classList.contains('veiling')) { addEventListener('hs30veilend', heroStart, { once: true }); return; }
    heroStarted = true; applyHeroMode();
  }
  /* Na telefóne je plátno úvodu čistá ozdoba, preto sa zapne až keď návštevník
     skroluje alebo sa dotkne obrazovky. Na počítači stačí voľná chvíľa. */
  if ('requestIdleCallback' in window) requestIdleCallback(heroStart, { timeout: 2500 }); else setTimeout(heroStart, 400);
  addEventListener('scroll', heroStart, { once: true, passive: true });
  addEventListener('pointerdown', heroStart, { once: true, passive: true });
  addEventListener('keydown', heroStart, { once: true });
  if (reduced.matches) pinToFinalStates();
  wake();
  void document.body.offsetWidth;   // settle the initial styles first
  requestAnimationFrame(() => {
    document.body.classList.add('ready', 'open');
    if (veilMs) {
      veil.classList.add('drawn');
      // koniec až po dobehnutí prelínania scény (opacity na .scene, nie na krídlach), časovač je poistka pre pomalý telefón
      const sc = $('.scene', veil);
      if (sc) sc.addEventListener('transitionend', (e) => { if (e.target === sc && e.propertyName === 'opacity') endVeil(); });
      // krídla sa otvoria, až keď je fotka dverí pripravená (najviac o 0,9 s neskôr, potom aj bez nej)
      const im = $('.leaf img', veil);
      const ready = im && !(im.complete && im.naturalWidth) && im.decode
        ? Promise.race([im.decode().catch(() => {}), new Promise((r) => setTimeout(r, 900))]) : Promise.resolve();
      ready.then(() => {
        setTimeout(flipVeil, phoneMQ.matches ? 520 : 380);   // na telefóne dvere chvíľu postoja
        setTimeout(endVeil, 2200);
      });
    }
  });

  /* Späť hore: objaví sa po dvoch obrazovkách, na mobile nad lištou s CTA. */
  idle(function spatHore() {
    const btn = document.getElementById('toTop');
    const mbtn = document.getElementById('mbarTop');
    const hore = () => {
      const jemne = matchMedia('(prefers-reduced-motion: reduce)').matches;
      scrollTo({ top: 0, behavior: jemne ? 'auto' : 'smooth' });
      (document.getElementById('main') || document.body).focus({ preventScroll: true });
    };
    if (mbtn) mbtn.addEventListener('click', hore);
    if (!btn) return;
    btn.hidden = false;
    const prah = () => window.innerHeight * 2;
    let tiká = false;
    const prekresli = () => {
      tiká = false;
      btn.classList.toggle('show', window.scrollY > prah());
    };
    addEventListener('scroll', () => { if (!tiká) { tiká = true; requestAnimationFrame(prekresli); } }, { passive: true });
    prekresli();
    btn.addEventListener('click', hore);
  });

})();
