/*
 * BARBERSHOP 30 – rezervačná stránka (rezervacia.html). Malý modul namiesto app.js webu (bez filmu a hudby):
 * menu na telefóne, jazyky (assets/i18n.js), kroky objednávky priamo v stránke (assets/objednavka.js, stranka),
 * fotky práce barberov (assets/praca.json, ak ich prevádzka dodala) a AI asistent na otázky (assets/asistent.js).
 * Bez skriptu stránka ostáva cenníkom s odkazmi do rezervačného systému a s telefónom.
 *
 * Zapínanie ako na webe: data-objednavka na <html> (nasadenie len so súhlasom prevádzky rezervačného systému) a
 * data-asistent (len s kľúčom API na serveri); na vlastnom počítači ?objednavka=<adresa> a ?asistent=<adresa>,
 * ?objednavka=off a ?asistent=off ich vypnú, ?objednavka=ukazka ukáže kroky s ukážkovými časmi a ?asistent=ukazka
 * okno asistenta s vopred pripravenými odpoveďami (obe na kontrolu, výrazne označené).
 */
const html = document.documentElement;
const q = new URLSearchParams(location.search);
const lokal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const adresa = (meno) => { const v = q.get(meno); const a = v === 'off' ? '' : (lokal && v) || html.dataset[meno] || ''; return /^https?:\/\//.test(a) ? a : ''; };
// ?objednavka=ukazka: kroky s ukážkovými časmi bez servera, na kontrolu (výrazne označené, nič nerezervuje);
// ?asistent=ukazka: okno Barbera s vopred pripravenými odpoveďami z údajov webu (výrazne označené, nie AI)
const ukazka = q.get('objednavka') === 'ukazka';

/* menu na telefóne (ako app.js časť 9, bez filmu) */
(function menu() {
  const head = document.querySelector('.site-header'), btn = document.querySelector('.nav-toggle'), nav = document.getElementById('nav');
  if (!head || !btn || !nav) return;
  const nastav = (o) => { head.dataset.menu = o ? 'open' : 'closed'; btn.setAttribute('aria-expanded', String(o)); document.body.style.overflow = o ? 'hidden' : ''; };
  btn.addEventListener('click', () => nastav(head.dataset.menu !== 'open'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) nastav(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && head.dataset.menu === 'open') { nastav(false); btn.focus(); } });
  matchMedia('(max-width: 900px)').addEventListener?.('change', (e) => { if (!e.matches) nastav(false); });
})();

/* rok v pätičke */
document.querySelectorAll('.year').forEach((e) => { e.textContent = String(new Date().getFullYear()); });

/* kroky objednávky: hneď, stránka je na to; bez pripojeného kalendára ostane cenník */
(function objednavka() {
  const api = ukazka ? 'ukazka' : adresa('objednavka'), koren = document.querySelector('[data-objednavka-koren]');
  if (!api || !koren) return;
  import('./objednavka.js').then((m) => m.stranka(api, koren)).catch(() => {});
})();

/* jazyky: hneď pri ?lang= alebo uloženej voľbe, inak pri prvom geste alebo 3,5 s po načítaní (ako na webe) */
(function jazyky() {
  let lang = q.get('lang');
  try { lang = lang || localStorage.getItem('b30.lang'); } catch (e) { /* súkromné okno */ }
  let raz = false;
  const nacitaj = () => { if (raz) return; raz = true; import('./i18n.js').then((m) => m.spusti()).catch(() => {}); };
  if (lang && lang !== 'sk') { nacitaj(); return; }
  ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'wheel'].forEach((t) => addEventListener(t, nacitaj, { once: true, passive: true }));
  const neskor = () => setTimeout(nacitaj, 3500);
  if (document.readyState === 'complete') neskor(); else addEventListener('load', neskor, { once: true });
})();

/* Barber, AI asistent na otázky zákazníkov (zreteľne označený ako AI); ikona sa ukáže, až keď je server zapnutý */
(function asistent() {
  const api = q.get('asistent') === 'ukazka' ? 'ukazka' : adresa('asistent');
  if (!api) return;
  let raz = false;
  const nacitaj = () => { if (raz) return; raz = true; import('./asistent.js').then((m) => m.spusti(api)).catch(() => {}); };
  ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'wheel'].forEach((t) => addEventListener(t, nacitaj, { once: true, passive: true }));
  const neskor = () => setTimeout(nacitaj, 2500);
  if (document.readyState === 'complete') neskor(); else addEventListener('load', neskor, { once: true });
})();

/* naša práca: fotky od barberov (assets/praca.json z source/tools/praca.py); bez súboru ostane len odkaz na Instagram */
(function praca() {
  const zoznam = document.querySelector('[data-praca]');
  if (!zoznam) return;
  const zdroj = new URL('praca.json', import.meta.url);
  fetch(zdroj.href, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((j) => {
    const barberi = (j && j.barberi) || {}, mena = (j && j.mena) || {};
    const polozky = [];
    // striedavo od každého barbera, aby bolo vidieť celý tím
    for (let i = 0; i < 4; i++) for (const k of Object.keys(barberi)) if (barberi[k][i]) polozky.push([k, barberi[k][i]]);
    if (!polozky.length) return;
    zoznam.replaceChildren(...polozky.slice(0, 16).map(([k, f]) => {
      const fig = document.createElement('figure'), im = document.createElement('img'), cap = document.createElement('figcaption');
      im.src = new URL(f.maly, zdroj).href; im.alt = f.alt || ''; im.width = 480; im.height = 600; im.loading = 'lazy'; im.decoding = 'async';
      cap.textContent = mena[k] || k;
      fig.append(im, cap);
      const li = document.createElement('li'); li.append(fig);
      return li;
    }));
    zoznam.hidden = false;
  }).catch(() => {});
})();

