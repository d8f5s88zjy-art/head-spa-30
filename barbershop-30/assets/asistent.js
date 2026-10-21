/*
 * BARBERSHOP 30 – asistent: okno, v ktorom návštevník napíše otázku a hneď dostane odpoveď (služby, ceny,
 * rezervácia, tím, hodiny, cesta). Odpovedá server asistenta na www.headspa30.sk (asistent/api.php, model Claude
 * Opus 5.5) len z overených údajov webu (asistent/znalosti/barbershop.md); kľúč API je len na serveri.
 *
 * Modul načíta app.js (časť 7b3) pri prvom geste, inak 3,5 s po načítaní, a zavolá spusti(api). Tlačidlo sa ukáže,
 * až keď server odpovie, že je zapnutý (api.php?a=stav), inak sa nestane nič. Rozhovor ostáva v tejto karte
 * prehliadača (sessionStorage); server ho neukladá. Texty okna sú v 8 jazykoch tu (T), odpoveď píše asistent
 * v jazyku otázky. Odkazy, telefón a e-mail v odpovedi sa dajú kliknúť (vytvárajú sa ako prvky, nikdy cez innerHTML).
 */
const html = document.documentElement;
const K_ROZHOVOR = 'b30.asistent';
const MAX_SPRAV = 15;                                   // server berie najviac 16 správ (otázka, odpoveď, …, otázka)

const T = {
  sk: { btn: 'Opýtaj sa', title: 'Opýtaj sa nás', sub: 'Virtuálny asistent, odpovedá hneď', hello: 'Ahoj! Poradím ti so službami, cenami, rezerváciou aj cestou k nám. Na čo sa chceš opýtať?', chips: ['Koľko stojí strih?', 'Kedy máte otvorené?', 'Strihate aj deti?', 'Ako sa objednám?'], ph: 'Napíš otázku…', send: 'Odoslať', close: 'Zavrieť', novy: 'Nový rozhovor', note: 'Odpovedá automatický asistent podľa údajov z webu. Nepíš sem osobné údaje.', err: 'Teraz neviem odpovedať. Zavolaj na recepciu 0951 267 203.', ochrana: 'Ochrana údajov', dlhy: 'Rozhovor je už dlhý. Začni nový a opýtaj sa znova.' },
  en: { btn: 'Ask us', title: 'Ask us', sub: 'Virtual assistant, replies instantly', hello: 'Hi! I can help with services, prices, booking and how to find us. What would you like to know?', chips: ['How much is a haircut?', 'When are you open?', 'Do you cut kids’ hair?', 'How do I book?'], ph: 'Type your question…', send: 'Send', close: 'Close', novy: 'New chat', note: 'Answers come from an automated assistant using the information on this website. Please don’t share personal details.', err: 'I can’t answer right now. Call reception at +421 951 267 203.', ochrana: 'Privacy', dlhy: 'This chat is getting long. Start a new one and ask again.' },
  uk: { btn: 'Запитай', title: 'Запитай нас', sub: 'Віртуальний помічник, відповідає одразу', hello: 'Привіт! Підкажу щодо послуг, цін, бронювання і того, як до нас дістатися. Що хочеш дізнатися?', chips: ['Скільки коштує стрижка?', 'Коли ви працюєте?', 'Ви стрижете дітей?', 'Як записатися?'], ph: 'Напиши питання…', send: 'Надіслати', close: 'Закрити', novy: 'Нова розмова', note: 'Відповідає автоматичний помічник за даними з цього сайту. Не пиши сюди особисті дані.', err: 'Зараз не можу відповісти. Зателефонуй на рецепцію +421 951 267 203.', ochrana: 'Захист даних', dlhy: 'Розмова вже довга. Почни нову й запитай ще раз.' },
  hu: { btn: 'Kérdezz', title: 'Kérdezz minket', sub: 'Virtuális asszisztens, azonnal válaszol', hello: 'Szia! Segítek a szolgáltatásokkal, árakkal, foglalással és azzal, hogyan találsz meg minket. Mit szeretnél tudni?', chips: ['Mennyibe kerül egy hajvágás?', 'Mikor vagytok nyitva?', 'Gyerekeket is nyírtok?', 'Hogyan foglalhatok?'], ph: 'Írd ide a kérdésed…', send: 'Küldés', close: 'Bezárás', novy: 'Új beszélgetés', note: 'Automatikus asszisztens válaszol a weboldal adatai alapján. Ne írj ide személyes adatokat.', err: 'Most nem tudok válaszolni. Hívd a recepciót: +421 951 267 203.', ochrana: 'Adatvédelem', dlhy: 'A beszélgetés már hosszú. Kezdj újat, és kérdezz újra.' },
  sr: { btn: 'Pitaj', title: 'Pitaj nas', sub: 'Virtuelni asistent, odgovara odmah', hello: 'Zdravo! Pomoći ću ti oko usluga, cena, rezervacije i puta do nas. Šta želiš da pitaš?', chips: ['Koliko košta šišanje?', 'Kada radite?', 'Šišate li decu?', 'Kako da rezervišem?'], ph: 'Napiši pitanje…', send: 'Pošalji', close: 'Zatvori', novy: 'Novi razgovor', note: 'Odgovara automatski asistent na osnovu podataka sa sajta. Ne piši ovde lične podatke.', err: 'Trenutno ne mogu da odgovorim. Pozovi recepciju na +421 951 267 203.', ochrana: 'Zaštita podataka', dlhy: 'Razgovor je već dug. Započni novi i pitaj ponovo.' },
  pl: { btn: 'Zapytaj', title: 'Zapytaj nas', sub: 'Wirtualny asystent, odpowiada od razu', hello: 'Cześć! Pomogę z usługami, cenami, rezerwacją i dojazdem do nas. O co chcesz zapytać?', chips: ['Ile kosztuje strzyżenie?', 'Kiedy jesteście otwarci?', 'Strzyżecie dzieci?', 'Jak się umówić?'], ph: 'Napisz pytanie…', send: 'Wyślij', close: 'Zamknij', novy: 'Nowa rozmowa', note: 'Odpowiada automatyczny asystent na podstawie danych ze strony. Nie podawaj tu danych osobowych.', err: 'Nie mogę teraz odpowiedzieć. Zadzwoń do recepcji: +421 951 267 203.', ochrana: 'Ochrona danych', dlhy: 'Rozmowa jest już długa. Zacznij nową i zapytaj ponownie.' },
  de: { btn: 'Frag uns', title: 'Frag uns', sub: 'Virtueller Assistent, antwortet sofort', hello: 'Hallo! Ich helfe dir bei Leistungen, Preisen, Buchung und dem Weg zu uns. Was möchtest du wissen?', chips: ['Was kostet ein Haarschnitt?', 'Wann habt ihr geöffnet?', 'Schneidet ihr auch Kindern die Haare?', 'Wie buche ich?'], ph: 'Schreib deine Frage…', send: 'Senden', close: 'Schließen', novy: 'Neues Gespräch', note: 'Es antwortet ein automatischer Assistent anhand der Angaben auf dieser Website. Bitte keine persönlichen Daten eingeben.', err: 'Ich kann gerade nicht antworten. Ruf die Rezeption an: +421 951 267 203.', ochrana: 'Datenschutz', dlhy: 'Das Gespräch ist schon lang. Starte ein neues und frag noch einmal.' },
  cs: { btn: 'Zeptej se', title: 'Zeptej se nás', sub: 'Virtuální asistent, odpovídá hned', hello: 'Ahoj! Poradím ti se službami, cenami, rezervací i cestou k nám. Na co se chceš zeptat?', chips: ['Kolik stojí střih?', 'Kdy máte otevřeno?', 'Stříháte i děti?', 'Jak se objednám?'], ph: 'Napiš otázku…', send: 'Odeslat', close: 'Zavřít', novy: 'Nový rozhovor', note: 'Odpovídá automatický asistent podle údajů z webu. Nepiš sem osobní údaje.', err: 'Teď nedokážu odpovědět. Zavolej na recepci +421 951 267 203.', ochrana: 'Ochrana údajů', dlhy: 'Rozhovor je už dlouhý. Začni nový a zeptej se znovu.' },
};
const jazyk = () => { const l = (html.lang || 'sk').slice(0, 2).toLowerCase(); return T[l] ? l : 'sk'; };
const tx = () => T[jazyk()];

function nacitaj() { try { const r = JSON.parse(sessionStorage.getItem(K_ROZHOVOR) || '[]'); return Array.isArray(r) ? r.filter((s) => s && (s.r === 'u' || s.r === 'a') && typeof s.t === 'string') : []; } catch (e) { return []; } }
function uloz(r) { try { sessionStorage.setItem(K_ROZHOVOR, JSON.stringify(r)); } catch (e) { /* súkromné okno */ } }

function el(tag, attrs = {}, deti = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== false && v !== undefined) e.setAttribute(k, v === true ? '' : v);
  for (const d of deti) if (d != null) e.append(d);
  return e;
}
const ikona = (d) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = d; return s; };
const I_CHAT = '<path d="M4 5h16v11H9l-4 4v-4H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>';
const I_X = '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
const I_SEND = '<path d="M4 12l16-8-6 16-2.5-6.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>';

/* text odpovede na odseky a odrážky; adresy, telefón a e-mail ako odkazy (len textové uzly, žiadne HTML z modelu) */
const ODKAZ = /(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)])|(\+?421[\s\d]{9,13}\d|0\d{3}\s?\d{3}\s?\d{3})|([\w.+-]+@[\w-]+\.[\w.-]*\w)/g;
function riadok(text, kam) {
  let i = 0;
  for (const m of text.matchAll(ODKAZ)) {
    kam.append(text.slice(i, m.index));
    const [cele, url, tel, mail] = m;
    const a = el('a', url ? { href: url, target: '_blank', rel: 'noopener' } : tel ? { href: 'tel:' + (tel.startsWith('0') ? '+421' + tel.slice(1) : tel).replace(/\s/g, '') } : { href: 'mailto:' + mail });
    a.textContent = url ? url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : cele;
    kam.append(a);
    i = m.index + cele.length;
  }
  kam.append(text.slice(i));
}
function vykresli(text, kam) {
  kam.replaceChildren();
  let zoznam = null;
  for (const r of text.replace(/\*\*/g, '').split('\n')) {
    const odrazka = /^\s*[-•*]\s+/.test(r);
    if (!r.trim()) { zoznam = null; continue; }
    if (odrazka) { if (!zoznam) kam.append(zoznam = el('ul')); const li = el('li'); riadok(r.replace(/^\s*[-•*]\s+/, ''), li); zoznam.append(li); }
    else { zoznam = null; const p = el('p'); riadok(r, p); kam.append(p); }
  }
}

/* odpoveď servera ako prúd udalostí: text po kúskoch, na konci „koniec“, pri chybe „chyba“ */
async function opytaj(api, spravy, onText) {
  const res = await fetch(api + '?a=otazka', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prevadzka: 'barbershop', jazyk: jazyk(), spravy }) });
  const typ = res.headers.get('Content-Type') || '';
  if (!typ.includes('text/event-stream')) { const j = await res.json().catch(() => ({})); throw new Error(j.chyba || ''); }
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
      else if (meno === 'chyba') throw new Error(d.chyba || '');
      else if (meno === 'koniec') koniec = true;
    }
  }
  if (!koniec) throw new Error('');
}

export async function spusti(api) {
  try {
    const r = await fetch(api + '?a=stav', { cache: 'no-store' });
    if (!(await r.json()).zapnute) return;
  } catch (e) { return; }

  const css = el('link', { rel: 'stylesheet', href: new URL('asistent.css', import.meta.url).href });
  await new Promise((ok) => { css.onload = css.onerror = ok; document.head.append(css); });

  let rozhovor = nacitaj(), bezi = false;
  const btn = el('button', { class: 'asi-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'asi-panel', 'data-no-i18n': true }, [ikona(I_CHAT), el('span')]);
  const zoz = el('div', { class: 'asi-zoz', role: 'log', 'aria-live': 'polite' });
  const area = el('textarea', { rows: '1', maxlength: '800', enterkeyhint: 'send' });
  const odosli = el('button', { class: 'asi-send', type: 'submit' }, [ikona(I_SEND)]);
  const form = el('form', { class: 'asi-form' }, [area, odosli]);
  const zavri = el('button', { class: 'asi-x', type: 'button' }, [ikona(I_X)]);
  const novy = el('button', { class: 'asi-novy', type: 'button' });
  const h = el('h2', { id: 'asi-h' }), sub = el('p', { class: 'asi-sub' }), note = el('p', { class: 'asi-note' });
  const ochrana = el('a', { href: api.replace(/[^/]*$/, 'ochrana-udajov.html'), target: '_blank', rel: 'noopener' });
  const panel = el('section', { class: 'asi-panel', id: 'asi-panel', role: 'dialog', 'aria-labelledby': 'asi-h', tabindex: '-1', hidden: true, 'data-no-i18n': true },
    [el('header', { class: 'asi-hlava' }, [el('div', {}, [h, sub]), zavri]), zoz, form, el('div', { class: 'asi-pata' }, [el('div', {}, [note, ochrana]), novy])]);
  document.body.append(btn, panel);

  const bublina = (rola, text) => { const b = el('div', { class: 'asi-msg asi-' + rola }); if (text) vykresli(text, b); zoz.append(b); return b; };
  function popisy() {
    const t = tx();
    btn.lastChild.textContent = t.btn; btn.setAttribute('aria-label', t.title);
    h.textContent = t.title; sub.textContent = t.sub; note.textContent = t.note; ochrana.textContent = t.ochrana; novy.textContent = t.novy;
    area.placeholder = t.ph; area.setAttribute('aria-label', t.ph); odosli.setAttribute('aria-label', t.send); zavri.setAttribute('aria-label', t.close);
  }
  function obsah() {
    const t = tx();
    zoz.replaceChildren();
    bublina('a', t.hello);
    if (!rozhovor.length) {
      const chips = el('div', { class: 'asi-chips' });
      for (const c of t.chips) { const b = el('button', { type: 'button' }); b.textContent = c; b.addEventListener('click', () => posli(c)); chips.append(b); }
      zoz.append(chips);
    }
    for (const s of rozhovor) bublina(s.r, s.t);
    novy.hidden = !rozhovor.length;
    zoz.scrollTop = zoz.scrollHeight;
  }
  function vyska() { area.style.height = 'auto'; area.style.height = Math.min(area.scrollHeight, 140) + 'px'; }

  async function posli(otazka) {
    otazka = otazka.trim().slice(0, 800);
    if (!otazka || bezi) return;
    const t = tx();
    if (rozhovor.length >= MAX_SPRAV) { bublina('a', t.dlhy).classList.add('asi-chyba'); return; }
    rozhovor.push({ r: 'u', t: otazka }); uloz(rozhovor);
    const chipy = zoz.querySelector('.asi-chips');
    if (chipy) { chipy.remove(); pole(); }                      // fokus nesmie ostať na zmazanom návrhu
    bublina('u', otazka); novy.hidden = false;
    area.value = ''; vyska();
    const b = bublina('a', ''); b.classList.add('asi-pise');
    zoz.scrollTop = zoz.scrollHeight;
    bezi = true; odosli.disabled = true;
    let text = '';
    try {
      await opytaj(api, rozhovor, (kus) => {
        const dole = zoz.scrollHeight - zoz.scrollTop - zoz.clientHeight < 40;
        text += kus; b.classList.remove('asi-pise'); vykresli(text, b);
        if (dole) zoz.scrollTop = zoz.scrollHeight;
      });
      rozhovor.push({ r: 'a', t: text.trim() || '…' }); uloz(rozhovor);
    } catch (e) {
      // otázka bez odpovede sa vráti do poľa, aby ju návštevník mohol poslať znova
      rozhovor.pop(); uloz(rozhovor);
      // správy servera sú po slovensky; v inom jazyku stránky všeobecná správa v jej jazyku
      b.classList.remove('asi-pise'); b.classList.add('asi-chyba'); vykresli((jazyk() === 'sk' && e.message) || t.err, b);
      area.value = otazka; vyska();
    } finally {
      bezi = false; odosli.disabled = false;
      zoz.scrollTop = zoz.scrollHeight;
    }
  }

  // na dotykovom displeji sa klávesnica nevysúva sama (zakryla by odpoveď), pole sa ťukne
  const dotyk = matchMedia('(pointer: coarse)').matches;
  const pole = () => (dotyk ? panel : area).focus({ preventScroll: true });
  let navrat = null;
  function otvor(on) {
    panel.hidden = !on; btn.setAttribute('aria-expanded', String(on)); html.classList.toggle('asi-open', on);
    if (on) { navrat = document.activeElement; popisy(); obsah(); setTimeout(pole, 30); }
    else if (navrat && navrat.focus) navrat.focus({ preventScroll: true });
  }
  btn.addEventListener('click', () => otvor(panel.hidden));
  zavri.addEventListener('click', () => otvor(false));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); otvor(false); } }, true);
  novy.addEventListener('click', () => { if (bezi) return; rozhovor = []; uloz(rozhovor); obsah(); area.focus(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); posli(area.value); });
  area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); posli(area.value); } });
  area.addEventListener('input', vyska);
  // zmena jazyka stránky (prepínač): popisy okna v novom jazyku
  new MutationObserver(() => { popisy(); if (!panel.hidden && !bezi) obsah(); }).observe(html, { attributes: true, attributeFilter: ['lang'] });
  popisy();
  requestAnimationFrame(() => btn.classList.add('is-on'));
}
