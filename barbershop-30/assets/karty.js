/*
 * BARBERSHOP 30 – vizitka a vernostná kartička v pásme pod kontaktom.
 * Vizitka: tá, ktorú Barbershop 30 už má a rozdáva na recepcii (fotka source/photos/foto-17.jpg), nie nový návrh:
 * na výšku, diagonálne pruhy barber pole (červená, biela, modrá), biely kruh s pôvodným logom „30 Barbershop
 * Holičstvo“ (vektor zo starého webu source/web-povodny/logo-vector-black.svg → assets/img/logo-30-barbershop.webp)
 * a pod ním kontakt. Na prednej strane len riadky, ktoré sa dajú z fotky prečítať a sedia s overenými údajmi;
 * zadná strana sú pruhy s kruhom a logom. Uložiť kontakt otvorí assets/barbershop30.vcf (iPhone ho rovno ponúkne
 * pridať do kontaktov, preto bez atribútu download).
 * Vernostná kartička: ukážka kartičky z vernostného systému (rovnaký vzhľad ako vernost/karta) a ako funguje.
 * Ukáže sa len so zapnutou prihláškou (vernost.js s atribútom data-zapnute, nasadenie ho pridá s heslom recepcie)
 * alebo keď má návštevník kartičku uloženú; tlačidlo otvorí prihlášku alebo uloženú kartičku (vernost.js, prvky
 * data-vernost-karta). ?vernost=ukazka ju ukáže na kontrolu s vypnutým tlačidlom.
 * Pripomienka ďalšieho strihu (2026‑10‑25): udalosť do kalendára telefónu o 3, 4 alebo 6 týždňov o 10:00 (nedeľa sa
 * posunie na pondelok, vtedy je zatvorené), súbor .ics alebo Google Kalendár; text udalosti hovorí, že je to len
 * pripomienka, nie rezervácia. Pošli kamarátovi: zdieľanie telefónu, inak skopíruje odkaz na stránku.
 * Modul načíta app.js (časť 7b5) po načítaní stránky a zavolá spusti(pas kontaktu). Texty sú v 8 jazykoch tu (T, TP);
 * vizitka je slovenská ako vytlačená.
 */
const html = document.documentElement;
const K_KARTA = 'v30.karta.barbershop';

const T = {
  sk: { vEy: 'Naša vizitka', vH: 'Ulož si nás do telefónu', vcf: 'Uložiť kontakt', pred: 'Vizitka Barbershop 30, predná strana s logom a kontaktom', zad: 'Vizitka Barbershop 30, zadná strana s logom', kEy: 'Vernostná kartička', kH: 'Body za každú návštevu', kU: 'Zbieraj body za každú návštevu a vymeň ich za zľavu alebo produkt. Kartička je zadarmo a na tvoje meno.', k1: 'Založ si kartičku, stačí meno a telefón.', k2: 'Pri návšteve ukáž na recepcii QR kód.', k3: 'Body vymeníš za odmenu.', chcem: 'Chcem vernostnú kartičku', moja: 'Otvoriť moju kartičku', meno: 'Tvoje meno', body: 'bodov' },
  en: { vEy: 'Our business card', vH: 'Save us in your phone', vcf: 'Save contact', pred: 'Barbershop 30 business card, front with the logo and contact details', zad: 'Barbershop 30 business card, back with the logo', kEy: 'Loyalty card', kH: 'Points for every visit', kU: 'Collect points with every visit and swap them for a discount or a product. The card is free and in your name.', k1: 'Create your card, all it takes is your name and phone.', k2: 'Show the QR code at reception when you visit.', k3: 'Swap your points for a reward.', chcem: 'I want the loyalty card', moja: 'Open my card', meno: 'Your name', body: 'points' },
  uk: { vEy: 'Наша візитка', vH: 'Збережи нас у телефоні', vcf: 'Зберегти контакт', pred: 'Візитка Barbershop 30, лицьовий бік з логотипом і контактами', zad: 'Візитка Barbershop 30, зворотний бік з логотипом', kEy: 'Картка лояльності', kH: 'Бали за кожен візит', kU: 'Збирай бали за кожен візит і обмінюй їх на знижку або продукт. Картка безкоштовна й на твоє ім’я.', k1: 'Створи картку, вистачить імені й телефону.', k2: 'Під час візиту покажи на рецепції QR-код.', k3: 'Бали обміняєш на винагороду.', chcem: 'Хочу картку лояльності', moja: 'Відкрити мою картку', meno: 'Твоє ім’я', body: 'балів' },
  hu: { vEy: 'Névjegykártyánk', vH: 'Mentsd el a telefonodba', vcf: 'Névjegy mentése', pred: 'A Barbershop 30 névjegykártyája, előlap a logóval és elérhetőségekkel', zad: 'A Barbershop 30 névjegykártyája, hátlap a logóval', kEy: 'Hűségkártya', kH: 'Pontok minden látogatásért', kU: 'Gyűjts pontokat minden látogatással, és váltsd be őket kedvezményre vagy termékre. A kártya ingyenes és a te nevedre szól.', k1: 'Hozd létre a kártyád, elég a neved és a telefonszámod.', k2: 'Látogatáskor mutasd meg a QR-kódot a recepción.', k3: 'A pontokat jutalomra váltod.', chcem: 'Kérem a hűségkártyát', moja: 'A kártyám megnyitása', meno: 'A neved', body: 'pont' },
  sr: { vEy: 'Naša vizitkarta', vH: 'Sačuvaj nas u telefonu', vcf: 'Sačuvaj kontakt', pred: 'Vizitkarta Barbershop 30, prednja strana sa logom i kontaktom', zad: 'Vizitkarta Barbershop 30, zadnja strana sa logom', kEy: 'Kartica lojalnosti', kH: 'Bodovi za svaku posetu', kU: 'Skupljaj bodove za svaku posetu i zameni ih za popust ili proizvod. Kartica je besplatna i na tvoje ime.', k1: 'Napravi karticu, dovoljni su ime i telefon.', k2: 'Pri poseti pokaži QR kod na recepciji.', k3: 'Bodove zameniš za nagradu.', chcem: 'Želim karticu lojalnosti', moja: 'Otvori moju karticu', meno: 'Tvoje ime', body: 'bodova' },
  pl: { vEy: 'Nasza wizytówka', vH: 'Zapisz nas w telefonie', vcf: 'Zapisz kontakt', pred: 'Wizytówka Barbershop 30, przód z logo i kontaktem', zad: 'Wizytówka Barbershop 30, tył z logo', kEy: 'Karta lojalnościowa', kH: 'Punkty za każdą wizytę', kU: 'Zbieraj punkty za każdą wizytę i wymieniaj je na rabat lub produkt. Karta jest bezpłatna i na twoje imię.', k1: 'Załóż kartę, wystarczy imię i telefon.', k2: 'Podczas wizyty pokaż w recepcji kod QR.', k3: 'Punkty wymienisz na nagrodę.', chcem: 'Chcę kartę lojalnościową', moja: 'Otwórz moją kartę', meno: 'Twoje imię', body: 'punktów' },
  de: { vEy: 'Unsere Visitenkarte', vH: 'Speichere uns im Handy', vcf: 'Kontakt speichern', pred: 'Visitenkarte von Barbershop 30, Vorderseite mit Logo und Kontakt', zad: 'Visitenkarte von Barbershop 30, Rückseite mit Logo', kEy: 'Treuekarte', kH: 'Punkte für jeden Besuch', kU: 'Sammle Punkte bei jedem Besuch und tausche sie gegen einen Rabatt oder ein Produkt. Die Karte ist kostenlos und auf deinen Namen.', k1: 'Leg deine Karte an, Name und Telefon reichen.', k2: 'Zeig beim Besuch den QR-Code an der Rezeption.', k3: 'Die Punkte tauschst du gegen eine Prämie.', chcem: 'Ich möchte die Treuekarte', moja: 'Meine Karte öffnen', meno: 'Dein Name', body: 'Punkte' },
  cs: { vEy: 'Naše vizitka', vH: 'Ulož si nás do telefonu', vcf: 'Uložit kontakt', pred: 'Vizitka Barbershop 30, přední strana s logem a kontaktem', zad: 'Vizitka Barbershop 30, zadní strana s logem', kEy: 'Věrnostní kartička', kH: 'Body za každou návštěvu', kU: 'Sbírej body za každou návštěvu a vyměň je za slevu nebo produkt. Kartička je zdarma a na tvé jméno.', k1: 'Založ si kartičku, stačí jméno a telefon.', k2: 'Při návštěvě ukaž na recepci QR kód.', k3: 'Body vyměníš za odměnu.', chcem: 'Chci věrnostní kartičku', moja: 'Otevřít moji kartičku', meno: 'Tvé jméno', body: 'bodů' },
};
const tx = () => { const l = (html.lang || 'sk').slice(0, 2).toLowerCase(); return T[l] || T.sk; };

/* pripomienka a zdieľanie: pH nadpis, pU popis, pT voľby, pKedy dátum, pAdd .ics, pG Google, eSum a eDesc text udalosti,
   zd zdieľanie, zdOk skopírované, shTxt text pri zdieľaní, kedy popis volieb pre čítačku */
const TP = {
  sk: { pH: 'Pripomeň si ďalší strih', pU: 'Pridáme ti pripomienku do kalendára, nech sa objednáš včas. Nie je to rezervácia.', pT: ['o 3 týždne', 'o 4 týždne', 'o 6 týždňov'], kedy: 'Kedy pripomenúť', pKedy: 'Pripomienka {datum} o 10:00', pAdd: 'Pridať do kalendára', pG: 'Google Kalendár', eSum: 'Objednaj sa na strih', eDesc: 'Pripomienka, nie rezervácia. Objednaj sa online alebo zavolaj.', zd: 'Pošli kamarátovi', zdOk: 'Odkaz je skopírovaný', shTxt: 'Barbershop 30, pánske holičstvo na Mostnej 30 v Nitre.' },
  en: { pH: 'Remember your next cut', pU: "We'll add a reminder to your calendar so you book in time. It's not a booking.", pT: ['in 3 weeks', 'in 4 weeks', 'in 6 weeks'], kedy: 'When to remind you', pKedy: 'Reminder on {datum} at 10:00', pAdd: 'Add to calendar', pG: 'Google Calendar', eSum: 'Book your haircut', eDesc: 'Reminder, not a booking. Book online or call us.', zd: 'Send to a friend', zdOk: 'Link copied', shTxt: "Barbershop 30, men's barbershop at Mostná 30 in Nitra." },
  uk: { pH: 'Нагадування про наступну стрижку', pU: 'Додамо нагадування в календар, щоб ти записався вчасно. Це не бронювання.', pT: ['через 3 тижні', 'через 4 тижні', 'через 6 тижнів'], kedy: 'Коли нагадати', pKedy: 'Нагадування {datum} о 10:00', pAdd: 'Додати в календар', pG: 'Google Календар', eSum: 'Запишися на стрижку', eDesc: 'Нагадування, не бронювання. Запишися онлайн або зателефонуй.', zd: 'Надіслати другові', zdOk: 'Посилання скопійовано', shTxt: 'Barbershop 30, чоловіча перукарня на Mostná 30 у Нітрі.' },
  hu: { pH: 'Emlékeztető a következő hajvágásra', pU: 'Emlékeztetőt teszünk a naptáradba, hogy időben foglalj. Ez nem foglalás.', pT: ['3 hét múlva', '4 hét múlva', '6 hét múlva'], kedy: 'Mikor emlékeztessünk', pKedy: 'Emlékeztető: {datum}, 10:00', pAdd: 'Hozzáadás a naptárhoz', pG: 'Google Naptár', eSum: 'Foglalj időpontot hajvágásra', eDesc: 'Emlékeztető, nem foglalás. Foglalj online vagy hívj minket.', zd: 'Küldd el egy barátodnak', zdOk: 'Link kimásolva', shTxt: 'Barbershop 30, férfi fodrászat a Mostná 30 alatt, Nyitrán.' },
  sr: { pH: 'Podsetnik za sledeće šišanje', pU: 'Dodaćemo podsetnik u tvoj kalendar da se zakažeš na vreme. Ovo nije rezervacija.', pT: ['za 3 nedelje', 'za 4 nedelje', 'za 6 nedelja'], kedy: 'Kada da te podsetimo', pKedy: 'Podsetnik {datum} u 10:00', pAdd: 'Dodaj u kalendar', pG: 'Google kalendar', eSum: 'Zakaži šišanje', eDesc: 'Podsetnik, nije rezervacija. Zakaži online ili nas pozovi.', zd: 'Pošalji prijatelju', zdOk: 'Link je kopiran', shTxt: 'Barbershop 30, muški frizer u ulici Mostná 30 u Nitri.' },
  pl: { pH: 'Przypomnij sobie o kolejnym strzyżeniu', pU: 'Dodamy przypomnienie do kalendarza, żebyś zapisał się na czas. To nie jest rezerwacja.', pT: ['za 3 tygodnie', 'za 4 tygodnie', 'za 6 tygodni'], kedy: 'Kiedy przypomnieć', pKedy: 'Przypomnienie {datum} o 10:00', pAdd: 'Dodaj do kalendarza', pG: 'Kalendarz Google', eSum: 'Umów się na strzyżenie', eDesc: 'Przypomnienie, nie rezerwacja. Umów się online lub zadzwoń.', zd: 'Wyślij znajomemu', zdOk: 'Link skopiowany', shTxt: 'Barbershop 30, męski fryzjer przy Mostná 30 w Nitrze.' },
  de: { pH: 'Erinnerung an den nächsten Haarschnitt', pU: 'Wir legen dir eine Erinnerung in den Kalender, damit du rechtzeitig buchst. Das ist keine Buchung.', pT: ['in 3 Wochen', 'in 4 Wochen', 'in 6 Wochen'], kedy: 'Wann erinnern', pKedy: 'Erinnerung am {datum} um 10:00', pAdd: 'Zum Kalender hinzufügen', pG: 'Google Kalender', eSum: 'Haarschnitt buchen', eDesc: 'Erinnerung, keine Buchung. Online buchen oder anrufen.', zd: 'An Freunde senden', zdOk: 'Link kopiert', shTxt: 'Barbershop 30, Herrenfriseur in der Mostná 30 in Nitra.' },
  cs: { pH: 'Připomeň si další střih', pU: 'Přidáme ti připomínku do kalendáře, ať se objednáš včas. Není to rezervace.', pT: ['za 3 týdny', 'za 4 týdny', 'za 6 týdnů'], kedy: 'Kdy připomenout', pKedy: 'Připomínka {datum} v 10:00', pAdd: 'Přidat do kalendáře', pG: 'Google Kalendář', eSum: 'Objednej se na střih', eDesc: 'Připomínka, ne rezervace. Objednej se online nebo zavolej.', zd: 'Pošli kamarádovi', zdOk: 'Odkaz je zkopírovaný', shTxt: 'Barbershop 30, pánské holičství na Mostné 30 v Nitře.' },
};
const tp = () => { const l = (html.lang || 'sk').slice(0, 2).toLowerCase(); return TP[l] || TP.sk; };
const REZ = 'https://www.barbershop30.sk/rezervacia', TEL = '0951 267 203', ADRESA = 'Barbershop 30, Mostná 30, 949 01 Nitra';
export const TYZDNE = [3, 4, 6];

/* deň pripomienky: o t týždňov o 10:00 miestneho času, nedeľa (zatvorené) sa posunie na pondelok */
export function denPripomienky(t, od = new Date()) {
  const d = new Date(od.getFullYear(), od.getMonth(), od.getDate() + 7 * t, 10, 0, 0);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}
const dvoj = (n) => String(n).padStart(2, '0');
const lok = (d) => `${d.getFullYear()}${dvoj(d.getMonth() + 1)}${dvoj(d.getDate())}T${dvoj(d.getHours())}${dvoj(d.getMinutes())}00`;
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
/* RFC 5545 3.1: riadok najviac 75 bajtov, pokračovanie začína medzerou (znak sa nikdy nerozdelí) */
function zloz(r) {
  const enc = new TextEncoder(), casti = [];
  let akt = '', dlz = 0, max = 75;
  for (const ch of r) { const b = enc.encode(ch).length; if (dlz + b > max) { casti.push(akt); akt = ''; dlz = 0; max = 74; } akt += ch; dlz += b; }
  casti.push(akt);
  return casti.join('\r\n ');
}
/* udalosť pripomienky (15 minút, upozornenie v jej začiatku) v miestnom čase telefónu */
export function ics(d, L = TP.sk, teraz = new Date()) {
  const k = new Date(d.getTime() + 15 * 60000);
  const stamp = teraz.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const uid = `${lok(d)}-${Math.random().toString(36).slice(2, 10)}@barbershop30.sk`;
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Barbershop 30//Pripomienka//SK', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp}`, `DTSTART:${lok(d)}`, `DTEND:${lok(k)}`,
    `SUMMARY:${esc(`${L.eSum} · Barbershop 30`)}`, `DESCRIPTION:${esc(`${L.eDesc}\n${REZ}\n${TEL}`)}`, `LOCATION:${esc(ADRESA)}`, `URL:${REZ}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(L.eSum)}`, 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].map(zloz).join('\r\n') + '\r\n';
}
const google = (d, L) => {
  const k = new Date(d.getTime() + 15 * 60000);
  const q = new URLSearchParams({ action: 'TEMPLATE', text: `${L.eSum} · Barbershop 30`, dates: `${lok(d)}/${lok(k)}`, ctz: 'Europe/Bratislava', details: `${L.eDesc}\n${REZ}\n${TEL}`, location: ADRESA });
  return `https://calendar.google.com/calendar/render?${q}`;
};

function el(tag, attrs = {}, deti = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== false && v !== undefined) e.setAttribute(k, v === true ? '' : v);
  for (const d of deti) if (d != null) e.append(d);
  return e;
}

/* Vizitka (obe strany) podľa tej, ktorú prevádzka rozdáva. */
export function vizitka() {
  const kruh = () => el('div', { class: 'viz-kruh' }, [el('img', { src: new URL('img/logo-30-barbershop.webp', import.meta.url).href, alt: '', width: '480', height: '429', loading: 'lazy', decoding: 'async' })]);
  const pred = el('div', { class: 'viz-strana viz-pred' }, [
    el('div', { class: 'viz-pruhy', 'aria-hidden': 'true' }), kruh(),
    el('div', { class: 'viz-kontakt' }, [
      el('p', { class: 'viz-tel' }, ['0951 267 203']),
      el('p', {}, ['info@barbershop30.sk']),
      el('p', {}, ['Mostná 30, 949 01 Nitra']),
      el('p', {}, ['www.barbershop30.sk']),
    ]),
  ]);
  const zad = el('div', { class: 'viz-strana viz-zad' }, [el('div', { class: 'viz-pruhy', 'aria-hidden': 'true' }), kruh()]);
  return [pred, zad];
}

function kartaUlozena() {
  try { const u = localStorage.getItem(K_KARTA); return u && /^https?:\/\/[^\s]+\/karta\/\?k=[A-Za-z0-9_-]{22}$/.test(u) ? u : ''; } catch (e) { return ''; }
}

export function spusti(kontakt) {
  const ukazka = new URLSearchParams(location.search).get('vernost') === 'ukazka';
  const zapnuta = !!document.querySelector('script[data-prevadzka="barbershop"][data-zapnute]');
  const vernost = zapnuta || ukazka || !!kartaUlozena();
  const css = el('link', { rel: 'stylesheet', href: new URL('karty.css', import.meta.url).href });

  const [pred, zad] = vizitka();
  const figPred = el('figure', { class: 'viz', lang: 'sk' }, [pred]);
  const figZad = el('figure', { class: 'viz', lang: 'sk' }, [zad]);
  const vcf = el('a', { class: 'btn btn-secondary', href: new URL('barbershop30.vcf', import.meta.url).href });
  const vEy = el('p', { class: 'eyebrow' }), vH = el('h3', { class: 'h3', id: 'h-vizitka' });

  // Pošli kamarátovi: zdieľanie telefónu, inak skopíruje odkaz (kanonická adresa stránky, bez parametrov)
  const zd = el('button', { type: 'button', class: 'btn btn-secondary karty-zdielaj' });
  const zdStav = el('p', { class: 'karty-stav', 'aria-live': 'polite' });
  zd.hidden = !navigator.share && !(navigator.clipboard && window.isSecureContext);
  zd.addEventListener('click', async () => {
    const L = tp(), url = (document.querySelector('link[rel="canonical"]') || {}).href || location.href.split(/[?#]/)[0];
    if (navigator.share) { try { await navigator.share({ title: 'Barbershop 30', text: L.shTxt, url }); } catch (e) { /* zdieľanie zrušené */ } return; }
    try { await navigator.clipboard.writeText(url); zdStav.textContent = L.zdOk; setTimeout(() => { zdStav.textContent = ''; }, 4000); } catch (e) { /* schránka nedostupná */ }
  });

  // Pripomeň si ďalší strih: voľba týždňov, dátum a dve cesty do kalendára (.ics a Google Kalendár)
  const pH = el('h4', { class: 'karty-h4', id: 'h-pripomienka' }), pU = el('p', { class: 'karty-text' });
  const volby = el('div', { class: 'pr-volby', role: 'group' });
  const tlV = TYZDNE.map((t) => el('button', { type: 'button', class: 'pr-volba', 'data-t': String(t), 'aria-pressed': String(t === 4) }));
  volby.append(...tlV);
  const pKedy = el('p', { class: 'pr-kedy' });
  const pAdd = el('a', { class: 'btn btn-secondary', download: 'barbershop30-pripomienka.ics' });
  const pG = el('a', { class: 'link-arrow', target: '_blank', rel: 'noopener' });
  let tyz = 4;
  const obnov = () => {
    const L = tp(), d = denPripomienky(tyz);
    pKedy.textContent = L.pKedy.replace('{datum}', d.toLocaleDateString(/^en/.test(html.lang) ? 'en-GB' : html.lang || 'sk', { weekday: 'long', day: 'numeric', month: 'long' }));
    pAdd.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics(d, L));
    pG.href = google(d, L);
  };
  volby.addEventListener('click', (e) => {
    const b = e.target.closest('.pr-volba'); if (!b) return;
    tyz = Number(b.dataset.t); tlV.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); obnov();
  });
  const castP = el('div', { class: 'karty-pripomienka', role: 'group', 'aria-labelledby': 'h-pripomienka' }, [
    pH, pU, volby, pKedy, el('div', { class: 'cluster karty-akcie' }, [pAdd, pG])]);

  const castV = el('section', { class: 'karty-vizitka', 'aria-labelledby': 'h-vizitka' }, [
    vEy, vH, el('div', { class: 'viz-par' }, [figPred, figZad]), el('div', { class: 'cluster karty-akcie' }, [vcf, zd]), zdStav, castP]);

  const kEy = el('p', { class: 'eyebrow' }), kH = el('h3', { class: 'h3', id: 'h-vernost' }), kU = el('p', { class: 'karty-text' });
  const kMeno = el('span', { class: 'vk-meno' }), kBody = el('span');
  const kroky = el('ol', { class: 'vk-kroky' }, [el('li'), el('li'), el('li')]);
  const tl = el('a', { class: 'btn btn-primary', href: new URL('../karta/', import.meta.url).href, 'data-vernost-karta': ukazka && !zapnuta && !kartaUlozena() ? null : true });
  if (ukazka && !zapnuta && !kartaUlozena()) { tl.setAttribute('aria-disabled', 'true'); tl.removeAttribute('href'); tl.classList.add('je-ukazka'); }
  const castK = vernost ? el('section', { class: 'karty-vernost', 'aria-labelledby': 'h-vernost' }, [
    kEy, kH,
    el('div', { class: 'vk-obal', 'aria-hidden': 'true' }, [el('div', { class: 'vk' }, [
      el('p', { class: 'vk-hore' }, [el('strong', {}, ['Barbershop 30']), el('span', { class: 'vk-typ' })]),
      el('p', { class: 'vk-body' }, [el('b', {}, ['0']), kBody]),
      el('p', { class: 'vk-dole' }, [kMeno]),
    ])]),
    kU, kroky, el('div', { class: 'karty-akcie' }, [tl]),
    ukazka && !zapnuta ? el('p', { class: 'karty-ukazka' }, ['Ukážka na kontrolu: prihláška sa zapne po nasadení s heslom recepcie.']) : null,
  ]) : null;

  const pas = el('div', { class: 'band band-karty' + (castK ? '' : ' bez-vernosti'), 'data-no-i18n': true }, [
    el('div', { class: 'container karty-grid' }, [castV, castK])]);

  const texty = () => {
    const L = tx();
    vEy.textContent = L.vEy; vH.textContent = L.vH;
    vcf.textContent = L.vcf;
    const P = tp();
    zd.textContent = P.zd; pH.textContent = P.pH; pU.textContent = P.pU;
    volby.setAttribute('aria-label', P.kedy); tlV.forEach((b, i) => { b.textContent = P.pT[i]; });
    pAdd.textContent = P.pAdd; pG.textContent = P.pG + ' '; pG.append(el('span', { 'aria-hidden': 'true' }, ['→']));
    obnov();
    figPred.setAttribute('aria-label', L.pred); figZad.setAttribute('aria-label', L.zad);
    figPred.setAttribute('role', 'img'); figZad.setAttribute('role', 'img');
    if (!castK) return;
    kEy.textContent = L.kEy; kH.textContent = L.kH; kU.textContent = L.kU;
    castK.querySelector('.vk-typ').textContent = L.kEy;
    kMeno.textContent = L.meno; kBody.textContent = L.body;
    [L.k1, L.k2, L.k3].forEach((t, i) => { kroky.children[i].textContent = t; });
    tl.textContent = kartaUlozena() ? L.moja : L.chcem;
  };
  texty();
  new MutationObserver(texty).observe(html, { attributes: true, attributeFilter: ['lang'] });
  // pás sa vloží až so štýlom, aby sa neukázal nenaštýlovaný
  css.addEventListener('load', () => kontakt.after(pas), { once: true });
  document.head.append(css);
}
