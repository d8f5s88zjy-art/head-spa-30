# Šablóny: scenár, storyboard, názov, popis, hashtagy

Všetko v [hranatých zátvorkách] je zástupné pole. Pole s faktom (číslo, cena, čas, názov služby, adresa,
rok, počet) sa vyplní len zo zdroja prevádzky prečítaného v deň výroby a zdroj sa zapíše do stĺpca Zdroj.
Čo zdroj nemá, ide do „Treba potvrdiť“, nie do videa. Šablóny zámerne neobsahujú žiadne fakty o prevádzkach.

## Kde sú zdroje

| Prevádzka | Zdroje faktov | Čo smieš tvrdiť | Zábery a vizuál |
| --- | --- | --- | --- |
| HEAD SPA 30 | `CLAUDE.md`, `docs/booqme-sluzby.csv`, `docs/booqme-poukazy.csv`, `index.html` | `../../instagram-salon/references/fakty-head-spa-30.md` | `docs/fotenie.md` (zoznam záberov a pravidlá), tóny orecha so zlatou, žiadne záblesky ani efekty |
| Barbershop 30 | `barbershop-30/docs/CONTENT_SOURCES.md`, `barbershop-30/index.html` | `../../instagram-salon/references/fakty-barbershop-30.md` (časť „Overené vety z webu“) | `barbershop-30/docs/ART_DIRECTION.md` (uhoľná čierna, teplá biela, oranžová lámp) |
| GYM KLUB | texty webu na vetve projektu (`lipa-gym/`), `lipa-gym/3d/PRODUKCIA.md` | súbor ešte nie je: najprv založ `fakty-gym-klub.md` podľa vzoru v `instagram-salon` | `../../../gym-klub/README.md` (vyradené fotky a klipy, odrazy v zrkadlách) |
| iná prevádzka | najprv zoznam zdrojov so stupňami overenia | nový `fakty-<prevádzka>.md` | od majiteľa |

## 1. Scenár (35 s)

```
Prevádzka: [názov presne podľa zdroja]
Jedno tvrdenie, ktoré short dokazuje: [jedna veta]
Pre koho: [typ zákazníka, bez mien]
Problém, ktorý divák pozná: [ako to rieši dnes]
Výzva: [jedna akcia podľa zdroja: online rezervácia, telefón]
Hudba a jej licencia: [vlastná / knižnica YouTube / licencia, doklad]

| Čas (s)     | Úloha        | Záber (čo, odkiaľ)                  | Reč = titulok                     | Zdroj faktu        |
| 0,0 až 1,5  | hook, obraz  | [najrozpoznateľnejší záber v pohybe] | [prvé 2 až 4 slová hooku]          | [súbor, časť]      |
| 1,5 až 3,0  | hook, sľub   | [priblíženie alebo druhý záber]      | [dokončenie, spolu do 10 slov]     |                    |
| 3,0 až 6,0  | čo dostaneš  | [2 zábery]                           | [jedna veta]                       | [súbor, časť]      |
| 6,0 až 8,0  | číslo        | [karta alebo detail]                 | [číslo + 1 až 2 slová]             | [súbor, časť]      |
| 8,0 až 20,0 | kroky        | [4 až 6 záberov, krok = záber]       | [krok 1] / [krok 2] / [krok 3]     | [súbor, časť]      |
| 20,0 až 24,0| druhý hook   | [najsilnejší detail]                 | [„A najlepšie?“ + overený fakt]    | [súbor, časť]      |
| 24,0 až 30,0| miesto       | [exteriér, dvere, interiér zo širšia]| [kde sme, pre koho]                | [súbor, časť]      |
| 30,0 až 32,0| zhrnutie     | [najkrajší široký záber]             | [obrat hooku]                      |                    |
| 32,0 až 35,0| výzva        | [rezervácia na telefóne alebo dvere] | [akcia] + [adresa webu v obraze]   | [súbor, časť]      |

Varianty hooku (porovnané hook_skore.py):
1. [veta]  skóre [n]
2. [veta]  skóre [n]
3. [veta]  skóre [n]
Treba potvrdiť: [neoverené fakty, súhlasy, licencia hudby]
```

Pravidlá pri vypĺňaní:
- Kroky jednou vetnou šablónou, aby divák rytmus predvídal: „[Sloveso v 2. osobe]. [Čo sa stane].“
  alebo „[Časť priestoru]: [čo tam spravíš].“
- Druhý hook: „A najlepšie?“, „Čo ťa prekvapí:“, „Ešte jedna vec:“ + overený fakt. Nie sľub výsledku.
- Pri 30 s vynechaj zhrnutie a jeden krok, pri 45 s pridaj dva kroky (časová os v `../SKILL.md`).
- Hovorené tempo: Barbershop 30 a GYM KLUB 140 až 170 slov/min, HEAD SPA 30 110 až 140. Spočítaj slová:
  35 s pri 150 slovách/min je asi 87 slov celého scenára.

## 2. Storyboard (záber po zábere, z neho sa píše EDL)

```
| # | Čas v shorte | Súbor a úsek (s)     | Obraz                  | Pohyb kamery / zoom | Prechod pred | Titulok           | Zvuk            | Ľudia a privolenie        |
| 1 | 0,0 až 1,5   | [IMG_xxxx.mov 0,4 až 2,0] | [čo je v zábere]   | [kamera ide dverami] | -           | [text frázy]      | [hlas / prostredie] | [nikto / meno roly, privolenie áno] |
| 2 | 1,5 až 3,0   | [ ]                  | [ ]                    | [zoom 1,00 až 1,06] | strih        | [ ]               | [ ]             | [ ]                        |
| … |              |                      |                        |                     |              |                   |                 |                            |
```

- Stĺpec „Súbor a úsek“ sa prepíše do `klipy[].zdroj`, `od`, `do`; „Pohyb“ do `zoom`; „Prechod“ do `prechod`.
- Pred zápisom pozri úsek snímku po snímke: ľudia, odrazy v skle a zrkadlách, obrazovky s menami klientov.

## 3. Zoznam záberov na natáčanie

```
Prevádzka: [ ]      Dátum natáčania: [ ]      Kto natáča: [ ]
Privolenia (písomne, pred natáčaním): [mená rolí, kto podpísal]
[ ] hook: [najrozpoznateľnejší záber, v pohybe], 3 pokusy po 4 až 6 s
[ ] [krok 1], [krok 2], [krok 3], [krok 4]: každý 4 až 6 s, telefón na výšku, stabilne
[ ] miesto zvonka: [ulica, dvere], zvnútra zo širšia
[ ] detail pre druhý hook: [ ]
[ ] výzva: [obrazovka rezervácie bez osobných údajov alebo dvere]
[ ] hlas: [kto hovorí], tichá miestnosť, telefón 20 až 30 cm, celý text dvakrát
[ ] zvuk prostredia bez hudby v pozadí (rádio v prevádzke vypnúť: cudzia hudba = Content ID)
```

## 4. Kostry podľa odboru (len štruktúra, fakty doplniť zo zdroja)

### Fitko (GYM KLUB)

| Časť | Kostra | Pozor |
| --- | --- | --- |
| hook | [problém, ktorý fitko rieši] alebo [obraz miesta v pohybe: kamera popri rade strojov] | žiadne sľuby výsledkov (chudnutie, svaly za X týždňov) |
| čo dostaneš | [čo v priestore je, podľa textov webu] | len to, čo web uvádza |
| číslo | [počet, rozloha alebo otváracie hodiny zo zdroja] | ak zdroj nemá, vynechaj kartu |
| kroky | „[Zóna]: [čo tam spravíš].“ × 3 až 4 | zóny podľa webu |
| druhý hook | [bar, kurz, tréner: overený fakt] | tréner len s privolením |
| výzva | [ako začať: zo zdroja] | ceny len zo zdroja v ten deň |

Zábery: vchod, rad strojov, kotúče a tyč, zóna funkčného tréningu, bar. Pravidlá fotiek a klipov v
`../../../gym-klub/README.md` (napríklad úseky s odrazom človeka v skle sa nepoužívajú). Tempo 1,8 až 2,2 s na záber.

### Barbershop (Barbershop 30)

| Časť | Kostra | Pozor |
| --- | --- | --- |
| hook | [overená veta z webu alebo jej obmena] + [obraz: dvere, rohožka, sála] | vety zo zoznamu „Overené vety z webu“ |
| čo dostaneš | [čo je za dverami, zo zdroja] | |
| číslo | [kapacita alebo rok zo zdroja] | nie „8 rokov“ ani neoverené ocenenia |
| kroky | „[Sloveso]. [Úkon].“ × 3 až 4 (konzultácia, nástroje, úprava) | klienti zozadu alebo s privolením |
| druhý hook | [čakáreň, káva: zo zdroja, aj kde presne sa podáva] | opravy majiteľa majú dátum v zdroji |
| výzva | [online rezervácia: adresa zo zdroja] | |

Vizuál: teplé oranžové svetlo lámp, najviac jeden záblesk v oranžovej. Tempo 1,8 až 2,2 s na záber.

### Spa (HEAD SPA 30)

| Časť | Kostra | Pozor |
| --- | --- | --- |
| hook | [obraz miesta: dvere, ruka na kľučke] + [premena alebo sľub, obmena vety z `index.html`] | žiadna zmienka o AI, žiadne liečebné sľuby |
| čo dostaneš | [čo rituál je, slovami webu] | názvy rituálov presne podľa `docs/booqme-sluzby.csv` |
| číslo | [počet rituálov alebo platnosť poukazu zo zdroja] | poukaz vždy na konkrétny rituál, nikdy na sumu |
| kroky | „[Čo cítiš alebo čo sa deje], [krok rituálu].“ × 3 | kroky z popisu rituálu v deň výroby |
| druhý hook | [dvojica, poukaz: zo zdroja] | |
| výzva | [online rezervácia: zo zdroja] | |

Vizuál: pokojné zábery 2,2 až 3,0 s, prelínanie 0,3 s, žiadne záblesky, poskakovanie ani efekty
(`CLAUDE.md`). Klient s tvárou mimo alebo v tieni (`docs/fotenie.md`). Hlas pomaly, 110 až 140 slov/min.

## 5. Názov (najviac 100 znakov)

```
[hook shortu]                                  napr. tvar „[Problém]? [Riešenie v prevádzke].“
[Miesto]: [čo dostaneš]
[Otázka zákazníka]? [Krátka odpoveď zo zdroja]
```

Bez „najlepší“, „číslo jeden“, „toto musíš vidieť“, bez emoji, ak ich prevádzka inde nepoužíva. Názov = hook,
aby sa sľub v názve a v prvej sekunde zhodoval.

## 6. Popis

```
[1 až 2 vety: čo short ukazuje, len fakty zo zdroja]
[Názov prevádzky], [ulica a číslo], [mesto].
Rezervácia: [adresa webu alebo rezervácie zo zdroja]
#[mesto] #[názovprevádzky] #[odbor]
```

- Odkaz v popise shortu nemusí byť klikateľný (stav over v aplikácii); adresa preto patrí aj do obrazu na konci.
- Bez opakovania kľúčových slov a bez dlhých zoznamov značiek (YouTube to zakazuje).

## 7. Hashtagy

- 2 až 3, ktoré naozaj sedia: mesto, prevádzka, odbor (vzor `#[mesto] #[názovprevádzky] #[odbor]`).
- Pri názve sa ukážu najviac 3; nad 60 hashtagov YouTube ignoruje všetky; nesúvisiace hashtagy môžu viesť
  k odstráneniu videa (`youtube-fakty.md`, časť 6). `#Shorts` netreba, o zaradení rozhoduje dĺžka a pomer strán.

## 8. Správa majiteľovi na schválenie

```
Short [názov], [dĺžka] s, súbor [meno súboru], sha256 [prvých 12 znakov].
V shorte: [kto je v zábere a či máme privolenie], hudba [zdroj a licencia].
Názov: [ ]
Popis: [ ]
Fakty a zdroje: [veta: súbor, časť]
Treba potvrdiť: [ ]
Ak súhlasíš s presne týmto súborom a textom, napíš áno. Akákoľvek zmena potom potrebuje nové áno.
Uverejníš ty: najprv súkromne alebo naplánovane, pozri na telefóne, potom verejne.
```

Po odpovedi: `schvalenie.py zapis` s `--ako "[kde a kedy povedal áno]"`.

## 9. Záznam výsledkov

```
| Short | Uverejnené | Po 48 h: engaged views / Stayed to watch | Po 7 dňoch: engaged views / Stayed to watch | Rezervácie podľa majiteľa | Poznámka |
| [ ]   | [dátum]    | [ ] / [ ] %                               | [ ] / [ ] %                                 | [ ]                        | [čo zopakovať] |
```

Čísla posiela majiteľ zo Studia; nič neodhadujeme. Celkové pozretia sa od 24. 8. 2026 počítajú od prvej snímky,
na porovnanie slúžia engaged views.
