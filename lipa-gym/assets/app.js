/* LIPA GYM – správanie stránky. Bez závislostí. */
(function () {
  'use strict';

  /* ============================================================
     FAKTY O PODNIKU – jediné miesto, kde sa upravujú.
     Hodnoty s DOPLNIŤ sú zástupné. Kým nie sú potvrdené, web ich
     ukazuje ako „doplníme“ a nevytvára odkazy na telefón či mapu.
     ============================================================ */
  var GYM = {
    name: 'LIPA GYM',
    street: '',            // DOPLNIŤ, napr. 'Fatranská 1'
    zip: '',               // DOPLNIŤ, napr. '949 01'
    city: '',              // DOPLNIŤ, napr. 'Nitra'
    phone: '',             // DOPLNIŤ, napr. '+421 900 000 000'
    whatsapp: '',          // DOPLNIŤ, číslo bez medzier a bez +, napr. '421900000000'
    email: '',             // DOPLNIŤ, napr. 'info@lipagym.sk'
    instagram: '',         // DOPLNIŤ, napr. 'https://www.instagram.com/lipagym/'
    facebook: '',          // DOPLNIŤ (nepovinné)
    mapQuery: '',          // DOPLNIŤ, presná adresa pre Google mapu, napr. 'Fatranská 1, Nitra'
    geo: null,             // DOPLNIŤ, napr. { lat: 48.30, lng: 18.09 }
    url: 'https://d8f5s88zjy-art.github.io/head-spa-30/lipa-gym/'
  };

  /* Otváracie hodiny (Európa/Bratislava). Pole [od, do] v minútach od polnoci
     alebo null pre zatvorené. Index 0 = pondelok. DOPLNIŤ podľa skutočnosti. */
  var HOURS = [
    [6 * 60, 22 * 60],   // pondelok
    [6 * 60, 22 * 60],   // utorok
    [6 * 60, 22 * 60],   // streda
    [6 * 60, 22 * 60],   // štvrtok
    [6 * 60, 22 * 60],   // piatok
    [8 * 60, 20 * 60],   // sobota
    [8 * 60, 20 * 60]    // nedeľa
  ];
  var HOURS_VERIFIED = false; // DOPLNIŤ: po potvrdení hodín prepnúť na true, zobrazí sa stav „Otvorené“

  /* Ukážkový rozvrh skupinových tréningov. DOPLNIŤ skutočné lekcie.
     day: 0 = pondelok … 6 = nedeľa, lvl: 1 až 3 */
  var TIMETABLE = [
    { day: 0, time: '07:00', len: 45, name: 'Ranný kruhový tréning', kind: 'Kondícia', coach: 'Tréner doplníme', lvl: 2 },
    { day: 0, time: '17:30', len: 60, name: 'Sila a technika', kind: 'Voľné činky', coach: 'Tréner doplníme', lvl: 2 },
    { day: 0, time: '19:00', len: 45, name: 'Mobilita a core', kind: 'Regenerácia', coach: 'Tréner doplníme', lvl: 1 },
    { day: 1, time: '17:00', len: 45, name: 'Kettlebell flow', kind: 'Funkčná zóna', coach: 'Tréner doplníme', lvl: 2 },
    { day: 1, time: '18:30', len: 45, name: 'HIIT', kind: 'Kondícia', coach: 'Tréner doplníme', lvl: 3 },
    { day: 2, time: '07:00', len: 45, name: 'Ranný kruhový tréning', kind: 'Kondícia', coach: 'Tréner doplníme', lvl: 2 },
    { day: 2, time: '18:00', len: 60, name: 'Sila a technika', kind: 'Voľné činky', coach: 'Tréner doplníme', lvl: 2 },
    { day: 3, time: '17:30', len: 45, name: 'Kruhový tréning', kind: 'Kondícia', coach: 'Tréner doplníme', lvl: 2 },
    { day: 3, time: '19:00', len: 45, name: 'Mobilita a core', kind: 'Regenerácia', coach: 'Tréner doplníme', lvl: 1 },
    { day: 4, time: '17:00', len: 45, name: 'HIIT', kind: 'Kondícia', coach: 'Tréner doplníme', lvl: 3 },
    { day: 5, time: '09:00', len: 60, name: 'Sobotná sila', kind: 'Voľné činky', coach: 'Tréner doplníme', lvl: 2 },
    { day: 5, time: '10:30', len: 45, name: 'Začiatočníci: základy', kind: 'Prevedenie fitkom', coach: 'Tréner doplníme', lvl: 1 }
  ];

  var DAYS = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa'];
  var DAYS_SHORT = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
  var LVL = ['', 'Ľahká', 'Stredná', 'Náročná'];

  var d = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* ---------- fakty do stránky ---------- */
  function fillFacts() {
    var map = {
      name: GYM.name,
      street: GYM.street,
      zip: GYM.zip,
      city: GYM.city,
      phone: GYM.phone,
      email: GYM.email
    };
    var fallback = { street: 'Adresu doplníme', zip: '', city: 'Mesto doplníme', phone: 'Telefón doplníme', email: 'E-mail doplníme' };
    Object.keys(map).forEach(function (k) {
      $$('[data-fact="' + k + '"]').forEach(function (el) {
        el.textContent = map[k] || fallback[k] || '';
      });
    });
    $$('[data-fact="phone-link"]').forEach(function (a) {
      if (GYM.phone) a.href = 'tel:' + GYM.phone.replace(/\s+/g, '');
    });
    $$('[data-fact="mail-link"]').forEach(function (a) {
      if (GYM.email) a.href = 'mailto:' + GYM.email;
    });
    $$('[data-fact="map-link"]').forEach(function (a) {
      if (GYM.mapQuery) {
        a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(GYM.mapQuery);
      } else { a.removeAttribute('target'); }
    });
    $$('[data-fact="ig-link"]').forEach(function (a) {
      if (GYM.instagram) a.href = GYM.instagram; else a.hidden = true;
    });
    var year = $('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ---------- schema.org ---------- */
  function schema() {
    var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var spec = HOURS.map(function (h, i) {
      return h ? { '@type': 'OpeningHoursSpecification', dayOfWeek: days[i], opens: mm(h[0]), closes: mm(h[1]) } : null;
    }).filter(Boolean);
    var gym = {
      '@context': 'https://schema.org',
      '@type': ['HealthClub', 'ExerciseGym', 'SportsActivityLocation'],
      '@id': GYM.url + '#gym',
      name: GYM.name,
      url: GYM.url,
      image: GYM.url + 'assets/og.jpg',
      logo: GYM.url + 'assets/favicon.svg',
      currenciesAccepted: 'EUR',
      amenityFeature: ['Voľná činková zóna', 'Stroje', 'Cardio zóna', 'Funkčná zóna', 'Skupinové tréningy', 'Osobný tréning', 'Šatne a sprchy'].map(function (n) {
        return { '@type': 'LocationFeatureSpecification', name: n, value: true };
      })
    };
    if (GYM.phone) gym.telephone = GYM.phone.replace(/\s+/g, '');
    if (GYM.email) gym.email = GYM.email;
    if (GYM.street) gym.address = { '@type': 'PostalAddress', streetAddress: GYM.street, postalCode: GYM.zip, addressLocality: GYM.city, addressCountry: 'SK' };
    if (GYM.geo) gym.geo = { '@type': 'GeoCoordinates', latitude: GYM.geo.lat, longitude: GYM.geo.lng };
    if (HOURS_VERIFIED) gym.openingHoursSpecification = spec;
    var same = [GYM.instagram, GYM.facebook].filter(Boolean);
    if (same.length) gym.sameAs = same;
    var faq = {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: $$('.q').map(function (q) {
        return { '@type': 'Question', name: $('summary', q).textContent.trim(), acceptedAnswer: { '@type': 'Answer', text: $('.a', q).textContent.trim() } };
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
    if (!HOURS_VERIFIED) {
      text = h ? 'Dnes ' + mm(h[0]) + ' až ' + mm(h[1]) : 'Dnes zatvorené';
    } else if (h && t.min >= h[0] && t.min < h[1]) {
      open = true;
      text = 'Otvorené do ' + mm(h[1]);
    } else if (h && t.min < h[0]) {
      text = 'Otvárame o ' + mm(h[0]);
    } else {
      var next = null;
      for (var i = 1; i <= 7; i++) {
        var dd = (t.day + i) % 7;
        if (HOURS[dd]) { next = { day: dd, from: HOURS[dd][0] }; break; }
      }
      text = next ? (i === 1 ? 'Zajtra od ' + mm(next.from) : DAYS[next.day] + ' od ' + mm(next.from)) : 'Zatvorené';
      if (h && t.min >= h[1]) text = 'Dnes už zatvorené · ' + text.toLowerCase();
    }
    els.forEach(function (el) {
      el.textContent = text;
      var wrap = el.closest('.status, .nav-status');
      if (wrap) wrap.classList.toggle('is-open', open);
    });
  }

  function hoursTable() {
    var tb = $('[data-hours] tbody');
    if (!tb) return;
    var today = nowBA().day;
    tb.innerHTML = HOURS.map(function (h, i) {
      var cls = (i === today ? 'is-today' : '') + (h ? '' : ' is-closed');
      return '<tr class="' + cls.trim() + '"><td>' + DAYS[i] + '</td><td>' + (h ? mm(h[0]) + ' – ' + mm(h[1]) : 'Zatvorené') + '</td></tr>';
    }).join('');
  }

  function mapEmbed() {
    var box = $('[data-map]');
    if (!box || !GYM.mapQuery) return;
    var f = d.createElement('iframe');
    f.loading = 'lazy';
    f.title = 'Mapa: ' + GYM.name;
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(GYM.mapQuery) + '&output=embed';
    box.innerHTML = '';
    box.style.borderStyle = 'solid';
    box.appendChild(f);
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
      if (y > 120 && y > lastY + 4 && !nav.classList.contains('is-open')) bar.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 120) bar.classList.remove('is-hidden');
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
    window.matchMedia('(min-width: 821px)').addEventListener('change', function (e) { if (e.matches) setNav(false); });

    // aktívny odkaz podľa sekcie
    var links = $$('a[href^="#"]', nav);
    var secs = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      secs.forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- odhaľovanie ---------- */
  function reveal() {
    var items = $$('.reveal, .zone, .plan, .tile').filter(function (el) { return !(INTRO && el.closest('.hero')); });
    if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }


  /* ---------- otváracia animácia ---------- */
  var INTRO = false;
  function intro() {
    var veil = $('#veil');
    if (!veil) return;
    var skip = reduce.matches || location.hash.length > 1 || !window.matchMedia('(min-width: 320px)').matches;
    try { if (sessionStorage.getItem('lipa-intro')) skip = true; } catch (e) {}
    if (skip) { veil.remove(); return; }
    INTRO = true;
    d.body.classList.add('intro');
    try { sessionStorage.setItem('lipa-intro', '1'); } catch (e) {}
    var heroBits = $$('.hero .reveal');
    heroBits.forEach(function (el) { el.style.transition = 'none'; });
    var opened = false;
    function open() {
      if (opened) return;
      opened = true;
      d.body.classList.add('intro-open');
      d.body.classList.add('is-loaded');
      heroBits.forEach(function (el, i) {
        el.style.transition = '';
        void el.offsetWidth;
        el.style.transitionDelay = (0.25 + i * 0.1) + 's';
        el.classList.add('in');
      });
      setTimeout(function () {
        d.body.classList.remove('intro');
        d.body.classList.add('intro-done');
        veil.remove();
        d.removeEventListener('keydown', onKey);
      }, 1300);
    }
    function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') open(); }
    veil.addEventListener('click', open);
    d.addEventListener('keydown', onKey);
    setTimeout(open, 1450);
  }


  /* ---------- úvod: paralaxa pri skrolovaní ---------- */
  function heroParallax() {
    if (reduce.matches) return;
    var hin = $('.hero-in'), stage = $('.barbell-stage'), fl = $('.hero-floaters');
    if (!hin || !stage) return;
    var tick = false;
    function frame() {
      tick = false;
      var y = window.scrollY, vh = window.innerHeight;
      if (y > vh * 1.2) return;
      var k = Math.min(1, y / (vh * 0.9));
      hin.style.transform = 'translate3d(0,' + (y * 0.28).toFixed(1) + 'px,0)';
      hin.style.opacity = (1 - k * 1.1).toFixed(3);
      stage.style.transform = 'translate3d(0,' + (y * -0.14).toFixed(1) + 'px,0)';
      stage.style.opacity = (1 - k).toFixed(3);
      if (fl) fl.style.transform = 'translate3d(0,' + (y * 0.12).toFixed(1) + 'px,0)';
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
    frame();
  }

  /* ---------- príbeh: scéna riadená skrolovaním ----------
     0–0.34 naloženie kotúčov, 0.34–0.70 zdvih, 0.70–1 uloženie do stojana */
  function story() {
    var sec = $('#pribeh');
    if (!sec || reduce.matches) return;
    var svg = $('.scene', sec), cam = $('.sc-cam', sec), axis = $('.sc-axis', sec), knurl = $('.sc-knurl', sec);
    var bar = $('.sc-bar', sec), shadow = $('.sc-shadow', sec), spot = $('.sc-spot', sec), chalkG = $('.sc-chalk', sec);
    var sides = $$('.sc-side', sec), plates = $$('.sc-pl', sec);
    var words = $$('.story-h .w', sec), subs = $$('.story-sub span', sec), kgEl = $('[data-kg]', sec);
    var cta = $('.story-cta', sec), dots = $$('.story-dots li', sec);
    var ns = 'http://www.w3.org/2000/svg';
    var BASE = 465, FLOOR = 562, TOP = 150, RACK = 330;

    // úzke obrazovky: tesnejší výrez scény
    function fit() {
      var narrow = window.innerWidth < 700;
      svg.setAttribute('viewBox', narrow ? '110 60 980 600' : '0 0 1200 700');
      svg.setAttribute('preserveAspectRatio', narrow ? 'xMidYMid meet' : 'xMidYMax meet');
    }
    fit();
    window.addEventListener('resize', fit);

    // krieda
    var chalk = [];
    for (var i = 0; i < 34; i++) {
      var c = d.createElementNS(ns, 'circle');
      var p = { x: 380 + Math.random() * 440, r: 1.5 + Math.random() * 3.5, dx: (Math.random() - 0.5) * 120, rise: 120 + Math.random() * 260, off: Math.random() * 0.5, el: c };
      c.setAttribute('r', p.r); c.setAttribute('fill', '#e9ecf1'); c.setAttribute('opacity', '0');
      chalkG.appendChild(c); chalk.push(p);
    }

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
    function io(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function outBack(t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
    function outCubic(t) { return 1 - Math.pow(1 - t, 3); }

    var last = -1, ticking = false;
    function render(p) {
      // 1. naloženie
      var load = seg(p, 0, 0.34);
      var kg = 20;
      plates.forEach(function (pl) {
        var i = +pl.dataset.i, dir = +pl.closest('.sc-side').dataset.dir;
        var t = outBack(seg(load, i * 0.2, i * 0.2 + 0.4));
        pl.style.transform = 'translate(' + (dir * 520 * (1 - t)).toFixed(1) + 'px,0)';
        kg += (+pl.dataset.kg) * clamp(t, 0, 1);
      });
      kgEl.textContent = String(Math.round(kg));

      // 2. zdvih
      var lift = seg(p, 0.34, 0.70), rack = seg(p, 0.70, 1);
      var y, bend, vel;
      if (rack === 0) {
        var e = io(lift);
        y = BASE - (BASE - TOP) * e;
        vel = Math.sin(lift * Math.PI);
        bend = vel * 26;
      } else {
        var e2 = outCubic(rack);
        y = TOP + (RACK - TOP) * e2;
        vel = Math.sin(rack * Math.PI) * 0.6;
        bend = -vel * 14;
      }
      bar.style.transform = 'translate(0,' + (y - BASE).toFixed(1) + 'px)';
      axis.setAttribute('d', 'M180 ' + (BASE + bend).toFixed(1) + ' Q600 ' + (BASE - bend * 0.9).toFixed(1) + ' 1020 ' + (BASE + bend).toFixed(1));
      knurl.style.transform = 'translate(0,' + (-bend * 0.25).toFixed(1) + 'px)';
      sides.forEach(function (sd) {
        var dir = +sd.dataset.dir;
        sd.style.transform = 'translate(0,' + bend.toFixed(1) + 'px) rotate(' + (dir * -bend * 0.18).toFixed(2) + 'deg)';
        sd.style.transformOrigin = (dir < 0 ? 330 : 870) + 'px ' + BASE + 'px';
      });
      var height = 1 - (y - TOP) / (BASE - TOP);
      shadow.setAttribute('rx', (440 - 260 * height).toFixed(0));
      shadow.setAttribute('opacity', (0.75 - 0.55 * height).toFixed(2));
      spot.setAttribute('opacity', (0.25 + 0.75 * Math.max(height, rack > 0 ? 0.7 : 0)).toFixed(2));
      var zoom = 1 + 0.07 * io(lift) - 0.03 * outCubic(rack);
      cam.style.transform = 'scale(' + zoom.toFixed(3) + ')';

      // krieda: stúpa počas zdvihu
      var dust = lift > 0 ? Math.sin(Math.min(1, (lift + rack * 0.5)) * Math.PI) : 0;
      chalk.forEach(function (c) {
        var t = clamp(lift * 1.4 - c.off, 0, 1);
        c.el.setAttribute('cx', (c.x + c.dx * t).toFixed(1));
        c.el.setAttribute('cy', (BASE - 60 - c.rise * t).toFixed(1));
        c.el.setAttribute('opacity', (dust * (1 - t) * 0.9).toFixed(2));
      });

      // texty
      var ph = p < 0.34 ? 0 : p < 0.70 ? 1 : 2;
      var edges = [[0, 0.30, 0.36], [0.30, 0.66, 0.72], [0.66, 1, 1.2]];
      words.forEach(function (w, i) {
        var a = edges[i][0], b = edges[i][1], c2 = edges[i][2];
        var o = i === 0 ? 1 - seg(p, b, c2) : seg(p, a, a + 0.06) * (1 - seg(p, b, c2));
        w.style.opacity = o.toFixed(3);
        w.style.transform = 'translateY(' + ((1 - o) * 0.25).toFixed(3) + 'em)';
        subs[i].style.opacity = o.toFixed(3);
        subs[i].style.transform = 'translateY(' + ((1 - o) * 10).toFixed(1) + 'px)';
      });
      dots.forEach(function (dt, i) { dt.classList.toggle('on', i === ph); });
      cta.classList.toggle('is-on', p > 0.86);
    }

    function frame() {
      ticking = false;
      var r = sec.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom < -vh || r.top > vh * 2) return;
      var p = clamp(-r.top / (r.height - vh), 0, 1);
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      render(p);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    window.addEventListener('resize', function () { last = -1; frame(); });
    render(0);
    frame();
  }


  /* ---------- skrolovacia vrstva cez celú stránku ----------
     pozadie s tvarmi, vodoznaky sekcií, nadpisy, bežiaci pás, koľajnica */
  function scrollFx() {
    if (reduce.matches) return;
    var shapes = $$('.bgs').map(function (el) {
      return { el: el, speed: +el.dataset.speed, rot: +el.dataset.rot, top: +el.dataset.top / 100, size: 200 };
    });
    function measure() { shapes.forEach(function (sh) { sh.size = sh.el.offsetHeight || 200; }); }
    measure();
    window.addEventListener('resize', measure);
    // vodoznaky
    var wms = $$('.has-wm').map(function (sec) {
      var w = d.createElement('span');
      w.className = 'wm'; w.setAttribute('aria-hidden', 'true'); w.textContent = sec.dataset.wm;
      sec.insertBefore(w, sec.firstChild);
      return { sec: sec, el: w };
    });
    // nadpisy sekcií: namiesto jednorazového odhalenia sledujú skrol
    var heads = $$('.has-wm .sec-head').map(function (h) {
      h.classList.remove('reveal'); h.classList.add('in');
      return { el: h, k: $('.kicker', h) };
    });
    var marquee = $('.marquee');
    // koľajnica
    var rail = $('.rail'), dotsBox = $('.rail-dots'), dots = [];
    if (rail) {
      var ids = ['ponuka', 'clenstvo', 'rozvrh', 'treneri', 'priestor', 'skusobny', 'faq', 'kontakt'];
      ids.forEach(function (id) {
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

    var lastY = window.scrollY, vel = 0, ticking = false, running = true, idle = 0;
    function frame() {
      var y = window.scrollY, vh = window.innerHeight;
      var dy = y - lastY; lastY = y;
      vel += (dy - vel) * 0.18;
      if (Math.abs(vel) < 0.05) vel = 0;

      // pozadie: tvary plynú hore rôznou rýchlosťou a otáčajú sa, po opustení obrazovky sa vrátia zdola
      shapes.forEach(function (sh) {
        var size = sh.size;
        var L = vh + size;
        var ty = (((sh.top * vh - y * sh.speed) % L) + L) % L - size;
        sh.el.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0) rotate(' + (y * sh.rot).toFixed(2) + 'deg)';
      });

      // vodoznaky a nadpisy podľa polohy sekcie vo výreze
      wms.forEach(function (w) {
        var r = w.sec.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var v = (vh - r.top) / (vh + r.height);          // 0 = prichádza zdola, 1 = odišla hore
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

      // bežiaci pás sa pri rýchlom skrole nakloní
      if (marquee) {
        var sk = Math.max(-14, Math.min(14, -vel * 0.35));
        marquee.style.transform = 'skewX(' + sk.toFixed(2) + 'deg)';
      }

      // koľajnica: aktívna sekcia
      var active = null;
      dots.forEach(function (dt) { if (dt.sec.getBoundingClientRect().top <= vh * 0.45) active = dt; });
      dots.forEach(function (dt) { dt.a.classList.toggle('is-active', dt === active); });

      ticking = false;
      if (vel !== 0) requestAnimationFrame(tick); // doznievanie rýchlosti
    }
    function tick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    frame();
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

  /* ---------- úvod: činka a plávajúce prvky ---------- */
  function hero() {
    var done = false;
    function loaded() { if (done || INTRO) return; done = true; d.body.classList.add('is-loaded'); }
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(loaded);
    setTimeout(loaded, 900);

    if (reduce.matches || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var stage = $('.hero'), fls = $$('.fl');
    fls.forEach(function (f) { f.style.setProperty('--d', f.getAttribute('data-depth') || '10'); });
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect();
      var px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      var py = ((e.clientY - r.top) / r.height - 0.5) * 2;
      fls.forEach(function (f) { f.style.setProperty('--px', px.toFixed(3)); f.style.setProperty('--py', py.toFixed(3)); });
    }, { passive: true });
    stage.addEventListener('mouseleave', function () {
      fls.forEach(function (f) { f.style.setProperty('--px', '0'); f.style.setProperty('--py', '0'); });
    });
  }

  function cardGlow() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $$('.zone').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }, { passive: true });
    });
  }

  function marquee() {
    var t = $('.marquee-track');
    if (!t) return;
    t.innerHTML += t.innerHTML;
  }

  /* ---------- rozvrh ---------- */
  function timetable() {
    var root = $('[data-timetable]');
    if (!root) return;
    var tabs = $('.tt-days', root), list = $('.tt-list', root);
    var today = nowBA().day;
    var sel = today;
    tabs.innerHTML = DAYS.map(function (n, i) {
      return '<button class="tt-day' + (i === today ? ' is-today' : '') + '" role="tab" type="button" data-day="' + i + '" aria-selected="' + (i === sel) + '" id="tt-tab-' + i + '">' + DAYS_SHORT[i] + '<small>' + (i === today ? 'dnes' : n.slice(0, 3)) + '</small></button>';
    }).join('');
    function render(day) {
      sel = day;
      $$('.tt-day', tabs).forEach(function (b) { b.setAttribute('aria-selected', String(+b.dataset.day === day)); });
      list.setAttribute('aria-labelledby', 'tt-tab-' + day);
      var rows = TIMETABLE.filter(function (c) { return c.day === day; }).sort(function (a, b) { return a.time.localeCompare(b.time); });
      if (!rows.length) {
        list.innerHTML = '<div class="tt-empty"><svg viewBox="0 0 64 32" aria-hidden="true"><use href="#i-dumbbell"/></svg>' + DAYS[day] + ' bez skupinových lekcií. Fitko je otvorené na voľný tréning.</div>';
        return;
      }
      list.innerHTML = rows.map(function (c, i) {
        var dots = [1, 2, 3].map(function (n) { return '<i class="' + (n <= c.lvl ? 'on' : '') + '"></i>'; }).join('');
        return '<div class="tt-row" style="animation-delay:' + (i * 60) + 'ms">' +
          '<div class="tt-time">' + c.time + '<small>' + c.len + ' min</small></div>' +
          '<div class="tt-name">' + c.name + '<span>' + c.kind + '</span></div>' +
          '<div class="tt-coach">' + c.coach + '</div>' +
          '<div class="tt-lvl" aria-label="Náročnosť: ' + LVL[c.lvl] + '">' + dots + '<span>' + LVL[c.lvl] + '</span></div>' +
          '</div>';
      }).join('');
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
    render(sel);
  }

  /* ---------- formulár skúšobného tréningu ---------- */
  function trialForm() {
    var form = $('#trial-form');
    if (!form) return;
    var err = $('[data-error]', form);
    var day = form.elements.day;
    var t = new Date(); t.setDate(t.getDate() + 1);
    day.min = t.toISOString().slice(0, 10);
    var via = 'wa';
    $$('[data-send]', form).forEach(function (b) { b.addEventListener('click', function () { via = b.dataset.send; }); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.hidden = true;
      var f = form.elements;
      var name = f.name.value.trim(), phone = f.phone.value.trim(), dayV = f.day.value, slot = f.slot.value;
      var problems = [];
      if (name.length < 2) problems.push('meno');
      if (!/^[+\d][\d\s()/-]{6,}$/.test(phone)) problems.push('telefón');
      if (!dayV) problems.push('deň');
      if (!slot) problems.push('čas');
      if (problems.length) {
        err.textContent = 'Skontroluj prosím: ' + problems.join(', ') + '.';
        err.hidden = false;
        var first = problems[0] === 'meno' ? f.name : problems[0] === 'telefón' ? f.phone : problems[0] === 'deň' ? f.day : f.slot;
        first.focus();
        return;
      }
      var dt = new Date(dayV + 'T12:00:00');
      var nice = pad(dt.getDate()) + '. ' + pad(dt.getMonth() + 1) + '. ' + dt.getFullYear() + ' (' + DAYS[(dt.getDay() + 6) % 7].toLowerCase() + ')';
      var msg = 'Ahojte, mám záujem o skúšobný tréning v LIPA GYM.\n' +
        'Meno: ' + name + '\n' +
        'Telefón: ' + phone + '\n' +
        'Deň: ' + nice + '\n' +
        'Čas: ' + slot.toLowerCase() + '\n' +
        'Zaujíma ma: ' + f.goal.value +
        (f.note.value.trim() ? '\nPoznámka: ' + f.note.value.trim() : '');

      if (via === 'wa') {
        if (!GYM.whatsapp) {
          err.textContent = 'WhatsApp číslo ešte nie je nastavené. Pošli správu e-mailom alebo zavolaj.';
          err.hidden = false;
          return;
        }
        window.open('https://wa.me/' + GYM.whatsapp + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      } else {
        if (!GYM.email) {
          err.textContent = 'E-mail ešte nie je nastavený. Zavolaj nám, prosím.';
          err.hidden = false;
          return;
        }
        window.location.href = 'mailto:' + GYM.email + '?subject=' + encodeURIComponent('Skúšobný tréning: ' + name) + '&body=' + encodeURIComponent(msg);
      }
      form.classList.add('is-sent');
    });
  }

  /* ---------- mobilná lišta: skryť pri formulári ---------- */
  function dock() {
    var dk = $('.dock'), form = $('#trial-form');
    if (!dk || !form || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (en) {
      dk.classList.toggle('is-hidden', en[0].isIntersecting);
    }, { threshold: 0.2 }).observe(form);
    var call = $('.dock-call');
    if (call && !GYM.phone) call.href = '#kontakt';
  }

  /* ---------- štart ---------- */
  intro();
  fillFacts();
  schema();
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
  trialForm();
  dock();
  faq();
  heroParallax();
  story();
  scrollFx();
})();
