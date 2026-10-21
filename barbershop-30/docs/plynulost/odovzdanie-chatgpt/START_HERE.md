# Pokračovanie BARBERSHOP 30 — čítaj najprv iba tento súbor

Odovzdanie na pokyn používateľa do pôvodnej relácie Claude. Cieľ je dokončiť rozpracovaný Barbershop; zachovať HEAD SPA a GYM. Dátum: 20. 10. 2026.

## Presný stav

- Repozitár: d8f5s88zjy-art/head-spa-30. Základ `c129f58124cc5d078499566e2a04ea02d6aa1eeb`.
- Lokálne dokončená revízia `556bd1c0da0c8ccf329db737e17918b9dbdf5757`, strom `4cc286ac15a26e62d2373e174ef168e2f83d59cd`. Zmeny nie sú pushnuté ani nasadené.
- Patch obsahuje D1–D5, admin, pracovnú sieť, D6a/D6b a funkčné interakcie D7. D1 je už v ňom, nepridávaj ju druhýkrát.
- D6 obsahuje hodiny/DST, overené FAQ, 7 prekladov, právne informácie a HairSalon. D7 obsahuje dekódovanie, bezpečné rušenie, prelínanie oboch vrstiev, swipe a tímové ovládanie.
- Prešlo 52 testov admin/hodiny/D7, FAQ kontrakty a assets gate. Živé read-only porovnanie: 15 služieb, 10 barberov, 34 dátumov, rozdiely 0. Podrobná evidencia je v projektovom `docs/POKRACOVANIE-2026-10-20.md` a `docs/CONTENT_SOURCES.md`.
- Browser, GPU, mobilný vzhľad, dostupnosť interakcií a výkon NIE SÚ potvrdené. Chýba Chromium a projekt jeho inštaláciu zakazuje. Tri D7 štúdie sú HTML, nie schválené screenshoty; produkčné okná E1/E2 čakajú. D6c doména/DNS čaká na rozhodnutie a prístupy.

## Prvý krok po obnovení limitu

1. Ulož vlastný rozpracovaný stav. Neprepisuj vetvu s GYM ani nepouži force push.
2. Rozbaľ prílohu. Prečítaj manifest a aplikuj `code/barbershop-30-opravy.patch` najprv v izolovanom worktree nad presným základom. Je to súhrnný git diff, nie git-am séria. Import do existujúcej rozpracovanej vetvy rieš až porovnaním, nie slepým prepisom.
3. Prečítaj projektové odovzdanie; v dostupnom pripravenom browser prostredí spusti uvedené testy a vizuálne brány. Ak nástroj chýba, zachovaj stav blocked, nič neinštaluj bez platnej výnimky.
4. Po kontrolách dokonči D7 podľa revidovaného `docs/plynulost/PLAN-D6-D7.md`. Až potom priprav zlúčenie a autorizované nasadenie; over skutočný výsledok.

Patch bol aplikovaný do samostatného dočasného indexu nad základom a vznikol presne uvedený výsledný strom. Nemá žiadne prihlasovacie údaje ani súkromné session dáta. Dostupné GitHub pripojenie v ChatGPT nepovoľuje cieľ head-spa-30, iba iný projekt barbershop30; do iného projektu sa nič nezapisovalo. Použi iba vlastný platný prístup k správnemu cieľu.

## Sieť používaj výberovo

`skill/` je úplný build-premium-websites, revízia dc350c7. 100 kapitol, 100 pôvodných zadaní, 20 odborníkov a 20 vlastných výskumníkov; zachovaných 1000 promptov. Začni SKILL.md, potom iba relevantné N/R/C súbory. Nevkladaj celý katalóg do kontextu. `documents/100-zadani-pre-senior-grafika-vfx.md` je úplný prenosný export s kontrolnými súčtami, nie povinné čítanie.

Koordinátor + najviac potrebné dvojice podľa dostupných slotov. Jediný zapisovateľ na súbor, nezávislá kontrola až po integrácii. Pri limite ulož checkpoint a zastav nové spúšťanie. Žiadne obchádzanie limitov alebo zmena predplatného.

Používateľ autorizoval výber dostupného modelu a úsilia podľa náročnosti. V ChatGPT bežná práca Sol, ohraničený výskum Luna, náročná revízia Astra high; poslednú revíziu skutočne vykonala Astra high. V Claude použi dostupné modely Claude; názvy OpenAI samy nevytvárajú prístup. Animovaný spoločník nie je pracovník.

Výskumník ukladá aktuálny primárny zdroj, dátum, revíziu a hranice platnosti. Do opakovane použiteľnej pamäte prijmi až nezávisle overený postup. Nový fakt nie je automaticky naučené pravidlo. Denný rozvrh okolo 08:00 Europe/Bratislava je vytvorený v ChatGPT; prenos súborov ho do Claude neprenesie. Nevytváraj duplicitné slučky.
