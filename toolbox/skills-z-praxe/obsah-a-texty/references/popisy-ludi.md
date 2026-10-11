# Popisy ľudí z tímu bez vymyslených faktov

Pôvod: popisy desiatich barberov BARBERSHOP 30 (2026-10-11), workflow `popisy-barberov`
(skript v priečinku workflowov relácie, `popisy-barberov-wf_89e5a84c-a96.js`). Výsledok je v
`barbershop-30/index.html` v `.team-bio`; želanie majiteľa je zapísané v `CONTENT_SOURCES.md`
(„Popisy pod menami (od 2026-10-11) sú na želanie majiteľa krátke pochvalné vety o remesle a prístupe,
nie fakty o osobe“).

## Čo vieme a čo nie

- O konkrétnom človeku: **len krstné meno a rola** presne podľa webu podniku (Barber, Barberka).
- O podniku (platí pre všetkých, nie pre jedného): rok, počet kresiel, káva, postup strihu, brada
  s horúcim uterákom a britvou, vlastné slová podniku o sebe („poctivé remeslo s moderným štýlom“).
- Nevieme: roky praxe, špecializácie, súťaže, ocenenia, záľuby, pôvod.

## Pravidlá briefu (prevzaté zo skriptu workflowu)

1. Nič nevymýšľaj o konkrétnom človeku: žiadne čísla, roky praxe, súťaže, ocenenia, špecializácia
   („je špecialista na fade“), záľuby. Pochvala remesla a prístupu je v poriadku. Prvky remesla
   (nožnice, britva, strojček, fade, horúci uterák) ako obraz, nie ako tvrdenie, že ich človek robí lepšie.
2. Žiadne superlatívy ako tvrdenie: nie „najlepší v Nitre“, „číslo jeden“, „top“, „100 %“, „legenda“.
3. Tykanie zákazníkovi, spisovná a prirodzená slovenčina.
4. Jedna, najviac dve krátke vety; najviac 95 znakov s medzerami (karta má na telefóne asi 240 px).
5. Žiadne pomlčky (ani spojovník ako pomlčka), výkričníky, emoji ani úvodzovky.
6. Každý popis iný: rôzne začiatky, rôzne kľúčové slová; slová ako „presný“, „pokojný“, „istá ruka“
   najviac dvakrát v celej desiatke.
7. Tón webu (ukážky existujúcich viet dať do briefu, aby sa textári chytili hlasu).
8. Meno v popise netreba opakovať, je nad ním ako nadpis.

Pri žene v tíme brief výslovne pripomenie rod a tvary slov („jej ruka“, „s ňou“).

## Stavba workflowu

| Fáza | Kto | Čo odovzdá |
| --- | --- | --- |
| Písanie | 3 textári naraz, každý iný uhol: **remeslo** (zmyslové obrazy práce, rytmus titulkov), **hosť** (pokoj, dôvera, odchod s dobrým pocitom), **charakter** (krátky výrok s pointou alebo kontrastom) | úvodný riadok sekcie + 10 popisov v poradí tímu, každý si sám spočíta znaky |
| Porota | 2 porotcovia naraz: **pravidlá a fakty** (porušenie pravidla 1, 2 alebo 5 = najviac 3 body z 10), **zákazník** (muž z Nitry 20 až 45 rokov vyberajúci si na telefóne) | pre každého najlepší návrh, skóre A, B, C, konkrétne problémy („B ...: 102 znakov“) |
| Syntéza | hlavný textár | najlepší popis podľa súčtu skóre, opravené problémy, desiatka ako celok bez opakovania, pri každom pôvod (A, B, C, úprava) |
| Kontrola | korektor a skeptik | počty znakov, hľadanie pomlčiek, výkričníkov, superlatívov, vymyslených faktov, zlého rodu, opakovaní; oprava najmenším zásahom |

Výstup každej fázy je štruktúrovaný (schéma s poľami `lead`, `bios[{name, text}]`, `scores`,
`issues`, `problems`), takže sa dá strojovo porovnať a nič sa nestratí.

## Výsledok (ukážky, `barbershop-30/index.html`)

- „Strih ti pristane, akoby si ho nosil odjakživa.“
- „Elegancia bez námahy. Taký je jeho rukopis.“
- „Jemná ruka, prísne oko. U nej je hotovo, až keď sedí každý vlas.“
- „Ostrá línia na krku, mäkký prechod na bokoch. Remeslo vidno zblízka.“
- Úvod sekcie: „Poctivé remeslo, moderný štýl a ľudský prístup. To spája celý tím.“ (slová podniku o sebe)

## Použitie na inom webe

1. Zo zdroja vypíš, čo vieš o každom človeku (zvyčajne meno a rola) a čo o podniku.
2. Do briefu daj ukážky existujúcich viet webu, pravidlá 1 až 8 a dĺžku podľa šírky karty.
3. Spusti tri uhly, dvoch porotcov, syntézu a kontrolu (skill `workflowy`, ak je k dispozícii).
4. Výsledok prečítaj nahlas, porovnaj so súborom zdrojov a zapíš do neho, že popisy sú dojem, nie fakt.
5. Keď majiteľ pošle skutočné údaje o ľuďoch, popisy sa môžu prispôsobiť (zapíš s dátumom).
