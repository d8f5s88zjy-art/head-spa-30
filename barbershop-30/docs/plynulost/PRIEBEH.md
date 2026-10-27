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
- 09:46 UTC: zmena 4 (790c05c, L5 plynulý skrol) – na statickej snímke nevidno; pri skúške skoku na Služby čierna snímka po 250 ms (aj lišta), po 1 s v poriadku; zapísané do POZIADAVKY-MAJITELA.md bod 3 na overenie kontrolórom vzhľadu bez záťaže.
- 09:50 UTC: majiteľ chce fotky na telefóne vidno tak dobre ako na PC → spustený wf_ef28985d-af9 (fakty výrez/ostrosť, prototypy A dnes / B celá fotka s rozmazaným pozadím / C pomalý prejazd po celej fotke, porota, skeptik); L4 (menšie fotky) definitívne nie.
- 09:45 UTC: staviteľ upravil commit L5 (790c05c → 6fb8811, app.js +4/−2, bez zmeny vzhľadu) – nové snímky netreba.

## 21. 10. 11:05 UTC – po limite (reset 11:00) a reštarte kontajnera

- Okolo 10:00 UTC limit relácie: stavba B (L5 hotová ako 3346f80, L6 rozpracovaná v style.css – záloha stavba/zaloha/B-necommitnute-1102.patch), preverenie balíka (meranie, rozhodnutie, kontrola) a fotky-ako-PC (oba agenti) nedobehli. Kontajner sa reštartoval (cron a monitor zanikli, osirelé servery a testy už nebežia).
- Obnovené: wf_07e3c3f8-c74 (B s poznámkou o pokračovaní; A z cache), wf_ef28985d-af9. Preverenie wf_ca750fba-5a6 odložené do dobehnutia stavby (šetrenie limitu, meranie bez súbežnej záťaže).
- Z preverenia hotové verdikty bezpečnosti: pages.yml prevziať; 404 koreň upraviť (dva main, hidden); ftp-balik prevziať; vernost prevziať (právny text odsúhlasí majiteľ); admin upraviť (gzip 20 689 > 20 000, README s $CODEX_…, API verzia 2026-03-10 neoverená, chýba kontrola práva zápisu, robots Disallow /admin/); pracovna-siet odmietnuť; D6a-0 upraviť; D6a upraviť.
- 11:06 UTC: cron 133d4a7c (hodinový check-in, nový text), monitor bn89xwdkc (commity hs-lahky od 3346f80), send_later trig_01LdqonELmkjX2pJMa7njvYw (13:04 UTC záložná kontrola 4).
- 11:19 UTC check-in: limit neplatí, disk 2,4 GB; bežia stavba B (wf_07e3c3f8-c74) a fotky ako PC (wf_ef28985d-af9, fakty hotové, prototypy bežia); nový commit v hs-lahky nie je; preverenie čaká.
- 11:26 UTC: zmena 5 (0195615, L6 ľahké video tímu) nasnímaná a poslaná majiteľovi: PRED čierna plocha pri „Komu zveríš hlavu?“, PO video tim-slucka-864 hrá (1 hrajúce). Nástroj ukazky/skripty/snimky-video.mjs (pohľad 7).

## 21. 10. 12:00 UTC – fotky ako na PC: výsledok a otázka majiteľovi

- wf_ef28985d-af9: telefón dnes (A) ukazuje 30,8 % plochy fotky z počítača (stol 17,3 %, káva 19,7 %). Porota odporučila B (celá fotka na šírku, rozmazané okolie, text pod fotkou): 100 % scény, 3,37 px/CSS pri 430, fotky −64 % bajtov, 0 LoAF pri CPU 4×. Skeptik VYVRÁTIL B v zadanej podobe: S1 dvojexpozícia s videom tímu (L6), S2 mení kompozíciu (MASTER_BRIEF:88, TOUR_DIRECTION:57/111 – fotka cez celé okno, text na nej; výmena úvodnej fotky), S3 fotka je fyzicky malá (71×48 mm), S4 brána (hover) ≠ lite, S5 prekryv pri 375×667, S7 telefón na šírku 2,33 px/CSS. Navrhol variant 1:1.
- Vyrobil som ukážku 3 možností na Čakárni (430×932): 1 dnes, 2 celá fotka (B), 3 veľký štvorec (B 1:1, cover okolo --fx, 2,24 px/CSS) – MOZNOSTI-PRE-MAJITELA.jpg + porota/pre-majitela-porovnanie-430.jpg poslané majiteľovi s otázkou. Odporúčam 3. Implementácia až po odpovedi; pri nej vyriešiť S1, S4, S5, S7 a K1 merať zo skutočného súboru.
- 12:19 UTC check-in: limit neplatí, disk 2,1 GB; stavba: kontrola kódu a vzhľadu kolo 1 hotové, beží meranie 1; žiadny nový commit; čaká sa na voľbu majiteľa 1/2/3 pri fotkách.
- 13:10 UTC záložná kontrola 4: cron a monitor bežia, stavba (meranie 1) beží, nič na obnovu.
- 13:19 UTC check-in: limit neplatí, disk 2,1 GB; stavba stále v meraní 1 (posledný zápis pred 4 min); bez nového commitu; čaká sa na voľbu majiteľa 1/2/3.
- 13:49 UTC: oprava 1 (de67eec, skok nahor drží poslednú hotovú fotku) – snímanie skoku v headless Chromiu nespoľahlivé (prvá snímka po skoku je buď čistý ink bez lišty, alebo ešte starý pohľad), majiteľovi bez obrázka; overí kontrola kolo 2 snímkovou sondou.
- 14:06 UTC: zmeny 6+7 (b2fd4f0 bez blokujúceho skriptu, 5015ac6 prvý obraz s nadpisom aj na pomalej sieti) nasnímané Slow 4G 1/2/3,5 s a poslané. Pozorovanie: PO ostrá fotka úvodu (rohozka-m-1448, 438 kB) prichádza na pomalej sieti až ~3,5 s (DNES fasáda ~2 s), dovtedy rozmazaný náhľad – zmienené majiteľovi; prípadné zrýchlenie len so súhlasom (menšia prvá fotka = L4).
- 14:19 UTC check-in: limit neplatí; disk 1,7 GB → zmazané ukazky/*/strom (kópie commitov pre snímky, dajú sa znova vytvoriť git archive); stavba v oprave kola 1; bez nového commitu od 5015ac6.
- 14:20 UTC: zmena 8 (3582235, kotva #kontakt bez úvodu a preletu) nasnímaná 0,4/1/2 s (Fast 4G) a poslaná: PRED čierna a doskakovanie, PO kontakt hneď.
- 14:28 UTC: zmena 9 (83e21bd, fotky tímu a galérie až celé) – v Chromiu bez viditeľného rozdielu (AVIF sa v Chromiu nekreslí po kúskoch; rozdiel sa prejaví v Safari), majiteľovi bez obrázka; pozorovanie prázdnej galérie pri Slow 4G zapísané do POZIADAVKY bod 5.
- 14:48 UTC: zmena 10 (f624ee8, slučka Tím sa stiahne až po zastavení pri zábere) – šetrí dáta pri prelete, vizuálne rovnaké po zastavení; majiteľovi bez obrázka.
- 15:05 UTC: majiteľ „Pracuj more“ → preverenie balíka wf_ca750fba-5a6 obnovené bez prehliadača (skript upravený: meranie odložené na L7, rozhodnutie integruje NAD vetvu lite, skeptik len zo súborov); záloha pôvodného skriptu odovzdanie-chatgpt/overenie/skript-zaloha-pred-upravou.js.

## 21. 10. 15:20 UTC – náhľad pre majiteľa aktualizovaný na ľahký telefón + prepínač fotiek

- Náhľad (artefakt EkWkJCgMVeh6xrAUY1UoNb) prestavaný z hs-lahky f624ee8 (ukazky/skripty/nahlad-build.sh): len avif, bez source/docs; pridaný prototyp fotiek (foto-proto.css/js z fotky-ako-pc/proto) s prepínačom „Fotky 1 2 3“ vľavo dole (1 = dnes, 2 = celá fotka B, 3 = veľký štvorec; localStorage b30.foto, len v lite). Úpravy prototypu: karta s videom (Tím) sa nemení (S1 skeptika), stredové karty majú text pod fotkou (S5), variant S = cover okolo --fx. Prepínač je len v náhľade, nie vo vetve.
- Test (430×932 DPR3, všetky 3 varianty): 0 chýbajúcich súborov, 0 chýb JS, prepínač viditeľný. Kontrola kolo 2 ešte beží – náhľad je pracovný, nie finálny.
- 15:27 UTC check-in: limit neplatí, disk 3,0 GB; stavba: kontrola kolo 2 (kód, vzhľad) hotová, beží meranie 2; preverenie balíka: ROZHODNUTIE.md zapísané, beží skeptik; bez nového commitu od f624ee8; náhľad majiteľa aktualizovaný 15:20.
- 15:40 UTC: POZOR – môj test náhľadu o ~16:00 išiel omylom na port 8600, ktorý práve používa meranie 2 (D1 pred); 2–3 načítania stránky mohli krátko zaťažiť ich server. Odteraz náhľad testujem na 8690.

## 21. 10. 16:10 UTC – spätná väzba majiteľa z iPhonu (vážna) a diagnostický náhľad

- Majiteľ: stále čierne obrazovky, plynulosť horšia než pred zmenami, chýba filmovosť, chce AI asistenta, žiadne čierne polia, celé fotky, bez videí na telefóne (iba 60–120 fps), zákaznícku kartu. Zapísané v POZIADAVKY-MAJITELA.md bod 6.
- Hlavná hypotéza: softvérové dekódovanie AVIF na iPhone (náhľad mal len AVIF) + brána decode → ink; Chromium to nevidí. Náhľad (artefakt v4) prestavaný: WebP namiesto AVIF (okrem tímu, 140 avif odstránených z artefaktu, 186 webp pridaných), v lite bez videí (data-video odstránené v diag.js, mriežka tímu dostane plagát), prekrytie „i“ s údajmi z telefónu. Test 430×932: 0 chýb, 0 chýbajúcich, diag funguje. Pozn.: môj test ~16:00 omylom na porte 8600 merania 2.
- Plán V2 spustený: wf_0f528734-37e (diagnóza iPhone, pohyb bez WebGL + celá fotka, asistent, zákaznícka karta → PLAN-TELEFON-V2.md, skeptik), bez prehliadača.
- Rozhodnutia majiteľa, ktoré treba: AI asistent so skutočným modelom = náklady a účet (etapa 2); zákaznícka karta = server vernost pre barbershop + tajomstvo + odmeny.
- 16:20 UTC: preverenie balíka wf_ca750fba-5a6 HOTOVÉ (odovzdanie-chatgpt/overenie/ROZHODNUTIE.md, skeptik ok, 9 opráv, 2 stredné nálezy). Rozhodnutia: prevziať upravené D2 skok z menu, D5 časť, D6a-0, D6a, D6b, D7, admin (do vetvy, nezverejniť kým neprejde bránami: gzip > 20 kB, menu na telefóne, prepis riadkov, 7,7 MB fotiek), pages.yml, 404 koreň, testy; prevziať ftp-balik, vernosť; odložiť D2 zvyšok, D3, D4, hĺbkové mapy (film na počítači = L7, GPU); odmietnuť D1 (máme), pracovna-siet, dokumenty balíka. Integrácia NAD HEAD vetvy lite až po jej kontrole; pozor rozpočet index.html 14 600 B gzip prekračuje už lite (16 477 B) – rieši tím lite. Skúšobná integrácia v odhoditeľnom klone prešla (testy bez prehliadača).
- 16:20 UTC: náhľad v5 = diagnostická verzia (WebP, bez videí, „i“); majiteľ požiadaný o snímku diagnostiky.
- 15:47 UTC záložná kontrola 5: cron a monitor bežia; bežia stavba (meranie 2) a plán V2; nič na obnovu. (Pozn.: časy 16:10/16:20 v predchádzajúcich riadkoch sú odhad, skutočný čas bol ~15:35–15:45 UTC.)

## 21. 10. 20:05 UTC – po limite (reset 20:00) a reštarte kontajnera

- Limit okolo 17:00 UTC zastavil: stavbu (meranie 2 nedobehlo; kolo 2 kód a vzhľad hotové, bez vážnych nálezov), plán V2 (hotové diagnoza.md, pohyb.md, vernost.md; nedobehol asistent a plán). Kontajner sa reštartoval (cron zanikol).
- Diagnóza iPhone (v2/diagnoza.md) potvrdila smer: P1 nedekódovaná/zahodená bitmapa = ink (LQIP len úvod), P2 3,73 MP AVIF softvérovo, P3 náhľad mal len AVIF (chýbali plagáty .webp, JPG lightboxu – čierne polia priamo!), P5 6 pevných vrstiev + transform z JS každú snímku, P9 videá rozmazané zo 576 px a 60 fps dopočítané. Náhľad v5 už má WebP a bez videí; P1/P5 rieši V1.
- 20:02 obnovené wf_07e3c3f8-c74 (meranie 2 → skeptik) a wf_0f528734-37e (asistent, plán, skeptik); cron znova (hodinový o :17), monitor b8380hg06, send_later záložná kontrola 7 o 22:35 UTC.
- Hodinový cron: text ako 15:05 + porty 8670/8671 pre snímky (nikdy 8600–8619), wf_ca750fba-5a6 je hotový.
- 20:03 UTC: pripravené LQIP náhľady (v2/lqip/lqip.json, 48 fotiek, ~400 B/ks) pre V1 – zatiaľ bez zásahu do stromu (meranie 2 beží).
- 20:25 UTC check-in: limit neplatí, disk 2,9 GB; stavba v meraní 2; plán V2 napísaný (PLAN-TELEFON-V2.md), beží skeptik; bez nového commitu; majiteľ zatiaľ neposlal snímku diagnostiky.
- 20:40 UTC: plán V2 hotový (v2/PLAN-TELEFON-V2.md, V0–V6) a skeptikom VYVRÁTENÝ v 5 bodoch → v2/REVIZIA-PO-SKEPTIKOVI.md (rámec náhľadu, P1 nedokázateľné, V3 nesmie čakať na dekódovanie, panel nesmie kaziť meranie, „čierne polia“ definuje majiteľ). Ďalší krok: po dobehnutí merania 2 stavba V1+V4+V6a (bez V1f) v hs-lahky; V2/V3 až po voľbe majiteľa; V5 etapa 1 a V6c–e paralelne bez prehliadača neskôr.
- 20:48 UTC: spustené dva behy bez prehliadača popri meraní 2: wf_d2da7410-ac8 (V5 Recepcia etapa 1, strom hs-recepcia, vetva barbershop-recepcia) a wf_3aa6720f-735 (V6a–V6e karta, strom hs-vernost, vetva barbershop-vernost); V6a vyňaté z v1-stavba.js (V1+V4 ostáva pre hs-lahky po dobehnutí wf_07e3c3f8-c74). Zlúčenie vetiev do hs-lahky až po kontrolách (merge commit, lokálne). Monitor b6192wins, cron 48327fd3 (:17), záloha trig_01CzkwVxtMqyQMZ7npFQXHV4 (22:33).

## 22. 10. 2026, 05:30 UTC – reštart po limite (reset 01:00), Richtárik úvod
- Limit 21. 10. ~21:00–01:00 UTC zastavil wf_07e3c3f8-c74 (meranie 2 nedobehlo), wf_d2da7410-ac8 (V5 stavba nedobehla) a wf_3aa6720f-735 (V6: 4 commity cbd97c2, f1a47bb, 72d9537, 1f45265 v hs-vernost hotové, kontrolóri nedobehli). Kontajner reštartovaný: cron nový ebe9560c (:17), send_later server sa nepripojil (CONNECT_TIMEOUT) – skúsiť pri check-ine.
- 05:25 UTC obnovené wf_3aa6720f-735 (kontrolóri V6) a wf_d2da7410-ac8 (V5 stavba). Meranie 2 a V1 stavba odložené – prednosť má Richtárik (posledná požiadavka majiteľa).
- Richtárik: majiteľ 21. 10. poslal 59 fotiek predajne + 1 s video (statický dvor, na príjazd nepoužiteľné) a zadanie úvodu (richtarik/uvod/BRIEF-MAJITELA.md): auto Richtárik ako animácia vchádza do predajne, plný sklad, fotky z internetu len v peknom svetle, maximálna ostrosť. Fotky v richtarik/podklady/fotky-majitel/ (103 MB), ostrosť v podklady/ostrost.txt. Spúšťam barber/workflowy/richtarik-uvod.js (inventár 3 dávky ‖ rozbor kódu → 2 art directori → sudca → stavba v hs-richtarik (vetva richtarik-web z be2d981) → vzhľad ‖ kód → opravy → skeptik; výstup richtarik/uvod/, pred-po-N.jpg pre majiteľa). Audit richtarik-audit.js zatiaľ nespustený (ide po úvode).
- 22. 10. ~06:00–10:20 UTC: druhý limit dňa zastavil Richtárik úvod pri porote (inventár 3/3, rozbor kódu, návrhy A a B hotové – richtarik/uvod/), V5 stavbu (znova nedobehla) a skeptika V6 (kontrolóri V6 dobehli: kod-2 ok, 2 stredné nálezy N2 sessionStorage v skúške a N3 umiestnenie sekcie na počítači). Majiteľ medzitým prepol model a napísal „Nepokračuje, daj oznámenie, keď budeš môcť zas pracovať“.
- 22. 10. 20:01 UTC: obnovené wf_025c0ac7-4a1 (Richtárik od poroty) a wf_3aa6720f-735 (len skeptik V6). V5 čaká, kým dobehne Richtárik. Cron po reštarte kontajnera znova vytvorený; send_later server sa nepripojil.
- 20:15 UTC: skeptik V6 VYVRÁTIL 2 body (skúška zapisovala sessionStorage; potvrdenie v skúške tvrdilo uloženie). Opravené ručne v hs-vernost commit bf26d2d (+ N3 rozloženie na počítači), test doplnený a na starej verzii padá. Zostáva: snímky sekcie a okna v prehliadači (po Richtárikovi), rozhodnutia M1–M5 majiteľa.
- 20:29 UTC check-in: Richtárik úvod v stavbe (NAVRH-UVOD.md hotový, snimky-po vznikajú); dispečer prekročil 9 s (záťaž), behy bežia.
- 21:30 UTC check-in: Richtárik úvod – stavba hotová (2316f63, ce38ae1, 3960143, b164192 po oprave kola 1), beží kontrola kolo 2 (vzhľad ‖ kód); pred-po-1.jpg existuje. Disk 1,2 GB → zmazaná vlastná kópia richtarik/strom-be2d981 (62 MB, nikde nepoužitá).
- 22:20 UTC: Richtárik úvod skončil ESKALÁCIOU (len nález „príjazd nepôsobí ako jazda“). Majiteľovi poslaný hárok pred-po-3.jpg + snímka telefónu; súkromný náhľad úvodnej stránky https://claude.ai/artifact/RD8gcHb7qm8ceinrVAW8vA (146 súborov, podstránky vedú na starý náhľad na Pages).
- 22:30 UTC: disk 0,9 GB → vyčistená vyrovnávacia pamäť pip (430 MB) a npm (~570 MB), teraz 1,9 GB. Spustený prototyp 2,5D príjazdu wf_ccecb1be-01a (výrez auta rembg/GrabCut na prázdnej ceste dvora, končí v zábere skutočnej fotky), vetva richtarik-prijazd. V5 recepcia čaká, kým dobehne prototyp (nech sa nevyčerpá limit).
- 22:30 UTC check-in: prototyp príjazdu (wf_ccecb1be-01a) v stavbe; V5 (wf_d2da7410-ac8) zámerne čaká na koniec prototypu; disk 1,5 GB.
- 23:30 UTC check-in: prototyp príjazdu postavený (02b124b), kontrola kola 1 hotová, beží oprava; V5 čaká.

## 23. 10. 2026, 00:30 UTC
- Prototyp príjazdu (wf_ccecb1be-01a): skeptik UKÁZAŤ – na telefóne auto prichádza po ceste dvora a zastaví čelom (výrez 3bd2f79b cez rembg + GrabCut na podklade 3a5b1dd2, vyretušované vzdialené IVECO). Poslané majiteľovi video telefónu + pás; druhý náhľad https://claude.ai/artifact/Hwc2pBqaSNwS5pMCsmdcfg (vetva richtarik-prijazd, 311ff2a).
- POZOR: 2 z 3 PNG v dávke majiteľa (6884937f, 7ef6f685) sú snímky e-mailov s prístupmi k doméne a hostingu starého webu (Allweb, mrhosting) vrátane hesla a AuthInfo kódu. Nepoužité nikde; moje kópie v podkladoch zmazané; v poznámkach (inventar-3.md, vyber.md) sú len opisy bez hesiel. Tretie PNG (ed765121) je e-mail „nová zákaznícka karta“ Stavebnín Richtárik – podnet na otázku, či chce majiteľ zákaznícku kartu aj na webe Richtárika.
- Spustené: doladenie príjazdu wf_5278bda4-e4a a V5 recepcia (tretí pokus) wf_d2da7410-ac8.
- 23. 10. 00:3x UTC: limit znova zastavil ladenie príjazdu (wf_5278bda4-e4a) aj V5 (tretí pokus; v hs-recepcia ostal c7ffb2f + rozpracované necommitnuté súbory). Reset 00:50.
- 04:55 UTC: majiteľ: „A chcem, aby si na tých fotkách dorobil tovar, že pôsobí, že sme naskladnení.“ Zadanie a zásady: richtarik/doplnenie/ZADANIE.md (len kópie vlastných paliet, nezrkadliť nápisy, cesta voľná). Spustený spojený beh wf_c2305f74-c95 (retuš 3 skupín ‖ ladenie príjazdu → kontrola realizmu → zladenie → záver). Cron po reštarte znova: 4e561e6c (:17).
- 05:30 UTC: majiteľ chce filmové video príjazdu z ulice do dvora s textami po bokoch („Potrebujete materiál?“…), ako z kina, silný hook. Higgsfield (44,18 kr.): úvodný obrázok gpt_image_2_5 high 2k z 5 referenčných fotiek majiteľa (2,75), Kling 3.0 std 10 s štart = obrázok (15; režim pro vyžaduje vyšší plán – nemenené), upscale ByteDance 2K 60 fps (~8). Zostatok 18,4 kr. Reframe 9:16 by stál 123 → namiesto toho výrez sledujúci auto (ffmpeg). Strih richtarik/film/strih/strih.sh: farebné doladenie, vinetácia, zrno, titulky v Barlow Condensed (len overené vety: „Staviate?“, „Potrebujete materiál?“, „Stavebný materiál v celom sortimente.“, „Dovezieme po celom Slovensku.“), prebliknutie do svetla na skutočnú fotku majiteľa + logo, adresa, telefón. Výstupy richtarik/film/vystup/ (master 16:9 a 9:16 1080p60, web 1080/720/telefón, plagáty). Poslané majiteľovi. Zapojenie do úvodu webu až po dobehnutí wf_c2305f74-c95 (píše do toho istého stromu).
- 05:30 UTC check-in: doplnenie tovaru beží (retuš A hotová: 29c67901, a5ee01ec, eb67a496; B, C, ladenie v behu); disk 1 GB → zmazaný testovací strih, vyčistené cache.
- 05:41 UTC: reštart kontajnera prerušil wf_c2305f74-c95 (hotové: retuš A, B, ladenie príjazdu a644989; prerušená retuš C). Obnovený z cache; cron znova 86a02eaf (:17).
- 06:32 UTC check-in: doplnenie beží (retuš C hotová, kontrola A kolo 1 vrátila fotky → oprava A kolo 2 beží); disk 0,9 GB.
- 07:32 UTC check-in: doplnenie – kontrola A a B v kole 2, C v kole 1 hotová; beží retuš C kolo 2; disk 0,8 GB.

## 23. 10. – Richtárik: doplnenie tovaru hotové, štart filmu v úvode, obnova recepcie
- wf_c2305f74-c95 dobehol: PASS „poslať majiteľovi“ (doplnok tovaru zámerne nenápadný – kópie vlastných paliet, žlté rámiky v porovnaní). Náhľad v2 zverejnený na rovnakú adresu https://claude.ai/artifact/Hwc2pBqaSNwS5pMCsmdcfg; majiteľ dostal pred-po-tovar.jpg a nové video príjazdu z telefónu.
- Spustený wf_fcb3e6da-505 (richtarik-film-uvod.js): film z ulice do dvora ako prvá vrstva úvodu (telefón ≤ 4 MB, raz za návštevu, Preskočiť, prechod do fotiek). strih.sh: zrno nastaviteľné premennou ZRNO.
- Obnovený V5 recepcia wf_d2da7410-ac8 (resume z cache).
- 08:33 UTC check-in: bežia wf_fcb3e6da-505 (film v úvode Richtárik) a wf_d2da7410-ac8 (V5 recepcia); uvoľnené ~0,9 GB (pracovné priečinky testovacích strihov v ref-nauka a shorts-nauka, výstupy ostali).
- 10:42 UTC: oba behy (wf_fcb3e6da-505 film-intro: stavba 5a4c2fc hotová; wf_d2da7410-ac8 V5: commity 19a107c, be841ed) padli na limite v kontrolách (reset 9:50) → obnovené cez resumeFromRunId.
- 11:24 UTC: V5 recepcia (wf_d2da7410-ac8) skončil ESKALÁCIOU – 3 kolá kontrol našli stále tú istú triedu (cena/trvanie inej služby pri nesúvisiacich slovách, iných osobách, miestach, produktoch); opravy 1–2 menili len kmene. Spustený wf_026d7e16-1b4 (v5-koren.js): pravidlá zhody v recepcia.js + slepé sady A/B, hodnotenie do čistej čerstvej sady, kontrola kódu ‖ vzhľad pred/po, skeptik. Limit váhy panelu upravený na 11 264 B (sk) / 12 800 B, lebo panel sa načíta až po ťuknutí.
- 11:40 UTC: film-intro (wf_fcb3e6da-505) NEPOSLAT – telefón ukazuje v prvých ~3,5 s skomolený vymyslený nápis na aute (počítač schválený). Spustený wf_f1c2f17c-2e4 (richtarik-film-oprava.js): 3 varianty otvorenia + porota + zapojenie + opravy site.js + kontrola + skeptik. Disk: staré snímky kola 1 prekomprimované (−511 MB).
- 25. 10. 06:01 UTC: oba behy (wf_f1c2f17c-2e4 film-oprava: varianty A, B hotové, C/porota/zapojenie padli na limite 23. 10.; wf_026d7e16-1b4 V5 koreň: sady A, B hotové, oprava padla, v hs-recepcia 11 necommitnutých zmien) obnovené cez resumeFromRunId; opravená chyba skriptu (kľúče variantov A/B/C pre porotu); C a oprava dostali poznámku o rozpracovaných súboroch. Hodinová kontrola znova vytvorená (e94d8477), lebo po prestávke zanikla. Majiteľ dostal pásy variantov A a B.
- 25. 10. 06:45 UTC check-in: bežia wf_f1c2f17c-2e4 a wf_026d7e16-1b4; disk 613 → 843 MB (staré snímky skončených kôl prekomprimované do JPEG, výrezy pri 100 % ponechané).
- 25. 10. 07:45 UTC check-in: film-oprava – porota vybrala B (neskorší štart; C veto), zapojené commit e37f7e8, beží kontrola vzhľad ‖ kód; V5 koreň – beží oprava:2. Disk 579 MB → zmazané medzivýstupy klipov A, B, C a master C (A master ponechaný pre prípad, že majiteľ chce A).
- 25. 10. 08:45 UTC check-in: V5 koreň v skeptikovi, film-oprava v kontrole kolo 2. Disk 515 MB → zmazaný redesign/cinema/zabery/tmp/seg (223 MB, dočasné segmenty z 15. 10., znova vytvoriteľné skriptom strih/01_segmenty_4k.sh).
- 25. 10. 08:48 UTC: V5 koreň (wf_026d7e16-1b4) NEPOSLAT – slepé sady čisté, ale nové triedy holých odpovedí (V1–V5) a interakcia panela. Rozhodnutie: zmena princípu (P1 úplné vysvetlenie otázky, P2 voľby, P3 cena vo výreze cenníka, P4 trvanie len pri službe, P5 hygiena kmeňov, P6 kombinatorické testy z dát); limit váhy panelu 12 288 B sk / 13 312 B. Spustený wf_1bbaf7e3-ca7 (v5-koren-2.js).
- 25. 10. 09:08 UTC: film-oprava (wf_f1c2f17c-2e4) NEPOSLAT – porota B 24,5 / A 21 / C 9 (veto), zapojené B (e37f7e8) + dotyk na šírku (f06dc96); skeptik: zdroj C-klip-2k60 má ~každú 5. snímku kópiou (~48 fps, platí aj pre schválený PC film), telefón stratil príjazd z ulice (zadanie majiteľa), f06dc96 s podpismi (amend zlyhal na overení príkazu, rieši ho nový beh). Rozhodnutie: telefón = A (z ulice). Spustený wf_8dc638c0-3f0 (richtarik-film-plynulost.js).
- 25. 10. 09:23 UTC check-in: bežia wf_8dc638c0-3f0 (plynulý zdroj) a wf_1bbaf7e3-ca7 (prestavba; sady D1, D2 hotové); disk 749 MB.
- 25. 10. 10:24 UTC check-in: wf_8dc638c0-3f0 stále pri plynulom zdroji (plynulost/ 246 MB), wf_1bbaf7e3-ca7 v oprava:2; disk 519 → 748 MB (prekomprimované nepriehľadné snímky v uvod/praca a prijazd/praca; masky a výrezy s alfou ponechané).
- 25. 10. 11:29 UTC check-in: disk klesol na 369 MB (dočasný strom hs-recepcia-pred kontroly vzhľadu V5 + videá zapojenia Richtárika). Zmazané snímky kola 1 filmu (kontrola1, kv1, kk1, oprava1); prekomprimované staré PNG v barber/audit, barber/opravy, reel/kontrola-* (929 súborov, −1,48 GB) → disk 1,9 GB. V každom dotknutom priečinku POZOR-SNIMKY-JPEG.txt: na pixelové porovnanie tieto PNG nepoužívať. Bežia: wf_1bbaf7e3-ca7 (kontrola kódu 5 ‖ vzhľad), wf_8dc638c0-3f0 (zapojenie).
- 25. 10. 12:07 UTC: V5 koreň-2 (wf_1bbaf7e3-ca7) NEPOSLAT – 4. kolo za sebou sa trieda holých cien len presúva (zámená, zložené slová, dĺžka v cm). Rozhodnutie P7: recepcia netvrdí cenu jednej služby, ukáže celú skupinu cenníka zo stránky. Spustený wf_c35fd091-d6f (v5-skupiny.js).
- 25. 10. 12:35 UTC check-in: bežia wf_8dc638c0-3f0 (zapojenie) a wf_c35fd091-d6f (prestavba P7 ‖ červený tím); disk 2,1 GB; hs-recepcia-pred neexistuje.
- 26. 10. 07:44 UTC: Majiteľ: „otváracia animácia na skrolovanie, čo ovláda zákazník, plynulé a filmové“ + „tovar na fotkách dorobený, aby vyzeral úplný“ (+ nejasné „Mráčik v richtarikovi“). Stav: wf_8dc638c0-3f0 zapojenie stihlo commit cab6b91 (B9 plynulý zdroj, telefón A z ulice) a 8425ba9 (f06dc96 bez podpisov), filmy -v3; potom týždenný limit (reset 25. 10. 22:00). V5 skupiny (wf_c35fd091-d6f) padol na limite – pozastavený do dobehnutia Richtárika. Spustený wf_93272e85-9ac (richtarik-skrol-tovar.js).
- 26. 10. 07:57 UTC: Majiteľ poslal záznam (Safari Mac, 2687b6e z origin/claude/head-spa-30-page-uil3m0) – čierne škvrny vo filmovej scéne Barbershopu, chce 4 kontroly. Worktree hs-skvrny (sparse barbershop-30, lokálna vetva barbershop-skvrny; extensions.worktreeConfig zapnuté, hlavný strom nedotknutý). Spustený wf_29dfea0a-74c (barber-cierne-skvrny.js). Hypotéza: preklopené trojuholníky pri posune do hĺbky sa nekreslia (side Front) → čierna farba plátna.
- 26. 10. 08:35 UTC check-in: bežia wf_93272e85-9ac (skrolovací film, retuš úvod; dvor a zásoba v rade) a wf_29dfea0a-74c (K1, K2; K3, K4 v rade – súbežne najviac 2 agenti na beh); disk 1,3 GB.
- 26. 10. 08:41 UTC: Majiteľ: „dokonči najskôr barber“. Richtárik (wf_93272e85-9ac) zastavený. Škvrny: hlavný beh zastavený (limit 2 agenti/beh), nahradený dvoma súbežnými krokmi (wf_b9284f8a-164 K1+K2 pokračovanie, wf_9664ed88-7db K3+K4) – 4 kontroly naraz. Ďalej ručne: oprava → overenie (2 behy) → skeptik.
- 26. 10. 08:43 UTC: Majiteľ: „nikde žiadne chyby, všetko funguje, aj SEO“ (/sep = asi SEO). Spustený celkový audit Barbershopu: wf_52d0c7fb-047 (A1 funkcie + A3 SEO), wf_3942c750-a25 (A2 vzhľad + A4 výkon/prístupnosť) – súbežne so škvrnami. Oprava auditu až po oprave škvŕn (rovnaký strom hs-skvrny, film.js patrí škvrnám).
- 26. 10. 08:47 UTC: Majiteľ chce oznámenie po dokončení Barbershopu → hodinová kontrola doplnená o PushNotification po POSLAT oboch skeptikov (aj pri otázke na majiteľa). Model relácie prepnutý na Fable 5.1; pravidlo commitov bez podpisov platí ďalej (CLAUDE.md).
- 26. 10. 08:57 UTC: Majiteľ: „zrýchli to“. Stroj: load 27 na 4 CPU (8 agentov s prehliadačmi + k3 simulácia), žiadne osirelé procesy. Zrýchlenie: 1) oprava auditu pôjde súbežne s opravou škvŕn v novom strome hs-audit (vetva barbershop-audit z 2687b6e; audit-krok.js berie strom z args.strom), potom git am záplaty auditu do hs-skvrny; 2) kroky sa spúšťajú hneď po notifikácii o dobehnutí (cron len záloha); 3) najviac 2 kolá; 4) skeptici naraz.
- 26. 10. 09:25 UTC záložný check-in: bežia 4 diagnózy (A3 SEO hotový, ostatné pracujú), load ~26; disk 659 MB → prekomprimované staré snímky filmu v richtarik/film-web (kv21, kv22, v2, v3…).
- 26. 10. 09:29 UTC: disk padal (audit-celok 360 MB snímok) → odstránený starý worktree barber/opravy/pred-D1 (388 MB, bcd487e), zmazané regenerovateľné videá (D-klip, var-B master, v2/v3), bežiaca prekomprimácia redesign/impl/kontrola-* na pozadí; disk 1,1 GB.
- 26. 10. 12:1x UTC: limit relácie (reset 12:10) zhodil všetky bežiace agenty okrem A3 SEO (hotový) a K2 (ZAPIS.md hotový: príčina = alfa plátna 0 tam, kde je hĺbka 0 → Safari skladá s alfou → čierna; + okraj strihov; oprava overená na kópii s 0 zmenou RGB). Majiteľ: „odstráň čierne škvrny čo najskôr (záznam od Lajka)“ → OPRAVA spustená hneď (wf_ced15b21-205), súbežne dobiehajú K1+K2 (wf_b9284f8a-164 resume), K3+K4 (wf_06166f34-378), A1 (wf_84f30ffb-246), A2+A4 (wf_44c0477a-43b).
- 26. 10. 12:32 UTC: Majiteľ: „pošli výsledky ešte pred limitom“. Zastavené diagnózy K1/K3/K4 a audity A1/A2/A4 (šetrenie rozpočtu), beží len oprava škvŕn (wf_ced15b21-205, film.js už upravený). Majiteľovi poslané pred-po-prve.jpg (K2 pokus-alfa vs pokus-oprava, 3 zábery) a porovnanie-majitel-vs-alfa0.jpg. Ďalej: po commite opravy rýchle overenie (1 beh, 2 kontroly s nástrojmi) a pred-po.mp4; potom audit.
- 26. 10. 12:39 UTC: Majiteľ zvolil push na NOVÚ vetvu → origin/barbershop-oprava = 102c5ee (oprava škvŕn, bez podpisov). Odkaz https://raw.githack.com/d8f5s88zjy-art/head-spa-30/102c5ee009f10ecdd9d7b86e147fa10b811872e7/barbershop-30/index.html?asistent=ukazka&objednavka=ukazka (curl 200, film.js obsahuje opravu). Spustená SEO oprava wf_7171c06e-ce7 v hs-audit (3 vážne + lacné ďalšie); po dobehnutí cherry-pick do hs-skvrny, push na barbershop-oprava (fast-forward) a nový odkaz.
- 27. 10. 06:13 UTC: Majiteľ: „Dokonči web pre Visionary.“ Stav: web visionary-living/ hotový (20 stránok, testy, náhľad github.io 200, noindex), otvorené: termín jar 2026, stav bytov, pôdorysy, formulár, doména. Spustený wf_1d57ca27-675 (vl-dokoncenie.js). Súbežne obnovená SEO oprava Barbershopu wf_7171c06e-ce7 (limit 26. 10. 17:10). Hodinová kontrola po reštarte relácie neexistuje – vytvoriť znova.
- 27. 10. 06:34 UTC: SEO oprava Barbershopu (5d7bc23 HairSalon + funkčná adresa + vlastná 404 + koreňová 404 podľa cesty; f26de28 sitemap len kanonické) cherry-pick do hs-skvrny (ba56aef, 27df97e), push origin/barbershop-oprava 102c5ee..27df97e (Pages nasadzuje len z main – nič sa nenasadilo). Odkaz https://raw.githack.com/d8f5s88zjy-art/head-spa-30/27df97e677caca310ad8ceb713e35a458ec24139/barbershop-30/index.html?asistent=ukazka&objednavka=ukazka (curl 200, HairSalon, canonical OK). Poslaný náhľad 404.
26-27. 10.: odstránené čisté porovnávacie stromy hs-pred-d1 (7ea247c) a pk (8e7b836) – obnoviteľné: git worktree add --detach <cesta> <commit>
- 27. 10. 06:58 UTC: Majiteľ poslal pohľad na Visionary a chce: nie ako dokument, viac obrázkov, filmové prechody, interakcia. Zastavený audit wf_1d57ca27-675, spustený wf_cc4a5938-b8a (vl-filmovo.js). Disk: odstránené čisté stromy hs-pred-d1 a pk → 1,4 GB.
- 27. 10. 07:07 UTC: SEO oprava Barbershopu dokončená (a3-seo offline 0 vážnych, 0 stredných; testy en 16/0, vychytavky 27/0, i18n 55/0, tma 52/0, admin 101/0; app-smoke 108/1 a objednavka 13/3 rovnako ako na 2687b6e). Prenesené 3 ďalšie commity, origin/barbershop-oprava = bdabff7. Čaká na majiteľa: nasadenie (en/ naživo 404 kým nie je main), 8 rokov recepcie, 945 recenzií, geo.
