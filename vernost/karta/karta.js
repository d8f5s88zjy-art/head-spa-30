/* Vernostná kartička 30 – stránka klienta (karta/?k=<token>).
   Údaje: ../api/?a=karta. Posledná verzia karty sa pamätá v prehliadači, aby QR kód išiel ukázať aj bez signálu.
   Všetky texty z databázy idú do stránky len cez textContent.
   Ten istý súbor beží aj na webe Barbershopu (barbershop-30/karta/, kópia, test ju stráži): <html> tam nesie
   data-api (adresa API), data-api-lokal (API na vlastnom počítači), data-manifest (vlastný manifest na plochu)
   a data-prevadzka; s ňou stránka bez kartičky ukáže formulár na založenie (?nova = QR kód na recepcii). */
import { qrSvg } from './qr.js';

const D = document.documentElement.dataset;
const API = (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && D.apiLokal) || D.api || '../api/';
const P = D.prevadzka || '';                       // prevádzka stránky (web Barbershopu); bez nej len kartička z odkazu
const NAZOV = { barbershop: 'Barbershop 30', headspa: 'HEAD SPA 30' }[P] || '';
const $obsah = document.getElementById('obsah');
const k = new URLSearchParams(location.search).get('k') || '';
const pamat = {
  daj(kluc) { try { return JSON.parse(localStorage.getItem(kluc) || 'null'); } catch (e) { return null; } },
  uloz(kluc, h) { try { localStorage.setItem(kluc, JSON.stringify(h)); } catch (e) { /* súkromné okno */ } },
  zmaz(kluc) { try { localStorage.removeItem(kluc); } catch (e) { /* nič */ } },
};

function el(tag, attrs = {}, ...deti) {
  const e = document.createElement(tag);
  for (const [a, h] of Object.entries(attrs)) {
    if (h === null || h === undefined || h === false) continue;
    if (a === 'class') e.className = h; else if (a.startsWith('on')) e.addEventListener(a.slice(2), h); else e.setAttribute(a, h === true ? '' : h);
  }
  for (const d of deti.flat()) if (d !== null && d !== undefined && d !== false) e.append(d instanceof Node ? d : String(d));
  return e;
}
const bodov = (n) => (n === 1 ? 'bod' : n >= 2 && n <= 4 ? 'body' : 'bodov');
/* čas zo servera je v UTC (…Z), dátum akcie je len deň; oboje po slovensky a v slovenskom čase */
const datum = (s) => {
  s = String(s || '');
  if (s.includes('T')) { const d = new Date(s); return isNaN(d) ? '' : d.toLocaleDateString('sk-SK', { timeZone: 'Europe/Bratislava' }); }
  const [r, m, d] = s.split('-').map(Number); return r ? `${d}. ${m}. ${r}` : '';
};
const pekneKod = (c) => String(c || '').replace(/^(.{4})(.{4})$/, '$1 $2');

async function api(akcia, telo) {
  const r = await fetch(`${API}?a=${akcia}${telo ? '' : `&k=${encodeURIComponent(k)}`}`, telo
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ k, ...telo }) }
    : { cache: 'no-store' });
  const j = await r.json().catch(() => ({ ok: false, chyba: 'Server neodpovedá.' }));
  if (!r.ok || !j.ok) throw Object.assign(new Error(j.chyba || 'Niečo sa nepodarilo.'), { kod: r.status });
  return j;
}

/* ---------- bez odkazu: uložené kartičky v tomto prehliadači ---------- */
function bezKarty(sprava) {
  const ulozene = (pamat.daj('v30.karty') || []).filter((x) => x && /^[A-Za-z0-9_-]{22}$/.test(x.k));
  const nova = new URLSearchParams(location.search).has('nova');
  if (!sprava && !nova && ulozene.length === 1) { location.replace(`./?k=${ulozene[0].k}`); return; }
  document.title = NAZOV ? `Vernostná kartička ${NAZOV}` : 'Vernostná kartička';
  if (P) document.documentElement.dataset.p = P;
  const form = P ? zalozenie() : null;
  // replaceChildren by z null urobil text „null“, preto len skutočné prvky
  $obsah.replaceChildren(...[
    el('div', { class: 'hlava' }, el('span', { class: 'znacka' }, NAZOV ? `${NAZOV} · vernostná kartička` : 'Vernostná kartička'), el('small', {}, '30')),
    el('h1', {}, sprava || (P ? 'Zbieraj body za každú návštevu' : 'Kartičku otvoríš z odkazu')),
    el('p', { class: 'ako' }, P ? 'Za návštevy dostávaš body a vymeníš ich za odmeny, ktoré nájdeš na kartičke. Kartička je zadarmo a na tvoje meno.'
      : 'Odkaz na kartičku ti príde e‑mailom po prihlásení. Ak ho nemáš, povedz na recepcii, ukážeme ti ju.'),
    ulozene.length ? el('section', {}, el('h2', {}, 'Kartičky v tomto telefóne'),
      el('ul', { class: 'ulozene' }, ulozene.map((x) => el('li', {}, el('a', { class: 'tl', href: `./?k=${x.k}` }, x.nazov || 'Kartička'))))) : null,
    form,
  ].filter(Boolean));
  $obsah.setAttribute('aria-busy', 'false');
}

/* založenie kartičky priamo na stránke (web prevádzky, QR kód na recepcii po zaplatení): nič nie je predvolené,
   súhlas s kartičkou je povinný, so správami samostatný; kým server kartičiek nebeží, stránka to povie a dá telefón */
const TELEFON = { barbershop: ['0951 267 203', '+421951267203'], headspa: ['0911 153 136', '+421911153136'] };
function zalozenie() {
  const box = el('section', { class: 'zaloz', 'aria-labelledby': 'zaloz-h' }, el('h2', { id: 'zaloz-h' }, 'Založ si kartičku'));
  const sprava = el('p', { class: 'pozn', role: 'status' });
  const pole = (meno, typ, popis, attrs = {}) => {
    const i = el('input', { type: typ, name: meno, ...attrs });
    return [i, el('label', { class: 'pole' }, el('span', {}, popis), i)];
  };
  const [meno, lMeno] = pole('meno', 'text', 'Meno a priezvisko', { autocomplete: 'name', required: true, maxlength: '80' });
  const [tel, lTel] = pole('telefon', 'tel', 'Telefón', { autocomplete: 'tel', inputmode: 'tel', required: true, maxlength: '30' });
  const [mail, lMail] = pole('email', 'email', 'E‑mail (nepovinné, pošleme naň odkaz)', { autocomplete: 'email', maxlength: '120' });
  const chcem = el('input', { type: 'checkbox', required: true }), spravy = el('input', { type: 'checkbox' });
  const pasca = el('input', { type: 'text', name: 'web', tabindex: '-1', autocomplete: 'off', class: 'pasca', 'aria-hidden': 'true' });
  const tl = el('button', { class: 'tl hlavne', type: 'submit' }, 'Založiť kartičku');
  const f = el('form', { class: 'formular', novalidate: true }, lMeno, lTel, lMail,
    el('label', { class: 'prepinac' }, chcem, el('span', {}, 'Áno, chcem vernostnú kartičku. Údaje použijete len na ňu.')),
    el('label', { class: 'prepinac' }, spravy, el('span', {}, 'Chcem dostávať správy o akciách. Môžem to kedykoľvek vypnúť.')),
    pasca, el('div', { class: 'tlacidla' }, tl), sprava,
    el('p', { class: 'pozn' }, el('a', { href: new URL('../ochrana-udajov.html', new URL(API, location.href)).href, target: '_blank', rel: 'noopener' }, 'Ochrana údajov')));
  const [telText, telHref] = TELEFON[P] || ['', ''];
  const mimo = () => box.replaceChildren(el('h2', { id: 'zaloz-h' }, 'Kartičky práve spúšťame'),
    el('p', { class: 'pozn' }, 'Kartičku ti zatiaľ založíme na recepcii.' + (telText ? ` Zavolaj nám na ${telText}.` : '')),
    telHref ? el('div', { class: 'tlacidla' }, el('a', { class: 'tl hlavne', href: 'tel:' + telHref }, 'Zavolať')) : null);
  fetch(`${API}?a=stav`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : Promise.reject())).then((j) => { if (!j.ok) mimo(); }).catch(mimo);
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    sprava.textContent = ''; sprava.classList.add('chyba');
    if (meno.value.trim().length < 2) { sprava.textContent = 'Napíš meno a priezvisko.'; meno.focus(); return; }
    if (!/^\+?[\d\s/-]{9,20}$/.test(tel.value.trim())) { sprava.textContent = 'Napíš platné telefónne číslo.'; tel.focus(); return; }
    if (mail.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) { sprava.textContent = 'E‑mail nie je v správnom tvare.'; mail.focus(); return; }
    if (!chcem.checked) { sprava.textContent = 'Kartičku založíme len so súhlasom.'; chcem.focus(); return; }
    tl.disabled = true; sprava.classList.remove('chyba'); sprava.textContent = 'Zakladám kartičku…';
    try {
      const r = await fetch(`${API}?a=registracia`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prevadzka: P, meno: meno.value.trim(), telefon: tel.value.trim(), email: mail.value.trim(), suhlas_karta: true, suhlas_spravy: spravy.checked, web: pasca.value }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.chyba || 'Kartičku sa nepodarilo založiť.');
      if (j.karta) {
        try { localStorage.setItem('v30.karta.' + P, j.karta); } catch (x) { /* súkromné okno */ }
        location.replace(j.karta.replace(/^.*\?/, './?'));
        return;
      }
      box.replaceChildren(el('h2', { id: 'zaloz-h' }, 'Kartičku už máš'),
        el('p', { class: 'pozn' }, 'Ak je pri nej e‑mail, poslali sme naň odkaz. Inak ti ju ukážeme na recepcii.'));
    } catch (err) { sprava.classList.add('chyba'); sprava.textContent = err.message || 'Kartičku sa nepodarilo založiť.'; tl.disabled = false; }
  });
  box.append(f);
  return box;
}

/* ---------- kartička ---------- */
function vykresli(d, zPamate) {
  document.documentElement.dataset.p = d.prevadzka;
  document.title = `${d.nazov} – vernostná kartička`;
  document.querySelector('meta[name="theme-color"]').content = d.prevadzka === 'headspa' ? '#0c0906' : '#0e0d0c';
  document.querySelector('link[rel="icon"]').href = `ikony/${d.prevadzka}-192.png`;
  nastavPlochu(d);

  const odmeny = d.odmeny || [];
  const dalsia = odmeny.find((o) => o.body > d.body);
  const mozes = odmeny.filter((o) => o.body <= d.body);
  const cislo = el('b', {}, '0');

  const karta = el('div', { class: 'karta', role: 'group', 'aria-label': `Vernostná kartička ${d.nazov}` },
    el('div', { class: 'karta-hore' }, el('strong', {}, d.nazov), el('span', {}, 'Vernostná kartička')),
    el('div', { class: 'body-cislo' }, cislo, el('span', {}, bodov(d.body))),
    el('div', { class: 'karta-dole' }, el('span', { class: 'meno' }, d.meno), el('span', { class: 'od' }, `od ${datum(d.od)}`)),
  );

  let dalsiaEl = null;
  if (dalsia) {
    const pas = el('i');
    const chyba = dalsia.body - d.body;
    dalsiaEl = el('div', { class: 'dalsia' },
      el('p', {}, `Do odmeny „${dalsia.nazov}“ ti chýba ${chyba} ${bodov(chyba)}.`),
      el('div', { class: 'pas', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(dalsia.body), 'aria-valuenow': String(d.body), 'aria-label': 'Postup k ďalšej odmene' }, pas));
    requestAnimationFrame(() => requestAnimationFrame(() => { pas.style.width = `${Math.max(4, Math.min(100, (d.body / dalsia.body) * 100))}%`; }));
  } else if (mozes.length) {
    dalsiaEl = el('div', { class: 'dalsia' }, el('p', {}, 'Máš dosť bodov na odmenu. Povedz o ňu na recepcii.'));
  }

  const qr = el('div', { class: 'qr' }, el('div', { class: 'qr-obr', role: 'img', 'aria-label': `QR kód pre recepciu, kód ${pekneKod(d.kod)}` }),
    el('p', {}, el('strong', {}, 'Ukáž na recepcii'), 'Po návšteve ti body pripíšeme. Stačí aj povedať meno.', el('span', { class: 'kod' }, `Kód ${pekneKod(d.kod)}`)));
  qr.firstChild.innerHTML = qrSvg('V30:' + d.kod, '#111', '#fff');   // len kód pre recepciu; odkaz na kartičku (prístup) v QR nie je

  const tlacidla = el('div', { class: 'tlacidla' });
  const plocha = el('button', { class: 'tl', type: 'button', hidden: true }, 'Pridať na plochu');
  tlacidla.append(plocha, el('a', { class: 'tl', href: `tel:${d.tel}` }, `Zavolať ${d.tel_text}`));
  nastavTlacidloPlocha(plocha);

  const casti = [
    zPamate ? el('p', { class: 'offline' }, 'Si offline, zobrazujem poslednú uloženú verziu kartičky.') : null,
    el('div', { class: 'hlava' }, el('a', { class: 'znacka', href: d.web, rel: 'noopener' }, d.nazov), el('small', {}, 'Vernostná kartička')),
    el('h1', { class: 'skryte' }, `Vernostná kartička ${d.nazov}`),
    karta, dalsiaEl, qr, tlacidla,
    el('section', { 'aria-labelledby': 'h-odmeny' }, el('h2', { id: 'h-odmeny' }, 'Odmeny za body'),
      odmeny.length ? el('ul', { class: 'zoznam' }, odmeny.map((o) => el('li', { class: o.body <= d.body ? 'mozes' : null },
        el('span', { class: 'nazov' }, o.nazov), o.popis ? el('span', { class: 'popis' }, o.popis) : null,
        o.body <= d.body ? el('span', { class: 'stitok' }, 'Môžeš uplatniť') : null,
        el('span', { class: 'cena' }, String(o.body), el('small', {}, bodov(o.body))))))
        : el('p', { class: 'prazdne' }, 'Odmeny práve pripravujeme. Body ti zatiaľ pekne pribúdajú.')),
    d.akcie && d.akcie.length ? el('section', { 'aria-labelledby': 'h-akcie' }, el('h2', { id: 'h-akcie' }, 'Akcie'),
      el('ul', { class: 'zoznam' }, d.akcie.map((a) => el('li', {}, el('span', { class: 'nazov' }, a.nazov), a.popis ? el('span', { class: 'popis' }, a.popis) : null,
        a.do ? el('span', { class: 'datum' }, `Platí do ${datum(a.do)}`) : null)))) : null,
    d.novinky && d.novinky.length ? el('section', { 'aria-labelledby': 'h-novinky' }, el('h2', { id: 'h-novinky' }, 'Správy'),
      el('ul', { class: 'zoznam' }, d.novinky.map((n) => el('li', {}, el('span', { class: 'nazov' }, n.nadpis), el('span', { class: 'popis' }, n.text), el('span', { class: 'datum' }, datum(n.cas)))))) : null,
    el('section', { 'aria-labelledby': 'h-ako' }, el('h2', { id: 'h-ako' }, 'Ako to funguje'),
      el('p', { class: 'ako' }, 'Za každú návštevu dostaneš ', el('b', {}, `${d.body_za_navstevu} ${bodov(d.body_za_navstevu)}`),
        '. Body ti pripíše recepcia. Keď ich nazbieraš dosť, vymeníš ich za odmenu zo zoznamu, napríklad zľavu alebo produkt.')),
    el('section', {},
      el('details', {}, el('summary', {}, 'História bodov'), d.historia && d.historia.length
        ? el('ul', { class: 'historia' }, d.historia.map((h) => el('li', {}, el('span', {}, h.popis, ' ', el('span', { class: 'datum' }, datum(h.cas))),
          el('span', { class: h.body > 0 ? 'plus' : null }, `${h.body > 0 ? '+' : ''}${h.body}`))))
        : el('p', { class: 'pozn' }, 'Zatiaľ tu nič nie je. Prvé body pribudnú po návšteve.')),
      zPamate ? null : nastaveniaSprav(d),
      zPamate ? null : zrusenie(d)),
    el('div', { class: 'pata' },
      el('span', {}, d.nazov, ' · ', el('a', { href: `tel:${d.tel}` }, d.tel_text)),
      el('span', {}, el('a', { href: d.web, rel: 'noopener' }, 'Webová stránka'), ' · ', el('a', { href: '../ochrana-udajov.html' }, 'Ochrana osobných údajov'))),
  ];
  $obsah.replaceChildren(...casti.filter(Boolean));
  $obsah.setAttribute('aria-busy', 'false');
  napocitaj(cislo, d.body);
}

function napocitaj(e, ciel) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || ciel < 2) { e.textContent = String(ciel); return; }
  const t0 = performance.now(), trvanie = 900;
  const krok = (t) => { const p = Math.min(1, (t - t0) / trvanie); e.textContent = String(Math.round(ciel * (1 - (1 - p) ** 3))); if (p < 1) requestAnimationFrame(krok); };
  requestAnimationFrame(krok);
}

/* ---------- správy o akciách a upozornenia v telefóne ----------
   Prehliadač má pre rozsah karta/ jeden odber; server ho priradí ku každej kartičke zvlášť (odber, odber_zrus).
   Vypnutie na jednej kartičke preto odber prehliadača nezruší, inak by stíchla aj druhá kartička v tom istom telefóne. */
const vieUpozornenia = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const iPhoneBezPlochy = () => /iP(hone|ad|od)/.test(navigator.userAgent) && !navigator.standalone;
const kluc = (b64) => { const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, (c) => c.charCodeAt(0)); };
async function odberPrehliadaca() {
  if (!vieUpozornenia()) return null;
  const reg = await navigator.serviceWorker.getRegistration('./');
  return reg ? reg.pushManager.getSubscription() : null;
}

function nastaveniaSprav(d) {
  const sprava = el('p', { class: 'pozn', role: 'status' });
  const suhlas = el('input', { type: 'checkbox', checked: d.suhlas_spravy });
  const push = el('button', { class: 'tl', type: 'button', hidden: true });
  const obnovPush = async () => {
    if (!suhlas.checked || !(vieUpozornenia() || iPhoneBezPlochy())) { push.hidden = true; return; }
    const sub = await odberPrehliadaca().catch(() => null);
    const aktivny = sub ? (await api('odber_stav', { endpoint: sub.endpoint }).catch(() => ({ aktivny: false }))).aktivny : false;
    push.hidden = false;
    push.textContent = aktivny ? 'Vypnúť upozornenia v telefóne' : 'Zapnúť upozornenia v telefóne';
    push.dataset.zapnute = aktivny ? '1' : '';
  };
  suhlas.addEventListener('change', async () => {
    suhlas.disabled = true; sprava.textContent = '';
    try {
      await api('karta_spravy', { suhlas: suhlas.checked });     // server pri odvolaní zmaže aj odbery tejto kartičky
      sprava.textContent = suhlas.checked ? 'Hotovo, o akciách ti dáme vedieť.' : 'Hotovo, správy o akciách ti už posielať nebudeme.';
    } catch (e) { suhlas.checked = !suhlas.checked; sprava.textContent = e.message; }
    suhlas.disabled = false; obnovPush().catch(() => {});
  });
  push.addEventListener('click', async () => {
    push.disabled = true; sprava.textContent = '';
    try {
      if (push.dataset.zapnute) { const sub = await odberPrehliadaca(); if (sub) await api('odber_zrus', { endpoint: sub.endpoint }); sprava.textContent = 'Upozornenia pre túto kartičku sú vypnuté.'; }
      else if (!vieUpozornenia()) sprava.textContent = 'Na iPhone najprv pridaj kartičku na plochu (Zdieľať → Pridať na plochu) a otvor ju odtiaľ.';
      else {
        if ((await Notification.requestPermission()) !== 'granted') throw new Error('Upozornenia sú v prehliadači zakázané. Povolíš ich v nastaveniach stránky.');
        const reg = await navigator.serviceWorker.register('sw.js', { scope: './' });
        await navigator.serviceWorker.ready;
        const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: kluc(d.vapid) }));
        await api('odber', { endpoint: sub.endpoint });
        sprava.textContent = 'Upozornenia sú zapnuté. Nová akcia sa ti zobrazí v telefóne.';
      }
    } catch (e) { sprava.textContent = e.message || 'Upozornenia sa nepodarilo zapnúť.'; }
    push.disabled = false; obnovPush().catch(() => {});
  });
  obnovPush().catch(() => {});
  return el('details', {}, el('summary', {}, 'Správy o akciách'),
    el('label', { class: 'prepinac' }, suhlas, el('span', {}, 'Chcem dostávať správy o akciách a novinkách. Súhlas môžem kedykoľvek odvolať.')),
    el('div', { class: 'tlacidla' }, push), sprava);
}

/* odkazy na túto kartičku uložené v prehliadači (aj prihláškou webu HEAD SPA 30 na tej istej doméne) */
function zabudni(prevadzka) {
  pamat.zmaz('v30.k.' + k);
  pamat.uloz('v30.karty', (pamat.daj('v30.karty') || []).filter((x) => x && x.k !== k));
  for (const p of [prevadzka, 'barbershop', 'headspa']) { try { if ((localStorage.getItem('v30.karta.' + p) || '').endsWith('?k=' + k)) localStorage.removeItem('v30.karta.' + p); } catch (e) { /* nič */ } }
}

function zrusenie(d) {
  const sprava = el('p', { class: 'pozn chyba', role: 'status' });
  const tl = el('button', { class: 'tl', type: 'button' }, 'Zrušiť kartičku a vymazať údaje');
  tl.addEventListener('click', async () => {
    if (!confirm(`Naozaj zrušiť kartičku ${d.nazov}? Body (${d.body}) prepadnú a údaje vymažeme. Toto sa nedá vrátiť.`)) return;
    tl.disabled = true;
    try {
      await api('karta_zrus', { potvrdenie: 'ZRUSIT' });          // server zmaže kartičku aj s odbermi
      zabudni(d.prevadzka);
      bezKarty('Kartička je zrušená a údaje sú vymazané.');
    } catch (e) { sprava.textContent = e.message; tl.disabled = false; }
  });
  return el('details', {}, el('summary', {}, 'Moje údaje'),
    el('p', { class: 'pozn' }, `Kartička je na meno ${d.meno}. Zmenu mena, telefónu či e‑mailu urobíme na recepcii.`),
    el('div', { class: 'tlacidla' }, tl), sprava);
}

/* ---------- pridať na plochu ---------- */
let instalacia = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); instalacia = e; document.querySelectorAll('[data-plocha]').forEach((b) => { b.hidden = false; }); });
function nastavTlacidloPlocha(b) {
  b.dataset.plocha = '';
  const iphone = /iP(hone|ad|od)/.test(navigator.userAgent) && !navigator.standalone;
  b.hidden = !(instalacia || iphone);
  b.addEventListener('click', async () => {
    if (instalacia) { instalacia.prompt(); await instalacia.userChoice.catch(() => {}); instalacia = null; b.hidden = true; return; }
    alert('V Safari ťukni na Zdieľať a vyber „Pridať na plochu“. Kartička bude mať vlastnú ikonu.');
  });
}
function nastavPlochu(d) {
  const link = (rel, href) => { let l = document.querySelector(`link[rel="${rel}"]`); if (!l) { l = el('link', { rel }); document.head.append(l); } l.href = href; };
  link('manifest', D.manifest || `${API}?a=manifest&k=${encodeURIComponent(k)}`);
  link('apple-touch-icon', `ikony/${d.prevadzka}-180.png`);
  let m = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (!m) { m = el('meta', { name: 'apple-mobile-web-app-title' }); document.head.append(m); }
  m.content = d.nazov;
}

/* ---------- štart ---------- */
async function start() {
  if (!/^[A-Za-z0-9_-]{22}$/.test(k)) { bezKarty(); return; }
  const ulozena = pamat.daj('v30.k.' + k);
  if (ulozena) vykresli(ulozena, false);
  try {
    const d = await api('karta');
    pamat.uloz('v30.k.' + k, d);
    pamat.uloz('v30.karty', [{ k, nazov: d.nazov }, ...(pamat.daj('v30.karty') || []).filter((x) => x && x.k !== k)].slice(0, 6));
    if (!ulozena || JSON.stringify(ulozena) !== JSON.stringify(d)) vykresli(d, false);
  } catch (e) {
    if (e.kod === 404) { zabudni(ulozena && ulozena.prevadzka); bezKarty('Táto kartička neexistuje'); return; }
    if (ulozena) vykresli(ulozena, true); else bezKarty('Kartičku sa nepodarilo načítať. Skús to o chvíľu.');
  }
  // worker potrebuje adresu API (upozornenia), keď nie je vedľa kartičky
  const sw = API === '../api/' ? 'sw.js' : 'sw.js?api=' + encodeURIComponent(new URL(API, location.href).href);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register(sw, { scope: './' }).catch(() => {});
}
start();
