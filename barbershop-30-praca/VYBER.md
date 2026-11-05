# BARBERSHOP 30 – výber hlavného seniora: čo sa zapracuje teraz (3. 11. 2026)

Strom `scratchpad/hs-skvrny` (vetva barbershop-skvrny), HEAD **791fb3db**, `git status --short | wc -l` → 0. V strome som
nič nemenil. Moje pomocné súbory sú len v `scratchpad/barber/senior/vyber/` (3 hárky snímok z videí prototypov).
Cesty nižšie sú relatívne k `scratchpad/` (strom = `hs-skvrny/barbershop-30/`, podklady = `barber/senior/`).

Podklady: `barber/senior/{rezervacia,film,web,barber}/ZAPIS.md`, `barber/senior/{koncept-film,koncept-hra,koncept-volba,plynulost}/NAVRHY.md`.
Návrhy troch konceptov majú rovnaké čísla KON-xx, preto ich tu označujem podľa konceptu:
**KF-xx** = koncept-film, **KH-xx** = koncept-hra, **KV-xx** = koncept-volba (číslo ostáva).

## Rozhodnutie v skratke

1. **Víťaz poroty je koncept-film: „Film, ktorý riadiš“.** Zákazník dostane k filmu ovládač ako vo videoprehrávači:
   pás kapitol, po ktorom ťahom pretáča film (KF-01), tlačidlo ▶ „Prehrať prehliadku“ (KF-02) a „Ďalej: …“ pri
   zastavení (KF-03). Nič z toho nepotrebuje rozhodnutie majiteľa, nemení fotky ani fakty a prototyp má 6,4 kB gzip.
2. **Z cesty k termínu (koncept-volba) beriem to, čo opravuje objednávku:** tlačidlo „Dokončiť…“ v päte okna a ťahák
   „V rezervačnom systéme vyber to isté“ (KV-01, KV-02, KV-09). Sú to zároveň opravy nálezov WEB-03 a REZ-02 (a).
   Každá cesta filmu končí na Rezervácii a tam sa výber už nestratí.
3. **Z hry (koncept-hra) beriem hravosť v zábere bez nových tvrdení:** svetlý bod na skutočnom predmete, ťuk = nájazd
   kamery a veta zo stránky (KF-06 + KH-01 bez cien), a stav stlačenia tlačidiel (KH-07).
4. **Skladačka „Poskladaj si návštevu“ je pripravená v troch verziách (KV-03, KH-02, BAR-11), ale čaká na majiteľa:**
   ukazuje vypočítané súčty, ktoré v cenníku nie sú, a tip na balíček, ktorý tvrdí viac, než cenník hovorí
   (pozri „Pre majiteľa“). Ako základ odporúčam KV-03.
5. **Všetky vážne a stredné nálezy sa opravia** (BAR-01, REZ-01 v našej časti, REZ-03, WEB-01 až WEB-03, FIL-2,
   BAR-02 až BAR-04). Časť REZ-01, REZ-05 a REZ-08 je na hostingu: náš diel je nástroj na kontrolu domény a presné návody.

## Porota (1 – 5; pri riziku a prácnosti 5 = najmenšie riziko / najmenej práce)

| kritérium | Film „Kino“ (KF) | Hra „body, zostav, pena“ (KH) | Cesta k termínu (KV) |
|---|---|---|---|
| hodnota pre zákazníka a objednávky | 3 | 4 | **5** |
| filmovosť | **5** | 3 | 2 |
| hravosť | 4 | **5** | 4 |
| plynulosť na telefóne | **4** | 3 | 3 |
| riziko | **4** | 2 | 3 |
| prácnosť | **4** | 2 | 3 |
| **súčet** | **24** | 19 | 20 |
| potrebuje rozhodnutie majiteľa | nie | áno (priradenia predmet → služba, tip balíčka) | krok 4 nie, skladačka áno |

Zdôvodnenie a dôkazy (snímky som otvoril nástrojom Read, čísla sú z príkazov v časti „Overenie“):

- **Film „Kino“.** Pás je na telefóne hore pod lištou, na počítači dole v strede, bez dosky a pozadia, len čiary a
  text (`koncept-film/prototyp/pas-mobil-polohy.png`, `pas-pocitac-polohy.png`). Kino prejde podnik od úvodu po
  Rezerváciu s „Objednať sa“ (`koncept-film/prototyp/kino-telefon-pas.png`, môj hárok `vyber/kino-pocitac-harok.jpg`).
  Kým svieti ponuka jazyka, pás čaká (snímka 3 v mojom hárku). Test `vystup-mobil/kino-test.json`: `chyby: []`,
  prerušenie dotykom `hra: false`, obmedzený pohyb skáče `0 … 1055`, jazyky en/de/uk/hu. Vlastná práca pásu je
  0,34 ms na snímku skrolu (KF-NAVRHY:92). Veľkosť: `kino.js` 4 382 B gzip, `kino.css` 1 988 B gzip. Hodnota pre
  objednávky je len 3: pás vedie k Rezervácii, ale sám neobjednáva. Riziko: automatický skrol v Safari na iPhone sa
  v kontajneri overiť nedá (WebKit v `/opt/pw-browsers` nie je), preto ide do kontroly na zariadení majiteľa.
- **Hra.** Najhravejšia: bod na buldogovi, pumpe, uteráku a kresle a karta s cenou
  (`koncept-hra/prototyp/snimky/mobile-filmon-stol-karta.png`, `desktop-filmon-cakaren-karta.png`). Má však tri
  problémy. (1) Priradenia „uterák → Úprava brady“ a „karafa → Ultra inclusive“ sú nové tvrdenia o službách.
  (2) Tip „Balíček 1 za 30 € obsahuje všetko, čo máš vybrané“ (`mobile-filmon-zostav-1.png`) pri výbere s
  „Depilácia uší a nosa voskom“, pričom cenník pri Balíčku 1 píše len „depilácia uší“ (`index.html:579`).
  (3) Na telefóne karta kresla leží cez text tímu „Farbenie, melír a trvalú robí Romana“
  (`mobile-filmon-kreslo-stred-karta.png`, môj hárok `vyber/hra-telefon-harok.jpg`). Polohy bodov sú ručne nastavené
  na každú fotku. `hra.js` má 11 432 B gzip. S filmom má rAF p95 167 a 333 ms, dnešný web 133 a 133 ms
  (`koncept-hra/nastroje/meranie-prototyp.json`, `meranie-dnes.json`, orientačne, SwiftShader).
- **Cesta k termínu.** Najväčší úžitok pre objednávky. Krok 4 dnes skrýva hlavné tlačidlo pod okrajom
  (`koncept-volba/snimky/dnes/dnes-okno-krok4-390.png`, vidno len „Radšej zavoláš?“). Prototyp ho má v päte na
  320, 360 aj 390 px (`snimky/proto2/krok4-sk-320.png`, `krok4.json`: `viditelne: true`, tlačidlo 736–786 px pri
  výške 844). Ťahák je v 8 jazykoch a názvy služieb sú po slovensky, ako ich zákazník uvidí v systéme
  (`proto2/krok4-de-390-po-tuku.png`). Skladačka je pekná a svetlá (`prototyp/video/pas-skladacka-v2.jpg`,
  `snimky/v3-telefon-off/06-barber.png`, môj hárok `vyber/skladacka-pocitac-harok.jpg`). Filmová je však len hlavou
  s prelínaním. Ťuk na doplnok má medián 216 ms pri CPU 4× (hranica je 200 ms), `volba.js` má 10 104 B gzip a
  súčet „21 €“ v cenníku nie je.

**Prečo nevyhrala cesta k termínu, hoci má najvyššiu hodnotu:** jej jadro, oprava kroku 4, sa zapracuje tak či tak
(je to nález WEB-03 a REZ-02). Jej hravá časť, skladačka, potrebuje súhlas majiteľa. Majiteľ výslovne pýta film,
s ktorým zákazník niečo robí, a to bez rozhodovania dodá len Kino.

## Jeden súdržný zážitok: „Film, ktorý riadiš“ (telefón, ako ho zažije zákazník)

1. **Úvod:** nadpis „Každý človek. Každé želanie. Jedno miesto.“, pod ním ako dnes Objednať sa a Zavolať. Vľavo hore
   pod lištou je ▶ „Prehrať prehliadku“, v úvode iba ▶, nič iné z pásu.
2. **Ťuk na ▶ = Kino:** kamera pomaly prejde kapitoly (Poď ďalej → Remeslo → Čakáreň → Ľudia → Služby → Galéria →
   Rezervácia). Pri každej postojí 3,2 s, cez tím, cenník a galériu ide strihom filmu. Ak zákazník hudbu nevypol,
   pustí sa. Akýkoľvek dotyk, koliesko, kláves alebo skrytie karty Kino hneď zastaví.
3. **Pás kapitol:** 8 segmentov, aktuálny sa plní oranžovou a vedľa je názov („04 · Čakáreň“). Ťuk na segment skočí
   na kapitolu, ťah po páse pretáča film, šípky ←/→ fungujú. Nad cenníkom a tímom sa stiahne na 2 px čiaru.
4. **Zastavenie:** po 1,8 s bez skrolu sa ukáže „Ďalej: Čakáreň ↓“, ťuk znamená jazdu do ďalšej miestnosti.
5. **V zábere:** na skutočnom predmete (buldog, pumpa, karafa, kreslo, káva) je svetlý bod. Po ťuku kamera nájde
   na predmet a ukáže vetu zo stránky (napr. „Kreslá, retro pumpa a farebný buldog. Káva aj minerálka sú zdarma.“).
   Druhý ťuk, Esc alebo skrol kameru vráti.
6. **Remeslo:** pri obchádzaní kresla bežia dole titulky krokov z cenníka (Konzultácia → … → Styling a kolínska).
7. **Zvuk (len so zapnutou hudbou):** na ulici je hudba tlmená ako spoza dverí a po vstupe sa otvorí. Pri strihu
   v Remesle raz cvaknú nožnice. Keď film po 3 minútach zastane, hudba dozneje.
8. **Koniec = termín:** Kino zastane na „Kedy si sadneš?“ s Objednať sa. Okno objednávky má v kroku 4 „Dokončiť“
   vždy na očiach a ťahák s presným postupom, takže sa výber v rezervačnom systéme nestratí.
9. **Po rozhodnutí majiteľa:** skladačka návštevy nad cenníkom (KV-03) a body s cenami (KH-01).

**Pravidlá súhry (záväzné pre B1–B8):**
- Zákazník má vždy prednosť: jeho dotyk, koliesko alebo kláves Kino zastaví. Ťah po páse nastaví skrol okamžite,
  kamera dobehne pružinou ako dnes.
- Otvorené menu, okno Barbera na telefóne alebo okno objednávky skryjú pás, Ďalej, bod aj titulky.
  Ponuka jazyka: pás čaká (`:has(.lang-offer.in)` ako v prototype), po WEB-02 sa s čipom v lište neprekrýva.
- Nad pásmi s textom (cenník, tím) sa neukazuje Ďalej ani bod a pás je len 2 px čiara na **rovnakom mieste**
  (inak sa pod kurzorom hojdá a ťah nejde, poznatok prototypu).
- **Žiadne tmavé dosky ani okná:** pás, Ďalej a titulky sú len čiary a text s tieňom. Karta bodu je svetlá
  (`#f1e9dd`) ako v prototype hry.
- Pri `prefers-reduced-motion` a `?motion=off` Kino skáče bez jazdy, bod nepulzuje, titulky sú statické a namiesto
  nájazdu sa ukáže len veta.
- Výkon: logika pásu ide do **jednej slučky app.js**, ktorá `scrollY` už číta (KF-NAVRHY:92–96), bez vlastného
  poslucháča skrolu. Počas skrolu sa nič nemeria, bod sa ukáže až 160 ms po zastavení (`hra.js:128–131`).
  Kino, Ďalej, bod a titulky sú v lenivom module (`kino.js`), ktorý sa načíta v nečinnosti (C5) alebo okamžite pri
  ťuku na ▶.
- Rozpočet B1–B8: app.js najviac +2,5 kB gzip, lenivý modul do 7 kB gzip, 0 nových obrázkov, zvukov a knižníc.
  `vaha.mjs` pre telefón do udalosti load najviac +3 kB.
- Texty: každý nový text rozhrania má 8 jazykov (sk + 7 slovníkov `assets/i18n/*.json`). Žiadne nové fakty, ceny ani
  sľuby a žiadna zmienka o AI (štítok AI pri ikone Barbera ostáva).

## Zapracovať teraz

**Poradie:** A1 → A14, potom C1 → C3, B1 → B4, C4 → C9, B5 → B8 a nakoniec záverečná brána.
Po každom bode samostatný lokálny commit po slovensky (autor `Claude <noreply@anthropic.com>`, bez riadkov
Co-Authored-By a Claude-Session). Nič nepushovať ani nenasadzovať.

### A – nálezy (vážne a stredné povinne, drobné lacné)

**A1 · BAR-01 (vážna) – smerovač cenníka dáva číslo inej služby**
- Čo: preniesť prototyp `barber/senior/barber/prototyp-smerovac.diff`, body 1–5 a 7: strih a brada len so spojkou
  alebo slovom „úprava“, zápor „bez/okrem“, farbenie brady pozná fúzy, šediny a tónovanie, dlhé vlasy poznajú
  „vlasov dlhších“, „do hladka“ ide na Hot Towel pred úpravou brady, CENA pozná „koľko dám“.
- Kde: `assets/asistent-otazky.js` (SLUZBY :109–125, CENA :126, INE :129–133) a **rovnako** `asistent/lib/otazky.php`
  (:98–117). Potom `node source/tools/otazky.mjs` (kópia pre web).
- Stráž: `barber/senior/barber/nastroje/sada-150-ceny.json` dať do `source/tools/` a v `otazky.mjs --kontrola`
  zlyhať pri každej otázke na jednu službu, ktorá dostane číslo inej služby.
- Meranie: `node barber/senior/barber/nastroje/hodnot.mjs <sada-150-ceny.json> hs-skvrny/barbershop-30`
  - `c:ZLÉ ČÍSLO` 0 (dnes 8), `t:ZLÉ ČÍSLO` 0 (dnes 1), `c:TELEFÓN` 0;
  - zhoda servera a okna **150/150** (samotný prototyp v JS dáva 132/150, PHP chýba);
  - `otazky.mjs --kontrola` všetko OK;
  - sada 120 + stará sada A6 sa zmení najviac v 3 odpovediach, všetky mimo témy na telefón.

**A2 · BAR-02 (stredná) – otázka na dve služby dostane cenu jednej**
- Čo: skladanie prvých viet overených odpovedí `cena-<s>`/`trvanie-<s>` (prototyp `cennik-viac` v tom istom diffe).
  „Pre syna“ bez slova strih nie je detský strih, „pre mňa a pre syna“ sú dvaja ľudia. Server dá modelu na prvé
  miesta všetky nájdené odpovede služieb. Nič sa nesčítava.
- Kde: `asistent-otazky.js` a `otazky.php`.
- Meranie: `hodnot.mjs` sada 150, kombinácie #127–#150:
  - 0 zavádzajúcich čísel (#135 nesmie dostať 28 €);
  - neúplné najviac #128, #131 a #150, ich čísla sú pri správnych službách;
  - zhoda 150/150.

**A3 · BAR-03 (stredná) + BAR-07 (drobná) – stráž MIMO**
- Čo: pred hľadaním: strih, holenie alebo cena + pes, mačka, zviera, trávnik, plot, ker, strom, záhrada → telefón.
  „Kedy má otvorené“ + iné miesto (pošta, lekáreň, Tesco, plaváreň, banka) → telefón.
- Kde: JS aj PHP. MIMO v `source/tools/otazky-ocakavane.json` rozšíriť o trávnik, živý plot, holenie psa a plaváreň.
- Meranie: `hodnot.mjs` sada 120 mimo témy má 0 odpovedí s cenou (dnes 3); `otazky.mjs --kontrola` OK; „kedy ma
  otvorene posta“ a „Kedy je otvorená plaváreň?“ dostanú telefón; „Video zo strihu“ ostane pri svojej odpovedi.

**A4 · BAR-04 (stredná) – po 8 otázkach okno potichu prestane odpovedať**
- Čo:
  - pripravené odpovede (`pripravena()`, `asistent.js:261–266`) a ukážka sú bez limitu;
  - naostro `posli()` (:306–312) neblokuje, ale pošle len posledné správy. Okno musí spĺňať `asistent/lib/jadro.php:115–127`:
    najviac 15 správ, nepárny počet, začína a končí otázkou (`r: 'u'`), spolu pod MAX_SPOLU;
  - ak sa nedá ani tak: hláška v zornom poli (`scrollIntoView`), prázdne pole a v bubline tlačidlo „Nový rozhovor“.
- Meranie:
  - `node barber/senior/barber/nastroje/dlhy.cjs <port> <out.png>` rozšírený na 20 otázok v ukážke: každá odpoveď
    je vidieť, 0× „Rozhovor je už dlhý“, snímku otvoriť;
  - naostro cez `page.route` na api.php po 20 otázkach: každé telo má `spravy` ≤ 15, nepárne, prvá `u`;
  - `asistent/testy/spusti.sh` (kópia) bez nových FAIL; konzola 0 chýb.

**A5 · BAR-05, BAR-06 (len znenia), BAR-08, BAR-09 (drobné) – znenia a jediný zdroj faktov**
- Čo:
  - BAR-05: znenia overené v `barber/senior/barber/kopia-znenia/`: `'barberk'` do CELE (JS :30, PHP :22),
    barberka, tím, instagram, objednanie-online;
  - BAR-06: znenia „Je kartička zadarmo?“, „Čo patrí k pánskemu strihu?“, „Dostanem peniaze späť, ak sa mi strih
    nepáči?“, ale len k odpovediam, ktoré na ne naozaj odpovedajú (vernostna, obsah pánskeho strihu,
    o-time-vratenie-penazi);
  - BAR-08: do `asistent/znalosti/barbershop.md` doplniť buldoga v čakárni (`index.html:273`) a 10 predstavení
    barberov **doslova z webu**, vetu na :72 zmeniť na „roky praxe a špecializácie jednotlivých barberov web neuvádza“;
  - BAR-09: odpoveď o oholení hlavy začať „K oholeniu hlavy patrí…“.
- Meranie:
  - `otazky.mjs --kontrola` všetko OK; `znenia-sonda`: 7 zo 7 správne;
  - 3 otázky BAR-06 dostanú správne id;
  - `grep -c buldog barbershop.md` ≥ 1 a skript potvrdí, že 10 textov tímu sa doslova zhoduje s `index.html`;
  - porovnanie 390 otázok zo sád: zmeny len k lepšiemu (zoznam do zápisu).

**A6 · REZ-01 (vážna, náš diel) + REZ-05 + REZ-08 – kontrola domény a návody**
- Čo:
  - nový `source/tools/domena-kontrola.sh <https://doména>` (curl) skontroluje:
    1. `/rezervacia` vráti 200 **a** obsahuje `v-order-component`;
    2. `css/app.css` a `js/app.js` z tej stránky vrátia 200;
    3. `/rezervacia/ajax` na GET vráti 405;
    4. `http://…/rezervacia` presmeruje na https (REZ-08);
    5. `https://…/rezervacia/` nepresmeruje na http (REZ-08);
    6. voliteľne `--web=<základ webu>`: `assets/tema-rezervacia.css` vráti 200 (REZ-05).
    Kontroly 1–3 a 5 sú kritické, 4 a 6 sú upozornenia. Návratový kód je 0 len vtedy, keď prejdú všetky kritické;
  - `README.md:183–190` prepísať: koreň domény je Laravel (cookie `laravel_session`, `/index.html` 404).
    `index.php`, `/rezervacia`, `/rezervacia/ajax`, `css/`, `js/`, `images/` a `fonts/` musia ostať. Nový web
    nesmie byť na `/rezervacia` ani `/rezervacia.html` (MultiViews). Pred prepnutím a po ňom spustiť
    `domena-kontrola.sh`; samotný kód 200 nestačí;
  - `docs/TEMA_REZERVACIA.md:16`: adresa platí až po nasadení vetvy, overiť ju nástrojom. Po prepnutí domény dať
    adresu na doméne alebo súbor do ich `public/css/`.
- Meranie:
  - beh proti `https://www.barbershop30.sk` (cez proxy): 1–3 OK, 4 a 5 hlásia REZ-08 (dnes 301 na http), 6 hlási
    404 (REZ-05). Výstup vložiť do zápisu;
  - simulovaná kolízia: dočasný priečinok, v ňom náš `rezervacia.html` uložený ako súbor `rezervacia`, server
    `python3 -I -m http.server` na vlastnom porte → kontrola 1 zlyhá „chýba v-order-component“ a návratový kód je ≠ 0;
    server po sebe zastaviť podľa PID.

**A7 · REZ-03 (stredná) – voľno barbera okno ukáže ako „zatvorené“**
- Čo:
  - `objednavka_dni` (`asistent/lib/kalendar.php:157–169`) vráti aj `volno`: dni barbera mínus dni „Nezáleží“
    (pravidlá Nezáleží cez `kal_pravidla`, cache 1 h). `sviatky` budú len spoločné dni;
  - v `objednavka.js` (`kresliDni`, :340–348) dostanú dni z `volno` text `L.nepracuje` (8 jazykov v T, :25 ff.).
    Pri ťuku sa ukáže „{barber} v tento deň nepracuje.“ a tlačidlo „Iný barber“, ktoré vráti na krok 2.
- Meranie:
  - nový prípad v teste kalendára (`asistent/testy`): barber s dňami navyše → `volno` ich obsahuje a `sviatky` nie;
  - `barber/senior/rezervacia/nastroje/okno-hrany.mjs` (falošné API): Adrianovo voľno 6. 11. má `aria-label`
    „piatok 6. novembra, nepracuje“ (dnes „zatvorené“), skutočný sviatok ostane „zatvorené“, 54+ OK / 0 FAIL;
  - kľúč `nepracuje` je vo všetkých 8 jazykoch.

**A8 · WEB-03 (stredná) + REZ-02 (a) (stredná) + KV-01, KV-02, KV-09 + REZ-04, REZ-06 – krok 4 a okno objednávky**
- Čo:
  - zo `koncept-volba/prototyp/web/barbershop-30/assets/objednavka.js` preniesť:
    - päta kroku 4: Dokončiť nad telefónom (:192–203), pri Späť sa odstráni;
    - ťahák (:429–464): slovenské názvy služieb, „Stránka rezervácie je po slovensky“ v iných jazykoch, po ťuku
      nadpis „Rezervácia sa otvorila v novej karte. Vyber v nej:“;
  - z `objednavka.css` prototypu preniesť :191–195 (nízky telefón, `.obj-spat { white-space: nowrap }`, krok pod 360 px);
  - na `rezervacia.html` na počítači dať Dokončiť nad Zavolať (`.obj-stranka`);
  - REZ-04: `.obj button, .obj-sluzby, .obj-tim, .obj-dni, .obj-mriezka { -webkit-user-select: none; user-select: none }`
    a `.obj button { touch-action: manipulation }`;
  - REZ-06: `.obj .obj-h:focus-visible { outline: none }` (`objednavka.css:22` vs :41);
  - do skladačky (volba.js) nič.
- Meranie:
  - `node barber/senior/koncept-volba/nastroje/krok4-test.mjs <base> <out> sk,en,uk,hu,sr,pl,de,cs` na strome:
    `viditelne: true` pri 390×844, 360×740 a 320×568, `poSpat: 0`, ťahák v 8 jazykoch, jedno okno na
    `https://www.barbershop30.sk/rezervacia`;
  - `okno-hrany.mjs`: 54 OK / 0 FAIL, plus nové kontroly:
    - po dvojkliku v krokoch 2–4 je `getSelection().toString() === ''`;
    - `rezervacia.html?sluzba=1` má na `.obj-h` vypočítaný `outline-style` `none`;
    - „← Späť“ má pri 320 px výšku ≤ 44 px;
  - `objednavka-test.mjs` (kópia, falošný systém) 54 OK; snímky `krok4-sk-320/390` otvoriť.

**A9 · WEB-01 (stredná) – okno Barbera po otočení telefónu**
- Čo: v `asistent.js` po definícii `uzky` (:437) pridať `uzky.addEventListener('change', () => { if (!panel.hidden) { modal(true); prisposob(); } })`.
  `modal()` je na :365–372.
- Meranie: `barber/senior/web/skripty/otocenie.cjs`, oba smery:
  - na výšku → na šírku: `aria-modal` chýba, inert 0, `elementFromPoint` vedľa okna je prvok stránky (nie BODY);
  - na šírku → na výšku: `aria-modal="true"`, inert ≥ 9, Tab ostane v okne;
  - do `asistent-test.mjs` pridať otočenie.

**A10 · WEB-02 (stredná) – ponuka jazyka zakryje nadpis**
- Čo: v `i18n.css` (:60–65) pre `(max-height: 600px)` ukázať ponuku ako malý čip v lište vpravo pri menu: tlačidlo
  jazyka a ×, celá veta ostane pre čítačku. Pri 390×844 a na počítači sa nič nemení.
- Meranie:
  - `node barber/senior/web/skripty/sonda.cjs --casti=ponuka`: „kryje“ nadpis aj tlačidlá 0 % vo všetkých 7 oknách
    (320×568 hu, 568×320 de, 844×390 uk, 390×844, 360×740, 1440×900, 1024×768; dnes 36 %, 53 % a 14 %);
  - snímka 390×844 je zhodná s dnešnou;
  - po B2 je prienik čipu a ▶ 0 px².

**A11 · FIL-2 (stredná) – strih sála → stôl na počítači cez tmavé operadlo**
- Čo: `film.js:196` zmeniť na `'sala>stol': 'pohyb left m:prelinanie'`, rovnako ako `kava>sud` (:202), ktorý majiteľ
  už dal opraviť. Telefón ostane pri prelínaní (parser `m:`, :206–221), pokojový záber sa nemení.
  Rozhodnutie: pravidlo majiteľa „žiadne čierne polia ani okná“ a precedens 24526676.
- Meranie:
  - `node barber/senior/nastroje/a5-film.mjs --mode=desk1440 --variant=safari`: `cut-sala-stol-m30` a `m50` majú
    súvislú tmavú plochu ≤ 5 % (dnes 25,4 % a 25,9 %) a jas obrazu ≥ 55 (dnes 46,5);
  - `film/obrazovka.mjs --mode=desk1440 --step=0.05`: p010 s filmom najviac o 5 b. tmavšie než záloha (dnes 56,4 vs 41,5);
  - hárok strihu otvoriť.

**A12 · FIL-1 (drobná) + FIL-3 (návrh) – farba čistenia a jedno kreslenie po zmene rozlíšenia**
- Čo:
  - `film.js:328` zmeniť na `renderer.setClearColor(new THREE.Color(14 / 255, 13 / 255, 12 / 255), 1)` a opraviť
    komentár pri :1254;
  - `quality(dt, now)` volať pred `draw()` vo `frame()` (:1308 / :1336) a zrušiť druhé `draw(now, 0)` (:1235–1237).
    Snímka po zmene rozlíšenia sa musí stále nakresliť v tom istom rAF.
- Meranie:
  - `a5-film.mjs --variant=prod --passes=okno`: stred plátna po zmene je `[14,13,12,255]` (dnes `[1,1,1,255]`),
    `tatIstaSnimka: true`, `zablesky: []`;
  - telefón `--fakedt=30`: 0 čiernych snímok;
  - variant `kontrola` stále zachytí čiernu, nástroj teda funguje;
  - počítadlo `drawElements`/`drawArrays` v snímke so zmenou ukáže 1 prechod (dnes 2);
  - pokojové zábery sú pixelovo zhodné.

**A13 · WEB-06 (drobná, pravidlo „ostré fotky“) – úvodná fotka na tablete na výšku**
- Čo: `index.html:173–175`: `sizes="(max-width: 720px) 93vw, 124vw"` doplniť o prípad `(orientation: portrait)`.
  Šírku odvodiť z pomeru strán fotky (atribúty width/height) a výšky okna (`…vh`).
- Meranie: `a2-vzhlad.cjs` 820×1180 @2: `#uvod img` berie `vstup-2896` s ≥ 1,25 bodu na CSS px (dnes 2172, 1,04).
  Pri 390×844 a 1440×900 sa `currentSrc` nezmení, `vaha.mjs` pre telefón tiež nie.

**A14 · WEB-04 (drobná) – mobil-audit bez Pillow**
- Čo: `source/tools/mobil-audit.mjs:50–55`: tmu merať v prehliadači (canvas, ITU-R 601, rovnaký prah ako
  `tma-test.mjs:49`), prehľad snímok skladať v prehliadači, nie cez ImageDraw.
- Meranie: `python3 -I -c "from PIL import Image"` stále zlyhá, `node source/tools/mobil-audit.mjs` na HEAD dobehne
  a tma je na tých istých snímkach zhodná s výpočtom `tma-test.mjs` (±1).

### B – zážitok „Film, ktorý riadiš“

**B1 · KF-10 – aktívna kapitola z ukázanej karty (predpoklad pásu)**
- Čo: `app.js:228–238` brať kapitolu z kotvy s `is-shown` (:222), nie z `closestSection`. `aria-current` v menu,
  lište a páse bude súhlasiť s kartou.
- Meranie:
  - `node barber/senior/koncept-film/nastroje/karta.mjs <url> <out> 700 1139 …`: scene = kapitola ukázanej karty
    vo všetkých polohách (dnes y=700 → 2 pri karte Úvod, y=1139 → 3 pri Poď ďalej);
  - `app-smoke` bodky na počítači OK.

**B2 · KF-01 – pás kapitol ako vo videoprehrávači**
- Čo: z `koncept-film/prototyp/barbershop-30/assets/kino.{js,css}` preniesť pás.
  - Logika ide do slučky `app.js`, štýly do `style.css`. Použiť existujúcu `nav.story-line` (`index.html:135–144`),
    odkazy fungujú aj bez JS. Zrušiť `display: none` pod 1100 px (`style.css:370`).
  - Telefón: hore pod lištou. Počítač: dole v strede s názvom „04 · Čakáreň“. Názvy sú z `aria-label`, ktoré i18n prekladá.
  - Ťuk skočí, ťah pretáča (pointer capture), šípky ←/→ v páse.
  - V úvode len ▶. Nad cenníkom a tímom 2 px čiara na rovnakom mieste.
  - Skrytý pri otvorenom menu, Barberovi a objednávke. Počká na ponuku jazyka. Bez pozadia.
- Meranie:
  - `node barber/senior/koncept-film/nastroje/kino-test.mjs <url> <out> mobile|desktop`: 8 kapitol, ťah 2 → 6,
    klávesnica, jazyky en/de/uk/hu, `chyby: []`;
  - prienik pásu s textom cenníka, kartou, spodnými tlačidlami, ikonou Barbera a ponukou jazyka je 0 px² pri
    320/360/390/430 a 1440 px;
  - `paint.mjs` (CPU 4×): práca pásu ≤ 0,5 ms na snímku, `grep -c "addEventListener('scroll'"` v kóde pásu 0;
  - `ab.mjs` skrol bez filmu: dlhé úlohy v šume (±15 %), p50 17 ms;
  - `a2-vzhlad` čierne bunky ≤ 0,06 %.

**B3 · KF-02 – Kino ▶ „Prehrať prehliadku“**
- Čo:
  - jazda podľa prototypu: aspoň 1,8 s, ease-in-out, státie 3,2 s, cez tím, cenník a galériu strih;
  - stop pri dotyku, kolieske, klávese a `visibilitychange`; pri obmedzenom pohybe skoky po 5 s; koniec na Rezervácii;
  - aria-label Prehrať/Zastaviť (7 slovníkov už v prototype);
  - ▶ výslovne spustí `atmosfera`, len ak `localStorage['b30-hudba']` nehovorí „vypnuté“ (`atmosfera.js:71–77`).
    Pozor na C6: ťuk na ovládač inak hudbu nepúšťa.
- Meranie:
  - `kino-ciele.mjs`: 7 cieľov (kapitoly 2 → 8), celá jazda 33 ± 3 s, každé státie ≥ 3 s, prerušenie do 1 snímky;
  - snímky každých 500 ms počas Kina: tma v žiadnej nie je o viac ako 3 b. vyššia než pri ručnom skrole na tej istej
    polohe (`film/obrazovka.mjs`), žiadna prázdna tmavá karta tímu;
  - konzola 0 chýb;
  - Safari na iPhone ide do kontroly na zariadení (pre majiteľa).

**B4 · KF-03 – „Ďalej: …“ pri zastavení**
- Čo: po 1,8 s bez skrolu. Telefón vľavo hore pod pásom, počítač vľavo dole. Nie v úvode, na poslednej kapitole,
  počas Kina ani nad pásmi s textom. Text „Ďalej“ je v 7 slovníkoch.
- Meranie:
  - `kino-test.mjs` → `dalej` „Ďalej Čakáreň ↓“, `href` je správna kotva;
  - prienik s kartou, spodnými tlačidlami a ikonou Barbera je 0 px² pri 320–430 px;
  - kontrast textu s tieňom ≥ 4,5 : 1 na najsvetlejšom zábere (fasáda `vstup`), merané z pixelov snímky.

**B5 · KF-07 – titulky „krok za krokom“ v Remesle**
- Čo: počas sekvencie `okolo-kresla` (telefón, `film.js:706` seqDrive) a záberu `stol` (počítač) sa striedajú kroky
  z `index.html:504–514` (už preložené). Text s tieňom bez dosky, mimo karty, pásu a Ďalej.
  Pri obmedzenom pohybe sa neukazujú.
- Meranie: 5 polôh sekvencie pri 390 aj 1440: v každej jeden krok, prienik s kartou, CTA a pásom 0, kontrast ≥ 4,5 : 1,
  `ab.mjs` bez nových dlhých úloh.

**B6 · KF-06 + KH-01 bez cien – bod v zábere „Pozri bližšie“**
- Čo:
  - body na 4 záberoch (stol, cakaren, kreslo-stred, kava) s polohami overenými na mriežke (`hra.js:57` BODY,
    `koncept-hra/snimky/mriezka/`), náhradné body na telefóne ako v prototype;
  - ťuk alebo Enter: 1,2 s nájazd kamery cez `place(s, now, push)` (`film.js:1040`) a svetlá karta s **vetou zo
    stránky** (karta záberu alebo `data-place`). Bez ceny a bez priradenia služby;
  - bez filmu: len karta, bez zväčšenia;
  - Esc, druhý ťuk alebo skrol vráti kameru a fokus na bod; počas skrolu sa nič nemeria;
  - jediný nový text rozhrania „Pozri bližšie“ (aria) v 8 jazykoch;
  - bod sa schová pod textom karty a nad pásmi s textom (na telefóne nesmie ležať na texte tímu ako
    `mobile-filmon-kreslo-stred-karta.png`).
- Meranie:
  - ťuk → začiatok nájazdu: INP ≤ 200 ms pri CPU 4× (prototyp 112–120 ms);
  - počas nájazdu hustota textúry ≥ 1,0 texelu na zariadenie-px (výpočet z rozmeru textúry a mierky v `film.js`,
    vypísať), takže fotka nebude neostrá;
  - prienik karty a bodu s textom karty záberu je 0;
  - `hra-test.mjs` (scény, Esc, fokus) prejde na strome; konzola 0.

**B7 · KF-05 – zvuk ako vo filme (len so zapnutou hudbou)**
- Čo: v `atmosfera.js` (gain :96, rampy :141):
  - prológ: dolná priepusť ~800 Hz, po vstupe otvorená;
  - jeden strih nožníc zo `strih.webm` pri strihu Remesla, raz za návštevu;
  - po 3 min pokoja (film zastane) hudba dozneje;
  - 0 nových súborov.
- Meranie: `source/tools/atmosfera-test.mjs` rozšíriť:
  - s hudbou: frekvencia filtra pri `vstup` ≤ 1 kHz a po rohožke ≥ 15 kHz, nožnice práve 1× pri Remesle;
  - bez hudby: 0 prehraní, AudioContext sa nevytvorí;
  - `git diff --stat assets/audio` prázdny; A4-1 platí (švih hudbu nepustí).

**B8 · KH-07 (len stlačenie) – odozva tlačidiel**
- Čo: `.btn:active { transform: scale(.97) }`, 120 ms, len `transform`, pri obmedzenom pohybe nič. Bez magnetu.
- Meranie: snímky v pokoji pri 390 a 1440 pixelovo zhodné s dneškom, CLS 0, INP tlačidiel bez zmeny (`mer.cjs interakcie`).

### C – plynulosť (telefón ľahký a plynulý)

**C1 · PLY-01 + PLY-08 (len CSS) – nasadenie bez komentárov**
- Čo: nový `source/tools/zmensi.mjs <priečinok>`. Z HTML odstráni `<!-- … -->` (po všetkých `sed` krokoch).
  Zo `style.css` a ďalších CSS odstráni `/* … */`, ale len zo súborov, kde `grep` nenájde `/*` v reťazci ani `url(`.
  Volať v `.github/workflows/pages.yml` po `en-stranka.mjs` (:81) a v `nasad-barbershop30.sh` po `en-stranka.mjs`.
  Do `vaha.mjs` pridať stráž: gzip spracovaného `index.html` < 14 600 B.
- Meranie:
  - na kópii `_site` gzip `index.html` ≤ 14 600 B (výpočet 14 334 B), `en/` ≤ 14 000 B, `style.css` ≈ 14,4 kB;
  - `i18n-test`, `en-test` a `app-smoke` na spracovanej kópii prejdú;
  - snímky 390 a 1440 zhodné;
  - `mer.cjs ab` Slow 4G: FCP medián −0,4 s alebo lepšie (`ab-html.log:27–35`: 2 128 → 1 564 ms).

**C2 · PLY-07 – `fetchpriority="low"`**
- Čo: `index.html:938` (vernost.js), `:942` (film.js) a `rezervacia.html:431`.
- Meranie:
  - `mer.cjs nacitanie` Slow 4G, 3 behy: fotka úvodu hotová o ≥ 0,3 s skôr (`ab-html.log`: 4 183 → 3 717 ms);
  - `uvod-meranie.mjs`: prológ nezačne neskôr ako dnes + 100 ms.

**C3 · PLY-02 – fotky krokov rezervácie až po fotke úvodu**
- Čo: 4× `.rez-skup-foto` (`rezervacia.html:106, 143, 168, 187`): `srcset` → `data-srcset`. Nastaviť ich
  v `rezervacia.js` po `load` v `requestIdleCallback`. Rozmery `img` ostanú, pridať `<noscript>` zálohu.
- Meranie:
  - `mer.cjs` (`sonda-rez.cjs`): LCP Slow 4G medián ≤ 4,0 s (dnes 5,7–6,0 s), 4G ≤ 1,1 s, CLS 0;
  - pri doskrolovaní je každá fotka kroku do 1 s načítaná (`naturalWidth` > 0), snímku otvoriť.

**C4 · PLY-05 – ťuknutia bez vynúteného rozloženia**
- Čo:
  - `setMenu` (`app.js:529–546`): `focus()` presunúť do `requestAnimationFrame` po zápise, `inert` nastaviť až po fokuse;
  - rovnako Barber (`otvor` → `modal` → fokus) a objednávka (`objednavka.js:164–207`, `nadpis.focus`).
- Meranie:
  - `mer.cjs interakcie` (CPU 4×, bez filmu): INP menu, Barber a Objednať ≤ 200 ms v mediáne (dnes 464/240,
    456/232, 312/576 ms), vynútené rozloženie v LoAF ≤ 30 ms;
  - Tab ostane v menu (`web/skripty/overenie.cjs`: mimo lišty ≤ 2) a Barber na telefóne je stále modálny.

**C5 · PLY-04 – prvý švih bez piatich modulov naraz**
- Čo: `app.js:377, 414, 438, 452, 469`. Gesto len posunie plán. Moduly sa načítajú po jednom v nečinnosti
  (limit 3–5 s) v poradí objednávka → asistent → i18n → atmosfera → karty → kino (B2–B6).
  Okamžite sa načítajú len pri `pointerdown`/`click` na prvok, ktorý modul potrebuje (Objednať, ▶).
  i18n pre uložený iný jazyk ide hneď (C7).
- Meranie:
  - `mer.cjs gesto`, dotyk 0,5 s po load: p95 ≤ 120 ms, najdlhšia snímka ≤ 300 ms, dlhé úlohy spolu ≤ 2 000 ms
    (dnes 283 / 1 167 / 3 467 ms);
  - ikona Barbera a tlačidlo Hudba sa ukážu do 4 s.

**C6 · PLY-10 (a) – prvý ťuk na ovládač nezakladá AudioContext**
- Čo: `atmosfera.js:183` `onBtn`: okrem `.hudba` vynechať aj `a, button, [role=button], summary, input, select,
  textarea, label`. Ťuk do fotky hudbu pustí ako dnes, ▶ ju spúšťa výslovne (B3).
- Meranie:
  - `mer.cjs interakcie`: prvý ťuk na menu má INP ≤ 300 ms pri CPU 4× (dnes 904 ms, z toho 306 ms atmosfera)
    a vytvorí 0 AudioContextov;
  - `atmosfera-test.mjs` prejde a švih hudbu nepustí.

**C7 · PLY-06 (body 1 a 2) – uložený jazyk bez čakania na nadpis**
- Čo: hlavičkový skript (`index.html:12`) pri `g && g != 'sk'` pridá `modulepreload` i18n.js a `preload` slovníka.
  i18n.js najprv synchrónne preloží `.title-hero` a `.nav`, zruší `t-wait` a zvyšok preloží po kúskoch.
- Meranie:
  - `mer.cjs nacitanie ?lang=en` 4G: LCP medián ≤ 1 300 ms (dnes 2 180 a 2 688 ms; `en/` 808 ms);
  - `i18n-test` 55/0;
  - na prvej snímke s nadpisom nie je slovenský text.

**C8 · PLY-11 – film.js sa nesťahuje tam, kde film nebude**
- Čo: hlavičkový skript (`index.html:12`) pri nesplnených podmienkach rovno pridá `world-off`. `film.js` vloží
  dynamicky len pri `world` alebo `?film=on`.
- Meranie:
  - pri `deviceMemory` 2, `prefers-reduced-motion` a `?motion=off` sa `film.js` nestiahne, `world-off` je nastavené,
    konzola 0 a snímky sú zhodné s dneškom;
  - pri `?film=on` `a5-film.mjs --variant=prod` prejde;
  - `app-smoke` (`?film=off`, `?motion=off`) prejde.

**C9 · PLY-03 – prejazd `--sp` ako scroll-driven animácia (stredné riziko, posledný)**
- Čo: v `@supports (animation-timeline: view())` dať kotvám `.film-shot` `view-timeline` a 4 pravidlám
  (`style.css:460, 579, 1413, 1423`) `animation … linear both`. Rozsah má zodpovedať
  `t = (y + vh/2 − top) / height` (napr. `animation-range: cover 50vh cover calc(100% - 50vh)`).
  `app.js:188` zapisuje `--sp` len bez podpory.
- Meranie:
  - na 30 polohách sa vypočítaný `transform` 4 prvkov líši od dnešnej cesty cez JS najviac o 0,002 v mierke;
  - `strih-shot.mjs` a `scenes-shot.mjs` vizuálne zhodné;
  - `skrol-ab` (8 švihov): čas štýlu ≥ 40 % nižší, mutácie ≤ 250 (dnes 671);
  - s vynúteným `CSS.supports = false` ostane cesta cez JS a výsledky sú rovnaké.

### Záverečná brána (po všetkom, na HEAD)

- Testy:
  - `app-smoke`, `i18n-test`, `en-test`, `en-stranka.mjs --check`, `vychytavky-test`, `admin-test`,
    `otazky.mjs --kontrola`, `vaha`, `mobil-audit` (po A14) = 0 FAIL;
  - `objednavka-test` a `asistent-test` v kópii so zástupnou knižnicou;
  - `tma-test` nespúšťať (v kontajneri padá na rozbitom Pillow aj na starých commitoch), tmu merať cez
    `film/obrazovka.mjs` a `a2-vzhlad`.
- Konzola 0 chýb a 0 odpovedí ≥ 400 na 10 stránkach × 320/390/1440 (`web/skripty/sonda2.cjs`).
- Vzhľad: pretečenie 0, čierne bunky ≤ 0,06 % (`a2-vzhlad`), SEO `a3-seo.mjs` CHYBA 0 a OK ≥ 171.
- `vaha` pre telefón najviac +3 kB do udalosti load.
- `grep -oE '\bAI\b'` v `index.html`, `en/index.html` a `asistent-otazky.json` ostane 0 / 0 / 3.
- Commity: `git log --format=%B c8febb66..HEAD | grep -ci "co-authored\|claude-session"` → 0.
- Porty: každý beh má vlastný port, server zastaviť podľa PID, nie `pkill`.

## Odložiť (s dôvodom)

| id | čo | prečo nie teraz |
|---|---|---|
| KV-03, KV-05, KV-06, KV-08, KV-11 | skladačka návštevy, živý lístok, pamäť, scéna skupiny, ukážky práce | Rozhodnutie majiteľa: súčty a „približne N min“ nie sú v cenníku, treba vybrať jednu skladačku. Prototyp je hotový (odporúčaný základ) |
| KH-02 | „Zostav si návštevu“ s tipom balíčka | To isté miesto ako KV-03. Tip „obsahuje všetko“ nesedí s cenníkom (`index.html:579`: „depilácia uší“) |
| BAR-11 | skladačka v okne Barbera | Tretia verzia tej istej hry, rozhodne majiteľ |
| KH-01 (plná verzia s cenami) | body predmet → služba s cenou | Priradenia uterák/karafa/kreslo sú nové tvrdenia o službách. Teraz ide len verzia s vetou zo stránky (B6) |
| KF-04 | „Čo to bude dnes?“ scéna s voľbou | Páry voľba → záber a 3 nové texty schvaľuje majiteľ, `naradie`/`kreslo` dnes nie sú v ceste filmu |
| KH-03 | holiaca pena | Zakryje riadok cenníka hračkou, mení vzhľad cenníka v pokoji, pre objednávky malý prínos. Rozhodne majiteľ |
| KH-10 | zvonček recepcie | Nový symbol a zvuk, majiteľ musí súhlasiť |
| KF-08 | záverečné titulky | Predĺži telefón (dnes 21,5 okna), zopakuje tím a má nový text „V hlavných úlohách“. Najprv nech majiteľ vidí Kino |
| KH-04, KH-08 | pás s náhľadmi, barber pole | Nahradené pásom KF-01, dva ukazovatele kapitol by sa bili |
| KH-09 | „Neviem si vybrať“ v tíme | Riziko, že bude pôsobiť ako lotéria o barbera, rozhodne majiteľ |
| KH-11 | zbierka predmetov | Stojí na plnej verzii KH-01 |
| KF-09, KH-05 | náklon na iPhone | Nízka hodnota, rušivé systémové okno povolenia, v kontajneri sa nedá overiť |
| KF-12, KH-06, N-5 | haptika | Nízka hodnota, iOS ju nepodporuje |
| KF-11 | kapitola Výsledok | Čaká na skutočné fotky so súhlasom klientov |
| N-4 | návrh otázky pre Barbera v scéne | Ďalší ovládač v scéne vedľa pásu, Ďalej a bodu. Najprv zmerať, ako zákazníci používajú B2–B6 |
| KV-04 | ťahák pri priamych tlačidlách | Bez prototypu. Zákazník je už v novej karte a bublina na starej zmizne po 12 s. Lepšie je KV-07 |
| KV-07, REZ-02 (b), (c) | predvoľby v živom systéme, objednávka v okne | Robí to správca systému, prípadne treba písomný súhlas prevádzky (pre majiteľa) |
| KV-10 | rýchlejší doplnok, dlhé úlohy v nečinnosti pri cenníku | Časť 1 patrí ku skladačke. Časť 2 overiť stopou na skutočnom telefóne, v kontajneri ich môže spôsobovať SwiftShader (plynulosť nameral 0 práce v pokoji, `pokoj.log:2`) |
| KV-12 | najbližšie voľné v lístku | Až s pripojeným kalendárom a po REZ-03 |
| PLY-08 (JS), PLY-09 | minifikácia JS, menší three.js | Potrebuje nástroj na zostavenie (esbuild, rollup), ktorý v kontajneri nie je a nesmie sa inštalovať, zisk sa nedá overiť lokálne |
| PLY-12 | `content-visibility` | Stredné riziko pre polohy kotiev filmu, A/B v šume (záťaž 16–21) |
| PLY-13 | písmo Manrope | Bez fontTools sa podmnožina nedá zmerať, prednačítanie by súperilo s fotkou úvodu |
| PLY-14 | dekódovanie fotiek na počítači | Hypotéza, overiť na skutočnom GPU |
| WEB-05 | CLS 0,028 bez GPU | Pod hranicou 0,1, len bez grafickej karty, príčina neistá. Test spúšťať 3× |
| WEB-07 | cyrilské pätkové písmo | Rozhodnutie majiteľa (+1 súbor) |
| BAR-06 (tolerancia preklepov) | preklepy → telefón | Až keď stráž BAR-07 (A3) ukáže rezervu, znenia sú v A5 |
| BAR-10 | recepcia v sobotu | Pokus so znením posunul inú otázku, treba zlúčiť odpovede |
| REZ-07 | chyby živého formulára | Systém správcu, zoznam ide majiteľovi |
| REZ-09 | okno objednávky naostro | Zapnutie je rozhodnutie a súhlas prevádzky |
| FIL-4 | Retina Mac a iPhone | Len na zariadeniach majiteľa |

## Pre majiteľa

1. **Doména (REZ-01):** S hostingom a správcom rezervácie potvrdiť, že pri prepnutí domény ostanú `index.php`,
   `/rezervacia`, `/rezervacia/ajax` a priečinky `css/`, `js/`, `images/`, `fonts/` (Laravel) a nový web pôjde len
   vedľa. Treba rozhodnúť adresu našej rezervačnej stránky na doméne (návrh `/objednavka/`) alebo písomne potvrdiť
   vypnuté MultiViews. Pred prepnutím a po ňom spustiť `domena-kontrola.sh`.
2. **Nasadenie (REZ-05):** Kedy nasadiť vetvu (GitHub Pages dnes beží zo staršieho main `d2cf2450`)? Riadok
   s `tema-rezervacia.css` poslať správcovi až po overení 200.
3. **HTTPS (REZ-08):** Hosting má presmerovať HTTP na HTTPS na celej doméne. Dnes `https://…/rezervacia/` presmeruje
   na `http://`.
4. **Správca rezervačného systému:**
   - (a) predvoľby `?sluzba&barber&datum&cas` (REZ-02 b, KV-07), aby sa výber z webu nestratil;
   - (b) zoznam REZ-07: večný kruh pri výpadku siete, chyba v konzole, polia bez label, telefón ako `type=text`,
     chýba odkaz na ochranu údajov, medzera na telefóne;
   - (c) objednávka priamo v okne (REZ-02 c) len s písomným súhlasom prevádzky.
5. **Okno objednávky naostro (REZ-09):** súhlas prevádzky s čítaním voľných časov a premenná `ASISTENT_KALENDAR_URL`.
   Pred zapnutím jedna kontrolná požiadavka `getEmployees` so `services:[1]`.
6. **Skladačka „Poskladaj si návštevu“:**
   - vybrať jednu z troch: cesta k termínu KV-03 (odporúčam), hra KH-02 alebo Barber BAR-11;
   - súhlasíte so zobrazením vypočítaného súčtu („Spolu podľa cenníka 21 €“, „približne 45 min“), ktorý v cenníku nie je?
   - tip na balíček len so schváleným znením: Balíček 1 má v cenníku „depilácia uší“, prototyp ho tipuje aj pri
     „Depilácia uší a nosa voskom“ (`index.html:579`);
   - dá sa v systéme objednať viac služieb naraz? Zhrnutie má „Pridať službu“.
7. **Body v scéne s cenami (KH-01):** schváliť priradenia uterák → Úprava brady, karafa → Ultra inclusive (pohárik
   whisky), kreslo → Pánsky strih. Bez súhlasu ostane bod len s vetou zo stránky.
8. **„Čo to bude dnes?“ (KF-04):** schváliť páry Strih → stôl, Brada → náradie, Balíček → kreslo uprostred a 3 krátke texty.
9. **Ukážky pripravené len na pohľad:** holiaca pena v cenníku (KH-03), zvonček recepcie (KH-10), záverečné titulky
   „V hlavných úlohách…“ (KF-08). Áno, alebo nie?
10. **Kapitola Výsledok (KF-11):** skutočné fotky strihov so súhlasom klientov (otázka 16).
11. **Film:** strih sála → stôl na počítači opravujeme podľa vášho pravidla „žiadne čierne plochy“. Strih čakáreň →
    ranná sála ide tiež popri tmavom operadle (tma 28–29 %, jas 57–74). Upraviť aj ten?
12. **Ukrajinčina (WEB-07):** doplniť cyrilské pätkové písmo pre nadpisy (+1 súbor), alebo nechať systémové?
13. **Angličtina (PLY-06 bod 3):** pri uloženej angličtine presmerovať na statickú `en/`? Mení to adresu.
14. **Meranie úspechu hravosti:** web nemá analytiku (`app.js:9`). Bez nej ostáva test s 5 zákazníkmi a počet
    online rezervácií pred a po. Chcete analytiku?
15. **Kontrola na vašich zariadeniach pred odovzdaním (2–5 min, FIL-4, B3):** Mac a iPhone: film pomaly, rýchlo a pri
    otočení, Kino ▶ v Safari (koniec stránky, panel s adresou) a plynulosť pásu.

## Overenie v tomto behu (príkazy a otvorené snímky)

- `git -C hs-skvrny log --oneline -1` → `791fb3db …`; `git -C hs-skvrny status --short | wc -l` → `0`.
- Veľkosti prototypov (`gzip -9c | wc -c`):
  - `kino.js` 10 890 / **4 382** B, `kino.css` 5 817 / **1 988** B;
  - `hra.js` 31 175 / **11 432** B, `hra.css` 8 976 / 2 527 B;
  - `volba.js` 25 679 / **10 104** B, `volba.css` 11 241 / 3 032 B.
- `sonda-inp-final.log` (medián / max, ms): ťuk na text 48 / 80, rozbalenie popisu 96 / 128, služba 128 / 344,
  skupina 128 / 184, **doplnok 216 / 368**.
- `koncept-film/prototyp/vystup-mobil/kino-test.json`: `pas.odkazy 8`, `dalej "Ďalej Čakáreň ↓"`,
  `prerusenie.hra false`, `reduced.ys "0 0 0 0 0 1055 1055 1055"`, `chyby []`.
- `koncept-volba/snimky/proto2-sk/krok4.json`: `vPate true, tlacidloHore 736, tlacidloDole 786, vyskaOkna 844,
  viditelne true, poSpat 0`.
- `koncept-hra/nastroje/meranie-prototyp.json` s filmom: p95 167 a 333 ms; `meranie-dnes.json`: 133 a 133 ms.
- `barber/prototyp-sada-150-ceny.log`: `c:ZLÉ ČÍSLO` 0, kombinácie #128, #131, #150, zhoda 132/150 (PHP chýba);
  `sada-150-ceny.log` dnes: `c:ZLÉ ČÍSLO 8`, `k:ZLÉ ČÍSLO 10`, `t:ZLÉ ČÍSLO 1`.
- Kód:
  - `film.js:196` `'sala>stol': 'popredie left a:0.27,0.55 m:prelinanie'`, `:202` `'kava>sud': 'pohyb left'`,
    `:328` `setClearColor(0x0e0d0c, 1)`, `:209` parser `m:`;
  - `objednavka.js:424` `href: REZERVACIA` bez parametrov, `:152` päta len s telefónom;
  - `objednavka.css:22` / `:41`;
  - `asistent.js:28` `MAX_SPRAV = 15`, `:365–372` `modal()`, `:437` `uzky`;
  - `asistent/lib/jadro.php:115–127` (striedanie u/a, začína aj končí otázkou);
  - `kalendar.php:143` (disabled_dates → sviatky), `:167`;
  - `style.css:370` (`display: none` pod 1100 px), `index.html:135–144` (`nav.story-line`);
  - `index.html:173` `sizes="(max-width: 720px) 93vw, 124vw"`, `index.html:579` (Balíček 1);
  - `index.html:938`, `:942`, `rezervacia.html:431` (skripty), `atmosfera.js:183` (`onBtn` len `.hudba`), `:71` (`b30-hudba`);
  - `README.md:183–190`, `mobil-audit.mjs:50–55` (PIL);
  - `asistent/znalosti/barbershop.md:72`, buldog v ňom 0×.
- WebKit v `/opt/pw-browsers` nie je (`chromium`, `chromium-1243`, `chromium_headless_shell-1243`, `ffmpeg-1011`),
  Safari sa teda overiť nedá.
- Otvorené snímky:
  - koncept-film: `koncept-film/prototyp/kino-telefon-pas.png`, `pas-mobil-polohy.png`, `pas-pocitac-polohy.png`;
  - koncept-hra: `koncept-hra/prototyp/snimky/mobile-filmon-stol-karta.png`, `mobile-filmon-cakaren.png`,
    `desktop-filmon-cakaren-karta.png`, `mobile-filmon-zostav-1.png`, `mobile-filmon-kreslo-stred-karta.png`,
    `koncept-hra/prototyp/video/pas-snimok.png`;
  - koncept-volba: `koncept-volba/prototyp/video/pas-skladacka-v2.jpg`, `pas-krok4-telefon.jpg`,
    `koncept-volba/snimky/proto2/krok4-sk-320.png`, `krok4-de-390-po-tuku.png`, `v3-telefon-off/06-barber.png`,
    `dnes/dnes-okno-krok4-390.png`.
- Moje hárky z videí (`ffmpeg`, otvorené):
  - `vyber/kino-pocitac-harok.jpg` (z `kino-pocitac.mp4`, 57 s): ▶ v úvode a pás, ktorý počká na ponuku jazyka;
  - `vyber/skladacka-pocitac-harok.jpg` (z `skladacka-pocitac-off.mp4`, 28 s): svetlý lístok vpravo, ťahák po ťuku;
  - `vyber/hra-telefon-harok.jpg` (z `ukazka-telefon.mp4`, 33 s): bod na päte kresla pod textom tímu, pena ako svetlý blok.
