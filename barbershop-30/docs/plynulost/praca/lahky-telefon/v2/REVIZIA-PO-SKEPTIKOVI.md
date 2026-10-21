# Plán V2 – úpravy podľa skeptika (21. 10. 2026, 20:40 UTC)

Skeptik plán VYVRÁTIL v 5 bodoch; platí plán + tieto úpravy (prednosť pred PLAN-TELEFON-V2.md):

1. **V0 (diagnostika) nerozlíši chybu stránky od chyby náhľadu**: artefakt claude.ai je rámec aj v Safari. Rozhodovací strom „v rámci → náhľad nepoužiteľný“ zrušiť; platí „v rámci A roztiahnutý (innerHeight ≫ screen.height)“. Test na vrchnej úrovni (bez rámca) = rozhodnutie majiteľa: skrytá skúšobná adresa na živom webe (noindex, nikde neodkázaná) ALEBO iný hosting. Bez nej sa čísla z náhľadu berú len orientačne.
2. **P1 (zahodená bitmapa) sa v náhľade nedá dokázať**: test drawImage > 20 ms je falošne pozitívny; obalené decode() meria len prvé dekódovanie. Spoľahlivé: počítadlo samovoľných načítaní (pád procesu) a časová zhoda rAF medzier s prepnutím karty. Nestavať rozhodnutia na P1.
3. **V3 nesmie čakať s prepnutím stavu na dekódovanie** (inak „cudzia scéna“ pod textom – nález kontroly vzhľadu 2): stav karty sa prepína vždy, pod ňou je vlastný LQIP (V1a), ostrosť dobieha cez img.nacitana. „Zaostrenie, nikdy cudzia fotka.“
4. **Diagnostický panel nesmie kaziť meranie**: layers() (getComputedStyle cez ~1 500 prvkov) len na stlačenie tlačidla, nie každých 500 ms; tolerancia na iPhone p99 alebo ≤ 2 medzery > 34 ms za 10 s, nie nula.
5. **„Čierne polia“ definuje majiteľ, nie my**: opýtať sa ho, ktoré plochy myslí (fotka pod textom / rámik galérie / video / lišta a pätička / okno prihlášky). Kým neodpovie, V1 rieši prázdne plochy pod fotkami, rámiky galérie a videí; tmavý dizajn (lišta, pätička) ostáva.

Doplnky: V0+V1+V4+V6a poslať majiteľovi v jednom kole (dva náhľady: pôvodný s panelom na diagnostiku, opravený na hodnotenie); V1f (vypnutie priblíženia) až spolu s V3 alebo s vetou „pohyb sme dočasne vypli“; V4 kritérium „0 <video> hrajúcich/sťahovaných“ (prvok v HTML ostáva pre počítač); V3 pridať iteráciu podľa hodnotenia majiteľa (dĺžka 500–900 ms, stierka áno/nie, dosadnutie 1,02–1,06).
