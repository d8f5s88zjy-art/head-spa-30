/*
 * STAVEBNINY RICHTÁRIK – okno asistenta na otázky (podľa okna Barbera z Barbershopu 30, bez kalendára a jazykov).
 * Návštevník napíše otázku alebo ťukne na častú otázku a hneď dostane odpoveď (sortiment, akcie, zľavy, doprava,
 * služby, hodiny, kontakt). Naostro odpovedá server asistenta (asistent/api.php) len z overených údajov webu
 * (asistent/znalosti/richtarik.md); kľúč je len na serveri. Okno je všade zreteľne označené ako automatický asistent:
 * štítok označenia pri ikone aj v názve okna, podnadpis, prvá správa a poznámka pod oknom s odkazom Ochrana údajov
 * (STYL.md §9, rovnako ako okno Barbera na Barbershope).
 *
 * spusti(api): ikona sa ukáže, až keď server povie, že je zapnutý (api.php?a=stav), inak sa nestane nič.
 * spusti('ukazka'): okno bez servera s vopred pripravenými odpoveďami z častých otázok (asistent-ukazka.js), na
 * kontrolu v náhľade; pás v okne a popis pri každej odpovedi hovoria, že odpovede sú pripravené vopred. Nič sa
 * neposiela. Rozhovor ostáva len v tejto karte prehliadača (sessionStorage). Odkazy, telefón a e-mail v odpovedi sa
 * dajú kliknúť (vytvárajú sa ako prvky, nikdy cez innerHTML). Odkazy na www.stavebninyrichtarik.sk vedú v náhľade
 * na tú istú stránku náhľadu.
 */
const html = document.documentElement;
const K_ROZHOVOR = 'sr.asistent';
const K_SKRYTY = 'sr.asistent.skryty';                // sessionStorage: návštevník asistenta skryl (do konca návštevy)
const K_OZNAM = 'sr.asistent.oznam';                  // localStorage: kedy zavrel bublinu (14 dní sa neukáže)
const K_OZNAM_RAZ = 'sr.asistent.oznam.raz';          // sessionStorage: bublina už v tejto návšteve bola
const UKAZKA = 'ukazka';
const MAX_SPRAV = 15;                                   // server berie najviac 16 správ (otázka, odpoveď, …, otázka)
const TEL = 'tel:+421905622223', TEL_TXT = '0905 622 223';
const DOPYT = 'mailto:info@stavebninyrichtarik.sk?subject=Cenov%C3%A1%20ponuka';
const DOMENA = 'https://www.stavebninyrichtarik.sk/';
const KOREN = new URL('../', import.meta.url).href;   // koreň webu (ostrý web aj náhľad v podpriečinku)
// úvod úvodnej stránky, nad ktorým sa ikona nezobrazí: sekcia s nadpisom #h-uvod (starý .hero aj nový úvod .uv),
// trieda .hero alebo atribút data-bez-asistenta (ručne v index.html, voliteľný pre ďalšie plochy)
const UVOD = '[data-bez-asistenta], .hero, section[aria-labelledby="h-uvod"]';

// štítok označenia (T.ai) stojí v názve okna pred slovom „asistent“: názov sa číta „AI asistent Stavebnín Richtárik“
const T = {
  ai: 'AI', meno: 'asistent Stavebnín Richtárik', btn: 'Otvoriť okno: AI asistent Stavebnín Richtárik (automatické odpovede)',
  sub: 'Odpovede sú automatické. Cenu a dostupnosť potvrdí predajňa.',
  subUkazka: 'Ukážka – odpovede sú pripravené vopred z častých otázok.',
  hello: 'Dobrý deň, som AI asistent Stavebnín Richtárik. Odpoviem na otázky o sortimente, akciách, doprave, otváracích hodinách a kontakte. Cenu na konkrétne množstvo vám pripraví predajňa zadarmo.',
  oznam: 'Máte otázku k materiálu, akciám alebo doprave? Opýtajte sa.', spytat: 'Opýtať sa', volat: 'Zavolať',
  skryt: 'Skryť asistenta', ukazka: 'Ukážka na kontrolu: odpovede sú vopred pripravené z údajov webu, nepíše ich AI a nič sa neposiela. Naostro odpovedá AI.',
  chips: ['Aké máte otváracie hodiny?', 'Dovezete materiál na stavbu?', 'Aké máte aktuálne akcie?', 'Ako získam cenovú ponuku?'],
  ph: 'Napíšte otázku…', send: 'Odoslať', close: 'Zavrieť', novy: 'Nový rozhovor',
  note: 'Odpovedá AI podľa údajov z webu. Cenu, sklad a dovoz potvrdí predajňa. Nepíšte sem osobné údaje.',
  noteUkazka: 'Cenu, sklad a dovoz potvrdí predajňa. Nepíšte sem osobné údaje.',
  err: 'Teraz neviem odpovedať. Zavolajte nám na 0905 622 223 (pondelok – piatok 7:00 – 16:00, sobota 7:00 – 12:00).',
  ochrana: 'Ochrana údajov', dlhy: 'Rozhovor je už dlhý. Začnite nový a opýtajte sa znova.', ponuka: 'Cenová ponuka',
  temy: 'Časté otázky podľa témy:', vsetky: 'Všetky otázky ({n})', spat: 'Späť na témy', suvis: 'Môže vás zaujímať:',
  caste: 'Časté otázky', pripravena: 'Pripravená odpoveď z overených údajov webu', mapa: 'Navigovať v Google Mapách',
};

function nacitaj(k) { try { const r = JSON.parse(sessionStorage.getItem(k) || '[]'); return Array.isArray(r) ? r.filter((s) => s && (s.r === 'u' || s.r === 'a') && typeof s.t === 'string') : []; } catch (e) { return []; } }
function uloz(k, r) { try { sessionStorage.setItem(k, JSON.stringify(r)); } catch (e) { /* súkromné okno */ } }
function citaj(druh, k) { try { return window[druh].getItem(k); } catch (e) { return null; } }
function zapis(druh, k, v) { try { window[druh].setItem(k, v); } catch (e) { /* súkromné okno */ } }

function el(tag, attrs = {}, deti = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== false && v !== undefined) e.setAttribute(k, v === true ? '' : v);
  for (const d of deti) if (d != null) e.append(d);
  return e;
}
const ikona = (d) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = d; return s; };
const I_X = '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
const I_TEL = '<path d="M6.6 3.5h2.6l1.4 4-2 1.3a12 12 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>';
const I_SEND = '<path d="M4 12l16-8-6 16-2.5-6.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>';
// značka asistenta: tehlová stena (vlastná kresba, nezávislá od loga) na svetlom podklade
const I_TEHLY = '<g fill="currentColor"><rect x="3" y="5" width="8" height="3.6" rx=".4"/><rect x="13" y="5" width="8" height="3.6" rx=".4"/><rect x="3" y="10.2" width="3.5" height="3.6" rx=".4"/><rect x="8.2" y="10.2" width="7.6" height="3.6" rx=".4"/><rect x="17.5" y="10.2" width="3.5" height="3.6" rx=".4"/><rect x="3" y="15.4" width="8" height="3.6" rx=".4"/><rect x="13" y="15.4" width="8" height="3.6" rx=".4"/></g>';
const znak = (trieda) => el('span', { class: 'asi-znak ' + trieda, 'aria-hidden': 'true' }, [ikona(I_TEHLY)]);

/* text odpovede na odseky a odrážky; adresy, telefón a e-mail ako odkazy (len textové uzly, žiadne HTML z odpovede) */
// telefón: mobil 0905 622 223 (dve skupiny) aj pevná linka 037 651 17 77 (tri); číslice uprostred iného čísla
// alebo kódu (napr. DIČ SK1083167855) odkazom nie sú, preto sa pozerá aj na znak pred zhodou
const ODKAZ = /(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)])|(\+?421[\s\d]{9,13}\d|0\d{2,3}(?:\s?\d{2,3}){2,3})|([\w.+-]+@[\w-]+\.[\w.-]*\w)/g;
// dátum (28. 1. 2026) sa nezalomí
const DATUM = /\d{1,2}\. \d{1,2}\. \d{4}/g;
function obycajny(text, kam) {
  let i = 0;
  for (const m of text.matchAll(DATUM)) { kam.append(text.slice(i, m.index), el('span', { class: 'asi-nz' }, [m[0]])); i = m.index + m[0].length; }
  kam.append(text.slice(i));
}
function cielOdkazu(url) { return url.startsWith(DOMENA) ? KOREN + url.slice(DOMENA.length) : url; }
function textOdkazu(url) {
  if (/^https?:\/\/(www\.)?google\.[a-z.]+\/maps/.test(url)) return T.mapa;
  const t = url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/(index\.html)?$/, '');
  try { return decodeURIComponent(t); } catch (e) { return t; }
}
function riadok(text, kam) {
  let i = 0;
  for (const m of text.matchAll(ODKAZ)) {
    const [cele, url, tel, mail] = m;
    if (tel && m.index && /[\p{L}\d+]/u.test(text[m.index - 1])) continue;
    obycajny(text.slice(i, m.index), kam);
    const vonku = url && !url.startsWith(DOMENA);
    const a = el('a', url ? { href: cielOdkazu(url), target: vonku ? '_blank' : null, rel: vonku ? 'noopener' : null }
      : tel ? { href: 'tel:' + (tel.startsWith('0') ? '+421' + tel.slice(1) : tel).replace(/\s/g, '') } : { href: 'mailto:' + mail });
    a.textContent = url ? textOdkazu(url) : cele;
    kam.append(a);
    i = m.index + cele.length;
  }
  obycajny(text.slice(i), kam);
}
function vykresli(text, kam) {
  kam.replaceChildren();
  let zoznam = null;
  for (const r of text.replace(/\*\*/g, '').replace(/(\d) (?=€|%|m²|kg\b|t\b)/g, '$1 ').split('\n')) {
    const odrazka = /^\s*[-•*]\s+/.test(r);
    if (!r.trim()) { zoznam = null; continue; }
    if (odrazka) { if (!zoznam) kam.append(zoznam = el('ul')); const li = el('li'); riadok(r.replace(/^\s*[-•*]\s+/, ''), li); zoznam.append(li); }
    else { zoznam = null; const p = el('p'); riadok(r, p); kam.append(p); }
  }
}
/* pod odpoveďou o cene, sklade, doprave či ponuke: Zavolať a Cenová ponuka (e-mail) */
function akcie() {
  const tel = el('a', { class: 'asi-tel', href: TEL, 'aria-label': T.volat + ' ' + TEL_TXT }, [ikona(I_TEL)]); tel.append(T.volat + ' ' + TEL_TXT);
  const dop = el('a', { class: 'asi-dopyt', href: DOPYT }); dop.textContent = T.ponuka;
  return el('div', { class: 'asi-akcie' }, [tel, dop]);
}

/* odpoveď servera ako prúd udalostí: text po kúskoch, „tel“, na konci „koniec“, pri chybe „chyba“.
   Správu chyby ukáže okno len vtedy, keď ju poslal server (slovensky, s telefónom); výpadok siete alebo prerušený prúd
   má vlastný text T.err, nie technickú hlášku prehliadača („Failed to fetch“). */
const zoServera = (text) => Object.assign(new Error(text || ''), { zoServera: true });
async function opytaj(api, spravy, onText, onTel) {
  const res = await fetch(api + '?a=otazka', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prevadzka: 'richtarik', spravy: spravy.map(({ r, t }) => ({ r, t })) }) });
  const typ = res.headers.get('Content-Type') || '';
  if (!typ.includes('text/event-stream')) { const j = await res.json().catch(() => ({})); throw zoServera(j.chyba); }
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = '', koniec = false;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let k;
    while ((k = buf.indexOf('\n\n')) >= 0) {
      const blok = buf.slice(0, k); buf = buf.slice(k + 2);
      const meno = (blok.match(/^event: (.+)$/m) || [])[1], data = (blok.match(/^data: (.+)$/m) || [])[1];
      if (!meno || !data) continue;
      const d = JSON.parse(data);
      if (meno === 'text') onText(d.t || '');
      else if (meno === 'tel') onTel();
      else if (meno === 'chyba') throw zoServera(d.chyba);
      else if (meno === 'koniec') koniec = true;
    }
  }
  if (!koniec) throw new Error('');
}

export async function spusti(api) {
  const ukazka = api === UKAZKA;
  if (citaj('sessionStorage', K_SKRYTY)) return;
  if (!ukazka) {
    try { const r = await fetch(api + '?a=stav', { cache: 'no-store' }); if (!(await r.json()).zapnute) return; } catch (e) { return; }
  }
  const kluc = ukazka ? K_ROZHOVOR + '.ukazka' : K_ROZHOVOR;
  const css = el('link', { rel: 'stylesheet', href: new URL('asistent.css', import.meta.url).href });
  await new Promise((ok) => { css.onload = css.onerror = ok; document.head.append(css); });

  let rozhovor = nacitaj(kluc), bezi = false, otazky = null, modOt = null;
  async function nacitajOtazky() {
    try { modOt = modOt || await import('./asistent-otazky.js'); otazky = otazky || await modOt.nacitaj(); } catch (e) { /* okno ide aj bez nich */ }
    return otazky;
  }
  const ochranaUrl = new URL('../asistent/ochrana-udajov.html', import.meta.url).href;

  // ikona so štítkom označenia; bublina; okno
  const btn = el('button', { class: 'asi-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'asi-panel', 'aria-label': T.btn, title: T.btn },
    [znak('asi-znak-btn'), el('span', { class: 'asi-ai' }, [T.ai]), ikona(I_X)]);
  const spytaj = el('button', { class: 'asi-oznam-spytaj', type: 'button' }, [T.spytat]);
  const oznamX = el('button', { class: 'asi-oznam-x', type: 'button', 'aria-label': T.close }, [ikona(I_X)]);
  const oznam = el('div', { class: 'asi-oznam', role: 'region', 'aria-label': T.ai + ' ' + T.meno, hidden: true },
    [el('div', { class: 'asi-oznam-hlava' }, [znak('asi-znak-s'), el('p', { class: 'asi-oznam-h' }, [el('span', { class: 'asi-ai' }, [T.ai]), ' asistent']), oznamX]),
      el('p', { class: 'asi-oznam-t' }, [T.oznam]),
      el('div', { class: 'asi-oznam-akcie' }, [spytaj, el('a', { class: 'asi-oznam-tel', href: TEL, 'aria-label': T.volat + ' ' + TEL_TXT }, [ikona(I_TEL), T.volat])])]);
  const zoz = el('div', { class: 'asi-zoz', role: 'log', 'aria-live': 'polite' });
  const area = el('textarea', { rows: '1', maxlength: '800', enterkeyhint: 'send', placeholder: T.ph, 'aria-label': T.ph });
  const odosli = el('button', { class: 'asi-send', type: 'submit', 'aria-label': T.send }, [ikona(I_SEND)]);
  const form = el('form', { class: 'asi-form' }, [area, odosli]);
  const zavri = el('button', { class: 'asi-x', type: 'button', 'aria-label': T.close }, [ikona(I_X)]);
  const volaj = el('a', { class: 'asi-volaj', href: TEL, 'aria-label': T.volat + ' ' + TEL_TXT }, [ikona(I_TEL), el('span', {}, [T.volat])]);
  const novy = el('button', { class: 'asi-novy', type: 'button' }, [T.novy]), skry = el('button', { class: 'asi-skry', type: 'button' }, [T.skryt]);
  const pas = ukazka ? el('p', { class: 'asi-ukazka-pas' }, [T.ukazka]) : null;
  const clona = el('div', { class: 'asi-clona', hidden: true });
  const panel = el('section', { class: 'asi-panel', id: 'asi-panel', role: 'dialog', 'aria-labelledby': 'asi-h', tabindex: '-1', hidden: true },
    [el('header', { class: 'asi-hlava' }, [znak('asi-znak-m'),
      el('div', { class: 'asi-hlava-t' }, [el('h2', { id: 'asi-h' }, [el('span', { class: 'asi-ai' }, [T.ai]), ' ' + T.meno]), el('p', { class: 'asi-sub' }, [ukazka ? T.subUkazka : T.sub])]),
      el('div', { class: 'asi-hlava-akcie' }, [volaj, zavri])]),
    pas, zoz, form,
    el('div', { class: 'asi-pata' }, [el('div', {}, [el('p', { class: 'asi-note' }, [ukazka ? T.noteUkazka : T.note]), el('a', { href: ochranaUrl, target: '_blank', rel: 'noopener' }, [T.ochrana])]),
      el('div', { class: 'asi-pata-akcie' }, [novy, skry])])]);
  // úvod v okne už pri vložení ikony (pozorovateľ nižšie hlási až neskôr): ikona sa ani na snímku neukáže počas úvodu
  const uvodVOkne = () => [...document.querySelectorAll(UVOD)].some((u) => { const r = u.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight * 0.65; });
  html.classList.toggle('asi-uvod', uvodVOkne());
  document.body.append(oznam, btn, clona, panel);

  const bublina = (rola, text) => { const b = el('div', { class: 'asi-msg asi-' + rola }); if (text) vykresli(text, b); zoz.append(b); return b; };
  const doplnky = (b, tel, pripr) => { let za = b; if (pripr) { const p = el('p', { class: 'asi-zdroj' }, [T.pripravena]); za.after(p); za = p; } if (tel) za.after(akcie()); };
  function chipy(trieda, nadpis, polozky) {
    const box = el('div', { class: 'asi-chips ' + trieda });
    if (nadpis) box.append(el('p', { class: 'asi-chips-h' }, [nadpis]));
    for (const p of polozky) { const b = el('button', { type: 'button', class: p.trieda || null }, [p.text]); b.addEventListener('click', p.akcia); box.append(b); }
    return box;
  }
  const vymen = (stara, nova) => { stara.replaceWith(nova); const b = nova.querySelector('button'); if (b && !dotyk) b.focus({ preventScroll: true }); else panel.focus({ preventScroll: true }); nova.scrollIntoView({ block: 'nearest' }); };
  function temy() {
    if (!otazky) return null;
    const box = chipy('asi-temy', T.temy, Object.entries(otazky.temy).map(([k, n]) => ({ text: n, akcia: () => vymen(box, tema(k)) })));
    return box;
  }
  function tema(k, vsetky) {
    const zoz2 = otazky.ot.filter((o) => o.t === k);
    const ukaz = vsetky ? zoz2 : zoz2.slice(0, 8);
    const box = chipy('asi-temy', otazky.temy[k], [...ukaz.map((o) => ({ text: o.q, akcia: () => pripravena(o) })),
      ...(ukaz.length < zoz2.length ? [{ text: T.vsetky.replace('{n}', zoz2.length), trieda: 'asi-chip-dalej', akcia: () => vymen(box, tema(k, true)) }] : []),
      { text: T.spat, trieda: 'asi-chip-dalej', akcia: () => vymen(box, temy()) }]);
    return box;
  }
  function suvisiace(text, bezId) {
    if (!otazky) return;
    const uz = new Set(rozhovor.filter((s) => s.r === 'u').map((s) => s.t));
    const h = modOt.hladaj(otazky, text, 8).filter((x) => x.skore >= 0.3 && x.skore < 0.95 && x.o.id !== bezId && !uz.has(x.o.q)).slice(0, 3);
    const box = chipy('asi-suvis', h.length ? T.suvis : '', [...h.map((x) => ({ text: x.o.q, akcia: () => pripravena(x.o) })),
      { text: T.caste, trieda: 'asi-chip-dalej', akcia: () => vymen(box, temy()) }]);
    zoz.append(box);
  }
  // ťuk na častú otázku: overená odpoveď hneď, bez servera
  function pripravena(o) {
    if (bezi) return;
    if (rozhovor.length >= MAX_SPRAV) { bublina('a', T.dlhy).classList.add('asi-chyba'); return; }
    zoz.querySelectorAll('.asi-chips').forEach((c) => c.remove());
    pole();
    rozhovor.push({ r: 'u', t: o.q }, { r: 'a', t: o.a, tel: o.tel ? true : undefined, z: 'o' }); uloz(kluc, rozhovor);
    bublina('u', o.q);
    const b = bublina('a', o.a);
    doplnky(b, !!o.tel, true);
    suvisiace(o.q, o.id);
    novy.hidden = false;
    b.scrollIntoView({ block: 'start' });
  }
  function obsah() {
    zoz.replaceChildren();
    bublina('a', T.hello);
    if (!rozhovor.length) {
      zoz.append(chipy('asi-navrhy', '', T.chips.map((c) => ({ text: c, akcia: () => posli(c) }))));
      const tm = temy(); if (tm) zoz.append(tm);
    }
    for (const s of rozhovor) { const b = bublina(s.r, s.t); if (s.r === 'a') doplnky(b, s.tel, s.z === 'o'); }
    const posl = rozhovor[rozhovor.length - 1], otazka = rozhovor[rozhovor.length - 2];
    if (posl && posl.r === 'a' && otazka) suvisiace(otazka.t);
    novy.hidden = !rozhovor.length;
    zoz.scrollTop = rozhovor.length ? zoz.scrollHeight : 0;   // prázdny rozhovor od pozdravu, inak posledná odpoveď
  }
  function vyska() { area.style.height = 'auto'; area.style.height = Math.min(area.scrollHeight, 140) + 'px'; }
  function naZaciatok(prvok) {
    const ciel = zoz.scrollTop + prvok.getBoundingClientRect().top - zoz.getBoundingClientRect().top - 8;
    zoz.scrollTop = Math.max(0, Math.min(ciel, zoz.scrollHeight - zoz.clientHeight));
  }

  async function posli(otazka) {
    otazka = otazka.trim().slice(0, 800);
    if (!otazka || bezi) return;
    if (rozhovor.length >= MAX_SPRAV) { bublina('a', T.dlhy).classList.add('asi-chyba'); return; }
    rozhovor.push({ r: 'u', t: otazka }); uloz(kluc, rozhovor);
    const navrhy = zoz.querySelectorAll('.asi-chips');
    if (navrhy.length) { navrhy.forEach((c) => c.remove()); pole(); }
    const ub = bublina('u', otazka); novy.hidden = false;
    area.value = ''; vyska();
    const b = bublina('a', ''); b.classList.add('asi-pise');
    zoz.scrollTop = zoz.scrollHeight;
    bezi = true; odosli.disabled = true; zoz.setAttribute('aria-busy', 'true');
    let text = '', tel = false, zOtazok = null;
    const naText = (kus) => { const dole = zoz.scrollHeight - zoz.scrollTop - zoz.clientHeight < 40; text += kus; b.classList.remove('asi-pise'); vykresli(text, b); if (dole) naZaciatok(ub); };
    try {
      if (ukazka) zOtazok = await (await import('./asistent-ukazka.js')).opytaj(otazka, naText, () => { tel = true; });
      else await opytaj(api, rozhovor, naText, () => { tel = true; });
      const pripr = !!(ukazka && zOtazok && zOtazok.id !== null);
      doplnky(b, tel, pripr);
      rozhovor.push({ r: 'a', t: text.trim() || '…', tel: tel || undefined, z: pripr ? 'o' : undefined }); uloz(kluc, rozhovor);
      await nacitajOtazky();
      suvisiace(otazka, zOtazok && zOtazok.id);
    } catch (e) {
      rozhovor.pop(); uloz(kluc, rozhovor);
      b.classList.remove('asi-pise'); b.classList.add('asi-chyba'); vykresli((e && e.zoServera && e.message) || T.err, b);
      b.after(akcie());
      area.value = otazka; vyska();
    } finally {
      bezi = false; odosli.disabled = false; zoz.removeAttribute('aria-busy');
      naZaciatok(ub);
    }
  }

  const dotyk = matchMedia('(pointer: coarse)').matches, uzky = matchMedia('(max-width: 640px)');
  const pole = () => (dotyk ? panel : area).focus({ preventScroll: true });
  let navrat = null, inertne = [];
  // telefón: okno s clonou je modálne (zvyšok stránky inert); na počítači je bočné a nemodálne
  function modal(on) {
    inertne.forEach((e) => e.removeAttribute('inert')); inertne = [];
    panel.removeAttribute('aria-modal');
    if (!on || !uzky.matches) return;
    panel.setAttribute('aria-modal', 'true');
    inertne = [...document.body.children].filter((e) => e !== panel && e !== clona && !e.hasAttribute('inert') && !/^(SCRIPT|STYLE|LINK)$/.test(e.tagName));
    inertne.forEach((e) => e.setAttribute('inert', ''));
  }
  const vv = window.visualViewport;
  function prisposob() {
    const klav = !!vv && !panel.hidden && uzky.matches && innerHeight - vv.height > 120;
    html.classList.toggle('asi-klav', klav);
    if (klav) { panel.style.setProperty('--asi-vh', vv.height + 'px'); panel.style.setProperty('--asi-vt', vv.offsetTop + 'px'); }
    else { panel.style.removeProperty('--asi-vh'); panel.style.removeProperty('--asi-vt'); }
  }
  function otvor(on) {
    panel.hidden = !on; clona.hidden = !on; btn.setAttribute('aria-expanded', String(on)); html.classList.toggle('asi-open', on);
    modal(on); prisposob();
    if (on) {
      if (!otazky) nacitajOtazky().then(() => {
        if (panel.hidden || bezi) return;
        if (!rozhovor.length) { if (!zoz.querySelector('.asi-temy')) { const tm = temy(); if (tm) zoz.append(tm); } }
        else if (!zoz.querySelector('.asi-suvis') && rozhovor[rozhovor.length - 1].r === 'a') suvisiace(rozhovor[rozhovor.length - 2].t);
      });
      navrat = oznam.contains(document.activeElement) ? btn : document.activeElement;
      schovajOznam(); obsah(); setTimeout(pole, 30);
    } else if (navrat && navrat.focus) navrat.focus({ preventScroll: true });
  }

  // bublina: raz za návštevu, keď návštevník ikonu 8 s vidí (nie v úvode, nie pri päte); po 25 s zmizne,
  // zavretá krížikom sa 14 dní neukáže
  let oznamCas = 0, pataVidno = false, videl = 0;
  function ukazOznam() {
    if (!panel.hidden || rozhovor.length || citaj('sessionStorage', K_OZNAM_RAZ)) return;
    if (Date.now() - (Number(citaj('localStorage', K_OZNAM)) || 0) < 14 * 864e5) return;
    zapis('sessionStorage', K_OZNAM_RAZ, '1');
    oznam.hidden = false; requestAnimationFrame(() => oznam.classList.add('is-on'));
    oznamCas = setTimeout(() => schovajOznam(), 25000);
  }
  function schovajOznam(navzdy) {
    clearTimeout(oznamCas);
    if (navzdy) zapis('localStorage', K_OZNAM, String(Date.now()));
    if (oznam.contains(document.activeElement)) btn.focus({ preventScroll: true });
    oznam.classList.remove('is-on'); oznam.hidden = true;
  }
  const pata = document.querySelector('footer');
  const pozor = pata && 'IntersectionObserver' in window ? new IntersectionObserver((z) => { pataVidno = z.some((x) => x.isIntersecting); if (pataVidno && !oznam.hidden) schovajOznam(); }) : null;
  if (pozor) pozor.observe(pata);
  // RP1-12: bublina sa ukáže až po 1,5 s pokoja posunu (nie cez obsah, ktorý zákazník práve posúva)
  let posunCas = 0;
  addEventListener('scroll', () => { posunCas = performance.now(); }, { passive: true });
  const hodiny = setInterval(() => {
    // úvod je prvá obrazovka: bublina až po odskrolovaní za ňu
    const uvod = document.querySelector(UVOD);
    const zaUvodom = !uvod || uvod.getBoundingClientRect().bottom < innerHeight * 0.5;
    // počas otvorenej prechádzky predajňou (.pp-on) sa bublina neukáže, aby nezakryla jej pätu s náhľadmi
    const vidno = btn.isConnected && panel.hidden && zaUvodom && !pataVidno && !document.querySelector('.pp-on') && parseFloat(getComputedStyle(btn).opacity) > 0.9;
    videl = vidno ? videl + 1 : 0;
    if (!btn.isConnected || !panel.hidden) { clearInterval(hodiny); return; }
    if (videl >= 8 && performance.now() - posunCas >= 1500) { clearInterval(hodiny); ukazOznam(); }
  }, 1000);
  function skryAsistenta() {
    zapis('sessionStorage', K_SKRYTY, '1');
    clearInterval(hodiny); clearTimeout(oznamCas); if (pozor) pozor.disconnect();
    modal(false); html.classList.remove('asi-open', 'asi-klav');
    const ciel = document.getElementById('main') || document.querySelector('main');
    if (ciel && (panel.contains(document.activeElement) || document.activeElement === btn)) { ciel.setAttribute('tabindex', '-1'); ciel.focus({ preventScroll: true }); }
    btn.remove(); oznam.remove(); clona.remove(); panel.remove();
  }

  // úvod a iné plochy s vlastnými tlačidlami (UVOD): kým sú v okne, ikona sa skryje, aby nezakryla tlačidlá a hľadanie
  // úvodu ani nevyrušovala počas strihu záberov
  const uvody = document.querySelectorAll(UVOD);
  if (uvody.length && 'IntersectionObserver' in window) {
    const vidno = new Set();
    const io = new IntersectionObserver((z) => {
      for (const x of z) if (x.isIntersecting) vidno.add(x.target); else vidno.delete(x.target);
      html.classList.toggle('asi-uvod', vidno.size > 0);
    }, { rootMargin: '0px 0px -35% 0px' });
    uvody.forEach((u) => io.observe(u));
  }
  if (vv) { vv.addEventListener('resize', prisposob); vv.addEventListener('scroll', prisposob); }
  clona.addEventListener('click', () => otvor(false));
  btn.addEventListener('click', () => otvor(panel.hidden));
  zavri.addEventListener('click', () => otvor(false));
  spytaj.addEventListener('click', () => otvor(true));
  oznamX.addEventListener('click', () => schovajOznam(true));
  skry.addEventListener('click', skryAsistenta);
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!panel.hidden) { e.stopPropagation(); otvor(false); } else if (!oznam.hidden && oznam.contains(document.activeElement)) { e.stopPropagation(); schovajOznam(); }
  }, true);
  novy.addEventListener('click', () => { if (bezi) return; rozhovor = []; uloz(kluc, rozhovor); obsah(); pole(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); posli(area.value); });
  area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); posli(area.value); } });
  area.addEventListener('input', vyska);
  requestAnimationFrame(() => btn.classList.add('is-on'));
}
