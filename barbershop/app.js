/* BARBER SHOP 30, Nitra. Menu, open-now status, reveals, price filter, card and FAQ toggles. No dependencies. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* ============ headlines: each line in its own masked slot ============ */
  $$('.h2').forEach((h) => {
    const lines = h.innerHTML.split(/<br\s*\/?>/i);
    h.innerHTML = lines.map((l) => `<span class="ln"><span class="li">${l.trim()}</span></span>`).join('');
  });
  const h1 = $('.hero h1');
  if (h1) {
    const html = h1.innerHTML.trim();
    h1.innerHTML = `<span class="ln"><span class="li">${html}</span></span>`;
  }

  /* ============ chapter rail: the page's own table of contents, on wide screens ============ */
  /* Built from the drawer's list so there is one source of section names. */
  (function rail() {
    const src = $$('.drawer-links a[href^="#"]');
    if (!src.length) return;
    const nav = document.createElement('nav');
    nav.className = 'rail';
    nav.setAttribute('aria-label', 'Sekcie stránky');
    src.forEach((a) => {
      const href = a.getAttribute('href');
      if (!document.getElementById(href.slice(1))) return;
      const link = document.createElement('a');
      link.href = href;
      const name = a.textContent.replace(/^\s*\d+\s*/, '').trim();
      link.innerHTML = '<span></span><i aria-hidden="true"></i>';
      $('span', link).textContent = name;
      link.setAttribute('aria-label', name);
      nav.appendChild(link);
    });
    if (nav.children.length) document.body.appendChild(nav);
  })();

  /* ============ scene: the two travelling lights follow the section ============ */
  const sceneIO = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) document.body.dataset.scene = e.target.id || 'hero'; });
  }, { rootMargin: '-45% 0px -45% 0px' });
  $$('.hero, main section[id]').forEach((el) => sceneIO.observe(el));
  document.body.dataset.scene = 'hero';

  /* ============ nav: solid after the top, hides on the way down, returns on the first move up ============ */
  const nav = $('.nav');
  let lastY = scrollY, navSolid = false, navHidden = false;
  const menu = $('#drawer'), menuBtn = $('.menu-btn');
  function onScroll() {
    const y = scrollY, s = y > 40;
    if (s !== navSolid) { navSolid = s; nav.classList.toggle('solid', s); }
    const down = y > lastY + 4, up = y < lastY - 4;
    if (down && y > 260 && !navHidden && !(menu && menu.open)) { navHidden = true; nav.classList.add('hide'); }
    else if ((up || y < 120) && navHidden) { navHidden = false; nav.classList.remove('hide'); }
    lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  nav.addEventListener('focusin', () => { if (navHidden) { navHidden = false; nav.classList.remove('hide'); } });

  /* the current section lights its link */
  const links = $$('.links a[href^="#"], .rail a[href^="#"]');
  const spy = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('cur', a.getAttribute('href') === '#' + e.target.id)); });
  }, { rootMargin: '-40% 0px -55% 0px' });
  $$('main section[id]').forEach((s) => spy.observe(s));

  /* ============ mobile menu ============ */
  if (menu && menuBtn) {
    $$('.drawer-links a', menu).forEach((a, i) => a.style.setProperty('--i', i));
    const openMenu = () => { if (menu.open) return; menu.showModal(); document.body.classList.add('drawer-open'); menuBtn.setAttribute('aria-expanded', 'true'); };
    const closeMenu = () => { if (menu.open) menu.close(); };
    menuBtn.addEventListener('click', () => (menu.open ? closeMenu() : openMenu()));
    $('.drawer-close', menu).addEventListener('click', closeMenu);
    $$('a', menu).forEach((a) => a.addEventListener('click', closeMenu));
    menu.addEventListener('click', (e) => { if (e.target === menu) closeMenu(); });
    menu.addEventListener('close', () => { document.body.classList.remove('drawer-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus({ preventScroll: true }); });
    matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) closeMenu(); });
  }

  /* ============ one scroll driver: progress, the hero leaving, the way back up ============ */
  const motion = { vel: 0 }, onDrive = [];
  (function driver() {
    const prog = $('.prog'), hero = $('.hero'), toTop = $('.totop'), rail = $('.rail');
    let prevY = scrollY, queued = false;
    function drive() {
      queued = false;
      const y = scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      if (prog) prog.style.setProperty('--p', Math.min(1, y / max).toFixed(4));
      if (hero && !reduced.matches) hero.style.setProperty('--hs', Math.min(1, y / Math.max(1, hero.offsetHeight)).toFixed(4));
      if (toTop) toTop.classList.toggle('on', y > innerHeight * 1.4);
      if (rail) rail.classList.toggle('on', y > innerHeight * 0.75);
      motion.vel = y - prevY;
      prevY = y;
      for (const fn of onDrive) fn();
    }
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(drive); } }, { passive: true });
    addEventListener('resize', drive);
    if (toTop) toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' }));
    drive();
  })();

  $$('.gift .vals span').forEach((el, i) => el.style.setProperty('--i', i));
  $$('.hours li').forEach((el, i) => el.style.setProperty('--i', i));
  $$('footer .col').forEach((el, i) => el.style.setProperty('--i', i));

  /* ============ reveals: one pass on every scroll frame ============ */
  /* A pass beats an observer here: jump to a section from the menu and everything
     above it is still revealed, instead of sitting at opacity 0 until you scroll back. */
  (function reveals() {
    let parts = $$('.rv, .divider, .cat');
    let cards = $$('.card');
    let marks = $$('main section[id], footer');
    function pass() {
      const fold = innerHeight * 0.88;
      if (parts.length) parts = parts.filter((el) => {
        if (el.getBoundingClientRect().top > fold) return true;
        el.classList.add('in');
        setTimeout(() => el.classList.add('done'), 1600);
        return false;
      });
      if (cards.length) {
        let step = 0;
        cards = cards.filter((el) => {
          const top = el.getBoundingClientRect().top;
          if (top > fold) return true;
          el.style.setProperty('--d', top < -40 ? 0 : Math.min(step++, 5));   // already passed: no waiting
          el.classList.add('seen');
          return false;
        });
      }
      if (marks.length) marks = marks.filter((el) => {
        if (el.getBoundingClientRect().top > innerHeight * 0.96) return true;
        el.classList.add('seen');
        return false;
      });
    }
    onDrive.push(pass);
    pass();
  })();

  /* ============ parallax: every photograph lags the scroll a little ============ */
  /* One pass over every [data-par] element per driven frame. Each writes --p, a
     signed distance from the middle of the viewport in viewport heights; the
     stylesheet decides how many pixels that is worth for that kind of element. */
  (function parallax() {
    const targets = $$('[data-par]').map((el) => ({ el, k: parseFloat(el.dataset.par) || 1 }));
    if (!targets.length || reduced.matches) return;
    function pass() {
      const vh = innerHeight;
      for (const { el, k } of targets) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -160 || r.top > vh + 160) continue;
        const c = (r.top + r.height / 2 - vh / 2) / vh;
        /* 0.9 is past anything reachable while the element is on screen; the clamp
           is what lets the stylesheet size its overscan and never show an edge */
        el.style.setProperty('--p', (Math.max(-0.9, Math.min(0.9, c)) * k).toFixed(4));
      }
    }
    onDrive.push(pass);
    pass();
  })();

  /* ============ the lamps you walk under ============ */
  /* Two pendant glows ride up the fixed background on a scroll-driven cycle, half a
     cycle apart, fading in and out at the edges so neither one ever pops. Scrolling
     the page reads as walking the row of lamps in the shop. */
  (function lamps() {
    const l = [$('.env .l1'), $('.env .l2')].filter(Boolean);
    if (l.length < 2 || reduced.matches) return;
    const CYCLES = 7;                       /* lamps passed over the whole page */
    function pass() {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const t = (scrollY / max) * CYCLES;
      l.forEach((el, i) => {
        const ph = (t + i * 0.5) % 1;       /* 0 at the bottom edge, 1 past the top */
        el.style.setProperty('--y', (116 - 150 * ph).toFixed(2));
        el.style.setProperty('--o', Math.sin(ph * Math.PI).toFixed(3));
      });
    }
    onDrive.push(pass);
    pass();
  })();

  /* the steps: the line grows with the scroll, each numeral lights when the line reaches it */
  const stepBlocks = $$('.steps').map((steps) => ({ steps, line: $('.line', steps), items: $$('.step', steps) }));
  function driveSteps() {
    const mid = innerHeight * 0.62;
    stepBlocks.forEach(({ steps, line, items }) => {
      const r = steps.getBoundingClientRect();
      const reach = Math.max(0, Math.min(r.height, mid - r.top));
      if (line) line.style.height = reach + 'px';
      items.forEach((st) => st.classList.toggle('lit', st.offsetTop + 22 <= reach));
    });
  }
  if (stepBlocks.length) { addEventListener('scroll', driveSteps, { passive: true }); addEventListener('resize', driveSteps); driveSteps(); }

  /* ============ price list: one category at a time ============ */
  const chips = $$('.chip[data-filter]'), cards = $$('.card'), cats = $$('.cat[data-cat]'), count = $('.count');
  const WORDS = (n) => (n === 1 ? 'služba' : n >= 2 && n <= 4 ? 'služby' : 'služieb');
  function applyFilter(key) {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === key)));
    let shown = 0;
    cards.forEach((card, i) => {
      const hit = key === 'all' || card.dataset.cat === key;
      card.classList.toggle('hidden', !hit);
      card.classList.remove('pop');
      if (hit) { card.style.setProperty('--i', shown); void card.offsetWidth; card.classList.add('pop'); shown++; }
    });
    cats.forEach((c) => c.classList.toggle('hidden', !(key === 'all' || c.dataset.cat === key)));
    if (count) count.textContent = key === 'all' ? `Všetkých ${cards.length} ${WORDS(cards.length)}` : `Zobrazených ${shown} z ${cards.length} služieb`;
  }
  chips.forEach((c) => c.addEventListener('click', () => {
    cards.forEach((k) => { k.classList.add('seen'); k.style.setProperty('--d', 0); });
    applyFilter(c.dataset.filter);
    const top = $('#cennik').getBoundingClientRect().top + scrollY - 70;
    if (scrollY > top) scrollTo({ top, behavior: reduced.matches ? 'auto' : 'smooth' });
  }));
  applyFilter('all');

  /* the tally belongs in the bar with the chips, not on a line of its own */
  if (count && count.parentElement !== $('.tools')) $('.tools').appendChild(count);

  /* the brass pill behind the pressed chip, measured from the chip itself */
  (function chipPill() {
    const tools = $('.tools');
    if (!tools || !chips.length) return;
    const ind = document.createElement('i');
    ind.className = 'chip-ind';
    ind.setAttribute('aria-hidden', 'true');
    tools.insertBefore(ind, tools.firstChild);
    tools.classList.add('has-ind');
    function place() {
      const on = chips.find((c) => c.getAttribute('aria-pressed') === 'true') || chips[0];
      ind.style.setProperty('--cx', on.offsetLeft + 'px');
      ind.style.setProperty('--cy', on.offsetTop + 'px');
      ind.style.setProperty('--cw', on.offsetWidth + 'px');
      ind.style.setProperty('--ch', on.offsetHeight + 'px');
    }
    chips.forEach((c) => c.addEventListener('click', () => requestAnimationFrame(place)));
    addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    place();
  })();

  /* the light under the cursor */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced.matches) {
    cards.forEach((card) => card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--lx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--ly', ((e.clientY - r.top) / r.height * 100) + '%');
    }));
  }

  /* what the service includes */
  $$('.card').forEach((card) => card.addEventListener('click', (e) => {
    if (e.target.closest('.card-toggle, a')) return;   /* the button handles itself */
    $('.card-toggle', card).click();
  }));
  $$('.card-toggle').forEach((b) => b.addEventListener('click', () => {
    const card = b.closest('.card'), panel = $('.panel', card), open = !card.classList.contains('open');
    card.classList.toggle('open', open);
    b.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    $$('li', panel).forEach((li, i) => li.style.setProperty('--i', i));
  }));

  /* the hand: buttons lean toward the cursor, cards tilt (fine pointers only, never with reduced motion) */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced.matches) {
    $$('.btn.primary').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * 8 + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * 6 + 'px');
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
  }

  /* ============ the pointer: a brass ring that names what it is over ============ */
  /* Fine pointers only, never with reduced motion, and it steps aside for a dialog:
     a dialog paints in the top layer, above anything the page can place, so the ring
     would sit behind it while the system cursor is hidden. */
  (function pointerRing() {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches || reduced.matches) return;
    const el = document.createElement('div');
    el.className = 'cursor';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<i class="ring"></i><i class="dot"></i><span class="lab"></span>';
    document.body.appendChild(el);
    const lab = $('.lab', el);
    const dialogs = $$('dialog');
    const HOT = 'a[href],button,.shot,.spot,.card,[tabindex]:not([tabindex="-1"])';
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf = 0, live = false;
    function frame() {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      el.style.setProperty('--x', x + 'px');
      el.style.setProperty('--y', y + 'px');
      el.style.setProperty('--rx', rx.toFixed(1) + 'px');
      el.style.setProperty('--ry', ry.toFixed(1) + 'px');
      raf = Math.abs(x - rx) > 0.2 || Math.abs(y - ry) > 0.2 ? requestAnimationFrame(frame) : 0;
    }
    const run = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const hide = () => { live = false; el.classList.remove('on'); document.body.classList.remove('cursor-on'); };
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      /* a dialog, and the map's own iframe, keep the system cursor: the ring cannot
         draw above the top layer, and it never sees a move inside a frame */
      if (dialogs.some((d) => d.open) || (e.target.closest && e.target.closest('.map'))) { if (live) hide(); return; }
      if (!live) { live = true; rx = x; ry = y; el.classList.add('on'); document.body.classList.add('cursor-on'); }
      const named = e.target.closest ? e.target.closest('[data-cursor]') : null;
      if (named) { lab.textContent = named.dataset.cursor; el.classList.add('lab'); el.classList.remove('hot'); }
      else { el.classList.remove('lab'); el.classList.toggle('hot', !!(e.target.closest && e.target.closest(HOT))); }
      run();
    }, { passive: true });
    document.addEventListener('mouseleave', hide);
    addEventListener('blur', hide);
    /* the system cursor comes back the moment a dialog opens, not on the next move */
    if (window.MutationObserver) {
      const sync = () => { if (dialogs.some((d) => d.open) && live) hide(); };
      dialogs.forEach((d) => new MutationObserver(sync).observe(d, { attributes: true, attributeFilter: ['open'] }));
    }
  })();

  /* ============ the room: one point open at a time, tap works like hover ============ */
  (function spots() {
    const all = $$('.spot'); if (!all.length) return;
    const read = $('.spot-read');
    const shut = () => { all.forEach((s) => s.setAttribute('aria-expanded', 'false')); if (read) read.textContent = ''; };
    all.forEach((s) => s.addEventListener('click', (e) => {
      e.stopPropagation();
      const was = s.getAttribute('aria-expanded') === 'true';
      shut();
      s.setAttribute('aria-expanded', String(!was));
      /* the same text under the drawing, where a phone has room for it */
      if (read && !was) read.innerHTML = $('span', s).innerHTML;
    }));
    addEventListener('click', shut);
    addEventListener('keydown', (e) => { if (e.key === 'Escape') shut(); });
  })();

  /* ============ the gallery: any shot enlarges, and the set steps through ============ */
  (function lightbox() {
    const lb = $('#lightbox'); if (!lb) return;
    const shots = $$('.shot:not(.word)'); if (!shots.length) return;
    const art = $('.lb-art', lb), cap = $('.lb-cap', lb), num = $('.lb-n', lb);
    let at = 0, swiped = false;
    function paint(n) {
      at = (n + shots.length) % shots.length;
      const shot = shots[at];
      art.replaceChildren($('.draw', shot).firstElementChild.cloneNode(true));
      cap.textContent = `${$('figcaption b', shot).textContent} — ${shot.dataset.cap || ''}`;
      num.textContent = `${at + 1} / ${shots.length}`;
    }
    function step(d) {
      if (reduced.matches) { paint(at + d); return; }
      lb.classList.add('swap');
      setTimeout(() => { paint(at + d); lb.classList.remove('swap'); }, 170);
    }
    const open = (shot) => { paint(shots.indexOf(shot)); lb.showModal(); };
    shots.forEach((shot) => {
      shot.addEventListener('click', () => open(shot));
      shot.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(shot); } });
    });
    $('.lb-close', lb).addEventListener('click', () => lb.close());
    $('.lb-nav.prev', lb).addEventListener('click', () => step(-1));
    $('.lb-nav.next', lb).addEventListener('click', () => step(1));
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });
    /* a swipe on the enlarged shot moves along the set; it must not read as a
       click on the backdrop, which closes */
    let sx = 0, sy = 0;
    lb.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; swiped = false; });
    lb.addEventListener('pointerup', (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped = true; step(dx < 0 ? 1 : -1); }
    });
    lb.addEventListener('click', (e) => { if (swiped) { swiped = false; return; } if (e.target === lb) lb.close(); });
  })();

  /* ============ faq ============ */
  $$('.faq-q').forEach((b) => b.addEventListener('click', () => {
    const item = b.closest('.faq-item'), open = !item.classList.contains('open');
    item.classList.toggle('open', open);
    b.setAttribute('aria-expanded', String(open));
    $('.faq-a', item).setAttribute('aria-hidden', String(!open));
  }));

  /* ============ today's hours, computed in the shop's own time zone ============ */
  (function todayStatus() {
    const els = $$('[data-today]'); if (!els.length) return;
    /* Po až Pi 09:00 až 19:00, So 09:00 až 14:00, Ne zatvorené. Rovnaké hodiny sú v schéme a v kontakte. */
    const HOURS = { 1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 14], 0: null };
    const W = { open: 'Dnes otvorené do', soon: 'Dnes otvárame o', shut: 'Dnes už zatvorené', none: 'Dnes máme zatvorené', next: 'otvárame', at: 'o', tomorrow: 'zajtra',
      days: ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'] };
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
      text = `${h ? W.shut : W.none}, ${W.next} ${when} ${W.at} ${hm(HOURS[d][0])}`;
    }
    els.forEach((el) => { el.innerHTML = `<span class="dot" aria-hidden="true"></span>${text}`; el.classList.toggle('closed', !open); });
  })();

  /* ============ housekeeping ============ */
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  /* ============ the ticker rides the scroll: faster with it, backwards against it ============ */
  (function ticker() {
    const band = $('.ticker'), track = $('.ticker .track'), row = $('.ticker .row');
    if (!band || !track || !row || reduced.matches) return;
    track.style.animation = 'none';
    let x = 0, half = 0, raf = 0, on = false, last = 0, sv = 0, hold = false;
    const measure = () => { half = row.getBoundingClientRect().width; };
    function frame(t) {
      if (!on || document.hidden) { raf = 0; return; }
      const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      sv += (motion.vel - sv) * Math.min(1, dt * 9);
      motion.vel *= 0.82;
      if (!hold) x -= (34 + Math.max(-250, Math.min(250, sv * 7))) * dt;
      if (half) { if (x <= -half) x += half; else if (x > 0) x -= half; }
      track.style.transform = `translateX(${x.toFixed(2)}px)`;
      raf = requestAnimationFrame(frame);
    }
    const run = () => { if (!raf && on && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    /* Visibility rides the same scroll pass as everything else. An IntersectionObserver without
       a reference of its own was being collected here, and the band silently stopped moving. */
    const look = () => {
      const r = band.getBoundingClientRect();
      const now = r.top < innerHeight && r.bottom > 0;
      if (now !== on) { on = now; run(); }
    };
    onDrive.push(look);
    document.addEventListener('visibilitychange', run);
    addEventListener('resize', () => { measure(); look(); });
    band.addEventListener('pointerenter', () => { hold = true; });
    band.addEventListener('pointerleave', () => { hold = false; });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure(); look();
  })();

  /* ============ the opening: seam, wordmark, one cut, the room opens ============ */
  /* Plays once per tab. Skipped for reduced motion and by Escape, a click or the first scroll. */
  (function opening() {
    const intro = $('#intro');
    const wake = () => requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('open')));
    if (!intro) { wake(); return; }
    let seen = false;
    try { seen = sessionStorage.getItem('bs30.intro') === '1'; } catch (e) {}
    if (reduced.matches || seen) { intro.remove(); wake(); return; }
    try { sessionStorage.setItem('bs30.intro', '1'); } catch (e) {}

    const name = $('.iname', intro);
    name.innerHTML = name.textContent.trim().split('').map((c, i) => (c === ' '
      ? '<span class="sp"></span>'
      : `<span class="sl"><b style="--i:${i}">${c}</b></span>`)).join('');

    document.body.classList.add('intro-on');
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    let done = false;
    function finish(fast) {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      document.body.classList.remove('intro-on');
      document.body.classList.add('open');
      intro.classList.add('part');
      if (fast) intro.classList.add('fast');
      setTimeout(() => intro.remove(), fast ? 620 : 1200);
      removeEventListener('keydown', onKey);
      removeEventListener('wheel', skip);
      removeEventListener('touchmove', skip);
    }
    const skip = () => finish(true);
    const onKey = (e) => { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') skip(); };
    $('.iskip', intro).addEventListener('click', skip);
    intro.addEventListener('click', (e) => { if (e.target === intro || e.target.classList.contains('ipanel')) skip(); });
    addEventListener('keydown', onKey);
    addEventListener('wheel', skip, { passive: true, once: true });
    addEventListener('touchmove', skip, { passive: true, once: true });

    requestAnimationFrame(() => requestAnimationFrame(() => {
      intro.classList.add('seam');                  // the pool of light, the mark draws itself
      at(480, () => intro.classList.add('name'));   // the name rises out of its slots
      at(2450, () => intro.classList.add('cut'));   // the neon holds steady, then the blade
      at(2820, () => finish(false));                // and the two halves part
    }));
  })();
})();
