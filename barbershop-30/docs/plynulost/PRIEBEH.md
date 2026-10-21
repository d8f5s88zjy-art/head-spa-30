# BARBERSHOP 30 – priebeh práce na plynulosti (denník na pokračovanie)

Každý krok sa sem zapíše a uloží do vetvy `barbershop-plynulost-dennik` (priečinok
`barbershop-30/docs/plynulost/`). Pri strate kontajnera: naklonuj repozitár, prepni sa na túto vetvu,
prečítaj `ZADANIE.md`, tento súbor a `PLAN.md` a pokračuj prvým nedokončeným krokom.

## Kde čo je

- Zadanie (hlavný prompt): `ZADANIE.md`.
- Pracovná vetva so zmenami webu: `barbershop-plynulost` (z `main`, commit `bcd487e`). Nasadenie = merge do `main`
  a push (GitHub Pages). Commity bez podpisov, po slovensky, bez zmienky o AI (CLAUDE.md).
- Výsledky meraní a skripty: `praca/` (kópia pracovného priečinka; videá a súbory nad 1 MB sa neukladajú).
- Výsledky agentov workflowu: `praca/journal-*.jsonl` (riadok `{"type":"result"}` na agenta).

## Kroky

| # | Krok | Stav | Výsledok |
| --- | --- | --- | --- |
| 1 | Zadanie s merateľnými cieľmi (`ZADANIE.md`) | hotové 19. 10. | ciele: telefón CPU 4× bez úloh > 50 ms, p95 snímky ≤ 20 ms; žiadne čierne okno > 20 % plochy dlhšie ako 150 ms; telefón rovnako ako počítač |
| 2 | Audit: 5 auditov (výkon telefón, čierne okná, vzhľad, kód filmu, kód stránky) + skeptik na každý + plán | **HOTOVÉ 20. 10. ~10:00 UTC** (11/11 agentov; nálezy po overení: výkon 9, čierne okná 6, vzhľad 12, kód filmu a stránky podľa PLAN.md; plán `PLAN.md`, dávky `praca/workflowy/davky.json`: D1 stránka bez zásekov, D2 náhľady a skok z menu, D3 film bez čiernych okien, D4 textúry mimo hlavného vlákna, D5 vzhľad telefónu). Pôvodne: audit čiernych okien hotový (7 nálezov, nižšie); ostatné prerušil limit relácie 10:40 UTC, znova spustené 11:40 UTC (`wf_ace44215-f02`, resume); 19. 10. 14:0x UTC POZASTAVENÉ na pokyn majiteľa („Barbershop až po videu“) – hotové audity vzhľad, kód filmu, kód stránky; chýba výkon telefón (dobiehal), overenie skeptikmi a plán. Pokračovať: Workflow resumeFromRunId wf_ace44215-f02 so skriptom `praca/workflowy/1-audit.js`. **20. 10. 07:25 UTC obnovené** na pokyn majiteľa („Pokračuj v barbershope“): hotových 5/5 auditov + overenie čiernych okien z cache, dobiehajú overenia vzhľad, výkon, kód filmu, kód stránky a plán | výstupy `praca/audit/`, plán `PLAN.md` |
| 3 | Opravy po dávkach s kontrolou a meraním pred/po | **20. 10. 11:2x UTC prerušené limitom relácie** (D1 rozpracovaná, necommitnutá: záloha `opravy/D1/rozpracovane/*.patch` a `zaplaty/necommitnute.patch`); **12:15 UTC obnovené**; D1 dokončená a commitnutá 7ea247c (lokálne; p95 snímky 27,5 → 18,5 ms, štýl 2,75 → 0,86 ms, dlhé úlohy 14 → 2); 13:5x limit relácie znova prerušil kontroly D1; **18:40 UTC obnovené**. **BEŽÍ** od 20. 10. (workflow `barbershop-plynulost-opravy`, args = id a názvy D1–D5; pri prerušení: Workflow resumeFromRunId so skriptom `praca/workflowy/2-opravy.js`). Pripravené: skript `praca/workflowy/2-opravy.js` (args = `{davky: plan.davky}` z výsledku auditu); každá dávka: implementácia → 3 nezávislé kontroly (kód, meranie, vzhľad) → opravy (max. 2 kolá); záverečná kontrola celku a CHECKS.md. Záplaty vetvy `barbershop-plynulost` sa ukladajú do `zaplaty/` (git am na čerstvom klone) | |
| 3b | D6 – seniorský art direction a VFX prechod podľa skillu Premium & Cinematic Web Studio (dodal majiteľ 20. 10.; v `main` c138bb9, `toolbox/skills-senior/`) | čaká na D1–D5; trasy kapitol pre D1–D5 sú už v `davky.json` (pole `skill_senior`) | |
| 3c | Seniorské použitie postupov z referencie 19 (pokyn majiteľa 20. 10.: „využi ako senior“) – po overení nástrojov (workflow `referencia-v19-pluginy`): (a) **bezpečnostná revízia** celého diffu vetvy pred nasadením (skill security-review / postup Claude Code Security Review: injekcie, XSS cez i18n a innerHTML, otvorené presmerovania, tajomstvá, závislosti z CDN) s overením každého nálezu; (b) **overenie pred tvrdením „hotovo“** (Superpowers: verification-before-completion) – každé „hotovo“ v správe dávky má čerstvý dôkaz z merania; (c) **systematické ladenie** pri D3/D4 (príčina → hypotéza → minimálny test → oprava); (d) odporúčania automatizácií pre repozitár (postup Claude Code Setup: hooks, skills, subagenti, MCP) ako návrh pre majiteľa, nič sa neinštaluje bez overenia; OmniRoute a podobné brány na iné modely nepoužívame | čaká na výsledok overenia | |
| 3d | „Zlepši a zdokonaľ, doplň, čo chýba“ (majiteľ 20. 10.): prieskum čo chýba – obsah a cesta zákazníka, technika/SEO/dôvera, porovnanie s prémiovými barbershopmi, overené fakty zo zdrojov (Booqme, Google, FB, IG) → seniorský návrh D6 (doplnenie) a D7 (art direction a VFX) + otázky pre majiteľa | HOTOVÉ 20. 10. 13:5x UTC: `PLAN-D6-D7.md` (D6a-0 rýchla oprava dvoch živých chýb – pätička „Vernostná kartička“ a 404 vedú na HEAD SPA 30; D6a dôvera a pravdivé opravy; D6b „Pred návštevou“; D6c doména a vyhľadávače; D7 art direction „Okno do miestnosti“), 24 otázok pre majiteľa (`OTAZKY-PRE-MAJITELA.md`, v repozitári `prompty/navrhy/barbershop-otazky-2026-10-20.md`). Skeptik: 1 vysoký + 4 stredné nálezy → revízia plánu HOTOVÁ 20. 10. 19:0x UTC (3 kolá; cenník bez variabilného písma – Fraunces sú statické rezy; nepotvrdené údaje skryté do odpovedí majiteľa; E1 ako <picture>/<img> s decode(); `chyba/navrh/davky-d6-d7.json` nanovo, `zhoda.py` 0 chýb). Rozpočet HTML (14 409 B gzip, rezerva 191 B) treba po zlúčení D5 zmerať znova. Implementácia D6/D7 až po D1–D5; D6a-0 môže ísť skôr (iné súbory) | |
| 3e | ADMIN pre Barbershop (majiteľ 20. 10.: „pekný, ľahký a prehľadný“): návrh – model úprav, engine z adminu HEAD SPA, tri smery s maketami, porota, `SPEC-ADMIN.md`, skeptik | BEŽÍ (workflow `barbershop-admin-navrh`); výroba po špecifikácii vo vetve `barbershop-admin` z main (nové súbory `barbershop-30/admin/`), zlúčenie po D1–D5 | |
| 4 | Záverečná kontrola, zápis do `docs/CHECKS.md`, nasadenie na `main`, overenie naživo | čaká | |
| 5 | Oznámenie majiteľovi | čaká | |

## Nálezy auditu čiernych okien (pred overením skeptikom)

1. kritická – Film: po švihu, skoku z menu alebo návrate hore je celé plátno čierne (len titulok), kým sa záber nenačíta; potom nábeh zo šera.
2. kritická – Pokojná verzia: pri výmene záloh kariet zmizne obraz na 0,15–1 s, aj keď je fotka stiahnutá (odložené dekódovanie).
3. vysoká – Pokojná verzia na pomalej sieti: pri švihu a skoku z menu je celé okno prázdne 0,4–4,7 s; záloha cieľovej karty sa sťahuje neskoro a nemá náhľad.
4. vysoká – Prvý obraz: úvod je čierny s titulkom 0,25–0,6 s (Fast 4G), 2–3 s (Slow 4G), na počítači pri Slow 4G 6,4 s.
5. stredná – Portréty tímu pri rýchlom skrole a skoku z menu neviditeľné: tmavý pás 27–33 % okna 0,7 s a viac.
6. stredná – Tmavé spodky záberov na telefóne: sud (Cestou von) a stôl (Remeslo) 30–45 % okna takmer čierne natrvalo.
7. nízka – Počítač: strih „popredie“ (čakáreň → sála ráno) nechá tmavý neostrý predmet na 36 % plochy, keď skrol zastane uprostred prechodu.

Nástroje na meranie pred/po: `praca/audit/cierne-okna/` (rec.mjs, ana.py, batch.sh, suhrn.py).

## 21. 10. 06:15 UTC – sieť agentov, limity, modely

- 20. 10. 19:30 UTC limit relácie zastavil opravy (D1 kontroly), návrh adminu (hotové: MODEL.md, ENGINE.md) aj sieť agentov
  (hotové: šablóna `toolbox/.../workflowy/priklady/siet-tim.js`, SKILL.md „Sieť agentov“, references/siet-agentov.md);
  kontajner sa v noci reštartoval, hodinový cron zanikol, záložná kontrola doručená až ráno.
- Majiteľ 20. 10.: „použi iné AI moduly, aby agenti fungovali sami, pomáhali si a každý bol senior na svoju oblasť“.
  OmniRoute NEPOUŽÍVAME (overenie v zázname 19: prihlasuje sa predplatným Claude a maskuje iné nástroje ako Claude Code,
  podmienky Anthropicu to zakazujú → riziko zablokovania účtu). Namiesto toho: smerovanie v rámci Claude – kontroly
  dávok so stredným rizikom (D1, D2, D5), porota adminu a dispečer na menšom modeli (sonnet), film (D3, D4),
  implementácia a skeptici na najsilnejšom; „fail closed“ v 2-opravy.js (po null sa nič ďalšie nespúšťa);
  najviac 3 ťažké agenty v kontajneri; hodinový check-in (cron :17) + záložný send_later pre prípad reštartu.
- 06:15 UTC obnovené: opravy wf_20f36633-067 (D1 kontroly → D2…D5), sieť wf_ef682687-713 (dispečer, skeptik);
  návrh adminu wf_45213a73-46b sa spustí po sieti.

## 21. 10. 06:50 UTC – odovzdanie od ChatGPT/Codex (cez majiteľa)

- Prijaté 3 prílohy: `ODOVZDANIE-CLAUDE.md`, `barbershop-pokracovanie-pre-claude.zip` (SHA-256 efd4b002… sedí),
  `odborna-siet-overenie-2026-10-21.json` (záznam dôkazov N06–N10, N14, N16, bez nových pravidiel; korekcia: film.js používa
  lokálny assets/vendor/three.module.min.js, three r169 – súhlasí s naším auditom).
- Patch (SHA-256 f95047d8… sedí) aplikovaný izolovane na c129f58 → strom 4cc286ac presne ako ohlásené (`scratchpad/hs-chatgpt`).
  Obsahuje našu D1 (8 súborov zhodných) + D2–D5, D6a-0/D6a/D6b, interakcie D7, admin, tools/pracovna-siet, zmeny CI a HEAD SPA 404.
- Brána cudzích návrhov: náš tím opráv (wf_20f36633-067) ZASTAVENÝ, aby nerobil D2–D5 duplicitne; návrh adminu pozastavený.
  Preverenie balíka beží (`chatgpt-patch-overenie`, wf_ca750fba-5a6): bezpečnosť a hranice ‖ prehliadač a testy ‖ meranie
  pred (naša D1, `scratchpad/hs-pred-d1`) / po → rozhodnutie po častiach → skeptik. CI skript tools/vernost-priprav.py
  prečítaný: z hesiel číta len dĺžku, nič neposiela, len verejné GET na headspa30.sk/vernost.
- Nič nie je nasadené; odovzdanie nie je súhlas na nasadenie.


## 21. 10. 06:55 UTC – sieť agentov hotová, toolbox na main

- Sieť `wf_ef682687-713` dobehla (dispečer 0,15 s, nástenka, briefy 7 rolí, uloz-rychle.sh 1–4 s, šablóna siet-tim.js: 39 skúšok, 266 falošných agentov bez výhrady).
- Kontrola siete našla a opravila: nefunkčnú stráž tajomstiev v uloz-rychle.sh a kopírovanie `video/.../cookies.txt` do kópie pre verejný repozitár. Overené: v histórii vetvy denníka ani na GitHube nie je žiadny súbor s cookies.
- Moje úpravy: kopírovanie priečinka video len pri `SIET_S_VIDEOM=1`; šablóna bez cesty k session (`stav_subor` povinný pre zápis stavu, inak vypnutý).
- Toolbox: commit da24b32 (Sieť agentov v workflowy/SKILL.md, priklady/siet-tim.js, references/siet-agentov.md), push na toolbox-premium-studio a ff na main.
- behy.json: wf_20f36633-067 a wf_45213a73-46b = pozastavené (neobnovovať, kým nerozhodne preverenie balíka). Osirelý test kontroly D1 (pid 22513, timeout 1500 s na test) a servery 8430/8432 bežia ďalej; ich ukončenie zamietol systém povolení – pri meraní preverenia ide o súbežnú záťaž (P6), zapísať k číslam.
- Integračný základ bude aktuálny main (da24b32): od c129f58 pribudol len toolbox, balík sa ho nedotýka.

## 21. 10. 07:15 UTC – súkromný náhľad pre majiteľa

- Majiteľ chcel odkaz a prehľad zmien. Živý web (https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/) D1 ešte nemá.
- Náhľad D1 (7ea247c, git archive, bez source/docs): https://claude.ai/artifact/EkWkJCgMVeh6xrAUY1UoNb (súkromný, 366 súborov, 53 MB). Kvôli limitu 511 súborov vynechané webp/jpg tam, kde je avif (317 súborov); m4a poslané ako video/mp4.
- Lokálna skúška kópie (port 8600, telefón 390×844 DPR3 a počítač 1440×900 DPR2, celý skrol): 0 chýbajúcich súborov, 0 chýb JS. Skripty a snímky: scratchpad/nahlad-skripty/.
- Po integrácii overeného balíka aktualizovať ten istý náhľad (rovnaká cesta nahlad-barber/barbershop-30/index.html).

## 21. 10. 07:08 UTC – spätná väzba majiteľa z iPhonu: „ľahký ako pierko, plynulý ako potôčik“

- Majiteľ otvoril náhľad D1 na iPhone: fotky a videá strašne zasekané, fotky neúplné, nie je to pekné. Snímky: barber/lahky-telefon/majitel-iphone-film.png, majitel-iphone-paticka.png.
- Viditeľné chyby zo snímok: (1) lišta na telefóne bez pozadia prekrýva obsah (D1 vypla backdrop-filter bez náhrady), (2) pod pätičkou prosvitá fotka ulice.
- Spustený rozbor wf_3dba6aa7-877 (film, stránka, váha; bez prehliadača kvôli meraniu preverenia) → SPEC-LAHKY-TELEFON.md → skeptik.
- Ďalej: po preverení balíka rozhodnúť základ, zmerať telefón pred (CPU 4×/6×), implementovať ľahký režim v dávkach, zmerať po, aktualizovať ten istý náhľad.
- 07:12 UTC majiteľ: „Na začiatku je čierna obrazovka.“ Zapísané do barber/lahky-telefon/POZIADAVKY-MAJITELA.md ako kritérium prvej dávky (prvý obraz = fotka z HTML, nikdy čierna; filmový pás prvých 3 s pred a po).
- 07:29 UTC check-in: limit neplatí; bežia wf_ca750fba-5a6 (preverenie: prehliadač, meranie) a wf_3dba6aa7-877 (rozbor hotový 3/3, beží špecifikácia); nič na obnovu; osirelý test D1 už nebeží.

## 21. 10. 07:45 UTC – rozbor ľahkého telefónu hotový, disk, pracovný strom

- wf_3dba6aa7-877: SPEC-LAHKY-TELEFON.md (L1–L7), skeptik DOPLNIT (8 vážnych: V1 príčina čierneho štartu – aktuálna karta vždy is-near, testovať obnovenú polohu/kotvy/jazyk; V2 okolie ±1 aj pred load; V3 brána lite len pre dotyk (hover:none, pointer:coarse, kratšia strana ≤720), nie úzke okno s myšou; V4 L2+L3+(L4a)+L5.1 len spolu; V5 pasívna sonda bez vlastného decode(); V6 bez WebP preloadu; V7 L4a znižuje ostrosť o 25 % – nerobiť bez súhlasu majiteľa; V8 film na telefóne preč = najväčšia zmena vzhľadu, ukázať majiteľovi porovnanie lite vs ?film=on).
- Disk plný (332 MB): zmazané medzivýsledky hotových úloh – reel/kontrola-ludia/{a,f,src89,src93} (1 048 PNG snímok) a referencie/v19/repo (klony cudzích repozitárov) → 4,1 GB voľných.
- Pracovný strom: scratchpad/hs-lahky, vetva barbershop-lahky-telefon z 7ea247c (D1), len lokálne.
- 07:50 UTC: spustená stavba ľahkého telefónu wf_07e3c3f8-c74 (A: L1+L2+L3, B: L5+L6; kontrola, meranie, opravy, skeptik). L4 (menšie fotky) a L7 (film na počítači) mimo – L4 len so súhlasom majiteľa.
- 08:21 UTC check-in: limit neplatí, disk 3,6 GB voľných; bežia wf_ca750fba-5a6 (preverenie: prehliadač, meranie) a wf_07e3c3f8-c74 (stavba A); commity v hs-lahky: 1; nič na obnovu.

## 21. 10. 08:45 UTC – majiteľ: „každú zmenu mi pošli, ako reálne vyzerá na webe“

- Nástroj ukazky/skripty/ukaz.sh <commit> "<názov>": git archive commitu → server 8671, PRED = hs-pred-d1 (D1) na 8670; simulovaný iPhone 390×844 DPR3 dotyk, WebGL cez SwiftShader s hlásením „Apple GPU“ (film beží ako na skutočnom iPhone); pohľady úvod 0,8/3/6 s, karta, lišta nad textom, koniec stránky; porovnania PRED|PO v ukazky/<commit>/porovnanie/*.jpg.
- Zmena 1 (0f6ffa3, lišta a koniec stránky) poslaná majiteľovi: 5-koniec-stranky.jpg (PRED: text pod lištou a fotka ulice pod pätičkou, PO: plná lišta, koniec pätičkou; pod_patickou 80 → 0 px).
- Pohľady karty a lišty pri filme sa líšia podľa načasovania filmu (PRED: rozmazaný prechod) – pri zmenách filmu posielať len pohľady, ktoré zmena mení; od L2 (lite) sú stabilné.
- Monitor b17vyvwhk sleduje nové commity v hs-lahky (30 min, obnovovať); pri každom commite: ukaz.sh a poslať majiteľovi. Náhľad (artefakt) aktualizovať až po prejdení kontrol celej dávky (medzistav L2 bez L3 by bol horší – V4).
- 08:55 UTC: zmeny 2+3 (5902aa5 lite, f1f9c4d dekódovanie) nasnímané a poslané majiteľovi (úvod, karta, lišta). Pozor: v lite je prvá fotka rohožka (ako bez prológu), nie fasáda – opýtané majiteľa. Ďalej čakám L5 a L6 (stavba B).
- 09:14 UTC záložná kontrola 3 (trig_01PgXxwfjCHx1jVQ6deEaFTF): cron 23e67415 beží; wf_20f36633-067 a wf_45213a73-46b zámerne NEOBNOVENÉ (pozastavené, nahradené balíkom a ľahkým telefónom), wf_ef682687-713 hotový.
- 09:21 UTC check-in: limit neplatí, disk 3,1 GB; stavba A hotová (3 commity), beží stavba B (L5+L6); preverenie balíka: prehliadač hotový, beží meranie; nič na obnovu.
