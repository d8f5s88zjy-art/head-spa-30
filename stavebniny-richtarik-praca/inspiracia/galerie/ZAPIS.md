# Inšpirácia z galérií ocenených webov a ukážok pohybu: Stavebniny Richtárik (5. 11. 2026)

Rola: kreatívny výskum pohybu na webe (galérie). V strome `hs-richtarik-obnova` som nič nemenil:
`git status --short | wc -l` → `0`, vetva `richtarik-dokoncenie`, HEAD `4b2646bf`. Lokálny server som nespúšťal
(porty 9700–9709 som nepotreboval), `pgrep -fa "http.server 97"` nič nenašiel a žiadny Chromium už nebeží.
Všetky výstupy sú v `richtarik/profi/inspiracia/galerie/`. Cesty nižšie sú relatívne k tomuto priečinku.

- `harok-*.jpg`: kontaktné hárky, **všetky som otvoril nástrojom Read** (12 hárkov, 11 zachytených sekvencií + 1 opakovaná).
- `zachyt/<kód>/`: záznam `zaznam.webm`, vybrané snímky `t*.jpg` alebo `k*.jpg|png`, `jas.txt` alebo `log.json`.
- `stiahnute/`: HTML a CSS ukážok stiahnuté cez `curl`. Je to nedôveryhodný obsah, slúži len ako dôkaz techniky,
  nič z neho sa nespúšťa ani nekopíruje.
- `nastroje/`: `zachyt.mjs` (Playwright, Chromium z `/opt/pw-browsers`, cez proxy), `snimky.py` (výber snímok
  z videa bez dočasných súborov), `harok.sh` (montage).

## 0. Zhrnutie
1. **Hook z ocenených stavebných webov je typografia, nie video.** Haven Constructions (Awwwards Honorable Mention
   10. 6. 2026) otvára obrovským slovom, ktoré vyjde zdola cez stierku. Pri posune sa fotka pod ním roztiahne na celú
   šírku. To je princíp, ktorý sa dá u Richtárika postaviť len zo skutočnej fotky dvora a jednej vety.
2. **Čo hook zabíja (namerané):** úvodná opona pred obsahom (Haven 2,4 s modrá plocha s jasom 51–59, Hays 1,0 s
   červená s jasom 59), cookie lišta cez celý úvod (Wienerberger SK zatemní stránku na jas 141, 36 % tmavých px,
   Porfix SK prekryje 70 % obrazovky oknom) a ťažký web, na ktorom sa do 8 s nič neobjaví (Jonite).
3. **Prechody medzi stránkami (View Transitions medzi dokumentmi) sú realizovateľné bez knižnice**, ale ukážka
   Chrome má v CSS `::view-transition { background: black; }` (`stiahnute/vt/shared.css:44–45`). Pri type „reload“
   je obrazovka **0,2 s úplne čierna (jas 0, 100 % tmavých px)** (`harok-vt-stack-reload.jpg`). U Richtárika preto
   treba svetlý podklad, žiadne zmenšovanie celej stránky a zdieľaný prvok (fotka dlaždice → hlavička).
4. **Odhalenie fotky pri posune** je čisté CSS (`clip-path: inset()` + `animation-timeline`), nič nepripína a jas
   neklesne pod 216 (`harok-sda-reveal.jpg`).
5. TOP 8 nápadov je v časti 4. Na prvom mieste je „Veta, ktorú dokazuje fotka“: H1 sa zloží po slovách nad
   **už viditeľnou** skutočnou fotkou dvora, bez opony a bez čakania (sila 5 × realizovateľnosť 5).

## 1. Metóda a obmedzenia
- Zachytenie: Playwright Chromium, telefón 390 × 844 (isMobile, dotyk) alebo počítač 1440 × 900, záznam videa
  25 snímok/s. Pri úvode je `t = 0` prvé vykreslenie obsahu (prvá snímka odlišná od prázdnej). Ak je prvá snímka
  už opona (Haven), počítam od začiatku záznamu (`snimky.py uvod0`). Pri prechode je okno nájdené podľa zmeny medzi
  snímkami, krok 0,04 s. Pri posune robím snímku po každom posune kolieskom o 380 px (0,45 výšky okna) a 0,7 s pauze.
- Jas: priemer šedej 0–255. „Tmavé px“ je podiel pixelov pod 25 % (hodnota 64), čo je to isté prahovanie ako
  `convert -threshold 25%`. Sýta firemná farba (modrá Haven, červená Hays) sa tiež počíta ako tmavá plocha. Je to
  zámer, lebo pravidlo majiteľa znie „žiadne tmavé plochy pri prechodoch“.
- **Časy načítania cudzích webov nie sú merania výkonu.** Idú cez proxy a CPU je bez spomalenia. Súbežne bežia
  iné úlohy. Výkon pre Richtárika treba merať až na prototype (A/B striedavo, CPU 4×).
- **Nedostupné pre automat (ochranu som neobchádzal):** Awwwards (`curl` → `000`, tunel proxy sa zavrel), Codrops
  `tympanus.net` (`curl` aj WebFetch → `403`), Land-book a Lapa Ninja (`403`), SiteInspire (`429`), `github.com`
  (`403` cez proxy, `gh api` → „GitHub access to this repository is not enabled“). Godly vracia `200`, no zoznam
  webov sa skladá až v JS (v HTML nie sú odkazy), preto som ho nepoužil. Pri Codrops a Awwwards preto uvádzam
  opis z vyhľadávača (WebSearch) a referencie označujem „nezachytené“.
- **Disk:** koreňový disk mal počas práce voľných len 3 MB – 280 MB (`df -h /` → `100%`). Zapĺňajú ho súbežné
  úlohy, môj priečinok má 16 MB. Kvôli tomu spadli Chromium pri Heidelberg Materials a pri ukážke „Off the beaten
  path“ (`page.waitForTimeout: Page crashed`). Zmazal som len vlastné dočasné snímky (`zachyt/*/all25`, staré
  sady `*-m`) a nástroje som prerobil tak, aby na disk zapisovali len vybrané snímky v JPEG.

## 2. Prehľad referencií (dátum návštevy pri všetkých: 5. 11. 2026)

| # | Referencia | Typ | Zachytené | Hlavný princíp | Použiteľné u Richtárika |
|---|---|---|---|---|---|
| R1 | Haven Constructions – úvod | Awwwards HM 10. 6. 2026 (staviteľ) | áno, `harok-haven-m.jpg` | obrovské slovo vyjde zdola cez stierku | áno, bez opony |
| R2 | Haven Constructions – posun | to isté | áno, `harok-haven-posun.jpg` | fotka sa z rámčeka roztiahne na celú šírku; slová a fotka striedajú | áno, bez pripnutia |
| R3 | Hays Woodworking | Awwwards HM 26. 6. 2025 (stolárstvo) | áno, `harok-hays.jpg` (1440) | firemná opona sa vytiahne hore a odkryje fotku | princíp stierky áno, opona nie |
| R4 | Chrome: Stack Navigator MPA | ukážka View Transitions (Apache-2.0) | áno, `harok-vt-stack.jpg`, `harok-vt-stack-reload.jpg` | posun stránok ako v aplikácii; čierny podklad | len posun bez stmavenia |
| R5 | Chrome: Profiles MPA | ukážka View Transitions | áno, `harok-vt-profiles.jpg` | zdieľaný prvok (avatar → veľký obraz) medzi dvoma HTML | áno: dlaždica → hlavička kategórie |
| R6 | Chrome: Off the beaten path MPA | ukážka View Transitions | nie (Chromium spadol pre plný disk), kód `stiahnute/vt/otbp-*` | náhľad fotky → hero, zvyšok odíde dolu a vráti sa | áno: galéria a katalóg |
| R7 | scroll-driven-animations.style: Image Reveal | ukážka CSS | áno, `harok-sda-reveal.jpg` | `clip-path: inset()` naviazaný na posun | áno, celý web |
| R8 | Codrops: Fullscreen Clip Animation (14. 3. 2023) | článok a demo | nie (403) | celoplošná fotka sa zmení na rad/mriežku menších | úvod → mozaika zásob |
| R9 | Codrops: Image Layer Animations with Clip-Path (31. 10. 2023) | článok a demo | nie (403) | prechod vrstvami fotiek cez `clip-path` | strih ako trailer |
| R10 | Codrops: Kinetic Typography Page Transition (29. 9. 2021) | článok a demo | nie (403) | písmená sa pohnú dopredu a odkryjú ďalšiu vrstvu | inšpirácia pre vetu |
| R11 | Codrops: ImageExpansionTypography | demo | nie (403) | fotka sa pri posune rozšíri v rámci typografie | text ako okno do dvora |
| R12 | Codrops: Pinned image mask reveal on scroll (5. 9. 2025) | demo (GSAP) | nie (403) | maska fotky pri posune, **pripnutá** | len ako varovanie |
| R13 | Codrops: Double Image Hover Effects with Clip-Path (1. 3. 2023) | článok a demo | nie (403) | tá istá fotka sa odhalí druhou vrstvou pri hover | mikroanimácia dlaždíc |
| R14 | MDN: `background-clip: text` | dokumentácia | nie (text) | fotka viditeľná len v písmenách | „DVOR PLNÝ MATERIÁLU“ ako maska |
| R15 | DEV (O. Haapala, 23. 2. 2021): Modern and accessible marquee | článok | nie (text) | nekonečný pás, pri „obmedziť pohyb“ posuvný | ticker sortimentu |
| R16 | Chrome Developers: Cross-document view transitions | dokumentácia | nie (text) | `@view-transition`, `pagereveal`, limit 4 s | technické pravidlá prechodov |
| R17 | Wienerberger SK | výrobca tehál (predáva ich aj Richtárik) | áno, `harok-wienerberger.jpg` | **negatívny**: cookie okno zatemní úvod | poučenie |
| R18 | Porfix SK | výrobca pórobetónu | áno, `harok-porfix.jpg` | **negatívny**: cookie okno prekryje hook | poučenie |
| R19 | Texas Materials | dodávateľ materiálu, profil na Awwwards | áno, `harok-texas.jpg` | **negatívny**: tmavý hero bez pohybu | poučenie |
| R20 | Jonite | Awwwards Nominee 15. 9. 2025 (kamenné mriežky) | áno, `harok-jonite.jpg` (1440) | **negatívny**: do 8 s sivá plocha | poučenie |
| R21 | PIQ – Mecobat | One Page Love 2. 5. 2022 (stavebné inžinierstvo) | áno, `harok-piq.jpg` | ilustrácia sa jemne vsunie, text stojí hneď | slabý hook, ale správne poradie |

Zachytených sekvencií je 11 (R1–R5, R7, R17–R21), čo je viac ako požadovaných 5. Referencií je 21, požadovaných
bolo aspoň 15.

## 3. Referencie podrobne

### R1 Haven Constructions – úvod (telefón)
- URL: https://www.havenconstructions.com.au/ (profil: https://www.awwwards.com/sites/haven-constructions,
  Honorable Mention 10. 6. 2026, autor podľa Awwwards Dobre Agency, podľa JTB Studios ich vlastný projekt:
  https://www.jtbstudios.com.au/projects/haven-construction-company-website-design/). Navštívené 5. 11. 2026.
- Po sekundách (`zachyt/haven-m/jas.txt`, od začiatku záznamu): **0–1,3 s** celoplošná tmavomodrá plocha (jas 51–54,
  100 % tmavých px). **1,3–2,3 s** sa uprostred skladá znak firmy z dielikov. **2,33 s** spodkom vyjde slovo „Haven“,
  ktoré je široké ako displej. **2,67 s** modrá plocha odchádza hore ako stierka a slovo stúpa (jas 113).
  **3,0 s** je biela plocha, „Haven“ dole, „EST. 1990 / MELBOURNE“ a pod tým začiatok fotky (jas 241).
- Prečo je to hook: jedno slovo cez celú šírku je čitateľné aj na telefóne za zlomok sekundy. Pohyb zdola nahor
  pôsobí ako „stavanie“. Fotka pod slovom sľubuje pokračovanie a ťahá k posunu.
- Technika (odhad): preloader v JS, `transform: translateY` na slove v rámčeku s `overflow: hidden` (riadkové
  odhalenie), plocha odíde cez `translateY(-100%)` alebo `clip-path`.
- Telefón: samotný pohyb je lacný (transform), no **opona oneskorí obsah o 2,4 s** (LCP aj prvý dojem).
- U Richtárika: bez opony. Skutočná fotka dvora (A1 `u4`) je hneď viditeľná ako LCP. Nad ňou na svetlom páse
  vyjde zdola veta „Dvor plný materiálu.“ po slovách (0,1–0,8 s). Pod ňou „Stavebniny Nitra · od roku 1997“
  (fakty z dnešného webu). Žiadna farebná plocha cez celý displej.
- Riziká: tmavá alebo farebná opona (tu jas 51) porušuje pravidlo a oneskoruje LCP. Obrovské slovo pri 320 px
  potrebuje `clamp()`, inak sa zlomí.

### R2 Haven Constructions – posun (telefón)
- URL ako R1, posun po 380 px (`zachyt/haven-posun/log.json`, `harok-haven-posun.jpg`).
- Čo robí: **k00 → k02** (posun 0 → 759 px) sa fotka pod slovom z rámčeka s okrajmi roztiahne na celú šírku
  a výšku (jas klesne z 229 na 153, tmavá kuchyňa). **k04 → k06** (scrollY 1517 → 2280) stoja slová „Bespoke“ hore
  a „Luxury“ dole na rovnakom mieste a medzi nimi sa vymieňajú fotky. Sekcia je teda **pripnutá** (sticky).
  Na k06 je fotka rozmazaná počas výmeny. **k09 a ďalej** je obyčajný posun s nadpismi a projektmi.
- Prečo funguje: rast fotky dáva pocit „vstupujem dnu“. Dvojica slov s meniacou sa fotkou je ako strih v traileri.
- Technika (odhad): `transform: scale` alebo `clip-path: inset()` naviazané na posun (JS alebo
  `animation-timeline`), pripnutá sekcia cez `position: sticky` a vysoký kontajner.
- Telefón: rast fotky je lacný, ak ide cez `transform` a nie cez šírku a výšku. Pripnutie mení dĺžku stránky.
- U Richtárika: fotka dvora pod H1 začne ako karta s okrajmi 16 px a pri prvých 300 px posunu sa roztiahne na celú
  šírku (iba `clip-path: inset()` alebo `scale`, bez pripnutia). Dvojicu slov s výmenou fotiek **nerobiť
  pripnutím**. Namiesto toho rad štyroch fotiek zásob (tehly, Porfix, Stadreko, rezivo), ktoré sa odkryjú postupne
  pri bežnom posune (pozri R7).
- Riziká: pripnutie (zakázané), tmavé fotky interiéru (u nás sú fotky denné), rozmazanie pri výmene.

### R3 Hays Woodworking (počítač 1440)
- URL: https://www.hayswoodworking.com/ (Awwwards Honorable Mention 26. 6. 2025 podľa vyhľadávača:
  https://www.awwwards.com/sites/hays-woodworking-group-inc). Navštívené 5. 11. 2026.
- Po sekundách (`zachyt/hays/jas.txt`, od prvého vykreslenia): **0–0,9 s** červená plocha so znakom firmy
  (jas 59, 99 % tmavých px). **1,0–1,7 s** plocha sa vytiahne hore a odkryje fotku kuchyne s nadpisom „Custom millwork
  for homes and businesses“ (jas 86 → 144). **2,0 s** a ďalej stojí hero (jas 149, 12 % tmavých px).
- Prečo funguje: jasný firemný moment a potom „odhalenie“ ako v kine. Stierka smerom hore zodpovedá pohybu oka.
- Technika (odhad): preloader s `translateY(-100%)` na celoplošnom prvku, CSS `transition`.
- Telefón: lacné, ale obsah je skrytý ~1 s.
- U Richtárika: princíp „stierky“ áno, ale ako **svetlý pás farby papiera (#faf8f4), ktorý odíde z fotky
  dvora za 0,5 s až po tom, čo je fotka vykreslená** (napr. len pri prechode medzi zábermi v strihu, R9). Nikdy nie
  ako opona pred obsahom.
- Riziká: tmavá alebo sýta opona (jas 59), oneskorený LCP.

### R4 Chrome: Stack Navigator MPA
- URL: https://view-transitions.chrome.dev/stack-navigator/mpa/ (zbierka https://view-transitions.chrome.dev/,
  kód Apache-2.0, autor Bramus). Navštívené 5. 11. 2026.
- Čo robí (klik na správu, `harok-vt-stack.jpg`, krok 0,04 s): **0–0,2 s** stará stránka sa mierne zmenší a stmavne
  (jas 239 → 192). **0,2–0,4 s** nová stránka sa vysunie sprava cez starú. **0,4–0,56 s** vľavo ostáva tmavý pruh
  (najviac 22,9 % tmavých px v prvom zachytení, 9,6 % v druhom) a potom zmizne. Pri kliku na „Home“ (typ reload,
  `harok-vt-stack-reload.jpg`) je **0,04–0,2 s celá obrazovka čierna (jas 0)**. Nová stránka potom rastie zo stredu
  na čiernom podklade a plný jas dosiahne až o 0,56 s.
- Prečo funguje: pocit aplikácie, smer pohybu hovorí „idem hlbšie / späť“.
- Technika (z kódu `stiahnute/vt/shared.css:44–100`, `mpa.css`): `@view-transition { navigation: auto; }`,
  `body { view-transition-name: page }`, `::view-transition { background: black; }`, typy `push/pop/reload` cez
  `data-transition` (nastavuje `scripts.js` v `pageswap/pagereveal`). Pri `prefers-reduced-motion` má
  `animation-duration: 0s`.
- Telefón: snímky starej a novej stránky skladá prehliadač (kompozícia), je to lacné. Limit Chrome je 4 s na
  navigáciu (R16).
- U Richtárika: medzi podstránkami len krátke prelnutie s posunom o 8–12 px (0,25–0,35 s). **Nezmenšovať celú
  stránku, nestmavovať starú a `::view-transition` nastaviť na farbu papiera.** Pri `reload` prechod vynechať.
- Riziká: čierny podklad (namerané jas 0), stmavenie starej stránky, prechod zlyhá v prehliadačoch bez podpory
  (Firefox) a vtedy je obyčajná navigácia. To je bezpečné.

### R5 Chrome: Profiles MPA (zdieľaný prvok)
- URL: https://view-transitions.chrome.dev/profiles/mpa/ → `bramus.html`. Navštívené 5. 11. 2026.
- Čo robí (`harok-vt-profiles.jpg`): **0–0,08 s** klik, v zozname sa zvýrazní riadok. **0,08–0,28 s** malý avatar
  zo zoznamu rastie na veľký kruhový obraz v detaile a meno sa presunie do nadpisu. Zoznam sa zároveň prelína
  s textom detailu. **0,28 s** je detail hotový. Jas neklesne pod 237 a tmavých px je najviac 4,4 %.
- Prečo funguje: oko sleduje jednu vec (fotku), takže prechod medzi dvoma HTML pôsobí ako jeden priestor.
- Technika (z `stiahnute/vt/profiles.css:3–13`, `profiles.js:62, 97`): `@view-transition`, `view-transition-name:
  profile-avatar / profile-name`, mená sa nastavujú až v `pageswap/pagereveal` podľa cieľovej URL.
- Telefón: lacné, animuje sa snímka prvku.
- U Richtárika: **dlaždica kategórie v katalógu → fotka v hlavičke kategórie** (napr. Murovací materiál → Porfix).
  Tá istá skutočná fotka produktu alebo zásoby „preletí“ na miesto hlavičky. Rovnako akcia → detail akcie
  a náhľad v galérii → veľká fotka.
- Riziká: pri rozdielnych pomeroch strán sa fotka „deformuje“ (treba `object-fit: cover` a `overflow: clip` na
  `::view-transition-new`, ako v R6). Mená musia byť jedinečné na stránke.

### R6 Chrome: Off the beaten path MPA (galéria fotiek)
- URL: https://view-transitions.chrome.dev/off-the-beaten-path/mpa/. Navštívené 5. 11. 2026. Video sa nepodarilo
  zachytiť (dvakrát `Page crashed` pri plnom disku), opisujem podľa kódu `stiahnute/vt/otbp-shared-styles.css:30–75`.
- Čo robí podľa kódu: **0–0,35 s** stará stránka odíde o 2 rem dolu a zmizne (`translate: 0 2rem; opacity: 0`).
  **0,35–1,1 s** náhľad fotky sa roztiahne do veľkej fotky (`--main-duration: 0.75s`) a nadpis ide s ňou.
  Nová stránka sa objaví až potom, keď fotka prejde 75 % dráhy (`animation-delay: calc(before + main * 0.75)`).
  Na stránku sa zároveň vkladajú `speculationrules` s `prerender` (`otbp-mpa-inject-speculation-rules.js:1–5`).
- Prečo funguje: postupnosť „najprv upratať, potom hlavný ťah, potom detaily“ je ako strih vo filme.
- Technika: `view-transition-capture-mode: flat`, typy `to-detail/to-overview`, `object-fit: cover` na novej
  snímke, prerender cez Speculation Rules.
- U Richtárika: galéria dvora a predajne (`img/g/73–106`) a katalóg. Celkový čas skrátiť na ≤ 0,6 s, aby nebrzdil
  prácu (INP). Prerender len pri `hover`/`pointerdown` (moderate), aby sa nesťahovalo zbytočne na mobilných dátach.
- Riziká: dlhé trvanie (1,45 s spolu), prerender zvyšuje prenos.

### R7 scroll-driven-animations.style: Image Reveal
- URL: https://scroll-driven-animations.style/demos/image-reveal/css/ (autor Bramus). Navštívené 5. 11. 2026.
- Čo robí (`harok-sda-reveal.jpg`): pri posune je fotka najprv len úzky pás uprostred (k02, `inset(45% 20%)`).
  Pri ďalšom kroku (k03) je celá. Jas na všetkých krokoch je 216–237.
- Technika (`stiahnute/sda/image-reveal.html:16–33`): `@keyframes reveal { from { opacity: 0; clip-path:
  inset(45% 20% 45% 20%) } to { opacity: 1; clip-path: inset(0) } }`, `view-timeline-name`, `animation-timeline`,
  `animation-range: entry 25% cover 50%`. Bez JS. Podpora: Chrome 115+, Safari 26 (podľa
  https://developer.chrome.com/docs/css-ui/scroll-driven-animations), Firefox nie.
- Prečo funguje: fotka sa „otvorí ako vráta“ presne vtedy, keď na ňu človek pozrie.
- Telefón: animácia `clip-path` sa v Chrome podľa môjho odhadu prekresľuje (nie je čisto kompozitná). Pri veľkých
  fotkách treba merať pri CPU 4×. `opacity` je lacná.
- U Richtárika: pásy Zásoby, Sklad a doprava, Galéria a fotky v O nás. Odhalenie ako **„otvorenie brány dvora“**
  zo stredu do strán (`inset(0 50% 0 50%)` → `inset(0)`). Celé zabaliť do `@supports (animation-timeline: view())`
  a `@media (prefers-reduced-motion: no-preference)`. Bez podpory alebo bez JS je fotka hneď celá.
- Riziká: `opacity: 0` ako východisko skryje fotku tam, kde animácia nebeží. Preto má byť východiskový stav
  viditeľný a animácia len v `@supports`. Nepripína sa nič.

### R8 Codrops: Fullscreen Clip Animation
- URL: https://tympanus.net/codrops/2023/03/14/fullscreen-clip-animation (14. 3. 2023). Navštívené 5. 11. 2026,
  **`403` pre `curl` aj WebFetch, nezachytené**. Opis z vyhľadávača: celoplošná fotka sa animáciou `clip-path`
  zmení na rad alebo mriežku menších fotiek, tvary pripravené v nástroji Clippy.
- Hook: jedna veľká fotka sa „rozpadne“ na ponuku. To je presne prechod z dôkazu („dvor“) na výber („čo hľadáte“).
- U Richtárika: na konci úvodu sa fotka dvora zmenší a rozdelí na 4–5 dlaždíc so skutočnými fotkami zásob
  (tehly, Porfix z `bb6bbaeb`, Stadreko, rezivo), z ktorých každá je odkaz do katalógu. Vlastný kód: niekoľko
  vrstiev s rovnakou fotkou a rôznym `clip-path: inset()`.
- Riziká: viac vrstiev veľkej fotky = viac pamäte. Na telefóne len 4 dlaždice a menšia sada obrázkov.

### R9 Codrops: Image Layer Animations with Clip-Path
- URL: https://tympanus.net/codrops/2023/10/31/image-layer-animations-with-clip-path (31. 10. 2023), **nezachytené
  (403)**. Opis z vyhľadávača: prechody stránok cez vrstvené fotky a animovaný `clip-path`, spúšťa ich klik.
- Hook: niekoľko záberov rýchlo za sebou cez seba ako strih v traileri.
- U Richtárika: strih 3–5 skutočných fotiek dvora (A1, A2, A4 a detaily B) cez **svetlé** stierky. Každý záber
  má štítok ako paleta („Tehly / TermoBRIK“, „Pórobetón / Porfix“…; text z konceptu Inventúra). Nadväzuje na
  `koncept-inventura/NAVRH.md`.
- Riziká: tmavé medzivrstvy, ktoré sa v ukážkach Codrops často používajú. Na fotky treba počkať (dekódovanie),
  inak záber zabliká.

### R10 Codrops: Kinetic Typography Page Transition
- URL: https://tympanus.net/codrops/2021/09/29/kinetic-typography-page-transition (29. 9. 2021, Manoela Ilic),
  **nezachytené (403)**. Opis z vyhľadávača: písmená v pozadí sa natočia, zosilnejú a vysunú dopredu, čím odkryjú
  ďalšiu vrstvu obsahu.
- Hook: typografia ako pohybujúci sa objekt, nie len text.
- U Richtárika: len striedmo. Slová H1 vychádzajú po jednom z „drážky“ (`overflow: clip` + `translateY(100%)` → 0)
  s oneskorením 80 ms. Žiadne rotácie (čitateľnosť, „obmedziť pohyb“).
- Riziká: pohyb textu oneskoruje čítanie. Text musí byť v HTML a viditeľný bez JS.

### R11 Codrops: ImageExpansionTypography
- URL: https://github.com/codrops/ImageExpansionTypography (cez proxy `403`), **nezachytené**. Opis z vyhľadávača:
  „An animation experiment where we expand an image within some typographic element on scroll.“
- U Richtárika: v slove „DVOR“ alebo medzi slovami vety je malé okno so skutočnou fotkou dvora, ktoré sa pri
  posune rozšíri na celú fotku (prepojenie na koncept Odhalenie). Bez pripnutia: rast prebehne počas prvých
  ~40 % výšky okna.
- Riziká: ukážka používa posun naviazaný na JS. Pri pripnutí by porušila pravidlo.

### R12 Codrops: Pinned image mask reveal on scroll (varovanie)
- URL: https://tympanus.net/codrops/demos/?tag=scroll (záznam 5. 9. 2025, GSAP, mask, scroll), **nezachytené
  (403)**. Súvisiaci článok o SVG maskách pri posune s GSAP ScrollTrigger:
  https://engineered.at/articles/svg-mask-transitions-on-scroll-with-gsap-and-scrolltrigger.
- Prečo ho uvádzam: efekt masky je silný, ale stojí na **pripnutí** a cudzej knižnici. Pre Richtárika je zakázaný
  (pripína sa, zamyká posun). Z neho beriem len tvar masky (kruh alebo obdĺžnik zo stredu), nie mechaniku.

### R13 Codrops: Double Image Hover Effects with Clip-Path Animations
- URL: https://tympanus.net/codrops/2023/03/01/double-image-hover-effects-with-clip-path-animations/ (1. 3. 2023),
  **nezachytené (403)**. Opis z vyhľadávača: tá istá fotka sa pri hover odhalí v druhej vrstve cez `clip-path`,
  variácie s filtrom a transformáciou.
- U Richtárika: dlaždice katalógu a akcií. Pri hover alebo `:focus-visible` sa fotka priblíži na 1,04 a zospodu
  sa vysunie pruh „Zobraziť“ alebo cena akcie (len ceny z webu a cenníka). Na dotyk stlačenie `scale(0.98)` na
  120 ms. Žiadna druhá fotka (šetrí prenos).
- Riziká: hover na telefóne neexistuje, preto obsah pruhu musí byť dostupný aj bez neho.

### R14 MDN: `background-clip: text`
- URL: https://developer.mozilla.org/en-US/docs/Web/CSS/background-clip. Navštívené 5. 11. 2026. Hodnota `text`
  „The background is painted within (clipped to) the foreground text“. Stav Baseline: Widely available
  (od júla 2015). Odporúčania: skontrolovať kontrast, dať záložnú `background-color`, použiť `@supports`.
- U Richtárika: veta **„DVOR PLNÝ MATERIÁLU.“** veľkými písmenami a cez písmená je vidieť skutočnú fotku plného
  dvora (koncept Odhalenie). Text ostáva skutočný text (SEO, čítačky). Bez podpory alebo bez obrázka sa zobrazí
  tmavá farba písma na svetlom podklade.
- Riziká: tenké písmo = málo fotky v písmenách, treba hrubý rez. Kontrast písmen s fotkou je premenlivý, preto
  tento text nesmie byť jediným nositeľom informácie (H1 je zvlášť).

### R15 DEV: Modern and accessible marquee (ticker)
- URL: https://dev.to/olpeh/modern-and-accessible-marquee-clone-with-tailwindcss-5abb (23. 2. 2021, Olavi Haapala).
  Navštívené 5. 11. 2026. Technika: dva rovnaké zoznamy, prvý `translateX(0 → -100%)`, druhý `100% → 0`,
  30 s lineárne. Pri `prefers-reduced-motion` žiadna animácia a pás je vodorovne posuvný. Pauza pri hover.
  Článok nerieši `aria-hidden` na duplikáte ani pauzu pri fokuse. Doplniť z
  https://rocketvalidator.com/accessibility-validation/marquee (nepoužívať `<marquee>`, dať ovládanie pauzy).
- U Richtárika: pás sortimentu pod úvodom: Tehly · Pórobetón · Dlažby a ploty · Rezivo · Strechy · Izolácie…
  (len kategórie a značky, ktoré web naozaj má). Každá položka je odkaz do katalógu. Duplikát má `aria-hidden` a
  `inert`, pauza pri hover aj `:focus-within`, viditeľné tlačidlo „Zastaviť“ (WCAG 2.2.2).
- Riziká: nepretržitý pohyb môže vadiť citlivým ľuďom, preto pauza a „obmedziť pohyb“. Lacné (`transform`).

### R16 Chrome Developers: Cross-document view transitions
- URL: https://developer.chrome.com/docs/web-platform/view-transitions/cross-document. Navštívené 5. 11. 2026.
- Fakty pre implementáciu: opt-in `@view-transition { navigation: auto; }` na oboch stránkach, neplatí pre adresný
  riadok, záložky a reload. Udalosti `pageswap` a `pagereveal`, ktorých poslucháč musí byť v klasickom skripte
  v `<head>`. `<link rel="expect" blocking="render">` šetrne, lebo môže zhoršiť Web Vitals. Podpora Chrome/Edge
  126, Safari 18.2, Firefox nie. **Ak navigácia trvá dlhšie než 4 s, Chrome prechod preskočí.** Hlavný rámec
  áno, prechody v iframe sú len plánované. Pre náhľad v iframe claude.ai to znamená, že tam sa prechod
  pravdepodobne neprejaví, čo je bezpečné. Overiť to musí prototyp.

### R17 Wienerberger SK (negatívny príklad)
- URL: https://www.wienerberger.sk/. Navštívené 5. 11. 2026.
- Po sekundách (`zachyt/wienerb-m/jas.txt`): **0 s** svetlý nadpis „Váš domov si zaslúži inovatívne stavebné
  materiály“ (jas 248). **0,33 s** naskočí cookie okno a celú stránku zatemní (jas 166 → 142, 36 % tmavých px)
  a tak ostane do 8 s.
- Poučenie: prvé 3 s patria cookie oknu, nie produktu. Ak Richtárik nepotrebuje súhlas (bez reklamných
  meraní), nemá mať žiadnu lištu. Ak ju potrebuje, len malý svetlý pás dole bez zatemnenia (rozhodnutie
  majiteľa alebo orchestrátora, nie dizajnu).

### R18 Porfix SK (negatívny príklad)
- URL: https://www.porfix.sk/. Navštívené 5. 11. 2026.
- Po sekundách (`zachyt/porfix-m/jas.txt`): **0 s** hlavička a modrá fotka, **0,33 s** cookie okno zakryje ~70 %
  obrazovky, pod ním je len „ROZUMNÁ INVESTÍCIA / EFEKTÍVNA…“. Do 8 s sa nič nezmení (jas 211).
- Poučenie: rovnaké ako R17. Zároveň ukážka, že vlastné fotky skladu sú u predajcu silnejší dôkaz než
  výrobcovské vizuály.

### R19 Texas Materials (negatívny príklad)
- URL: https://texasmaterials.com/ (profil na Awwwards: https://www.awwwards.com/sites/texas-materials, ocenenie
  a dátum som pre nedostupnosť Awwwards neoveril). Navštívené 5. 11. 2026.
- Po sekundách (`zachyt/texas/jas.txt`): **0 s** prázdny červený štítok a sivé tlačidlá. **0,33 s** tmavá fotka
  stavby s červeným štítkom „PAVING THE WAY FOR TEXAS“ (jas 93, 67 % tmavých px). **0,67 s** dlhý odsek a štyri
  tlačidlá. Ďalej bez pohybu, **5 s** cookie pás.
- Poučenie: tmavá fotka s prekrytím a dlhý odsek nie sú hook. Pozitívne je len to, že tlačidlá sortimentu
  (Materials, Services…) sú hneď na prvej obrazovke. To má aj dnešný návrh Richtárika (vyhľadávanie, Zavolať).

### R20 Jonite (negatívny príklad)
- URL: https://www.jonite.com/ (Awwwards Nominee 15. 9. 2025 podľa https://www.awwwards.com/sites/jonite).
  Navštívené 5. 11. 2026, počítač 1440.
- Po sekundách (`zachyt/jonite/jas.txt`): **0–8 s** sivá plocha s drobným textom dole, **2 s** cookie okno,
  **3 s** horná lišta, **5 s** menu. Hero sa do 8 s neobjavil (HTML má 1,5 MB podľa `curl`).
- Poučenie: ťažký úvod pri pomalšom pripojení nedoručí nič. U Richtárika je prvý snímok vždy hotový obraz
  (fotka + H1) a pohyb je len nadstavba.

### R21 PIQ – Mecobat
- URL: https://piq.mecobat.it/ (One Page Love 2. 5. 2022: https://onepagelove.com/piq-mecobat). Navštívené
  5. 11. 2026.
- Po sekundách (`zachyt/piq-m/jas.txt`): **0 s** nadpis, podnadpis a odsek sú hneď. **1,33 s** sa medzi nadpis
  a odkaz vsunie ilustrácia domu a text sa posunie dole (posun rozloženia). Jas 234–241.
- Poučenie: správne poradie (text hneď, obraz potom), ale vsunutie obrázka posúva text (CLS). U Richtárika
  musí mať každý animovaný prvok rezervované miesto.

## 4. TOP 8 nápadov pre Richtárika
Poradie je podľa súčinu **sila hooku (1–5) × realizovateľnosť (1–5)**. Realizovateľnosť zahŕňa výkon na telefóne
pri CPU 4×, pravidlá majiteľa (svetlo, bez pripnutia, bez JS všetko viditeľné, „obmedziť pohyb“) a dostupné
skutočné fotky. Kód je vždy vlastný (CSS/WAAPI), bez knižnice. Texty sú len z dnešného webu (H1 a štítky podľa
konceptov Inventúra/Odhalenie, kde sú fakty už overené).

| Poradie | Nápad | Hook | Realizovateľnosť | Skóre | Inšpirácia |
|---|---|---|---|---|---|
| 1 | Veta, ktorú dokazuje fotka | 5 | 5 | **25** | R1, R10 |
| 2 | Strih ako trailer cez svetlé stierky | 5 | 4 | **20** | R9, R3, R8 |
| 3 | Fotka dvora sa pri posune otvorí na celú šírku | 4 | 4 | **16** | R2, R11 |
| 4 | Zdieľaná fotka medzi stránkami (katalóg, akcie, galéria) | 4 | 4 | **16** | R5, R6, R16 |
| 5 | Text ako okno do dvora („DVOR PLNÝ MATERIÁLU“) | 5 | 3 | **15** | R14, R11 |
| 6 | Odhalenie fotiek pri posune ako „otvorenie brány“ | 3 | 5 | **15** | R7 |
| 7 | Ticker sortimentu so zastavením | 3 | 5 | **15** | R15 |
| 8 | Mikroanimácie dlaždíc, akcií a tlačidiel | 2 | 5 | **10** | R13, R4 |

**1. Veta, ktorú dokazuje fotka (úvod, prvé 3 s).** Skutočná fotka A1 (`u4`, uličky stohov paliet pod modrou
oblohou) je od prvej snímky hotová a je to LCP. Bez opony a bez čakania na JS. Na svetlom páse nad fotkou
vychádzajú slová H1 **„Dvor plný materiálu. / Od základov po strechu.“** zdola z drážky, slovo po slove
(0,10–0,80 s, `translateY(100%) → 0` v `overflow: clip`, WAAPI). V 0,9 s sa pod nimi rozsvieti štítok „Skutočná
fotka · náš dvor v Nitre“ a tlačidlá Zavolať a Katalóg. Hook stojí na tom, že veta tvrdí a fotka to v tej istej
sekunde dokazuje. Bez JS a pri „obmedziť pohyb“ je všetko hneď na mieste. Riziko: nečakať s textom na webfont
(`font-display: optional` alebo systémové písmo pre H1).

**2. Strih ako trailer cez svetlé stierky.** Po vete (od 1,0 s) sa fotka 3–4-krát vymení za skutočné zábery zásob
(A2 ulička, B1 tehly, B4 Porfix **neupravený z `bb6bbaeb`**, B3 rezivo). Prechod robí stierka `clip-path: inset()`
nového záberu zľava doprava (0,35 s) a štítok ako na palete. Koniec je späť na A1 (≈ 4 s). Žiadna medzivrstva nie
je tmavšia než fotka. Strih beží až po dekódovaní záberov (`img.decode()`) a pri šetrení dát sa vôbec nesťahuje.
Riziko: `clip-path` na celoplošnej fotke treba zmerať (cieľ 0 snímok nad 50 ms pri CPU 4×). Ak neprejde, stierka
cez `transform: translateX` na maskujúcom ráme.

**3. Fotka dvora sa pri posune otvorí na celú šírku.** Fotka v hero začína ako karta s okrajom 16 px. Počas prvých
~300 px posunu sa okraj stratí a fotka vyplní šírku (`animation-timeline: scroll()` alebo `view()`, `clip-path:
inset()` alebo `scale`). **Nič sa nepripína**, obsah ide ďalej normálne. Bez podpory zostane karta. Riziko:
pri `scale` mäkne fotka, preto radšej `inset` z väčšej fotky.

**4. Zdieľaná fotka medzi stránkami.** `@view-transition { navigation: auto; }` na všetkých stránkach (build.py
aj ručne index.html). Fotka dlaždice v katalógu, akciách a galérii dostane `view-transition-name` až v `pageswap`
(podľa cieľovej URL) a na cieľovej stránke v `pagereveal`. Zvyšok stránky sa len prelne s posunom 8 px (0,25 s).
`::view-transition { background: var(--papier) }`, žiadne zmenšovanie a stmavovanie (poučenie z R4). Pri
`prefers-reduced-motion` a pri `navigation.activation.navigationType === 'reload'` sa prechod preskočí. Firefox
a staršie prehliadače majú obyčajnú navigáciu. Riziko: limit 4 s a vplyv na INP. Prechod nesmie byť dlhší než
0,4 s.

**5. Text ako okno do dvora.** Variant úvodu (koncept Odhalenie): „DVOR PLNÝ MATERIÁLU.“ hrubým písmom
s `background-clip: text` a fotkou A1. Po 1,2 s sa písmená roztvoria a ukáže sa celá fotka. Je to najsilnejší
vizuálny moment, ale na telefóne je drahší (maska cez celú plochu, dlhé slová pri 320 px) a potrebuje záložný
stav. Preto je až na 5. mieste. Odporúčam ho ako alternatívu pre počítač alebo ako nadpis pásu „Na našom dvore“.

**6. Odhalenie fotiek pri posune ako „otvorenie brány“.** Fotky v pásoch Zásoby, Sklad a doprava, Galéria a O nás:
`clip-path: inset(0 50% 0 50%) → inset(0)` s `animation-range: entry 10% cover 40%`, len v `@supports` a pri
`no-preference`. Východiskový stav je viditeľná fotka. Čisté CSS bez JS, nepripína sa. Ide o obdobu R7, kde jas
neklesol pod 216.

**7. Ticker sortimentu.** Pod úvodom jeden riadok kategórií a značiek (len z katalógu webu), pomalý (40–60 s na
okruh), každá položka je odkaz. Duplikát `aria-hidden` a `inert`, pauza pri hover a fokuse, tlačidlo „Zastaviť“.
Pri „obmedziť pohyb“ je pás vodorovne posuvný. Hovorí „máme všetko“ bez čísel, ktoré nesmieme vymýšľať.

**8. Mikroanimácie.** Dlaždice katalógu a akcií: `:hover/:focus-visible` priblíženie fotky 1,04 a pruh „Zobraziť“
(R13). Tlačidlá: stlačenie `scale(.98)` 120 ms, šípka sa posunie o 3 px. Štítok akcie „pečiatka“ pri vstupe do
okna (len raz). Lacné a bezpečné, ale nie je to hook, ale leštenie.

**Čo z galérií NEPREBERAŤ (overené na snímkach):** úvodné opony pred obsahom (R1 2,4 s, R3 1 s), tmavé alebo sýte
plochy cez celý displej (jas 51–59), čierny podklad prechodov (R4 jas 0), stmavenie starej stránky pri prechode
(R4), pripnuté sekcie (R2 k04–k06, R12), cookie okná so zatemnením (R17, R18), ťažké úvody (R20), vsúvanie obrázkov
s posunom textu (R21).

## 5. Ako to nadväzuje na koncepty
- `koncept-inventura` (strih so štítkami) = nápady 1 + 2. Galérie potvrdzujú, že hook má byť veta a strih, nie
  opona. Odporúčam pridať vychádzanie slov H1 zdola (R1) a stierky namiesto prelínania (R9).
- `koncept-kamera` (pohyb po jednej fotke) = blízko nápadu 3. Rast fotky pri posune je lacnejší než
  ken-burns počas úvodu.
- `koncept-odhalenie` (text ako maska) = nápad 5. Je to vizuálne najsilnejšie, ale na telefóne najrizikovejšie.
- Prechody medzi stránkami (nápad 4) a 6–8 sú nezávislé od výberu úvodu a dajú sa nasadiť na všetkých ~75
  stránkach cez `assets/site.css` a malý skript v `<head>`.
- Všetky nápady počítajú s neupravenými fotkami z `bb6bbaeb` (pas-dvor, dvor-predajna, zasoba-porfix) a bez auta.
