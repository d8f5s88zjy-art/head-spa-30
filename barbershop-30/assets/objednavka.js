/*
 * BARBERSHOP 30 – objednávka v štýle webu: služba → barber → deň a voľný čas z rezervačného kalendára.
 * Voľné časy číta server na www.headspa30.sk (asistent/api.php, lib/kalendar.php) z rezervačného systému
 * Barbershopu 30 ako ho vidí návštevník vo formulári; z odpovede idú von len časy HH:MM, nikdy mená zákazníkov.
 * Okno termín nerezervuje: na konci ukáže výber s poznámkou, že je predbežný, a vedie do rezervačného systému
 * (www.barbershop30.sk/rezervacia) alebo na telefón recepcie. Úspech sa tu nikdy neukazuje, lebo ho nič nepotvrdilo.
 *
 * Jediná cesta k objednaniu (Lajko 9. 11. 2026, bod 7): každý odkaz Objednať sa na stránke (lišta, úvod, karty, tím,
 * cenník, kontakt, spodná lišta telefónu, odpovede Barbera) otvorí toto okno – zachytí ho app.js (časť 7b4) a zavolá
 * otvorOdkaz(); ?objednat=1 (presmerovanie z rezervacia.html, 404, odkazy z Instagramu s ?sluzba= a ?barber=) ho
 * otvorí po načítaní (otvorZAdresy). Odkazy v HTML ostávajú na rezervačný systém: bez skriptu vedú tam.
 * Voľné časy sú len so serverom s pripojeným kalendárom (data-objednavka na <html> z nasadenia so súhlasom prevádzky,
 * pages.yml; lokálne ?objednavka=<adresa>). Stav servera sa zisťuje hneď pri spustení, najviac 8 s; okno nikdy nie
 * je slepá ulička: kým sa zisťuje, služba sa dá vybrať a krok 2 ukáže „Pozerám do kalendára…“; bez servera (náhľad,
 * statický hosting), s nepripojeným kalendárom, pri chybe alebo bez internetu ukáže „Objednávka cez web teraz nejde –
 * zavolaj“ s tlačidlom Zavolať, otváracími hodinami z pätičky stránky a Skúsiť znova (a tichý odkaz na rezervačný
 * systém). Chyba uprostred cesty ukáže to isté pri kroku (Skúsiť znova, Zavolať, Dokončiť v rezervačnom systéme).
 * Ukážka na kontrolu (?objednavka=ukazka, aj mimo localhost): bez servera, s barbermi z tímu na stránke a ukážkovými
 * časmi, výrazne označená; nič sa nerezervuje a ostrý web ju nikdy nezapne sám.
 * Služby, časy a ceny berie z cenníka na stránke (a.price-cta[data-sluzba]), takže sú vždy rovnaké ako na webe
 * a v jazyku stránky. Texty okna sú v 8 jazykoch tu (T).
 */
const html = document.documentElement;
const REZERVACIA = 'https://www.barbershop30.sk/rezervacia';
const TEL = 'tel:+421951267203';
const TTL = 110e3;                                     // voľné časy server drží 2 minúty, okno o chvíľu menej

const T = {
  sk: { kicker: 'Objednávka', krok: 'Krok {n} zo 4', h1: 'Čo si dáš?', h2: 'Kedy a u koho?', h3: 'Kedy?', h4: 'Tvoj výber', spat: 'Späť', zavriet: 'Zavrieť', zmenit: 'Zmeniť', nezalezi: 'Nezáleží', nezaleziP: 'Prvý voľný z tímu', nacitavam: 'Pozerám do kalendára…', zatvorene: 'zatvorené', dni: 'Dni', casy: 'Voľné časy', overene: 'Podľa kalendára o {t}. Čas je predbežný, kým ho nepotvrdíš.', ziadny: 'V tento deň je už plno. Skús iný deň.', zatvorenyDen: 'V tento deň je zatvorené.', mimo: 'Na tento deň sa online objednať nedá.', chyba: 'Voľné časy teraz neviem overiť. Zavolaj nám, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme.', nikto: 'Túto službu teraz online nik neponúka. Zavolaj nám a nájdeme termín.', predbezne: 'Termín ešte nie je rezervovaný.', predT: 'Dokonči ho v rezervačnom systéme alebo nám zavolaj a potvrdíme ti ho.', dokoncit: 'Dokončiť v rezervačnom systéme', zavolat: 'Zavolať a potvrdiť termín', o: 'o {t}', rychlo: 'Najbližšie voľné', rychloP: 'U prvého voľného barbera z tímu. Ťukni na čas, ktorý ti sedí.', alebo: 'Alebo si vyber svojho barbera', praca: 'Ukážky práce', tel: 'Radšej zavoláš? 0951 267 203', lSluzba: 'Služba', lBarber: 'Barber', lTermin: 'Termín', nepracuje: 'nepracuje', nepracujeDen: '{b} v tento deň nepracuje.', inyBarber: 'Iný barber', nejde: 'Objednávka cez web teraz nejde – zavolaj.', nejdeT: 'V pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme.', offline: 'Si bez internetu. Keď sa pripojíš, skús znova.', hodiny: 'Otváracie hodiny', znova: 'Skúsiť znova', system: 'Skúsiť rezervačný systém (nová karta)', volat: 'Zavolať 0951 267 203' },
  en: { kicker: 'Booking', krok: 'Step {n} of 4', h1: 'What will it be?', h2: 'When and with whom?', h3: 'When?', h4: 'Your choice', spat: 'Back', zavriet: 'Close', zmenit: 'Change', nezalezi: 'Anyone', nezaleziP: 'First free barber', nacitavam: 'Checking the calendar…', zatvorene: 'closed', dni: 'Days', casy: 'Free times', overene: 'From the calendar at {t}. The time is provisional until you confirm it.', ziadny: 'This day is fully booked. Try another day.', zatvorenyDen: 'We are closed on this day.', mimo: 'This day cannot be booked online.', chyba: 'I can’t check free times right now. Call us, on weekdays from 9:00 to 19:00 we always pick up.', nikto: 'Nobody offers this service online right now. Call us and we will find a time.', predbezne: 'The time is not booked yet.', predT: 'Finish it in the booking system or call us and we will confirm it.', dokoncit: 'Finish in the booking system', zavolat: 'Call to confirm your time', o: 'at {t}', rychlo: 'Next free times', rychloP: 'With the first free barber from the team. Tap a time that suits you.', alebo: 'Or choose your barber', praca: 'Examples of work', tel: 'Rather call? 0951 267 203', lSluzba: 'Service', lBarber: 'Barber', lTermin: 'Time', nepracuje: 'day off', nepracujeDen: '{b} is not working on this day.', inyBarber: 'Another barber', nejde: 'Online booking isn’t working right now – call us.', nejdeT: 'On weekdays from 9:00 to 19:00 we always pick up.', offline: 'You’re offline. Once you’re connected, try again.', hodiny: 'Opening hours', znova: 'Try again', system: 'Try the booking system (new tab)', volat: 'Call 0951 267 203' },
  uk: { kicker: 'Бронювання', krok: 'Крок {n} з 4', h1: 'Що обираєш?', h2: 'Коли й у кого?', h3: 'Коли?', h4: 'Твій вибір', spat: 'Назад', zavriet: 'Закрити', zmenit: 'Змінити', nezalezi: 'Будь-хто', nezaleziP: 'Перший вільний з команди', nacitavam: 'Дивлюся в календар…', zatvorene: 'зачинено', dni: 'Дні', casy: 'Вільний час', overene: 'За календарем о {t}. Час попередній, доки ти його не підтвердиш.', ziadny: 'Цього дня вже все зайнято. Спробуй інший день.', zatvorenyDen: 'Цього дня зачинено.', mimo: 'На цей день онлайн записатися не можна.', chyba: 'Зараз не можу перевірити вільний час. Зателефонуй нам, у будні з 9:00 до 19:00 ми завжди відповімо.', nikto: 'Зараз цю послугу онлайн ніхто не пропонує. Зателефонуй, і ми знайдемо час.', predbezne: 'Час ще не заброньовано.', predT: 'Заверши бронювання в системі або зателефонуй, і ми його підтвердимо.', dokoncit: 'Завершити в системі бронювання', zavolat: 'Зателефонувати й підтвердити час', o: 'о {t}', rychlo: 'Найближчий вільний час', rychloP: 'У першого вільного барбера з команди. Торкнися часу, який тобі підходить.', alebo: 'Або обери свого барбера', praca: 'Приклади робіт', tel: 'Краще зателефонувати? 0951 267 203', lSluzba: 'Послуга', lBarber: 'Барбер', lTermin: 'Час', nepracuje: 'вихідний', nepracujeDen: '{b} цього дня не працює.', inyBarber: 'Інший барбер', nejde: 'Онлайн-бронювання зараз не працює – зателефонуй.', nejdeT: 'У будні з 9:00 до 19:00 ми завжди відповімо.', offline: 'Немає інтернету. Коли підключишся, спробуй ще раз.', hodiny: 'Години роботи', znova: 'Спробувати ще раз', system: 'Спробувати систему бронювання (нова вкладка)', volat: 'Зателефонувати 0951 267 203' },
  hu: { kicker: 'Foglalás', krok: '{n}. lépés a 4-ből', h1: 'Mit kérsz?', h2: 'Mikor és kinél?', h3: 'Mikor?', h4: 'A választásod', spat: 'Vissza', zavriet: 'Bezárás', zmenit: 'Módosítás', nezalezi: 'Mindegy', nezaleziP: 'Az első szabad a csapatból', nacitavam: 'Nézem a naptárat…', zatvorene: 'zárva', dni: 'Napok', casy: 'Szabad időpontok', overene: 'A naptár szerint {t}-kor. Az időpont előzetes, amíg meg nem erősíted.', ziadny: 'Ez a nap már betelt. Próbálj másik napot.', zatvorenyDen: 'Ezen a napon zárva vagyunk.', mimo: 'Erre a napra online nem lehet foglalni.', chyba: 'A szabad időpontokat most nem tudom ellenőrizni. Hívj minket, hétköznap 9:00 és 19:00 között mindig felvesszük.', nikto: 'Ezt a szolgáltatást most senki sem kínálja online. Hívj minket, és találunk időpontot.', predbezne: 'Az időpont még nincs lefoglalva.', predT: 'Fejezd be a foglalási rendszerben, vagy hívj minket, és megerősítjük.', dokoncit: 'Befejezés a foglalási rendszerben', zavolat: 'Hívás és időpont megerősítése', o: '{t}-kor', rychlo: 'Legközelebbi szabad időpontok', rychloP: 'Az első szabad barbernél a csapatból. Koppints a neked megfelelő időpontra.', alebo: 'Vagy válaszd ki a barberedet', praca: 'Munkáink', tel: 'Inkább telefonálnál? 0951 267 203', lSluzba: 'Szolgáltatás', lBarber: 'Barber', lTermin: 'Időpont', nepracuje: 'szabadnap', nepracujeDen: '{b} ezen a napon nem dolgozik.', inyBarber: 'Másik barber', nejde: 'Az online foglalás most nem működik – hívj minket.', nejdeT: 'Hétköznap 9:00 és 19:00 között mindig felvesszük.', offline: 'Nincs internetkapcsolat. Ha újra csatlakoztál, próbáld újra.', hodiny: 'Nyitvatartás', znova: 'Újrapróbálás', system: 'Foglalási rendszer kipróbálása (új lapon)', volat: 'Hívás: 0951 267 203' },
  sr: { kicker: 'Zakazivanje', krok: 'Korak {n} od 4', h1: 'Šta želiš?', h2: 'Kada i kod koga?', h3: 'Kada?', h4: 'Tvoj izbor', spat: 'Nazad', zavriet: 'Zatvori', zmenit: 'Promeni', nezalezi: 'Svejedno', nezaleziP: 'Prvi slobodan iz tima', nacitavam: 'Gledam u kalendar…', zatvorene: 'zatvoreno', dni: 'Dani', casy: 'Slobodni termini', overene: 'Prema kalendaru u {t}. Termin je privremen dok ga ne potvrdiš.', ziadny: 'Taj dan je već pun. Probaj drugi dan.', zatvorenyDen: 'Tog dana je zatvoreno.', mimo: 'Za taj dan ne može se zakazati onlajn.', chyba: 'Slobodne termine sada ne mogu da proverim. Pozovi nas, radnim danima od 9:00 do 19:00 uvek se javljamo.', nikto: 'Ovu uslugu sada niko ne nudi onlajn. Pozovi nas i naći ćemo termin.', predbezne: 'Termin još nije rezervisan.', predT: 'Završi ga u sistemu za rezervacije ili nas pozovi i potvrdićemo ga.', dokoncit: 'Završi u sistemu za rezervacije', zavolat: 'Pozovi i potvrdi termin', o: 'u {t}', rychlo: 'Najbliži slobodni termini', rychloP: 'Kod prvog slobodnog berberina iz tima. Dodirni vreme koje ti odgovara.', alebo: 'Ili izaberi svog berberina', praca: 'Primeri rada', tel: 'Radije zoveš? 0951 267 203', lSluzba: 'Usluga', lBarber: 'Berberin', lTermin: 'Termin', nepracuje: 'ne radi', nepracujeDen: '{b} tog dana ne radi.', inyBarber: 'Drugi berberin', nejde: 'Onlajn zakazivanje sada ne radi – pozovi nas.', nejdeT: 'Radnim danima od 9:00 do 19:00 uvek se javljamo.', offline: 'Nisi povezan na internet. Kad se povežeš, pokušaj ponovo.', hodiny: 'Radno vreme', znova: 'Pokušaj ponovo', system: 'Probaj sistem za rezervacije (nova kartica)', volat: 'Pozovi 0951 267 203' },
  pl: { kicker: 'Rezerwacja', krok: 'Krok {n} z 4', h1: 'Co wybierasz?', h2: 'Kiedy i u kogo?', h3: 'Kiedy?', h4: 'Twój wybór', spat: 'Wstecz', zavriet: 'Zamknij', zmenit: 'Zmień', nezalezi: 'Obojętnie', nezaleziP: 'Pierwszy wolny z zespołu', nacitavam: 'Sprawdzam kalendarz…', zatvorene: 'zamknięte', dni: 'Dni', casy: 'Wolne godziny', overene: 'Według kalendarza o {t}. Termin jest wstępny, dopóki go nie potwierdzisz.', ziadny: 'Ten dzień jest już pełny. Spróbuj inny dzień.', zatvorenyDen: 'Tego dnia jest zamknięte.', mimo: 'Na ten dzień nie można zarezerwować online.', chyba: 'Nie mogę teraz sprawdzić wolnych godzin. Zadzwoń, w dni robocze od 9:00 do 19:00 zawsze odbieramy.', nikto: 'Tej usługi nikt teraz nie oferuje online. Zadzwoń, a znajdziemy termin.', predbezne: 'Termin nie jest jeszcze zarezerwowany.', predT: 'Dokończ w systemie rezerwacji albo zadzwoń, a go potwierdzimy.', dokoncit: 'Dokończ w systemie rezerwacji', zavolat: 'Zadzwoń i potwierdź termin', o: 'o {t}', rychlo: 'Najbliższe wolne terminy', rychloP: 'U pierwszego wolnego barbera z zespołu. Stuknij godzinę, która ci pasuje.', alebo: 'Albo wybierz swojego barbera', praca: 'Przykłady pracy', tel: 'Wolisz zadzwonić? 0951 267 203', lSluzba: 'Usługa', lBarber: 'Barber', lTermin: 'Termin', nepracuje: 'nie pracuje', nepracujeDen: '{b} tego dnia nie pracuje.', inyBarber: 'Inny barber', nejde: 'Rezerwacja online teraz nie działa – zadzwoń.', nejdeT: 'W dni robocze od 9:00 do 19:00 zawsze odbieramy.', offline: 'Brak internetu. Gdy się połączysz, spróbuj ponownie.', hodiny: 'Godziny otwarcia', znova: 'Spróbuj ponownie', system: 'Spróbuj systemu rezerwacji (nowa karta)', volat: 'Zadzwoń 0951 267 203' },
  de: { kicker: 'Buchung', krok: 'Schritt {n} von 4', h1: 'Was darf es sein?', h2: 'Wann und bei wem?', h3: 'Wann?', h4: 'Deine Auswahl', spat: 'Zurück', zavriet: 'Schließen', zmenit: 'Ändern', nezalezi: 'Egal', nezaleziP: 'Der Erste, der frei ist', nacitavam: 'Ich schaue in den Kalender…', zatvorene: 'geschlossen', dni: 'Tage', casy: 'Freie Zeiten', overene: 'Laut Kalender um {t}. Der Termin ist vorläufig, bis du ihn bestätigst.', ziadny: 'Dieser Tag ist schon ausgebucht. Versuch einen anderen Tag.', zatvorenyDen: 'An diesem Tag ist geschlossen.', mimo: 'Dieser Tag ist online nicht buchbar.', chyba: 'Freie Zeiten kann ich gerade nicht prüfen. Ruf uns an, werktags von 9:00 bis 19:00 gehen wir immer ran.', nikto: 'Diese Leistung bietet gerade niemand online an. Ruf uns an, wir finden einen Termin.', predbezne: 'Der Termin ist noch nicht gebucht.', predT: 'Schließe ihn im Buchungssystem ab oder ruf uns an, wir bestätigen ihn.', dokoncit: 'Im Buchungssystem abschließen', zavolat: 'Anrufen und Termin bestätigen', o: 'um {t}', rychlo: 'Nächste freie Zeiten', rychloP: 'Beim ersten freien Barber aus dem Team. Tipp auf die Zeit, die dir passt.', alebo: 'Oder wähl deinen Barber', praca: 'Arbeitsbeispiele', tel: 'Lieber anrufen? 0951 267 203', lSluzba: 'Leistung', lBarber: 'Barber', lTermin: 'Termin', nepracuje: 'frei', nepracujeDen: '{b} arbeitet an diesem Tag nicht.', inyBarber: 'Anderer Barber', nejde: 'Online-Buchung geht gerade nicht – ruf uns an.', nejdeT: 'Werktags von 9:00 bis 19:00 gehen wir immer ran.', offline: 'Du bist offline. Sobald du verbunden bist, versuch es noch einmal.', hodiny: 'Öffnungszeiten', znova: 'Noch einmal versuchen', system: 'Buchungssystem versuchen (neuer Tab)', volat: '0951 267 203 anrufen' },
  cs: { kicker: 'Objednávka', krok: 'Krok {n} ze 4', h1: 'Co si dáš?', h2: 'Kdy a u koho?', h3: 'Kdy?', h4: 'Tvůj výběr', spat: 'Zpět', zavriet: 'Zavřít', zmenit: 'Změnit', nezalezi: 'Nezáleží', nezaleziP: 'První volný z týmu', nacitavam: 'Dívám se do kalendáře…', zatvorene: 'zavřeno', dni: 'Dny', casy: 'Volné časy', overene: 'Podle kalendáře v {t}. Čas je předběžný, dokud ho nepotvrdíš.', ziadny: 'V tento den je už plno. Zkus jiný den.', zatvorenyDen: 'V tento den je zavřeno.', mimo: 'Na tento den se online objednat nedá.', chyba: 'Volné časy teď neumím ověřit. Zavolej nám, ve všední dny od 9:00 do 19:00 telefon vždy zvedneme.', nikto: 'Tuto službu teď online nikdo nenabízí. Zavolej nám a najdeme termín.', predbezne: 'Termín ještě není rezervovaný.', predT: 'Dokonči ho v rezervačním systému nebo nám zavolej a potvrdíme ti ho.', dokoncit: 'Dokončit v rezervačním systému', zavolat: 'Zavolat a potvrdit termín', o: 'v {t}', rychlo: 'Nejbližší volné časy', rychloP: 'U prvního volného barbera z týmu. Ťukni na čas, který ti sedí.', alebo: 'Nebo si vyber svého barbera', praca: 'Ukázky práce', tel: 'Raději zavoláš? 0951 267 203', lSluzba: 'Služba', lBarber: 'Barber', lTermin: 'Termín', nepracuje: 'nepracuje', nepracujeDen: '{b} v tento den nepracuje.', inyBarber: 'Jiný barber', nejde: 'Objednávka přes web teď nejde – zavolej.', nejdeT: 'Ve všední dny od 9:00 do 19:00 telefon vždy zvedneme.', offline: 'Jsi offline. Až se připojíš, zkus to znovu.', hodiny: 'Otevírací doba', znova: 'Zkusit znovu', system: 'Zkusit rezervační systém (nová karta)', volat: 'Zavolat 0951 267 203' },
};
const LOKALY = { sk: 'sk-SK', en: 'en-GB', uk: 'uk-UA', hu: 'hu-HU', sr: 'sr-Latn-RS', pl: 'pl-PL', de: 'de-DE', cs: 'cs-CZ' };
const jazyk = () => { const l = (html.lang || 'sk').slice(0, 2).toLowerCase(); return T[l] ? l : 'sk'; };
const tx = () => T[jazyk()];
const fill = (s, v) => s.replace(/\{(\w)\}/g, (_, k) => v[k] ?? '');
// rovnaké porovnanie mien ako na serveri (Adrián = Adrian)
const bez = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const KTOKOLVEK = 'ktokoľvek';
const DNI = ['Ne', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So'];  // skratky pravidiel kalendára podľa Date.getDay()

function el(tag, attrs = {}, deti = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== false && v !== undefined) e.setAttribute(k, v === true ? '' : v);
  for (const d of deti) if (d != null) e.append(d);
  return e;
}

let API = '', dlg = null, koren = null, pripojene = null, stavP = null, bezFokusu = false;
const LIMIT = 8000;                                    // najdlhšie čakanie na server (stav aj voľné časy)
const jeServer = () => /^https?:\/\//.test(API);
const s = { krok: 1, sluzba: null, barber: null, chce: null, datum: null, cas: null, dni: null, kresliDni: null };
const pamat = new Map();                               // odpovede servera (barberi a dni dlhšie, časy 110 s)

/* služby z cenníka na stránke: id, názov, trvanie a cena v aktuálnom jazyku */
function sluzby() {
  return [...document.querySelectorAll('a.price-cta[data-sluzba]')].map((a) => {
    const r = a.closest('.price-row');
    const t = (q) => (r && r.querySelector(q) ? r.querySelector(q).textContent.trim() : '');
    const g = a.closest('.price-group'), h = g && g.querySelector('.price-group-title');
    return { id: Number(a.dataset.sluzba), nazov: t('.price-name'), cas: t('.price-time'), cena: t('.price-amount'),
      skup: g ? g.getAttribute('aria-labelledby') : '', skupNazov: h ? h.textContent.trim() : '' };
  }).filter((x) => x.id && x.nazov);
}
/* barber z tímu na stránke (portrét a meno tak, ako ich píše web) */
function zTimu(meno) {
  for (const k of document.querySelectorAll('.team-card')) {
    const n = k.querySelector('.team-name');
    if (n && bez(n.textContent) === bez(meno)) {
      // najmenší portrét (prvý v srcset webp), nie ten, ktorý stránka možno ešte len lenivo načíta
      const src = k.querySelector('source[type="image/webp"]'), img = k.querySelector('img');
      const foto = (src && src.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0]) || (img && (img.currentSrc || img.src)) || '';
      return { meno: n.textContent.trim(), foto: foto && new URL(foto, document.baseURI).href };
    }
  }
  // rezervačná stránka nemá tím: portrét podľa mena (assets/img/tim-<meno>-480.webp), keď chýba, ostane iniciála
  return { meno, foto: new URL(`img/tim-${bez(meno).replace(/[^a-z0-9]+/g, '-')}-480.webp`, import.meta.url).href, odhad: true };
}
const menoBarbera = (m) => (m === KTOKOLVEK ? tx().nezalezi : zTimu(m).meno);

/* skupiny služieb: skutočná fotka prevádzky (nie výsledok strihu), výrezy 16 : 6 ako na rezervačnej stránke
   (assets/img/rez/, source/tools/rez-fotky.py) */
const FOTO_SKUP = { 'g-strih': 'rez-strih', 'g-brada': 'rez-brada', 'g-balicky': 'rez-balicky', 'g-doplnky': 'rez-doplnky' };
const img = (cesta) => new URL(`img/${cesta}`, import.meta.url).href;
function fotoSkup(skup) {
  const f = FOTO_SKUP[skup];
  if (!f) return null;
  const sada = (p) => `${img(`rez/${f}-760.${p}`)} 760w, ${img(`rez/${f}-1080.${p}`)} 1080w`;
  return el('picture', { class: 'obj-skup-foto', 'aria-hidden': 'true' }, [
    el('source', { type: 'image/avif', srcset: sada('avif'), sizes: '(max-width: 640px) 100vw, 40rem' }),
    el('img', { src: img(`rez/${f}-760.webp`), srcset: sada('webp'), sizes: '(max-width: 640px) 100vw, 40rem', alt: '', width: '760', height: '285', loading: 'lazy', decoding: 'async' }),
  ]);
}
/* fotky práce barberov (assets/praca.json, vyrobí source/tools/praca.py z fotiek od barberov); bez súboru nič */
let praca = null;
const nacitajPracu = () => praca || (praca = fetch(new URL('praca.json', import.meta.url).href, { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : {})).catch(() => ({})));
const pracaBarbera = (j, meno) => ((j && j.barberi) || {})[bez(meno).replace(/[^a-z0-9]+/g, '-')] || [];

/* ukážka na kontrolu: barberi z tímu na stránke, ukážkové časy (dnes len budúce, sobota do 14:00, nedeľa zatvorené) */
const UKAZKA = 'ukazka';
const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
function ukazka(a, par) {
  const tim = [...new Set([...document.querySelectorAll('.team-card .team-name')].map((n) => n.textContent.trim()))];
  const dnes = new Date(), teraz = hhmm(dnes);
  if (a === 'barberi') return { ok: true, stav: 'ok', barberi: tim.length ? tim : ['Nikolas', 'Adrian'] };
  if (a === 'dni') return { ok: true, stav: 'ok', barber: par.barber, dnes: iso(dnes), od: iso(dnes), do: iso(new Date(+dnes + 30 * 864e5)), zatvorene: ['Ne'], sviatky: [], volno: [] };
  if (a === 'terminy') {
    const d = zIso(par.datum), k = (d.getDate() * 7 + String(par.barber).length) % 3;
    let casy = ['09:00', '09:40', '10:20', '11:40', '13:20', '14:00', '15:20', '16:40', '17:40'].filter((_, i) => (i + k) % 3 !== 0);
    if (d.getDay() === 6) casy = casy.filter((c) => c < '14:00');
    if (par.datum === iso(dnes)) casy = casy.filter((c) => c > teraz);
    return casy.length ? { ok: true, stav: 'overene', datum: par.datum, overene_o: teraz, casy } : { ok: true, stav: 'ziadny_volny', overene_o: teraz };
  }
  return { ok: true };
}
const overText = (L, t) => (API === UKAZKA ? 'Ukážkové časy, nie skutočné. Naostro tu budú voľné časy z kalendára.' : fill(L.overene, { t }));

async function daj(a, par, ttl = 36e5) {
  if (API === UKAZKA) { await new Promise((r) => setTimeout(r, 180)); return ukazka(a, par); }
  if (!jeServer()) throw new Error('bez servera');
  const q = new URLSearchParams({ a, ...par }).toString();
  const c = pamat.get(q);
  if (c && Date.now() - c.t < ttl) return c.v;
  const ctrl = new AbortController(), stop = setTimeout(() => ctrl.abort(), LIMIT);
  try {
    const r = await fetch(`${API}?${q}`, { credentials: 'omit', cache: 'no-store', signal: ctrl.signal });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.chyba || String(r.status));
    if (j.stav !== 'chyba') pamat.set(q, { t: Date.now(), v: j });
    return j;
  } finally { clearTimeout(stop); }
}

/* stav servera: pripojený kalendár (true), bez neho, bez servera, chyba či bez internetu (false), zisťuje sa (null);
   najviac LIMIT ms, potom false (okno ukáže „nejde – zavolaj“) */
function overStav() {
  pripojene = null;
  let p;
  if (API === UKAZKA) p = Promise.resolve(true);
  else if (!jeServer()) p = Promise.resolve(false);
  else {
    const ctrl = new AbortController(), stop = setTimeout(() => ctrl.abort(), LIMIT);
    p = fetch(`${API}?a=stav`, { credentials: 'omit', cache: 'no-store', signal: ctrl.signal }).then((r) => r.json())
      .then((j) => !!(j && j.ok && j.kalendar)).catch(() => false).finally(() => clearTimeout(stop));
  }
  return (stavP = p.then((v) => {
    pripojene = v;
    // okno je otvorené na výbere služby: hneď povie, že cez web to teraz nejde (krok 2 čaká na stav sám)
    if (!v && dlg && dlg.open && s.krok === 1) chod(0);
    return v;
  }));
}

/* ---------- okno ---------- */
let telo, nadpis, krokEl, spat, vyber, zivy, pruh;
function postav() {
  koren = el('dialog', { class: 'obj', 'aria-labelledby': 'obj-h' });
  // REZ-04: dvojklik na voľbu prepne krok a druhý klik by označil text nového kroku; ťahom sa dá označovať ďalej
  koren.addEventListener('mousedown', (e) => { if (e.detail > 1) e.preventDefault(); });
  koren.setAttribute('data-no-i18n', ''); koren.setAttribute('translate', 'no');
  spat = el('button', { class: 'obj-spat', type: 'button' });
  spat.addEventListener('click', () => chod(s.krok - 1));
  krokEl = el('p', { class: 'obj-kicker' });
  pruh = el('div', { class: 'obj-pruh', 'aria-hidden': 'true' }, [1, 2, 3, 4].map(() => el('i')));
  nadpis = el('h2', { class: 'obj-h', id: 'obj-h', tabindex: '-1' });
  vyber = el('div', { class: 'obj-vyber' });
  zivy = el('p', { class: 'obj-zivy', role: 'status', 'aria-live': 'polite' });
  telo = el('div', { class: 'obj-telo' });
  const tel = el('a', { class: 'obj-tel', href: TEL });
  const zavri = el('button', { class: 'obj-x', type: 'button' }, [el('span', { 'aria-hidden': 'true' }, ['×'])]);
  zavri.addEventListener('click', () => zatvor());
  const hlava = el('div', { class: 'obj-hlava' }, [spat, krokEl, zavri]);
  const ukazkaPas = API === UKAZKA ? el('p', { class: 'obj-ukazka-pas', role: 'note' }, ['Ukážka na kontrolu: barberi a voľné časy sú len na ukážku, nič sa nerezervuje.']) : null;
  koren.append(hlava, pruh, el('div', { class: 'obj-obsah' }, [ukazkaPas, nadpis, vyber, telo, zivy]), el('div', { class: 'obj-pata' }, [tel]));
  dlg = koren;
  dlg.addEventListener('close', () => {
    dlg.classList.remove('obj-zaviera');
    html.classList.remove('obj-otvorene');
    if (history.state && history.state.obj) history.back();
    // fokus späť na odkaz, ktorý okno otvoril (ak ešte je na stránke a nie je pod zavretým oknom)
    if (navrat && navrat.isConnected) navrat.focus({ preventScroll: true });
    navrat = null;
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) zatvor(); });
  // Esc (K2-2): okno zmizne hneď v najbližšej snímke (len krytie okna a clony, lacné), samotné zatvorenie s prepočtom
  // celej stránky (zrušenie inert) príde až po nej; vnorené okno s ukážkami práce sa zatvára samo
  dlg.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.isComposing || e.target.closest('dialog') !== dlg) return;
    e.preventDefault();
    dlg.classList.add('obj-zaviera');
    requestAnimationFrame(() => setTimeout(zatvor));
  });
  addEventListener('popstate', () => { if (dlg.open) dlg.close(); });
  // internet sa vrátil: okno s „nejde“ to skúsi samo
  addEventListener('online', () => { if (dlg.open && s.krok === 0) znova(); });
  document.body.append(dlg);
  // jazyk sa zmenil: texty aj názvy služieb z cenníka (preložené na stránke) nanovo
  new MutationObserver(() => { if (dlg.open) vykresli(false); }).observe(html, { attributes: true, attributeFilter: ['lang'] });
}

let navrat = null;
function otvor(pred = {}) {
  if (!dlg) postav();
  // otvorené z okna Barbera na telefóne: to robí zvyšok stránky inert, okno objednávky ide nad neho
  dlg.removeAttribute('inert');
  if (!dlg.open) navrat = document.activeElement !== document.body ? document.activeElement : null;
  Object.assign(s, { krok: 1, sluzba: null, barber: null, chce: null, datum: null, cas: null, dni: null }, pred);
  // server už povedal, že kalendár nie je (alebo nie je server): rovno „nejde – zavolaj“
  if (pripojene === false) s.krok = 0;
  // tlačidlo Späť v telefóne zatvorí okno, nie stránku
  if (!(history.state && history.state.obj)) history.pushState({ obj: true }, '');
  dlg.lang = html.lang || 'sk';
  // C4: krok sa nakreslí ešte v zatvorenom okne, showModal() potom prepočíta štýl stránky raz a fokus nadpisu už
  // nevynúti ďalší prepočet a rozloženie (predtým showModal, zápis kroku a hneď nadpis.focus)
  const nove = !dlg.open;
  bezFokusu = nove;
  if (s.krok === 0) chod(0); else if (s.sluzba) vyberSluzbu(s.sluzba); else chod(1);
  bezFokusu = false;
  if (nove) { dlg.showModal(); html.classList.add('obj-otvorene'); nadpis.focus({ preventScroll: true }); }
}
function zatvor() { if (dlg && dlg.open) dlg.close(); }

function chod(n) {
  s.krok = Math.max(0, Math.min(4, n));
  if (s.krok < 4) s.cas = null;
  if (s.krok < 3) { s.datum = null; s.dni = null; }
  vykresli(true);
}

function vykresli(zameraj) {
  const L = tx();
  koren.lang = html.lang || 'sk';
  spat.textContent = '← ' + L.spat;
  spat.hidden = s.krok <= 1;
  koren.querySelector('.obj-x').setAttribute('aria-label', L.zavriet);
  // krok 0 = „nejde – zavolaj“: bez čísla kroku a bez pruhu priebehu
  krokEl.textContent = s.krok ? L.kicker + ' · ' + fill(L.krok, { n: s.krok }) : L.kicker;
  pruh.hidden = !s.krok;
  [...pruh.children].forEach((i, k) => i.classList.toggle('je', k < s.krok));
  nadpis.textContent = [L.nejde, L.h1, L.h2, L.h3, L.h4][s.krok];
  koren.querySelector('.obj-tel').textContent = L.tel;
  zivy.textContent = '';
  // krok 4 (WEB-03, REZ-02 a): v okne je Dokončiť v päte, teda na očiach bez skrolu na každom telefóne; pri Späť zmizne.
  // Na stránke rezervacia.html päta nie je prilepená, tam ostane Dokončiť v obsahu nad Zavolať (krok4)
  const pata = koren.querySelector('.obj-pata');
  pata.hidden = !s.krok;                                // krok 0 má Zavolať v obsahu
  let hl = pata.querySelector('[data-obj-priamo]');
  if (s.krok === 4) {
    if (!hl) {
      hl = el('a', { class: 'btn btn-primary obj-pata-hl', href: REZERVACIA, target: '_blank', rel: 'noopener', 'data-obj-priamo': true });
      hl.addEventListener('click', otvoreneDoSystemu);
      pata.prepend(hl);
    }
    hl.textContent = L.dokoncit;
  } else if (hl) { hl.remove(); otvoreneVSysteme = false; }
  // doterajší výber: ťuknutím sa vrátiš na krok
  const sl = sluzby().find((x) => x.id === s.sluzba);
  const kusy = [];
  if (sl && s.krok > 1) kusy.push([sl.nazov, 1]);
  if (s.barber && s.krok > 2) kusy.push([menoBarbera(s.barber), 2]);
  if (s.datum && s.krok > 3) kusy.push([den(s.datum, true) + ' ' + fill(L.o, { t: s.cas }), 3]);
  vyber.replaceChildren(...kusy.map(([t, k]) => {
    const b = el('button', { type: 'button', 'aria-label': L.zmenit + ': ' + t }, [t]);
    b.addEventListener('click', () => chod(k));
    return b;
  }));
  vyber.hidden = !kusy.length;
  telo.replaceChildren(...[krok0, krok1, krok2, krok3, krok4][s.krok](L, sl).filter(Boolean));
  if (!s.krok) zivy.textContent = L.nejde;
  // nábeh kroku znova: v zatvorenom okne netreba (animácia začne sama pri zobrazení, offsetWidth by vynútil prepočet)
  if (dlg.open) { telo.classList.remove('obj-prichod'); void telo.offsetWidth; }
  telo.classList.add('obj-prichod');
  if (zameraj && !bezFokusu) nadpis.focus({ preventScroll: true });
  // v zatvorenom okne netreba: zobrazené okno začína hore samo (zápis scrollTop by vynútil prepočet štýlu)
  if (dlg.open) { telo.scrollTop = 0; koren.querySelector('.obj-obsah').scrollTop = 0; }
}

/* 0. objednávka cez web teraz nejde (bez servera, bez kalendára, chyba, bez internetu): nikdy slepá ulička –
   Zavolať, Skúsiť znova, otváracie hodiny zo stránky a tichý odkaz na rezervačný systém */
function krok0(L) {
  const sys = el('a', { href: REZERVACIA, target: '_blank', rel: 'noopener', 'data-obj-priamo': true }, [L.system]);
  return [
    el('p', { class: 'obj-nejde-t' }, [L.nejdeT]),
    navigator.onLine === false ? el('p', { class: 'obj-nejde-t' }, [L.offline]) : null,
    el('div', { class: 'obj-akcie' }, [el('a', { class: 'btn btn-primary btn-tel', href: TEL }, [L.volat]), tlacZnova(L, znova)]),
    hodiny(L),
    el('p', { class: 'obj-pozn obj-system' }, [sys]),
  ];
}
/* otváracie hodiny z pätičky stránky (v jazyku stránky; mení ich admin na jednom mieste) */
function hodiny(L) {
  const dl = document.querySelector('.site-footer .hours');
  if (!dl) return null;
  const k = dl.cloneNode(true);
  k.className = 'hours obj-hodiny';
  return el('div', { class: 'obj-hodiny-box' }, [el('p', { class: 'obj-hodiny-h' }, [L.hodiny]), k]);
}
function tlacZnova(L, f) {
  const b = el('button', { type: 'button', class: 'btn btn-secondary obj-znova' }, [L.znova]);
  b.addEventListener('click', () => { b.disabled = true; b.textContent = L.nacitavam; f(); });
  return b;
}
/* Skúsiť znova z kroku 0: stav servera nanovo (najviac 8 s, aspoň 0,6 s nech je vidieť, že sa skúša) */
function znova() {
  const t0 = performance.now();
  overStav().then((ok) => setTimeout(() => {
    if (!dlg.open || s.krok !== 0) return;
    chod(!ok ? 0 : s.sluzba ? 2 : 1);
  }, Math.max(0, 600 - (performance.now() - t0))));
}

/* 1. služba (z cenníka) */
function krok1() {
  const skupiny = [];
  for (const x of sluzby()) {
    let g = skupiny.find((k) => k.id === x.skup);
    if (!g) skupiny.push(g = { id: x.skup, nazov: x.skupNazov, sluzby: [] });
    g.sluzby.push(x);
  }
  return skupiny.map((g) => el('section', { class: 'obj-skup' }, [
    fotoSkup(g.id),
    g.nazov ? el('h3', { class: 'obj-skup-h' }, [g.nazov]) : null,
    el('ul', { class: 'obj-sluzby', role: 'list' }, g.sluzby.map((x) => {
      const b = el('button', { type: 'button', class: s.sluzba === x.id ? 'je' : null }, [
        el('span', { class: 'obj-n' }, [x.nazov]), el('span', { class: 'obj-m' }, [[x.cas, x.cena].filter(Boolean).join(' · ')])]);
      b.addEventListener('click', () => vyberSluzbu(x.id));
      return el('li', {}, [b]);
    })),
  ]));
}
function vyberSluzbu(id) { s.sluzba = id; chod(2); }

/* 2. najbližšie voľné časy u kohokoľvek (ťuk = hotový výber, dve kliknutia od služby) a pod nimi barberi
   (mená z rezervačného systému, portrét z tímu na stránke) pre toho, kto chce svojho */
function krok2(L) {
  const box = el('div', { class: 'obj-barberi', 'aria-busy': 'true' }, [el('p', { class: 'obj-pozn' }, [L.nacitavam])]);
  const rychlo = el('section', { class: 'obj-rychlo', 'aria-labelledby': 'obj-rychlo-h', hidden: true });
  const id = s.sluzba;
  // stav servera sa ešte zisťuje (najviac 8 s od spustenia): „Pozerám do kalendára…“, potom krok nanovo alebo „nejde“
  if (pripojene === null) {
    stavP.then((ok) => { if (dlg.open && s.krok === 2 && s.sluzba === id) chod(ok ? 2 : 0); });
    return [box];
  }
  if (pripojene === false) { setTimeout(() => chod(0)); return [box]; }
  if (!s.chce) najblizsie(L, rychlo, id);
  daj('barberi', { sluzba: id }).then((j) => {
    if (s.krok !== 2 || s.sluzba !== id) return;
    if (j.stav !== 'ok') throw new Error(j.stav);
    const mena = j.barberi || [];
    // barber vybraný v tíme na stránke: ak službu robí, ide sa rovno na deň (len raz, Späť potom ukáže celý tím)
    const chce = s.chce; s.chce = null;
    const zhoda = chce && mena.find((m) => bez(m) === bez(chce));
    if (zhoda) return vyberBarbera(zhoda);
    if (!mena.length) { box.removeAttribute('aria-busy'); return box.replaceChildren(...problem(L.nikto)); }
    box.removeAttribute('aria-busy');
    box.replaceChildren(el('p', { class: 'obj-alebo' }, [L.alebo]), el('ul', { class: 'obj-tim', role: 'list' }, [KTOKOLVEK, ...mena].map((m) => {
      const t = m === KTOKOLVEK ? null : zTimu(m);
      const mono = () => el('span', { class: 'obj-mono', 'aria-hidden': 'true' }, [m === KTOKOLVEK ? '30' : t.meno.slice(0, 1)]);
      let foto = null;
      if (t && t.foto) {
        foto = el('img', { src: t.foto, alt: '', width: '96', height: '96', loading: 'lazy', decoding: 'async' });
        foto.addEventListener('error', () => foto.replaceWith(mono()), { once: true });
      }
      const b = el('button', { type: 'button', class: s.barber === m ? 'je' : null }, [
        el('span', { class: 'obj-portret' }, [foto || mono()]),
        el('span', { class: 'obj-n' }, [m === KTOKOLVEK ? L.nezalezi : t.meno]),
        m === KTOKOLVEK ? el('span', { class: 'obj-m' }, [L.nezaleziP]) : null]);
      b.addEventListener('click', () => vyberBarbera(m));
      const li = el('li', {}, [b]);
      // ukážky práce barbera (ak ich prevádzka dodala): tri náhľady, ťuk otvorí väčšie
      if (m !== KTOKOLVEK) nacitajPracu().then((j) => {
        const f = pracaBarbera(j, m);
        if (!f.length || !li.isConnected) return;
        const r = el('button', { type: 'button', class: 'obj-praca', 'aria-label': L.praca + ': ' + t.meno }, f.slice(0, 3).map((x) => el('img', { src: new URL(x.maly, new URL('praca.json', import.meta.url)).href, alt: '', width: '160', height: '200', loading: 'lazy', decoding: 'async' })));
        r.addEventListener('click', () => ukazPracu(t.meno, f, L));
        li.append(r);
      });
      return li;
    })));
  }).catch(() => { if (s.krok === 2 && s.sluzba === id) { rychlo.hidden = true; box.removeAttribute('aria-busy'); box.replaceChildren(...problem(L.chyba, () => chod(2))); zivy.textContent = L.chyba; } });
  return [rychlo, box];
}
/* prvý otvorený deň s voľným časom u kohokoľvek (najviac 6 dní dopredu); keď nič, blok ostane skrytý */
async function najblizsie(L, blok, id) {
  try {
    const j = await daj('dni', { sluzba: id, barber: KTOKOLVEK });
    if (j.stav !== 'ok') return;
    for (let x = dalsiOtvoreny(j, null), k = 0; x && k < 6; x = dalsiOtvoreny(j, x), k++) {
      const t = await daj('terminy', { sluzba: id, barber: KTOKOLVEK, datum: x }, TTL);
      if (s.krok !== 2 || s.sluzba !== id) return;
      if (t.stav !== 'overene' || !t.casy || !t.casy.length) continue;
      blok.replaceChildren(
        el('p', { class: 'obj-rychlo-h', id: 'obj-rychlo-h' }, [L.rychlo + ' · ' + den(x, true)]),
        el('ul', { class: 'obj-mriezka', role: 'list' }, t.casy.slice(0, 8).map((c) => {
          const b = el('button', { type: 'button', 'aria-label': den(x, true) + ' ' + fill(L.o, { t: c }) }, [c]);
          b.addEventListener('click', () => { Object.assign(s, { barber: KTOKOLVEK, datum: x, cas: c, dni: j, krok: 4 }); vykresli(true); });
          return el('li', {}, [b]);
        })),
        el('p', { class: 'obj-pozn' }, [L.rychloP]), el('p', { class: 'obj-overene' }, [overText(L, t.overene_o)]));
      blok.hidden = false;
      return;
    }
  } catch (e) { /* bez rýchlej voľby ostane výber barbera */ }
}
function vyberBarbera(m) { s.barber = m; s.krok = 3; s.datum = null; s.cas = null; s.dni = null; vykresli(true); }

/* ukážky práce barbera vo väčšom (ľahký prehliadač: fotka, popis, ďalšia, zavrieť) */
let prehliadac = null;
function ukazPracu(meno, fotky, L) {
  if (!prehliadac) {
    prehliadac = el('dialog', { class: 'obj-foto', 'aria-label': L.praca, 'data-no-i18n': true });
    prehliadac.addEventListener('click', (e) => { if (e.target === prehliadac) prehliadac.close(); });
    document.body.append(prehliadac);
  }
  let i = 0;
  const obr = el('img', { alt: '', width: '960', height: '1200', decoding: 'async' });
  const popis = el('p', { class: 'obj-foto-popis' });
  const zobraz = () => {
    const f = fotky[i], zak = new URL('praca.json', import.meta.url);
    obr.src = new URL(f.velky || f.maly, zak).href; obr.alt = f.alt || '';
    popis.textContent = `${meno} · ${i + 1} / ${fotky.length}`;
  };
  const tl = (t, a, f) => { const b = el('button', { type: 'button', class: 'obj-foto-tl', 'aria-label': a }, [t]); b.addEventListener('click', f); return b; };
  prehliadac.replaceChildren(obr, el('div', { class: 'obj-foto-lista' }, [
    tl('←', L.spat, () => { i = (i + fotky.length - 1) % fotky.length; zobraz(); }), popis,
    tl('→', L.praca, () => { i = (i + 1) % fotky.length; zobraz(); }),
    tl('×', L.zavriet, () => prehliadac.close())]));
  zobraz();
  prehliadac.showModal();
}

/* 3. deň a voľný čas */
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const zIso = (x) => { const [y, m, d] = x.split('-').map(Number); return new Date(y, m - 1, d, 12); };
function den(x, dlhy) {
  const o = dlhy ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short' };
  try { return new Intl.DateTimeFormat(LOKALY[jazyk()], o).format(zIso(x)); } catch (e) { return x; }
}
function krok3(L) {
  const dni = el('div', { class: 'obj-dni', role: 'group', 'aria-label': L.dni }, [el('p', { class: 'obj-pozn' }, [L.nacitavam])]);
  const casy = el('div', { class: 'obj-casy', 'aria-label': L.casy, role: 'group' });
  const kluc = s.sluzba + '|' + s.barber;
  const kresliDni = (j) => {
    const zoznam = [];
    for (let d = zIso(j.od), k = 0; iso(d) <= j.do && k < 40; d.setDate(d.getDate() + 1), k++) {
      const x = iso(d), zav = j.zatvorene.includes(DNI[d.getDay()]) || j.sviatky.includes(x);
      // voľno barbera (REZ-03): podnik je otvorený, len tento barber nepracuje; ťuk ponúkne iného barbera
      const vol = !zav && (j.volno || []).includes(x);
      zoznam.push({ x, zav, vol, d: new Date(d) });
    }
    dni.replaceChildren(...zoznam.map(({ x, zav, vol, d }) => {
      const pozn = zav ? L.zatvorene : vol ? L.nepracuje : '';
      const b = el('button', { type: 'button', class: (s.datum === x ? 'je' : '') + (zav || vol ? ' zav' : '') || null, disabled: zav, 'aria-pressed': String(s.datum === x), 'aria-label': den(x, true) + (pozn ? ', ' + pozn : '') }, [
        el('span', { class: 'obj-dt' }, [den(x)]), el('b', {}, [String(d.getDate())]),
        el('span', { class: 'obj-mes' }, [pozn || new Intl.DateTimeFormat(LOKALY[jazyk()], { month: 'short' }).format(d)])]);
      b.addEventListener('click', () => {
        s.datum = x; kresliDni(j);
        if (!vol) return nacitajCasy(L, casy, 0);
        const iny = el('button', { type: 'button', class: 'btn btn-secondary obj-iny' }, [L.inyBarber]);
        iny.addEventListener('click', () => chod(2));
        casy.removeAttribute('aria-busy');
        casy.replaceChildren(poznamka(fill(L.nepracujeDen, { b: menoBarbera(s.barber) })), el('div', { class: 'obj-akcie' }, [iny]));
        zivy.textContent = fill(L.nepracujeDen, { b: menoBarbera(s.barber) });
      });
      return b;
    }));
    const je = dni.querySelector('.je');
    if (je) je.scrollIntoView({ block: 'nearest', inline: 'center' });
  };
  daj('dni', { sluzba: s.sluzba, barber: s.barber }).then((j) => {
    if (s.krok !== 3 || s.sluzba + '|' + s.barber !== kluc) return;
    if (j.stav !== 'ok') throw new Error(j.stav);
    s.dni = j;
    // prvý otvorený deň sa vyberie hneď, aby boli voľné časy vidieť bez ďalšieho ťuknutia
    const vyber = !s.datum;
    if (vyber) s.datum = dalsiOtvoreny(j, null);
    s.kresliDni = kresliDni;
    kresliDni(j);
    // automaticky vybraný deň bez voľného času (napr. dnes večer): okno skúsi najviac 5 ďalších otvorených dní
    if (s.datum) nacitajCasy(L, casy, vyber ? 5 : 0);
  }).catch(() => { if (s.krok === 3) { dni.replaceChildren(...problem(L.chyba, () => chod(3))); casy.replaceChildren(); zivy.textContent = L.chyba; } });
  return [dni, casy];
}
/* najbližší otvorený deň po dni po (alebo prvý v rozsahu) */
function dalsiOtvoreny(j, po) {
  for (let d = zIso(po || j.od), k = 0; k < 40; d.setDate(d.getDate() + 1), k++) {
    const x = iso(d);
    if (x > j.do) return null;
    if (po && x === po) continue;
    if (!j.zatvorene.includes(DNI[d.getDay()]) && !j.sviatky.includes(x) && !(j.volno || []).includes(x)) return x;
  }
  return null;
}
function nacitajCasy(L, box, skus) {
  const par = { sluzba: s.sluzba, barber: s.barber, datum: s.datum };
  box.replaceChildren(el('p', { class: 'obj-pozn' }, [L.nacitavam]));
  box.setAttribute('aria-busy', 'true');
  daj('terminy', par, TTL).then((j) => {
    if (s.krok !== 3 || s.datum !== par.datum) return;
    box.removeAttribute('aria-busy');
    if (j.stav === 'overene' && j.casy && j.casy.length) {
      box.replaceChildren(el('ul', { class: 'obj-mriezka', role: 'list' }, j.casy.map((c) => {
        const b = el('button', { type: 'button' }, [c]);
        b.addEventListener('click', () => { s.cas = c; s.krok = 4; vykresli(true); });
        return el('li', {}, [b]);
      })), el('p', { class: 'obj-overene' }, [overText(L, j.overene_o)]));
      zivy.textContent = den(par.datum, true) + ': ' + j.casy.length + ' ' + L.casy.toLowerCase();
      return;
    }
    if ((j.stav === 'ziadny_volny' || j.stav === 'overene') && skus > 0 && s.dni) {
      const x = dalsiOtvoreny(s.dni, par.datum);
      if (x) { s.datum = x; s.kresliDni(s.dni); return nacitajCasy(L, box, skus - 1); }
    }
    const msg = { ziadny_volny: L.ziadny, overene: L.ziadny, zatvorene: L.zatvorenyDen, mimo_rozsahu: L.mimo, minulost: L.mimo }[j.stav];
    box.replaceChildren(...(msg ? [poznamka(msg)] : problem(L.chyba, () => nacitajCasy(L, box, 0))));
    zivy.textContent = msg || L.chyba;
  }).catch(() => { if (s.krok === 3 && s.datum === par.datum) { box.removeAttribute('aria-busy'); box.replaceChildren(...problem(L.chyba, () => nacitajCasy(L, box, 0))); zivy.textContent = L.chyba; } });
}

/* 4. výber ako lístok (služba, barber, termín) a pod ním poctivá poznámka: predbežný, nikdy nie „rezervované“
   (nič ho nepotvrdilo) */
function krok4(L, sl) {
  const riadky = [
    [L.lSluzba, sl ? sl.nazov : '', sl ? [sl.cas, sl.cena].filter(Boolean).join(' · ') : ''],
    [L.lBarber, menoBarbera(s.barber), ''],
    [L.lTermin, den(s.datum, true), fill(L.o, { t: s.cas })],
  ];
  return [
    el('dl', { class: 'obj-suhrn' }, riadky.map(([l, a, b]) => el('div', {}, [el('dt', {}, [l]), el('dd', {}, [a]), b ? el('dd', { class: 'obj-suhrn-m' }, [b]) : null]))),
    poznamka(L.predbezne, L.predT),
    tahak(sl),
    el('div', { class: 'obj-akcie' }, [el('a', { class: 'btn btn-secondary btn-tel', href: TEL }, [L.zavolat])]),
  ];
}
function otvoreneDoSystemu() { otvoreneVSysteme = true; const h = koren.querySelector('.obj-tahak .obj-poznamka-h'); if (h) h.textContent = (TH[jazyk()] || TH.sk)[1]; }
/* ťahák „v systéme vyber to isté“ (KV-02): rezervačný systém nečíta adresu (REZ-02), preto okno presne povie, čo v ňom
   ťuknúť, a to slovenskými názvami, ktoré tam zákazník uvidí. Po ťuku na Dokončiť nadpis povie, že systém je v novej karte. */
const TH = {
  sk: ['V rezervačnom systéme vyber to isté:', 'Rezervácia sa otvorila v novej karte. Vyber v nej:', 'službu {s}', 'barbera {b}', '{d} a čas {t}', 'meno, e-mail, telefón a „Rezervovať termín“', ''],
  en: ['In the booking system choose the same:', 'Booking opened in a new tab. Choose there:', 'service {s}', 'barber {b}', '{d} and time {t}', 'name, e-mail, phone and „Rezervovať termín“', 'The booking page is in Slovak.'],
  uk: ['У системі бронювання обери те саме:', 'Бронювання відкрилося в новій вкладці. Обери там:', 'послугу {s}', 'барбера {b}', '{d} і час {t}', 'ім’я, e-mail, телефон і „Rezervovať termín“', 'Сторінка бронювання словацькою мовою.'],
  hu: ['A foglalási rendszerben válaszd ugyanezt:', 'A foglalás új lapon nyílt meg. Ott válaszd:', 'a szolgáltatást: {s}', 'a barbert: {b}', '{d}, időpont {t}', 'név, e-mail, telefon és „Rezervovať termín“', 'A foglalási oldal szlovák nyelvű.'],
  sr: ['U sistemu za rezervacije izaberi isto:', 'Rezervacija se otvorila u novoj kartici. Tamo izaberi:', 'uslugu {s}', 'berberina {b}', '{d} i vreme {t}', 'ime, e-mail, telefon i „Rezervovať termín“', 'Stranica za rezervaciju je na slovačkom.'],
  pl: ['W systemie rezerwacji wybierz to samo:', 'Rezerwacja otworzyła się w nowej karcie. Wybierz tam:', 'usługę {s}', 'barbera {b}', '{d} i godzinę {t}', 'imię, e-mail, telefon i „Rezervovať termín“', 'Strona rezerwacji jest po słowacku.'],
  de: ['Wähl im Buchungssystem dasselbe:', 'Die Buchung ist in einem neuen Tab offen. Wähl dort:', 'Leistung {s}', 'Barber {b}', '{d} und Zeit {t}', 'Name, E-Mail, Telefon und „Rezervovať termín“', 'Die Buchungsseite ist auf Slowakisch.'],
  cs: ['V rezervačním systému vyber totéž:', 'Rezervace se otevřela v nové kartě. Vyber v ní:', 'službu {s}', 'barbera {b}', '{d} a čas {t}', 'jméno, e-mail, telefon a „Rezervovať termín“', 'Rezervační stránka je ve slovenštině.'],
};
const SKN = new Map();                                   // id služby -> slovenský názov (ako v systéme)
function skNazvy() {
  if (jazyk() === 'sk' && html.dataset.zdroj !== 'en') { sluzby().forEach((x) => SKN.set(x.id, x.nazov)); return Promise.resolve(); }
  return fetch(new URL(`i18n/${jazyk()}.json`, import.meta.url).href).then((r) => r.json()).then((j) => {
    const spat = new Map(Object.entries(j).map(([k, v]) => [v, k]));
    sluzby().forEach((x) => SKN.set(x.id, spat.get(x.nazov) || x.nazov));
  }).catch(() => {});
}
let otvoreneVSysteme = false;
function tahak(sl) {
  const t = TH[jazyk()] || TH.sk;
  const ol = el('ol', { class: 'obj-tahak-z' });
  const kresli = () => {
    const sn = sl ? `„${SKN.get(sl.id) || sl.nazov}“` : '';
    const bn = s.barber === KTOKOLVEK ? '„Nezáleží“' : `„${menoBarbera(s.barber)}“`;
    const d = new Date(s.datum + 'T12:00:00');
    const datum = isNaN(d) ? s.datum : `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
    ol.replaceChildren(...[fill(t[2], { s: sn }), fill(t[3], { b: bn }), fill(t[4], { d: datum, t: s.cas }), t[5]].map((x) => el('li', {}, [x])));
  };
  kresli();
  if (!SKN.size || jazyk() !== 'sk') skNazvy().then(kresli);
  return el('div', { class: 'obj-tahak', role: 'note' }, [el('p', { class: 'obj-poznamka-h' }, [otvoreneVSysteme ? t[1] : t[0]]), ol, t[6] ? el('p', { class: 'obj-tahak-sys' }, [t[6]]) : null]);
}
/* poznámka v rámčeku s linkou lampy: prvá veta nadpisom, zvyšok tichšie (keď druhá časť nie je daná, rozdelí text) */
function poznamka(h, t) {
  if (t === undefined) { const m = /^(.+?[.!?])\s+(.+)$/s.exec(h); if (m) { h = m[1]; t = m[2]; } }
  return el('div', { class: 'obj-poznamka', role: 'note' }, [el('p', { class: 'obj-poznamka-h' }, [h]), t ? el('p', {}, [t]) : null]);
}
function akcie(L, znovaF) {
  return el('div', { class: 'obj-akcie' }, [
    el('a', { class: 'btn btn-primary', href: REZERVACIA, target: '_blank', rel: 'noopener', 'data-obj-priamo': true }, [L.dokoncit]),
    el('a', { class: 'btn btn-secondary btn-tel', href: TEL }, [L.zavolat]),
    znovaF ? tlacZnova(L, znovaF) : null,
  ]);
}
/* chyba pri kroku: poctivá správa, Dokončiť v rezervačnom systéme, Zavolať, Skúsiť znova (keď sa dá) a hodiny */
const problem = (t, znovaF) => { const L = tx(); return [poznamka(t), akcie(L, znovaF), hodiny(L)].filter(Boolean); };

/* ---------- odkazy Objednať sa na stránke ---------- */
function predvolby(a) {
  const pred = {};
  if (a.dataset.sluzba) pred.sluzba = Number(a.dataset.sluzba);
  const k = a.closest('.team-card');
  const n = k && k.querySelector('.team-name');
  if (n) pred.chce = n.textContent.trim();
  return pred;
}

/* spusti(api): zistí stav servera (najviac 8 s) a stiahne štýl okna; true = okno sa dá otvoriť (prehliadač s <dialog>
   a cenník na stránke), inak app.js nechá odkaz ísť do rezervačného systému. Volá ho app.js (časť 7b4) raz. */
let cssP = null;
export function spusti(api) {
  API = api;
  if (!window.HTMLDialogElement || !sluzby().length) return Promise.resolve(false);
  overStav();
  if (!cssP) cssP = new Promise((ok) => {
    const css = el('link', { rel: 'stylesheet', href: new URL('objednavka.css', import.meta.url).href });
    const hotovo = () => { html.classList.add('obj-css'); ok(); };
    css.addEventListener('load', hotovo, { once: true });
    css.addEventListener('error', hotovo, { once: true });
    setTimeout(hotovo, 4000);                         // pomalá sieť: okno radšej bez prechodu než vôbec
    document.head.append(css);
  });
  html.classList.add('obj-zapnute');
  return Promise.resolve(true);
}
/* odkaz Objednať sa na stránke: predvoľba služby z cenníka, barbera z tímu */
export function otvorOdkaz(a) { return cssP.then(() => otvor(predvolby(a))); }
/* ?objednat=1 (&sluzba=1&barber=Adrian): okno po načítaní s predvoľbou; služba len z cenníka na stránke */
export function otvorZAdresy(q) {
  const sl = Number(q.get('sluzba')), ba = q.get('barber');
  const pred = {};
  if (sluzby().some((x) => x.id === sl)) pred.sluzba = sl;
  if (ba) pred.chce = ba.slice(0, 40);
  return cssP.then(() => otvor(pred));
}
