# Šablóna: scenár reelu (Reel Scripter)

Podľa videa nategold.ai (karta „Reel script“: 00 úvod, 01 čo to je, 02 ako to nastaviť) a rozboru
reelu (úvod je jasný sľub, v obraze tvár a rozpoznateľné miesto, stavba problém a jednoduché riešenie).

## Tri vety

| # | Úloha | Pravidlo |
| --- | --- | --- |
| 00 | sľub | jasný, v prvej vete; problém zákazníka alebo obraz miesta |
| 01 | čo dostaneš | jeden overený fakt, jednoduché riešenie |
| 02 | ako si rezervuješ | online alebo telefón, podľa zdroja |

## Výstup

```
Podnik:
Téma:
Problém zákazníka (stavba):

| # | Veta (titulok v obraze aj hovorená) | Záber | Kto je v zábere (súhlas) | Zdroj faktu |
| 00 | | | | |
| 01 | | | | |
| 02 | | | | |

Rozpoznateľné miesto: <čo v zábere povie, kde sme>
Materiál, ktorý treba natočiť: <zoznam záberov, ktoré majiteľ ešte nemá>
Treba potvrdiť: <súhlasy, neoverené fakty>
```

## Príklad: Barbershop 30

| # | Veta | Záber | Zdroj |
| --- | --- | --- | --- |
| 00 | Vzadu ťa čaká káva zdarma. | čakáreň: kreslá, retro pumpa | `CONTENT_SOURCES.md` (káva vzadu v čakárni, majiteľ 2026-10-11) |
| 01 | Osem kresiel, jedno je tvoje. | sála pod oranžovými lampami | `CONTENT_SOURCES.md` (kapacita), `index.html` |
| 02 | Rezervuj online 24/7. | rohožka s logom, dvere na Mostnej 30 | `CONTENT_SOURCES.md` (rezervácia) |

Tvár: barber, ktorý súhlasil; klienti zozadu alebo nerozpoznateľní.

## Príklad: HEAD SPA 30

| # | Veta | Záber | Zdroj |
| --- | --- | --- | --- |
| 00 | Vstúpiš s hlavou plnou chaosu. | zelené dvere so zlatými kruhmi (`docs/fotenie.md`, záber 1) | `index.html` |
| 01 | Nie umytie vlasov. Rituál pre hlavu. | misa s vodou, teplý uterák (`docs/fotenie.md`, zábery 3 a 5) | `index.html` |
| 02 | Termín si vyberieš online kedykoľvek. | ruka na kľučke (`docs/fotenie.md`, záber 2) | `index.html` (Ako si rezervujem termín?) |

Tvár: terapeutka pri práci, ak súhlasí (`docs/fotenie.md`, záber 12); klient s tvárou mimo alebo v tieni.

## Pred natáčaním

- Súhlas ľudí v zábere; deti len so súhlasom rodičov.
- Záber, ktorý majiteľ nemá, sa nevymýšľa ani negeneruje: napíš ho do „Materiál, ktorý treba natočiť“.
- Text v obraze má byť tá istá veta ako v scenári, bez em dash a bez zmienky o AI.
