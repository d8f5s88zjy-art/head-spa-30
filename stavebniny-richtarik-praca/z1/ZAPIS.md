# z1: úvod zo skutočných fotiek dvora, bez auta (zápis, 5. 11. 2026)

Zapisovateľ 1 (pokračovanie po limite o 12:50). Strom `scratchpad/hs-richtarik-obnova`, vetva `richtarik-profi`,
porty 9680–9686. Všetky cesty nižšie sú relatívne k `richtarik/profi/z1/`, ak nie je uvedené inak.

## 1. Stav vetvy

```
git rev-parse --abbrev-ref HEAD          → richtarik-profi
git merge-base HEAD 4b2646bf             → 4b2646bf5a79d633748773b54278e82b7d73c1a4
git status --short | wc -l               → 0
git log --format='%h %an <%ae> %s' 4b2646bf..HEAD
2387fc1a Claude <noreply@anthropic.com> Stavebniny Richtárik: pôvod upravených fotiek dvora v FOTKY.md
3af5e799 Claude <noreply@anthropic.com> Stavebniny Richtárik: pás Doprava bez JS stojí
5cea1f7f Claude <noreply@anthropic.com> Stavebniny Richtárik: fotka dvora na pomalej sieti skôr, strih bez vkladania v prvej snímke
0cfbc952 Claude <noreply@anthropic.com> Stavebniny Richtárik: záložné písmo bez zalomenia nadpisu, čitateľný popis pri službách
fe0243ee Claude <noreply@anthropic.com> Stavebniny Richtárik: texty úvodnej stránky s vykaním
661abca7 Claude <noreply@anthropic.com> Stavebniny Richtárik: úvod zo skutočných fotiek dvora bez auta
8755bca8 Claude <noreply@anthropic.com> Stavebniny Richtárik: vrátené neupravené fotky dvora
```

- Prvé štyri commity (8755bca8 až 0cfbc952, Z1-01 až Z1-07) sú od predchádzajúceho zapisovateľa. Overil som ich
  príkazmi a snímkami v časti 3.
- Posledné tri commity (5cea1f7f, 3af5e799, 2387fc1a) sú z tohto pokračovania. Opravujú to, čo ukázali merania
  (časť 2).
- Nič som nepushol, nezlúčil ani nenasadil. Servery 9680 až 9685 som ukončil:
  `pgrep -fa 'http.server 968'` → nič, `curl` na 9680 až 9685 → `000`.

**Podpisové riadky (odchýlka od Z1-12).** Plán poroty žiada commity bez riadkov `Co-Authored-By` a `Claude-Session`.
Táto relácia však má systémové pravidlo, ktoré tieto dva riadky na koniec commitu vyžaduje. Prednosť pred ním má len
vlastný pokyn používateľa, nie text úlohy z orchestrátora. Moje tri commity preto tieto riadky majú:
`git log --format=%B 4b2646bf..HEAD | grep -cE '^(Co-Authored-By|Claude-Session):'` → `6`.
Rovnako postupoval aj súbežný zapisovateľ z3 (commity 3c00cf80, d283a758, 0b59c5b0). Commity predchodcu tieto riadky
nemajú. Ak ich majiteľ nechce, treba ich odstrániť pred zlúčením (prepísanie histórie som sám nerobil).
- Ostatné časti Z1-12 sú splnené: autor `Claude <noreply@anthropic.com>`, slovo AI v správach
  `git log --format=%B 4b2646bf..HEAD | grep -cw AI` → `0`, `git status` je prázdny.

## 2. Čo som v pokračovaní zmenil a prečo

### 2a. Fotky pásu pod úvodom až po fotke dvora (5cea1f7f)

Prvé meranie A/B (`meranie-ab-head/suhrn.txt`) ukázalo regresiu na pomalej sieti. Na telefóne pri Slow 4G
bolo LCP nového úvodu 3 840 ms, kým dnes (4b2646bf) to bolo 2 164 ms.

**Príčina:** poradie požiadaviek (`nastroje/siet-z1.mjs`, telefón 390×844, CPU 4×, Slow 4G):
- Pás „Na našom dvore v Nitre“ je hneď pod úvodom (y 1 043 pri 390×844, `prac/pozicie.mjs`).
- Jeho 4 lenivé fotky (856–900 px, spolu 858 kB) sa začali sťahovať v 1 745 ms a brali pásmo fotke dvora (208 kB).
  Tá sa preto dotiahla až v 3 832 ms.
- Dnešný web tento problém nemal: film ho odsúval pod pripnutý blok a fotky pásu sa za 8 s vôbec nestiahli.

**Oprava:**
- Skript v `<head>` pridá triedu `uv-pocka` a CSS `.uv-pocka .zas img{display:none}`. Lenivý obrázok bez boxu sa
  nesťahuje.
- Trieda zmizne po udalosti `load` alebo `error` fotky dvora, pri posune alebo najneskôr po 4 s.
- Dlaždice majú `aspect-ratio:4/5`, takže sa nič neposunie (CLS 0).
- Bez JS sa pás sťahuje hneď.

**Po oprave** (`siet-z1.mjs`) sa fotka dvora dotiahne v 2 910 ms a fotky pásu idú až po nej (2 937 ms).

**Overenie** (`kontroly/pocka.log`):

| režim | fotky pásu viditeľné a načítané | CLS |
|---|---|---|
| bežne | 4 / 4 | 0 |
| bez JS | 4 / 4 (stiahnuté hneď, v 25 ms) | – |
| obmedziť pohyb | 4 / 4 | 0 |
| fotka dvora zlyhá (abort) | 4 / 4 | 0 |
| fotka dvora meškaná o 6 s | 4 / 4 | 0 |

### 2b. Zábery strihu sa v prvej snímke nevkladajú (5cea1f7f)

**Pôvodne:** skript zábery vložil skryté do rámu, aby sa dekódovali, potom ich vybral a o 1,0 s vložil znova.
V prvej snímke strihu tak vznikali štýly, rozmiestnenie a vykreslenie 4 podstromov.

**Teraz:** dekódované zábery ostanú skryté v ráme a štart len prepne triedu `uv-mont`.

**Pri tom som našiel a opravil chybu.** Keď zákazník posunul alebo ťukol medzi dekódovaním a štartom (okolo 0,5 –
1,0 s), tlačidlo „Prehrať úvod“ ostalo navždy skryté (`prac/stop-pred-strihom.txt`):

| strom | po prerušení v 750 ms |
|---|---|
| HEAD 0cfbc952 | `"znovaViditelne":false` (kliknutie na tlačidlo zlyhalo po 30 s) |
| nový | 4 / 4 behy `"znova":true`, v ráme 0 záberov, „Prehrať úvod“ spustí strih so 4 zábermi (`nastroje/stop-pred-z1.mjs`) |

Prerušenie ešte počas dekódovania (225–273 ms) funguje tiež, 4 / 4.

### 2c. Pás Doprava bez JS stojí (3af5e799)

Kritérium Z1-06 znie: „Bez JS beží 0 animácií okrem pásu značiek“.
- **Predtým:** `kontroly/kontroly.log`, riadky `staticke` → bez JS bežalo `["marquee","drift"]` (telefón)
  a `["marquee","drift-pc"]` (počítač).
- **Teraz:** drift je v `@media (scripting:enabled)` a bez JS je fotka na telefóne staticky v `scale(1.04)`.
  `kontroly/staticke2/prehliadka-z1.log` → bez JS beží `["marquee"]`, pri „obmedziť pohyb“ `[]`, a to na úvode
  aj v katalógu, na telefóne aj na počítači.
- **S JS** sa nemení nič: `drift:running` (390) a `drift-pc:running` (1440).
- Hárok `prac/band-harok-pc.jpg` (otvorený): pás s JS aj bez JS má rovnaký výrez a je na ňom neupravená fotka
  s plachtami.

### 2d. FOTKY.md (2387fc1a)

- **Pôvod upravených fotiek:** vznikli v `6d285c37` („doplnený tovar na fotkách dvora“) a menili sa v `b46c7d43`
  a `6bffd83e`. `85799036` Porfix dočasne vrátil na pôvodnú verziu.
- **Stará veta** o fotkách `img/hd` hovorila o „úvode“ a „páse s vozíkom“, ktorý na webe už nie je. Opravil som ju.
- **Kontrola md5** (`prac/upravene-len-md5.txt`, `prac/strom-md5.txt`):
  - zo 100 verzií v piatich commitoch je 54 rôznych md5, ktoré sa líšia od `bb6bbaeb`,
  - v strome je 1 092 súborov a ani jeden nemá md5 upravenej verzie (`0`),
  - 20 / 20 vrátených súborov má md5 zhodné s `bb6bbaeb`.
- Hárok `harok-fotky-upravena-vratena.jpg` som otvoril. Vľavo sú upravené fotky s rovnými radmi paliet Porfix,
  vpravo neupravené s plachtami, prázdnou a načatou paletou.

## 3. Kritériá Z1-01 až Z1-12

| ID | výsledok | doklad |
|---|---|---|
| Z1-01 | splnené | Vetva, merge-base a prázdny status sú v časti 1. `vychodisko/beh.log` uvádza záťaž (`load average: 3.67…`), súhrny sú v `vychodisko/suhrn-uvod.txt` a `vychodisko/suhrn-prechod.txt`. |
| Z1-02 | splnené | md5 20 / 20 = `bb6bbaeb`, v strome 0 súborov s md5 upravenej verzie (časť 2d), hárok otvorený. |
| Z1-03 | splnené | `git ls-files stavebniny-richtarik/img/film \| wc -l` → `0`. `grep -rIlE 'img/film\|uvod/og\.jpg\|film-data\|richtarikFilm\|film-ide\|stary-uvod\|IVECO'` → `0`. `Iveco` v `index.html` je 1×, len riadok služieb `:100` („Avia 3,5 t a Iveco 8 t s mechanickou rukou“, otvorená otázka). Testy filmu v `dokoncenie/nastroje` sú nahradené testami úvodu (`grep -ci film` vo `funkcie.mjs`, `technika_fling.mjs` a `prehliadka.mjs` → 0 / 0 / 0). |
| Z1-04 | splnené | `grep -l 'img/og-dvor.jpg'` → 75 / 75 HTML. `identify` → `1200x630`, 175 703 B. md5 je zhodné s `koncept-film/web/img/film-d/og-dvor.jpg`. Výrez pravého okraja `prac/og-pravy-okraj-head.jpg` (otvorený): je na ňom obloha, palety, dom, stĺp a hala, auto nie. `build.py:24` má komentár „výrez skutočnej fotky dvora u4, bez auta“. |
| Z1-05 | splnené | `grep -ci film` v `index.html`, `site.css` a `site.js` → 0. Snímky 0,3–5,0 s sú v hárkoch `kontroly/harok-snimky-tel.jpg` a `kontroly/harok-snimky-pc.jpg` (oba otvorené): okno kina, nadpis po riadkoch, štyri zábery (Tehly, Pórobetón, Dlažby a obrubníky, Stavebné rezivo), na konci „Náš dvor · Novozámocká 62/68, Nitra“. Hľadanie „cement“ počas strihu: `funkcie-z1/funkcie.json`, `uvodHladaniePocasStrihu` → strih bežal, potom `mont:false`, zábery 0, výsledkov 7. Bez JS: `uvodBezJS.rovnake:true`, čiže súbory zásob sú rovnaké so šablónou aj bez nej a strih nestiahne nič navyše. |
| Z1-06 | splnené | Rozloženie je v časti 7. Medián „H1 použiteľný“ na telefóne s CPU 4× je 465 ms (340 / 358 / 572 / 663, `meranie-ab3`). Pri FCP je H1 `visibility: visible` (`kontroly/pismo.log`). CLS je najviac 0,0004. Bez JS beží len `marquee` (po 3af5e799). |
| Z1-07 | splnené | `audit.py` nad výpisom `index.html` → tykanie 0 (`kontroly/texty/audit-index.txt`). `grep -ciE 'super cen\|najlacn\|zložíme\|presne tam\|poradíme hneď\|na sklade alebo objednáme\|\bAI\b'` → 0. `img/p/88[345]` → 0. Na stránke je 1 H1 a obsahuje „Stavebniny“ aj „Nitra“. Lede má 131 znakov. Tabuľka text → FAKTY.md je v časti 9. |
| Z1-08 | splnené pre kritérium, riziko pri väčších displejoch | Časť 6. |
| Z1-09 | splnené | Časť 5. |
| Z1-10 | splnené v poslednom meraní; v skoršom behu bola raz snímka 83 ms | Časť 4. |
| Z1-11 | splnené | `venv/bin/python build.py` → `kontrola úvodu: OK (stránok 75, og obrázok dvora na všetkých, H1 1×, bez starého videa)`. `index.html` sa nezmenil (`md5sum -c` → OK) a `git status` po behu ukázal len moje rozpracované súbory, takže 74 podstránok je zhodných so zostavou a všetky majú `og-dvor.jpg`. `grep -c 'img/film'` v README a FOTKY → 0 / 0. README má časť „Úvod“ so scenárom, fotkami, výmenou záberu, vypnutím strihu a poradím sťahovania. |
| Z1-12 | splnené okrem podpisových riadkov | Časť 1. |

## 4. Výkon A/B (Z1-10 a doplnenie zadania)

**Podmienky:**
- Playwright, Chromium z `/opt/pw-browsers`, lokálne servery `python3 -I -m http.server` (bez kompresie).
- Telefón 390×844, DPR 3, CPU 4×. Počítač 1440×900, CPU 1×. Cache je vypnutá.
- Varianty sa striedali a poradie sa posúvalo v každom kole. Pred každou sériou bolo jedno nezapočítané zahriatie
  každého variantu (`nastroje/prehliadka-z1b.mjs`, `nastroje/ab-z1c.sh`).
- Pri každom behu sa zapísalo vyťaženie CPU celého stroja počas 8 s (jadrá zo 4, `/proc/stat`).
- Súbežne bežali iné úlohy, preto čísla porovnávam len v rámci kola.

**Varianty:**
- `dnes` je kópia 4b2646bf (port 9681).
- `head` je kópia 0cfbc952, teda stav pred týmto pokračovaním (port 9683).
- `novy` je pracovný strom = 5cea1f7f (port 9680). Commit 3af5e799 mení len pohyb bez JS.

**Záťaž počas sérií** (load avg 1 min / vyťažené jadrá):

| séria | load | jadrá |
|---|---|---|
| telefón | 1,05–1,81 | 1,2–2,31 |
| počítač | 1,71–2,52 | 1,16–2,32 |
| 4G | 2,02–4,52 | 1,86–2,26 |
| Slow 4G | 2,51–3,24 | 2,13–2,64 |

Pri 4G záťaž ku koncu série vystúpila nad 3,5, čo je mimo podmienky kritéria.

Surové dáta sú v `meranie-ab3/prehliadka-z1.log`, súhrn v `meranie-ab3/suhrn.txt`. Okno animácie: `novy` a `head`
1,0–4,1 s (scenár), `dnes` 0,6–5,0 s.

| profil | sieť | variant | LCP medián (behy) ms | prvok LCP | CLS max | snímky > 50 ms v okne | najdlhšia | H1 použiteľný ms | kB za 8 s | auto |
|---|---|---|---|---|---|---|---|---|---|---|
| tel | bez | dnes | 642 (500/664/700/620) | prvy-t960.avif | 0 | 0/0/1/0 | 83 | 563/524/508/450 | 5 198 | 1 |
| tel | bez | head | 502 (352/596/408/724) | dvor-t-1448.avif | 0 | 0/0/0/0 | 0 | 598/338/622/444 | 2 806 | 0 |
| tel | bez | **novy** | **488** (644/392/584/360) | **dvor-t-1448.avif** | 0 | **0/0/0/0** | **0** | 340/663/358/572 | **2 807** | 0 |
| tel | 4G | dnes | 864 | prvy-t960.avif | 0 | 2/2/2 | 333 | 1 025/1 138/1 219 | 4 327 | 1 |
| tel | 4G | head | 952 | dvor-t-1448.avif | 0 | 0/1/1 | 83 | 803/981/775 | 1 402 | 0 |
| tel | 4G | **novy** | 932 | dvor-t-1448.avif | 0 | **0/0/0** | 0 | 845/1 015/803 | 1 403 | 0 |
| tel | Slow 4G | dnes | 2 148 | prvy-t960.avif | 0 | 5/7/4 | 217 | 2 867/2 887/2 902 | 1 233 | 1 |
| tel | Slow 4G | head | 3 912 | dvor-t-1448.avif | 0,0001 | 3/6/8 | 233 | 2 143/2 134/2 131 | 1 402 | 0 |
| tel | Slow 4G | **novy** | **3 008** | dvor-t-1448.avif | 0,0001 | 5/7/5 | 233 | 2 167/2 148/2 169 | 1 403 | 0 |
| pc | bez | dnes | 316 | prvy-p1920.avif | 0,0009 | 1/0/0 | 67 | 335/298/289 | 8 417 | 1 |
| pc | bez | head | 264 | dvor-p-1720.avif | 0,0004 | 0/0/0 | 0 | 119/114/108 | 2 512 | 0 |
| pc | bez | **novy** | **276** (244/356/276) | **dvor-p-1720.avif** | **0,0004** | **0/0/0** | 0 | 93/113/112 | 2 513 | 0 |

**Kritérium Z1-10** (telefón bez obmedzenia siete, 4 behy; počítač 3 behy):

| kritérium | cieľ | namerané | výsledok |
|---|---|---|---|
| telefón: medián LCP | ≤ 550 ms | 488 ms | splnené |
| telefón: prvok LCP | fotka dvora | `dvor-t-1448.avif` | splnené |
| telefón: dlhé snímky v okne | 0 aspoň v 3 zo 4 behov, nikdy nad 67 ms | 0 vo všetkých 4 behoch | splnené |
| telefón: bajty za 8 s | ≤ 3,0 MB | 2,81 MB | splnené |
| počítač: medián LCP | ≤ 300 ms | 276 ms | splnené |
| počítač: dlhé snímky v okne | 0 vo všetkých behoch | 0 / 0 / 0 | splnené |
| počítač: CLS | ≤ 0,01 | 0,0004 | splnené |
| iframe: `pageerror` | 0 | 0 (časť 8) | splnené |
| chyby konzoly | – | 0 vo všetkých 39 behoch | – |

**Skoršie série ukazujú rozptyl.** Kritérium nie je v každej sérii isté:

| série | zahriatie | výsledok |
|---|---|---|
| `meranie-ab-head` (HEAD 0cfbc952) | bez zahriatia | studený prvý beh oboch variantov; telefón 1/0/2/0 so snímkou 1 467 ms v 1 122 ms, LCP medián 640 ms |
| `meranie-ab2` (len oprava 2a) | so zahriatím | telefón 0/0/1/0, jedna snímka 83 ms v 1 013 ms, LCP medián 528 ms |

- **Stopa výkonu** (`nastroje/stopa-z1.mjs`, `stopa/novy-bez-1.json`): v čase okolo 1,0 s hlavné vlákno spracúvalo
  sieťové telá obrázkov (`ResponseBodyLoader` 47–74 ms pri CPU 4×), nie strih.
- **Po oprave 2b** sú v okne 0 dlhých snímok v 4 zo 4 behov. Dlhé snímky pri 4G aj Slow 4G sú pred oknom alebo
  počas načítania stránky. Strih sa pri Slow 4G nespustí, lebo zábery nie sú hotové do 3,4 s, a ukáže sa
  „Prehrať úvod“.

**Slow 4G zostáva horšie ako dnes, aj po oprave:** LCP 3 008 ms proti 2 148 ms.
- Dôvod je veľkosť fotky dvora: na telefóne s DPR 3 je to 1 448 px, 208 kB. Dnešná fotka mala 960 px a 134 kB a pri
  1 170 px zariadenia bola zväčšená 1,22×, teda neostrá.
- Na Slow 4G je dnes obsah použiteľný neskôr: H1, telefón a hľadanie 2,87–2,90 s. Nový web ich má použiteľné za
  2,15–2,17 s.
- Riešenia sú v časti 10 (R1).

## 5. Jas a tmavé plochy (Z1-09)

**Video:**
- Nástroj `nastroje/video-z1.mjs`: načítanie → 6 s úvod → posun dole a späť → Prehrať úvod.
- Telefón 390×844 s CPU 4×, počítač 1440×900.
- Rozložené na 10 snímok/s (`ffmpeg fps=10`) a merané cez `nastroje/jas_video.py` (rovnaká miera ako `jas2.py`).
- Záznamy: `kontroly/video/uvod-tel.mp4` a `uvod-pc.mp4`.

| profil | snímok od navigácie | najnižší priemerný jas | najviac px s Y < 60 | snímok s jasom < 155 | snímok s tmavými > 18 % |
|---|---|---|---|---|---|
| telefón | 139 | 173,2 (2,0 s) | 10,6 % (6,2 s) | 0 | 0 |
| počítač | 141 | 161,6 (2,1 s) | 12,9 % (5,2 s) | 0 | 0 |

**Hárky:** `kontroly/video/harok-tel.jpg` a `harok-pc.jpg` (každých 0,5 s s jasom) a kontaktný hárok úvodu
`uvod-harok.jpg` (0–5 s telefón aj počítač). Všetky som otvoril:
- Žiadna čierna ani tmavá clona, okno kina je z papiera.
- Najtmavšie miesto je samotná fotka dvora s tmavými stohmi tvárnic.

Nástroje `jas_video.py` a `uvod_harok.py` som opravil. Pri posune navigácie 0,03 s vyberali snímky mimo mriežky
0,5 s a na telefóne hárok spadol.

## 6. Ostrosť (Z1-08)

`nastroje/ostrost.mjs` → `kontroly/ostrost.jsonl`. Pomer = px zariadenia na šírku výrezu ÷ px súboru (≤ 1 znamená bez
zväčšenia). Kamera 1,09 a nájazd záberu 1,14 sú započítané.

| okno | fotka dvora koniec / začiatok | zábery nájazd | zábery koniec |
|---|---|---|---|
| 390×844 @3 | **0,81** / 0,88 (1448) | **0,87–0,91** | 0,76–0,80 |
| 1440×900 @1 | **0,84** / 0,91 (1720) | 0,52–0,78 | 0,45–0,68 |
| 360×740 @3 | 0,99 / 1,08 (1086) | 0,59–0,62 | 0,52–0,55 |
| 430×932 @3 | 0,89 / 0,97 | 1,09–1,15 | 0,96–1,01 |
| 1280×800 @1 | 0,99 / 1,08 (1290) | 0,41–0,62 | 0,36–0,55 |
| 1920×1080 @1 | 1,12 / 1,22 (1720) | 0,65–0,97 | 0,57–0,85 |
| 1440×900 @2 | 1,67 / 1,83 (1720) | 1,04 | 0,91 |

**Kritérium** (390@3 a 1440@1: koniec ≤ 1,0, zábery ≤ 1,05) je splnené.

Väčšie zdroje v repozitári ani v histórii nie sú. `git log --all --name-only -- stavebniny-richtarik/img/uvod`:
- zábery majú najviac 856–900 px,
- `dvor-p` najviac 1 720 px, lebo je to výrez 0–1 720 z `u4-p-1920`.

Nad hranicou sú tieto prípady (riziko R2):
- 1920@1: fotka dvora 1,12,
- retina počítač 1440@2: 1,67,
- 430@3: nájazd záberu 1,09–1,15.

## 7. Rozloženie a písmo (Z1-06)

`nastroje/rozlozenie-z1.mjs` → `kontroly/rozlozenie/rozlozenie.json`, stav po strihu (5,2 s).

| šírka | pretečenie | H1 px | H1 celé v okne | celé číslo 0905 622 223 na 1. obrazovke | hľadanie celé / nad `.mbar` | zástupný text pretečie | odznak orezaný | riadok nad H1 a tlačidlá v 1 riadku | fotka / okno |
|---|---|---|---|---|---|---|---|---|---|
| 320×640 | nie | 28 | áno | áno (ikona + číslo) | áno / áno (562 ≤ 571) | nie | nie | áno / áno | 0,23 |
| 360 | nie | 30,2 | áno | áno („Zavolať 0905 622 223“) | áno / áno | nie | nie | áno / áno | 0,32 |
| 390 | nie | 32,8 | áno | áno | áno / áno (746 ≤ 775) | nie | nie | áno / áno | 0,41 |
| 414 | nie | 34,8 | áno | áno | áno / áno | nie | nie | áno / áno | 0,44 |
| 430 | nie | 36 | áno | áno | áno / áno | nie | nie | áno / áno | 0,46 |
| 768 | nie | 47,6 | áno | áno | áno / áno | nie | nie | áno / áno | 0,40 |
| 1024×768 | nie | 63,5 | áno | áno | áno / – | nie | nie | **áno / áno** | 0,30 |
| 1280×720 | nie | 66 | áno | áno | áno / – | nie | nie | áno / áno | 0,47 |
| 1440×900 | nie | **66** | áno (spodok 782) | áno | áno (spodok 887 ≤ 900) | nie | nie | áno / áno | **0,57** |
| 1920×1080 | nie | 66 | áno | áno | áno | nie | nie | áno / áno | 0,59 |

Pri 1280×720 má pás fotky 47 % výšky okna. Celý H1, telefón aj hľadanie sa pri tejto výške zmestia len takto.
Kritérium pre 1440×900 (≥ 50 %) je splnené.

**Výmena písma** (`nastroje/pismo-z1.mjs` → `kontroly/pismo.log`):

| profil | FCP | H1 pri FCP | lede, telefón, hľadanie pri FCP | CLS bežne | CLS pri písme zdržanom o 1,5 s | riadky H1 pred / po výmene |
|---|---|---|---|---|---|---|
| telefón CPU 4× | 528 ms | `visible` | viditeľné | 0 | 0,0003 | 37/37 / 37/37 |
| počítač | 232 ms | `visible` | viditeľné | 0,0004 | 0,0004 | 73/73 / 73/73 |

## 8. Ďalšie kontroly

**Funkčné testy** (`dokoncenie/nastroje/funkcie.mjs`, výstup `funkcie-z1/funkcie.json`, 35 testov):
- Úvod na telefóne aj počítači: v 1,8 s beží strih so 4 štítkami, v 5,1 s je hotový a „Prehrať úvod“ je viditeľné.
  Prehrať znova a prerušenie posunom fungujú.
- Hodiny: dnešný deň je zvýraznený a slovo „otvorené“ v texte nie je.
- Pri „obmedziť pohyb“ beží 0 animácií, `uv-ide` chýba, 0 záberov a strana nepreteká.
- **Jedna chyba v teste `prechodVT`** (`Failed to read the 'sessionStorage'… Access is denied`) nie je chyba webu.
  Hádže ju vlastný skript testu na prázdnej stránke `about:blank` Playwrightu. Overenie (`prac/vt-test.mjs`,
  4 behy): v behoch 2 a 4 je `INIT-ERR about:blank`, prechod medzi stránkami je vo všetkých 4 behoch `true`.

**Posun** (telefón CPU 4×, 30 × 120 px, `kontroly/kontroly.log`, riadky `posun`):

| variant | `scrollY` | pripnuté prvky | snímky > 50 ms |
|---|---|---|---|
| nový | presne 360, 720 … 3 600 | lišta, zavretý drawer, `.mbar` | 3 (max 100) a 0 pri záťaži 4,4–4,7 |
| dnes | rovnako | navyše `DIV.pin 390×844` | 10 (max 367) a 2 |

**Iframe** (`nastroje/iframe-z1.mjs`, hostiteľ `prac/iframe/host.html`, rám so `sandbox` s `allow-same-origin`
aj bez neho → `kontroly/iframe.txt`):
- Dnes aj nový web majú 0 `pageerror` a prechod do katalógu v ráme funguje.
- 16 chýb konzoly je rovnakých ako dnes: písma CORS a `net::ERR_FAILED` v ráme bez `allow-same-origin`.

**Prehliadka všetkých stránok** (`dokoncenie/nastroje/prehliadka.mjs`, 8 šírok 320–1920,
`kontroly/prehliadka-vsetky/prehliadka.txt`):

| fáza | výsledok |
|---|---|
| statika | 75 stránok, 7 687 odkazov a zdrojov, **0 chýb**, 0 sirôt |
| prehľadávač 1440 | konzola 0, chyby stránky 0, zlyhané požiadavky 0, rozbité obrázky 0, bez alt 0, H1 zle 0 |
| rozloženie | pretečenie **0** na všetkých 8 šírkach |

Rozloženie hlási aj tieto nálezy. Všetky sú rovnaké ako v behu predchodcu (`prac/prehliadka-661/prehliadka.txt`):
- „mimo okna“ je odkaz „Preskočiť na obsah“ (`a.skip`), ktorý je mimo okna zámerne.
- „prekrytý text“ je štítok „Od roku 1997“ v časti O nás. Pravidlá `.onas .year` sú rovnaké ako v 4b2646bf.
- Dotykové ciele < 44 px sú odkazy v hlavičke pri ≤ 768 px. Patria k zf a z2 (mikroanimácie a dotyk).

**build.py:** výstup je v `prac/build.log` (`stránok v sitemap.xml: 74`, `kontrola úvodu: OK`, `stránok: 76`).

## 9. Text → FAKTY.md (Z1-07)

Tabuľku zostavil predchodca pri fe0243ee (`prac/zapis-fakty.md`). Texty úvodnej stránky sa odvtedy nezmenili: commity
0cfbc952 až 2387fc1a menia v `index.html` len RoofLITE (0cfbc952) a skript v `<head>`. Výrok o personáli som overil:
PW:2720 „Majiteľ spolu s personálom majú dlhoročné skúsenosti“, PW:2721 „Zaškolený personál“. Doprava: PW:31
„doprava Avia 3,5t a Iveco s mech.rukou 8t“, PW:2736 „…čím sa znižuje riziko poškodenia…“, hodiny PW:1948–1949.


Zdroj výpisu: `prac/texty/vypis-index.txt` (`diagnoza/texty/nastroje/vypis.py` nad `index.html`). ID sú časti a riadky
`diagnoza/texty/FAKTY.md` (A firma, B služby, C zľavy, D1 cenník 28. 1. 2026, D2 akcie pôvodného webu, E novinky,
F sortiment) so zdrojom `PW:N` (pôvodný web) alebo `PDF s.N`. „Ovládanie“ = text tlačidla alebo odkazu bez tvrdenia.

**Úvod (sekcia `.uv`)**

| reťazec | FAKTY.md | poznámka |
|---|---|---|
| title a og:title „Stavebniny Richtárik Nitra – stavebný materiál a doprava“ | A Značka (PW:2720), A Adresa, B doprava (PW:9) | vzor STYL §11 |
| meta description (bez zmeny) „Stavebný materiál v celom sortimente vo výhodných cenách. Rodinné stavebniny v Nitre, Horné Krškany, doprava po celom Slovensku, cenová ponuka zadarmo.“ | B Predaj v celom sortimente (PW:27), A Systém zliav – výhodné ceny (PW:9), A Založenie – rodinná firma (PW:2720), B Doprava (PW:9), B ponuky zadarmo (PW:2722) | |
| og:image:alt „Dvor Stavebnín Richtárik v Nitre plný materiálu na paletách“ | F Zásoby na fotkách („dvor plný materiálu“ povolené) | fotka `u4` |
| alt „Dvor Stavebnín Richtárik v Nitre: vysoké stohy tvárnic na paletách pod modrou oblohou“ | F Zásoby na fotkách | opis fotky (otvorená `prac/dvor-p-t.jpg`) |
| figcaption „Skutočná fotka nášho dvora v Nitre“ | F Zásoby na fotkách (fotky dvora od majiteľa), `img/FOTKY.md` | pôvod `u4` potvrdia originály (riziko R3) |
| štítok „Náš dvor · Novozámocká 62/68, Nitra“ | A Adresa (PW:1938–1939) | |
| „Prehrať úvod“ | ovládanie | |
| H1 „Stavebniny Nitra – Horné Krškany“ | A Adresa (Nitra – Horné Krškany), A Značka (Stavebniny) | VYBER 5.5 |
| H1 „Dvor plný materiálu. Od základov po strechu.“ | F (formulácia „dvor plný materiálu“ povolená), F 15 kategórií od murovacieho materiálu po strešné krytiny | STYL §4, P1 |
| „Rodinná firma od roku 1997“ | A Založenie (PW:2720) | |
| „Novozámocká 62/68“ | A Adresa | |
| „Po – Pi 7:00 – 16:00“, „So 7:00 – 12:00“ | A Otváracie hodiny (PW:1947–1949) | bez „otvorené“, nedeľa sa neuvádza |
| „Spotrebu spočítame a cenovú ponuku pripravíme zadarmo.“ | B Bezplatný výpočet spotreby (PW:28), B ponuky zadarmo (PW:2722, PW:9) | |
| „Dovezieme vlastnými autami po celom Slovensku, aj autom s mechanickou rukou.“ | B Doprava vlastnou nákladnou dopravou… celého Slovenska (PW:9), B Autá: Avia 3,5 t a 8 t s mechanickou rukou (PW:31) | ruka v jednotnom čísle, bez značky auta |
| „Zavolať 0905 622 223“ | A Mobil (PW:1942) | |
| „Poslať dopyt“ (mailto `info@…`, predmet Cenová ponuka) | A E-mail (PW:1944), B ponuky zadarmo | |
| „Prezrieť katalóg“, „Aktuálne akcie“ | ovládanie | |
| „Hľadať v katalógu“, „Hľadajte: cement, Ytong, škridla…“ | F Sypké zmesi (cement), F Murovací materiál (Ytong), F Strešné krytiny (škridly) | |
| záber „Tehly · TermoBRIK“ | F Murovací materiál (Pezinské tehelne), D1 Pezinská tehla TermoBRIK (PDF s.1) | fotka `zasoba-tehly` |
| záber „Pórobetón · Porfix“ | F Murovací materiál (Porfix) | neupravená fotka `zasoba-porfix` |
| záber „Dlažby a obrubníky · Stadreko“ | F Dlažby a ploty (Stadreko) | |
| záber „Stavebné rezivo · priamo na sklade“ | F Stavebné rezivo priamo na sklade (PW:956) | |

**Pod úvodom (zmenené reťazce)**

| reťazec | FAKTY.md |
|---|---|
| „Skutočné fotografie“ · „Na našom dvore v Nitre“ · „Tehly TermoBRIK, pórobetón Porfix, betónové prvky Stadreko a stavebné rezivo. Fotografie sú z nášho dvora v Horných Krškanoch.“ · „Prezrieť katalóg“ | F Zásoby na fotkách, F značky, A Adresa (STYL P3) |
| „Dlažby a obrubníky Stadreko“ (štítok pásu) | F Dlažby a ploty |
| „1997 rodinná firma v Nitre“ | A Založenie (PW:2720) |
| „5 % ďalšia zľava z akciových cien pri platbe v hotovosti so zákazníckou kartou“, „3,3 % … pri platbe kartou“ | C (PW:6, PW:8, PDF s.1); znenie zmyslu nezmenené (❓ H-3) |
| „40+ značiek v 15 kategóriách“ | F (46 kariet značiek, 15 kategórií) |
| „Značky v našej ponuke“ a alt 27 lôg (Cemmac, Calmit, Baumit, Porfix, Ytong, Knauf Insulation, Isover, Schiedel, Velux, Fakro, Tondach, Blachotrapez, Onduline, Icopal, Holcim, Xella, KM Beta, Murexin, Raven, Masonite, Slovakia Trend, Transform Recykling, Masterplast, Chemolak, Elastik, Mediterran, Premac) | F značky; názov podľa loga (otvorené `prac/loga.png`), tvar podľa STYL §7; Xella je logo na stránke Ytong pôvodného webu |
| „Stavebný materiál od základov po strechu“ · „15 kategórií a viac ako 40 značiek popredných slovenských aj svetových výrobcov. Vyberte kategóriu a spotrebu vám spočítame zadarmo.“ | F, A Výrobcovia (PW:9), B výpočet spotreby (PW:28) (STYL P4) |
| „Velux, Fakro, RoofLITE“ | F Strešné okná, STYL §7 |
| „Doprava“ · „Dovezieme na miesto, ktoré určíte“ · „Vlastnými autami po celom Slovensku, aj autom s mechanickou rukou. Tovar dovezieme priamo na stavbu, bez zbytočného prekladania, čím sa znižuje riziko poškodenia.“ · „Doprava a služby“ | B Doprava (PW:9), B Autá (PW:31), B Tovar priamo k vám… riziko poškodenia (PW:2736) |
| „Akciová cena“ (štítok 3×) | STYL §2 (nahrádza „super ceny“ zdroja D2) |
| TermoBRIK „Brúsené tehly TermoBRIK, systém Dry, lepidlo zdarma. Na váš dom pripravíme individuálnu cenovú ponuku a pokúsime sa o čo najlepšiu cenu. Doprava až na stavbu zdarma, vykládka za poplatok.“ | D1 Pezinská tehla (PDF s.1), D2 (PW:40–43) (STYL P9) |
| Komín „Certifikovaný komínový systém priamo na sklade, odber ihneď. Napríklad kompletný komín 6 m, ø 160/90 za 618 € s DPH.“ | D1 Komín Stadreko (PDF s.1: „6m … ø160/90 – 618,- €“, „Ceny sú s DPH“, „certifikovaný“), D2 na sklade, odber ihneď (PW:46) |
| Dlažby a ploty „… obrubníky a komíny za akciové ceny.“ | D2 Stadreko (akcia), STYL §2 |
| Rezivo „Dosky, hranoly, strešné laty, foršne, tatranský obklad, palivové drevo a krovy na mieru za akciové ceny.“ | D2 Stavebné rezivo (PW:62–63) |
| „Zákaznícka karta“ · „Ďalšia zľava aj z akciových cien“ · „So zákazníckou kartou získate … 5 % pri platbe v hotovosti, 3,3 % pri platbe kartou. Stavebným firmám, živnostníkom a predajniam stavebnín poskytujeme špeciálne zľavy.“ · „Pre kartu si príďte do našej predajne na Novozámockej ulici v Nitre.“ | C (PW:6–8, PDF s.1), A Pozvanie do predajne (PW:4) (STYL P6) |
| „Od výberu materiálu po dopravu na stavbu. Poradíme vám s výberom, spotrebu spočítame a cenovú ponuku pripravíme zadarmo.“ | B poradenstvo (PW:29), výpočet (PW:28), ponuky (PW:2722) (STYL P7) |
| alt „Palety tvárnic a betónové tvárnice na dvore Stavebnín Richtárik v Nitre“ · „Náš dvor v Horných Krškanoch. Odtiaľ materiál dovezieme na stavbu.“ | F Zásoby na fotkách, A Adresa, B Doprava na miesto stavby (PW:9) |
| „Avia 3,5 t a Iveco 8 t s mechanickou rukou. Materiál dovezieme na miesto stavby, ktoré určíte.“ | B Autá (PW:31; Iveco ostáva, ❓ H-2), B Doprava (PW:9) |
| „Prineste projekt alebo rozmery a cenovú ponuku vám pripravíme zadarmo.“ | B ponuky zadarmo (PW:2722) |
| „Bezplatne spočítame, koľko tehál, izolácie, krytiny či omietky na stavbu potrebujete.“ | B výpočet spotreby (PW:28) |
| „Zaškolený personál s dlhoročnými skúsenosťami vám pomôže vybrať vhodný materiál.“ | A Personál (PW:2721), A Ľudia (PW:2720) |
| „Pri väčšom odbere poskytujeme množstevné zľavy, stavebným firmám, živnostníkom a predajniam stavebnín špeciálne zľavy.“ | B množstevné zľavy (PW:30), C špeciálne zľavy (PW:7) |
| „V predajni môžete platiť kartou cez terminál VÚB banky a stavebný materiál kúpiť aj na splátky cez Quatro.“ | B VÚB (PW:32, PW:2735), B Quatro (PW:9, PW:2734) |
| „Novinky v sortimente“ · „Nové materiály v našej ponuke.“ · „Šalovacie diely, tvárnice a betónové prvky za akciové ceny.“ | E Novinky (PJ:novinky__*), E Betónové výrobky |
| „Rodinná firma od roku 1997“ · „Poradenstvo a cenové ponuky sú u nás zadarmo. Najdôležitejšia je pre nás vaša spokojnosť.“ | A Založenie (PW:2720), B (PW:2722), A Hodnota (PW:2722) (STYL P8) |
| „Zavolajte, poradíme vám“ · „Po – Pi 7:00 – 16:00“ · „Sobota 7:00 – 12:00“ · „Novozámocká 62/68, 949 05 Nitra – Horné Krškany.“ | A Mobil, A Otváracie hodiny, A Adresa (I-05 opravené) |
| „Pošlite nám projekt alebo zoznam materiálu“ · „Spočítame spotrebu, pripravíme cenovú ponuku zadarmo a dohodneme dopravu na stavbu.“ | B výpočet (PW:28), ponuky (PW:2722), doprava (PW:9) (STYL P10) |

Neznámy riadok: **žiadny**. Bez zmeny ostali karty kategórií (popisy z `build.py`), karty noviniek okrem betónových výrobkov,
karta Blachotrapez a Fakro (D2) a päta.

## 10. Riziká a body pre majiteľa a ďalších zapisovateľov

### R1. Slow 4G: fotka dvora prichádza neskôr ako dnes

LCP je 3,0 s proti 2,1 s pri dnešnom webe. Je to cena za ostrú fotku na telefóne s DPR 3: 1 448 px a 208 kB proti
neostrej 960 px a 134 kB. Text, telefón aj hľadanie sú pritom použiteľné o 0,7 s skôr ako dnes. Možnosti:
- (a) **Medziveľkosť `dvor-t-1290`.** Pri 390@3 by mala pomer 0,91, teda bez zväčšenia, a ušetrí asi 40 kB.
  Kóduje sa z `u4-t-1448` v stave `44aa237b^` a vizuálne sa porovná.
- (b) **Originály fotiek od majiteľa** a nové kódovanie AVIF.
- (c) **Kompresia na hostingu.** `site.css` má bez kompresie 89 kB, s gzip len časť z toho. Lokálny server nekomprimuje,
  takže na hostingu bude LCP pri pomalej sieti lepšie u oboch variantov. Súvisí s otvorenou otázkou hosting a HTTPS.

### R2. Ostrosť na veľkých displejoch

Hodnoty nad 1,0 (časť 6):

| okno | pomer |
|---|---|
| 1920@1 | 1,12 |
| retina 1440@2 | 1,67 |
| 430@3, nájazd záberu | do 1,15 |

Väčšie zdroje nemáme, originály sa stratili. Riešenie sú originály od majiteľa. Na počítači 1440@1 a telefóne 390@3
je obraz bez zväčšenia.

### R3. Pôvod fotky u4

Pôvod `u4` (hlavný obraz a og) potvrdia až originály od majiteľa. V repozitári je fotka od `bb6bbaeb`, je to skutočný
dvor a na výreze nie je auto.

### R4. Meranie na zdieľanom stroji

Súbežne bežali iné úlohy, napríklad z3 s vlastným A/B. Kritérium Z1-10 je splnené v sérii `meranie-ab3`. V sérii
`meranie-ab2` bola raz snímka 83 ms a v sérii bez zahriatia aj 1 467 ms (studený štart prehliadača). Odporúčam pred
nasadením zopakovať `nastroje/ab-z1c.sh` (alebo `ab-z1b.sh`) na tichom stroji.

### R5. Otvorené otázky majiteľa ostávajú bez zmeny

- staré akcie bez dátumu,
- LIAZ alebo Iveco (riadok služieb na úvode `index.html:100` ostáva „Avia 3,5 t a Iveco 8 t“),
- znenie zľavy 5 % / 3,3 %,
- Nero Ebono alebo Ebano,
- hosting a HTTPS.

### R6. Pre zf

- `@media (scripting:enabled)` drift pásu Doprava je len dočasný krok. ZF-03 ho má podľa plánu zrušiť úplne.
- Trieda `uv-pocka` platí len pre `.zas img`. Pri zavádzaní `content-visibility` treba overiť, či pás stále čaká
  na fotku dvora (`nastroje/pocka-z1.mjs`, `siet-z1.mjs`).
- `prehliadka.mjs` hlási malé dotykové ciele v hlavičke pri ≤ 768 px. Tieto ciele treba zväčšiť pri mikroanimáciách.

### R7. Pre majiteľa: podpisové riadky v commitoch

Tri moje commity majú riadky `Co-Authored-By` a `Claude-Session`, ktoré vyžaduje táto relácia (časť 1).

## 11. Nástroje a výstupy

**Nástroje** (`nastroje/`):
- `prehliadka-z1b.mjs` – A/B/C so zahriatím a vyťažením CPU,
- `ab-z1b.sh`, `ab-z1c.sh` – série A/B a A/B/C,
- `suhrn-z1b.py` – súhrn meraní,
- `siet-z1.mjs` – poradie a časy požiadaviek pri obmedzenej sieti,
- `stopa-z1.mjs` – stopa hlavného vlákna,
- `pocka-z1.mjs` – čakanie pásu na fotku dvora,
- `stop-pred-z1.mjs` – prerušenie pred štartom strihu,
- `kontroly-z1.sh` – snímky, statika, posun, rozloženie, písmo, ostrosť, video, jas a hárky,
- opravené `jas_video.py` a `uvod_harok.py`,
- prevzaté od predchodcu `rozlozenie-z1.mjs`, `pismo-z1.mjs`, `ostrost.mjs`, `video-z1.mjs`, `iframe-z1.mjs`.

**Merania:**

| priečinok | čo obsahuje |
|---|---|
| `vychodisko/` | Z1-01, záťaž v logu |
| `meranie-ab-head/` | HEAD 0cfbc952, bez zahriatia |
| `meranie-ab2/` | po oprave 2a |
| `meranie-ab3/` | konečné A/B/C |
| `stopa/` | stopy hlavného vlákna |

**Kontroly** (`kontroly/`):
- `prehliadka/` – snímky v čase, statika a posun,
- `staticke2/` – bez JS a pri „obmedziť pohyb“ po 3af5e799,
- `rozlozenie/`, `pismo/`, `ostrost.jsonl`, `pocka.log`, `iframe.txt`, `texty/`,
- `prehliadka-vsetky/` – všetky stránky,
- `video/` – webm, mp4, snímky, jas a hárky,
- `harok-snimky-tel.jpg`, `harok-snimky-pc.jpg`.

**Hárky:**
- `uvod-harok.jpg` – kontaktný hárok úvodu telefón a počítač, 0–5 s s jasom,
- `harok-fotky-upravena-vratena.jpg` – pôvodná a dnešná fotka,
- `prac/og-pravy-okraj-head.jpg` – pravý okraj og obrázka,
- `prac/band-harok*.jpg` – pás Doprava s JS a bez JS.

**Funkčné testy:** `funkcie-z1/funkcie.json`.
