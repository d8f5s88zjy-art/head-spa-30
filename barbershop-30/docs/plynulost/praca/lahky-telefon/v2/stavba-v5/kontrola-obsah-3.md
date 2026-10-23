# V5 etapa 1 – Recepcia: kontrola obsahu a faktov, kolo 3 (23. 10. 2026)

Kontrolór: nezávislý (redaktor + právne minimum). V strome som nič nemenil.
- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
- Strom: `$SP/hs-recepcia`, HEAD `d4657b7`, `git status --short` je prázdny.
- `index.html` sa od `f624ee8` nezmenil (`git diff --stat f624ee8 -- index.html` je prázdny), takže čísla riadkov
  `index.html:N` platia. `pravne.html` v strome nie je (`ls barbershop-30`), zdrojom sú `index.html` a `assets/i18n/*.json`.
- Podklady: `odovzdavka.md`, `oprava-1.md`, `oprava-2.md`, `kontrola-obsah-2.md`, `OTAZKY-PRE-MAJITELA.md`.
- Pomocné vstupy, ktoré som pridal (mimo stromu, v `stavba-v5/`). Otázky som písal bez pohľadu na kmene, ako by ich
  písal zákazník, a nie sú v sade autora ani v sadách kôl 1 a 2:
  - `k3-otazky.txt`: 227 otázok, z toho 163 sk a 64 v 7 jazykoch. Výstup je v `k3-vystup.txt`.
  - `k3-otazky-b.txt`: 53 cielených overení, výstup `k3-vystup-b.txt`.
  - `k3-otazky-c.txt`: 10 otázok na holenie hlavy, výstup `k3-vystup-c.txt`.
  - Spúšťal som ich príkazom `node stavba-v5/k1-skusaj.mjs $SP/hs-recepcia/barbershop-30 < súbor`, ktorý volá
    `odpovedz` z `assets/recepcia.js`.

**Verdikt: NEPRIJATÉ ani v kole 3.**
- V4 a V5 z kola 2 sú opravené presne v tvaroch, ktoré kontrola uviedla.
- Nová nezávislá sada však našla **4 nové vážne nálezy tej istej triedy**: zákazník dostane cenu inej služby, alebo
  odpoveď s cenou vyznie ako „áno“ na službu, ktorú stránka neponúka (V6–V9). Ide spolu o 9 jazykových výskytov.
- Je to tretie kolo za sebou, v ktorom sa táto trieda chýb vracia v nových tvaroch. S8 (sada „šitá na odpovede“) je
  teda hlavná príčina, nie vedľajší nález.

**Prehliadač: ODLOŽENÉ (nie prejdené).**
- O 11:19 UTC: `pgrep -f "http.server 86[01]"` nič nenašiel (exit 1), ale `pgrep -c -f "headless_shell|chrome-linux/chrome"` = **14**.
- Na kontrolu obsahu prehliadač netreba a nič vizuálne netvrdím.

---

## Čo prešlo (s dôkazom)

1. **Zdroje všetkých 31 položiek existujú a odpoveď nevybočuje zo zdroja (bod 1).**
   - Overil som to Pythonom, ktorý ku každej položke `sk.json:33–63` vypíše riadky `zdroj` z `index.html`.
   - Všetkých 56 riadkov sedí doslovne. Príklady:
     - `:829` „Po–Pi 9:00–19:00<br>So 9:00–14:00<br>Ne zatvorené“,
     - `:810` celá veta rezervácie,
     - `:530` „40 min“ a `:566` „20 min“,
     - `:238` „Pri dverách ťa privíta recepčná.“ bez nepotvrdenej druhej vety (OTAZKY:17).
   - `kresla` vynecháva „v troch miestnostiach“ (OTAZKY:18).
   - Grep na `vždy|zaruč|garant|always|immer|free|zdarma|zadarmo` našiel len `kava`, a to doslova podľa `index.html:287`
     („Káva aj minerálka sú zdarma.“).
   - Žiadna odpoveď nedáva zdravotnú radu.
   - Pozn.: položiek je 31, nie 30. Navyše je `trvanie`.
2. **Témy „nevieme“ len odovzdávajú (bod 2).**
   - Overil som to Pythonom nad 8 súbormi. Každý má 31 položiek a 19 tém. Žiadna téma nemá `odpoved` ani číslicu
     v `odovzdanie`.
   - Akcie sú len `booqme, email, google, instagram, mapa, rezervacia, sluzby, tel`.
   - Pokrytie OTAZKY-PRE-MAJITELA.md:
     - č. 1–8 a 11–18 majú vlastnú tému (`sk.json:66–81`),
     - č. 9 a 10 sú vyriešené vynechaním (bod 1),
     - č. 19–24 sú interné.
3. **Preklady (bod 3): 10 náhodných položiek na jazyk.** Vzorku vyberá `random.seed('k3'+jazyk)`, je teda iná ako
   v kolách 1 a 2.
   - Vo všetkých 7 jazykoch sú id, akcie a zdroje rovnaké ako v sk.
   - Čísla v odpovediach sú zhodné. Jediný rozdiel je telefón „+421 951 267 203“, ktorý je pre cudzincov zámerný
     (OTAZKY:52).
   - Vety cenníka a stránky sú doslova zo slovníkov `assets/i18n/*.json`. Overil som grepom napríklad
     pl „retro dystrybutor paliwa“, pl „parówka na twarz“, sr „Šišanje za male džentlmene“, de „Ruf am Empfang an,
     Mo–Fr …“ a uk „Нітра“.
   - V uk nie je žiadne slovo so zmiešanou latinkou a cyrilikou. V sr nie je cyrilika, ide o latinku ako v `i18n/sr.json`.

| jazyk | vzorka (k3) | výsledok |
|---|---|---|
| en | deti, balicky, pripomienka, cena-strih, obocie, skolenia, hodnotenie, vernost, tim, romana-ceny | verné; „barbers, both men and women“ = „barberov a barberiek“ |
| uk | plet, parkovanie, jazyky-tim, adresa, trvanie, email, obocie, platba, cena-dlhe, vysledky | verné; „40 хв“, cyrilika bez chýb |
| hu | bez-objednania, cena-dlhe, co-je-v-strihu, storno, online, hodiny, kresla, telefon, hodnotenie, romana-ceny | verné; „H–P … V zárva“, „8 szék“ |
| sr | adresa, socialne, zdravie, hodiny, ultra, vernost, sviatky, obocie, deti, cena-strih | verné; latinka; úvod „vam“ → S6 |
| pl | hlava, vysledky, kava, rezervacia, socialne, odkedy, ultra, email, hodiny, hodnotenie | verné; ż, ł, ę bez chýb; úvod „wam“ → S6 |
| de | vernost, rezervacia, whatsapp, sviatky, email, ceny-konecne, cena-strih-brada, zdravie, hodnotenie, recepcia | verné; „Mo–Fr“ = „v pracovné dni“ (slovník) |
| cs | depilacia, damske, platba, recepcia, farbenie-brady, whatsapp, parkovanie, holenie, jazyky-tim, co-je-v-strihu | verné; ř, ů bez chýb; „Kde nás najdete“ → S6 |

4. **Úvodná veta je pravdivá a slovo AI sa na webe nenachádza (bod 4).**
   - `sk.json:19`: „Odpovedám z pripravených odpovedí k podniku. Na ostatné vám rada odpovie recepcia.“
   - Preklady hovoria to isté.
   - `grep -rlE '\bAI\b|[Cc]hatbot|[Aa]sistent|[Aa]ssistant|umel[áa] inteligenc|künstlich|штучн|mesterséges|veštačk|sztuczn|umělá'`
     nad `index.html`, `assets/*.js`, `assets/*.css`, `assets/i18n/` a `assets/recepcia/` nič nenašiel (exit 1).
   - Na otázky `si umela inteligencia` a en `are you an AI` odpovie fallback. Nič nepredstiera.
   - Jediný nový kľúč v i18n je „Spýtaj sa recepcie“ (diff slovníkov proti `f624ee8`, 7× +1 riadok). Je v tykaní ako web.
5. **Regresia z kola 2 nie je.** 240 otázok z `o2/vsetky.txt` dáva rovnaký výstup ako `o2/v5-vystup.txt`
   (`diff` → ZHODA, výstup je v `k3-regres.txt`).
6. **Test autora prechádza.** `node --test source/tools/recepcia-test.mjs` → tests 11 / pass 11 / fail 0.

---

## Nálezy

### VÁŽNE (nové v kole 3)

**V6 – Strih pre ženu z rodiny alebo okolia („mamu“, „babku“, „kamarátku“, „sestru“) ukáže cenu pánskeho strihu,
v en dokonca cenu detského strihu.** Je to tá istá trieda ako V4. Oprava V4 pridala len tvary, ktoré našla kontrola.
- Dôkaz (`k3-vystup.txt:124`, `k3-vystup-b.txt:7–14, 31, 39, 45, 47`):
  - `sk | ostrihate mi mamu → odpoved cena-strih | [["Pánsky strih","18 €"]]`
  - `sk | kolko stoji strih pre mamu → odpoved cena-strih | Pánsky strih 18 €`
  - `sk | ostrihate moju babku`, `ostrihate aj kamaratku`, `ostrihate aj sestru` → to isté
  - `cs | ostříháte i mámu → odpoved cena-strih | [["Pánský střih","18 €"]]`
  - `pl | czy ostrzyżecie moją mamę → odpoved cena-strih | [["Strzyżenie męskie","18 €"]]`
  - `sr | šišate li moju mamu → odpoved cena-strih | [["Muško šišanje","18 €"]]`
  - `en | can you cut my mom's hair → odpoved deti | [["Little gentlemen's cut","15 €"], …]`
- Pre porovnanie: `ostrihate aj moju zenu`, `kolko stoji strih pre manzelku` a `strihate zeny na kratko` správne vedú na
  `nevieme damske`.
- Príčina: kmene `damske` sú v `sk.json:82`
  `Damsk =Damy Zensk =Zena =Zeny =Zenu Dievc Dcer Manzelk Priatelk Frajerk Slecn =Baba =Babu =Baby`. Chýbajú v nich
  Mam/Mamu/Mamy, Babk, Kamaratk, Sestr, Svokr, Tet. To isté platí pre cs, pl, sr a en (`en.json:82` nemá Mom/Mother/Sister).
- Návrh: doplniť silné kmene ženských osôb (sk `=Mamu =Mamy =Mama Babk Kamaratk Sestr Svokr Tetu`, cs `=Mámu Babičk Sestr`,
  pl `=Mamę Siostr Babci`, sr `=Mamu Sestr Bab`, en `Mom Mum Mother Sister Grandma`, de `Mutter Schwester Oma`, hu `Anyu`,
  uk `Мам Сестр`). Hlavne však overiť na odloženej sade (S8). Zoznam slov sa nedá uzavrieť, preto je bezpečnejšie
  pravidlo: ak otázka obsahuje osobu ženského rodu a slovo strih, odpoveď je `damske`.

**V7 – Otázka na cenu balzamu (a v de, hu na vosk a olej) na bradu ukáže cenu úpravy brady 15 € vo všetkých 8 jazykoch.**
Je to tá istá trieda ako V5: produkt dostane cenu služby.
- Dôkaz (`k3-vystup.txt:33, 210`, `k3-vystup-b.txt:17, 21, 22, 29, 33, 34, 37, 41, 42, 44, 46, 48`):
  - `sk | kolko stoji balzam na bradu → odpoved cena-brada | [["Úprava brady","15 €"]]`
  - `sk | cena balzamu na fuzy`, `kolko stoji hrebeň na bradu` → to isté
  - `cs | kolik stojí balzám na vousy → [["Úprava vousů","15 €"]]`
  - `de | was kostet Bartbalsam` a `de | was kostet Bartwachs` → `[["Bartpflege","15 €"]]`
  - `en | how much is beard balm → [["Beard trim","15 €"]]`
  - `hu | mennyibe kerül a szakállolaj` a `… szakállbalzsam` → `[["Szakálligazítás","15 €"]]`
  - `pl | ile kosztuje balsam do brody`, `sr | koliko košta balzam za bradu`, `uk | скільки коштує бальзам для бороди` → 15 €
- Správne sa správajú sk `olej na bradu`, `vosk na bradu`, `pomada na bradu` a en `beard oil`, `beard wax`, ktoré vedú
  na `nevieme produkty`. Oprava V5 teda pokryla len vosk a olej.
- Príčina:
  - V `produkty` (`sk.json:75`) chýba `Balzam` a v hu chýbajú zložené slová (szakállolaj sa nerozdelí na `olaj`).
  - de `Bartwachs` je jedno slovo, takže slabý `wachs` v `produkty` nezaberie a silný `Bart` vyhrá.
- Návrh: do `produkty` doplniť silné `Balzam/Balzám/Balm/Balsam/Бальзам`, `Hreben/Comb/Kamm`. V de a hu brať zložené
  slová (`Bartöl`, `Bartwachs`, `Bartbalsam`, `szakállolaj`, `szakállbalzsam`) ako celé kmene.

**V8 – „Holenie hlavy britvou“ ukáže cenu holenia tváre 15 € namiesto Oholenia hlavy 13 € v sk, en, cs, pl a uk.**
Ide o zlú cenu služby, ktorá v cenníku je.
- Dôkaz (`k3-vystup.txt:20`, `k3-vystup-b.txt:1–3, 5`, `k3-vystup-c.txt`):
  - `sk | kolko stoji holenie hlavy britvou → odpoved holenie | [["Holenie do hladka Hot Towel","15 €"]]`
  - `sk | oholit hlavu britvou`, `holenie hlavy do hladka`, `hlava do hladka` → to isté
  - `en | head shave with razor price`, `en | smooth head shave` → `[["Hot Towel clean shave","15 €"]]`
  - `cs | holení hlavy břitvou`, `pl | golenie głowy brzytwą`, `uk | гоління голови бритвою` → 15 €
- Pre porovnanie: `kolko stoji holenie hlavy` správne vedie na `hlava` 13 €. de a hu sú správne, sr ponúkne výber.
- Prečo je to vážne: stránka opisuje Oholenie hlavy ako „Príprava pokožky, holenie britvou, umytie, sušenie a styling.“
  (`index.html:553`). Slovo „britva“ teda patrí práve tejto službe, no odpoveď ukáže inú cenu.
- Príčina: v `holenie` (`sk.json:44`) sú silné kmene `Britv Hladk`. `hlava` (`sk.json:45`) ich nemá a „hlav“ je v nej
  len v druhej skupine.
- Návrh: ak je v otázke `hlav/head/Kopf/głow/hlav/голов`, nech `holenie` prehrá (napr. `hlav` ako zakázaný kmeň pre
  `holenie`, alebo „Myslíš toto?“ s `hlava` na prvom mieste).

**V9 – Na službu mimo podniku („chodíte strihať domov“, „v nemocnici“, „v domove dôchodcov“) odpovie „Pánsky strih 18 €“.**
Taká odpoveď vyznie ako „áno, za 18 €“, čo je sľub, ktorý stránka nedáva.
- Dôkaz (`k3-vystup.txt:136–137`, `k3-vystup-b.txt:23–28, 32`):
  - `sk | chodite strihat domov → odpoved cena-strih | [["Pánsky strih","18 €"]]`
  - `sk | prídete ma ostrihať domov`, `strihate aj doma`, `strihate v nemocnici`, `strihate v domove dochodcov`,
    `robite strih u zakaznika` → to isté
  - `cs | chodíte stříhat domů → [["Pánský střih","18 €"]]`
  - de `kommt ihr auch nach Hause` a en `do you do home visits` vedú na fallback, čo je správne.
- Prečo je to vážne: zadanie zakazuje sľuby a nové tvrdenia o podniku. Logika je rovnaká ako pri V4: cena na otázku
  „robíte X?“ znamená „áno“.
- Návrh: nová téma „nevieme“ `mimo` (`Domov =Doma Nemocnic Dochodc Hotel Svadb Vyjazd`) alebo tieto kmene pridať do
  fallbacku, aby nikdy neviedli na cenu.

### STREDNÉ

**S1–S8 z kôl 1 a 2 sú pri HEAD `d4657b7` stále otvorené** (`oprava-2.md`, „Čo ostáva“). Overil som ich znova:
- **S1** `robite kurzy pre barberov` → „nemáme potvrdené: školenia a voľné miesta“, hoci `index.html:842` školenia uvádza.
- **S2** `Mam citlivu plet, mozem ist na peeling?` → `plet` 21,50 €. Nové prípady:
  - `mam podrazdenu kozu po holeni` → Holenie 15 € (`k3-vystup.txt:117`),
  - `je to bezpecne pre deti` → deti 15 € (`:121`).
- **S3** `mate otvorene 24.12?` → `vyber hodiny,online`. Nový prípad: `mate otvorene 1. maja` → hodiny „Po–Pi 9:00–19:00“
  (`:76`). Rezervácia pritom 1. 5. blokuje (OTAZKY:14).
- **S4** `chcem sa ostrihat zajtra o 10` → 22 €.
- **S5** `mate dnes volny termin` a `mate volno o 16tej` (`:72`) → „školenia a voľné miesta“.
- **S6 Oslovenie** – stále platí.
  - `sk.json:19` „vám“ a `:26` „Kde nás nájdete“ stoja vedľa tykania v `:20` „Napíš otázku…“, `:24` „Myslíš toto?“,
    `:30` „Zavolaj“ a vo všetkých odpovediach („ťa“, „vyberieš“, „nájdeš“).
  - Rovnako cs „vám“ a „Kde nás najdete“ (slovník stránky má `"Kde nás najdeš"`), sr „vam“ a pl „wam“.
  - Web tyká: `grep -c 'vám\|vás' index.html` → 0.
  - Zadanie žiada „vykanie ako zvyšok webu“, lenže zvyšok webu tyká. Treba zjednotiť jedným smerom, podľa stránky
    na tykanie (napr. „Na ostatné ti rada odpovie recepcia.“, „Kde nás nájdeš“).
- **S7 Zmienka o AI v teste** – `source/tools/recepcia-test.mjs:17`, `:241` („… bez slova AI“) a `:248` („zmienka o AI“).
  Na web sa test nedostane, no pravidlo „bez zmienky o AI v kóde, komentároch“ porušuje.
- **S8 Sada je šitá na odpovede (bod 6)** – stále platí a v kole 3 je to hlavný nález.
  - Sada autora (`recepcia-test.mjs:33–115`, slovenská časť) dopĺňa presne tie tvary, ktoré našla kontrola:
    - `:108–110` „strihate aj damy“, „ostrihate aj babu“, „frajerku“, „slecny“,
    - `:98–99` „kolko stoji vosk na vlasy“.
  - Susedné tvary neprejdú: „mamu“ (V6), „balzam na bradu“ (V7), „holenie hlavy britvou“ pri prejdenom
    „holenie hlavy cena“ (`:59`) (V8).
  - Preklepov je v sade stále 11 (`:84–86`).
  - Odložená sada, na ktorej sa kmene neladia, stále neexistuje.
  - Na nových 290 otázkach kola 3 (227 + 53 + 10) som našiel 4 nové vážne triedy v 9 jazykových výskytoch.
- **Nové stredné nálezy:**
  - **N4 Oprava V5 posunula základné cenové otázky na „značky produktov“.** `produkty` má `cena: 1` (`sk.json:75`)
    a slabé kmene `vlas brad`. Vyhráva tak aj tam, kde nejde o produkt (`k3-vystup.txt:3, 4, 8, 12, 13`, porovnanie
    s `o2/head` v `k3-head.txt`):
    - `kolko platim za vlasy a bradu` → „Na webe zatiaľ nemáme potvrdené: značky produktov.“ Predtým to bola
      cena-brada 15 €, čo bola tiež chyba. Správne je 28 €.
    - `kolko stoji brada a vlasy` → to isté.
    - `cena za vlasy`, `kolko stoji uprava vlasov`, `kolko stoji styling vlasov` → „značky produktov“ (predtým `romana-ceny`).
    - Nejde o nepravdu, ale na najčastejšiu otázku („koľko za vlasy a bradu“) recepcia odpovie nezmyslom.
    - Návrh: `vlas` a `brad` v `produkty` podmieniť produktovým slovom (druhá skupina `|`). Otázky „vlasy a brada“ poslať
      na `cena-strih-brada`.
  - **N5 Romana dostane službu, o ktorej stránka nehovorí.** `kolko stoji farbenie mihalnic` a `robi romana mihalnice` →
    „Ceny a dni Romany na webe neuvádzame; ceny nájdeš v jej rezervačnom systéme.“ (`k3-vystup-b.txt:51–52`).
    Veta naznačuje, že Romana farbí mihalnice. `index.html:484` uvádza len „Farbenie, melír a trvalú“.
    Návrh: `romana-ceny` len pri `vlas/melir/trval/roman`, inak `cena-ina-sluzba`.
  - **N6 Príbuzné služby dostanú cenu inej služby** (pokračovanie N1):
    - `kolko stoji laminacia obocia` → Úprava obočia 3 € / Farbenie 5 €.
    - en `how much for eyebrow wax` a de `Augenbrauen wachsen` → obocie. Úprava obočia je „Vytrhanie a úprava“ (`index.html:613`).
    - `kolko stoji depilacia hrudnika` / `… nohy` → 5,50 €.
    - `kolko stoji cierna maska` a `cistenie pleti` → `plet` 21,50 €.
    - Názov služby je pri cene, preto ide o strednú chybu.
  - **N7 Sťažnosť dostane cenník.** `bol som nespokojny so strihom` → „Pánsky strih 18 €“ (`k3-vystup.txt:162`).
    Tónom je to necitlivé. Návrh: `Nespokoj Staznost Reklamac Vrat` → fallback na recepciu.

### DROBNÉ

- **D1–D13 z kôl 1 a 2 ostávajú** (`kontrola-obsah-2.md`). Príklady:
  - D11: `ako dlho trva holenie` / `… balicek` → trvanie strihu a brady (`k3-vystup.txt:97–98`).
  - D12: `preco ste taki drahi` → 22 € (`:114`).
- **D14 Otázka „kto si“ nemá pravdivú odpoveď.**
  - `si robot` → „nemáme potvrdené: hodiny vo sviatky“ (`:150`).
  - `co je toto za chat` → „WhatsApp a podobné aplikácie“ (`:149`).
  - `si clovek` → fallback.
  - Nič nepravdivé to netvrdí, no úvodná veta by tu bola najlepšia odpoveď. Návrh: položka `kto-si` s vetou
    `panel.uvod` (bez slova AI).
- **D15 Zľavy pre študentov a dôchodcov.** `je strih lacnejsi pre studentov` → 18 € (`:58`). `mate studentsku zlavu` →
  „vernostnú kartičku“ (`:59–60`). Cena nič nesľubuje, téma je však zlá.
- **D16 Nezmyselné témy.**
  - `ste v centre` → „Myslíš toto?“ cenník, obsah strihu (`:105`).
  - `syn ma 12 rokov kolko zaplatim` → „spôsob platby“ (`:24`).
  - `kolko stoji whisky` → Ultra 40 € (`:53`).
- **D17 pl „pan“** (známa daň z `oprava-2.md`): `czy pan ma wolny termin dzisiaj` → `nevieme damske` (`k3-vystup.txt:207`).

---

## Bod po bode podľa zadania

| bod | stav |
|---|---|
| (1) zdroje a nič navyše | **prešlo** pri texte všetkých 31 položiek (56 riadkov); **neprešlo** priradenie otázok: V6–V9, N4–N6 |
| (2) 19 tém „nevieme“ len odovzdanie, pokrytie OTAZKY | **prešlo** (č. 1–8 a 11–18, plus 9 a 10 vynechaním); znenie S1 a D2 je v rozpore so stránkou |
| (3) 7 prekladov, 10 náhodných položiek | **prešlo** (význam, fakty, čísla, pravopis, uk cyrilika, sr latinka); oslovenie → S6 |
| (4) úvodná veta pravdivá, žiadne AI na webe | **prešlo** na webe; v teste ostáva S7; D14 drobné |
| (5) tón a oslovenie | **neprešlo**: S6 (miešanie „vám“ a tykania v sk, cs, sr, pl); N7 |
| (6) realistická a nie „ušitá“ sada | **neprešlo**: S8; nové vážne V6–V9 sú susedné tvary opravených V4 a V5 |
| prehliadač | **ODLOŽENÉ** (14 bežiacich procesov prehliadača iného tímu, 11:19 UTC) |

## Čo opraviť pred kolom 4 (poradie)

1. **Najprv S8, až potom kmene.** Odloženú sadu treba zostaviť z `k1`, `k2`, `k3`, `o1` a `o2` (spolu vyše 600 otázok
   v 8 jazykoch). Treba ju zmraziť, kmene na nej neladiť a na nej merať kritérium „0 cien inej služby a 0 cien na
   otázku o službe mimo ponuky“. Bez toho sa trieda V4/V5/V6–V9 vráti v ďalšom tvare.
2. V6–V9 vo všetkých 8 jazykoch, s pravidlami namiesto vymenúvania slov (osoba ženského rodu + strih → `damske`;
   produktové slovo → `produkty`; hlava → `hlava` pred `holenie`; služba mimo podniku → odovzdanie).
3. N4 (regresia z opravy V5) a N5.
4. S6 a S7 (znenie a pravidlá, bez ladenia kmeňov). Potom S1–S5 a N6–N7.
5. Pozor na váhu: rezerva sk je 10 B (`oprava-2.md`). Nové kmene si vyžiadajú úsporu inde.
