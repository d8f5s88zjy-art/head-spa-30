/*
 * BARBERSHOP 30 – admin webu pre Lajka (barbershop-30/admin/). Mení texty, cenník, tím a fotky webu bez programátora.
 * Prihlásenie kľúčom GitHub (Contents: Read and write len na repozitár webu), kľúč ostáva v prehliadači. Uloženie je
 * jeden commit priamo do main (bloby, strom, commit, posun vetvy) ako v admine HEAD SPA 30 (admin/index.html);
 * GitHub Pages web obnoví asi do minúty.
 *
 * Čo sa zmení naraz, aby web ostal v súlade:
 *  - texty: index.html na presnom mieste (len text, značky ostanú), preklady (assets/i18n/*.json, kľúč = slovenský text);
 *  - cenník: index.html aj rezervacia.html (riadok podľa data-sluzba), preklady, znalosti asistenta
 *    (asistent/znalosti/barbershop.md) a odpovede asistenta s cenou dá na kontrolu (záložka Odpovede asistenta);
 *  - tím: oba súbory (karta podľa mena), fotky ako WebP a JPEG v dvoch šírkach, zoznam tímu v znalostiach a odpovediach;
 *  - galéria: fotka a popis;
 *  - odpovede asistenta: barbershop-otazky.json a jeho kópia pre web (assets/asistent-otazky.json).
 * Odmeny a akcie vernostnej kartičky sú v admine kartičky (odkaz v záložke Kartička).
 */
const OWNER = 'd8f5s88zjy-art', REPO = 'head-spa-30', BRANCH = 'main';
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const P = 'barbershop-30/';
const LIVE = `https://${OWNER}.github.io/${REPO}/${P}`;
const LANGS = ['en', 'uk', 'hu', 'sr', 'pl', 'de', 'cs'];
const LN = { en: 'Angličtina', uk: 'Ukrajinčina', hu: 'Maďarčina', sr: 'Srbčina', pl: 'Poľština', de: 'Nemčina', cs: 'Čeština' };
const F = { index: P + 'index.html', rez: P + 'rezervacia.html', md: 'asistent/znalosti/barbershop.md', faq: 'asistent/znalosti/barbershop-otazky.json', faqWeb: P + 'assets/asistent-otazky.json' };
const NB = ' ';
const K_KLUC = 'b30.admin';

const $ = (s, r = document) => r.querySelector(s);
const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const plain = (s) => norm(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escA = (s) => esc(s).replace(/"/g, '&quot;');
const reEsc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const short = (s, n = 60) => { s = norm(s); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; };
const slug = (s) => plain(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'clen';
// entity zo zdrojového HTML (&amp;, &nbsp; …) cez DOMParser: dokument je inertný, nič sa nespustí
const dec = (s) => (s.includes('&') ? new DOMParser().parseFromString(`<!doctype html><body><pre>${s.replace(/</g, '&lt;')}</pre>`, 'text/html').querySelector('pre').textContent : s);
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}

/* slovenská typografia pri zápise: čo bolo spojené pevnou medzerou, ostane; jednopísmenové slová, číslo s jednotkou
   a telefón sa spoja pevnou medzerou (ako v pôvodných textoch webu) */
function fixNb(t, old) {
  t = norm(t);
  String(old || '').replace(/(\S+) (?=(\S+))/g, (m, a, b) => { t = t.replace(new RegExp(`(^|\\s)${reEsc(a)} (?=${reEsc(b)}(?:\\s|$))`, 'g'), `$1${a}${NB}`); return m; });
  for (let i = 0; i < 2; i++) t = t.replace(/(^|[\s(„"])([aiouksvzAIOUKSVZ]) /g, `$1$2${NB}`);
  t = t.replace(/(\d) (?=(?:min|minút|€|rokov|cm|kresiel)(?![\wÀ-ž]))/g, `$1${NB}`).replace(/(\d{4}) (\d{3}) (\d{3})/g, `$1${NB}$2${NB}$3`);
  return t;
}

/* ---------------- GitHub ---------------- */
let token = '';
try { token = localStorage.getItem(K_KLUC) || sessionStorage.getItem(K_KLUC) || ''; } catch (e) { /* súkromné okno */ }
async function gh(path, opts = {}) {
  let r;
  try {
    r = await fetch(path.startsWith('http') ? path : API + path, { ...opts, cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.headers || {}) } });
  } catch (e) { throw Object.assign(new Error('sieť'), { net: true }); }
  if (!r.ok) { let t = ''; try { t = await r.text(); } catch (e) { /* nič */ } throw Object.assign(new Error(`${r.status} ${t.slice(0, 160)}`), { status: r.status }); }
  return r.status === 204 ? null : r.json();
}
function human(e) {
  if (e.user) return e.message;
  if (e.net) return 'Nepodarilo sa spojiť s GitHubom. Skontroluj internet a skús to znova.';
  if (e.status === 401) return 'Kľúč nie je platný alebo mu vypršala platnosť. Odhlás sa a prihlás sa novým kľúčom.';
  if (e.status === 403) return 'Kľúč nemá právo zapisovať (Contents: Read and write), alebo GitHub dočasne obmedzil požiadavky. Skús to o chvíľu.';
  if (e.status === 404) return 'Kľúč nemá prístup k súborom webu. Pri kľúči vyber repozitár webu.';
  if (e.status >= 500) return 'GitHub práve neodpovedá. Skús to o pár minút, zmeny tu ostávajú.';
  return `Niečo sa nepodarilo (${e.status || e.message}). Skús to o chvíľu znova.`;
}
const b64dec = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\n/g, '')), (c) => c.charCodeAt(0)));
function b64enc(str) { const bytes = new TextEncoder().encode(str); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); }
async function b64blob(blob) { const b = new Uint8Array(await blob.arrayBuffer()); let bin = ''; for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(bin); }
async function readFile(path, ref) {
  const j = await gh(`/contents/${path}?ref=${ref}`);
  if (j.content) return b64dec(j.content);
  const blob = await gh(`/git/blobs/${j.sha}`); return b64dec(blob.content);
}
async function commit(files, message, progress) {
  const ref = await gh(`/git/ref/heads/${BRANCH}`);
  if (ref.object.sha !== base.sha) throw Object.assign(new Error('stale'), { stale: true });
  const head = await gh(`/git/commits/${base.sha}`);
  const tree = [], list = Object.entries(files);
  let i = 0;
  for (const [path, f] of list) {
    i++;
    progress(`Ukladám ${i} z ${list.length}…`);
    const blob = await gh('/git/blobs', { method: 'POST', body: JSON.stringify({ content: f.b64 != null ? f.b64 : b64enc(f.text), encoding: 'base64' }) });
    tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const t = await gh('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: head.tree.sha, tree }) });
  const c = await gh('/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: t.sha, parents: [base.sha] }) });
  try { await gh(`/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: c.sha, force: false }) }); }
  catch (e) { if (e.status === 422 || e.status === 409) throw Object.assign(new Error('stale'), { stale: true }); throw e; }
  return c.sha;
}

/* ---------------- čítanie HTML: textové úseky s polohou a predkami ---------------- */
const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const PRESKOC = new Set(['script', 'style', 'template', 'noscript', 'svg', 'textarea', 'title']);
function rozober(html) {
  const seg = [], bloky = [], stack = [];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)/g;
  let m, telo = false;
  while ((m = re.exec(html))) {
    if (m[0].startsWith('<!--')) continue;
    if (m[4] !== undefined) { if (telo && m[4].trim()) seg.push({ start: m.index, end: m.index + m[4].length, raw: m[4], text: dec(m[4]), path: stack.slice() }); continue; }
    const tag = m[2].toLowerCase(), attrs = m[3] || '';
    if (m[1]) {
      for (let i = stack.length - 1; i >= 0; i--) if (stack[i].tag === tag) { const z = stack[i]; z.end = re.lastIndex; stack.length = i; if (z.blok) bloky.push(z); break; }
      continue;
    }
    if (tag === 'body') telo = true;
    if (PRESKOC.has(tag)) { const k = html.toLowerCase().indexOf(`</${tag}`, re.lastIndex); re.lastIndex = k < 0 ? html.length : html.indexOf('>', k) + 1; continue; }
    if (VOID.has(tag) || /\/\s*$/.test(attrs)) continue;
    const cls = (attrs.match(/\bclass="([^"]*)"/) || [])[1] || '';
    const uzol = { tag, cls: ' ' + cls + ' ', id: (attrs.match(/\bid="([^"]*)"/) || [])[1] || '', attrs, at: m.index, open: re.lastIndex };
    uzol.blok = tag === 'li' && /\b(price-row|team-card|gallery-item)\b/.test(cls);
    stack.push(uzol);
  }
  return { seg, bloky };
}
const ma = (s, c) => s.path.find((u) => u.cls.includes(' ' + c + ' '));
const sekcia = (s) => { const u = [...s.path].reverse().find((x) => (x.tag === 'section' && x.id) || x.tag === 'header' || x.tag === 'footer'); return u ? (u.id || u.tag) : 'ine'; };
const DRUH = { h1: 'Nadpis', h2: 'Nadpis', h3: 'Nadpis', h4: 'Nadpis', p: 'Text', a: 'Odkaz alebo tlačidlo', button: 'Tlačidlo', li: 'Položka', dt: 'Údaj', dd: 'Údaj', em: 'Časť nadpisu', span: 'Časť textu', strong: 'Časť textu', small: 'Text', b: 'Text' };
const druh = (s) => DRUH[(s.path[s.path.length - 1] || {}).tag] || 'Text';
const NAZOV_SEKCIE = { header: 'Hlavička', uvod: 'Úvod', 'vstup-dnu': 'Poď ďalej', remeslo: 'Remeslo', cakaren: 'Čakáreň', tim: 'Tím', sluzby: 'Služby a ceny', galeria: 'Galéria', rezervacia: 'Rezervácia a kontakt', kontakt: 'Pätička', footer: 'Pätička', ine: 'Odkaz na obsah a spodná lišta' };

/* ---------------- stav ---------------- */
let base = null;          // { sha, raw: {cesta: text}, i18n: {jazyk: {}}, faq }
let polia = [];           // textové polia (texty, cenník, tím, galéria, odpovede): { id, tab, label, orig, el, ... }
let tim = [], gal = [];   // členovia tímu a fotky galérie (aj nové a odstránené)
let tab = 'texty';

/* pole s prekladmi: orig = slovenský text, trs = preklady podľa kľúča (norm orig) */
function pole(o) {
  const p = { tr: {}, ...o };
  p.key = norm(p.orig);
  for (const l of LANGS) { const v = base.i18n[l][p.key]; if (v !== undefined) p.tr[l] = { orig: v, el: null }; }
  polia.push(p);
  return p;
}
const zmenene = (p) => (p.el && norm(p.el.value) !== norm(p.orig)) || Object.values(p.tr).some((t) => t.el && t.el.value !== t.orig);
function vstup(p, label, o = {}) {
  const hodnota = o.value != null ? o.value : norm(p.orig);
  // výška poľa podľa dĺžky textu (asi 32 znakov na riadok na telefóne); kde to prehliadač vie, rastie s textom (field-sizing)
  const el = o.area ? h('textarea', { rows: Math.min(8, Math.max(o.rows || 2, Math.ceil(hodnota.length / 32))) }) : h('input', { type: o.typ || 'text', inputmode: o.inputmode || null });
  el.value = hodnota;
  p.el = el;
  el.addEventListener('input', () => { el.classList.toggle('changed', norm(el.value) !== norm(o.value != null ? o.value : p.orig)); obnov(); if (p.pri) p.pri(); });
  const prek = Object.keys(p.tr).length && !o.bezPrekladu ? h('details', { class: 'tr' }, h('summary', {}, 'Preklady'),
    h('div', { class: 'tr-box' }, Object.entries(p.tr).map(([l, t]) => {
      const e = h('input', { type: 'text' }); e.value = t.orig; t.el = e;
      e.addEventListener('input', () => { e.classList.toggle('changed', e.value !== t.orig); obnov(); });
      return h('div', { class: 'f' }, h('label', {}, LN[l]), e);
    }))) : null;
  return h('div', { class: 'f' }, h('label', {}, label, o.pozn ? h('small', {}, o.pozn) : null), el, prek);
}

/* ---------------- načítanie ---------------- */
async function nacitaj() {
  const ref = await gh(`/git/ref/heads/${BRANCH}`);
  const sha = ref.object.sha;
  const cesty = [F.index, F.rez, F.md, F.faq, ...LANGS.map((l) => `${P}assets/i18n/${l}.json`)];
  const obsah = await Promise.all(cesty.map((c) => readFile(c, sha)));
  const raw = {}; cesty.forEach((c, i) => { raw[c] = obsah[i]; });
  const i18n = {}; LANGS.forEach((l) => { i18n[l] = JSON.parse(raw[`${P}assets/i18n/${l}.json`]); });
  base = { sha, raw, i18n, faq: JSON.parse(raw[F.faq]) };
  priprav();
}

function priprav() {
  polia = [];
  const ix = rozober(base.raw[F.index]), rz = rozober(base.raw[F.rez]);
  base.ix = ix; base.rz = rz;
  // cenník: riadky podľa data-sluzba v oboch súboroch
  const riadky = (r, html) => r.bloky.filter((b) => b.cls.includes(' price-row ')).map((b) => {
    const blok = html.slice(b.at, b.end), id = (blok.match(/data-sluzba="(\d+)"/) || [])[1];
    const s = r.seg.filter((x) => x.start > b.at && x.end < b.end);
    const daj = (c) => s.find((x) => ma(x, c));
    return { id, b, meno: daj('price-name'), popis: daj('price-desc'), cas: daj('price-time'), cena: daj('price-amount'), skryte: daj('visually-hidden') };
  }).filter((x) => x.id && x.meno);
  base.cennik = riadky(ix, base.raw[F.index]);
  base.cennikRez = riadky(rz, base.raw[F.rez]);
  // tím: karty podľa mena
  const karty = (r, html) => r.bloky.filter((b) => b.cls.includes(' team-card ')).map((b) => {
    const s = r.seg.filter((x) => x.start > b.at && x.end < b.end);
    const daj = (c) => s.find((x) => ma(x, c));
    return { b, html: html.slice(b.at, b.end), meno: daj('team-name'), rola: daj('team-role'), bio: daj('team-bio') };
  }).filter((x) => x.meno);
  base.tim = karty(ix, base.raw[F.index]);
  base.timRez = karty(rz, base.raw[F.rez]);
  tim = base.tim.map((k) => ({ k, meno: norm(k.meno.text), nove: false, zmaz: false, foto: null }));
  // galéria
  base.gal = ix.bloky.filter((b) => b.cls.includes(' gallery-item ')).map((b) => ({ b, html: base.raw[F.index].slice(b.at, b.end) }));
  gal = base.gal.map((g) => ({ g, alt: dec((g.html.match(/<img[^>]*\balt="([^"]*)"/) || [])[1] || ''), foto: null }));
  kresli();
}

/* ---------------- záložky ---------------- */
const TABY = { texty: 'Texty', cennik: 'Cenník', tim: 'Tím', galeria: 'Galéria', odpovede: 'Odpovede asistenta', karta: 'Kartička' };
function kresli() {
  const nav = $('#tabs .in');
  nav.replaceChildren(...Object.entries(TABY).map(([k, n]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(k === tab), 'data-tab': k, onclick: () => { tab = k; ukaz(); } }, n)));
  const app = $('#app');
  app.replaceChildren(...Object.keys(TABY).map((k) => h('section', { class: 'tab', 'data-tab': k, hidden: k !== tab })));
  textyTab(); cennikTab(); timTab(); galeriaTab(); odpovedeTab(); kartaTab();
  ukaz(); obnov();
}
function ukaz() {
  document.querySelectorAll('#tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  document.querySelectorAll('#app .tab').forEach((s) => { s.hidden = s.dataset.tab !== tab; });
  history.replaceState(null, '', '#' + tab);
}
const sec = (k) => $(`#app .tab[data-tab="${k}"]`);

/* texty: všetko okrem cenníka, tímu a galérie (tie majú vlastné záložky), po častiach webu, s hľadaním.
   Vynechané: úseky bez písmen (telefón, hodiny, rok, bodka) a podpis tvorcu webu. Telefón, hodiny a adresa sú aj
   v odkazoch, živom stave „otvorené“ a v asistentovi, preto ich mení tvorca webu naraz všade. Hlavička, pätička a lišty
   rezervačnej stránky (mimo main) sa menia spolu s hlavnou stránkou, ak je text rovnaký. */
const VYNECHAJ = ['price-row', 'team-card', 'gallery-item', 'marquee', 'flap', 'price-tabs', 'footer-autor'];
const PISMENO = /[A-Za-zÀ-ž]{2}/;
const UDAJ = /\d{1,2}:\d{2}|@|Mostná 30|^\s*(Po|So|Ne)[\s–-]/;   // hodiny, e‑mail, adresa (krátke údaje, nie vety)
const vynechat = (x) => !PISMENO.test(x.text) || (UDAJ.test(x.text) && norm(x.text).length < 40) || VYNECHAJ.some((c) => ma(x, c)) || x.path.some((u) => u.attrs.includes('aria-hidden="true"'));
const vRamci = (x) => !x.path.some((u) => u.tag === 'main');   // hlavička, pätička, lišty: rovnaké na oboch stránkach
function textyTab() {
  const s = sec('texty');
  const hladaj = h('input', { type: 'search', placeholder: 'Hľadať text na webe' });
  const chips = h('div', { class: 'chips' });
  const zoz = h('div');
  s.append(h('h1', {}, 'Texty webu'), h('p', { class: 'lead' }, 'Každý text na webe po častiach. Zmeň len slová, vzhľad ostane. Preklady sa presunú samé; ak sa zmysel zmenil, uprav ich pod textom.'),
    h('p', { class: 'note' }, h('b', {}, 'Telefón, otváracie hodiny a adresu '), 'tu nemeníš: sú aj v tlačidlách Zavolať, v stave „otvorené“ a v asistentovi. Zmenu pošli tvorcovi webu, upraví ich naraz všade.'),
    h('div', { class: 'tools' }, hladaj, chips), zoz);
  const skup = new Map(), ramec = new Map();
  for (const x of base.ix.seg) {
    if (vynechat(x)) continue;
    const k = sekcia(x);
    if (!skup.has(k)) skup.set(k, []);
    skup.get(k).push(x);
  }
  // rezervačná stránka: hlavička a pätička s rovnakým textom idú k poľu hlavnej stránky, ostatné majú vlastnú časť
  const rezVlastne = [], rezRamec = new Map();
  for (const x of base.rz.seg) {
    if (vynechat(x)) continue;
    if (vRamci(x)) { const k = norm(x.text); if (!rezRamec.has(k)) rezRamec.set(k, []); rezRamec.get(k).push(x); } else rezVlastne.push(x);
  }
  const bloky = [];
  const blok = (p, x) => h('div', { class: 'blk', 'data-hladaj': plain(x.text) }, h('p', { class: 'kind' }, druh(x) + (p.ciele.length > 1 ? ' · aj na rezervačnej stránke' : '')), vstup(p, '', { area: norm(x.text).length > 60 }));
  for (const [k, list] of skup) {
    const nazov = NAZOV_SEKCIE[k] || k;
    const box = h('div', { 'data-sekcia': k }, h('h2', {}, nazov));
    for (const x of list) {
      const p = pole({ id: `t:${x.start}`, tab: 'texty', label: `${nazov}: ${short(x.text, 40)}`, orig: x.text, ciele: [{ f: F.index, seg: x }] });
      if (vRamci(x)) {
        // prvý výskyt textu v hlavičke či pätičke hlavnej stránky prevezme rovnaké texty rezervačnej stránky
        const k2 = norm(x.text);
        if (!ramec.has(k2) && rezRamec.has(k2)) { ramec.set(k2, p); for (const y of rezRamec.get(k2)) p.ciele.push({ f: F.rez, seg: y }); }
      }
      box.append(blok(p, x));
    }
    bloky.push(box);
    chips.append(h('button', { class: 'chip', type: 'button', onclick: () => box.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, nazov));
  }
  // texty hlavičky a pätičky, ktoré sú len na rezervačnej stránke, a jej vlastný obsah
  for (const [k, list] of rezRamec) if (!ramec.has(k)) rezVlastne.push(...list);
  rezVlastne.sort((a, b) => a.start - b.start);
  const rez = h('div', { 'data-sekcia': 'rez' }, h('h2', {}, 'Rezervačná stránka'));
  for (const x of rezVlastne) {
    const p = pole({ id: `r:${x.start}`, tab: 'texty', label: `Rezervačná stránka: ${short(x.text, 40)}`, orig: x.text, ciele: [{ f: F.rez, seg: x }] });
    rez.append(blok(p, x));
  }
  bloky.push(rez);
  chips.append(h('button', { class: 'chip', type: 'button', onclick: () => rez.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 'Rezervačná stránka'));
  zoz.append(...bloky);
  hladaj.addEventListener('input', () => {
    const q = plain(hladaj.value);
    zoz.querySelectorAll('.blk').forEach((b) => { b.hidden = !!q && !b.dataset.hladaj.includes(q) && !plain(b.querySelector('input,textarea').value).includes(q); });
  });
}

/* cenník: služby podľa data-sluzba, zmena ide do oboch súborov, prekladov a znalostí asistenta */
function cennikTab() {
  const s = sec('cennik');
  s.append(h('h1', {}, 'Cenník'), h('p', { class: 'lead' }, 'Názov, popis, dĺžka a cena každej služby. Zmena sa ukáže na webe aj na rezervačnej stránke a asistent Barber dostane nové ceny. Ceny v rezervačnom systéme barbershop30.sk zmeň aj tam.'));
  for (const r of base.cennik) {
    const n = pole({ id: `c:${r.id}:meno`, tab: 'cennik', label: `Cenník: ${norm(r.meno.text)} (názov)`, orig: r.meno.text, sluzba: r.id, cast: 'meno' });
    const d = r.popis ? pole({ id: `c:${r.id}:popis`, tab: 'cennik', label: `Cenník: ${norm(r.meno.text)} (popis)`, orig: r.popis.text, sluzba: r.id, cast: 'popis' }) : null;
    const cas = pole({ id: `c:${r.id}:cas`, tab: 'cennik', label: `Cenník: ${norm(r.meno.text)} (dĺžka)`, orig: (norm(r.cas.text).match(/\d+/) || [''])[0], sluzba: r.id, cast: 'cas' });
    const cena = pole({ id: `c:${r.id}:cena`, tab: 'cennik', label: `Cenník: ${norm(r.meno.text)} (cena)`, orig: norm(r.cena.text).replace(/\s*€$/, ''), sluzba: r.id, cast: 'cena' });
    const varovanie = h('p', { class: 'warn', hidden: true });
    cena.pri = cas.pri = n.pri = () => { odpovedeNaKontrolu(); };
    const card = h('details', { class: 'card' }, h('summary', {}, h('span', { class: 'nm' }, norm(r.meno.text)), h('span', { class: 'mt' }, `${norm(r.cas.text)} · ${norm(r.cena.text)}`)),
      h('div', { class: 'body' }, vstup(n, 'Názov'), d ? vstup(d, 'Popis', { area: true }) : null,
        h('div', { class: 'row' }, vstup(cas, 'Dĺžka', { typ: 'number', inputmode: 'numeric', pozn: 'minút', bezPrekladu: true }), vstup(cena, 'Cena', { inputmode: 'decimal', pozn: '€', bezPrekladu: true })),
        varovanie));
    s.append(card);
  }
}

/* tím: úprava mena, roly, popisu a fotky; nový člen a odstránenie */
function timTab() {
  const s = sec('tim');
  const zoz = h('div');
  s.append(h('h1', {}, 'Tím'), h('p', { class: 'lead' }, 'Meno, rola (Barber alebo Barberka), krátky popis a fotka. Fotku vyber z telefónu alebo počítača, admin ju zmenší. Zmena sa ukáže na webe aj na rezervačnej stránke a asistent dostane nový zoznam tímu.'), zoz,
    h('div', { class: 'btns' }, h('button', { class: 'btn quiet', type: 'button', onclick: () => { tim.push({ k: null, meno: '', nove: true, zmaz: false, foto: null }); kresliTim(zoz); obnov(); } }, '+ Pridať člena tímu')));
  kresliTim(zoz);
}
function kresliTim(zoz) {
  zoz.replaceChildren(...tim.map((m, i) => {
    if (!m.p) {
      const k = m.k, kto = k ? norm(k.meno.text) : 'nový člen';
      m.p = {
        meno: pole({ id: `m:${i}:meno`, tab: 'tim', label: `Tím: ${kto} (meno)`, orig: k ? k.meno.text : '' }),
        rola: pole({ id: `m:${i}:rola`, tab: 'tim', label: `Tím: ${kto} (rola)`, orig: k ? k.rola.text : 'Barber' }),
        bio: pole({ id: `m:${i}:bio`, tab: 'tim', label: `Tím: ${kto} (popis)`, orig: k && k.bio ? k.bio.text : '' }),
      };
      if (!k) Object.values(m.p).forEach((p) => { p.nove = true; });
    }
    const img = h('img', { alt: '', src: m.foto ? m.foto.nahlad : k2src(m.k) });
    const subor = h('input', { type: 'file', accept: 'image/*' });
    subor.addEventListener('change', async () => { const f = subor.files[0]; if (!f) return; m.foto = await priprauFoto(f, [480, 820]); img.src = m.foto.nahlad; obnov(); });
    const zmaz = h('button', { class: 'btn quiet small', type: 'button', onclick: () => { m.zmaz = !m.zmaz; card.classList.toggle('changed', m.zmaz); zmaz.textContent = m.zmaz ? 'Vrátiť späť' : 'Odstrániť z tímu'; obnov(); } }, m.zmaz ? 'Vrátiť späť' : 'Odstrániť z tímu');
    const card = h('details', { class: 'card' + (m.nove ? ' changed' : ''), open: m.nove || null },
      h('summary', {}, h('span', { class: 'nm' }, m.k ? norm(m.k.meno.text) : 'Nový člen tímu'), h('span', { class: 'mt' }, m.k ? norm(m.k.rola.text) : '')),
      h('div', { class: 'body' }, h('div', { class: 'photo' }, img, h('div', {}, h('span', { class: 'btn quiet small file' }, 'Vybrať fotku', subor), h('p', { class: 'kind' }, 'Najlepšie fotka na výšku, tvár v hornej tretine.'))),
        vstup(m.p.meno, 'Meno'), vstup(m.p.rola, 'Rola', { pozn: 'Barber alebo Barberka' }), vstup(m.p.bio, 'Krátky popis', { area: true, pozn: 'jedna veta' }),
        m.nove ? null : h('div', { class: 'btns' }, zmaz)));
    return card;
  }));
}
function k2src(k) {
  if (!k) return '';
  const m = k.html.match(/srcset="([^"]+\.webp)[^"]*"/);
  const prvy = m ? m[1].split(',')[0].trim().split(/\s+/)[0] : '';
  return prvy ? `https://raw.githubusercontent.com/${OWNER}/${REPO}/${base.sha}/${P}${prvy}` : '';
}

/* galéria: fotka a popis */
function galeriaTab() {
  const s = sec('galeria');
  s.append(h('h1', {}, 'Galéria'), h('p', { class: 'lead' }, 'Vymeň fotku alebo jej popis (popis číta aj Google a nevidiaci). Fotka sa zmenší a uloží v troch veľkostiach.'));
  gal.forEach((g, i) => {
    const p = pole({ id: `g:${i}:alt`, tab: 'galeria', label: `Galéria: ${short(g.alt, 40)}`, orig: g.alt });
    const prvy = (g.g.html.match(/srcset="([^"]+\.webp)/) || [])[1] || '';
    const img = h('img', { alt: '', src: prvy ? `https://raw.githubusercontent.com/${OWNER}/${REPO}/${base.sha}/${P}${prvy.split(',')[0].trim().split(/\s+/)[0]}` : '' });
    const subor = h('input', { type: 'file', accept: 'image/*' });
    subor.addEventListener('change', async () => { const f = subor.files[0]; if (!f) return; g.foto = await priprauFoto(f, [640, 1080, 1600]); img.src = g.foto.nahlad; obnov(); });
    s.append(h('details', { class: 'card' }, h('summary', {}, h('span', { class: 'nm' }, short(g.alt, 50))),
      h('div', { class: 'body' }, h('div', { class: 'photo wide' }, img, h('span', { class: 'btn quiet small file' }, 'Vymeniť fotku', subor)), vstup(p, 'Popis fotky', { area: true }))));
  });
}

/* odpovede asistenta: všetky časté otázky; po zmene cenníka tie so starou cenou na kontrolu */
let kontrolaBox = null;
function odpovedeTab() {
  const s = sec('odpovede');
  const hladaj = h('input', { type: 'search', placeholder: 'Hľadať v otázkach a odpovediach' });
  kontrolaBox = h('div');
  const zoz = h('div');
  s.append(h('h1', {}, 'Odpovede asistenta'), h('p', { class: 'lead' }, `Asistent Barber má ${base.faq.otazky.length} overených odpovedí na časté otázky. Uprav odpoveď, ak sa niečo zmenilo. Píš len to, čo naozaj platí, a pri termínoch vždy telefón.`),
    kontrolaBox, h('div', { class: 'tools' }, hladaj), zoz);
  base.faq.otazky.forEach((o) => {
    const p = pole({ id: `o:${o.id}`, tab: 'odpovede', label: `Odpoveď: ${short(o.q, 50)}`, orig: o.a, faq: o.id });
    p.tr = {};   // odpovede nie sú v slovníkoch webu
    zoz.append(h('div', { class: 'blk', 'data-hladaj': plain(o.q + ' ' + o.a) }, h('p', { class: 'kind' }, o.q), vstup(p, '', { area: true, rows: 3 })));
  });
  hladaj.addEventListener('input', () => { const q = plain(hladaj.value); zoz.querySelectorAll('.blk').forEach((b) => { b.hidden = !!q && !b.dataset.hladaj.includes(q); }); });
}
/* ceny v odpovediach: po zmene ceny služby nájde odpovede so starou cenou; ak tú cenu nemá iná služba, navrhne novú */
function odpovedeNaKontrolu() {
  if (!kontrolaBox) return;
  const zmeny = [];
  for (const r of base.cennik) {
    const c = polia.find((p) => p.id === `c:${r.id}:cena`);
    if (c && c.el && norm(c.el.value) !== c.orig) zmeny.push({ stara: c.orig, nova: norm(c.el.value), meno: norm(r.meno.text) });
  }
  kontrolaBox.replaceChildren();
  if (!zmeny.length) return;
  const vsetky = base.cennik.map((r) => norm(r.cena.text).replace(/\s*€$/, ''));
  const items = [];
  for (const z of zmeny) {
    const jedina = vsetky.filter((c) => c === z.stara).length === 1;
    const re = new RegExp(`(^|[^\\d,])${reEsc(z.stara)}[\\s\\u00a0]€`, 'g');
    for (const p of polia.filter((x) => x.faq)) {
      if (!re.test(p.orig)) continue; re.lastIndex = 0;
      if (jedina && norm(p.el.value) === norm(p.orig)) { p.el.value = p.orig.replace(re, `$1${z.nova}${NB}€`); p.el.classList.add('changed'); }
      items.push(h('li', {}, h('a', { href: '#', onclick: (e) => { e.preventDefault(); tab = 'odpovede'; ukaz(); p.el.scrollIntoView({ block: 'center' }); p.el.focus(); } }, short(base.faq.otazky.find((o) => o.id === p.faq).q, 70)),
        jedina ? ' (cenu som prepísal, skontroluj)' : ' (rovnakú cenu má aj iná služba, oprav ručne)'));
    }
  }
  if (items.length) kontrolaBox.append(h('div', { class: 'note' }, h('b', {}, 'Na kontrolu po zmene cenníka: '), h('ul', {}, items)));
  obnov();
}

function kartaTab() {
  const s = sec('karta');
  s.append(h('h1', {}, 'Vernostná kartička'), h('p', { class: 'lead' }, 'Odmeny, akcie, správy zákazníkom a zápis návštev sú v admine kartičky. Prihlasuje sa heslom Barbershopu (nie týmto kľúčom).'),
    h('p', { class: 'note' }, 'Admin kartičky beží na serveri kartičiek (headspa30.sk). Odkazy začnú fungovať, keď bude server kartičiek spustený.'),
    h('div', { class: 'links' },
      h('a', { href: 'https://www.headspa30.sk/vernost/admin/', target: '_blank', rel: 'noopener' }, h('b', {}, 'Admin kartičky'), h('span', {}, 'Odmeny, akcie, správy, klienti, QR pre nového klienta po zaplatení')),
      h('a', { href: LIVE + 'karta/?nova', target: '_blank', rel: 'noopener' }, h('b', {}, 'Založenie kartičky'), h('span', {}, 'Stránka, ktorú otvorí QR kód na recepcii'))),
    h('h2', {}, 'Ako to funguje'), h('ol', { class: 'lead' },
      h('li', {}, 'Po zaplatení ukáž zákazníkovi QR kód (admin kartičky → Klienti → QR pre nového klienta).'),
      h('li', {}, 'Zákazník si kartičku založí v telefóne, pri ďalšej návšteve mu zapíšeš návštevu a dostane body.'),
      h('li', {}, 'Odmeny (koľko bodov za čo) a akcie si nastavíš sám v admine kartičky.')));
}

/* ---------------- fotky: zmenšenie v prehliadači na WebP a JPEG ---------------- */
async function priprauFoto(subor, sirky) {
  const url = URL.createObjectURL(subor);
  const img = await new Promise((ok, zle) => { const i = new Image(); i.onload = () => ok(i); i.onerror = zle; i.src = url; });
  const verzie = {};
  for (const w of sirky) {
    const sw = Math.min(w, img.naturalWidth), sh = Math.round(img.naturalHeight * sw / img.naturalWidth);
    const c = document.createElement('canvas'); c.width = sw; c.height = sh;
    c.getContext('2d').drawImage(img, 0, 0, sw, sh);
    const blob = (typ, q) => new Promise((ok) => c.toBlob(ok, typ, q));
    const webp = await blob('image/webp', 0.82), jpg = await blob('image/jpeg', 0.85);
    verzie[w] = { webp: webp && webp.type === 'image/webp' ? webp : null, jpg, w: sw, h: sh };
  }
  return { nahlad: url, verzie, w: verzie[sirky[sirky.length - 1]].w, h: verzie[sirky[sirky.length - 1]].h, sirky };
}
const verzia = () => Date.now().toString(36);

/* ---------------- zmeny: zoznam a lišta ---------------- */
function zoznamZmien() {
  const z = [];
  for (const p of polia) if (zmenene(p)) z.push(p.label);
  tim.forEach((m) => { if (m.nove && m.p && norm(m.p.meno.el && m.p.meno.el.value)) z.push(`Tím: nový člen ${norm(m.p.meno.el.value)}`); if (m.zmaz) z.push(`Tím: odstrániť ${m.meno}`); if (m.foto && !m.nove) z.push(`Tím: nová fotka ${m.meno}`); });
  gal.forEach((g) => { if (g.foto) z.push(`Galéria: nová fotka ${short(g.alt, 30)}`); });
  return z;
}
function obnov() {
  const z = zoznamZmien();
  $('#pocet').textContent = z.length ? `${z.length} ${z.length === 1 ? 'zmena' : z.length < 5 ? 'zmeny' : 'zmien'}` : 'Žiadne zmeny';
  $('#zoznam').replaceChildren(...z.map((t) => h('li', {}, t)));
  $('#pocet').disabled = !z.length; if (!z.length) $('#zoznam').hidden = true;
  $('#ulozit').disabled = $('#zrusit').disabled = !z.length || ukladam;
  document.documentElement.style.setProperty('--bar', $('#bar').offsetHeight + 'px');
}
$('#pocet').addEventListener('click', () => { $('#zoznam').hidden = !$('#zoznam').hidden; obnov(); });

/* ---------------- zostavenie súborov na uloženie ---------------- */
function nahrad(html, zmeny) {
  // od konca, aby polohy predošlých ostali platné
  zmeny.sort((a, b) => b.start - a.start);
  for (const z of zmeny) html = html.slice(0, z.start) + z.text + html.slice(z.end);
  return html;
}
const zapisSeg = (seg, novy) => { const lead = seg.raw.match(/^\s*/)[0], tail = seg.raw.match(/\s*$/)[0]; return { start: seg.start, end: seg.end, text: lead + esc(fixNb(novy, seg.text)) + tail }; };
function prekladyPresun(i18n, stary, novy, preklady) {
  const ok = norm(stary), nk = norm(novy);
  for (const l of LANGS) {
    const d = i18n[l];
    const hod = preklady && preklady[l] !== undefined ? preklady[l] : d[ok];
    if (hod === undefined) continue;
    if (ok !== nk) {
      // nový kľúč na miesto starého (poradie súboru ostane)
      const nove = {};
      for (const [k, v] of Object.entries(d)) { if (k === ok) nove[nk] = hod; else if (k !== nk) nove[k] = v; }
      if (!(nk in nove)) nove[nk] = hod;
      if (ostavaText(ok)) nove[ok] = d[ok];
      i18n[l] = nove;
    } else d[ok] = hod;
  }
}
let zostavaTexty = null;   // texty, ktoré po zmene ostanú na stránkach (či sa starý kľúč ešte používa)
const ostavaText = (k) => zostavaTexty && zostavaTexty.has(k);

function zostav() {
  const subory = {}, html = { [F.index]: base.raw[F.index], [F.rez]: base.raw[F.rez] };
  const zm = { [F.index]: [], [F.rez]: [] };
  const i18n = JSON.parse(JSON.stringify(base.i18n));
  const faq = JSON.parse(JSON.stringify(base.faq));
  let md = base.raw[F.md];
  const presuny = [];   // [stary, novy, preklady]
  const preklady = (p) => { const o = {}; for (const [l, t] of Object.entries(p.tr)) if (t.el && t.el.value !== t.orig) o[l] = t.el.value; return o; };
  const sk = (p) => norm(p.el.value);

  // texty
  for (const p of polia.filter((x) => x.tab === 'texty' && zmenene(x))) {
    for (const c of p.ciele) zm[c.f].push(zapisSeg(c.seg, sk(p)));
    presuny.push([p.orig, sk(p), preklady(p)]);
  }
  // cenník
  for (const r of base.cennik) {
    const pp = (cast) => polia.find((x) => x.id === `c:${r.id}:${cast}`);
    const n = pp('meno'), d = pp('popis'), cas = pp('cas'), cena = pp('cena');
    if (![n, d, cas, cena].some((x) => x && zmenene(x))) continue;
    const r2 = base.cennikRez.find((x) => x.id === r.id);
    for (const [f, row] of [[F.index, r], [F.rez, r2]]) {
      if (!row) continue;
      if (zmenene(n)) { zm[f].push(zapisSeg(row.meno, sk(n))); if (row.skryte) zm[f].push(zapisSeg(row.skryte, ` – ${sk(n)}`)); }
      if (d && zmenene(d) && row.popis) zm[f].push(zapisSeg(row.popis, sk(d)));
      if (zmenene(cas)) zm[f].push(zapisSeg(row.cas, `${sk(cas)} min`));
      if (zmenene(cena)) zm[f].push(zapisSeg(row.cena, `${sk(cena)} €`));
    }
    if (zmenene(n)) {
      presuny.push([n.orig, sk(n), preklady(n)]);
      if (r.skryte) { const tr = preklady(n); const t2 = {}; for (const l of LANGS) { const v = tr[l] !== undefined ? tr[l] : i18n[l][norm(n.orig)]; if (v !== undefined) t2[l] = `– ${v}`; } presuny.push([norm(r.skryte.text), `– ${sk(n)}`, t2]); }
    }
    if (d && zmenene(d)) presuny.push([d.orig, sk(d), preklady(d)]);
    if (zmenene(cas)) for (const l of LANGS) { const vzor = i18n[l]['40 min']; if (vzor && !(`${sk(cas)} min` in i18n[l])) i18n[l][`${sk(cas)} min`] = vzor.replace(/\d+/, sk(cas)); }
    // znalosti asistenta: riadok služby (názov – dĺžka – cena: popis)
    const kluc = (s) => plain(s).replace(/[–,]/g, ' ').replace(/\s+/g, ' ').trim();
    md = md.replace(/^- (.+?) – (\d+) min – ([\d,]+ €)(:.*)?$/gm, (cely, meno, min, cen, zvysok) => {
      if (kluc(meno) !== kluc(n.orig)) return cely;
      const popis = d && zmenene(d) ? `: ${sk(d).charAt(0).toLowerCase()}${sk(d).slice(1).replace(/\.$/, '')}.` : (zvysok || '');
      return `- ${zmenene(n) ? sk(n) : meno} – ${zmenene(cas) ? sk(cas) : min} min – ${zmenene(cena) ? sk(cena) + ' €' : cen}${popis}`;
    });
  }
  // tím
  const sizes = (k) => (k.html.match(/sizes="([^"]+)"/) || [])[1] || '(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 20vw';
  const nove = {};
  const obrazok = (foto, cesta, alt, sz) => {
    const src = (typ) => foto.sirky.map((w) => `${cesta}-${w}.${typ} ${foto.verzie[w].w}w`).join(', ');
    const webp = foto.verzie[foto.sirky[0]].webp ? `\n                  <source type="image/webp" srcset="${src('webp')}" sizes="${sz}">` : '';
    return `<picture>${webp}\n                  <img src="${cesta}-${foto.sirky[foto.sirky.length - 1]}.jpg" srcset="${src('jpg')}" sizes="${sz}" width="${foto.w}" height="${foto.h}" loading="lazy" decoding="async" style="--focal: 50% 30%" alt="${escA(alt)}">\n                </picture>`;
  };
  // nová fotka prevezme z pôvodnej odsadenie riadkov, ohnisko výrezu a fetchpriority (rezervačná stránka)
  const ako = (stara, nova) => {
    const ods = (stara.match(/\n([ \t]*)<img/) || [])[1], focal = (stara.match(/--focal: ([^;"]+)/) || [])[1];
    if (ods != null) nova = nova.replace(/\n[ \t]*</g, (m, i) => `\n${ods}<`).replace(/\n[ \t]*<\/picture>$/, `\n${ods.slice(2)}</picture>`);
    if (focal) nova = nova.replace('--focal: 50% 30%', `--focal: ${focal}`);
    if (/fetchpriority="low"/.test(stara)) nova = nova.replace('decoding="async"', 'decoding="async" fetchpriority="low"');
    return nova;
  };
  const pridajFoto = (foto, cesta) => { for (const w of foto.sirky) { const v = foto.verzie[w]; if (v.webp) nove[`${P}${cesta}-${w}.webp`] = v.webp; nove[`${P}${cesta}-${w}.jpg`] = v.jpg; } };
  let timZmena = false;
  for (const m of tim) {
    const meno = m.p ? norm(m.p.meno.el ? m.p.meno.el.value : m.p.meno.orig) : m.meno;
    const rola = m.p ? norm(m.p.rola.el ? m.p.rola.el.value : m.p.rola.orig) : '';
    const bio = m.p ? norm(m.p.bio.el ? m.p.bio.el.value : m.p.bio.orig) : '';
    if (m.nove) {
      if (!meno) continue;
      if (!m.foto) throw Object.assign(new Error(`Nový člen tímu ${meno} potrebuje fotku.`), { user: true });
      timZmena = true;
      const cesta = `assets/img/tim-${slug(meno)}-${verzia()}`;
      pridajFoto(m.foto, cesta);
      for (const [f, karty] of [[F.index, base.tim], [F.rez, base.timRez]]) {
        if (!karty.length) continue;
        const vzor = karty[karty.length - 1];
        let k = vzor.html.replace(/<picture>[\s\S]*?<\/picture>/, (pic) => ako(pic, obrazok(m.foto, cesta, `${meno}, ${rola} v Barbershop 30`, sizes(vzor))));
        k = k.replace(/(<h3 class="team-name">)[^<]*(<\/h3>)/, `$1${esc(meno)}$2`).replace(/(<p class="team-role">)[^<]*(<\/p>)/, `$1${esc(rola)}$2`).replace(/(<p class="team-bio">)[^<]*(<\/p>)/, `$1${esc(fixNb(bio))}$2`);
        zm[f].push({ start: vzor.b.end, end: vzor.b.end, text: '\n            ' + k });
      }
      for (const l of LANGS) { if (!(meno in i18n[l])) i18n[l][meno] = meno; }
      continue;
    }
    const kartaRez = base.timRez.find((x) => norm(x.meno.text) === m.meno);
    if (m.zmaz) {
      timZmena = true;
      // celý riadok karty aj s odsadením pred ním
      const vyhod = (f, k) => { const src = html[f]; let st = k.b.at; while (st > 0 && /[ \t]/.test(src[st - 1])) st--; if (src[st - 1] === '\n') st--; zm[f].push({ start: st, end: k.b.end, text: '' }); };
      vyhod(F.index, m.k); if (kartaRez) vyhod(F.rez, kartaRez);
      continue;
    }
    const zmMeno = zmenene(m.p.meno), zmRola = zmenene(m.p.rola), zmBio = zmenene(m.p.bio);
    if (zmMeno || zmRola || zmBio || m.foto) timZmena = true;
    for (const [f, k] of [[F.index, m.k], [F.rez, kartaRez]]) {
      if (!k) continue;
      if (zmMeno) zm[f].push(zapisSeg(k.meno, meno));
      if (zmRola) zm[f].push(zapisSeg(k.rola, rola));
      if (zmBio && k.bio) zm[f].push(zapisSeg(k.bio, bio));
      const pic = k.html.match(/<picture>[\s\S]*?<\/picture>/);
      if (pic && (m.foto || zmMeno || zmRola)) {
        const start = k.b.at + pic.index, end = start + pic[0].length;
        if (m.foto) {
          const cesta = `assets/img/tim-${slug(meno)}-${verzia()}`;
          if (!m.cesta) { m.cesta = cesta; pridajFoto(m.foto, cesta); }
          zm[f].push({ start, end, text: ako(pic[0], obrazok(m.foto, m.cesta, `${meno}, ${rola} v Barbershop 30`, sizes(k))) });
        } else {
          zm[f].push({ start, end, text: pic[0].replace(/\balt="[^"]*"/, `alt="${escA(`${meno}, ${rola} v Barbershop 30`)}"`) });
        }
      }
    }
    if (zmMeno) presuny.push([m.p.meno.orig, meno, preklady(m.p.meno)]);
    if (zmRola) presuny.push([m.p.rola.orig, rola, preklady(m.p.rola)]);
    if (zmBio) presuny.push([m.p.bio.orig, bio, preklady(m.p.bio)]);
  }
  // galéria
  gal.forEach((g, i) => {
    const p = polia.find((x) => x.id === `g:${i}:alt`);
    const alt = norm(p.el.value);
    if (!g.foto && !zmenene(p)) return;
    let k = g.g.html;
    if (zmenene(p)) {
      k = k.replace(/\balt="[^"]*"/g, `alt="${escA(alt)}"`).replace(/data-lightbox-alt="[^"]*"/, `data-lightbox-alt="${escA(alt)}"`).replace(/aria-label="Zväčšiť: [^"]*"/, `aria-label="${escA(`Zväčšiť: ${alt}`)}"`);
      presuny.push([g.alt, alt, preklady(p)]);
      presuny.push([`Zväčšiť: ${g.alt}`, `Zväčšiť: ${alt}`, null]);
    }
    if (g.foto) {
      const meno = (g.g.html.match(/srcset="assets\/img\/([a-z0-9-]+?)-\d+\.webp/) || [])[1] || `galeria-${i}`;
      const cesta = `assets/img/${meno.replace(/-[a-z0-9]{6,}$/, '')}-${verzia()}`;
      pridajFoto(g.foto, cesta);
      const sz = (k.match(/sizes="([^"]+)"/) || [])[1] || '(max-width: 900px) 100vw, 50vw';
      k = k.replace(/<picture>[\s\S]*?<\/picture>/, obrazok(g.foto, cesta, alt, sz).replace(' style="--focal: 50% 30%"', ''));
      const velka = g.foto.sirky[g.foto.sirky.length - 1];
      k = k.replace(/data-lightbox-src="[^"]*"/, `data-lightbox-src="${cesta}-${velka}.jpg"`)
        .replace(/data-lightbox-srcset="[^"]*"/, `data-lightbox-srcset="${g.foto.sirky.map((w) => `${cesta}-${w}.jpg ${g.foto.verzie[w].w}w`).join(', ')}"`)
        .replace(/data-lightbox-w="\d+"/, `data-lightbox-w="${g.foto.w}"`).replace(/data-lightbox-h="\d+"/, `data-lightbox-h="${g.foto.h}"`);
    }
    zm[F.index].push({ start: g.g.b.at, end: g.g.b.end, text: k });
  });
  // odpovede asistenta
  let faqZmena = false;
  for (const p of polia.filter((x) => x.faq && zmenene(x))) { const o = faq.otazky.find((x) => x.id === p.faq); o.a = norm(p.el.value); faqZmena = true; }
  if (timZmena) faqZmena = timDoZnalosti(faq, (t) => { md = t(md); }) || faqZmena;

  // súbory
  for (const f of [F.index, F.rez]) if (zm[f].length) html[f] = nahrad(html[f], zm[f]);
  zostavaTexty = new Set([...rozober(html[F.index]).seg, ...rozober(html[F.rez]).seg].map((x) => norm(x.text)));
  for (const [stary, novy, tr] of presuny) prekladyPresun(i18n, stary, novy, tr);
  for (const f of [F.index, F.rez]) if (html[f] !== base.raw[f]) subory[f] = { text: html[f] };
  for (const l of LANGS) { const s = JSON.stringify(i18n[l]); if (s !== JSON.stringify(base.i18n[l])) subory[`${P}assets/i18n/${l}.json`] = { text: s }; }
  if (md !== base.raw[F.md]) subory[F.md] = { text: md };
  if (faqZmena) { subory[F.faq] = { text: JSON.stringify(faq, null, 1) + '\n' }; subory[F.faqWeb] = { text: JSON.stringify(faq) + '\n' }; }
  return { subory, nove, faq };
}

/* tím v znalostiach asistenta a v odpovediach: zoznam mien, počet a odpovede o jednotlivých členoch */
function timDoZnalosti(faq, zmenMd) {
  const clenovia = tim.filter((m) => !m.zmaz && m.p && norm(m.p.meno.el ? m.p.meno.el.value : m.p.meno.orig)).map((m) => ({
    meno: norm(m.p.meno.el ? m.p.meno.el.value : m.p.meno.orig), rola: norm(m.p.rola.el ? m.p.rola.el.value : m.p.rola.orig), bio: norm(m.p.bio.el ? m.p.bio.el.value : m.p.bio.orig) }));
  const zena = (m) => /barberka/i.test(m.rola);
  const barberi = clenovia.filter((m) => !zena(m)).map((m) => m.meno), barberky = clenovia.filter(zena).map((m) => m.meno);
  const zoznam = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} a ${a[a.length - 1]}` : a[0] || '');
  const adrian = (m) => (m === 'Adrián' ? ' (v rezervačnom systéme Adrian)' : '');
  zmenMd((md) => md.replace(/^Barberi: .*$/m, `Barberi: ${barberi.map((m) => m + adrian(m)).join(', ')}.${barberky.length ? ` ${barberky.length > 1 ? 'Barberky' : 'Barberka'}: ${barberky.join(', ')}.` : ''}`));
  const REZ = 'https://www.barbershop30.sk/rezervacia';
  const TEL = 'Zavolaj nám na 0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme.';
  const nastav = (id, a) => { const o = faq.otazky.find((x) => x.id === id); if (o) o.a = a; };
  nastav('tim', `V tíme sú barberi ${zoznam(barberi)}${barberky.length ? ` a ${barberky.length > 1 ? 'barberky' : 'barberka'} ${zoznam(barberky)}` : ''}. Svojho človeka si vyberieš v rezervácii.`);
  nastav('kolko-barberov', `Na webe je predstavených ${clenovia.length} ľudí: ${barberi.length} ${barberi.length === 1 ? 'barber' : barberi.length < 5 ? 'barberi' : 'barberov'}${barberky.length ? ` a ${barberky.length === 1 ? 'barberka ' + barberky[0] : barberky.length + ' barberky'}` : ''}. Strihá sa v 8 kreslách v troch miestnostiach.`);
  // odpovede o jednotlivých členoch: staré preč, aktuálne podľa tímu na mieste prvej z nich
  const jeClen = (o) => /^(tim|volno)-/.test(o.id) && o.t === 'tim';
  const kde = faq.otazky.findIndex(jeClen);
  const ost = faq.otazky.filter((o) => !jeClen(o));
  const pozn = (m) => (m === 'Adrián' ? ' V rezervačnom systéme je ako Adrian.' : '');
  const nove = clenovia.flatMap((m) => [
    { id: `tim-${slug(m.meno)}`, t: 'tim', q: `Strihá u vás ${m.meno}?`, v: [`Je u vás ${m.meno}?`, `${m.meno} barber`, `Pracuje u vás ${m.meno}?`],
      a: `Áno, ${m.meno} je ${zena(m) ? 'barberka' : 'barber'} v našom tíme.${m.bio ? ' ' + m.bio : ''} Vyberieš si ${zena(m) ? 'ju' : 'ho'} v rezervácii na ${REZ}.${pozn(m.meno)}` },
    { id: `volno-${slug(m.meno)}`, t: 'tim', q: `Kedy má ${m.meno} voľný termín?`, v: [`Má ${m.meno} voľno?`, `Termín u ${m.meno}`, `Objednať sa k ${m.meno}`],
      a: `Voľné časy uvidíš v rezervácii na ${REZ}, keď v kroku barber vyberieš ${m.meno}.${pozn(m.meno)} ${TEL}`, tel: 1 },
  ]);
  ost.splice(kde < 0 ? ost.length : Math.min(kde, ost.length), 0, ...nove);
  faq.otazky = ost;
  return true;
}

/* kontrola pred uložením: ceny v odpovediach asistenta musia byť v cenníku (asistent nesmie hovoriť starú cenu) */
function skontroluj(faq) {
  const ceny = new Set(base.cennik.map((r) => {
    const c = polia.find((p) => p.id === `c:${r.id}:cena`);
    return norm(c && c.el ? c.el.value : norm(r.cena.text).replace(/\s*€$/, ''));
  }));
  const zle = [];
  for (const o of faq.otazky) for (const m of o.a.matchAll(/(\d+(?:,\d+)?)[\s ]€/g)) if (!ceny.has(m[1])) zle.push(`${short(o.q, 50)} (${m[1]} €)`);
  for (const r of base.cennik) {
    const c = polia.find((p) => p.id === `c:${r.id}:cena`), cas = polia.find((p) => p.id === `c:${r.id}:cas`);
    if (c && !/^\d+(,\d{1,2})?$/.test(norm(c.el.value))) zle.push(`Cena „${norm(c.el.value)}“ pri ${norm(r.meno.text)} (napíš napr. 18 alebo 21,50)`);
    if (cas && !/^\d{1,3}$/.test(norm(cas.el.value))) zle.push(`Dĺžka „${norm(cas.el.value)}“ pri ${norm(r.meno.text)} (len číslo minút)`);
  }
  return zle;
}

/* ---------------- uloženie ---------------- */
let ukladam = false;
function msg(el, obsah, druh) { el.replaceChildren(...[].concat(obsah)); el.className = 'msg' + (druh ? ' ' + druh : ''); el.hidden = false; obnov(); }
async function uloz() {
  const out = $('#saveMsg');
  ukladam = true; obnov();
  try {
    msg(out, 'Pripravujem…');
    const { subory, nove, faq } = zostav();
    const zle = skontroluj(faq);
    if (zle.length) throw Object.assign(new Error(`Odpovede asistenta majú ceny, ktoré už nie sú v cenníku, alebo je v cenníku chyba: ${zle.slice(0, 5).join('; ')}. Oprav ich v záložke Odpovede asistenta alebo Cenník.`), { user: true });
    for (const [cesta, blob] of Object.entries(nove)) subory[cesta] = { b64: await b64blob(blob) };
    if (!Object.keys(subory).length) { msg(out, 'Nie je čo uložiť, web už takto vyzerá.'); return; }
    const z = zoznamZmien();
    await commit(subory, `Barbershop 30, úprava webu: ${z.slice(0, 3).join('; ')}${z.length > 3 ? ` a ďalšie (${z.length - 3})` : ''}`, (t) => msg(out, t));
    await nacitaj();
    msg(out, ['Uložené. Na webe to bude o minútu. ', h('a', { href: LIVE, target: '_blank', rel: 'noopener' }, 'Otvoriť web')], 'ok');
  } catch (e) {
    if (e.stale) msg(out, 'Web sa medzitým zmenil inde (iné uloženie). Obnov stránku, načítaj novú verziu a zmeny urob znova.', 'bad');
    else msg(out, 'Neuložené. ' + human(e), 'bad');
  } finally { ukladam = false; obnov(); }
}
$('#ulozit').addEventListener('click', uloz);
$('#zrusit').addEventListener('click', () => { if (confirm('Zrušiť všetky neuložené zmeny?')) { priprav(); msg($('#saveMsg'), 'Zmeny sú zrušené, všetko je ako na webe.'); } });
addEventListener('beforeunload', (e) => { if (base && zoznamZmien().length) { e.preventDefault(); e.returnValue = ''; } });

/* ---------------- prihlásenie ---------------- */
async function prihlas() {
  const t = $('#token').value.trim() || token;
  if (!t) { msg($('#loginMsg'), 'Vlož kľúč.', 'bad'); return; }
  token = t; msg($('#loginMsg'), 'Overujem kľúč a načítavam web…');
  try {
    const repo = await gh('');
    if (!repo.permissions || !repo.permissions.push) throw Object.assign(new Error('Kľúč má len právo čítať. Pri kľúči nastav Contents: Read and write.'), { user: true });
    try { ($('#zapamatat').checked ? localStorage : sessionStorage).setItem(K_KLUC, token); } catch (e) { /* súkromné okno */ }
    $('#login').hidden = true; $('#loading').hidden = false;
    tab = (location.hash || '#texty').slice(1); if (!TABY[tab]) tab = 'texty';
    await nacitaj();
    $('#loading').hidden = true;
    ['#app', '#tabs', '#odhlasit', '#webLink', '#bar'].forEach((s) => { $(s).hidden = false; });
    document.body.classList.add('in');
    obnov();
  } catch (e) {
    $('#loading').hidden = true; $('#login').hidden = false;
    if (e.status === 401 || e.status === 404 || e.user) { token = ''; try { localStorage.removeItem(K_KLUC); sessionStorage.removeItem(K_KLUC); } catch (x) { /* nič */ } }
    msg($('#loginMsg'), human(e), 'bad');
  }
}
$('#prihlasit').addEventListener('click', prihlas);
$('#token').addEventListener('keydown', (e) => { if (e.key === 'Enter') prihlas(); });
$('#odhlasit').addEventListener('click', () => { if (zoznamZmien().length && !confirm('Máš neuložené zmeny. Naozaj sa odhlásiť?')) return; try { localStorage.removeItem(K_KLUC); sessionStorage.removeItem(K_KLUC); } catch (e) { /* nič */ } location.reload(); });
if (token) prihlas();
