# Porota – pravdivosť a právo (texty A, B, C pre Barbershop 30)

Dátum: 27. 10. 2026. Porotca nič nemenil, len overoval. Každé tvrdenie nižšie má príkaz alebo cestu:riadok.

## Hodnotenie

| Návrh | Body (0–10) | Verdikt jednou vetou |
|---|---|---|
| A | 8 | Bez čísel, všetko doložené, ale úvod tímu oživuje vetu „Desať ľudí, jeden kalendár“, ktorú majiteľ 13. 10. výslovne nahradil, a vydáva ju za „overenú vetu webu“. |
| B | 6 | Úvod tímu tvrdí „945 ľudí nám dalo 5,0“, čo je nepravda (928 × 5★, 11 × 4★, 1 × 3★, 1 × 2★, 4 × 1★); FAQ sľubuje presun a zrušenie termínu, hoci storno je nepotvrdená otázka 3. |
| C | 9 | Každý fakt sedí so zdrojom, hodnotenie je sformulované správne („5,0 z 945 recenzií“), číslo recenzií aj privlastnenie prevádzok dáva majiteľovi na potvrdenie a ponúka náhradný nadpis; jediné riziko sú vymyslené podmienky garancie (7 dní, zadarmo, neplatíš), ktoré sú však jasne označené NA POTVRDENIE. |

**Víťaz: C.**

## Čo porota overila (spoločné pre všetky tri)

- Garancia na webe dnes nie je: `grep -rn -i "garanc\|záruk" barbershop-30/index.html barbershop-30/docs/` → jediný nález `docs/MASTER_BRIEF.md:112` („ciele, nie garancie“). Všetky tri návrhy ju dávajú len NA POTVRDENIE – v poriadku.
- Telefón a hodiny recepcie: `barbershop-30/index.html:830` („0951 267 203, v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme“), :787 (online kedykoľvek). Odpoveď „Mám volať barberovi alebo recepcii?“ je vo všetkých troch z týchto riadkov + zadania majiteľa (PRIEBEH.md:238).
- Recepčná pri dverách: `index.html:224`; káva a minerálka zdarma: `index.html:270`; od roku 2019: `index.html:742, 814, 854`; postup strihu: `index.html:502, 510, 570`; 8 kresiel: `index.html:815`; hodnotenie: `index.html:193` („5,0 na Google · 945 recenzií“).
- O barberoch web nič faktické nehovorí: `docs/CONTENT_SOURCES.md:31–32` („Priezviská ani špecializácie web neuvádza – nevymýšľame“). Všetky tri správne nepridávajú roky praxe ani ocenenia.
- Pravidlo, ktoré požiadavka majiteľa mení: `OTAZKY-PRE-MAJITELA.md:111` („Nespomínať Salón 30 ani HEAD SPA 30 ako súčasť značky a nedávať ich telefón na stránky Barbershopu“) a `CONTENT_SOURCES.md:107` („Vzťah so Salónom 30 … žiadny web nespomína druhý“). Všetky tri to vedú ako otázku pre majiteľa; nikto neuvádza telefón inej prevádzky – v poriadku.
- „Naše“ je doložiteľné: Facepalm s.r.o., IČO 52231381 je v kontakte starého webu barbershop30.sk aj na salon30.sk (`stiahnute/barbershop30.html`, `stiahnute/salon30.html`, výpis cez python: „Kontakt Facepalm s.r.o. IČO: 52231381“) a v pätičke webu `index.html:883`. HEAD SPA 30 sídli „v priestoroch Salónu 30“ (koreňový `index.html:658`, meta description `index.html:7`), rovnaký telefón 0911 153 136 ako Salón 30.
- Adresy (curl -sS -o /dev/null -L -w '%{http_code} final=%{url_effective}', 27. 10. 2026):
  - https://www.headspa30.sk/ → 200; https://headspa30.sk/ → 200, final www; canonical živej stránky https://headspa30.sk/ (stiahnutý HTML), canonical v repozitári `index.html:30` = https://d8f5s88zjy-art.github.io/head-spa-30/ → 200.
  - https://www.salon30.sk/ → 200; https://salon30.sk/ → 200, final www. Titulok „Salón 30“, H1 „Wellness pre vaše vlasy“, menu „Trichologické vyšetrenie“, cenník „Farbenie a koloristika“, „fúkaná“, adresa Mostná 30, 94901 Nitra.
  - https://www.barbershop30.sk/ → 200 (starý web, titulok „Barbershop30“); /rezervacia → 200; https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/ → 200 (canonical `barbershop-30/index.html:24`).
  - booqme.app/sk/rezervacia/barbershop30 a /salon-30-head-spa → 200.
- Žiadny návrh nespomína AI, neporovnáva konkurenciu, nedáva zdravotný sľub (grep „AI“, „konkurenc“, „zdrav“ v texty-*.md: 0 nálezov v textoch do stavby; „trichologické vyšetrenie“ je názov služby Salónu 30 z jeho webu, nie sľub Barbershopu).
- Dĺžky: skript nad texty-A/B (python3 -I) – riadky barberov A 65–82, B 54–68, C 66–81 (≤ 90); piliere A 109–123, B 91–97, C 106–113 (≤ 140); odpovede FAQ A 162–242, B 92–246, C ≤ 255 (≤ 320). Všetko v limitoch.

## Nálezy k jednotlivým návrhom

### A (8/10)
1. **Úvod tímu „Desať ľudí, jeden kalendár, jedna latka…“** – A tvrdí „overená veta webu, CS“. Nie je na webe (`grep -n -i "desať\|kalendár" barbershop-30/index.html` → 0 vecných nálezov) a `CONTENT_SOURCES.md:126` hovorí, že majiteľ ju 13. 10. **nahradil** vetou „Pod značkou Barbershop 30 tu pracuje tím barberov a barberiek.“ Oživiť nahradenú vetu bez otázky majiteľovi je chyba pravdivosti aj autority.
2. „Desať ľudí“ / „Desať barberov“ – v tíme je 10 kariet, ale web uvádza aj Romanu (`index.html:466`). Číslo je zbytočné a hneď zastará pri zmene tímu.
3. Pätička HEAD SPA 30 „Head Spa rituály pre hlavu, relax a regenerácia vlasov.“ – „pre hlavu“ nie je z meta description (tá hovorí „pre relax a regeneráciu vlasov“); neškodné, ale nadbytočné.
4. Inak čisté: žiadne čísla, G1 „bez príplatku“ a G3 „ešte dnes“ správne označené na potvrdenie, otázka 7 na „Všetky tri na Mostnej 30“ správne položená (adresy overené: HS Mostná 226/30, S30 Mostná 30, W Mostná 30).

### B (6/10)
1. **„…a 945 ľudí nám za to dalo na Google 5,0.“ – nepravda.** `CONTENT_SOURCES.md:138`: „5,0 z 945 recenzií; rozdelenie 928× 5★, 11× 4★, 1× 3★, 1× 2★, 4× 1★“. 17 ľudí nedalo 5. Veta musí preč alebo sa prepísať na priemer.
2. Pilier Skúsenosti „945 recenzií s hodnotením 5,0“ – dvojznačné (číta sa ako 945 recenzií, každá 5,0). Zmeniť na „5,0 z 945 recenzií“.
3. FAQ „Recepcia ti termín nájde, presunie aj zruší.“ – storno a zmena termínu sú `OTAZKY-PRE-MAJITELA.md:11` otázka 3 (NEPOTVRDENÉ). Web hovorí len „Daj nám vedieť čo najskôr“ (`index.html:836`). Sľub „presunie aj zruší“ ide nad rámec zdroja.
4. Odkaz Barbershop 30 na `#top` – na stránke taký id nie je, úvod má `id="uvod"` (`index.html:153` `id="uvod"`, „Späť hore“ v pätičke vedie na `#uvod`).
5. B nepoložil otázku k číslu recenzií na ďalšom mieste (OM otázka 18, kde je už stav 949 k 20. 10.), hoci číslo dáva do úvodu aj piliera – zastará na dvoch nových miestach.
6. Plus: „Čo ma čaká, keď prídem?“ je celé z webu (`index.html:224, 269–270, 502, 510, 764`) – pravdivé a dá sa rovno stavať.

### C (9/10)
1. Pilier Skúsenosti „hodnotenie 5,0 z 945 recenzií na Google“ – formulácia správna, číslo z `index.html:193`; C sám dáva otázku 8 (aktualizácia čísla, OM 18). Riziko: číslo v i18n kľúči zastará (OM už uvádza 949). Odporúčam náhradnú verziu bez čísla, kým majiteľ neodpovie.
2. Garancia G2 „do 7 dní … zadarmo“ a G3 „strih neplatíš“ – nemajú žiadny zdroj (sú vymyslené ako návrh); sú jasne NA POTVRDENIE, ale do stavby nesmú ani omylom. FAQ verzia ku G1 („Ak si to všimneš až doma, zavolaj…“) rozširuje záväzok za kreslo – majiteľ musí potvrdiť osobitne.
3. „Môžem prísť bez objednania?“ – „čakanie býva krátke“ je zo starého webu („minimálne čakanie“), ktorý je OM otázka 5 NEPOTVRDENÉ; aj po potvrdení „bez objednania“ odporúčam túto časť vety vynechať.
4. Plus: úvod tímu stavia na vete, ktorú chce majiteľ („Tím barberov a barberiek…“, `index.html:293`), „Vrátiš sa skôr, než ti stihnú dorásť vlasy“ je bez faktu, pätička má overené riadky (HS „v priestoroch Salónu 30“ = koreňový `index.html:658`; S30 „Wellness pre vaše vlasy“ = H1 salon30.sk) a náhradný nadpis „Na Mostnej 30 nájdeš aj“, ak majiteľ „naše“ nepotvrdí.

## Čo vziať z ostatných do C (stepy)
- Z A: variant piliera Skúsenosti bez čísla („Na Mostnej 30 striháme od roku 2019. Jeden postup: konzultácia, strojček, nožnice, fade. Nič naslepo.“ – bez „Desať barberov“), kým majiteľ nepotvrdí číslo recenzií (OM 18); záver odpovede Q1 „Termín si tiež spravíš online, kedykoľvek.“ (`index.html:787`); voliteľný podnadpis „Všetky tri na Mostnej 30 v Nitre.“ (adresy overené) ako otázku pre majiteľa.
- Z B: FAQ „Čo ma čaká, keď prídem?“ – DO STAVBY, všetky vety z webu; v riadku Salónu 30 doplniť „koloristika“ (cenník salon30.sk „Farbenie a koloristika“); tabuľku curl dôkazov s final URL.

## Čo vyhodiť alebo zmeniť (skrty)
- A: vyhodiť celý úvod „Desať ľudí, jeden kalendár, jedna latka: strih, ktorý sedí. …“ (majiteľom nahradená veta, CS:126); v pilieri Skúsenosti škrtnúť „Desať barberov,“; v pätičke „Head Spa rituály pre hlavu, relax a regenerácia vlasov.“ → „Head Spa rituály pre relax a regeneráciu vlasov.“
- B: „Takto sa na Mostnej 30 strihá od roku 2019 a 945 ľudí nám za to dalo na Google 5,0.“ → „Takto sa na Mostnej 30 strihá od roku 2019 – a na Google máme 5,0 z 945 recenzií.“ (alebo bez čísla); „945 recenzií s hodnotením 5,0 na Google hovorí za nás“ → „5,0 z 945 recenzií na Google hovorí za nás“; „Recepcia ti termín nájde, presunie aj zruší.“ → „Recepcia ti termín nájde. Zmenu alebo zrušenie jej daj vedieť čo najskôr.“ alebo vynechať do odpovede na otázku 3; `#top` → `#uvod`.
- C: pilier Skúsenosti s číslom 945 len po odpovedi majiteľa na otázku 18, dovtedy variant bez čísla; G2 „ozvi sa recepcii do 7 dní … opravíme ho zadarmo“ a G3 „Ak nie, strih neplatíš.“ nikdy do stavby bez písomného potvrdenia (a pri G2 majiteľ sám určí lehotu – 7 dní je návrh, nie fakt); v „Môžem prísť bez objednania?“ škrtnúť „takže čakanie býva krátke“; vo FAQ verzii ku G1 škrtnúť „Ak si to všimneš až doma, zavolaj recepcii na 0951 267 203 a dohodneme opravu.“, kým majiteľ nepotvrdí, že garancia platí aj po odchode.

## Právne poznámky pre staviteľa
- Nadpis „Naše prevádzky“ je obhájiteľný (rovnaký prevádzkovateľ Facepalm s.r.o., IČO 52231381 na barbershop30.sk a salon30.sk; HEAD SPA 30 v priestoroch Salónu 30), ale ruší zapísané pravidlo OM:111 – stavať až po odpovedi majiteľa, inak nadpis „Na Mostnej 30 nájdeš aj“.
- Žiadna garancia, lehota, „zadarmo“, „neplatíš“ ani „bez príplatku“ sa nesmie objaviť na webe bez potvrdenia majiteľa; nepotvrdené verzie ostávajú len v otázkach pre majiteľa.
- Počet recenzií je údaj tretej strany, ktorý sa mení; každé ďalšie miesto s číslom treba evidovať v CONTENT_SOURCES (kto aktualizuje).
