# Stavebniny Richtárik – povolené fakty so zdrojom

Toto je jediný zdroj pravdy pre texty webu aj pre odpovede asistenta. **Čo tu nie je, na web nepatrí.**
Text sa smie preformulovať, skrátiť a preskupiť, význam a čísla musia ostať.

**Ako čítať zdroje**

- `PJ:kľúč` je kľúč v `stavebniny-richtarik/zdroj/pages.json`. Riadok `PW:N` je riadok v jeho čistom texte
  `nastroje/povodny-web.txt`, ktorý sa vytvorí príkazom `venv/bin/python -I nastroje/pages_text.py zdroj/pages.json povodny-web.txt`.
- `PDF s.N` je strana N v `stavebniny-richtarik/pdf/662.pdf`, teda v cenníku akcií z 28. 1. 2026 (4 strany, `pdftotext -f N -l N -layout`).
- `web:súbor:riadok` je dnešný web, strom `hs-richtarik-obnova/stavebniny-richtarik` na vetve `richtarik-dokoncenie` (HEAD 4b2646bf).
- Značka ⚠ znamená, že tvrdenie na webe dnes je bez opory alebo je sporné. Prehľad je v časti I.
- Značka ❓ znamená otvorenú otázku majiteľa. Predvolené znenie sa nemení, čaká na odpoveď.

---

## A. Firma a kontakt

| Fakt | Presné znenie na webe | Zdroj | Dnešný web |
|---|---|---|---|
| Obchodný názov | Ing. Mário Richtárik - Stavebniny (pôvodne „Ing. Mário Richtárik-STAVEBNINY“) | PJ:kontakt, PW:1937 | build.py:69 |
| Značka | Stavebniny Richtárik | PJ:o-nas, PW:2720 | všade |
| Adresa | Novozámocká 62/68, 949 05 Nitra – Horné Krškany | PW:1938–1939 | build.py:70 |
| Pozvanie do predajne | predajňa v Nitre-Horných Krškanoch na Novozámockej ulici č. 68 | PJ:uvod, PW:4 | kontakt.html:46 |
| Pevná linka (aj fax) | 037 651 17 77 (pôvodne „tel./fax: 037/651 17 77“) | PW:1941 | build.py:72 |
| Mobil | 0905 622 223 | PW:1942 | build.py:71 |
| E-mail | info@stavebninyrichtarik.sk | PW:1944 | build.py:73 |
| Web | www.stavebninyrichtarik.sk | PW:1943 | canonical |
| IČO | 45959846 | PW:1945 | build.py:73 |
| DIČ | SK1083167855 (pôvodne „SK 1083167855“) | PW:1946 | build.py:73 |
| Otváracie hodiny | pondelok – piatok 7:00 – 16:00, sobota 7:00 – 12:00 (nedeľa sa neuvádza, takže „v nedeľu zatvorené“ nepíšte) | PW:1947–1949 | build.py:643 |
| Založenie | rodinná firma založená v roku 1997 | PW:2720 | o-nas.html:50 |
| Zakladateľ | Stavebniny Richtárik založil Ing. Mário Richtárik v roku 1997. Meno je z obchodného názvu, rok z O nás, spojenie je odvodené. | PW:1937 + PW:2720 | index.html:115 |
| Účel založenia | „za účelom rozšírenia doteraz ponúkaných služieb v stavebníctve“ | PW:2720 | o-nas.html:50 |
| Hlavný profil | predaj a sprostredkovanie stavebného materiálu | PW:2720 | o-nas.html:50 |
| Ľudia | majiteľ spolu s personálom majú dlhoročné skúsenosti v oblasti stavebníctva | PW:2720 | index.html:115 |
| Personál | zaškolený personál vám ochotne poradí pri výbere z veľmi širokého sortimentu; personál je neustále školený, pretože trh so stavebným materiálom sa neustále mení | PW:2721 | o-nas.html:50 |
| Hodnota | „Najdôležitejšia je pre nás vaša spokojnosť.“ | PW:2722 | o-nas.html:50 |
| Výrobcovia | produkty popredných slovenských aj svetových výrobcov | PW:9 | katalog/index.html, sluzby.html:49 |
| Systém zliav s výrobcami | dovoľuje predávať vo výhodných cenách stavebným firmám, individuálnym stavebníkom aj spolupracujúcim stavebninám | PW:9 | katalog/index.html |
| Výstavy | Domexpo Nitra 2010, Agrokomplex 2011, Agrokomplex 2012, Gardenia 2012 (fotogaléria) | PJ:fotogaleria__* (PW riadky s ##### fotogaleria) | galeria/index.html:50 |
| Reklama | Reklama Spravodaj Nitra 2010, reklamná tabuľa na plote | PJ:akciovy-letak, PW:195–196 | letak.html:56 |
| Mapa | Google Maps, odkaz `hasMap` je v JSON-LD | technický údaj z pôvodného webu (PJ:kontakt__googlemap) | index.html:27 |

## B. Služby, doprava a platby

| Fakt | Zdroj | Dnešný web |
|---|---|---|
| Predaj stavebného materiálu v celom sortimente | PW:27, PW:2729 | sluzby.html:49 |
| Bezplatný výpočet spotreby stavebného materiálu | PW:28, PW:2730 | sluzby.html:49, index.html:102 |
| Bezplatná poradenská činnosť | PW:29, PW:2731 | sluzby.html:49 |
| Poradenstvo a vypracovanie cenových ponúk sú zadarmo | PW:2722, PW:9 („zdarma vypracujeme cenové ponuky a samozrejme aj poradíme“) | index.html:101, 115 |
| Poskytovanie množstevných zliav | PW:30, PW:2732 | sluzby.html:49 |
| Výpočet krytiny zdarma, doprava zdarma (pri strešných krytinách) | PDF s.4 („STREŠNÉ KRYTINY V SUPER CENE – Výpočet krytiny ZDARMA, doprava ZDARMA“) | na webe nie je |
| Predaj reziva, krovy na mieru | PDF s.4, PW:20 | katalog/stavebne-rezivo.html |
| Doprava vlastnou nákladnou dopravou na miesto stavby, ktoré určíte, v rámci celého Slovenska | PW:9 | index.html:55, 100 |
| Tovar dovezieme priamo k vám, bez zbytočného skladovania, čím sa znižuje riziko poškodenia pri viacnásobnom prekladaní | PW:2736 | sluzby.html:49 |
| Autá: Avia 3,5 t a nákladné auto 8 t s mechanickou rukou | PW:31 („Avia 3,5t a Iveco s mech.rukou 8t“), PW:2736 („AVIA 3,5 tony a LIAZ 8 ton s mechanickou rukou“) | index.html:55, 100 (Iveco); sluzby.html:49 (LIAZ) ❓ |
| Skutočné fotky áut (červená Avia, modré auto s hydraulickou rukou na dvore) | img/p/883–885 z pôvodného webu (PJ:sluzby imgs). Zostrih som otvoril: `nastroje/sluzby-auta-883-885.jpg` | sluzby.html:51, index.html:98 |
| Nákup stavebného materiálu na splátky cez Quatro (v zozname služieb zdroja preklep „Qatro“) | PW:9, PW:2734 | sluzby.html:49 |
| Platba platobnými kartami cez terminál VÚB banky (v zdroji „VUB banka“) | PW:32, PW:2735, PW:9 | sluzby.html:49, kontakt.html:53 |
| Vykládka sa môže platiť: Blachotrapez „Vykládka tovaru 40 € s DPH“, TermoBRIK „vykládka za poplatok“ | PW:53, PDF s.1, PDF s.2 | akcie/krytina-blachotrapez.html:46 |

## C. Zľavy a zákaznícka karta

| Fakt | Zdroj |
|---|---|
| Z akciových cien je ďalšia zľava: 5 % pri platbe v hotovosti a 3,3 % pri platbe platobnou kartou | PW:6, PDF s.1 |
| Zľava sa viaže na zákaznícku kartu („Príďte si k nám pre svoju zákaznícku kartu a získate všetky zľavy, ktoré sme pre vás pripravili“) | PW:8, PDF s.1 („ZÁKAZNÍCKA KARTA“) |
| Stavebné firmy, živnostníci a predajne stavebnín dostanú špeciálne zľavy | PW:7, PDF s.1 |
| Ceny v cenníku platia pri platbe v hotovosti, z ceny je už odrátaná 5 % zľava ❓ (znenie čaká na majiteľa, na webe build.py:104–105) | PDF s.1 |
| Pôvodný slogan sekcie: „ROZDÁVAME ZĽAVY.“ | PW:5 |

## D. Akcie

### D1. Cenník akcií z 28. 1. 2026 (pdf/662.pdf), aktuálny

Všetky ceny sú s DPH, ak nie je uvedené inak.

| Položka | Fakt | Strana |
|---|---|---|
| Hlavička | „Aktuálne akcie na vybrané druhy výrobkov 2026, aktualizované dňa 28. 01. 2026“ | s.1 |
| Palivové drevo buk | paleta 100×100 – 134,90 € za paletu s DPH | s.1 |
| Pezinská tehla (Leier), TermoBRIK | brúsená tehla, Dry systém TermoBRIK, s pojivom, lepidlo zdarma; individuálna cenová ponuka na konkrétny dom („pokúsim sa spraviť najlepšiu cenu“); doprava zdarma až na stavbu, vykládka za poplatok | s.1 |
| Komín Stadreko | „najlacnejší certifikovaný komínový systém“ ⚠ (pozri I-06); ceny kompletných komínov napr.: 10 m ø200/45 918 €, ø200/90 892 €, ø160/45 891 €, ø160/90 864 €; 8 m: 791 / 764 / 768 / 741 €; 6 m: 664 / 637 / 644 / 618 €; možnosť vyskladať rôznu výšku komína | s.1 |
| Betónové tvárnice | presné, pero + drážka; šalovacie 50×25×40 2,35 €, ×30 1,80 €, ×25 1,64 €, ×20 1,45 €, ×15 1,32 €, ×12 1,28 €/ks; stĺpové 20×20×25 1,57 €, 25×25×25 1,62 €, 30×30×25 2,01 €, 40×40×25 2,21 €, ø30/25 1,90 €; svahovka 35/19 sivá 4,38 €, žltá a červená 7,60 €; žľabovka 35×25 6 €, 50×16 5,42 € | s.1 |
| Lepidlá, omietky, malty | suchý betón 25 kg 3,75 €; jadrová omietka 25 kg 4,64 €; nivelizačný poter cementový 25 kg 9,95 €, sadrový 12,50 €; lepidlo na obklad a dlažbu C1T 25 kg 5,35 €; flexibilné C2TE 9,02 €; super elastik C2TE S1 14,11 €; fajnštuk 40 kg 6,60 €; jednovrstvová omietka MVR uni 40 kg 6,87 €; zateplenie UNI (lepenie + armovanie) 25 kg 6,67 € (všetko za vrece) | s.2 |
| Bianka (oprava starých chodníkov) | kamenivo + pojivo, 1,5 cm = 1 m²; od 22,80 €/m² prírodné kamenivo, od 31 €/m² drvený mramor; penetrák 0,89 kg/4 m² 15,50 €, regeneračný lak 1 kg/3 m² 17,50 € | s.2 |
| Novinka | dekoračné kamene (okruhliaky, granulát, rôzne farby), gabiónové koše v rôznych rozmeroch, chémia | s.2 |
| Krytina Blachotrapez | Diament eco 0,5 mm lesklý 9,22 €/m², matný 12,36; Kingas eco 9,22 / 12,36; Germania 25 9,73 / 13,06; Jánošík Relief wood 18,90 €/m²; platí nad 50 m²; trapézový plech T7 lesklý 8,53, matný 11,22, aluzinok 8,28 €/m²; T18+ 8,74 / 11,48 / 8,47 €/m²; hrúbka 0,5 mm; doprava nad 50 m² 17 € s DPH po celom Slovensku; do 50 m² + ochranná fólia 0,55 €/m²; podlimitná objednávka do 30 m² + 1,20 €/m²; vykládka 40 € s DPH | s.2 |
| Sadrokartón Norgips | 2×1,2 m (2,4 m²/ks); biely 6,22 €, zelený 9,70 €, červený 9,93 €/ks; príslušenstvo v akcii | s.2 |
| Betónové výrobky | dlažba Holland 20×10×4 sivá 10,45, farebná 12,11 €/m²; Holland 20×10×6 12,50 / 12,65; Behaton (háčko) 6 cm 10,50 / 11,80; Delano 4 cm 10,30 / 13,60; Delano 6 cm 11,64 / 13,60 €/m²; obrubník parkový 100×20×5 sivý 1,89, farebný 2,56 €/ks; 100×25×5 sivý 2,90; obrubník cestný 100×25×15 5,94; zatrávňovačka 60×40×8 2,57; štiepané plotové tvárnice 40×20×19 jednostranné sivé 2,86, farebné 3,75, obojstranné 3,35 / 4,20; štiepané krycie dosky 2,30 / 3,10 €/ks | s.3 |
| Cement | Cement R 325, 25 kg – 4,42 €/vrece; Cement R 425, 25 kg – 5,18 €/vrece | s.3 |
| Plastové výrobky | zatrávňovačka 60×40×4 sivá 6,30 €; nášľapný dielec 400 mm 4,20 €; záhonový chodník 360×115 mm, 1,2 m 13,90 €; plotová doska 78×21 mm 1 m 3,05 €, 1,2 m 3,60 € (hnedá, tehlová, sivá); platňa ryhovaná terasová 1500×330×30 mm 23,10 €; + doprava od výrobcu | s.3 |
| Pieskový biely | akcia, pri celom kamióne doprava zdarma až na stavbu | s.3 |
| Strešné okná RoofLITE | Solid Pine 78×118 + lemovanie TFX 283 €/ks; rôzne rozmery a druhy | s.3 |
| Delap Flex obklad | ohýbateľný obklad, 4 m²/balenie, rôzne tvary, 17,80 €/m²; flexibilné lepidlo biele 25 kg 16,70 € | s.4 |
| Omietky | silikónová omietka 25 kg/vedro 40,10 € + pigmentácia; akryl-silikón 25 kg 32,50 € + pigmentácia; soklová omietka Marmolit 1–1,6 mm, 25 kg = 5 m², 57,70 € | s.4 |
| Betónové striešky (sivé) | plotové 50×18 3,80 €, 50×21 4,05, 50×27 4,97, 50×31 5,36, 50×34 5,85, 50×36 6,33; stĺpové 49×49 7,70, 39×39 5,85, 30×30 5,11 €/ks | s.4 |
| OSB Kronopol | 2500×1250 mm (3,125 m²); 8 mm 13,70, 12 mm 16,58, 15 mm 22,71, 22 mm 34,90 €/ks | s.4 |
| Styrodur Fibrostir XPS | 1250×600 mm (0,75 m²/ks); 2 cm 1,90, 3 cm 2,85, 5 cm 4,80, 10 cm 9,60 €/ks | s.4 |
| Climowool 039 | 5 cm (18,48 m²/bal) 31,30 €; 8 cm (11,52 m²) 30,07; 15 cm (6,12 m²) 29,88; 20 cm (4,56 m²) 30,97 € za balenie | s.4 |
| Strešné krytiny | výpočet krytiny zdarma, doprava zdarma; predaj reziva, krovy na mieru | s.4 |

### D2. Akcie zo stránky Akcie pôvodného webu (bez dátumu ❓ „staré akcie bez dátumu“)

Na webe ostávajú v predvolenom znení, kým majiteľ nerozhodne. Zdroj je PJ:akcie, PW:38–97, plus podstránky `akcie__*`.

| Akcia | Znenie zdroja | PW |
|---|---|---|
| Pezinská tehla TermoBRIK | akcia – super ceny, brúsená tehla, Dry systém, s pojivom / zdarma lepidlo, individuálna ponuka | 40–43 |
| Komín Stadreko | akcia – „najlecnejší“ [sic] komínový systém na Slovensku ⚠; máme priamo na sklade, odber možný ihneď | 45–46 |
| Krytina Blachotrapez | doprava nad 50 m² 17 € s DPH po celom Slovensku; do 50 m² + fólia 0,55 €/m²; podlimitná do 30 m² + 1,20 €/m²; vykládka 40 € s DPH | 48–53 |
| Dlažba City Stone Design | zľava 15 – 30 % z cenníkových cien (objektové zľavy) | 55–56 |
| Okná, schody Fakro | akcia zľava 20 %: strešné okná, podkrovné stropné sklápacie schody, strešné doplnky, rôzne druhy a rozmery | 58–60 |
| Stavebné rezivo | super ceny: dosky, hranoly, strešné laty, foršne, tatranský obklad, palivové drevo, krovy na mieru | 62–63 |
| Stavebné náradie | náradie na stavbu, do záhrady, do domácnosti, do dielne; široká ponuka priamo na sklade | 65–67 |
| Zatepľovací a sadrokartónový systém | kompletný sortiment; polystyrén dovezieme priamo domov zdarma | 69–71 |
| Porfix | špeciálne zľavy; obvodové murivo, priečky, strop, lepidlá, malty; pri celom kamióne doprava až domov zdarma | 73–75 |
| Ytong | špeciálne zľavy; doprava pri celom kamióne zdarma až na stavbu | 77–78 |
| Garáže, záhradné domčeky | super ceny; doprava aj montáž po celom Slovensku zdarma | 80–81 |
| Betónové tvárnice | znížené ceny, základové aj stĺpikové tvárnice | 83–84 |
| Cement 325 / 425 | 4,42 / 5,18 €/vrece s DPH, cena platí pri platbe v hotovosti (zhoduje sa s PDF s.3) | 86–88 |
| Univerbau | znížené ceny: lepidlo mrazuvzdorné, na polystyrén, kvádre, flexibilné, nivelit, omietky hrubé, putzovky, murovacie malty, betónový poter | 89–90 |
| Climowool 039 | super ceny: šikmé strechy, vnútorné steny, stropy, podlahy, fasády, ploché strechy, technické izolácie | 92–93 |
| Strešné okná RoofLITE | akcia – super ceny | 95–96 |

Pôvodný web mal dátum aktualizácie 29. 01. 2026 (PW:3). Odkaz sa volal „CENNÍK AKTUÁLNYCH AKCII 2024.pdf“, ale súbor 662.pdf má dátum 28. 1. 2026.

## E. Novinky (PJ:novinky__*)

| Novinka | Overené fakty | PW |
|---|---|---|
| Dekoračné kamene | M16 mramorový okruhliak 2–4 cm a 4–6 cm, biely, 25 kg – 11,20 €; Nero Ebono ❓ okruhliak 3–5 cm, čierny, 25 kg – 10,75 €; kamenná kôra 1–3 cm a 3–10 cm, 25 kg – 8,95 €; ceny s DPH; z cien je odrátaná 5 % zľava pri platbe v hotovosti | 2226–2232 |
| Delap, ohybný kamenný obklad | akciová cena 17,80 €/m² s DPH pri platbe v hotovosti; balenie 4 m²; 7 tvarov; 1 m² váži cca 3 – 3,5 kg; dá sa lepiť aj na zateplené fasády (tvrdenie výrobcu) | PJ:novinky__delap… |
| Ekostyrén | plnivo do betónu z polystyrénovej drte; balenie PE vrecia 200 l; parametre podľa výrobcu (skúšky ČVUT, PAVÚS, SZÚ) | PJ:novinky__ekostyren |
| Garáže, záhradné domčeky | montované plechové garáže, typy 3511 – 6622, záhradné domčeky ZD11, ZD21; doprava a montáž v rámci Slovenska zdarma (stará akcia ❓); „Najlacnejšie garáže na Slovensku“ ⚠ | 2422–2423 a ďalej |
| Magic Floor | vinylové podlahy HOME (do domácnosti) a COMMERCIAL; vzorkovník; texty výrobcu | PJ:novinky__magic-floor… |
| Kamenný koberec Bianka (stránka „Stone“, Topstone) | úprava schodísk, balkónov, výjazdov, vstupov, dvorov a chodníkov; od 22,80 €/m² prírodný kameň, od 31 €/m² drvený mramor s DPH (zhoduje sa s PDF s.2) | PJ:novinky__topstone… |
| Výrobky z plastu | zatrávňovacie dlažby, chodníky, plotovky, profily, palety z recyklovaného plastu | PJ:novinky__vyrobky-z-plastu |
| Betónové výrobky | šalovacie diely DT 12 – 40, stĺpikové, skruže, poklopy, striešky, vinohradnícke stĺpy, bariérový plot, žľabovky (parametre z tabuliek zdroja) | PJ:novinky__betonove--vyrobky |

## F. Sortiment a značky

Na webe je 15 kategórií. Je to 15 kľúčov `katalog-roduktov__<kategória>` v pages.json: `grep -c '^##### katalog-roduktov__[a-z-]* ' povodny-web.txt` vráti **15**.
Značky sú z tabuliek značiek na kategóriových stránkach. Je ich **46 unikátnych kariet** (príkaz je v ZAPIS.md, T-12), takže tvrdenie „viac ako 40 značiek“ je pravdivé.

| Kategória (web) | Značky v katalógu (dnes, riadok 51) | Prehľad sortimentu v zdroji |
|---|---|---|
| Sypké zmesi | Cemmac, Calmit, Univerbau, Baumit, Murexin, Styrcon (+ podstránka Holcim) | PW:11, 1425 a ďalej |
| Murovací materiál | Pezinské tehelne, Porfix, Ytong, Betonárka Nadlice | PW:12, 485 a ďalej |
| Strešné krytiny | Tondach, Mediterran, KM Beta, Bramac, Blachotrapez, Onduline (+ podstránka Icopal) | PW:13, 961 a ďalej |
| Dlažby a ploty | Premac, Stadreko, City Stone Design | PW:14, 234 a ďalej |
| Izolačný materiál | Knauf Insulation, Isover/Orsil, Parapetrol, Parabit, Icopal, Optim, Easytherm, Den Braven, Ekostyrén (+ Nobasil, Climowool v texte) | PW:15, 355 a ďalej |
| Komínové systémy | Stadreko (komíny Qatro), Schiedel | PW:16, 370 a ďalej |
| Strešné okná | Velux, Fakro, RoofLITE (v zdroji „Rooflite“ aj „RoofLITE“) | PW:17, 1325 a ďalej |
| Hutný materiál | Yssel Steel, Raven | PW:18, 348 a ďalej |
| Dvere a okná | Masonite; bežné druhy priamo na sklade, určité druhy na objednávku | PW:19, PW:326 |
| Stavebné rezivo | Drepex; stavebné rezivo priamo na sklade; aktuálne aj palivové drevo agát | PW:20, PW:956 |
| Náradie a doplnky | Slovakia Trend, DS Haco | PW:21, 948 a ďalej |
| Podhľady a PVC | Transform Recykling; „výhradný predajca plastových výrobkov pre Nitru a okolie“ | PW:22, PW:936 |
| Sadrokartón a zateplenie | Stavebné profily, Masterplast | PW:23, 941 a ďalej |
| Fasádny systém | Baumit, Univerbau, Delap | PW:24, 340 a ďalej |
| Farby a laky | Het, Chemolak, Chemos, Elastik; čo nie je na sklade, „okamžite na požiadanie zabezpečíme“ (Chemolak) | PW:25, PW:333 |

**Stav skladu (len tieto, nič všeobecné):** komín Stadreko priamo na sklade, odber ihneď (PW:46). Náradie: široká ponuka priamo na sklade (PW:67). Rezivo priamo na sklade (PW:956). Masonite: bežné druhy na sklade (PW:326).
**Zásoby na fotkách:** skutočné fotky dvora od majiteľa (img/uvod: zasoba-tehly, zasoba-porfix, zasoba-stadreko, zasoba-rezivo, pas-dvor, dvor-predajna) a fotky dvora a predajne v img/g/73–106. Formulácia „dvor plný materiálu“ je povolená, čísla nie (počty paliet, m², tony).

## G. Tvrdenia výrobcov (len s pripísaním výrobcovi, nikdy ako naše tvrdenie ani v meta popise)

| Tvrdenie | PW | Dnes na webe |
|---|---|---|
| Holcim (Slovensko) a.s. je najväčším výrobcom a dodávateľom cementu na Slovensku | 1914 | popisy.py:55 ako náš popisok „Najväčší výrobca cementu na Slovensku“ ⚠, meta holcim |
| Schiedel: trojnásobná 30-ročná záruka, 60 rokov skúseností, najväčší podnik na svete špecializovaný na odvod spalín | 372, 419, 432, 445 | popisy.py:30, meta schiedel ⚠ |
| Tondach: najväčší výrobca pálených škridiel v strednej Európe | 1294 | katalog/stresne-kritiny/tondach.html |
| Magicfloor: „kanadskí vedci“, „obkladací materiál budúcnosti“ | PJ:novinky__magic-floor… | novinky/magic-floor… |
| Baumit „top značka“, Onduline „vynikajúca cena“ | PJ:katalog-roduktov__sypke-zmesy__baumit, …__onduline | meta baumit ⚠ |

## H. Otvorené otázky majiteľa (nemeniť predvolené riešenie)

1. ❓ **Staré akcie bez dátumu** (časť D2). Na webe ostávajú, ako sú.
2. ❓ **LIAZ alebo Iveco** (8 t s mechanickou rukou). Dnes je na úvode Iveco a na Službách LIAZ. V nových textoch odporúčam značku auta neuvádzať („nákladné auto 8 t s mechanickou rukou“), kým majiteľ neodpovie. Na Službách ostáva znenie zdroja.
3. ❓ **Znenie zľavy 5 % / 3,3 %** („z ceny je už odrátaná 5 % zľava“). Vetu ponechať doslova (build.py:104–105).
4. ❓ **Nero Ebono alebo Ebano.** Ponechať „Nero Ebono“ ako v zdroji (PW:2230).
5. ❓ **Hosting a HTTPS.** Netýka sa textov, len canonical a og:url.

## I. Na dnešnom webe bez opory alebo sporné (⚠)

| # | Text | Kde | Prečo | Návrh |
|---|---|---|---|---|
| I-01 | alt „Nákladné auto IVECO Stavebniny Richtárik s mechanickou rukou odbočuje z ulice do dvora plného materiálu“ | index.html:49 | opisuje vygenerovaný záber z filmu, ktorý majiteľ nechce | zmizne s filmom; nový alt opíše skutočnú fotku |
| I-02 | og:image a JSON-LD `image` = img/uvod/og.jpg na všetkých 75 stránkach; komentár „skutočný záber auta firmy z úvodného filmu“ | build.py:24, index.html:14 a 27 | og.jpg som otvoril: je to vygenerované auto s vymysleným nápisom „PREDAJ STAVEBNÉHO MATERIÁLU AUTODOPRAVA“, nie skutočný záber | nahradiť skutočnou fotkou dvora, opraviť komentár |
| I-03 | „Avia 3,5 t a Iveco 8 t“, „aj Ivecom s mechanickou rukou“ proti „LIAZ 8 ton“ | index.html:55 a 100; sluzby.html:49 | zdroj si protirečí ❓ | pozri H-2 |
| I-04 | „zložíme presne tam, kde ho na stavbe potrebuješ“ (4×) | index.html:84, 96, 98, 100 (build.py:1076, 1088, 1090, 1092) | zdroj hovorí „na miesto stavby, ktoré určíte“ a „priamo k vám“; „presne tam“ je prísľub navyše a vykládka sa niekde platí (B) | „dovezieme na miesto, ktoré určíte“ |
| I-05 | „Zavolaj, poradíme hneď“ | index.html:118 | „hneď“ zdroj nemá | „Zavolajte, poradíme vám“ |
| I-06 | „Najlacnejší komínový systém na Slovensku“ | index.html:88, akcie/index.html:50, akcie/komin-qatro.html:46 + meta, katalog/kominove-systemy/qatro.html (meta) | vlastné tvrdenie majiteľa (PW:45, PDF s.1), ale neoveriteľný superlatív. Ako reklama je rizikový a pôsobí neprofesionálne | rozhodne majiteľ. Návrh: konkrétna cena z PDF s.1 („napr. komplet 6 m ø160/90 za 618 € s DPH“) |
| I-07 | „Najlacnejšie garáže na slovensku“, „Darujte dom vášmu autu!“ | novinky/garaze-zahradne-domceky.html:49–50 | stará akcia, superlatív, malé „slovensku“ | vypustiť superlatív, „Slovensku“ veľkým |
| I-08 | Popisok Holcim „Najväčší výrobca cementu na Slovensku“ ako náš text | popisy.py:55 | je to tvrdenie výrobcu (PW:1914) | „Podľa výrobcu najväčší…“ alebo vypustiť |
| I-09 | „Značky, ktoré máme na sklade alebo objednáme“ | index.html:77 (build.py:1069) | na objednávku je doložené len pri Masonite a Chemolaku | „Značky v našej ponuke“ |
| I-10 | Ledy kategórií: „vypočítame potrebu vrátane hrebeňov a doplnkov“, „Poradíme hrúbku a spočítame balíky presne na tvoju plochu“, „spočítame vrecia aj palety“ | build.py:181–185 | všeobecne kryté službou „bezplatný výpočet spotreby“; podrobnosti sú domyslené | „Spotrebu materiálu vám spočítame zadarmo.“ |
| I-11 | Stále platné akcie bez dátumu v ledoch kategórií: „Polystyrén ti dovezieme domov zdarma“, „Akcia: okná a schody Fakro so zľavou 20 %“ | build.py:187 a 193 | v cenníku 28. 1. 2026 nie sú ❓ | ponechať, kým majiteľ nerozhodne; nepridávať ich na ďalšie miesta |
| I-12 | „Poradíme, spočítame, dovezieme a zložíme“ | index.html:96 | „zložíme“ znie ako služba v cene, no vykládka sa pri niektorých akciách platí (PDF s.1, s.2) | „…a dovezieme na stavbu“ |

**Na webe a doložené (kontrola):** 1997 ✓, 15 kategórií ✓, viac ako 40 značiek ✓ (46), 5 % / 3,3 % ✓, Quatro ✓, VÚB ✓, doprava po celom Slovensku ✓, cenová ponuka a poradenstvo zadarmo ✓, dlhoročné skúsenosti ✓, výhradný predajca Transform Recykling pre Nitru a okolie ✓ (PW:936), palivové drevo agát ✓ (PW:956), Masonite v siedmich dekoroch ✓ (PW:19: biele, buk, dub, orech, jelša, javor, hruška).

## J. Zakázané (nikde na webe ani v asistentovi)

- počty paliet, ton, m² skladu, počet zákazníkov alebo áut, „X rokov skúseností“ (okrem „od roku 1997“ a „dlhoročné skúsenosti“), recenzie, hodnotenia, ocenenia, certifikáty firmy;
- „najlacnejší / najlepší / najväčší“ ako naše tvrdenie; záruky, ktoré nedáva výrobca; „vykládka zdarma“; „doručenie do 24 h“, „hneď“, „ihneď“ (okrem komína Stadreko);
- otváracie hodiny v nedeľu a sviatky, ceny mimo cenníka 28. 1. 2026 a stránok zdroja;
- slovo „AI“ v texte webu (výnimka: povinné označenie asistenta, pozri STYL.md §9).
