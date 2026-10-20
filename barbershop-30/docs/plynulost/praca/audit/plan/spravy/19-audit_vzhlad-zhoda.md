# Audit vzhľadu: telefón vs počítač (vzhlad-zhoda), rola dizajnér 0–10

Výstupy sú v `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit/vzhlad-zhoda/` (ďalej `VZ/`). Repozitár sa nemenil: pracovný strom `hs2`, vetva `barbershop-plynulost` = `origin/main` `bcd487e`, `git status` je čistý.

## 1. Metodika

- **Server a prehliadač:** `python3 -m http.server 8211` v `hs2` (8100 + 3×37), web na `/barbershop-30/`. Chromium headless (Playwright), WebGL cez SwiftShader.
- **Zariadenia:**
  - telefón 390×844 a 360×780, DPR 3, isMobile, dotyk,
  - počítač 1440×900 a 1920×1080, DPR 1,
  - 1440×900 pri DPR 2 len výpočtom.
- **Režimy:**
  - **film** `?film=on&uvod=off`: v kontajneri bez GPU film inak nebeží. V teste je vypnuté znižovanie rozlíšenia plátna (`film.js:1182`), aby snímka ukazovala to, čo vidí telefón s grafikou.
  - **pokojná verzia** `?film=off`.
  - **predvolená adresa** `?uvod=off`: world-frame + world-off, to isté ako Lighthouse.
  - **prológ** `?uvod=znova&film=on`, zastavený cez `BS30_FILM.proFreeze`.
- **Postup snímok (`zhoda.mjs`):**
  - Pre každú titulnú kartu, strih a pás (tím, služby, galéria, kontakt) a pre kroky po 0,9 okna sa skroluje a čaká na ustálenie: `__scrollSettled`, dekódované fotky, film S=T a prelínanie 0 alebo 1, sekvencie.
  - Robí sa snímka celej obrazovky aj snímka bez textu (`-ciste.png`).
  - Metriky (zdroj/px, písmo, CLS) sú v `beats.json`.
  - Dvojice telefón | počítač (`pary.py`) sú v `VZ/pary/`. Snímky som si prezrel.
- **Rýchlosť:** pri vzhľade CPU bez spomalenia a lokálna sieť. CLS prvého načítania aj pri sieti 150 ms RTT / 1,6 Mb/s a CPU 4× (`cls-siet.mjs`).
- **Obmedzenia:**
  - V `d1920-on` a `p360-on` sa niektoré karty pri softvérovom kreslení neustálili (S medzi kotvami). Overil som, že kotvy sú správne a film len dobiehal (1920: kotvy -1080, 0, 1458, 2214, 2970…; S→T 1,974 / 2,95 / 3,95). Tieto snímky preto nie sú dôkazom.
  - `strihy.mjs` (cutFreeze) dáva skrol do stredu medzi kotvy, takže text na nich nesedí. Slúžia len na vzhľad prelínania.
  - Lištu prehliadača (svh/lvh) emulácia nevie, preto je posúdená výpočtom.

## 2. Súhrn

Systém (písmo, farby, karty, poradie sekcií, CLS ≈ 0) je na telefóne aj počítači rovnaký. Telefón pôsobí horšie z troch príčin:

1. **Tri zábery sú z videí 576 px namiesto fotiek.** Poď ďalej, Remeslo a Komu zveríš hlavu sú na telefóne z videí majiteľa 576×1024, zväčšené 2,8×. Ostrosť je o 47 % nižšia a strihy sú jednoduchšie, lebo videá nemajú hĺbkovú mapu.
2. **Výrezy na výšku vidia 19–25 % šírky fotky** a stredujú vedľajší predmet:
   - buldog je napoly, kreslá chýbajú,
   - šálka je odrezaná,
   - namiesto kresla je tmavý sud.
3. **Pásy galérie, tímu a recenzií ukazujú po jednej karte.** Okno „Tím v akcii“ a linka kapitol na telefóne chýbajú.

Spoločne pre obe zariadenia:

- Pri nábehu filmu jas na ~0,45 s klesne na 35–54 % (tmavé bliknutie).
- Text karty sa vymení o ~300 ms skôr než obraz pod ním.
- Na počítači je úvodná fotka rohožky len 1920 px a zo 44–55 % takmer čierna.

**Celkové skóre podľa tim-roly (najnižší prechod): telefón 5/10, počítač 7/10.**

## 3. Merania

### 3.1 Rozlíšenie

Pixely zdroja na pixel displeja, výpočet podľa `film.js` (`layout()`, `pickSize()`, `DPR_MAX`, `CAP`, `OVER`) v `merania/rozlisenie.txt`:

| zariadenie | fotky vo filme | videá vo filme | záloha pokojná |
|---|---|---|---|
| p390 | 0,67 (plátno max 2×) | 0,45 (sekvencie 720), 0,54 (tím 864); natívne video 576 px → **0,36** | 0,79–0,99; Poď ďalej f025 **0,45–0,48** |
| p360 | 0,67 | 0,49 / 0,59 | 0,64–0,80 |
| d1440 | 1,00 | – | 1,03–1,47 |
| d1920 | 1,00; rohozka **0,81** | – | rohozka 0,77 |
| d1440 DPR 2 | 0,81; rohozka **0,54** | – | 0,52–1,10 |

### 3.2 Ostrosť očami

Snímky bez textu som prevzorkoval na spoločný uhol. Css px telefónu 3× pri 460 ppi a 30 cm zaberá 1,43× väčší uhol než css px počítača pri 110 ppi a 60 cm. Zdroj: `ostrost3.py` → `merania/ostrost-oko.tsv`.

- **HF** = podiel energie v najjemnejšej oktáve.
- **LN** = Laplacián na jednotku kontrastu.

| karta | p390 film | d1440 film | p390 pokojná | d1440 pokojná |
|---|---|---|---|---|
| rohozka | 0,38 | 0,46 | 0,54 | 0,62 |
| sala (telefón video) | **0,15** / LN 0,026 | 0,24 / 0,046 | 0,16 | 0,28 |
| stol (telefón video) | **0,15** / 0,017 | 0,29 / 0,067 | 0,38 | 0,35 |
| cakaren | 0,22 | 0,27 | 0,33 | 0,37 |
| sala-rano (telefón video) | **0,17** / 0,030 | 0,36 / 0,130 | 0,39 | 0,48 |
| kreslo-stred | 0,29 | 0,33 | 0,39 | 0,42 |
| kava | 0,24 | 0,25 | 0,31 | 0,36 |
| sud | 0,31 | 0,59 | 0,42 | 0,81 |
| vstup | 0,24 | 0,29 | 0,34 | 0,39 |
| **priemer** | **0,24** | **0,34** | 0,36 | 0,45 |

- Videové karty na telefóne: −47 % HF. Fotky na telefóne: −23 %.
- Ďalšie priemery: p360 pokojná 0,33, d1920 pokojná 0,38.
- Na oko: `pary/ostrost-vyrezy-on.jpg` (tváre aj hrany vo videu rozmazané, kocky kompresie) a `pary/ostrost-vyrezy-off.jpg`.

### 3.3 Orezy

`orezy.py` → `pary/orezy-mapa.jpg`.

- Počítač vidí 81 % šírky fotky.
- Telefón vo filme vidí 25 %, Remeslo 19 %, Káva 20 %. Výrez -m je 9:16 a z neho pri presahu 1,24 vidno 66 %.

### 3.4 Tmavé plochy

Podiel okna s jasom < 20, celé snímky s textom, `merania/tmavost.tsv`:

| karta | telefón film | počítač film | telefón pokojná | počítač pokojná |
|---|---|---|---|---|
| sud | **0,30** | 0,10 | 0,32 | 0,20 |
| kreslo-stred | 0,19 | 0,09 | 0,20 | 0,16 |
| rohozka | 0,04 | **0,44** | 0,07 | **0,55** |

Priemery: telefón 0,11 / 0,19, počítač 0,14 / 0,26. Telefón celkovo nie je tmavší. Tmavé sú konkrétne výrezy a úvod počítača.

### 3.5 Kontrast textu na fotke

Najsvetlejšie 1 % pod textom, bez tieňa, `merania/kontrast.txt`:

- Telefón úvod: nadpisok 1,3 : 1, nadpis 1,6 : 1 (medián 8,2 / 8,5).
- Počítač úvod: 5,4 / 6,4.
- Nadpisky pod 4,5 : 1 sú na oboch zariadeniach:
  - telefón: kreslo 2,1, vstup 2,2,
  - počítač: čakáreň 2,8, sála ráno 3,5.

### 3.6 Typografia

`typo.mjs` → `merania/typo.json`:

| | p390 | p360 | d1440 | d1920 |
|---|---|---|---|---|
| podiel znakov < 14 px | 8,4 % | 8,5 % | 6,6 % | 6,6 % |
| < 13 px | 2,1 % | 2,3 % | 1,6 % | 1,6 % |
| najmenšie písmo | 11 px | 11 px | 11 px | 11 px |
| vodorovné pretečenie | 0 | 0 | 0 | 0 |

- Najmenšie písmo je výzva „Prejdi si podnik“.
- Nadpisy kariet: telefón 51 px (úvod 59), počítač 95 px (úvod 109).
- Riadky na telefóne majú 23–33 znakov. Fakty kontaktu v dvoch stĺpcoch majú len 14 znakov.

### 3.7 Tempo textu a obrazu

`tempo-real.mjs`: skutočný ťah prstom cez `Input.dispatchTouchEvent` alebo koliesko. Text sa meria z `--o`, obraz je model `film.js` na nameranej dráhe skrolu.

| gesto | nový text 90 % | nový záber 50 % / 90 % | nový nadpis nad starou miestnosťou |
|---|---|---|---|
| telefón švih (560 px / 80 ms) | 385 ms | 667 / 1084 ms | **317 ms** |
| telefón stredný (420 / 180 ms) | 845 ms | 1040 / 1740 ms | **317 ms** |
| telefón pomalý (300 / 450 ms) | – | 1957 / 2374 ms | skrol zastal 1 px za hranou: **oba nadpisy < 0,5, film dočerpal novú miestnosť bez nadpisu** (pásmo y 810–879) |
| počítač 5 zárezov | 1007 ms | 1208 / 1725 ms | **283 ms** |

### 3.8 Odovzdanie zálohy filmu (world-in)

Krytie zálohy a plátna sa číta zo štýlu v každej snímke (`odovzdanie.mjs`). Snímky sú v presnom čase, prechody CSS posunuté cez CDP Animation (`odovzdanie-snimky.mjs`).

| čas po world-in | záloha | plátno | jas spolu |
|---|---|---|---|
| 0 ms | 1 | 0 | 100 % |
| 250 ms | 0,82 | 0,05 | 83 % |
| 431 ms | 0,26 | 0,17 | 38 % |
| 508 ms | 0,10 | 0,29 | **36 %** |
| 700 ms | 0 | 0,71 | 71 % |

- Na snímkach klesne pás fotky na telefóne z 56,1 na 30,5 (**−46 %**), na počítači z 39,9 na 26,5 (**−34 %**).
- Model: minimum 35 % v 450 ms, pod 60 % asi od 380 do 600 ms.

### 3.9 Skoky rozloženia (CLS)

- Telefón 0,0000 a počítač 0,0001 vo všetkých režimoch.
- Pri 1,6 Mb/s a CPU 4× rovnako 0,0000 / 0,0001.
- Manrope 600/700 však prichádza až po 2,44–2,77 s.

## 4. Sekcia po sekcii

| sekcia | telefón | počítač | verdikt |
|---|---|---|---|
| Prológ (fasáda → dvere → rohožka) | výrez výkladu BARBERSHOP, pásy 9vh, nadpis cez okná a plagát | celá fasáda 4096 px, ulica, auto | zhodný priebeh aj nadväznosť záloha = film; obe majú bliknutie |
| Úvod rohožka | iná fotka (foto-40: recepcia, lampy, rohožka dole), svetlá; nadpis na obklade a lampe | slider/3: sud a rohožka s logom, 1920 px, 44 % takmer čierne | **iné**: telefón živší, počítač tmavý a mäkký |
| Poď ďalej | sekvencia videa (barber pri práci), mäkká | ostrá fotka sály | **iné aj horšie** |
| Remeslo | sekvencia okolo kresla, mäkká; pokojná: polica s fľašami | pracovné miesto, zrkadlo, TV | **horšie** |
| Čakáreň | pumpa cez celé okno, buldog napoly, kreslá chýbajú | buldog, pumpa, kreslá | **orez** |
| Komu zveríš hlavu | slučka videa tímu, mäkká | ranná sála, ostrá | **iné** |
| Pás tím | pás 1,5 karty z 10, bez okna videa | 10 portrétov a okno „Tím v akcii“ | **ochudobnené** |
| Služby | kreslo cez okno (19 % tmavé), kroky zoznamom, cenník v 2 riadkoch | 5 krokov v rade, cenník v riadku | zhodné, v poriadku |
| Galéria | šálka odrezaná; pás 1 z 8 fotiek; recenzie 1 zo 6 | mozaika 8 fotiek; 6 recenzií | **ochudobnené** |
| Cestou von | tmavý sud a uteráky (30 % takmer čierne), kreslo mimo | kreslo, obklad, sud | **orez a tma** |
| Rezervácia, kontakt, pätička | zhodné; fakty v úzkych stĺpcoch | zhodné | v poriadku |
| Menu | celoplošné, presvitá nadpis karty | lišta | drobnosť |
| Linka kapitol | chýba | bodky vľavo | **chýba** |

## 5. Hodnotenie 0–10

| prechod | telefón | prečo nie 10 | počítač | prečo nie 10 | ako vyzerá 10 |
|---|---|---|---|---|---|
| Prvý dojem | 7 | bliknutie −46 %; nadpis na lampe (1,6 : 1); iná fotka než počítač | 7 | bliknutie −34 %; rohožka 1920 px, 44–55 % takmer čierna | odovzdanie bez poklesu jasu, ostrá a čitateľná fotka pod nadpisom |
| Film a prechody | 6 | 2 z 8 strihov jednoduchšie; videá bez hĺbky; dvojexpozícia v pokojnej verzii | 8 | bliknutie; dvojexpozícia v pokojnej verzii | rovnaké strihy, prelínanie sa v pokoji dokončí |
| Fotky a ostrosť | 5 | videá 0,36 natívneho px na px displeja (HF −47 %); fotky −23 %; výrezy 19–25 % šírky orezávajú predmet | 8 | 1920 a retina: rohožka 0,81 / 0,54, ostatné 0,81 | HF telefónu ≥ 0,8 × počítač; kľúčový predmet celý v okne |
| Typografia a čitateľnosť | 7 | nadpisky 12 px pod 3 : 1 na svetlých miestach; fakty 14 zn./riadok; Manrope 600/700 po 2,5 s | 8 | nadpisky 2,8–3,9 : 1; Manrope 600/700 neskoro | kontrast ≥ 4,5 : 1 pre malé písmo, písma do 1,2 s |
| Tempo pohybu | 6 | text 317 ms pred obrazom; pásmo bez nadpisu 69 px; lišta prehliadača preklopí kartu | 7 | text 283 ms pred obrazom | jedna časová os, rozdiel ≤ 100 ms |
| Celistvosť | 6 | galéria 1/8, tím 1,5/10, recenzie 1/6; bez okna videa tímu; bez linky kapitol; menu presvitá | 9 | – | rovnaký obsah na prvý pohľad, prispôsobený na výšku |
| **celkové (najnižšie)** | **5** | | **7** | | 8+ vo všetkých prechodoch |

## 6. Nálezy

Úplné reprodukcie, dôkazy, príčiny (súbor:riadok) a opravy sú v poli `nalezy`.

**Vysoká:**
- VZ-01 Videá 576 px na telefóne.
- VZ-02 Tmavé bliknutie pri nábehu filmu.
- VZ-03 Orezy na výšku.

**Stredná:**
- VZ-04 Jednoduchšie strihy na telefóne.
- VZ-05 Text pred obrazom.
- VZ-06 Celistvosť telefónu.
- VZ-07 Úvod na počítači tmavý a mäkký.

**Nízka:**
- VZ-08 Rozlíšenie filmu na telefóne.
- VZ-09 Lišta prehliadača.
- VZ-10 Dvojexpozícia v pokojnej verzii.
- VZ-11 Kontrast úvodu na telefóne.
- VZ-12 Menu presvitá.
- VZ-13 Neskoré písmo Manrope 600/700.

Bez nálezu: poradie sekcií je rovnaké, CLS < 0,001, vodorovné pretečenie žiadne a písmový systém je jednotný.

Prekrýva sa s auditom čiernych okien: tmavé spodky sudu sú tu VZ-03 s príčinou vo výreze. Výpadky záloh (is-near, oneskorené dekódovanie) tu nemerám.

## 7. Odporúčané poradie opráv a odhad dopadu

| poradie | nález | čo sa zmení | dopad na skóre |
|---|---|---|---|
| 1 | VZ-02 | len CSS; jas pri odovzdaní ≥ 95 % | prvý dojem +1 na oboch |
| 2 | VZ-01 + VZ-04 | telefón dostane pri troch kartách tie isté fotky s hĺbkou; výrezy -m už existujú, mení sa index.html a CUTS; video ako okno | fotky 5→7, film 6→7,5 |
| 3 | VZ-03 + VZ-08 | nové body výrezov v film.py a presah 1,12 na telefóne | fotky →8; tmavé plochy sudu 30 %→~12 % |
| 4 | VZ-05 + VZ-09 + VZ-10 | jedna časová os text/obraz, voľná dĺžka zo svh, dokončenie prelínania v pokoji | tempo 6→8 |
| 5 | VZ-06 + VZ-12 | mozaika galérie, počítadlá pásov, okno videa tímu bez filmu, vodorovná linka kapitol, plné menu | celistvosť 6→8 |
| 6 | VZ-07, VZ-11, VZ-13 | fotka úvodu na počítači, stmavenie pod nadpisom úvodu, písmo 700 skôr | prvý dojem 8→8,5 |

Po týchto opravách je očakávané skóre telefónu ≥ 8 vo všetkých prechodoch. Výkonové riziko je len pri presahu 1,12 a fotkách namiesto videí, a to je skôr úspora (žiadne nahrávanie snímok sekvencie).

## 8. Nástroje

Spúšťajú sa z `VZ/` pri bežiacom serveri na 8211. Pred aj po oprave tá istá metóda.

**Snímky a dvojice:**
- `node zhoda.mjs --dev=p390|p360|d1440|d1920 --mode=on|off|def [--krok] [--kontrast] [--len=regex]`
- `python3 -I pary.py <mód>`
- `python3 -I harok.py`

**Rozlíšenie, ostrosť, orezy:**
- `python3 -I rozlisenie.py ../../../hs2/barbershop-30`
- `python3 -I ostrost3.py shots/...`
- `python3 -I ostrost-vyrezy.py on|off výstup karty...`
- `python3 -I orezy.py ../../../hs2/barbershop-30 pary/orezy-mapa.jpg`

**Tma a kontrast:**
- `python3 -I tmavost.py shots/...`
- `python3 -I tma.py shots/<dir>`
- `python3 -I kontrast.py shots/*-k`

**Typografia, tempo, odovzdanie, CLS:**
- `node typo.mjs`
- `node tempo-real.mjs --dev=p390 --profil=pomaly|stredne|svih`
- `node tempo-real.mjs --dev=d1440 --zarezy=5`
- `node odovzdanie.mjs --dev=p390|d1440`
- `node odovzdanie-snimky.mjs --dev=p390|d1440 --casy=0,250,450,700,1300`
- `python3 -I odovzdanie-model.py`
- `node cls-siet.mjs`

**Strihy, prológ, menu:**
- `node strihy.mjs`
- `node uvod.mjs`
- `node menu.mjs`

Výsledky sú v `VZ/merania/` a `VZ/pary/`. Snímky sú v `VZ/shots/`, spolu ~445 MB, žiadny súbor nad 50 MB, videá som nevytváral.
