/* GYM KLUB (Lipa Centrum, Nitra) – správanie stránky. Bez závislostí. */
(function () {
  'use strict';

  /* ============================================================
     FAKTY O PODNIKU – jediné miesto, kde sa upravujú.
     Kontakty, hodiny, rozvrh a odkazy prevádzky.
     ============================================================ */
  var GYM = {
    name: 'GYM KLUB',
    fullName: 'GYM KLUB Fitness & Bodybuilding',
    street: 'Výstavná 6',
    place: 'Lipa Centrum',
    district: 'Chrenová',
    zip: '949 01',
    city: 'Nitra',
    phone: '+421 944 800 394',
    email: 'info@gymklub.sk',
    web: 'https://gymklub.sk/',
    instagram: 'https://www.instagram.com/gymklubnitra/',
    facebook: 'https://www.facebook.com/profile.php?id=100057511568169',
    mapQuery: 'Gym Klub, Výstavná 6, 949 01 Nitra',
    url: 'https://d8f5s88zjy-art.github.io/head-spa-30/lipa-gym/'
  };

  /* Otváracie hodiny fitness centra (Európa/Bratislava), [od, do] v minútach od polnoci.
     Index 0 = pondelok. Víkendové hodiny pri zmene upraviť aj v texte FAQ. */
  var HOURS = [
    [6 * 60 + 30, 21 * 60],   // pondelok
    [6 * 60 + 30, 21 * 60],   // utorok
    [6 * 60 + 30, 21 * 60],   // streda
    [6 * 60 + 30, 21 * 60],   // štvrtok
    [6 * 60 + 30, 23 * 60],   // piatok
    [8 * 60, 17 * 60],        // sobota
    [8 * 60, 17 * 60]         // nedeľa
  ];

  /* Harmonogram skupinových tréningov.
     day: 0 = pondelok … 6 = nedeľa. tag zodpovedá filtru trénerov. */
  var TIMETABLE = [
    { day: 0, from: '16:00', to: '17:00', name: 'Pilates', coach: 'Majka Navrátilová', tag: 'pilates' },
    { day: 0, from: '17:00', to: '18:30', name: 'Krav Maga', coach: 'Tomáš Židek', tag: 'kravmaga' },
    { day: 1, from: '17:00', to: '19:00', name: 'Bojové športy', coach: 'Michal Šášik', tag: 'boj', note: 'MMA, Jiu Jitsu, Luta Livre' },
    { day: 1, from: '18:00', to: '19:00', name: 'Zdravý chrbát', coach: 'Nikol Molnárová', tag: 'chrbat' },
    { day: 2, from: '18:00', to: '19:00', name: 'Pilates', coach: 'Majka Navrátilová', tag: 'pilates' },
    { day: 3, from: '17:00', to: '19:00', name: 'Bojové športy', coach: 'Michal Šášik', tag: 'boj', note: 'MMA, Jiu Jitsu, Luta Livre' },
    { day: 3, from: '18:00', to: '19:00', name: 'Zdravý chrbát', coach: 'Nikol Molnárová', tag: 'chrbat' },
    { day: 5, from: '13:00', to: '15:00', name: 'Bojové športy', coach: 'Michal Šášik', tag: 'boj', note: 'MMA, Jiu Jitsu, Luta Livre' }
  ];

  var DAYS = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa'];
  var DAYS_SHORT = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
  var TAGS = { fitness: 'Fitness', boj: 'Bojové športy', kravmaga: 'Krav Maga', pilates: 'Pilates', chrbat: 'Zdravý chrbát', vyziva: 'Výživa' };

  var d = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  /* Odľahčený režim: telefóny a dotykové zariadenia. Bez videa, pohyblivého pozadia a paralaxy. */
  var LITE = window.matchMedia('(max-width: 860px), (hover: none) and (pointer: coarse)').matches;
  if (LITE) document.documentElement.classList.add('lite-root');
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* ---------- fakty do stránky ---------- */
  function fillFacts() {
    var map = {
      name: GYM.name, fullname: GYM.fullName, street: GYM.street, place: GYM.place, district: GYM.district,
      zip: GYM.zip, city: GYM.city, phone: GYM.phone, email: GYM.email
    };
    Object.keys(map).forEach(function (k) {
      $$('[data-fact="' + k + '"]').forEach(function (el) { el.textContent = map[k]; });
    });
    var tel = 'tel:' + GYM.phone.replace(/\s+/g, '');
    $$('[data-fact="phone-link"]').forEach(function (a) { a.href = tel; });
    $$('[data-fact="mail-link"]').forEach(function (a) { a.href = 'mailto:' + GYM.email; });
    $$('[data-fact="map-link"]').forEach(function (a) {
      a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(GYM.mapQuery);
    });
    $$('[data-fact="ig-link"]').forEach(function (a) { a.href = GYM.instagram; });
    $$('[data-fact="fb-link"]').forEach(function (a) { a.href = GYM.facebook; });
    $$('[data-fact="web-link"]').forEach(function (a) { a.href = GYM.web; });
    var year = $('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ---------- schema.org ---------- */
  function schema() {
    var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var gym = {
      '@context': 'https://schema.org',
      '@type': ['HealthClub', 'ExerciseGym', 'SportsActivityLocation'],
      '@id': GYM.url + '#gym',
      name: GYM.fullName,
      alternateName: ['Gym Klub Nitra', 'Lipa Gym Nitra'],
      url: GYM.url,
      image: GYM.url + 'assets/og.jpg',
      logo: GYM.url + 'assets/img/logo-gymklub.png',
      telephone: GYM.phone.replace(/\s+/g, ''),
      email: GYM.email,
      address: { '@type': 'PostalAddress', streetAddress: GYM.street + ' (' + GYM.place + ')', postalCode: GYM.zip, addressLocality: GYM.city, addressCountry: 'SK' },
      areaServed: { '@type': 'City', name: 'Nitra' },
      hasMap: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(GYM.mapQuery),
      currenciesAccepted: 'EUR',
      paymentAccepted: 'Cash',
      priceRange: '3,50 € až 80 €',
      openingHoursSpecification: HOURS.map(function (h, i) {
        return { '@type': 'OpeningHoursSpecification', dayOfWeek: days[i], opens: mm(h[0]), closes: mm(h[1]) };
      }),
      amenityFeature: ['Klimatizácia', 'Posilňovacie stroje', 'Voľné váhy', 'Pomôcky na bojové športy', 'Šatne'].map(function (n) {
        return { '@type': 'LocationFeatureSpecification', name: n, value: true };
      }),
      sameAs: [GYM.web, GYM.instagram, GYM.facebook],
      hasOfferCatalog: {
        '@type': 'OfferCatalog', name: 'Cenník GYM KLUB',
        itemListElement: $$('[data-price]').map(function (el) {
          return { '@type': 'Offer', name: el.dataset.name, price: el.dataset.price, priceCurrency: 'EUR' };
        })
      },
      employee: $$('.coach').map(function (c) {
        return { '@type': 'Person', name: $('.coach-name', c).textContent.trim(), jobTitle: $('.coach-role', c).textContent.trim() };
      })
    };
    var faq = {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: $$('.q').map(function (q) {
        return { '@type': 'Question', name: $('summary', q).textContent.trim(), acceptedAnswer: { '@type': 'Answer', text: $('.a', q).textContent.trim().replace(/\s+/g, ' ') } };
      })
    };
    [gym, faq].forEach(function (obj) {
      var s = d.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(obj);
      d.head.appendChild(s);
    });
  }

  function mm(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- čas v Bratislave ---------- */
  function nowBA() {
    try {
      var f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bratislava', hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit' });
      var parts = {};
      f.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      var wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday);
      var h = parseInt(parts.hour, 10) % 24;
      return { day: wd < 0 ? 0 : wd, min: h * 60 + parseInt(parts.minute, 10) };
    } catch (e) {
      var n = new Date();
      return { day: (n.getDay() + 6) % 7, min: n.getHours() * 60 + n.getMinutes() };
    }
  }

  function openStatus() {
    var els = $$('[data-open-status]');
    if (!els.length) return;
    var t = nowBA();
    var h = HOURS[t.day];
    var text, open = false;
    if (h && t.min >= h[0] && t.min < h[1]) {
      open = true;
      text = (h[1] - t.min <= 60) ? 'Otvorené, zatvárame o ' + mm(h[1]) : 'Otvorené do ' + mm(h[1]);
    } else if (h && t.min < h[0]) {
      text = 'Dnes otvárame o ' + mm(h[0]);
    } else {
      var nd = (t.day + 1) % 7;
      text = 'Zatvorené · zajtra od ' + mm(HOURS[nd][0]);
    }
    els.forEach(function (el) {
      el.textContent = text;
      var wrap = el.closest('.status, .nav-status, .hero-fact');
      if (wrap) wrap.classList.toggle('is-open', open);
    });
    var today = $('[data-today-hours]');
    if (today) today.textContent = mm(h[0]) + ' – ' + mm(h[1]);
  }

  function hoursTable() {
    $$('[data-hours] tbody').forEach(function (tb) {
      var today = nowBA().day;
      tb.innerHTML = HOURS.map(function (h, i) {
        return '<tr' + (i === today ? ' class="is-today"' : '') + '><td>' + DAYS[i] + (i === today ? ' <small>dnes</small>' : '') + '</td><td>' + mm(h[0]) + ' – ' + mm(h[1]) + '</td></tr>';
      }).join('');
    });
  }

  function mapEmbed() {
    var box = $('[data-map]');
    if (!box) return;
    function load() {
      if (box.dataset.loaded) return;
      box.dataset.loaded = '1';
      var f = d.createElement('iframe');
      f.loading = 'lazy';
      f.title = 'Mapa: ' + GYM.fullName + ', ' + GYM.street + ', ' + GYM.city;
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.allowFullscreen = true;
      f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(GYM.mapQuery) + '&z=16&output=embed';
      box.innerHTML = '';
      box.appendChild(f);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en, io) { if (en[0].isIntersecting) { load(); io.disconnect(); } }, { rootMargin: '400px' }).observe(box);
    } else { load(); }
  }

  /* ---------- lišta ---------- */
  function header() {
    var bar = $('.bar'), nav = $('#nav'), burger = $('.burger');
    var spTargets = $$('.progress, .rail-track');
    var lastY = window.scrollY, ticking = false;
    function onScroll() {
      var y = window.scrollY;
      var h = d.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, y / h)) : 0;
      var sp = p.toFixed(4);
      spTargets.forEach(function (el) { el.style.setProperty('--sp', sp); });
      bar.classList.toggle('is-solid', y > 40);
      d.body.classList.toggle('past-hero', y > window.innerHeight);
      if (y > 140 && y > lastY + 4 && !nav.classList.contains('is-open')) bar.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 140) bar.classList.remove('is-hidden');
      lastY = y;
      $('.totop').classList.toggle('is-on', y > 700);
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    function setNav(open) {
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Zavrieť menu' : 'Otvoriť menu');
      d.body.classList.toggle('nav-open', open);
    }
    burger.addEventListener('click', function () { setNav(!nav.classList.contains('is-open')); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); burger.focus(); } });
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (e) { if (e.matches) setNav(false); });

    var links = $$('a[href^="#"]', nav);
    var secs = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      secs.forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- odhaľovanie ---------- */
  function reveal() {
    var items = $$('.reveal').filter(function (el) { return !(INTRO && el.closest('.hero')); });
    if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- otvorenie: zapnutie svetiel v hale ----------
     Úvod je tmavý, svetlá dvakrát bliknú a zostanú svietiť, kamera pomaly nabieha,
     potom vybehne nadpis. Preskočí sa pri obmedzení pohybu, pri odkaze na sekciu
     a pri opakovanom načítaní v tej istej karte. */
  var INTRO = false;
  function intro() {
    var img = $('.hero-img');
    if (!img) return;
    var skip = reduce.matches || location.hash.length > 1;
    try { if (sessionStorage.getItem('gk-intro')) skip = true; } catch (e) {}
    if (skip) return;
    INTRO = true;
    d.body.classList.add('intro');
    try { sessionStorage.setItem('gk-intro', '1'); } catch (e) {}
    var heroBits = $$('.hero .reveal');
    heroBits.forEach(function (el) { el.style.transition = 'none'; });
    var started = false, opened = false;
    function start() {
      if (started) return;
      started = true;
      d.body.classList.add('lights');
      setTimeout(open, 1750);
    }
    function open() {
      if (opened) return;
      opened = true;
      d.body.classList.add('is-loaded');
      heroBits.forEach(function (el, i) {
        el.style.transition = '';
        void el.offsetWidth;
        el.style.transitionDelay = (0.35 + i * 0.12) + 's';
        el.classList.add('in');
      });
      d.body.classList.remove('intro');
      d.body.classList.add('intro-done');
    }
    var t = setTimeout(start, 1200);
    (img.decode ? img.decode() : Promise.resolve()).then(function () { clearTimeout(t); start(); }, function () { clearTimeout(t); start(); });
    $('.hero').addEventListener('click', function () { if (started && !opened) open(); });
  }

  function hero() {
    var done = false;
    function loaded() { if (done || INTRO) return; done = true; d.body.classList.add('is-loaded'); }
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(loaded);
    setTimeout(loaded, 600);
  }

  /* ---------- úvod: paralaxa pri skrolovaní ---------- */
  function heroParallax() {
    if (reduce.matches || LITE) return;
    var hin = $('.hero-in'), stage = $('.hero-media');
    if (!hin || !stage) return;
    var tick = false;
    function frame() {
      tick = false;
      var y = window.scrollY, vh = window.innerHeight;
      if (y > vh * 1.2) return;
      var k = Math.min(1, y / (vh * 0.9));
      hin.style.transform = 'translate3d(0,' + (y * 0.28).toFixed(1) + 'px,0)';
      hin.style.opacity = Math.max(0, 1 - k * 1.1).toFixed(3);
      stage.style.transform = 'translate3d(0,' + (y * 0.35).toFixed(1) + 'px,0)';
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
    frame();
  }

  function cardGlow() {
    if (LITE || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $$('.glowcard').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }, { passive: true });
    });
  }

  function marquee() {
    var t = $('.marquee-track');
    if (t) t.innerHTML += t.innerHTML;
  }

  /* ---------- rozvrh ---------- */
  function timetable() {
    var root = $('[data-timetable]');
    if (!root) return;
    var tabs = $('.tt-days', root), list = $('.tt-list', root);
    var today = nowBA().day, sel = today;
    tabs.innerHTML = DAYS.map(function (n, i) {
      var cnt = TIMETABLE.filter(function (c) { return c.day === i; }).length;
      return '<button class="tt-day' + (i === today ? ' is-today' : '') + '" role="tab" type="button" data-day="' + i + '" aria-selected="' + (i === sel) + '" id="tt-tab-' + i + '">' +
        DAYS_SHORT[i] + '<small>' + (i === today ? 'dnes' : (cnt ? cnt + (cnt === 1 ? ' lekcia' : ' lekcie') : 'fitness')) + '</small></button>';
    }).join('');
    function render(day) {
      sel = day;
      $$('.tt-day', tabs).forEach(function (b) { b.setAttribute('aria-selected', String(+b.dataset.day === day)); });
      list.setAttribute('aria-labelledby', 'tt-tab-' + day);
      var h = HOURS[day];
      var rows = TIMETABLE.filter(function (c) { return c.day === day; }).sort(function (a, b) { return a.from.localeCompare(b.from); });
      var html = '<div class="tt-row tt-open" style="animation-delay:0ms">' +
        '<div class="tt-time">' + mm(h[0]) + '<small>do ' + mm(h[1]) + '</small></div>' +
        '<div class="tt-name">Samostatný tréning<span>Fitness centrum otvorené celý deň, stroje aj voľné váhy</span></div>' +
        '<div class="tt-coach">Bez objednania</div>' +
        '<a class="tt-go" href="#cennik">Cenník</a></div>';
      html += rows.map(function (c, i) {
        return '<div class="tt-row" style="animation-delay:' + ((i + 1) * 60) + 'ms">' +
          '<div class="tt-time">' + c.from + '<small>do ' + c.to + '</small></div>' +
          '<div class="tt-name">' + c.name + (c.note ? '<span>' + c.note + '</span>' : '<span>Skupinový tréning</span>') + '</div>' +
          '<div class="tt-coach">' + c.coach + '</div>' +
          '<a class="tt-go" href="#treneri" data-filter-go="' + c.tag + '">Tréner</a></div>';
      }).join('');
      if (!rows.length) html += '<p class="tt-empty">' + DAYS[day] + ' bez skupinových lekcií. Fitness centrum je otvorené na samostatný tréning.</p>';
      list.innerHTML = html;
    }
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('.tt-day');
      if (b) render(+b.dataset.day);
    });
    tabs.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var n = (sel + (e.key === 'ArrowRight' ? 1 : -1) + 7) % 7;
      render(n);
      $('#tt-tab-' + n).focus();
    });
    list.addEventListener('click', function (e) {
      var a = e.target.closest('[data-filter-go]');
      if (a) setCoachFilter(a.dataset.filterGo);
    });
    render(sel);
  }

  /* ---------- tréneri: filter ---------- */
  var setCoachFilter = function () {};
  function coaches() {
    var root = $('#treneri');
    if (!root) return;
    var chips = $$('.chip', root), cards = $$('.coach', root), count = $('[data-coach-count]', root);
    function apply(tag) {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.tag === tag)); });
      var n = 0;
      cards.forEach(function (c) {
        var on = tag === 'all' || (c.dataset.tags || '').split(' ').indexOf(tag) >= 0;
        c.hidden = !on;
        if (on) n++;
      });
      if (count) count.textContent = n === 1 ? '1 tréner' : n < 5 ? n + ' tréneri' : n + ' trénerov';
    }
    chips.forEach(function (c) { c.addEventListener('click', function () { apply(c.dataset.tag); }); });
    setCoachFilter = function (tag) { if (TAGS[tag]) apply(tag); };
    apply('all');
  }

  /* ---------- galéria: lightbox ---------- */
  function lightbox() {
    var figs = $$('.gal-item');
    var dlg = $('#lightbox');
    if (!figs.length || !dlg || !dlg.showModal) return;
    var img = $('img', dlg), cap = $('.lb-cap', dlg), cnt = $('.lb-count', dlg);
    var i = 0;
    function show(n) {
      i = (n + figs.length) % figs.length;
      var f = figs[i], src = f.dataset.full || $('img', f).currentSrc || $('img', f).src;
      img.src = src; img.alt = $('img', f).alt;
      cap.textContent = $('figcaption', f) ? $('figcaption', f).textContent : '';
      cnt.textContent = (i + 1) + ' / ' + figs.length;
    }
    figs.forEach(function (f, n) {
      f.addEventListener('click', function () { show(n); dlg.showModal(); d.body.classList.add('lb-open'); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f.click(); } });
    });
    $('.lb-prev', dlg).addEventListener('click', function () { show(i - 1); });
    $('.lb-next', dlg).addEventListener('click', function () { show(i + 1); });
    $('.lb-close', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { d.body.classList.remove('lb-open'); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(i + 1);
      if (e.key === 'ArrowLeft') show(i - 1);
    });
    // potiahnutie prstom
    var sx = null;
    dlg.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------- kontaktný formulár: pripravený e-mail ---------- */
  function contactForm() {
    var form = $('#contact-form');
    if (!form) return;
    var err = $('[data-error]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.hidden = true;
      var f = form.elements;
      var name = f.name.value.trim(), contact = f.contact.value.trim(), topic = f.topic.value, msg = f.msg.value.trim();
      var problems = [];
      if (name.length < 2) problems.push('meno');
      if (contact.length < 5) problems.push('telefón alebo e-mail');
      if (msg.length < 3) problems.push('správa');
      if (problems.length) {
        err.textContent = 'Skontroluj prosím: ' + problems.join(', ') + '.';
        err.hidden = false;
        (problems[0] === 'meno' ? f.name : problems[0] === 'správa' ? f.msg : f.contact).focus();
        return;
      }
      var body = 'Dobrý deň,\n\n' + msg + '\n\nMeno: ' + name + '\nKontakt: ' + contact + '\nTéma: ' + topic + '\n\n(odoslané z webu GYM KLUB)';
      window.location.href = 'mailto:' + GYM.email + '?subject=' + encodeURIComponent(topic + ' – ' + name) + '&body=' + encodeURIComponent(body);
      form.classList.add('is-sent');
      $('[data-sent]', form).hidden = false;
    });
  }

  /* ---------- mobilná lišta: skryť pri formulári a lightboxe ---------- */
  function dock() {
    var dk = $('.dock'), form = $('#contact-form');
    if (!dk || !form || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (en) { dk.classList.toggle('is-hidden', en[0].isIntersecting); }, { threshold: 0.2 }).observe(form);
  }

  /* ---------- skrolovacia vrstva cez celú stránku ---------- */
  function scrollFx() {
    if (reduce.matches || LITE) return;
    var shapes = $$('.bgs').map(function (el) {
      return { el: el, speed: +el.dataset.speed, rot: +el.dataset.rot, top: +el.dataset.top / 100, size: 200 };
    });
    function measure() { shapes.forEach(function (sh) { sh.size = sh.el.offsetHeight || 200; }); }
    measure();
    window.addEventListener('resize', measure);
    var wms = $$('.has-wm').map(function (sec) {
      var w = d.createElement('span');
      w.className = 'wm'; w.setAttribute('aria-hidden', 'true'); w.textContent = sec.dataset.wm;
      sec.insertBefore(w, sec.firstChild);
      return { sec: sec, el: w };
    });
    var heads = $$('.has-wm .sec-head').map(function (h) {
      h.classList.remove('reveal'); h.classList.add('in');
      return { el: h, k: $('.kicker', h) };
    });
    var marquee = $('.marquee');
    var rail = $('.rail'), dotsBox = $('.rail-dots'), dots = [];
    if (rail) {
      ['treningy', 'cennik', 'rozvrh', 'treneri', 'priestor', 'recenzie', 'faq', 'kontakt'].forEach(function (id) {
        var sec = $('#' + id); if (!sec) return;
        var a = d.createElement('a');
        a.href = '#' + id; a.dataset.label = sec.dataset.wm || id; a.setAttribute('aria-label', a.dataset.label);
        dotsBox.appendChild(a); dots.push({ a: a, sec: sec });
      });
    }
    function placeDots() {
      var max = d.documentElement.scrollHeight - window.innerHeight;
      dots.forEach(function (dt) {
        var top = dt.sec.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.4;
        dt.a.style.top = (Math.min(1, Math.max(0, top / max)) * 100).toFixed(2) + '%';
      });
    }
    placeDots();
    window.addEventListener('resize', placeDots);
    setTimeout(placeDots, 1500);
    setTimeout(placeDots, 4000);

    var lastY = window.scrollY, vel = 0, ticking = false;
    function frame() {
      var y = window.scrollY, vh = window.innerHeight;
      var dy = y - lastY; lastY = y;
      vel += (dy - vel) * 0.18;
      if (Math.abs(vel) < 0.05) vel = 0;
      shapes.forEach(function (sh) {
        var L = vh + sh.size;
        var ty = (((sh.top * vh - y * sh.speed) % L) + L) % L - sh.size;
        sh.el.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0) rotate(' + (y * sh.rot).toFixed(2) + 'deg)';
      });
      wms.forEach(function (w) {
        var r = w.sec.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var v = (vh - r.top) / (vh + r.height);
        w.el.style.transform = 'translate3d(' + ((0.5 - v) * 28).toFixed(2) + 'vw,' + ((v - 0.5) * -12).toFixed(2) + 'vh,0)';
      });
      heads.forEach(function (h) {
        var r = h.el.getBoundingClientRect();
        if (r.top > vh + 80 || r.bottom < -80) return;
        var v = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.55)));
        var e = 1 - Math.pow(1 - v, 3);
        h.el.style.opacity = e.toFixed(3);
        h.el.style.transform = 'translate3d(0,' + ((1 - e) * 56).toFixed(1) + 'px,0)';
        if (h.k) h.k.style.transform = 'translate3d(' + ((1 - e) * -16).toFixed(1) + 'px,0,0)';
      });
      if (marquee) marquee.style.transform = 'skewX(' + Math.max(-14, Math.min(14, -vel * 0.35)).toFixed(2) + 'deg)';
      var active = null;
      dots.forEach(function (dt) { if (dt.sec.getBoundingClientRect().top <= vh * 0.45) active = dt; });
      dots.forEach(function (dt) { dt.a.classList.toggle('is-active', dt === active); });
      ticking = false;
      if (vel !== 0) requestAnimationFrame(tick);
    }
    function tick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    frame();
  }

  /* ---------- plynulé (zotrvačné) skrolovanie kolieskom ----------
     Len na počítači s myšou. Dotyk, klávesnica a posuvník ostávajú natívne. Vypnúť: SMOOTH_SCROLL = false. */
  var SMOOTH_SCROLL = true;
  function smoothScroll() {
    if (!SMOOTH_SCROLL || reduce.matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var target = window.scrollY, current = target, running = false;
    var EASE = 0.11;
    function max() { return d.documentElement.scrollHeight - window.innerHeight; }
    function loop() {
      if (!running) return;
      var diff = target - current;
      if (Math.abs(diff) < 0.4) { current = target; window.scrollTo({ top: current, behavior: 'instant' }); running = false; return; }
      current += diff * EASE;
      window.scrollTo({ top: current, behavior: 'instant' });
      requestAnimationFrame(loop);
    }
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey) return;
      if (d.body.classList.contains('nav-open') || d.body.classList.contains('lb-open')) return;
      if (e.target.closest && e.target.closest('textarea, select, .tt-days, dialog, [data-native-scroll]')) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 18; else if (e.deltaMode === 2) dy *= window.innerHeight;
      e.preventDefault();
      if (!running) { current = window.scrollY; target = current; }
      target = Math.max(0, Math.min(max(), target + dy));
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: false });
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      var el = $(a.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      var pad = a.getAttribute('href') === '#top' ? 0 : (parseFloat(getComputedStyle(d.documentElement).scrollPaddingTop) || 0);
      if (!running) { current = window.scrollY; }
      target = Math.max(0, Math.min(max(), el.getBoundingClientRect().top + window.scrollY - pad));
      try { history.replaceState(null, '', a.getAttribute('href')); } catch (err) {}
      if (!running) { running = true; requestAnimationFrame(loop); }
    });
    window.addEventListener('scroll', function () {
      if (Math.abs(window.scrollY - current) > 2) { current = target = window.scrollY; running = false; }
    }, { passive: true });
    window.addEventListener('resize', function () { target = Math.min(target, max()); });
  }

  /* ---------- otváranie otázok ---------- */
  function faq() {
    $$('.q').forEach(function (q) {
      var sum = $('summary', q), a = $('.a', q), busy = false;
      sum.addEventListener('click', function (e) {
        if (reduce.matches) return;
        e.preventDefault();
        if (busy) return;
        busy = true;
        q.classList.add('is-anim');
        if (q.open) {
          a.style.height = a.scrollHeight + 'px';
          requestAnimationFrame(function () { a.style.height = '0px'; a.style.opacity = '0'; });
          a.addEventListener('transitionend', function done() {
            a.removeEventListener('transitionend', done);
            q.open = false; a.style.height = ''; a.style.opacity = ''; q.classList.remove('is-anim'); busy = false;
          });
        } else {
          q.open = true;
          var h = a.scrollHeight;
          a.style.height = '0px'; a.style.opacity = '0';
          requestAnimationFrame(function () { a.style.height = h + 'px'; a.style.opacity = '1'; });
          a.addEventListener('transitionend', function done() {
            a.removeEventListener('transitionend', done);
            a.style.height = ''; a.style.opacity = ''; q.classList.remove('is-anim'); busy = false;
          });
        }
      });
    });
  }

  /* ---------- štart ---------- */
  if (LITE) d.body.classList.add('lite');
  intro();
  fillFacts();
  openStatus();
  setInterval(openStatus, 60000);
  hoursTable();
  mapEmbed();
  header();
  reveal();
  hero();
  cardGlow();
  marquee();
  timetable();
  coaches();
  lightbox();
  contactForm();
  dock();
  faq();
  heroParallax();
  scrollFx();
  smoothScroll();
  schema();
})();
