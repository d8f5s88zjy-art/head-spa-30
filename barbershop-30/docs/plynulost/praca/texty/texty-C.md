# Barbershop 30 – texty C (tím, garancia, časté otázky, prevádzky v pätičke)

Dátum: 27. 10. 2026. Tón: sebavedomý, priamy, mužský, humor s mierou. Bez vulgarít, bez porovnávania
s konkurenciou, bez zdravotných sľubov, bez superlatívov bez dôkazu, bez zmienky o AI. Tykanie ako na celom webe.

Zdroje (každý fakt má zdroj, nič nie je vymyslené):
- S1 `hs-skvrny/barbershop-30/index.html` (slovenské texty webu; tím r. 303–461, otázky r. 827–837, pätička r. 849–885).
- S2 `hs-skvrny/barbershop-30/docs/CONTENT_SOURCES.md` (stupne overenia; tím: „Priezviská ani špecializácie web neuvádza – nevymýšľame.“).
- S3 `dennik/barbershop-30/docs/plynulost/OTAZKY-PRE-MAJITELA.md` (otázky 5, 9, 12, 17, 18 sú NEPOTVRDENÉ).
- S4 starý web https://www.barbershop30.sk/ (curl 200, 27. 10.): „skúsení barberi“, „Vždy pripravená recepčná – ochotne ti poradí
  a zabezpečí, aby tvoj čas u nás bol bez stresu.“, „aj keď prídeš bez objednania“ (to posledné NEPOTVRDENÉ, S3 otázka 5).
- S5 recenzie doslovne z `assets/recenzie.js` (overené 13. 10. 2026): „každý barber vie čo robí a rozumie svojej práci“,
  „Strih spravený presne podľa predstáv“.
- S6 HEAD SPA 30: `hs-skvrny/index.html` r. 105 (Mostná 226/30), r. 658 („samostatná časť s vlastným tímom… v priestoroch
  Salónu 30“), meta description („Head Spa rituály pre relax a regeneráciu vlasov… Sedemnásť rituálov“).
- S7 Salón 30: https://www.salon30.sk/ (curl 200): H1 „Wellness pre vaše vlasy“, dámske strihy, farbenie, fúkaná,
  trichologické vyšetrenie, Mostná 30, Nitra.

Limity: riadok barbera ≤ 90 znakov, pilier ≤ 140, odpoveď v otázkach ≤ 320 (kontrola skriptom, pozri koniec súboru).

---

## 1. Tím barberov

### 1a. Spoločný úvod sekcie (nahrádza S1 r. 304 „Poctivé remeslo, moderný štýl a ľudský prístup. To spája celý tím.“)

> Tím barberov a barberiek pod jednou značkou. Každý má vlastný rukopis, všetci rovnaký štandard: konzultácia, poctivá práca a strih, ktorý vyzerá dobre aj o týždeň. Vyber si svojho človeka a objednaj sa.

Nadpisok „Kto ťa ostrihá“ (r. 303) ostáva. Zdroj: „Pod značkou Barbershop 30 tu pracuje tím barberov a barberiek.“ (S1 karta Ľudia),
konzultácia je prvý krok strihu (S1 cenník), „Výsledok ťa poteší aj o týždeň.“ (S1 r. 416).

### 1b. Riadok ku každému barberovi (≤ 90 znakov)

Web o nikom neuvádza fakty (roky praxe, špecializácia, od kedy; S2), preto sú riadky všeobecné, bez faktov.
Každý nadväzuje na dnešnú vetu, len je údernejší.

| meno | rola | nový riadok | dnes (S1) |
|---|---|---|---|
| Nikolas | Barber | Strih, akoby si ho nosil odjakživa. Len lepší, než si ho kedy mal. | r. 326 |
| Kristián | Barber | Elegancia bez námahy. Ty sedíš, on rieši. Výsledok hovorí za všetko. | r. 341 |
| Damian | Barber | Najprv ťa vypočuje. Potom hovoria už len nožnice a ty len prikyvuješ. | r. 356 |
| Michal | Barber | Horúci uterák, britva, ticho. Oči otvoríš, až keď je hotovo. A bude hotovo dobre. | r. 371 |
| Andy | Barber | Každý detail na svojom mieste. Aj ten, ktorý si všimne len tvoje zrkadlo. | r. 386 |
| Dominika | Barberka | Jemná ruka, prísne oko. Vstaneš, až keď sedí každý vlas. Bez výnimky. | r. 401 |
| Kevin | Barber | Pokojne, čisto, bez zbytočných rečí. Strih, ktorý ťa poteší aj o týždeň. | r. 416 |
| Lajko | Barber | Ostrá línia na krku, mäkký prechod na bokoch. Remeslo, ktoré vidno zblízka. | r. 431 |
| Jojo | Barber | Reč alebo ticho, ako chceš. Strih dotiahne tak či tak, a dotiahne ho poriadne. | r. 446 |
| Adrian | Barber | Dôveru si získa skôr, než si sadneš. Vrátiš sa skôr, než ti stihnú dorásť vlasy. | r. 461 |

Poznámka pod tímom o Romane (S1: „Farbenie, melír a trvalú robí Romana. Rezervuješ ich samostatne.“) sa nemení.

### 1c. Tri piliere (každý 1 veta, ≤ 140 znakov) – pod úvodom sekcie, nad portrétmi

| pilier | veta | zdroj |
|---|---|---|
| Skúsenosti | Striháme na Mostnej 30 od roku 2019 a hodnotenie 5,0 z 945 recenzií na Google sa za týždeň nastrihať nedá. | S1 „Na Mostnej 30 striháme od roku 2019“, „5,0 na Google · 945 recenzií“ (úvod); číslo recenzií treba pri ďalšej kontrole aktualizovať (S2, časť Úvod) |
| Precíznosť | Konzultácia pred prvým ťahom strojčeka, britva pri brade, styling a kolínska na záver: nič sa tu nerobí od oka. | S1 „Pánsky strih krok za krokom“: konzultácia, strojček a nožnice, horúci uterák a britva, styling a kolínska |
| Pohodlie (ide do stavby) | Pri dverách recepčná, v čakárni káva a minerálka zdarma a v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme. | S1 karty Poď ďalej a Čakáreň, karta Rezervácia |
| Garancia (NA POTVRDENIE) | pozri 1d | – |

Do stavby ide trojica Skúsenosti · Precíznosť · Pohodlie. Keď majiteľ potvrdí garanciu, tretí pilier sa vymení za Garanciu
(alebo sa pridá ako štvrtý, ak to rozloženie unesie bez zmeny vzhľadu).

### 1d. Garancia – 2–3 znenia NA POTVRDENIE majiteľom (≤ 140 znakov)

Na webe nie je dnes žiadna garancia (grep „garanc“ v S1: 0 nálezov). Starý web (S4) hovorí len „postaráme sa o to, aby si
odchádzal spokojný“ a „kvalita a spokojnosť našich zákazníkov sú našou prioritou“, čo nie je konkrétny záväzok.
Bez potvrdenia sa garancia na webe NEUKÁŽE.

- G1 (bez čísel, najbezpečnejšie): „Nie si spokojný? Povedz to ešte v kresle barberovi alebo recepcii a dáme to do poriadku na mieste.“
- G2 (s lehotou – lehotu a „zadarmo“ musí potvrdiť majiteľ): „Ak ti strih nesedí, ozvi sa recepcii do 7 dní na 0951 267 203 a opravíme ho zadarmo.“
- G3 (najostrejšie, len ak to majiteľ naozaj dodrží): „Z kresla vstaneš, až keď si spokojný. Ak nie, strih neplatíš.“

---

## 2. Časté otázky (nové položky do zoznamu S1 r. 830–837; odpoveď ≤ 320 znakov)

### 2a. Mám volať barberovi alebo recepcii? (ide do stavby, zaradiť hneď za „Ako sa objednám?“)

> Vždy recepcii: 0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme. Recepčná sa stará o tvoj termín a pohodlie, barber o tvoj výsledok. Keď má v kresle zákazníka, venuje sa jemu, nie telefónu. Presne tak to bude, aj keď v kresle sedíš ty.

Zdroj: zadanie majiteľa 27. 10. (recepčná = termíny a pohodlie, barber = výsledok, barber sa venuje zákazníkovi), telefón a hodiny
recepcie S1 karta Rezervácia, „Vždy pripravená recepčná…“ S4.

### 2b. Čo ak nebudem spokojný? (NA POTVRDENIE – do stavby až po potvrdení garancie, inak sa otázka neukáže)

- Verzia ku G1: „Povedz to hneď, ešte v kresle, barberovi alebo recepcii. Dáme to do poriadku na mieste. Ak si to všimneš až doma, zavolaj recepcii na 0951 267 203 a dohodneme opravu.“
- Verzia ku G2: „Ozvi sa recepcii do 7 dní na 0951 267 203 alebo info@barbershop30.sk. Opravu strihu máš zadarmo, termín ti dá recepcia.“
- Verzia ku G3: „Nevstaneš z kresla, kým nie si spokojný. Ak to aj tak nesedí, strih neplatíš. Stačí to povedať barberovi alebo recepcii ešte v kresle.“

### 2c. Môžem prísť bez objednania? (NA POTVRDENIE – web odpoveď nepozná; starý web S4 tvrdí „aj keď prídeš bez objednania“, S3 otázka 5 nepotvrdená)

> Môžeš, ale bez istoty voľného kresla. Máme ich 8, takže čakanie býva krátke. Istotu máš len s termínom: online kedykoľvek, alebo cez recepciu na 0951 267 203.

Do stavby NEJDE, kým majiteľ nepotvrdí, že veta zo starého webu stále platí. („8 kresiel“ S1 zoznam faktov pri kontakte.)

---

## 3. Pätička – blok „Naše prevádzky“ (nový stĺpec pred „Sleduj nás“, S1 r. 872, alebo riadok nad `.footer-bottom`)

Nadpis stĺpca: **Naše prevádzky** (slová majiteľa z 27. 10.; náhradný nadpis bez privlastnenia: „Na Mostnej 30 nájdeš aj“).

| prevádzka | riadok (1 riadok, len overené) | odkaz (curl 200, 27. 10.) |
|---|---|---|
| HEAD SPA 30 | Head Spa rituály pre relax a regeneráciu vlasov. Mostná 30, v priestoroch Salónu 30. | https://www.headspa30.sk/ (headspa30.sk presmeruje na www; živá stránka má canonical https://headspa30.sk/). Canonical v koreňovom index.html repozitára (r. 30) je https://d8f5s88zjy-art.github.io/head-spa-30/ (tiež 200) – ktorá má ísť na web, pozri otázku 5 |
| Salón 30 | Kaderníctvo a wellness pre vlasy: dámske strihy, farbenie, trichologické vyšetrenie. Mostná 30. | https://www.salon30.sk/ (salon30.sk presmeruje na www) |
| Barbershop 30 | Pánske strihy, brada a holenie britvou. Si tu. | vlastná stránka: `#uvod` s `aria-current="page"`; absolútne by to bol canonical S1 r. 24 https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/ (200). Na www.barbershop30.sk dnes beží starý web, naň neodkazovať |

Pravidlá pre stavbu: odkazy na cudzie domény s `target="_blank" rel="noopener"` ako ostatné v pätičke; žiadny telefón HEAD SPA 30
ani Salónu 30 na stránke Barbershopu (S3 „Čo nerobíme“); vzhľad ostatných stĺpcov nemeniť; všetky tri riadky a nadpis ako kľúče
do 7 slovníkov `assets/i18n/*.json` (kľúč = slovenský text) a `en/` pregenerovať.

Zdroje riadkov: HEAD SPA 30 – S6 (meta description a otázka „Ako súvisí HEAD SPA 30 so Salónom 30?“ na jeho webe);
Salón 30 – S7; Barbershop 30 – S1 pätička „Pánske strihy, brada a holenie na Mostnej 30.“ a cenník (holenie britvou).

---

## 4. Otázky pre majiteľa (odpoveď stačí číslom a vetou)

1. Garancia: ktoré znenie platí – G1 (dáme to do poriadku na mieste), G2 (oprava zadarmo do 7 dní) alebo G3 (nespokojný neplatí)? Alebo žiadna? Čo presne garancia znamená (oprava na mieste, lehota, zadarmo, kto o nej rozhoduje)?
2. Smie ísť na web otázka „Čo ak nebudem spokojný?“ a kto berie výhrady – recepcia na 0951 267 203, e-mail info@barbershop30.sk, alebo oboje?
3. Platí stále „aj keď prídeš bez objednania“ zo starého webu (OTAZKY-PRE-MAJITELA, otázka 5)? Bez odpovede otázka „Môžem prísť bez objednania?“ na web nejde.
4. „Naše prevádzky“: smieme HEAD SPA 30 a Salón 30 na webe Barbershopu uviesť ako naše (teda toho istého majiteľa)? Doterajšie pravidlo znelo „Nespomínať Salón 30 ani HEAD SPA 30 ako súčasť značky“. Ak nie, použijeme nadpis „Na Mostnej 30 nájdeš aj“.
5. HEAD SPA 30 má odkazovať na www.headspa30.sk (živá doména) alebo na d8f5s88zjy-art.github.io/head-spa-30/ (canonical v repozitári)? Salón 30 na www.salon30.sk?
6. Fakty o barberoch: roky praxe, špecializácia (fade, brada, deti…), od kedy je v tíme, pracovný Instagram (OTAZKY otázka 17)? Bez nich ostávajú riadky bez faktov.
7. Recepčná „8 rokov, ako jediný barbershop v Nitre“ ostáva nepotvrdená (otázka 9); v pilieri Pohodlie preto len „pri dverách recepčná“. Potvrdíte roky a „jediný“?
8. Počet recenzií (945, stav 13. 10. 2026) sa objaví aj v pilieri Skúsenosti; súhlasíte s číslom na webe (otázka 18) a kto ho bude aktualizovať?
9. Má „vždy volaj recepcii“ platiť aj pre WhatsApp, ak ho recepcia používa (otázka 12)?

---

## 5. Kontrola dĺžok

`python3 -I /tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/texty/dlzky.py` – výstup je pod súborom v denníku úlohy.
