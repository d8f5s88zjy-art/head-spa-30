# Overenie auditu „vzhlad-zhoda“ (skeptický overovateľ)

## Metodika
- Repozitár: `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs2` je na vetve barbershop-plynulost, HEAD bcd487e. Repozitár som nemenil (`git status` je čistý). Server bežal cez `python3 -m http.server 8507` (8100 + 11×37) a web na /barbershop-30/.
- Ďalej píšem **$O** = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit/overenie-vzhlad-zhoda`. V priečinku bol nedokončený prvý beh tohto overenia z 19. 10. Jeho skripty som prečítal a skontroloval. Všetko som 20. 10. spustil znova vo vlastnom behu, výstupy sú v `$O/beh2/` (merania/, snimky/). Odovzdávanie zálohy filmu je v `$O/snimky/odovzdanie-*` (PNG z 20. 10.).
- Prostredie: Playwright Chromium, WebGL cez SwiftShader.
  - Telefón: 390×844, DPR 3, dotyk.
  - Počítač: 1440×900 a 1920×1080, DPR 1.
  - CPU bez spomalenia, lokálna sieť. Pri písme CPU 4× a siete Slow 4G (150 ms, 1,6 Mb/s) a Fast 4G (165 ms, 8,1 Mb/s).
- Metódy:
  - Pri VZ-02 sa po pridaní `world-in` všetky vzniknuté prechody CSS zmrazia (Web Animations API) a posúvajú sa ručne po 50–100 ms. Meranie preto nezávisí od rýchlosti softvérového kreslenia.
  - Ostrosť je šírka hrany σ v px displeja, čím menšia, tým ostrejšie (`sirka-hran.py`). Ďalej 1:1 výrezy a geometria podľa layout()/pickSize() z film.js (`rozlisenie-vypocet.py`).
  - Tmavosť je podiel okna s jasom < 20 z 255.
  - Kontrast sa meria pod samotnými písmenami (maska rozdielu medzi bielym a priehľadným textom).
- Kľúčové čísla z prvého behu som zopakoval a vyšli zhodne (deterministické merania).

## Verdikty
| nález | verdikt | závažnosť (audit → overenie) |
|---|---|---|
| VZ-01 videá na telefóne | platí, upravená príčina a oprava | vysoká → vysoká |
| VZ-02 tmavé bliknutie pri odovzdaní | platí | vysoká → vysoká |
| VZ-03 orezy na výšku | platí len pre Čakáreň a Kávu; Cestou von, tmavosť a „19–25 % šírky“ vyvrátené | vysoká → stredná |
| VZ-04 iné strihy na telefóne | **vyvrátený ako samostatná chyba** | stredná → – |
| VZ-05 text pred obrazom, pásmo bez nadpisu | platí | stredná |
| VZ-06 pásy, video tímu, linka | platí len chýbajúce video tímu v pokojnej verzii a mobilná linka; pásy vyvrátené | stredná → nízka |
| VZ-07 úvod na počítači tmavý, 1920 px | platí | stredná |
| VZ-08 plátno 2× na displeji 3× | platí; oprava cez presah je chybná | nízka |
| VZ-09 lišta prehliadača | platí (emulácia podvrhnutým innerHeight) | nízka |
| VZ-10 dvojexpozícia v pokojnej verzii | platí, zvýšené | nízka → stredná |
| VZ-11 kontrast úvodu | nadpis vyvrátený, platí len pre nadpisok | nízka |
| VZ-12 menu presvitá | platí | nízka |
| VZ-13 písmo 600/700 | platí, rozsah nadhodnotený (0,5 s, nie 1,5 s) | nízka |

## Merania a zistenia po nálezoch

**VZ-02 (platí).** Zmrazené prechody: plátno 0→1 za 1,2 s, záloha 1→0 za 0,7 s a body::after 0→1 za 0,7 s, všetky s krivkou cubic-bezier(0.65,0,0.35,1).

Telefón (`$O/beh2/merania/odovzdanie-jas-p390.txt`):

| čas | krytie | pás fotky | celé okno | podiel < 20 |
|---|---|---|---|---|
| 0 ms | – | 59,0 | – | – |
| 450 ms | 0,35 | 31,2 (53 %) | 62 % | 25 % (pred 10–15 %) |

Podiel tmavej plochy je nad 20 % asi od 400 do 500 ms, čo je na hrane kritéria čierneho okna.

Počítač: pás fotky klesne na 60 % v 450 ms. Snímky sú v `$O/beh2/snimky/odovzdanie-p390-harok.jpg` a `-d1440-harok.jpg`, pokles je viditeľný okom.

Nové zistenie: po dobehnutí je film o 13–14 % jasnejší než záloha (pás telefónu 59 → 67, počítača 43 → 49). Oprava preto musí zladiť aj jas a vinetáciu, inak namiesto bliknutia ostane rozjasnenie.

**VZ-01 (platí, upravené).**
- Zdroj: ffmpeg potvrdzuje video-1..3.mp4 576×1024, H.264 Baseline, 1,6 Mb/s. Sekvencie majú 720×1280, slučka tímu 864×1536, obe zväčšené lanczosom.
- Šírka hrany na telefóne (`$O/beh2/merania/sirka-hran.tsv`):

| karty telefónu | σ (px displeja) |
|---|---|
| video: Poď ďalej / Remeslo / Komu zveríš hlavu | 1,79 / 1,84 / 1,69 |
| fotky (medián) | 1,20 (rozsah 1,01–1,50) |

  Videá majú teda asi o 48 % širšie hrany. Výrezy 1:1 (`$O/beh2/snimky/ostrost-1to1-p390.png`) ukazujú rozmazané tváre a kompresiu.
- Geometria (`rozlisenie-vypocet.tsv`): sekvencia 0,43, natívne 0,35, slučka tímu 0,52 zdroja na px displeja, fotky telefónu 0,67.
- **Nepotvrdil som** tvrdenie „−47 % oproti počítaču pri rovnakom uhle“. V css px majú videá telefónu σ 0,56–0,61 a počítač 0,73–0,99. Pri bežnej vzdialenosti oka (css px telefónu je asi 1,3–1,5× väčší uhol) sú teda porovnateľné s počítačom. Chyba je mäkkosť voči ostatným kartám telefónu a kocky kompresie.
- Súvislosti, ktoré audit nespomenul:
  - Video na telefóne je rozhodnutie majiteľa z 2026‑10‑11 (TOUR_DIRECTION.md:146).
  - Majiteľ sa už sťažoval na ostrosť práve karty Remeslo (CHECKS.md §11). Ten istý zápis uvádza, že ostrejší obraz dá len originál 1080p/4K.
  - Hlavná oprava je preto získať originály. Náhradu fotkou robiť len so súhlasom majiteľa.

**VZ-03 (čiastočne).**
- Plné fotky s vyznačeným oknom telefónu (`$O/beh2/snimky/orezy-plne-fotky.jpg`) a porovnanie s počítačom (`orezy-pocitac-telefon.jpg`) potvrdzujú dve karty:
  - Čakáreň ukazuje pumpu a len okraj buldoga, kreslá sú mimo, hoci text ich menuje.
  - Káva má šálku odrezanú ľavým okrajom.
- Vyvrátené:
  - „Cestou von“: záber sa volá „Predná sála so sudom“ (film.py:38), sud s uterákmi je teda jeho predmet.
  - Tmavý spodok na telefóne je zámerná clona pod textom (style.css:1149) a zadanie zámerné tmavé plochy s textom povoľuje.
  - „19–25 % šírky“ je geometrická nutnosť okna 9:16 na fotke 3:2, nie chyba.
- Riziko presahu 1,12 na telefóne: fialová farba mazania (`presah-over.mjs --over=0.06`, `fialova.py`) na všetkých 8 strihoch telefónu pri mix 0 / 0,3 / 0,5 / 0,7 / 1 nedala 0 % odhalenej hrany. Jediný nález bola fialová orchidea a tá je rovnaká aj pri 0,12.
- Presah 1,12 však **nezvýši ostrosť**. Pri plátne 2× je ostrosť obmedzená plátnom (textúra / px plátna 1,18 → 1,31, stále 0,67 na px displeja). Získa sa len +11 % zorného poľa.

**VZ-04 (vyvrátený ako samostatná chyba).** `BS30_FILM.cuts` a kreslený strih pri mix 0,5 potvrdzujú, že telefón má „sala>stol prelinanie“ a „cakaren>sala-rano pohyb“, počítač pri oboch „popredie“. Napriek tomu:
- Prelínanie sala>stol je zámerné a zdokumentované: obe sekvencie sú jeden súvislý záber (CHECKS.md §11, film.js:189).
- Náhrada popredia pohybom je vedomá záložná vetva (film.js:1119-1120) a priamy dôsledok VZ-01, keďže video nemá hĺbku.
- Strih „pohyb“ používa telefón aj počítač aj inde (rohozka>sala).
- Telefónové verzie nie sú tmavšie: v polovici prechodu má počítač pri popredí 46 % a 39 % plochy s jasom < 20, telefón 16 % a 11 %.

Ak sa VZ-01 vyrieši fotkami, strihy sa zrovnajú zmazaním `m:prelinanie`. Samostatný nález netreba.

**VZ-05 (platí).** Skutočný ťah prstom (tempo-over.mjs, plátno DPR 0,25 kvôli rýchlosti, logika času nezmenená, 8–16 snímok/s, presnosť ±60–120 ms):

| ťah | nový text 50 % | obraz 50 % | rozdiel | nový nadpis nad starou miestnosťou |
|---|---|---|---|---|
| telefón, švih | 433 ms | 583 ms | 150 ms | 117 ms |
| telefón, stredný | 383 ms | 750 ms | 367 ms | 350 ms |
| telefón, pomalý | – | – | – | – |
| počítač, koliesko | – | – | 250 ms | 133 ms |

Pomalý ťah zastal na y = 845: oba nadpisy majú krytie 0 a obraz dobehol na novú miestnosť (0,94), čiže miestnosť ostala bez nadpisu.

Pásmo bez nadpisu po ustálení (pasma.mjs, krok 3 px):
- telefón: 814–880, 1414–1471, 2002–2059, 2598–2652 (54–66 px),
- počítač: 873–936, 1512–1569, 2136–2205, 2775–2850 (57–75 px).

**VZ-10 (platí, zvýšené na strednú).** Po 1 s pokoja v pokojnej verzii (`dvojexpozicia.log`):

| poloha | záloha karty (--so) | nadpis karty (--o) |
|---|---|---|
| telefón y 868 / 1458 / 2049 | sala 0,27 / stol 0,25 / cakaren 0,26 | 0,27 / 0,25 / 0,26 |
| počítač y 925 / 1555 | sala 0,26 / stol 0,26 | 0,26 / 0,26 |

Snímka: `$O/beh2/snimky/dvoj-harok.jpg`. Pásmo dvojexpozície je 45–54 px na každej hranici telefónu (asi 9 % dĺžky karty).

Závažnosť som zvýšil: stav trvá, kým sa návštevník nepohne, a týka sa všetkých zariadení bez filmu (bez WebGL2, šetrenie dát, pamäť pod 4 GB, obmedzenie pohybu, softvérová grafika) aj každej návštevy pred prvým pohybom.

**VZ-07 (platí).**
- Tmavosť: počítač má v pokojnej verzii 57 % (s textom) a 50 % (bez textu) okna s jasom < 20, vo filme 46 / 36 %. Pri 1920×1080 je to 54 / 51 % a 45 / 38 %. Telefón má 5–9 %. Snímka: `uvod-pocitac-telefon.jpg`.
- Rozlíšenie rohožky (zdroj na px displeja):

| rozmer okna | rohožka | ostatné zábery |
|---|---|---|
| 1920×1080 @1 | 0,77 | 1,0 |
| 1440×900 @2 | 0,52 | 0,78 |

  σ rohožky je 0,85 css px pri 1920 a 0,77 pri 1440.
- Telefón ukazuje inú, svetlú fotku (foto-40), takže úvod vyzerá na zariadeniach odlišne.
- V source/photos sú len fotky na výšku (1932×2576 alebo 1200×1600). Fotka rohožky na šírku vo vyššom rozlíšení v repozitári nie je.

**VZ-06 (čiastočne).** pasy-over na telefóne: `.team-video` je `display: none` a `.story-line` je `none`. Tím má v okne 1,58 z 10 položiek, galéria 1,3 z 8, recenzie 1,18 z 6.
- Platí:
  - V pokojnej verzii na telefóne video tímu nie je nikde.
  - Chýba vodorovná linka progresu, ktorú predpisuje ART_DIRECTION.md:95-96.
- Vyvrátené: pásy na posun prstom sú zámerné a zdokumentované prispôsobenie (style.css:1284-1287). Všetok obsah je dostupný a ďalšia položka vykukuje. Nejde o ochudobnenie.

**VZ-08 (platí).** Plátno má 780×1688 pri 390×844 @3 (zabery-p390-on.log, dpr 2), čo dáva 0,67 zdroja na px displeja.
- Ide o vedomý kompromis výkonu (film.js:316).
- Počítač @2 má tiež len 0,78, pretože CAP je 2896.
- Navrhovaný „+11 % presahom“ je chybný. Pomôže len vyššie DPR plátna: presah 1,12 a plátno 3× dajú 0,87.

**VZ-09 (platí).** Emulácia podvrhnutým `innerHeight` 844 ↔ 788 s udalosťou resize, CSS svh sa nemení (`lista.json`). Na dlhých kartách pri y − top 476–506 sa krytie nadpisu mení skokom o 0,15–1,0, napríklad z 0,001 na 1. Na skutočnom zariadení som to neoveril, vyžaduje Chrome Android alebo iOS.

**VZ-11 (čiastočne).** Kontrast pod samotnými písmenami (WCAG, bez tieňa):

| prvok | pokojná verzia p95 / p99 | film p95 / p99 | potrebné |
|---|---|---|---|
| nadpis (59 px) | 6,1 / 5,1 | 5,3 / 4,8 | 3:1 |
| nadpisok (12 px) | 4,1 / 3,4 | 3,2 / 2,5 | 4,5:1 |

Nadpis vyhovuje. Audit nameral 1,3–1,6 : 1, lebo meral celé pozadie obdĺžnika textu, nie miesta pod písmenami. Nadpisok je na hrane: 5–10 % jeho písmen je nad bielym obkladom a lampou pod 4,5:1. Halo tieň čitateľnosť drží.

**VZ-12 (platí).** Pozadie menu je `rgba(14,13,12,0.97)` bez backdrop-filter. Duch nadpisu „Komu zveríš hlavu?“ má p99 jasu 21,1 pri čistom pozadí 15,1. Snímka: `$O/beh2/snimky/menu-p390.png`. Je to kozmetické.

**VZ-13 (platí, rozsah opravený).** Telefón, CPU 4×:

| sieť | prvé vykreslenie (FCP) | Manrope 600/700 sa začne sťahovať | Manrope 700 použité | oneskorenie po FCP |
|---|---|---|---|---|
| Slow 4G | 1,92–2,00 s | 1,87–1,94 s (prednačítané písma 0,21 s) | 2,49–2,52 s | asi 0,5 s |
| Fast 4G | 0,75–0,78 s | – | 1,03–1,32 s | 0,25–0,55 s |

Váhy 600/700 sa objavia až pri prvom rozložení. Výmena písma je teda asi 0,5 s, nie 1,5 s, ako uvádza audit. Súbory majú len ~17 KB.

## Vedľajšie pozorovania mimo rozsahu (pre ďalšie audity)
1. Jazykový pás „This page is also in English“ (pri cudzom jazyku prehliadača) prekrýva tlačidlo Rezervovať v otvorenom menu telefónu a úvodnú kartu (`menu-p390.png`, `odovzdanie-p390-harok.jpg`).
2. Strih „popredie“ na počítači má v polovici prechodu 39–46 % okna s jasom < 20 (`strihy-harok.jpg`). Patrí to auditu čiernych okien.

## Odporúčané poradie opráv (dopad / riziko)
1. VZ-02: jeden riadok CSS, okamžitý viditeľný prínos na oboch zariadeniach, nízke riziko.
2. VZ-10 a VZ-05: spoločná príčina, app.js nedokončí stav v pokoji. Jedno dokončenie po 250–300 ms pokoja odstráni dvojexpozíciu aj miestnosť bez nadpisu.
3. VZ-03: film.py cakaren a kava, prípadne presah 1,12 na telefóne. Hrany sú overené, nič sa neodhalí.
4. VZ-01: vyžiadať originály videí od majiteľa.
5. VZ-07: výber alebo reframe fotky úvodu na počítači.
6. Zvyšok (nízke).