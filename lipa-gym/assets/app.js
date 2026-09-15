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
    var lastY = window.scrollY, ticking = false;
    function onScroll() {
      var y = window.scrollY;
      var h = d.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, y / h)) : 0;
      bar.style.setProperty('--sp', p.toFixed(4));
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
    var items = $$('.reveal, .zone, .plan, .tile');
    if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- úvod: činka a plávajúce prvky ---------- */
  function hero() {
    var done = false;
    function loaded() { if (done) return; done = true; d.body.classList.add('is-loaded'); }
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
})();
