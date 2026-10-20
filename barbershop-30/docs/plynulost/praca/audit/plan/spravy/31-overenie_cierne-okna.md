## Overenie auditu „čierne okná“ (BARBERSHOP 30), 20. 10. 2026

### Metodika
- Repozitár `hs2` je na vetve barbershop-plynulost, HEAD bcd487e. Kód webu sa od auditu nezmenil a nič som v ňom neupravoval. Server bežal na `python3 -m http.server 8359`, teda port 8100 + 7×37, a už je zastavený.
- Všetky výstupy sú v `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit/overenie-cierne-okna/` (ďalej `B/`). Nahrávky sú v `B/runs/<meno>/` (meta.json, log.json, over*.json, kluc*/). Dôkazy sú v `B/dokazy-v2/`.
- Nahrávač `over.mjs` a `over2.mjs` používa inú metódu ako audit:
  1. Pravdu o filme berie priamo z WebGL. Zachytáva volania clear a draw do obrazovky; stav „clear bez kreslenia“ znamená prázdne plátno.
  2. Stav záloh berie z DOM: aktuálna karta, `--so`, `is-shown`, `is-near`, `img.complete`.
  3. Screencast (JPEG) slúži na pixelovú kontrolu. Okno sa ráta, keď je ≥ 20 % plochy tmavé a jednofarebné dlhšie ako 150 ms; vynechané sú lišta, pásy s textom a otvorené menu.
  4. Sieť sa zaznamenáva cez CDP.
- Nová analýza `over2.py` rozpozná menu z pixelov, lebo screencast pri CPU 4× mešká za DOM až o 0,7 s.
- `casovac.js` meria časy fetch, createImageBitmap a texSubImage2D; `rozklad-v.py` z nich skladá rozklad čakania.
- `pruzina.py` simuluje pružinu filmu pri 60 Hz na skutočnej dráhe skrolu.
- `odhal-svih.mjs` meria skrytú plochu kariet tímu a krokov v každej snímke priamo v DOM.
- `nastroje/pata2.mjs` a `pata3.mjs` merajú geometriu pätičky.
- A/B skúšky: `ab-sync.js` prepne zálohy na decoding=sync, `ab-oprava-film-audit.js` je prototyp opravy z auditu.
- **Každé pixelové okno som si pozrel na snímke.** Falošné nálezy:
  - tmavé časti fotiek (horná časť fotky kávy, plocha 0,25–0,37),
  - otvorené menu,
  - oneskorenie screencastu.
- Obmedzenia kontajnera: WebGL beží cez SwiftShader, film má 2,2–6 snímok/s. Okná filmu sú preto v kontajneri dlhšie. Pre telefón uvádzam odhad z rozkladu a ako dolnú hranicu beriem pravdu z WebGL.
- Surové snímky screencastu (514 MB) som po vyhodnotení zmazal. Ostali kľúčové snímky a JSON. Žiadny súbor nemá viac ako 50 MB.

### Výsledok po nálezoch
| Nález | Verdikt | Hlavné vlastné meranie |
|---|---|---|
| CO-1 | **obstál**, kritická | prázdne plátno WebGL 325–8 321 ms na skok; na telefóne s grafikou podľa odhadu ≥ 0,3–0,6 s čierne a k tomu 450 ms nábeh zo šera z cache, 2–2,5 s pri prvej návšteve |
| CO-2 | **obstál**, vysoká | A/B: async 2–3 okná na beh (470–3 932 ms), sync 0 okien |
| CO-3 | **obstál, je horší**, vysoká | Slow 4G: cieľ Služieb prišiel 11,8 s po kliknutí, lebo súbežne sa sťahovalo päť záloh (1,6 MB) |
| CO-4 | **obstál jadrom**, vysoká; odporúčanie decoding=sync **vyvrátené** | telefón Fast 4G 1,0–2,5 s, Slow 4G 3,5 s, počítač Slow 4G 4,7 s tmy po prvom vykreslení; sync zhoršil prvý obraz z 0,8–0,95 s na 1,5–1,9 s |
| CO-5 | **obstál, príčina opravená**, vysoká | skoková vetva (\|T−S\| > 1,5) **sa spúšťa** aj pri bežnom švihu, aj pri 60 Hz (najviac 1,66–1,78 záberu) |
| CO-6 | **vyvrátený** | skrytá plocha ≥ 20 % najviac 17–87 ms pri švihu; pri pomalom ťahu najviac 16 % |
| CO-7 | **na telefóne vyvrátený**, na tablete a veľkom počítači **obstál**, nízka | prázdny pás 22–41 % okna (1920×1080, 1024×1366, 2560×1440), trvalo |

### Čo som vyvrátil alebo opravil a prečo
1. **CO-6 celý**
   - Meral som `odhal-svih.mjs`: telefón 390×844, DPR 3, CPU 4×, Fast 4G, cache aj prvá návšteva. Rátal som plochu `.team-card` a `.steps li` s opacity < 0,15 v každej snímke.
   - Rýchly švih: skrytá plocha ≥ 20 % len 17–87 ms (najviac 46–48 %).
   - Pomalé ťahy po 250 px rýchlosťou 1 200 px/s na čerstvej stránke: najviac 16 %.
   - Menu → Tím: najviac 3–16 %. Menu → Služby a švih cez cenník: 0 %.
   - Okamžitý skok (`odhal.mjs`): tím 36 %, pod 5 % už po 56 ms. Kroky 25 % asi 230 ms, ale je to textový zoznam s viditeľným nadpisom, nie miesto obrazu.
   - Okná z auditu (733 ms v dôkaze 15, 6 188 ms v p-on-f4-warm-menu) sa časovo kryjú s oknami CO-2 (záloha karty nevykreslená), so spomalením SwiftShaderom a s oneskorením screencastu.
   - Prvé meranie pomalého ťahu (53 % 2 s) bolo moja chyba metódy: odobral som is-in kartám, ktoré už IntersectionObserver nesleduje. Opravil som ho na čerstvú stránku.
2. **CO-7 na telefóne**
   - Pri skoku menu → Kontakt je `footerIn` pri y 13 145 nepravdivé (pätička začína na 15 492).
   - Na telefóne je pás kontaktu (1 086 px) vyšší ako okno. Keď pätička vojde do okna, nie je vidieť žiadne miesto zálohy (`pata2`: 0 px pri 360–412 px aj 768×1024).
   - Okno 252 ms z auditu je iný jav alebo oneskorenie screencastu.
   - Skutočný problém je na tablete a veľkom počítači, pozri nález CO-7.
3. **CO-5: tvrdenie „nejde o skokovú vetvu“**
   - Každé čierne okno pri švihu začína presne vo chvíli skoku. Log ukazuje S 1,76 → 4,19 = T v čase 9 222 ms.
   - Simulácia pri 60 Hz na zaznamenanej dráhe (`pruzina.py`) dáva 2 skoky na beh v časoch 9 220 / 38 787 ms a 9 927 / 65 411 ms. Okná začínajú v 9 222 / 38 797 a 9 983 / 65 470 ms.
   - Na začiatku stránky sú kotvy na telefóne len 591 px od seba.
   - Časť CO-5 na počítači (okná F-RDY s pripraveným záberom, plocha 0,36) som neoveril. Pri asi 1 snímke/s v kontajneri ide pravdepodobne o falošné okná a nezaraďujem ju.
4. **CO-1: A/B prototypu `oprava-film.js` („3 okná → 0“) sa nezopakovalo**
   - S prototypom (r13) bolo menu → Služby stále 4 858 ms čierne.
   - Prázdne plátno WebGL spolu 28,1 s s prototypom proti 13,7 s bez neho (r14); rozdiel je v rámci šumu kontajnera.
   - Oprava musí zálohu najprv dekódovať (`img.decode()`) a držať ju, kým film cieľ naozaj nakreslí, nie len kým je ready.
5. **CO-2: súčty v matici auditu (37 okien, 22,5 s) sú nadhodnotené**
   - Obsahujú falošné okná: tmavá horná časť fotky kávy pri ploche 0,25–0,37 a otvorené menu (screencast mešká).
   - Jednotlivé okná s plochou ≥ 0,84 som overil.
6. **CO-4: odporúčanie decoding="sync" pre úvod je vyvrátené**
   - A/B r15, telefón, film vypnutý, Fast 4G, CPU 4×, dva behy pre každý variant.
   - Čas od `complete` po vykreslenie: async 821 a 954 ms, sync 1 537 a 1 908 ms.
   - Na počítači pri Fast 4G je medzera 3,4–3,9 s aj s vypnutým filmom (r11), teda ide o rastrovanie v kontajneri, nie o chybu stránky.
7. **CO-3 je horší, ako uvádza audit**
   - Pri skoku cez menu dostanú is-near všetky prechádzané karty a sťahujú sa súbežne s cieľom.
   - Žiadosť po skrytí karty (display none) sa nezruší.

### Odporúčané poradie opráv a odhad dopadu
1. **Film (CO-1, CO-5)**
   - Neposielať `held = null` pri švihu. Skokovú vetvu použiť len pre programový skok cez kotvu (príznak pri kliknutí alebo hashchange), alebo prah merať v čase či px namiesto záberov.
   - Kým cieľ nie je nakreslený, ukázať dekódovanú zálohu tej istej karty.
   - Cieľ začať načítavať hneď pri kliknutí, ešte pred skrolom.
   - Prednačítavať ±2 nezávisle od toho, či je aktuálny záber hotový. Uvoľňovať podľa poslednej doby použitia; úvod držať.
   - Dopad: odstráni 0,5–3 s tmy na každý skok a švih.
2. **Zálohy (CO-2)**
   - Pri is-near zavolať `img.decode()`. Predošlú kartu držať na `--so` 1, kým nová nemá is-ready.
   - Dopad podľa A/B: okná výmeny karty → 0.
3. **Sieť (CO-3, CO-4)**
   - Inline LQIP pod každou zálohou a pod úvodom.
   - `sizes` upraviť tak, aby pri DPR 3 vyšla verzia 1086 (rohožka 125 kB namiesto 438 kB).
   - Pri skoku nesťahovať prechádzané karty, alebo im dať nízku prioritu.
   - Cieľ prednačítať s vysokou prioritou.
4. **CO-7**: zálohy vypínať podľa horného okraja pásu kontaktu pod lištou, nie podľa pätičky.

### Spustenie meraní znova
1. V `hs2` spustiť `python3 -m http.server 8359`.
2. Potom spustiť:
   - `bash B/beh.sh <prípona>` – sada CO-1/2/3/4/5/7, film aj pokojná verzia,
   - `bash B/beh2.sh` – rozklad filmu, A/B sync, úvod,
   - `bash B/beh3.sh` – úvod na počítači, CO-6, rozbalenie,
   - `node B/odhal-svih.mjs --cache=warm|cold`,
   - `node B/nastroje/pata2.mjs` a `node B/nastroje/pata3.mjs`.
3. Analýza jednej nahrávky: `python3 B/over2.py B/runs/<meno>` a `python3 B/rozklad-v.py B/runs/<meno>`.