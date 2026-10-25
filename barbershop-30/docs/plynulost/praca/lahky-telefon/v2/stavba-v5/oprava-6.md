# V5 etapa 1 – Recepcia: oprava 6 (kolo 2: triedy W, D, M, Z, voľby, nezávislé orákulum)

Staviteľ: senior staviteľ, jediný zapisovateľ v `hs-recepcia`. 25. 10. 2026, približne 10:10–11:10 UTC.

- Strom `$SP/hs-recepcia`, vetva `barbershop-recepcia`. Pred opravou HEAD `aeaafb7`, po oprave HEAD **`854e849`**
  (5 commitov), `git status --short` = 0 riadkov. Nič som nepushoval, nemergoval ani nenasadzoval.
- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`, `$S5` = `$SP/barber/lahky-telefon/v2/stavba-v5`.
- Zásady zhody: `$S5/ZASADY-ZHODY.md` – verzia 2 ostáva, doplnená časť „Oprava 6 – triedy W, D, M, Z“.
- Pracovné súbory: `$S5/o6/` (zoznam na konci). Vstup generátora jazykov `$S5/jazyky_data.py` a `$S5/jazyky-gen.py`
  sú v konečnom stave (pôvodné v `o6/*.pred-o6.py`). Iné stromy (hs-lahky, hs-vernost) som nemenil.
- Prehliadač: jeden, port 8711, ~1 min, po behu server aj prehliadač zavreté (`curl 127.0.0.1:8711` → 000).

## Výsledok

| kritérium | cieľ | pred (`aeaafb7`) | po (`854e849`) | dôkaz |
|---|---|---|---|---|
| holé chyby v slepých sadách A, B, C2, D1, D2 (1 528 otázok) | 0 | **3** (W 1, D 2) | **0** | `python3 -I o6/hodnot-v2.py pred` / `po` |
| odovzdanie navyše (legitímne 944, ako hodnotiteľ v2-1) | ≤ 10–15 % | 10,49 % (99) | **8,47 % (80)** | to isté (`o6/pred-hodnot-v2.txt`, `o6/po-hodnot-v2.txt`) |
| `recepcia-kombinacie-test.mjs` | pass | 7/7 (starý súbor) | **10/10** (22 526 otázok + lint) | `node --test source/tools/recepcia-kombinacie-test.mjs` |
| ten istý nový súbor testov na `aeaafb7` | – | **5 z 10 zlyhá** (P6f 2 577, P6g 118, P6e 17, P6a 26, lint) | – | `o6/kombinacie-o6-na-aeaafb7.txt` |
| `recepcia-test.mjs` | pass | 23/23 | **23/23** | `node --test source/tools/recepcia-test.mjs` |
| triedy kontroly 4 (A trvanie × bez trvania, B farbenie × služba) | 0 | 0 / 0 | **0 / 0** | `node k4/trieda-k4.mjs <strom>` (`o6/pred.txt`, `o6/po.txt`) |
| váha po ťuknutí: js + css + sk.json (gzip 6 / gzip -9) | ≤ 12 288 B | 12 055 / 11 985 | **12 206 / 12 175** | test 5; `gzip -9c … \| wc -c` |
| váha s iným jazykom, najťažší uk (gzip 6 / -9) | ≤ 13 312 B | 13 267 / 13 177 | **13 256 / 13 196** | to isté |
| prvé okno (app.js + style.css) proti f624ee8 | ≤ +500 B | +491 B | **+491 B** (od `aeaafb7` 0 B zmien) | `git diff aeaafb7..HEAD -- assets/app.js assets/style.css \| wc -c` → 0 |
| index.html | 0 B | 0 | **0 B** | `git diff f624ee8..HEAD -- index.html \| wc -c` → 0 |
| čas zhody, max (medián zo 7 behov, 1 736 otázok) | < 5 ms | 5,85 ms (1 nad 5 ms) | **2,34 ms** (0 nad 5 ms) | `node slepe/cas-v2-1.mjs <strom> slepe/sada-*.jsonl` → `o6/cas-pred.txt`, `o6/cas-po.txt` |

Čas: merané za sebou na tom istom stroji (load 1,0–1,3, súbežne 1–2 procesy prehliadača iného tímu) – orientačne.
Slepé sady už pre mňa nie sú slepé (opravujem podľa hodnotenia v2-1); opravy sú triedy, nie vety, a overujú ich
kombinatorické testy z dát. Na ďalšie kolo odporúčam nové sady.

## 1. Chyby z hodnotenia v2-1 a ich triedy

| jazyk | otázka | `aeaafb7` | `854e849` |
|---|---|---|---|
| sk | V pondelok o 9:00 na bradu? | holá cena Úprava brady 15 € | „Myslíš toto?“ [hodiny, úprava brady, strih s bradou, farbenie brady] |
| cs | Střih pro syna (8) a pro mě, kolik? | holá cena deti 15 € | „Myslíš toto?“ [deti, pánsky strih, strih s bradou] |
| pl | Strzyżenie dla syna (8 lat) i dla mnie? | holá cena deti 15 € | „Myslíš toto?“ [deti, pánsky strih, strih s bradou] |

Sondy (`o6/sondy-w-d.txt`, výstupy `o6/pred.txt` a `o6/po.txt`, oddiel „sondy W, D, M, Z“), výber:

| trieda | otázka | `aeaafb7` | `854e849` |
|---|---|---|---|
| W | sk „strih o 21:00?“, „strih v piatok o 20:00?“, en „haircut Monday 20:00?“, „haircut at 9 pm?“ | 18 € | „Myslíš toto?“ [hodiny, pánsky strih, …] |
| W | en „Haircut on Monday?“, de „Haarschnitt am Montag?“, hu „Hajvágás hétfőn?“, sr, uk, cs obdoba | 18 € | „Myslíš toto?“ [pánsky strih, …] |
| W | sk „Koľko stojí strih zajtra ráno?“, „Koľko stojí strih večer?“, „Ráno strih?“ | 18 € | „Myslíš toto?“ |
| W | sk „Kedy máte otvorené v pondelok?“, „Máte otvorené zajtra?“, „Kedy otvárate ráno?“ | hodiny | hodiny (bez zmeny) |
| W | sk „aké bude zajtra počasie“ | odovzdanie | odovzdanie (bez zmeny) |
| D | en „Cut for my son (6) and me, price?“, uk „Стрижка для сина і для мене?“ | 15 € | „Myslíš toto?“ [deti …] |
| M (nová) | sk „Koľko stojí strih pre malého?“, de „Haarschnitt für Kleine?“, sr „… za malog?“, pl „… dla małego?“, cs „… pro malého?“ | **18 €** | „Myslíš toto?“ [pánsky strih, deti, …] |
| Z | sk „Rozumiem, koľko stojí strih?“, cs, pl obdoba | téma jazyky barberov | 18 € (výrez cenníka) |
| Z | sk „Dobré ráno, …“, en „Good evening, …“, de „Guten Abend, …“, hu „Jó estét, …“, uk „Привіт, …“ | 18 € | 18 € (bez zmeny) |
| – | sk „Koľko stojí strih a brada pre mňa?“ | „Myslíš toto?“ | 28 € (zámeno je výplň) |
| – | sk „Môžem sa objednať na strih na zajtra ráno?“ | výber barbera (odchýlka) | „Myslíš toto?“ [rezervácia, pánsky strih, …] |

### W – deň, „zajtra“, časť dňa a čas (commit `6b297b3`)

Príčina: `vypln` obsahoval pracovné dni, „zajtra“ a „ráno“ (8 jazykov) a modul mazal čas `\d+:\d+` pred zhodou
(`aeaafb7` `recepcia.js:72`). P1 tieto slová medzi výplň nepočíta.
Oprava: dni, „zajtra“ a časti dňa sú **slabé** kmene položky hodiny (sk ručne v `sk.json`, ostatné cez
`jazyky_data.py` → `jazyky-gen.py`); čas `9:00`, `9 pm`, `9am` je slovo `0h`, silný kmeň `=0h!` hodín
(`recepcia.js:72`). Hygiena kmeňov (P5): `=streda =stredu =stredy` (nie „stredne“), pl `=środa`, sr `=sreda`,
uk `ятниц` (apostrof delí „п’ятниця“), pl odkedy `Dział` → `Działa` (inak „poniedziałek“ = odkedy), uk online `вноч`.

### Z – pozdrav (commit `6b297b3`)

Časť dňa je aj pozdrav. Pravidlo (`recepcia.js:76`, `:80`, `:82`): zdvorilé slovo, ktoré je kmeňom položky, je výplň
len hneď po inom zdvorilom slove; inde obsahové slovo. Dáta: kmeň jazykov barberov `Rozum` (sk, cs, pl) zachytil
„rozumiem“ → presné tvary `=Rozumiete =Rozumie` (cs `=Rozumíte =Rozumí`, pl `=Rozumiecie =Rozumie`); uk recepcia
„привіт“ (ahoj) → `привіта` („привітає“).

### D – druhá osoba (commit `86559ab`)

Príčina: zámená prvej osoby sú stop-slová/výplň, takže „pre syna a pre mňa“ vysvetlila položka deti celá.
Oprava (`recepcia.js:62`): položka deti má v dátach `ine` (sk `mna mne`, cs `me mne`, pl `mnie`, en `me myself`,
de `mich mir`, hu `nekem engem en`, sr `mene meni`, uk `мене мені`); s nimi **a so spojkou** nie je plná →
„Myslíš toto?“. Zámená sú zároveň výplň (sk `mna`, hu `nekem engem`, sr `mene` v `stop`).

### M – dieťa opísané veľkosťou (nová trieda, commit `86559ab`)

Našiel ju lint výplne (de `klein`, uk `мале` pohltia kmeň detí) a sonda: `vypln` obsahoval „malé/malý, małe/mały, malo/mali, kicsi, small, klein/kleine, мале/малий“
– nie je to trieda P1 a „pre malého“ je dieťa. Sú to slabé kmene položky deti (sk `maly male malych maleho malemu`,
cs `malý malé malých malého`, hu `kicsi`, en `small`), z výplne vyradené. Ten istý lint: hu `sima` ⊃ `simára`
(holenie) → `=sima`, sr `ko` ⊃ `koz` (pleť) → `=ko`.

## 2. Voľby P2 a preklep (commit `a08e8b4`)

- Kandidát voľby aj pri istej zhode so silným kmeňom a súčte ≥ 2, nielen pri cenovej otázke (`recepcia.js:66`).
- Preklep sa nehádá pri slove, ktoré je istým slovom inej položky; zhoda podľa bigramov váži ako slabý kmeň
  (`recepcia.js:59`) a platí len pri rovnakom prvom písmene (`recepcia.js:19`). V slepých sadách bolo 375 zásahov
  bigramovej zhody, 285 s iným prvým písmenom („będzie“ ≈ „niedziel“, „úprava“ ≈ „práve“, „hair“ ≈ „chair“) –
  meranie skriptom so zápisom zásahov (`zhoda` s mapou zásahov) nad slepými sadami.
- Účinok: priame odpovede v slepých sadách bez zmeny (`o6/stav1-*.jsonl` vs `o6/stav2-*.jsonl`), odovzdanie bez
  správnej voľby 93 → 78 (podľa `o6/zarad.py`), čas zhody max 5,85 → 2,8 ms.
- Náhodný vedľajší účinok: en „My hair is quite long, over 10 cm. Is it more expensive?“ a sk „Mám vlasy dlho
  nestrihané, asi 15 cm, koľko?“ už neponúkajú voľbu trvania, ale [nad 10 cm, farbenie vlasov] – ťuknutie dá 22 €
  vo výreze (hodnotiteľ ich rátal ako odovzdanie navyše).

## 3. Testy (commit `854e849`)

- **Orákulum** (`recepcia-kombinacie-test.mjs`, `veci`): menované veci sú vložené časti otázky (názov, kmeň inej
  položky, deň, čas, osoba), nie slová po odrátaní `stop`/`vypln` z JSON. Cenové slovo je výplň podľa vlastného
  zoznamu testu `CENA` (trieda P1). Dvojslovný spúšťač (wie lange) vysvetľuje položka trvanie.
- **P6f** (4 432 otázok): 7 dní a „zajtra“ z `Intl.DateTimeFormat`/`Intl.RelativeTimeFormat` (ICU, nie dáta modulu),
  časť dňa, `9:00 21:00 7:30 8 pm 9am` × každá služba s cenou (cena aj trvanie) → nikdy holá odpoveď; pozdrav pred
  otázkou nemení priamu odpoveď; „Kedy máte otvorené {deň}?“ = hodiny.
- **P6g** (288 otázok): dieťa (silný kmeň deti) + spojka + zámeno prvej osoby → nie holá cena, deti medzi prvými
  dvomi voľbami; dieťa opísané veľkosťou (malého, Kleine, małego, kicsinek, маленького …) nikdy cenu dospelého.
- **P1 lint**: dni a „zajtra“ (Intl) nie sú výplň a vysvetlí ich položka hodiny; `=0h` je kmeň hodín; výplňové ani
  zdvorilé slovo nepohltí kmeň služby s cenou; zámeno prvej osoby je v `ine` položky deti.
- **P6e**: 150 → 179 riadkov (3 chyby v2-1, sondy W a D, pozdravy); „Koľko stojí strih vo štvrtok večer?“ už nesmie
  dostať holú cenu (predtým povolené `cena-strih`).
- Ten istý testový súbor na `aeaafb7` (kópia stromu `o6/strom-pred/`): 5/10 zlyhá – `o6/kombinacie-o6-na-aeaafb7.txt`.

## 4. Váha (commit `6e5b376`)

Rezerva uk po oprave 5 bola 45 B; triedy W a D pridávajú kmene do 8 JSON a ~80 B do modulu. Preto prvý commit:
varianty otázok v en, uk, hu, sr, pl, de, cs len tam, kde menia odpoveď (zobrazovaná + prvý variant ostávajú, test 4),
odkazy `tel:` a `mailto:` priamo v `kontakt`. **Bez zmeny odpovedí**: 2 379 otázok (všetky otázky pôvodných JSON
vrátane vyradených variantov + slepé sady) dávajú na `aeaafb7` a po commite to isté (`node o6/bez-zmeny.mjs` →
`o6/stav1-bez-zmeny.txt`: „rozdielnych odpovedí 0“). Konečná rezerva: sk 82 B, uk 56 B (gzip 6).

## 5. Prehliadač (port 8711)

`node o6/panel-o6.mjs http://127.0.0.1:8711/ o6/snimky` (title overený curlom: „Barbershop 30 Nitra | Pánske strihy,
brada a holenie – rezervácia online“), telefón 390×844 aj počítač 1440×900 → `o6/snimky/panel-o6.json`:

- chyby stránky 0, chyby konzoly 0 (telefón aj počítač); CLS pred ťuknutím: telefón 0, počítač 0,0001 (app.js
  a style.css sa od `aeaafb7` nezmenili);
- „V pondelok o 9:00 na bradu?“ → voľby [Kedy máte otvorené?, Koľko stojí úprava brady?, …], Celý cenník, Zavolať
  (`o6/snimky/o6-telefon-pondelok.png`);
- „Strih pre syna (8) a pre mňa, koľko?“ → [Strihate aj deti?, Koľko stojí pánsky strih?, …]; ťuknutie na prvú
  voľbu → výrez cenníka so zvýrazneným „Strih pre malých gentlemanov 45 min 15 €“ (`o6-telefon-deti-vyrez.png`);
- „Dobré ráno, koľko stojí strih?“ → výrez „▶ Pánsky strih 40 min 18 €“; fallback → odkazy `tel:+421951267203`,
  `mailto:info@barbershop30.sk`, rezervácia; Esc zavrie panel, fokus na tlačidle recepcie.

## 6. Commity (len lokálne, po slovensky)

| commit | správa | testy na commite |
|---|---|---|
| `6e5b376` | recepcia – váha: varianty otázok len tam, kde menia odpoveď | 23/23, 7/7, 0 zmien odpovedí |
| `a08e8b4` | recepcia – voľby pri silnom slove, preklep bez falošných zhôd | 23/23, 7/7 |
| `6b297b3` | recepcia – deň, zajtra, časť dňa a čas sú slová hodín | 23/23, 7/7 |
| `86559ab` | recepcia – druhá osoba a dieťa opísané veľkosťou nedostanú holú cenu | 23/23, 7/7 |
| `854e849` | recepcia – nezávislé orákulum a testy dní, času a osôb | 23/23, 10/10 |

Commity som zostavil z konečného stavu skriptom `o6/stavy.py` (etapy S1–S5, kumulatívne nad `aeaafb7`), každú etapu
overil `o6/over-stav.sh` (`o6/stav1.txt` … `stav5.txt`, slepé sady `o6/stavN-*.jsonl`). Etapa S5 je bajtovo zhodná
s `o6/final/` (recepcia.js, 8 JSON, test, jazyky_data.py, jazyky-gen.py – `cmp` bez rozdielu).

## Čo ostáva otvorené (nie je holá chyba)

- **Odchýlky bez tvrdenia** (5, ako v2-1): „chcem sa objednat na strih“ a „Dobry den, chcel by som sa objednat na
  strih, ako na to?“ → „Svojho človeka si vyberieš v rezervácii.“; „Máte TikTok?“ → Instagram; „Hundefriseur?“ → tím;
  „Máte wifi v čakárni?“ → káva.
- **Holé číslo bez minút** („Koľko stojí strih o 9?“) ostáva 18 € – číslo môže byť vek alebo cm; čas je `hh:mm`
  a `9 pm`/`9am`; „o 9 hod“, „um 20 Uhr“ priamu odpoveď zakážu ako neznáme slovo.
- **Zápor** („Nechcem strih, iba bradu“) – voľby sú správne, ale poradie strih/brada rozhoduje poradie dát (pri
  niektorých je správna voľba až 3.); zámerne nehádané.
- en „A cut for my 8-year-old son and one for me?“ → [deti, odkedy]: en odkedy má silný kmeň `Year`, ktorý zachytí
  vek („8-year-old“); en „cut“ je len slabý kmeň pánskeho strihu, takže pánsky strih medzi voľbami chýba.
- Otázky na meno barbera (Nikolas, Lajko, Dominika …) → [pánsky strih] alebo odovzdanie; mená nepoznáme.
- sr „Kada radite?“ → [hodiny, odkedy] („Od kada radite?“ má „od“ ako stop-slovo).
- `ceny-konecne` ukazuje vetu s cenou bez výrezu (P3 odchýlka z v2-1, nemenené).
- Sada D1 sama má odovzdanie navyše 12,9 % (dlhé vety, mená, srbská cyrilika).

## Súbory v `$S5/o6/`

`beh.sh` (celý beh: triedy k4, sondy, skeptik, slepé sady), `pred.txt`/`po.txt`, `pred-*.jsonl`/`po-*.jsonl`
a `*-zarad.json`, `zarad.py` (kópia hodnotiteľovho `zarad-v2-1.py`), `hodnot-v2.py` (tabuľka ako `zarad-v2-1-rucne.py`)
→ `pred-hodnot-v2.txt`, `po-hodnot-v2.txt`, `porovnaj.py`, `sondy-w-d.txt`, `cas-o6.mjs`, `cas-pred.txt`,
`cas-po.txt`, `varianty.mjs` + `varianty.json` (ktoré varianty menia odpoveď), `bez-zmeny.mjs` +
`stav1-bez-zmeny.txt`, `stavy.py` + `over-stav.sh` + `stav/` + `stav1…5.txt`, `final/`, `strom-pred/` (kópia
`aeaafb7` pre porovnanie), `kombinacie-o6-na-aeaafb7.txt`, `panel-o6.mjs` + `snimky/`, `ladenie.mjs`, `prof/`
(profil zhody), `recepcia.pred-o6.js`, `jazyky_data.pred-o6.py`, `jazyky-gen.pred-o6.py`, `ZASADY-ZHODY.pred-o6.md`.
