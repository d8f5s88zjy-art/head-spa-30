# V5 etapa 1 – Recepcia: kontrola obsahu a faktov, kolo 2 (23. 10. 2026)

Kontrolór: nezávislý (redaktor + právne minimum). V strome som nič nemenil.
- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
- Strom: `$SP/hs-recepcia`, HEAD `0cdfdd4`, `git status --short` je prázdny.
- Riadky `index.html:N` sú v `barbershop-30/index.html`. Ten je bajtovo zhodný s `f624ee8`, takže čísla riadkov platia.
- Podklady: `odovzdavka.md`, `oprava-1.md`, `kontrola-obsah-1.md`.
- Pomocné vstupy, ktoré som pridal (mimo stromu): `stavba-v5/k2-otazky.txt` (121 nových otázok sk) a
  `stavba-v5/k2-otazky-b.txt` (57 cielených otázok v 8 jazykoch). Spúšťal som ich skúškou kontrolóra z kola 1:
  `node stavba-v5/k1-skusaj.mjs $SP/hs-recepcia/barbershop-30 < súbor`. Tá volá `odpovedz` z `assets/recepcia.js`.

**Verdikt: NEPRIJATÉ ani v kole 2.**
- Tri vážne nálezy z kola 1 (V1, V2, V3) sú opravené vo všetkých 8 jazykoch a overil som ich znova.
- Nová nezávislá sada však našla **2 nové vážne nálezy rovnakej triedy ako V1**: návštevník dostane cenu inej služby.
  - Otázka na strih pre ženu dostane cenu pánskeho strihu.
  - Otázka na vosk na vlasy dostane cenu depilácie.
- Stredné nálezy S1–S8 z kola 1 ostali **zámerne neopravené** (`oprava-1.md`, „Čo ostáva mimo tohto kola“). Znova som ich
  overil a stále platia.

**Prehliadač: ODLOŽENÉ (nie prejdené).**
- O 11:06 UTC: `pgrep -f "http.server 86[01]"` nič nenašiel, ale `pgrep -c -f "headless_shell|chrome-linux/chrome"` = **8**.
- Na kontrolu obsahu prehliadač netreba a nič vizuálne netvrdím.

---

## Čo prešlo (s dôkazom)

1. **Zdroje všetkých 31 položiek existujú a text z nich nevybočuje.** Overené Pythonom, ktorý ku každej položke
   `sk.json:33–63` vypíše riadok `zdroj` z `index.html`.
   - Všetkých 56 riadkov sedí doslovne.
   - Príklady:
     - `index.html:829` „Po–Pi 9:00–19:00<br>So 9:00–14:00<br>Ne zatvorené“
     - `:529`/`:531` „Pánsky strih … 18 €“
     - nová položka `trvanie`: `:530` „40 min“ a `:566` „20 min“
   - Žiadna odpoveď nepridáva cenu, čas, sľub, „vždy“ ani zdravotnú radu.
   - „Zdarma“ je len v `kava`, doslova z `:287`.
   - Nepotvrdené časti sú vynechané, ako žiada `OTAZKY-PRE-MAJITELA.md`:
     - `kresla` vynecháva „v troch miestnostiach“ (`:838`; OTAZKY:18),
     - `recepcia` vynecháva „ako jediný … 8 rokov“ (`:238`; OTAZKY:17),
     - Romanine ceny ani dni sa neuvádzajú (OTAZKY:22, :101).
   - Pozn.: položiek je 31, nie 30. Pribudla `trvanie` (oprava V2). Kritérium testu je „≥ 30“.
2. **V1 je opravené** (masáž a umytie hlavy, strih na nulu):
   - `masaz hlavy cena` → `nevieme cena-ina-sluzba`, „Túto službu v cenníku neviem nájsť; …“.
   - To isté platí pre en, de, cs, pl, hu, sr aj uk („скільки коштує масаж голови“ → „Не можу знайти цю послугу в прайсі“).
   - `kolko stoji umytie hlavy` → `co-je-v-strihu`.
   - `strihate na nulu` → `cena-strih` 18 €. Je to správne, lebo „strih strojčekom“ je v opise pánskeho strihu na `index.html:529`.
3. **V2 je opravené.** `trvanie` je položka so zdrojom `:529`, `:530`, `:565`, `:566`.
   - en „40 min / 20 min“, de „40 Min.“, uk „40 хв“, hu „40 perc“.
4. **V3 je opravené.**
   - `kolko stoji strich` a `kolko stoji strhi` → „Myslíš toto?“ s `cena-strih`.
   - `kolko stoji pansky strh` → 18 €.
   - Nová veta „neviem nájsť“ už netvrdí, že službu podnik nemá.
5. **Témy „nevieme“ len odovzdávajú (bod 2 zadania).**
   - Python nad 8 súbormi: žiadna z 19 tém nemá `odpoved` ani číslicu v `odovzdanie`.
   - Akcie sú len `booqme, email, google, instagram, mapa, rezervacia, sluzby, tel`.
   - Pokrytie OTAZKY:
     - č. 1–8 a 11–18 majú vlastnú tému (platba, poukazky, storno, pripomienka, bez-objednania, sviatky, parkovanie,
       bezbarierovy, skolenia, whatsapp, produkty, romana-ceny, vernost, vysledky, jazyky-tim, hodnotenie),
     - č. 9 a 10 sú vyriešené vynechaním (bod 1),
     - navyše sú tu damske, cena-ina-sluzba a zdravie,
     - spolu 19, ako žiada návrh.
   - Body 19–24 sú interné. „gdpr ochrana udajov“ → fallback, čo je v poriadku.
6. **Slovo AI nie je v ničom, čo ide na web.**
   - `grep -l -E '\bAI\b|[Cc]hatbot|[Aa]sistent'` nad `index.html`, `assets/*.js`, `assets/*.css`, `assets/i18n/*.json`
     a `assets/recepcia/*.json` → bez výstupu (exit 1).
   - V zmenených súboroch to isté platí aj pre ekvivalenty v 8 jazykoch (umelá inteligencia, artificial, künstlich,
     штучн, mesterséges, veštačk, sztuczn, umělá, assistant, asystent, GPT, Claude, LLM). Jediné zhody sú v teste (S7).
   - `pages.yml:34` nasadzuje len `index.html robots.txt sitemap.xml assets`, takže test sa na web nedostane.
7. **Úvodná veta je pravdivá (bod 4 zadania).** `sk.json:19`: „Odpovedám z pripravených odpovedí k podniku. Na ostatné vám
   rada odpovie recepcia.“
   - Nepredstiera model ani človeka.
   - Preklady hovoria to isté: en „prepared answers“, de „vorbereiteten Antworten“, uk „підготовлених відповідей“.
   - Tón tejto vety rieši S6.
8. **Veta o súkromí je pravdivá.** „Odpovede sú zo stránky, nič sa neodosiela.“ (`sk.json:23`).
   - Sieť ide len cez `fetch(recepcia/<jazyk>.json)` (`recepcia.js:69`).
   - Text návštevníka ide do stránky len cez `textContent` (`recepcia.js:68`, `:94`).
   - `innerHTML` je len pri stálej kostre (`:118–123`).
9. **Test autora prechádza.** `node --test source/tools/recepcia-test.mjs`: 284 otázok, 100,0 %, falošné 0, položiek 31,
   tém 19, zdrojov 56, gzip sk spolu 10 207 B, tests 11 / pass 11.
10. **Preklady (bod 3): 10 náhodných položiek na jazyk.**
    - Vzorka: `random.seed('k2'+jazyk)`, iná ako v kole 1. Zoznam je v tabuľke nižšie.
    - Pre všetkých 7 jazykov: rovnaké id, akcie a zdroje ako v sk, verný význam a žiadny nový fakt.
    - Ceny a čísla sú zhodné. Telefón je „+421 951 267 203“, čo je správne pre cudzincov (návrh 2.5, OTAZKY:52).
    - uk je v cyrilike. „Mostná 30, 949 01 Нітра“ je doslova zo slovníka `assets/i18n/uk.json` („Нітра“).
    - sr je v latinke ako `assets/i18n/sr.json`.
    - Diakritika v hu (ő, ű), pl (ż, ł, ę), cs (ř, ů) aj sk je bez chyby.

| jazyk | vzorka (k2) | výsledok |
|---|---|---|
| en | telefon, adresa, damske, holenie, kava, pripomienka, kresla, online, bezbarierovy, recepcia | verné; „coffee's waiting“, „on the house“ = „zdarma“ |
| uk | ornament, adresa, vysledky, ceny-konecne, zdravie, bezbarierovy, tim, whatsapp, online, vyber-barbera | verné; úvod „вам“ → S6 |
| hu | cena-brada, cena-ina-sluzba, recepcia, trvanie, poukazky, vysledky, holenie, socialne, vyber-barbera, hodiny | verné; „40 perc“, „H–P … V zárva“ |
| sr | tim, vernost, co-je-v-strihu, ceny-konecne, whatsapp, poukazky, hlava, cena-strih-brada, bezbarierovy, platba | verné; úvod „vam“ pri „Napiši“ → S6 |
| pl | parkovanie, kresla, email, ultra, vernost, telefon, obocie, produkty, socialne, balicky | verné; úvod „wam“ (množné číslo) → S6 |
| de | skolenia, holenie, romana-ceny, kava, cena-strih-brada, cena-dlhe, deti, ultra, odkedy, damske | verné; „skolenia“ nesie S1 |
| cs | plet, vysledky, jazyky-tim, whatsapp, co-je-v-strihu, online, parkovanie, obocie, ceny-konecne, cena-ina-sluzba | verné; „Kde nás najdete“ verzus slovník „Kde nás najdeš“ → S6 |

---

## Nálezy

### VÁŽNE (nové v kole 2)

**V4 – Na strih pre ženu („dámy“, „baba“, „frajerka“, „slečny“, pl „panie“) ukáže cenu pánskeho strihu 18 €.**
- Dôkaz (`k2-otazky-b.txt`):
  - `sk | strihate aj damy? → odpoved cena-strih | [["Pánsky strih","18 €"]]`
  - `sk | ostrihate aj babu? → odpoved cena-strih | Pánsky strih 18 €`
  - `sk | ostrihate aj moju frajerku → odpoved cena-strih | Pánsky strih 18 €`
  - `sk | strihate aj slecny → odpoved cena-strih | Pánsky strih 18 €`
  - `cs | stříháte i dámy? → odpoved cena-strih | [["Pánský střih","18 €"]]`
  - `pl | czy strzyżecie panie → odpoved cena-strih | [["Strzyżenie męskie","18 €"]]`
- Pre porovnanie: `strihate zeny`, `kolko stoji damsky strih`, en `do you cut ladies`, de `schneidet ihr Frauen`, hu, sr aj uk
  správne vedú na `nevieme damske`.
- Prečo je to vážne:
  - Dámske strihy sú téma „nevieme“ (návrh `asistent.md` časť 6, riadok `damske`; `sk.json:82`
    „Dámske strihy na webe neuvádzame.“).
  - Odpoveď „Pánsky strih 18 €“ na otázku o žene vyznie ako „áno, za 18 €“.
  - Je to presne riziko, ktoré návrh v časti 7 menuje ako príklad: „Vymyslená cena alebo služba („dámsky strih 20 €“)“.
- Príčina:
  - `sk.json:82` má kmene `Damsk Zensk =Zena =Zeny =Zenu Dievc Dcer Manzelk Priatelk`. Tvar „damy“ nezachytí, lebo
    „damy“ nezačína „damsk“ a má len 4 znaky, takže na DL nemá nárok (`recepcia.js:23`).
  - V cs (`cs.json:82`) chýba „Dám“/„Dámy“.
  - V pl (`pl.json:82`) chýba „Pani“/„Panie“/„Pań“.
  - Pri tom vyhrá silný kmeň `Strih`.
- Návrh:
  - Do `damske` pridať silné kmene `=Damy =Dam =Damam Bab Frajerk Slecn Zien` (sk), `=Dámy =Dam Ženu` (cs) a
    `=Panie =Pani Pań` (pl).
  - Otázky z tohto bodu pridať do odloženej sady (S8) ako negatívne.

**V5 – Na „koľko stojí vosk na vlasy“ ukáže cenu depilácie uší a nosa 5,50 €, a to v 6 jazykoch.**
- Dôkaz:
  - `sk | kolko stoji vosk na vlasy → odpoved depilacia | [["Depilácia uší a nosa voskom","5,50 €"]]`
  - `en | how much is hair wax → odpoved depilacia | [["Ear and nose waxing","5,50 €"]]`
  - `de | was kostet Haarwachs → odpoved depilacia | [["Ohren- und Nasenwaxing","5,50 €"]]`
  - `cs | kolik stojí vosk na vlasy`, `pl | ile kosztuje wosk do włosów`, `sr | koliko košta vosak za kosu` → to isté.
  - hu `hajwax` a uk `віск для волосся` vedú na `romana-ceny`. To je zlá téma, ale nie je to nepravda.
  - Bez cenového slova to funguje správne: `mate vosk na vlasy` → `nevieme produkty`, `kupim u vas vosk` → `nevieme produkty`.
- Prečo je to vážne:
  - Návrh (`asistent.md` časť 6, riadok `produkty`) výslovne smeruje „vosk na vlasy“ na `produkty`.
  - Značky a predaj sú nepotvrdené (OTAZKY:21, č. 13).
  - Návštevník tak dostane cenu inej služby. Ide o rovnakú triedu ako V1.
- Príčina:
  - V `depilacia` je silný kmeň `Vosk` (`sk.json:50`), de `Wachs`, en `wax` (`en.json:50`, `de.json:50`).
  - Cenový bonus v `skore()` (`recepcia.js:30`) zvýhodní položku s cenou pred témou `produkty`, kde je `vosk` len slabý
    (`sk.json:75`).
- Návrh:
  - V `depilacia` dať `Vosk`/`Wachs`/`wax` do druhej skupiny spolu s `Usi|Nos|Ohr|Nase|Ear|Nose` (zápis `|`), aby vosk sám nestačil.
  - V `produkty` urobiť `Vosk`/`Wachs`/`Wax`/`Віск`/`Wosk`/`Vosak` silné.

### STREDNÉ

Nálezy S1–S8 z kola 1 sú pri HEAD `0cdfdd4` stále otvorené. Autor ich zámerne neopravoval (`oprava-1.md`). Znova overené:

- **S1 Školenia** – stále platí. Otázka `robite kurzy pre barberov` → „Na webe zatiaľ nemáme potvrdené: školenia a voľné miesta.“
  Pritom `index.html:842` ukazuje „<strong>Školenia</strong><span>na poschodí, pod značkou Barbershop 30</span>“.
- **S2 Zdravie v sk** – stále platí.
  - `Mam citlivu plet, mozem ist na peeling?` → `plet` 21,50 €.
  - `vypadavaju mi vlasy` → `farbenie-vlasov`.
  - Nový prípad: `svrbi ma hlava po strihu` → „Myslíš toto?“ `cena-strih, co-je-v-strihu`.
  - V en, cs a de rovnaká otázka o citlivej pleti správne vedie na `zdravie`, problém je teda len v `sk.json:84`.
- **S3 Sviatky** – stále platí a pribudli prípady.
  - `mate otvorene 24.12?` → `vyber hodiny,online`; `otvarate 31.12` → `hodiny`; `mate otvorene 1. novembra` → `hodiny`.
    Rovnako en, de, cs pri 24. 12.
  - Nové: `ste otvoreni 1.1.` → `hodiny`, `mate otvorene na velku noc` → `hodiny`.
  - Sada autora má `velka noc otvorene` (`recepcia-test.mjs:93`) a tá prejde. Ide o ukážku S8: prejde presne tvar
    zo sady, kým bežný tvar s „na veľkú noc“ neprejde.
- **S4 Číslo 10** – stále platí. `chcem sa ostrihat zajtra o 10` → „Pánsky strih – dĺžka vlasov nad 10 cm 22 €“,
  en `can I come in at 10` a cs `můžu přijít v 10` dajú to isté.
- **S5 Nesprávna téma odovzdania** – stále platí.
  - `mate dnes volny termin` → „školenia a voľné miesta“.
  - `kolko stoji umytie vlasov` a `kto je romana` → „Ceny a dni Romany …“.
  - `pridem o 10 minut neskor` je teraz fallback, čo je bezpečné.
- **S6 Oslovenie** – stále platí.
  - sk `sk.json:19` „vám“ a `:26` „Kde nás nájdete“ stoja vedľa tykania „Napíš otázku…“ a „Myslíš toto?“.
  - Rovnako cs „vám“ a „Kde nás najdete“, uk „вам“, sr „vam“ a pl „wam“.
  - Stránka tyká všade: `index.html:238` „ťa privíta“, `:312` „vyberieš“, `:810` „Zavolaj“, `:822` „Kde nás nájdeš“.
    `grep -c -E '\bvám\b|\bvás\b|nájdete|zavolajte|napíšte' index.html` → 0.
  - de a hu sú jednotné (du, bez oslovenia v úvode).
  - Zadanie kontroly chce „vykanie ako zvyšok webu“, no zvyšok webu tyká. Odovzdávka to rieši tak, že „úvodná veta je
    podľa zadania vykaná“. Tým vzniká miešanie v jednej bubline. Rozhodnúť treba jedným smerom; podľa stránky je to tykanie.
- **S7 Zmienka o AI v teste** – stále platí.
  - `source/tools/recepcia-test.mjs:17` „bez slova AI v textoch“.
  - `:235` názov testu „… bez slova AI“.
  - `:242` regex a hláška „zmienka o AI“.
  - Na web sa súbor nedostane (`pages.yml:34`), no pravidlo zadania „bez zmienky o AI v kóde, komentároch“ porušuje.
- **S8 Sada je šitá na odpovede (bod 6 zadania)** – stále platí, odložená sada nevznikla.
  - Sada (`recepcia-test.mjs:33–110`) má 284 otázok so 100 %. Preklepov je 11 (`:105–107`).
  - Opravy kola 1 pridali do sady presne tie otázky, ktoré kontrola našla. Iné tvary toho istého problému neprejdú:
    `velka noc otvorene` prejde, `mate otvorene na velku noc` nie; `strihate aj zeny` prejde, `strihate aj damy` nie (V4).
  - Na 121 nových slovenských otázkach (`k2-otazky.txt`) som okrem opakovaní z kola 1 našiel 2 vážne (V4, V5)
    a 3 stredné (N1–N3) chyby.
- **Nové stredné nálezy:**
  - **N1 Depilácia iných častí tela.** `kolko stoji depilacia chrbta` aj `… nohy` → „Depilácia uší a nosa voskom 5,50 €“.
    Názov služby je pri cene, takže nejde o priamu nepravdu, ale cena vyzerá ako odpoveď.
    Návrh: `Depil` urobiť slabým a silné nechať `Usi Usn =Nos`. Ostatné prípady pôjdu na `cena-ina-sluzba`.
  - **N2 Farbenie šedín.** `kolko stoji farbenie sedin` → „Farbenie brady 10 €“ (slabý kmeň `sed` v `sk.json:51` pri
    silnom `Farb`). Pritom cs `kolik stojí barvení šedin` → `romana-ceny`. Otázka je nejednoznačná (vlasy alebo brada).
    Návrh: bez slova „brad/fúz“ ukázať „Myslíš toto?“ s `farbenie-brady` a `farbenie-vlasov`.
  - **N3 Tetovanie.** `robite tetovanie` / `kolko stoji tetovanie` → „Kreatívny ornament na hlave 4 €“, rovnako en
    `do you do tattoos` a de `macht ihr Tattoos`. Názov „na hlave“ chybu zmierňuje.
    Návrh: `Tattoo`/`Tetov` dať do skupiny s `vlas|hair|haar`. Samotné „tetovanie“ potom pôjde na `cena-ina-sluzba`.

### DROBNÉ

- **D1–D6, D8–D10 z kola 1 ostávajú** (D7 patrí slovníku stránky, nie recepcii). Overené:
  - D1: `Mate facebook?` → odpoveď len o Instagrame, hoci `index.html:877` má odkaz na Facebook.
  - D2: „nemáme potvrdené: vernostnú kartičku“ proti viditeľnému odkazu `index.html:879`.
  - D3: fallback „Toto neviem presne.“ (`sk.json:30`).
  - D4: úvod „Odpovedám z pripravených odpovedí“.
  - D5: dve vety s Romanou (`sk.json:54`).
  - D6: uk „Romana“ v `uk.json:54` verzus „Романи“ v `uk.json:76`.
  - D8: telo commitu `c7ffb2f`, riadok 3 „(návrh barber/lahky-telefon/v2/asistent.md)“.
  - D9: `kolko cakam` → `kava`.
  - D10: `kolko stoji strih pre syna 12 rokov` → `deti` 15 €, odpoveď sama hovorí „do 10 rokov“.
- **D11 Trvanie len pre dve služby.**
  - `kolko trva uprava brady` → `cena-brada` (15 €, bez minút).
  - `ako dlho trva oholenie hlavy` → `hlava` (13 €), hoci `index.html:554` má „25 min“.
  - `ako dlho trva holenie` → trvanie strihu a brady, hoci holenie má „30 min“ (`index.html:572`).
  - Nič nie je nepravda, ale na otázku to neodpovedá.
  - Návrh: pri slove „trv/dlho/minút“ uprednostniť `trvanie` a do `trvanie` doplniť akciu „Celý cenník“. Ďalšie trvania
    pridať, keď to dovolí váha (rezerva je 33 B).
- **D12 Zlé témy bez škody:**
  - `mate parochne` → `nevieme parkovanie` (preklep „paro“ ~ „park“).
  - `je to drahe?` → `cena-dlhe` 22 € (kmeň `Drah`).
  - `kolko stoji strih psa` → 18 €.
  - `ste debili` → „Myslíš toto?“ `deti, depilacia`.
  - hu `hajwax` → `romana-ceny`.
- **D13 `kde presne ste` → fallback**, hoci `kde ste` je variant v `adresa` (`sk.json:34`). Fallback je bezpečný, no jednoduchá
  otázka zostane bez odpovede.

---

## Bod po bode podľa zadania

| bod | stav |
|---|---|
| (1) zdroje a nič navyše | **prešlo** pri všetkých 31 položkách (56 riadkov). **Neprešlo** priradenie otázok: V4, V5, N1–N3 |
| (2) 19 tém „nevieme“ len odovzdanie, pokrytie OTAZKY | **prešlo** (č. 1–8, 11–18 + 9, 10 vynechaním); znenie S1 a D2 je v rozpore so stránkou |
| (3) 7 prekladov, 10 náhodných položiek | **prešlo** (význam, fakty, pravopis, uk cyrilika, sr latinka); oslovenie → S6 |
| (4) úvodná veta pravdivá, žiadne AI na webe | **prešlo** na webe; v teste ostáva S7 |
| (5) tón a oslovenie | **neprešlo**: S6 (miešanie „vám“ a tykania v sk, cs, uk, sr, pl) |
| (6) realistická a nie „ušitá“ sada | **neprešlo**: S8; nové chyby V4, V5 ukazujú, že sada pokrýva len vyladené tvary |
| prehliadač | **ODLOŽENÉ** (8 bežiacich procesov prehliadača iného tímu, 11:06 UTC) |

## Čo opraviť pred kolom 3 (poradie)

1. V4 a V5 v 8 jazykoch, s negatívnymi otázkami v teste.
2. S8: zaviesť odloženú sadu (otázky z `kontrola-obsah-1.md`, `k2-otazky.txt`, `k2-otazky-b.txt`). Kritérium ≥ 90 %
   a 0 cien inej služby merať na nej, nie na sade, na ktorej sa ladia kmene.
3. S1, S6 a S7, lebo ide o znenie a pravidlá, nie o ladenie kmeňov. Potom S2–S5 a N1–N3.
4. Drobné podľa uváženia. Opraviť aj `asistent.md` časť 6 a plán (trvanie už nie je téma „nevieme“), ako uvádza `oprava-1.md`.
