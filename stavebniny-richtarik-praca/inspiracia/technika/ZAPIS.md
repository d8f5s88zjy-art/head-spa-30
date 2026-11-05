# Technika filmových prechodov 2026: Stavebniny Richtárik (5. 11. 2026)

Rola: výskum techniky pohybu na webe. **V strome `hs-richtarik-obnova` som nič nemenil** (`git status --short | wc -l` → `0`,
vetva `richtarik-dokoncenie`, HEAD `4b2646bf`). Všetky výstupy sú v `richtarik/profi/inspiracia/technika/`, cesty nižšie
sú relatívne k nemu. Kód testov je vlastný, z cudzích stránok som nič neskopíroval. Fotky v testoch sú len skutočné fotky dvora
(zmenšené kópie, pozri §3). Žiadna generovaná fotka, žiadne auto.

- `test/`: testovacie stránky (`uvod.html`, `posun.html`, `kat.html` + `det-*.html`, `t.css`, `vt.css`, `vt.js`, `img/`).
- `nastroje/`: `meraj.mjs` (Playwright + Chromium 153, 390×844, DPR 3, CPU 4×), `beh.sh`, `beh3.sh` (striedavé A/B behy),
  `beh2.sh` (snímky a kontroly), `harok.py` (kontaktné hárky), `suhrn.py` (súhrn), `zaloha.mjs` (záloha dnešného webu), `text.py`.
- `mer/*.jsonl`: surové výsledky všetkých behov. `harok-*.jpg`: kontaktné hárky (všetky som otvoril nástrojom Read).
- `stiahnute/`: dokumentácia stiahnutá cez `curl` (`.html.gz` a vytiahnutý text `.txt`), dáta podpory (`caniuse/`, `bcd/`),
  `podpora-bcd.txt`. Je to nedôveryhodný obsah, slúži len ako dôkaz.

**Upozornenie pre orchestrátora: disk `/` je plný** (`df -h /` → `252G 39G 9M–117M 100%` počas práce, Chromium dvakrát
spadol „Target crashed“). Prehliadač som preto spúšťal s `TMPDIR=/dev/shm/technika-tmp` a snímky screencastu ukladal do
`/dev/shm/technika-snimky/` (RAM). Do výstupného priečinka idú len malé súbory (hárky, JSON).

## 0. Zhrnutie
1. **Prechody medzi stránkami sa dajú postaviť bez knižnice a bez JS: `@view-transition { navigation: auto }`.** Na Chrome/Edge
   od 126 a Safari/iOS od 18.2 to funguje, je to súčasť Interop 2026. **Firefox (144–162) má len prechody v rámci dokumentu**
   (caniuse „a #2: only Level 1“, `stiahnute/caniuse/cross-document-view-transitions.json`), takže tam je obyčajný okamžitý strih.
   V teste bez prechodu (§4.4) je strih **bez bieleho aj čierneho záblesku**: stará stránka stojí, kým sa nová nevykreslí
   (`harok-vt-bezvt.jpg`, 2 snímky, jas 172 → 192).
2. **Žiadny z 5 testovaných prechodov medzi stránkami nemal ani jednu snímku nad 50 ms** (15 behov, 1 177 snímok, CPU 4×).
   Žiadny ani nestmavol obraz: najnižší jas počas prechodu bol rovnaký ako jas východiskovej stránky (172), s výnimkou
   stierky transformom (155, to je fotka novej stránky, nie tmavá plocha). Podklad `::view-transition` je papier, nie čierna.
3. **Dnešný web zbytočne spomaľuje Firefox:** záloha v `site.js:821–831` pri každom kliknutí čaká **200 ms**, kým vôbec začne
   navigáciu. Namerané na dnešnom webe (A/B striedavo, 3+3 behy): od kliknutia po štart navigácie **3–13 ms s prechodmi**,
   **205–207 ms bez `pagereveal`** (`mer/zaloha.jsonl`). Odporúčam zálohu zrušiť a nechať tam okamžitý strih.
4. **Filmový úvod (hook) stačí postaviť z CSS:** jednorazové „dosadnutie kamery“ (Ken Burns cez `transform`), otvorenie
   záberu dvoma **svetlými** pásmi papiera (`transform`), nadpis po riadkoch (bez delenia na písmená) a nábeh dlaždíc zásob.
   **LCP sa tým neoneskorí:** medián 292–302 ms vo všetkých troch režimoch, 10 behov na režim. **Treba to ale spustiť až po
   `img.decode()`.** Ináč sa záber otvorí nad prázdnym rámom: v teste bol pri pásoch rám do 377 ms prázdny
   (`harok-uvod-panel.jpg`).
5. **Animácie viazané na posun (`animation-timeline: view()`) sú od 27. 10. 2026 Baseline** (Firefox 159, Chrome 115,
   Safari 26). Bez pripínania sú plynulé, ale `clip-path` má v meraní viac dlhých snímok ako `transform` a `opacity`
   (3 proti 1 na približne 1 800 snímok). Odporúčam odhalenia cez `transform` a `opacity`, `clip-path` len na malých
   prvkoch a len s rozsahom, ktorý sa vždy dokončí (riziko v §5 R4).
6. **Prechod v rámci stránky (filter) zvyšuje INP:** medián kliknutia je **72 ms s prechodom a 36 ms bez neho** (8 + 8
   interakcií, CPU 4×). Obe hodnoty sú hlboko pod hranicou 200 ms, ale prechod pridal aj dlhé snímky (7 proti 3).
   Na filtri akcií je to prijateľné, nič viac.
7. **Na prechodoch v katalógu sú dve chyby, ktoré sa dajú ľahko opraviť:** modrý záblesk ťuknutia (`-webkit-tap-highlight-color`)
   sa dostane do snímky prechodu a pri zdieľanej fotke vzniká dvojexpozícia, lebo dlaždica má 4:5 a hlavička 4:3
   (`harok-vt-morf.jpg`, 416–591 ms). Riešenie je v recepte R2.

## 1. Podpora v prehliadačoch (stav 5. 11. 2026)
Zdroj: MDN browser-compat-data (`stiahnute/bcd/*.json` → `podpora-bcd.txt`), caniuse (`stiahnute/caniuse/*.json`),
poznámky k vydaniu Firefoxu 159 (`stiahnute/stranky/mdn-ff159.txt:142`) a web.dev 10/2026 (`webdev-10-2026.txt:115–130`).

| Funkcia | Chrome/Edge (Android) | Safari / iOS | Firefox | Čo uvidí prehliadač bez podpory |
|---|---|---|---|---|
| prechod v dokumente `startViewTransition` | 111 | 18.0 | 144 | zmena bez animácie (v kóde `if (!document.startViewTransition) return zmen()`) |
| `view-transition-name: match-element` | 137 | 18.4 | 144 | – |
| `view-transition-class` | 125 | 18.2 | 144 | – |
| **prechod medzi dokumentmi `@view-transition`** | **126** | **18.2** | **nie** (BCD „preview“, caniuse „a #2“) | obyčajná navigácia; v Chromiu je strih bez bieleho záblesku (§4.4) |
| typy `:active-view-transition-type()` | 125 | 18.2 | 147 (len v dokumente) | pravidlo sa ignoruje |
| udalosti `pageswap` / `pagereveal` | 124 / 123 | 18.2 | nie | poslucháč sa nikdy nespustí |
| `animation-timeline: view()/scroll()` | 115 | 26 | **159** (27. 10. 2026) | `@supports` vetva sa preskočí, obsah ostane statický a viditeľný |
| `content-visibility: auto` | 85 | 26 (`auto`) | 125 | vykreslí sa všetko |
| `linear()` krivky | 113 | 17.2 | 112 | – |

Samsung Internet: caniuse uvádza prechody medzi dokumentmi ako nepodporované (verzie 4–31), BCD má „mirror“ Chromia.
Overiť na skutočnom zariadení. Na webe stačí, že bez podpory je obyčajný strih.

## 2. Referencie (technika)
Všetky som navštívil 5. 11. 2026 cez `curl` (HTTP 200, text v `stiahnute/stranky/*.txt`) alebo cez vlastný test. Ukážky pohybu
z galérií (Chrome VT demá, scroll-driven-animations.style) zachytil kolega v `../galerie/` (`harok-vt-*.jpg`,
`harok-sda-reveal.jpg`), tu ich neopakujem. Časové osi „po sekundách“ sú z mojich testov, ktoré túto techniku používajú.

### T1 Chrome for Developers: Cross-document view transitions for multi-page applications
- URL: https://developer.chrome.com/docs/web-platform/view-transitions/cross-document (5. 11. 2026)
- Čo hovorí (`chrome-crossdoc.txt:201–236, 267, 310, 450, 464`): spúšťačom je len navigácia v rámci rovnakého pôvodu, opt-in je
  `@view-transition { navigation: auto }` na oboch stránkach. Prechod sa nespustí pri navigácii z adresného riadka alebo
  záložky ani pri obnovení stránky. **Ak navigácia trvá viac ako 4 s, prechod sa preskočí (TimeoutError).** `pageswap`
  a `pagereveal` sa spustia pri každej navigácii, `link rel=expect blocking=render` počká na prvok novej stránky
  a `types` určujú variant prechodu.
- Po sekundách (môj test `kat → det`, `harok-vt-papier.jpg`): 0 s ťuk, 0,11 s záblesk ťuknutia, 0,34 s stará stránka bledne do
  papiera, 0,46 s takmer prázdny papier (jas 232), 0,51–0,63 s nová stránka nabehne o 10 px, 0,75 s hotovo.
- Prečo funguje ako hook: web pôsobí ako jeden súvislý film, žiadne biele „bliknutie“ medzi stránkami.
- Technika: čisté CSS, 1 pravidlo + 4 kľúčové snímky. Telefón: 0 snímok nad 50 ms (3 behy).
- U Richtárika: dnešný web to už má (`site.css:637–653`). Ostáva doplniť typy a zdieľanú fotku (T2) a zrušiť 200 ms zálohu.
- Riziká: pri pomalej sieti sa po 4 s prechod zahodí (nevadí). `blocking=render` môže oneskoriť FCP, a teda aj LCP.

### T2 Chrome for Developers: View transitions in 2025 + Consistent cross-document transitions (Modern Web Guidance)
- URL: https://developer.chrome.com/blog/view-transitions-in-2025 a
  https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/consistent-cross-document-transitions (5. 11. 2026)
- Čo hovorí (`chrome-vt2025.txt:118–134, 158–197`; `chrome-consistent.txt:341–444`): Firefox 144 priniesol prechody
  v dokumente bez typov, `match-element` funguje len v dokumente, vnorené skupiny (Chrome 140) a ohraničené prechody
  sú experimentálne. Návod na súvislé prechody odporúča pri `prefers-reduced-motion: reduce` nastaviť
  `@view-transition { navigation: none }`. Fotky, ktoré sa majú zdieľať, treba prednačítať, inak sa zachytí prázdny obdĺžnik.
- Po sekundách (môj test so zdieľanou fotkou, `harok-vt-morf.jpg`): 0,34 s ťuk, 0,42 s fotka dlaždice sa odlepí,
  0,49–0,73 s rastie na šírku hlavičky, text novej stránky nabehne, 0,79 s hotovo.
- Hook: dlaždica „Tehly“ sa zväčší na hlavičku kategórie, takže zákazník vidí, že prechádza do toho istého tovaru.
- Technika: `view-transition-name` sa nastaví až v `pageswap` alebo `pagereveal` a len na kliknutú fotku (`test/vt.js`).
  Telefón: 0 snímok nad 50 ms (3 behy). Pri behu so snímkami, kde prehliadač zároveň kódoval snímky, 3 snímky nad 50 ms.
- U Richtárika: dlaždica kategórie v katalógu → `.head` fotka kategórie, dlaždica akcie → detail akcie, náhľad galérie →
  lightbox. Sú to skutočné fotky.
- Riziká: dvojexpozícia pri rôznom pomere strán a modrý záblesk ťuknutia v snímke (oprava v R2). Meno musí byť na stránke
  jedinečné.

### T3 Shopify.dev: Cancel in-progress view transitions on user interaction
- URL: https://shopify.dev/docs/storefronts/themes/best-practices/performance/cancel-view-transitions-on-interaction (5. 11. 2026)
- Čo hovorí (`shopify-cancel.txt:16–80`): prechody medzi dokumentmi blokujú vykresľovanie od snímky starej stránky po odpoveď
  servera. Ak zákazník počas toho ťukne, zhorší sa INP. Odporúča `skipTransition()` na `pointerdown` a `keydown`
  v `pageswap` aj `pagereveal`.
- Po sekundách: v mojom teste je 0,15–0,34 s (stierka 0,19–0,54 s) obraz zamrznutý, kým príde nová stránka
  (`harok-vt-stierka.jpg`, 360–536 ms bez zmeny).
- Hook: nie je to efekt, je to poistka, aby prechod nepôsobil ako zaseknutie.
- Technika: 6 riadkov JS (`test/vt.js` funkcia `zrus`). U Richtárika: zaradiť do `site.js`. Riziká: žiadne.

### T4 MDN: Using the View Transition API
- URL: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using (5. 11. 2026). Základ pseudoprvkov
  `::view-transition-group/old/new`, prechod v dokumente cez `document.startViewTransition(cb)`.
- Po sekundách (môj filter v `kat.html`): 0 s ťuk na „Murivo“, 0,05–0,3 s dlaždice Dlažby a Rezivo zmiznú, ostatné sa
  posunú na nové miesta.
- Hook: filter akcií a katalógu pôsobí ako strih v jednom zábere. Technika: `match-element` (Chrome 137, Safari 18.4,
  Firefox 144), 458 B gzip.
- Telefón: INP medián 72 ms (bez prechodu 36 ms), 7 snímok nad 50 ms v 4 behoch (bez prechodu 3).
- Riziká: počas prechodu sú udalosti ukazovateľa na celom dokumente blokované. Použiť len na filtre, nie na každé ťuknutie.

### T5 WebKit: A guide to Scroll-driven Animations with just CSS
- URL: https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/ (5. 11. 2026)
- Čo hovorí (`webkit-sda.txt:42, 95, 100–104, 167–187`): podpora od Safari 26. `animation-timeline` treba zapísať **za**
  skratku `animation`, inak ju skratka zresetuje. Odporúča zabaliť pohyb do `@media not (prefers-reduced-motion)`
  a cez `animation-range` skrátiť pohyb veľkých fotiek, lebo pri rýchlom posune „prefrčia“.
- Po sekundách (môj test `posun.html?m=sda`, `harok-posun-sda.jpg`): pri posune 900 px/s sa každá fotka odhalí z rámu
  `inset(18% 10%)` počas prvých asi 45 % prechodu oknom a fotka v nej zostúpi z mierky 1,18 na 1. Text vyjde o 24 px.
- Hook: dvor „sa otvára“ pod prstom, ale nič sa nepripína a posun ostáva celý v rukách zákazníka.
- Technika: CSS, 396 B gzip, bez JS. Telefón: `clip-path` 3 snímky nad 50 ms, `transform`/`opacity` 1 snímka
  (5 behov, asi 1 800 snímok). Pokojová verzia bez animácie mala tiež 1.
- U Richtárika: pás „Na našom dvore v Nitre“, dlaždice zásob, fotky v O nás.
- Riziká: v Chromiu zhodil animovaný `clip-path: inset()` dvakrát kompozítor (`../../koncept-odhalenie/NAVRH.md:69–70`).
  Prvok pri konci stránky nemusí rozsah nikdy dokončiť (pozri R4).

### T6 Chrome for Developers: Animate elements on scroll with Scroll-driven animations
- URL: https://developer.chrome.com/docs/css-ui/scroll-driven-animations (5. 11. 2026). `view()` je časová os viditeľnosti
  prvku, `scroll()` je os posunu kontajnera. Animácie bežia mimo hlavného vlákna, ak animujú vlastnosti kompozítora.
- Hook a technika ako T5. Vlastný test rozdielu: `sdatr` (len `transform`/`opacity`) má max. snímku 50 ms, `sda`
  (`clip-path`) 83 ms.

### T7 web.dev: Scroll-driven animations become Baseline (New to the web platform in October 2026) + MDN Firefox 159
- URL: https://web.dev/blog/web-platform-10-2026 a https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/159
  (5. 11. 2026). Firefox 159 (27. 10. 2026) zapol scroll-driven animations, teda sú „Baseline Newly available“.
- Dôsledok: náhrada cez IntersectionObserver už pre nové prehliadače netreba. Staré prehliadače dostanú statický obsah,
  ktorý je viditeľný.

### T8 web.dev: Interop 2026
- URL: https://web.dev/blog/interop-2026 (5. 11. 2026). Medzi oblasťami sú scroll-driven animations (`animation-timeline`)
  a view transitions vrátane prechodov medzi dokumentmi a `blocking="render"` / `rel=expect` (`webdev-interop2026.txt:125–144`).
- Dôsledok: Firefox má prechody medzi dokumentmi v pláne. Kód s `@view-transition` je kompatibilný dopredu.

### T9 CSS-Tricks: Cross-Document View Transitions: The Gotchas Nobody Mentions (18. 5. 2026)
- URL: https://css-tricks.com/cross-document-view-transitions-part-1/ (5. 11. 2026)
- Čo hovorí (`csstricks-vt1.txt:28, 34, 123, 136–162`): značka `<meta name="view-transition">` je zastaraná. Platí 4 s limit.
  Fotky v prechode sa naťahujú, lebo snímky majú `object-fit: fill` a treba nastaviť `object-fit: cover`.
  `blocking=render` oneskorí prvé vykreslenie.
- U Richtárika: `::view-transition-old/new(foto) { height:100%; object-fit:cover }`. To je v `test/vt.css`, deformáciu
  na hárku nevidieť.

### T10 web.dev: How to create high-performance CSS animations
- URL: https://web.dev/articles/animations-guide (5. 11. 2026). Animovať len `transform` a `opacity`, `will-change` dávať
  striedmo. Animácia `top`/`left` zahodí asi 50 % snímok, `transform` asi 1 % (`webdev-anim.txt`).
- U Richtárika: Ken Burns je `transform: scale()`, otvorenie záberu sú pásy s `translateY`, odhalenia `transform`.

### T11 Adrian Roselli: You Know What? Just Don't Split Words into Letters (2/2026) + CSS { In Real Life }: How to Accessibly Split Text
- URL: https://adrianroselli.com/2026/02/you-know-what-just-dont-split-words-into-letters.html,
  https://css-irl.info/how-to-accessibly-split-text/ (5. 11. 2026)
- Čo hovoria (`roselli-split.txt:75–98, 128`; `cssirl-split.txt:54–81`): `aria-label` na generickom `span`/`div` je
  zakázaný. Pri delení na písmená NVDA 2025.3 číta text dvakrát, JAWS 2026 ho nečíta vôbec a VoiceOver macOS 26.2
  písmeno po písmene. Záver je písmená nedeliť.
- Môj test (`uvod.html`): nadpis je rozdelený **len na dva riadky v HTML** (`<span class="ln"><span>…`). Text ostáva súvislý
  a strom prístupnosti ho číta ako jednu vetu: `ariaSnapshot` → `heading "Dvor plný materiálu. Od základov po strechu."
  [level=1]` (`mer/kontroly.jsonl`, bez JS aj pri obmedzenom pohybe).
- U Richtárika: nadpis po riadkoch áno, po písmenách nie.

### T12 web.dev: Back/forward cache + Interaction to Next Paint
- URL: https://web.dev/articles/bfcache, https://web.dev/articles/inp (5. 11. 2026). `pageshow` s `persisted` pri návrate
  z bfcache (`webdev-bfcache.txt:136–176`). INP do 200 ms je dobrý.
- Môj test Späť: `navigation type = back_forward` v 4 zo 4 behov (`vtspat`), prechod beží aj pri návrate a je svetlý
  (jas min. 171). Dnešný web ruší triedu `leaving` v `pageshow` (`site.js:830`), čo je správne.

### T13 MDN: prefers-reduced-motion
- URL: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion (5. 11. 2026).
- Môj test pri `reduce`: úvod je hneď v konečnom stave (po 100 ms všade `transform:none | clip-path:none | opacity:1`) a prechod
  medzi stránkami sa nespustí (`vtAktivny: false`). Odhalenia pri posune: všetko `opacity 1`, bez orezania.

### T14 caniuse + MDN browser-compat-data
- URL: https://caniuse.com/cross-document-view-transitions (dáta z https://github.com/Fyrd/caniuse),
  https://github.com/mdn/browser-compat-data (5. 11. 2026). Tabuľka v §1.

## 3. Testovacie stránky (vlastný kód, `test/`)
Fotky sú zmenšené kópie **skutočných** fotiek dvora. Upravené verzie s doplnenými paletami nie sú použité:
`img/dvor-t.webp` a `dvor-p.webp` (u4 z gitu, `../../diagnoza/uvod/prac/hist/u4-*`), `ulicka-t.webp` (`prijazd-podklad-t-1086`,
bez auta; `u2` som vyradil, lebo je na ňom skutočné auto firmy), `tehly`, `stadreko`, `rezivo` (`img/uvod/zasoba-*-720`),
`porfix` (**neupravená** `orig-zasoba-porfix-900`). Náhľad som otvoril: `fotky-test.jpg`, `ulicka-nahlad.jpg`.

| Stránka | Režimy (`?m=`) | Čo testuje |
|---|---|---|
| `uvod.html` | `none` (len nábeh textu) / `clip` (otvorenie `clip-path`) / `panel` (2 pásy papiera, `transform`) | hook úvodu: Ken Burns, otvorenie záberu, nadpis po riadkoch, nábeh dlaždíc zásob |
| `posun.html` | `none` / `sda` (`view()` + `clip-path`) / `sdatr` (`view()` + `transform`) / `io` (IntersectionObserver + `clip-path`) / `iotr` (IO + `transform`) | odhalenia pri posune bez pripínania |
| `kat.html` → `det-*.html` | `papier` / `morf` (zdieľaná fotka) / `stierka` (`clip-path`) / `stierkatr` (`transform`) / `posun` (smer podľa typu) | prechody medzi dokumentmi, typy, zrušenie pri dotyku, filter s prechodom v dokumente |

Meranie (`nastroje/meraj.mjs`): Chromium 153 (headless shell), 390×844, DPR 3, `isMobile`, `hasTouch`,
`Emulation.setCPUThrottlingRate 4`. Snímky: rozdiely časov `requestAnimationFrame`, okno animácie od FCP do 3,2 s (úvod),
počas gesta posunu 2 300 px pri 900 px/s (posun) a prvých 1,4 s novej stránky (prechod). Dlhé snímky: `long-animation-frame`.
INP: `PerformanceObserver('event')`. Jas: CDP screencast (JPEG 390 px), priemerný jas v odtieňoch sivej a podiel pixelov pod
25 % jasu. **Podmienky: stroj zdieľa CPU s inými úlohami (load 4,4–7,0), preto som behy striedal A/B/C a v každom kole
otočil poradie** (`nastroje/beh.sh`, `beh3.sh`). Prechod bez podpory som simuloval pravidlom `@view-transition{navigation:none}`
na konci `<head>` (overené: `pagereveal.viewTransition` je `null`). Prepínač `--disable-blink-features` prechod nevypol.

## 4. Merania (surové dáta `mer/*.jsonl`, súhrn `mer/suhrn-agregat.txt`)

### 4.1 Úvod (10 behov na režim, striedavo)
| Režim | snímok v okne animácie | snímky > 50 ms (spolu / behov s nimi) | max. snímka (medián / max) | LCP medián |
|---|---|---|---|---|
| `none` (len text) | 1 717 | 1 / 1 | 17 / 133 ms | 302 ms |
| `panel` (pásy papiera, `transform`) | 1 726 | 4 / 3 | 17 / 117 ms | 300 ms |
| `clip` (`clip-path`) | 1 704 | 4 / 3 | 25 / 117 ms | 292 ms |

Dlhé snímky prišli hneď po FCP (načítanie) alebo v 1,6–1,9 s, keď nabiehajú dlaždice zásob
(`panel 4: 1612 ms`, `clip 4: 1791 ms`). Šlo o snímky vykresľovania, nie skriptu (`blockingDuration` 0). Pásy aj `clip-path`
vychádzajú rovnako. **Cieľ „0 snímok nad 50 ms“ v 7 z 10 behov splnený, v 3 nie.** Odporúčanie v R1: dlaždice
nenechať nabiehať počas otvárania záberu a spustiť všetko až po `decode()`.
Bez JS: všetko viditeľné, nadpis celý v strome prístupnosti. Pri „obmedziť pohyb“ je stav po 100 ms konečný
(`none|none|1`). Hárky `harok-uvod-clip.jpg` a `harok-uvod-panel.jpg` sú svetlé (jas min. 172, tmavé px max. 13,4 %,
to sú tiene na fotke dvora).

### 4.2 Odhalenia pri posune (5–6 platných behov na režim, gesto myšou; behy s dotykovým gestom, ktoré neposunuli stránku, som vyradil)
| Režim | snímok | > 50 ms (spolu / behov) | max. (medián / max) |
|---|---|---|---|
| `none` | 1 819 | 1 / 1 | 17 / 117 ms |
| `sdatr` (`view()` + `transform`/`opacity`) | 1 819 | 1 / 1 | 17 / 50 ms |
| `sda` (`view()` + `clip-path`) | 1 818 | 3 / 2 | 33 / 83 ms |
| `iotr` (IO + `transform`) | 2 179 | 1 / 1 | 17 / 67 ms |
| `io` (IO + `clip-path`, ako dnešné `.rvimg`) | 1 747 | 2 / 2 | 50 / 67 ms |

Záver: najlepšia je `transform`/`opacity` verzia (časová os CSS aj IO), výsledok je na úrovni statickej stránky.
`clip-path` je drahší. Bez JS aj pri `reduce` je všetko viditeľné (`opacity 1`, bez orezania). `harok-posun-sda.jpg`
je svetlý (jas min. 160).

### 4.3 Prechody medzi stránkami (3 behy na režim, striedavo)
| Režim | snímky > 50 ms | max. snímka | LCP novej stránky (medián) | jas min. / tmavé px max. (hárok) |
|---|---|---|---|---|
| `papier` (dnešný web) | 0 | 33 ms | 132 ms | 172 / 11,4 % (`harok-vt-papier.jpg`) |
| `morf` (zdieľaná fotka) | 0 | 33 ms | 112 ms | 172 / 11,4 % (`harok-vt-morf.jpg`) |
| `stierka` (`clip-path`) | 0 | 17 ms | 124 ms | 172 / 11,4 % (`harok-vt-stierka.jpg`) |
| `stierkatr` (`transform`) | 0 | 33 ms | 124 ms | 155 / 14,5 % (`harok-vt-stierkatr.jpg`, nová fotka cez dlaždice) |
| `posun` (typy dalej/spat) | 0 | 50 ms | 136 ms | 169 / 11,6 % (`harok-vt-posun.jpg`) |
| bez prechodu | 0 | 17 ms | 76 ms | 172 / 11,4 % (`harok-vt-bezvt.jpg`) |
| Späť (bfcache, `morf`/`papier`) | 1 / 0 (2+2 behy) | 67 / 50 ms | – | 171 / 11,4 % (`harok-vt-spat-morf.jpg`) |

Jas východiskovej stránky je 172 a tmavé px 11,4 % (fotky dlaždíc). Žiadny prechod nešiel pod túto hodnotu, len stierka
transformom krátko na 155 (fotka novej stránky prechádza cez fotky dlaždíc). Čierna ani tmavá plocha nikde nie je.
`papier` krátko zosvetlí obraz na 232 (podklad papiera). LCP s prechodom je vyšší (112–136 ms proti 76 ms), lebo prvé
vykreslenie novej stránky je až po animácii starej. Pri 0,2 s odchode v `papier` je to viditeľné, pri `morf` najmenej.

### 4.4 Prehliadač bez prechodu medzi dokumentmi
- Test: okamžitý strih, 2 snímky v hárku, **žiadny biely ani tmavý medzisnímok** (paint holding v Chromiu).
- Dnešný web: záloha `site.js:821–831` (trieda `leaving`, `setTimeout(…, 200)`) sa spustí všade, kde chýba `onpagereveal`,
  teda vo **Firefoxe 144–162**. Meranie A/B (`nastroje/zaloha.mjs`, server 9722 nad stromom, len čítanie):

| Režim | klik → štart navigácie | klik → FCP novej stránky |
|---|---|---|
| s prechodmi (3 behy) | 6 / 3 / 13 ms | 214 / 231 / 253 ms |
| bez `pagereveal` (záloha, 3 behy) | 206 / 205 / 207 ms | 434 / 497 / 607 ms |

**Odporúčanie: zálohu zmazať** (−200 ms na každom kliknutí vo Firefoxe). Vo Firefoxe potom bude okamžitý strih ako v teste vyššie.
Pravidlo `@supports not (view-transition-name:x){body{animation:page-in…}}` (`site.css:666`) Firefox 144+ aj tak nespustí,
lebo `view-transition-name` pozná. Môže ostať pre staré prehliadače.

### 4.5 Filter s prechodom v dokumente (4 + 4 behy, 2 kliknutia na beh, striedavo)
| | INP (trvanie `click`) medián / max | snímky > 50 ms |
|---|---|---|
| s `startViewTransition` + `match-element` | 72 / 88 ms | 7 (vo 4 behoch) |
| bez prechodu | 36 / 48 ms | 3 (v 3 behoch) |

## 5. Recepty (vlastný kód, rozpočet pre telefón pri CPU 4×)
Spoločné pravidlá: animovať len `transform` a `opacity`, nikdy nepripínať a nezamykať posun, konečný stav je HTML (bez JS
všetko viditeľné), `@media (prefers-reduced-motion: no-preference)` alebo `reduce → none`, podklad všade `var(--papier)`.

### R1 Hook úvodu „Otvorenie záberu“ (z `test/uvod.html`, 790 B gzip CSS + asi 0,3 kB JS na spustenie)
```css
/* .pred-ide = zatvorené pásy (inline skript v <head>), .ide = otvorenie po decode(); bez JS a pri reduce nič = konečný stav */
@media (prefers-reduced-motion:no-preference){
 .ide .ram img{animation:kb 2.6s cubic-bezier(.2,.7,.2,1) both}
 @keyframes kb{from{transform:scale(1.14) translateY(2%)}}            /* Ken Burns: jedno dosadnutie, nie slučka */
 .pred-ide .ram::before,.pred-ide .ram::after{content:"";position:absolute;inset-inline:0;height:50.5%;background:var(--papier);z-index:1}
 .ide .ram::before,.ide .ram::after{animation:.9s cubic-bezier(.7,0,.2,1) .1s both}
 .pred-ide .ram::before{top:0} .pred-ide .ram::after{bottom:0}
 .ide .ram::before{animation-name:hore} .ide .ram::after{animation-name:dole}
 .pred-ide:not(.ide) .ln>span{transform:translateY(105%)}             /* nadpis čaká pod hranou riadku, nie bliknutie */
 @keyframes hore{from{transform:none}to{transform:translateY(-101%)}} @keyframes dole{from{transform:none}to{transform:translateY(101%)}}
 .ide .ln>span{animation:riadok .8s cubic-bezier(.2,.7,.2,1) both} .ide .ln:nth-child(2)>span{animation-delay:.13s}
 @keyframes riadok{from{transform:translateY(105%)}}                   /* .ln{display:block;overflow:clip} */
}
```
```js
// <head>: if (!matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('pred-ide');
// po <img>: otvoriť, len ak je fotka dekódovaná do 1,2 s; inak pásy zmiznú bez animácie
var im = document.querySelector('.ram img'), h = document.documentElement, zrus = function () { h.classList.remove('pred-ide', 'ide'); };
if (h.classList.contains('pred-ide')) {
  var t = setTimeout(function () { t = 0; zrus(); }, 1200);
  (im && im.decode ? im.decode() : Promise.reject()).then(function () {
    if (!t) return; clearTimeout(t); h.classList.add('ide');
    setTimeout(function () { h.classList.remove('pred-ide'); }, 1100); // pásy preč, Ken Burns a nadpis (.ide) dobehnú
  }, function () { clearTimeout(t); zrus(); });
}
```
Rozpočet: 0 ms skriptu počas animácie, celý pohyb ide cez kompozítor (2 pásy a 1 fotka). Záber sa otvorí za 0,9 s,
nadpis je hotový za 1,1 s a Ken Burns dobehne za 2,6 s. LCP sa nemení (§4.1). V behu so snímkami hlásil Chromium LCP fotky
už v 264 ms, hoci pod pásmi bola fotka viditeľná až od asi 510 ms (`harok-uvod-panel.jpg`). Prekrytie teda LCP neoneskorí,
ale zákazník fotku uvidí neskôr. Preto sú pásy zatvorené len krátko: inline skript v `<head>` pridá `pred-ide`
(statické zatvorené pásy, len s JS a bez `reduce`), po `decode()` sa pridá `ide` (otvorenie) a ak fotka nie je hotová do
1,2 s, `pred-ide` sa zmaže bez animácie. Bez JS pásy vôbec nie sú.
Varianta s `clip-path` vyšla v meraní rovnako, ale v Chromiu je pri nej zaznamenaný pád kompozítora (T5), preto pásy.
Dlaždice zásob nech nabehnú až po otvorení záberu (od 0,9 s), alebo vôbec. Dlhé snímky v teste prišli v 1,6–1,9 s.

### R2 Prechod medzi stránkami so zdieľanou fotkou (`test/vt.css` 893 B gzip, `test/vt.js` 838 B gzip)
```css
@view-transition{navigation:auto}
@media (prefers-reduced-motion:reduce){@view-transition{navigation:none}}
::view-transition{background:var(--papier)}
::view-transition-old(root){animation:vt-von .15s ease-in both}
::view-transition-new(root){animation:vt-dnu .3s cubic-bezier(.2,.7,.2,1) .12s both}
::view-transition-group(foto){animation-duration:.45s;animation-timing-function:cubic-bezier(.3,0,.2,1)}
::view-transition-new(foto){height:100%;object-fit:cover}
::view-transition-old(foto){display:none}          /* oprava dvojexpozície: rastie len nová fotka (tá istá skutočná fotka) */
a{-webkit-tap-highlight-color:transparent}         /* modrý záblesk ťuknutia sa nedostane do snímky; vlastný :active ostáva */
```
```js
addEventListener('pageswap', function (e) {           // stará stránka: meno len na kliknutú fotku
  if (!e.viewTransition) return;
  var to = e.activation && e.activation.entry.url, img = najdiFotku(to);   // dlaždica s href = cieľ, inak .head img
  if (img) { img.style.viewTransitionName = 'foto'; e.viewTransition.finished.finally(function () { img.style.viewTransitionName = ''; }); }
});
addEventListener('pagereveal', function (e) {         // nová stránka: rovnaké meno + zrušenie pri dotyku (INP)
  if (!e.viewTransition) return;
  /* … rovnaké pomenovanie podľa navigation.activation.from … */
  ['pointerdown', 'keydown'].forEach(function (t) { addEventListener(t, function () { e.viewTransition.skipTransition(); }, { once: true, capture: true }); });
});
```
Rozpočet: prechod 0,45 s, 0 snímok nad 50 ms (3 behy). Na novej stránke `<link rel="preload" as="image">` alebo
`fetchpriority="high"` na fotku hlavičky. `blocking=render` len na `#koniec-hlavicky` a len ak meranie LCP nezhorší.
`pageswap`/`pagereveal` musia byť v skripte v `<head>` (nie `defer`), inak `pagereveal` ujde.

### R3 Strih „stierka“ medzi sekciami webu (alternatíva k R2 pre stránky bez spoločnej fotky)
```css
::view-transition-old(root){animation:none}
::view-transition-new(root){animation:vt-hore .5s cubic-bezier(.7,0,.2,1) both}
@keyframes vt-hore{from{transform:translateY(100%)}}    /* transform, nie clip-path */
```
Rozpočet: 0,5 s, 0 snímok nad 50 ms. Pôsobí najviac „filmovo“ (strih zdola), ale je to najdlhší prechod. Odporúčam ho len
pre prechod Úvod → Katalóg a Akcie (typ `strih` nastavený v `pageswap` podľa cieľa), nie na všetky odkazy.

### R4 Odhalenie fotiek pri posune (CSS, 396 B gzip; bez JS)
```css
@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){
 .odh{animation:odhal linear both;animation-timeline:view();animation-range:entry 0% entry 100%}
 .odh img{animation:zoom linear both;animation-timeline:view();animation-range:entry 0% cover 50%}
}}
@keyframes odhal{from{transform:scale(.9);opacity:.35}}
@keyframes zoom{from{transform:scale(1.15)}}
```
Rozsah `entry 0% entry 100%` sa dokončí, keď je prvok celý v okne. To platí aj pre posledný prvok stránky, ktorý by pri
`cover 45%` nikdy nedobehol a ostal by napoly orezaný. **Animáciu `animation-timeline` treba písať za skratkou `animation`**
(WebKit T5). Začiatočná `opacity` nemá byť 0, aby bol obsah čitateľný aj pri rýchlom posune. Rozpočet: 0 ms JS, max. 50 ms
snímka v 5 behoch. Dnešné `.rvimg` (`site.css:570–573`, IO + `clip-path` 1,1 s) odporúčam nahradiť týmto receptom.

### R5 Nábeh blokov pri prvom zobrazení (IO + trieda; ako dnes, len bez `clip-path`)
Dnešný kód `site.js:51–70` je v poriadku: čo je v okne, dostane `now` bez animácie, `.no-js` všetko ukáže a pri `reduce`
sa nič nehýbe. Stačí zmeniť `.rvimg` na `transform`/`opacity` (R4) a oneskorenie v mriežke nechať do 5 × 70 ms.

### R6 Mikroanimácie tlačidiel a dlaždíc (CSS, asi 0,4 kB)
```css
.btn{transition:transform .18s cubic-bezier(.2,.7,.2,1),box-shadow .18s}
.btn:active{transform:scale(.97)}
.btn i{display:inline-block;transition:transform .25s cubic-bezier(.2,.7,.2,1)}
@media (hover:hover){.btn:hover i{transform:translateX(4px)} .dl:hover img{transform:scale(1.05)}}
.dl:active{transform:scale(.98)}
.btn:focus-visible,.dl:focus-visible{outline:3px solid currentColor;outline-offset:3px}
```
Hover len na zariadeniach s myšou, `:active` aj na dotyk. Odozva 0,18 s, len `transform`.

### R7 Filter akcií alebo katalógu s prechodom v dokumente (458 B gzip)
`document.startViewTransition(zmen)` a pred ním `view-transition-name: match-element` na dlaždiciach. Po skončení sa meno
zmaže. Bez podpory sa zmena urobí hneď. INP 72 ms proti 36 ms (§4.5).

### R8 Delenie textu
Len na **riadky alebo vety v HTML** (`<span class=ln><span>…</span></span>`). Nikdy nie na písmená a nikdy nie s `aria-label`
na `span`/`div` (T11). Slová delené JS-om v `inline-block` neodporúčam: chýba test na čítačke a hook to nepotrebuje.

### Čo nenasadiť
- Pripínanie (`position: sticky` scény s vysokým kontajnerom), scroll-jacking a „scrollytelling“ s pevnou scénou.
- Delenie na písmená (T11), nekonečný Ken Burns (dnes `drift 30s infinite` v páse, `site.css:660–661` a `1025–1028`). Na telefóne beží stále
  v kompozítore a míňa batériu, odporúčam jednorazové dosadnutie.
- `clip-path` na celoplošných fotkách a koreňovom prechode, čierny `::view-transition` (pozri `../galerie/harok-vt-stack-reload.jpg`).
- `blocking=render` na celé `<body>`, `<meta name="view-transition">` (zastarané) a knižnice (GSAP, Lenis, Barba).
  Všetko vyššie ide vlastným CSS a malým JS.
- Prechod pri obnovení stránky (`reload`) a na externé odkazy (tie aj tak nefungujú).

## 6. Odporúčanie: čo nasadiť a čo nie
| Nasadiť | Kde | Rozpočet |
|---|---|---|
| R1 otvorenie záberu + Ken Burns + nadpis po riadkoch, spustené po `decode()` | úvod | 0,8 kB gzip CSS+JS, 0,9–2,6 s, LCP bez zmeny |
| R2 zdieľaná fotka dlaždica → hlavička + oprava dvojexpozície a ťuknutia | katalóg, akcie, galéria | 1,7 kB gzip, 0,45 s, 0 snímok > 50 ms |
| T3 zrušenie prechodu pri dotyku | všetky stránky | 0,2 kB |
| zmazať 200 ms zálohu `site.js:819–831` | všetky stránky | −0,5 kB, −200 ms vo Firefoxe |
| R4 odhalenia pri posune cez `view()` + `transform`, náhrada `.rvimg` | pásy fotiek dvora | 0,4 kB, 0 ms JS |
| R6 mikroanimácie | tlačidlá, dlaždice, čipy | 0,4 kB |
| R7 filter s prechodom | akcie, katalóg (ak je filter) | 0,5 kB, INP +36 ms |
| R3 stierka | len Úvod → Katalóg/Akcie | v R2 |

Nenasadiť: pozri „Čo nenasadiť“ v §5. Na celý pohyb netreba žiadnu cudziu knižnicu.

## 7. TOP 8 nápadov pre Richtárika (sila hooku × realizovateľnosť)
| # | Nápad | Hook (1–5) | Realizovateľnosť (1–5) | Skóre | Dôkaz |
|---|---|---|---|---|---|
| 1 | **Otvorenie záberu na skutočný plný dvor**: dva pásy papiera sa rozostúpia (0,1–1,0 s), kamera dosadne (Ken Burns 2,6 s), nadpis „Dvor plný materiálu. Od základov po strechu.“ vyjde po riadkoch (0,45–1,3 s) | 5 | 5 | 25 | §4.1, `harok-uvod-panel.jpg` |
| 2 | **Dlaždica sa stane hlavičkou**: fotka kategórie (Tehly, Porfix…) sa pri kliknutí zväčší na hlavičku stránky kategórie | 5 | 4 | 20 | §4.3, `harok-vt-morf.jpg` |
| 3 | **Dvor sa otvára pod prstom**: pás fotiek dvora sa pri posune zväčšuje z rámu a fotka v ňom dosadá, bez pripínania | 4 | 5 | 20 | §4.2, `harok-posun-sda.jpg` |
| 4 | **Inventúra zásob po otvorení záberu**: štyri skutočné fotky zásob (tehly, Porfix neupravený, Stadreko, rezivo) nabehnú za sebou so štítkom | 4 | 4 | 16 | `uvod.html` `.zasoby`; pozor na dlhé snímky v 1,6–1,9 s |
| 5 | **Filmový strih zdola** pri prechode z úvodu do Katalógu a Akcií (typ prechodu) | 4 | 4 | 16 | `harok-vt-stierkatr.jpg` |
| 6 | **Rýchle prechody všade**: papierový prechod s typmi, zrušenie pri dotyku a bez 200 ms čakania vo Firefoxe | 3 | 5 | 15 | §4.4, `mer/zaloha.jsonl` |
| 7 | **Filter akcií, kde sa dlaždice presunú** namiesto preskočenia | 3 | 4 | 12 | §4.5 |
| 8 | **Mikroanimácie**: tlačidlo „Zavolať“ sa stlačí, šípka sa posunie, fotka dlaždice sa jemne priblíži (len myš) | 2 | 5 | 10 | R6 |

## 8. Riziká a otvorené body
- Merania sú z headless Chromia na zdieľanom CPU (load 4–7). Malé počty dlhých snímok (1–4 na 1 700 snímok) sú na hranici
  šumu, preto sú striedavé A/B a pokojový režim `none`. Na skutočnom telefóne (Android strednej triedy, Safari iOS) treba
  pred nasadením overiť R1 a R2.
- **Neoverené meraním:** spúšťanie R1 cez `pred-ide`/`ide` po `decode()` (meraná bola verzia `panel`, ktorá štartuje hneď)
  a dve opravy v R2 (`::view-transition-old(foto){display:none}`, `-webkit-tap-highlight-color`). Testovacie stránky ich
  nemajú. Pri implementácii treba zopakovať `nastroje/meraj.mjs` (10 behov striedavo) a hárky.
- Safari: prechody medzi dokumentmi od 18.2 som netestoval (WebKit tu nie je). Firefox ich nemá, tam bude okamžitý strih.
- Pri pomalej sieti sa prechod po 4 s zahodí (T1) a hook R1 sa po 1,2 s bez fotky nespustí. Oba prípady sú bezpečné.
- Náhľad v iframe claude.ai: prechody medzi dokumentmi bežia aj v iframe (rovnaký pôvod), chyby v konzole testov: 0
  (`chyby: []` vo všetkých behoch). Samotný náhľad som nespúšťal, zverejňuje ho orchestrátor.
- Disk `/` je plný (§ úvod). Dočasné snímky v `/dev/shm/technika-*` som po vytvorení hárkov zmazal.
- Servery 9721 a 9722 sú ukončené (`pgrep -fa "http.server 972"` → nič), strom je bez zmien (`git status --short | wc -l` → 0).
