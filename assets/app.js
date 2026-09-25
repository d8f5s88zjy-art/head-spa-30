/* HEAD SPA 30. Čistý JavaScript bez frameworku; minifikáciu robí tools/build.mjs. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smoothstep = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  /* Nastavenia, ktoré mení admin (admin/): otváracie hodiny a kód štatistík. Jediný zdroj pre celý web. */
  const NASTAVENIA = (() => { try { return JSON.parse($('#nastavenia').textContent) || {}; } catch (e) { return {}; } })();
  const HODINY = NASTAVENIA.hodiny || { 0: null, 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [9, 15] };
  /* Štatistiky bez cookies (GoatCounter), len keď admin zadal kód. */
  if (/^[a-z0-9-]{2,40}$/.test(NASTAVENIA.statistiky || '') && !/^(localhost|127\.)/.test(location.hostname)) {
    const gc = document.createElement('script');
    gc.async = true; gc.src = 'https://gc.zgo.at/count.js';
    gc.dataset.goatcounter = `https://${NASTAVENIA.statistiky}.goatcounter.com/count`;
    window.addEventListener('load', () => document.body.appendChild(gc), { once: true });
  }
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

  /* ============ delenie textu s posunmi z pevného semienka ============ */
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

  /* ============ nadpisy stúpajú z maskovanej štrbiny, riadok po riadku ============ */
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

  /* ============ úvod riadený skrolovaním ============ */
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
    // mimo úvodu nie je čo počítať; pri návrate ho IntersectionObserver nastaví znova
    if (!heroOnScreen) return;
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
  /* zväčšenie v galérii: otvoria sa len skutočné fotky, kreslené zábery ostanú v mriežke */
  const lb = $('#lightbox');
  if (lb) {
    const lbImg = $('img', lb), lbCap = $('.lb-cap', lb);
    let lbTok = 0;
    // najväčšia fotka zo srcset toho istého formátu, aký prehliadač vybral pre dlaždicu
    const largest = (img) => {
      const cur = img.currentSrc || img.src, pic = img.closest('picture');
      const sets = pic ? $$('source', pic).map((s) => s.srcset) : [];
      if (img.srcset) sets.push(img.srcset);
      const ext = (cur.match(/\.(\w+)(?:\?|$)/) || [])[1];
      let best = null;
      sets.forEach((set) => set.split(',').forEach((c) => {
        const [u, w] = c.trim().split(/\s+/), n = parseInt(w, 10) || 0;
        if (u && (!ext || u.endsWith('.' + ext)) && (!best || n > best.n)) best = { u, n };
      }));
      return best ? { src: new URL(best.u, location.href).href, w: best.n } : { src: cur, w: img.naturalWidth };
    };
    // fotky, ktoré sa dajú zväčšiť, v poradí mriežky; listuje sa len medzi viditeľnými
    const openers = () => $$('.shot .open').filter((b) => { const f = b.closest('.shot'); return $('img', f) && f.offsetParent !== null; });
    let lbAt = -1;
    const show = (btn) => {
      const fig = btn.closest('.shot'), img = $('img', fig);
      if (!img) return;
      lbAt = openers().indexOf(btn);
      const big = largest(img), ratio = (img.naturalHeight || img.height) / (img.naturalWidth || img.width) || 0.75;
      // rozmer vopred, aby okno malo hneď tvar fotky; kým príde veľký súbor, ukáže sa dlaždica
      lbImg.style.setProperty('--ar', ratio.toFixed(4)); lbImg.style.setProperty('--mw', big.w + 'px');
      lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt;
      const tok = ++lbTok;
      if (big.src !== lbImg.src) { const pre = new Image(); pre.onload = () => { if (tok === lbTok) lbImg.src = big.src; }; pre.src = big.src; }
      lbCap.textContent = $('.cap b', fig) ? $('.cap b', fig).textContent + '. ' + $('.cap span', fig).textContent : img.alt;
    };
    // o jednu fotku ďalej alebo späť, na konci sa pokračuje od začiatku
    const step = (d) => { const list = openers(); if (!list.length) return; show(list[(Math.max(lbAt, 0) + d + list.length) % list.length]); };
    $$('.shot .open').forEach((btn) => btn.addEventListener('click', () => {
      show(btn);
      if (lb.open) return;
      if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    }));
    $('.lb-close', lb).addEventListener('click', () => lb.close());
    const prev = $('.lb-prev', lb), next = $('.lb-next', lb);
    if (prev) prev.addEventListener('click', () => step(-1));
    if (next) next.addEventListener('click', () => step(1));
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); }
    });
    // potiahnutie prstom do strany: vodorovný pohyb aspoň 40 px
    let sx = null, sy = 0;
    lb.addEventListener('touchstart', (e) => { const t = e.touches[0]; sx = e.touches.length === 1 ? t.clientX : null; sy = t.clientY; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (sx === null) return; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    }, { passive: true });
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  }
  /* filter cenníka na telefóne: ťuknutá kategória sa posunie celá do obrazu, mimo zmiznutia na okraji riadku */
  $$('#cennik .chip-row .chip').forEach((c) => c.addEventListener('click', () => {
    const row = c.parentElement; if (row.scrollWidth <= row.clientWidth + 1) return;
    const r = c.getBoundingClientRect(), rr = row.getBoundingClientRect(), pad = 52;
    const d = r.right > rr.right - pad ? r.right - (rr.right - pad) : r.left < rr.left + pad ? r.left - (rr.left + pad) : 0;
    if (d) row.scrollBy({ left: d, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }));
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
  // prehliadka už beží aj na telefónoch; statický úvod dostane len nízka obrazovka na šírku a obmedzený pohyb
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

  /* ============ navigácia: pod vrchom stránky plná a pri čítaní neprekáža ============ */
  const nav = $('.nav');
  let navSolid = false, navPrevY = 0;
  // plná hlavička hneď, bez prelínania (skok, zmena jazyka, veľký posun): text pod ňou nikdy nepresvitá
  const solidNow = () => {
    nav.classList.add('now', 'solid'); navSolid = true;
    requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.remove('now')));
  };
  function navCheck() {
    const y = scrollY, s = y > 40;
    if (s !== navSolid) { if (s && Math.abs(y - navPrevY) > innerHeight) solidNow(); else { navSolid = s; nav.classList.toggle('solid', s); } }
    navPrevY = y;
  }
  addEventListener('scroll', navCheck, { passive: true }); navCheck();
  // lišta sa pri čítaní smerom dole uhne a vráti sa hneď, ako sa skroluje hore
  let lastY = scrollY, navHidden = false, navT = 0, navJump = false, navJumpT = 0;
  // skok na časť z menu alebo lišty: hlavička ostane viditeľná, cieľ pristane pod ňou (inak nad časťou zostane prázdny pás)
  const holdNav = (on) => {
    navJump = on; clearTimeout(navJumpT);
    if (on) { if (navHidden) { navHidden = false; nav.classList.remove('hide'); } navJumpT = setTimeout(() => { navJump = false; lastY = scrollY; }, 6000); }
    else lastY = scrollY;
  };
  // na tablete lišta s menu ostáva stále; na telefóne sa uhne, len keď je dole spodná lišta s tlačidlom menu
  const touchNavMQ = matchMedia('(max-width: 1024px), (hover: none)');
  const navMayHide = () => !touchNavMQ.matches || (phoneMQ.matches && !!document.body.dataset.scene && document.body.dataset.scene !== 'hero');
  addEventListener('scroll', () => {
    const y = scrollY, down = y > lastY + 4, up = y < lastY - 4, may = navMayHide();
    if (down && y > 260 && !navHidden && may && !navJump && !(menu && menu.open)) { navHidden = true; nav.classList.add('hide'); }
    else if ((up || y < 120 || !may) && navHidden) { navHidden = false; nav.classList.remove('hide'); }
    if (down || up) lastY = y;
    clearTimeout(navT); navT = setTimeout(() => { lastY = scrollY; }, 200);
  }, { passive: true });
  nav.addEventListener('focusin', () => { if (navHidden) { navHidden = false; nav.classList.remove('hide'); } });

  /* ============ zmena jazyka: čítaš ďalej na tom istom mieste ============ */
  /* Preklad mení výšku textov nad tebou (a Safari nemá ukotvenie posunu). Pred zmenou sa zapamätá prvok
     tesne pod hlavičkou, kým preklad dobehne, drží sa na svojom mieste; hlavička sa medzitým neuhne. */
  document.addEventListener('click', (e) => {
    const pick = e.target.closest && e.target.closest('[data-lang-pick], .lang-offer [data-yes]');
    if (!pick || pick.getAttribute('aria-checked') === 'true' || scrollY < 2) return;
    const nb = nav.classList.contains('hide') ? 0 : nav.getBoundingClientRect().bottom;
    const y = Math.max(nb + 12, 0);
    const hit = (document.elementsFromPoint(innerWidth / 2, y) || []).find((el) => el.closest('.site>section, footer'));
    const sec = hit ? hit.closest('.site>section, footer') : [...document.querySelectorAll('.site>section, footer')].find((s) => s.getBoundingClientRect().bottom > y);
    if (!sec) return;
    const pins = [hit, sec].filter(Boolean).map((el) => [el, el.getBoundingClientRect().top]);
    let done = false, lang = false, stopT = 0;
    const stop = () => { if (done) return; done = true; clearTimeout(stopT); removeEventListener('wheel', stop); removeEventListener('touchstart', stop); removeEventListener('keydown', stop); holdNav(false); };
    const keep = () => {
      if (done) return;
      const pin = pins.find(([el]) => el.isConnected);
      if (pin) { const d = Math.round(pin[0].getBoundingClientRect().top - pin[1]); if (Math.abs(d) > 1) scrollTo({ top: scrollY + d, behavior: 'instant' }); }
      requestAnimationFrame(keep);
    };
    holdNav(true); if (navSolid) solidNow();
    addEventListener('wheel', stop, { passive: true }); addEventListener('touchstart', stop, { passive: true }); addEventListener('keydown', stop);
    document.addEventListener('langchange', () => { lang = true; clearTimeout(stopT); stopT = setTimeout(stop, 700); }, { once: true });
    stopT = setTimeout(() => { if (!lang) stop(); }, 6000);
    requestAnimationFrame(keep);
  }, true);

  /* ============ ruka: magnetické hlavné tlačidlá, svetlo pod kurzorom na kartách (len pri presnom ukazovadle) ============ */
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
  /* postup čítania: jedna vlasová linka, poháňa ju poslucháč skrolovania, ktorý tu už je.
     Výška stránky sa číta len keď sa zmení (ResizeObserver), nie pri každom skrole: čítanie
     scrollHeight po zápise štýlu by v každej snímke vynútilo prepočet rozloženia */
  const prog = document.createElement('div');
  prog.className = 'prog'; prog.setAttribute('aria-hidden', 'true');
  if (!reduced.matches) document.body.appendChild(prog);
  let progRaf = 0, maxY = 0, progK = '', progOn = false;
  const measureMax = () => { maxY = document.documentElement.scrollHeight - innerHeight; };
  measureMax();
  new ResizeObserver(() => { measureMax(); if (!reduced.matches && !progRaf) progRaf = requestAnimationFrame(drawProg); }).observe(document.body);
  addEventListener('resize', measureMax, { passive: true });
  function drawProg() {
    progRaf = 0;
    const y = scrollY, k = (maxY > 40 ? Math.min(1, Math.max(0, y / maxY)) : 0).toFixed(4);
    if (k !== progK) { progK = k; prog.style.transform = 'scaleX(' + k + ')'; }
    const on = y > 120;
    if (on !== progOn) { progOn = on; prog.classList.toggle('on', on); }
  }
  addEventListener('scroll', () => {
    const b = scrollY >= maxY - 2;
    if (b !== atBottom) { atBottom = b; if (b) document.body.dataset.scene = 'footer'; else sceneUpdate(); }
    if (!reduced.matches && !progRaf) progRaf = requestAnimationFrame(drawProg);
  }, { passive: true });
  const navLinks = $$('.links a');
  /* ============ skok na časť: nadpisok časti pristane vždy rovnako pod lištou (aj cenník, ktorý nemá vnútorný okraj) ============ */
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href'); if (!/^#[\w-]+$/.test(id)) return;
    if (id === '#top') { e.preventDefault(); scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' }); history.replaceState(null, '', location.pathname + location.search); return; }
    const sec = document.querySelector(id);
    if (!sec || !sec.matches('.site>section')) return;
    const mark = sec.querySelector(':scope>.wrap .kicker') || sec.querySelector(':scope>.wrap') || sec;
    e.preventDefault();
    // všetky časti sa vykreslia naraz, aby odhadnutá výška nepreskočených častí neposunula cieľ
    document.documentElement.classList.add('cv-all');
    const behavior = reduced.matches ? 'auto' : 'smooth';
    // nadpisok v prilepenom stĺpci (otázky, priebeh) sa meria na svojom mieste v toku, nie tam, kde práve visí;
    // inak skok zdola skončí na konci zoznamu otázok
    const stick = mark.closest('.sticky');
    const markTop = () => {
      if (!stick) return mark.getBoundingClientRect().top;
      const was = stick.style.position; stick.style.position = 'static';
      const t = mark.getBoundingClientRect().top; stick.style.position = was; return t;
    };
    const goal = () => Math.max(0, Math.round(markTop() + scrollY - (nav.offsetHeight || 72) - 32));
    // film práve otvoril všetky časti (world.js), výška stránky sa ustáli až v ďalšom snímku
    holdNav(true); solidNow();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      scrollTo({ top: goal(), behavior });
      history.replaceState(null, '', id);
      // po dobehnutí tiché opravy, kým sa niečo nad cieľom dopočítava (najviac tri kolá), potom hlavička znova reaguje na čítanie
      let kola = 0;
      const dorovnaj = () => {
        const g = goal();
        if (Math.abs(g - scrollY) > 1 && kola++ < 3) { scrollTo({ top: g, behavior: 'auto' }); requestAnimationFrame(() => requestAnimationFrame(dorovnaj)); }
        else holdNav(false);
      };
      if ('onscrollend' in window) addEventListener('scrollend', () => requestAnimationFrame(dorovnaj), { once: true });
      else setTimeout(dorovnaj, 900);
    }));
  });

  /* ============ časti stránky: bočná lišta (počítač) aj menu (telefón, tablet) ukazujú, kde práve si ============ */
  const secLinks = $$('#rail .rail-list a, #drawer .drawer-links a');
  const secTargets = [...new Set(secLinks.map((a) => a.getAttribute('href')))].map((id) => [id, document.querySelector(id)]).filter((x) => x[1]);
  if (secTargets.length) {
    let curSec = null, queued = false;
    const markSec = () => {
      queued = false;
      const y = innerHeight * 0.4; let on = secTargets[0][0];
      secTargets.forEach(([id, t]) => { if (t.getBoundingClientRect().top < y) on = id; });
      if (on === curSec) return;
      curSec = on;
      secLinks.forEach((a) => { const m = a.getAttribute('href') === on; a.classList.toggle('on', m); if (m) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(markSec); } }, { passive: true });
    markSec();
  }
  /* bočná lišta a tlačidlo Späť hore sú len tam, kde je vedľa obsahu naozaj voľný okraj; inak stačí menu */
  const fitGutter = () => {
    let right = 0; $$('.site>section>.wrap').forEach((w) => { right = Math.max(right, w.getBoundingClientRect().right); });
    const free = document.documentElement.clientWidth - right;
    document.documentElement.classList.toggle('gutter-ok', right > 0 && free >= 80);
    // popisy čiariek sa ukazujú len vtedy, keď sa celé zmestia do okraja (inak by zakryli obsah, napr. + pri otázkach)
    // šírka sa meria vždy v podobe popisu vedľa čiarky (v úzkom okraji sa popis zalamuje a bol by užší)
    document.documentElement.classList.add('gutter-wide');
    let lbl = 0; $$('#rail .rail-list a span').forEach((s) => { lbl = Math.max(lbl, s.offsetWidth); });
    const rail = document.getElementById('rail');
    const railLeft = rail && rail.offsetWidth ? rail.getBoundingClientRect().left : document.documentElement.clientWidth - 64;
    document.documentElement.classList.toggle('gutter-wide', right > 0 && free >= 80 && lbl > 0 && railLeft - 10 - lbl >= right + 12);
    // úzky okraj: popis čiarky sa ukáže pod lištou, najviac taký široký, ako je voľný okraj (8 px od obsahu aj od kraja okna)
    document.documentElement.style.setProperty('--rail-room', Math.max(0, Math.round(free - 16)) + 'px');
  };
  let fitT = 0;
  addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(fitGutter, 150); }, { passive: true });
  addEventListener('load', fitGutter);
  document.addEventListener('langchange', () => requestAnimationFrame(fitGutter));
  fitGutter();

  const spied = new Set();
  const spy = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) spied.add(e.target); else spied.delete(e.target); });
    let cur = null; $$('#cennik,#poukaz,#ritual,#salon,#galeria,#faq,#kontakt').forEach((s) => { if (spied.has(s)) cur = s; });
    navLinks.forEach((a) => a.classList.toggle('cur', !!cur && a.getAttribute('href') === '#' + cur.id));
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  $$('#cennik,#poukaz,#ritual,#salon,#galeria,#faq,#kontakt').forEach((s) => spy.observe(s));

  /* ============ svetlo sa podáva z miestnosti do miestnosti ============ */
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

  /* ============ pokoj: sekcie mimo obrazovky odpočívajú, stránka odpočíva spolu s návštevníkom ============ */
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

  /* ============ príchody ============ */
  const rv = $$('.rv');
  const rio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); rio.unobserve(e.target);
    setTimeout(() => e.target.classList.add('done'), 1600);
  }), { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  rv.forEach((el) => rio.observe(el));

  /* ============ pohyb zo skrolovania: vodná linka, rozsvietené číslice, citát (bez ďalších slučiek) ============ */
  /* každý blok .steps má vlastnú vodnú linku, nezávisle od ostatných */
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
      if (r.bottom < -200 || r.top > innerHeight + 200) return;   // mimo obrazovky, nie je čo kresliť
      const p = clamp((innerHeight * 0.78 - r.top) / r.height, 0, 1);
      const d = Math.round(s.len * (1 - p));
      if (d !== s.lastDash) { s.lastDash = d; s.path.style.strokeDashoffset = d; }
      s.steps.forEach((x) => { const lit = p >= x.at; if (lit !== x.lit) { x.lit = lit; x.el.classList.toggle('lit', lit); } });
    });
  }
  addEventListener('scroll', driveLines, { passive: true }); driveLines();

  /* ============ počítadlá (číslice ako v účtovnej knihe) ============ */
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

  /* ============ cenník: filtre, vyhľadávač, detaily, kaskáda ============ */
  const cards = $$('.card'), cats = $$('.cat'), count = $('.count');
  let activeCat = 'all';
  function cascade(list) {
    if (reduced.matches) return;
    list.forEach((c) => c.classList.remove('pop'));
    void document.body.offsetWidth;
    list.forEach((c, i) => { c.style.setProperty('--i', i); c.classList.add('pop'); }); sweepPop();
  }
  // animationend sa môže stratiť (skrytá karta prehliadača, karta odfiltrovaná počas animácie), preto upratuje aj časovač
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

  function applyFilter(fromChip) {
    let n = 0; const shown = [];
    cards.forEach((c) => { const show = inCat(c); c.classList.toggle('hidden', !show); if (show) { n++; shown.push(c); } else c.classList.remove('pop'); });
    /* nadpis kategórie zmizne aj vtedy, keď v nej po obmedzení nič nezostalo */
    cats.forEach((l) => {
      const zije = shown.some((c) => c.dataset.cat === l.dataset.cat);
      l.classList.toggle('hidden', !zije);
    });
    if (count) {
      const W = COUNT_WORDS[(document.documentElement.lang || 'sk').slice(0, 2)] || COUNT_WORDS.sk;
      count.textContent = activeCat === 'all' ? W.all(cards.length) : W.some(n, cards.length);
    }
    if (fromChip) cascade(shown);
  }
  function pickCat(cat, fromChip) {
    $$('.tools .chip').forEach((x) => x.setAttribute('aria-pressed', x.dataset.filter === cat ? 'true' : 'false'));
    activeCat = cat; applyFilter(fromChip);
  }
  $$('.tools .chip').forEach((b) => b.addEventListener('click', () => pickCat(b.dataset.filter, true)));
  /* tip Prvýkrát u nás: keď iný filter rituál skryl, zobrazí sa znova celý zoznam a stránka k nemu
     doskroluje (aj opakovane, hoci adresa už kotvu má) */
  $$('.first-tip a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = document.getElementById(a.getAttribute('href').slice(1));
    if (!t || e.button > 0 || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    if (t.classList.contains('hidden')) pickCat('all', true);
    // film práve otvoril všetky časti (world.js), výška stránky sa ustáli až v ďalšom snímku
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const nav = $('.nav'), off = (nav ? nav.offsetHeight : 72) + 16;
      scrollTo({ top: Math.max(0, t.getBoundingClientRect().top + scrollY - off), behavior: reduced.matches ? 'auto' : 'smooth' });
      history.replaceState(null, '', a.getAttribute('href'));
    }));
  }));
  applyFilter(false);
  document.addEventListener('langchange', () => applyFilter(false));
  $$('.card .panel ol').forEach((ol) => [...ol.children].forEach((li, i) => li.style.setProperty('--i', i)));
  $$('.card-toggle').forEach((b) => b.addEventListener('click', () => {
    const c = b.closest('.card'); const open = !c.classList.contains('open');
    c.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
    $('.panel', c).setAttribute('aria-hidden', String(!open));
  }));

  /* ============ časté otázky ============ */
  $$('.faq-q').forEach((b) => b.addEventListener('click', () => {
    const it = b.closest('.faq-item'); const open = !it.classList.contains('open');
    it.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
    $('.faq-a', it).setAttribute('aria-hidden', String(!open));
  }));

  /* ============ rýchla cesta k nákupu: rezervácia a poukaz idú rovno do Booqme ============
     Každé tlačidlo Rezervovať a Kúpiť poukaz je obyčajný odkaz do Booqme (nová karta), bez medzikroku.
     Pri rituáli je odkaz Darovať ako poukaz: keď admin k rituálu vložil platbu kartou (nastavenia, "platby"),
     vedie na ňu a volá sa Kúpiť poukaz kartou, inak do obchodu s poukazmi. */
  const PLATBY = NASTAVENIA.platby || {};
  const httpsUrl = (u) => { try { return typeof u === 'string' && new URL(u).protocol === 'https:' ? u : ''; } catch (e) { return ''; } };
  $$('.card [data-gift]').forEach((a) => {
    const u = httpsUrl(PLATBY[a.dataset.gift]);
    if (!u) return;
    a.href = u; a.textContent = 'Kúpiť poukaz kartou'; a.dataset.pay = '';
  });
  /* Booqme má stránky v jazyku návštevníka; slovenčina ostáva v HTML ako predvolená */
  const BQ_BOOK = { sk: 'rezervacia', cs: 'rezervace', hu: 'foglalas', en: 'reservation', de: 'reservation', pl: 'reservation', uk: 'reservation' };
  const BQ_RE = /^https:\/\/booqme\.app\/[a-z]{2}\/(rezervacia|rezervace|foglalas|reservation|eshop)\//;
  function booqmeLang(lang) {
    const L = BQ_BOOK[lang] ? lang : 'sk';
    $$('a[href^="https://booqme.app/"]').forEach((a) => {
      const h = a.getAttribute('href'), m = h.match(BQ_RE); if (!m) return;
      const to = h.replace(BQ_RE, `https://booqme.app/${L}/${m[1] === 'eshop' ? 'eshop' : BQ_BOOK[L]}/`);
      if (to !== h) a.setAttribute('href', to);
    });
  }
  booqmeLang((document.documentElement.lang || 'sk').slice(0, 2));
  document.addEventListener('langchange', (e) => booqmeLang((e.detail && e.detail.lang) || (document.documentElement.lang || 'sk').slice(0, 2)));

  /* ============ háčiky pre analytiku: dataLayer a štatistiky bez cookies, ak ich admin zapol ============ */
  const UDALOSTI = { reservation_click: 'Klik: Rezervovať', phone_click: 'Klik: Zavolať', email_click: 'Klik: E-mail',
    map_click: 'Klik: Mapa', voucher_click: 'Klik: Kúpiť poukaz', voucher_pay: 'Klik: Kúpiť poukaz kartou', social_click: 'Klik: sociálna sieť' };
  function track(event, data) {
    (window.dataLayer = window.dataLayer || []).push(Object.assign({ event, site: 'headspa30' }, data || {}));
    const name = UDALOSTI[event];
    if (name && window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: name, title: name, event: true });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a'); if (!a) return;
    const h = a.getAttribute('href') || '';
    if (a.hasAttribute('data-pay')) track('voucher_pay', { ritual: a.dataset.gift });
    else if (/booqme\.app\/[a-z]{2}\/(rezervacia|rezervace|foglalas|reservation)\//.test(h)) track('reservation_click', { label: a.textContent.trim(), ritual: a.dataset.book });
    else if (h.startsWith('tel:')) track('phone_click');
    else if (h.startsWith('mailto:')) track('email_click');
    else if (h.includes('google.com/maps')) track('map_click');
    else if (h.includes('/eshop/')) track('voucher_click', { ritual: a.dataset.gift });
    else if (/instagram\.com|facebook\.com|tiktok\.com/.test(h)) track('social_click');
  });

  /* ============ mobilné menu (natívny dialog: zachytenie fokusu a Escape zadarmo) ============ */
  /* Jediné menu častí stránky: otvára ho tlačidlo v hlavičke aj tlačidlo v spodnej lište telefónu,
     vysunie sa sprava, prekryje a stmaví aj hlavičku. */
  const menu = $('#drawer'), menuBtns = $$('.menu-btn, #mbarMenu');
  if (menu && menuBtns.length) {
    let opener = menuBtns[0];
    $$('.drawer-links a', menu).forEach((a, i) => a.style.setProperty('--i', i));
    const expanded = (v) => menuBtns.forEach((b) => b.setAttribute('aria-expanded', String(v)));
    const openMenu = (btn) => {
      if (menu.open) return; opener = btn || menuBtns[0]; menu.showModal(); document.body.classList.add('drawer-open'); expanded(true); track('menu_open');
      // menu sa vždy otvorí od začiatku, časť, v ktorej si, je vidieť
      const inn = $('.drawer-in', menu); if (inn) inn.scrollTop = 0;
      const on = $('.drawer-links a.on', menu); if (on && inn && on.getBoundingClientRect().bottom > inn.getBoundingClientRect().bottom) on.scrollIntoView({ block: 'nearest' });
    };
    const closeMenu = () => { if (!menu.open) return; menu.close(); };
    menuBtns.forEach((b) => b.addEventListener('click', () => (menu.open ? closeMenu() : openMenu(b))));
    $('.drawer-close', menu).addEventListener('click', closeMenu);
    menu.addEventListener('click', (e) => { if (e.target === menu) closeMenu(); });
    menu.addEventListener('close', () => { document.body.classList.remove('drawer-open'); expanded(false); if (opener.offsetWidth) opener.focus({ preventScroll: true }); });
    $$('a[href^="#"]', menu).forEach((a) => a.addEventListener('click', () => { closeMenu(); }));
    // keď sa okno zväčší a žiadne tlačidlo menu už nie je vidieť, menu sa zavrie
    addEventListener('resize', () => { if (menu.open && !menuBtns.some((b) => b.offsetWidth)) closeMenu(); }, { passive: true });
  }

  /* ============ dnešné otváracie hodiny, počítané v časovom pásme salónu ============ */
  /* Tento text vzniká až v prehliadači, preto má vlastné preklady, nie je v assets/i18n. */
  const TODAY_WORDS = {
    sk: { nonstop: 'Online rezervácia je otvorená nonstop', open: 'Dnes otvorené do', soon: 'Dnes otvárame o', shut: 'Dnes už zatvorené', none: 'Dnes máme zatvorené',
          next: 'otvárame', at: 'o', tomorrow: 'zajtra',
          days: ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'] },
    cs: { nonstop: 'Online rezervace je otevřená nonstop', open: 'Dnes otevřeno do', soon: 'Dnes otevíráme v', shut: 'Dnes už zavřeno', none: 'Dnes máme zavřeno',
          next: 'otevíráme', at: 'v', tomorrow: 'zítra',
          days: ['v neděli', 'v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu'] },
    pl: { nonstop: 'Rezerwacja online działa całą dobę', open: 'Dziś otwarte do', soon: 'Dziś otwieramy o', shut: 'Dziś już zamknięte', none: 'Dziś mamy zamknięte',
          next: 'otwieramy', at: 'o', tomorrow: 'jutro',
          days: ['w niedzielę', 'w poniedziałek', 'we wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę'] },
    hu: { nonstop: 'Az online foglalás éjjel-nappal elérhető', open: 'Ma nyitva eddig:', soon: 'Ma nyitunk ekkor:', shut: 'Ma már zárva', none: 'Ma zárva vagyunk',
          next: 'nyitás', at: '', tomorrow: 'holnap',
          days: ['vasárnap', 'hétfőn', 'kedden', 'szerdán', 'csütörtökön', 'pénteken', 'szombaton'] },
    de: { nonstop: 'Online-Buchung rund um die Uhr', open: 'Heute geöffnet bis', soon: 'Heute öffnen wir um', shut: 'Heute schon geschlossen', none: 'Heute haben wir geschlossen',
          next: 'wir öffnen', at: 'um', tomorrow: 'morgen',
          days: ['am Sonntag', 'am Montag', 'am Dienstag', 'am Mittwoch', 'am Donnerstag', 'am Freitag', 'am Samstag'] },
    uk: { nonstop: 'Онлайн-бронювання працює цілодобово', open: 'Сьогодні відчинено до', soon: 'Сьогодні відчиняємо о', shut: 'Сьогодні вже зачинено', none: 'Сьогодні зачинено',
          next: 'відчиняємо', at: 'о', tomorrow: 'завтра',
          days: ['у неділю', 'у понеділок', 'у вівторок', 'у середу', 'у четвер', 'у п\'ятницю', 'у суботу'] },
    en: { nonstop: 'Online booking is open around the clock', open: 'Open today until', soon: 'We open today at', shut: 'Closed for today', none: 'We are closed today',
          next: 'we open', at: 'at', tomorrow: 'tomorrow',
          days: ['on Sunday', 'on Monday', 'on Tuesday', 'on Wednesday', 'on Thursday', 'on Friday', 'on Saturday'] },
  };
  (function todayStatus() {
    const els = $$('[data-today]'); if (!els.length) return;
    const HOURS = HODINY;
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
        // deň, keď sme vôbec neotvorili, znie inak ako deň, ktorý sa práve skončil
        text = `${h ? W.shut : W.none}, ${W.next} ${when} ${W.at ? W.at + ' ' : ''}${hm(HOURS[d][0])}`;
      }
      // v úvode sa pri zatvorenom salóne neukazuje „zatvorené“, ale to, čo platí vždy: online rezervácia
      els.forEach((el) => { const hero = !el.closest('.contact'); const t = !open && hero ? W.nonstop : text;
        el.innerHTML = `<span class="dot" aria-hidden="true"></span>${t}`; el.classList.toggle('closed', !open && !hero); });
    }
    render((document.documentElement.lang || 'sk').slice(0, 2));
    document.addEventListener('langchange', (e) => render(e.detail.lang));
  })();

  /* ============ upratovanie ============ */
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
  void document.body.offsetWidth;   // najprv nech sa ustália počiatočné štýly
  requestAnimationFrame(() => {
    document.body.classList.add('ready', 'open');
    if (veilMs) {
      veil.classList.add('drawn');
      // koniec až po dobehnutí prelínania scény (opacity na .scene, nie na krídlach), časovač je poistka pre pomalý telefón
      const sc = $('.scene', veil);
      if (sc) sc.addEventListener('transitionend', (e) => { if (e.target === sc && e.propertyName === 'opacity') endVeil(); });
      // dvere sa ukážu, až keď je fotka dverí pripravená a nakreslená; keď do 0,9 s nepríde,
      // dvere sa preskočia (radšej žiadne dvere ako plochá plocha namiesto fotky)
      const im = $('.leaf img', veil);
      const ready = !im ? Promise.resolve(false) : im.complete && im.naturalWidth ? Promise.resolve(true)
        : Promise.race([im.decode ? im.decode().then(() => true, () => false) : new Promise((r) => { im.onload = () => r(true); im.onerror = () => r(false); }),
          new Promise((r) => setTimeout(() => r(false), 900))]);
      // dvere sa dajú preskočiť: dotyk, klik, koliesko alebo kláves ich hneď jemne otvorí
      const skip = () => { if (veilDone) return; veil.style.transition = 'opacity 320ms cubic-bezier(.4,0,.2,1)'; veil.style.opacity = '0'; setTimeout(endVeil, 330); };
      ['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, skip, { once: true, passive: true }));
      ready.then((ok) => {
        // bez fotky dverí: tma sa pokojne rozplynie, nie tvrdým strihom
        if (!ok) { veil.style.transition = 'opacity 420ms cubic-bezier(.4,0,.2,1)'; veil.style.opacity = '0'; setTimeout(endVeil, 440); return; }
        requestAnimationFrame(() => requestAnimationFrame(() => {
          veil.classList.add('pic');
          setTimeout(flipVeil, phoneMQ.matches ? 700 : 560);   // dvere chvíľu postoja, na telefóne o niečo dlhšie
          setTimeout(endVeil, 2600);
        }));
      });
    }
  });

  /* Späť hore: objaví sa po dvoch obrazovkách, len na širokej obrazovke s voľným okrajom (CSS, trieda gutter-ok).
     Na telefóne a tablete je Úvod v menu častí. */
  idle(function spatHore() {
    const btn = document.getElementById('toTop');
    const hore = () => {
      const jemne = matchMedia('(prefers-reduced-motion: reduce)').matches;
      scrollTo({ top: 0, behavior: jemne ? 'auto' : 'smooth' });
      (document.getElementById('main') || document.body).focus({ preventScroll: true });
    };
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
