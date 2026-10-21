/*
 * BARBERSHOP 30 – AI asistent: okno, v ktorom návštevník napíše otázku a hneď dostane odpoveď (služby, ceny,
 * objednanie, tím, hodiny, cesta, voľné termíny). Odpovedá server asistenta na www.headspa30.sk (asistent/api.php,
 * model Claude Opus 5.5) len z overených údajov webu (asistent/znalosti/barbershop.md) a z rezervačného kalendára
 * (asistent/lib/kalendar.php, keď je pripojený); kľúč API je len na serveri. Okno je zreteľne označené ako AI.
 * Overené voľné časy ukáže karta priamo z výsledku kalendára (nie z textu modelu) s poznámkou, že sú predbežné;
 * pri každej odpovedi o termíne alebo objednaní (udalosť tel zo servera) a pri chybe sú pod ňou tlačidlá
 * Zavolať a potvrdiť termín a Objednať sa.
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
  sk: { btn: 'AI asistent', title: 'AI asistent Barbershopu 30', sub: 'Odpovedá umelá inteligencia, termín potvrdí recepcia', hello: 'Ahoj! Som AI asistent Barbershopu 30. Poradím ti so službami, cenami aj objednaním. Na čo sa chceš opýtať?', deti: 'Strihate aj deti?', chips: ['Koľko stojí strih?', 'Má Adrián zajtra voľný termín?', 'Kedy máte otvorené?', 'Ako sa objednám?'], ph: 'Napíš otázku…', send: 'Odoslať', close: 'Zavrieť', novy: 'Nový rozhovor', note: 'Odpovedá AI podľa údajov z webu. Termín platí až po potvrdení. Nepíš sem osobné údaje.', err: 'Teraz neviem odpovedať. Zavolaj nám na 0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme.', ochrana: 'Ochrana údajov', dlhy: 'Rozhovor je už dlhý. Začni nový a opýtaj sa znova.', tel: 'Zavolať a potvrdiť termín', obj: 'Objednať sa', kal: 'Podľa kalendára o', pred: 'Predbežné, kým termín nepotvrdíš.', ziadny: 'V tento deň voľný termín nie je.' },
  en: { btn: 'AI assistant', title: 'Barbershop 30 AI assistant', sub: 'Answers by AI, the front desk confirms your time', hello: 'Hi! I’m the Barbershop 30 AI assistant. I can help with services, prices and booking. What would you like to know?', deti: 'Do you cut kids’ hair?', chips: ['How much is a haircut?', 'Is Adrián free tomorrow?', 'When are you open?', 'How do I book?'], ph: 'Type your question…', send: 'Send', close: 'Close', novy: 'New chat', note: 'Answers are written by AI from the information on this website. A time is only booked once confirmed. Please don’t share personal details.', err: 'I can’t answer right now. Call us on +421 951 267 203, on weekdays from 9:00 to 19:00 we always pick up.', ochrana: 'Privacy', dlhy: 'This chat is getting long. Start a new one and ask again.', tel: 'Call to confirm a time', obj: 'Book now', kal: 'Calendar checked at', pred: 'Provisional until you confirm it.', ziadny: 'No free time on this day.' },
  uk: { btn: 'AI-помічник', title: 'AI-помічник Barbershop 30', sub: 'Відповідає штучний інтелект, час підтверджує рецепція', hello: 'Привіт! Я AI-помічник Barbershop 30. Підкажу щодо послуг, цін і запису. Що хочеш дізнатися?', deti: 'Ви стрижете дітей?', chips: ['Скільки коштує стрижка?', 'Чи вільний Адріан завтра?', 'Коли ви працюєте?', 'Як записатися?'], ph: 'Напиши питання…', send: 'Надіслати', close: 'Закрити', novy: 'Нова розмова', note: 'Відповідає штучний інтелект за даними з цього сайту. Запис дійсний лише після підтвердження. Не пиши сюди особисті дані.', err: 'Зараз не можу відповісти. Зателефонуй нам: +421 951 267 203, у будні з 9:00 до 19:00 ми завжди беремо слухавку.', ochrana: 'Захист даних', dlhy: 'Розмова вже довга. Почни нову й запитай ще раз.', tel: 'Зателефонувати й підтвердити час', obj: 'Записатися', kal: 'За календарем о', pred: 'Попередньо, поки не підтвердиш.', ziadny: 'Цього дня вільного часу немає.' },
  hu: { btn: 'AI-asszisztens', title: 'A Barbershop 30 AI-asszisztense', sub: 'Mesterséges intelligencia válaszol, az időpontot a recepció erősíti meg', hello: 'Szia! A Barbershop 30 AI-asszisztense vagyok. Segítek a szolgáltatásokkal, árakkal és a foglalással. Mit szeretnél tudni?', deti: 'Gyerekeket is nyírtok?', chips: ['Mennyibe kerül egy hajvágás?', 'Ráér holnap Adrián?', 'Mikor vagytok nyitva?', 'Hogyan foglalhatok?'], ph: 'Írd ide a kérdésed…', send: 'Küldés', close: 'Bezárás', novy: 'Új beszélgetés', note: 'Mesterséges intelligencia válaszol a weboldal adatai alapján. Az időpont csak megerősítés után érvényes. Ne írj ide személyes adatokat.', err: 'Most nem tudok válaszolni. Hívj minket: +421 951 267 203, hétköznap 9:00 és 19:00 között mindig felvesszük.', ochrana: 'Adatvédelem', dlhy: 'A beszélgetés már hosszú. Kezdj újat, és kérdezz újra.', tel: 'Hívj, és egyeztetünk időpontot', obj: 'Időpontfoglalás', kal: 'A naptár szerint', pred: 'Előzetes, amíg meg nem erősíted.', ziadny: 'Ezen a napon nincs szabad időpont.' },
  sr: { btn: 'AI asistent', title: 'AI asistent Barbershopa 30', sub: 'Odgovara veštačka inteligencija, termin potvrđuje recepcija', hello: 'Zdravo! Ja sam AI asistent Barbershopa 30. Pomoći ću ti oko usluga, cena i zakazivanja. Šta želiš da pitaš?', deti: 'Šišate li decu?', chips: ['Koliko košta šišanje?', 'Da li je Adrián sutra slobodan?', 'Kada radite?', 'Kako da zakažem?'], ph: 'Napiši pitanje…', send: 'Pošalji', close: 'Zatvori', novy: 'Novi razgovor', note: 'Odgovara veštačka inteligencija na osnovu podataka sa sajta. Termin važi tek posle potvrde. Ne piši ovde lične podatke.', err: 'Trenutno ne mogu da odgovorim. Pozovi nas na +421 951 267 203, radnim danima od 9:00 do 19:00 uvek se javljamo.', ochrana: 'Zaštita podataka', dlhy: 'Razgovor je već dug. Započni novi i pitaj ponovo.', tel: 'Pozovi i potvrdi termin', obj: 'Zakaži termin', kal: 'Po kalendaru u', pred: 'Okvirno, dok ga ne potvrdiš.', ziadny: 'Tog dana nema slobodnog termina.' },
  pl: { btn: 'Asystent AI', title: 'Asystent AI Barbershop 30', sub: 'Odpowiada sztuczna inteligencja, termin potwierdza recepcja', hello: 'Cześć! Jestem asystentem AI Barbershop 30. Pomogę z usługami, cenami i rezerwacją. O co chcesz zapytać?', deti: 'Strzyżecie dzieci?', chips: ['Ile kosztuje strzyżenie?', 'Czy Adrián ma jutro wolny termin?', 'Kiedy jesteście otwarci?', 'Jak się umówić?'], ph: 'Napisz pytanie…', send: 'Wyślij', close: 'Zamknij', novy: 'Nowa rozmowa', note: 'Odpowiada sztuczna inteligencja na podstawie danych ze strony. Termin obowiązuje dopiero po potwierdzeniu. Nie podawaj tu danych osobowych.', err: 'Nie mogę teraz odpowiedzieć. Zadzwoń do nas: +421 951 267 203, w dni robocze od 9:00 do 19:00 zawsze odbieramy.', ochrana: 'Ochrona danych', dlhy: 'Rozmowa jest już długa. Zacznij nową i zapytaj ponownie.', tel: 'Zadzwoń i potwierdź termin', obj: 'Umów się', kal: 'Według kalendarza o', pred: 'Wstępnie, dopóki go nie potwierdzisz.', ziadny: 'Tego dnia nie ma wolnego terminu.' },
  de: { btn: 'KI-Assistent', title: 'KI-Assistent von Barbershop 30', sub: 'Es antwortet eine KI, den Termin bestätigt die Rezeption', hello: 'Hallo! Ich bin der KI-Assistent von Barbershop 30. Ich helfe dir bei Leistungen, Preisen und Buchung. Was möchtest du wissen?', deti: 'Schneidet ihr auch Kindern die Haare?', chips: ['Was kostet ein Haarschnitt?', 'Hat Adrián morgen frei?', 'Wann habt ihr geöffnet?', 'Wie buche ich?'], ph: 'Schreib deine Frage…', send: 'Senden', close: 'Schließen', novy: 'Neues Gespräch', note: 'Es antwortet eine KI anhand der Angaben auf dieser Website. Ein Termin gilt erst nach Bestätigung. Bitte keine persönlichen Daten eingeben.', err: 'Ich kann gerade nicht antworten. Ruf uns an: +421 951 267 203, werktags von 9:00 bis 19:00 gehen wir immer ran.', ochrana: 'Datenschutz', dlhy: 'Das Gespräch ist schon lang. Starte ein neues und frag noch einmal.', tel: 'Anrufen und Termin bestätigen', obj: 'Termin buchen', kal: 'Laut Kalender um', pred: 'Vorläufig, bis du ihn bestätigst.', ziadny: 'An diesem Tag ist kein Termin frei.' },
  cs: { btn: 'AI asistent', title: 'AI asistent Barbershopu 30', sub: 'Odpovídá umělá inteligence, termín potvrdí recepce', hello: 'Ahoj! Jsem AI asistent Barbershopu 30. Poradím ti se službami, cenami i objednáním. Na co se chceš zeptat?', deti: 'Stříháte i děti?', chips: ['Kolik stojí střih?', 'Má Adrián zítra volný termín?', 'Kdy máte otevřeno?', 'Jak se objednám?'], ph: 'Napiš otázku…', send: 'Odeslat', close: 'Zavřít', novy: 'Nový rozhovor', note: 'Odpovídá AI podle údajů z webu. Termín platí až po potvrzení. Nepiš sem osobní údaje.', err: 'Teď nedokážu odpovědět. Zavolej nám na +421 951 267 203, ve všední dny od 9:00 do 19:00 telefon vždy zvedneme.', ochrana: 'Ochrana údajů', dlhy: 'Rozhovor je už dlouhý. Začni nový a zeptej se znovu.', tel: 'Zavolat a potvrdit termín', obj: 'Objednat se', kal: 'Podle kalendáře v', pred: 'Předběžné, dokud termín nepotvrdíš.', ziadny: 'V tento den volný termín není.' },
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
const I_TEL = '<path d="M6.6 3.5h2.6l1.4 4-2 1.3a12 12 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>';
const TEL = 'tel:+421951267203', REZ = 'https://www.barbershop30.sk/rezervacia';
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

/* karta overených časov priamo z výsledku kalendára (stav overene alebo ziadny_volny); ostatné stavy vysvetlí text */
function karta(k) {
  if (!k || (k.stav !== 'overene' && k.stav !== 'ziadny_volny')) return null;
  const t = tx();
  let den = k.datum;
  try { den = new Intl.DateTimeFormat(html.lang || 'sk', { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'Europe/Bratislava' }).format(new Date(k.datum + 'T12:00:00Z')); } catch (e) { /* starý prehliadač */ }
  const box = el('div', { class: 'asi-kal' });
  const h = el('p', { class: 'asi-kal-h' }); h.textContent = [k.barber, den, k.sluzba && k.trvanie_min ? `${k.sluzba}, ${k.trvanie_min} min` : k.sluzba].filter(Boolean).join(' · ');
  box.append(h);
  if (k.stav === 'overene') {
    const ul = el('ul', { class: 'asi-casy', role: 'list' });
    for (const c of (k.casy || []).slice(0, 12)) { const li = el('li'); li.textContent = c; ul.append(li); }
    box.append(ul);
  }
  const p = el('p', { class: 'asi-kal-p' }); p.textContent = k.stav === 'overene' ? `${t.kal} ${k.overene_o}. ${t.pred}` : `${t.ziadny} (${t.kal} ${k.overene_o})`;
  box.append(p);
  return box;
}
/* tlačidlá pod odpoveďou o termíne: zavolať (vždy) a objednať sa */
function akcie() {
  const t = tx();
  const tel = el('a', { class: 'asi-tel', href: TEL }, [ikona(I_TEL)]); tel.append(t.tel);
  const obj = el('a', { class: 'asi-obj', href: REZ, target: '_blank', rel: 'noopener' }); obj.textContent = t.obj;
  return el('div', { class: 'asi-akcie' }, [tel, obj]);
}

/* odpoveď servera ako prúd udalostí: text po kúskoch, „termin“ (výsledok kalendára), „tel“ (odpoveď o termíne),
   na konci „koniec“, pri chybe „chyba“ */
async function opytaj(api, spravy, onText, onTermin, onTel) {
  const res = await fetch(api + '?a=otazka', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prevadzka: 'barbershop', jazyk: jazyk(), spravy: spravy.map(({ r, t }) => ({ r, t })) }) });
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
      else if (meno === 'termin') onTermin(d);
      else if (meno === 'tel') onTel();
      else if (meno === 'chyba') throw new Error(d.chyba || '');
      else if (meno === 'koniec') koniec = true;
    }
  }
  if (!koniec) throw new Error('');
}

export async function spusti(api) {
  let stav = {};
  try {
    const r = await fetch(api + '?a=stav', { cache: 'no-store' });
    stav = await r.json();
    if (!stav.zapnute) return;
  } catch (e) { return; }
  const kalendar = !!stav.kalendar;

  const css = el('link', { rel: 'stylesheet', href: new URL('asistent.css', import.meta.url).href });
  await new Promise((ok) => { css.onload = css.onerror = ok; document.head.append(css); });

  let rozhovor = nacitaj(), bezi = false;
  // na úzkom telefóne tlačidlo ukáže len „AI“ (data-kratko), aby nezavadzalo spodnej lište; celý názov je v aria-label
  const btn = el('button', { class: 'asi-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'asi-panel', 'data-no-i18n': true, 'data-kratko': 'AI' }, [ikona(I_CHAT), el('span')]);
  const zoz = el('div', { class: 'asi-zoz', role: 'log', 'aria-live': 'polite' });
  const area = el('textarea', { rows: '1', maxlength: '800', enterkeyhint: 'send' });
  const odosli = el('button', { class: 'asi-send', type: 'submit' }, [ikona(I_SEND)]);
  const form = el('form', { class: 'asi-form' }, [area, odosli]);
  const zavri = el('button', { class: 'asi-x', type: 'button' }, [ikona(I_X)]);
  const volaj = el('a', { class: 'asi-x asi-volaj', href: TEL }, [ikona(I_TEL)]);
  const novy = el('button', { class: 'asi-novy', type: 'button' });
  const h = el('h2', { id: 'asi-h' }), sub = el('p', { class: 'asi-sub' }), note = el('p', { class: 'asi-note' });
  const ochrana = el('a', { href: api.replace(/[^/]*$/, 'ochrana-udajov.html'), target: '_blank', rel: 'noopener' });
  const panel = el('section', { class: 'asi-panel', id: 'asi-panel', role: 'dialog', 'aria-labelledby': 'asi-h', tabindex: '-1', hidden: true, 'data-no-i18n': true },
    [el('header', { class: 'asi-hlava' }, [el('div', {}, [h, sub]), el('div', { class: 'asi-hlava-akcie' }, [volaj, zavri])]), zoz, form, el('div', { class: 'asi-pata' }, [el('div', {}, [note, ochrana]), novy])]);
  document.body.append(btn, panel);

  const bublina = (rola, text) => { const b = el('div', { class: 'asi-msg asi-' + rola }); if (text) vykresli(text, b); zoz.append(b); return b; };
  // karta termínu a tlačidlá idú pod bublinu odpovede (aj po obnovení stránky z uloženého rozhovoru)
  const doplnky = (b, k, tel) => { const c = karta(k); if (c) b.after(c); if (tel) (c || b).after(akcie()); };
  function popisy() {
    const t = tx();
    btn.lastChild.textContent = t.btn; btn.setAttribute('aria-label', t.title);
    h.textContent = t.title; sub.textContent = t.sub; note.textContent = t.note; ochrana.textContent = t.ochrana; novy.textContent = t.novy;
    area.placeholder = t.ph; area.setAttribute('aria-label', t.ph); odosli.setAttribute('aria-label', t.send); zavri.setAttribute('aria-label', t.close); volaj.setAttribute('aria-label', t.tel + ': 0951 267 203');
  }
  function obsah() {
    const t = tx();
    zoz.replaceChildren();
    bublina('a', t.hello);
    if (!rozhovor.length) {
      const chips = el('div', { class: 'asi-chips' });
      // otázka na voľný termín len s napojeným kalendárom (stav.kalendar), inak otázka, na ktorú vie odpovedať
      for (const c of (kalendar ? t.chips : [t.chips[0], t.deti, ...t.chips.slice(2)])) { const b = el('button', { type: 'button' }); b.textContent = c; b.addEventListener('click', () => posli(c)); chips.append(b); }
      zoz.append(chips);
    }
    for (const s of rozhovor) { const b = bublina(s.r, s.t); if (s.r === 'a') doplnky(b, s.k, s.tel); }
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
    let text = '', kal = null, tel = false;
    try {
      await opytaj(api, rozhovor, (kus) => {
        const dole = zoz.scrollHeight - zoz.scrollTop - zoz.clientHeight < 40;
        text += kus; b.classList.remove('asi-pise'); vykresli(text, b);
        if (dole) zoz.scrollTop = zoz.scrollHeight;
      }, (k) => { kal = k; }, () => { tel = true; });
      doplnky(b, kal, tel);
      rozhovor.push({ r: 'a', t: text.trim() || '…', k: kal || undefined, tel: tel || undefined }); uloz(rozhovor);
    } catch (e) {
      // otázka bez odpovede sa vráti do poľa, aby ju návštevník mohol poslať znova
      rozhovor.pop(); uloz(rozhovor);
      // správy servera sú po slovensky; v inom jazyku stránky všeobecná správa v jej jazyku
      b.classList.remove('asi-pise'); b.classList.add('asi-chyba'); vykresli((jazyk() === 'sk' && e.message) || t.err, b);
      b.after(akcie());
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
