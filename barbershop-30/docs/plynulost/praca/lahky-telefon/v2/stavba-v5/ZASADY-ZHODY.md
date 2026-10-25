# Recepcia – zásady zhody otázky s odpoveďou (pravidlá 1–10)

Stav: strom `hs-recepcia`, vetva `barbershop-recepcia`, commit `6f8c47c` (25. 10. 2026, oprava 4).
Kód: `barbershop-30/assets/recepcia.js`, dáta: `barbershop-30/assets/recepcia/<jazyk>.json`
(sk ručne, ostatné z generátora `stavba-v5/jazyky-gen.py` + `stavba-v5/jazyky_data.py`),
test: `barbershop-30/source/tools/recepcia-test.mjs` (23 testov, triedy 6–17).
Modul nemá od opravy 4 komentáre (váha); pravidlá opisuje tento súbor a hlavička testu. Čísla riadkov nižšie
sú podľa `6f8c47c`.

**Zásada majiteľa:** radšej nevedieť ako odpovedať zle. Nesprávna cena, trvanie alebo „áno“ na službu, ktorú
stránka neponúka, je vážna chyba. Prijateľné je poctivé odovzdanie (téma „nevieme“, fallback s telefónom
a e-mailom) alebo „Myslíš toto?“ (kandidáti + Celý cenník + Zavolať + Napísať e-mail).

Každé pravidlo je **všeobecné**: platí pre všetky položky a všetky jazyky a nikde sa nepridávajú kmene preto,
aby prešla konkrétna otázka z kontroly. Slovníky tried (osoby, miesta, vek, produkty, spojky, výplňové
a zdvorilé slová) sú dáta jazyka, nie výnimky pre otázky.

---

## Pojmy

| pojem | význam | kde |
|---|---|---|
| kmeň | slovo v `kluc` položky alebo témy; skupiny oddeľuje `\|` | JSON |
| silný kmeň | veľké začiatočné písmeno alebo `!` (cyrilika) | `recepcia.js:42` (priprav) |
| `=slovo` | len celé slovo | `recepcia.js:15` |
| `>10` | každé číslo väčšie ako 10 (trieda veku) | `recepcia.js:16` |
| istá zhoda | `zhoda ≥ 0,9` (začiatok slova alebo kmeň vnútri slova) | `recepcia.js:21` (`ista`) |
| presná zhoda | `zhoda = 1` (kmeň je začiatok slova) | `recepcia.js:21` (`pred`) |
| zložené slovo | predná časť + hlava (de, hu; aj spojené písanie inde) | `recepcia.js:73–76` |
| skupina kmeňov | časť `kluc` medzi `\|` (napr. farbenie \| brada) | `p._g` |
| položka s cenou | odpoveď obsahuje „€“ alebo pole `cena` | `p._c` |
| celý názov služby | prvý úryvok riadku cenníka v odpovedi (napr. „Oholenie hlavy“) | `p._n` |
| spojka | pole `spoj` v JSON (sk: a aj s so i plus; en: and with plus …) | JSON |
| výplňové / zdvorilé slová | polia `vypln` a `zdvor` (malé zoznamy) | JSON |

## Pravidlo 1 – krátke kmene len presne

- Kmeň do 4 znakov (po normalizácii NFD bez diakritiky, malé písmená) sa zhoduje len ako začiatok slova,
  ktoré je najviac o 3 znaky dlhšie. Kmeň do 3 znakov s koncovkou dlhšou ako 1 znak je len neistá zhoda (0,6).
- Preklep (Damerau-Levenshtein ≤ 1 na začiatku slova) sa hľadá len pri kmeni od 5 znakov a slove aspoň
  takom dlhom ako kmeň.
- Kód: `recepcia.js:14–20`. Test 6 overuje pravidlo na každom kmeni všetkých 8 jazykov (3 399 kmeňov).
- Príklad: „detox“ ani „detail“ už nie sú istou zhodou kmeňa „det“; „sedačka“ nie je „sed(ivý)“.

## Pravidlo 2 – neznáme slovo nedostane cenu

- Obsahové slovo otázky **od 3 znakov**, ktoré nie je číslo, cenové slovo, výplňové ani zdvorilé slovo
  a nemá istú zhodu so žiadnym kmeňom žiadnej položky ani témy, znamená, že otázka môže byť o niečom inom.
- Ak by taká otázka viedla na službu s cenou, panel dá „Myslíš toto?“ s kandidátom (ak je v otázke aspoň jedno
  známe slovo), inak odovzdanie. Trvanie s neznámym slovom = odovzdanie.
- „Myslíš toto?“, ktoré nemá v otázke ani jedno známe ani cenové slovo, je odovzdanie (fallback).
- Kód: `recepcia.js:80`, `:84–85`, `:90`. Test 7 skladá otázky z názvu každej služby a nezmyselného slova
  (7 aj 3 znaky) v 8 jazykoch.
- Od 3 znakov (zadanie hovorilo 4): slová pes, psa, dog, leg, nôh menia službu rovnako ako dlhšie slová
  („strih pre psa“ bol 18 €, „holenie nôh“ 15 €). Trojpísmenové výplňové slová (cez, pri, nad, dám, ísť,
  how, why, для, niż …) sú preto v stop slovách každého jazyka.

## Pravidlo 3 – špecifickejšia služba vyhrá, inak „Myslíš toto?“

1. Z položiek nad prahom 0,55 vyhrá tá, ktorá má viac rôznych slov otázky s presnou zhodou svojich kmeňov
   (kmene spoločné viac ako 2,5 položkám sa nerátajú) a pri dvoch skupinách kmeňov aj zhodu v oboch.
   Pri rovnakej špecifickosti a skóre bližšom ako 0,1 → „Myslíš toto?“ s oboma (`recepcia.js:57–62`).
2. **Iná služba v otázke:** ak otázka obsahuje
   - slovo so silným kmeňom inej služby s cenou, ktoré víťaz nevysvetlí žiadnym svojím kmeňom aspoň takým
     dlhým (ani slovom svojho celého názvu v otázke), alebo
   - celý názov inej služby z cenníka, ktorý nie je časťou celého názvu víťaza v otázke,

   panel dá „Myslíš toto?“ s víťazom aj touto službou, nie holú cenu jednej z nich (`recepcia.js:59–60`).
   „Strih a holenie“, „holenie hlavy a brady“, „úprava brady a obočia“, „pánsky a detský strih“ → obe.
3. **Spojená služba** (pravidlo `"spolu"`, Pánsky strih a úprava brady) je odpoveď len vtedy, keď otázka má
   spojku (pole `spoj` alebo znak + či &). Bez spojky („strih brady“, „ostrihať fúzy“, „beard cut“) → „Myslíš
   toto?“ so spojenou službou a najbližšou samostatnou službou. So spojkou spojená služba vysvetľuje celé
   názvy svojich častí (preto má v dátach aj slová ich názvov: sk „uprav“, en „men trim“, uk „чолові оформ“ …).
4. Testy 8, 12 (1 456 dvojíc služieb v 8 jazykoch: nikdy holá cena len jednej), 13 (spojka áno/nie).

## Pravidlo 4 – osoba, miesto, vek a produkt mimo ponuky sú triedy

- Témy „nevieme“ podľa tried v 8 jazykoch: `damske` (ženská osoba z rodiny a okolia), `mimo` (domov, nemocnica,
  domov dôchodcov, hotel, svadba, výjazd), `vek`, `produkty` (slovník produktov a zložené slová).
- **Veto:** téma so silnou istou zhodou, ktorej sedia všetky skupiny kmeňov, vetuje cenovú odpoveď
  (`recepcia.js:35`).
- **Vek je trieda:** kmeň `>10` zodpovedá každému číslu nad 10; druhá skupina témy `vek` má slová veku
  aj dieťaťa (rok, ročný, syn, chlapec, son, Sohn, fiam, син …). „Syn má 25 rokov“, „my son is 35“ → téma vek.
  Číslo 10 a menej ostáva detským strihom (stránka: „pre chlapcov do 10 rokov“, `index.html:547`, `:840`).
- **Doplnok (oprava 4) – slová dieťaťa sú tá istá trieda ako v detskom strihu:** druhá skupina témy `vek`
  obsahuje každé silné slovo dieťaťa z položky `deti` toho jazyka (sk synov, detsk, junior; cs děti, dětsk;
  en little, junior; hu kisfiú; sr dec, decu, dečij; uk діт, дітей, дитяч, дитин, маленьк …). Inak by veto
  nevidelo tvar, ktorý detský strih vidí: „Synovi je 12, platí ešte detský strih?“ dostávalo 15 €, lebo
  „synovi“ a „detský“ sú pri trojznakových kmeňoch syn/det len neistá zhoda (pravidlo 1). Test 17 to overuje
  zo silných kmeňov `deti` všetkých 8 jazykov (slovo + vek 11, 12, 15).
- Téma „nevieme“ s viacerými skupinami vyhrá skóre len so zhodou vo všetkých skupinách (`recepcia.js:31`),
  takže dátum a čas (24.12, 19:30, 31.12) nie sú vek.
- Test 9: osoba 180, miesto 88, vek 170, produkt 174 otázok zo šablón a slovníka tried; žiadna nedostane cenu.

## Pravidlo 5 – zdvorilosť nikdy nedostane cenu

- Správa len zo zdvorilých a výplňových slov dostane úvodnú vetu panelu a ponuku volieb (`recepcia.js:77`).
- Test 10: 91 zdvorilostí v 8 jazykoch, rozpoznaných 88, žiadna nedostane cenu ani ponuku služby.

## Pravidlo 6 – trvanie menovanej služby

- Silné slovo času (trvá, minút, dauert, take …) → trvanie tej služby, ktorú otázka menuje (price-time
  z cenníka, `cas` v JSON, zdroj `index.html:riadok` v `zdroje.json`). Bez menovanej služby trvanie strihu
  a brady; neznáma služba, služba bez trvania alebo „Myslíš toto?“ → odovzdanie (`recepcia.js:81–91`).
- Test 11: „Ako dlho trvá <názov>?“ pre každú službu s trvaním v 8 jazykoch (112 otázok), bez ceny.

## Pravidlo 7 – cena len pri istej zhode so službou (nové v oprave 3)

- Cenu alebo trvanie panel povie, len keď má víťazná služba v otázke aspoň jedno z:
  - istú zhodu so **silným kmeňom** (slovo z názvu alebo opisu služby na stránke),
  - **celý názov služby** z cenníka (aj ako variant otázky; pridá skóre 0,5),
  - presne pripravenú otázku (`otazky`, skóre +9).
- Inak (len slabé kmene) → „Myslíš toto?“ (`recepcia.js:23–32`, `:62`).
- **Dátová zásada pre silné kmene:** silný kmeň služby s cenou je slovo jej názvu alebo opisu na stránke
  (tvar, preklad, blízke synonymum: fúzy = brada). Slabý kmeň je:
  - súčasť balíka (whisky v Ultra inclusive),
  - nástroj (britva, razor, Messer, brzytwa, бритва),
  - prenesené slovo (gentleman – stránka hovorí o „malých gentlemanoch“),
  - opisné slovo (fade, 10, strih pri detskom strihu).
- Slovo inej služby, ktorú stránka neuvádza, nie je kmeň vôbec (tetovanie, Tattoo, Tatuaż – ornament je „vzor
  vystrihnutý do vlasov“, `index.html:625`).
- Kmeň nesmie zahŕňať slovo iného významu (sk a cs „chlap“ = muž → kmene Chlapec/Chlapc; pl Chłopiec/Chłopc).
- Slovo „pánsky“ (men, Męsk, Férfi, Mušk, Чолові) z názvu Pánsky strih je silný kmeň strihu. Je kmeňom
  najviac dvoch položiek, aby sa počítalo do špecifickosti.
- Test 14: otázka len zo slabých kmeňov služby (89 otázok v 8 jazykoch) nedostane jej cenu.

## Pravidlo 8 – zložené slovo sa posudzuje po častiach (nové v oprave 4)

- **Trieda:** zložené slovo spája prednú časť a hlavu (de Rücken+waxing, hu hát+gyantázás, de Augenbrauen+piercing).
  Kmeň dlhší ako 4 znaky sa hľadá aj vnútri slova (istá zhoda 0,9), takže bez tohto pravidla cudzia predná
  časť nič nemenila: „Was kostet Rückenwaxing?“ → depilácia uší a nosa 5,50 €, „Hátgyantázás ára?“ → 5,50 €,
  „Szempillafestés mennyi?“ → farbenie brady 10 € (slepé hodnotenie 1, chyby 3–5).
- **Kedy sa slovo rozdelí** (`recepcia.js:73–76`):
  1. dlhý kmeň (od 5 znakov) je vnútri slova a predná časť má aspoň 3 znaky – po odrátaní zápornej predpony
     „ne“ to nie je slovesná predpona ani stop-slovo (o-, vy-, za-, do-, pre-, pri-, pod-, під-, при- …) a žiadny
     kmeň na začiatku slova nesiaha za miesto delenia; **alebo**
  2. za najdlhším dlhým kmeňom na začiatku slova ostáva viac ako 7 znakov (dlhšia koncovka v 8 jazykoch nie je;
     najdlhšie v sadách: pl lojaln+ościowa a de Öffnung+szeiten po 7 znakov – tie sa nedelia);
  3. a zároveň obe časti **nevysvetľuje tá istá položka** – jej kmeň (istá zhoda, alebo kmeň od 4 znakov
     obsiahnutý v časti, aby prešla spojovacia hláska de -en-) ani jej názov z cenníka.
- **Čo sa stane potom:** slovo sa nahradí dvomi slovami. Cudzia časť je neznáme slovo (pravidlo 2: nikdy holá
  cena, nanajvýš „Myslíš toto?“ alebo odovzdanie), časť inej služby je druhá služba (pravidlo 3: „Myslíš toto?“
  s oboma). Zložené slovo sa teda správa rovnako ako tá istá fráza v dvoch slovách: „Rückenwaxing“ ako „How much
  is back waxing?“ či „depilácia chrbta voskom“ (obe už v kole 1 dávali „Myslíš toto?“).
- **Nedelí sa:** zložené slovo jednej služby (Ohrenwaxing, Fülgyantázás, Szemöldökfestés, Kopfrasur,
  Augenbrauenfärbung, Augenbrauenkorrektur – časť názvu z cenníka, Herrenhaarschnitt, Kinderhaarschnitt, Glattrasur)
  a slovesá s predponou (ostrihať, vystrihnúť, neostriháte, zarezervovať, підстрижете, przystrzyc).
- **Dátové zásady k pravidlu 8:**
  - zložené slovo, ktoré je bežným názvom služby zo stránky, je kmeň služby (už predtým Kopfrasur, Bartfarb,
    Fejborotv, Szakallfest; teraz de Nassrasur = holenie britvou, „Messerrasur“ je v nemeckom opise na stránke);
  - slovo z opisu služby na stránke v danom jazyku je kmeň (de depilácia „Entfernung“ – „Entfernung von Ohren-
    und Nasenhaaren mit Wachs“, preklad vety z `index.html:619`);
  - položka `deti` má v každom jazyku všeobecné slovo strihu ako slabý kmeň (sk strih, en cut, hu vág …; doplnené
    de „schnitt“), aby „Kinderschnitt“ ostal detským strihom;
  - slovesné predpony, ktoré nie sú predložkami, sú v stop-slovách (sk roz; cs pře, roz; pl prze, roz; uk пере, роз;
    sr pre, raz) – ako samostatné slová sa nevyskytujú.
- Test 15: z každého silného kmeňa (od 5 znakov) každej služby s cenou v 8 jazykoch zložené slovo s neznámou
  časťou pred kmeňom aj za ním (782 otázok) – žiadna cena. Na stave `f715141` zlyhalo 690 z 780.

## Pravidlo 9 – služba s viacerými skupinami kmeňov je istá len pri zásahu všetkých (nové v oprave 4)

- **Trieda:** služba s cenou, ktorej `kluc` má skupiny (farbenie brady = farbenie | brada, oholenie hlavy =
  holenie | hlava), sa doteraz dala vyhrať jednou skupinou – skóre sa len znížilo, nevynulovalo
  (`recepcia.js:31`). „How much is dyeing?“ → Beard colouring 10 €, „Ile kosztuje koloryzacja?“ → 10 €.
- **Pravidlo:** taká služba je istá (holá cena alebo trvanie) len pri zásahu všetkých skupín alebo pri celom
  názve služby či pripravenej otázke; inak „Myslíš toto?“ (`recepcia.js:25`, `:32`, `:62`). Pre „iná služba
  v otázke“ (pravidlo 3) sa naďalej berie aj služba zasiahnutá jednou skupinou, aby „strih a farbenie“ nedostalo
  holú cenu strihu.
- Spojená služba (pravidlo `spolu`) má vlastné pravidlo spojky (pravidlo 3) a test ju vynecháva.
- Test 16: každé slovo jednej skupiny takej služby v 8 jazykoch (106 otázok) – žiadna holá cena tej služby.
  Na stave `f715141` zlyhalo 21 zo 106 (zafarb, ofarb, dye, tint …).

## Pravidlo 10 – čísla: čas, dĺžka v cm (nové v oprave 4)

- **Čas hh:mm sa nepočíta ako číslo** (`recepcia.js:72`): „14:00“, „19:30“ sa pred normalizáciou vynechajú, takže
  „Koľko stojí detský strih o 14:00?“ ostáva detským strihom a nie je téma vek (dôležité po doplnku pravidla 4).
- **Jednociferná dĺžka v cm nie je „nad 10 cm“** (`recepcia.js:72`): „3 cm“, „3cm“, „3,5 cm“ (aj „см“) sa vynechajú
  spolu s číslom. Kmeň `=Cm` je silný kmeň položky „Pánsky strih – dĺžka vlasov nad 10 cm“ (22 €, `index.html:541`,
  `:543`), takže „Mám vlasy 3 cm, koľko stojí strih?“ dostávalo 22 €; teraz „Myslíš toto?“ s pánskym strihom (18 €,
  `index.html:531`) a dlhými vlasmi. „Mám vlasy 15 cm“ a „vlasy nad 10 cm“ ostávajú 22 €.
- Test 17: dĺžka 1, 3, 5, 9 a 3,5 cm (s medzerou aj bez) pri názve pánskeho strihu a čas 14:00, 12:30, 16:15 pri názve
  detského strihu v 8 jazykoch, spolu s vekom (doplnok pravidla 4) 281 otázok. Na stave `f715141` zlyhalo 66.

---

## Ďalšie dátové zásady

- **Výplňové slová** (`vypln`, `stop`): malé zoznamy na jazyk. Radšej menej rozpoznaných ako chybná cena.
- **Zdvorilosti** (`zdvor`): pozdravy a poďakovania; v sk aj „večer“ (dobrý večer).
- **„Zaplatiť“** (sk, cs) je slabý kmeň témy platba: „koľko zaplatím“ je cenová otázka. Platiť, karta
  a hotovosť ostávajú silné.
- **Zložené slová** (de, hu): ak by krátky kmeň zložené slovo nezachytil, zložené slovo je vlastný kmeň
  (Hajwax, Bartbalsam, szakállolaj).
- **Varianty otázok** (sk): len tam, kde menia odpoveď. Celý názov služby z cenníka je variant sám osebe.
  Témy „nevieme“ majú len zobrazovanú otázku.
- **JSON musí ostať zhodný s generátorom:** `python3 -I stavba-v5/jazyky-gen.py <kópia barbershop-30>` dáva
  rovnaké `en … cs.json` ako strom (overené v oprave 3, `cmp` 7× zhodné).

## Čo pravidlá zámerne nerobia

- Nehádajú význam vety (zápor, podmienka, viac osôb): pri pochybnosti radšej „Myslíš toto?“.
- Nerozlišujú produkt a službu podľa predložky („britva na holenie“ ostáva holením; pozri `oprava-3.md`, otvorené).
- Neodpovedajú na čakaciu dobu ani voľné termíny (stránka ich neuvádza → odovzdanie alebo rezervácia).
- Nerozlišujú „10 cm“, „do 10 cm“ a „nad 10 cm“: číslo 10 je kmeň dlhých vlasov (`=10`), takže „vlasy do 10 cm“ dá
  22 € s textom „dĺžka vlasov nad 10 cm“ (podmienka je v odpovedi viditeľná). Rozlíšenie by potrebovalo predložky
  v 8 jazykoch.
- Čas bez minút („o 12“) so slovom dieťaťa sa ráta ako vek → téma vek (bezpečné odovzdanie, nie cena).
- Zložené slovo dvoch služieb, ktoré stránka uvádza zvlášť (de Bartrasur, hu szakállborotválás), dá „Myslíš toto?“
  s oboma, nie jednu cenu.
