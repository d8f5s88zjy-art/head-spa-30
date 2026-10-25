# Recepcia – zásady zhody otázky s odpoveďou, verzia 2 (P1–P6, doplnená v oprave 6)

Stav: strom `hs-recepcia`, vetva `barbershop-recepcia`, oprava 5 (`aeaafb7`) + oprava 6 (25. 10. 2026; commity v
`stavba-v5/oprava-6.md`). Doplnky opravy 6 sú v časti **„Oprava 6 – triedy W, D, M, Z“** na konci; P1–P6 platia bez
zmeny, oprava 6 len spresňuje, čo sú výplňové slová (P1), ako vznikajú voľby (P2) a čo testuje P6.
Kód: `barbershop-30/assets/recepcia.js` (196 riadkov, bez komentárov kvôli váhe), dáta: `barbershop-30/assets/recepcia/<jazyk>.json`
(sk ručne, ostatné z generátora `stavba-v5/jazyky-gen.py` + `stavba-v5/jazyky_data.py`).
Testy: `barbershop-30/source/tools/recepcia-test.mjs` (23 testov, pravidlá verzie 1 a obsah) a
`barbershop-30/source/tools/recepcia-kombinacie-test.mjs` (10 testov, P1 lint, P3, P5, P6a–P6g).
Čísla riadkov nižšie sú podľa stavu po oprave 6 (modul má 196 riadkov ako `aeaafb7`, zmeny sú vnútri riadkov). Verzia 1 (pravidlá 1–10, oprava 4) je v `git show 6f8c47c` a v časti „Čo
platí z verzie 1“.

**Zásada majiteľa:** radšej nevedieť ako odpovedať zle. Nesprávna cena, trvanie alebo „áno“ na službu, ktorú stránka
neponúka, je vážna chyba. Prijateľné je poctivé odovzdanie (téma „nevieme“, fallback s telefónom a e‑mailom) alebo
„Myslíš toto?“ s voľbami (odpoveď sa ukáže až po ťuknutí).

**Prečo verzia 2:** verzia 1 pridávala pravidlo za každou triedou chýb („iná služba s cenou“, „neznáme slovo“, „dve
skupiny kmeňov“ …). Každé kolo kontroly našlo novú triedu, ktorú pravidlá nepokryli: slovo položky **bez ceny**
(melír, rezervácia, sobota), trvanie pri položke bez trvania, časová príslovka ako kmeň dlhých vlasov. Kontrola 4
a skeptik ich našli 571 + 195 (+ 18 z 77 otázok skeptika). Verzia 2 obracia princíp: priama odpoveď nie je predvolená
a nezakazuje sa výnimkami – musí sa **zaslúžiť** tým, že vysvetlí celú otázku.

---

## Pojmy

| pojem | význam | kód |
|---|---|---|
| kmeň | slovo v `kluc` položky alebo témy; skupiny oddeľuje `\|` | JSON |
| silný kmeň | veľké začiatočné písmeno alebo `!` (cyrilika) | `recepcia.js:42` (priprav) |
| `=slovo`, `>10` | len celé slovo; každé číslo nad 10 | `recepcia.js:15–16` |
| `Slovo_slovo` | dvojslovný spúšťač trvania (en How_long, de Wie_lange) | `recepcia.js:83` |
| istá zhoda | kmeň od začiatku slova; dlhý kmeň (od 5 znakov) aj vnútri slova | `recepcia.js:21` (`ista`, `pred`) |
| položka **vysvetlí** slovo | kmeň od začiatku slova, alebo dlhý kmeň vnútri slova, ak začiatok slova nepatrí inému kmeňu, ktorý končí uprostred tohto kmeňa; alebo slovo celého názvu služby z cenníka, ktorý je v otázke | `recepcia.js:23` (`vysvetli`), `:62` |
| voľné slovo | cenové (`cenove`), výplňové (`vypln`, od opravy 5 aj opytovacie slová a zámená), zdvorilé (`zdvor`), spojka; krátke slovo a číslo, ak nie sú kmeňom; pri otázke na trvanie aj časové slovo | `recepcia.js:82` (`vol`) |
| obsahové slovo | slovo otázky po vynechaní stop-slov, ktoré nie je voľné | `recepcia.js:58` (`nv`) |
| prísna položka | položka s cenou (`€` alebo `cena`) alebo služba (akcia sluzby, booqme) | `recepcia.js:62` (`t`) |

## P1 – priama odpoveď len pri úplnom vysvetlení otázky

Položka dá priamu odpoveď (cenu, trvanie, službu) len vtedy, keď je **plná** (`recepcia.js:60–64`):

1. vysvetlí aspoň jedno slovo otázky (dôkaz);
2. prísna položka vysvetlí **každé** obsahové slovo; ostatná (hodiny, adresa, káva …) smie nechať len slová, ktoré
   nie sú kmeňom žiadnej položky, a priemerná zhoda obsahových slov je aspoň 0,55 (silná zhoda váži 2);
3. slovo, ktoré patrí **inej** položke (s cenou aj bez ceny, aj téme „nevieme“) a táto ho nevysvetlí, priamu odpoveď
   zakazuje; rovnako celý názov inej služby z cenníka v otázke, ak nie je časťou názvu tejto položky;
4. prísna položka má istú zhodu so silným kmeňom alebo celý názov služby (pravidlo 7 verzie 1);
5. pri viacerých skupinách kmeňov zásah všetkých skupín (pravidlo 9); spojená služba len so spojkou (pravidlo 3).

Viac plných položiek: vyhrá špecifickejšia (pravidlo 3), pri rozdiele skóre pod 0,1 „Myslíš toto?“ s oboma.
Pripravená otázka (aj zobrazovaná, `otazky`) je priama odpoveď vždy (`recepcia.js:78–79`).

Príklady: „Koľko stojí strih a melír?“ → melír vysvetlí len farbenie vlasov → žiadna plná položka → „Myslíš toto?“.
„Koľko stojí odfarbenie fúzov?“ → „odfarbenie“ začína kmeňom `odfarb` (farbenie vlasov), takže kmeň `farben` vnútri
slova farbenie brady nevysvetlí → „Myslíš toto?“. „Kde nájdem cenník?“ → „kde“ je opytovacie (voľné) slovo.

## P2 – inak „Myslíš toto?“ alebo odovzdanie

- Voľby sú položky, ktorých slová otázka obsahuje: priemerná zhoda obsahových slov aspoň 0,55, pri cenovej otázke
  stačí silné slovo (súčet zhody aspoň 2). Poradie: zhoda (silná 2, preklep silného kmeňa 1,2, slabá 1), potom zásah
  všetkých skupín, potom skóre. Najviac 4 voľby + Celý cenník + Zavolať (`recepcia.js:66–67`, `:142`).
- Odpoveď sa ukáže až po ťuknutí na voľbu. Ráta sa ako OK, ak je správna voľba medzi prvými dvomi.
- Bez volieb: cenová otázka → téma „cena inej služby“ (Túto službu v cenníku neviem nájsť), inak fallback
  s telefónom, e‑mailom a rezerváciou (`recepcia.js:68`).
- Otázka s viac ako 12 obsahovými slovami alebo 30 slovami → fallback (`recepcia.js:76`, `:81`); slová sa neopakujú.
  Najdlhšia otázka slepých sád má 9 obsahových slov. Čas zhody tak ostáva pod 5 ms aj pri 200 znakoch.

## P3 – cena vždy vo výreze cenníka

- Odpoveď s cenou ukáže výrez: nadpis skupiny cenníka, riadok služby zvýraznený (`rc-hl`, `aria-current`), susedné
  riadky tej istej skupiny; názov, trvanie a cena doslovne zo stránky. Pod ním Celý cenník (`recepcia.js:94–101`,
  `:118–133`). Nikdy osamotené číslo.
- Dáta: `cennik` v JSON – skupiny ako odkazy na položky (`id` alebo `id:úryvok`), nadpisy v jazykoch zo slovníka
  stránky (generátor). Test P3 porovná sk skupiny a riadky s cenníkom v `index.html:524–638`.

## P4 – trvanie len pri službe s trvaním

- Časové slovo (`recepcia.js:82–92`): silné (trvá, minút, dauert, take, tart …) alebo dvojslovné (How_long,
  Wie_lange) spustí otázku na trvanie. Slabé časové slovo (časová príslovka dlho, dlouho, długo, dugo, довго, long,
  lange, meddig) ju spustí, len keď otázku nevysvetlí položka, ktorá ho má ako vlastný kmeň (Odkedy fungujete → od
  roku 2019; „long hair“ → dlhé vlasy).
- Trvanie je price-time menovanej služby (`cas` v JSON, `trvP`). Položka bez trvania (rezervácia, čakanie, káva,
  hodiny, melír …) → odovzdanie na recepciu s voľbou tej položky, nikdy trvanie inej služby.
- Trvanie strihu a brady len vtedy, keď otázka nemenuje nič iné (`recepcia.js:88`).
- Viac služieb s trvaním → „Myslíš toto?“ s názvami služieb; ťuknutie ukáže trvanie zvolenej služby.

## P5 – čisté kmene

Kmeň nesmie zahŕňať slovo iného významu. Opravené v oprave 5 (všetkých 8 jazykov):

| slovo iného významu | predtým | teraz |
|---|---|---|
| časová príslovka (dlho, dugo, dlouho, długo, довго) | silný kmeň dlhých vlasov (Dlh, Dug, Dlouh, Dług, Довг) | tvary prídavného mena (Dlhe Dlhy Dlha, Duga Duge, Dlouhé, Długi, Довгі …); en, de dve skupiny (long/lang + vlasy) |
| príplatok, doplatok, Aufpreis, surcharge, felár, доплата; drahší | silný kmeň dlhých vlasov | slabý kmeň dlhých vlasov aj konečných cien |
| šediny (sediv, sedin, siw, sed, ősz, grau, grey, сив) | 2. skupina „brada“ farbenia brady | slabý kmeň farbenia (1. skupina) a 2. skupina farbenia vlasov |
| odfarbenie | kmeň `farben` vnútri slova | pravidlo vlastníka začiatku slova (`vysvetli`) |
| sr vreme (aj počasie), pl opłat | silné | slabé |

Lint v teste (P5): zdieľaný kmeň len medzi 120 výslovne povolenými dvojicami položiek (zoznam `POVOLENE`); kmeň
služby s cenou nezachytí časové slovo (výnimka: en long, de lange v jednej z dvoch skupín) ani silne príplatok.

## P6 – kombinatorické testy z dát

`recepcia-kombinacie-test.mjs`, otázky skladané z JSON v 8 jazykoch; podmienka: 0 holých odpovedí (cena alebo
trvanie), ktoré nevysvetlia všetky menované slová.

| test | otázok | na `6f8c47c` | na `aeaafb7` |
|---|---|---|---|
| P6a dvojice služba s cenou × každá iná položka (s cenou, bez ceny, nevieme), oboje poradie | 11 198 | 3 082 chýb | 0 |
| P6b trvanie × každá položka × každé časové slovo | 3 058 (2 899 na 6f8c47c) | 654 | 0 |
| P6c cenové a časové slovo × služba, príplatok, dni, šediny, odfarbenie | 2 182 | 1 152 | 0 |
| P6d triedy kontroly 4 (k4/trieda-k4.mjs) | 1 189 | 766 | 0 |
| P6e otázky skeptika a sondy kontroly 4 | 150 | 48 | 0 |
| P5 lint dát | 8 jazykov | 18 | 0 |
| P3 výrez cenníka (112 služieb) | 112 | modul nemal výrez | 0 |

## Čo platí z verzie 1

| pravidlo v1 | stav vo v2 |
|---|---|
| 1 krátke kmene len presne, preklep od 5 znakov | platí (`zhoda`, test 6) |
| 2 neznáme slovo nedostane cenu | súčasť P1 (prísna položka musí vysvetliť každé obsahové slovo) |
| 3 špecifickejšia služba, iná služba v otázke, spojka | špecifickosť a spojka platia; „iná služba“ je súčasť P1 a platí aj pre položky bez ceny a témy nevieme |
| 4 osoba, miesto, vek, produkt – veto tém | platí (veto a skóre tém „nevieme“ pred P1, `recepcia.js:55–57`) |
| 5 zdvorilosť | platí; opytovacie slovo, ktoré je kmeňom (kde, kedy), zdvorilosť nie je (`recepcia.js:77`) |
| 6 trvanie menovanej služby | nahradené P4 |
| 7 cena len pri istej zhode so silným kmeňom | súčasť P1 (bod 4) |
| 8 zložené slovo po častiach | platí (`recepcia.js:73–76`) |
| 9 viac skupín kmeňov len pri zásahu všetkých | súčasť P1 (bod 5) |
| 10 čísla: čas, cm | platí (`recepcia.js:72`) |

## Čo pravidlá zámerne nerobia

- Nehádajú zápor („nechcem bradu, len strih“) ani podmienku: dajú „Myslíš toto?“, kde správna voľba nemusí byť prvá.
- Nerozlišujú „10 cm“, „do 10 cm“ a „nad 10 cm“ (číslo 10 je kmeň dlhých vlasov).
- Neodpovedajú na čakaciu dobu ani voľné termíny (stránka ich neuvádza) – odovzdanie.
- Tónovanie brady (de Bart tönen, uk тонування бороди, cs tónování vousů) je farbenie brady (kmeň v 1. skupine);
  hraničné, cena je cena farbenia brady, nie inej služby.
- Mená barberov nepoznajú (téma tím alebo fallback).


---

## Oprava 6 – triedy W, D, M, Z (spresnenie P1, P2, P5, P6)

Hodnotenie `slepe/hodnotenie-v2-1.md` našlo 3 holé odpovede v dvoch triedach (W, D). Pri oprave sa našla ešte trieda M
a slabina Z. Nič z toho nie je výnimka pre vetu: každé pravidlo je trieda slov alebo vlastnosť zhody a testuje ho
kombinatorika z dát (P6f, P6g, P1 lint).

### W – deň, „zajtra“, časť dňa a čas sú slová hodín (P1)

P1 vymenúva výplň: opytovacie, cenové, časové (otázka na trvanie), zdvorilosti, zámená, spojky. **Dni, „zajtra“,
časti dňa ani čas medzi nimi nie sú** – sú to obsahové slová a patria položke `hodiny`.

- Dáta (8 jazykov): pracovné dni a „zajtra“ vyradené z `vypln`, pridané ako **slabé** kmene položky hodiny (sobota,
  nedeľa, víkend ostali silné). Slabé preto, že deň sám nie je otázka na hodiny: „aké bude zajtra počasie“ → odovzdanie,
  nie hodiny. Časti dňa (ráno, dopoludnia, poobede, večer; morning, evening; Morgen, Abend; reggel, este; jutro, veče;
  ранок, вечір …) sú tiež slabé kmene hodín. Kmeň dňa nesmie zachytiť iné slovo (P5): sk/cs `=streda =stredu =stredy`
  (nie „stredne“), pl `=środa`, sr `=sreda`, uk `середа середу`, uk piatok ako `ятниц` (apostrof delí slovo).
  pl odkedy `Dział` → `Działa` (inak „poniedziałek“ = „odkedy“).
- Modul (`recepcia.js:72`): čas `9:00`, `21:00`, `9 pm`, `9am` sa nemaže, ale nahradí slovom `0h`; `=0h!` je silný
  kmeň položky hodiny vo všetkých jazykoch. Predtým sa čas mazal → „strih o 21:00?“ = 18 €.
- Výsledok: „V pondelok o 9:00 na bradu?“ → „Myslíš toto?“ [hodiny, úprava brady, …]; „strih o 21:00?“ →
  [hodiny, pánsky strih]; „Kedy máte otvorené v pondelok?“ ostáva priama odpoveď hodiny.

### Z – zdvorilé slovo, ktoré je kmeňom, je pozdrav len po inom zdvorilom slove

Časť dňa je aj pozdrav („Dobré ráno“, „Good evening“, „Guten Abend“, „Jó estét“, „Dobro jutro“, „Добрий вечір“).
Pravidlo (`recepcia.js:76`, `:80`, `:82`): zdvorilé slovo, ktoré je zároveň kmeňom položky, je zdvorilosť (výplň) len
**hneď po inom zdvorilom slove**; inde je obsahové slovo. „Dobré ráno, koľko stojí strih?“ → 18 €; „Koľko stojí strih
ráno?“, „Ráno strih?“ → „Myslíš toto?“. Zdvorilé slová, ktoré kmeňom nie sú (ďakujem, ahoj, привіт …), ostávajú výplň
kdekoľvek. Hygiena dát (P5): kmeň témy jazyky barberov zachytil „rozumiem/rozumím“ (sk, cs, pl `Rozum`) a kmeň
recepcie uk „привіт“ (ahoj) → teraz presné tvary `=Rozumiete =Rozumie`, `=Rozumíte =Rozumí`, `=Rozumiecie =Rozumie`
a uk `привіта` („привітає“). Predtým „Rozumiem, koľko stojí strih?“ = téma jazyky barberov.

### D – druhá osoba so spojkou (P1)

Zámeno prvej osoby je výplň (P1), kým otázka nemenuje inú osobu. „Strih pre syna (8) a pre mňa“ menuje dve osoby.
Pravidlo (`recepcia.js:62`): položka pre inú osobu (`deti`) má v dátach zoznam `ine` (zámená prvej osoby ako príjemcu:
sk `mna mne`, cs `me mne`, pl `mnie`, en `me myself`, de `mich mir`, hu `nekem engem en`, sr `mene meni`, uk `мене
мені`); keď ich otázka obsahuje **spolu so spojkou**, položka deti nie je plná → „Myslíš toto?“ [deti, pánsky strih].
Bez spojky („Strih nie pre mňa, pre syna“) sa nič nemení. Zámená sú pritom výplň (sk `mna`, hu `nekem engem`,
sr `mene` doplnené do `stop`), takže „Koľko stojí strih a brada pre mňa?“ dostane 28 € priamo.

### M – dieťa opísané veľkosťou nie je výplň (P1, P5)

`vypln` obsahoval prídavné mená „malý/malé, mały, malo/mali, kicsi, small, klein, мале“. Nie sú v žiadnej triede P1
a „strih pre malého“ znamená dieťa → na `aeaafb7` dostal 18 € (sk, cs, pl, sr, de, hu, en). Teraz sú tieto slová
slabé kmene položky deti (sk `maly male malych maleho malemu`, cs `malý malé malých malého`, hu `kicsi`, en `small`;
pl `mał`, sr `mal`, uk `мал Маленьк` už boli), z výplne vyradené → „Koľko stojí strih pre malého?“ → „Myslíš toto?“
[pánsky strih, deti]. Rovnaký lint našiel hu `sima` ⊃ `simára` (holenie) a sr `ko` ⊃ `koz` (pleť) → `=sima`, `=ko`
(len celé slovo).

### P2 – voľby (spresnenie)

- Kandidát voľby: priemerná zhoda obsahových slov aspoň 0,55, alebo **istá zhoda so silným kmeňom** a súčet zhody
  aspoň 2 (predtým len pri cenovej otázke) (`recepcia.js:66`). Viacvecná otázka „Môžem sa objednať na strih na zajtra
  ráno?“ tak ukáže [rezervácia, pánsky strih, …], nie len hodiny.
- Preklep sa hádá len pri slove, ktoré nie je istým slovom inej položky (`recepcia.js:59`): „stihnem“ nie je preklep
  „strih“ (je to kmeň hodín). Zhoda podľa bigramov (Dice, 0,5) váži ako slabý kmeň a platí len pri rovnakom prvom
  písmene (`recepcia.js:19`): predtým „będzie“ ≈ „niedziel“, „úprava“ ≈ „práve“, „hair“ ≈ „chair“ (375 takých zásahov
  v slepých sadách, z toho 285 s iným prvým písmenom – nezmyselné, alebo nadbytočné: „strih“ ≈ „ostrih“ má tá istá
  položka aj presne). Zhoda je tým aj ~2,5× rýchlejšia.

### P6 – nezávislé orákulum a nové kombinácie

- Orákulum už nepreberá `stop`/`vypln`/`zdvor` z JSON: menované veci sú **vložené časti** otázky (názov, kmeň inej
  položky, deň, čas, osoba). Cenové slovo (trieda P1) je výplň podľa vlastného zoznamu testu `CENA`.
- P6f: 7 dní a „zajtra“ z `Intl` (ICU v Node), časť dňa, `9:00 21:00 7:30 8 pm 9am` × každá služba s cenou (cena aj
  trvanie) → nikdy holá odpoveď; pozdrav pred otázkou nemení priamu odpoveď; „Kedy máte otvorené {deň}?“ ostáva hodiny.
- P6g: dieťa (silný kmeň položky deti) + spojka + zámeno prvej osoby → nie holá cena, deti medzi prvými dvomi voľbami;
  dieťa opísané veľkosťou (malého, Kleine, małego …) → nikdy cena dospelého.
- P1 lint: dni a „zajtra“ (Intl) nie sú výplň a vysvetlí ich položka hodiny; `=0h` je kmeň hodín; výplňové ani zdvorilé
  slovo nepohltí kmeň služby s cenou; zámeno prvej osoby je v `ine` položky deti.
- P6e: + 3 chyby hodnotenia v2-1, sondy tried W, D a pozdravy (29 nových riadkov, spolu 179); „Koľko stojí strih vo
  štvrtok večer?“ už nesmie dostať holú cenu.
- Na `aeaafb7` hlási ten istý testový súbor 5 z 10 testov s chybou (P6f 2 577, P6g 118, P6e 17, P6a 26, lint);
  po oprave 10/10.

### Čo pravidlá zámerne nerobia (doplnok)

- Holé číslo bez minút („o 9“, „um 9“) nie je čas – môže to byť vek alebo cm; čas je `hh:mm` a `9 pm`/`9am`.
  Neznáme slová času („hod“, „Uhr“) priamu odpoveď aj tak zakážu (P1, neznáme slovo).
- Časť dňa na úplnom začiatku bez pozdravu („Ráno strih?“) je obsahové slovo → „Myslíš toto?“, nie cena.
- Zápor („nechcem bradu, len strih“) ostáva nehádaný; poradie volieb medzi strihom a bradou rozhoduje poradie dát.
