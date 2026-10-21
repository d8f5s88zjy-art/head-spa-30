# Sieť agentov: tok, formáty, dispečer a obnova po limite

Zadanie majiteľa (2026-10-20): „Urob si sieť agentov, ktorí budú spolupracovať pre lepšiu efektivitu.“ Šablóna je
[`../priklady/siet-tim.js`](../priklady/siet-tim.js), pravidlá v [`../SKILL.md`](../SKILL.md), časť „Sieť agentov“.
Tento súbor má diagram toku, formáty (brief, odovzdávka, stav behu), dispečera, check-in a postup obnovy.
Nástroje mimo repozitára sú v `scratchpad/siet/` (tabuľka nižšie).

## Prečo (rozbor denníkov 2026-10-20)

53 behov nástroja Workflow, 407 spustených agentov, 270 výsledkov, 105 zlyhaní, takmer všetky „You've hit your
session limit · resets HH:MM (UTC)“ (`scratchpad/siet-statistika.txt`). Najhorší beh `wf_20f36633-067`: 44 spustených,
1 výsledok, 41 zlyhaní, lebo skript po limite spúšťal ďalšie agenty, ktoré hneď padli. Ďalšie straty: čakanie na „pokračuj“
od majiteľa (hodiny), každý agent čítal celé dokumenty (ZADANIE 7 kB, PLAN 59 kB, SPEC), tri kontroly na každú dávku aj pri
malom riziku, ukladanie denníka (`uloz.sh`, find cez 559 MB) vyše 2 minúty, porty a súbory sa bili pri súbežných tímoch,
viac ako 3 ťažké agenty naraz (Playwright) sa na 4 jadrách a 15 GB spomaľovali.

## Tok: kto komu čo odovzdá

```text
 MAJITEL ---- zadanie, slova doslova, odpovede na otazky D1 -----------------------------------+
    ^                                                                                          |
    | otazky D1, vysledok s dokazom                                                            v
 ORCHESTRATOR (hlavna relacia): cita velke dokumenty, pise briefy (siet/brief/), urci riziko,
    |                           rozhoduje, vedie nastenku, commituje, pushuje, nasadzuje
    | pred KAZDYM spustenim (aj pri obnove)
    v
 DISPECER: python3 -I siet/dispecer.py --md  +  rucne: tazke procesy, strom, rozpocet, briefy
    |   limit relacie? co bezi? volne porty? prikaz na obnovu?  (dispecer nic nespusta)
    | nie -> nespusta; pri limite naplanuje prebudenie (send_later) na cas resetu + 5 min
    | ano -> Workflow({ scriptPath: siet-tim.js, args, resumeFromRunId? }), zapis do siet/behy.json
    v
 +---------------- siet-tim.js: fronta uloh podla priority, naraz najviac `sucasne` (<= 3) uloh ----------------+
 |                 a najviac `agentov_naraz` (<= 3) tazkych agentov                                              |
 |                                                                                                               |
 |  tim ulohy D1 (blok portov 8300-8309)          tim ulohy D2 (8320-8329, 8310-8319 obsadene)    ...           |
 |                                                                                                               |
 |  STAVITEL --> KONTROLORI podla rizika --> vazne nalezy? --> OPRAVAR --> KONTROLORI ... (najviac 2 kola)       |
 |  brief +        nizke: 1 (kod+vzhlad+meranie)      nie -> PASS     len vazne                                  |
 |  odovzdavky     stredne: 2 (vzhlad | kod+meranie)                  nalezy        po 3. kontrole               |
 |  predchodcov    vysoke: 3 (kod, vzhlad | meranie)                                s nalezmi -> ESKALACIA       |
 |  (z `po`)       meranie vzdy v druhej vlne (P6)                                                               |
 |                                                                                                               |
 |  kazdy tazky agent konci ODOVZDAVKA.md (<= 60 riadkov) a vrati jej cestu                                      |
 |  ZAPISOVATEL (haiku, low, jeden prikaz) -> stav-behu.json po starte a po kazdej skoncenej ulohe              |
 |  prvy null (limit) -> STOP: nic nove sa nespusti, zvysok NEOVERENE / PRERUSENE / NESPUSTENE, neobnovene       |
 +---------------------------------------------+-----------------------------------------------------------------+
                                               v
 NASTENKA: stav-behu.json + python3 -I siet/nastenka.py -> siet/STAV.md -> riadok v PRIEBEH.md
           (hodinovy check-in cez send_later alebo cron; uloz-rychle.sh raz za check-in)
                                               v
 ORCHESTRATOR: PASS -> kontrola celku, commit, push, nasadenie (P7, P9); ESKALACIA / ZLYHALO / BLOKOVANE -> otazka D1
                                               v
 MAJITEL
```

(Diagram je zámerne v čistom ASCII bez diakritiky, aby sa zobrazil rovnako v termináli, v denníku aj v diffe.)

## Nástroje v `scratchpad/siet/` (mimo repozitára)

| Súbor | Čo robí | Kto ho spúšťa |
| --- | --- | --- |
| `dispecer.py` | len číta denníky behov (`subagents/workflows/*/journal.jsonl`), prepisy zlyhaných agentov a `behy.json`; povie, čo beží, čo treba obnoviť (s presným príkazom `Workflow({scriptPath, resumeFromRunId, args})`), kedy sa limit obnoví a na ktorých portoch niekto počúva. `--md` pre človeka, `--json` pre stroj, `--beh <id>` jeden beh | orchestrátor pred každým spustením a pri check-ine |
| `nastenka.py` | z `ulohy.json` a dispečera zapíše `STAV.md` (projekty, úlohy, čo čaká na majiteľa, behy, porty) | orchestrátor po každom kroku |
| `behy.json` | evidencia behov: `scriptPath`, `args`, ručný stav (`hotovy`, `zavrety`); denník behu args neukladá, dispečer ich berie odtiaľto | orchestrátor zapíše každý nový beh hneď po spustení |
| `ulohy.json` | úlohy pre nástenku (stav, beh, ďalší krok, otázky pre majiteľa) | orchestrátor |
| `brief/` | briefy úloh (`<id>.md`, najviac 2 kB) | orchestrátor píše, agenti čítajú |
| `stav-behu.json` | nástenka bežiacej siete (zapisuje zapisovateľ zo šablóny, po STOP orchestrátor) | šablóna, orchestrátor |
| `stav-behu.priklad.json` | ukážka formátu zo skúšky | nikto, len na čítanie |
| `skuska-siet-tim.mjs` | skúška šablóny s falošnými agentmi (Node 22): `node skuska-siet-tim.mjs [cesta k skriptu] [--priklad <kam>]` | autor šablóny po každej zmene |
| `uloz-rychle.sh` | uloženie denníka bez prechodu celým scratchpadom (len textové súbory do 1 MB, jeden `find \| tar`); vypíše trvanie; `--bez-push`, `--len-kopia` na skúšku | len orchestrátor (P7), raz za check-in |

## Kto čo dostane a čo vráti

| Rola | Dostane | Nedostane | Vráti (schéma) | Model, effort |
| --- | --- | --- | --- | --- |
| staviteľ | brief, odovzdávky predchodcov (`args.odovzdavka`, `odovzdavka` úlohy, odovzdávka práce každej úlohy z `po`: staviteľa alebo posledného opravára), súbory, ktoré vlastní, 2 porty | celé dokumenty, odovzdávky súbežných úloh, rozhovor s majiteľom | `STAVBA`: hotovo, zhrnutie, súbory, commity, dôkaz, otvorené, odovzdávka | model relácie (alebo `model` úlohy); effort `effort` úlohy, inak medium (nízke) alebo high |
| kontrolór | odovzdávku staviteľa (alebo opravára), brief (kritériá), ZACIATOK.txt, 2 porty, svoje pohľady | staviteľa, ostatných kontrolórov | `KONTROLA`: ok, pohľady, nálezy (pohľad, závažnosť, dôkaz, oprava), prešlo, netestované, merania, odovzdávka | model relácie; effort high |
| opravár | vážne nálezy poslednej kontroly (JSON), odovzdávky kontrolórov, súbory, 2 porty | nízke nálezy, nové požiadavky | `STAVBA` | ako staviteľ |
| zapisovateľ stavu | jeden príkaz `python3`, ktorý zapíše počiatočný stav alebo zlúči záznam skončenej úlohy | nič iné | `ZAPIS`: zapísané, cesta, chyba | `args.model_zapisu` (predvolene haiku), low |

Dôkaz pred tvrdením platí pre všetkých (`../../tim-roly/SKILL.md`, zásada 6): `hotovo=true` a `ok=true` len s príkazom,
číslom alebo snímkou; nula nálezov je platný výsledok len s opísaným rozsahom a zoznamom `netestovane`. Šablóna to vynucuje:
kontrolór s prázdnym `preslo` (a bez nálezu), s nespraveným pohľadom (pole `pohlady`) alebo zlyhaný nie je PASS (`NEOVERENE`);
`ok=false` bez vážneho nálezu sa opravárovi odovzdá ako syntetický vážny nález (kritériá briefu nie sú splnené).

## Stavy úlohy (pole `stav` v `stav-behu.json` a vo výsledku)

| Stav | Kedy | Čo urobí orchestrátor |
| --- | --- | --- |
| `CAKA` | vo fronte, predchodca ešte beží | nič |
| `BEZI` | staviteľ, kontrola alebo oprava práve beží | nič; pri check-ine porovná s dispečerom |
| `PASS` | posledná kontrola bez vážnych nálezov | kontrola celku po všetkých úlohách, commit a push (P7) |
| `ESKALACIA` | po 3. kontrole ostali vážne nálezy (`vazne` vo výsledku) | otázka D1 majiteľovi alebo nový brief a nový beh |
| `ZLYHALO` | staviteľ alebo opravár vrátil `hotovo=false` (`dovod`) | rozhodne: iný brief, iná metóda, alebo otázka majiteľovi |
| `BLOKOVANE` | predchodca z `po` neskončil PASS | po vyriešení predchodcu nový beh len s touto úlohou |
| `NEOVERENE` | postavené, ale kontrola sa nedokončila (STOP) alebo je neúplná (kontrolór nespravil pridelený pohľad, nula nálezov bez opísaného rozsahu; dôvod je v `pri`) | pri STOP po obnove dobehne kontrola z cache a ďalej; pri neúplnej kontrole nový brief alebo nová kontrola s upresneným rozsahom (obnova by vrátila ten istý výsledok z cache) |
| `PRERUSENE` | STOP počas stavby alebo opravy (strom môže mať necommitnuté zmeny) | obnova; staviteľ má v zadaní „dokonči rozpracované, nezačínaj odznova“ |
| `NESPUSTENE` | po STOP sa už nespustila | obnova s tými istými args |
| `CHYBA` | výnimka v skripte (`pri` má správu) | oprava skriptu, zápis do Pasce |

Výsledok workflowu: `stav` = `PASS` (všetky úlohy PASS), `HOTOVE_S_VYHRADAMI` (ESKALACIA, ZLYHALO alebo BLOKOVANE),
`ZASTAVENE` (STOP: `zastavene.dovod` = `limit`, `rozpocet` alebo `vynimka`; `neobnovene` = id úloh na obnovu),
`CHYBA` (zlé args: chýbajúce polia, zlé riziko alebo effort, dvojité id, neznáma závislosť, cyklus v `po`, málo voľných
blokov portov; 0 agentov). Pole `zapis_stavu` povie, či zapisovateľ nezlyhal výnimkou (vtedy stav zapíše orchestrátor).

## Brief úlohy (najviac 2 kB; píše orchestrátor do `siet/brief/<id>.md`, číta staviteľ aj kontrolóri)

```text
# Brief D1: Stránka bez zásekov pri skrole (riziko: stredné)
Cieľ (jedna veta): …
Kritériá prijatia (čísla, metóda): p95 snímky ≤ 20 ms pri 390×844 DPR 3 CPU 4×, skrol 3×, medián; žiadna úloha > 50 ms.
Súbory, ktoré úloha vlastní: barbershop-30/assets/app.js, assets/style.css (riadky 560–600, 1180–1210).
Čo sa NESMIE zmeniť: obsah, i18n kľúče, funkcie ?film=off ?uvod=off, vzhľad (jediná viditeľná zmena: …).
Metóda merania pred/po: bash <audit>/plan/nastroje.sh <cieľ> <port> <strom> (gzip server na <port>+1); pred = commit
zo ZACIATOK.txt, po = HEAD; striedavo, medián.
Nálezy, ktoré úloha rieši (id a jedna veta; podrobnosti v <súbor>, časť <názov>, NIE celý súbor): K01 …, K02 …
Čo nečítať: PLAN.md celý, ZADANIE.md (platné pravidlá sú v args.kontext).
Testy, ktoré musia prejsť: node source/tools/app-smoke.mjs, node source/tools/i18n-test.mjs.
```

Riziko určuje orchestrátor: nízke = jeden súbor, jasný postup, ľahko vratné; stredné = viac súborov alebo meranie;
vysoké = film a WebGL, výkon na telefóne, bezpečnosť, obsah pre zákazníka, čokoľvek pred nasadením. Pri pochybnosti vyššie.
Čisto mechanická úloha (premenovanie, náhrada textu podľa zoznamu) môže mať `effort: 'low'`.

## ODOVZDAVKA.md (každý staviteľ, kontrolór a opravár, najviac 60 riadkov)

```text
# Odovzdávka: <rola> <úloha> <kolo>
Stav: <jedna veta: hotové / nehotové / zablokované a prečo>
## Čo som urobil        <súbory:riadky, commity (hash, správa)>
## Čo som zmeral        <tabuľka metrika | kritérium | pred | po | splnené; príkazy, záťaž, snímky>
## Čo ostáva            <otvorené, nález s istotou pod 8, otázka D1; netestované>
## Čo si má ďalší agent prečítať   <najviac 3 položky, pasce a príkazy>
## Porty a procesy uvoľnené        <porty, kill, prehliadače a ffmpeg ukončené, dočasné súbory nad 50 MB zmazané>
```
Úplná šablóna je `scratchpad/siet/brief/ODOVZDAVKA.md` (kontroluje ju `kontrola-briefov.py`); šablóna `siet-tim.js` posiela
agentom presne tieto názvy častí.

Cesty: `<out>/<úloha>/stavba/ODOVZDAVKA.md`, `<out>/<úloha>/kontrola-<kontrolór>-<kolo>/ODOVZDAVKA.md`,
`<out>/<úloha>/oprava-<kolo>/ODOVZDAVKA.md`. Ďalší agent dostane len cestu k poslednej odovzdávke; nikdy obsah správ
iných tímov. Orchestrátor môže dať všetkým staviteľom vlastnú odovzdávku (`args.odovzdavka`) a úlohe odovzdávku
z predošlého behu (`odovzdavka` úlohy).

## stav-behu.json (nástenka)

Zapisovateľ dostane jeden príkaz `python3 -I - <<'KONIEC_STAVU' …`: po štarte zapíše celý počiatočný stav (všetky
úlohy `CAKA`), po každej skončenej úlohe zlúči jej záznam (nahradí položku s rovnakým `id`, prepočíta `neobnovene`
a `agentov_uloh`), na konci zapíše zablokované úlohy. Zápis ide do dočasného súboru a `os.replace`, takže čitateľ nikdy
nevidí rozpísaný JSON. Ak súbor patrí inému behu (`beh` sa líši) alebo chýba, začne sa zo základu. Po STOP ho zapíše
orchestrátor z návratového poľa `stav_behu`. Ukážka: `scratchpad/siet/stav-behu.priklad.json`.

| Pole | Obsah |
| --- | --- |
| `beh`, `skript`, `datum`, `sucasne`, `agentov_naraz`, `porty`, `max_kol`, `spolocny_strom` | nastavenie behu (dátum z `args.datum`, skript nemá hodiny) |
| `zastavene` | `null`, alebo `{ dovod: 'limit' \| 'rozpocet' \| 'vynimka', uloha, agent }` (len vo výsledku, súbor po STOP zapisuje orchestrátor) |
| `ulohy[]` | `id, nazov, riziko, stav, pri, kolo, agenti, porty, odovzdavky[], prace, vazne[], kontrolori[], netestovane[]` (`prace` = odovzdávka staviteľa alebo posledného opravára, ktorú dostane nasledovník), pri ZLYHALO `dovod` |
| `neobnovene` | id úloh v stave NESPUSTENE, PRERUSENE, NEOVERENE, CAKA alebo BEZI (čo treba po obnove dobehnúť) |
| `agentov_uloh` | súčet ťažkých agentov všetkých úloh; výsledok má navyše `agentov_spustenych` (aj zapisovateľov) |

## Dispečer: pred každým spustením (robí orchestrátor)

Žiadny workflow sa nespúšťa, kým niektorý bod nesedí.

1. **Limit, bežiace behy, obnova, porty:** `python3 -I scratchpad/siet/dispecer.py --md` (alebo `--json`). Ak hlási
   limit s časom resetu v budúcnosti, nespúšťa sa nič: prebudenie (`send_later`) na čas resetu + 5 minút a riadok
   do `PRIEBEH.md`; nečaká sa na „pokračuj“ od majiteľa. Príkaz na obnovu berie orchestrátor z jeho výstupu; ak dispečer
   píše „skript používa args, ale v behy.json nie sú“, args najprv doplní, inak by obnova bežala s prázdnymi args.
2. **Ťažké agenty v celom kontajneri najviac 3.** Dispečer ukáže otvorených agentov iných behov; ťažké procesy:
   `pgrep -fc chromium; pgrep -fc ffmpeg; pgrep -fc lighthouse`. Sieť dostane `agentov_naraz = 3 − ťažkých inde`
   (najmenej 1; ak inde bežia 3, sieť čaká). Nástroj sám púšťa najviac min(16, CPU−2) = 2 agentov na workflow.
3. **Porty.** Rozsah projektu z P5; porty, na ktorých podľa dispečera niekto počúva, idú do `porty.vynechat` (šablóna
   preskočí celé bloky s nimi). Ručná kontrola rozsahu:
   `for p in $(seq 8300 8349); do (echo > /dev/tcp/127.0.0.1/$p) 2>/dev/null && echo "obsadený $p"; done`.
4. **Strom a zapisovateľ.** Pracovný strom úlohy má jedného zapisovateľa (P4); `git -C <strom> status --short` ukáže
   rozpracované zmeny prerušeného pokusu (staviteľ ich má dokončiť, nie zahodiť). Tabuľka stromov je v `PRIEBEH.md`.
   Šablóna púšťa úlohy s rovnakým `repo` po jednej (inak by staviteľ považoval necommitnuté zmeny súrodenca za prerušený
   pokus vlastnej úlohy a dve úlohy by si bili index gitu); aby úlohy bežali naraz, daj každej vlastný `git worktree`
   na vlastnej vetve (`repo` úlohy). `spolocny_strom: true` to vypne, len pre úlohy s úplne inými súbormi a bez commitov.
5. **Rozpočet.** Počet agentov podľa hlavičky šablóny (nízke 2 až 6, stredné 3 až 9, vysoké 4 až 12 na úlohu, plus
   1 + počet úloh zápisov stavu) proti týždennému limitu (P1); pri cieli „+N tokenov“ nastaviť `rezerva` a `rozpocet_na_ulohu`.
6. **Briefy.** Každá úloha má brief do 2 kB v `siet/brief/` s kritériami v číslach a `args.kontext` je do 1 500 znakov;
   veľké dokumenty zostali u orchestrátora.

Po spustení zapíše orchestrátor beh do `siet/behy.json` (`scriptPath`, presné `args`) a úlohu do `siet/ulohy.json`.

## Check-in každú hodinu a obnova po limite

1. Pred spustením siete si orchestrátor naplánuje prebudenie o hodinu (`send_later`, alebo hodinový cron, ak beží).
2. Pri prebudení spustí dispečera a `nastenka.py`, prečíta `stav-behu.json`, zapíše riadok do `PRIEBEH.md` (úlohy
   a stavy, počet agentov, čo beží) a uloží denník (`uloz-rychle.sh`) raz za check-in, nie po každom agentovi.
   Naplánuje ďalšie prebudenie.
3. Ak beh skončil `ZASTAVENE` s dôvodom `limit`: zapíše `stav_behu` do `stav-behu.json`, čas resetu vezme z dispečera
   a naplánuje prebudenie naň. Po prebudení prejde dispečera a spustí `Workflow({ scriptPath, resumeFromRunId, args })`
   s tými istými args. Nič sa nespúšťa pred resetom limitu.
4. Ak beh skončil `HOTOVE_S_VYHRADAMI`: pre každú úlohu ESKALACIA a ZLYHALO otázka D1 majiteľovi (formát
   `../../tim-roly/SKILL.md`, „Otázka majiteľovi“) alebo nový brief; BLOKOVANE čaká na predchodcu. PASS úlohy idú na
   kontrolu celku (nezávislý kontrolór, needituje), potom commit, push a nasadenie robí orchestrátor (P7, P9).

**Prečo obnova neplytvá.** Kľúč agenta v denníku je hash zadania (`"key": "v2:<sha256>"`). Hotový agent sa pri obnove
vráti z cache len vtedy, keď je jeho zadanie znak po znaku rovnaké. Šablóna preto dáva do zadaní len args a výsledky
vlastných predchodcov: žiadny čas, náhodu, počet spustených agentov ani odovzdávku súbežnej úlohy, ktorá by závisela od
poradia dobehnutia. Zapisovateľ nedostáva snímku celej siete, len záznam skončenej úlohy. Skúška to overuje dvoma
behmi s opačným časovaním (rovnaká množina zadaní) a obnovou s cache (žiadny hotový agent nebeží znova). Pri prvej
ostrej obnove over v denníku, že riadky `started` hotových agentov nemajú nové `agentId`; ak áno, zapíš to do Pasce.

## Porty v bloku úlohy (10 portov, P5)

| Port | Kto |
| --- | --- |
| +0, +1 | staviteľ (server, pomocný gzip server) |
| +2, +3 | prvý kontrolór v poradí (vysoké: kód; stredné: vzhľad; nízke: jediný) |
| +4, +5 | druhý kontrolór (vysoké: vzhľad; stredné: kód + meranie) |
| +6, +7 | tretí kontrolór (vysoké: meranie) |
| +8, +9 | opravár (obe kolá za sebou, nikdy naraz) |

Bloky idú po 10 od `porty.od`; blok, v ktorom je port z `porty.vynechat`, sa preskočí. Skript skončí `CHYBA` skôr, než
spustí agenta, keď voľných blokov nie je toľko ako úloh. Rozsahy projektov: P5 v `../SKILL.md`.

## Čo robí orchestrátor sám (nikdy agent)

- Rozhodnutia: ESKALACIA, ZLYHALO, BLOKOVANE, zmena smeru, rozsahu a obsahu; otázky majiteľovi vo formáte D1.
- Nástenka: `stav-behu.json`, `nastenka.py` (STAV.md), riadok v `PRIEBEH.md` (kroky, stavy, tabuľka stromov a portov),
  `ROZHODNUTIA.md` (P8), `behy.json` a `ulohy.json`.
- Commity do `main`, push, nasadenie, ukladacie skripty (P7); kontrola pred nasadením, nie po ňom (P9).
- Čítanie veľkých dokumentov a písanie briefov; určenie rizika; pridelenie rozsahu portov; dispečer a check-in.
- Spúšťanie meraní v tichu, keď treba porovnateľné čísla (P6).

## Skúška šablóny (falošní agenti, Node 22)

`node scratchpad/siet/skuska-siet-tim.mjs [cesta k skriptu]`: skript sa preloží ako asynchrónna funkcia s globálmi
nástroja (`agent`, `parallel`, `pipeline`, `phase`, `log`, `args`, `budget`), výstupy agentov sa vyrobia zo schém
a overia proti nim, zadania sa prehľadajú na `undefined`, `[object Object]` a `NaN`, porty súbežných agentov sa porovnajú.

- 2026-10-20: 14 behov, 76 falošných agentov: všetko PASS, limit pri 4. agentovi (0 nových po `null`), ESKALACIA po 12,
  oprava v 2. kole, ZLYHALO so závislou úlohou BLOKOVANE, rozpočet pod rezervou a na úlohu, zlyhaný kontrolór
  (NEOVERENE, druhá vlna sa nespustila), päť chybných vstupov (CHYBA, 0 agentov), `sucasne: 9` orezané na 3.
- 2026-10-21: 39 behov, 266 falošných agentov, žiadna výhrada (prvých 29 behov okolo 200 agentov, desať pribudlo po kontrole
  šablóny: `ok=false` bez nálezu, `ok=false` stále, nespravený pohľad, nula nálezov bez rozsahu, odovzdávka po oprave,
  úlohy v jednom strome, vlastné stromy, `spolocny_strom`, chýbajúci strom). Nové: rovnaké zadania pri opačnom časovaní, obnova
  s cache (žiadny hotový agent znova, živých len toľko, koľko chýbalo), príkazy zapisovateľa naozaj spustené cez bash
  a python3 nad dočasným súborom (aj apostrof, trojitý apostrof, úvodzovky a lomka v názve; súbor sa zhoduje s výsledkom),
  `porty.vynechat`, cyklus v `po`, zlý effort, `agentov_naraz` 1 a 2, výnimka zapisovateľa (zápisy sa vypnú, sieť
  dobehne), výnimka staviteľa (STOP `vynimka`), odovzdávky predchodcov a effort úlohy. Skúška zachytila štyri zámerne
  vložené chyby (počet agentov v zadaní zapisovateľa, vypnutý strop agentov, bez kódovania apostrofov, odovzdávka
  súbežnej úlohy). Opravená chyba samotnej skúšky: bez `--priklad` ignorovala cestu k skriptu a skúšala predvolený súbor.

Ostrý beh nástrojom Workflow zatiaľ nebol; pri prvom zapíš priebeh do [priebeh-workflowov.md](priebeh-workflowov.md)
a over `model: 'haiku'` pre zapisovateľa (inak `model_zapisu: ''`).
