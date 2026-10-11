# Šablóna: týždeň, mriežka a zapájanie (Content Planner, Grid Planner, Engagement Loop)

## Content Planner: týždenný plán (čo, kedy, s kým)

Video nategold.ai ukazuje plán „This week“: Po reel, Ut príspevok, St story, Št reel, Pi príspevok,
So story, Ne bez príspevku. Je to východisko, nie overené pravidlo. Čas navrhni podľa čísel, ktoré
majiteľ vidí vo svojich štatistikách; bez nich čas nechaj na neho.

```
Týždeň: <od> až <do>      Podnik: <…>
Čo sa deje: <udalosti, novinky od majiteľa>
Materiál k dispozícii: <fotky, videá>

| Deň | Formát | Téma | Materiál | Text (návrh) | S kým (označenie, súhlas) | Stav |
| Po  | reel   |      |          | sablona-reel  |                           | návrh |
| Ut  | príspevok |   |          | sablona-prispevok |                       | návrh |
| St  | story  |      |          |               |                           | návrh |
| Št  | reel   |      |          |               |                           | návrh |
| Pi  | príspevok |   |          |               |                           | návrh |
| So  | story  |      |          |               |                           | návrh |
| Ne  | (nič)  |      |          |               |                           |       |

Stav: návrh / schválené majiteľom / uverejnené majiteľom
Chýbajúci materiál: <čo treba nafotiť alebo natočiť>
```

Témy ber z toho, čo podnik ponúka (`fakty-*.md`) a čo má nafotené. Pri HEAD SPA 30 dáva zoznam
záberov aj ich použitie `docs/fotenie.md`.

## Grid Planner: mriežka profilu

Vstup: snímka mriežky alebo zoznam pripravených fotiek.

```
Posledné príspevky (zľava, po riadkoch): <čo na nich je>
Návrh ďalších: <poradie s krátkym dôvodom>
```

- Striedaj druhy záberov (miesto, ľudia so súhlasom, detail remesla alebo rituálu), nech vedľa
  seba nestoja dva rovnaké.
- Štýl drží vizuál webu: Barbershop 30 podľa `barbershop-30/docs/ART_DIRECTION.md`, HEAD SPA 30
  podľa `CLAUDE.md` a `docs/fotenie.md` (skutočné fotky, bez textu v obraze, bez tónovania).
- Nič vygenerované ani cudzie; len fotky a videá podniku.

## Engagement Loop: týždenné zhrnutie

Vstup: snímky komentárov, správ, označení a čísiel za týždeň od majiteľa.

```
Čaká na odpoveď: <komentár alebo správa → návrh podľa sablona-odpovede.md>
Označili nás: <kto → návrh poďakovania>
Komentáre u iných (ak chce majiteľ): <príspevok → návrh, Comment Drafter>
Čo sa osvedčilo: <len podľa čísel od majiteľa> → <čo zopakovať v ďalšom pláne>
```

Všetko robí majiteľ ručne; žiadne hromadné ani automatické akcie z účtu.
