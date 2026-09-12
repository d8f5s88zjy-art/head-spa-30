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
  const links = $$('.links a[href^="#"]');
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

  /* ============ reveals ============ */
  const rio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    setTimeout(() => e.target.classList.add('done'), 1600);
    rio.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.rv, .divider, .cat').forEach((el) => rio.observe(el));

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

  /* counters in the price head */
  function runCounter(el) {
    const to = +el.dataset.count, suffix = el.dataset.suffix || '';
    if (reduced.matches) { el.textContent = to + suffix; return; }
    const t0 = performance.now(), dur = 1100;
    (function tick(t) {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e) + suffix;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } }), { threshold: 0.6 });
  $$('[data-count]').forEach((el) => cio.observe(el));

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
    applyFilter(c.dataset.filter);
    const top = $('#cennik').getBoundingClientRect().top + scrollY - 70;
    if (scrollY > top) scrollTo({ top, behavior: reduced.matches ? 'auto' : 'smooth' });
  }));
  applyFilter('all');

  /* the light under the cursor */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced.matches) {
    cards.forEach((card) => card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--lx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--ly', ((e.clientY - r.top) / r.height * 100) + '%');
    }));
  }

  /* what the service includes */
  $$('.card-toggle').forEach((b) => b.addEventListener('click', () => {
    const card = b.closest('.card'), panel = $('.panel', card), open = !card.classList.contains('open');
    card.classList.toggle('open', open);
    b.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    $$('li', panel).forEach((li, i) => li.style.setProperty('--i', i));
  }));

  /* ============ the pole: stripes built once, a motor that spins up and slows down ============ */
  (function pole() {
    const g = $('.p-stripes'); if (!g) return;
    const X0 = 52, W = 96, T = 26, RISE = W * Math.tan(35 * Math.PI / 180), P = T * 4;
    const colors = ['#c0392f', '#f4efe4', '#3a5a78', '#f4efe4'];
    let svg = '';
    for (let y = 96 - 3 * P, i = 0; y < 496 + 2 * P; y += T, i++) {
      svg += `<polygon fill="${colors[i % 4]}" points="${X0},${y} ${X0 + W},${y - RISE} ${X0 + W},${y - RISE + T} ${X0},${y + T}"/>`;
    }
    g.innerHTML = svg;
    if (reduced.matches) return;
    let offset = 0, v = 0, target = 1, last = 0, running = false, visible = true;
    const SPEED = P / 3.4;   // one period every 3.4 s at full speed
    function tick(t) {
      if (!running) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      v += (target - v) * Math.min(1, dt * 1.4);   // the motor takes about two seconds to reach speed
      offset = (offset + v * SPEED * dt) % P;
      g.setAttribute('transform', `translate(0 ${-offset})`);
      requestAnimationFrame(tick);
    }
    const start = () => { if (running || !visible || document.hidden) return; running = true; last = performance.now(); requestAnimationFrame(tick); };
    const stop = () => { running = false; };
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0 }).observe($('.pole'));
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    const poleEl = $('.pole');
    poleEl.addEventListener('pointerenter', () => { target = 1.8; });
    poleEl.addEventListener('pointerleave', () => { target = 1; });
    start();
  })();

  /* the hand: layers drift toward the cursor, buttons lean, cards tilt (fine pointers only, never with reduced motion) */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced.matches) {
    const art = $('.art'), hero = $('.hero');
    if (art && hero) {
      const layers = $$('.l', art);
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width - 0.5) * 2, py = ((e.clientY - r.top) / r.height - 0.5) * 2;
        layers.forEach((l) => { const d = +l.dataset.depth || 0; l.style.translate = `${px * d * 18}px ${py * d * 12}px`; });
      });
      hero.addEventListener('pointerleave', () => layers.forEach((l) => { l.style.translate = '0px 0px'; }));
    }
    $$('.btn.primary').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * 8 + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * 6 + 'px');
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
    $$('.whys li').forEach((li) => {
      li.addEventListener('pointermove', (e) => {
        const r = li.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        li.style.setProperty('--lx', x * 100 + '%'); li.style.setProperty('--ly', y * 100 + '%');
        li.style.setProperty('--ry', (x - 0.5) * 6 + 'deg'); li.style.setProperty('--rx', (0.5 - y) * 6 + 'deg');
      });
      li.addEventListener('pointerleave', () => { li.style.setProperty('--rx', '0deg'); li.style.setProperty('--ry', '0deg'); });
    });
  }

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
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('open')));
})();
