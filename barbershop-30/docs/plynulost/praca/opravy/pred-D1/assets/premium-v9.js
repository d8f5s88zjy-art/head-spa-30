/* HEAD SPA 30 — V9 interaction director.
   Adds premium choreography while preserving the site's existing booking,
   forms, i18n, canvas hero, analytics boundaries and verified content. */
(() => {
  'use strict';
  const d = document;
  const root = d.documentElement;
  const body = d.body;
  if (!body || body.dataset.v9Ready === '1') return;
  body.dataset.v9Ready = '1';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const constrained = !!(conn && conn.saveData) || (navigator.deviceMemory && navigator.deviceMemory < 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);

  // 1) Global scroll progress. Transform-only, one rAF per frame.
  const progress = d.createElement('div');
  progress.className = 'v9-progress';
  progress.setAttribute('aria-hidden','true');
  body.appendChild(progress);

  let scrollTick = false;
  function paintScroll(){
    const max = Math.max(1, d.documentElement.scrollHeight - innerHeight);
    const p = Math.max(0, Math.min(1, scrollY / max));
    root.style.setProperty('--v9-scroll', p.toFixed(4));
    body.classList.toggle('v9-scrolled', scrollY > 30);
    scrollTick = false;
  }
  function queueScroll(){
    if (!scrollTick){ scrollTick = true; requestAnimationFrame(paintScroll); }
  }
  addEventListener('scroll', queueScroll, {passive:true});
  addEventListener('resize', queueScroll, {passive:true});
  paintScroll();

  // 3) Scene-aware atmosphere + active nav state.
  const sceneNodes = [...d.querySelectorAll('[data-scene]')].filter(el => el.matches('section, .hero, .hero-static, footer'));
  const navLinks = [...d.querySelectorAll('.nav .links a[href^="#"]')];
  const hrefMap = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
  let activeId = '';

  function setActiveScene(el){
    if (!el) return;
    const scene = el.dataset.scene || el.id || 'default';
    body.dataset.v9Scene = scene;
    const id = el.id || '';
    if (id && id !== activeId){
      activeId = id;
      navLinks.forEach(a => a.classList.toggle('v9-active', a === hrefMap.get(id)));
    }
  }

  if ('IntersectionObserver' in window){
    const sceneObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActiveScene(visible[0].target);
    }, {rootMargin:'-18% 0px -54% 0px', threshold:[.08,.2,.4,.6]});
    sceneNodes.forEach(el => sceneObserver.observe(el));
  }

  // 4) Gentle reveal state for section headings.
  if ('IntersectionObserver' in window && !reduce.matches){
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('v9-inview', entry.isIntersecting));
    }, {rootMargin:'-8% 0px -14% 0px', threshold:.08});
    d.querySelectorAll('.site>section').forEach(el => reveal.observe(el));
  } else {
    d.querySelectorAll('.site>section').forEach(el => el.classList.add('v9-inview'));
  }

  // 8) Keep outbound business actions observable without claiming a conversion.
  // Only pushes into an existing dataLayer if one is already present.
  function softTrack(name, payload){
    if (!Array.isArray(window.dataLayer)) return;
    window.dataLayer.push(Object.assign({event:name, site:'headspa30', layer:'v9'}, payload||{}));
  }
  d.addEventListener('click', e => {
    const a=e.target.closest('a'); if (!a) return;
    const href=a.getAttribute('href')||'';
    if (a.hasAttribute('data-booking-link') || href.includes('/rezervacia/')) softTrack('booking_opened',{label:(a.textContent||'').trim().slice(0,80)});
    else if (a.hasAttribute('data-voucher-link') || href.includes('/eshop/')) softTrack('voucher_shop_opened');
    else if (href.startsWith('tel:')) softTrack('phone_opened');
    else if (href.includes('google.com/maps')) softTrack('map_opened');
  });

  // 9) Respect dynamic reduced-motion preference changes.
  reduce.addEventListener?.('change', e => {
    body.classList.toggle('v9-reduced', e.matches);
    if (e.matches) body.classList.remove('v9-pointer');
  });
  body.classList.toggle('v9-reduced', reduce.matches);

  // 10) Page lifecycle: decorative motion should never work while hidden.
  d.addEventListener('visibilitychange', () => body.classList.toggle('v9-paused', d.hidden));
})();
