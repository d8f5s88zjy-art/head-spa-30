/* Stavebniny Richtárik: menu na telefóne, vyhľadávanie v katalógu, lightbox na fotky. */
(function () {
  var d = document;
  var pre = (d.querySelector('script[src$="assets/site.js"]') || {}).getAttribute ? d.querySelector('script[src$="assets/site.js"]').getAttribute('src').replace('assets/site.js', '') : '';

  // menu
  var b = d.querySelector('.menu-btn'), dr = d.getElementById('drawer');
  function open(o) { dr.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); d.body.style.overflow = o ? 'hidden' : ''; }
  if (b && dr) {
    b.addEventListener('click', function () { open(!dr.classList.contains('open')); });
    dr.querySelector('.close').addEventListener('click', function () { open(false); });
    dr.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { open(false); }); });
  }
  var r = d.getElementById('rok'); if (r) r.textContent = new Date().getFullYear();

  // lightbox
  var lb = d.getElementById('lb');
  if (lb) {
    var img = lb.querySelector('img');
    d.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-lb]');
      if (!a) return;
      e.preventDefault(); img.src = a.getAttribute('href'); img.alt = (a.querySelector('img') || {}).alt || ''; lb.hidden = false; d.body.style.overflow = 'hidden';
    });
    function close() { lb.hidden = true; img.src = ''; d.body.style.overflow = ''; }
    lb.addEventListener('click', function (e) { if (e.target !== img) close(); });
    lb.querySelector('.lb-x').addEventListener('click', close);
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (dr) open(false); if (lb && !lb.hidden) { lb.hidden = true; d.body.style.overflow = ''; } } });

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
      return '<a href="' + pre + it.p + '"><small>' + it.k + '</small><b>' + it.t + '</b><span>' + (s ? '…' : '') + frag + '…</span></a>';
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
