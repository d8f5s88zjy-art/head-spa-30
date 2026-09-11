/* Prepínanie jazyka. Slovenčina je zdroj priamo v index.html, ostatné jazyky sú
   objekty kľúčované slovenským textom (assets/i18n/<jazyk>.json). Preklad sa
   nasadzuje na textové uzly a na vybrané atribúty, takže HTML nepotrebuje žiadne
   značky navyše, a presun sekcií v HTML preklady nerozbije. Text bez kľúča
   zostane po slovensky. */
(function () {
  'use strict';

  var LANGS = [
    { code: 'sk', label: 'Slovensky', short: 'SK', locale: 'sk-SK' },
    { code: 'cs', label: 'Česky', short: 'CZ', locale: 'cs-CZ' },
    { code: 'pl', label: 'Polski', short: 'PL', locale: 'pl-PL' },
    { code: 'hu', label: 'Magyar', short: 'HU', locale: 'hu-HU' },
    { code: 'de', label: 'Deutsch', short: 'DE', locale: 'de-AT' },
    { code: 'uk', label: 'Українська', short: 'UA', locale: 'uk-UA' },
    { code: 'en', label: 'English', short: 'EN', locale: 'en' }
  ];
  var STORE = 'hs30.lang';
  var ATTRS = ['placeholder', 'aria-label', 'alt', 'title'];
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, svg: 1 };

  var current = 'sk', applied = 'sk', busy = false;

  function pick() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q && byCode(q)) return q;
    try { var s = localStorage.getItem(STORE); if (s && byCode(s)) return s; } catch (e) {}
    var nav = (navigator.languages || [navigator.language || '']).map(function (l) { return String(l).slice(0, 2).toLowerCase(); });
    for (var i = 0; i < nav.length; i++) if (byCode(nav[i])) return nav[i];
    return 'sk';
  }
  function byCode(c) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === c) return LANGS[i]; return null; }

  /* Zbierka všetkých textových uzlov a atribútov, ktoré sa dajú prekladať.
     Robí sa raz, na pôvodnom slovenskom obsahu. */
  var nodes = null, attrs = null;
  function collect() {
    nodes = []; attrs = [];
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || SKIP[p.nodeName] || p.closest('svg') || p.closest('[data-no-i18n]')) return NodeFilter.FILTER_REJECT;
        return /[A-Za-zÀ-ž]/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var n; while ((n = w.nextNode())) nodes.push({ node: n, sk: n.nodeValue, key: norm(n.nodeValue) });
    var all = document.body.querySelectorAll('[' + ATTRS.join('],[') + ']');
    Array.prototype.forEach.call(all, function (el) {
      if (el.closest('svg')) return;
      ATTRS.forEach(function (a) {
        var v = el.getAttribute(a);
        if (v && /[A-Za-zÀ-ž]/.test(v) && v.indexOf('http') !== 0) attrs.push({ el: el, attr: a, sk: v, key: norm(v) });
      });
    });
    /* popisy pre vyhľadávače a zdieľanie */
    ['description', 'og:description', 'og:title', 'twitter:description'].forEach(function (nm) {
      var el = document.querySelector('meta[name="' + nm + '"],meta[property="' + nm + '"]');
      if (el) attrs.push({ el: el, attr: 'content', sk: el.content, key: norm(el.content) });
    });
    var ti = document.querySelector('title');
    if (ti) attrs.push({ el: ti, attr: 'text', sk: ti.textContent, key: norm(ti.textContent) });
  }
  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }

  /* Preklad zachová pôvodné medzery okolo textu, inak by sa slová zlepili. */
  function put(sk, tr) {
    var lead = (sk.match(/^\s*/) || [''])[0], tail = (sk.match(/\s*$/) || [''])[0];
    return lead + tr + tail;
  }

  function apply(code, map) {
    if (!nodes) collect();
    nodes.forEach(function (x) {
      var tr = map && map[x.key];
      x.node.nodeValue = tr ? put(x.sk, tr) : x.sk;
    });
    attrs.forEach(function (x) {
      var tr = (map && map[x.key]) || x.sk;
      if (x.attr === 'text') x.el.textContent = tr; else x.el.setAttribute(x.attr, tr);
    });
    var L = byCode(code) || LANGS[0];
    document.documentElement.lang = L.locale;
    applied = code;
    document.querySelectorAll('[data-lang-pick]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.langPick === code));
    });
    var cur = document.querySelector('[data-lang-current]');
    if (cur) cur.textContent = L.short;
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: code } }));
  }

  var cache = {};
  function load(code, cb) {
    if (code === 'sk') return cb(null);
    if (cache[code]) return cb(cache[code]);
    fetch('assets/i18n/' + code + '.json', { cache: 'force-cache' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (map) { cache[code] = map; cb(map); })
      .catch(function () { cb(null); });   /* keď sa preklad nenačíta, zostane slovenčina */
  }

  function set(code, remember) {
    if (busy || code === applied) return;
    var L = byCode(code); if (!L) return;
    busy = true; current = code;
    if (remember !== false) { try { localStorage.setItem(STORE, code); } catch (e) {} }
    var u = new URL(location.href);
    if (code === 'sk') u.searchParams.delete('lang'); else u.searchParams.set('lang', code);
    history.replaceState(null, '', u);
    load(code, function (map) { apply(code, map); busy = false; });
  }

  function build() {
    var host = document.querySelector('[data-lang-switch]');
    if (!host) return;
    var cur = byCode(current) || LANGS[0];
    host.innerHTML =
      '<button class="lang-btn" type="button" aria-expanded="false" aria-haspopup="true" aria-label="Jazyk stránky, language">' +
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/></svg>' +
      '<span data-lang-current>' + cur.short + '</span></button>' +
      '<div class="lang-menu" role="menu" hidden>' +
      LANGS.map(function (l) {
        return '<button class="lang-opt" type="button" role="menuitem" data-lang-pick="' + l.code +
          '" aria-pressed="' + (l.code === current) + '"><b>' + l.short + '</b><span>' + l.label + '</span></button>';
      }).join('') + '</div>';

    var btn = host.querySelector('.lang-btn'), menu = host.querySelector('.lang-menu');
    function open(v) { menu.hidden = !v; btn.setAttribute('aria-expanded', String(v)); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); open(menu.hidden); });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lang-pick]'); if (!b) return;
      set(b.dataset.langPick); open(false); btn.focus();
    });
    document.addEventListener('click', function (e) { if (!host.contains(e.target)) open(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { open(false); btn.focus(); } });
  }

  function start() {
    current = pick(); build();
    if (current !== 'sk') set(current, false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.HS30_LANG = { set: set, langs: LANGS, get: function () { return applied; } };
})();
