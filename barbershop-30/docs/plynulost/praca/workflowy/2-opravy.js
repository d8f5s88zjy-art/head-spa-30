export const meta = {
  name: 'barbershop-plynulost-opravy',
  description: 'BARBERSHOP 30: opravy po dávkach podľa PLAN.md – implementácia, meranie pred/po, tri nezávislé kontroly (kód, meranie, vzhľad), opravy; záverečná kontrola celku a zápis do CHECKS.md',
  phases: [
    { title: 'Dávky', detail: 'implementácia → 3 kontroly → opravy, po dávkach za sebou' },
    { title: 'Celok', detail: 'záverečná kontrola celku, CHECKS.md' },
  ],
}
const SP = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad'
const REPO = `${SP}/hs2`
const OUT = `${SP}/barber/opravy`
const DAVKY = (args && args.davky) || []   // len {id, nazov}; úplné zadanie dávky je v davky.json a PLAN.md
const KONTEXT = `
Pracuješ na webe BARBERSHOP 30 v repozitári ${REPO} (git pracovný strom, lokálna vetva barbershop-plynulost z origin/main; web je v ${REPO}/barbershop-30/, naživo https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/). Prečítaj CELÉ: hlavné zadanie ${SP}/barber/ZADANIE.md (slová majiteľa, merateľné ciele, pravidlá, nástroje), plán ${SP}/barber/PLAN.md, ${REPO}/CLAUDE.md a dokumenty Barbershopu, ktoré zadanie menuje. Výsledky auditov a meracie nástroje (pred/po) sú v ${SP}/barber/audit/ (cierne-okna: rec.mjs, ana.py, batch.sh, suhrn.py; vykon-telefon; vzhlad-zhoda; kod-film; kod-stranka; overenie-*).
PRAVIDLÁ: commity len lokálne vo vetve barbershop-plynulost, po slovensky, BEZ podpisov a bez odkazov na nástroje, bez zmienky o AI; NIKDY nepushuj vetvu webu, nemeň main ani remote (jediný povolený push robí skript ${SP}/barber/uloz.sh do vetvy denníka). Obsah webu (texty, ceny, tím, recenzie, Booqme, i18n) sa nemení; nový viditeľný text len s kľúčom vo všetkých assets/i18n/*.json (node source/tools/i18n-test.mjs). Funkcie ostávajú (úvodný film s dverami, Späť na ulicu/Vojdi dnu, kurzor nožníc, hudba a strih, ?film=off, ?uvod=off, ?hudba=off, reduced-motion, šetrenie dát). Žiadny backdrop-filter na mobile. Komentáre po slovensky. Len skutočné fotky/videá prevádzky. Iron Law: najprv príčina, potom oprava; regresný test/meranie, ktoré bez opravy zlyhá a s ňou prejde; po troch neúspešných pokusoch na jednom probléme zastav a zapíš.
POKRAČOVANIE PO PRERUŠENÍ (limit relácie 20. 10. 11:2x UTC prerušil prvý pokus D1): ak má pracovný strom necommitnuté zmeny (git status), sú to rozpracované zmeny prerušeného pokusu tej istej dávky – záloha ${OUT}/<dávka>/rozpracovane/*.patch, poznámky, skripty a merania predošlého pokusu v ${OUT}/<dávka>/impl/ a ${OUT}/<dávka>/meranie/. Najprv ich prečítaj a over (git diff, testy, meranie pred/po), dokonči ich a commitni; nepoužiteľné časti zdôvodnene vráť (git checkout -p). Nezačínaj odznova, ak to nie je nutné.
MERANIE: presne podľa PLAN.md, časť „Meranie“: bash ${SP}/barber/audit/plan/nastroje.sh <cieľ> <port> <strom> (skopíruje overené nástroje auditu do tvojho priečinka, prepíše porty – gzip server beží na <port>+1), pred = git worktree commitu z ${OUT}/<dávka>/ZACIATOK.txt, po = HEAD; striedavo pred/po, skrol 3×, ostatné 2×, medián. Servery po sebe ukonči (kill).
TECHNIKA: Playwright cez import { createRequire } from 'module'; const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright'); – nikdy playwright install. Server: python3 -m http.server <port> v ${REPO} (port uvedený v úlohe), web na /barbershop-30/. ffmpeg v /usr/local/bin (ffprobe nie je). Snímky a hárky si VŽDY pozri (Read). Dočasné súbory > 50 MB zmaž. Výstupy do ${OUT}/<dávka>/<rola>/. Píš po slovensky so správnou diakritikou.
`
const IMPL = { type: 'object', properties: {
  hotovo: { type: 'boolean' }, commity: { type: 'array', items: { type: 'string' } }, zhrnutie: { type: 'string' },
  merania_pred_po: { type: 'string', description: 'tabuľka metrík pred a po tou istou metódou' },
  overenie: { type: 'string' }, otvorene: { type: 'array', items: { type: 'string' } },
}, required: ['hotovo', 'commity', 'zhrnutie', 'merania_pred_po', 'overenie', 'otvorene'] }
const KONTROLA = { type: 'object', properties: {
  ok: { type: 'boolean' },
  nalezy: { type: 'array', items: { type: 'object', properties: {
    zavaznost: { type: 'string', enum: ['kriticka', 'vysoka', 'stredna', 'nizka'] },
    nazov: { type: 'string' }, dokaz: { type: 'string' }, oprava: { type: 'string' },
  }, required: ['zavaznost', 'nazov', 'dokaz', 'oprava'] } },
  preslo: { type: 'array', items: { type: 'string' } }, merania: { type: 'string' },
}, required: ['ok', 'nalezy', 'preslo', 'merania'] }
const LENSY = [
  { id: 'kod', port: 8400, rola: 'Si staff recenzent kódu (tim-roly). Prečítaj diff dávky (git log a git diff od commitu pred dávkou po HEAD) riadok po riadku: správnosť, okrajové prípady (iOS Safari, Android Chrome, pomalá sieť, strata WebGL kontextu, reduced-motion, šetrenie dát, ?film=off, ?uvod=off), pretekové stavy pri rýchlom švihu a skoku z menu, úniky pamäte (textúry, ImageBitmap, pozorovatelia, časovače), regresie funkcií zo zadania, i18n, CLS, prístupnosť (klávesnica, aria). Spusti testy v source/tools (app-smoke, i18n-test, koliesko-test, atmosfera-test a ďalšie, ktoré sa dotýkajú zmeny) a node tools/build.mjs, ak sa ho zmena týka.' },
  { id: 'meranie', port: 8430, rola: 'Si QA a benchmark inžinier. Zopakuj merania pred/po TOU ISTOU METÓDOU ako audit (nástroje v ' + SP + '/barber/audit/): čierne okná (nahrávky švihu, skoku z menu, návratu hore, úvodu; Fast 4G aj Slow 4G; telefón 390×844 DPR 3 CPU 4× a počítač 1440×900) a výkon telefónu (long tasks, p95 a podiel snímok > 33 ms, INP, CLS, LCP). Meraj „pred“ na origin/main (git worktree add do ' + SP + '/barber/opravy/pred-<dávka> ak ešte nie je, server na inom porte) a „po“ na HEAD vetvy. Over akceptačné kritériá dávky číslami. Kľúčové snímky si pozri.' },
  { id: 'vzhlad', port: 8460, rola: 'Si art director a dizajnér (tim-roly, bodovanie 0–10). Porovnaj vzhľad pred/po a telefón vs. počítač v sekciách, ktorých sa dávka týka (snímky pri postupnom skrole, 390×844 a 360×780 DPR 3, 1440×900): ostrosť, orezy na výšku, prelínanie bez preblikávania, žiadne tmavé prázdne plochy, tempo pohybu, nič sa nezhoršilo. Nahraj krátke videá prechodov a pozri si snímky z nich.' },
]

const vysledky = []
let predchadzajuce = ''
for (const d of DAVKY) {
  phase('Dávky')
  let impl = await agent(`${KONTEXT}\n${predchadzajuce}\nÚLOHA – DÁVKA ${d.id}: ${d.nazov}\nÚplné zadanie dávky (cieľ, nálezy, zmeny, akceptačné kritériá, overenie, riziko) je v ${SP}/barber/workflowy/davky.json (pole davky, id „${d.id}“) a v ${SP}/barber/PLAN.md – prečítaj ho celé, aj súvisiace správy auditu v ${SP}/barber/audit/. Si senior frontend/WebGL inžinier. ÚPLNE NAJPRV zapíš východiskový commit, ak ešte nie je zapísaný: mkdir -p ${OUT}/${d.id} && [ -s ${OUT}/${d.id}/ZACIATOK.txt ] || git -C ${REPO} rev-parse HEAD > ${OUT}/${d.id}/ZACIATOK.txt. Potom zmeraj „pred“ (port 8310), potom implementuj, zmeraj „po“ tou istou metódou, spusti testy, pozri snímky pri 390 a 1440 px, commitni (po slovensky, bez podpisov) a nakoniec spusti bash ${SP}/barber/uloz.sh (uloží priebeh a záplaty do úložiska). Výstupy do ${OUT}/${d.id}/impl/.`, { label: `impl:${d.id}`, phase: 'Dávky', schema: IMPL })
  let kolo = 0, kontroly = []
  while (true) {
    kontroly = (await parallel(LENSY.map(l => () => agent(`${KONTEXT}\nÚLOHA: ${l.rola}\nKontroluješ DÁVKU ${d.id} „${d.nazov}“ nezávisle (repozitár NEMEŇ, žiadne commity; tvoje porty ${l.port + kolo * 5}–${l.port + kolo * 5 + 4}). Zadanie dávky a akceptačné kritériá: ${SP}/barber/workflowy/davky.json (id „${d.id}“) a PLAN.md; commit pred dávkou je v ${OUT}/${d.id}/ZACIATOK.txt (diff ZACIATOK..HEAD). Správa implementátora: ${JSON.stringify(impl).slice(0, 5000)}\nKaždý nález s dôkazom (príkaz, číslo, snímka, súbor:riadok). ok=true len bez kritických/vysokých/stredných nálezov a so splnenými kritériami. Výstupy do ${OUT}/${d.id}/kontrola-${l.id}${kolo ? '-' + (kolo + 1) : ''}/.`, { label: `kontrola:${d.id}:${l.id}${kolo ? '#' + (kolo + 1) : ''}`, phase: 'Dávky', schema: KONTROLA })))).map((k, i) => k && { ...k, lens: LENSY[i].id })
    const nalezy = kontroly.filter(Boolean).flatMap(k => k.nalezy.map(n => ({ ...n, lens: k.lens })))
    const vazne = nalezy.filter(n => n.zavaznost !== 'nizka')
    log(`${d.id}: kontrola ${kolo + 1} – nálezov ${nalezy.length}, vážnych ${vazne.length}`)
    if (!vazne.length || kolo >= 2) break
    impl = await agent(`${KONTEXT}\nÚLOHA: Oprav nálezy nezávislých kontrol DÁVKY ${d.id} „${d.nazov}“ (aj nízke, ak sú jasne správne). Nálezy: ${JSON.stringify(nalezy)}\nKaždý nález si najprv over (reprodukcia); nesprávny nevykonaj a zdôvodni v otvorene. Potom zmeraj, otestuj, pozri snímky, commitni a spusti bash ${SP}/barber/uloz.sh. Porty ${8320 + kolo * 5}–${8324 + kolo * 5}.`, { label: `oprava:${d.id}${kolo ? '#' + (kolo + 1) : ''}`, phase: 'Dávky', schema: IMPL })
    kolo++
  }
  vysledky.push({ davka: d.id, impl, kontroly })
  predchadzajuce += `\nUŽ HOTOVÉ: dávka ${d.id} „${d.nazov}“ – ${impl ? impl.zhrnutie.slice(0, 1200) : '(zlyhalo)'}\nOtvorené: ${impl ? impl.otvorene.join(' | ').slice(0, 800) : ''}\n`
}

phase('Celok')
const celok = await agent(`${KONTEXT}\n${predchadzajuce}\nÚLOHA: Si QA lead a art director – ZÁVEREČNÁ KONTROLA CELKU po všetkých dávkach. Zmeraj celý web proti cieľom zo ZADANIE.md časť 2 (všetky body) tou istou metódou ako audit, pred (origin/main) a po (HEAD): čierne okná vo všetkých scenároch auditu, výkon telefónu (long tasks, p95, podiel > 33 ms, INP, CLS, LCP), Lighthouse mobil a počítač (npx lighthouse alebo lighthouse z /opt/node22, ak je; inak zapíš, že nie je), vzhľad telefón vs. počítač (snímky sekcií, bodovanie 0–10), všetky funkcie zo zadania, i18n test, testy v source/tools. Port 8490. Nájdené chyby, ktoré sú jasné a malé, OPRAV a commitni (po slovensky, bez podpisov); veľké zapíš. Potom pridaj novú časť do ${REPO}/barbershop-30/docs/CHECKS.md (Plynulosť na telefóne a čierne okná, 2026-10: metodika, čísla pred/po, čo sa zmenilo, ako zopakovať meranie) a commitni. Nakoniec spusti bash ${SP}/barber/uloz.sh.`, { label: 'celok', phase: 'Celok', schema: KONTROLA })
return { vysledky, celok }
