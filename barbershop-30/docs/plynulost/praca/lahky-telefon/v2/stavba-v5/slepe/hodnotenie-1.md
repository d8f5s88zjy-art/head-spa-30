# Slepé sady – hodnotenie, kolo 1

Hodnotiteľ: nezávislý, v strome sa nič nemenilo.
Strom: `hs-recepcia`, HEAD **f715141** („vek nad 10 rokov ako trieda, neznáme slovo od 3 znakov“), `git status --short` = 0 riadkov. Pozor: zadanie uvádza HEAD d4657b7, odvtedy pribudlo 8 commitov (0321242 … f715141); hodnotil som skutočný HEAD.
Projektový test `node source/tools/recepcia-test.mjs` → `# fail 0`.

## Postup (zopakovateľný)

```
cd .../stavba-v5/slepe
node spust-slepe.mjs ../../../../../hs-recepcia/barbershop-30 sada-A.jsonl > vysledky-A-1.jsonl
node spust-slepe.mjs ../../../../../hs-recepcia/barbershop-30 sada-B.jsonl > vysledky-B-1.jsonl
python3 zarad-1.py vysledky-A-1.jsonl vysledky-B-1.jsonl   # zapíše vysledky-*-1-zarad.json
```

- `spust-slepe.mjs` – podľa `k1-skusaj.mjs`, číta JSONL, volá `odpovedz()` z `assets/recepcia.js` s JSON jazyka, zapisuje typ, id, služba (pri trvaní) a zobrazený text.
- `zarad-1.py` – zaradenie:
  - **OK** – odpoveď s očakávaným id (alebo id z `prijatelne`); pri téme odovzdanie/bez-ceny: nevieme, fallback, zdvorilosť, alebo pri bez-ceny odpoveď bez ceny/trvania.
  - **BEZPEČNÉ** – legitímna otázka skončila odovzdaním, fallbackom alebo „Myslíš toto?“ so správnym kandidátom.
  - **CHYBA** – cena alebo trvanie (€, min, perc, хв …) inej služby, než ktorú otázka myslí, alebo cena na tému odovzdanie/bez-ceny.
  - pomocné triedy (nezapočítané ako chyba): **VÝBER‑MIMO** (legitímna otázka, „Myslíš toto?“ bez správneho kandidáta), **VÝBER‑NELEG** („Myslíš toto?“ na tému odovzdanie – nič netvrdí, ponúka cenník, telefón a e‑mail; podľa zásady majiteľa prijateľné), **ODCHÝLKA** (odpoveď bez ceny a trvania, ktorá nesedí na otázku).
- Trvanie: odpoveď `trvanie` so `sluzba` sa hodnotí ako tá služba. Všetky trvania zo stránky som overil v `barbershop-30/index.html`: strih 40 min (:530), strih s bradou 60 (:536), nad 10 cm 60 (:542), malí gentlemani 45 (:548), oholenie hlavy 25 (:554), úprava brady 20 (:566), Hot Towel 30 (:572), farbenie brady 30 (:578), Balíček 1 65 (:590), Ultra 80 (:596), pleť 30 (:608), obočie 5/10 (:614/:632), depilácia 10 (:620), ornament 10 (:626). Všetkých 57 odpovedí typu trvanie menuje službu z otázky a má číslo zo stránky.

## Výsledok

| sada | spolu | OK | BEZPEČNÉ | VÝBER‑MIMO | VÝBER‑NELEG | ODCHÝLKA | **CHYBA** |
|---|---|---|---|---|---|---|---|
| A (bežný zákazník) | 349 | 317 | 28 | 1 | 3 | 0 | **0** |
| B (pasce) | 315 | 242 | 23 | 3 | 38 | 4 | **5** |
| **spolu** | **664** | 559 | 51 | 4 | 41 | 4 | **5** |

- Legitímne otázky (očakávaná položka, nie odovzdanie/bez-ceny): 274; OK 218 (79,6 %), BEZPEČNÉ 51 → **fallback_legit_pct = 18,6 %**, VÝBER‑MIMO 4, CHYBA 1.
- Sporné očakávania pri chybách: **0** (všetkých 5 očakávaní som overil v index.html, pozri nižšie).
- Triedy z kola 3 (K1 zdvorilosti, K2 trvanie inej služby, V6 iná osoba – žena, V7 balzam/vosk/olej, V8 holenie hlavy britvou, V9 iné miesto) sa v týchto sadách **nevrátili**: napr. „ahoj, sorry ze otravujem, kolko stoji len brada?“ → výber [úprava brady]; „holenie hlavy britvou“ → Oholenie hlavy 13 €; ženy, mama, svokra, teta → odovzdanie; všetky trvania sedia so službou.

## CHYBY (5)

| # | jazyk | otázka | dostal | malo byť | trieda | overenie očakávania |
|---|---|---|---|---|---|---|
| 1 | sk | Synovi je 12, platí ešte detský strih? | odpoveď `deti`: „Strih pre malých gentlemanov 15 €“ + veta „… pre chlapcov do 10 rokov.“ | odovzdanie (`vek`) | iná osoba (vek nad 10) | index.html:547 a :840 – „do 10 rokov“; očakávanie správne. Zmierňuje to, že odpoveď obsahuje vetu s hranicou 10 rokov, ale na otázku „platí ešte?“ dáva cenu ako áno. |
| 2 | sk | Mám vlasy 3 cm, koľko stojí strih? | `cena-dlhe`: „Pánsky strih – dĺžka vlasov nad 10 cm 22 €“ | `cena-strih` 18 € (alebo výber) | iné (číslo dĺžky – opak „nad 10 cm“) | index.html:531 18 €, :543 22 € len nad 10 cm; očakávanie správne. |
| 3 | de | Was kostet Rückenwaxing? | `depilacia`: „Ohren- und Nasenwaxing 5,50 €“ | odovzdanie | zložené slovo (iná časť tela) | index.html:619 – len uši a nos; voskovanie chrbta stránka neponúka. |
| 4 | hu | Szempillafestés mennyi? (farbenie mihalníc) | `farbenie-brady`: „Szakállfestés 10 €“ | odovzdanie | zložené slovo (iný produkt) | stránka má len farbenie brady (:579) a obočia (:633), mihalnice nie. |
| 5 | hu | Hátgyantázás ára? (voskovanie chrbta) | `depilacia`: „Fül- és orrgyantázás 5,50 €“ | odovzdanie | zložené slovo (iná časť tela) | index.html:619 – len uši a nos. |

Pri #3–#5 zobrazený názov služby (uši a nos, brada) zákazníka upozorní, že ide o inú službu, no podľa zásady majiteľa je to stále cena ako „áno“ na neponúkanú službu.

### Príčiny (podľa kódu a dát, na overenie stavbárom)

- **#3, #5 zložené slová:** kmeň dlhší ako 4 znaky sa hľadá aj vnútri slova (`recepcia.js:21`, `w.includes(k)` → 0,9 „vnútri“). `ruckenwaxing` obsahuje silný kmeň `Waxing` (de.json, depilacia), `hatgyantazas` obsahuje `Gyant` (hu.json). Predná časť zloženého slova (Rücken, hát) je neznáme slovo, ale pri zhode „vnútri“ ju nič nekontroluje. Rovnaký tvar hrozí v pl/cs/sr/uk pri spojenom písaní a v nemčine pri akomkoľvek `…waxing`, `…färbung`, `…rasur`.
- **#4:** `szempillafestes` obsahuje `Festes` (hu.json, farbenie-brady, skupina 1). Položka má dve skupiny (`… | Szakall osz`), zasiahnutá je len prvá; pri položke s `odpoved` sa skóre len zníži na (1+1)/(1+2) (`recepcia.js:34`, `if (n > 1) s *= p.odpoved || hit.size === n …`), nevynuluje sa. Farbenie brady bez slova „brada“ teda môže dostať cenu.
- **#1:** veto `vek` (sk.json `>10! … | rok rokov rocn … syn chlapec … det diet`) vyžaduje istú zhodu v každej skupine. `synovi` k `syn` a `detsky` k `det` dávajú pri kmeni ≤ 3 znaky a predĺžení o 3 znaky len 0,6 (`recepcia.js:20`, `e < (k.length > 3 ? 4 : 2)`), takže druhá skupina nie je istá a veto nepadne. Česká obdoba („Synovi je 13, platí dětská cena?“) skončila výberom – bezpečne.
- **#2:** `=Cm` je v `cena-dlhe` silný kmeň a „10“ sa porovnáva len ako `=10`; číslo pred „cm“ menšie ako 10 sa nekontroluje.

## Nezapočítané, ale na pozornosť

- **VÝBER‑MIMO (4):** „Nechcem bradu, len strih, koľko?“ a cs „Jen střih, bez vousů, kolik?“ → výber [strih s bradou, úprava brady] bez pánskeho strihu (zápor); „Strihate o polnoci?“ → výber [pánsky strih]; „su v cene nejake priplatky?“ → výber [dlhé vlasy]. Nič netvrdia, ale ponúkajú nesprávne tlačidlá.
- **VÝBER‑NELEG (41):** najmä psy, voskovanie chrbta/nôh, mihalnice, piercing, permanentka → „Myslíš toto?“ s pánskym strihom/depiláciou/farbením brady. Prijateľné podľa zásady majiteľa (ponuka cenníka), ale ťuknutím zákazník uvidí cenu služby, ktorú nechcel. Hraničné: „Synovi je 13, platí dětská cena?“ → výber [deti].
- **ODCHÝLKA (4, bez ceny):** „Len fénovanie bez strihu, koľko?“ → obsah pánskeho strihu; „Koľko je plat barbera?“ a de „Hundefriseur?“ → tím; „Máte TikTok?“ → Instagram (vecne správne).

## Verdikt kola 1

Sada A bez chyby. Sada B: **5 CHÝB** (1 iná osoba – vek, 1 iné – číslo dĺžky, 3 zložené slová). Trieda „cena inej služby“ sa teda stále vracia, tentoraz cez **zhodu vnútri zloženého slova** a cez **neúplnú kontrolu čísel** (vek, cm). Ak zásada je 0 vážnych chýb, stav **NEPRIJATÉ**; oprava by mala byť v pravidle (zhoda vnútri slova s neznámou prednou časťou → najviac výber/odovzdanie; dvojskupinová položka s cenou len pri zásahu oboch skupín; číslo pri `cm`/veku porovnať s hranicou 10), nie v ďalších kmeňoch.

Súbory: `spust-slepe.mjs`, `zarad-1.py`, `vysledky-A-1.jsonl`, `vysledky-B-1.jsonl`, `vysledky-A-1-zarad.json`, `vysledky-B-1-zarad.json` v tomto priečinku.
