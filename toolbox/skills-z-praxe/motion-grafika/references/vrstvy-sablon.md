# Vrstvy šablón ako na časovej osi After Effects

Každá šablóna v `sablony/` je kompozícia s pomenovanými vrstvami (`data-layer`). Čísla sú pri
predvolenej dĺžke; záporný `out` v šablóne znamená „toľko sekúnd pred koncom“, takže pri inej dĺžke
(`"dlzka"` v parametroch) sa odchod posunie s koncom. Nástupy bez uvedeného času majú čas zo značky
(BARBERSHOP 30 `--t-text` = 560 ms, HEAD SPA 30 700 ms), odchody 400 ms (HEAD SPA 30 450 ms).
Render to isté vypíše do `<meno>-vrstvy.txt` a nakreslí do `<meno>-prehlad.png`.

Prepísať čas, nástup alebo vrstvu skryť sa dá bez úpravy HTML:

```json
"vrstvy": { "Info": { "in": 0.9 }, "Doska": { "skry": true }, "Meno": { "vstup": "fade", "vstup_ms": 450 } }
```

## Lower third (`lower-third.html`), 4 s, vľavo dole v zóne

| # | vrstva | in | out | nástup | odchod | čo robí | parametre |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Doska | 0,15 s | 3,88 s | stierka zľava 700 ms | fade 420 ms | polopriehľadná doska (`doska` zo značky), vlasová linka, polomer `--r-doska` | farba `doska`, `linka` |
| 2 | Linka | 0,45 s | 3,70 s | linka (rastie zľava) 650 ms | fade | krátka linka akcentu nad menom | farba `akcent` |
| 3 | Meno | 0,55 s | 3,70 s | hore | dole | meno, nadpisové písmo značky, 92 px; dlhé sa zmenší až na 60 % | `texty.meno` |
| 4 | Info | 0,75 s | 3,64 s | hore | dole | jedna informácia, textové písmo, 40 px | `texty.info` (prázdne = vrstva vypadne) |

Prvá aj posledná snímka sú priehľadné. `nastavenia.zarovnanie`: `vlavo` (predvolené), `stred`, `vpravo`;
`nastavenia.zvisle`: `dole` (predvolené), `stred`, `hore`.

## Titulná karta (`titulna-karta.html`), 3,5 s, na strede zóny

| # | vrstva | in | out | nástup | odchod | čo robí | parametre |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Clona | 0 s | 3,45 s | fade 500 ms | fade 450 ms | mäkké stmavenie za textom v tóne podkladu (ako karty na webe BARBERSHOP 30), mimo zóny | `nastavenia.clona` 0 až 1 (0,8) |
| 2 | Nadpisok | 0,20 s | 3,40 s | fade | fade | drobný text verzálkami, linka akcentu (pri strede z oboch strán) | `texty.nadpisok` |
| 3 | Riadok 1 | 0,35 s | 3,40 s | hore | dole | prvý riadok nadpisu, 128 px | `texty.riadok1` |
| 4 | Riadok 2 | 0,50 s | 3,40 s | hore | dole | druhý riadok | `texty.riadok2` |
| 5 | Riadok 3 | 0,65 s | 3,40 s | hore | dole | tretí riadok | `texty.riadok3` |

Riadky nastupujú po 150 ms. `*slovo*` v texte je zvýraznenie: BARBERSHOP 30 Fraunces 500 kurzíva v teplej
bielej, HEAD SPA 30 Lora kurzíva v zlatej (jediný akcent). Prázdny riadok vypadne.

## Priebeh a odpočet (`priebeh.html`), 4,2 s, dole v zóne na celú šírku

| # | vrstva | in | out | nástup | odchod | čo robí | parametre |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Doska | 0,10 s | 4,10 s | stierka 700 ms | fade 420 ms | polopriehľadná doska | `vrstvy.Doska.skry` |
| 2 | Popis | 0,35 s | 3,95 s | hore | fade | drobný nadpisok verzálkami | `texty.popis` |
| 3 | Počítadlo | 0,45 s | 3,95 s | hore | fade | číslo podľa priebehu, tabuľkové číslice | `nastavenia.pocitadlo` (formát `{n}`, `{n} %`, `{mm}:{ss}`; prázdny = skryté), `pocitadlo_od`, `pocitadlo_do` |
| 4 | Dráha | 0,50 s | 3,95 s | linka 700 ms | fade | vlasová dráha (`linka-silna`) | |
| 5 | Výplň | 0,50 s | 3,95 s | bez nástupu (začína na nule) | fade | výplň v akcente, dĺžka = priebeh | `nastavenia.priebeh_od`, `priebeh_do` (s), `krivka` (`plynulo`, `linear`) |
| 6 | Bod | 0,75 s | 3,95 s | fade | fade | štvorček na čele výplne (vo videu „Runner marker“) | |
| 7 | Kroky | 0,65 s | 3,95 s | hore | fade | až štyri kroky rovnomerne pod dráhou, rozsvietia sa, keď ich výplň prejde | `texty.krok1` až `krok4` (prázdne vypadnú, všetky prázdne = vrstva vypadne) |

Odpočet: `"pocitadlo": "{n}", "pocitadlo_od": 3, "pocitadlo_do": 0` (zaokrúhľuje nahor, takže 3 svieti
celú prvú tretinu), vzor `priklady/odpocet.json`.

## Značka na konci (`znacka.html`), 4 s, na strede zóny, ostáva do konca

| # | vrstva | in | out | nástup | odchod | čo robí | parametre |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Clona | 0 s | koniec | fade 700 ms | | stmavenie celého záberu v tóne podkladu, mimo zóny | `nastavenia.clona` (0,86; 1 = nepriehľadná karta) |
| 2 | Nadpisok | 0,35 s | koniec | fade | | voliteľný drobný text nad názvom | `texty.nadpisok` |
| 3 | Názov | 0,45 s | koniec | hore 700 ms | | názov podniku, 132 px, zmenší sa na šírku zóny | `texty.nazov` |
| 4 | Linka | 0,85 s | koniec | linka od stredu 650 ms | | linka akcentu pod názvom | |
| 5 | Adresa | 1,00 s | koniec | hore | | adresa alebo iný krátky riadok | `texty.adresa` |
| 6 | Výzva | 1,35 s | koniec | hore | | ploché tlačidlo webu: BARBERSHOP 30 verzálky na `--lamp`, HEAD SPA 30 normálne písmo na zlatej | `texty.vyzva` |

Posledná snímka je hotová karta. Dĺžku (`"dlzka"` alebo `--dlzka`) nastav rovnú dĺžke záberu v scenári:
`kratke-video` po konci súboru prekrytie nekreslí (`eof_action=pass`), takže kratšia karta by zmizla.

## Ako to zodpovedá videu (ref7)

Časová os vo videu má vrstvy Glass cards, Orbit animation, Presenter cutout, Intro footage, Football footage,
Stadium shot, Marathon footage, Run progress bar, Runner marker, Map transition, Route + clock, Final footage,
Astra floating logo, Higgsfield logo. U nás:

| vo videu | u nás |
| --- | --- |
| lower third so štatistikou hráča (výška 5'2") | Lower third: meno a jedna informácia, žiadne čísla bez zdroja |
| Run progress bar + Runner marker | Priebeh: Dráha, Výplň, Bod |
| Route + clock | Počítadlo (`{mm}:{ss}`) |
| Astra floating logo, Higgsfield logo na konci | Značka na konci: názov sadzaný písmom webu (vektorové logo zatiaľ nemáme, CONTENT_SOURCES.md) |
| zábery (Intro, Stadium, Final footage) | vrstvy záberov tu nie sú: grafika je priehľadné prekrytie, zábery strihá `kratke-video` |
| Glass cards, Orbit animation, Presenter cutout | nepoužívame: sklo, odlesky, rozmazanie pohybom a obiehanie sú efekty, ktoré pravidlá webov vylučujú |
