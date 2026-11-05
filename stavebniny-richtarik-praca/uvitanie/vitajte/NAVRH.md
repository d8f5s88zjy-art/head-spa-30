# Uvítanie A „Vitajte na dvore“: návrh, prototyp a merania (Stavebniny Richtárik, 5. 11. 2026)

Rola: senior motion a web dizajn. Žiadosť majiteľa: „Aby si urobil nejaký pekný úvod na tú stránku, skôr ako zákazník bude
vidieť náš tovar, aby sme mali silný hook, čo ho privíta.“

- **Kópia:** `git archive richtarik-profi stavebniny-richtarik` z commitu **a9dd53d2** (`prototyp/COMMIT`) do
  `/dev/shm/uvitanie-vitajte/`. Prototyp je len v tejto kópii. Druhá kópia `zaklad/` slúži ako A (bez uvítania).
- **Do `hs-richtarik-obnova` som nič nezapísal.** Zmeny v jeho `git status` sú od iného zapisovateľa (zf).
  Vetva sa medzitým posunula na **13c073bc**. Ten commit mení len 3 riadky v `site.css`, nie `index.html` ani `site.js`.
  Vkladací skript `nastroje/vloz.py` sa na `index.html` z 13c073bc vloží bez chyby („ok 54587“) a kotva v `site.js`
  sa v ňom nachádza (`True`).
- **Servery** na portoch 9800 (A) a 9801 (B) som ukončil. Výpis „servery 9800–9809 ukončené“ (`pgrep` nič nenašiel).
- Kód je celý vlastný: CSS, WAAPI a 2,2 kB JS. Nepoužil som knižnicu ani CDN, nepribudol žiadny obrázok, video ani písmo.

## 0. Zhrnutie

- **Čo zákazník uvidí:** svetlý biely list. Na ňom sa objaví logo, červená pečiatka **„Rodinná firma · od roku 1997“**
  a veta **„Vitajte u nás na Novozámockej 62/68 v Nitre.“** Vtom zdola z drážky vyjde veľká veta **„Toto je náš dvor.“**
  Jej písmená sú **oknami do skutočnej fotky plného dvora**, a to tej istej, ktorú úvod aj tak načítava (LCP).
  **Bodka za vetou sa potom roztiahne na celý rám fotky.** Logo pritom dosadne do hlavičky a list sa prelne do papiera
  stránky. Dnešný úvod pokračuje bez strihu: nadpis „Dvor plný materiálu. Od základov po strechu.“ vyjde z drážky,
  kamera na fotke dosadne a o 0,6 s príde strih zásob.
- **Odovzdanie obrazu je doslova tá istá fotka.** Písmená nie sú kópia fotky, sú to otvory v liste (`mix-blend-mode:
  screen`: čierna ukáže to, čo je pod ňou, a biela ostane biela). Okno je čierny obdĺžnik, ktorý končí na `transform:
  none`, teda presne na hranách rámu. Kontrola jasu videa telefónu: v okne nie je žiadny skok ani blik (časť 6).
- **Čas do použiteľného úvodu** (H1, Zavolať a hľadanie sú viditeľné a kliknuteľné): telefón 4G **2,32 s** (medián
  zo 6 behov, rozsah 2,319 – 2,326 s), počítač **1,98 s** (medián z 5 behov). Cieľ ≤ 2,5 s je splnený.
- **LCP sa nezhoršil:** telefón 4G medián 1 086 ms (A 1 134 ms), počítač 240 ms (A 200 ms, rozdiel +40 ms, limit 150 ms).
  **CLS** je 0 na telefóne a 0,0004 na počítači v A aj B.
- **Snímky nad 50 ms počas uvítania:** na telefóne s CPU 4× je to **0** v časti od výjazdu hooku po odovzdanie
  (1,2 – 2,33 s, 6 behov) a na počítači **0** v celej sekvencii. Dlhé snímky pri načítaní (0,90 – 1,20 s) majú A aj B:
  A 6, B 8 v 6 behoch. Sú to `site.js`, dekódovanie fotiek a prvé rozloženie (časť 5c).
- **Bajty navyše:** 0 obrázkov, 0 písiem a 0 nových požiadaviek. `index.html` je o 10 783 B väčší (gzip **+4 176 B**)
  a `site.js` o 555 B (gzip +180 B). Logo uvítania je ten istý súbor `img/logo.png` ako v hlavičke.
- **Kedy sa uvítanie ukáže:** iba pri prvej návšteve úvodu v relácii (sessionStorage `vt-vitaj`) a iba keď zákazník
  neprišiel z inej stránky webu. Neukáže sa pri „obmedziť pohyb“, bez JS, pri šetrení dát, pri otvorení s kotvou ani
  pri predvykreslení. Vynechá sa aj na pomalom pripojení, keď by úvod čakal priveľa (na Slow 4G 0 z 3, časť 5b).
  Dá sa okamžite preskočiť ťuknutím, klikom, kolieskom, posunom aj klávesom. List zmizne za 170 ms (časť 7).
- **Poctivé hodnotenie (časť 8):** hook je silný a pravdivý a na počítači pôsobí ako práca dobrého štúdia. Má však
  tri slabiny. Na telefóne je hook celý čitateľný len asi 0,4 s, než sa začne otvárať okno. Dolná polovica telefónu je
  počas uvítania prázdna. Logo pri lete do hlavičky na 0,15 s prekríži fotku. A uvítanie posúva použiteľný úvod
  z 0,94 s na 2,32 s, čo je cena, ktorú si majiteľ vyžiadal.

## 1. Hook: tri znenia a výber

Pravidlá: STYL.md §1–2 a §8 (vykanie, vecný tón, bez superlatívov, výkričníkov, verzáliek v texte a „zadarmo“).
Fakty len z FAKTY.md.

| # | Hook (písmená = okná do fotky) | Uvítacia veta | Prečo áno | Prečo nie |
|---|---|---|---|---|
| **A (vybraté)** | **„Toto je náš dvor.“** | „Vitajte u nás na Novozámockej 62/68 v Nitre.“ + pečiatka „Rodinná firma · od roku 1997“ | Štyri krátke slová sa prečítajú za ~0,5 s. „Toto“ ukazuje priamo na to, čo je v písmenách, takže veta sa dokazuje v tej istej sekunde. Je to najkratšia veta, preto má najväčšie písmená (telefón 102 px, počítač 227 px) a v nich najviac fotky. Nič nesľubuje, nadväzuje na H1 „Dvor plný materiálu.“ a neopakuje ho. | Je tichá, nie predajná. Predajný argument nesie až H1 a lede úvodu. |
| B | „Pozrite sa na náš dvor.“ | rovnaká | Výzva sa zhoduje s pohybom (pozriete sa, okno sa otvorí). | Má 23 znakov, takže písmená vychádzajú o ~25 % menšie a na telefóne sa veta láme do troch riadkov. |
| C | „Vitajte na dvore.“ | „Rodinná firma z Nitry od roku 1997.“ | Spája pozdrav a hook a nadväzuje na pôvodné „Vítame Vás…“ (PW:4). | Zadanie chce najprv privítanie značkou a potom hook. Tu by pozdrav a hook boli jedna veta, takže uvítacia veta by ostala bez pozdravu. |

Zamietnuté: „Materiál vidíte skôr, než prídete.“ Tvrdí, že fotka zobrazuje súčasnú zásobu, a to FAKTY.md F zakazuje.

| Text | Zdroj faktu |
|---|---|
| Rodinná firma · od roku 1997 | FAKTY A „rodinná firma založená v roku 1997“ (PW:2720) |
| Vitajte u nás na Novozámockej 62/68 v Nitre. | FAKTY A, adresa Novozámocká 62/68, 949 05 Nitra (PW:1938) |
| Toto je náš dvor. | skutočná fotka dvora od majiteľa (img/FOTKY.md, výrez `u4`, bez auta) |

Kontrola textu (`nastroje` v časti 10, výstup): viditeľný text uvítania je „Rodinná firma od roku 1997 Vitajte u nás
na Novozámockej 62/68 v Nitre. Toto je náš dvor“. Výrazy `AI`, `!`, `najlep`, `najlacn`, `najv`, `zadarmo`, `hneď`,
`ihneď`, `Iveco`, `LIAZ` a `%` sa v ňom nevyskytujú (všetky `False`). `grep -cw AI index.html` vráti 0 v A aj B.
Nezlomiteľné medzery sú v „u nás“ a „v Nitre“ (STYL §6). Pečiatka je v HTML malými písmenami, verzálky robí len CSS
rovnako ako štítky webu.

## 2. Scenár po desatinách sekundy

Čas je od štartu navigácie. **Telefón** = 390×844, DPR 3, CPU 4×, „Fast 4G“, hodnoty sú zo značiek `performance.mark`
(medián 6 behov). **Počítač** = 1440×900. Všetky vstupy CSS bežia od prvého vykreslenia (F). Okno sa naplánuje
v prvej snímke (`requestAnimationFrame`) ako animácia WAAPI s oneskorením. Beží v kompozítore, takže ho zaneprázdnené
hlavné vlákno neposunie: okno sa otvorilo v **1 700 ms vo všetkých 6 behoch**.

| t (telefón) | t (počítač) | Obraz | Technika |
|---|---|---|---|
| 0,0 – 0,7 | 0,0 – 0,05 | biela (plátno `html.vt-ide` je biele, nie papier, aby nebol prechod papier → biela) | skript v `<head>` pridá `vt-ide` pred prvým vykreslením |
| 0,7 | 0,04 | – | riadiaci skript za úvodom (`vt-zaciatok`: 0,69 – 0,72 s, počítač 0,03 – 0,10 s). Ak by bežal až po 0,9 s, uvítanie vynechá. |
| **0,9 (F)** | **0,2 (F)** | logo vychádza 16 px zdola a z priehľadnosti (0,45 s) | `vt-hore`, `--krivka-vyjazd` |
| 1,0 | 0,3 | veta „Vitajte u nás…“ vychádza (od F + 0,08, 0,45 s) | `vt-hore` |
| 1,0 – 1,4 | 0,35 – 0,7 | **pečiatka „Rodinná firma · od roku 1997“ sa vrazí** (F + 0,15, 0,36 s, jeden prekmit), natočená −5° | `scale 1,45 → 1`, `--krivka-pecat` |
| 1,1 – 1,6 | 0,36 – 0,9 | **„Toto je“** vyjde z drážky (F + 0,16, 0,5 s). V písmenách je fotka dvora. | `translateY(135 % → 0)` v `overflow: clip`, sito `mix-blend-mode: screen` |
| 1,1 – 1,7 | 0,44 – 1,0 | **„náš dvor.“** vyjde z drážky (F + 0,24) | rovnako |
| 1,6 – 1,7 | 0,9 – 1,3 | celý hook stojí: biely list, logo, pečiatka, veta a „Toto je náš dvor.“ v písmenách z fotky | telefón ~0,1 s v pokoji plus čítanie počas výjazdu, počítač ~0,35 s (časť 8) |
| **1,7** | **1,28** | **bodka za „dvor“ sa začne rozťahovať na okno.** Pečiatka a veta odchádzajú 10 px dole (0,2 s). Logo letí do hlavičky. Pod listom sa pustí dnešný úvod: H1 z drážky, linka nadpisku, odznak. | WAAPI `transform` čierneho obdĺžnika z rozmeru bodky na `none` (= rám), `cubic-bezier(.65,0,.2,1)`. Telefón 0,44 s, počítač 0,5 s. |
| 1,8 | 1,4 | okno je pri bodke, písmená „dvor“ v ňom miznú, lebo všetko v okne je fotka | |
| 1,9 – 2,0 | 1,5 – 1,6 | okno zaberá polovicu až dve tretiny rámu, logo je nad fotkou na ceste hore | |
| 2,1 | 1,78 | **okno = celý rám fotky.** Logo stojí presne na logu hlavičky. | |
| 2,14 – 2,30 | 1,78 – 1,94 | biely list okolo rámu sa prelne do stránky (0,16 s): hlavička, H1 (už takmer vyšiel), lede, Zavolať, hľadanie | list má otvor nad rámom, takže fotka sa už nemení |
| **2,32** | **1,97** | **koniec:** list a sito dostanú `display: none` (dva prvky, žiadna zmena triedy na `<html>`). Úvod je použiteľný. Kamera na fotke začne dosadať (2,9 s). | `vt-koniec` |
| 2,9 – 5,3 | 2,6 – 5,0 | strih zásob ako dnes (tehly, pórobetón, dlažby, rezivo), 0,6 s po konci uvítania | `site.js` čaká na udalosť `vt-koniec` |
| 2,75 + 0,36 | 2,33 + 0,36 | štítok „Náš dvor · Novozámocká 62/68“ sa vrazí ako dnes (1,05 s po otvorení okna) | |

Na telefóne trvá uvítanie od prvej snímky po použiteľný úvod **1,4 s**, na počítači **1,75 s**. Bez kontroly času by
hook stál 1,25 s od prvej snímky. Na telefóne sa toto čakanie skráti, aby sa okno otvorilo najneskôr v 1,7 s.

## 3. Technika (súbory a prečo takto)

Zmenené súbory sú len dva: `index.html` (+10,8 kB, z toho veľkú časť tvoria slovenské komentáre) a `assets/site.js`
(+13 riadkov). Celý rozdiel je v `prototyp/vitajte.diff` (145 riadkov). Časti uvítania sú aj samostatne v
`prototyp/zdroj/` a skript `nastroje/vloz.py` ich vloží do ľubovoľného `index.html` cez štyri kotvy.

| Časť | Kde | Čo robí |
|---|---|---|
| `head.html` | v `<head>` za skriptom `uv-ide` | Malý skript rozhodne, či uvítanie bude (`vt-ide`): len pri `uv-ide` (bez obmedzenia pohybu), bez kotvy, bez `document.prerendering`, bez `saveData`, bez odkazovača z vlastného webu a bez `vt-vitaj` v sessionStorage. Výnimka zo sessionStorage (sandbox) uvítanie nezablokuje. K tomu `<style>` uvítania (index.html je jediná stránka, ktorá ho potrebuje, preto nie je v `site.css`). |
| `kryt.html` | hneď za `<body>` | Fixný list (`z-index: 1000`, `aria-hidden`, `hidden`) s logom, pečiatkou a vetou. Biela plocha listu sú dva pásy: nad rámom fotky a pod ním. Fotka teda ostáva pod otvorom a logo môže letieť nad ňou. |
| `sito.html` | v `.uv-ram` za `<picture>` | Biela vrstva s čiernym hookom a čiernou bodkou, `mix-blend-mode: screen`. `.uv-ram` má `isolation: isolate`, takže sa mieša len s fotkou dvora. Veľkosť písma je `min((min(100cqw, 1280px) − 2 · gutter) / 3,55, 44cqh)` (container query). Hook sa tak zmestí do rámu pri 320 px aj pri 2560 px. |
| `riadenie.html` | za `</section>` úvodu | Ako 1 – 3 vyššie. Čas sa počíta od prvej snímky, nie od štartu navigácie. Rozmery sa čítajú až v prvej snímke a premenné dostane len list, nie `<html>`. |
| `site.js` | strih zásob | Pri uvítaní strih počká na udalosť `vt-koniec` a začne 0,6 s po nej. Hranica „neskoro“ sa posunie o 2,6 s. |

Dôležité rozhodnutia:

1. **Biela, nie papier.** Papier #faf8f4 cez `screen` jemne presvital fotkou (svetlé balenia paliet vyšli ako biely
   tieň na papieri, snímky `harky/h-p1-390.jpg` a `harky/h-p1-1440.jpg`, prvá verzia). Biela cez `screen` je vždy biela. Do papiera stránky sa list prelne
   pri odovzdaní (rozdiel 2 %).
2. **Okno je bodka, nie písmeno.** Čierny obdĺžnik škálovaný `transform` je ostrý pri každej veľkosti, lebo je to
   plná farba a nemusí sa prekresľovať. Písmeno zväčšené 40× by sa rozmazalo. Bodka je zároveň typografický koniec
   vety: „bodka sa otvorí“.
3. **Kompozítor namiesto časovačov.** V prvej verzii posúval časovač na zaťaženom telefóne okno o 80 – 150 ms
   (koniec 2,51 – 2,58 s). Po prechode na WAAPI s oneskorením je okno vždy v 1 700 ms a koniec 2,32 s.
4. **Žiadna zmena triedy na `<html>` na konci.** Pôvodný koniec (`vt-hotovo` na `<html>`) prepočítal štýly celej
   stránky a vynútil rozloženie. LoAF ukázal snímku 59 ms („user-callback … vynútený layout 57 ms“). Teraz dostanú
   `display: none` len dva prvky a táto snímka zmizla (`mer/loaf2.jsonl`, `loaf3.jsonl`).
5. **Premenné rozmerov na liste, nie na `<html>`.** Nastavenie vlastnej vlastnosti na koreni prepočíta štýly všetkých
   prvkov (zdedené premenné).
6. **Dnešný úvod čaká a potom pokračuje.** Jeho oneskorené animácie (`uv-riadok`, `uv-linka`, `uv-pecat`, `vt-znak`)
   majú v CSS +3 s a skript ich posunie (`currentTime`) presne na otvorenie okna. Kamera (`uv-kamera`) sa posunie na
   koniec. Počas čakania držia počiatočný stav (`fill: both`), preto nevznikne žiadny skok. Okno kina z pásov papiera
   pri uvítaní nie je: jeho úlohu preberá okno z bodky.
7. **Poistka:** list aj sito majú CSS animáciu `visibility: hidden` v 3 s. Bez riadiaceho skriptu teda zmiznú samy
   a úvod sa pustí.

Princípy z rešerší (nič som neprevzal doslova): text ako okno do fotky (galérie R14, MDN `background-clip: text`;
tu je to riešené zmiešaním s fotkou úvodu, aby sa fotka nesťahovala dvakrát a odovzdanie bolo presné), slovo z
drážky (R1 Haven, bez modrej opony), poradie „upratať, hlavný ťah, detaily“ (POHYB.md §1.6). Rešerš varuje pred
**oponou pred obsahom** (Haven 2,4 s, Hays 1 s). Uvítanie je opona, ktorú si majiteľ výslovne želal. Preto je biele,
trvá najviac 1,4 – 1,75 s od prvej snímky, dá sa preskočiť a ukáže sa raz za reláciu.

## 4. Kontaktné hárky

Oba hárky som otvoril (Read).

- `harky/harok-telefon.jpg`: 16 snímok z videa telefónu (CPU 4×, Fast 4G), čas od navigácie 0,99 – 3,64 s.
- `harky/harok-pocitac.jpg`: 12 snímok z videa počítača, 0,35 – 3,60 s.
- `harky/h-overenia.jpg`: stav po ťuknutí (0,9 s + 250 ms), bez JS, „obmedziť pohyb“ a 2. návšteva.

## 5. Merania A/B

A = kópia a9dd53d2 bez uvítania, B = prototyp. Behy sa striedajú (A, B / B, A) a každý beh je nový kontext, teda
nová relácia. Vyrovnávacia pamäť je vypnutá. Sieť emuluje CDP podľa predvolieb DevTools: Fast 4G = 9 Mbit/s × 0,9,
latencia 165 ms. Slow 4G = 1,6 Mbit/s × 0,9, latencia 562,5 ms. Nástroj je `nastroje/meraj.mjs`, súhrn
`nastroje/suhrn.py`, surové dáta `mer/ab-*.jsonl`. **Stroj bol zaťažený inými úlohami** (záťaž 3,7 – 5,8 na 4 jadrách,
zapísaná pri každom behu), preto uvádzam mediány aj rozsahy.

„Použiteľný“ = prvá snímka (rAF), v ktorej oba riadky H1 vidno aspoň na 90 % a `elementFromPoint` v strede H1,
tlačidla Zavolať a poľa hľadania trafí ten prvok. Výsledok je vždy aspoň FCP.

### 5a. Telefón 390×844, DPR 3, CPU 4×, Fast 4G (6 + 6 behov, záťaž 4,9 – 5,8)

| | A (dnes) | B (uvítanie) |
|---|---|---|
| uvítanie sa ukázalo | – | 6 / 6 |
| FCP (medián) | 944 ms | 946 ms |
| LCP medián (rozsah) | 1 134 (1 024 – 1 240) ms, IMG | 1 086 (992 – 1 280) ms, IMG |
| CLS (max) | 0 | 0 |
| H1 použiteľný | 1 499 (1 444 – 1 550) ms | **2 321 (2 319 – 2 326) ms** |
| Zavolať použiteľné | 944 ms | **2 321 ms** |
| hľadanie použiteľné | 944 ms | **2 321 ms** |
| otvorenie okna / koniec | – | 1 700 / 2 316 – 2 335 ms |
| snímky > 50 ms (rAF) od FCP do 3,5 s | 6 (všetky v 0,97 – 1,20 s) | 8 (všetky v 0,90 – 1,19 s) |
| z toho v 1,2 – 2,33 s (výjazd hooku, okno, odovzdanie) | 0 | **0** |
| najdlhšia snímka | 217 ms | 167 ms |
| bajty za 6 s / požiadavky | 1 400 kB / 27 | 1 411 kB / 27 |

### 5b. Telefón, Slow 4G (3 + 3 behy, záťaž 2,5 – 3,6)

Riadiaci skript beží až po FCP okolo 2,9 s, teda po hranici 0,9 s, a **uvítanie sa vynechá (0 / 3)**. B je potom
zhodné s A: FCP 2 944 / 2 944 ms, LCP 3 340 / 3 344 ms, H1 3 491 / 3 502 ms, Zavolať 2 944 / 2 944 ms,
CLS 0,0001 / 0,0001, snímky > 50 ms 1 / 0. Pri pomalom pripojení sa teda úvod nepredĺži. Zákazník na pomalej sieti
však uvítanie neuvidí.

### 5c. Počítač 1440×900 (5 + 5 behov, záťaž 3,7 – 5,4)

| | A | B |
|---|---|---|
| uvítanie | – | 5 / 5 |
| FCP / LCP medián (rozsah LCP) | 200 / 200 (140 – 320) ms | 240 / 240 (224 – 384) ms |
| CLS (max) | 0,0004 | 0,0004 |
| H1 použiteľný | 727 (680 – 847) ms | **1 975 (1 928 – 2 155) ms** |
| Zavolať a hľadanie použiteľné | 200 ms | **1 975 ms** |
| otvorenie okna / koniec | – | 1 262 – 1 389 / 1 933 – 2 060 ms |
| snímky > 50 ms (rAF) od FCP do 3,5 s | 0 | **0** |
| bajty za 6 s / požiadavky | 2 138 kB / 54 | 2 152 kB / 55 |

Rozbor dlhých snímok na telefóne (`nastroje/loaf2.mjs`, `mer/loaf2.jsonl`, `loaf3.jsonl`, Long Animation Frames):
snímky pri načítaní sú v A aj B rovnakého pôvodu (`site.js` 49 – 83 ms, štýl a rozloženie prvej obrazovky).
Uvítanie má jednu vlastnú prácu: prvé rozloženie čítané v prvej snímke (96 – 119 ms vynúteného layoutu). Je to
však rozloženie, ktoré A robí v tej istej snímke v kroku vykreslenia (A: render 149 ms). Prebehne pred FCP.
Vo fáze okna mal B v 6 behoch občas snímku 54 – 105 ms **s nulovým blokovaním hlavného vlákna** a malým vykreslením
(3 – 6 ms). Ide o čakanie na kompozítor pri softvérovom vykresľovaní v headless Chromiu na zaťaženom stroji. A ich
v tom istom čase mal viac (strih zásob, napr. 2 167, 2 245, 2 427 ms). V poslednej sade (`ab-tel4g.jsonl`) ich
vo fáze okna nemal B ani raz.

**Bajty:** `nastroje/poziadavky.mjs`. Rozdiel `index.html` je 44 867 → 55 650 B (bez kompresie, python http.server
nekomprimuje). `gzip -9`: 11 055 → 15 231 B, teda **+4 176 B**. `site.js` gzip 8 491 → 8 671 B. Jedna požiadavka
navyše na počítači (`img/p/59.webp`) a na telefóne (`img/p/429.webp`) je lenivo načítaná fotka pod úvodom. Líši sa
podľa časovania behu a s uvítaním nesúvisí: v hlavnej sade telefónu bolo 27 / 27 požiadaviek.

## 6. Jas všetkých snímok

Videá sú nahrané v Playwright, 20 snímok/s. Jas = priemer sivej 0 – 255 na zmenšenej snímke, podiel tmavých px má
Y < 60 (`nastroje/jas.py`, výstupy `mer/jas-*.txt`).

| Video | Snímok | Uvítanie (biely list s hookom) | Prechod oknom | Minimum celého videa | Max. podiel tmavých px |
|---|---|---|---|---|---|
| telefón B | 127 | 240,5 – 255 | 238,7 → 195,7 | **173,3** (hotový úvod so strihom, 4,75 s) | 0,072 |
| telefón A | 126 | – | – | 173,5 | 0,071 |
| počítač B | 94 | 239,2 – 255 | 237,5 → 176,0 | **161,5** (hotový úvod) | 0,111 |

Žiadna snímka uvítania nie je tmavšia ako hotový úvod. Minimum B na telefóne (173,3) je rovnaké ako v A (173,5).
Čierna ani tmavá plocha sa nikde neobjaví: čierne časti sita sú vždy fotka (`screen`). Na telefóne v A sú pred FCP
štyri snímky papiera (jas 248). V B je plátno biele, takže pred uvítaním nie je skok papier → biela.

## 7. Overenia (`nastroje/overenia.mjs`, `overenia/overenia.json`, snímky v `overenia/`)

| Prípad | Výsledok |
|---|---|
| ťuk (telefón, 0,9 s) | list zmizol za **171 ms** (`vt-preskok` → `vt-koniec`), po 250 ms je Zavolať aj hľadanie kliknuteľné, 0 chýb. Snímku `overenia/preskok-tuk.jpg` som otvoril: H1 a celý úvod sú hotové. |
| klik (počítač) | 171 ms, Zavolať a hľadanie kliknuteľné, 0 chýb |
| koliesko | 171 ms, rovnako |
| kláves ↓ | 170 ms, rovnako |
| medzerník | 172 ms. Medzerník zároveň posunie stránku, preto je Zavolať mimo obrazovky (očakávané). |
| 2. návšteva v relácii (obnovenie) | trieda `uv-ide` bez `vt-ide`, žiadna značka `vt-zaciatok`, úvod ako dnes (`overenia/druha-navsteva.jpg`) |
| návrat na úvod z Kontaktu | bez uvítania |
| príchod z inej stránky webu (nová relácia, Katalóg → Úvod v menu) | bez uvítania, Zavolať kliknuteľné po 1,2 s |
| „obmedziť pohyb“ (`reducedMotion: reduce`) | žiadna trieda, list aj sito `display: none` (`overenia/obmedzit-pohyb.jpg`) |
| bez JS | list aj sito `display: none`, H1 viditeľný (`overenia/bez-js.jpg`, otvoril som ho) |
| kotva `index.html#obsah` | bez uvítania |
| šetrenie dát (`navigator.connection.saveData = true` cez init skript) | bez uvítania |
| iframe `sandbox="allow-scripts …"` bez `allow-same-origin` (ako náhľad) | sessionStorage hodí `SecurityError`, ten je zachytený a uvítanie prebehne (okno 1 315 ms, koniec 1 987 ms). 0 výnimiek JS. 18 chýb konzoly sú CORS písiem s pôvodom `null`. **Rovnakých 18 má aj A** (`nastroje/iframe-a.mjs`). Písmo je tam záložné, hook je v ňom čitateľný (`overenia/iframe-sandbox-0900.jpg`). |
| iframe s `allow-same-origin` | 0 chýb, uvítanie prebehne |
| čítačka (`ariaSnapshot`) | strom neobsahuje „Toto je“ ani „Vitajte u“ (uvítanie je `aria-hidden`). Prvý nadpis je H1 „Stavebniny Nitra – Horné Krškany Dvor plný materiálu. Od základov po strechu.“ (`overenia/citacka-strom.txt`). |
| SEO | obsah úvodu je v HTML od začiatku, H1, lede aj odkazy sú nezmenené. Uvítanie pridá len `aria-hidden` text a v HTML je za H1 iba sito (v ráme fotky). |

## 8. Poctivé zhodnotenie (po otvorení oboch hárkov a snímok)

**Sila hooku do 3 s: 4 z 5.** Je to skutočný moment „aha“: veta „Toto je náš dvor.“ je napísaná samotným dvorom
a vzápätí sa otvorí na celú fotku. Pravdivosť je stopercentná, nič sa netvrdí, iba ukazuje. Na počítači to funguje
najlepšie: písmená majú 227 px a hook stojí ~0,35 s v pokoji, plus čas výjazdu. Bod dole dávam za telefón. Pri 4G
s CPU 4× je hook celý viditeľný len ~0,1 s v pokoji a ~0,4 s od chvíle, keď sa dá prečítať, než sa začne otvárať
okno. Písmená majú 102 px a fotka v nich je z veľkej časti biela fólia paliet, takže kontrast písmen je stredný
(dá sa čítať, ale nie je to úder). Rozhoduje limit 2,5 s. Pri limite 3 s by mohol hook na telefóne stáť o 0,5 s dlhšie.

**Profesionálny dojem: 4 z 5.** Je to striedme a v značke (logo, tehlová červená, Barlow Condensed, papier) a je tu
jediný hlavný ťah. Pečiatka „od roku 1997“ pôsobí remeselne a nie lacno. Odovzdanie je čisté: okno končí presne
na ráme, logo presne na logu hlavičky a pri prechode nič neblikne. Slabiny, ktoré vidno na hárkoch:

1. **Telefón: dolná polovica je počas uvítania prázdna** (hárok telefónu, snímky 1,39 – 1,89 s). Hook je v ráme
   fotky hore a značka hneď pod ním, pod nimi zostáva ~45 % bielej. Možná oprava: dať pod značku krátky riadok
   „Po – Pi 7:00 – 16:00 · So 7:00 – 12:00“, ktorý je pravdivý (FAKTY A) a vyplní plochu.
2. **Let loga prekríži fotku** na ~0,15 s (hárok telefónu 1,99 – 2,09 s, počítač 1,55 s): tmavé logo nad tmavými
   paletami spolu so zvyškom písmen pôsobí na jednej snímke preplnene. Možnosť: na telefóne logo nelieta, ale
   ostane a prelne sa s logom hlavičky.
3. **Cena za uvítanie je čas.** Použiteľný úvod sa posunie na telefóne z 0,94 na 2,32 s a na počítači z 0,20 na
   1,98 s. Rešerš (galérie, „čo hook zabíja“) ukazuje, že opona pred obsahom škodí. Uvítanie to zmierňuje tým, že
   je biele, krátke, preskočiteľné jedným dotykom (171 ms) a ukáže sa raz za reláciu. Rozhodnutie, či to stojí za to,
   patrí majiteľovi.
4. **Slow 4G:** uvítanie sa neukáže vôbec. To je zámer (úvod nečaká), ale treba o tom vedieť.
5. Kontrast hooku na telefóne by zlepšil výrez fotky s viac tmavými stohmi v strednom pásme. Fotky som neupravoval
   ani neorezával (pravidlo), takže je to otázka pre ďalší výrez od majiteľa.

**Odporúčanie:** nasadiť A „Toto je náš dvor.“ v tejto podobe na počítač aj telefón a pred nasadením zapracovať
bod 1 (riadok hodín pod značkou, 10 min práce). Body 2 a 5 nechať na rozhodnutie po pozretí videí.

## 9. Videá

| Súbor | Čo | Dĺžka | Veľkosť |
|---|---|---|---|
| `video/vitajte-telefon.mp4` | B, telefón 390×844, CPU 4×, Fast 4G, od 0,64 s navigácie | 3,4 s | 214 kB |
| `video/vitajte-pocitac.mp4` | B, počítač 1440×900 (zmenšené na 1080 px), od štartu | 3,8 s | 406 kB |
| `video/dnes-bez-uvitania-telefon.mp4` | A pre porovnanie, telefón | 3,4 s | 242 kB |

Kontrolné snímky z MP4 (0,6 / 1,1 / 1,4 s telefón, 1,5 s počítač) som otvoril: hook, značka aj otváranie okna sú
v nich čitateľné.

## 10. Ako to spustiť a zopakovať

```
mkdir -p /dev/shm/x && git -C hs-richtarik-obnova archive richtarik-profi stavebniny-richtarik | tar -x -C /dev/shm/x
python3 -I uvitanie/vitajte/nastroje/vloz.py /dev/shm/x/stavebniny-richtarik/index.html uvitanie/vitajte/prototyp/zdroj
cp uvitanie/vitajte/prototyp/stavebniny-richtarik/assets/site.js /dev/shm/x/stavebniny-richtarik/assets/   # alebo patch z vitajte.diff
python3 -I -m http.server 9801 --bind 127.0.0.1 --directory /dev/shm/x/stavebniny-richtarik
```

Uvítanie sa znova ukáže v novej relácii, teda v novom okne alebo po `sessionStorage.removeItem('vt-vitaj')`.
Merania: `node nastroje/meraj.mjs tel4g|telslow|pc <behov> <out.jsonl>` (A na 9800, B na 9801), potom
`python3 -I nastroje/suhrn.py <out.jsonl>`. Overenia: `node nastroje/overenia.mjs <priečinok>`. Videá:
`node nastroje/video.mjs <url> <out.webm> tel|pc`. Jas: `python3.12 -I nastroje/jas.py <priečinok snímok>`.
Hárky: `python3.12 -I nastroje/harok.py`.

**Pri zlučovaní do vetvy:** sú to štyri vložené bloky v `index.html` (kotvy vo `vloz.py`) a jeden blok v `site.js`
(strih zásob). Komentáre v `<style>` a `<script>` uvítania sa dajú pri nasadení zmenšiť. Zmenší sa tým väčšina
z +4,2 kB gzip.
