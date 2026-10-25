# Recepcia – zásady zhody otázky s odpoveďou (pravidlá 1–7)

Stav: strom `hs-recepcia`, vetva `barbershop-recepcia`, commit `f715141` (25. 10. 2026).
Kód: `barbershop-30/assets/recepcia.js`, dáta: `barbershop-30/assets/recepcia/<jazyk>.json`
(sk ručne, ostatné z generátora `stavba-v5/jazyky-gen.py` + `stavba-v5/jazyky_data.py`),
test: `barbershop-30/source/tools/recepcia-test.mjs` (20 testov, triedy 6–14).

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
| silný kmeň | veľké začiatočné písmeno alebo `!` (cyrilika) | `recepcia.js:46` (priprav) |
| `=slovo` | len celé slovo | `recepcia.js:17` |
| `>10` | každé číslo väčšie ako 10 (trieda veku) | `recepcia.js:18` |
| istá zhoda | `zhoda ≥ 0,9` (začiatok slova alebo kmeň vnútri slova) | `recepcia.js:23` (`ista`) |
| presná zhoda | `zhoda = 1` (kmeň je začiatok slova) | `recepcia.js:23` (`pred`) |
| položka s cenou | odpoveď obsahuje „€“ alebo pole `cena` | `p._c` |
| celý názov služby | prvý úryvok riadku cenníka v odpovedi (napr. „Oholenie hlavy“) | `p._n` |
| spojka | pole `spoj` v JSON (sk: a aj s so i plus; en: and with plus …) | JSON |
| výplňové / zdvorilé slová | polia `vypln` a `zdvor` (malé zoznamy) | JSON |

## Pravidlo 1 – krátke kmene len presne

- Kmeň do 4 znakov (po normalizácii NFD bez diakritiky, malé písmená) sa zhoduje len ako začiatok slova,
  ktoré je najviac o 3 znaky dlhšie. Kmeň do 3 znakov s koncovkou dlhšou ako 1 znak je len neistá zhoda (0,6).
- Preklep (Damerau-Levenshtein ≤ 1 na začiatku slova) sa hľadá len pri kmeni od 5 znakov a slove aspoň
  takom dlhom ako kmeň.
- Kód: `recepcia.js:16–22`. Test 6 overuje pravidlo na každom kmeni všetkých 8 jazykov (3 374 kmeňov).
- Príklad: „detox“ ani „detail“ už nie sú istou zhodou kmeňa „det“; „sedačka“ nie je „sed(ivý)“.

## Pravidlo 2 – neznáme slovo nedostane cenu

- Obsahové slovo otázky **od 3 znakov**, ktoré nie je číslo, cenové slovo, výplňové ani zdvorilé slovo
  a nemá istú zhodu so žiadnym kmeňom žiadnej položky ani témy, znamená, že otázka môže byť o niečom inom.
- Ak by taká otázka viedla na službu s cenou, panel dá „Myslíš toto?“ s kandidátom (ak je v otázke aspoň jedno
  známe slovo), inak odovzdanie. Trvanie s neznámym slovom = odovzdanie.
- „Myslíš toto?“, ktoré nemá v otázke ani jedno známe ani cenové slovo, je odovzdanie (fallback).
- Kód: `recepcia.js:82–83`, `:88–89`, `:94`. Test 7 skladá otázky z názvu každej služby a nezmyselného slova
  (7 aj 3 znaky) v 8 jazykoch.
- Od 3 znakov (zadanie hovorilo 4): slová pes, psa, dog, leg, nôh menia službu rovnako ako dlhšie slová
  („strih pre psa“ bol 18 €, „holenie nôh“ 15 €). Trojpísmenové výplňové slová (cez, pri, nad, dám, ísť,
  how, why, для, niż …) sú preto v stop slovách každého jazyka.

## Pravidlo 3 – špecifickejšia služba vyhrá, inak „Myslíš toto?“

1. Z položiek nad prahom 0,55 vyhrá tá, ktorá má viac rôznych slov otázky s presnou zhodou svojich kmeňov
   (kmene spoločné viac ako 2,5 položkám sa nerátajú) a pri dvoch skupinách kmeňov aj zhodu v oboch.
   Pri rovnakej špecifickosti a skóre bližšom ako 0,1 → „Myslíš toto?“ s oboma (`recepcia.js:61–67`).
2. **Iná služba v otázke:** ak otázka obsahuje
   - slovo so silným kmeňom inej služby s cenou, ktoré víťaz nevysvetlí žiadnym svojím kmeňom aspoň takým
     dlhým (ani slovom svojho celého názvu v otázke), alebo
   - celý názov inej služby z cenníka, ktorý nie je časťou celého názvu víťaza v otázke,

   panel dá „Myslíš toto?“ s víťazom aj touto službou, nie holú cenu jednej z nich (`recepcia.js:64–65`).
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
  (`recepcia.js:39`).
- **Vek je trieda:** kmeň `>10` zodpovedá každému číslu nad 10; druhá skupina témy `vek` má slová veku
  aj dieťaťa (rok, ročný, syn, chlapec, son, Sohn, fiam, син …). „Syn má 25 rokov“, „my son is 35“ → téma vek.
  Číslo 10 a menej ostáva detským strihom (stránka: „pre chlapcov do 10 rokov“, `index.html:547`).
- Téma „nevieme“ s viacerými skupinami vyhrá skóre len so zhodou vo všetkých skupinách (`recepcia.js:34`),
  takže dátum a čas (24.12, 19:30, 31.12) nie sú vek.
- Test 9: osoba 180, miesto 88, vek 170, produkt 174 otázok zo šablón a slovníka tried; žiadna nedostane cenu.

## Pravidlo 5 – zdvorilosť nikdy nedostane cenu

- Správa len zo zdvorilých a výplňových slov dostane úvodnú vetu panelu a ponuku volieb (`recepcia.js:78–79`).
- Test 10: 91 zdvorilostí v 8 jazykoch, rozpoznaných 88, žiadna nedostane cenu ani ponuku služby.

## Pravidlo 6 – trvanie menovanej služby

- Silné slovo času (trvá, minút, dauert, take …) → trvanie tej služby, ktorú otázka menuje (price-time
  z cenníka, `cas` v JSON, zdroj `index.html:riadok` v `zdroje.json`). Bez menovanej služby trvanie strihu
  a brady; neznáma služba, služba bez trvania alebo „Myslíš toto?“ → odovzdanie (`recepcia.js:84–95`).
- Test 11: „Ako dlho trvá <názov>?“ pre každú službu s trvaním v 8 jazykoch (112 otázok), bez ceny.

## Pravidlo 7 – cena len pri istej zhode so službou (nové v oprave 3)

- Cenu alebo trvanie panel povie, len keď má víťazná služba v otázke aspoň jedno z:
  - istú zhodu so **silným kmeňom** (slovo z názvu alebo opisu služby na stránke),
  - **celý názov služby** z cenníka (aj ako variant otázky; pridá skóre 0,5),
  - presne pripravenú otázku (`otazky`, skóre +9).
- Inak (len slabé kmene) → „Myslíš toto?“ (`recepcia.js:26–36`, `:67`).
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
