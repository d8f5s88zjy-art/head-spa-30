# V5 etapa 1 – Recepcia: kontrola obsahu a faktov, kolo 1 (23. 10. 2026)

Kontrolór: nezávislý (redaktor + právne minimum). V strome som nič nemenil. Strom `$SP/hs-recepcia`, HEAD `be841ed`,
`git status --short` prázdny. `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
Riadky `index.html:N` sú v `$SP/hs-recepcia/barbershop-30/index.html`.

**Verdikt: NEPRIJATÉ v tomto kole.** Našiel som 3 vážne, 8 stredných a 10 drobných nálezov. Zdroje 30 odpovedí sú v poriadku.
Problém nie je v textoch odpovedí, ale v tom, **ktorá odpoveď sa ukáže na ktorú otázku**, a v troch vetách, ktoré tvrdia
o webe niečo nepravdivé. Testovacia sada má 100 %, no je šitá na kmene. Na 102 nezávislých slovenských otázkach som
našiel 12 jasných chýb a v každom z 8 jazykov rovnakú chybu s cenou.

Prehliadač som nepoužil. Na kontrolu obsahu ho netreba a nič vizuálne netvrdím.

**Dokončenie kontroly (druhý prechod, 23. 10. 2026).** Prvý zápis tohto súboru sa neuzavrel, preto som všetky tvrdenia
overil znova nad HEAD `be841ed` (`git status --short` prázdny) a doplnil chýbajúce časti: náhodnú vzorku prekladov
(10 položiek na jazyk), opravené čísla riadkov v S7 a drobné nálezy D8–D10. Otázky som púšťal pomocnou skúškou mimo stromu
`$SP/barber/lahky-telefon/v2/stavba-v5/k1-skusaj.mjs` (volá `odpovedz` z `assets/recepcia.js` nad `assets/recepcia/<jazyk>.json`,
vstup riadky `jazyk|otázka`). Všetky výsledky citované vo V1–S5 vyšli pri opakovanom behu rovnako.

---

## Čo prešlo (s dôkazom)

1. **Zdroje 30 odpovedí existujú a odpovede z nich nevybočujú.** Každý `zdroj` som vypísal cez `sed -n "<n>p" index.html`
   a porovnal s `sk.json:33–62`. Všetkých 52 riadkov sedí doslovne, napr. `index.html:829` „Po–Pi 9:00–19:00<br>So 9:00–14:00<br>Ne zatvorené“
   a `index.html:529/531` „Pánsky strih … 18 €“. Žiadna odpoveď nepridáva cenu, čas, „vždy“ ani zdravotnú radu. „Zdarma“ je len
   v `kava` a je doslova na `index.html:287`.
2. **Nepotvrdené časti uzlov sú správne vynechané.** Položka `kresla` hovorí len „8 kresiel“ a vynecháva „v troch miestnostiach“,
   ktoré sú nepotvrdené (OTAZKY:18). Položka `recepcia` hovorí len „Pri dverách ťa privíta recepčná.“ a vynecháva
   „ako jediný… 8 rokov“ (OTAZKY:17). Romanine ceny ani dni sa neuvádzajú (OTAZKY:22, :101).
3. **Témy „nevieme“ len odovzdávajú.** Všetkých 20 tém (`sk.json:65–84`) má iba `odovzdanie` a akcie tel/e-mail/rezervácia/mapa/
   Google. Žiadna nič nesľubuje. Pokrývajú OTAZKY č. 1–8 a 11–18 a navyše trvanie, dámske strihy, inú službu s cenou a zdravie.
   Body 9 a 10 rieši skrátenie odpovedí (bod 2). Body 19–24 sú interné a návštevník sa na ne nepýta.
4. **Slovo AI ani jeho ekvivalenty nie sú na verejných súboroch.** `git diff f624ee8 HEAD | grep '^+'` s
   `\bAI\b|umel|artificial|künstlich|штучн|mesterséges|veštač|sztuczn|uměl|chatbot|asistent|assistant|GPT|Claude` našiel zhody
   len v `source/tools/recepcia-test.mjs` (pozri S7) a falošné zhody („Sobot“, „Modelowanie“). Správy commitov sú čisté.
5. **Úvodná veta je pravdivá.** `sk.json:19`: „Odpovedám z pripravených odpovedí k podniku. Na ostatné vám rada odpovie
   recepcia.“ Nepredstiera model ani človeka. Štýl a oslovenie rozoberám v D4 a S6.
6. **V slovníkoch pribudol jediný kľúč.** (overené znova: `zmenené 0` pre každý jazyk) Python porovnanie s `f624ee8` ukázalo pre en, uk, hu, sr, pl, de aj cs 262 → 263
   kľúčov, nový je len „Spýtaj sa recepcie“ a zmenený nie je žiadny.
7. **Preklady sú verné a nepridávajú fakty.** Náhodná vzorka 10 položiek na jazyk (Python `random.seed('k1'+jazyk)`,
   zoznam nižšie v časti „Vzorka prekladov“) plus úvodné texty panelu, fallback a odovzdanie v každom jazyku. Ceny sú ako na stránke („18 €“, „21,50 €“), telefón je +421 951 267 203. uk je v cyrilike, sr v latinke
   rovnako ako `assets/i18n/sr.json`. Diakritiku som v hu, pl a cs skontroloval bez nálezu.
8. **Veta o súkromí je pravdivá.** „Odpovede sú zo stránky, nič sa neodosiela.“ (`sk.json:23`). Sieť používa len
   `fetch(recepcia/<jazyk>.json)` (`recepcia.js:68`) a otázka ide do stránky cez `textContent` (`recepcia.js:67`, `:93`).
9. **Test autora prechádza.** `node --test source/tools/recepcia-test.mjs`: 277 otázok, 100,0 %, falošné 0, tests 11/pass 11.

---

## Nálezy

### VÁŽNE

**V1 – Na „masáž hlavy“, „umytie hlavy“ a „strih na nulu strojčekom“ ukáže cenu oholenia hlavy, a to v 8 jazykoch.**
- Dôkaz (`odpovedz` z `assets/recepcia.js` nad `assets/recepcia/<jazyk>.json`):
  - `kolko stoji masaz hlavy` → `odpoved hlava | Oholenie hlavy 13 €`
  - `kolko stoji umytie hlavy` → `odpoved hlava | Oholenie hlavy 13 €`
  - `kolko stoji strih na nulu strojcekom` → `odpoved hlava | Oholenie hlavy 13 €`
  - `en how much is a head massage` → `Head shave 13 €`, `de was kostet eine Kopfmassage` → `Kopfrasur 13 €`,
    `cs kolik stojí masáž hlavy` → `Oholení hlavy 13 €`. To isté platí pre uk, hu, pl a sr.
- Prečo je to vážne: v tej istej budove je HEAD SPA, takže na masáž hlavy sa ľudia pýtať budú. Stránka opisuje oholenie ako
  „holenie britvou“ (`index.html:553`), strih strojčekom patrí k pánskemu strihu za 18 € (`index.html:529`). Návštevník tak
  dostane cenu inej služby.
- Príčina: silný kmeň `Hlav` a variant otázky „strih na nulu“ (`sk.json:45`). V en je variant „buzz cut“, v pl „strzyżenie na
  zero“, v cs „střih na nulu“, v sr „šišanje na nulu“. Testovacia sada túto väzbu ešte potvrdzuje: `['strih na nulu', 'hlava']`
  (`recepcia-test.mjs`, blok ceny).
- Návrh:
  - `Hlav` zmeniť na slabý kmeň a za silné nechať len `Ohol`, `Dohola`, `Holen`.
  - Vyhodiť varianty „strih na nulu“ a „buzz cut“ (vo všetkých jazykoch).
  - Pridať kmene masáže (`Masaz`, `Massag`, `масаж`, `masszázs`, `masaż`, `masaža`) do `cena-ina-sluzba`, alebo vytvoriť tému
    „nevieme“ masáž s odovzdaním.
  - „umytie/mytí/wash“ smerovať na `co-je-v-strihu`.
  - Všetky príklady z tohto bodu doplniť do sady ako negatívne.

**V2 – Odpoveď „trvanie služieb nemáme potvrdené“ je nepravdivá, lebo cenník trvania ukazuje.**
- Dôkaz:
  - `sk.json:81`: `"id": "trvanie" … "odovzdanie": "trvanie služieb"`. Panel z toho zloží „Na webe zatiaľ nemáme potvrdené:
    trvanie služieb.“
  - Stránka pritom trvania viditeľne uvádza: `index.html:530` „40 min“ (Pánsky strih), `:536` „60 min“, `:542` „60 min“,
    `:548` „45 min“, `:554` „25 min“, `:566` „20 min“, `:572` „30 min“, `:578`, `:590` „65 min“, `:596` „80 min“, `:608`,
    `:614` „5 min“, `:620`, `:626`, `:632`.
  - `.price-time` je viditeľný (`style.css:753`). Trvania sú aj v slovníkoch (pl.json „40 min“ … „80 min“).
- Rovnaká nepravda je v 7 prekladoch (en „how long services take“, de „Dauer der Leistungen“ atď.).
- Návrh: urobiť z `trvanie` položku so zdrojom.
  - Najjednoduchšia veta: „Trvanie každej služby je v cenníku pri cene.“ s akciou „Celý cenník“. Je to nová veta, preto ju
    musí potvrdiť redakcia.
  - Doslovná možnosť: pre strih „Pánsky strih 40 min“ (`index.html:529–530`), pre bradu „Úprava brady 20 min“
    (`index.html:565–566`).
  - Návrh (`asistent.md` časť 6, riadok „trvanie“) a plán („trvania“) vychádzajú zo starého stavu „None min“ a treba ich opraviť.

**V3 – Pri bežnom preklepe tvrdí, že pánsky strih v cenníku nie je.**
- Dôkaz:
  - `kolko stoji strich` → `nevieme cena-ina-sluzba | Túto službu v cenníku nemáme; pozri si celý cenník.`
  - `cs kolik stoji strich` → „Tuto službu v ceníku nemáme“.
  - `de was kostet ein Haarschnit` → `romana-ceny` („Romanas Preise und Tage …“).
- Príčina: pravidlo `cena` (`recepcia.js:59–60`) sa spustí vždy, keď je v otázke cenové slovo a žiadna položka neprekročí
  prah. Preklep „strich“ pritom dá k `Strih` zhodu 0,6 (`recepcia.js:23`), a to nestačí.
- Návrh:
  - Pravidlo `cena` použiť len vtedy, keď žiadna položka nemá ani čiastočnú zhodu (napr. `p[0][0] < 0.15`). Inak ukázať
    „Myslíš toto?“ alebo fallback.
  - Vetu zmierniť na „Túto službu v cenníku neviem nájsť; pozri si celý cenník.“, aby netvrdila fakt o podniku.

### STREDNÉ

**S1 – Odpoveď o školeniach odporuje stránke.**
- `sk.json:80` → „Na webe zatiaľ nemáme potvrdené: školenia a voľné miesta.“
- Stránka pritom ukazuje `index.html:842` „<strong>Školenia</strong><span>na poschodí, pod značkou Barbershop 30</span>“.
- Návrh: odovzdanie „podrobnosti o školeniach a voľné miesta“. Zmysel „nevieme“ ostane a stránke to neodporuje.

**S2 – Zdravotné otázky dostanú cenu služby namiesto odovzdania.**
- Dôkaz:
  - `Mam citlivu plet, mozem ist na peeling?` → `odpoved plet | Starostlivosť o pleť PREMIUM 21,50 €`, čo vyznie ako „áno, príďte“.
  - `vypadavaju mi vlasy` → `odpoved farbenie-vlasov` (Romana).
  - `mam lupiny co mam robit` → fallback. To je v poriadku.
  - V en tá istá otázka funguje (`I have sensitive skin can I get a peeling` → `zdravie`), v sk nie, lebo kmene `citliv pokozk`
    sú v `sk.json:84` slabé (malé písmená), kým `Plet` je silný.
- Návrh: v `zdravie` urobiť silné kmene `Citliv`, `Vypadav`, `Lupin`, `Svrb`, `Podrazd` (a ich ekvivalenty v ďalších jazykoch).
  Veto „nevieme“ (`recepcia.js:35`) potom zabezpečí prednosť.

**S3 – Na otázky s dátumom sviatku ukáže bežné hodiny.**
- Dôkaz:
  - `mate otvorene 24.12?` → `vyber hodiny,online`, `otvarate 31.12` → `odpoved hodiny`, `mate otvorene 1. novembra` → `odpoved hodiny`.
  - `en are you open on 24 December`, `de habt ihr am 24.12. offen` aj `cs máte otevřeno 24.12.` → „Myslíš toto?“ s hodinami.
  - Rezervácia pritom tieto dni blokuje (OTAZKY:14, 47). Odpoveď „Po–Pi 9:00–19:00“ na 24. 12. 2026 (štvrtok) je zavádzajúca.
- Návrh: do `sviatky` pridať silné kmene mesiacov a dátumov („Decemb“, „Novemb“, „Januar“, `=24`, `=25`, `=26`, `=31`, `=1`
  v kombinácii s mesiacom, „Silvest“). Normalizácia dnes z „24.12“ urobí „24 12“ a `=24` už existuje, no veto ho neberie, lebo
  `=24` je zapísaný malými písmenami.

**S4 – Číslo 10 v otázke vedie na príplatok za dlhé vlasy.**
- Dôkaz: `chcem sa ostrihat zajtra o 10` → `odpoved cena-dlhe | Pánsky strih – dĺžka vlasov nad 10 cm 22 €`.
  Rovnako `en can I come in at 10` → „hair over 10 cm 22 €“.
- Príčina: silný kmeň `=10!` v `sk.json:42`.
- Návrh: `10` presunúť do druhej skupiny s `Cm`/`Dlh` (zápis `|`), aby samo nestačilo.

**S5 – Odovzdanie na nesprávnu tému.**
- Dôkaz:
  - `mate dnes volny termin` → „Na webe zatiaľ nemáme potvrdené: školenia a voľné miesta.“ (kmeň `Voln`, `sk.json:80`)
  - `pridem o 10 minut neskor` / `cs přijdu o 10 minut později` → „trvanie služieb“ (kmeň `Minut`). Správne je `storno`
    (meškanie, OTAZKY:11).
  - `kolko stoji umytie vlasov` → „Ceny a dni Romany na webe neuvádzame…“
  - `kto je romana` → len ceny a dni, hoci stránka hovorí, čo robí (`index.html:484`).
- Návrh:
  - `Voln` spájať len s `Miest`/`Prac`.
  - Do `storno` pridať `Neskor`, `Pozde`, `Mesk` ako silné kmene.
  - `Vlas` v `romana-ceny` podmieniť farbením.
  - „kto je romana“ smerovať na `farbenie-vlasov`.

**S6 – Panel strieda tykanie a vykanie, hoci stránka iba tyká.**
- Dôkaz:
  - Stránka tyká všade: `index.html:238` „ťa privíta“, `:312` „vyberieš“, `:810` „Zavolaj“, `:822` „Kde nás nájdeš“.
    `grep -n -E "\bvám\b|\bvás\b|nájdete|zavolajte" index.html` nenašiel nič.
  - Panel pritom píše `sk.json:19` „Na ostatné **vám** rada odpovie recepcia“ a `sk.json:26` voľbu „Kde nás **nájdete**“,
    hneď vedľa „Napíš otázku…“ a „Myslíš toto?“.
  - Rovnaký mix je v cs („vám ráda odpoví“, „Kde nás najdete“, hoci slovník má „Kde nás najdeš“), uk („вам“), sr („vam“)
    a pl („wam“, čo je navyše oslovenie v množnom čísle).
- Zadanie kontroly hovorí „vykanie ako zvyšok webu“, no zvyšok webu tyká. Plán (`PLAN-TELEFON-V2.md:296`) predpisuje
  „Kde nás nájdete“.
- Návrh: zjednotiť na tykanie podľa stránky: „Na ostatné ti rada odpovie recepcia.“ a „Kde nás nájdeš“ (aj cs, uk, sr, pl).
  Ak má byť vykanie, rozhodne o ňom majiteľ pre celý web, nie len pre jednu vetu.

**S7 – Testovací súbor v strome spomína AI.**
- Dôkaz: `source/tools/recepcia-test.mjs:17` komentár „bez slova AI v textoch“, `:234` názov testu „… bez slova AI“,
  `:241` regex `/\bAI\b|umel[áa] inteligenc|chatbot|asistent/` a hláška „zmienka o AI“ (riadky overené `grep -n`;
  prvý zápis uvádzal nesprávne `:922`, `:1139`, `:1146`).
- Porušuje to pravidlo „bez zmienky o AI v kóde, komentároch…“ zo zadania aj z OTAZKY:105.
- Návrh: test nazvať „bez zakázaných označení“ a zoznam slov načítať zo súboru mimo stromu (napr. `stavba-v5/zakazane.txt`).
  Ak súbor chýba, kontrola sa preskočí s upozornením.

**S8 – Testovacia sada je šitá na odpovede (bod 6 zadania).**
- Dôkaz:
  - Sada (`recepcia-test.mjs`, `SADA`) má 277 otázok so 100 %. Väčšinou sú to krátke tvary blízko kmeňov.
  - Preklepov je len 10 a otázok mimo témy 5.
  - Chýbajú: otázky s číslom alebo dátumom, viac zámerov v jednej vete, služby mimo cenníka so spoločným kmeňom
    (masáž hlavy, umytie), zdravie bez slova „alerg“ a „ekzem“, preklepy hlavných slov („strich“).
  - Sada potvrdzuje aj chybnú väzbu `['strih na nulu', 'hlava']`.
- Môj nezávislý pokus:
  - 102 slovenských otázok (hovorové, bez diakritiky, s preklepmi), z toho 12 jasne zlých:
    masáž/umytie hlavy, umytie vlasov, citlivá pleť, vypadávanie vlasov, 24.12, 31.12, 1. novembra, „o 10“, „voľný termín“,
    „meškám… minút neskôr“, „strich“.
  - Z nich 3 triedy dávajú nesprávnu cenu alebo nepravdivé tvrdenie (V1, V3, S4).
  - K tomu 38 otázok v 7 jazykoch, kde sa V1 opakuje v každom z nich.
- Návrh: otázky z V1–S5 pridať ako **odloženú (held-out) sadu**, ktorú autor kmeňov nevidí pri ladení. Kritérium ≥ 90 % merať
  na nej.

### DROBNÉ

- **D1 Facebook.** Na otázku `Mate facebook?` príde odpoveď o Instagrame (`sk.json:61`), hoci stránka má odkaz na Facebook
  (`index.html:877`) a návrh 5.30 ho počíta. Návrh: doplniť `facebook` do `kontakt` a akciu „Facebook“.
- **D2 Vernostná kartička.** Odpoveď „Na webe zatiaľ nemáme potvrdené: vernostnú kartičku.“ ide proti viditeľnému odkazu
  „Vernostná kartička“ v pätičke (`index.html:879`, v tomto strome nie je skrytý). Návrh: „podrobnosti vernostnej kartičky“.
  Otázky „zľava pre študentov/seniorov“ vedú tiež na `vernost`, čo je prijateľné.
- **D3 Fallback.** „Toto neviem presne.“ (`sk.json:30`), en „I don't know this exactly.“, de „Das weiß ich nicht genau.“
  naznačujú, že odpoveď približne pozná. Návrh: „Na toto nemám pripravenú odpoveď.“ (en „I don't have a prepared answer
  to that.“).
- **D4 Úvodná veta.** „Odpovedám z pripravených odpovedí…“ opakuje slovo a hovorí v prvej osobe pod nadpisom „Recepcia“, no
  o recepcii potom píše v tretej osobe. Dá sa to pochopiť tak, že odpisuje človek. Návrh: „Tu sú pripravené odpovede zo
  stránky. Na ostatné ti rada odpovie recepcia.“
- **D5 Romana dvakrát.** Odpoveď `farbenie-vlasov` (`sk.json:54`) má dve vety s „robí Romana“ (`index.html:484` + `:642`).
  Stačí veta z `:642` s nadpisom skupiny.
- **D6 uk Romana.** V odpovedi je „Romana“ latinkou (zo slovníka), v `romana-ceny` cyrilikou „Романи“. Treba zjednotiť,
  napr. podľa slovníka.
- **D7 de slovník.** Veta odpovede `rezervacia` „Ruf am Empfang an, Mo–Fr …“ nie je idiomatická („Ruf beim Empfang an“). Ide o
  vetu zo slovníka `assets/i18n/de.json`, takže oprava patrí do samostatnej zmeny stránky, nie do recepcie.
- **D8 Správa commitu.** Telo `c7ffb2f` (riadok 3 správy) cituje cestu „návrh barber/lahky-telefon/v2/asistent.md“.
  Nejde o označenie pre návštevníka, no slovo „asistent“ je v správe, ktorú pravidlá chcú bez takých zmienok. Návrh: pri
  ďalšom commite cesty návrhu necitovať (správu existujúceho lokálneho commitu nemeniť bez súhlasu vedúceho).
- **D9 „kolko cakam“.** Otázka na čakanie na termín → `odpoved kava` („Vzadu ťa čaká káva.“). Nie je to nepravda, ale
  odpovedá na inú otázku. Návrh: kmeň `Cak` ponechať pre čakáreň len so slovom `kde`, inak fallback.
- **D10 Deti nad 10 rokov.** `kolko stoji strih pre syna 12 rokov` → `deti` 15 €. Odpoveď sama obsahuje „pre chlapcov do 10 rokov“
  (`index.html:549`), takže neklame. Bez opravy, len na vedomie majiteľovi (OTAZKY bod pre vek nie je).

---

## Vzorka prekladov (10 náhodných položiek na jazyk)

Výber: `random.seed('k1'+jazyk); random.sample(sorted(id), 10)` nad 50 id (30 položiek + 20 tém). Pri každej položke som
porovnal text so `sk.json` a so slovníkom `assets/i18n/<jazyk>.json`. Ceny, čísla a telefón sú zhodné; nová skutočnosť nie je
v žiadnej.

| jazyk | vzorka | výsledok |
|---|---|---|
| en | farbenie-vlasov, socialne, kresla, obocie, holenie, trvanie, email, co-je-v-strihu, damske, storno | verné; „trvanie“ nesie nepravdu z V2 |
| uk (cyrilika) | whatsapp, holenie, cena-strih-brada, telefon, odkedy, balicky, romana-ceny, kava, depilacia, bezbarierovy | verné; D6 (Romana vs Романи); úvod „вам“ → S6 |
| hu | depilacia, romana-ceny, platba, whatsapp, tim, cena-dlhe, cena-ina-sluzba, bez-objednania, cena-strih, zdravie | verné, diakritika (ő, ű) správna; úvod bez oslovenia |
| sr (latinka ako `i18n/sr.json`) | zdravie, romana-ceny, skolenia, tim, co-je-v-strihu, damske, parkovanie, platba, deti, pripomienka | verné; „skolenia“ nesie S1, úvod „vam“ → S6 |
| pl | produkty, storno, kresla, deti, vernost, recepcia, cena-ina-sluzba, plet, tim, platba | verné; úvod „wam“ (množné číslo) → S6 |
| de | tim, storno, poukazky, produkty, parkovanie, co-je-v-strihu, cena-dlhe, plet, telefon, balicky | verné; úvod „Ich antworte mit vorbereiteten Antworten“ opakuje slovo (ako D4) |
| cs | co-je-v-strihu, obocie, telefon, rezervacia, jazyky-tim, holenie, vernost, vysledky, bez-objednania, storno | verné; voľba „Kde nás najdete“ hoci slovník má „Kde nás najdeš“ → S6 |

---

## Prehľad 30 položiek (sk)

| id | zdroj | text sedí | poznámka |
|---|---|---|---|
| hodiny | :829 | áno | sviatky podľa dátumu → S3 |
| adresa | :826 | áno | – |
| telefon | :827 | áno | – |
| email | :828 | áno | – |
| rezervacia | :810 | áno | – |
| online | :839 | áno | – |
| cena-strih | :529, :531 | áno | preklep „strich“ → V3 |
| cena-strih-brada | :535, :537 | áno | – |
| cena-brada | :565, :567 | áno | – |
| cena-dlhe | :541, :543 | áno | „o 10“ → S4 |
| deti | :547, :549 | áno | „do 10 rokov“ je na stránke |
| holenie | :571, :573 | áno | – |
| hlava | :553, :555 | áno | nesprávne priradenie → V1 |
| balicky | :589–597 | áno | – |
| ultra | :595, :597 | áno | – |
| plet | :607, :609 | áno | citlivá pleť → S2 |
| obocie | :613–633 | áno | – |
| depilacia | :619, :621 | áno | – |
| farbenie-brady | :577, :579 | áno | – |
| ornament | :625, :627 | áno | – |
| ceny-konecne | :506 | áno | – |
| farbenie-vlasov | :484, :642 | áno | D5 |
| tim | :312 | áno | – |
| vyber-barbera | :312 | áno | – |
| co-je-v-strihu | :515, :517–521 | áno | – |
| kava | :286, :287 | áno | „zdarma“ je na stránke |
| kresla | :838 (len 1. časť) | áno | nepotvrdené vynechané |
| odkedy | :837 | áno | – |
| socialne | :767, :768 | áno | D1 |
| recepcia | :238 (len 1. veta) | áno | nepotvrdené vynechané |

## Pokrytie OTAZKY-PRE-MAJITELA (nepotvrdené body)

| OTAZKY | téma v recepcii | stav |
|---|---|---|
| 1 platba | platba | áno |
| 2 poukážky | poukazky | áno |
| 3 storno, meškanie | storno | áno, meškanie „minút neskôr“ ide inam → S5 |
| 4 pripomienka | pripomienka | áno |
| 5 bez objednania | bez-objednania | áno |
| 6 sviatky | sviatky | áno, dátumy nie → S3 |
| 7 parkovanie, MHD | parkovanie | áno |
| 8 bezbariérovosť | bezbarierovy | áno |
| 9 „8 rokov, jediný“ | vynechané v `recepcia` | áno |
| 10 „tri miestnosti“ | vynechané v `kresla` | áno |
| 11 školenia, kariéra | skolenia | áno, znenie → S1 |
| 12 WhatsApp | whatsapp | áno |
| 13 značky | produkty | áno |
| 14 Romana ceny, dni | romana-ceny | áno |
| 15 vernosť | vernost | áno, znenie → D2 |
| 16 výsledky strihov | vysledky | áno (`index.html:675–678` je skrytý blok) |
| 17 jazyky barberov | jazyky-tim | áno |
| 18 hodnotenie číslom | hodnotenie | áno |
| 19–24 | interné | – (GDPR otázka → fallback, čo je v poriadku) |
| návrh: trvania | trvanie | **stránka ich má → V2** |
| návrh: dámske | damske | áno |

## Preklady (bod 3)

Prešiel som všetky položky, nie iba 10. Tu sú len nálezy, ostatné je verné:

| jazyk | význam a fakty | pravopis | nálezy |
|---|---|---|---|
| en | verné | ok | D3; „buzz cut“ → V1 |
| uk | verné, cyrilika | ok | „вам“ → S6; Romana/Романи → D6 |
| hu | verné | ok | – |
| sr | verné, latinka ako slovník | ok | „vam“ → S6 |
| pl | verné | ok | „wam“ (množné číslo) → S6 |
| de | verné | ok | D3; D7 (zo slovníka) |
| cs | verné | ok | „vám“, „Kde nás najdete“ proti slovníku „Kde nás najdeš“ → S6 |

## Čo opraviť pred kolom 2 (poradie)

1. V1, V2 a V3 (ceny a nepravdivé vety), všetko v 8 jazykoch.
2. S1–S5 (kmene, veto a znenie) a pridať odloženú sadu podľa S8.
3. Vyriešiť S6 (oslovenie) a S7 (AI v teste).
4. Drobné body D1–D7 podľa uváženia.
