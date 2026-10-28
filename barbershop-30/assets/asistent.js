/*
 * BARBERSHOP 30 – Barber, AI asistent: okno, v ktorom návštevník napíše otázku a hneď dostane odpoveď (služby, ceny,
 * objednanie, tím, hodiny, cesta, voľné termíny). Odpovedá server asistenta na www.headspa30.sk (asistent/api.php,
 * model Claude Opus 5.5) len z overených údajov webu (asistent/znalosti/barbershop.md) a z rezervačného kalendára
 * (asistent/lib/kalendar.php, keď je pripojený); kľúč API je len na serveri. Barber je všade zreteľne označený ako AI
 * (štítok AI pri logu aj pri mene, podnadpis, prvá správa a poznámka pod oknom).
 * Overené voľné časy ukáže karta priamo z výsledku kalendára (nie z textu modelu) s poznámkou, že sú predbežné;
 * pri každej odpovedi o termíne alebo objednaní (udalosť tel zo servera) a pri chybe sú pod ňou tlačidlá
 * Zavolať a potvrdiť termín a Objednať sa. Zavolať je navyše stále v hlavičke okna.
 *
 * Ikona vľavo dole je logo Barbershopu 30 v bielom kruhu. Keď ju návštevník chvíľu vidí, vyskočí pri nej bublina
 * (Spýtať sa, Zavolať, zavrieť), raz za návštevu; zavretá sa 14 dní neukáže. Odkaz Skryť Barbera v okne schová
 * ikonu do konca návštevy.
 *
 * Modul načíta app.js (časť 7b3) alebo rezervacia.js pri prvom geste, inak o pár sekúnd po načítaní, a zavolá
 * spusti(api). Ikona sa ukáže, až keď server odpovie, že je zapnutý (api.php?a=stav), inak sa nestane nič.
 * spusti('ukazka') ukáže okno bez servera s vopred pripravenými odpoveďami z údajov webu (asistent-ukazka.js), na
 * kontrolu vzhľadu; je výrazne označené, že neodpovedá AI. Rozhovor ostáva v tejto karte prehliadača
 * (sessionStorage); server ho neukladá. Texty okna sú v 8 jazykoch tu (T), odpoveď píše asistent v jazyku otázky.
 * Odkazy, telefón a e-mail v odpovedi sa dajú kliknúť (vytvárajú sa ako prvky, nikdy cez innerHTML).
 */
const html = document.documentElement;
const K_ROZHOVOR = 'b30.asistent';
const K_SKRYTY = 'b30.barber.skryty';                // sessionStorage: návštevník Barbera skryl (do konca návštevy)
const K_OZNAM = 'b30.barber.oznam';                  // localStorage: kedy zavrel bublinu (14 dní sa neukáže)
const K_OZNAM_RAZ = 'b30.barber.oznam.raz';          // sessionStorage: bublina už v tejto návšteve bola
const UKAZKA = 'ukazka';
const MAX_SPRAV = 15;                                   // server berie najviac 16 správ (otázka, odpoveď, …, otázka)

const T = {
  sk: { ai: 'AI', btn: 'Otvoriť chat s Barberom, AI asistentom Barbershopu 30', meno: 'Barber, AI asistent', sub: 'AI asistent Barbershopu 30, termín potvrdí recepcia', hello: 'Ahoj, som Barber, AI asistent Barbershopu 30. Poradím ti so službami, cenami aj objednaním. Na čo sa chceš opýtať?', oznam: 'Ahoj, som Barber. Spýtaj sa ma na ceny, služby alebo objednanie.', spytat: 'Spýtať sa', volat: 'Zavolať', skryt: 'Skryť Barbera', ukazka: 'Ukážka na kontrolu: odpovede sú vopred pripravené z údajov webu, nepíše ich AI. Naostro odpovedá AI.', deti: 'Strihate aj deti?', chips: ['Koľko stojí strih?', 'Má Adrián zajtra voľný termín?', 'Kedy máte otvorené?', 'Ako sa objednám?'], ph: 'Napíš otázku…', send: 'Odoslať', close: 'Zavrieť', novy: 'Nový rozhovor', note: 'Odpovedá AI podľa údajov z webu. Termín platí až po potvrdení. Nepíš sem osobné údaje.', err: 'Teraz neviem odpovedať. Zavolaj nám na 0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme.', ochrana: 'Ochrana údajov', dlhy: 'Rozhovor je už dlhý. Začni nový a opýtaj sa znova.', tel: 'Zavolať a potvrdiť termín', obj: 'Objednať sa', kal: 'Podľa kalendára o', pred: 'Predbežné, kým termín nepotvrdíš.', ziadny: 'V tento deň voľný termín nie je.' },
  en: { ai: 'AI', btn: 'Open chat with Barber, the Barbershop 30 AI assistant', meno: 'Barber, AI assistant', sub: 'Barbershop 30 AI assistant, the front desk confirms your time', hello: 'Hi, I’m Barber, the Barbershop 30 AI assistant. I can help with services, prices and booking. What would you like to know?', oznam: 'Hi, I’m Barber. Ask me about prices, services or booking.', spytat: 'Ask', volat: 'Call', skryt: 'Hide Barber', ukazka: 'Preview for review: the answers are prepared in advance from the website, not written by AI. Live, the AI answers.', deti: 'Do you cut kids’ hair?', chips: ['How much is a haircut?', 'Is Adrián free tomorrow?', 'When are you open?', 'How do I book?'], ph: 'Type your question…', send: 'Send', close: 'Close', novy: 'New chat', note: 'Answers are written by AI from the information on this website. A time is only booked once confirmed. Please don’t share personal details.', err: 'I can’t answer right now. Call us on +421 951 267 203, on weekdays from 9:00 to 19:00 we always pick up.', ochrana: 'Privacy', dlhy: 'This chat is getting long. Start a new one and ask again.', tel: 'Call to confirm a time', obj: 'Book now', kal: 'Calendar checked at', pred: 'Provisional until you confirm it.', ziadny: 'No free time on this day.' },
  uk: { ai: 'AI', btn: 'Відкрити чат з Barber, AI-помічником Barbershop 30', meno: 'Barber, AI-помічник', sub: 'AI-помічник Barbershop 30, час підтверджує рецепція', hello: 'Привіт, я Barber, AI-помічник Barbershop 30. Підкажу щодо послуг, цін і запису. Що хочеш дізнатися?', oznam: 'Привіт, я Barber. Запитай мене про ціни, послуги чи запис.', spytat: 'Запитати', volat: 'Зателефонувати', skryt: 'Сховати Barber', ukazka: 'Демо для перевірки: відповіді підготовлені заздалегідь з даних сайту, їх не пише AI. Наживо відповідає AI.', deti: 'Ви стрижете дітей?', chips: ['Скільки коштує стрижка?', 'Чи вільний Адріан завтра?', 'Коли ви працюєте?', 'Як записатися?'], ph: 'Напиши питання…', send: 'Надіслати', close: 'Закрити', novy: 'Нова розмова', note: 'Відповідає штучний інтелект за даними з цього сайту. Запис дійсний лише після підтвердження. Не пиши сюди особисті дані.', err: 'Зараз не можу відповісти. Зателефонуй нам: +421 951 267 203, у будні з 9:00 до 19:00 ми завжди беремо слухавку.', ochrana: 'Захист даних', dlhy: 'Розмова вже довга. Почни нову й запитай ще раз.', tel: 'Зателефонувати й підтвердити час', obj: 'Записатися', kal: 'За календарем о', pred: 'Попередньо, поки не підтвердиш.', ziadny: 'Цього дня вільного часу немає.' },
  hu: { ai: 'AI', btn: 'Csevegés Barberrel, a Barbershop 30 AI-asszisztensével', meno: 'Barber, AI-asszisztens', sub: 'A Barbershop 30 AI-asszisztense, az időpontot a recepció erősíti meg', hello: 'Szia, Barber vagyok, a Barbershop 30 AI-asszisztense. Segítek a szolgáltatásokkal, árakkal és a foglalással. Mit szeretnél tudni?', oznam: 'Szia, Barber vagyok. Kérdezz az árakról, a szolgáltatásokról vagy a foglalásról.', spytat: 'Kérdezek', volat: 'Hívás', skryt: 'Barber elrejtése', ukazka: 'Bemutató ellenőrzésre: a válaszok előre elkészültek a weboldal adataiból, nem AI írja őket. Élesben az AI válaszol.', deti: 'Gyerekeket is nyírtok?', chips: ['Mennyibe kerül egy hajvágás?', 'Ráér holnap Adrián?', 'Mikor vagytok nyitva?', 'Hogyan foglalhatok?'], ph: 'Írd ide a kérdésed…', send: 'Küldés', close: 'Bezárás', novy: 'Új beszélgetés', note: 'Mesterséges intelligencia válaszol a weboldal adatai alapján. Az időpont csak megerősítés után érvényes. Ne írj ide személyes adatokat.', err: 'Most nem tudok válaszolni. Hívj minket: +421 951 267 203, hétköznap 9:00 és 19:00 között mindig felvesszük.', ochrana: 'Adatvédelem', dlhy: 'A beszélgetés már hosszú. Kezdj újat, és kérdezz újra.', tel: 'Hívj, és egyeztetünk időpontot', obj: 'Időpontfoglalás', kal: 'A naptár szerint', pred: 'Előzetes, amíg meg nem erősíted.', ziadny: 'Ezen a napon nincs szabad időpont.' },
  sr: { ai: 'AI', btn: 'Otvori čet sa Barberom, AI asistentom Barbershopa 30', meno: 'Barber, AI asistent', sub: 'AI asistent Barbershopa 30, termin potvrđuje recepcija', hello: 'Zdravo, ja sam Barber, AI asistent Barbershopa 30. Pomoći ću ti oko usluga, cena i zakazivanja. Šta želiš da pitaš?', oznam: 'Zdravo, ja sam Barber. Pitaj me za cene, usluge ili zakazivanje.', spytat: 'Pitaj', volat: 'Pozovi', skryt: 'Sakrij Barbera', ukazka: 'Prikaz za proveru: odgovori su unapred pripremljeni iz podataka sa sajta, ne piše ih AI. Uživo odgovara AI.', deti: 'Šišate li decu?', chips: ['Koliko košta šišanje?', 'Da li je Adrián sutra slobodan?', 'Kada radite?', 'Kako da zakažem?'], ph: 'Napiši pitanje…', send: 'Pošalji', close: 'Zatvori', novy: 'Novi razgovor', note: 'Odgovara veštačka inteligencija na osnovu podataka sa sajta. Termin važi tek posle potvrde. Ne piši ovde lične podatke.', err: 'Trenutno ne mogu da odgovorim. Pozovi nas na +421 951 267 203, radnim danima od 9:00 do 19:00 uvek se javljamo.', ochrana: 'Zaštita podataka', dlhy: 'Razgovor je već dug. Započni novi i pitaj ponovo.', tel: 'Pozovi i potvrdi termin', obj: 'Zakaži termin', kal: 'Po kalendaru u', pred: 'Okvirno, dok ga ne potvrdiš.', ziadny: 'Tog dana nema slobodnog termina.' },
  pl: { ai: 'AI', btn: 'Otwórz czat z Barberem, asystentem AI Barbershop 30', meno: 'Barber, asystent AI', sub: 'Asystent AI Barbershop 30, termin potwierdza recepcja', hello: 'Cześć, jestem Barber, asystent AI Barbershop 30. Pomogę z usługami, cenami i rezerwacją. O co chcesz zapytać?', oznam: 'Cześć, jestem Barber. Zapytaj mnie o ceny, usługi lub rezerwację.', spytat: 'Zapytaj', volat: 'Zadzwoń', skryt: 'Ukryj Barbera', ukazka: 'Podgląd do sprawdzenia: odpowiedzi są przygotowane wcześniej z danych strony, nie pisze ich AI. Na żywo odpowiada AI.', deti: 'Strzyżecie dzieci?', chips: ['Ile kosztuje strzyżenie?', 'Czy Adrián ma jutro wolny termin?', 'Kiedy jesteście otwarci?', 'Jak się umówić?'], ph: 'Napisz pytanie…', send: 'Wyślij', close: 'Zamknij', novy: 'Nowa rozmowa', note: 'Odpowiada sztuczna inteligencja na podstawie danych ze strony. Termin obowiązuje dopiero po potwierdzeniu. Nie podawaj tu danych osobowych.', err: 'Nie mogę teraz odpowiedzieć. Zadzwoń do nas: +421 951 267 203, w dni robocze od 9:00 do 19:00 zawsze odbieramy.', ochrana: 'Ochrona danych', dlhy: 'Rozmowa jest już długa. Zacznij nową i zapytaj ponownie.', tel: 'Zadzwoń i potwierdź termin', obj: 'Umów się', kal: 'Według kalendarza o', pred: 'Wstępnie, dopóki go nie potwierdzisz.', ziadny: 'Tego dnia nie ma wolnego terminu.' },
  de: { ai: 'KI', btn: 'Chat mit Barber öffnen, dem KI-Assistenten von Barbershop 30', meno: 'Barber, KI-Assistent', sub: 'KI-Assistent von Barbershop 30, den Termin bestätigt die Rezeption', hello: 'Hallo, ich bin Barber, der KI-Assistent von Barbershop 30. Ich helfe dir bei Leistungen, Preisen und Buchung. Was möchtest du wissen?', oznam: 'Hallo, ich bin Barber. Frag mich nach Preisen, Leistungen oder Buchung.', spytat: 'Fragen', volat: 'Anrufen', skryt: 'Barber ausblenden', ukazka: 'Vorschau zur Prüfung: Die Antworten sind vorab aus den Angaben der Website vorbereitet, keine KI schreibt sie. Live antwortet die KI.', deti: 'Schneidet ihr auch Kindern die Haare?', chips: ['Was kostet ein Haarschnitt?', 'Hat Adrián morgen frei?', 'Wann habt ihr geöffnet?', 'Wie buche ich?'], ph: 'Schreib deine Frage…', send: 'Senden', close: 'Schließen', novy: 'Neues Gespräch', note: 'Es antwortet eine KI anhand der Angaben auf dieser Website. Ein Termin gilt erst nach Bestätigung. Bitte keine persönlichen Daten eingeben.', err: 'Ich kann gerade nicht antworten. Ruf uns an: +421 951 267 203, werktags von 9:00 bis 19:00 gehen wir immer ran.', ochrana: 'Datenschutz', dlhy: 'Das Gespräch ist schon lang. Starte ein neues und frag noch einmal.', tel: 'Anrufen und Termin bestätigen', obj: 'Termin buchen', kal: 'Laut Kalender um', pred: 'Vorläufig, bis du ihn bestätigst.', ziadny: 'An diesem Tag ist kein Termin frei.' },
  cs: { ai: 'AI', btn: 'Otevřít chat s Barberem, AI asistentem Barbershopu 30', meno: 'Barber, AI asistent', sub: 'AI asistent Barbershopu 30, termín potvrdí recepce', hello: 'Ahoj, jsem Barber, AI asistent Barbershopu 30. Poradím ti se službami, cenami i objednáním. Na co se chceš zeptat?', oznam: 'Ahoj, jsem Barber. Zeptej se mě na ceny, služby nebo objednání.', spytat: 'Zeptat se', volat: 'Zavolat', skryt: 'Skrýt Barbera', ukazka: 'Ukázka ke kontrole: odpovědi jsou připravené předem z údajů webu, nepíše je AI. Naostro odpovídá AI.', deti: 'Stříháte i děti?', chips: ['Kolik stojí střih?', 'Má Adrián zítra volný termín?', 'Kdy máte otevřeno?', 'Jak se objednám?'], ph: 'Napiš otázku…', send: 'Odeslat', close: 'Zavřít', novy: 'Nový rozhovor', note: 'Odpovídá AI podle údajů z webu. Termín platí až po potvrzení. Nepiš sem osobní údaje.', err: 'Teď nedokážu odpovědět. Zavolej nám na +421 951 267 203, ve všední dny od 9:00 do 19:00 telefon vždy zvedneme.', ochrana: 'Ochrana údajů', dlhy: 'Rozhovor je už dlouhý. Začni nový a zeptej se znovu.', tel: 'Zavolat a potvrdit termín', obj: 'Objednat se', kal: 'Podle kalendáře v', pred: 'Předběžné, dokud termín nepotvrdíš.', ziadny: 'V tento den volný termín není.' },
};
// časté otázky (asistent-otazky.js) sú po slovensky, preto témy a súvisiace otázky len na slovenskej stránke
const TS = { temy: 'Časté otázky podľa témy:', vsetky: 'Všetky otázky ({n})', spat: 'Späť na témy', suvis: 'Môže ťa zaujímať:',
  caste: 'Časté otázky', pripravena: 'Pripravená odpoveď z overených údajov webu' };
const jazyk = () => { const l = (html.lang || 'sk').slice(0, 2).toLowerCase(); return T[l] ? l : 'sk'; };
const tx = () => T[jazyk()];

function nacitaj(k) { try { const r = JSON.parse(sessionStorage.getItem(k) || '[]'); return Array.isArray(r) ? r.filter((s) => s && (s.r === 'u' || s.r === 'a') && typeof s.t === 'string') : []; } catch (e) { return []; } }
function uloz(k, r) { try { sessionStorage.setItem(k, JSON.stringify(r)); } catch (e) { /* súkromné okno */ } }

function el(tag, attrs = {}, deti = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== false && v !== undefined) e.setAttribute(k, v === true ? '' : v);
  for (const d of deti) if (d != null) e.append(d);
  return e;
}
const ikona = (d) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = d; return s; };
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
  // číslo s jednotkou sa nezalomí (18 €, 40 min)
  for (const r of text.replace(/\*\*/g, '').replace(/(\d) (?=€|min\b|minút)/g, '$1\u00a0').split('\n')) {
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

/* úložisko prehliadača môže chýbať alebo hádzať chybu (súkromné okno, zablokované údaje stránky) */
function citaj(druh, k) { try { return window[druh].getItem(k); } catch (e) { return null; } }
function zapis(druh, k, v) { try { window[druh].setItem(k, v); } catch (e) { /* súkromné okno */ } }
/* logo Barbershopu 30 v bielom kruhu (ikona, hlavička okna, bublina) */
const LOGO = new URL('img/logo-30-barbershop-160.webp', import.meta.url).href;
const logo = (trieda) => el('span', { class: 'asi-logo ' + trieda, 'aria-hidden': 'true' }, [el('img', { src: LOGO, alt: '', width: '160', height: '160', decoding: 'async' })]);

export async function spusti(api) {
  const ukazka = api === UKAZKA;
  if (citaj('sessionStorage', K_SKRYTY)) return;
  let stav = {};
  if (!ukazka) {
    try {
      const r = await fetch(api + '?a=stav', { cache: 'no-store' });
      stav = await r.json();
      if (!stav.zapnute) return;
    } catch (e) { return; }
  }
  const kalendar = !!stav.kalendar;
  // ukážka má vlastný rozhovor, aby sa nemiešal so skutočným
  const kluc = ukazka ? K_ROZHOVOR + '.ukazka' : K_ROZHOVOR;

  const css = el('link', { rel: 'stylesheet', href: new URL('asistent.css', import.meta.url).href });
  await new Promise((ok) => { css.onload = css.onerror = ok; document.head.append(css); });

  let rozhovor = nacitaj(kluc), bezi = false;
  // časté otázky: pri prvom otvorení okna asistent-otazky.js a asistent-otazky.json (otázky a odpovede, gzip asi 41 kB),
  // hneď potom asistent-otazky-kmene.json (kmene na hľadanie, asi 25 kB); presne = počkať aj na kmene
  let otazky = null, modOt = null;
  const faq = () => (jazyk() === 'sk' && otazky ? otazky : null);
  async function nacitajOtazky(presne) {
    try {
      modOt = modOt || await import('./asistent-otazky.js'); otazky = otazky || await modOt.nacitaj();
      if (presne) await modOt.nacitajHladanie();
    } catch (e) { /* okno ide aj bez nich */ }
    return otazky;
  }
  // ikona: logo, štítok AI; pri otvorenom okne na počítači krížik na zavretie
  const btnAi = el('span', { class: 'asi-ai' });
  const btn = el('button', { class: 'asi-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'asi-panel', 'data-no-i18n': true }, [logo('asi-logo-btn'), btnAi, ikona(I_X)]);
  // bublina pri ikone: Spýtať sa, Zavolať, zavrieť
  const oznamH = el('p', { class: 'asi-oznam-h' }), oznamT = el('p', { class: 'asi-oznam-t' });
  const spytaj = el('button', { class: 'asi-oznam-spytaj', type: 'button' });
  const oznamTel = el('a', { class: 'asi-oznam-tel', href: TEL }, [ikona(I_TEL), el('span')]);
  const oznamX = el('button', { class: 'asi-oznam-x', type: 'button' }, [ikona(I_X)]);
  const oznam = el('div', { class: 'asi-oznam', role: 'region', hidden: true, 'data-no-i18n': true },
    [el('div', { class: 'asi-oznam-hlava' }, [logo('asi-logo-s'), oznamH, oznamX]), oznamT, el('div', { class: 'asi-oznam-akcie' }, [spytaj, oznamTel])]);
  // okno
  const zoz = el('div', { class: 'asi-zoz', role: 'log', 'aria-live': 'polite' });
  const area = el('textarea', { rows: '1', maxlength: '800', enterkeyhint: 'send' });
  const odosli = el('button', { class: 'asi-send', type: 'submit' }, [ikona(I_SEND)]);
  const form = el('form', { class: 'asi-form' }, [area, odosli]);
  const zavri = el('button', { class: 'asi-x', type: 'button' }, [ikona(I_X)]);
  const volaj = el('a', { class: 'asi-volaj', href: TEL }, [ikona(I_TEL), el('span')]);
  const novy = el('button', { class: 'asi-novy', type: 'button' }), skry = el('button', { class: 'asi-skry', type: 'button' });
  // v ukážke poznámku o odpovediach AI nahrádza pás ukážky (odpovede sú vopred pripravené)
  const h = el('h2', { id: 'asi-h' }), sub = el('p', { class: 'asi-sub' }), note = el('p', { class: 'asi-note', hidden: ukazka });
  const ochrana = el('a', { href: api.replace(/[^/]*$/, 'ochrana-udajov.html'), target: '_blank', rel: 'noopener', hidden: ukazka });
  const pas = ukazka ? el('p', { class: 'asi-ukazka-pas' }) : null;
  // telefón: clona za oknom (ťuk do nej okno zavrie)
  const clona = el('div', { class: 'asi-clona', hidden: true });
  const panel = el('section', { class: 'asi-panel', id: 'asi-panel', role: 'dialog', 'aria-labelledby': 'asi-h', tabindex: '-1', hidden: true, 'data-no-i18n': true },
    [el('header', { class: 'asi-hlava' }, [logo('asi-logo-m'), el('div', { class: 'asi-hlava-t' }, [h, sub]), el('div', { class: 'asi-hlava-akcie' }, [volaj, zavri])]),
      pas, zoz, form, el('div', { class: 'asi-pata' }, [el('div', {}, [note, ochrana]), el('div', { class: 'asi-pata-akcie' }, [novy, skry])])]);
  document.body.append(oznam, btn, clona, panel);

  const bublina = (rola, text) => { const b = el('div', { class: 'asi-msg asi-' + rola }); if (text) vykresli(text, b); zoz.append(b); return b; };
  // karta termínu a tlačidlá idú pod bublinu odpovede (aj po obnovení stránky z uloženého rozhovoru)
  const doplnky = (b, k, tel) => { const c = karta(k); if (c) b.after(c); if (tel) (c || b).after(akcie()); };
  // pripravená odpoveď z častých otázok má pod sebou zreteľný popis (nepísala ju AI)
  const pripravenaZnacka = (b) => b.after(el('p', { class: 'asi-zdroj' }, [TS.pripravena]));
  function chipy(trieda, nadpis, polozky) {
    const box = el('div', { class: 'asi-chips ' + trieda });
    if (nadpis) box.append(el('p', { class: 'asi-chips-h' }, [nadpis]));
    for (const p of polozky) { const b = el('button', { type: 'button', class: p.trieda || null }); b.textContent = p.text; b.addEventListener('click', p.akcia); box.append(b); }
    return box;
  }
  // nahradí skupinu inou a fokus dá na jej prvé tlačidlo (klávesnica, čítačka)
  const vymen = (stara, nova) => { stara.replaceWith(nova); const b = nova.querySelector('button'); if (b && !dotyk) b.focus({ preventScroll: true }); nova.scrollIntoView({ block: 'nearest' }); };
  function temy() {
    const db = faq();
    if (!db) return null;
    const box = chipy('asi-temy', TS.temy, Object.entries(db.temy).map(([k, n]) => ({ text: n, akcia: () => vymen(box, tema(k)) })));
    return box;
  }
  // otázky jednej témy: najprv všeobecné, potom podrobnosti k jednotlivým službám a barberom
  const poradie = (o) => (/^(obsah|trvanie|objednat|volno|tim)-/.test(o.id) ? 1 : 0);
  function tema(k, vsetky) {
    const db = faq();
    const zoz2 = db.ot.filter((o) => o.t === k).sort((a, b) => poradie(a) - poradie(b));
    const ukaz = vsetky ? zoz2 : zoz2.slice(0, 8);
    const box = chipy('asi-temy', db.temy[k], [...ukaz.map((o) => ({ text: o.q, akcia: () => pripravena(o) })),
      ...(ukaz.length < zoz2.length ? [{ text: TS.vsetky.replace('{n}', zoz2.length), trieda: 'asi-chip-dalej', akcia: () => vymen(box, tema(k, true)) }] : []),
      { text: TS.spat, trieda: 'asi-chip-dalej', akcia: () => vymen(box, temy()) }]);
    return box;
  }
  // pod odpoveďou: najviac 3 podobné časté otázky (nie tá istá, nie už položená) a cesta k témam
  function suvisiace(text, bezId) {
    const db = faq();
    if (!db) return;
    const uz = new Set(rozhovor.filter((s) => s.r === 'u').map((s) => s.t));
    const h = modOt.hladaj(db, text, 8).filter((x) => x.skore >= 0.3 && x.skore < 0.95 && x.o.id !== bezId && !uz.has(x.o.q)).slice(0, 3);
    const box = chipy('asi-suvis', h.length ? TS.suvis : '', [...h.map((x) => ({ text: x.o.q, akcia: () => pripravena(x.o) })),
      { text: TS.caste, trieda: 'asi-chip-dalej', akcia: () => vymen(box, temy()) }]);
    zoz.append(box);
  }
  // ťuk na častú otázku: overená odpoveď hneď, bez čakania a bez servera
  function pripravena(o) {
    if (bezi) return;
    if (rozhovor.length >= MAX_SPRAV) { bublina('a', tx().dlhy).classList.add('asi-chyba'); return; }
    zoz.querySelectorAll('.asi-chips').forEach((c) => c.remove());
    pole();
    rozhovor.push({ r: 'u', t: o.q }, { r: 'a', t: o.a, tel: o.tel ? true : undefined, z: 'o' }); uloz(kluc, rozhovor);
    bublina('u', o.q);
    const b = bublina('a', o.a);
    doplnky(b, null, !!o.tel); pripravenaZnacka(b);
    suvisiace(o.q, o.id);
    novy.hidden = false;
    b.scrollIntoView({ block: 'start' });
  }
  function popisy() {
    const t = tx();
    btn.setAttribute('aria-label', t.btn); btn.title = t.meno;
    btnAi.textContent = t.ai;
    h.replaceChildren('Barber', ' ', el('span', { class: 'asi-ai' }, [t.ai]));
    sub.textContent = t.sub; note.textContent = t.note; ochrana.textContent = t.ochrana; novy.textContent = t.novy; skry.textContent = t.skryt;
    if (pas) pas.textContent = t.ukazka;
    area.placeholder = t.ph; area.setAttribute('aria-label', t.ph); odosli.setAttribute('aria-label', t.send); zavri.setAttribute('aria-label', t.close);
    volaj.lastChild.textContent = t.volat; volaj.setAttribute('aria-label', t.tel + ': 0951 267 203');
    oznam.setAttribute('aria-label', t.meno); oznamH.replaceChildren('Barber', ' ', el('span', { class: 'asi-ai' }, [t.ai])); oznamT.textContent = t.oznam;
    spytaj.textContent = t.spytat; oznamTel.lastChild.textContent = t.volat; oznamTel.setAttribute('aria-label', t.tel + ': 0951 267 203'); oznamX.setAttribute('aria-label', t.close);
  }
  function obsah() {
    const t = tx();
    zoz.replaceChildren();
    bublina('a', t.hello);
    if (!rozhovor.length) {
      const chips = el('div', { class: 'asi-chips asi-navrhy' });
      // otázka na voľný termín len s napojeným kalendárom (stav.kalendar), inak otázka, na ktorú vie odpovedať
      for (const c of (kalendar ? t.chips : [t.chips[0], t.deti, ...t.chips.slice(2)])) { const b = el('button', { type: 'button' }); b.textContent = c; b.addEventListener('click', () => posli(c)); chips.append(b); }
      zoz.append(chips);
      const tm = temy();
      if (tm) zoz.append(tm);
    }
    for (const s of rozhovor) { const b = bublina(s.r, s.t); if (s.r === 'a') { doplnky(b, s.k, s.tel); if (s.z === 'o') pripravenaZnacka(b); } }
    // po obnovení: súvisiace otázky pod poslednou odpoveďou
    const posl = rozhovor[rozhovor.length - 1], otazka = rozhovor[rozhovor.length - 2];
    if (posl && posl.r === 'a' && otazka) suvisiace(otazka.t);
    novy.hidden = !rozhovor.length;
    zoz.scrollTop = zoz.scrollHeight;
  }
  function vyska() { area.style.height = 'auto'; area.style.height = Math.min(area.scrollHeight, 140) + 'px'; }

  async function posli(otazka) {
    otazka = otazka.trim().slice(0, 800);
    if (!otazka || bezi) return;
    const t = tx();
    if (rozhovor.length >= MAX_SPRAV) { bublina('a', t.dlhy).classList.add('asi-chyba'); return; }
    rozhovor.push({ r: 'u', t: otazka }); uloz(kluc, rozhovor);
    const navrhy = zoz.querySelectorAll('.asi-chips');
    if (navrhy.length) { navrhy.forEach((c) => c.remove()); pole(); }   // fokus nesmie ostať na zmazanom návrhu
    bublina('u', otazka); novy.hidden = false;
    area.value = ''; vyska();
    const b = bublina('a', ''); b.classList.add('asi-pise');
    zoz.scrollTop = zoz.scrollHeight;
    bezi = true; odosli.disabled = true;
    let text = '', kal = null, tel = false, zOtazok = null;
    const naText = (kus) => {
      const dole = zoz.scrollHeight - zoz.scrollTop - zoz.clientHeight < 40;
      text += kus; b.classList.remove('asi-pise'); vykresli(text, b);
      if (dole) zoz.scrollTop = zoz.scrollHeight;
    };
    try {
      // ukážka: vopred pripravené odpovede z údajov webu, nič sa neposiela
      if (ukazka) zOtazok = await (await import('./asistent-ukazka.js')).opytaj(otazka, naText, () => { tel = true; });
      else await opytaj(api, rozhovor, naText, (k) => { kal = k; }, () => { tel = true; });
      doplnky(b, kal, tel);
      if (ukazka) pripravenaZnacka(b);
      rozhovor.push({ r: 'a', t: text.trim() || '…', k: kal || undefined, tel: tel || undefined, z: ukazka ? 'o' : undefined }); uloz(kluc, rozhovor);
      await nacitajOtazky(true);
      suvisiace(otazka, zOtazok && zOtazok.id);
    } catch (e) {
      // otázka bez odpovede sa vráti do poľa, aby ju návštevník mohol poslať znova
      rozhovor.pop(); uloz(kluc, rozhovor);
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
    panel.hidden = !on; clona.hidden = !on; btn.setAttribute('aria-expanded', String(on)); html.classList.toggle('asi-open', on);
    prisposob();
    if (on) {
      // časté otázky: témy sa doplnia na úvodnú obrazovku, keď sa načítajú (súvisiace pod obnoveným rozhovorom až s kmeňmi)
      if (!otazky) nacitajOtazky(rozhovor.length > 0).then(() => {
        if (panel.hidden || bezi) return;
        if (!rozhovor.length) { if (!zoz.querySelector('.asi-temy')) { const tm = temy(); if (tm) zoz.append(tm); } }
        else if (!zoz.querySelector('.asi-suvis') && rozhovor[rozhovor.length - 1].r === 'a') suvisiace(rozhovor[rozhovor.length - 2].t);
      });
      else if (modOt) modOt.nacitaj();   // kmene, ktoré minule zlyhali alebo nesedeli, sa stiahnu znova
      // z bubliny sa fokus po zavretí vráti na ikonu (bublina už nebude)
      navrat = oznam.contains(document.activeElement) ? btn : document.activeElement;
      schovajOznam(); popisy(); obsah(); setTimeout(pole, 30);
    } else if (navrat && navrat.focus) navrat.focus({ preventScroll: true });
  }

  // bublina: raz za návštevu, keď návštevník ikonu 8 s vidí (nie v úvode, pri menu ani pri ponuke jazyka);
  // sama zmizne po 25 s, zavretá krížikom sa 14 dní neukáže
  let oznamCas = 0;
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
  let videl = 0;
  const hodiny = setInterval(() => {
    const vidno = btn.isConnected && panel.hidden && parseFloat(getComputedStyle(btn).opacity) > 0.9 && !document.querySelector('.lang-offer.in');
    videl = vidno ? videl + 1 : 0;
    if (videl >= 8 || !btn.isConnected || !panel.hidden) { clearInterval(hodiny); if (videl >= 8) ukazOznam(); }
  }, 1000);

  // Skryť Barbera: ikona, bublina aj okno zmiznú do konca návštevy
  function skryBarbera() {
    zapis('sessionStorage', K_SKRYTY, '1');
    clearInterval(hodiny); clearTimeout(oznamCas);
    html.classList.remove('asi-open');
    btn.remove(); oznam.remove(); clona.remove(); panel.remove();
  }

  // telefón s klávesnicou: okno sa natiahne presne na viditeľnú plochu (pole otázky nad klávesnicou, hlavička hore)
  const vv = window.visualViewport, uzky = matchMedia('(max-width: 640px)');
  function prisposob() {
    const klav = !!vv && !panel.hidden && uzky.matches && innerHeight - vv.height > 120;
    html.classList.toggle('asi-klav', klav);
    if (klav) { panel.style.setProperty('--asi-vh', vv.height + 'px'); panel.style.setProperty('--asi-vt', vv.offsetTop + 'px'); }
    else { panel.style.removeProperty('--asi-vh'); panel.style.removeProperty('--asi-vt'); }
  }
  if (vv) { vv.addEventListener('resize', prisposob); vv.addEventListener('scroll', prisposob); }
  clona.addEventListener('click', () => otvor(false));
  btn.addEventListener('click', () => otvor(panel.hidden));
  zavri.addEventListener('click', () => otvor(false));
  spytaj.addEventListener('click', () => otvor(true));
  oznamX.addEventListener('click', () => schovajOznam(true));
  skry.addEventListener('click', skryBarbera);
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!panel.hidden) { e.stopPropagation(); otvor(false); } else if (!oznam.hidden && oznam.contains(document.activeElement)) { e.stopPropagation(); schovajOznam(); }
  }, true);
  novy.addEventListener('click', () => { if (bezi) return; rozhovor = []; uloz(kluc, rozhovor); obsah(); area.focus(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); posli(area.value); });
  area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); posli(area.value); } });
  area.addEventListener('input', vyska);
  // zmena jazyka stránky (prepínač): popisy okna v novom jazyku
  new MutationObserver(() => { popisy(); if (!panel.hidden && !bezi) obsah(); }).observe(html, { attributes: true, attributeFilter: ['lang'] });
  popisy();
  requestAnimationFrame(() => btn.classList.add('is-on'));
}
