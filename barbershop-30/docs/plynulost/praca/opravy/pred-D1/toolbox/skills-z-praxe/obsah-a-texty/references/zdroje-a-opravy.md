# Súbor zdrojov a zápis opráv

Vzor: `barbershop-30/docs/CONTENT_SOURCES.md` (BARBERSHOP 30). Pre HEAD SPA 30 plnia rovnakú úlohu
`CLAUDE.md` (pravidlá majiteľa), `docs/booqme-sluzby.csv` a `docs/booqme-poukazy.csv` (ponuka).

## Šablóna (skopíruj do `docs/CONTENT_SOURCES.md` nového projektu)

```markdown
# Zdroje obchodných údajov: <PODNIK>

Každý údaj na webe má tu zapísaný zdroj, dátum získania a stupeň overenia.
Stupne: **overené-oficiálne** (web podniku alebo jeho rezervačný systém),
**tretia strana** (katalógy, recenzné weby), **slabé** (jediná neoficiálna zmienka),
**neoverené** (tvrdenie majiteľa alebo odhad, na web ide až po potvrdení).
Dátum získania všetkých údajov: **RRRR-MM-DD**, pokiaľ nie je uvedené inak.

## Identita a kontakt (overené-oficiálne, <adresa webu podniku>)

| údaj | hodnota | poznámka |
|---|---|---|
| názov | ... | ako sa píše na webe a ako v právnych údajoch |
| adresa | ... | |
| telefón | ... | tvar pre `tel:` odkaz |
| otváracie hodiny | ... | |
| rezervácia | <adresa> | čo to je za systém, či sa dá predvoliť služba cez adresu |

## Tím (zdroj, dátum)
Krstné mená a roly presne podľa webu podniku. Priezviská ani špecializácie nevymýšľame.

## Služby a ceny (zdroj, dátum)
| služba | cena | trvanie | opis zo systému |

## Dôkazy a ocenenia (tretia strana: na webe iba s odkazom na zdroj)

## Médiá
Pôvod fotiek, práva, súhlasy osôb.

## Čo ostáva neoverené (`data-required` v kóde)
- ...
```

## Ako zapisovať

- **Pôvod v poznámke**, nie len hodnotu: „prevzaté z „Prečo práve my?“ na aktuálnom webe“.
- **Dátum pri každej neskoršej zmene**: „Popisy pod menami (od 2026-10-11) sú na želanie majiteľa...“.
- **Rozpor ako rozpor**: „majiteľ uvádza recepciu „8 rokov“ (= 2018), **nesúlad, neoverené**; na webe
  používame „od roku 2019““.
- **Čo sa nezobrazuje a prečo**: ceny farbenia z druhého rezervačného systému sa na webe neukazujú,
  „aby neboli dva cenníky na jednom mieste“.
- **Otázky na majiteľa** tučne: „**spýtať sa majiteľa** pred použitím“, „**Vyžiadať vektor od majiteľa.**“
- Preklepy zo zdroja oprav na webe, ale v tabuľke nechaj pôvodný zápis zo systému, aby sa dal
  dohľadať (v `CONTENT_SOURCES.md` je „Depilácia uši a nosa voskom“, na webe „uší“).

## Oprava od majiteľa krok za krokom

1. Zapíš ju do zdroja: hodnota, `majiteľ RRRR-MM-DD`, kde sa na webe prejaví.
   Skutočný riadok: `| kde sa podáva káva | vzadu, kde ľudia čakajú (čakáreň s kreslami a pumpou Route 66),
   nie pri recepcii | majiteľ 2026-10-11; na webe v karte Čakáreň |`.
2. `grep -rn "<staré tvrdenie>" index.html assets/ docs/` a oprav všetky výskyty, aj preklady
   (kľúč v JSON je slovenský text, takže sa mení kľúč aj hodnota vo všetkých jazykoch).
3. Ak oprava mení stavbu stránky, zapíš rozhodnutie do briefu s dátumom (BARBERSHOP 30: „Majiteľ
   2026-10-11: úvod bol dlhý a cesta k obsahu tiež; káva sa nepodáva pri recepcii, ale vzadu, kde sa čaká.“,
   `TOUR_DIRECTION.md`; výsledok 9 kariet namiesto 14).
4. Pravidlo, ktoré má platiť aj nabudúce, patrí do `CLAUDE.md` (napr. žiadny strieborný ani zlatý
   Head Spa rituál; tri rituály pre chodidlá).
5. Commit po slovensky povie, čo sa zmenilo a prečo (napr. 1a3b955: „Strieborný Head Spa rituál
   a oba Zlaté Head Spa rituály 24K salón neponúka, z webu sú preč aj s poukazmi.“).

## Kód je pravda, README je história (stav 2026-10-11)

Rozdiely medzi `README.md` a kódom HEAD SPA 30, ktoré treba poznať, kým README niekto neopraví:

| README hovorí | Kód (`index.html`, `assets/*.js`) |
| --- | --- |
| „Rezervácia“, „Rezervácia priamo na stránke“: formulár s WhatsApp, sekcia `#rezervacia` | žiadny `<form>`, žiadna sekcia `#rezervacia`; všetko ide do Booqme (aj `CLAUDE.md`) |
| „Kam vedú tlačidlá Rezervovať“: `data-booking` na `<html>`, 30 tlačidiel | `data-booking` na `<html>` nie je; 25 odkazov s `data-booking-link` a priamou adresou Booqme |
| „Rezervácie“: tlačidlá vedú na rezerváciu na webe Salónu 30 | tlačidlá vedú do Booqme |
| „Sekcia Salón 30“: kaderníctvo, kozmetika, kaderníčky, ceny | sekcia nie je (služby Salónu 30 na web nepatria, `CLAUDE.md`) |
| „Nadväznosť sekcií“: riadok `p.next` a `div.divider` | v `index.html` nie sú |
| „Bez opakovania“: sekcia Tím odišla | sekcia `#tim` je (admin ju vie skryť, keď nie je nikto v tíme) |
| „Ponuka“: ceny 45 až 149 € | 45 až 135 € (zmena podľa Booqme, commit 4770ed3) |
| „Drobnosti“: meta popis má 133 znakov | má 178 znakov |
| „Jazyky“: jazyk sa vyberie aj podľa prehliadača | `assets/i18n.js` otvára slovensky; inému jazyku prehliadača len ponúkne prúžok |

Pri písaní textu sa preto vždy pozri do `index.html`, nie do README.
