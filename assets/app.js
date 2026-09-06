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
  function makeScene(canvas, opts) {
    const o = opts || {};
    const view = o.view || 'room';          // room = the hero framing, close = tighter on the guest, steam = the abstract shot
    const ctx = canvas.getContext('2d', { alpha: false });
    let W = 0, H = 0, dpr = 1, lastP = -1, lastT = -1;
    const R = rng(30);
    const steam = Array.from({ length: 34 }, () => ({ s: R(), x: R() * 2 - 1, r: 14 + R() * 26, w: 1 + R() * 2 }));
    const drops = Array.from({ length: 16 }, () => ({ s: R(), a: (R() * 2 - 1) * 1.1, v: .5 + R() * .7 }));
    const puffs = Array.from({ length: 54 }, () => ({ s: R(), x: R(), r: 12 + R() * 34, v: .6 + R() * .8, w: R() * 2 - 1 }));
    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastP = -1;
    }
    // the abstract shot: a dark room, a vertical slit of gold light, steam drifting through it
    function drawSteam(p, t) {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#080c0a'); bg.addColorStop(.6, '#0a0f0c'); bg.addColorStop(1, '#070a08');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const sx = W * 0.78, top = H * 0.06, bot = H * 0.94;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const halo = ctx.createLinearGradient(sx - W * .22, 0, sx + W * .07, 0);
      halo.addColorStop(0, 'rgba(217,181,106,0)'); halo.addColorStop(.78, 'rgba(217,181,106,.16)'); halo.addColorStop(1, 'rgba(236,208,143,.05)');
      ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
      ctx.beginPath(); ctx.moveTo(sx, top); ctx.lineTo(sx, bot);
      ctx.strokeStyle = 'rgba(255,236,190,.85)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = 'rgba(236,208,143,.18)'; ctx.lineWidth = 12; ctx.stroke();
      for (const s of puffs) {
        const k = (p * .5 + s.s + t * 0.035) % 1;
        const x = W * (1.02 - k * 1.15) + s.w * W * .06, y = H * (0.98 - k * 0.9) + Math.sin(k * 5 + s.s * 7) * H * .05;
        const r = s.r * (0.7 + k * 1.9), near = 1 - Math.min(1, Math.abs(x - sx) / (W * .22));
        const a = k * (1 - k) * 4 * (0.035 + 0.075 * near) * s.v;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const col = near > .35 ? '236,214,168' : '214,224,216';
        g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      const pool = ctx.createRadialGradient(sx, bot, 0, sx, bot, W * .3);
      pool.addColorStop(0, 'rgba(217,181,106,.12)'); pool.addColorStop(1, 'rgba(217,181,106,0)');
      ctx.fillStyle = pool; ctx.fillRect(0, H * .6, W, H * .4);
      ctx.restore();
      const v = ctx.createRadialGradient(W * .6, H * .5, H * .2, W * .6, H * .5, Math.max(W, H) * .8);
      v.addColorStop(0, 'rgba(6,8,7,0)'); v.addColorStop(1, 'rgba(6,8,7,.78)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }

    function draw(p, force, time) {
      const t = time || 0;
      if (!W) resize();
      if (!force && Math.abs(p - lastP) < 0.0005 && t === lastT) return;
      lastP = p; lastT = t;
      if (view === 'steam') { drawSteam(p, t); return; }
      const wide = W > 720;
      // the basin: a dark bowl of warm water seen from a low angle, the light comes from a single lamp above it
      const cx = view === 'close' ? W * (wide ? 0.55 : 0.5) : (wide ? W * 0.66 : W * 0.5);
      const cy = view === 'close' ? H * (wide ? 0.66 : 0.62) : (wide ? H * 0.70 : H * 0.40);
      const rx = view === 'close' ? Math.min(W * 0.44, H * 0.72) : (wide ? Math.min(W * 0.31, H * 0.56) : Math.min(W * 0.36, H * 0.5));
      const ry = rx * 0.34;
      const topY = -H * 0.04, landY = cy - ry * 0.12;
      const fall = smoothstep(p, 0.04, 0.30);      // the stream reaches the water
      const after = smoothstep(p, 0.30, 0.62);     // rings and steam build
      const calm = smoothstep(p, 0.74, 1);         // the water settles, the light stays
      const stream = fall * (1 - calm * 0.85);
      // room
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0f1613'); bg.addColorStop(.55, '#0b100d'); bg.addColorStop(1, '#090c0a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // the lamp: a cone of warm light that widens as the ritual goes on
      const cone = ctx.createRadialGradient(cx, -H * 0.2, 0, cx, -H * 0.2, H * (1.0 + 0.15 * p));
      const ca = 0.15 + 0.13 * p;
      cone.addColorStop(0, `rgba(236,208,143,${ca})`); cone.addColorStop(.42, `rgba(217,181,106,${ca * .42})`); cone.addColorStop(1, 'rgba(217,181,106,0)');
      ctx.fillStyle = cone; ctx.fillRect(0, 0, W, H);
      // a faint far wall line so the room has depth
      ctx.fillStyle = 'rgba(242,237,226,.025)'; ctx.fillRect(0, cy - ry * 3.2, W, 1);
      // floor sheen under the bowl
      const floor = ctx.createRadialGradient(cx, cy + ry * 0.6, 0, cx, cy + ry * 0.6, rx * 1.8);
      floor.addColorStop(0, `rgba(140,195,182,${.07 + .05 * after})`); floor.addColorStop(.5, `rgba(217,181,106,${.03 + .03 * calm})`); floor.addColorStop(1, 'rgba(10,13,11,0)');
      ctx.fillStyle = floor; ctx.beginPath(); ctx.ellipse(cx, cy + ry * 0.6, rx * 1.8, ry * 2.2, 0, 0, Math.PI * 2); ctx.fill();
      // the bowl body: a dark ceramic rim below the water line
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx, cy, rx * 1.03, ry * 1.03, 0, 0, Math.PI); ctx.lineTo(cx - rx * 1.03, cy);
      const bowl = ctx.createLinearGradient(0, cy, 0, cy + ry * 1.6);
      bowl.addColorStop(0, '#1a221d'); bowl.addColorStop(1, '#0a0e0c');
      ctx.fillStyle = bowl;
      ctx.beginPath(); ctx.ellipse(cx, cy + ry * 0.35, rx * 1.03, ry * 1.25, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
      ctx.restore();
      // the water surface
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
      const water = ctx.createRadialGradient(cx, cy - ry * 0.3, 0, cx, cy, rx);
      water.addColorStop(0, `rgba(96,150,140,${.55 + .15 * after})`); water.addColorStop(.55, 'rgba(46,84,78,.9)'); water.addColorStop(1, 'rgba(18,34,31,1)');
      ctx.fillStyle = water; ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
      // the lamp reflected in the water: a soft vertical bar of gold
      ctx.globalCompositeOperation = 'lighter';
      const refl = ctx.createRadialGradient(cx, cy - ry * 0.15, 0, cx, cy - ry * 0.15, rx * 0.55);
      refl.addColorStop(0, `rgba(236,208,143,${.22 + .2 * calm})`); refl.addColorStop(.35, `rgba(217,181,106,${.08 + .08 * calm})`); refl.addColorStop(1, 'rgba(217,181,106,0)');
      ctx.fillStyle = refl; ctx.save(); ctx.scale(0.42, 1); ctx.beginPath(); ctx.arc(cx / 0.42, cy - ry * 0.15, rx * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      // caustics: light that has been bent by the water, breathing slowly
      for (let j = 0; j < 4; j++) {
        const ph = t * 0.35 + j * 1.7 + p * 2.0;
        const k = 0.22 + j * 0.19 + Math.sin(ph) * 0.04;
        const a = (0.025 + 0.085 * after) * (1 - j * 0.15);
        ctx.beginPath(); ctx.ellipse(cx + Math.sin(ph * 0.7) * rx * 0.04, cy + Math.cos(ph * 0.5) * ry * 0.06, rx * k, ry * k, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(236,214,168,${a})`; ctx.lineWidth = 7; ctx.stroke();
        ctx.strokeStyle = `rgba(255,236,190,${a * 1.4})`; ctx.lineWidth = 2; ctx.stroke();
      }
      // rings: each drop that lands sends a ring to the rim
      if (after > 0) {
        const rings = 7;
        for (let i = 0; i < rings; i++) {
          let k = ((p - 0.30) * 1.7 + i / rings + t * 0.10) % 1; if (k < 0) k += 1;
          const a = Math.pow(1 - k, 1.6) * 0.55 * after * (1 - calm * 0.65);
          if (a < 0.01) continue;
          const kr = 0.03 + k * 0.97;
          ctx.beginPath(); ctx.ellipse(cx, landY + ry * 0.12, rx * kr, ry * kr, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(190,232,222,${a})`; ctx.lineWidth = 1.4 + (1 - k) * 1.2; ctx.stroke();
          ctx.beginPath(); ctx.ellipse(cx, landY + ry * 0.12, rx * kr * 0.94, ry * kr * 0.94, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(236,208,143,${a * 0.35})`; ctx.lineWidth = 1; ctx.stroke();
        }
      }
      ctx.restore();
      // the rim of the bowl catches the lamp
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, Math.PI * 1.02, Math.PI * 1.98);
      ctx.strokeStyle = `rgba(236,208,143,${.22 + .3 * calm})`; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, Math.PI * 0.02, Math.PI * 0.98);
      ctx.strokeStyle = 'rgba(242,237,226,.08)'; ctx.lineWidth = 1; ctx.stroke();
      // the stream: one laminar thread of warm water from the lamp to the bowl
      if (stream > 0.01) {
        const endY = topY + (landY - topY) * fall;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, stream * 1.2);
        const sway = (y) => Math.sin(y * 0.014 + p * 4 + t * 0.9) * 2.8;
        ctx.beginPath();
        for (let y = topY; y <= endY; y += 6) { const x = cx + sway(y); y === topY ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.strokeStyle = 'rgba(140,195,182,.08)'; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.stroke();
        ctx.strokeStyle = 'rgba(160,215,200,.18)'; ctx.lineWidth = 13; ctx.stroke();
        ctx.strokeStyle = 'rgba(210,236,228,.5)'; ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = 'rgba(244,250,247,.9)'; ctx.lineWidth = 1.8; ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const k = (p * 2.2 + i / 8 + t * 0.5) % 1; const y = topY + (endY - topY) * k;
          if (y > endY - 10) continue;
          ctx.beginPath(); ctx.ellipse(cx + sway(y) + (i % 2 ? 2 : -2), y, 1.8, 4.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill();
        }
        if (fall < 1) { ctx.beginPath(); ctx.ellipse(cx + sway(endY), endY + 6, 5, 9, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(236,245,240,.85)'; ctx.fill(); }
        else {
          // where the thread meets the water: a small bright crown
          const g = ctx.createRadialGradient(cx, landY, 0, cx, landY, rx * 0.12);
          g.addColorStop(0, 'rgba(230,246,240,.5)'); g.addColorStop(1, 'rgba(230,246,240,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, landY, rx * 0.12, ry * 0.12, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
      // splash: a few drops leap at the moment the thread lands
      if (after > 0 && after < 1) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const d of drops) {
          const k = clamp(after * 1.5 - d.s * 0.5, 0, 1);
          if (k <= 0 || k >= 1) continue;
          const x = cx + d.a * rx * 0.3 * k, y = landY - (k * 4 * (1 - k)) * H * 0.06 * d.v;
          ctx.beginPath(); ctx.arc(x, y, 2 * (1 - k) + .5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(236,245,240,${.7 * (1 - k)})`; ctx.fill();
        }
        ctx.restore();
      }
      // steam lifts off the warm water
      const sv = smoothstep(p, 0.34, 0.6);
      if (sv > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const s of steam) {
          const k = (p * 1.2 + s.s + t * 0.03) % 1;
          const y = cy - ry * 0.2 - k * H * 0.55, x = cx + s.x * rx * 0.6 + Math.sin(k * 4 + s.s * 7 + t * 0.2) * 24;
          const a = k * (1 - k) * 4 * 0.07 * sv * (1 - calm * 0.3), r = s.r * (0.6 + k * 1.7);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(228,236,230,${a})`); g.addColorStop(1, 'rgba(228,236,230,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
      // dust in the lamp light: tiny motes drifting, only ever a whisper
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const m of puffs) {
        const k = (m.s + t * 0.012 + p * 0.3) % 1;
        const x = cx + (m.x - 0.5) * rx * 2.2 * (0.3 + k * 0.7), y = H * 0.05 + k * (cy - H * 0.05);
        const a = k * (1 - k) * 4 * 0.10 * (0.4 + 0.6 * p);
        ctx.fillStyle = `rgba(236,214,168,${a})`; ctx.beginPath(); ctx.arc(x, y, 1 + m.v * 0.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      // the gold settle: at the end the whole bowl glows
      if (calm > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(cx, cy - ry, 0, cx, cy - ry, H * .55);
        g.addColorStop(0, `rgba(217,181,106,${.18 * calm})`); g.addColorStop(1, 'rgba(217,181,106,0)');
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
  const hero = $('.hero'), stage = $('.stage'), canvas = $('#scene'), env = $('.env');
  const bands = $$('.band', stage).map((el, i) => ({
    el, a: +el.dataset.a, b: +el.dataset.b, i,
    ramp: el.dataset.ramp ? +el.dataset.ramp : null, op: -1, k: -1, on: false
  }));
  const hud = $('.hud b'), cue = $('.cue');
  let scene = null, scrubOn = false, heroOnScreen = true, inited = false, covered = false;
  let target = 0, shown = 0, rafId = null, lastTick = 0, loadK = 0, loadStart = 0;
  let lastHud = '', lastHudAt = 0;

  function heroProgress() {
    const r = hero.getBoundingClientRect();
    const range = hero.offsetHeight - window.innerHeight;
    const c = r.top <= 0 && r.bottom >= window.innerHeight;
    if (c !== covered) { covered = c; env.classList.toggle('covered', c); }
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
      if (on !== b.on) { b.on = on; b.el.classList.toggle('on', on); b.el.inert = !on; }
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
  /* the gallery: drawn shots that breathe, but only while they are on screen */
  const moods = $$('canvas[data-mood]').map((c) => ({ c, p: +c.dataset.mood, view: c.dataset.view || 'room', s: null, on: false }));
  function drawMoods(t) { moods.forEach((m) => { if (!m.s) m.s = makeScene(m.c, { view: m.view }); m.s.resize(); m.s.draw(m.p, true, t || 0); }); }
  let mdt; addEventListener('resize', () => { clearTimeout(mdt); mdt = setTimeout(() => drawMoods(0), 150); }, { passive: true });
  drawMoods(0);

  if (moods.length && !reduced.matches) {
    const AMBIENT_FPS = 12;
    let raf = 0, start = 0, lastFrame = 0;
    const live = () => moods.some((m) => m.on) && !document.hidden && !document.body.classList.contains('idle');
    function tick(now) {
      if (!live()) { raf = 0; return; }
      raf = requestAnimationFrame(tick);
      if (now - lastFrame < 1000 / AMBIENT_FPS) return;
      lastFrame = now;
      if (!start) start = now;
      const t = (now - start) / 1000;
      moods.forEach((m) => { if (m.on && m.s) m.s.draw(m.p, true, t); });
    }
    const wake = () => { if (!raf && live()) raf = requestAnimationFrame(tick); };
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { const m = moods.find((x) => x.c === e.target); if (m) m.on = e.isIntersecting; });
      wake();
    }, { threshold: 0.35 });
    moods.forEach((m) => io.observe(m.c));
    document.addEventListener('visibilitychange', wake);
    addEventListener('hs30wake', wake);
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
  const staticCanvas = $('#scene-static');
  let staticScene = null;
  let srt;
  addEventListener('resize', () => { if (!scrubOn) { clearTimeout(srt); srt = setTimeout(drawStatic, 120); } }, { passive: true });
  const STATIC_P = 0.62, STATIC_FPS = 20;
  let staticRaf = 0, staticStart = 0, staticLast = 0, staticOn = false;
  function drawStatic() {
    if (!staticCanvas) return;
    if (!staticScene) staticScene = makeScene(staticCanvas);
    staticScene.resize(); staticScene.draw(STATIC_P, true, staticStart ? (performance.now() - staticStart) / 1000 : 0);
  }
  function staticLive() { return staticOn && !scrubOn && !reduced.matches && !document.hidden && !document.body.classList.contains('idle'); }
  function staticTick(now) {
    if (!staticLive()) { staticRaf = 0; return; }
    staticRaf = requestAnimationFrame(staticTick);
    if (now - staticLast < 1000 / STATIC_FPS) return;
    staticLast = now; if (!staticStart) staticStart = now;
    staticScene.draw(STATIC_P, true, (now - staticStart) / 1000);
  }
  function staticWake() { if (!staticRaf && staticLive()) staticRaf = requestAnimationFrame(staticTick); }
  if (staticCanvas) {
    new IntersectionObserver((es) => { staticOn = es[0].isIntersecting; staticWake(); }, { threshold: 0.1 }).observe(staticCanvas);
    document.addEventListener('visibilitychange', staticWake);
    addEventListener('hs30wake', staticWake);
  }
  function enableScrub() {
    if (scrubOn) return; scrubOn = true;
    initHeroOnce();
    addEventListener('scroll', onScroll, { passive: true });
    bands.forEach((b) => { b.op = -1; b.k = -1; b.on = false; });
    unpinFinalStates();
    loadStart = performance.now() + veilMs; loadK = 0;
    target = shown = heroProgress();
    scene.draw(shown, true);
    updateCaptions(shown, loadStart);
    onScroll();
  }
  function disableScrub() {
    if (!scrubOn) return; scrubOn = false;
    removeEventListener('scroll', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    if (covered) { covered = false; env.classList.remove('covered'); }
  }
  const GATES = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];
  function applyHeroMode() {
    if (GATES.some((q) => matchMedia(q).matches)) { disableScrub(); drawStatic(); staticWake(); } else enableScrub();
  }
  const MQLS = GATES.map((q) => matchMedia(q));
  MQLS.forEach((m) => m.addEventListener('change', applyHeroMode));

  /* ============ the veil: the mark draws itself once per session, then takes its place in the nav ============ */
  const veil = $('.veil'), veilMark = veil && $('.mark', veil), navMark = $('.nav .mark');
  let veilMs = 0, veilDone = false;
  let seenVeil = false;
  try { seenVeil = !!sessionStorage.hs30open; } catch (e) { seenVeil = false; }
  if (veil && !seenVeil && !location.hash && !reduced.matches && !document.hidden) {
    veilMs = 1500; document.body.classList.add('veiling');
    try { sessionStorage.hs30open = '1'; } catch (e) { /* storage blocked: the veil simply plays each load */ }
  }
  document.documentElement.style.setProperty('--veil', veilMs + 'ms');
  function endVeil() {
    if (veilDone) return; veilDone = true;
    document.body.classList.remove('veiling');
    if (veil) veil.classList.add('gone');
    veilMs = 0;
  }
  function flipVeil() {
    if (veilDone) return;
    const n = navMark.getBoundingClientRect(), m = veilMark.getBoundingClientRect();
    const dx = n.left + n.width / 2 - (m.left + m.width / 2), dy = n.top + n.height / 2 - (m.top + m.height / 2), s = n.width / 96;
    veilMark.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${s.toFixed(4)})`;
    veil.classList.add('lift');                                  // both leaves swing inward
    setTimeout(() => { if (!veilDone) veil.classList.add('through'); }, 420);   // and you walk through
  }

  /* ============ nav: solid after the top, and it holds your place ============ */
  const nav = $('.nav');
  let navSolid = false;
  function navCheck() {
    const s = scrollY > 40;
    if (s !== navSolid) { navSolid = s; nav.classList.toggle('solid', s); }
  }
  addEventListener('scroll', navCheck, { passive: true }); navCheck();
  let atBottom = false;
  addEventListener('scroll', () => {
    const b = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    if (b !== atBottom) { atBottom = b; if (b) document.body.dataset.scene = 'footer'; else sceneUpdate(); }
  }, { passive: true });
  const navLinks = $$('.links a');
  const spied = new Set();
  const spy = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) spied.add(e.target); else spied.delete(e.target); });
    let cur = null; $$('#cennik,#rezervacia,#poukaz,#ritual,#galeria,#faq,#kontakt').forEach((s) => { if (spied.has(s)) cur = s; });
    navLinks.forEach((a) => a.classList.toggle('cur', !!cur && a.getAttribute('href') === '#' + cur.id));
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  $$('#cennik,#rezervacia,#poukaz,#ritual,#galeria,#faq,#kontakt').forEach((s) => spy.observe(s));

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
  }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  rv.forEach((el) => rio.observe(el));

  /* ============ scroll drives: the water line, the lit numerals, the quote (no extra loops) ============ */
  const stepsEl = $('.steps'), streamPath = $('.steps .stream .draw');
  const steps = $$('.step').map((el) => ({ el, n: $('.n', el), at: 0, lit: null }));
  let streamLen = 0, lastDash = -1, pinned = false;
  if (streamPath) { streamLen = streamPath.getTotalLength(); streamPath.style.strokeDasharray = streamLen; streamPath.style.strokeDashoffset = streamLen; }
  function measureSteps() {
    if (!stepsEl) return;
    const h = stepsEl.offsetHeight - 16;
    steps.forEach((s) => { s.at = h > 0 ? (s.el.offsetTop + s.n.offsetTop + s.n.offsetHeight / 2 - 8) / h : 0; });
  }
  measureSteps();
  let mrt; addEventListener('resize', () => { clearTimeout(mrt); mrt = setTimeout(measureSteps, 150); }, { passive: true });
  function driveLines() {
    if (pinned) return;
    if (streamPath) {
      const r = stepsEl.getBoundingClientRect();
      const p = clamp((innerHeight * 0.78 - r.top) / r.height, 0, 1);
      const d = Math.round(streamLen * (1 - p));
      if (d !== lastDash) { lastDash = d; streamPath.style.strokeDashoffset = d; }
      steps.forEach((s) => { const lit = p >= s.at; if (lit !== s.lit) { s.lit = lit; s.el.classList.toggle('lit', lit); } });
    }
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
    if (streamPath) streamPath.style.strokeDashoffset = 0;
    steps.forEach((s) => { s.lit = true; s.el.classList.add('lit'); });
    counters.forEach((c) => { counted.add(c); c.textContent = c.dataset.count + (c.dataset.suffix || ''); });
    rv.forEach((el) => el.classList.add('in', 'done'));
    endVeil();
  }
  function unpinFinalStates() {
    pinned = false; lastDash = -1;
    steps.forEach((s) => { s.lit = null; });
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
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
    cards.forEach((c) => pio.observe(c));
  }
  function applyFilter(fromChip) {
    let n = 0; const shown = [];
    cards.forEach((c) => { const show = activeCat === 'all' || c.dataset.cat === activeCat; c.classList.toggle('hidden', !show); if (show) { n++; shown.push(c); } else c.classList.remove('pop'); });
    cats.forEach((l) => l.classList.toggle('hidden', !(activeCat === 'all' || l.dataset.cat === activeCat)));
    if (count) count.textContent = activeCat === 'all' ? `Zobrazených všetkých ${cards.length} rituálov` : `Zobrazených ${n} z ${cards.length} rituálov`;
    if (fromChip) cascade(shown);
  }
  $$('.tools .chip').forEach((b) => b.addEventListener('click', () => {
    $$('.tools .chip').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    activeCat = b.dataset.filter; applyFilter(true);
  }));
  applyFilter(false);
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
  const vform = $('#vform');
  if (vform) {
    const pick = $('.ritual-pick', vform), sel = $('#v-ritual', vform), tVal = $('#t-val'), tFor = $('#t-for'), tVen = $('#t-ven');
    const err = $('.err', vform), done = $('.sent', vform), emailField = $('#v-email', vform);
    const val = (name) => (vform.querySelector(`input[name="${name}"]:checked`) || {}).value || '';
    const ritualName = () => (sel.options[sel.selectedIndex] || {}).value || '';
    const fieldVal = (id) => ($(id, vform).value || '').trim();
    function preview() {
      const h = val('hodnota'), isRit = h === 'ritual';
      pick.hidden = !isRit;
      const shown = isRit ? ritualName().replace(/\s*\(.*$/, '') : (h || '50 €');
      tVal.textContent = shown; tVal.classList.toggle('long', shown.length > 12);
      const pre = fieldVal('#v-pre');
      tFor.textContent = pre ? `Pre: ${pre}` : 'Darujte oddych.';
      const ven = fieldVal('#v-ven');
      tVen.textContent = ven || 'Mostná 30 · prémiový relaxačný zážitok';
    }
    vform.addEventListener('input', preview); vform.addEventListener('change', preview); preview();
    vform.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = fieldVal('#v-email'), ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      err.hidden = ok; emailField.closest('.field').classList.toggle('invalid', !ok);
      if (!ok) { emailField.focus(); return; }
      const h = val('hodnota'), what = h === 'ritual' ? `Rituál: ${ritualName()}` : `Hodnota: ${h}`;
      const lines = ['Dobrý deň,', '', 'objednávam darčekový poukaz HEAD SPA 30.', '', what,
        `Pre: ${fieldVal('#v-pre') || '(nevyplnené)'}`, `Od: ${fieldVal('#v-od') || '(nevyplnené)'}`,
        `E-mail: ${email}`, `Telefón: ${fieldVal('#v-tel') || '(nevyplnené)'}`,
        `Doručenie: ${val('dorucenie')}`, `Venovanie: ${fieldVal('#v-ven') || '(bez venovania)'}`, '',
        'Prosím o zaslanie platobných údajov.', 'Ďakujem.'];
      const subject = `Objednávka poukazu: ${h === 'ritual' ? ritualName().replace(/\s*\(.*$/, '') : h}`;
      track('voucher_order', { value: h === 'ritual' ? ritualName() : h, delivery: val('dorucenie') });
      done.hidden = false;
      location.href = `mailto:info@barbershop30.sk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    });
  }

  /* ============ booking: pick one of the 17 rituals, a day and a time window; the message leaves from the guest's own phone ============ */
  const rform = $('#rform');
  if (rform) {
    const sel = $('#r-ritual'), rHint = $('#r-ritual-hint'), osobyWrap = $('#r-osoby-wrap'), osobyHint = $('#r-osoby-hint');
    const datum = $('#r-datum'), datumHint = $('#r-datum-hint'), casBox = $('#r-cas'), casHint = $('#r-cas-hint');
    const presnyWrap = $('#r-presny'), presny = $('#r-cas-presny'), presnyHint = $('#r-presny-hint');
    const nahradny = $('#r-nahradny'), datum2 = $('#r-datum2'), cas2Box = $('#r-cas2');
    const meno = $('#r-meno'), tel = $('#r-tel'), email = $('#r-email'), poukaz = $('#r-poukaz'), pozn = $('#r-pozn'), poznHint = $('#r-pozn-hint');
    const err = $('.err', rform), wa = $('#r-wa'), sent = $('#r-sent'), sentText = $('#r-sent-text'), copyBtn = $('#r-copy'), copyText = $('#r-copytext'), sms = $('#r-sms');
    const tVal = $('#rt-val'), tFor = $('#rt-for'), tWhen = $('#rt-when');
    const HOURS = { 1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 14] };
    const DAYS = ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota'];
    const WINDOW = { any: 'kedykoľvek', am: 'dopoludnia (9 až 12)', pm: 'popoludní (12 až 16)', eve: 'podvečer (16 až 19)' };
    const WINDOW_SAT = { any: 'kedykoľvek', am: 'dopoludnia (9 až 14)' };
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
    let message = '', shortMessage = '', opened = 0;

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
      if (d && d.getDay() === 6 && r && last !== null && last < 14) casHint.textContent = `V sobotu máme do 14:00. Tento rituál trvá ${duration()} min, preto je posledný začiatok o ${hm(last)}.`;
      else if (d && r && last !== null && last < HOURS[d.getDay()][1]) casHint.textContent = `Tento rituál trvá ${duration()} min, posledný začiatok je o ${hm(last)}.`;
      else casHint.textContent = '';
      const now = new Date(), openNow = HOURS[now.getDay()] && now.getHours() + now.getMinutes() / 60 >= HOURS[now.getDay()][0] && now.getHours() + now.getMinutes() / 60 < HOURS[now.getDay()][1];
      datumHint.textContent = d && d.getTime() === t0.getTime() && openNow ? 'Na dnes ti termín potvrdíme rýchlejšie telefonicky: 0951 267 203.' : 'Po až Pi 9:00 až 19:00, So 9:00 až 14:00, v nedeľu máme zatvorené.';
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
      wa.href = `https://wa.me/421951267203?text=${encodeURIComponent(message)}`;
      sms.href = `sms:+421951267203?&body=${encodeURIComponent(shortMessage)}`;
      // the ticket
      tVal.textContent = r ? r.name : 'Tvoja rezervácia'; tVal.classList.toggle('long', !r || r.name.length > 12);
      tFor.textContent = r ? `${r.min} min · ${r.price}${r.cat === 'couple' ? ' za obe osoby' : n === 2 ? ' · 2 osoby' : ''}` : 'Vyber si rituál z cenníka alebo zo zoznamu.';
      tWhen.textContent = when || 'Mostná 30 · termín potvrdíme správou';
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
        : kind === 'mail' ? `Otvorili sme e-mail pre info@barbershop30.sk s tvojou požiadavkou, stačí ho odoslať.${what} Termín ti potvrdíme do 24 hodín. Ak sa nič neotvorilo:`
        : `Vyzerá to, že tento prehliadač nemá nastavený e-mail. Skopíruj správu a pošli ju cez WhatsApp na 0951 267 203, alebo nám zavolaj. Termín ti potvrdíme rovnako rýchlo.`;
      sent.hidden = false; copyText.value = message;
      sms.hidden = !matchMedia('(pointer: coarse)').matches;
      opened += 1;
      if (opened > 1) { sentText.textContent += ' Správu si už raz otvoril. Ak ju vo WhatsApp nevidíš, pošli ju e-mailom alebo si ju skopíruj.'; }
    }
    wa.addEventListener('click', (e) => {
      refresh();
      if (!validate()) { e.preventDefault(); return; }
      track('reservation_send', { channel: 'whatsapp', ritual: ritual().slug });
      showSent('wa');
    });
    rform.addEventListener('submit', (e) => {
      e.preventDefault(); refresh();
      if (!validate()) return;
      const r = ritual(), d = parse(datum.value);
      const subject = `Rezervácia: ${r.name}, ${fmt(d)}, ${meno.value.trim()}`.replace(/[&#?]/g, ' ');
      track('reservation_send', { channel: 'email', ritual: r.slug });
      let left = false; const mark = () => { left = true; };
      addEventListener('blur', mark, { once: true }); document.addEventListener('visibilitychange', mark, { once: true });
      showSent('mail');
      location.href = `mailto:info@barbershop30.sk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
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
    datum.addEventListener('change', () => { const d = parse(datum.value); if (d && d.getDay() === 0) { const m = new Date(d); m.setDate(m.getDate() + 1); datum.value = iso(m); refresh(); datumHint.textContent = 'V nedeľu máme zatvorené, posunuli sme ti deň na pondelok.'; } });
    refresh();
  }

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
  document.addEventListener('visibilitychange', () => { document.body.classList.toggle('paused', document.hidden); if (!document.hidden) wake(); });
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  applyHeroMode();
  if (reduced.matches) pinToFinalStates();
  wake();
  void getComputedStyle(veilMark || document.body).opacity;   // settle the initial styles first
  void document.body.offsetWidth;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.add('ready', 'open');
    if (veilMs) {
      veil.classList.add('drawn');
      setTimeout(flipVeil, 1100);
      setTimeout(endVeil, 3100);
    }
  }));
})();
