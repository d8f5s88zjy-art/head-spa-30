/* Stavebniny Richtárik: menu na telefóne, objavovanie pri skrolovaní, vyhľadávanie v katalógu, lightbox s listovaním.
   Prechody medzi stránkami sú v skripte v <head> (zdroj/prechody.js), pohybový systém v site.css (README, Pohyb a prechody). */
(function () {
  var d = document;
  var scr = d.querySelector('script[src$="assets/site.js"]');
  var pre = scr ? scr.getAttribute('src').replace('assets/site.js', '') : '';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // odhalenia pri posune robí CSS (časová os posunu, beží v kompozítore); skript ich robí len v prehliadači bez nej
  var css_posun = !reduce && !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'));

  // menu: zatvorené je inert (mimo fokusu aj čítačky), otvorené je modálny dialóg – fokus na Zavrieť, Tab ostáva v menu,
  // po zatvorení sa fokus vráti na tlačidlo menu
  var b = d.querySelector('.menu-btn'), dr = d.getElementById('drawer');
  function fokusovatelne(el) { return Array.prototype.slice.call(el.querySelectorAll('a[href], button:not([hidden])')).filter(function (x) { return !x.hidden && x.offsetParent !== null; }); }
  function pasca(el, e) {   // Tab a Shift+Tab krúžia len v otvorenom dialógu
    var f = fokusovatelne(el); if (!f.length) return;
    var prvy = f[0], posl = f[f.length - 1], akt = d.activeElement;
    if (e.shiftKey && (akt === prvy || !el.contains(akt))) { e.preventDefault(); posl.focus(); }
    else if (!e.shiftKey && (akt === posl || !el.contains(akt))) { e.preventDefault(); prvy.focus(); }
  }
  function open(o) {
    var bolo = dr.classList.contains('open');
    dr.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); d.body.style.overflow = o ? 'hidden' : '';
    dr.inert = !o;
    if (o) dr.querySelector('.close').focus();
    else if (bolo) b.focus({ preventScroll: true });
  }
  if (b && dr) {
    dr.inert = !dr.classList.contains('open');
    b.addEventListener('click', function () { open(!dr.classList.contains('open')); });
    dr.querySelector('.close').addEventListener('click', function () { open(false); });
    dr.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { open(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Tab' && dr.classList.contains('open')) pasca(dr, e); });
  }
  var r = d.getElementById('rok'); if (r) r.textContent = new Date().getFullYear();

  // päta: na telefóne (do 700 px) sú Stránky a Katalóg zbalené, na širšej obrazovke vždy otvorené (nadpis sa nedá zbaliť,
  // nie je ani zastávkou Tab). Bez JS ostanú otvorené.
  var fzb = d.querySelectorAll('footer details.f-zb');
  if (fzb.length && window.matchMedia) {
    var fmq = window.matchMedia('(max-width:700px)');
    var fnastav = function () { fzb.forEach(function (x) { x.open = !fmq.matches; x.querySelector('summary').tabIndex = fmq.matches ? 0 : -1; }); };
    fnastav();
    if (fmq.addEventListener) fmq.addEventListener('change', fnastav); else if (fmq.addListener) fmq.addListener(fnastav);
    fzb.forEach(function (x) { x.querySelector('summary').addEventListener('click', function (e) { if (!fmq.matches) e.preventDefault(); }); });
  }

  // tieň lišty po odskrolovaní
  var top = d.querySelector('.top');
  function onScroll() { if (top) top.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // objavovanie blokov pri skrolovaní, so stupňovaním v mriežkach
  // (s časovou osou posunu to robí CSS, site.css časť Pohybový systém; triedy .rv sa vtedy nepridávajú)
  var rv = css_posun ? [] : Array.prototype.slice.call(d.querySelectorAll('.rv, .rvimg, .head, .deals > *, .cats > *, .novs > *, .grid3 > *, .sub-grid > *'));
  rv.forEach(function (el) { if (!el.classList.contains('rv') && !el.classList.contains('rvimg') && !el.classList.contains('head')) el.classList.add('rv'); });
  if (!rv.length) {
    /* nič na objavovanie */
  } else if (!('IntersectionObserver' in window) || reduce) {
    rv.forEach(function (el) { el.classList.add('now'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = Math.min(sib % 6, 5) * 70 + 'ms';
        el.classList.add('in'); io.unobserve(el);
      });
    }, { rootMargin: '0px 0px 0px 0px', threshold: 0 });
    rv.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) el.classList.add('now'); else io.observe(el);
    });
  }

  window.addEventListener('beforeprint', function () { rv.forEach(function (el) { el.classList.add('now'); }); });

  // paralaxa: fotky v úvode, v hlavičke a v páse sa posúvajú pomalšie než stránka; len počítač s myšou
  var desk = window.matchMedia && window.matchMedia('(min-width:701px) and (hover:hover) and (pointer:fine)').matches;
  var pars = desk && !reduce && !css_posun ? Array.prototype.slice.call(d.querySelectorAll('[data-parallax]')) : [];
  var prog = d.createElement('div'); prog.className = 'progress'; d.body.appendChild(prog);
  var ticking = false, vh = window.innerHeight, maxY = 0, lastW = -1;
  function measure() { vh = window.innerHeight; maxY = d.documentElement.scrollHeight - vh; }
  function move() {
    var y = window.scrollY;
    // najprv všetky čítania, potom zápisy (žiadny vynútený prepočet rozloženia medzi nimi)
    var boxes = pars.map(function (el) { return el.parentElement.getBoundingClientRect(); });
    pars.forEach(function (el, i) {
      var box = boxes[i];
      if (box.bottom < -100 || box.top > vh + 100) return;
      var f = parseFloat(el.getAttribute('data-parallax')) || 0.28;
      var rel = box.top + box.height / 2 - vh / 2;  // vzdialenosť stredu prvku od stredu okna
      el.style.transform = 'translate3d(0,' + (-rel * f).toFixed(1) + 'px,0)';
    });
    var w = maxY > 0 ? Math.min(100, Math.round(y / maxY * 200) / 2) : 0;
    // pruh priebehu cez transform (skladá ho kompozítor): zmena šírky by v každej snímke skrolovania prepočítala rozloženie
    // a prekreslila stránku
    if (w !== lastW && !css_posun) { prog.style.transform = 'scaleX(' + (w / 100) + ')'; lastW = w; }   // s časovou osou ho kreslí CSS
    ticking = false;
  }
  if (pars.length || !css_posun) {   // s časovou osou posunu netreba pri posune spúšťať nič
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
    window.addEventListener('resize', function () { measure(); move(); });
    window.addEventListener('load', measure);
    measure(); move();
  }

  // 3D náklon kariet a zákazníckej karty za kurzorom je vypnutý (pokojnejší web)

  // otváracie hodiny: dnešný deň sa zvýrazní (data-dni="1-5" pondelok až piatok, "6" sobota); bez JS ostávajú hodiny
  // rovnaké, len bez zvýraznenia. Neuvádza sa „otvorené“ ani „zatvorené“ (sviatky web nepozná).
  (function () {
    var den = new Date().getDay();
    Array.prototype.forEach.call(d.querySelectorAll('[data-dni]'), function (el) {
      var r = el.getAttribute('data-dni').split('-'), od = +r[0], po = +(r[1] || r[0]);
      if (den >= od && den <= po) el.classList.add('dnes');
    });
  })();

  // úvod: strih zásob. Skutočné fotky tehál, pórobetónu (neupravená fotka), dlažieb a reziva dopadnú ako výtlačky
  // na fotku dvora, potom odídu a štítok „Náš dvor“ sa vrazí. Všetok pohyb robí CSS (kompozítor), skript len pripraví
  // zábery zo <template>, počká na ich dekódovanie a po 3 s ich odstráni. Spustí sa len s triedou uv-ide (skript
  // v <head>, „bez obmedzenia pohybu“), nie pri šetrení dát, nie keď zákazník už posúva, ťuká, píše alebo je vo
  // vyhľadávaní, a len raz za reláciu. Tlačidlo „Prehrať úvod“ ho spustí znova.
  (function () {
    var h = d.documentElement, ram = d.querySelector('.uv-ram'), tpl = d.getElementById('uv-zabery');
    if (!ram || !tpl || !h.classList.contains('uv-ide')) return;
    var box = ram.querySelector('.uv-zabery'), znova = ram.querySelector('.uv-znova'), hlavna = ram.querySelector('.uv-dvor img');
    var karty = null, pripravene = false, beh = 0, zastavene = false, tc = null, ss = null;
    try { ss = window.sessionStorage; } catch (e) { ss = null; }
    var setri = navigator.connection && navigator.connection.saveData;
    function uz() { try { return ss && ss.getItem('uv-videne') === '1'; } catch (e) { return false; } }
    function odober() { if (karty) karty.forEach(function (k) { if (k.parentNode) k.parentNode.removeChild(k); }); }
    function koniec(rychlo) {
      clearTimeout(beh); beh = 0;
      if (rychlo) ram.classList.add('uv-stop');
      setTimeout(function () {
        ram.classList.remove('uv-mont', 'uv-stop'); ram.classList.add('uv-hotovo');
        odober();
        if (tc && tc.parentNode) tc.parentNode.removeChild(tc);
        tc = null;
        if (znova && karty) znova.hidden = false;
      }, rychlo ? 200 : 0);
    }
    function spusti() {
      if (!karty || zastavene) return;
      if (znova) znova.hidden = true;
      ram.classList.remove('uv-hotovo');
      karty.forEach(function (k) { if (k.parentNode !== box) box.appendChild(k); });   // pri prvom štarte už čakajú skryté v ráme
      tc = d.createElement('span'); tc.className = 'uv-tc'; tc.setAttribute('aria-hidden', 'true'); tc.textContent = '01 / 04'; ram.appendChild(tc);
      var i = 1; [550, 1050, 1500].forEach(function (t) { setTimeout(function () { if (tc) tc.textContent = '0' + (++i) + ' / 04'; }, t); });
      void ram.offsetWidth;   // nový štart animácií pri „Prehrať úvod“
      ram.classList.add('uv-mont');
      try { if (ss) ss.setItem('uv-videne', '1'); } catch (e) {}
      beh = setTimeout(function () { koniec(false); }, 3020);
    }
    function stop() {
      zastavene = true;
      if (ram.classList.contains('uv-mont')) koniec(true);
      else if (pripravene) { odober(); if (znova) znova.hidden = false; }   // zastavené pred štartom: zábery preč, tlačidlo ostane
    }
    ['wheel', 'touchstart', 'keydown'].forEach(function (n) {
      window.addEventListener(n, function (e) { if (n !== 'keydown' || e.key !== 'Tab') stop(); }, { passive: true, capture: true, once: true });
    });
    window.addEventListener('scroll', function onS() { if (window.scrollY > 24) { stop(); window.removeEventListener('scroll', onS); } }, { passive: true });
    d.addEventListener('focusin', function (e) { if (e.target && e.target.id === 'q') stop(); });
    if (znova) znova.addEventListener('click', function () { zastavene = false; if (!ram.classList.contains('uv-mont')) spusti(); });
    function priprav() {
      if (karty || setri) return;
      var frag = tpl.content.cloneNode(true);
      karty = [].slice.call(frag.querySelectorAll('.uv-z'));
      karty.forEach(function (k) { box.appendChild(k); });   // skryté (visibility), sťahujú a dekódujú sa až po fotke dvora
      Promise.all(karty.map(function (k) { var im = k.querySelector('img'); return im.decode ? im.decode() : Promise.resolve(); })).then(function () {
        pripravene = true;
        if (zastavene || uz() || window.scrollY > 24 || performance.now() > 3400) { odober(); if (znova) znova.hidden = false; return; }
        // zábery ostanú skryté v ráme a štart len prepne triedu: v prvej snímke strihu sa nič nevkladá ani nerozmiestňuje
        setTimeout(spusti, Math.max(0, 1000 - performance.now()));
      }, function () { odober(); karty = null; });
    }
    if (hlavna && !hlavna.complete) { hlavna.addEventListener('load', priprav, { once: true }); setTimeout(priprav, 2500); }
    else priprav();
  })();

  // prechod medzi stránkami: skript v <head> (View Transitions); prehliadač bez podpory má okamžitú navigáciu bez čakania

  // pás značiek: tlačidlo Zastaviť pohyb (pás sa hýbe len s JS a bez obmedzenia pohybu, pauza aj pod myšou a pri fokuse)
  var mq = d.querySelector('.marquee'), mqb = mq && mq.querySelector('.mq-stop');
  if (mqb && !reduce) {
    mqb.hidden = false;
    mqb.addEventListener('click', function () {
      var stoj = mqb.getAttribute('aria-pressed') !== 'true';
      mqb.setAttribute('aria-pressed', String(stoj)); mq.classList.toggle('stoj', stoj);
    });
  }

  // služby: aktívna položka podľa polohy v okne
  var srvs = d.querySelectorAll('.srvs .srv');
  if (srvs.length && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('on', e.isIntersecting); }); }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    srvs.forEach(function (el) { so.observe(el); });
  }

  // počítadlá: čísla nabehnú, keď sa dostanú do záberu
  var counters = d.querySelectorAll('[data-count]');
  if (counters.length) {
    function run(el) {
      var raw = el.getAttribute('data-count'), dec = raw.indexOf(',') >= 0 ? raw.split(',')[1].length : 0;
      var target = parseFloat(raw.replace(',', '.')), t0 = null, dur = 1400;
      function step(t) {
        if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        // hodnota existujúceho textového uzla (textContent by v každej snímke vymenil uzol: viac práce s rozložením)
        var t = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null, v = p < 1 ? (target * e).toFixed(dec).replace('.', ',') : raw;
        if (t) { if (t.nodeValue !== v) t.nodeValue = v; } else el.textContent = v;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window) || reduce) { /* čísla ostanú, ako sú */ }
    else {
      var co = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(e.target); co.unobserve(e.target); } }); }, { threshold: 0.4 });
      counters.forEach(function (el) { co.observe(el); });
    }
  }

  // lightbox: všetky fotky na stránke, šípky, popisok, počítadlo
  var lb = d.getElementById('lb');
  if (lb) {
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Fotografia');
    lb.innerHTML = '<button class="lb-x" type="button" aria-label="Zavrieť">&times;</button><button class="lb-n lb-p" type="button" aria-label="Predchádzajúca">&#8249;</button><figure><img src="" alt=""><figcaption><span></span><small></small></figcaption></figure><button class="lb-n lb-nx" type="button" aria-label="Ďalšia">&#8250;</button>';
    var img = lb.querySelector('img'), cap = lb.querySelector('figcaption span'), cnt = lb.querySelector('figcaption small');
    var prev = lb.querySelector('.lb-p'), next = lb.querySelector('.lb-nx');
    var links = [], cur = 0, spat = null;
    function all() { return Array.prototype.slice.call(d.querySelectorAll('a[data-lb]')); }
    function caption(a) {
      var c = a.getAttribute('data-cap'); if (c) return c;
      var f = a.closest('figure'); var fc = f && f.querySelector('figcaption'); if (fc && fc.textContent.trim() && !fc.closest('.lb')) return fc.textContent.trim();
      var card = a.closest('.prod, .art, .album, .nov, .cat'); var h = card && card.querySelector('h3, h2'); if (h) return h.textContent.trim();
      var im = a.querySelector('img'); return im && im.alt && !/fotografia/i.test(im.alt) ? im.alt : '';
    }
    // pohyb lightboxu (len bez obmedzenia pohybu): fotka sa pri otvorení prenesie z miesta náhľadu (FLIP, len transform
    // a opacity), pri zatvorení sa vráti, pri listovaní príde zo strany. Nenačítaná fotka (do 250 ms) len dosadne (CSS).
    var pohyb = !reduce && !!img.animate, KRIVKA = 'cubic-bezier(.3,0,.15,1)';
    function nahlad(a) { var t = a && a.querySelector('img'), r = t && t.getBoundingClientRect(); return r && r.width && r.bottom > 0 && r.top < innerHeight ? r : null; }
    function hotova(cb) {   // fotka lightboxu dekódovaná, najviac 250 ms
      var ok = false, f = function (v) { if (!ok) { ok = true; cb(v); } };
      if (img.decode) img.decode().then(function () { f(true); }, function () { f(false); }); else f(img.complete);
      setTimeout(function () { f(false); }, 250);
    }
    function z(r, q) { var s = r.width / q.width; return 'translate(' + (r.left + r.width / 2 - q.left - q.width / 2) + 'px,' + (r.top + r.height / 2 - q.top - q.height / 2) + 'px) scale(' + s + ')'; }
    function show(i, smer) {
      cur = (i + links.length) % links.length; var a = links[cur];
      img.src = a.getAttribute('href'); img.alt = caption(a) || 'Fotografia';
      cap.textContent = caption(a); cnt.textContent = links.length > 1 ? (cur + 1) + ' / ' + links.length : '';
      prev.hidden = next.hidden = links.length < 2;
      if (smer && pohyb) hotova(function (ok) { if (ok) img.animate([{ opacity: .3, transform: 'translateX(' + (smer * 28) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: KRIVKA }); });
    }
    // každý odkaz na zväčšenie má meno pre čítačku: popisok fotky, inak „Zväčšiť fotografiu“
    all().forEach(function (a) { if (!a.getAttribute('aria-label')) { var c = caption(a); a.setAttribute('aria-label', c ? 'Zväčšiť: ' + c : 'Zväčšiť fotografiu'); } });
    function openLb(a) {
      var r = pohyb ? nahlad(a) : null;
      links = all(); spat = a; lb.classList.toggle('z-nahladu', !!r); lb.hidden = false; d.body.style.overflow = 'hidden';
      show(links.indexOf(a)); lb.querySelector('.lb-x').focus();
      if (r) hotova(function (ok) {
        var q = img.getBoundingClientRect();
        if (ok && q.width) img.animate([{ transform: z(r, q), opacity: .7 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: KRIVKA });
        else img.animate([{ opacity: .4, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: KRIVKA });
      });
    }
    function zavri() { lb.hidden = true; lb.classList.remove('z-nahladu'); img.src = ''; d.body.style.overflow = ''; if (spat) { spat.focus({ preventScroll: true }); spat = null; } }
    function close() {
      if (lb.hidden || lb.inert) return;   // počas zatvárania druhé zatvorenie nič nerobí
      var r = pohyb ? nahlad(links[cur]) : null, q = img.getBoundingClientRect();
      if (!pohyb) return zavri();
      var an = [lb.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'linear' })];
      if (r && q.width) an.push(img.animate([{ transform: 'none' }, { transform: z(r, q) }], { duration: 260, easing: KRIVKA }));
      lb.inert = true;
      an[0].finished.then(function () { lb.inert = false; zavri(); }, function () { lb.inert = false; zavri(); });
    }
    d.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-lb]'); if (!a) return;
      e.preventDefault(); openLb(a);
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') close(); });
    lb.querySelector('.lb-x').addEventListener('click', close);
    prev.addEventListener('click', function () { show(cur - 1, -1); });
    next.addEventListener('click', function () { show(cur + 1, 1); });
    var tx = 0;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50 && links.length > 1) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
    d.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Tab') pasca(lb, e);
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1, -1);
      if (e.key === 'ArrowRight') show(cur + 1, 1);
    });
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dr && dr.classList.contains('open')) open(false); });

  // vyhľadávanie: index sa stiahne pri prvom písaní, hľadá sa bez diakritiky
  var q = d.getElementById('q'), res = d.getElementById('res');
  if (!q || !res) return;
  var idx = null, loading = false, stav = d.getElementById('res-stav');
  if (!q.getAttribute('aria-controls')) q.setAttribute('aria-controls', 'res');
  function ukaz(v, text) { res.hidden = !v; q.setAttribute('aria-expanded', String(v)); if (stav && text !== undefined) stav.textContent = text; }
  ukaz(false);
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var cakaj = null;   // posledná požiadavka počas sťahovania indexu (rýchle písanie alebo vložený text sa nestratí)
  function load(cb) {
    if (idx) return cb();
    cakaj = cb;
    if (loading) return; loading = true;
    fetch(pre + 'assets/index.json').then(function (x) { return x.json(); }).then(function (j) { idx = j.map(function (it) { it.n = norm(it.t + ' ' + it.k + ' ' + it.x); return it; }); if (cakaj) cakaj(); }).catch(function () { loading = false; });
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render() {
    var v = norm(q.value.trim());
    if (v.length < 2) { res.innerHTML = ''; ukaz(false, ''); return; }
    var words = v.split(/\s+/);
    var hits = idx.filter(function (it) { return words.every(function (w) { return it.n.indexOf(w) >= 0; }); });
    hits.sort(function (a, b) { var ta = norm(a.t).indexOf(words[0]) >= 0 ? 0 : 1, tb = norm(b.t).indexOf(words[0]) >= 0 ? 0 : 1; return ta - tb; });
    hits = hits.slice(0, 8);
    if (!hits.length) { res.innerHTML = '<div class="none">Nič sme nenašli. Zavolajte 0905 622 223, poradíme vám.</div>'; ukaz(true, 'Nič sme nenašli.'); return; }
    res.innerHTML = hits.map(function (it) {
      var i = it.n.indexOf(words[0]), s = Math.max(0, i - 40), frag = (it.t + ' ' + it.k + ' ' + it.x).slice(s, s + 120);
      return '<a href="' + pre + it.p + '"><small>' + esc(it.k) + '</small><b>' + esc(it.t) + '</b><span>' + (s ? '…' : '') + esc(frag) + '…</span></a>';
    }).join('');
    ukaz(true, 'Výsledky hľadania: ' + hits.length + (hits.length === 1 ? ' stránka' : hits.length < 5 ? ' stránky' : ' stránok'));
  }
  q.addEventListener('input', function () { load(render); if (idx) render(); });
  q.addEventListener('focus', function () { load(render); });
  q.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { var f = res.querySelector('a'); if (f) location.href = f.href; }
    if (e.key === 'Escape') { ukaz(false); }
  });
  d.addEventListener('click', function (e) { if (!e.target.closest('.search')) ukaz(false); });
})();
