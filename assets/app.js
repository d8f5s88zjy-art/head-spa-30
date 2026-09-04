/* HEAD SPA 30. Vanilla JS, no build step. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smoothstep = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* ============ the scene (water, light, steam), drawn from progress p ============ */
  function makeScene(canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });
    let W = 0, H = 0, dpr = 1, lastP = -1;
    const R = rng(30);
    const steam = Array.from({ length: 34 }, () => ({ s: R(), x: R() * 2 - 1, r: 14 + R() * 26, w: 1 + R() * 2 }));
    const drops = Array.from({ length: 16 }, () => ({ s: R(), a: (R() * 2 - 1) * 1.1, v: .5 + R() * .7 }));
    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastP = -1;
    }
    function draw(p, force) {
      if (!W) resize();
      if (!force && Math.abs(p - lastP) < 0.0005) return;
      lastP = p;
      const cx = W > 720 ? W * 0.66 : W * 0.5;   // action lane: right third on wide screens, centre on narrow
      const basinY = W > 720 ? H * 0.80 : H * 0.6, topY = -H * 0.03;
      const land = smoothstep(p, 0.06, 0.42);     // stream length 0..1
      const after = smoothstep(p, 0.42, 0.6);      // impact aftermath
      const glow = smoothstep(p, 0.6, 1);          // the gold settle
      // room
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#111814'); bg.addColorStop(.55, '#0c110e'); bg.addColorStop(1, '#0a0d0b');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // light cone from above
      const cone = ctx.createRadialGradient(cx, -H * 0.15, 0, cx, -H * 0.15, H * 1.05);
      const ca = 0.16 + 0.12 * p;
      cone.addColorStop(0, `rgba(236,208,143,${ca})`); cone.addColorStop(.45, `rgba(217,181,106,${ca * .45})`); cone.addColorStop(1, 'rgba(217,181,106,0)');
      ctx.fillStyle = cone; ctx.fillRect(0, 0, W, H);
      // floor sheen
      const floor = ctx.createLinearGradient(0, basinY - H * .06, 0, H);
      floor.addColorStop(0, 'rgba(140,195,182,0)'); floor.addColorStop(.3, `rgba(140,195,182,${.05 + .05 * glow})`); floor.addColorStop(1, 'rgba(10,13,11,0)');
      ctx.fillStyle = floor; ctx.fillRect(0, basinY - H * .06, W, H);
      // basin
      const brx = Math.min(W * 0.2, 300), bry = brx * 0.22;
      ctx.save();
      const pool = ctx.createRadialGradient(cx, basinY, 0, cx, basinY, brx * 1.6);
      pool.addColorStop(0, `rgba(140,195,182,${.10 + .08 * glow})`); pool.addColorStop(1, 'rgba(140,195,182,0)');
      ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(cx, basinY, brx * 1.6, bry * 1.9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, basinY, brx, bry, 0, 0, Math.PI * 2);
      const bw = ctx.createRadialGradient(cx, basinY, 0, cx, basinY, brx);
      bw.addColorStop(0, `rgba(140,195,182,${.24 + .22 * glow})`); bw.addColorStop(.6, `rgba(80,130,120,${.16 + .1 * glow})`); bw.addColorStop(.92, 'rgba(30,50,45,.3)'); bw.addColorStop(1, 'rgba(30,50,45,0)');
      ctx.fillStyle = bw; ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, basinY - 1, brx * .985, bry * .985, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.strokeStyle = `rgba(217,181,106,${.14 + .26 * glow})`; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
      // ripples
      if (after > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const calm = 1 - smoothstep(p, 0.82, 1) * 0.6;
        for (let i = 0; i < 5; i++) {
          const t = ((p - 0.42) * 1.9 + i * 0.2) % 1;
          if (t < 0) continue;
          const a = (1 - t) * 0.33 * after * calm;
          ctx.beginPath(); ctx.ellipse(cx, basinY, brx * (0.08 + t * 0.95), bry * (0.08 + t * 0.95), 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(160,215,200,${a})`; ctx.lineWidth = 1.2; ctx.stroke();
        }
        ctx.restore();
      }
      // the stream
      if (land > 0) {
        const endY = topY + (basinY - topY) * land;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const sway = (y) => Math.sin(y * 0.018 + p * 5) * 3.5;
        // glow halo
        ctx.beginPath();
        for (let y = topY; y <= endY; y += 6) { const x = cx + sway(y); y === topY ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.strokeStyle = 'rgba(140,195,182,.09)'; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.stroke();
        ctx.strokeStyle = 'rgba(160,215,200,.2)'; ctx.lineWidth = 15; ctx.stroke();
        ctx.strokeStyle = 'rgba(200,232,224,.5)'; ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = 'rgba(240,248,245,.85)'; ctx.lineWidth = 2.2; ctx.stroke();
        for (let i = 0; i < 9; i++) {
          const t = (p * 2.4 + i / 9) % 1; const y = topY + (endY - topY) * t;
          if (y > endY - 8) continue;
          ctx.beginPath(); ctx.ellipse(cx + sway(y) + (i % 2 ? 2.5 : -2.5), y, 2.2, 5, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
        }
        // droplet tip while falling
        if (land < 1) {
          const tx = cx + sway(endY);
          ctx.beginPath(); ctx.ellipse(tx, endY + 6, 6, 10, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(236,245,240,.85)'; ctx.fill();
        }
        ctx.restore();
      }
      // splash
      if (after > 0 && after < 1) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const d of drops) {
          const t = clamp(after * 1.4 - d.s * 0.4, 0, 1);
          if (t <= 0 || t >= 1) continue;
          const x = cx + d.a * brx * t, y = basinY - (t * 4 * (1 - t)) * H * 0.12 * d.v;
          ctx.beginPath(); ctx.arc(x, y, 2.2 * (1 - t) + .6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(236,245,240,${.7 * (1 - t)})`; ctx.fill();
        }
        ctx.restore();
      }
      // steam
      const sv = smoothstep(p, 0.32, 0.55);
      if (sv > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const s of steam) {
          const t = (p * 1.35 + s.s) % 1;
          const y = basinY - t * H * 0.62, x = cx + s.x * brx * 0.9 + Math.sin(t * 4 + s.s * 7) * 26;
          const a = t * (1 - t) * 4 * 0.075 * sv, r = s.r * (0.6 + t * 1.6);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(230,236,230,${a})`); g.addColorStop(1, 'rgba(230,236,230,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
      // gold settle glow
      if (glow > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(cx, basinY - H * .08, 0, cx, basinY - H * .08, H * .5);
        g.addColorStop(0, `rgba(217,181,106,${.16 * glow})`); g.addColorStop(1, 'rgba(217,181,106,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      // vignette
      const v = ctx.createRadialGradient(W * .5, H * .45, H * .3, W * .5, H * .45, Math.max(W, H) * .85);
      v.addColorStop(0, 'rgba(8,10,9,0)'); v.addColorStop(1, 'rgba(8,10,9,.7)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }
    return { resize, draw };
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

  /* ============ hero scrub ============ */
  const hero = $('.hero'), stage = $('.stage'), canvas = $('#scene');
  const bands = $$('.band', stage).map((el, i) => ({
    el, a: +el.dataset.a, b: +el.dataset.b, i,
    ramp: el.dataset.ramp ? +el.dataset.ramp : null, op: -1, k: -1, on: false
  }));
  const hud = $('.hud b'), cue = $('.cue');
  let scene = null, scrubOn = false, heroOnScreen = true, inited = false;
  let target = 0, shown = 0, rafId = null, lastTick = 0, loadK = 0, loadStart = 0;
  let lastHud = '', lastHudAt = 0;

  function heroProgress() {
    const r = hero.getBoundingClientRect();
    const range = hero.offsetHeight - window.innerHeight;
    return range > 0 ? clamp(-r.top / range, 0, 1) : 0;
  }
  function updateCaptions(p, now) {
    for (const b of bands) {
      const f = Math.min(0.02, (b.b - b.a) / 3);
      let op = (b.i === 0 ? 1 : smoothstep(p, b.a, b.a + f)) * (b.i === bands.length - 1 ? 1 : 1 - smoothstep(p, b.b - f, b.b));
      const ramp = b.ramp || Math.min(0.025, (b.b - b.a) * 0.35);
      let k = clamp((p - b.a) / ramp, 0, 1);
      if (b.i === 0) k = Math.max(k, loadK);
      if (Math.abs(op - b.op) > 0.005 || (op === 0 && b.op !== 0) || (op === 1 && b.op !== 1)) { b.op = op; b.el.style.opacity = op.toFixed(3); }
      const on = op > 0.5;
      if (on !== b.on) { b.on = on; b.el.classList.toggle('on', on); }
      if (Math.abs(k - b.k) > 0.008 || (k === 1 && b.k !== 1) || (k === 0 && b.k !== 0)) { b.k = k; b.el.style.setProperty('--k', k.toFixed(3)); }
    }
    if (hud && now !== undefined) {
      if (now - lastHudAt > 100) {
        const t = String(Math.round(p * 100)).padStart(2, '0');
        if (t !== lastHud) { lastHud = t; lastHudAt = now; hud.textContent = t; }
      }
    }
    if (cue) { const show = p < 0.04; if (cue.classList.contains('show') !== show) cue.classList.toggle('show', show); }
  }
  function tick(now) {
    const dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    const k = 0.16;
    shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
    let busy = true;
    if (Math.abs(target - shown) < 0.0005) { shown = target; busy = false; }
    if (loadK < 1) { loadK = smoothstep((now - loadStart) / 1400, 0, 1); busy = true; }
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
    scene = makeScene(canvas);
    scene.resize();
    bands.forEach((b) => {
      const fx = b.el.dataset.fx;
      const spread = b.el.dataset.spread ? +b.el.dataset.spread : undefined;
      $$('[data-split]', b.el).forEach((el, j) => splitLine(el, fx === 'scatter' ? 'scatter' : 'word', 30 + b.i * 7 + j, spread));
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
      if (heroOnScreen && scrubOn) onScroll();
    }, { threshold: 0 }).observe(hero);
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { scene.resize(); if (scrubOn) scene.draw(shown, true); }, 120); }, { passive: true });
  }
  const staticCanvas = $('#scene-static');
  let staticScene = null;
  let srt;
  addEventListener('resize', () => { if (!scrubOn) { clearTimeout(srt); srt = setTimeout(drawStatic, 120); } }, { passive: true });
  function drawStatic() {
    if (!staticCanvas) return;
    if (!staticScene) staticScene = makeScene(staticCanvas);
    staticScene.resize(); staticScene.draw(1, true);
  }
  function enableScrub() {
    if (scrubOn) return; scrubOn = true;
    initHeroOnce();
    addEventListener('scroll', onScroll, { passive: true });
    bands.forEach((b) => { b.op = -1; b.k = -1; b.on = false; });
    unpinFinalStates();
    loadStart = performance.now(); loadK = 0;
    target = shown = heroProgress();
    scene.draw(shown, true);
    updateCaptions(shown, loadStart);
    onScroll();
  }
  function disableScrub() {
    if (!scrubOn) return; scrubOn = false;
    removeEventListener('scroll', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }
  const GATES = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];
  function applyHeroMode() {
    if (GATES.some((q) => matchMedia(q).matches)) { disableScrub(); drawStatic(); } else enableScrub();
  }
  const MQLS = GATES.map((q) => matchMedia(q));
  MQLS.forEach((m) => m.addEventListener('change', applyHeroMode));

  /* ============ nav ============ */
  const nav = $('.nav');
  let navSolid = false;
  function navCheck() {
    const s = scrollY > 40;
    if (s !== navSolid) { navSolid = s; nav.classList.toggle('solid', s); }
  }
  addEventListener('scroll', navCheck, { passive: true }); navCheck();

  /* ============ entrances ============ */
  const rv = $$('.rv');
  const rio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); rio.unobserve(e.target);
    setTimeout(() => e.target.classList.add('done'), 1500);
  }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  rv.forEach((el) => rio.observe(el));

  /* ============ self-drawing stream line + counters (scroll drives) ============ */
  const streamPath = $('.steps .stream .draw');
  let streamLen = 0, lastDash = -1, pinned = false;
  if (streamPath) { streamLen = streamPath.getTotalLength(); streamPath.style.strokeDasharray = streamLen; streamPath.style.strokeDashoffset = streamLen; }
  const counters = $$('[data-count]');
  const counted = new Set();
  function driveLines() {
    if (pinned) return;
    if (streamPath) {
      const r = streamPath.closest('.steps').getBoundingClientRect();
      const p = clamp((innerHeight * 0.78 - r.top) / r.height, 0, 1);
      const d = Math.round(streamLen * (1 - p));
      if (d !== lastDash) { lastDash = d; streamPath.style.strokeDashoffset = d; }
    }
  }
  addEventListener('scroll', driveLines, { passive: true }); driveLines();
  function runCounter(el) {
    if (counted.has(el)) return; counted.add(el);
    const end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1200;
    let last = '';
    (function step(now) {
      const t = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - t, 3);
      const s = Math.round(end * e) + suf;
      if (s !== last) { last = s; el.textContent = s; }
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }
  const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } }), { threshold: 0.6 });
  counters.forEach((c) => cio.observe(c));
  function pinToFinalStates() {
    pinned = true;
    if (streamPath) streamPath.style.strokeDashoffset = 0;
    counters.forEach((c) => { counted.add(c); c.textContent = c.dataset.count + (c.dataset.suffix || ''); });
    rv.forEach((el) => el.classList.add('in', 'done'));
    if (hold) { hold.classList.add('done'); hold.style.setProperty('--p', 1); }
  }
  function unpinFinalStates() {
    pinned = false; lastDash = -1; driveLines();
  }
  reduced.addEventListener('change', (e) => { if (e.matches) pinToFinalStates(); else applyHeroMode(); });

  /* ============ the hold: press and hold to switch off ============ */
  const hold = $('.hold'), holdBtn = $('.holdbtn');
  if (holdBtn) {
    let p = 0, holding = false, hr = null, hl = 0, done = false;
    const setP = (v) => { holdBtn.style.setProperty('--p', v.toFixed(3)); };
    const finish = () => { done = true; hold.classList.add('done'); holdBtn.setAttribute('aria-pressed', 'true'); };
    function loop(now) {
      const dt = Math.min(64, now - (hl || now)); hl = now;
      p += holding ? dt / 1800 : -dt / 900;
      p = clamp(p, 0, 1); setP(p);
      if (p >= 1 && !done) finish();
      if ((holding && p < 1) || (!holding && p > 0)) hr = requestAnimationFrame(loop); else { hr = null; hl = 0; }
    }
    const start = (e) => { if (done) return; if (e.type === 'pointerdown') holdBtn.setPointerCapture(e.pointerId); holding = true; if (hr === null) hr = requestAnimationFrame(loop); };
    const stop = () => { holding = false; if (hr === null && p > 0) hr = requestAnimationFrame(loop); };
    holdBtn.addEventListener('pointerdown', start);
    holdBtn.addEventListener('pointerup', stop); holdBtn.addEventListener('pointercancel', stop); holdBtn.addEventListener('pointerleave', stop);
    holdBtn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(e); } });
    holdBtn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stop(); } });
    $('.hold .skipnote button')?.addEventListener('click', () => { p = 1; setP(1); finish(); });
    if (reduced.matches) { p = 1; setP(1); finish(); }
  }

  /* ============ price list: filters, finder, details ============ */
  const cards = $$('.card'), cats = $$('.cat'), count = $('.count');
  let activeCat = 'all';
  function applyFilter() {
    let n = 0;
    cards.forEach((c) => { const show = activeCat === 'all' || c.dataset.cat === activeCat; c.classList.toggle('hidden', !show); if (show) n++; });
    cats.forEach((l) => l.classList.toggle('hidden', !(activeCat === 'all' || l.dataset.cat === activeCat)));
    if (count) count.textContent = activeCat === 'all' ? `Zobrazených všetkých ${cards.length} rituálov` : `Zobrazených ${n} z ${cards.length} rituálov`;
  }
  $$('.tools .chip').forEach((b) => b.addEventListener('click', () => {
    $$('.tools .chip').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    activeCat = b.dataset.filter; applyFilter();
  }));
  applyFilter();
  const RECS = {
    relax: ['RELAXAČNÝ HEAD SPA', 'HEAD SPA HARMÓNIA', 'PRÉMIOVÝ HEAD SPA RITUÁL'],
    scalp: ['HĹBKOVÝ RITUÁL PRE POKOŽKU HLAVY', 'PÁNSKY HĹBKOVÝ RITUÁL PRE POKOŽKU HLAVY', 'KLASICKÝ HEAD SPA'],
    gentlemen: ['PÁNSKY HEAD SPA', 'PÁNSKY HARMONICKÝ RITUÁL', 'PRÉMIOVÝ PÁNSKY RITUÁL'],
    couple: ['SPOLOČNÝ HEAD SPA RITUÁL', 'SPOLOČNÝ RITUÁL POD HVIEZDAMI'],
    gift: ['PRÉMIOVÝ HEAD SPA RITUÁL', 'SPOLOČNÝ RITUÁL POD HVIEZDAMI', 'ZLATÝ RITUÁL 24K'],
    feet: ['KLASICKÝ RITUÁL PRE CHODIDLÁ', 'OVOCNÝ A BYLINKOVÝ RITUÁL PRE CHODIDLÁ', 'ZLATÝ RITUÁL 24K']
  };
  $$('.finder .chip').forEach((b) => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') === 'true';
    $$('.finder .chip').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    cards.forEach((c) => c.classList.remove('reco'));
    if (on) { if (count) applyFilter(); return; }
    b.setAttribute('aria-pressed', 'true');
    $$('.tools .chip').forEach((x) => x.setAttribute('aria-pressed', x.dataset.filter === 'all' ? 'true' : 'false'));
    activeCat = 'all'; applyFilter();
    const names = RECS[b.dataset.goal] || [];
    const hits = names.map((n) => cards.find((c) => c.dataset.name === n)).filter(Boolean);
    hits.forEach((c) => c.classList.add('reco'));
    if (count) count.textContent = `Odporúčame: ${hits.map((c) => c.dataset.name).join(' · ')}`;
    if (hits[0]) { const y = hits[0].getBoundingClientRect().top + scrollY - 150; scrollTo({ top: y, behavior: reduced.matches ? 'auto' : 'smooth' }); }
    track('ritual_finder_used', { goal: b.dataset.goal });
  }));
  $$('.card-toggle').forEach((b) => b.addEventListener('click', () => {
    const c = b.closest('.card'); const open = !c.classList.contains('open');
    c.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
  }));

  /* ============ faq ============ */
  $$('.faq-q').forEach((b) => b.addEventListener('click', () => {
    const it = b.closest('.faq-item'); const open = !it.classList.contains('open');
    it.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
  }));

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

  /* ============ housekeeping ============ */
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));
  $$('.stream').length; // no-op guard for older engines
  // year
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  applyHeroMode();
  if (reduced.matches) pinToFinalStates();
  requestAnimationFrame(() => document.body.classList.add('ready'));
})();
