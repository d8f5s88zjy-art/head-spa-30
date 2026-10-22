# Vernostná kartička na webe BARBERSHOP 30: texty na schválenie (V6e)

Pre majiteľa, 21. 10. 2026. Nič z tohto dokumentu nie je na živom webe a nič sa nenasadilo. Sekcia a tlačidlo sú v kóde
(vetva `barbershop-vernost`), ale na webe ostanú skryté, kým systém kartičiek nebeží (body M1 až M3 nižšie). Texty
neobsahujú žiadne čísla bodov ani konkrétne odmeny, tie určíte vy.

Zdroje: sekcia `barbershop-30/index.html` (blok `data-vernost-sekcia`), preklady `barbershop-30/assets/i18n/*.json`,
okno prihlášky `vernost/web/prihlaska.js` (texty okna sa v tejto dávke nemenili okrem štítku skúšky, ktorý je len
v náhľade), zásady `vernost/ochrana-udajov.html`, návrh `vernost.md` časti 5, 7 a 8.

---

## 1. Sekcia „Vernostná kartička“ na webe (pás kontaktu, pod kartou „Kde nás nájdeš“) v 8 jazykoch

Slovenčina je zdroj; ostatné jazyky sú preklady v slovníkoch webu. Tykanie ako na zvyšku webu. Pri uloženej kartičke sa
tlačidlo samo prepne z „Vytvoriť kartičku“ na „Otvoriť kartičku“. Odkaz „Ochrana údajov“ vedie na zásady (časť 2).

### slovenčina (zdroj v index.html) (`sk`)

- Nadpis: **Vernostná kartička**
- Text: Kartička je zadarmo a na tvoje meno. Za každú návštevu ti na recepcii pripíšeme body; odmeny a akcie vidíš priamo na kartičke. Založíš ju pri rezervácii alebo tu, stačí meno a telefón.
- Tlačidlo: **Vytvoriť kartičku** (s uloženou kartičkou: **Otvoriť kartičku**)
- Odkaz: Ochrana údajov
- Len v náhľade (nie na webe), štítok skúšky: **SKÚŠKA** – Skúšobný režim: kartička sa nezakladá, nič sme neodoslali. Tlačidlo **Ukážka kartičky**; na ukážke meno „Ukážka“, kód UKÁŽKA, 0 bodov, „Odmeny a akcie doplní prevádzka.“

### angličtina (`en`)

- Nadpis: **Loyalty card**
- Text: The card is free and in your name. We add points at reception for every visit; rewards and offers are right on the card. Create it when booking or right here, all we need is your name and phone number.
- Tlačidlo: **Create a card** (s uloženou kartičkou: **Open card**)
- Odkaz: Privacy
- Len v náhľade (nie na webe), štítok skúšky: **TRIAL** – Trial mode: no card is created, nothing was sent. Tlačidlo **Sample card**; na ukážke meno „Sample“, kód SAMPLE, 0 points, „Rewards and offers will be added by the shop.“

### ukrajinčina (`uk`)

- Nadpis: **Картка лояльності**
- Text: Картка безкоштовна й на твоє ім’я. За кожен візит на рецепції нараховуємо бали; винагороди та акції бачиш прямо на картці. Створи її під час бронювання або тут, достатньо імені й телефону.
- Tlačidlo: **Створити картку** (s uloženou kartičkou: **Відкрити картку**)
- Odkaz: Захист даних
- Len v náhľade (nie na webe), štítok skúšky: **ПРОБА** – Пробний режим: картка не створюється, ми нічого не надіслали. Tlačidlo **Зразок картки**; na ukážke meno „Зразок“, kód ЗРАЗОК, 0 балів, „Винагороди та акції додасть заклад.“

### maďarčina (`hu`)

- Nadpis: **Hűségkártya**
- Text: A kártya ingyenes és a te nevedre szól. Minden látogatás után a recepción pontokat írunk jóvá; a jutalmakat és akciókat a kártyán látod. Foglaláskor vagy itt hozhatod létre, csak a neved és a telefonszámod kell.
- Tlačidlo: **Kártya létrehozása** (s uloženou kartičkou: **Kártya megnyitása**)
- Odkaz: Adatvédelem
- Len v náhľade (nie na webe), štítok skúšky: **PRÓBA** – Próbaüzem: a kártya nem jön létre, semmit sem küldtünk el. Tlačidlo **Kártya minta**; na ukážke meno „Minta“, kód MINTA, 0 pont, „A jutalmakat és akciókat az üzlet adja hozzá.“

### srbčina (`sr`)

- Nadpis: **Kartica lojalnosti**
- Text: Kartica je besplatna i na tvoje ime. Za svaku posetu na recepciji ti upisujemo bodove; nagrade i akcije vidiš direktno na kartici. Napravi je pri rezervaciji ili ovde, dovoljni su ime i telefon.
- Tlačidlo: **Napravi karticu** (s uloženou kartičkou: **Otvori karticu**)
- Odkaz: Zaštita podataka
- Len v náhľade (nie na webe), štítok skúšky: **PROBA** – Probni režim: kartica se ne pravi, ništa nismo poslali. Tlačidlo **Primer kartice**; na ukážke meno „Primer“, kód PRIMER, 0 bodova, „Nagrade i akcije dodaje salon.“

### poľština (`pl`)

- Nadpis: **Karta lojalnościowa**
- Text: Karta jest bezpłatna i na twoje imię. Za każdą wizytę dopiszemy ci w recepcji punkty; nagrody i promocje widzisz prosto na karcie. Założysz ją przy rezerwacji albo tutaj, wystarczy imię i telefon.
- Tlačidlo: **Załóż kartę** (s uloženou kartičkou: **Otwórz kartę**)
- Odkaz: Ochrona danych
- Len v náhľade (nie na webe), štítok skúšky: **PRÓBA** – Tryb próbny: karta nie jest zakładana, niczego nie wysłaliśmy. Tlačidlo **Podgląd karty**; na ukážke meno „Podgląd“, kód PODGLĄD, 0 punktów, „Nagrody i promocje doda salon.“

### nemčina (`de`)

- Nadpis: **Treuekarte**
- Text: Die Karte ist kostenlos und auf deinen Namen. Für jeden Besuch schreiben wir dir an der Rezeption Punkte gut; Prämien und Aktionen siehst du direkt auf der Karte. Du legst sie bei der Buchung oder hier an, es reichen Name und Telefon.
- Tlačidlo: **Karte anlegen** (s uloženou kartičkou: **Karte öffnen**)
- Odkaz: Datenschutz
- Len v náhľade (nie na webe), štítok skúšky: **TEST** – Testmodus: Es wird keine Karte angelegt, wir haben nichts gesendet. Tlačidlo **Beispielkarte**; na ukážke meno „Beispiel“, kód BEISPIEL, 0 Punkte, „Prämien und Aktionen ergänzt der Betrieb.“

### čeština (`cs`)

- Nadpis: **Věrnostní kartička**
- Text: Kartička je zdarma a na tvé jméno. Za každou návštěvu ti na recepci připíšeme body; odměny a akce vidíš přímo na kartičce. Založíš ji při rezervaci nebo tady, stačí jméno a telefon.
- Tlačidlo: **Vytvořit kartičku** (s uloženou kartičkou: **Otevřít kartičku**)
- Odkaz: Ochrana údajů
- Len v náhľade (nie na webe), štítok skúšky: **ZKOUŠKA** – Zkušební režim: kartička se nezakládá, nic jsme neodeslali. Tlačidlo **Ukázka kartičky**; na ukážke meno „Ukázka“, kód UKÁZKA, 0 bodů, „Odměny a akce doplní provozovna.“

**Čo sa deje po kliku na tlačidlo:** otvorí sa okno prihlášky (texty okna existujú už od 13. 10. 2026: „Zbieraj body za
každú návštevu a vymeň ich za zľavu alebo produkt. Kartička je zadarmo a na tvoje meno.“ atď.). Pozor: veta „vymeň ich za
zľavu alebo produkt“ v okne sľubuje odmenu, preto prihlášku spúšťame až vtedy, keď v systéme bude aspoň jedna odmena
(bod M5). Ak odmenu nechcete, vetu v okne upravíme (jedna zmena textu v 8 jazykoch).

**Vzhľad:** okno prihlášky a kartička sú zámerne tmavé v značke Barbershopu (tmavé pozadie, oranžový akcent, písmo
Fraunces/Manrope). V tejto dávke sme farby nemenili. Ak chcete svetlú (papierovú) verziu, povedzte; je to malá technická
zmena, ale mení vzhľad značky (rozhodnutie majiteľa).

---

## 2. Zásady ochrany údajov (`vernost/ochrana-udajov.html`): navrhovaná zmena

Zásady platia pre kartičky oboch prevádzok (Barbershop 30 aj HEAD SPA 30). Jediná navrhovaná zmena textu je doplnenie
sídla spoločnosti v zozname prevádzkovateľov (dnes je pri FACEPALM, s.r.o. len adresa prevádzky):

- dnes (riadok 28): „Barbershop 30: FACEPALM, s.r.o., IČO 52231381, Mostná 30, Nitra, tel. 0951 267 203.“
- návrh: „Barbershop 30: FACEPALM, s.r.o., IČO 52231381, sídlo Šalgovská ulica 1039/43, 951 15 Mojmírovce; prevádzka
  Mostná 30, Nitra, tel. 0951 267 203.“

Sídlo je prevzaté z výpisu Obchodného registra (ORSR) uvedeného v podkladoch, ale bez prístupu na internet sme ho
neoverili: **[predpoklad – overí majiteľ]**. Právne znenie zásad (celý dokument) odsúhlasí majiteľ; na server
headspa30.sk sa dostane až s nasadením systému (bod M1 až M2), nie skôr.

Čo zásady už dnes hovoria a čo platí aj po zmene (pre vašu kontrolu, bez žargónu):
- súhlas s kartičkou a súhlas so správami o akciách sú oddelené, nič nie je vopred zaškrtnuté;
- údaje: meno, telefón, nepovinný e‑mail, body a návštevy; nič iné sa nezbiera, žiadna analytika ani tretie strany;
- údaje Barbershopu 30 sú v systéme oddelené od HEAD SPA 30, no systém technicky beží na webhostingu HEAD SPA 30;
- kartičku si zákazník zruší sám (s vymazaním údajov); správy vypne bez straty bodov; bez návštevy 3 roky sa kartička vymaže.

Otvorené právne body, ktoré musí rozhodnúť majiteľ (prípadne s právnikom):
1. vzťah FACEPALM, s.r.o. (Barbershop 30) a prevádzkovateľa HEAD SPA 30 ako hostiteľa údajov (zmluva o spracúvaní,
   záznam o spracovateľských činnostiach);
2. kontakt pre otázky k osobným údajom (e‑mail alebo telefón, ktorý sa uvedie v zásadách; otázka 22 z OTAZKY-PRE-MAJITELA.md);
3. či je prijateľné, že adresa kartičky zákazníka Barbershopu začína `www.headspa30.sk/…` (alternatíva: vlastný hosting
   s PHP pre barbershop30.sk, bod M1).

---

## 3. Právne informácie webu Barbershopu (`barbershop-30/pravne.html`, časť „Súkromie na tomto webe“): odsek o úložisku

Stránka `pravne.html` pre Barbershop je pripravená v inej dávke (D6a, integrácia); tento odsek do nej patrí k vernostnej
kartičke. Navrhované znenie (nahrádza vetu „Pri vernostnej kartičke si môže pamätať jej odkaz a tvoju odpoveď na ponuku…“):

> Pri vernostnej kartičke si web v úložisku tvojho prehliadača pamätá: odkaz na tvoju kartičku (`v30.karta.barbershop`),
> či si ponuku kartičky odmietol (`v30.nie.barbershop`, 60 dní) alebo kartičku už máš (`v30.ma.barbershop`), a počas
> jednej návštevy webu, že si ponuku zavrel bez odpovede (`v30.preskoc.barbershop`) a že odkaz na kartičku bol overený
> (`v30.overene.barbershop`). Uloženú kartičku raz za návštevu overí u služby vernostného programu na
> www.headspa30.sk, nič iné sa neodosiela. Všetko vymažeš v nastaveniach prehliadača (údaje stránky); tým sa odstránia aj
> tieto voľby, kartička na recepcii ostáva.

Bez kartičky (dnešný stav) web používa len `b30.lang` (jazyk), odpoveď na ponuku jazyka a voľbu hudby; 0 cookies.

---

## 4. Čo od vás potrebujeme, aby kartička naozaj fungovala (M1 až M7)

Poradie je dané závislosťami: bez M1 nemá zmysel M2 atď. Nič z toho nevieme urobiť za vás.

- **M1 – Kde kartičky pobežia.** Navrhujeme webhosting HEAD SPA 30 (headspa30.sk). Odkaz na kartičku zákazníka
  Barbershopu bude potom začínať `www.headspa30.sk/…` a údaje zákazníkov Barbershopu budú ležať na hostingu inej
  prevádzky (pozri časť 2, otvorené body). Ak to nechcete, povedzte, kto spravuje hosting barbershop30.sk a či tam beží PHP.
- **M2 – Prístup na FTP hostingu** (adresa servera, prihlasovacie meno, heslo, priečinok webu). Zadáme ich do GitHubu ako
  tajomstvá (názvy `FTP_SERVER`, `FTP_USER`, `FTP_PASSWORD`, `FTP_DIR`, `FTP_DOMENA`); nikam inam, ani do chatu, ani do kódu.
  Potom sa server nahrá sám. Ručné nahratie ZIP‑u nestačí (chýbal by súbor s odtlačkami hesiel).
- **M3 – Heslo do adminu kartičiek pre Barbershop** (aspoň 10 znakov; tajomstvo `VERNOST_HESLO_BARBERSHOP`) a kto ho na
  recepcii dostane. Bez neho ostane prihláška na webe vypnutá (nasadenie si to samo overí).
- **M4 – E‑mailová schránka na doméne hostingu** (napr. vernost@headspa30.sk; tajomstvo `VERNOST_EMAIL_OD`), voliteľné.
  Bez nej zákazník nedostane odkaz na kartičku e‑mailom; ostane mu v telefóne a na recepcii.
- **M5 – Pravidlá programu:** koľko bodov za návštevu (systém má predvolené 1), aspoň jedna odmena (názov a koľko bodov
  stojí), prípadné akcie s dátumom od – do. Nič z toho nevymýšľame; zadáte to v admine alebo nám to napíšete.
- **M6 – Kto na recepcii bude kartičky obsluhovať** a na čom (telefón s Androidom alebo počítač s kamerou na QR; inak
  sa kód prepíše ručne). Zaškolenie zaberie pár minút.
- **M7 – Schválenie textov:** sekcia na webe (časť 1, 8 jazykov), text okna prihlášky, zásady ochrany údajov so sídlom
  (časť 2), odsek o úložisku (časť 3), kontakt pre otázky k údajom. Vzťah FACEPALM, s.r.o. a HEAD SPA 30 ako hostiteľa
  údajov odporúčame prejsť s právnikom.

Doplnky (nie podmienky spustenia): vzhľad okna (tmavé v značke, pozri časť 1); kedy spustiť a či najprv „potichu“ (len
cez recepciu, bez sekcie na webe) a až potom naplno.

Čo je hotové bez vás (vetva `barbershop-vernost`, nenasadené): chybný odkaz v pätičke je skrytý; sekcia s tlačidlom je
pripravená a ukáže sa sama, keď systém pobeží; nasadenie zapne prihlášku až po overení servera; skúšobný tok v náhľade
(štítok „SKÚŠKA“, nič sa neodosiela), aby ste si na telefóne prešli, čo zákazník dostane.
