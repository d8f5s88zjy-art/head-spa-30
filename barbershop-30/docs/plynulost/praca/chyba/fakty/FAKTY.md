# BARBERSHOP 30 – overené fakty na doplnenie webu

Editor faktov, overené **2026-10-20** (všetky údaje nižšie majú tento dátum overenia, ak nie je uvedené inak).
Porovnané s webom v `hs-tool/barbershop-30/index.html` (aktuálny `main`) a naživo
https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/ (stiahnuté 20. 10., 84 292 B, zhodné s `main`).
Nič nie je vymyslené: čo sa nedalo overiť, je označené **doplniť – od majiteľa**. Osobné údaje fyzických osôb
sa nezbierali (z ORSR a z recenzií Google sú v dôkazoch vynechané); mená tímu sú len tie, ktoré už web má.

Stupne (ako `docs/CONTENT_SOURCES.md`): **oficiálne** (web alebo rezervačný systém podniku, Booqme podniku,
štátny register), **tretia strana** (Google profil – údaje mení majiteľ aj verejnosť, mesto Nitra), **slabé**,
**od majiteľa**. Stĺpec „Web“: ✔ zhoda, ✖ rozpor, – na webe nie je.

## 0. Súhrn v desiatich bodoch

1. **✖ Odkaz „Vernostná kartička“ v pätičke vedie na chybovú stránku 404 HEAD SPA 30** (s telefónom HEAD SPA 0911 153 136).
   Systém `vernost/` nie je nasadený na headspa30.sk a prihláška na webe nemá príznak `data-zapnute`, takže klik ide
   na `href` (`index.html:863`, `assets/vernost.js:172`). Overené curl aj naživo.
2. **✖ Tabuľa „Dnes“ nepozná sviatky.** Rezervačný systém podniku blokuje 1. 1., 6. 1., Veľký piatok, Veľkonočný pondelok,
   1. 5., 5. 7., 29. 8., 1. 11., 24.–26. 12.; tabuľa (`assets/app.js:659`) v tieto dni ukáže „Teraz otvorené“.
   Najbližšie: štvrtok 24. 12., piatok 25. 12., sobota 26. 12. 2026. Sviatočné hodiny: doplniť – od majiteľa.
3. **– Parkovanie chýba.** Mostná je v zóne SM-A: v pracovný deň spoplatnené do 16:00, v sobotu do 12:00,
   1 € prvá hodina, 2 € každá ďalšia; potom až do 22:00 zadarmo. Bezplatné záchytné parkovisko Nábrežie mládeže.
4. **– Príchod bez objednania.** Starý web: „8 kresiel – minimálne čakanie – rýchly servis, aj keď prídeš bez objednania.“
   Potvrdzuje to aj recenzia, ktorú web už cituje (Jana U.: „usadený do kresla bez rezervácie“). Nový web to nehovorí.
5. **– Romanine služby v Booqme:** 14 služieb (farbenie, farbenie na bielo a sivo, kreatívne farbenie, trvalá, tónovanie,
   prekrytie šedín, polióza, melír), 35–80 €, 40–180 min, termíny len **pondelok až streda**, platba na mieste alebo kartou
   online, bez zálohy. Web píše len „Farbenie, melír a trvalú robí Romana“ (tónovanie a prekrytie šedín chýbajú).
6. **– Neúplné údaje prevádzkovateľa v pätičke:** chýba sídlo a zápis v obchodnom registri (ORSR: FACEPALM, s.r.o.,
   Šalgovská ulica 1039/43, 951 15 Mojmírovce, OR Okresného súdu Nitra, oddiel Sro, vložka 52616/N) a DIČ zo starého webu.
7. **✖/? „Recepčná už 8 rokov, ako jediný barbershop v Nitre“** – verejné zdroje uvádzajú rok 2019 (ORSR zápis
   5. 3. 2019, živnosť kaderníctvo od 19. 9. 2019, starý web „Sme tu pre vás už roku 2019“) → k roku 2026 je to 7 rokov;
   „jediný v Nitre“ nie je overiteľné. Je to výslovné želanie majiteľa (CONTENT_SOURCES 13. 10.) – potvrdiť.
8. **– Bezbariérový vchod** (atribút na Google profile, ikona invalidného vozíka) – web neuvádza; potvrdiť u majiteľa.
9. **Google: 5,0 z 949 recenzií** (932× 5★, 11× 4★, 1× 3★, 1× 2★, 4× 1★); v dokumentácii je ešte 945 (13. 10.).
   Web číslo zámerne nezobrazuje (MASTER_BRIEF) – ak ho majiteľ chce, len s dátumom a odkazom na profil.
10. **Facebook a Instagram nie sú čitateľné bez prihlásenia** (FB presmeruje na prihlásenie, IG HTTP 429/401).
    Novinky, produkty a bio: doplniť – od majiteľa.

Hlavná rezervácia **nie je Booqme**: Google profil (tlačidlo rezervácie aj web) a starý web vedú na vlastný systém
https://www.barbershop30.sk/rezervacia (web má 30 takých odkazov). Booqme `barbershop30` má len jednu pracovníčku (Romana)
a jej farbiace služby. To je v súlade s webom; „Booqme rezervácia“ v zadaní platí len pre tieto služby.

## 1. Booqme – https://booqme.app/sk/rezervacia/barbershop30 (oficiálne)

Stiahnuté dvakrát (11:41 a znova 12:2x UTC), zoznam služieb identický. Dáta z atribútov kariet služieb a z JSON
`Reservation/getAllowedDates`. Kategórie podľa nadpisov na stránke.

| ID | Kategória | Názov presne ako v Booqme | Trvanie | Cena | Web |
|---|---|---|---|---|---|
| 27788 | Farbenie | Farbenie na bielo  - krátke vlasy do 6cm | 120 min | 45,00 € | – |
| 27789 | Farbenie | Farbenie na bielo -dlhé vlasy  do 12 cm | 120 min | 65,00 € | – |
| 27790 | Farbenie | Farbenie na sivo  - krátke vlasy do 6cm | 120 min | 45,00 € | – |
| 27791 | Farbenie | Farbenie na sivo - Dlhé vlasy  do 12cm | 120 min | 65,00 € | – |
| 27792 | Farbenie | Klasicke Farbenie - krátke vlasy (čierna,hnedá a iné odtiene ) | 60 min | 40,00 € | – |
| 27793 | Farbenie | Klasicke Farbenie - dlhé  vlasy (čierna,hnedá a iné odtiene ) | 80 min | 60,00 € | – |
| 27797 | Farbenie | Extravagantný štyl - kreatívne farbenie | 180 min | 80,00 € | – |
| 27795 | Trvalá - kučeravé vlasy | Trvalá ondulácia do 6cm | 90 min | 45,00 € | – |
| 27796 | Trvalá - kučeravé vlasy | Trvalá ondulácia do 12 cm | 120 min | 60,00 € | – |
| 27798 | Tónovanie vlasov | Tónovanie Vlasov  - krátke vlasy | 40 min | 35,00 € | – |
| 27799 | Tónovanie vlasov | Tónovanie vlasov -dlhé vlasy | 60 min | 40,00 € | – |
| 27800 | Profesionalne prekrytie šedín | Prekrytie  šedín | 60 min | 40,00 € | – |
| 27802 | Polióza-strata pigmentu | Poliózia efekt dofarbenie bieleho  prameňa | 60 min | 40,00 € | – |
| 27794 | Melír | Melír - blond/sivy/biely | 90 min | 45,00 € | – |

Ďalšie fakty z Booqme:

| Fakt | Hodnota | Web |
|---|---|---|
| pracovníci | „Romana“ a voľba „Nezáleži – pracovník bude pridelený náhodne“; všetkých 14 služieb má `data-allowed-workers="9387"` (jedna pracovníčka) | ✔ web: „Farbenie, melír a trvalú robí Romana“ |
| dni s voľnými termínmi | len **pondelok, utorok, streda** (44 dní od 20. 10. 2026 do 27. 1. 2027; `dates-romana.json`) | – |
| dopredu | online najviac do 27. 1. 2027 (asi 14 týždňov) | – |
| platba | „Platba na mieste – Žiadna platba vopred. Zaplatíte až na mieste.“ alebo „Platba kartou online – Zaplatíte vopred kartou online.“ | – |
| záloha, schválenie | pri všetkých službách `payment-required=0`, `advance-payment=0`, `approve-required=0` (bez zálohy, bez schvaľovania) | – |
| počet osôb | 1 (pri všetkých službách) | – |
| storno podmienky | na verejnej stránke nie sú (len odkaz na všeobecné VOP Booqme) | doplniť – od majiteľa |
| darčekové poukážky | e‑shop https://booqme.app/sk/eshop/barbershop30: „toto zariadenie nemá dostupné žiadne poukážky na predaj“ | – |
| profil https://booqme.app/sk/barbershop30 | 404 (Booqme nemá verejný profil, len rezerváciu) | – |
| jazykové verzie rezervácie | cs, de, en, es, fr, hr, hu, it, pl, ro, uk (odkazy `hreflang` na stránke) – srbčina nie; srbčine je najbližšia `hr` | ✔ web posiela jazyk, srbčina → en (README) |
| údaje podniku (JSON‑LD Booqme) | „Barbershop30“, Mostná 30, 949 01 Nitra, +421 951 267 203, **geo 48.3155884, 18.0905691**, hodnotenie 5 z 2 recenzií | ✔ adresa a telefón; geo na webe chýba |
| popisy služieb | Booqme má dlhé popisy (napr. trvalá: „Konzultáciu a návrh výsledného štýlu, aplikáciu trvalej ondulácie, tvarovanie účesu, záverečný styling a odporúčania na domácu starostlivosť“) | – |

Porovnanie s `CONTENT_SOURCES.md` (9. 10.: „farbenie 40–80 €, trvalá 45–60 €, tónovanie 35–40 €, melír 45 €“): ceny sedia,
pribudli alebo neboli vypísané **prekrytie šedín 40 €** a **polióza 40 €**. Web Booqme ceny zámerne nezobrazuje
(„aby neboli dva cenníky na jednom mieste“) – nie je to rozpor, len rozhodnutie, ktoré môže majiteľ zmeniť.

## 2. Vlastný rezervačný systém – https://www.barbershop30.sk/rezervacia (oficiálne)

Dáta komponentu `<v-order-component data=…>` a odpovede `/rezervacia/ajax` (stiahnuté 20. 10. 11:42–11:43 UTC).

| Fakt | Hodnota | Web |
|---|---|---|
| 15 služieb, ceny a trvania | Pánsky strih 18 € 40 min; s úpravou brady 28 € 60 min; malí gentlemani 15 € 45 min; úprava brady 15 € 20 min; nad 10 cm 22 € 60 min; Balíček 1 30 € 65 min; Ultra inclusive 40 € 80 min; pleť PREMIUM 21,5 € 30 min; Hot Towel 15 € 30 min; oholenie hlavy 13 € 25 min; obočie 3 € 5 min; depilácia 5,5 € 10 min; ornament 4 € 10 min; farbenie brady 10 € 30 min; farbenie obočia 5 € 10 min | ✔ všetkých 15 cien a trvaní sedí aj v JSON‑LD |
| posledná zmena cenníka v systéme | `updated_at` 2026‑02‑05 (väčšina služieb), 2024‑12‑01 (strih, strih s bradou) | – |
| pracovníci | „Nezáleží“ + Nikolas, Kristián, Damian, Michal, Andy, Dominika (Barberka), Kevin, Lajko, Jojo, Adrian | ✔ rovnaké mená, roly a poradie |
| voľba „Nezáleží“ | dá sa objednať bez výberu barbera | – (web: „Svojho človeka si vyberieš v rezervácii“) |
| ako ďaleko dopredu | kalendár `limits`: od 20. 10. 2026 do 20. 11. 2026 = **mesiac dopredu** | – (web: „Online 24/7“) |
| zatvorené dni v kalendári | nedeľa; sviatky 1. 1., 6. 1., Veľký piatok, Veľkonočný pondelok, 1. 5., 5. 7., 29. 8., 1. 11., 24., 25., 26. 12. (2026 aj 2027); **neblokuje** 8. 5., 1. 9., 15. 9., 17. 11. | ✖ tabuľa „Dnes“ sviatky nepozná |
| kroky rezervácie | služba → pracovník → termín → meno, priezvisko, e‑mail, telefón | – |
| po rezervácii | e‑mail s detailmi; „pre zmenu rezervácie nás neváhajte kontaktovať telefonicky alebo emailom“ | – |
| pripomienka | texty v systéme: e‑mail „Pripomenutie Vášho termínu … Zajtra“ a SMS „…pripomenut Vas zajtrajsi rezervovany termin o :time…“ – že sa naozaj posielajú: doplniť – od majiteľa | – |
| storno podmienky | nie sú zverejnené | doplniť – od majiteľa |

`docs/CONTENT_SOURCES.md` má pri trvaniach ešte „None min“; trvania už systém vracia a web ich má správne – dokument zastaral.

## 3. Google profil – https://www.google.com/maps?cid=18132360254733427623 (tretia strana)

Načítané v Chromiu (sk‑SK), obmedzené zobrazenie Máp bez prihlásenia; karta „Informácie“ sa v ňom nenačítala.

| Fakt | Hodnota | Web |
|---|---|---|
| názov | Barbershop30 Nitra | ✔ (Barbershop 30) |
| kategória | Holičstvo | ✔ JSON‑LD `BarberShop` |
| hodnotenie | **5,0 z 949 recenzií**; 932× 5★, 11× 4★, 1× 3★, 1× 2★, 4× 1★ | – číslo zámerne nie (MASTER_BRIEF); dokument má 945 z 13. 10. |
| adresa | Mostná 226/30, 949 01 Nitra (226 = súpisné číslo) | ✔ Mostná 30 |
| Plus Code | 838R+77 Nitra | – |
| telefón | +421 951 267 203 | ✔ |
| web a rezervácia | obe položky vedú na barbershop30.sk | ✔ |
| hodiny | Po–Pi 9–19, So 9–14, Ne zatvorené | ✔ |
| prístupnosť | „Bezbariérový vchod“ (ikona vozíka pri kategórii) | – potvrdiť u majiteľa |
| ďalší atribút | „Vhodné pre komunitu LGBTQ+“ | – rozhodnutie majiteľa, či uviesť |
| fotky | 98 (cudzie aj vlastné; na web nepreberať, web má len fotky majiteľa) | – |
| recenzie s „bez rezervácie“ | recenzia „pred mesiacom“ (k 20. 10.), ktorú web už cituje (Jana U.), hovorí o usadení „bez rezervácie“ | ✔ citát je na webe |
| poloha na mape | Mostná medzi Podzámskou a Kmeťkovou, pri ceste sú zastávky MHD (ikony na mape, názvy nečitateľné) | – názov zastávky: doplniť |

## 4. Facebook a Instagram

| Zdroj | Výsledok 20. 10. | Čo je známe | Web |
|---|---|---|---|
| https://www.facebook.com/barbershop30nitra/ | curl aj prehliadač → presmerovanie na prihlásenie (HTTP 400 / login) | 13. 10.: 28 odporúčaní, 100 % (CONTENT_SOURCES) | ✔ odkaz v pätičke |
| https://www.instagram.com/barbershop30_nitra/ | HTTP 429 a API `require_login` | nič nové | ✔ odkaz (@barbershop30_nitra) |

Popis, novinky, akcie a produkty z oboch sietí: **doplniť – od majiteľa** (snímka profilu alebo text). Vyhľadávače
(WebSearch) profil neindexujú.

## 5. Starý web https://www.barbershop30.sk (oficiálne, beží, 200, 57 336 B)

Čo je tam navyše oproti novému webu:

| Na starom webe (doslova) | Nový web | Poznámka |
|---|---|---|
| „8 kresiel – minimálne čakanie – rýchly servis, aj keď prídeš bez objednania.“ | – | príchod bez objednania; potvrdiť, či platí aj dnes |
| „Hľadáte darček? … inšpirujte sa našou ponukou darčekových poukážok.“ (bez odkazu, bez cien) | – | Booqme e‑shop prázdny → forma a predaj: doplniť – od majiteľa |
| „…používame iba vysoko kvalitné produkty lídrov na trhu, ktoré si samozrejme môžete u nás aj zakúpiť…“ | – | predaj produktov; značky: doplniť – od majiteľa (ORSR má aj maloobchod) |
| „Vždy pripravená recepčná – ochotne ti poradí…“ | ✔ recepčná | |
| „Online rezervácie 24/7“, „Káva a minerálka zadarmo“, „Striháme aj deti“, „Sme tu pre vás už roku 2019“ | ✔ | |
| Kontakt: „Facepalm s.r.o., IČO: 52231381, **DIČ: 2120952218**“ | ✖ čiastočne (DIČ chýba) | |
| prepínač SK/EN (Google prekladač), kontaktný formulár | – | netreba |
| stránky GDPR, ochrana osobných údajov, sitemap | 404 | starý web ich nemá |
| analytika GTM‑K8PZD4KR, GA4 G‑D9FMT63FQC | – | nový web bez analytiky (zámer) |

## 6. Prevádzkovateľ – ORSR, výpis z 20. 10. 2026 (oficiálne, aktualizácia 19. 10. 2026)

https://www.orsr.sk/vypis.asp?ID=554260&SID=9&P=0 (anonymizovaný text: `zdroje/firma/orsr-vypis-anonym.txt`).

| Údaj | Hodnota | Web |
|---|---|---|
| obchodné meno | FACEPALM, s.r.o. | ✔ |
| IČO | 52 231 381 | ✔ |
| sídlo | Šalgovská ulica 1039/43, 951 15 Mojmírovce (od 16. 7. 2022) | – chýba |
| zápis | Obchodný register Okresného súdu Nitra, oddiel Sro, vložka č. 52616/N, deň zápisu 5. 3. 2019 | – chýba |
| DIČ | 2120952218 (starý web; v ORSR sa neuvádza) | – chýba |
| predmet súvisiaci s prevádzkou | Pánske, dámske a detské kaderníctvo (od 19. 9. 2019); maloobchod (od 5. 3. 2019); Mimoškolská vzdelávacia činnosť (od 23. 2. 2023); organizovanie športových, kultúrnych a iných spoločenských podujatí | ✔ „od roku 2019“; vzdelávacia činnosť je nepriama opora pre „Školenia“, nie dôkaz miesta ani značky |
| štatutár a spoločník | fyzická osoba – údaje sa zámerne nepreberajú | – |

FinStat vrátil 403, register RPO (api.statistics.sk) neodpovedal; ORSR stačí. Platiteľ DPH (IČ DPH): neoverené.

## 7. Parkovanie pri Mostnej 30 – mesto Nitra (tretia strana, úrad)

Zdroj: https://nitra.sk/parkovanie/ (vytvorené 18. 3. 2026, upravené 13. 8. 2026; text v `zdroje/parkovanie/nitra-parkovanie.txt`)
a https://nitra.sk/od-jula-platia-zmeny-v-parkovani/ (30. 6. 2026: SM-A od 1. 7. 2026 v pracovné dni do 16:00 namiesto 18:00).

| Fakt | Hodnota |
|---|---|
| zóna | **SM-A** (v zozname ulíc: „…Kmeťkova…, Mostná, Mudroňova…, Podzámska…, Wilsonovo nábrežie…“) |
| spoplatnené | pracovný deň 00:00–16:00 a 22:00–24:00; sobota 00:00–12:00; nedeľa a sviatok 22:00–24:00 |
| teda zadarmo počas otváracích hodín | **Po–Pi od 16:00 do 19:00, sobota od 12:00 do 14:00** (odvodené z tabuľky) |
| cena | prvá hodina 1 €, každá ďalšia začatá hodina 2 € |
| platba | webová aplikácia datamesta.nitra.sk (aj 15 min), parkovací automat (karta alebo hotovosť, aj 30 min, nevydáva), SMS na **2200** v tvare `NRSMA EČV hodiny` (príklad „NRSMA AA123BC 1“) |
| pozor | Parkové nábrežie a Na Predmostí (blízko) sú spoplatnené nonstop, SMS `NRSMA24 EČV H` |
| ŤZP | s preukazom ŤZP 4 hodiny denne zadarmo v SM-A po registrácii EČV v datamesta.nitra.sk |
| bezplatné záchytné parkovisko najbližšie | **Nábrežie mládeže** (druhý breh Nitry; na mape oproti Mostnej) – pešia vzdialenosť: zmerať alebo doplniť – od majiteľa |
| má prevádzka vlastné miesta? | doplniť – od majiteľa |

## 8. Rozpory a nepotvrdené tvrdenia na dnešnom webe

| # | Na webe | Zdroj hovorí | Návrh |
|---|---|---|---|
| R1 | pätička „Vernostná kartička“ → https://www.headspa30.sk/vernost/karta/ | 404, stránka HEAD SPA 30 s jej telefónom | kým systém nebeží, odkaz skryť alebo viesť na recepciu/telefón; po nasadení `vernost/` na headspa30.sk a hesle v GitHube odkaz vrátiť |
| R2 | tabuľa „Dnes“: Po–Pi 9–19, So 9–14 aj na sviatok | rezervačný systém sviatky blokuje | doplniť zoznam sviatkov a stav „Sviatok, over si telefonicky“ alebo hodiny od majiteľa |
| R3 | „Ako jediný barbershop v Nitre ju máme už 8 rokov.“ (karta Poď ďalej + fakt „Recepcia“) | ORSR a starý web: od 2019 (7 rokov) | potvrdiť u majiteľa rok a „jediný“; inak „Pri dverách ťa privíta recepčná.“ |
| R4 | „Školenia – na poschodí, pod značkou Barbershop 30“ | ORSR: mimoškolská vzdelávacia činnosť od 2023 (nepriama opora), miesto a značka neoverené | potvrdiť; ideálne odkaz na stránku školení |
| R5 | „8 kresiel v troch miestnostiach“ | 8 kresiel ✔ (starý web); „v troch miestnostiach“ nemá zdroj v CONTENT_SOURCES | potvrdiť počet miestností |
| R6 | pätička „Prevádzkovateľ: FACEPALM, s.r.o., IČO 52231381“ | chýba sídlo, zápis v OR, DIČ | doplniť jeden riadok (údaje v časti 6) |
| R7 | `docs/CONTENT_SOURCES.md`: trvania „None min“, Google 945 recenzií | systém má trvania, Google 949 | aktualizovať dokument (nie web) |

Ostatné údaje (adresa, telefón, e‑mail, hodiny, 15 služieb s cenami a trvaním, tím 10 ľudí s rolami, odkazy na Instagram,
Facebook, Google profil a Booqme) sú **v zhode** so všetkými zdrojmi.

## 9. Návrhy doplnení (pravdivé texty, krátko, tykanie)

Každý nový viditeľný text potrebuje kľúč vo všetkých `assets/i18n/*.json` (sk, en, uk, hu, sr, pl, de, cs) a test
`node source/tools/i18n-test.mjs`. Nič z toho neprekrýva dávky D1–D5 (výkon a čierne okná); ide do D6 (doplnenie).

| Kde | Text (návrh) | Zdroj |
|---|---|---|
| kontakt, zoznam faktov | **Parkovanie** – Mostná je v zóne SM-A. V pracovné dni po 16:00 a v sobotu po 12:00 parkuješ zadarmo. | nitra.sk/parkovanie |
| kontakt, pod tým malým | Inak 1 € prvá hodina, potom 2 €. Lístok cez datamesta.nitra.sk alebo SMS na 2200. | nitra.sk/parkovanie |
| kontakt alebo karta Poď ďalej | Prídeš aj bez objednania. Keď je kreslo voľné, sadneš si hneď. | starý web; recenzia na webe (potvrdiť aktuálnosť) |
| rezervácia | Termín si rezervuješ online až mesiac dopredu. Deň vopred ti príde pripomienka. | kalendár systému; pripomienka – potvrdiť u majiteľa |
| rezervácia | Barbera vyberať nemusíš, stačí „Nezáleží“. | rezervačný systém |
| služby, Romana | Farbenie, melír, trvalú, tónovanie a prekrytie šedín robí Romana, v pondelok až stredu. Platíš na mieste. | Booqme |
| služby, Romana (ak majiteľ povolí ceny) | Farbenie od 40 €, trvalá od 45 €, tónovanie od 35 €, melír 45 €. | Booqme (rozhodnutie o dvoch cenníkoch) |
| kontakt | Bezbariérový vchod. | Google atribút – potvrdiť |
| pätička | FACEPALM, s.r.o., Šalgovská ulica 1039/43, 951 15 Mojmírovce, IČO 52 231 381, DIČ 2120952218, zapísaná v OR Okresného súdu Nitra, odd. Sro, vl. č. 52616/N. | ORSR, starý web |
| JSON‑LD (bez textu na stránke) | `"geo": {"@type":"GeoCoordinates","latitude":48.3155884,"longitude":18.0905691}`, `"hasMap": "https://www.google.com/maps?cid=18132360254733427623"` | Booqme JSON‑LD, Google |
| tabuľa „Dnes“ | na sviatok (zoznam z rezervačného systému): „Sviatok“ + stav podľa hodín od majiteľa | rezervačný systém |

Nedopĺňať: počet recenzií ako tvrdenie bez dátumu a odkazu, aggregateRating v JSON‑LD (vlastné hodnotenie podniku
vyhľadávače pre LocalBusiness nezobrazujú a pôsobí ako samochvála), fotky z Google (nie sú majiteľa), atribút LGBTQ+
bez výslovného súhlasu majiteľa.

## 10. Otázky pre majiteľa (doplniť – od majiteľa)

1. Sviatočné hodiny: ste zatvorení v dni, ktoré blokuje rezervácia (24.–26. 12., 1. 1., 6. 1., Veľká noc, 1. 5., 5. 7., 29. 8., 1. 11.)? Ste otvorení 17. 11.?
2. Platí stále „aj keď prídeš bez objednania“?
3. Storno: dokedy sa dá termín zrušiť alebo presunúť a ako (telefón, e‑mail, odkaz v e‑maile)? Posiela systém SMS pripomienku?
4. Darčekové poukážky: predávate ich? Na sumu alebo na službu, kde sa kupujú, platnosť?
5. Produkty na predaj: ktoré značky (pomáda, olej na bradu…)?
6. Platba v prevádzke: karta, hotovosť, iné?
7. Bezbariérový vchod: platí (prah, schod, šírka dverí)?
8. Parkovanie: máte vlastné miesta alebo dohodu s parkoviskom? Ktorá zastávka MHD je najbližšie?
9. Recepcia „8 rokov“ a „jediný v Nitre“: od ktorého roku a podľa čoho?
10. Školenia: odkaz alebo kontakt, pod akým názvom bežia?
11. Romana: smieme na webe uviesť ceny z Booqme a dni Po–St?
12. Vernostná kartička: kedy nasadiť `vernost/` na headspa30.sk a nastaviť heslo `VERNOST_HESLO_BARBERSHOP`?
13. Facebook a Instagram: pošlite snímku profilu a posledných noviniek (bez prihlásenia sa nedajú prečítať).

## 11. Dôkazy (všetko v `chyba/fakty/zdroje/`)

| Súbor | Čo dokazuje |
|---|---|
| `booqme2/rez.html`, `booqme2/sluzby.jsonl`, `booqme/sluzby.jsonl` | 14 služieb Booqme, dve zhodné stiahnutia |
| `booqme2/dates-romana.json` | Romana: len Po–St, do 27. 1. 2027 |
| `booqme/booqme.app_sk_eshop_barbershop30.html` | e‑shop bez poukážok |
| `web/rezervacia.html`, `web/rez-parsed.json`, `web/ajax.txt`, `web/kalendar.json` | vlastný systém: služby, trvania, pracovníci, horizont, sviatky, texty pripomienok |
| `web/home.html` | starý web: bez objednania, poukážky, produkty, DIČ |
| `google/panel.jpg`, `google/prehlad.jpg`, `google/panel.txt`, `google/aria.txt` | Google: 5,0 (949), rozdelenie, adresa, Plus Code, hodiny, bezbariérový vchod (mená recenzentov odstránené) |
| `firma/orsr-vypis-anonym.txt` | ORSR bez osobných údajov |
| `parkovanie/nitra-parkovanie.txt` | zóny, časy, ceny, platba, záchytné parkoviská |
| `ine/vernost-karta.html`, `ine/live-index.html` | 404 vernostnej kartičky, odkaz naživo |
| `fb/fb.html`, `ig/profil.json` | FB len prihlásenie, IG 429/require_login |
| `../skripty/*.py, *.mjs` | spracovanie (rez.py, booqme.py, text.py, gmaps.mjs, gmaps-info.mjs, stranka.mjs) |

Poznámka k nástrojom: Chromium v kontajneri nedôveruje CA proxy z NSS úložiska (úložisko z 27. 9.); prehliadač sa spúšťal
s `--ignore-certificate-errors-spki-list` = odtlačok verejného kľúča presne tejto CA (`/root/.ccr/agent-proxy-ca.crt`),
nie s vypnutým overovaním. Overpass (OpenStreetMap) proxy odmietla, preto názov zastávky MHD chýba.
