/* Stavebniny Richtárik: menu na telefóne, objavovanie pri skrolovaní, vyhľadávanie v katalógu, lightbox s listovaním. */
(function () {
  var d = document;
  var scr = d.querySelector('script[src$="assets/site.js"]');
  var pre = scr ? scr.getAttribute('src').replace('assets/site.js', '') : '';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // menu
  var b = d.querySelector('.menu-btn'), dr = d.getElementById('drawer');
  function open(o) { dr.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); d.body.style.overflow = o ? 'hidden' : ''; }
  if (b && dr) {
    b.addEventListener('click', function () { open(!dr.classList.contains('open')); });
    dr.querySelector('.close').addEventListener('click', function () { open(false); });
    dr.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { open(false); }); });
  }
  var r = d.getElementById('rok'); if (r) r.textContent = new Date().getFullYear();

  // tieň lišty po odskrolovaní
  var top = d.querySelector('.top');
  function onScroll() { if (top) top.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // objavovanie blokov pri skrolovaní, so stupňovaním v mriežkach
  var rv = Array.prototype.slice.call(d.querySelectorAll('.rv, .rvimg, .head, .deals > *, .cats > *, .novs > *, .grid3 > *, .sub-grid > *'));
  rv.forEach(function (el) { if (!el.classList.contains('rv') && !el.classList.contains('rvimg') && !el.classList.contains('head')) el.classList.add('rv'); });
  if (!('IntersectionObserver' in window) || reduce) {
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

  // paralaxa: fotky v úvode, v hlavičke a v páse sa posúvajú pomalšie než stránka
  var pars = Array.prototype.slice.call(d.querySelectorAll('[data-parallax]'));
  var prog = d.createElement('div'); prog.className = 'progress'; d.body.appendChild(prog);
  var ticking = false;
  function move() {
    var y = window.scrollY, h = window.innerHeight;
    if (!reduce) pars.forEach(function (el) {
      var f = parseFloat(el.getAttribute('data-parallax')) || 0.28, box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -100 || box.top > h + 100) return;
      var rel = box.top + box.height / 2 - h / 2;  // vzdialenosť stredu prvku od stredu okna
      el.style.transform = 'translate3d(0,' + (-rel * f).toFixed(1) + 'px,0)';
    });
    var max = d.documentElement.scrollHeight - h;
    prog.style.width = (max > 0 ? Math.min(100, y / max * 100) : 0) + '%';
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
  window.addEventListener('resize', move); move();

  // náklon zákazníckej karty za kurzorom
  var karta = d.querySelector('.karta img');
  if (karta && !reduce && window.matchMedia('(hover:hover)').matches) {
    var box = karta.parentElement;
    box.addEventListener('mousemove', function (e) {
      var r = box.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      karta.style.transform = 'rotate(-1deg) rotateY(' + (x * 14) + 'deg) rotateX(' + (-y * 12) + 'deg) scale(1.03)';
      karta.style.transition = 'transform .15s';
    });
    box.addEventListener('mouseleave', function () { karta.style.transform = ''; karta.style.transition = 'transform .6s'; });
  }

  // počítadlá: čísla nabehnú, keď sa dostanú do záberu
  var counters = d.querySelectorAll('[data-count]');
  if (counters.length) {
    function run(el) {
      var raw = el.getAttribute('data-count'), dec = raw.indexOf(',') >= 0 ? raw.split(',')[1].length : 0;
      var target = parseFloat(raw.replace(',', '.')), t0 = null, dur = 1400;
      function step(t) {
        if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * e).toFixed(dec).replace('.', ',');
        if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
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
    lb.innerHTML = '<button class="lb-x" type="button" aria-label="Zavrieť">&times;</button><button class="lb-n lb-p" type="button" aria-label="Predchádzajúca">&#8249;</button><figure><img src="" alt=""><figcaption><span></span><small></small></figcaption></figure><button class="lb-n lb-nx" type="button" aria-label="Ďalšia">&#8250;</button>';
    var img = lb.querySelector('img'), cap = lb.querySelector('figcaption span'), cnt = lb.querySelector('figcaption small');
    var prev = lb.querySelector('.lb-p'), next = lb.querySelector('.lb-nx');
    var links = [], cur = 0;
    function all() { return Array.prototype.slice.call(d.querySelectorAll('a[data-lb]')); }
    function caption(a) {
      var c = a.getAttribute('data-cap'); if (c) return c;
      var f = a.closest('figure'); var fc = f && f.querySelector('figcaption'); if (fc && fc.textContent.trim() && !fc.closest('.lb')) return fc.textContent.trim();
      var card = a.closest('.prod, .art, .album, .nov, .cat'); var h = card && card.querySelector('h3, h2'); if (h) return h.textContent.trim();
      var im = a.querySelector('img'); return im && im.alt && !/fotografia/i.test(im.alt) ? im.alt : '';
    }
    function show(i) {
      cur = (i + links.length) % links.length; var a = links[cur];
      img.src = a.getAttribute('href'); img.alt = caption(a) || 'Fotografia';
      cap.textContent = caption(a); cnt.textContent = links.length > 1 ? (cur + 1) + ' / ' + links.length : '';
      prev.hidden = next.hidden = links.length < 2;
    }
    function openLb(a) { links = all(); lb.hidden = false; d.body.style.overflow = 'hidden'; show(links.indexOf(a)); }
    function close() { lb.hidden = true; img.src = ''; d.body.style.overflow = ''; }
    d.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-lb]'); if (!a) return;
      e.preventDefault(); openLb(a);
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') close(); });
    lb.querySelector('.lb-x').addEventListener('click', close);
    prev.addEventListener('click', function () { show(cur - 1); });
    next.addEventListener('click', function () { show(cur + 1); });
    var tx = 0;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50 && links.length > 1) show(cur + (dx < 0 ? 1 : -1)); });
    d.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dr && dr.classList.contains('open')) open(false); });

  // vyhľadávanie: index sa stiahne pri prvom písaní, hľadá sa bez diakritiky
  var q = d.getElementById('q'), res = d.getElementById('res');
  if (!q || !res) return;
  var idx = null, loading = false;
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function load(cb) {
    if (idx) return cb();
    if (loading) return; loading = true;
    fetch(pre + 'assets/index.json').then(function (x) { return x.json(); }).then(function (j) { idx = j.map(function (it) { it.n = norm(it.t + ' ' + it.k + ' ' + it.x); return it; }); cb(); }).catch(function () { loading = false; });
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render() {
    var v = norm(q.value.trim());
    if (v.length < 2) { res.hidden = true; res.innerHTML = ''; return; }
    var words = v.split(/\s+/);
    var hits = idx.filter(function (it) { return words.every(function (w) { return it.n.indexOf(w) >= 0; }); });
    hits.sort(function (a, b) { var ta = norm(a.t).indexOf(words[0]) >= 0 ? 0 : 1, tb = norm(b.t).indexOf(words[0]) >= 0 ? 0 : 1; return ta - tb; });
    hits = hits.slice(0, 8);
    if (!hits.length) { res.innerHTML = '<div class="none">Nič sme nenašli. Zavolaj 0905 622 223, väčšinu materiálu vieme objednať.</div>'; res.hidden = false; return; }
    res.innerHTML = hits.map(function (it) {
      var i = it.n.indexOf(words[0]), s = Math.max(0, i - 40), frag = (it.t + ' ' + it.k + ' ' + it.x).slice(s, s + 120);
      return '<a href="' + pre + it.p + '"><small>' + esc(it.k) + '</small><b>' + esc(it.t) + '</b><span>' + (s ? '…' : '') + esc(frag) + '…</span></a>';
    }).join('');
    res.hidden = false;
  }
  q.addEventListener('input', function () { load(render); if (idx) render(); });
  q.addEventListener('focus', function () { load(function () {}); });
  q.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { var f = res.querySelector('a'); if (f) location.href = f.href; }
    if (e.key === 'Escape') { res.hidden = true; }
  });
  d.addEventListener('click', function (e) { if (!e.target.closest('.search')) res.hidden = true; });
})();
