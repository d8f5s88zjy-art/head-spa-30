# Overenie auditu „čierne okná“ (BARBERSHOP 30) – skeptický overovateľ

Výstupy: `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit/overenie-cierne-okna/`. Repozitár som nemenil (`git status` je čistý). Server bežal na porte 8359, teraz je zastavený. Surové snímky (každý beh mal viac ako 50 MB) som po analýze zmazal. Ostali kľúčové snímky v `runs/*/kluc/`, výsledky v `runs/*/over.json` a vybrané dôkazy v `dokazy/`.

## Metodika (iná ako v audite)

Audit meral len pixely zo screencastu (rec.mjs + ana.py). Ja som použil vlastné nástroje a iné meradlá:

1. **Film – pravda priamo z WebGL** (`over.mjs`). Init skript zachytáva `clear`, `drawArrays`, `drawElements` a `bindFramebuffer`. Keď je posledná operácia do obrazovky (framebuffer null) `clear` bez kreslenia a súčasne platí `html.world-in`, plátno je jednofarebné #0e0d0c a zálohy sú skryté. Stav sa zapisuje v každej snímke rAF, inak každých 200 ms. Toto meradlo nezávisí od screencastu.
2. **Pokojná verzia – DOM a pixely.** V DOM zapisujem pre každú kartu is-near, is-shown, --so, `img.complete` a currentSrc. Pixely beriem z JPEG 90. Tmavá prázdna dlaždica je asi 10×10 CSS px s jasom pod 0,13 a rozpätím pod 0,045, mimo lišty, dosiek (.band, pätička) a otvoreného menu. Každé okno som skontroloval na snímke, lebo tmavé časti fotiek dávajú falošné nálezy s plochou 0,25 až 0,36.
3. **Sieť z CDP** (začiatok, koniec a cache každého obrázka) a A/B cez vložený skript, bez zmeny repozitára.
4. **Simulácia pružiny filmu pri 60 a 120 Hz** na skutočnej dráhe skrolu z nahrávky (`pruzina.py`). Overuje, či švih spustí skokovú vetvu aj na telefóne s grafikou.
5. **Rozbalenie AVIF mimo SwiftShaderu** (`dekod-cas.mjs`), geometria pätičky (`pata-geo.mjs`, `pata-shot.mjs`) a časovanie odhaľovania v stránke po snímkach (`odhal.mjs`).

**Dôležité metodické zistenie.** V kontajneri screencast mešká za hlavným vláknom:
- s filmom o 1,6 až 3,3 s (napr. DOM má y 15 591 v čase 22,8 s, screencast ukazuje túto polohu až v 26,1 s),
- v pokojnej verzii pri CPU 4× o 0,15 až 0,4 s.

Pixelové trvania okien vo filme z auditu (2 494, 5 072, 9 850, 7 806 ms) sú preto nafúknuté SwiftShaderom a nie sú to trvania na telefóne. Priradenie stavu DOM ku snímke („v čase okna má karta is-shown=1…“) je neisté o túto latenciu. A/B testy sú voči tomu odolné. Počas meraní bežal súbežne Chrome iného auditu (kod-stranka) na tých istých 4 jadrách, takže časy majú väčší rozptyl.

## Výsledky po nálezoch

| Nález | Verdikt | Moje meranie (kľúčové čísla) |
|---|---|---|
| CO-1 film, skok | **platí, kritická** | WebGL prázdne plátno: prvá návšteva Fast 4G CPU 1×: Služby 1 201 ms, Prehliadka 549 ms, pätička 480 ms, Späť hore 537 ms. Cache bez obmedzenia siete: 543 / 1 143 / 2 038 / 2 463 ms |
| CO-2 pokojná, odložené dekódovanie | **platí, vysoká** (príčina potvrdená iným A/B) | Švih s cache: 5 okien / 3 690 ms, najdlhšie 1 551 ms (plocha 0,88), opakovanie 534 a 1 518 ms. S `decoding="sync"` žiadne skutočné okno. Menu → Galéria s cache: 3 685 ms prázdna karta, so sync fotka |
| CO-3 pokojná, neskoré sťahovanie | **platí, vysoká**, horšie ako v audite; tvrdenie o `sizes` vyvrátené | Slow 4G: Služby tmavé od skoku až po ďalšie otvorenie menu (≥ 4 828 ms), cieľová fotka dorazila až 12 s po kliknutí (súbeh asi 1,8 MB). Tím 5 131 ms |
| CO-4 tmavý prvý obraz | **platí, vysoká**; „na počítači ani titulok“ sa nepotvrdilo | Telefón Fast 4G: +1 106 ms po FCP, Slow 4G: +3 238 ms. Počítač Slow 4G: +4 313 ms (s ?film=on +5 267 ms). S cache 370–506 ms (async) proti 182–218 ms (sync) |
| CO-5 film, švih | **platí, vysoká**; tvrdenie „nejde o skokovú vetvu“ vyvrátené | WebGL: prvá návšteva 1 368 a 2 761 ms, cache 834 a 1 053 ms. Pri 60 Hz \|T−S\| najviac 1,53–1,61, 2 až 4 skoky na jeden beh |
| CO-6 skryté karty tímu a kroky | **platí len pri švihu, stredná**; pri skoku pod prahom | Skok na tím: 0,36 okna skrytých len asi 100 ms. Kroky: 0,25 → 0,14 za 214 ms. Švih cez tím (CPU 4×): portréty chýbajú celý prechod (asi 400 ms na obraze, 1 350 ms v DOM) |
| CO-7 pätička vypne zálohy | **na telefóne vyvrátené (artefakt), platí na počítači 1920×1080, nízka** | Telefóny (SK aj EN): pás nad pätičkou je 1 004–1 109 px, teda vyšší ako okno, a nevidno nič. Počítač 1920×1080: 304 px (28 %) tmavý pás, ktorý trvá, kým je skrol v tomto rozsahu. 1440×900: 123 px (14 %) |

### CO-1 – podrobnosti a opravy príčiny
- Riadky z auditu som v kóde overil: film.js:1106 (`renderer.clear(); held = null`), :1243 (`held = null; dark = shown`), :1064 (nábeh 450 ms), :755–767 (keepAround drží ±1 a +2 v smere, úvod sa uvoľní), :462 a :1212 (pás 256 riadkov, `pump(4)`, aspoň jeden pás na snímku), style.css:498–501 a 1105–1108.
- **Nová príčina.** Pri plynulom skrole z menu (CSS smooth) film skočí na *medziľahlý* záber, len čo \|T−S\| prekročí 1,5. Ten záber sťahuje a nahráva zbytočne:
  - pri skoku na Služby sa stiahli cakaren-m, sala-rano-m a kreslo-stred-m vrátane hĺbok,
  - „Späť hore“ skončil čiernym oknom pri y 1 468 na zábere stol-video (S 2,56), nie až na úvode.
- **Odhad pre telefón s grafikou.** Rozbalenie AVIF 1448×2575 trvá mimo SwiftShaderu 44–51 ms pri CPU 1× a 56–68 ms pri CPU 4×; na ARM telefóne je to asi 0,1–0,25 s. K tomu nahratie 11 + 6 pásov po jednom na snímku (aspoň 0,28 s pri 60 Hz) a nábeh zo šera 450 ms.
  - Z cache: asi 0,4–0,6 s čiernej, potom 0,45 s rozsvietenie.
  - Prvá návšteva na Fast 4G: o 0,4–0,5 s viac (330 kB), pri súbehu aj viac.
  - Audit uviedol 2,0–2,3 s pre prvú návštevu; to platí skôr pre Slow 4G alebo súbeh s inými sťahovaniami.
- **A/B auditu `oprava-film.js` („→ 0“) je pre prvú návštevu nadhodnotené.** Záloha potrebuje to isté stiahnutie ako film. V kontajneri vyhrala len preto, že SwiftShader nahráva textúru pomaly. Bez LQIP a bez prednačítania cieľa pri kliknutí sa čierna na skutočnom telefóne len skráti, nezmizne.

### CO-5 – oprava príčiny
- Rozostup kotiev na telefóne v Prehliadke (y 1 093–2 936) je len 580–640 px, teda 0,7 okna. Švih rýchlosťou 5 000 px/s je asi 8 záberov/s.
- Kriticky tlmená pružina (ω0 = 6,5) má ustálené oneskorenie 2v/ω0, teda asi 2,5 záberu. Aj simulácia pri 60 aj 120 Hz na zaznamenanej dráhe prekročí 1,5 a spustí skokovú vetvu film.js:1243 (4 skoky pri prvej návšteve, 2 s cache).
- V kontajneri sú skoky ešte častejšie, lebo snímky sú riedke (film 5–6 snímok/s).
- Čierna teda nevzniká len nenačítaným záberom pri bežnom sledovaní pružiny, ako tvrdil audit. Vzniká aj skokom: `held = null`, cieľ bez textúry a vymazané plátno.

### CO-2 – nezávislé A/B
- Môj zásah je iný ako v audite: `decoding="sync"` na zálohách (`ab-sync.js`) namiesto `img.decode()`.
  - Švih: najväčšia tmavá plocha klesla z 0,88 na najviac 0,36. Zvyšky sú tmavé časti fotiek, overené na snímkach (skrinka pod stolom, šálka).
  - Menu → Galéria s cache: 3 685 ms prázdna karta (len nadpis „GALÉRIA“, `img.complete=1`) sa zmenila na hneď viditeľnú fotku (dokazy/co2-galeria-cache-async-prazdne.jpg proti co2-galeria-cache-sync-fotka.jpg).
- Overené riadky: style.css:1096–1100, app.js:196–198 a `decoding="async"` v index.html:162, 181, 215, 240, 264, 289, 483, 645, 763, 787.
- Okná trvajú stovky ms až sekundy, hoci rozbalenie trvá asi 60 ms. Pravdepodobne preto, že odložené dekódovanie sa prejaví až pri ďalšom commite. Pokojná stránka po doskrolovaní žiadny nerobí, takže okno môže trvať, kým sa niečo nezmení.

### CO-3 – spresnenie
- **Súbeh sťahovaní.** Pri skoku z úvodu na Služby (Slow 4G) išli súčasne:
  - cakaren-m-1448 (322 kB, 9,7–19,9 s),
  - sala-rano-m-1448 (357 kB, do 22,6 s),
  - kava-m (151 kB, do 17,1 s),
  - sud-m (437 kB, do 23,6 s),
  - 7 portrétov tímu (lazy, plynulý skrol okolo nich prešiel).
  - Cieľ kreslo-stred-m-1448 (322 kB) sa sťahoval od 9,97 s do 22,03 s.
- **Vyvrátené: `sizes` ako príčina.** Výrez -m s pomerom 0,5625 pokrytý (cover) do 390×844 je široký 475 CSS px, teda 1 424 px pri DPR 3. Súbor 1448 je preto pre ostrosť správny, nie chyba. Prechod na 1086 je len voliteľný kompromis pri šetrení dát.

### CO-4 – spresnenie
- **Telefón** (DPR 3, CPU 4×): rohozka-m-1448.avif (428 kB) sa na Slow 4G sťahovala 2,47–5,70 s. Dovtedy je vidieť tmavú dosku s titulkom (dokazy/co4-telefon-slow4g-prvy-obraz.jpg).
- **Počítač:** vstup-2172.avif sa stiahol v 4,76 s, ale vykreslil sa až asi v 7,1 s.
- **Vplyv `decoding="async"`:** aj s cache je tmavý prvý obraz 370–506 ms, so sync 182–218 ms.
- **Nepotvrdené:** „v prológu na počítači ani titulok“. V kontajneri s ?film=on je titulok viditeľný (rozmazane nabieha). Na počítači so skutočnou grafikou to overiť neviem.

### CO-6 – spresnenie
- `.reveal` majú len karty tímu (index.html:317–452) a `.js-steps .steps li`.
- Pri statickom skoku je to pod prahom: odhalenie začne do asi 100 ms.
- Platí pri rýchlom švihu, keď je hlavné vlákno zaťažené: callback IntersectionObserveru príde neskoro, k tomu rootMargin −12 % a prechod 560 ms. Portréty tímu (36 % okna) chýbali počas celého prechodu pásom (dokazy/co6-tim-portrety-skryte.jpg).
- Číslo z auditu 6 188 ms (s filmom) je artefakt SwiftShaderu.

### CO-7 – čiastočne vyvrátené
- Pásy sú nepriehľadné (`.band { background: var(--ink-2) }`, style.css:633–639). Na telefónoch je pás kontaktu vyšší ako okno, takže keď footerIn vypne zálohy, miesto zálohy už nie je v okne.
- Okno 252 ms z auditu vzniklo tým, že obraz v kontajneri mešká za hlavným vláknom. V mojom behu mal DOM y 15 416, kým obraz ukazoval y 12 925.
- Na počítači 1920×1080 je chyba skutočná a trvalá: fasáda naraz zmizne a ostane tmavý pás 28 % okna (dokazy/co7-1920x1080-pred.png a co7-1920x1080-po.png).

## Čo som vyvrátil alebo zmiernil a prečo
1. **CO-5: „nejde o skokovú vetvu“** je nepravda. Pri 60 Hz \|T−S\| dosiahne 1,53–1,61 a vetva film.js:1243 sa spustí.
2. **CO-3: `sizes` 93vw a výber 1448 ako príčina** nie je chyba. 1448 je pri DPR 3 potrebný pre ostrosť (1 424 px).
3. **CO-7 na telefóne** je artefakt latencie screencastu. Pás nad pätičkou je vyšší ako okno pri všetkých testovaných telefónoch aj v angličtine. Nález ostáva len pre počítač s veľkým oknom.
4. **CO-4: „v prológu na počítači ani titulok“** sa nepotvrdilo.
5. **CO-6 pri skoku z menu** je pod prahom (asi 100 ms). Platí len pri švihu. Číslo 6 188 ms je artefakt.
6. **CO-1 a CO-5: absolútne trvania z pixelov vo filme** (2 494 až 9 850 ms) sú nafúknuté SwiftShaderom a oneskoreným screencastom. Skutočný telefón: asi 0,4–0,6 s čiernej z cache a asi 1–2,5 s pri prvej návšteve (Fast až Slow 4G), plus 0,45 s nábeh zo šera.
7. **A/B `oprava-film.js` („→ 0“)** je pre prvú návštevu nadhodnotené. Na skutočnom telefóne záloha čaká na to isté stiahnutie, preto treba LQIP a prednačítanie.

Žiadny nález nevypadol celý. Všetkých 7 obstálo, s uvedenými úpravami rozsahu, príčiny a opravy.

## Odporúčané poradie opráv a odhad dopadu
1. **Film (CO-1, CO-5), spoločná príčina.**
   - Pri chýbajúcej textúre nemazať plátno, ale držať posledný obraz.
   - Počas plynulého skrolu neskákať na medziľahlé zábery a pri kliknutí na kotvu hneď načítať cieľ.
   - Úvod nikdy neuvoľniť.
   - LQIP alebo statická záloha s LQIP pod plátnom.
   - Dopad: zmizne celá čierna obrazovka pri každom skoku a rýchlom švihu na predvolenom telefóne s grafikou (0,4–2,5 s na udalosť).
2. **CO-2:** `img.decode()` pri is-near a predošlá karta drží --so 1, kým nová nie je dekódovaná. Dopad: zmiznú okná s plochou 0,88 (v A/B so sync 100 %).
3. **CO-4 a CO-3:**
   - Inline LQIP pre úvod a všetky karty.
   - Úvod bez `decoding="async"`.
   - Pri skoku z menu prednačítať cieľ s vysokou prioritou a obmedziť súbeh (medziľahlé karty, portréty).
   - Dopad: namiesto 1–4 s tmy je hneď náhľad; na Slow 4G sa cieľ stiahne asi o 10 s skôr.
4. **CO-6:** odhaľovať bez opacity 0 alebo s kladným rootMargin.
5. **CO-7:** zálohy vypnúť až keď nepriehľadné pásy pokryjú celé okno.

## Nástroje (spustiteľné pred aj po oprave)
`beh.sh` spustí celú sadu.
- `over.mjs` – nahrávač: WebGL pravda, DOM, sieť, screencast.
- `over.py` – analýza do `runs/<meno>/over.json` a `kluc/`.
- `pruzina.py` – simulácia pružiny pri 60 Hz.
- `dekod-cas.mjs` – čas rozbalenia AVIF.
- `odhal.mjs` – časovanie odhaľovania (CO-6).
- `pata-geo.mjs`, `pata-shot.mjs` – geometria pätičky a snímky (CO-7).
- `ab-sync.js` – A/B pre CO-2.

Akceptácia po oprave:
- WebGL meradlo `film prázdne plátno` = 0 okien > 150 ms vo všetkých behoch s filmom.
- V pokojnej verzii žiadne pixelové okno s plochou ≥ 0,5. Okná s plochou 0,25–0,36 treba overiť na snímke, lebo môžu byť tmavé časti fotiek.