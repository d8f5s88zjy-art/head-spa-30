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
| 2 | Audit: 5 auditov (výkon telefón, čierne okná, vzhľad, kód filmu, kód stránky) + skeptik na každý + plán | čiastočne: audit čiernych okien hotový (7 nálezov, nižšie); ostatné prerušil limit relácie 10:40 UTC, znova spustené 11:40 UTC (`wf_ace44215-f02`, resume) | výstupy `praca/audit/`, plán `PLAN.md` |
| 3 | Opravy po dávkach s kontrolou a meraním pred/po | čaká | |
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
