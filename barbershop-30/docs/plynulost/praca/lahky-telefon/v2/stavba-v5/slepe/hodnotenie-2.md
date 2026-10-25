# Slepé sady – hodnotenie, kolo 2

Hodnotiteľ: nezávislý, v strome `hs-recepcia` som nič nemenil.
Strom: HEAD **6f8c47c** („vek nad 10 pri každom tvare slova dieťaťa, dĺžka v cm, čas“), `git status --short` = 0 riadkov. Pozor: zadanie uvádza HEAD d4657b7 a kolo 1 hodnotilo f715141; nad f715141 odvtedy pribudli 4 commity (d80f993, fd07112, bc99caf, 6f8c47c). Hodnotil som skutočný HEAD.
Projektový test `node source/tools/recepcia-test.mjs` (v `barbershop-30/`) → `# fail 0`.

Sady (sha1): `sada-A.jsonl` 5c1111b2…, `sada-B.jsonl` 9d1387c6…, `sada-C2.jsonl` 5cc7e615….

## Postup (zopakovateľný)

```
cd .../stavba-v5/slepe
R=../../../../../hs-recepcia/barbershop-30
for s in A B C2; do node spust-slepe.mjs $R sada-$s.jsonl > vysledky-$s-2.jsonl; done
python3 zarad-2.py vysledky-A-2.jsonl vysledky-B-2.jsonl vysledky-C2-2.jsonl   # zapíše vysledky-*-2-zarad.json
```

- `spust-slepe.mjs` – rovnaký ako v kole 1 (podľa `k1-skusaj.mjs`, číta JSONL, volá `odpovedz()` z `assets/recepcia.js` s JSON jazyka).
- `zarad-2.py` – pravidlá zaradenia rovnaké ako `zarad-1.py` (OK / BEZPEČNÉ / CHYBA + pomocné VÝBER‑MIMO, VÝBER‑NELEG, ODCHÝLKA); navyše vypisuje každú odpoveď typu trvanie so službou a kategóriu pasce zo sady C2.
- Ručne som prešiel: všetky odpovede s cenou alebo trvaním v sade B a v pasciach C2, všetky odpovede s cenou na tému odovzdanie/bez-ceny v A, všetkých 131 pascí C2 (osoba, miesto, produkt, trvanie, zdvorilosť, zložené, zápor, dve služby, nevieme).

### Overenie čísel v index.html

Všetkých **77 odpovedí typu trvanie** (A 27, B 29, C2 21) menuje službu z otázky a číslo zo stránky: strih 40 min (:530), strih s bradou 60 (:536), nad 10 cm 60 (:542), malí gentlemani 45 (:548), oholenie hlavy 25 (:554), úprava brady 20 (:566), Hot Towel 30 (:572), farbenie brady 30 (:578), Balíček 1 65 (:590), Ultra 80 (:596), pleť 30 (:608), obočie 5/10 (:614/:632), depilácia 10 (:620). Názvy riadkov overené (`sed -n` :535 … :631).
Ceny v odpovediach na pasce B/C2: strih 18 € (:531, fade v popise :529), s bradou 28 € (:537), deti 15 € len do 10 rokov (:549, :840), hlava 13 € (:555), pleť 21,50 € s peelingom (:607, :609), obočie 3 €/5 € (:615/:633) – všetky sedia so službou z otázky.

## Výsledok

| sada | spolu | OK | BEZPEČNÉ | VÝBER‑MIMO | VÝBER‑NELEG | ODCHÝLKA | **CHYBA** |
|---|---|---|---|---|---|---|---|
| A (bežný zákazník) | 349 | 317 | 28 | 1 | 3 | 0 | **0** |
| B (pasce) | 315 | 246 | 23 | 3 | 39 | 4 | **0** |
| C2 (bežné 129 + pasce 131) | 260 | 192 | 55 | 2 | 9 | 2 | **0** |
| **spolu** | **924** | 755 | 106 | 6 | 51 | 6 | **0** |

- Legitímne otázky (očakávaná položka, nie odovzdanie/bez-ceny): **413**; OK 301 (72,9 %), BEZPEČNÉ 106 → **fallback_legit_pct = 25,7 %**, VÝBER‑MIMO 6, CHYBA 0.
  Po sadách: A 28/196 (14,3 %), B 23/78 (29,5 %), C2 55/139 (39,6 %).
- **CHYBY: 0. Sporné očakávania: 0** (nebola chyba, ktorú by bolo treba overovať; očakávania pri cenách a trvaniach vyššie sedia so stránkou).

### Päť chýb z kola 1 na HEAD 6f8c47c

| otázka | kolo 1 | teraz |
|---|---|---|
| sk „Synovi je 12, platí ešte detský strih?“ | deti 15 € | `nevieme vek` – „Strih pre chlapcov nad 10 rokov na webe neuvádzame.“ |
| sk „Mám vlasy 3 cm, koľko stojí strih?“ | nad 10 cm 22 € | výber [pánsky strih, nad 10 cm] |
| de „Was kostet Rückenwaxing?“ | uši a nos 5,50 € | výber [depilácia] |
| hu „Szempillafestés mennyi?“ | farbenie brady 10 € | `nevieme` (odovzdanie, téma „Romana“ – nesprávny štítok, ale bez ceny) |
| hu „Hátgyantázás ára?“ | uši a nos 5,50 € | výber [depilácia] |

### Triedy z kola 3 a 1 v pasciach C2 – žiadna cena ani trvanie inej služby

- **zdvorilosť (19):** „dakujem pekne“, „děkuji moc“, „köszönöm szépen“, „sorry wrong chat“, „cheers mate“, „pardon, omyl“ … → fallback/zdvorilosť/odovzdanie, nikde cena.
- **iná osoba (28):** mama, manželka, dcéra, priateľka, vnuk 11/12/13 rokov → `damske`, `vek`, odovzdanie alebo výber; žiadna cena ako odpoveď.
- **iné miesto (8):** nemocnica, domov dôchodcov, hotel, domov → `mimo`; en „could a barber come to my flat?“ → tím a sr „dolazite li na kućnu adresu“ → adresa (ODCHÝLKA, bez ceny, nič nesľubuje).
- **iný produkt (16):** olej, balzam, vosk na bradu/vlasy → `produkty`, nikde cena úpravy brady.
- **trvanie (19):** všetky odpovede menujú správnu službu (hlava 25, holenie 30, farbenie brady 30, Balíček 65/80, deti 45, nad 10 cm 60); ostatné výber/fallback.
- **zložené (8), zápor (9), dve služby (1):** výber alebo odovzdanie; „Kopfrasur mit Rasiermesser“ → Oholenie hlavy 13 € (správne).

## CHYBY (0)

Žiadna. Tabuľka chýb je prázdna.

## Nezapočítané, ale na pozornosť

- **ODCHÝLKA s cenou správnej služby (1, zaradená ako OK podľa `prijatelne`):** sk „ako dlho sa striha dlhsie vlasy nad 10 cm“ → `cena-dlhe` „… nad 10 cm 22 €“ bez trvania 60 min. Služba je správna, číslo je cena tej istej služby, nie trvanie inej; spúšťač trvania nerozozná tvar „ako dlho sa strihá“. Nie je to vážna chyba, ale odpoveď nesedí na otázku.
- **VÝBER‑MIMO (6, nič netvrdia):** zápor „nechcem bradu, len strih“ / „Jen střih, bez vousů“ / hu „nem kell hajvágás, csak szakáll“ → tlačidlá bez hľadanej služby; „Strihate o polnoci?“ → [pánsky strih]; „su v cene nejake priplatky?“ a „su tie ceny finalne…“ → [nad 10 cm].
- **VÝBER‑NELEG (51):** psy, voskovanie chrbta/nôh, mihalnice, piercing, permanentka, „vnukovi je 12 … uz je to pansky?“ a uk „стрижка для мами“ → „Myslíš toto?“ s pánskym strihom alebo depiláciou. Podľa zásady majiteľa prijateľné (ponuka cenníka, telefón, e‑mail), ale ťuknutím zákazník uvidí cenu služby, ktorú nechcel; pri „strih pre mamu“ by bolo čistejšie `damske` ako v sk/cs/de/en/hu/pl/sr.
- **Nesprávny štítok pri odovzdaní (bez ceny):** „ste na tej mostnej, ale ktore cislo?“ → `skolenia`; de „Wo genau ist der Laden? Straße und Hausnummer“ → `mimo`; „bradu nechajte tak, len vlasy“ a obdoby v de/pl/sr → `produkty`; pl „jak się umówić na wizytę“ → `jazyky-tim`; hu „Szempillafestés“ → `romana-ceny`. Bezpečné (vždy odovzdanie), ale zákazník dostane nesúvisiacu tému. Adresa a rezervácia sú pritom na stránke a mali by odpovedať.
- **Vyšší podiel fallbacku na bežných otázkach C2 (39,6 %):** napr. „vlasy aj bradu naraz, kolko to vyjde dokopy“, „len by som si dal zarovnat bradu“ → „Túto službu v cenníku neviem nájsť“; „Mi a pontos cím?“, sr „колико кошта шишање“ (cyrilika) → fallback. Cena za bezpečnosť – podľa zásady „radšej nevedieť“ prijateľné.

## Verdikt kola 2

Na HEAD 6f8c47c v 924 slepých otázkach (8 jazykov) **0 CHÝB**: žiadna cena ani trvanie inej služby, žiadne „áno“ s cenou na neponúkanú službu, všetky čísla zhodné s index.html. Trieda chýb, ktorá sa vracala v kolách 1–3 a v slepom kole 1, sa v týchto sadách neobjavila. Z pohľadu vážnych chýb **PRIJATÉ**; zostáva kvalita: fallback 25,7 % legitímnych otázok a niekoľko nesprávnych štítkov odovzdania (adresa, rezervácia, zápor → produkty).

Súbory: `spust-slepe.mjs`, `zarad-2.py`, `vysledky-A-2.jsonl`, `vysledky-B-2.jsonl`, `vysledky-C2-2.jsonl`, `vysledky-*-2-zarad.json` v tomto priečinku.
