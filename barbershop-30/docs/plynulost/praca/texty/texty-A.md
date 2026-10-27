# Barbershop 30 – texty A (barberi, časté otázky, prevádzky v pätičke)

Dátum: 27. 10. 2026. Tón: sebavedomý remeselník – krátke vety, remeslo, precíznosť, výsledok v zrkadle. Bez vulgarít, bez porovnávania konkurencie, bez zdravotných sľubov, bez čísel, ktoré web nepozná.

Zdroje (každý fakt má jeden z nich):
- W = `barbershop-30/index.html` (slovenské texty webu, HEAD bdabff7)
- CS = `barbershop-30/docs/CONTENT_SOURCES.md`
- OM = `dennik/barbershop-30/docs/plynulost/OTAZKY-PRE-MAJITELA.md` (otázky 1–24 = NEPOTVRDENÉ)
- SW = starý oficiálny web https://www.barbershop30.sk/ (stiahnutý 27. 10. 2026, `scratchpad/barber/stiahnute/barbershop30.html`)
- HS = https://www.headspa30.sk/ (title „HEAD SPA 30 Nitra | Head Spa rituály, ceny a rezervácia“, description „…na Mostnej 30 v priestoroch Salónu 30…“)
- S30 = https://www.salon30.sk/ („Profesionálne a moderné kaderníctvo v centre Nitry“, „Trichologické vyšetrenie vlasov“, Mostná 30, 94901 Nitra, Facepalm s.r.o. IČO 52231381)

Pravidlo pre stavbu: do HTML idú len riadky označené **DO STAVBY**. Riadky **NA POTVRDENIE** ostávajú v tomto súbore a v otázkach pre majiteľa, kým neodpovie. Slovenské vety sú zároveň kľúčmi i18n (slovníky `assets/i18n/*.json` mapujú slovenskú vetu → preklad), preto ich po schválení nemeniť bez úpravy slovníkov.

---

## 1. Tím barberov

### 1a. Spoločný úvod sekcie (nahrádza `.lead.measure` „Poctivé remeslo, moderný štýl a ľudský prístup. To spája celý tím.“, W) – DO STAVBY

> Desať ľudí, jeden kalendár, jedna latka: strih, ktorý sedí. Na Mostnej 30 striháme od roku 2019 – klasiku, fade aj bradu britvou. Ty povieš, ako to chceš. Zvyšok je remeslo.

Fakty: desať mien v tíme (W, karty tímu; „Desať ľudí, jeden kalendár“ je overená veta webu, CS), „Na Mostnej 30 striháme od roku 2019“ (W, blok Dôvera), klasika/fade/britva (W, cenník). Nadpis karty „Komu zveríš hlavu?“ a podtitul „Pod značkou Barbershop 30 tu pracuje tím barberov a barberiek…“ ostávajú (želanie majiteľa, CS:126).

### 1b. Riadok ku každému barberovi (`.team-bio`, ≤ 90 znakov) – DO STAVBY

Web o barberoch nehovorí nič faktické (CS:31–32: „Priezviská ani špecializácie web neuvádza – nevymýšľame“; fakty-barbershop-30.md: „Popis človeka je dojem a prístup, nie fakt“). Riadky preto zostrujú dnešné popisy (W) – bez rokov praxe, bez ocenení, bez špecializácií.

| Barber | Dnes (W) | Nový riadok |
|---|---|---|
| Nikolas | Strih ti pristane, akoby si ho nosil odjakživa. | Strih, ktorý ti sadne, akoby si ho nosil odjakživa. Spoznáš to v prvom zrkadle. |
| Kristián | Elegancia bez námahy. Taký je jeho rukopis. | Elegancia bez námahy. Jeho rukopis spoznáš, aj keď nevieš, čo presne sa zmenilo. |
| Damian | Pozorne ťa vypočuje. Potom už hovoria len nožnice. | Najprv ťa vypočuje. Potom hovoria len nožnice – a hovoria presne. |
| Michal | Zavrieš oči pri horúcom uteráku a otvoríš ich spokojný. | Horúci uterák, britva, ticho. Oči zavrieš unavený, otvoríš ich spokojný. |
| Andy | Každý detail na svojom mieste, aj ten, ktorý vidíš len z profilu. | Detail je jeho reč. Aj ten, ktorý vidíš len z profilu, musí sedieť. |
| Dominika | Jemná ruka, prísne oko. U nej je hotovo, až keď sedí každý vlas. | Jemná ruka, prísne oko. Hotovo je, až keď sedí každý vlas. Ani o jeden skôr. |
| Kevin | Pracuje pokojne a čisto. Výsledok ťa poteší aj o týždeň. | Pokoj v rukách, čistota v strihu. Výsledok ťa teší aj o týždeň, keď dorastie. |
| Lajko | Ostrá línia na krku, mäkký prechod na bokoch. Remeslo vidno zblízka. | Ostrá línia na krku, mäkký fade na bokoch. Jeho remeslo obstojí aj zblízka. |
| Jojo | Rozhovor alebo ticho, ako ti je milšie. Strih dotiahne tak či tak. | Reč alebo ticho, ako ti je milšie. Strih dotiahne tak či tak – do poslednej línie. |
| Adrian | Dôveru získa skôr, než si sadneš do kresla. Rád sa k nemu vrátiš. | Dôveru si získa skôr, než si sadneš. Výsledok ti dá dôvod vrátiť sa. |

Poznámka pod tímom (W, bez zmeny): „Farbenie, melír a trvalú robí Romana. Rezervuješ ich samostatne.“

### 1c. Tri piliere (≤ 140 znakov, nový malý blok pod mriežkou tímu alebo nad ňou – vzhľad podľa staviteľa, bez zmeny ostatných častí)

**DO STAVBY (verzia bez nepotvrdených sľubov):**

| Pilier | Veta |
|---|---|
| Skúsenosti | Na Mostnej 30 striháme od roku 2019. Desať barberov, jeden postup: konzultácia, strojček, nožnice, fade. Nič naslepo. |
| Precíznosť | Strih začína konzultáciou a končí stylingom a kolínskou. Medzitým len ostré nástroje a oko, ktoré vidí aj detail z profilu. |
| Výsledok | Odchádzaš s hlavou hore. Káva a minerálka zdarma, kým čakáš, styling a kolínska na záver. Zvyšok dňa je tvoj. |

Fakty: od roku 2019 (W), postup strihu „Konzultácia · Strojček a nožnice, fade · Umytie vlasov a fénovanie · Styling a kolínska“ (W, Pánsky strih krok za krokom), káva a minerálka zdarma (W, Čakáreň), „Odchádzaš s hlavou hore. … Zvyšok dňa je tvoj.“ (W, karta Cestou von).

**NA POTVRDENIE – pilier Garancia (nahradí pilier Výsledok, až keď majiteľ vyberie znenie a potvrdí, že to tak naozaj funguje):**

- G1: Ak niečo nesedí, povedz to ešte v kresle. Barber to doladí hneď – bez diskusie a bez príplatku.
- G2: Odchádzaš spokojný, alebo to doladíme na mieste. Stačí povedať recepcii, kým sedíš v kresle.
- G3: Strih musí sedieť tebe, nie nám. Ak nesedí, povedz to a dáme to do poriadku ešte dnes.

Čo majiteľ musí potvrdiť: že úprava je naozaj bez príplatku (G1), dokedy sľub platí (len v kresle / pri odchode / do niekoľkých dní – G2, G3), komu to zákazník hlási (recepcia). Web dnes žiadnu garanciu neuvádza (W, SW: ani starý web); CS a OM ju nespomínajú.

---

## 2. Nové časté otázky (`details.faq-item`, odpoveď ≤ 320 znakov)

### Q1 – DO STAVBY

**Mám volať barberovi alebo recepcii?**
> Vždy recepcii: 0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme. Recepčná sa stará o tvoje termíny a pohodlie, barber o tvoj výsledok – a ten sa práve venuje zákazníkovi v kresle. Termín si tiež spravíš online, kedykoľvek.

Fakty: telefón a hodiny recepcie (W, karta Rezervácia a FAQ „Ako sa objednám?“), „Pri dverách ťa privíta recepčná“ (W), „Vždy pripravená recepčná – ochotne ti poradí a zabezpečí, aby tvoj čas u nás bol bez stresu“ (SW), online 24/7 (W, CS:21). Rozdelenie „recepčná = termíny a pohodlie, barber = výsledok“ je želanie majiteľa z 27. 10.

### Q2 – NA POTVRDENIE (do stavby až po potvrdení garancie v 1c)

**Čo ak nebudem spokojný?**
- Verzia k G1/G3: > Povedz to hneď – ešte v kresle alebo pri odchode na recepcii. Dáme to do poriadku na mieste. Strih má sedieť tebe, nie nám.
- Verzia k G2: > Povedz to recepcii, kým sedíš v kresle, a doladíme to na mieste. Ak si na to prídeš až doma, zavolaj na 0951 267 203 a dohodneme, ako ďalej.

Bez potvrdenia sa otázka na webe neukáže; v stavbe ostane len Q1 (a prípadne Q3).

### Q3 – NA POTVRDENIE (OM otázka 5: „Platí stále veta zo starého webu ‚aj keď prídeš bez objednania‘?“)

**Môžem prísť bez objednania?**
> Najistejšie je objednať sa: online kedykoľvek, alebo cez recepciu na 0951 267 203. Ak ideš okolo, zavolaj a recepčná ti povie, či je voľné kreslo – máme ich osem.

Fakty: „8 kresiel – minimálne čakanie – rýchly servis, aj keď prídeš bez objednania“ (SW), „8 kresiel“ (W). Keďže OM to vedie ako nepotvrdené, ide do stavby až po odpovedi majiteľa.

Poradie v sekcii: Q1 hneď za „Ako sa objednám?“ (druhé miesto), Q2 za „Sú ceny v cenníku konečné?“, Q3 za „Čo ak nestihnem prísť?“.

---

## 3. Pätička – blok „Naše prevádzky“ (DO STAVBY)

Nadpis stĺpca (`.footer-title`): **Naše prevádzky**  
Podnadpis (voliteľne, `.small`): **Všetky tri na Mostnej 30 v Nitre.**

| Prevádzka | Riadok (čo to je) | Odkaz | Overenie |
|---|---|---|---|
| HEAD SPA 30 | Head Spa rituály pre hlavu, relax a regenerácia vlasov. | https://www.headspa30.sk/ | curl 200 (27. 10.), title „HEAD SPA 30 Nitra \| Head Spa rituály, ceny a rezervácia“; web z tohto repozitára (README.md:591 „Adresy sú na https://headspa30.sk/“); canonical v koreňovom index.html:30 ukazuje na github.io – pozri otázku 4 |
| Salón 30 | Kaderníctvo a trichologické vyšetrenie vlasov. | https://www.salon30.sk/ | curl 200 (27. 10.), S30 (menu „Cenník a služby · Trichologické vyšetrenie · Head Spa“, Mostná 30, 94901 Nitra); rovnaký odkaz používa aj web HEAD SPA 30 (index.html:695, 718) |
| Barbershop 30 | Pánske holičstvo: strih, brada, holenie britvou. Si tu. | `#uvod` (táto stránka); po presune na vlastnú doménu https://www.barbershop30.sk/ (curl 200, dnes starý web) | W |

Fakty v riadkoch: HS title/description („Head Spa rituály pre relax a regeneráciu vlasov v centre Nitry, na Mostnej 30 v priestoroch Salónu 30“); S30 „Profesionálne a moderné kaderníctvo v centre Nitry“, „Trichologické vyšetrenie vlasov“; W title „Pánske holičstvo, Mostná 30“, podtitul úvodu „Strih, úprava brady aj holenie britvou“. Všetky tri adresy Mostná 30 (HS: Mostná 226/30; S30: Mostná 30; W: Mostná 30). Prevádzkovateľ Facepalm s.r.o., IČO 52231381 je uvedený na S30 aj SW (sekcia Kontakt) a v pätičke W – preto „naše prevádzky“ nie je výmysel. Nepíšeme vek, ceny ani telefóny iných prevádzok (CS: „nedávať ich telefón na stránky Barbershopu“) – len názov, jeden riadok a odkaz.

Odkazy s `target="_blank" rel="noopener"` ako ostatné externé odkazy v pätičke (W).

---

## 4. Otázky pre majiteľa (odpovedať stačí číslom a vetou)

1. Garancia: ktoré znenie – G1, G2 alebo G3 – a je úprava naozaj bez príplatku? Dokedy sľub platí (len v kresle, pri odchode, alebo aj keď zákazník zavolá do pár dní)? Kým to nepotvrdíte, web garanciu neukáže a tretí pilier je „Výsledok“.
2. Platí stále „aj keď prídeš bez objednania“ zo starého webu (OM otázka 5)? Bez odpovede ostáva otázka „Môžem prísť bez objednania?“ mimo webu.
3. Barberi: ku každému máme len dojem a prístup. Ak chcete „skúsenosti“ ako fakt, pošlite ku každému roky praxe alebo školu/kurz a čo robí najradšej (fade, brada, klasika). Bez toho ostávajú riadky bez čísel.
4. HEAD SPA 30: v pätičke odkazujeme na https://www.headspa30.sk/ (živý web). Je to správna adresa, alebo má ostať github.io z canonicalu?
5. Salón 30: odkaz https://www.salon30.sk/ (dnešný web salónu) a popis „Kaderníctvo a trichologické vyšetrenie vlasov“ – súhlasí? Má sa spomenúť aj kozmetika alebo niečo iné?
6. Barbershop 30 v tom istom bloku: dnes vedie na začiatok tejto stránky; po spustení na www.barbershop30.sk (OM otázka 21) pôjde na doménu. Súhlasí?
7. Smieme napísať „Všetky tri na Mostnej 30 v Nitre“ ako podnadpis bloku? Doteraz platilo pravidlo nespájať Barbershop so Salónom 30 a HEAD SPA 30 (CS:107, OM „Čo nerobíme“); vaša požiadavka z 27. 10. ho mení – potvrďte prosím.
8. Recepcia: má sa k odpovedi „Mám volať barberovi alebo recepcii?“ pridať aj e‑mail info@barbershop30.sk alebo WhatsApp (OM otázka 12)?
9. Ostáva na webe „Ako jediný barbershop v Nitre ju máme už 8 rokov“ (OM otázka 9, zatiaľ nepotvrdené)? Nové texty na to nenadväzujú, aby sa dali potom zmeniť nezávisle.
