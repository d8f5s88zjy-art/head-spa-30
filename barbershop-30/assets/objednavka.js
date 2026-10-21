/*
 * BARBERSHOP 30 – objednávka v štýle webu: služba → barber → deň a voľný čas z rezervačného kalendára.
 * Voľné časy číta server na www.headspa30.sk (asistent/api.php, lib/kalendar.php) z rezervačného systému
 * Barbershopu 30 ako ho vidí návštevník vo formulári; z odpovede idú von len časy HH:MM, nikdy mená zákazníkov.
 * Okno termín nerezervuje: na konci ukáže výber s poznámkou, že je predbežný, a vedie do rezervačného systému
 * (www.barbershop30.sk/rezervacia) alebo na telefón recepcie. Úspech sa tu nikdy neukazuje, lebo ho nič nepotvrdilo.
 *
 * Modul načíta app.js (časť 7b4) len s atribútom data-objednavka na <html> (nasadenie ho pridá až so súhlasom
 * prevádzky rezervačného systému, pages.yml) a zavolá spusti(api). Až keď server povie, že kalendár je pripojený,
 * odkazy Objednať sa otvoria toto okno; dovtedy a pri každej chybe vedú rovno do rezervačného systému.
 * Služby, časy a ceny berie z cenníka na stránke (a.price-cta[data-sluzba]), takže sú vždy rovnaké ako na webe
 * a v jazyku stránky. Texty okna sú v 8 jazykoch tu (T).
 */
const html = document.documentElement;
const REZERVACIA = 'https://www.barbershop30.sk/rezervacia';
const TEL = 'tel:+421951267203';
const ODKAZY = 'a[href*="barbershop30.sk/rezervacia"]';
const TTL = 110e3;                                     // voľné časy server drží 2 minúty, okno o chvíľu menej

const T = {
  sk: { kicker: 'Objednávka', krok: 'Krok {n} zo 4', h1: 'Čo si dáš?', h2: 'U koho?', h3: 'Kedy?', h4: 'Tvoj výber', spat: 'Späť', zavriet: 'Zavrieť', zmenit: 'Zmeniť', nezalezi: 'Nezáleží', nezaleziP: 'Prvý voľný z tímu', nacitavam: 'Pozerám do kalendára…', zatvorene: 'zatvorené', dni: 'Dni', casy: 'Voľné časy', overene: 'Overené v kalendári o {t}. Termín je predbežný, kým ho nepotvrdíš.', ziadny: 'V tento deň už nie je voľný termín. Skús iný deň.', zatvorenyDen: 'V tento deň je zatvorené.', mimo: 'Na tento deň sa online objednať nedá.', chyba: 'Voľné časy teraz neviem overiť. Zavolaj nám, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme.', nikto: 'Túto službu teraz online nik neponúka. Zavolaj nám a nájdeme termín.', predbezne: 'Termín ešte nie je rezervovaný. Dokonči ho v rezervačnom systéme alebo nám zavolaj a potvrdíme ho.', dokoncit: 'Dokončiť v rezervačnom systéme', zavolat: 'Zavolať a potvrdiť termín', o: 'o {t}', tel: 'Radšej zavoláš? 0951 267 203' },
  en: { kicker: 'Booking', krok: 'Step {n} of 4', h1: 'What will it be?', h2: 'With whom?', h3: 'When?', h4: 'Your choice', spat: 'Back', zavriet: 'Close', zmenit: 'Change', nezalezi: 'Anyone', nezaleziP: 'First free barber', nacitavam: 'Checking the calendar…', zatvorene: 'closed', dni: 'Days', casy: 'Free times', overene: 'Checked in the calendar at {t}. The time is provisional until you confirm it.', ziadny: 'No free time left on this day. Try another day.', zatvorenyDen: 'We are closed on this day.', mimo: 'This day cannot be booked online.', chyba: 'I can’t check free times right now. Call us, on weekdays from 9:00 to 19:00 we always pick up.', nikto: 'Nobody offers this service online right now. Call us and we will find a time.', predbezne: 'The time is not booked yet. Finish it in the booking system or call us and we will confirm it.', dokoncit: 'Finish in the booking system', zavolat: 'Call to confirm your time', o: 'at {t}', tel: 'Rather call? 0951 267 203' },
  uk: { kicker: 'Бронювання', krok: 'Крок {n} з 4', h1: 'Що обираєш?', h2: 'У кого?', h3: 'Коли?', h4: 'Твій вибір', spat: 'Назад', zavriet: 'Закрити', zmenit: 'Змінити', nezalezi: 'Будь-хто', nezaleziP: 'Перший вільний з команди', nacitavam: 'Дивлюся в календар…', zatvorene: 'зачинено', dni: 'Дні', casy: 'Вільний час', overene: 'Перевірено в календарі о {t}. Час попередній, доки ти його не підтвердиш.', ziadny: 'Цього дня вільного часу вже немає. Спробуй інший день.', zatvorenyDen: 'Цього дня зачинено.', mimo: 'На цей день онлайн записатися не можна.', chyba: 'Зараз не можу перевірити вільний час. Зателефонуй нам, у будні з 9:00 до 19:00 ми завжди відповімо.', nikto: 'Зараз цю послугу онлайн ніхто не пропонує. Зателефонуй, і ми знайдемо час.', predbezne: 'Час ще не заброньовано. Заверши бронювання в системі або зателефонуй, і ми його підтвердимо.', dokoncit: 'Завершити в системі бронювання', zavolat: 'Зателефонувати й підтвердити час', o: 'о {t}', tel: 'Краще зателефонувати? 0951 267 203' },
  hu: { kicker: 'Foglalás', krok: '{n}. lépés a 4-ből', h1: 'Mit kérsz?', h2: 'Kinél?', h3: 'Mikor?', h4: 'A választásod', spat: 'Vissza', zavriet: 'Bezárás', zmenit: 'Módosítás', nezalezi: 'Mindegy', nezaleziP: 'Az első szabad a csapatból', nacitavam: 'Nézem a naptárat…', zatvorene: 'zárva', dni: 'Napok', casy: 'Szabad időpontok', overene: 'A naptárban ellenőrizve: {t}. Az időpont előzetes, amíg meg nem erősíted.', ziadny: 'Ezen a napon már nincs szabad időpont. Próbálj másik napot.', zatvorenyDen: 'Ezen a napon zárva vagyunk.', mimo: 'Erre a napra online nem lehet foglalni.', chyba: 'A szabad időpontokat most nem tudom ellenőrizni. Hívj minket, hétköznap 9:00 és 19:00 között mindig felvesszük.', nikto: 'Ezt a szolgáltatást most senki sem kínálja online. Hívj minket, és találunk időpontot.', predbezne: 'Az időpont még nincs lefoglalva. Fejezd be a foglalási rendszerben, vagy hívj minket, és megerősítjük.', dokoncit: 'Befejezés a foglalási rendszerben', zavolat: 'Hívás és időpont megerősítése', o: '{t}-kor', tel: 'Inkább telefonálnál? 0951 267 203' },
  sr: { kicker: 'Zakazivanje', krok: 'Korak {n} od 4', h1: 'Šta želiš?', h2: 'Kod koga?', h3: 'Kada?', h4: 'Tvoj izbor', spat: 'Nazad', zavriet: 'Zatvori', zmenit: 'Promeni', nezalezi: 'Svejedno', nezaleziP: 'Prvi slobodan iz tima', nacitavam: 'Gledam u kalendar…', zatvorene: 'zatvoreno', dni: 'Dani', casy: 'Slobodni termini', overene: 'Provereno u kalendaru u {t}. Termin je privremen dok ga ne potvrdiš.', ziadny: 'Tog dana više nema slobodnog termina. Probaj drugi dan.', zatvorenyDen: 'Tog dana je zatvoreno.', mimo: 'Za taj dan ne može se zakazati onlajn.', chyba: 'Slobodne termine sada ne mogu da proverim. Pozovi nas, radnim danima od 9:00 do 19:00 uvek se javljamo.', nikto: 'Ovu uslugu sada niko ne nudi onlajn. Pozovi nas i naći ćemo termin.', predbezne: 'Termin još nije rezervisan. Završi ga u sistemu za rezervacije ili nas pozovi i potvrdićemo ga.', dokoncit: 'Završi u sistemu za rezervacije', zavolat: 'Pozovi i potvrdi termin', o: 'u {t}', tel: 'Radije zoveš? 0951 267 203' },
  pl: { kicker: 'Rezerwacja', krok: 'Krok {n} z 4', h1: 'Co wybierasz?', h2: 'U kogo?', h3: 'Kiedy?', h4: 'Twój wybór', spat: 'Wstecz', zavriet: 'Zamknij', zmenit: 'Zmień', nezalezi: 'Obojętnie', nezaleziP: 'Pierwszy wolny z zespołu', nacitavam: 'Sprawdzam kalendarz…', zatvorene: 'zamknięte', dni: 'Dni', casy: 'Wolne godziny', overene: 'Sprawdzono w kalendarzu o {t}. Termin jest wstępny, dopóki go nie potwierdzisz.', ziadny: 'Tego dnia nie ma już wolnego terminu. Spróbuj inny dzień.', zatvorenyDen: 'Tego dnia jest zamknięte.', mimo: 'Na ten dzień nie można zarezerwować online.', chyba: 'Nie mogę teraz sprawdzić wolnych godzin. Zadzwoń, w dni robocze od 9:00 do 19:00 zawsze odbieramy.', nikto: 'Tej usługi nikt teraz nie oferuje online. Zadzwoń, a znajdziemy termin.', predbezne: 'Termin nie jest jeszcze zarezerwowany. Dokończ w systemie rezerwacji albo zadzwoń, a go potwierdzimy.', dokoncit: 'Dokończ w systemie rezerwacji', zavolat: 'Zadzwoń i potwierdź termin', o: 'o {t}', tel: 'Wolisz zadzwonić? 0951 267 203' },
  de: { kicker: 'Buchung', krok: 'Schritt {n} von 4', h1: 'Was darf es sein?', h2: 'Bei wem?', h3: 'Wann?', h4: 'Deine Auswahl', spat: 'Zurück', zavriet: 'Schließen', zmenit: 'Ändern', nezalezi: 'Egal', nezaleziP: 'Der Erste, der frei ist', nacitavam: 'Ich schaue in den Kalender…', zatvorene: 'geschlossen', dni: 'Tage', casy: 'Freie Zeiten', overene: 'Im Kalender geprüft um {t}. Der Termin ist vorläufig, bis du ihn bestätigst.', ziadny: 'An diesem Tag ist nichts mehr frei. Versuch einen anderen Tag.', zatvorenyDen: 'An diesem Tag ist geschlossen.', mimo: 'Dieser Tag ist online nicht buchbar.', chyba: 'Freie Zeiten kann ich gerade nicht prüfen. Ruf uns an, werktags von 9:00 bis 19:00 gehen wir immer ran.', nikto: 'Diese Leistung bietet gerade niemand online an. Ruf uns an, wir finden einen Termin.', predbezne: 'Der Termin ist noch nicht gebucht. Schließe ihn im Buchungssystem ab oder ruf uns an, wir bestätigen ihn.', dokoncit: 'Im Buchungssystem abschließen', zavolat: 'Anrufen und Termin bestätigen', o: 'um {t}', tel: 'Lieber anrufen? 0951 267 203' },
  cs: { kicker: 'Objednávka', krok: 'Krok {n} ze 4', h1: 'Co si dáš?', h2: 'U koho?', h3: 'Kdy?', h4: 'Tvůj výběr', spat: 'Zpět', zavriet: 'Zavřít', zmenit: 'Změnit', nezalezi: 'Nezáleží', nezaleziP: 'První volný z týmu', nacitavam: 'Dívám se do kalendáře…', zatvorene: 'zavřeno', dni: 'Dny', casy: 'Volné časy', overene: 'Ověřeno v kalendáři v {t}. Termín je předběžný, dokud ho nepotvrdíš.', ziadny: 'V tento den už není volný termín. Zkus jiný den.', zatvorenyDen: 'V tento den je zavřeno.', mimo: 'Na tento den se online objednat nedá.', chyba: 'Volné časy teď neumím ověřit. Zavolej nám, ve všední dny od 9:00 do 19:00 telefon vždy zvedneme.', nikto: 'Tuto službu teď online nikdo nenabízí. Zavolej nám a najdeme termín.', predbezne: 'Termín ještě není rezervovaný. Dokonči ho v rezervačním systému nebo nám zavolej a potvrdíme ho.', dokoncit: 'Dokončit v rezervačním systému', zavolat: 'Zavolat a potvrdit termín', o: 'v {t}', tel: 'Raději zavoláš? 0951 267 203' },
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

let API = '', dlg = null, pripojene = false;
const s = { krok: 1, sluzba: null, barber: null, chce: null, datum: null, cas: null, dni: null, kresliDni: null };
const pamat = new Map();                               // odpovede servera (barberi a dni dlhšie, časy 110 s)

/* služby z cenníka na stránke: id, názov, trvanie a cena v aktuálnom jazyku */
function sluzby() {
  return [...document.querySelectorAll('a.price-cta[data-sluzba]')].map((a) => {
    const r = a.closest('.price-row');
    const t = (q) => (r && r.querySelector(q) ? r.querySelector(q).textContent.trim() : '');
    return { id: Number(a.dataset.sluzba), nazov: t('.price-name'), cas: t('.price-time'), cena: t('.price-amount') };
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
  return null;
}
const menoBarbera = (m) => (m === KTOKOLVEK ? tx().nezalezi : (zTimu(m) || { meno: m }).meno);

async function daj(a, par, ttl = 36e5) {
  const q = new URLSearchParams({ a, ...par }).toString();
  const c = pamat.get(q);
  if (c && Date.now() - c.t < ttl) return c.v;
  const ctrl = new AbortController(), stop = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(`${API}?${q}`, { credentials: 'omit', cache: 'no-store', signal: ctrl.signal });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.chyba || String(r.status));
    if (j.stav !== 'chyba') pamat.set(q, { t: Date.now(), v: j });
    return j;
  } finally { clearTimeout(stop); }
}

/* ---------- okno ---------- */
let telo, nadpis, krokEl, spat, vyber, zivy, pruh;
function postav() {
  dlg = el('dialog', { class: 'obj', 'aria-labelledby': 'obj-h', 'data-no-i18n': true, translate: 'no' });
  spat = el('button', { class: 'obj-spat', type: 'button' });
  spat.addEventListener('click', () => chod(s.krok - 1));
  const zavri = el('button', { class: 'obj-x', type: 'button' }, [el('span', { 'aria-hidden': 'true' }, ['×'])]);
  zavri.addEventListener('click', () => zatvor());
  krokEl = el('p', { class: 'obj-kicker' });
  pruh = el('div', { class: 'obj-pruh', 'aria-hidden': 'true' }, [1, 2, 3, 4].map(() => el('i')));
  nadpis = el('h2', { class: 'obj-h', id: 'obj-h', tabindex: '-1' });
  vyber = el('div', { class: 'obj-vyber' });
  zivy = el('p', { class: 'obj-zivy', role: 'status', 'aria-live': 'polite' });
  telo = el('div', { class: 'obj-telo' });
  const tel = el('a', { class: 'obj-tel', href: TEL });
  dlg.append(el('div', { class: 'obj-hlava' }, [spat, krokEl, zavri]), pruh, el('div', { class: 'obj-obsah' }, [nadpis, vyber, telo, zivy]), el('div', { class: 'obj-pata' }, [tel]));
  dlg.addEventListener('close', () => { html.classList.remove('obj-otvorene'); if (history.state && history.state.obj) history.back(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) zatvor(); });
  addEventListener('popstate', () => { if (dlg.open) dlg.close(); });
  document.body.append(dlg);
  // jazyk sa zmenil: texty okna aj názvy služieb z cenníka (preložené na stránke) nanovo
  new MutationObserver(() => { if (dlg.open) vykresli(false); }).observe(html, { attributes: true, attributeFilter: ['lang'] });
}

function otvor(pred = {}) {
  if (!dlg) postav();
  Object.assign(s, { krok: 1, sluzba: null, barber: null, chce: null, datum: null, cas: null, dni: null }, pred);
  // tlačidlo Späť v telefóne zatvorí okno, nie stránku
  if (!(history.state && history.state.obj)) history.pushState({ obj: true }, '');
  dlg.lang = html.lang || 'sk';
  if (!dlg.open) { dlg.showModal(); html.classList.add('obj-otvorene'); }
  if (s.sluzba) vyberSluzbu(s.sluzba); else chod(1);
}
function zatvor() { if (dlg && dlg.open) dlg.close(); }

function chod(n) {
  s.krok = Math.max(1, Math.min(4, n));
  if (s.krok < 4) s.cas = null;
  if (s.krok < 3) { s.datum = null; s.dni = null; }
  vykresli(true);
}

function vykresli(zameraj) {
  const L = tx();
  dlg.lang = html.lang || 'sk';
  spat.textContent = '← ' + L.spat;
  spat.hidden = s.krok === 1;
  dlg.querySelector('.obj-x').setAttribute('aria-label', L.zavriet);
  krokEl.textContent = L.kicker + ' · ' + fill(L.krok, { n: s.krok });
  [...pruh.children].forEach((i, k) => i.classList.toggle('je', k < s.krok));
  nadpis.textContent = [L.h1, L.h2, L.h3, L.h4][s.krok - 1];
  dlg.querySelector('.obj-tel').textContent = L.tel;
  zivy.textContent = '';
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
  telo.replaceChildren(...[krok1, krok2, krok3, krok4][s.krok - 1](L, sl));
  telo.classList.remove('obj-prichod'); void telo.offsetWidth; telo.classList.add('obj-prichod');
  if (zameraj) nadpis.focus({ preventScroll: true });
  telo.scrollTop = 0; dlg.querySelector('.obj-obsah').scrollTop = 0;
}

/* 1. služba (z cenníka) */
function krok1() {
  return [el('ul', { class: 'obj-sluzby', role: 'list' }, sluzby().map((x) => {
    const b = el('button', { type: 'button', class: s.sluzba === x.id ? 'je' : null }, [
      el('span', { class: 'obj-n' }, [x.nazov]), el('span', { class: 'obj-m' }, [[x.cas, x.cena].filter(Boolean).join(' · ')])]);
    b.addEventListener('click', () => vyberSluzbu(x.id));
    return el('li', {}, [b]);
  }))];
}
function vyberSluzbu(id) { s.sluzba = id; chod(2); }

/* 2. barber (mená z rezervačného systému, portrét z tímu na stránke) */
function krok2(L) {
  const box = el('div', { class: 'obj-barberi' }, [el('p', { class: 'obj-pozn' }, [L.nacitavam])]);
  const id = s.sluzba;
  daj('barberi', { sluzba: id }).then((j) => {
    if (s.krok !== 2 || s.sluzba !== id) return;
    if (j.stav !== 'ok') throw new Error(j.stav);
    const mena = j.barberi || [];
    // barber vybraný v tíme na stránke: ak službu robí, ide sa rovno na deň (len raz, Späť potom ukáže celý tím)
    const chce = s.chce; s.chce = null;
    const zhoda = chce && mena.find((m) => bez(m) === bez(chce));
    if (zhoda) return vyberBarbera(zhoda);
    if (!mena.length) return box.replaceChildren(...problem(L.nikto));
    box.replaceChildren(el('ul', { class: 'obj-tim', role: 'list' }, [KTOKOLVEK, ...mena].map((m) => {
      const t = m === KTOKOLVEK ? null : zTimu(m);
      const b = el('button', { type: 'button', class: s.barber === m ? 'je' : null }, [
        t && t.foto ? el('img', { src: t.foto, alt: '', width: '96', height: '96', loading: 'lazy', decoding: 'async' }) : el('span', { class: 'obj-mono', 'aria-hidden': 'true' }, [m === KTOKOLVEK ? '30' : (t ? t.meno : m).slice(0, 1)]),
        el('span', { class: 'obj-n' }, [m === KTOKOLVEK ? L.nezalezi : t ? t.meno : m]),
        m === KTOKOLVEK ? el('span', { class: 'obj-m' }, [L.nezaleziP]) : null]);
      b.addEventListener('click', () => vyberBarbera(m));
      return el('li', {}, [b]);
    })));
  }).catch(() => { if (s.krok === 2 && s.sluzba === id) box.replaceChildren(...problem(L.chyba)); });
  return [box];
}
function vyberBarbera(m) { s.barber = m; s.krok = 3; s.datum = null; s.cas = null; s.dni = null; vykresli(true); }

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
      zoznam.push({ x, zav, d: new Date(d) });
    }
    dni.replaceChildren(...zoznam.map(({ x, zav, d }) => {
      const b = el('button', { type: 'button', class: (s.datum === x ? 'je' : '') + (zav ? ' zav' : '') || null, disabled: zav, 'aria-pressed': String(s.datum === x), 'aria-label': den(x, true) + (zav ? ', ' + L.zatvorene : '') }, [
        el('span', { class: 'obj-dt' }, [den(x)]), el('b', {}, [String(d.getDate())]),
        el('span', { class: 'obj-mes' }, [zav ? L.zatvorene : new Intl.DateTimeFormat(LOKALY[jazyk()], { month: 'short' }).format(d)])]);
      b.addEventListener('click', () => { s.datum = x; kresliDni(j); nacitajCasy(L, casy, 0); });
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
  }).catch(() => { if (s.krok === 3) { dni.replaceChildren(...problem(L.chyba)); casy.replaceChildren(); } });
  return [dni, casy];
}
/* najbližší otvorený deň po dni po (alebo prvý v rozsahu) */
function dalsiOtvoreny(j, po) {
  for (let d = zIso(po || j.od), k = 0; k < 40; d.setDate(d.getDate() + 1), k++) {
    const x = iso(d);
    if (x > j.do) return null;
    if (po && x === po) continue;
    if (!j.zatvorene.includes(DNI[d.getDay()]) && !j.sviatky.includes(x)) return x;
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
      })), el('p', { class: 'obj-pozn' }, [fill(L.overene, { t: j.overene_o })]));
      zivy.textContent = den(par.datum, true) + ': ' + j.casy.length + ' ' + L.casy.toLowerCase();
      return;
    }
    if ((j.stav === 'ziadny_volny' || j.stav === 'overene') && skus > 0 && s.dni) {
      const x = dalsiOtvoreny(s.dni, par.datum);
      if (x) { s.datum = x; s.kresliDni(s.dni); return nacitajCasy(L, box, skus - 1); }
    }
    const msg = { ziadny_volny: L.ziadny, overene: L.ziadny, zatvorene: L.zatvorenyDen, mimo_rozsahu: L.mimo, minulost: L.mimo }[j.stav];
    box.replaceChildren(...(msg ? [el('p', { class: 'obj-pozn obj-silne' }, [msg])] : problem(L.chyba)));
    zivy.textContent = msg || L.chyba;
  }).catch(() => { if (s.krok === 3 && s.datum === par.datum) { box.removeAttribute('aria-busy'); box.replaceChildren(...problem(L.chyba)); zivy.textContent = L.chyba; } });
}

/* 4. výber: predbežný, nikdy nie „rezervované“ (nič ho nepotvrdilo) */
function krok4(L, sl) {
  const riadky = [
    [sl ? sl.nazov : '', sl ? [sl.cas, sl.cena].filter(Boolean).join(' · ') : ''],
    [menoBarbera(s.barber), ''],
    [den(s.datum, true), fill(L.o, { t: s.cas })],
  ];
  return [
    el('dl', { class: 'obj-suhrn' }, riadky.map(([a, b]) => el('div', {}, [el('dt', {}, [a]), el('dd', {}, [b])]))),
    el('p', { class: 'obj-pozn obj-silne' }, [L.predbezne]),
    akcie(L),
  ];
}
function akcie(L) {
  return el('div', { class: 'obj-akcie' }, [
    el('a', { class: 'btn btn-primary', href: REZERVACIA, target: '_blank', rel: 'noopener', 'data-obj-priamo': true }, [L.dokoncit]),
    el('a', { class: 'btn btn-secondary btn-tel', href: TEL }, [L.zavolat]),
  ]);
}
const problem = (t) => [el('p', { class: 'obj-pozn obj-silne' }, [t]), akcie(tx())];

/* ---------- odkazy Objednať sa na stránke ---------- */
function predvolby(a) {
  const pred = {};
  if (a.dataset.sluzba) pred.sluzba = Number(a.dataset.sluzba);
  const k = a.closest('.team-card');
  const n = k && k.querySelector('.team-name');
  if (n) pred.chce = n.textContent.trim();
  return pred;
}

export async function spusti(api) {
  API = api;
  // okno sa zapne až s pripojeným kalendárom; inak odkazy ostanú, ako sú (rovno do rezervačného systému)
  try {
    const r = await fetch(`${API}?a=stav`, { credentials: 'omit', cache: 'no-store' });
    const j = await r.json();
    pripojene = !!(j && j.ok && j.kalendar);
  } catch (e) { pripojene = false; }
  if (!pripojene || !window.HTMLDialogElement || !sluzby().length) return;
  // štýl okna sa stiahne hneď, aby prvé otvorenie nečakalo
  const css = el('link', { rel: 'stylesheet', href: new URL('objednavka.css', import.meta.url).href });
  css.addEventListener('load', () => html.classList.add('obj-css'), { once: true });
  document.head.append(css);
  html.classList.add('obj-zapnute');
  // zachytenie skôr ako prihláška vernostnej kartičky (tá je na document); odkaz v okne ide rovno ďalej
  addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest(ODKAZY);
    if (!a || a.hasAttribute('data-obj-priamo') || (dlg && dlg.contains(a)) || !html.classList.contains('obj-css')) return;
    e.preventDefault();
    otvor(predvolby(a));
  }, true);
}
