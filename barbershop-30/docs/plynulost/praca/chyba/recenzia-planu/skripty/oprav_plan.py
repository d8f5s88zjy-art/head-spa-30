# Opravy jasných chýb v PLAN-D6-D7.md (recenzia faktov a plánu, 20. 10. 2026)
import sys
cesta = sys.argv[1]
t = open(cesta, encoding='utf-8').read()
R = '`$SP/barber/chyba/recenzia-planu/`'
opravy = [
# 1 vernostná kartička v skratke pre majiteľa
("""   v pätičke aj každá neexistujúca stránka Barbershopu vedú na chybovú stránku HEAD SPA 30 s jej telefónom.
""",
"""   v pätičke aj každá neexistujúca stránka Barbershopu vedú na chybovú stránku HEAD SPA 30 s jej telefónom.
   Odkaz na kartičku preto skryjeme, kým systém kartičiek nebude spustený; potom sa vráti (otázka 15).
"""),
# 2 britva -> skutočný obsah fotky detail-stol
("   - britva,\n", "   - štetka na holenie a pomády na pracovnom stole,\n"),
# 3 stav D1 a rozsah D6a-0
("""   (`hs2`, vetva `barbershop-plynulost`, D1 je rozpracovaná). Preto idú až po zlúčení D5. Výnimkou je rýchla oprava
   **D6a‑0**, ktorá mení len súbory mimo D1–D5 (`/404.html` a jeden riadok pätičky). Overené v `davky.json` a na zozname zmien v
   `hs2`: pätičku ani `404.html` D1–D5 nemenia. D5 mení v `index.html` len hlavičku, prvé karty a galériu.""",
"""   (`hs2`, vetva `barbershop-plynulost`; D1 je od 20. 10. 13:11 commit `7ea247c`). Preto idú až po zlúčení D5. Výnimkou je rýchla
   oprava **D6a‑0**, ktorá mení len súbory mimo D1–D5: `/404.html`, jeden riadok pätičky `index.html`, `assets/vernost.js`,
   `.github/workflows/pages.yml`, `tools/ftp-balik.sh`, nové kľúče 404 v 7 slovníkoch, nový `barbershop-30/404.html`
   a `source/tools/over-404.mjs`. Overené v `davky.json` a v zozname zmien commitu `7ea247c`: D1 nemení ani jeden z nich.
   D5 mení v `index.html` len hlavičku, prvé karty a galériu; do slovníkov môže pridať kľúče, preto sa kľúče 404 pridajú
   ako samostatný blok a pri zlúčení sa slovníky overia `i18n-test.mjs`."""),
# 4 východisko rozpočtu HTML
("""4. **Rozpočet HTML.** `index.html` má dnes 14 380 B gzip (`gzip -9c`), strop je 14 600 B (prvé okno TCP, README, D2).
""",
"""4. **Rozpočet HTML.** `index.html` má dnes 14 380 B gzip (`gzip -9c`), strop je 14 600 B (prvé okno TCP, README, D2).
   D5 mení `index.html` (`sizes` galérie, karta Poď ďalej, načítanie filmu) a má ten istý strop 14 600 B, preto sa
   východisko pre D6a zmeria znova po zlúčení D5. Rozpočty nižšie (asi +100 až +150 B) platia voči tomuto číslu.
"""),
# 5 dôkaz N37
("| N37 | Lightbox: popis sa vymení skôr než fotka, tvrdý strih okolo 250 ms, bez švihu | POR‑08 | meranie `lightbox-tma.json` | D7 |",
 "| N37 | Lightbox: popis sa vymení skôr než fotka, tvrdý strih okolo 250 ms, bez švihu | POR‑08 | snímky `porovnanie/snimky/lightbox-dalsia-100ms.jpg` (nový popis nad starou fotkou) a `-250ms.jpg` (nová fotka); `lightbox-tma.json` sám zmenu neukazuje (`currentSrc` sa prepne hneď) | D7 |"),
# 6 R1 rozsah
("""  - Rozsah: mení sa `/404.html` a riadok pätičky `index.html:863` (D1–D5 ich nemenia).""",
 """  - Rozsah: `/404.html`, riadok pätičky `index.html:863`, `vernost.js`, `pages.yml`, `tools/ftp-balik.sh`, kľúče 404
    v slovníkoch (úplný zoznam v časti 1, bod 3; D1 ich nemení)."""),
("""  - Rozhodnutie sa mení, ak `hs2` začne meniť pätičku.""",
 """  - Rozhodnutie sa mení, ak `hs2` začne meniť pätičku, `vernost.js`, `pages.yml` alebo tie isté miesta slovníkov."""),
# 7 R4 dôkaz OSM
("""  - Použijú sa tie isté ako pri HEAD SPA 30 v tej istej budove (OSM way 58223421: 48.315655, 18.090439).""",
 """  - Použijú sa tie isté ako pri HEAD SPA 30 v tej istej budove (OSM way 58223421 = budova Mostná 226/30, ťažisko
    48.3156549, 18.0904390; overené cez API OpenStreetMap 20. 10. 2026, dôkaz `recenzia-planu/osm-way-58223421.json`
    a `osm-reverse-48.315655-18.090439.json`)."""),
# 8 404 cesta a FTP balík
("""   - inline skript v `<head>` súboru `/404.html` pri ceste `/head-spa-30/barbershop-30/…` nastaví na `<html>` triedu""",
 """   - inline skript v `<head>` súboru `/404.html` pri ceste so segmentom `/barbershop-30/` (github.io aj vlastná doména) nastaví na `<html>` triedu"""),
("""   - kópia `barbershop-30/404.html` sa pripraví pre vlastnú doménu (ErrorDocument) a `pages.yml` ju skopíruje.
""",
"""   - kópia `barbershop-30/404.html` sa pripraví pre vlastnú doménu (ErrorDocument) a `pages.yml` ju skopíruje,
   - `tools/ftp-balik.sh` kopíruje `/404.html` aj na headspa30.sk (HEAD SPA, bez priečinka Barbershopu). Blok Barbershopu
     a jeho skript sú preto medzi značkami `<!-- B30 -->` a `<!-- /B30 -->` a `ftp-balik.sh` ich z `_ftp/404.html` vymaže.
"""),
("""- Bez JavaScriptu ostane variant HEAD SPA (prijateľné, zriedkavé).
""",
"""- Bez JavaScriptu ostane variant HEAD SPA (prijateľné, zriedkavé).
- FTP balík HEAD SPA: `sh tools/ftp-balik.sh headspa30.sk` a potom `_ftp/404.html` nesmie obsahovať „0951 267 203“,
  „barbershop30.sk“ ani „Barbershop“ (grep v overení D6a‑0).
"""),
# 9 N07 – písmo je statický rez
("""   - `.price-name` a `.price-amount` dostanú `font-variation-settings` s optickou veľkosťou podľa veľkosti písma
     (`opsz` automaticky alebo okolo 24–36) a `font-variant-numeric: tabular-nums`.
   - Vzhľad (Fraunces 800, farba, rozloženie) sa nemení. Kontroluje sa výrez „13 €“ a „15 €“ pri DPR 1 a zalomenie názvov
     na 390 px.""",
"""   - Pozor: `assets/fonts/Fraunces-*.woff2` sú statické rezy s `opsz 144` (`fonts.css:2–3`, fonttools: bez tabuľky
     `fvar`, GSUB len `case`, `liga`, `rvrn`, `ss01`, bez `tnum`). `font-variation-settings` ani
     `font-variant-numeric: tabular-nums` preto vzhľad nezmenia; samotné zmazanie `opsz 144` v CSS nič neopraví.
   - Najprv príčina (Iron Law): či medzery „Páns ky s trih“ spôsobuje rez pre 144 pt pri 18–26 px, alebo strata
     vyrovnania párov pri orezaní písma (porovnať s pôvodným Fraunces v rovnakej veľkosti).
   - Až potom oprava podľa rozhodnutia (pozri nálezy recenzie): nový statický rez tej istej rodiny pre menšiu optickú
     veľkosť len pre cenník, alebo úprava veľkosti a medzier bez nového súboru.
   - Vzhľad (Fraunces 800, farba, rozloženie) sa nemení. Kontroluje sa výrez „13 €“ a „15 €“ pri DPR 1 a zalomenie názvov
     na 390 px."""),
("""  - `.price-name` ani `.price-amount` nemajú `opsz 144`.""",
 """  - výrezy „13 €“, „15 €“ a „Pánsky strih“ pred a po sa v pixeloch líšia (zmena je viditeľná, nie len v CSS)."""),
# 10 N08 – neoverený prekladač
("""   - V angličtine doplniť: „Its EN switch translates it automatically, or call +421 951 267 203.“ (prepínač je Google
     prekladač, `zdroje/bs30-rez.html`).""",
"""   - V angličtine doplniť: „Need help? Call +421 951 267 203.“ Vetu o prepínači EN nepridávať: prepínač je Google
     prekladač (`zdroje/bs30-rez.html`), ale pri skúške 20. 10. 2026 po výbere EN ostala stránka po 8 s po slovensky
     (1440 × 900) a na telefóne je prepínač skrytý v menu (dôkaz `recenzia-planu/rez-en-d.jpg`, `skripty/rez-en.mjs`).
     Vetu možno vrátiť len po úspešnej skúške na telefóne aj počítači."""),
# 11 test sviatkov a zmeny času
("""  | 29. 3. 2026 a 25. 10. 2026 | správna hodina pri zmene času |
""",
"""  | 29. 3. 2026 a 25. 10. 2026 | správna hodina pri zmene času |
  | pondelok 30. 3. 2026 a 26. 10. 2026, 8:59 / 9:00 | zatvorené / otvorené (prvý pracovný deň po zmene času) |
  | všetky riadky znova s `timezoneId` America/New_York a Asia/Tokyo | rovnaký stav ako v Europe/Bratislava (výpočet nezávisí od zóny zariadenia) |
"""),
# 12 zmena / zrušenie
("""3. **Zmena alebo zrušenie:** telefonicky 0951 267 203 alebo e‑mailom info@barbershop30.sk (text potvrdenia v systéme).
   Lehota, poplatok a meškanie sa nezobrazia, kým ich majiteľ neurčí.""",
 """3. **Zmena termínu:** telefonicky 0951 267 203 alebo e‑mailom info@barbershop30.sk (text potvrdenia v systéme hovorí
   len o zmene: „pre zmenu rezervácie nás neváhajte kontaktovať telefonicky alebo emailom“). Zrušenie, lehota, poplatok
   a meškanie sa nezobrazia, kým ich majiteľ neurčí (otázka 3)."""),
("| … zmena | Termín zmeníš alebo zrušíš na 0951 267 203 alebo na info@barbershop30.sk. | text potvrdenia v systéme (oficiálne) | hneď |",
 "| … zmena | Termín zmeníš telefonicky na 0951 267 203 alebo e‑mailom na info@barbershop30.sk. | text potvrdenia v systéme (oficiálne; hovorí len o zmene) | hneď; zrušenie až po otázke 3 |"),
# 13 parkovanie
("""   - Bezplatné záchytné parkovisko je na Nábreží mládeže.
""",
"""   - Pozor: Parkové nábrežie a Na Predmostí (blízko Mostnej) sú v SM‑A spoplatnené nonstop; veta to musí povedať.
   - Konkrétne záchytné parkovisko sa nemenuje: „parkovisko Nábrežie mládeže (pri Chrenovskom moste)“ je v platenej
     zóne CH‑A (pracovné dni 0–18 h), hoci mesto uvádza „Nábrežie mládeže“ aj medzi bezplatnými záchytnými.
     Odkaz na zoznam záchytných parkovísk mesta stačí, presné miesto doplní majiteľ.
"""),
# 14 Romana – platba
("""    platba na mieste alebo kartou online. Ceny sa zobrazia len so súhlasom majiteľa (pravidlo jedného cenníka), dni""",
 """    bez platby vopred (všetkých 14 služieb má `payment-required="0"`, sekcia platby kartou sa ukáže len pri hodnote 2,
    `booqme2/rez.html:1207` a `:1782`; platba kartou online teda dnes nie je). Ceny sa zobrazia len so súhlasom majiteľa (pravidlo jedného cenníka), dni"""),
("| Romana | Farbenie, melír, trvalú, tónovanie, prekrytie šedín a poliózu robí Romana. Rezervuješ ich v Booqme a platíš na mieste alebo kartou online. | Booqme (oficiálne, 20. 10.) | hneď |",
 "| Romana | Farbenie, melír, trvalú, tónovanie, prekrytie šedín a poliózu robí Romana. Rezervuješ ich v Booqme, bez platby vopred. | Booqme (oficiálne, 20. 10.; `payment-required=0`) | hneď |"),
# 15 merateľné ťuknutia
("""  - poukaz, parkovanie, zmena a zrušenie, „dnes alebo bez objednania“, dieťa a cudzinec majú odpoveď najviac
    na 2 ťuknutia z menu.""",
 """  - poukaz, parkovanie, zmena termínu, „dnes alebo bez objednania“, dieťa a cudzinec majú odpoveď z otvoreného menu
    najviac na 2 ťuknutia (položka menu, otvorenie odpovede) a najviac 1 obrazovku skrolu medzi nimi (390 × 844,
    Playwright, zapísané v `cesty.json`)."""),
# 16 E1 – počet kandidátov a foto-40
("""karta „Kde nás nájdeš“ (foto‑37 vchod s rohožkou). Výber potvrdiť pohľadom na fotky (C016, súpis záberov). |""",
 """karta „Kde nás nájdeš“ (foto‑37 vchod s rohožkou). Kandidátov je 7, štúdia vyberie najviac 6. Foto‑40 len výrez pultu s boxom „DARČEKOVÁ POUKÁŽKA“: bez figúrky Mickey Mouse, vizitiek so Salónom 30 a tvárou a bez TV (ten istý dôvod ako vylúčenie foto‑17 v MEDIA_SELECTION). Výber potvrdiť pohľadom na fotky (C016, súpis záberov). |"""),
# 17 E2 – presah obrázka
("""`translateY` −3 % → +3 % na pseudoprvku, len `transform` (kompozitor). Bez podpory statické. |""",
 """`translateY` −3 % → +3 % na pseudoprvku, len `transform` (kompozitor). Pseudoprvok je o 6 % vyšší než okno (presah 3 % hore aj dole), aby sa pri posune nikdy neodkryl tmavý okraj. Bez podpory statické. |"""),
# 18 rozpočet podľa ZADANIA
("""- `skrol2.mjs --film=off --cpu=1`: p95 vlákna ≤ 5,5 ms.
""",
"""- `skrol2.mjs --film=off --cpu=1`: p95 vlákna ≤ 5,5 ms a žiadna úloha vlákna > 50 ms (ZADANIE 2.1, meranie b).
- Absolútne hranice ZADANIA 2.1 platia vždy, aj keď je výsledok D5 horší: snímka p95 ≤ 20 ms, snímky > 33 ms ≤ 2 %,
  žiadna snímka > 100 ms, LCP ≤ 2,5 s, INP < 200 ms, CLS < 0,05.
"""),
# 19 E1 akceptácia – zoznam fotiek
("""  - fotky len zo zoznamu a len s `people_visible: nie`.""",
 """  - fotky len zo súpisu `source/audit.json` s `people_visible: nie`; foto‑29 a foto‑40 sa pred použitím zapíšu
    do MEDIA_SELECTION s výrezom a stĺpcom „ľudia“; výrez foto‑40 bez figúrky, vizitiek a TV (kontrola pohľadom)."""),
# 20 E4 akceptácia – kľúče
("""  - tlačidlá ← → idú klávesnicou, ciele dotyku ≥ 44 px.""",
 """  - tlačidlá ← → idú klávesnicou, ciele dotyku ≥ 44 px,
  - `aria-label` tlačidiel ← → má kľúč vo všetkých 7 slovníkoch (`i18n-test.mjs`)."""),
# 21 otázky
("14. Romana: smieme uviesť jej ceny z Booqme (od 35 €) a dni pondelok až streda? (D6b Romana)",
 "14. Romana: smieme uviesť jej ceny z Booqme (35 až 80 €) a dni pondelok až streda? (D6b Romana)"),
("""15. Vernostná kartička: kedy nasadiť `vernost/` na headspa30.sk, nastaviť heslo `VERNOST_HESLO_BARBERSHOP` a aké budú
    odmeny a body? (odkaz v pätičke, veta pri rezervácii)""",
 """15. Vernostná kartička: odkedy ju chcete ponúkať zákazníkom (treba spustiť systém kartičiek na serveri headspa30.sk
    a nastaviť heslo pre recepciu) a aké budú odmeny a body? (odkaz v pätičke, veta pri rezervácii)"""),
("""    - Koľko má zamestnancov a aký obrat (len kvôli povinnosti vyhlásenia o prístupnosti)?""",
 """    - Má firma menej ako 10 zamestnancov a ročný obrat do 2 mil. €? Stačí áno alebo nie (len kvôli povinnosti
      vyhlásenia o prístupnosti)."""),
("""## 7. Otázky pre majiteľa (len to, čo sa nedá zistiť; v zátvorke, čo odpoveď odomkne)
""",
"""## 7. Otázky pre majiteľa (len to, čo sa nedá zistiť; v zátvorke, čo odpoveď odomkne)

Najprv odpovedať na 1, 2, 3, 5, 6, 15 a 21 (platba, poukážky, storno, bez objednania, sviatky, vernostná kartička,
doména). Ostatné odomknú len doplnky a môžu počkať.
"""),
]
for i, (stare, nove) in enumerate(opravy, 1):
    n = t.count(stare)
    if n != 1:
        sys.exit(f'oprava {i}: nájdené {n}× – {stare[:80]!r}')
    t = t.replace(stare, nove)
# zvyšné výskyty parkovacej vety a anglickej vety v tabuľke textov
stare_park = 'Bezplatné parkovisko je na Nábreží mládeže. '
assert t.count(stare_park) == 1, 'park'
t = t.replace(stare_park, 'Pozor, na Parkovom nábreží a Na Predmostí sa platí stále. Bezplatné záchytné parkoviská nájdeš na nitra.sk/parkovanie. ')
stare_en = '| … cudzí jazyk (en) | The booking page is in Slovak. Its EN switch translates it automatically, or call +421 951 267 203. | rezervácia (Google prekladač), CONTENT_SOURCES | hneď (len iné jazyky) |'
assert t.count(stare_en) == 1, 'en'
t = t.replace(stare_en, '| … cudzí jazyk (en) | The booking page is in Slovak. Need help? Call +421 951 267 203. | rezervácia po slovensky (prepínač EN pri skúške 20. 10. nepreložil), CONTENT_SOURCES | hneď (len iné jazyky) |')
open(cesta, 'w', encoding='utf-8').write(t)
print('OK', len(opravy) + 2, 'opráv')
