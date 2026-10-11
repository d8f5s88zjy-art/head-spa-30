# Čo sme sa naučili z referenčných videí (október 2026)

Osem videí, z ktorých niečo prešlo do projektu. Pri každom: čo video hovorí (z oEmbed popisu
alebo titulkov), čo sme si zobrali, kam to prešlo a čo nie. Tvrdenia autorov sú ich tvrdenia,
nie overené fakty.

## 1. antenucci.studio: web barbershopu

- Adresa: https://www.tiktok.com/@antenucci.studio/video/7658328292251962641
- Popis autora (oEmbed): web barbershopu postavený za pár hodín; obsahuje „cinematic video hero,
  online booking flow, service menu with pricing, mobile perfect“. Na konci výzva „DM PROMPT“
  (ignorovaná).
- Rozbor po snímkach (`barbershop-30/docs/CHECKS.md`, časť 10): text je pripnutý a mení sa len
  krytím za 0,17 až 0,2 s, kamera ide bokom až 30 % šírky za scénu, na 7 scén pripadajú 3 tvrdé
  strihy, 3 prelínania a 1 záblesk, obraz je tmavý, tlačidlá sú len v úvode a na konci.
- Čo prešlo do webu Barbershop 30: filmové titulné karty bez dosky, nadpis po slovách, texty so
  silným hookom (traja textári a porota, každý údaj so zdrojom), skutočné videá majiteľa na
  telefóne, vlastný strih pre každý prechod (tabuľka `CUTS` v `barbershop-30/assets/film.js`).
  Cesta a texty kariet: `barbershop-30/docs/TOUR_DIRECTION.md`.
- Nástroje rozboru: snímky `fps=6`, časy strihov cez `select='gt(scene,0.25)',showinfo` (s
  `-hide_banner`, pri `-v error` sa nič nevypíše), jednotlivé snímky v presných časoch (`-ss`).

## 2. jackroberts____: Magic UI

- Adresa: https://www.tiktok.com/@jackroberts____/video/7694855095170780448
- Popis autora: veľké značky nepôsobia prémiovo náhodou, robia to drobné pohyblivé detaily
  (lesklé tlačidlá, animované zoznamy, bežiaci pás log); odkaz na magicui.design.
- Čo prešlo do webu Barbershop 30 (`CHECKS.md`, časť 10): lesk na hlavnom tlačidle, bežiaci pás
  služieb, kroky strihu, tabuľa dnešných hodín, svetlo po okraji kontaktnej karty, tím a galéria
  ako pás posúvaný prstom.
- Čo nie: na HEAD SPA 30 nič z toho. `CLAUDE.md` tam zakazuje žiary, prechody farieb, efekty pod
  kurzorom, čiastočky aj poskakovanie. Referencia neprebije pravidlá projektu.
- Výkonová lekcia, ktorá z toho vyplynula: nekonečné CSS animácie mimo obrazovky pauzovať cez
  IntersectionObserver (trieda `is-off`, `animation-play-state: paused`).
- Na stiahnutie bolo treba stránku načítať znova (prvé pokusy vrátili `statusCode` 10204).

## 3. millee.md: zoznam skills na animácie

- Adresa: https://www.tiktok.com/@millee.md/video/7694728261703683349
- Popis autora: zoznam, ktorý treba dať Claude, aby robil pohybové animácie.
- Čo prešlo: `toolbox/skills-animacie/` so štyrmi skills s licenciou MIT (GSAP skills od
  GreenSock, Design DNA, Motion Design Skill od LottieFiles, Genjutsu), každý aj s textom licencie.
  Three.js skills (CloudAI-X) nemajú licenciu, preto sú len odkazom v `README.md` a `toolbox/ZDROJE.md`.
- Lekcia: pred kopírovaním cudzieho repozitára over licenciu; bez nej len odkaz.

## 4. nategold.ai: Instagram Agent

- Adresa: https://www.tiktok.com/@nategold.ai/video/7694805301538737430 (44 s, titulky eng-US ASR)
- Titulky: Claude sa pripojí na Instagram a spravuje účet; „Instagram Agent“ zadarmo, 11 skills
  ako 11 agentov: píše príspevky podľa overených vzorcov úvodnej vety, komentuje cudzie príspevky,
  vybavuje odpovede, upravuje profil, plánuje týždeň (čo, kedy, s kým). Najlepšia časť: nájde
  najúspešnejšie reels v odbore, rozoberie, prečo fungovali, a premení ich na vlastné reels.
  Inštalácia: vložiť odkaz do Claude alebo komentovať „agent“ (ignorované).
- Obraz: karta „Your Instagram team, 11 skills. One workflow.“ s menami Post Writer, Comment
  Drafter, Reply Handler, Profile Optimizer, Content Planner, Virality Engine, Hook Extractor,
  Reel Scripter, Grid Planner, Trend Watcher, Engagement Loop; plán „This week“; rozbor reelu
  (HOOK, VISUAL, STRUCTURE); scenár reelu 00, 01, 02.
- Chyby automatických titulkov: „Claw“ namiesto Claude, „variety skill“ namiesto virality.
- Repozitár `github.com/nategoldai/instagram-agent` sa nepodarilo otvoriť (prístup zamietnutý).
- Čo prešlo: vlastný skill `toolbox/skills-z-praxe/instagram-salon/`, ktorý pripravuje len
  návrhy. Automatické komentovanie a odpovedanie z účtu sme odmietli: Instagram ho obmedzuje
  a pôsobí ako spam.

## 5. rourke.heath: Higgsfield v After Effects

- Adresa: https://www.tiktok.com/@rourke.heath/video/7683918425810324758 (61 s, titulky eng-US ASR)
- Titulky a obraz: plugin Higgsfield v After Effects, panel „Supercomputer“ s modelom „GPT 6 Astra“.
  Z referenčného obrázka štýlu a jedného zadania postaví pohyblivú grafiku po vrstvách, každá vrstva
  ostane upraviteľná. Na časovej osi sú pomenované vrstvy (Glass cards, Orbit animation, Presenter
  cutout, Run progress bar, Map transition, Route + clock, logá). Príklad zadania: upraviteľný
  lower third so štatistikou hráča vo farbách a značke tímu, vložený do kompozície. Alternatíva cez
  plugin Higgsfield v ChatGPT. Je to reklama na Higgsfield; výzva „napíš AR do komentárov“ ignorovaná.
- Čo prešlo: skill `toolbox/skills-z-praxe/motion-grafika/` (kompozícia v HTML s pomenovanými
  vrstvami a časmi, render po snímkach do videa s priehľadnosťou, bez After Effects).
- Čo nie: After Effects ani plugin tu nemáme; pripojený Higgsfield v účte Claude je platený,
  preto len so súhlasom a rozpočtom majiteľa, a nikdy na vymyslené zábery podniku.

## 6. valeridoesai a 7. agilesingh: MoneyPrinterTurbo

- Adresy: https://www.tiktok.com/@valeridoesai/video/7679200985264229655 (39 s) a
  https://www.tiktok.com/@agilesingh/video/7688058236380925204 (35 s), titulky eng-US ASR.
- Titulky a obraz: bezplatný nástroj MoneyPrinterTurbo (na snímkach github.com/harry0703/MoneyPrinterTurbo
  a štítok MIT license): z jednej témy napíše scenár, nájde zábery z fotobánky, vygeneruje hlas,
  titulky, pridá hudbu a vyrenderuje 9:16, 16:9 alebo štvorec. Pripája sa na rôzne jazykové modely.
  Druhé video tvrdí aj automatické uverejnenie na TikTok, Instagram a YouTube Shorts. Počet hviezd
  sa v popise a v reči líši (115K a 125K), neoverené. Prvé video je z veľkej časti lákadlo na
  vlastný webinár („DM video“, ignorované).
- Repozitár sme neotvárali; nič z neho nie je skopírované.
- Čo prešlo: skill `toolbox/skills-z-praxe/kratke-video/` s rovnakým reťazcom (scenár, zábery,
  titulky, hlas, hudba, render), ale na skutočných záberoch a fotkách podniku, s faktami zo zdrojov
  a scenárom zo skillu `instagram-salon`.
- Čo nie: zábery z fotobánky (naše weby ukazujú len skutočný podnik), automatické uverejňovanie
  (uverejňuje majiteľ), hlas a hudba bez súhlasu a licencie.

## 8. sebintel: sada skills na web dizajn

- Adresa: https://www.tiktok.com/@sebintel/video/7695026678812167446 (35 s, titulky eng-US ASR)
- Titulky a obraz: pár open-source skills na typografiu, rozostupy, rozloženia a animácie; skill
  „taste“, aby sa dizajn inšpiroval skvelými webmi namiesto generického vzhľadu; Figma MCP a Playwright,
  aby sa web navrhol, postavil, otestoval a odfotil v jednom postupe; web stačí opísať slovami.
  Na snímkach repozitár „claude-web-design-skills“ (vlastník nečitateľný) so zoznamom 24 skills
  (typography-system, spacing-rules, layout-composer, grid-systems, responsive-reviewer, color-harmony,
  ui-component-library, landing-page-planner, accessibility-auditor, motion-principles,
  interaction-patterns, form-ux-checker, figma-mcp, design-token-manager, css-architecture,
  tailwind-helper, visual-hierarchy, wireframe-builder, hero-section-crafter, card-layouts,
  navigation-systems, playwright-tester, docs-lookup, prototype-reviewer) a repozitár „taste-skill“
  (štítok MIT). Výzva „napíš DESIGN do komentárov“ ignorovaná.
- Repozitáre sme neotvárali; nič z nich nie je skopírované.
- Čo prešlo: skill `toolbox/skills-z-praxe/web-dizajn/` (postup od zadania slovami cez vkus z referencií
  a dizajnový systém po kontrolu v prehliadači) a nástroj `scripts/dizajn-audit.mjs`, ktorý stránku
  premeria v troch šírkach a odfotí.
- Čo nie: Figma MCP v tejto relácii nie je pripojená; pravidlá projektu (`CLAUDE.md`) majú vždy
  prednosť pred „vkusom“ z referencií.

## Spoločné lekcie

- Hook pre texty: prvá veta je jasný sľub, potom obraz miesta, potom čo dostaneš a ako rezervovať.
- Rozbor rob po snímkach a s časmi; popis autora o obsahu nevypovedá.
- Každé rozhodnutie z referencie zapíš do dokumentu projektu (tu `CHECKS.md`, `TOUR_DIRECTION.md`),
  inak sa o mesiac nebude vedieť, prečo je web taký, aký je.
