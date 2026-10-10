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

  /* Otváracie hodiny (HOURS), rozvrh (TIMETABLE) a sviatky (HOLIDAYS) sú v index.html v skripte hneď za úvodom
     (window.GK), aby úvod ukázal správny stav už pri prvom vykreslení. Upravujú sa len tam. */
  var GK = window.GK;
  window.GK_APP = true;
  var HOURS = GK.HOURS;
  var TIMETABLE = GK.TIMETABLE;

  var DAYS = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa'];
  var DAYS_SHORT = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
  var TAGS = { fitness: 'Fitness', boj: 'Bojové športy', kravmaga: 'Krav Maga', mds: 'Mastro Defence System', pilates: 'Pilates', chrbat: 'Zdravý chrbát', vyziva: 'Výživa' };

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
      paymentAccepted: 'Cash, Credit Card',
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
  /* stav otvorenia, dnešné hodiny, živý riadok úvodu a štítky „Čo je o vás?“ vypisuje GK.paint() (index.html),
     každú minútu presne na celú minútu a po návrate na kartu (GK.start) */
  function nowBA() { return GK.now(); }

  function hoursTable() {
    var shown = -1;
    function draw() {
      var t = nowBA(), today = t.day, hol = GK.info(t, 0).hol;
      if (today === shown) return;
      shown = today;
      $$('[data-hours] tbody').forEach(function (tb) {
        tb.innerHTML = HOURS.map(function (h, i) {
          return '<tr' + (i === today ? ' class="is-today"' : '') + '><td>' + DAYS[i] + (i === today ? ' <small>' + (hol ? 'dnes · sviatok' : 'dnes') + '</small>' : '') + '</td><td>' + mm(h[0]) + ' – ' + mm(h[1]) + '</td></tr>';
        }).join('');
      });
    }
    draw();
    d.addEventListener('gk:tick', draw);
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
    var root = d.documentElement, dockCta = $('.dock-cta'), inHero = null;
    /* kým je úvod na obrazovke aspoň z polovice: v lište nie je druhé volt tlačidlo ani druhý stav otvorenia,
       pravé tlačidlo docku vedie na prvú návštevu; potom sa vráti na „Cenník a vstup“ */
    function heroState(y) {
      var on = y < window.innerHeight * 0.5;
      if (on === inHero) return;
      inHero = on;
      root.classList.toggle('in-hero', on);
      if (dockCta) dockCta.setAttribute('href', on ? '#prva-navsteva' : '#cennik');
    }
    function onScroll() {
      var y = window.scrollY;
      heroState(y);
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
    var items = $$('.reveal');
    if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- úvod: odchod pri rolovaní ----------
     Kde prehliadač vie animation-timeline, robí to CSS na kompozítore (style.css, Réžia 2026-10h). Tu je len záloha
     pre počítač bez tejto podpory (Firefox, staršie Safari): tie isté hodnoty, jeden pasívny listener cez rAF. */
  function heroExit() {
    if (reduce.matches || LITE) return;
    if (window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()')) return;
    var hin = $('.hero-in'), colo = $('.hero-colo'), dim = $('.hero-dim'), media = $('.hero-media');
    if (!hin || !dim || !media) return;
    var tick = false, parked = false;
    function frame() {
      tick = false;
      var y = window.scrollY, vh = window.innerHeight;
      if (y > vh * 1.1) { if (parked) return; parked = true; } else parked = false;
      var k = Math.min(1, y / vh), o = Math.min(1, y / (vh * 0.6));
      var tr = 'translate3d(0,' + (-0.08 * vh * o).toFixed(1) + 'px,0)';
      hin.style.transform = tr; hin.style.opacity = (1 - o).toFixed(3);
      if (colo) { colo.style.transform = tr; colo.style.opacity = (1 - o).toFixed(3); }
      dim.style.opacity = (0.7 * k).toFixed(3);
      media.style.transform = 'scale(' + (1 + 0.06 * k).toFixed(4) + ')';
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
    frame();
  }

  /* ---------- úvod: poistka pre zväčšené písmo v systéme (Android, iOS) ----------
     Ak by sa obsah úvodu dostal pod lištu, najprv sa zmenší nadpis (.is-tight), potom zmizne podnadpis (.is-tight2). */
  function heroFit() {
    var hero = $('.hero'), hin = $('.hero-in'), bar = $('.bar');
    if (!hero || !hin || !bar) return;
    function check() {
      hero.classList.remove('is-tight', 'is-tight2');
      var lim = bar.offsetHeight + 8;
      if (hin.offsetTop >= lim) return;
      hero.classList.add('is-tight');
      if (hin.offsetTop < lim) hero.classList.add('is-tight2');
    }
    check();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(check);
    var t = 0;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(check, 150); });
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

  /* ---------- filmový pás: obraz sa pri rolovaní roztiahne z rámu na celú šírku ---------- */
  function band() {
    var b = $('.band');
    if (!b) return;
    if (reduce.matches) { b.classList.add('static'); return; }
    var on = false, tick = false;
    function frame() {
      tick = false;
      var r = b.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
      var enter = Math.min(1, Math.max(0, (vh - r.top) / vh));          // príchod pásu do obrazu
      var grow = Math.min(1, Math.max(0, p / 0.55));
      b.style.setProperty('--bp', (1 - Math.pow(1 - grow, 3)).toFixed(4));
      b.style.setProperty('--bt', Math.min(1, Math.max(0, (p - 0.3) / 0.35)).toFixed(3));
      if (enter < 1 && p === 0) b.style.setProperty('--bt', '0');
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { on = en[0].isIntersecting; if (on) frame(); }, { rootMargin: '200px 0px' }).observe(b);
    window.addEventListener('scroll', function () { if (on && !tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
    window.addEventListener('resize', frame);
    frame();
  }

  /* ---------- rozvrh ---------- */
  function timetable() {
    var root = $('[data-timetable]');
    if (!root) return;
    var tabs = $('.tt-days', root), list = $('.tt-list', root);
    var today = nowBA().day, sel = today;
    /* najbližší výskyt dňa v týždni (dnes alebo o 1–6 dní) je sviatok? */
    function holOf(day) { var t = nowBA(); return GK.info(t, (day - t.day + 7) % 7).hol; }
    function drawTabs() {
      tabs.innerHTML = DAYS.map(function (n, i) {
        var cnt = TIMETABLE.filter(function (c) { return c.day === i; }).length, hol = holOf(i);
        return '<button class="tt-day' + (i === today ? ' is-today' : '') + '" role="tab" type="button" data-day="' + i + '" aria-selected="' + (i === sel) + '" id="tt-tab-' + i + '">' +
          DAYS_SHORT[i] + '<small>' + (i === today ? (hol ? 'dnes · sviatok' : 'dnes') : hol ? 'sviatok' : (cnt ? cnt + (cnt === 1 ? ' lekcia' : ' lekcie') : 'fitness')) + '</small></button>';
      }).join('');
    }
    drawTabs();
    function render(day, quiet) {
      sel = day;
      list.classList.toggle('tt-quiet', !!quiet);
      $$('.tt-day', tabs).forEach(function (b) { b.setAttribute('aria-selected', String(+b.dataset.day === day)); });
      list.setAttribute('aria-labelledby', 'tt-tab-' + day);
      var h = HOURS[day], hol = holOf(day);
      var rows = TIMETABLE.filter(function (c) { return c.day === day; }).sort(function (a, b) { return a.from.localeCompare(b.from); });
      var html = '<div class="tt-row tt-open" style="animation-delay:0ms">' +
        '<div class="tt-time">' + mm(h[0]) + '<small>do ' + mm(h[1]) + '</small></div>' +
        '<div class="tt-name">Samostatný tréning<span>' + (hol ? 'Sviatok, otváracie hodiny overte telefonicky' : 'Fitness centrum otvorené celý deň, stroje aj voľné váhy') + '</span></div>' +
        '<div class="tt-coach">Bez objednania</div>' +
        '<a class="tt-go" href="#cennik">Cenník</a></div>';
      var now = nowBA(), isToday = day === now.day;
      function toMin(t) { var q = t.split(':'); return +q[0] * 60 + +q[1]; }
      html += rows.map(function (c, i) {
        var st = '', cls = '';
        if (hol) { cls = ' is-past'; st = '<b class="tt-done">Sviatok · overte telefonicky</b>'; }
        else if (isToday) {
          var a = toMin(c.from), b = toMin(c.to);
          if (now.min >= a && now.min < b) { st = '<b class="tt-live">Práve prebieha</b>'; cls = ' is-live'; }
          else if (now.min < a) { var dm = a - now.min; st = '<b class="tt-soon">' + (dm < 60 ? 'o ' + dm + ' min' : 'o ' + Math.floor(dm / 60) + ' h ' + (dm % 60 ? dm % 60 + ' min' : '')) + '</b>'; }
          else { cls = ' is-past'; st = '<b class="tt-done">Skončilo</b>'; }
        }
        return '<div class="tt-row' + cls + '" style="animation-delay:' + ((i + 1) * 60) + 'ms">' +
          '<div class="tt-time">' + c.from + '<small>do ' + c.to + '</small></div>' +
          '<div class="tt-name">' + c.name + st + (c.note ? '<span>' + c.note + '</span>' : '<span>Skupinový tréning</span>') + '</div>' +
          '<div class="tt-coach">' + c.coach + '</div>' +
          '<a class="tt-go" href="#treneri" data-filter-go="' + c.tag + '">Tréner</a></div>';
      }).join('');
      if (!rows.length) html += '<p class="tt-empty">' + DAYS[day] + ' bez skupinových lekcií. ' + (hol ? 'Otváracie hodiny overte telefonicky.' : 'Fitness centrum je otvorené na samostatný tréning.') + '</p>';
      /* minútové obnovenie: bez zmeny nič neprepisovať; inak vrátiť fokus na ten istý odkaz */
      if (html === list._h) return;
      var fi = -1, ae = d.activeElement;
      if (list.contains(ae)) fi = $$('a, button', list).indexOf(ae);
      list.innerHTML = list._h = html;
      if (fi >= 0) { var nf = $$('a, button', list)[fi]; if (nf) nf.focus({ preventScroll: true }); }
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
    /* každú minútu: nový deň prekreslí záložky, dnešný deň sa obnoví bez animácie riadkov */
    d.addEventListener('gk:tick', function () {
      var t = nowBA().day;
      if (t !== today) { if (sel === today) sel = t; today = t; drawTabs(); render(sel, true); }
      else if (sel === today) render(sel, true);
    });
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
    var figs = $$('.shot, .gal-f');
    var dlg = $('#lightbox');
    if (!figs.length || !dlg || !dlg.showModal) return;
    var img = $('img', dlg), cap = $('.lb-cap', dlg), cnt = $('.lb-count', dlg);
    var i = 0;
    function show(n) {
      i = (n + figs.length) % figs.length;
      var f = figs[i], src = f.dataset.full || $('img', f).currentSrc || $('img', f).src;
      img.src = src; img.alt = $('img', f).alt;
      cap.textContent = $('.shot-t', f) ? $('.shot-t', f).textContent + ' · ' + $('.shot-d', f).textContent : ($('figcaption', f) ? $('figcaption', f).textContent : '');
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

  /* ---------- mobilná lišta: skryť pri pätičke, ktorá má vlastné tlačidlá ---------- */
  function dock() {
    var dk = $('.dock'), foot = $('.foot');
    if (!dk || !foot || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (en) { dk.classList.toggle('is-hidden', en[0].isIntersecting); }, { threshold: 0.05 }).observe(foot);
  }

  /* ---------- kontakt: kopírovanie adresy ---------- */
  function copyAddr() {
    var b = $('[data-copy-addr]');
    if (!b) return;
    b.addEventListener('click', function () {
      var t = GYM.street + ', ' + GYM.zip + ' ' + GYM.city;
      var done = function () { b.textContent = 'Adresa skopírovaná'; setTimeout(function () { b.textContent = 'Kopírovať adresu'; }, 2200); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () { b.textContent = t; });
      else b.textContent = t;
    });
  }

  /* ---------- mozaika na telefóne: zbalená na 6 záberov ---------- */
  function moreFold() {
    var box = $('.more'), btn = $('[data-more-btn]');
    if (!box || !btn) return;
    if (!window.matchMedia('(max-width: 700px)').matches) return;
    box.classList.add('is-folded'); btn.hidden = false;
    btn.addEventListener('click', function () {
      box.classList.remove('is-folded'); btn.hidden = true;
      $$('.gal-f.reveal', box).forEach(function (f) { f.classList.add('in'); });
    });
  }

  /* ---------- slová nadpisov (pre vstup s otočením) ---------- */
  function splitWords() {
    $$('.sec-head .h2, .band-in .h2').forEach(function (h) {
      h.innerHTML = h.innerHTML.replace(/(<em>)?([^<\s]+)(<\/em>)?/g, function (m, a, w, b) {
        if (!w.trim()) return m;
        return (a || '') + '<span class="w">' + w + '</span>' + (b || '');
      });
    });
  }

  /* ---------- rastúce čísla (ceny) ---------- */
  function countUp() {
    var els = $$('[data-count]');
    if (!els.length || reduce.matches || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = 900 + to * 6;
        (function f(now) {
          var k = Math.min(1, (now - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
          el.textContent = v + ' €';
          if (k < 1) requestAnimationFrame(f);
        })(t0);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3D naklápanie kariet pod myšou ---------- */
  function tilt() {
    if (LITE || reduce.matches || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $$('[data-tilt]').forEach(function (c) {
      var g = d.createElement('span'); g.className = 'tilt-glare'; c.appendChild(g);
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.classList.add('is-tilt');
        c.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
        c.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      }, { passive: true });
      c.addEventListener('pointerleave', function () { c.classList.remove('is-tilt'); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- mostíky: vstup vety ---------- */
  function bridges() {
    var els = $$('.bridge, .pole-rule');
    if (!els.length || !('IntersectionObserver' in window)) { els.forEach(function (b) { b.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.4 });
    els.forEach(function (b) { io.observe(b); });
  }

  /* ---------- priestor: filmový pás ----------
     Na počítači obraz stojí a zábery sa pri rolovaní strihajú jeden za druhým (tvrdý strih,
     pomalý nájazd kamery počas záberu). Na telefóne a pri obmedzení pohybu je to vodorovný pás na potiahnutie. */
  function reel() {
    var r = $('[data-reel]');
    if (!r) return;
    var shots = $$('.shot', r), n = shots.length, cur = 0;
    var nEl = $('[data-reel-n]', r), bar = $('[data-reel-bar]', r);
    $$('.gal-f').forEach(function (f) {
      f.tabIndex = 0; f.setAttribute('role', 'button');
      f.setAttribute('aria-label', 'Zväčšiť: ' + $('figcaption', f).textContent);
    });
    shots.forEach(function (f) {
      f.tabIndex = 0; f.setAttribute('role', 'button');
      f.setAttribute('aria-label', 'Zväčšiť: ' + $('.shot-t', f).textContent);
    });
    if (reduce.matches) { r.classList.add('static'); return; }
    r.style.setProperty('--n', n);
    var on = false, tick = false;
    function cutTo(i) {
      shots[cur].classList.remove('is-on');
      shots[i].classList.add('is-on');
      cur = i;
      nEl.textContent = pad(i + 1);
      r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash');
    }
    function frame() {
      tick = false;
      var b = r.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, -b.top / Math.max(1, b.height - vh)));
      var x = p * n, i = Math.min(n - 1, Math.floor(x));
      if (i !== cur) cutTo(i);
      r.style.setProperty('--lp', Math.min(1, x - i).toFixed(4));
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { on = en[0].isIntersecting; r.classList.toggle('live', on); if (on) frame(); }, { rootMargin: '100px 0px' }).observe(r);
    window.addEventListener('scroll', function () { if (on && !tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
    window.addEventListener('resize', frame);
    frame();
  }

  /* ---------- filmový strih pri skoku z menu ----------
     Clona sa zatvorí, na čiernej sa ukáže číslo a názov kapitoly, stránka skočí a clona sa otvorí.
     Pri obmedzení pohybu a pri krátkej vzdialenosti sa nepoužije. */
  var CHAPTERS = { preco: ['01', 'Prečo'], priestor: ['02', 'Priestor'], treningy: ['03', 'Tréningy'], treneri: ['04', 'Tréneri'],
    rozvrh: ['05', 'Rozvrh'], cennik: ['06', 'Cenník'], 'prva-navsteva': ['06', 'Prvá návšteva'], recenzie: ['07', 'Recenzie'],
    faq: ['08', 'Otázky'], kontakt: ['09', 'Kontakt'] };
  function filmCut() {
    var c = $('.cut');
    if (!c || reduce.matches) return;
    var busy = false;
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      var id = a.getAttribute('href').slice(1), ch = CHAPTERS[id], el = id && d.getElementById(id);
      if (!ch || !el) return;
      var pad0 = parseFloat(getComputedStyle(d.documentElement).scrollPaddingTop) || 0;
      var y = Math.max(0, Math.min(d.documentElement.scrollHeight - window.innerHeight, el.getBoundingClientRect().top + window.scrollY - pad0));
      if (Math.abs(y - window.scrollY) < window.innerHeight * 1.2) { if (a.closest('.cesta-card, .bridge')) { el.classList.remove('is-focus'); void el.offsetWidth; el.classList.add('is-focus'); } return; }   // blízko: plynulý posun
      e.preventDefault();
      if (busy) return;
      busy = true;
      $('.cut-n', c).textContent = ch[0];
      $('.cut-h', c).textContent = ch[1];
      c.classList.remove('open'); c.classList.add('close');
      setTimeout(function () {
        /* cieľ zmerať až teraz: počas clony sa mohlo dočítať písmo alebo dokresliť sekcia */
        y = Math.max(0, Math.min(d.documentElement.scrollHeight - window.innerHeight, el.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(d.documentElement).scrollPaddingTop) || 0)));
        window.scrollTo({ top: y, behavior: 'instant' });
        try { history.replaceState(null, '', '#' + id); } catch (err) {}
        $$('.reveal', el).forEach(function (r) { r.classList.add('in'); });
        el.classList.remove('is-focus'); void el.offsetWidth; el.classList.add('is-focus');
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      }, 420);
      setTimeout(function () { c.classList.remove('close'); c.classList.add('open'); }, 760);
      setTimeout(function () { c.classList.remove('open'); busy = false; }, 1300);
    }, true);
  }

  /* ---------- hlavička: aktuálna kapitola a jemná paralaxa fotiek ---------- */
  function chapterLine() {
    var sub = $('.brand-sub'), txt = sub && $('span', sub);
    if (!txt) return;
    var ids = ['preco', 'priestor', 'treningy', 'treneri', 'rozvrh', 'cennik', 'recenzie', 'faq', 'kontakt'];
    var secs = ids.map(function (id) { return d.getElementById(id); }).filter(Boolean);
    var base = txt.textContent, cur = base, tick = false, timer = 0;
    var pars = reduce.matches ? [] : $$('[data-par]');
    function frame() {
      tick = false;
      /* v úvode „Lipa Centrum · Nitra“, po odchode z úvodu živý stav (Otvorené do 21:00), v sekciách kapitola */
      var line = window.innerHeight * 0.35, label = window.scrollY > window.innerHeight * 0.5 && GK.last ? GK.last.bar : base;
      secs.forEach(function (el) { if (el.getBoundingClientRect().top <= line) { var c = CHAPTERS[el.id]; label = c[0] + ' · ' + c[1]; } });
      if (label !== cur) {
        cur = label; clearTimeout(timer);
        sub.classList.add('swap');
        timer = setTimeout(function () { txt.textContent = cur; sub.classList.remove('swap'); }, 260);
      }
      var vh = window.innerHeight;
      pars.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var k = ((r.top + r.height / 2) - vh / 2) / vh;            // -1 až 1 okolo stredu obrazovky
        el.style.setProperty('--py2', (k * -26).toFixed(1) + 'px');
      });
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
    window.addEventListener('resize', frame);
    d.addEventListener('gk:tick', frame);
    frame();
  }

  /* ---------- plynulé (zotrvačné) skrolovanie kolieskom ----------
     Len na počítači s myšou. Dotyk, klávesnica a posuvník ostávajú natívne. Vypnúť: SMOOTH_SCROLL = false. */
  var SMOOTH_SCROLL = false;
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
      if (e.defaultPrevented || !a || a.getAttribute('href').length < 2) return;
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

  /* ---------- ukážka z tréningu: video sa načíta až pri priblížení, hrá potichu, keď je aspoň z polovice
     na obrazovke, mimo nej stojí; zvuk zapne tlačidlo. Pri obmedzení pohybu sa samo nespúšťa. ---------- */
  function liveVideo() {
    $$('[data-live-video]').forEach(function (box) {
      var v = $('video', box), snd = $('.lv-sound', box), play = $('.lv-play', box), want = false, user = false;
      if (!v) return;
      /* MP4 (H.264) hrá všade bežne; kde prehliadač H.264 nemá, WebM */
      function load() { if (!v.getAttribute('src')) { v.src = v.canPlayType('video/mp4; codecs="avc1.640028"') || !v.dataset.srcWebm ? v.dataset.src : v.dataset.srcWebm; v.load(); } }
      /* tlačidlo Prehrať len vtedy, keď prehliadač automatické prehrávanie naozaj zakázal */
      function go() { load(); var p = v.play(); if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError' && v.paused) play.hidden = false; }); }
      function stop() { if (!v.paused) v.pause(); }
      if (reduce.matches) play.hidden = false;
      play.addEventListener('click', function () { user = true; play.hidden = true; go(); });
      v.addEventListener('click', function () { if (v.paused) { user = true; play.hidden = true; go(); } else { stop(); play.hidden = false; } });
      v.addEventListener('playing', function () { play.hidden = true; });
      snd.addEventListener('click', function () {
        v.muted = !v.muted;
        snd.setAttribute('aria-pressed', String(!v.muted));
        snd.setAttribute('aria-label', v.muted ? 'Zapnúť zvuk' : 'Vypnúť zvuk');
        if (!v.muted && v.paused) { user = true; go(); }
      });
      if (!('IntersectionObserver' in window)) { if (!reduce.matches) go(); return; }
      new IntersectionObserver(function (en) { if (en[0].isIntersecting) load(); }, { rootMargin: '600px 0px' }).observe(box);
      new IntersectionObserver(function (en) {
        want = en[0].intersectionRatio >= 0.5;
        if (want && (!reduce.matches || user)) go();
        else if (!want) stop();
      }, { threshold: [0, 0.5] }).observe(box);
    });
  }

  /* ---------- štart ----------
     Hneď: to, čo je vidieť v úvode alebo hneď pod ním. Zvyšok po jednej funkcii pri nečinnosti až po otvorení úvodu
     (gk:hero-done), aby hlavné vlákno počas úvodnej sekvencie nič nezdržalo. Pri skoku na sekciu alebo pri rolovaní
     sa zvyšok spustí okamžite. */
  if (LITE) d.body.classList.add('lite');
  fillFacts();
  GK.paint();
  GK.start();
  header();
  reveal();
  dock();
  filmCut();
  heroExit();
  heroFit();
  /* menia výšku stránky (filmový pás, rozvrh, hodiny, mozaika): hneď, aby skok v menu pristál presne */
  hoursTable();
  timetable();
  reel();
  moreFold();
  var later = [splitWords, coaches, chapterLine, band, liveVideo, countUp, tilt, bridges,
    cardGlow, lightbox, faq, copyAddr, mapEmbed, smoothScroll, schema];
  (function () {
    var i = 0, started = false;
    function run(all) {
      while (i < later.length) {
        var fn = later[i++];
        try { fn(); } catch (e) { if (window.console) console.error(e); }
        if (!all) break;
      }
      if (!all && i < later.length) next();
    }
    function next() { if ('requestIdleCallback' in window) requestIdleCallback(function () { run(false); }, { timeout: 500 }); else setTimeout(function () { run(false); }, 30); }
    function start() { if (started) return; started = true; next(); }
    function flush() { window.removeEventListener('scroll', onScroll); if (i < later.length) { started = true; run(true); } }
    function onScroll() { if (window.scrollY > window.innerHeight * 0.3) flush(); }
    /* klik na odkaz v stránke: najprv dokončiť všetko, až potom sa meria cieľ */
    window.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a[href^="#"]')) flush(); }, true);
    if (GK.heroDone || location.hash.length > 1) { flush(); return; }
    d.addEventListener('gk:hero-done', start);
    window.addEventListener('scroll', onScroll, { passive: true });
  })();
  function smoothOn() { requestAnimationFrame(function () { requestAnimationFrame(function () { d.documentElement.classList.add('sm'); }); }); }
  if (d.readyState === 'complete') smoothOn(); else window.addEventListener('load', smoothOn);
})();
