# Meranie: Lighthouse, hlavné vlákno, váha a ostrosť

Zdroj: `barbershop-30/docs/CHECKS.md` (časti 4, 6, 8 až 13), JSON správy behov Lighthouse k časti 11
(8 behov telefónu, verzia 12.8.2), README HEAD SPA 30 (Rýchlosť a prístupnosť, Výkon na mobile, Film zo
skutočných fotiek), skripty `barbershop-30/source/tools/vaha.mjs`, `ostrost.mjs`, `ostrost.py`, `app-smoke.mjs`.

## Lighthouse

### Spustenie

`scripts/lighthouse.sh <adresa> [behy_telefon=5] [behy_pocitac=2] [priecinok=./lh]` spustí behy jeden po druhom
cez `npx lighthouse@12.8.2` (Chromium z `CHROME_PATH`, predvolene `/opt/pw-browsers/chromium` z Playwrightu),
kategórie výkon, prístupnosť, osvedčené postupy a SEO, počítač s `--preset=desktop`. Na konci zavolá
`scripts/lh-suhrn.mjs`, ktorý z JSON vypíše pre každý beh skóre, simulované aj pozorované FCP, LCP a Speed Index,
TBT, CLS a prvok LCP a pre každé zariadenie medián a najhorší beh.

Ladiace prepínače BARBERSHOP 30, ktoré sa pri meraní hodia: `?film=off` (pokojná verzia), `?uvod=off` (bez
prológu), `?film=on` (film aj pri softvérovom kreslení, len testy).

### Čo Lighthouse simuluje

Z `configSettings` v JSON (verzia 12.8.2):

| | telefón | počítač |
| --- | --- | --- |
| `throttlingMethod` | `simulate` | `simulate` |
| RTT | 150 ms | 40 ms |
| priepustnosť | 1 638,4 kb/s | 10 240 kb/s |
| spomalenie CPU | 4× | 1× |
| obrazovka | 412×823 @1,75 (moto g power 2022) | 1350×940 |

Simulácia (Lantern) nespomaľuje prehliadač počas behu (v Lighthouse 12.8.2 `core/lib/emulation.js`, funkcia
`throttle`, zapína sieť a CPU len pri `devtools`), ale z pozorovaného načítania prepočíta časy na pomalú sieť
a procesor. `--throttling-method=devtools` by spomaľoval naozaj (iné čísla, nemiešať s predvoleným).
V JSON sú obe sady v `audits.metrics.details.items[0]`: `firstContentfulPaint`, `largestContentfulPaint`,
`speedIndex` (simulované, z nich je skóre) a `observedFirstContentfulPaint`,
`observedLargestContentfulPaint`, `observedSpeedIndex` (čo sa naozaj stalo v laboratórnom prehliadači).

### Prečo rozptyl: pozorovaný prvý obraz

Behy BARBERSHOP 30 k CHECKS časti 11 (naživo, predvolená adresa, telefón):

| beh | výkon | FCP sim / poz | LCP sim | SI sim / poz | TBT |
| --- | --- | --- | --- | --- | --- |
| m6 | 99 | 1,23 / 0,63 s | 2,13 s | 1,81 / 0,81 s | 9 ms |
| m1 | 97 | 1,42 / 0,65 s | 2,33 s | 1,81 / 0,80 s | 133 ms |
| m2 | 97 | 1,38 / 1,49 s | 2,37 s | 3,08 / 1,62 s | 44 ms |
| m8 | 96 | 1,42 / 1,38 s | 2,33 s | 2,97 / 1,51 s | 115 ms |
| m5 | 94 | 1,37 / 2,49 s | 2,28 s | 4,47 / 2,61 s | 118 ms |
| m3 | 93 | 1,68 / 2,49 s | 2,50 s | 4,41 / 2,63 s | 92 ms |

Simulovaný Speed Index išiel s pozorovaným; behy pod 95 mali pozorovaný prvý obraz po 2,5 s pri podobnom TBT.
CHECKS to zapisuje: „Behy pod 95 majú prvý obraz v laboratórnom prehliadači (softvérové kreslenie) až po 2,5 s
pri rovnakom hlavnom vlákne ako rýchle behy; rovnaký rozptyl bol aj pred touto úpravou.“ Z toho:

- všetko, čo môže oddialiť prvé vykreslenie v laboratórnom prehliadači (WebGL kontext, veľký skript, čakanie
  na písmo či fotku), stojí body, aj keď simulované FCP vyzerá dobre;
- jeden beh nič nedokazuje; medián z 5 až 8 behov a najhorší beh áno.

### História meraní (čo zmenilo skóre)

| kedy (CHECKS) | telefón | počítač | čo sa zmenilo |
| --- | --- | --- | --- |
| 6 | `?film=off` 87 (LCP 2,8 s), `?uvod=off` 97 (LCP 2,4 s) | 99 (LCP 0,5 s) | súbežne bežali iné testy, rozptyl |
| 8 | `?uvod=off` 90 (LCP 3,3 s), `?film=off` 94 (LCP 3,1 s) | 100 | fotka úvodu na telefón 278 kB namiesto 132 kB |
| 9 | `?uvod=off` 100 (LCP 1,6 s, TBT 0) | 100 | záloha úvodu v rovnakom stupni ako film (1086) |
| 10, lokálne | 69 (LCP 5,3 s, CLS 0,13) | 99 | server bez kompresie; CLS od spodného tlačidla |
| 10, naživo | 5 behov 96 / 99 / 97 / 96 / 98, CLS 0 | 100 / 100 | fotky úvodu AVIF 46, pás `position: relative`, tlačidlo skryté |
| 11, naživo | 8 behov, medián 97 (93 až 99) | 100 | kratšia cesta; rozptyl z pozorovaného prvého obrazu |

HEAD SPA 30 (README): na serveri s kompresiou počítač 100, telefón 94 až 96 podľa zaťaženia stroja; lokálne bez
gzipu telefón 82 až 86, počítač 98. Kontrolný beh `lighthouse.sh` pri písaní tohto skillu na lokálnom serveri bez
kompresie (BARBERSHOP 30, `?film=off`): telefón 83 (LCP 3,76 s), počítač 100.

### Laboratórny prehliadač a WebGL

Kontajner kreslí WebGL softvérovo (SwiftShader); podľa CHECKS (časť 10) sa brána filmu týka aj Lighthouse
a PageSpeed Insights. Pred bránou na softvérové kreslenie dávala predvolená adresa s filmom v headless
Lighthouse 38 až 41 bodov a TBT 40,7 až 55,6 s (snímka filmu 1,7 s), čo je artefakt laboratória. Riešenie
nebolo „zrýchliť film“, ale rozpoznať softvérové kreslenie a dať pokojnú verziu (`world-frame` + `world-off`);
Lighthouse potom meria tú a telefón s grafikou dostane film (skill `film-z-fotiek`, references/vykon.md).

## Hlavné vlákno pri skrole

Metóda z auditu výkonu: Playwright, CDP `Performance.enable` s `timeDomain: 'threadTicks'`,
`Emulation.setCPUThrottlingRate` 4 (telefón), plynulý skrol celej stránky po pevnom kroku v
`requestAnimationFrame`, rozdiel `Performance.getMetrics` (`ScriptDuration`, `RecalcStyleDuration`,
`LayoutDuration`, `TaskDuration`) delený počtom snímok, a záznam trace (`UpdateLayoutTree.args.elementCount`
= koľko prvkov zasiahol prepočet štýlu).

```bash
node scripts/skrol-vlakno.mjs --url="http://127.0.0.1:8000/index.html?film=off&uvod=off" --runs=2
node scripts/skrol-vlakno.mjs --url=... --desktop --cpu=1
node scripts/cena-premennej.mjs --url=... --sel=.film-shot --var=--x
```

- Pred meraním stránku raz prejdi (zahriatie: obrázky, dekódovanie, vrstvy), až potom spomaľ CPU a meraj.
- Porovnávaj verzie na tom istom stroji, striedavo (A, B, A, B), aby šum zaťaženia padol na obe rovnako.
- Prvkov v prepočte na snímku v stovkách = premenná alebo trieda na koreni či veľkom kontajneri.
- Grafiku (WebGL) bez grafickej karty nemeraj ako skutočnú; meraj hlavné vlákno a záťaž grafiky odhadni z kódu.
- Na skutočnom zariadení: Safari na iPhone kreslí stránky najviac 60 snímok za sekundu; 90 až 240 Hz platí pre
  Chrome na Androide a počítače s rýchlym monitorom (CHECKS 12).

Kontrolný beh pri písaní skillu (BARBERSHOP 30, telefón 390×844 @3, CPU 4×, `?film=off&uvod=off`): skript 1,0 ms,
štýl 3,9 ms, rozloženie 0,1 ms, úlohy spolu 10,4 ms na snímku, 25 prvkov v prepočtoch na snímku (opakovaný
beh pri overení skillu: štýl 4,15 ms, úlohy 11,1 ms, 25 prvkov); `cena-premennej.mjs`: 741 prvkov, zápis na
`<html>` 49,6 ms, na kotvu `.film-shot` 4,6 ms (opakovaný beh 85,6 a 8,4 ms). Absolútne časy kolíšu so
zaťažením stroja, porovnávaj pomer a počet prvkov. Audit pred úpravou nameral 693 prvkov na snímku na telefóne
(752 na počítači).

## Váha prvého obrazu

`node source/tools/vaha.mjs [--url=...]` (spúšťať v `barbershop-30/`; bez `--url` si spustí vlastný statický
server): bajty do udalosti `load` bez filmu a čo navyše stiahne
prológ, na počítači 1440×900 aj telefóne 390×844 @3, rozpísané podľa typu a najväčšie súbory.

- Merané bez kompresie: počítač 383 KB do `load` (HTML 73, CSS 39, písma 70, JS 65, záloha AVIF 72, WebP 64),
  telefón 351 KB; cieľ prvého čitateľného obrazu bol pod 1,5 MB.
- Ťažké veci (three.js 671 KB nekomprimované, asi 170 KB gzip, zábery) idú až po `load`, LCP neovplyvnia.
- Testovací server posiela `Cache-Control: no-store`, preto sa v teste niečo stiahne dvakrát; naživo z cache.

## Ostrosť po zmenšení obrázkov

Zmenšenie fotiek kvôli LCP nesmie viditeľne ubrať ostrosť. V `barbershop-30/`: `node source/tools/ostrost.mjs --a=<stará adresa>
[--b=<nová>] --shots=sala,kreslo` nafotí ten istý záber na telefóne 390×844 @3 a počítači 1440×900 @2
a `ostrost.py` spočíta rozptyl Laplaciánu jasu v strednej časti (60 % × 60 %); väčšie = ostrejšie.
Číslo porovnávaj len pri rovnakej kompozícii výrezu, inak priprav aj výrezy 1 : 1 na oko.

## CLS v teste

`app-smoke.mjs` zbiera posuny rozloženia bez vstupu používateľa:

```js
await page.evaluate(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
```

a kontroluje `st.cls < 0.01`, plus vodorovné pretekanie (`document.documentElement.scrollWidth` voči `innerWidth`)
na 375, 390, 430 px pri viacerých polohách skrolu, pri pásoch tímu a galérie a pri 412×823 @1,75 so zablokovaným
`app.js` a `film.js` (`page.route(/assets\/(app|film)\.js/, (r) => r.abort())`).
