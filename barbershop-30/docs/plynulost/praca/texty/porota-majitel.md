# Porota – oči majiteľa a zákazníka (texty A, B, C pre Barbershop 30)

Dátum: 27. 10. 2026. Porotca nič nemení, len hodnotí. Kritériá: je to „spicy“ a sebavedomé, chce človek prísť;
nie je to trápne, prehnané ani urážlivé; sedí tón s webom (tykanie, krátke vety, remeslo); pochopí zákazník,
prečo volať recepciu a nie barberovi; fakty len z overených zdrojov.

Posudzované súbory (všetky prečítané celé):
- A: `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/texty/texty-A.md`
- B: `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/texty/texty-B.md`
- C: `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/texty/texty-C.md`

## Výsledok

| návrh | body (0–10) | jednou vetou |
|---|---|---|
| A | 7,5 | Najčistejší remeselnícky tón a najlepší úvod tímu, ale úvod znovu otvára vetu, ktorú majiteľ sám dal preč, a pilier Výsledok opakuje kartu „Cestou von“. |
| B | 6 | Najopatrnejší: tri riadky barberov sú skoro totožné s dnešným webom (majiteľ chcel „pikantnejšie“), úvod tímu je dlhý a opakuje číslo z úvodu; FAQ je však prakticky najužitočnejšie. |
| C | 8,5 | Najviac „spicy“ bez trápnosti, najlepšie vysvetlená recepcia v FAQ, najstarostlivejšie otázky pre majiteľa a vlastná kontrola dĺžok; dve vety treba uhladiť. |

**Víťaz: C.**

## Overenia, o ktoré sa hodnotenie opiera

- Dnešné riadky barberov: `hs-skvrny/barbershop-30/index.html` r. 326, 341, 356, 371, 386, 401, 416, 431, 446, 461 (sed -n 295,470p).
  Lajko dnes: „Ostrá línia na krku, mäkký prechod na bokoch. Remeslo vidno zblízka.“ (r. 431) – B ho necháva doslovne; B Dominika
  („Jemná ruka, prísne oko. Hotovo je, až keď sedí každý vlas.“) sa od r. 401 líši len slovosledom.
- Úvod tímu dnes: r. 304 „Poctivé remeslo, moderný štýl a ľudský prístup. To spája celý tím.“; karta tímu r. 293 „Pod značkou Barbershop 30…“.
- `docs/CONTENT_SOURCES.md:126`: veta „Pod značkou Barbershop 30 tu pracuje tím…“ na želanie majiteľa **nahradila** „Desať ľudí, jeden kalendár.“ –
  návrh A ju v úvode (1a) vracia a označuje ako „overená veta webu“; `grep -n "Desať ľudí" index.html` = 0 nálezov.
- Karta „Cestou von“ r. 762–764: „Odchádzaš s hlavou hore. … Na záver styling a kolínska. Zvyšok dňa je tvoj.“ – pilier Výsledok v A je z toho zložený.
- Číslo recenzií: r. 193 „5,0 na Google · 945 recenzií“ (už v úvode webu); OTAZKY-PRE-MAJITELA.md otázka 18 (hodnotenie číslom) je nepotvrdená;
  B ho dáva do úvodu tímu aj do piliera, C do piliera – tri miesta s číslom, ktoré starne.
- Nepotvrdené „jediný barbershop v Nitre, 8 rokov“ (r. 224; OTAZKY otázka 9): žiadny z troch návrhov ho nepoužíva – správne.
- Garancia: `grep -n garanc index.html` = 0; všetky tri ju správne držia len ako NA POTVRDENIE.
- Pravidlo „Nespomínať Salón 30 ani HEAD SPA 30 ako súčasť značky“ (OTAZKY-PRE-MAJITELA.md:111): A (otázka 7), B (otázka 4) aj C (otázka 4)
  ho vedú ako otázku pre majiteľa; C má navyše náhradný nadpis „Na Mostnej 30 nájdeš aj“, keby majiteľ „naše“ nepotvrdil.
- Starý web (`scratchpad/barber/stiahnute/barbershop30.html`): „Vždy pripravená recepčná – ochotne ti poradí…“ a „bez objednania“ – citácie sedia.
- Adresy prevádzok (curl -sS -o /dev/null -L -w, 27. 10. 2026): https://www.headspa30.sk/ → 200; https://www.salon30.sk/ → 200;
  https://www.barbershop30.sk/ → 200 (starý web); https://d8f5s88zjy-art.github.io/head-spa-30/ → 200.
- Dĺžky (python3 -I, skript dlzky.py pre C, vlastná kontrola pre A a B): A barberi 65–82, piliere 109–123, FAQ 242/162;
  B barberi 54–68, piliere 91–93, FAQ 246/205; C barberi 66–81, piliere 106–113, FAQ 255/158 – všetko v limitoch (≤ 90 / ≤ 140 / ≤ 320).

## A – 7,5

Čo chce človek čítať: „Ty povieš, ako to chceš. Zvyšok je remeslo.“ (úvod), „Nič naslepo.“ (Skúsenosti), „Strih musí sedieť tebe, nie nám.“ (G3),
Dominika „…Ani o jeden skôr.“, Damian „…a hovoria presne.“ FAQ Q1 vysvetľuje dôvod („a ten sa práve venuje zákazníkovi v kresle“) a končí online
možnosťou. Pätička má „Si tu.“ pri Barbershope – milé.

Čo sťahuje body:
- Úvod „Desať ľudí, jeden kalendár…“ – veta, ktorú majiteľ vymenil (CONTENT_SOURCES.md:126). Vrátiť ju bez opýtania je chyba voči majiteľovi.
- Pilier Výsledok je prepis karty „Cestou von“ (r. 763–764) – zákazník to číta na tej istej stránke dvakrát.
- Kristián „Jeho rukopis spoznáš, aj keď nevieš, čo presne sa zmenilo.“ – kostrbaté, pôsobí ako hádanka, nie ako kompliment.
- G1 „bez diskusie a bez príplatku“ – „bez diskusie“ znie, akoby sa u nás inak diskutovalo; pre barbershop zbytočne ostré.
- HEAD SPA 30 „Head Spa rituály pre hlavu, relax…“ – „pre hlavu“ je navyše.

## B – 6

Čo je dobré: FAQ „Recepcia ti termín nájde, presunie aj zruší.“ – zákazník hneď vie, na čo je recepcia; „Keď má v kresle zákazníka, venuje sa len jemu.“
Štruktúra pilierov s náhradou „Remeslo“, kým garancia nie je potvrdená. Nikolas „Sadni si a povedz dve slová. Zvyšok za teba povie zrkadlo.“
a Michal „Otvoríš ich ako nový.“ sú z troch návrhov najúdernejšie krátke. Technicky najdôslednejšia pätička (aria-current, zoznam curl s final URL).

Čo sťahuje body:
- Majiteľ chcel „pikantnejšie“ texty pri barberoch; B nechal Lajka doslovne (r. 431), Dominiku a Joja takmer doslovne. Zákazník zmenu nezbadá.
- Úvod tímu má 330 znakov na `.lead` (dnes 66) a končí „945 ľudí nám za to dalo na Google 5,0“ – číslo už je v úvode webu (r. 193) a starne.
- „V kresle preberá slovo majster“ – pompézne, nesedí s vecným tónom webu.
- Pätička opakuje „Mostná 30, Nitra.“ v každom z troch riadkov.
- „Čo ma čaká, keď prídem?“ majiteľ nežiadal a odpoveď je prerozprávaný film (karty r. 224, 247, 270, 764).

## C – 8,5

Čo chce človek čítať: Adrian „Vrátiš sa skôr, než ti stihnú dorásť vlasy.“, Nikolas „Len lepší, než si ho kedy mal.“, Dominika „…Bez výnimky.“,
Jojo „…a dotiahne ho poriadne.“, Precíznosť „nič sa tu nerobí od oka“, Skúsenosti „hodnotenie 5,0 … sa za týždeň nastrihať nedá“ (vtip s mierou).
FAQ Q1 je najlepšia zo všetkých: „Keď má v kresle zákazníka, venuje sa jemu, nie telefónu. Presne tak to bude, aj keď v kresle sedíš ty.“ –
z nevýhody (barber nezdvihne) robí výhodu pre zákazníka; presne to majiteľ chcel povedať. Úvod drží majiteľovu vetu „pod značkou“ a končí výzvou
„Vyber si svojho človeka a objednaj sa.“ Garancia má tri stupne ostrosti s jasným upozornením pri G3; otázky pre majiteľa riešia aj to, kto bude
aktualizovať číslo recenzií. Náhradný nadpis pätičky „Na Mostnej 30 nájdeš aj“ chráni pred porušením pravidla OTAZKY:111.

Čo sťahuje body:
- Michal „Oči otvoríš, až keď je hotovo. A bude hotovo dobre.“ – „hotovo dobre“ je kostrbaté.
- Kristián „Ty sedíš, on rieši.“ – slang; „rieši“ je skôr kancelária než holičstvo.
- Pilier Pohodlie nesie telefón a hodiny – to je FAQ, nie pilier; navyše to isté hovorí Q1 o pár riadkov nižšie.
- 945 v pilieri Skúsenosti: tretie miesto s číslom, ktoré sa mení (otázka 8 to priznáva, ale lepšie je číslo v pilieri nemať).
- G3 „Ak nie, strih neplatíš.“ – ako NA POTVRDENIE v poriadku, ale majiteľ musí vedieť, že je to verejný sľub, ktorý si niekto vyskúša.

## Čo z A a B vziať do C (stepy)

1. Z A do úvodu tímu: „Ty povieš, ako to chceš. Zvyšok je remeslo.“ (namiesto „Vyber si svojho človeka a objednaj sa.“ alebo pred ňu – ≤ 2 vety navyše).
2. Z A do piliera Skúsenosti: „Nič naslepo.“ ako záver vety bez čísla (pozri škrty).
3. Z A ako G-verziu: „Strih musí sedieť tebe, nie nám. Ak nesedí, povedz to a dáme to do poriadku ešte dnes.“ – nahradiť C G2 (7 dní a „zadarmo“ sú dva nepotvrdené fakty v jednej vete).
4. Z B do FAQ Q1 (C 255 znakov + 46 = 301 ≤ 320): doplniť „Recepcia ti termín nájde, presunie aj zruší.“
5. Z B riadok Michala: „Zavrieš oči pri horúcom uteráku. Otvoríš ich ako nový.“ (namiesto C verzie).
6. Z B stavbu pätičky: `aria-current="page"` pri Barbershope 30 a zoznam curl s final URL do zápisu stavby; náhradný pilier pomenovať „Remeslo“, kým garancia nie je potvrdená (C má Pohodlie, ale po škrte hodín sa dá použiť B znenie).
7. Z A otázku 8 (e‑mail/WhatsApp k „volaj recepcii“) – C ju má ako otázku 9, ponechať.

## Čo z C vyhodiť alebo zmeniť (škrty)

1. Michal: „Horúci uterák, britva, ticho. Oči otvoríš, až keď je hotovo. A bude hotovo dobre.“ → „Horúci uterák, britva, ticho. Zavrieš oči unavený, otvoríš ich ako nový.“ (spojenie A + B, 72 znakov).
2. Kristián: „Elegancia bez námahy. Ty sedíš, on rieši. Výsledok hovorí za všetko.“ → „Elegancia bez námahy. Ty sedíš, on pracuje. Výsledok hovorí za všetko.“
3. Pilier Skúsenosti: „Striháme na Mostnej 30 od roku 2019 a hodnotenie 5,0 z 945 recenzií na Google sa za týždeň nastrihať nedá.“ → „Striháme na Mostnej 30 od roku 2019. Hodnotenie 5,0 na Google sa za týždeň nastrihať nedá. Nič naslepo.“ (počet recenzií ostáva len v úvode webu r. 193, kde ho mení admin).
4. Pilier Pohodlie: vyhodiť „a v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme“ → „Pri dverách recepčná, v čakárni káva a minerálka zdarma. Ty si len sadneš.“ (hodiny ostávajú v FAQ Q1 a v kontakte).
5. FAQ Q1: ponechať celé, pridať vetu z B (stepy 4). Výsledok: „Vždy recepcii: 0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme. Recepčná sa stará o tvoj termín a pohodlie, barber o tvoj výsledok. Keď má v kresle zákazníka, venuje sa jemu, nie telefónu. Presne tak to bude, aj keď v kresle sedíš ty. Recepcia ti termín nájde, presunie aj zruší.“ (301 znakov).
6. Garancia G2 (7 dní + zadarmo) → nahradiť A G3 (stepy 3); C G3 „strih neplatíš“ nechať, ale v otázke pre majiteľa napísať výslovne: „verejný sľub, ktorý si zákazníci vyskúšajú – potvrďte, len ak ho dodržíte bez výnimky“.
7. Pätička HEAD SPA 30: „…Mostná 30, v priestoroch Salónu 30.“ → skrátiť na „Head Spa rituály pre relax a regeneráciu vlasov.“ – pre zákazníka Barbershopu je „v priestoroch Salónu 30“ navyše a podnadpis/otázka o „všetky tri na Mostnej 30“ to pokryje.
8. Otázka „Môžem prísť bez objednania?“ (NA POTVRDENIE) ponechať mimo stavby, ako C píše – nič nemeniť.

## Spoločná výhrada ku všetkým trom

Každý návrh sľubuje „bez nových faktov“, ale pridáva číslo 945 (B, C) alebo prepisuje existujúce karty filmu (A Výsledok, B „Čo ma čaká“).
Do stavby ísť s čo najmenej opakovaní: číslo recenzií raz (úvod), priebeh strihu raz (film + cenník), hodiny recepcie raz v FAQ Q1 a raz v kontakte.
