/*
 * BARBERSHOP 30 – jazykové verzie. Prevzaté z webu HEAD SPA 30 (assets/i18n.js v koreni repozitára, návod
 * toolbox/skills-z-praxe/obsah-a-texty/references/preklady-i18n.md): slovenčina je zdroj priamo v index.html,
 * ostatné jazyky sú slovníky kľúčované slovenským textom (assets/i18n/<jazyk>.json). Preklad sa nasadzuje na
 * textové uzly a vybrané atribúty, HTML nepotrebuje žiadne značky navyše. Text bez kľúča zostane po slovensky.
 *
 * Rozdiely oproti HEAD SPA: modul načíta app.js (časť 7c) – hneď, keď je v adrese ?lang= alebo uložená voľba,
 * inak až pri prvom geste alebo 3,5 s po načítaní, aby nič nesúperilo s prvým obrazom (HTML a style.css sú tesne
 * pod hranicou prvého okna TCP). Prepínač jazyka a jeho štýly (i18n.css) vytvorí tento modul. Jazyk sa pamätá
 * v localStorage pod b30.lang.
 */
const html = document.documentElement;

/* page a close sú slová pre čítačky obrazovky, og je jazyk pre zdieľanie, offer je ponuka v prúžku,
   rez je poznámka k hlavnej rezervácii (systém barbershop30.sk je len po slovensky).
   Poradie podľa prieskumu (docs/JAZYKY.md): angličtina pre všetkých, potom najväčšie skupiny v Nitre, potom susedia. */
export const LANGS = [
  { code: 'sk', label: 'Slovensky', short: 'SK', locale: 'sk-SK', og: 'sk_SK', page: 'jazyk stránky', close: 'Zavrieť', offer: '', rez: '' },
  { code: 'en', label: 'English', short: 'EN', locale: 'en', og: 'en_GB', page: 'page language', close: 'Close', offer: 'This page is also in English.', rez: 'The booking page is in Slovak.' },
  { code: 'uk', label: 'Українська', short: 'UA', locale: 'uk-UA', og: 'uk_UA', page: 'мова сторінки', close: 'Закрити', offer: 'Сторінка є і українською.', rez: 'Сторінка бронювання словацькою мовою.' },
  { code: 'hu', label: 'Magyar', short: 'HU', locale: 'hu-HU', og: 'hu_HU', page: 'az oldal nyelve', close: 'Bezárás', offer: 'Az oldal magyarul is elérhető.', rez: 'A foglalási oldal szlovák nyelvű.' },
  { code: 'sr', label: 'Srpski', short: 'SR', locale: 'sr-Latn', og: 'sr_RS', page: 'jezik stranice', close: 'Zatvori', offer: 'Stranica je i na srpskom.', rez: 'Stranica za rezervaciju je na slovačkom.' },
  { code: 'pl', label: 'Polski', short: 'PL', locale: 'pl-PL', og: 'pl_PL', page: 'język strony', close: 'Zamknij', offer: 'Strona jest też po polsku.', rez: 'Strona rezerwacji jest po słowacku.' },
  { code: 'de', label: 'Deutsch', short: 'DE', locale: 'de-AT', og: 'de_AT', page: 'Sprache der Seite', close: 'Schließen', offer: 'Die Seite gibt es auch auf Deutsch.', rez: 'Die Buchungsseite ist auf Slowakisch.' },
  { code: 'cs', label: 'Česky', short: 'CZ', locale: 'cs-CZ', og: 'cs_CZ', page: 'jazyk stránky', close: 'Zavřít', offer: 'Stránka je i v češtině.', rez: 'Rezervační stránka je ve slovenštině.' },
];
/* jazyk prehliadača, ktorý ponúkne srbčinu (latinka pokryje aj chorvátčinu, bosniačtinu, čiernohorčinu) */
const ALIAS = { hr: 'sr', bs: 'sr', sh: 'sr', me: 'sr' };
/* Booqme (farbenie u Romany) má vlastné jazykové verzie; srbčinu nemá, preto angličtina */
const BQ_BOOK = { sk: 'rezervacia', cs: 'rezervace', hu: 'foglalas', en: 'reservation', de: 'reservation', pl: 'reservation', uk: 'reservation' };
const BQ_RE = /^https:\/\/booqme\.app\/[a-z]{2}\/(rezervacia|rezervace|foglalas|reservation)\//;
const STORE = 'b30.lang';
const ATTRS = ['placeholder', 'aria-label', 'alt', 'title'];
const SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, svg: 1 };
const LETTER = /\p{L}/u;               // písmeno v ľubovoľnom písme (latinka, cyrilika, …)

let current = 'sk', applied = 'sk', busy = false;
/* slovník, ktorý sa práve nasadzuje, a jeho obrátená verzia (preklad -> slovenský kľúč) */
let live = null, liveRev = null, prevRev = null;

const byCode = (c) => LANGS.find((l) => l.code === c) || null;
export function pick() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && byCode(q)) return q;
  try { const s = localStorage.getItem(STORE); if (s && byCode(s)) return s; } catch (e) { /* súkromné okno */ }
  return 'sk';
}
function suggested() {
  const nav = (navigator.languages || [navigator.language || '']).map((l) => String(l).slice(0, 2).toLowerCase());
  for (const c of nav) { const L = byCode(ALIAS[c] || c); if (L && L.code !== 'sk') return L; }
  return null;
}

/* Zbierka textových uzlov a atribútov na preklad, robí sa raz na pôvodnom slovenskom obsahu */
let nodes = null, attrs = null;
const known = new WeakSet();
function ok(n) {
  const p = n.parentNode;
  return !!p && !SKIP[p.nodeName] && !p.closest('svg') && !p.closest('[data-no-i18n]') && LETTER.test(n.nodeValue);
}
function walk(root, f) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (ok(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
  let n; while ((n = w.nextNode())) f(n);
}
function collect() {
  nodes = []; attrs = [];
  walk(document.body, (n) => { known.add(n); nodes.push({ node: n, sk: n.nodeValue, key: norm(n.nodeValue) }); });
  document.body.querySelectorAll('[' + ATTRS.join('],[') + ']').forEach((el) => {
    if (el.closest('svg') || el.closest('[data-no-i18n]')) return;
    ATTRS.forEach((a) => {
      const v = el.getAttribute(a);
      if (v && LETTER.test(v) && v.indexOf('http') !== 0) attrs.push({ el, attr: a, sk: v, key: norm(v), last: v });
    });
  });
  ['description', 'og:description', 'og:title', 'og:image:alt', 'twitter:title', 'twitter:description'].forEach((nm) => {
    const el = document.querySelector(`meta[name="${nm}"],meta[property="${nm}"]`);
    if (el) attrs.push({ el, attr: 'content', sk: el.content, key: norm(el.content) });
  });
  const ti = document.querySelector('title');
  if (ti) attrs.push({ el: ti, attr: 'text', sk: ti.textContent, key: norm(ti.textContent) });
  watch();
}

/* Text, ktorý skripty vložia neskôr, sa preloží hneď pri vložení a zaradí do zbierky. Uzol môže prísť po slovensky
   alebo už preložený (skopírovaný z preloženého textu). */
function adopt(n) {
  if (known.has(n) || !ok(n)) return;
  known.add(n);
  const v = n.nodeValue, k = norm(v), x = { node: n, sk: v, key: k };
  if (k.length > 1 && live) {
    if (live[k] !== undefined) n.nodeValue = put(v, live[k]);
    else if (liveRev[k] !== undefined) { x.key = liveRev[k]; x.sk = put(v, x.key); }
  }
  nodes.push(x);
}
function watch() {
  if (!window.MutationObserver) return;
  new MutationObserver((list) => {
    list.forEach((m) => m.addedNodes.forEach((n) => {
      if (n.nodeType === 3) adopt(n);
      else if (n.nodeType === 1 && !SKIP[n.nodeName]) walk(n, adopt);
    }));
  }).observe(document.body, { childList: true, subtree: true });
}
const reverse = (map) => { const r = {}; if (map) for (const k in map) r[norm(map[k])] = k; return r; };
function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }

/* Preklad zachová pôvodné medzery okolo textu; značka Barbershop 30 sa nerozdelí na dva riadky */
function put(sk, tr) {
  const lead = (sk.match(/^\s*/) || [''])[0], tail = (sk.match(/\s*$/) || [''])[0];
  return lead + String(tr).replace(/Barbershop 30/g, 'Barbershop 30') + tail;
}
/* Atribút, ktorý prepísal skript, sa prekladá po častiach oddelených „: “ */
function retell(v, prev, map) {
  return String(v).split(': ').map((part) => { let k = norm(part); k = (prev && prev[k]) || k; return (map && map[k]) || k; }).join(': ');
}

const later = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 500 }) : (f) => setTimeout(f, 0);
function apply(code, map) {
  if (!nodes) collect();
  prevRev = liveRev; live = map; liveRev = reverse(map);
  let i = 0; const CHUNK = 240;
  const chunk = () => {
    const end = Math.min(nodes.length, i + CHUNK);
    for (; i < end; i++) { const x = nodes[i], tr = map && map[x.key]; x.node.nodeValue = tr ? put(x.sk, tr) : x.sk; }
    if (i === CHUNK) waiting(false);
    if (i < nodes.length) { later(chunk); return; }
    finish(code, map);
  };
  chunk();
}
function finish(code, map) {
  attrs.forEach((x) => {
    let tr = (map && map[x.key]) || x.sk;
    if (x.attr === 'text') { x.el.textContent = tr; return; }
    const now = x.el.getAttribute(x.attr);
    if (x.last !== undefined && now !== null && (x.own || now !== x.last)) { x.own = true; tr = retell(now, prevRev, map); }
    x.el.setAttribute(x.attr, tr); x.last = tr;
  });
  const L = byCode(code) || LANGS[0];
  html.lang = L.locale;
  const og = document.querySelector('meta[property="og:locale"]');
  if (og) og.content = L.og;
  applied = code;
  document.querySelectorAll('[data-lang-pick]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.langPick === code)));
  const cur = document.querySelector('[data-lang-current]');
  if (cur) cur.textContent = L.short;
  const lb = document.querySelector('.lang-btn');
  if (lb) lb.setAttribute('aria-label', L.short + ', ' + L.page);
  odkazy(L);
  waiting(false);
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: code } }));
}

/* Booqme v jazyku stránky; pri hlavnej rezervácii (len po slovensky) poznámka v jazyku stránky */
function odkazy(L) {
  const b = BQ_BOOK[L.code] ? L.code : 'en';
  document.querySelectorAll('a[href^="https://booqme.app/"]').forEach((a) => {
    const h = a.getAttribute('href'), m = h.match(BQ_RE); if (!m) return;
    const to = h.replace(BQ_RE, `https://booqme.app/${b}/${BQ_BOOK[b]}/`);
    if (to !== h) a.setAttribute('href', to);
  });
  document.querySelectorAll('a[href^="https://www.barbershop30.sk/rezervacia"]').forEach((a) => {
    if (L.rez) a.setAttribute('title', L.rez); else a.removeAttribute('title');
  });
}

const cache = {};
function load(code, cb) {
  if (code === 'sk') return cb(null);
  if (cache[code]) return cb(cache[code]);
  fetch(new URL(`i18n/${code}.json`, import.meta.url), { cache: 'force-cache' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((map) => { cache[code] = map; cb(map); })
    .catch(() => cb(null));            /* keď sa preklad nenačíta, zostane slovenčina */
}
export function set(code, remember) {
  if (busy || code === applied) return;
  const L = byCode(code); if (!L) return;
  busy = true; current = code;
  if (remember !== false) { try { localStorage.setItem(STORE, code); } catch (e) { /* súkromné okno */ } }
  const u = new URL(location.href);
  if (code === 'sk') u.searchParams.delete('lang'); else u.searchParams.set('lang', code);
  history.replaceState(history.state, '', u);
  load(code, (map) => { apply(map || code === 'sk' ? code : 'sk', map); busy = false; });
}

/* Prepínač jazyka: na počítači v lište (tlačidlo s glóbusom a ponuka), na telefóne v rozbaľovacom menu
   ako rad skratiek, lebo v lište vedľa tlačidiel Hudba a Menu nie je miesto */
function build() {
  const head = document.querySelector('.site-header .container'), nav = document.getElementById('nav');
  if (!head || head.querySelector('[data-lang-switch]')) return;
  const host = document.createElement('div');
  host.className = 'lang'; host.setAttribute('data-lang-switch', ''); host.setAttribute('data-no-i18n', '');
  const cur = byCode(current) || LANGS[0];
  host.innerHTML =
    `<button class="lang-btn" type="button" aria-expanded="false" aria-haspopup="true" title="Jazyk stránky / language" aria-label="${cur.short}, ${cur.page}">` +
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/></svg>' +
    `<span data-lang-current>${cur.short}</span></button>` +
    '<div class="lang-menu" role="menu" aria-label="Jazyk stránky / language" hidden>' +
    LANGS.map((l) => `<button class="lang-opt" type="button" role="menuitemradio" lang="${l.locale}" data-lang-pick="${l.code}" aria-checked="${l.code === current}"><b>${l.short}</b><span>${l.label}</span></button>`).join('') +
    '</div>';
  const btn = host.querySelector('.lang-btn'), menu = host.querySelector('.lang-menu'), opts = [...menu.querySelectorAll('.lang-opt')];
  const mq = window.matchMedia('(max-width: 900px)');
  const vMenu = () => mq.matches && !!nav;
  const place = () => {
    const m = vMenu();
    host.classList.toggle('lang-v-menu', m);
    menu.setAttribute('role', m ? 'radiogroup' : 'menu');
    opts.forEach((o) => o.setAttribute('role', m ? 'radio' : 'menuitemradio'));
    btn.hidden = m; menu.hidden = !m; btn.setAttribute('aria-expanded', 'false');
    if (m) nav.prepend(host);
    else head.insertBefore(host, head.querySelector('.hudba') || head.querySelector('.nav-toggle'));
  };
  place();
  mq.addEventListener ? mq.addEventListener('change', place) : mq.addListener(place);
  const open = (v) => { if (vMenu()) return; menu.hidden = !v; btn.setAttribute('aria-expanded', String(v)); if (v) (menu.querySelector('[aria-checked="true"]') || menu.firstChild).focus(); };
  btn.addEventListener('click', (e) => { e.stopPropagation(); open(menu.hidden); });
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang-pick]'); if (!b) return;
    set(b.dataset.langPick);
    if (!vMenu()) { open(false); btn.focus(); }
  });
  menu.addEventListener('keydown', (e) => {
    const i = opts.indexOf(document.activeElement), sp = vMenu() ? ['ArrowRight', 'ArrowLeft'] : ['ArrowDown', 'ArrowUp'];
    if (e.key === sp[0] || e.key === sp[1]) { e.preventDefault(); opts[(i + (e.key === sp[0] ? 1 : opts.length - 1)) % opts.length].focus(); }
  });
  document.addEventListener('click', (e) => { if (!host.contains(e.target)) open(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !vMenu() && !menu.hidden) { open(false); btn.focus(); } });
}

/* Kým sa prvý preklad nasadí, úvod je skrytý (trieda t-wait z hlavičky index.html) */
function waiting(v) { html.classList.toggle('t-wait', !!v); }

/* Prehliadaču v inom jazyku sa jazyk len ponúkne prúžkom, text sa sám neprepisuje */
function offer() {
  const L = suggested(); if (!L) return;
  try { if (localStorage.getItem(STORE) || localStorage.getItem(STORE + '.no')) return; } catch (e) { return; }
  const box = document.createElement('div');
  box.className = 'lang-offer'; box.setAttribute('data-no-i18n', ''); box.setAttribute('lang', L.locale);
  box.innerHTML = `<span>${L.offer}</span><button type="button" data-yes>${L.label}</button><button type="button" data-no aria-label="${L.close}">&times;</button>`;
  box.addEventListener('click', (e) => {
    if (e.target.closest('[data-yes]')) { set(L.code); box.remove(); return; }
    if (e.target.closest('[data-no]')) { try { localStorage.setItem(STORE + '.no', '1'); } catch (er) { /* */ } box.remove(); }
  });
  document.body.appendChild(box);
  requestAnimationFrame(() => box.classList.add('in'));
  setTimeout(() => { box.classList.remove('in'); setTimeout(() => box.remove(), 400); }, 12000);
}

/* t(kľúč) vráti preklad slovenského textu v nasadenom jazyku, pre texty skladané v skriptoch */
export function t(k) { const m = cache[applied], v = m && m[norm(k)]; return typeof v === 'string' ? v : k; }
export const get = () => applied;
/* ďalšie údaje slovníka (napr. __tabula pre tabuľu hodín); pre slovenčinu null */
export function data(name) { const m = cache[applied]; return (m && m[name]) || null; }

export function spusti() {
  if (window.B30_LANG) return;
  window.B30_LANG = { set, t, get, data, langs: LANGS };
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = new URL('i18n.css', import.meta.url).href;
  document.head.append(link);
  current = pick();
  link.addEventListener('load', build, { once: true });
  if (current !== 'sk') { html.lang = byCode(current).locale; waiting(true); setTimeout(() => waiting(false), 1500); set(current, false); }
  else { later(offer); later(() => { if (!nodes) collect(); }); }
}
