/* Vernostná kartička 30 – správa. Prihlásenie heslom prevádzky (relácia na serveri), potom klienti, návštevy,
   body, odmeny, akcie, hromadné správy a nastavenia. Texty z databázy idú do stránky len cez textContent. */
import { qrSvg } from '../karta/qr.js';

const API = '../api/';
const $app = document.getElementById('app');
const $dlg = document.getElementById('dialog');
let ja = null, zalozka = 'klienti', odmenyCache = [];

function el(tag, attrs = {}, ...deti) {
  const e = document.createElement(tag);
  for (const [a, h] of Object.entries(attrs)) {
    if (h === null || h === undefined || h === false) continue;
    if (a === 'class') e.className = h; else if (a.startsWith('on')) e.addEventListener(a.slice(2), h);
    else if (a === 'value') e.value = h; else e.setAttribute(a, h === true ? '' : h);
  }
  for (const d of deti.flat()) if (d !== null && d !== undefined && d !== false) e.append(d instanceof Node ? d : String(d));
  return e;
}
const bodov = (n) => { const a = Math.abs(n); return a === 1 ? 'bod' : a >= 2 && a <= 4 ? 'body' : 'bodov'; };
const datum = (s) => { if (!s) return ''; const d = new Date(s); return isNaN(d) ? String(s) : d.toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
const denCas = (s) => { const d = new Date(s); return isNaN(d) ? '' : d.toLocaleDateString('sk-SK', { timeZone: 'Europe/Bratislava' }); };
const den = (s) => { const [r, m, d] = String(s || '').split('-').map(Number); return r ? `${d}. ${m}. ${r}` : ''; };
const hlaska = (text, ok = true) => el('p', { class: `hlaska ${ok ? 'ok' : 'zle'}`, role: ok ? 'status' : 'alert' }, text);

async function api(akcia, telo, params = '') {
  const r = await fetch(`${API}?a=${akcia}${params}`, {
    method: telo ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
    headers: { 'X-Vernost-Admin': '1', ...(telo ? { 'Content-Type': 'application/json' } : {}) }, body: telo ? JSON.stringify(telo) : undefined,
  });
  if (akcia === 'export' && r.ok) return r.blob();
  const j = await r.json().catch(() => ({ ok: false, chyba: 'Server neodpovedá.' }));
  if (r.status === 401 && akcia !== 'prihlasenie') { ja = null; prihlasenie('Prihlásenie vypršalo, prihlás sa znova.'); throw new Error('Prihlás sa, prosím.'); }
  if (!r.ok || !j.ok) throw Object.assign(new Error(j.chyba || 'Niečo sa nepodarilo.'), { kod: r.status });
  return j;
}
/* tlačidlo počas požiadavky zablokované, chyba sa ukáže v cieli */
async function akcia(tl, ciel, f) {
  tl.disabled = true;
  try { await f(); } catch (e) { if (ciel) ciel.replaceChildren(hlaska(e.message, false)); }
  tl.disabled = false;
}

/* ---------------- prihlásenie ---------------- */
function prihlasenie(sprava) {
  document.documentElement.dataset.p = '';
  const vyber = el('select', { id: 'p', required: true }, Object.entries(ja?.prevadzky || { barbershop: 'Barbershop 30', headspa: 'HEAD SPA 30' }).map(([k, n]) => el('option', { value: k }, n)));
  try { const p = localStorage.getItem('v30.admin.p'); if (p) vyber.value = p; } catch (e) { /* nič */ }
  const heslo = el('input', { type: 'password', id: 'h', autocomplete: 'current-password', required: true });
  const out = el('div', {}, sprava ? hlaska(sprava, false) : null);
  const tl = el('button', { class: 'tl hlavne', type: 'submit' }, 'Prihlásiť');
  const form = el('form', { class: 'panel prihlasenie', novalidate: true },
    el('h1', {}, 'Vernostná kartička'), el('p', { class: 'pozn' }, 'Správa kartičiek pre recepciu.'), out,
    el('label', { class: 'pole', for: 'p' }, 'Prevádzka', vyber), el('label', { class: 'pole', for: 'h' }, 'Heslo', heslo), tl);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    akcia(tl, out, async () => {
      await api('prihlasenie', { prevadzka: vyber.value, heslo: heslo.value });
      try { localStorage.setItem('v30.admin.p', vyber.value); } catch (er) { /* nič */ }
      heslo.value = '';
      await nacitajJa(); kresli();
    });
  });
  $app.replaceChildren(form);
  heslo.focus();
}
async function nacitajJa() { ja = await api('ja'); }

/* ---------------- kostra ---------------- */
const ZALOZKY = { klienti: 'Klienti', odmeny: 'Odmeny', akcie: 'Akcie', spravy: 'Správy', nastavenia: 'Nastavenia' };
function kresli(obsah) {
  document.documentElement.dataset.p = ja.prevadzka;
  document.title = `${ja.nazov} – vernostné kartičky`;
  const nav = el('nav', { 'aria-label': 'Sekcie' }, Object.entries(ZALOZKY).map(([k, n]) =>
    el('button', { class: 'tl', type: 'button', 'aria-current': k === zalozka ? 'page' : null, onclick: () => { zalozka = k; kresli(); } }, n)));
  const odhlas = el('button', { class: 'tl', type: 'button' }, 'Odhlásiť');
  odhlas.addEventListener('click', () => akcia(odhlas, null, async () => { await api('odhlasenie', {}); ja = null; await nacitajJa(); prihlasenie(); }));
  const telo = el('div');
  $app.replaceChildren(el('div', { class: 'lista' }, el('strong', {}, `${ja.nazov} · vernostné kartičky`), odhlas), nav, telo);
  ({ klienti, odmeny, akcie, spravy, nastavenia })[zalozka](telo, obsah);
}

/* ---------------- klienti ---------------- */
let hladane = '';
async function klienti(telo) {
  const hladaj = el('input', { type: 'search', placeholder: 'Meno, telefón, e‑mail alebo kód z kartičky', 'aria-label': 'Hľadať klienta', value: hladane, autocomplete: 'off' });
  const vysledky = el('div', { class: 'panel' }, el('p', { class: 'pozn' }, 'Načítavam…'));
  const stat = el('p', { class: 'statistika' });
  const novy = el('button', { class: 'tl hlavne', type: 'button', onclick: () => novyKlient(telo) }, '+ Nový klient');
  const sken = 'BarcodeDetector' in window ? el('button', { class: 'tl', type: 'button', onclick: () => skenuj((t) => { hladaj.value = t; hladane = t; nacitaj(); }) }, 'Skenovať QR') : null;
  telo.replaceChildren(el('div', { class: 'panel' }, el('div', { class: 'rad' }, hladaj, sken, novy), stat), vysledky);
  let casovac = 0, poradie = 0;
  async function nacitaj() {
    const moje = ++poradie;
    try {
      const d = await api('klienti', null, `&q=${encodeURIComponent(hladane)}`);
      if (moje !== poradie) return;
      stat.replaceChildren('Kartičiek: ', el('b', {}, String(d.spolu.karty)), ' · so súhlasom so správami: ', el('b', {}, String(d.spolu.so_suhlasom)), ' · s upozornením v telefóne: ', el('b', {}, String(d.spolu.s_upozornenim)));
      if (d.klienti.length === 1 && /k=|^[A-Za-z0-9_-]{22}$|^V30:|^[A-HJKMNP-Z2-9]{4}[ -]?[A-HJKMNP-Z2-9]{4}$/i.test(hladane)) { hladane = ''; detail(telo, d.klienti[0].id); return; }
      vysledky.replaceChildren(d.klienti.length ? el('ul', { class: 'zoznam' }, d.klienti.map((k) => el('li', {},
        el('button', { class: 'riadok', type: 'button', onclick: () => detail(telo, k.id) },
          el('span', { class: 'meno' }, k.meno), el('span', { class: 'info' }, [k.telefon, k.email].filter(Boolean).join(' · ')),
          el('span', { class: 'body' }, `${k.body} ${bodov(k.body)}`)))))
        : el('p', { class: 'pozn' }, hladane ? 'Nikoho sme nenašli. Skús iné meno alebo číslo, prípadne založ nového klienta.' : 'Zatiaľ tu nie je žiadna kartička.'));
    } catch (e) { vysledky.replaceChildren(hlaska(e.message, false)); }
  }
  hladaj.addEventListener('input', () => { hladane = hladaj.value.trim(); clearTimeout(casovac); casovac = setTimeout(nacitaj, 250); });
  nacitaj();
  if (matchMedia('(pointer: fine)').matches) hladaj.focus();
}

function novyKlient(telo) {
  const out = el('div');
  const meno = el('input', { type: 'text', id: 'n-meno', autocomplete: 'off', required: true, maxlength: '80' });
  const tel = el('input', { type: 'tel', id: 'n-tel', autocomplete: 'off', required: true, placeholder: '09xx xxx xxx' });
  const mail = el('input', { type: 'email', id: 'n-mail', autocomplete: 'off', placeholder: 'nepovinné, pošleme naň odkaz na kartičku' });
  const suhlas = el('input', { type: 'checkbox' }), spravy = el('input', { type: 'checkbox' });
  const tl = el('button', { class: 'tl hlavne', type: 'submit' }, 'Založiť kartičku');
  const form = el('form', { class: 'panel', novalidate: true }, el('h2', {}, 'Nový klient'), out,
    el('div', { class: 'mriezka' }, el('label', { class: 'pole', for: 'n-meno' }, 'Meno a priezvisko', meno), el('label', { class: 'pole', for: 'n-tel' }, 'Telefón', tel)),
    el('label', { class: 'pole', for: 'n-mail' }, 'E‑mail', mail),
    el('label', { class: 'volba' }, suhlas, el('span', {}, 'Klient chce vernostnú kartičku (súhlas so spracovaním mena, telefónu a e‑mailu na kartičku).')),
    el('label', { class: 'volba' }, spravy, el('span', {}, 'Klient chce dostávať správy o akciách (len ak to sám povedal).')),
    el('div', { class: 'rad' }, tl, el('button', { class: 'tl', type: 'button', onclick: () => kresli() }, 'Späť')));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!suhlas.checked) { out.replaceChildren(hlaska('Kartičku založíme len so súhlasom klienta.', false)); return; }
    akcia(tl, out, async () => {
      const d = await api('klient_novy', { meno: meno.value, telefon: tel.value, email: mail.value, suhlas_karta: true, suhlas_spravy: spravy.checked });
      detail(telo, d.id, 'Kartička je založená. Klient si ju otvorí naskenovaním QR kódu.', true);
    });
  });
  telo.replaceChildren(form);
  meno.focus();
}

async function detail(telo, id, sprava, ukazQr) {
  telo.replaceChildren(el('p', { class: 'pozn' }, 'Načítavam…'));
  let d;
  // odmeny vždy čerstvé (cenu mohol práve zmeniť majiteľ na inom zariadení)
  try { [d] = await Promise.all([api('klient', null, `&id=${id}`), nacitajOdmeny()]); } catch (e) { telo.replaceChildren(hlaska(e.message, false)); return; }
  const k = d.klient, out = el('div', {}, sprava ? hlaska(sprava) : null);
  const znova = (s) => detail(telo, id, s);

  const navsteva = el('button', { class: 'tl hlavne', type: 'button' }, 'Zapísať návštevu');
  navsteva.addEventListener('click', () => akcia(navsteva, out, async () => {
    try { const r = await api('navsteva', { id }); znova(`Návšteva zapísaná, +${r.pripisane} ${bodov(r.pripisane)}. Spolu ${r.body}.`); }
    catch (e) {
      if (e.kod !== 409 || !confirm(`${e.message} Zapísať ešte jednu?`)) throw e;
      const r = await api('navsteva', { id, aj_tak: true }); znova(`Návšteva zapísaná, +${r.pripisane} ${bodov(r.pripisane)}. Spolu ${r.body}.`);
    }
  }));

  const aktivne = odmenyCache.filter((o) => o.aktivna);
  const vyberOdmeny = el('select', { 'aria-label': 'Odmena' }, aktivne.length ? aktivne.map((o) => el('option', { value: String(o.id) }, `${o.nazov} – ${o.body} ${bodov(o.body)}${o.body > k.body ? ` (chýba ${o.body - k.body})` : ''}`)) : el('option', { value: '' }, 'Žiadne odmeny (pridaj ich v časti Odmeny)'));
  const prva = aktivne.find((o) => o.body <= k.body); if (prva) vyberOdmeny.value = String(prva.id);
  const uplatni = el('button', { class: 'tl', type: 'button' }, 'Uplatniť odmenu');
  const stavUplatni = () => { const o = aktivne.find((x) => String(x.id) === vyberOdmeny.value); uplatni.disabled = !o || o.body > k.body; };
  vyberOdmeny.addEventListener('change', stavUplatni); stavUplatni();
  uplatni.addEventListener('click', () => {
    const o = aktivne.find((x) => String(x.id) === vyberOdmeny.value);
    if (!o || !confirm(`Uplatniť „${o.nazov}“ za ${o.body} ${bodov(o.body)}?`)) return;
    akcia(uplatni, out, async () => { const r = await api('uplatnit', { id, odmena_id: o.id, body: o.body }); znova(`Odmena „${o.nazov}“ uplatnená. Zostáva ${r.body} ${bodov(r.body)}.`); });
  });

  const pocet = el('input', { type: 'number', step: '1', min: '-1000', max: '1000', placeholder: 'napr. 2 alebo -1', 'aria-label': 'Počet bodov' });
  const dovod = el('input', { type: 'text', maxlength: '120', placeholder: 'Dôvod, napr. kúpa pudru', 'aria-label': 'Dôvod' });
  const pripis = el('button', { class: 'tl', type: 'button' }, 'Upraviť body');
  pripis.addEventListener('click', () => akcia(pripis, out, async () => {
    const r = await api('body', { id, body: Number(pocet.value), popis: dovod.value }); znova(`Hotovo, klient má ${r.body} ${bodov(r.body)}.`);
  }));

  const qrBox = el('div', { hidden: !ukazQr }, el('div', { class: 'qr', role: 'img', 'aria-label': 'QR kód kartičky klienta' }),
    el('p', { class: 'pozn' }, 'Klient si QR kód naskenuje fotoaparátom a kartička sa mu otvorí. Odkaz: ', el('a', { href: k.karta, target: '_blank', rel: 'noopener noreferrer' }, 'otvoriť kartičku')));
  qrBox.firstChild.innerHTML = qrSvg(k.karta);
  const kopiruj = el('button', { class: 'tl', type: 'button' }, 'Kopírovať odkaz');
  kopiruj.addEventListener('click', async () => { try { await navigator.clipboard.writeText(k.karta); kopiruj.textContent = 'Skopírované'; } catch (e) { prompt('Odkaz na kartičku:', k.karta); } });

  telo.replaceChildren(
    el('div', { class: 'rad' }, el('button', { class: 'tl', type: 'button', onclick: () => kresli() }, '← Klienti')), el('br'),
    out,
    el('div', { class: 'panel' },
      el('h2', {}, k.meno), el('p', { class: 'velke' }, `${k.body} `, el('small', {}, bodov(k.body))),
      el('p', { class: 'statistika' }, el('span', {}, 'Kód ', el('b', {}, String(k.kod).replace(/^(.{4})/, '$1 '))), el('span', {}, k.telefon), k.email ? el('span', {}, k.email) : null,
        el('span', {}, 'Kartička od ', denCas(k.vytvorena)), k.posledna_navsteva ? el('span', {}, 'Posledná návšteva ', datum(k.posledna_navsteva)) : null,
        el('span', {}, k.suhlas_spravy ? 'Správy o akciách: áno' : 'Správy o akciách: nie'), el('span', {}, k.zdroj === 'web' ? 'Založená na webe' : 'Založená na recepcii')),
      el('div', { class: 'rad' }, navsteva)),
    el('div', { class: 'panel' }, el('h3', {}, 'Odmena za body'), el('div', { class: 'rad' }, vyberOdmeny, uplatni)),
    el('div', { class: 'panel' }, el('h3', {}, 'Pripísať alebo odpísať body'), el('p', { class: 'pozn' }, 'Napríklad za kúpu produktu alebo opravu. Záporné číslo body odpíše.'),
      el('div', { class: 'mriezka' }, pocet, dovod), el('br'), pripis),
    el('div', { class: 'panel' }, el('h3', {}, 'Kartička klienta'), el('div', { class: 'rad' },
      el('button', { class: 'tl', type: 'button', onclick: () => { qrBox.hidden = !qrBox.hidden; } }, 'Ukázať QR kód'), kopiruj), el('br'), qrBox),
    upravy(k, out, znova, telo),
    el('div', { class: 'panel' }, el('h3', {}, 'História'), d.historia.length ? el('ul', { class: 'historia' }, d.historia.map((h) => el('li', {},
      el('span', {}, h.popis, ' ', el('span', { class: 'datum' }, datum(h.cas))), el('b', {}, h.body ? `${h.body > 0 ? '+' : ''}${h.body}` : '')))) : el('p', { class: 'pozn' }, 'Bez pohybov.')),
  );
  out.scrollIntoView({ block: 'nearest' });
}

function upravy(k, out, znova, telo) {
  const meno = el('input', { type: 'text', value: k.meno, maxlength: '80', 'aria-label': 'Meno' });
  const tel = el('input', { type: 'tel', value: k.telefon, 'aria-label': 'Telefón' });
  const mail = el('input', { type: 'email', value: k.email, 'aria-label': 'E‑mail' });
  const odvolat = el('input', { type: 'checkbox' });
  const uloz = el('button', { class: 'tl', type: 'button' }, 'Uložiť údaje');
  uloz.addEventListener('click', () => akcia(uloz, out, async () => {
    await api('klient_uprav', { id: k.id, meno: meno.value, telefon: tel.value, email: mail.value, odvolat_spravy: odvolat.checked }); znova('Údaje sú uložené.');
  }));
  const zmaz = el('button', { class: 'tl zle', type: 'button' }, 'Zmazať kartičku');
  zmaz.addEventListener('click', () => {
    if (!confirm(`Naozaj zmazať kartičku klienta ${k.meno}? Body aj história sa vymažú natrvalo.`)) return;
    akcia(zmaz, out, async () => { await api('klient_zmaz', { id: k.id }); hladane = ''; kresli(); });
  });
  return el('details', { class: 'panel' }, el('summary', {}, el('b', {}, 'Upraviť údaje alebo zmazať')), el('br'),
    el('div', { class: 'mriezka' }, el('label', { class: 'pole' }, 'Meno', meno), el('label', { class: 'pole' }, 'Telefón', tel), el('label', { class: 'pole' }, 'E‑mail', mail)),
    k.suhlas_spravy ? el('label', { class: 'volba' }, odvolat, el('span', {}, 'Klient odvolal súhlas so správami o akciách')) : null,
    el('div', { class: 'rad' }, uloz, zmaz));
}

/* QR skener (Chrome na Androide a počítači; na iPhone sa hľadá menom alebo telefónom) */
async function skenuj(hotovo) {
  let stream, bezi = true;
  const video = el('video', { playsinline: true, muted: true, autoplay: true });
  const info = el('p', { class: 'pozn' }, 'Namier fotoaparát na QR kód na kartičke klienta.');
  const zavri = () => { bezi = false; stream?.getTracks().forEach((t) => t.stop()); if ($dlg.open) $dlg.close(); };
  $dlg.replaceChildren(el('h2', {}, 'Skenovať kartičku'), video, info, el('button', { class: 'tl', type: 'button', onclick: zavri }, 'Zavrieť'));
  $dlg.addEventListener('close', zavri, { once: true });
  $dlg.showModal();
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream; await video.play();
    const det = new BarcodeDetector({ formats: ['qr_code'] });
    while (bezi) {
      const kody = await det.detect(video).catch(() => []);
      const t = kody.find((x) => /^V30:[A-Z0-9]{8}$|[?&]k=[A-Za-z0-9_-]{22}/.test(x.rawValue));
      if (t) { zavri(); hotovo(t.rawValue); return; }
      await new Promise((r) => setTimeout(r, 200));
    }
  } catch (e) { info.textContent = 'Fotoaparát sa nepodarilo zapnúť. Vyhľadaj klienta menom alebo telefónom.'; }
}

/* ---------------- odmeny a akcie ---------------- */
async function nacitajOdmeny() { odmenyCache = (await api('odmeny')).polozky.map((o) => ({ ...o, aktivna: !!Number(o.aktivna), body: Number(o.body) })); }

function zoznamPoloziek(telo, typ) {
  const odmena = typ === 'odmena';
  const out = el('div'), zoznam = el('div', { class: 'panel' }, el('p', { class: 'pozn' }, 'Načítavam…'));
  const formular = (p = {}) => {
    const nazov = el('input', { type: 'text', value: p.nazov || '', maxlength: odmena ? '80' : '100', placeholder: odmena ? 'napr. Puder na vlasy zdarma' : 'napr. Mesiac študentov' });
    const popis = el('textarea', { maxlength: odmena ? '300' : '600', placeholder: odmena ? 'napr. Vyber si puder z ponuky na recepcii.' : 'napr. Ostrihaj sa a styling máš za polovicu.' }); popis.value = p.popis || '';
    const body = odmena ? el('input', { type: 'number', min: '1', max: '10000', step: '1', value: p.body ? String(p.body) : '' }) : null;
    const od = odmena ? null : el('input', { type: 'date', value: p.od || '' }), dokedy = odmena ? null : el('input', { type: 'date', value: p.do || '' });
    const aktivna = el('input', { type: 'checkbox' }); aktivna.checked = p.id ? !!Number(p.aktivna) : true;
    const tl = el('button', { class: 'tl hlavne', type: 'submit' }, p.id ? 'Uložiť zmeny' : odmena ? 'Pridať odmenu' : 'Pridať akciu');
    const f = el('form', { class: 'panel', novalidate: true }, el('h2', {}, p.id ? `Upraviť: ${p.nazov}` : odmena ? 'Nová odmena' : 'Nová akcia'),
      el('label', { class: 'pole' }, 'Názov', nazov), el('label', { class: 'pole' }, 'Popis (uvidí ho klient na kartičke)', popis),
      odmena ? el('label', { class: 'pole' }, 'Koľko bodov stojí', body)
        : el('div', { class: 'mriezka' }, el('label', { class: 'pole' }, 'Platí od (nepovinné)', od), el('label', { class: 'pole' }, 'Platí do (nepovinné)', dokedy)),
      el('label', { class: 'volba' }, aktivna, el('span', {}, odmena ? 'Odmena je aktívna (klienti ju vidia)' : 'Akcia je aktívna (klienti ju vidia v určenom čase)')),
      el('div', { class: 'rad' }, tl, p.id ? el('button', { class: 'tl', type: 'button', onclick: () => zoznamPoloziek(telo, typ) }, 'Zrušiť') : null));
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      akcia(tl, out, async () => {
        await api(odmena ? 'odmena_uloz' : 'akcia_uloz', { id: p.id || 0, nazov: nazov.value, popis: popis.value, aktivna: aktivna.checked,
          ...(odmena ? { body: Number(body.value) } : { od: od.value, do: dokedy.value }) });
        if (odmena) await nacitajOdmeny();
        zoznamPoloziek(telo, typ); telo.prepend(hlaska('Uložené.'));
      });
    });
    return f;
  };
  const pozn = odmena
    ? 'Odmeny, za ktoré klient vymení body: zľava, produkt (napr. puder) alebo služba. Body za návštevu nastavíš v Nastaveniach.'
    : 'Akcie vidí klient na kartičke. O novej akcii mu môžeš dať vedieť v časti Správy.';
  telo.replaceChildren(out, el('p', { class: 'pozn' }, pozn), formular(), zoznam);
  (async () => {
    try {
      const d = await api(odmena ? 'odmeny' : 'akcie');
      zoznam.replaceChildren(el('h2', {}, odmena ? 'Odmeny' : 'Akcie'), d.polozky.length ? el('div', {}, d.polozky.map((p) => {
        const uprav = el('button', { class: 'tl', type: 'button', onclick: () => { telo.replaceChildren(out, formular(p)); } }, 'Upraviť');
        const zmaz = el('button', { class: 'tl zle', type: 'button' }, 'Zmazať');
        zmaz.addEventListener('click', () => { if (confirm(`Zmazať „${p.nazov}“?`)) akcia(zmaz, out, async () => { await api('zmaz', { co: typ, id: p.id }); if (odmena) await nacitajOdmeny(); zoznamPoloziek(telo, typ); }); });
        return el('div', { class: `polozka${Number(p.aktivna) ? '' : ' neaktivna'}` },
          el('b', {}, p.nazov, odmena ? ` · ${p.body} ${bodov(Number(p.body))}` : ''), p.popis ? el('span', { class: 'pozn' }, p.popis) : null,
          el('span', { class: 'pozn' }, Number(p.aktivna) ? 'Aktívna' : 'Vypnutá', !odmena && (p.od || p.do) ? ` · ${p.od ? den(p.od) : '…'} – ${p.do ? den(p.do) : '…'}` : ''),
          el('div', { class: 'akcie' }, uprav, zmaz));
      })) : el('p', { class: 'pozn' }, odmena ? 'Zatiaľ žiadne odmeny.' : 'Zatiaľ žiadne akcie.'));
    } catch (e) { zoznam.replaceChildren(hlaska(e.message, false)); }
  })();
}
const odmeny = (telo) => zoznamPoloziek(telo, 'odmena');
const akcie = (telo) => zoznamPoloziek(telo, 'akcia');

/* ---------------- hromadné správy ---------------- */
async function spravy(telo) {
  const out = el('div');
  const nadpis = el('input', { type: 'text', maxlength: '60', placeholder: 'napr. Mesiac študentov' });
  const text = el('textarea', { maxlength: '500', placeholder: 'napr. Celý november ostrihaj sa a styling máš za polovicu. Rezervuj si termín.' });
  const email = el('input', { type: 'checkbox' });
  const kolko = el('p', { class: 'pozn' });
  const posli = el('button', { class: 'tl hlavne', type: 'submit' }, 'Poslať správu');
  const historia = el('div', { class: 'panel' });
  let nastav = { email: false }, spolu = null;
  try { [nastav, spolu] = await Promise.all([api('nastavenia'), api('klienti', null, '&q=').then((d) => d.spolu)]); } catch (e) { out.replaceChildren(hlaska(e.message, false)); }
  if (spolu) kolko.textContent = `Správu dostanú len klienti so súhlasom: ${spolu.so_suhlasom}. Upozornenie v telefóne má zapnuté ${spolu.s_upozornenim}, ostatní ju uvidia na kartičke${nastav.email ? ' alebo v e‑maile' : ''}.`;
  const f = el('form', { class: 'panel', novalidate: true }, el('h2', {}, 'Nová správa klientom'), kolko,
    el('label', { class: 'pole' }, 'Nadpis (do 60 znakov)', nadpis), el('label', { class: 'pole' }, 'Text (do 500 znakov)', text),
    nastav.email ? el('label', { class: 'volba' }, email, el('span', {}, 'Poslať aj e‑mailom (klientom so súhlasom, ktorí zadali e‑mail)')) : el('p', { class: 'pozn' }, 'E‑maily sú vypnuté (v konfigurácii chýba odosielateľ). Správa ide upozornením a na kartičku.'),
    posli);
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!confirm(`Poslať správu „${nadpis.value}“ všetkým klientom so súhlasom?`)) return;
    akcia(posli, out, async () => {
      const r = await api('sprava_posli', { nadpis: nadpis.value, text: text.value, aj_email: email.checked });
      nadpis.value = ''; text.value = '';
      out.replaceChildren(hlaska(`Odoslané. Upozornení v telefóne: ${r.push}${nastav.email ? `, e‑mailov: ${r.email}` : ''}. Správa je aj na kartičkách.`));
      nacitajHistoriu();
    });
  });
  async function nacitajHistoriu() {
    try {
      const d = await api('spravy');
      historia.replaceChildren(el('h2', {}, 'Odoslané správy'), d.polozky.length ? el('div', {}, d.polozky.map((s) => el('div', { class: 'polozka' },
        el('b', {}, s.nadpis), el('span', {}, s.text), el('span', { class: 'pozn' }, `${datum(s.cas)} · upozornení ${s.push || 0}, e‑mailov ${s.email || 0}`)))) : el('p', { class: 'pozn' }, 'Zatiaľ žiadne správy.'));
    } catch (e) { historia.replaceChildren(hlaska(e.message, false)); }
  }
  telo.replaceChildren(out, f, historia);
  nacitajHistoriu();
}

/* ---------------- nastavenia ---------------- */
async function nastavenia(telo) {
  const out = el('div');
  const body = el('input', { type: 'number', min: '0', max: '100', step: '1', id: 's-body' });
  const uloz = el('button', { class: 'tl hlavne', type: 'button' }, 'Uložiť');
  const exp = el('button', { class: 'tl', type: 'button' }, 'Stiahnuť zoznam klientov (CSV)');
  try { body.value = String((await api('nastavenia')).body_za_navstevu); } catch (e) { out.replaceChildren(hlaska(e.message, false)); }
  uloz.addEventListener('click', () => akcia(uloz, out, async () => { await api('nastavenia_uloz', { body_za_navstevu: Number(body.value) }); out.replaceChildren(hlaska('Uložené.')); }));
  exp.addEventListener('click', () => akcia(exp, out, async () => {
    const b = await api('export'); const u = URL.createObjectURL(b);
    const a = el('a', { href: u, download: `vernostne-karticky-${ja.prevadzka}.csv` }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000);
  }));
  telo.replaceChildren(out,
    el('div', { class: 'panel' }, el('h2', {}, 'Body za návštevu'), el('p', { class: 'pozn' }, 'Koľko bodov dostane klient, keď recepcia zapíše návštevu.'),
      el('div', { class: 'rad' }, body, uloz)),
    el('div', { class: 'panel' }, el('h2', {}, 'Údaje klientov'), el('p', { class: 'pozn' }, 'Súbor obsahuje osobné údaje. Ulož ho len na bezpečné miesto a po použití zmaž.'), exp),
    el('div', { class: 'panel' }, el('h2', {}, 'Ako to funguje'), el('ol', {},
      el('li', {}, 'Klient si pri rezervácii na webe zaškrtne „Áno, chcem vernostnú kartičku“, alebo ju založíš tu (Klienti → Nový klient).'),
      el('li', {}, 'Po návšteve ho nájdeš (meno, telefón alebo QR kód z jeho kartičky) a klikneš Zapísať návštevu.'),
      el('li', {}, 'Keď má dosť bodov, vyberieš odmenu a klikneš Uplatniť. Za kúpu produktu môžeš body pripísať ručne.'),
      el('li', {}, 'Akcie a odmeny vidí klient na kartičke. Správu o akcii pošleš v časti Správy.'))));
}

/* ---------------- štart ---------------- */
(async () => {
  try { await nacitajJa(); } catch (e) { $app.replaceChildren(hlaska('Server neodpovedá. Skús obnoviť stránku.', false)); return; }
  if (ja.prihlaseny) kresli(); else prihlasenie();
})();
