/* BARBERSHOP 30 — správanie stránky. Čistý JavaScript, bez závislostí.
 * Obsah a údaje prevádzky sú v assets/data.js.
 */
(function () {
  'use strict';
  var D = window.BS30;
  if (!D) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var STORE = 'bs30-brief';

  /* ============ 1. úvodná scéna ============ */
  (function intro() {
    var hero = $('#hero'), skip = $('#skipIntro');
    if (!hero) return;
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      hero.classList.remove('revealing');
      hero.classList.add('revealed', 'done');
      try { sessionStorage.setItem('bs30-intro', '1'); } catch (e) {}
    }
    var seen = false;
    try { seen = sessionStorage.getItem('bs30-intro') === '1'; } catch (e) {}
    if (reduce.matches || seen) { finish(); return; }

    // scéna sa spustí až po vykreslení, obsah pod ňou je použiteľný od začiatku
    requestAnimationFrame(function () {
      hero.classList.add('revealing');
      setTimeout(function () { hero.classList.add('revealed'); }, 1700);
      setTimeout(finish, 3400);
    });
    if (skip) skip.addEventListener('click', finish);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(); });
  })();

  /* ============ 2. hlavička a menu ============ */
  (function chrome() {
    var nav = $('#nav'), burger = $('#burger'), drawer = $('#drawer'), last = 0;
    addEventListener('scroll', function () {
      var y = pageYOffset;
      if (nav) nav.classList.toggle('hide', y > 320 && y > last && !document.body.classList.contains('drawer-open'));
      last = y;
    }, { passive: true });

    function setDrawer(open) {
      if (!drawer || !burger) return;
      drawer.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Zavrieť menu' : 'Otvoriť menu');
      document.body.classList.toggle('drawer-open', open);
      if (open) { var f = $('a', drawer); if (f) f.focus(); }
    }
    if (burger) burger.addEventListener('click', function () { setDrawer(drawer.hidden); });
    if (drawer) $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer && !drawer.hidden) { setDrawer(false); burger.focus(); }
    });
    addEventListener('resize', function () { if (innerWidth > 900 && drawer && !drawer.hidden) setDrawer(false); });
  })();

  /* ============ 3. stav výberu ============ */
  var state = { cut: null, fade: 'Poradí barber', top: 'Poradí barber', finish: 'Poradí barber', beard: 'Nechcem', note: '' };
  try {
    var saved = JSON.parse(sessionStorage.getItem(STORE) || 'null');
    if (saved && typeof saved === 'object') Object.keys(state).forEach(function (k) { if (saved[k]) state[k] = saved[k]; });
  } catch (e) {}
  function persist() { try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }
  function cutById(id) { for (var i = 0; i < D.cuts.length; i++) if (D.cuts[i].id === id) return D.cuts[i]; return null; }

  /* ============ 4. filtre a karty ============ */
  var offered = D.cuts.filter(function (c) { return c.offered; });
  var active = {};

  function labelFor(key, value) {
    var g = D.filters.filter(function (f) { return f.key === key; })[0];
    if (!g) return value;
    var o = g.options.filter(function (x) { return x.v === value; })[0];
    return o ? o.l : value;
  }

  function renderFilters() {
    var box = $('#filters');
    if (!box) return;
    box.innerHTML = '';
    D.filters.forEach(function (f) {
      var g = document.createElement('div');
      g.className = 'fgroup';
      var b = document.createElement('b');
      b.textContent = f.label;
      g.appendChild(b);
      f.options.forEach(function (o) {
        // zobrazíme len hodnoty, ktoré sa v ponuke naozaj vyskytujú
        if (!offered.some(function (c) { return c[f.key] === o.v; })) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip';
        btn.textContent = o.l;
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', function () {
          if (active[f.key] === o.v) delete active[f.key]; else active[f.key] = o.v;
          renderFilters();
          renderCuts();
        });
        if (active[f.key] === o.v) btn.setAttribute('aria-pressed', 'true');
        g.appendChild(btn);
      });
      box.appendChild(g);
    });
    if (Object.keys(active).length) {
      var clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'chip';
      clear.textContent = 'Zrušiť filtre';
      clear.addEventListener('click', function () { active = {}; renderFilters(); renderCuts(); });
      box.appendChild(clear);
    }
  }

  function matches(c) {
    return Object.keys(active).every(function (k) { return c[k] === active[k]; });
  }

  function renderCuts() {
    var list = $('#cuts');
    if (!list) return;
    var shown = offered.filter(matches);
    list.innerHTML = '';
    shown.forEach(function (c) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cut';
      btn.setAttribute('data-id', c.id);
      if (state.cut === c.id) btn.setAttribute('data-picked', 'true');
      var flag = state.cut === c.id ? '<span class="pick-flag">Vybraté</span>' : '';
      var tag = c.illustrative ? '<span class="tag">Inšpirácia</span>' : '';
      btn.innerHTML =
        '<span class="cut-fig">' + tag + flag +
        '<img src="' + c.img + '" alt="Ukážka strihu ' + esc(c.title) + '" loading="lazy" decoding="async" width="600" height="800">' +
        '</span>' +
        '<h3>' + esc(c.title) + '</h3>' +
        '<p>' + esc(c.short) + '</p>' +
        '<span class="go">Pozrieť detail</span>';
      btn.addEventListener('click', function () { openDetail(c.id); });
      li.appendChild(btn);
      list.appendChild(li);
    });
    var st = $('#filterState');
    if (st) {
      var f = Object.keys(active).map(function (k) { return labelFor(k, active[k]); });
      st.textContent = shown.length + (shown.length === 1 ? ' strih' : shown.length < 5 ? ' strihy' : ' strihov')
        + (f.length ? ' · ' + f.join(' · ') : '');
    }
    var note = $('#cutsNote');
    if (note) {
      var illus = shown.some(function (c) { return c.illustrative; });
      note.textContent = illus
        ? 'Fotky strihov sú zatiaľ ilustračné ukážky, nie sú to práce z našej prevádzky a nesľubujeme identický výsledok. Po nafotení ich nahradíme skutočnými strihmi od nás. Konečný tvar vždy závisí od typu a hustoty tvojich vlasov.'
        : '';
    }
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m]; }); }

  /* ============ 5. detail strihu ============ */
  var dlg = $('#detail'), openerBtn = null, detailId = null;

  function openDetail(id) {
    var c = cutById(id);
    if (!c || !dlg) return;
    detailId = id;
    openerBtn = document.activeElement;
    $('#detailImg').src = c.img;
    $('#detailImg').alt = 'Ukážka strihu ' + c.title;
    $('#detailTag').textContent = c.illustrative ? 'Inšpirácia / ilustračná ukážka' : 'Naša práca';
    $('#detailTitle').textContent = c.title;
    $('#detailAbout').textContent = c.about;
    $('#detailTell').textContent = c.tell;
    var facts = [
      ['Prechod', labelFor('fade', c.fade)],
      ['Dĺžka', labelFor('length', c.length)],
      ['Finiš', labelFor('finish', c.finish)],
      ['Údržba', c.upkeepText],
    ];
    if (c.price) facts.push(['Cena', c.price + ' €']);
    if (c.duration) facts.push(['Trvanie', c.duration + ' min']);
    $('#detailFacts').innerHTML = facts.map(function (f) {
      return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>';
    }).join('');
    var pick = $('#detailPick');
    pick.textContent = state.cut === id ? 'Tento strih máš vybratý' : 'Tento strih chcem';
    pick.disabled = state.cut === id;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }

  function closeDetail() {
    if (!dlg) return;
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
    if (openerBtn && openerBtn.focus) openerBtn.focus();
  }

  if (dlg) {
    $('#detailClose').addEventListener('click', closeDetail);
    $('#detailBack').addEventListener('click', closeDetail);
    $('#detailPick').addEventListener('click', function () {
      state.cut = detailId;
      persist();
      renderCuts();
      renderPicked();
      closeDetail();
      var b = $('#brief');
      if (b) b.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
      toast('Strih pridaný do tvojej predstavy.');
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDetail(); });
  }

  /* ============ 6. brief ============ */
  function renderPicked() {
    var box = $('#picked');
    if (!box) return;
    var c = state.cut ? cutById(state.cut) : null;
    if (!c) {
      box.innerHTML = '<p class="picked-empty">Zatiaľ nemáš vybraný strih. <a href="#strihy">Vyber si ho hore.</a></p>';
    } else {
      box.innerHTML = '<div class="picked-in">' +
        '<img src="' + c.img + '" alt="" loading="lazy" width="64" height="80">' +
        '<div><b>' + esc(c.title) + '</b><p>' + esc(c.short) + '</p></div>' +
        '<button class="btn ghost small" type="button" id="pickedChange">Zmeniť</button></div>';
      var ch = $('#pickedChange');
      if (ch) ch.addEventListener('click', function () {
        var s = $('#strihy');
        if (s) s.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
      });
    }
    updateSummary();
  }

  $$('.brief-form input[type=radio]').forEach(function (r) {
    if (state[r.name] === r.value) r.checked = true;
    r.addEventListener('change', function () {
      state[r.name] = r.value;
      persist();
      updateSummary();
    });
  });

  var noteEl = $('.brief-form textarea[name=note]');
  if (noteEl) {
    noteEl.value = state.note || '';
    noteEl.addEventListener('input', function () { state.note = noteEl.value.slice(0, 400); persist(); updateSummary(); });
  }

  (function moreToggle() {
    var btn = $('#moreBtn'), box = $('#moreBox');
    if (!btn || !box) return;
    if (state.note) { box.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
    btn.addEventListener('click', function () {
      var open = box.hidden;
      box.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
  })();

  /* fotka ostáva len v prehliadači, nikam sa neodosiela */
  (function upload() {
    var inp = $('#photo'), st = $('#photoState'), prev = $('#photoPrev'), clr = $('#photoClear');
    if (!inp) return;
    var url = null;
    function reset() {
      if (url) { URL.revokeObjectURL(url); url = null; }
      inp.value = '';
      st.textContent = 'Žiadna fotka';
      prev.hidden = true;
      prev.removeAttribute('src');
      clr.hidden = true;
    }
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      if (!f) return reset();
      if (!/^image\/(jpeg|png|webp|avif)$/.test(f.type)) { st.textContent = 'Podporujeme JPG, PNG, WEBP a AVIF.'; inp.value = ''; return; }
      if (f.size > 8 * 1024 * 1024) { st.textContent = 'Fotka je väčšia než 8 MB, skús menšiu.'; inp.value = ''; return; }
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(f);
      prev.src = url;
      prev.hidden = false;
      clr.hidden = false;
      st.textContent = f.name.length > 28 ? f.name.slice(0, 25) + '…' : f.name;
    });
    clr.addEventListener('click', reset);
  })();

  function summaryRows() {
    var c = state.cut ? cutById(state.cut) : null;
    var rows = [['Strih', c ? c.title : 'Zatiaľ nevybraný']];
    rows.push(['Prechod', state.fade]);
    rows.push(['Navrchu', state.top]);
    rows.push(['Finiš', state.finish]);
    rows.push(['Brada', state.beard]);
    if (state.note) rows.push(['Poznámka', state.note]);
    return rows;
  }

  function updateSummary() {
    var ul = $('#summaryList');
    if (ul) ul.innerHTML = summaryRows().map(function (r) {
      return '<li><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></li>';
    }).join('');

    var steps = $$('#cutline li');
    var done = [!!state.cut, state.fade !== 'Poradí barber', state.top !== 'Poradí barber', state.finish !== 'Poradí barber'];
    steps.forEach(function (li, i) { li.classList.toggle('on', !!done[i]); });

    var bar = $('#mobileBarCut');
    if (bar) bar.textContent = state.cut ? (cutById(state.cut) || {}).title || '' : '';

    var hn = $('#handoffNote');
    if (hn) hn.textContent = 'Rezervácia sa otvorí v našom kalendári ' + D.business.bookingName +
      '. Zhrnutie sa doň neprenáša automaticky, preto si ho skopíruj a pošli nám ho alebo ukáž barberovi na mieste.';
  }

  function summaryText() {
    var lines = ['Moja predstava strihu — BARBERSHOP 30'];
    summaryRows().forEach(function (r) { lines.push(r[0] + ': ' + r[1]); });
    return lines.join('\n');
  }

  (function copyBtn() {
    var btn = $('#copyBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var txt = summaryText();
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = txt;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        toast(ok ? 'Zhrnutie je v schránke.' : 'Skopírovanie sa nepodarilo, označ text ručne.');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { toast('Zhrnutie je v schránke.'); }, fallback);
      } else fallback();
    });
  })();

  /* ============ 7. rezervácia ============ */
  $$('.js-book').forEach(function (a) {
    a.setAttribute('href', D.business.bookingUrl);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });

  /* ============ 8. cenník ============ */
  (function prices() {
    var box = $('#priceBox');
    if (!box) return;
    var withPrice = offered.filter(function (c) { return c.price; });
    if (!D.pricesConfirmed || !withPrice.length) {
      box.innerHTML = '<div class="pending">' +
        '<p class="kicker">Cenník</p>' +
        '<p>Aktuálne ceny a dĺžky služieb sú v rezervačnom kalendári, kde si vyberáš termín. ' +
        'Sem ich doplníme hneď, ako ich prevádzka potvrdí, aby na dvoch miestach nesvietili dve rôzne čísla.</p>' +
        '<div class="cta"><a class="btn primary js-book" href="' + D.business.bookingUrl + '" target="_blank" rel="noopener">Pozrieť ceny a termíny</a>' +
        '<a class="btn ghost" href="tel:' + D.business.phone + '">Spýtať sa telefonicky</a></div>' +
        '</div>';
      return;
    }
    box.innerHTML = '<div class="ptable">' + withPrice.map(function (c) {
      return '<div class="row"><b>' + esc(c.title) + '</b>' +
        '<span class="dur">' + (c.duration ? c.duration + ' min' : '') + '</span>' +
        '<span class="pr">' + c.price + ' €</span></div>';
    }).join('') + '</div>';
  })();

  /* ============ 9. galéria, kontakt, hodiny ============ */
  (function gallery() {
    var g = $('#gal');
    if (!g || !D.gallery) return;
    g.innerHTML = D.gallery.map(function (it) {
      return '<figure><img src="' + it.img + '" alt="' + esc(it.alt) + '" loading="lazy" decoding="async">' +
        (it.illustrative ? '<span class="tag">Ilustračná ukážka</span>' : '') +
        '<figcaption>' + esc(it.cap) + '</figcaption></figure>';
    }).join('');
  })();

  (function contact() {
    var b = D.business;
    var addr = $('#cAddr'), ig = $('#cIg'), map = $('#mapLink');
    if (addr) { addr.href = b.mapUrl; addr.target = '_blank'; addr.rel = 'noopener'; addr.textContent = b.street + ', ' + b.city; }
    if (ig) { ig.href = b.instagram; }
    if (map) { map.href = b.mapUrl; }

    var hb = $('#hoursBox');
    if (!hb) return;
    var days = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];
    var w = D.hours.week, rows = [];
    var pairs = [[1, 5, 'Pondelok až piatok'], [6, 6, 'Sobota'], [0, 0, 'Nedeľa']];
    pairs.forEach(function (p) {
      var v = w[p[0]];
      rows.push('<li><span>' + p[2] + '</span><span>' + (v ? pad(v[0]) + ':00 až ' + pad(v[1]) + ':00' : 'zatvorené') + '</span></li>');
    });
    hb.innerHTML = '<p class="kicker">Otváracie hodiny</p><ul>' + rows.join('') + '</ul>' +
      (D.hours.confirmed ? '' : '<p class="note">' + esc(D.hours.note) + ' Aktuálne voľné termíny vždy nájdeš v rezervačnom kalendári.</p>');
    function pad(n) { return String(n).padStart(2, '0'); }
  })();

  /* ============ 10. drobnosti ============ */
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add('on'); });
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      t.classList.remove('on');
      setTimeout(function () { t.hidden = true; }, 320);
    }, 2600);
  }

  (function mobileBar() {
    var bar = $('#mobileBar'), hero = $('#hero');
    if (!bar || !hero || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      bar.hidden = es[0].isIntersecting;
    }, { rootMargin: '-40% 0px 0px 0px' }).observe(hero);
  })();

  /* ============ štart ============ */
  renderFilters();
  renderCuts();
  renderPicked();
  updateSummary();
})();
