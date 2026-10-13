/* Vernostná kartička 30 – prihláška na webe prevádzky.
   Pred otvorením rezervácie sa klienta opýta, či chce vernostnú kartičku. Nič nie je predvolene zaškrtnuté: bez
   „Áno, chcem vernostnú kartičku“ sa rezervácia otvorí hneď a nič sa neodošle. So súhlasom sa kartička založí na
   meno a telefón (rovnaký ako v rezervácii) a odkaz sa uloží v prehliadači; v pätičke webu ju klient znova otvorí.
   Použitie: <script src=".../vernost/web/prihlaska.js" data-prevadzka="barbershop|headspa" defer></script>
   Voliteľne data-api (adresa API, predvolene https://www.headspa30.sk/vernost/api/) a data-odkazy (selektor odkazov
   na rezerváciu). Bez atribútu data-zapnute prihláška mlčí (pätička vedie na stránku kartičky). Prvky s atribútom data-vernost-karta otvoria uloženú kartičku alebo prihlášku. */
(function () {
  'use strict';
  var skript = document.currentScript;
  if (!skript || !window.fetch || !window.HTMLDialogElement) return;
  var P = skript.getAttribute('data-prevadzka') === 'headspa' ? 'headspa' : 'barbershop';
  var API = skript.getAttribute('data-api') || 'https://www.headspa30.sk/vernost/api/';
  var ODKAZY = skript.getAttribute('data-odkazy') || 'a[href*="barbershop30.sk/rezervacia"], a[href*="booqme.app/"][href*="/barbershop30"], a[data-booking-link]';
  var OCHRANA = API.replace(/api\/?$/, '') + 'ochrana-udajov.html';
  var NAZOV = P === 'headspa' ? 'HEAD SPA 30' : 'Barbershop 30';
  var K_KARTA = 'v30.karta.' + P, K_NIE = 'v30.nie.' + P, K_MA = 'v30.ma.' + P, K_TERAZ = 'v30.preskoc.' + P, PAUZA = 60 * 864e5;

  var T = {
    sk: { t: 'Vernostná kartička', u: 'Zbieraj body za každú návštevu a vymeň ich za zľavu alebo produkt. Kartička je zadarmo a na tvoje meno.', chcem: 'Áno, chcem vernostnú kartičku', meno: 'Meno a priezvisko', tel: 'Telefón', telP: 'Rovnaké číslo, aké zadáš pri rezervácii.', mail: 'E‑mail (nepovinné)', mailP: 'Pošleme naň odkaz na kartičku.', spravy: 'Chcem dostávať správy o akciách. Môžem to kedykoľvek vypnúť.', gdpr: 'Údaje použijeme len na vernostnú kartičku.', ochrana: 'Ochrana údajov', dalej: 'Pokračovať na rezerváciu', zaloz: 'Založiť kartičku', zavri: 'Zavrieť', ok: 'Kartička je pripravená', okT: 'Uložili sme ju aj v tomto prehliadači. Pri návšteve ukáž na recepcii QR kód z kartičky.', otvor: 'Otvoriť kartičku', ma: 'Kartičku už máš', maT: 'Ak je pri nej e‑mail, poslali sme naň odkaz. Inak ti ju ukážeme na recepcii.', eMeno: 'Napíš meno a priezvisko.', eTel: 'Napíš platné telefónne číslo. Zahraničné s predvoľbou, napr. +420…', eMail: 'E‑mail nie je v správnom tvare.', eServer: 'Kartičku sa teraz nepodarilo založiť. Rezervácia funguje, kartičku ti založíme na recepcii.', caka: 'Zakladám kartičku…' },
    cs: { t: 'Věrnostní kartička', u: 'Sbírej body za každou návštěvu a vyměň je za slevu nebo produkt. Kartička je zdarma a na tvé jméno.', chcem: 'Ano, chci věrnostní kartičku', meno: 'Jméno a příjmení', tel: 'Telefon', telP: 'Stejné číslo, jaké zadáš při rezervaci.', mail: 'E‑mail (nepovinné)', mailP: 'Pošleme na něj odkaz na kartičku.', spravy: 'Chci dostávat zprávy o akcích. Mohu to kdykoli vypnout.', gdpr: 'Údaje použijeme jen pro věrnostní kartičku.', ochrana: 'Ochrana údajů', dalej: 'Pokračovat na rezervaci', zaloz: 'Založit kartičku', zavri: 'Zavřít', ok: 'Kartička je připravená', okT: 'Uložili jsme ji i v tomto prohlížeči. Při návštěvě ukaž na recepci QR kód z kartičky.', otvor: 'Otevřít kartičku', ma: 'Kartičku už máš', maT: 'Pokud je u ní e‑mail, poslali jsme na něj odkaz. Jinak ti ji ukážeme na recepci.', eMeno: 'Napiš jméno a příjmení.', eTel: 'Napiš platné telefonní číslo. Číslo mimo Slovensko s předvolbou, např. +420…', eMail: 'E‑mail nemá správný tvar.', eServer: 'Kartičku se teď nepodařilo založit. Rezervace funguje, kartičku ti založíme na recepci.', caka: 'Zakládám kartičku…' },
    pl: { t: 'Karta lojalnościowa', u: 'Zbieraj punkty za każdą wizytę i wymieniaj je na rabat lub produkt. Karta jest bezpłatna i na twoje imię.', chcem: 'Tak, chcę kartę lojalnościową', meno: 'Imię i nazwisko', tel: 'Telefon', telP: 'Ten sam numer, który podasz przy rezerwacji.', mail: 'E‑mail (opcjonalnie)', mailP: 'Wyślemy na niego link do karty.', spravy: 'Chcę otrzymywać wiadomości o promocjach. Mogę to w każdej chwili wyłączyć.', gdpr: 'Dane wykorzystamy tylko do karty lojalnościowej.', ochrana: 'Ochrona danych', dalej: 'Przejdź do rezerwacji', zaloz: 'Załóż kartę', zavri: 'Zamknij', ok: 'Karta jest gotowa', okT: 'Zapisaliśmy ją też w tej przeglądarce. Podczas wizyty pokaż w recepcji kod QR z karty.', otvor: 'Otwórz kartę', ma: 'Masz już kartę', maT: 'Jeśli podano przy niej e‑mail, wysłaliśmy na niego link. W przeciwnym razie pokażemy ci ją w recepcji.', eMeno: 'Wpisz imię i nazwisko.', eTel: 'Wpisz prawidłowy numer telefonu. Numer spoza Słowacji z kierunkowym, np. +48…', eMail: 'Adres e‑mail ma nieprawidłowy format.', eServer: 'Nie udało się teraz założyć karty. Rezerwacja działa, kartę założymy ci w recepcji.', caka: 'Zakładam kartę…' },
    hu: { t: 'Hűségkártya', u: 'Gyűjts pontokat minden látogatással, és váltsd be őket kedvezményre vagy termékre. A kártya ingyenes és a te nevedre szól.', chcem: 'Igen, kérem a hűségkártyát', meno: 'Teljes név', tel: 'Telefon', telP: 'Ugyanaz a szám, amelyet a foglalásnál megadsz.', mail: 'E‑mail (nem kötelező)', mailP: 'Erre küldjük a kártya linkjét.', spravy: 'Szeretnék értesítést kapni az akciókról. Bármikor kikapcsolhatom.', gdpr: 'Az adatokat csak a hűségkártyához használjuk.', ochrana: 'Adatvédelem', dalej: 'Tovább a foglaláshoz', zaloz: 'Kártya létrehozása', zavri: 'Bezárás', ok: 'A kártyád elkészült', okT: 'Ebben a böngészőben is elmentettük. Látogatáskor mutasd meg a recepción a kártya QR-kódját.', otvor: 'Kártya megnyitása', ma: 'Már van kártyád', maT: 'Ha megadtál hozzá e‑mailt, elküldtük rá a linket. Ha nem, a recepción megmutatjuk.', eMeno: 'Add meg a teljes neved.', eTel: 'Adj meg érvényes telefonszámot. Nem szlovák számot előhívóval, pl. +36…', eMail: 'Az e‑mail-cím formátuma hibás.', eServer: 'A kártyát most nem sikerült létrehozni. A foglalás működik, a kártyát a recepción elkészítjük.', caka: 'Kártya létrehozása…' },
    de: { t: 'Treuekarte', u: 'Sammle Punkte bei jedem Besuch und tausche sie gegen einen Rabatt oder ein Produkt. Die Karte ist kostenlos und auf deinen Namen.', chcem: 'Ja, ich möchte die Treuekarte', meno: 'Vor- und Nachname', tel: 'Telefon', telP: 'Dieselbe Nummer wie bei der Buchung.', mail: 'E‑Mail (optional)', mailP: 'Wir schicken dir den Link zur Karte.', spravy: 'Ich möchte Nachrichten über Aktionen erhalten. Ich kann das jederzeit abschalten.', gdpr: 'Wir nutzen die Daten nur für die Treuekarte.', ochrana: 'Datenschutz', dalej: 'Weiter zur Buchung', zaloz: 'Karte anlegen', zavri: 'Schließen', ok: 'Deine Karte ist bereit', okT: 'Wir haben sie auch in diesem Browser gespeichert. Zeig beim Besuch an der Rezeption den QR‑Code der Karte.', otvor: 'Karte öffnen', ma: 'Du hast schon eine Karte', maT: 'Falls eine E‑Mail hinterlegt ist, haben wir dir den Link geschickt. Sonst zeigen wir sie dir an der Rezeption.', eMeno: 'Bitte gib deinen Vor- und Nachnamen ein.', eTel: 'Bitte gib eine gültige Telefonnummer ein. Nicht slowakische Nummern mit Vorwahl, z. B. +43…', eMail: 'Die E‑Mail-Adresse ist ungültig.', eServer: 'Die Karte konnte gerade nicht angelegt werden. Die Buchung funktioniert, die Karte legen wir dir an der Rezeption an.', caka: 'Karte wird angelegt…' },
    uk: { t: 'Картка лояльності', u: 'Збирай бали за кожен візит і обмінюй їх на знижку або продукт. Картка безкоштовна й на твоє ім’я.', chcem: 'Так, хочу картку лояльності', meno: 'Ім’я та прізвище', tel: 'Телефон', telP: 'Той самий номер, що й у бронюванні.', mail: 'E‑mail (необов’язково)', mailP: 'Надішлемо на нього посилання на картку.', spravy: 'Хочу отримувати повідомлення про акції. Можу будь-коли вимкнути.', gdpr: 'Дані використаємо лише для картки лояльності.', ochrana: 'Захист даних', dalej: 'Перейти до бронювання', zaloz: 'Створити картку', zavri: 'Закрити', ok: 'Картка готова', okT: 'Ми зберегли її і в цьому браузері. Під час візиту покажи на рецепції QR‑код картки.', otvor: 'Відкрити картку', ma: 'Картка в тебе вже є', maT: 'Якщо до неї вказано e‑mail, ми надіслали на нього посилання. Інакше покажемо її на рецепції.', eMeno: 'Напиши ім’я та прізвище.', eTel: 'Напиши дійсний номер телефону. Іноземний номер з кодом країни, напр. +380…', eMail: 'E‑mail має неправильний формат.', eServer: 'Зараз не вдалося створити картку. Бронювання працює, картку створимо на рецепції.', caka: 'Створюю картку…' },
    en: { t: 'Loyalty card', u: 'Collect points with every visit and swap them for a discount or a product. The card is free and in your name.', chcem: 'Yes, I want the loyalty card', meno: 'Full name', tel: 'Phone', telP: 'The same number you use for the booking.', mail: 'E‑mail (optional)', mailP: 'We will send you the link to your card.', spravy: 'I want to receive news about offers. I can turn this off at any time.', gdpr: 'We use the data only for the loyalty card.', ochrana: 'Privacy', dalej: 'Continue to booking', zaloz: 'Create card', zavri: 'Close', ok: 'Your card is ready', okT: 'We saved it in this browser too. Show the QR code from the card at reception when you visit.', otvor: 'Open card', ma: 'You already have a card', maT: 'If it has an e‑mail, we sent you the link. Otherwise we will show it to you at reception.', eMeno: 'Please enter your full name.', eTel: 'Please enter a valid phone number. Non-Slovak numbers with the country code, e.g. +44…', eMail: 'The e‑mail address is not valid.', eServer: 'We could not create the card right now. Booking works, we will set up your card at reception.', caka: 'Creating your card…' },
    sr: { t: 'Kartica lojalnosti', u: 'Skupljaj bodove za svaku posetu i zameni ih za popust ili proizvod. Kartica je besplatna i na tvoje ime.', chcem: 'Da, želim karticu lojalnosti', meno: 'Ime i prezime', tel: 'Telefon', telP: 'Isti broj koji unosiš pri rezervaciji.', mail: 'E‑mail (nije obavezno)', mailP: 'Poslaćemo ti link do kartice.', spravy: 'Želim da dobijam poruke o akcijama. Mogu to bilo kada da isključim.', gdpr: 'Podatke koristimo samo za karticu lojalnosti.', ochrana: 'Zaštita podataka', dalej: 'Nastavi na rezervaciju', zaloz: 'Napravi karticu', zavri: 'Zatvori', ok: 'Kartica je spremna', okT: 'Sačuvali smo je i u ovom pregledaču. Pri poseti pokaži na recepciji QR kod sa kartice.', otvor: 'Otvori karticu', ma: 'Već imaš karticu', maT: 'Ako je uz nju e‑mail, poslali smo ti link. U suprotnom ćemo ti je pokazati na recepciji.', eMeno: 'Upiši ime i prezime.', eTel: 'Upiši ispravan broj telefona. Broj van Slovačke sa pozivnim brojem, npr. +381…', eMail: 'E‑mail nije u ispravnom obliku.', eServer: 'Karticu trenutno nije moguće napraviti. Rezervacija radi, karticu ćemo ti napraviti na recepciji.', caka: 'Pravim karticu…' }
  };
  function tx() { var l = (document.documentElement.lang || 'sk').slice(0, 2).toLowerCase(); return T[l] || T.sk; }
  function daj(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function uloz(k, h) { try { localStorage.setItem(k, h); } catch (e) { /* súkromné okno */ } }
  function zmaz(k) { try { localStorage.removeItem(k); } catch (e) { /* nič */ } }
  function relacia(k, h) { try { if (h === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, h); } catch (e) { return null; } }
  function el(tag, attrs, deti) {
    var e = document.createElement(tag), a;
    for (a in attrs || {}) if (attrs[a] !== null && attrs[a] !== false && attrs[a] !== undefined) e.setAttribute(a, attrs[a] === true ? '' : attrs[a]);
    (deti || []).forEach(function (d) { if (d) e.append(d); });
    return e;
  }
  /* prihláška sa pýta len vtedy, keď má prevádzka nastavený admin (recepcia vie kartičky obsluhovať): príznak data-zapnute
     doplní nasadenie (ftp.yml, pages.yml), keď sú v GitHube tajomstvá s heslom; stránka sa preto servera vopred nepýta */
  var ZAPNUTE = skript.hasAttribute('data-zapnute');
  function aktivne() { return ZAPNUTE; }
  function kartaUlozena() { var u = daj(K_KARTA); return u && /^https?:\/\/[^\s]+\/karta\/\?k=[A-Za-z0-9_-]{22}$/.test(u) ? u : ''; }

  var CSS = '#v30p{position:fixed;inset:0;margin:auto;width:min(28rem,calc(100% - 24px));max-height:calc(100% - 24px);overflow:auto;padding:22px 20px 18px;border:1px solid var(--v30l);border-radius:20px;background:var(--v30b);color:var(--v30t);font:400 16px/1.5 Manrope,system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 30px 80px rgba(0,0,0,.5);text-align:left;letter-spacing:normal;text-transform:none;opacity:1;transform:none;z-index:2147483000}'
    + '#v30p[open]{animation:v30in .35s cubic-bezier(.2,.7,.2,1)}#v30p::backdrop{background:rgba(8,7,6,.7)}'
    + '#v30p *{box-sizing:border-box;font-family:inherit;letter-spacing:normal;word-spacing:normal;text-transform:none;text-align:left}#v30p h2{margin:0 36px 6px 0;font:var(--v30h);font-size:1.45rem;line-height:1.15;color:inherit}'
    + '#v30p p{margin:0 0 12px;color:var(--v30m);font-size:.95rem}#v30p a{color:var(--v30t);text-decoration:underline;text-underline-offset:3px}'
    + '#v30p .v30x{position:absolute;top:12px;right:12px;width:40px;height:40px;border-radius:50%;border:1px solid var(--v30l);background:transparent;color:inherit;font-size:22px;line-height:1;cursor:pointer}'
    + '#v30p label.v30v{display:flex;gap:12px;align-items:flex-start;margin:4px 0 12px;cursor:pointer;color:var(--v30t);font-size:.98rem}#v30p label.v30v input{width:22px;height:22px;margin:1px 0 0;flex:none;accent-color:var(--v30a)}'
    + '#v30p .v30chcem{padding:12px 14px;border:1px solid var(--v30l);border-radius:14px;font-weight:700}#v30p .v30chcem:has(input:checked){border-color:var(--v30a)}'
    + '#v30p .v30pole{display:grid;gap:4px;margin:0 0 12px;font-size:.88rem;font-weight:700;color:var(--v30t)}#v30p .v30pole small{font-weight:400;color:var(--v30m)}'
    + '#v30p input[type=text],#v30p input[type=tel],#v30p input[type=email]{width:100%;min-height:46px;padding:10px 12px;border-radius:12px;border:1px solid var(--v30l);background:rgba(255,255,255,.06);color:var(--v30t);font-size:16px;font-weight:400}'
    + '#v30p input:focus-visible,#v30p button:focus-visible,#v30p a:focus-visible{outline:2px solid var(--v30a);outline-offset:2px}'
    + '#v30p .v30tl{display:flex;width:100%;min-height:50px;align-items:center;justify-content:center;gap:8px;margin-top:8px;padding:0 18px;border-radius:999px;border:1px solid var(--v30a);background:var(--v30a);color:var(--v30at);font-weight:700;font-size:1rem;text-decoration:none;cursor:pointer}'
    + '#v30p .v30tl.v30d{background:transparent;color:var(--v30t);border-color:var(--v30l)}#v30p .v30tl[disabled]{opacity:.6;cursor:default}'
    + '#v30p .v30chyba{color:#ffb4a0;font-weight:700;margin:0 0 10px}#v30p .v30mala{font-size:.82rem;margin:10px 0 0}#v30p .v30pasca{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}'
    + '#v30p[data-p=barbershop]{--v30b:#141210;--v30t:#f1e9dd;--v30m:#c3b8a8;--v30a:#e0601c;--v30at:#0e0d0c;--v30l:rgba(241,233,221,.18);--v30h:800 1.45rem/1.15 Fraunces,Georgia,serif}'
    + '#v30p[data-p=headspa]{--v30b:#14100b;--v30t:#efe5d4;--v30m:#c4b69f;--v30a:#d4ae62;--v30at:#0c0906;--v30l:rgba(239,229,212,.18);--v30h:500 1.45rem/1.15 Lora,Georgia,serif}'
    + '@keyframes v30in{from{opacity:0;transform:translateY(16px) scale(.98)}}@media (prefers-reduced-motion:reduce){#v30p[open]{animation:none}}';

  var dlg = null;
  function otvor(rezervacia) {
    var L = tx();
    if (!dlg) {
      document.head.append(el('style', {}, [CSS]));
      dlg = el('dialog', { id: 'v30p', 'data-p': P, 'data-no-i18n': true, translate: 'no', 'aria-labelledby': 'v30h' });
      dlg.addEventListener('click', function (e) {
        if (Date.now() - (dlg._t || 0) < 500) { e.preventDefault(); e.stopImmediatePropagation(); return; }
        if (e.target === dlg) { if (dlg._teraz) dlg._teraz(); dlg.close(); }
      }, true);
      /* Esc spustí cancel hneď (close príde až neskôr), preto sa „teraz nie“ zapíše už tu */
      dlg.addEventListener('cancel', function () { if (dlg._teraz) dlg._teraz(); });
      dlg.addEventListener('close', function () { if (dlg._teraz) dlg._teraz(); });
      document.body.append(dlg);
    }
    dlg.setAttribute('lang', document.documentElement.lang || 'sk');
    var rozhodnute = false;
    var chyba = el('p', { class: 'v30chyba', role: 'alert', hidden: true });
    var chcem = el('input', { type: 'checkbox', id: 'v30chcem' });
    var meno = el('input', { type: 'text', id: 'v30meno', autocomplete: 'name', maxlength: '80', required: true });
    var tel = el('input', { type: 'tel', id: 'v30tel', autocomplete: 'tel', maxlength: '30', required: true });
    var mail = el('input', { type: 'email', id: 'v30mail', autocomplete: 'email', maxlength: '120' });
    var spravy = el('input', { type: 'checkbox' });
    var pasca = el('input', { type: 'text', name: 'web', tabindex: '-1', autocomplete: 'off' });
    var polia = el('div', { hidden: true }, [
      el('label', { class: 'v30pole', for: 'v30meno' }, [L.meno, meno]),
      el('label', { class: 'v30pole', for: 'v30tel' }, [L.tel, tel, el('small', {}, [L.telP])]),
      el('label', { class: 'v30pole', for: 'v30mail' }, [L.mail, mail, el('small', {}, [L.mailP])]),
      el('label', { class: 'v30v' }, [spravy, el('span', {}, [L.spravy])]),
      el('div', { class: 'v30pasca', 'aria-hidden': 'true' }, [pasca])
    ]);
    var tl = el('button', { class: 'v30tl', type: 'submit' }, [rezervacia ? L.dalej : L.zaloz]);
    var zavri = el('button', { class: 'v30x', type: 'button', 'aria-label': L.zavri }, ['×']);
    zavri.addEventListener('click', function () { if (dlg._teraz) dlg._teraz(); dlg.close(); });
    var form = el('form', { method: 'dialog', novalidate: true }, [
      el('h2', { id: 'v30h' }, [L.t + ' ' + NAZOV]), el('p', {}, [L.u]), chyba,
      el('label', { class: 'v30v v30chcem' }, [chcem, el('span', {}, [L.chcem])]), polia, tl,
      el('p', { class: 'v30mala' }, [L.gdpr + ' ', el('a', { href: OCHRANA, target: '_blank', rel: 'noopener' }, [L.ochrana])])
    ]);
    chcem.addEventListener('change', function () {
      polia.hidden = !chcem.checked; chyba.hidden = true;
      if (!rezervacia) tl.disabled = !chcem.checked;
      if (chcem.checked) meno.focus();
    });
    if (!rezervacia) tl.disabled = true;
    [meno, tel, mail].forEach(function (i) { i.addEventListener('input', function () { chyba.hidden = true; }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!chcem.checked) {                       // bez súhlasu nič neodosielame, len otvoríme rezerváciu
        uloz(K_NIE, String(Date.now()));
        rozhodnute = true;
        dlg.close();
        if (rezervacia) window.open(rezervacia, '_blank', 'noopener');
        return;
      }
      var cislo = tel.value.replace(/[^\d+]/g, '').replace(/^00/, '+');
      var zle = meno.value.trim().length < 2 ? [L.eMeno, meno] : !(/^0?9\d{8}$/.test(cislo) || /^\+[1-9]\d{7,14}$/.test(cislo)) ? [L.eTel, tel]
        : mail.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim()) ? [L.eMail, mail] : null;
      if (zle) { chyba.textContent = zle[0]; chyba.hidden = false; zle[1].focus(); return; }
      chyba.hidden = true; tl.disabled = true; tl.textContent = L.caka;
      fetch(API + '?a=registracia', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
        body: JSON.stringify({ prevadzka: P, meno: meno.value.trim(), telefon: tel.value.trim(), email: mail.value.trim(), suhlas_karta: true, suhlas_spravy: spravy.checked, web: pasca.value })
      }).then(function (r) { return r.json().then(function (j) { return { r: r, j: j }; }); }).then(function (x) {
        if (!x.r.ok || !x.j.ok) { var er = new Error(x.j.chyba || ''); er.kod = x.r.status; throw er; }
        rozhodnute = true;
        if (x.j.karta) uloz(K_KARTA, x.j.karta); else if (x.j.existuje) uloz(K_MA, '1');
        hotovo(L, rezervacia, x.j.existuje ? '' : x.j.karta, meno.value.trim().split(/\s+/)[0]);
      }).catch(function (er) {
        tl.disabled = false; tl.textContent = rezervacia ? L.dalej : L.zaloz;
        chyba.textContent = er.kod === 400 && er.message && L === T.sk ? er.message : L.eServer; chyba.hidden = false;
        if (rezervacia && er.kod !== 400) { tl.textContent = L.dalej; chcem.checked = false; polia.hidden = true; }
      });
    });
    dlg.replaceChildren(zavri, form);
    /* zatvorenie bez voľby (×, Esc, klik vedľa) = „teraz nie“: do konca návštevy webu sa už nepýtame, rezervácia ide rovno */
    dlg._teraz = function () { if (rezervacia && !rozhodnute) relacia(K_TERAZ, '1'); };
    if (!dlg.open) { dlg._t = Date.now(); dlg.showModal(); }
    chcem.focus();
  }

  function hotovo(L, rezervacia, karta, krstne) {
    var obsah = [
      el('button', { class: 'v30x', type: 'button', 'aria-label': L.zavri }, ['×']),
      el('h2', { id: 'v30h' }, [karta ? L.ok + (krstne ? ', ' + krstne : '') + '!' : L.ma]),
      el('p', {}, [karta ? L.okT : L.maT])
    ];
    if (rezervacia) obsah.push(el('a', { class: 'v30tl', href: rezervacia, target: '_blank', rel: 'noopener' }, [L.dalej]));
    if (karta) obsah.push(el('a', { class: 'v30tl' + (rezervacia ? ' v30d' : ''), href: karta, target: '_blank', rel: 'noopener' }, [L.otvor]));
    obsah[0].addEventListener('click', function () { dlg.close(); });
    obsah.slice(3).forEach(function (a) { a.addEventListener('click', function () { setTimeout(function () { dlg.close(); }, 0); }); });
    dlg.replaceChildren.apply(dlg, obsah);
    (obsah[3] || obsah[0]).focus();
  }

  /* odkazy na rezerváciu: pred prvou rezerváciou sa opýtame (kto kartičku má alebo nedávno odmietol, ide rovno) */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest(ODKAZY);
    if (!a || !a.href) return;
    if (dlg && dlg.open) { e.preventDefault(); return; }
    if (!aktivne()) return;
    if (kartaUlozena() || daj(K_MA) || relacia(K_TERAZ) || Date.now() - Number(daj(K_NIE) || 0) < PAUZA) return;
    e.preventDefault();
    otvor(a.href);
  }, true);

  /* pätička: „Vernostná kartička“ otvorí uloženú kartičku, inak prihlášku bez rezervácie */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-vernost-karta]');
    if (!a || (!aktivne() && !kartaUlozena())) return;
    e.preventDefault();
    var u = kartaUlozena();
    if (u) window.open(u, '_blank', 'noopener'); else otvor('');
  });

  /* uložená kartička: raz za návštevu webu overiť, že ešte existuje (zrušená alebo zmazaná na recepcii) */
  function overUlozenu() {
    var u = kartaUlozena();
    if (!u || relacia('v30.overene.' + P)) return;
    relacia('v30.overene.' + P, '1');
    fetch(API + '?a=karta&k=' + encodeURIComponent(u.split('k=')[1]), { credentials: 'omit', cache: 'no-store' })
      .then(function (r) { if (r.status === 404) zmaz(K_KARTA); }).catch(function () { /* bez siete nič */ });
  }
  if (document.readyState === 'complete') setTimeout(overUlozenu, 4000); else addEventListener('load', function () { setTimeout(overUlozenu, 4000); }, { once: true });
})();
