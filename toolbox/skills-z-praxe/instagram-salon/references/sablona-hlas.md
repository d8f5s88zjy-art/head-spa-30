# Šablóna: hlas podniku (voice)

Podľa videa joshfpocock „YouTube agent“ (súbor `voice.md` so štyrmi časťami: komu hovoríš, ako naozaj
hovoríš, slová, ktoré nikdy nepoužiješ, čo nikdy netvrdíš). U nás sa hlas neodhaduje z videí majiteľa,
ale zo zdrojov, ktoré už platia: texty webu, `CLAUDE.md`, `fakty-*.md`. Vypĺňa sa raz na podnik
a pred každým návrhom sa podľa neho kontroluje.

```
Podnik:
Komu hovoríme:            <kto chodí, podľa webu a zdrojov; nie dojem>
Ako hovoríme:             <tykanie alebo vykanie podľa webu, dĺžka viet, tón>
Slová a tvary, ktoré nepoužívame:
Čo nikdy netvrdíme:       <odkaz na fakty-<podnik>.md, časť Nesmieš>
Vzorové vety z webu:      <3 až 5 overených viet>
```

## Vyplnené zo zdrojov (október 2026)

| | Barbershop 30 | HEAD SPA 30 | GYM KLUB |
| --- | --- | --- | --- |
| Komu | ľudia, ktorí chcú strih alebo bradu bez naháňania (web: „Tvoj strih. Tvoje miesto.“) | kto si chce oddýchnuť hlavou aj telom (web: „Vypni hlavu.“) | ľudia z Nitry, ktorí chcú cvičiť bez objednávania (web: „Stačí prísť.“) |
| Ako | tykanie, krátke vety, obraz miesta (lampy, káva vzadu, kreslá) | tykanie, pokojne, zmysly po jednom slove | vykanie (web „Prídete, zaplatíte…“), vecne, čísla a časy |
| Nepoužívame | em dash, „AI“, „Barber shop 30“ ako iný názov | em dash, „AI“, „barber“, Salón 30 ako značku | em dash, „AI“, „360°“, hodnotenia a počty členov |
| Netvrdíme | `fakty-barbershop-30.md`, Nesmieš | `fakty-head-spa-30.md`, Nesmieš | len to, čo je na webe `lipa-gym/index.html` (vetva GYM KLUB) |
| Vzorové vety | „Tvoj strih. Tvoje miesto.“, „Vzadu ťa čaká káva.“ | „Vypni hlavu.“, „Nie umytie vlasov. Rituál pre hlavu.“ | „Stačí prísť.“, „Prídete, zaplatíte na recepcii, cvičíte.“ |

Úvodnú vetu potom porovnaj skriptom `../scripts/hook_skore.py` (konkrétnosť, oslovenie, stávka,
zvedavosť, stručnosť). Skóre je pomôcka na výber z variantov, nie predpoveď pozretí.
