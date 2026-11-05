# Stavebniny Richtárik – štýlová príručka textov

Platí pre všetky texty webu: úvod, katalóg (build.py, obsah.py, popisy.py), akcie, novinky, služby, O nás, kontakt, pätu, 404, tlačidlá, alt texty, titulky, meta popisy, vyhľadávanie a asistenta.
Fakty berte len z [FAKTY.md](FAKTY.md).

## 1. Oslovenie: vykanie, malými písmenami

**Rozhodnutie: celý web vyká („vy, vám, váš“) malými písmenami. Firma hovorí v 1. osobe množného čísla („my“).**

Prečo:

1. **Publikum.** Stavebniny predávajú stavebným firmám, živnostníkom, predajniam stavebnín aj stavebníkom vo veku 30 – 70 rokov (PW:7, PW:9). V slovenskom obchodnom styku sa vyká. Tykanie pôsobí ako tón značky pre mladých (Barbershop), nie ako tón dodávateľa materiálu na dom za desaťtisíce eur.
2. **Kontinuita.** Pôvodný web a cenník vykajú: „Vítame Vás…“, „PRÍDTE SI K NÁM…“, „DOSTANETE OD NÁS…“ (PW:4–8). Na vykanie sú zvyknutí majiteľ aj stáli zákazníci.
3. **Dnešný stav je zmiešaný.** Tykanie je na všetkých 75 stránkach (301 výskytov, väčšinou opakovaná výzva v päte). Na 21 stránkach sa navyše mieša s vykaním z textov zdroja a výrobcov (59 výskytov, napr. sluzby.html, kontakt.html, o-nas.html, tondach.html). Previesť na tykanie aj texty výrobcov by znamenalo meniť cudzie texty. Prejsť na vykanie je jednotnejšie a znamená menej zásahov.
4. **Majiteľ chce „viac profesionálne“.** Vykanie je najlacnejší a najviditeľnejší krok k tomu.

Pravidlá:

- „vy, vám, váš“ píšte **malými** písmenami. Veľké „Vy“ patrí do listu jednej osobe, nie na web. Opraviť: „Vám, Vás, Vašu, VAŠA SPOKOJNOSŤ“ (sluzby.html:49, o-nas.html:50).
- Firma hovorí za seba „my“, nikdy „ja“. „Na tehlu vám spravím…, pokúsim sa“ (akcie TermoBRIK) prepíšte na „pripravíme…, pokúsime sa“.
- Tlačidlá sú **neutrálne**, v neurčitku: „Zavolať 0905 622 223“, „Poslať dopyt“, „Prezrieť katalóg“. Tie sú dnes v poriadku.
- Výzvy vo vetách sú v 2. osobe množného čísla: „Zavolajte“, „Pošlite“, „Príďte“.

Prevodová tabuľka (najčastejšie tvary podľa `nastroje/audit.py`):

| Dnes | Po |
|---|---|
| Pošli nám (76×) | Pošlite nám |
| Zavolaj (60×) | Zavolajte |
| napíš (58×) | napíšte |
| Chceš cenu…? (57×) | Potrebujete cenu…? |
| klikni pre zväčšenie (15×) | Kliknutím zväčšíte. |
| potrebuješ / hľadáš / Vyber / Hľadaj | potrebujete / hľadáte / Vyberte / Hľadajte |
| Príď si k nám / Prines | Príďte k nám / Prineste |
| dostaneš / nájdeš / kúpiš / Povieš / staviaš | získate / nájdete / kúpite / Poviete / staviate |
| tvoja spokojnosť / pre teba / ti | vaša spokojnosť / pre vás / vám |
| Nenašiel si, čo hľadáš? | Nenašli ste, čo hľadáte? |

## 2. Tón

- **Vecný a istý.** Hovorte ako skúsený predavač za pultom: konkrétne, bez prikrášľovania.
- **Čísla namiesto prídavných mien.** Nie „výhodné ceny“, ale „4,42 € za vrece s DPH“. Nie „rýchla doprava“, ale „vlastné autá s mechanickou rukou, po celom Slovensku“.
- **Zákazník a výsledok na prvom mieste.** Nie „Ponúkame poradenstvo“, ale „Poradíme vám s výberom materiálu“.
- **Bez výkričníkov, bez verzáliek, bez emotikonov.**
- „Akcia“ a „akciová cena“ namiesto „super ceny“. Štítky karty sú „Akciová cena“, „Zľava 20 %“, „Na sklade“, „Doprava zdarma*“ (*len s podmienkou zo zdroja).
- Texty výrobcov (katalóg, novinky) sa nepíšu nanovo. Opravia sa len preklepy, typografia a verzálky. Ich tvrdenia sa nepreberajú do našich nadpisov a meta popisov (FAKTY.md G).

## 3. Dĺžky

| Prvok | Limit |
|---|---|
| H1 | 2 – 7 slov, najviac 45 znakov |
| H2 sekcie | najviac 60 znakov, bez bodky na konci |
| Úvodný odsek (lede) | 1 – 2 vety, najviac 160 znakov |
| Odsek | najviac 3 vety, veta najviac 20 slov |
| Text na karte (akcia, kategória, novinka) | najviac 140 znakov |
| Štítok (tag) | 1 – 3 slová |
| Tlačidlo | 1 – 4 slová (+ telefón) |
| `<title>` | najviac 60 znakov vrátane „ \| Stavebniny Richtárik“ |
| meta description | 120 – 155 znakov, **celé vety, nikdy nie skrátené „…“** (dnes 26 zo 75 popisov končí „…“) |
| alt text | 5 – 15 slov, opisuje, čo je na fotke |

## 4. Vzory nadpisov

| Stránka | Vzor | Príklad |
|---|---|---|
| Úvod H1 | silný obraz + miesto | „Dvor plný materiálu. Od základov po strechu.“ |
| Sekcia úvodu | prínos pre zákazníka | „Dovezieme na miesto, ktoré určíte“ |
| Kategória H1 | názov kategórie (kľúčové slovo) | „Murovací materiál“ |
| Kategória lede | čo + značky + jedna služba | „Tehly TermoBRIK, tvárnice Ytong a Porfix, preklady a stropné systémy. Spotrebu na celý dom vám spočítame zadarmo.“ |
| Značka H1 | značka + čo to je | „Porfix – pórobetónové tvárnice a preklady“ |
| Karta značky H3 | presný názov značky (§7) | „Pezinské tehelne“, nie „Pezinské Tehelne“ |
| Akcia H1 | výrobok + výhoda | „Cement 325 R a 425 R za akciové ceny“ |
| Novinka H1 | výrobok + použitie | „Kamenný koberec Bianka na schody a chodníky“ (dnes „Stone“) |
| Kontakt H1 | miesto | „Predajňa a sklad v Nitre – Horných Krškanoch“ |

Nadpis nekončí bodkou, výnimkou je dvojveta v H1 úvodu. Spojka „+“ v nadpise sa píše ako „a“ („Stropný systém a preklady“).

## 5. Výzvy k akcii

- **Hlavná:** „Zavolať 0905 622 223“ (tel:). **Vedľajšia:** „Vyžiadať cenovú ponuku“ (mailto s predmetom). Ďalšie: „Prezrieť katalóg“, „Aktuálne akcie“, „Navigovať do predajne“.
- V jednom bloku najviac 2 tlačidlá. Telefón vždy s číslom.
- Slovo „zadarmo“ len pri cenovej ponuke, poradenstve a výpočte spotreby (FAKTY.md B). Pri doprave len s podmienkou zo zdroja.
- Odkaz na PDF má vždy názov a typ: „Cenník akcií (PDF, 28. 1. 2026)“. Nie „Stiahnuť PDF“ alebo „Akcia - cement“.

## 6. Typografia, čísla a jednotky

- **Pomlčka** „–“ s medzerami vo vete a v rozsahoch („7:00 – 16:00“, „15 – 30 %“). Spojovník „-“ len v zloženinách („výklopno-kyvné“). Dnes je 334 výskytov „slovo - slovo“, hlavne v textoch zdroja (napr. „Akcia - cement“).
- **Nezlomiteľná medzera** medzi číslom a jednotkou („25 kg“, „5 %“, „17 €“, „8 t“), v dátume („28. 1. 2026“), v telefóne („0905 622 223“) a za jednopísmenovými predložkami (v, k, s, z, o, u, a, i).
- **Jednotky:** m², m³ (nie m2, m3; dnes 96×), °C (nie „+ 5oC“), ø, × v rozmeroch („50 × 25 × 20 cm“). Číslo a jednotka sa píšu s medzerou („4 mm“, nie „4mm“; dnes 27×).
- **Mena:** „4,42 € s DPH“, „od 22,80 €/m²“. Nie Eur, Dph, „31,-“ (novinky/topstone 50–51).
- **Percentá:** „5 %“ s medzerou (dnes 7× bez medzery).
- **Desatinná čiarka:** „22,80“, nie „22.80“.
- **Úvodzovky:** „…“. Tri bodky „…“ len ako jeden znak a len vo výpustke, nie „....“ ani „.. .“.
- **Verzálky** len pri skratkách (DPH, IČO, DIČ, VÚB, CEM, XPS, EPS, OSB, PVC). Nadpisy zo zdroja „HOME /do domácnosti/“ a „CENY:“ prepíšte na „Do domácnosti (Home)“ a „Ceny“. Lomky namiesto zátvoriek „/text/“ nahraďte zátvorkami.
- Pred čiarkou ani bodkou nie je medzera (dnes 30×, napr. „70 , 80 , 90“ v dvere-okna).

## 7. Názvy značiek (záväzné tvary)

| Správne | Nie | Kde je dnes chyba |
|---|---|---|
| TermoBRIK | TermoBrik, Termobrik | popisy.py:31, build.py:182 |
| Porfix (text), PORFIX len v logu | — | v poriadku |
| Ytong | YTONG | v poriadku |
| RoofLITE | Rooflite (21×) | build.py:126, akcie, kategória strešné okná. Tvar výrobcu a zdroja je „RoofLITE“ (PW:95, PW:180) |
| Icopal | Ico Pal, IcoPal | karta katalog/izolacny-material.html:51 |
| Knauf Insulation | Knaufinsulation | karta katalog/izolacny-material.html:51 |
| Pezinské tehelne | Pezinské Tehelne, Pezinska | karta katalog/murovaci-material.html:51, leták „Tehla Pezinska“ akcie/pezinska-tehla-termobrik.html:52 |
| City Stone Design | „Dlažby - City Stone Design“ | karta katalog/dlazby.html:51 |
| Stavebné profily | Stavebné Profily | karta katalog/sadrokartonovy-zateplovaci-system.html:51 |
| KM Beta | Km Beta | karta katalog/stresne-kritiny.html:51 |
| DS Haco | Haco | karta katalog/stavebne-naradie-doplnky.html:51 |
| Transform Recykling | Recykling | karta katalog/podhlady-pvc.html:51 |
| Stadreko (komínový systém Qatro) | samotné „Qatro“ na karte, keď H1 podstránky je „Stadreko“ | karta katalog/kominove-systemy.html:51 |
| Quatro (splátky) | Qatro | v poriadku (build.py:208) |
| VÚB banka | VUB banka | sluzby.html:49 (build.py:940) |
| Magic Floor | Magicfloor, Magic floor | novinky/magic-floor (texty výrobcu, 6×) |
| Bianka | BIANKA | novinky/topstone (5×) |
| Ekostyrén | EKOSTYREN, ekostyren | novinky/ekostyren |
| Fakro, Tondach, Schiedel, Stadreko | FAKRO, TONDACH, STADREKO vo vete | texty zdroja |

Karty značiek dostávajú H3 z `obsah.py` (`name.title()` pre verzálky, riadok 120), preto vzniká „Stavebné Profily“ alebo „Pezinské Tehelne“. Opravu treba robiť tabuľkou presných názvov, nie pravidlom.

## 8. Zakázané frázy a obraty

| Nepoužívať | Prečo / čím nahradiť |
|---|---|
| super ceny, SUPER CENY (100× na 19 stránkach) | hovorové. Použite „akciová cena“ alebo uveďte cenu |
| najlacnejší, najlepší, najväčší, bezkonkurenčný (ako naše tvrdenie) | neoveriteľné (FAKTY.md I-06). Uveďte číslo |
| presne tam, kde potrebuješ | „na miesto, ktoré určíte“ (zdroj) |
| hneď, ihneď, okamžite | len pri komíne Stadreko („odber možný ihneď“, zdroj) |
| zložíme / vyložíme (bez podmienky) | vykládka sa niekde platí (PDF s.1, s.2) |
| pokúsim sa, spravím | firma hovorí „my“ |
| za účelom, v rámci, ohľadom, danej | „aby“, „po celom Slovensku“, „o“, „tejto“ |
| neváhajte nás kontaktovať, sme tu pre vás, komplexné riešenia, profesionálny prístup, široká škála, jedinečný, kvalitný (bez dôkazu) | prázdne frázy |
| Rozdávame zľavy (eyebrow úvodu) | hovorové. Použite „Zákaznícka karta“ |
| „Leták akcie, klikni pre zväčšenie“ | „Leták akcie. Kliknutím zväčšíte.“ |
| výkričníky, VERZÁLKY, „...“, emotikony | — |
| AI, umelá inteligencia | v texte webu nie. Výnimkou je povinné označenie asistenta (§9) |
| Vy, Vám, Váš s veľkým V | malými |
| „na jednom mieste“ | najviac 1× na celom webe (dnes katalóg, úvod, náradie) |

## 9. Asistent na webe (výslovná žiadosť majiteľa)

- **Povinné označenie, rovnako ako na Barbershope** (`origin/barbershop-oprava:barbershop-30/assets/asistent.js:31`: odznak „AI“, meno „Barber, AI asistent“, podtitul, odkaz na `ochrana-udajov.html`). Pre Richtárika: odznak „AI“, titulok okna **„AI asistent Stavebnín Richtárik“**, podtitul „Odpovede sú automatické. Cenu a dostupnosť potvrdí predajňa.“ a odkaz „Ochrana údajov“. Mimo tohto označenia sa slovo AI na webe nepoužíva.
- **Tón:** vyká, vecne, najviac 3 vety a potom ponúkne telefón. Odpovedá len z FAKTY.md. Pri cene uvedie zdroj („podľa cenníka akcií z 28. 1. 2026“). Keď odpoveď nevie, povie to a odkáže na 0905 622 223 alebo info@stavebninyrichtarik.sk.
- **Pozdrav:** „Dobrý deň, som AI asistent Stavebnín Richtárik. Odpoviem na otázky o sortimente, akciách, doprave, otváracích hodinách a kontakte. Cenu na konkrétne množstvo vám pripraví predajňa zadarmo.“
- **Nesmie:** sľúbiť termín dodania, zľavu nad FAKTY.md C, dostupnosť konkrétneho kusa, vykládku zdarma ani technickú záruku. Nežiada osobné údaje.
- **Ukážkový režim** (náhľad bez servera): podtitul „Ukážka – odpovede sú pripravené vopred z častých otázok.“

## 10. Alt texty a popisky

- Alt opisuje fotku: „Palety tehál TermoBRIK na dvore Stavebnín Richtárik v Nitre“. Nie „Predajňa a sklad, fotografia 7“ (galeria/index.html:50, 28×).
- Logá značiek v páse na úvode majú dnes `alt=""` (index.html:77). Pás je jediné miesto, kde sú značky spolu, a čítačka ani vyhľadávač ich nevidia. Dajte im alt s názvom značky alebo pridajte skrytý zoznam.
- Dekoratívne fotky kategórií (img/hd z Pexels) majú `alt=""`. Netvrďte o nich, že sú z nášho dvora.

## 11. SEO pravidlá textov

- **title:** „{H1 alebo kľúčové slovo} | Stavebniny Richtárik Nitra“. Úvod má „Stavebniny Richtárik Nitra – stavebný materiál a doprava“.
- **meta description** sa nesmie skladať automaticky zo zoznamu značiek a prvej vety zdroja. Dnes z toho vzniká „…Knpv 3/19/400.“, „…Diament plus. diament plus bok mat.“, „…na Slovensku. 1.“, „…ASFALTOVÁ VLNITÁ KRYTINA.“. Vzory:
  - kategória: „{Kategória} v Nitre: {lede bez výzvy}. Výpočet spotreby a cenová ponuka zadarmo, doprava po celom Slovensku.“
  - značka: „{Značka} v Stavebninách Richtárik Nitra: {popisok z popisy.py}. Poradíme, spočítame spotrebu a dovezieme na stavbu.“
  - akcia: „Akcia {výrobok}: {popis}. So zákazníckou kartou ďalšia zľava 5 % v hotovosti alebo 3,3 % kartou. Nitra – Horné Krškany.“
  - novinka: bez „Novinka v ponuke Stavebniny Richtárik Nitra.“ na začiatku každej.
- Text odkazu hovorí, kam vedie („Murovací materiál“), nie „tu“ ani „viac“. „Viac o nás“ vyhovuje.
- URL adresy (komin-qatro, nobasil, sakret, dlazby-in-vest, topstone…) sa nemenia, aby nevznikli mŕtve odkazy. Opravujú sa len viditeľné nadpisy.

---

## 12. Ukážkové prepisy 10 kľúčových blokov (pred / po)

Všetky „po“ používajú len fakty z FAKTY.md, v zátvorke je zdroj.

### P1. Úvod – hero (index.html:53–59)

**Pred**
> Stavebniny Richtárik, Nitra. Od roku 1997
> **Všetko na stavbu. Dovezieme.**
> Rodinné stavebniny v Nitre od roku 1997. Materiál dovezieme po celom Slovensku vlastnými autami, aj Ivecom s mechanickou rukou.
> [Zavolať 0905 622 223] [Prezrieť katalóg] [Aktuálne akcie]
> titulky: 01 Vlastné autá s mechanickou rukou · 02 Doprava po celom Slovensku · 03 Dvor plný materiálu

**Po** (filmový úvod len zo skutočných fotiek; titulky postupne nad zábermi)
> titulky nad zábermi:
> 1 (pas-dvor) „Nitra – Horné Krškany. Od roku 1997.“
> 2 (zasoba-tehly) „Tehly TermoBRIK.“
> 3 (zasoba-porfix) „Pórobetón Porfix.“
> 4 (zasoba-stadreko) „Dlažby a obrubníky Stadreko.“
> 5 (zasoba-rezivo) „Stavebné rezivo.“
> 6 (dvor-predajna), konečný stav, statický aj bez JS:
> eyebrow: Stavebniny Richtárik · Nitra – Horné Krškany · od roku 1997
> **Dvor plný materiálu. Od základov po strechu.**
> Rodinné stavebniny v Nitre. Spotrebu spočítame a cenovú ponuku pripravíme zadarmo, materiál dovezieme vlastnými autami s mechanickou rukou po celom Slovensku.
> [Zavolať 0905 622 223] [Vyžiadať cenovú ponuku] · odkaz: Aktuálne akcie

Prečo: háčik je to, čo sa dá overiť očami, teda skutočné palety na dvore. Značka auta vypadla kvôli otázke ❓ H-2. H1 nesie obraz, kľúčové slová („stavebniny, Nitra, stavebný materiál, doprava“) sú v eyebrow, lede a titulku. Fakty: PW:9, PW:27–31, FAKTY F (fotky).
Varianty H1 pre majiteľa: B „Materiál na celú stavbu. Na dvore v Nitre.“, C „Tehly. Pórobetón. Dlažby. Rezivo. Všetko na jednom dvore.“

### P2. Pás „V skratke“ (index.html:71–75)

**Pred**
> 1997 – rodinná firma v stavebninách od roku 1997 · 5 % – zľava z akciových cien pri platbe v hotovosti (zákaznícka karta) · 3,3 % – zľava z akciových cien pri platbe platobnou kartou (zákaznícka karta) · 15 – kategórií materiálu a akcie na vybrané výrobky

**Po**
> **1997** rodinná firma v Nitre · **5 %** ďalšia zľava z akciových cien pri platbe v hotovosti so zákazníckou kartou · **3,3 %** ďalšia zľava z akciových cien pri platbe kartou · **40+** značiek v 15 kategóriách

Prečo: „1997 … od roku 1997“ sa opakuje a „15 kategórií a akcie“ spája dve rôzne veci. Zmysel zľavy sa nemení ❓ H-3. Fakty: PW:6, PW:2720, FAKTY F.

### P3. „Dvor plný materiálu“ (index.html:68–69)

**Pred**
> Plná zásoba · **Dvor plný materiálu** · Tehly TermoBRIK, pórobetón Porfix, betónové prvky Stadreko a stavebné rezivo. Fotky sú z nášho dvora v Nitre. [Celý katalóg]

**Po**
> Skutočné fotografie · **Dvor plný materiálu** · Tehly TermoBRIK, pórobetón Porfix, betónové prvky Stadreko a stavebné rezivo. Fotografie sú z nášho dvora v Horných Krškanoch. [Prezrieť katalóg]

Prečo: eyebrow „Skutočné fotografie“ je pravdivý dôkaz a nesľubuje zásobu. „Plná zásoba“ by bolo tvrdenie o celom sortimente. Ak úvod (P1) použije H1 „Dvor plný materiálu“, táto sekcia dostane H2 „Na našom dvore v Nitre“, aby sa nadpis neopakoval.

### P4. Katalóg na úvode a na Katalógu (index.html:79, katalog/index.html:46)

**Pred**
> **Všetko na stavbu od základov po strechu** · 15 kategórií a viac ako 40 značiek na jednom mieste. Vyber, čo staviaš, a my spočítame, koľko toho potrebuješ.

**Po**
> **Stavebný materiál od základov po strechu** · 15 kategórií a viac ako 40 značiek popredných slovenských aj svetových výrobcov. Vyberte kategóriu a spotrebu vám spočítame zadarmo.

Prečo: vyká, nesie kľúčové slovo „stavebný materiál“ a obsahuje doložené „popredných slovenských aj svetových výrobcov“ (PW:9) a „bezplatný výpočet spotreby“ (PW:28).

### P5. Pás Sklad a doprava (index.html:84, build.py:1076)

**Pred**
> Sklad a doprava · **Materiál zložíme presne tam, kde ho na stavbe potrebuješ** · Vlastné autá s mechanickou rukou, doprava po celom Slovensku, tovar bez zbytočného prekladania. [Ako to funguje] [Zavolať 0905 622 223]

**Po**
> Doprava · **Dovezieme na miesto, ktoré určíte** · Vlastné autá s mechanickou rukou, po celom Slovensku. Tovar ide priamo na stavbu, bez zbytočného prekladania, a preto je menšie riziko poškodenia. [Doprava a služby] [Zavolať 0905 622 223]

Prečo: „presne tam“ a „zložíme“ zdroj nemá (FAKTY I-04, I-12). Veta o prekladaní je doslova zo Služieb (PW:2736). „Ako to funguje“ neprezrádza, kam odkaz vedie.

### P6. Zľava a zákaznícka karta (index.html:91–93)

**Pred**
> Rozdávame zľavy · **Z akciových cien dostaneš ešte ďalšiu zľavu** · Stačí spôsob platby. Stavebné firmy, živnostníci a predajne stavebnín majú navyše špeciálne dohodnuté ceny. · 5 % pri platbe v hotovosti · 3,3 % pri platbe platobnou kartou · Zákaznícka karta: Príď si k nám pre svoju zákaznícku kartu a získaš všetky zľavy, ktoré sme pre teba pripravili.

**Po**
> Zákaznícka karta · **Ďalšia zľava aj z akciových cien** · So zákazníckou kartou získate z akciových cien ďalšiu zľavu: 5 % pri platbe v hotovosti, 3,3 % pri platbe kartou. Stavebným firmám, živnostníkom a predajniam stavebnín poskytujeme špeciálne zľavy. · Zákaznícka karta: Pre kartu si príďte do našej predajne na Novozámockej ulici v Nitre.

Prečo: „Stačí spôsob platby“ zamlčuje, že zľava je viazaná na kartu (PDF s.1). „Špeciálne dohodnuté ceny“ sú v zdroji „špeciálne zľavy“ (PW:7). Čísla a ich zmysel ostávajú ❓ H-3.

### P7. Služby (sluzby.html:49 a index.html:96–105)

**Pred** (sluzby.html)
> Snažíme sa všetkým zákazníkom vyjsť v ústrety a zabezpečiť Vašu úplnú spokojnosť. Aj vďaka tomu neustále rozširujeme a skvalitňujeme všetky ponúkané služby: … **Platba cez terminál VUB banka** – Úplnou samozrejmosťou je aj platba (cez terminál) platobnými kartami.
> (úvod) **Poradíme, spočítame, dovezieme** – Nemusíš nič voziť ani prekladať. Poradíme, spočítame, dovezieme a zložíme presne tam, kde materiál potrebuješ.

**Po**
> **Poradíme, spočítame, dovezieme** · Od výberu materiálu po dopravu na stavbu. Poradíme vám s výberom, spotrebu spočítame a cenovú ponuku pripravíme zadarmo.
> **Platba kartou a na splátky** – V predajni môžete platiť kartou cez terminál VÚB banky. Stavebný materiál si môžete kúpiť aj na splátky cez Quatro.

Prečo: úvodná veta zdroja je klišé a nič nehovorí. Opravuje sa „Vašu“ na „vašu“ a „VUB“ na „VÚB“. Fakty: PW:27–32, PW:9, PW:2735.

### P8. O nás (index.html:115, o-nas.html:50)

**Pred**
> (o-nas) Spoločnosť Stavebniny Richtárik je rodinná firma založená v roku 1997 za účelom rozšírenia doteraz ponúkaných služieb v stavebníctve. … Najdôležitejšia je pre nás VAŠA SPOKOJNOSŤ.
> (úvod) **Rodinná firma, ktorá stavbám rozumie** … Najdôležitejšia je pre nás tvoja spokojnosť.

**Po**
> **Rodinná firma od roku 1997** · Stavebniny Richtárik založil Ing. Mário Richtárik v roku 1997, aby rozšíril služby, ktoré dovtedy v stavebníctve ponúkal. Predávame a sprostredkúvame stavebný materiál. Majiteľ aj personál majú dlhoročné skúsenosti v stavebníctve a personál sa priebežne školí, pretože trh so stavebným materiálom sa stále mení. Poradenstvo a cenové ponuky sú u nás zadarmo. Najdôležitejšia je pre nás vaša spokojnosť.

Prečo: „za účelom“ je kalk. Verzálky a tykanie sú preč a zmysel ostáva (PW:2720–2722). Na úvode stačia prvá a posledné dve vety.

### P9. Akcie – karty a spoločná výzva (akcie/index.html:50, build.py:110–111, 793, 800)

**Pred**
> Super ceny · **Pezinská tehla TermoBRIK** · Brúsená tehla, Dry systém TermoBRIK. S pojivom, zdarma lepidlo. Na tehlu vám spravím individuálnu cenovú ponuku konkrétne na váš dom, pokúsim sa spraviť najlepšiu cenu.
> Na sklade · **Komín Stadreko** · Najlacnejší komínový systém na Slovensku. Máme priamo na sklade, odber možný ihneď.
> Leták akcie, klikni pre zväčšenie · Chceš akciovú cenu na konkrétne množstvo? Zavolaj alebo napíš, cenovú ponuku spravíme zadarmo.

**Po**
> Akciová cena · **Pezinská tehla TermoBRIK** · Brúsené tehly TermoBRIK, systém Dry, lepidlo zdarma. Na váš dom pripravíme individuálnu cenovú ponuku a pokúsime sa o čo najlepšiu cenu. Doprava až na stavbu zdarma, vykládka za poplatok.
> Na sklade · **Komín Stadreko** · Certifikovaný komínový systém priamo na sklade, odber ihneď. Napríklad kompletný komín 6 m, ø 160/90 za 618 € s DPH.
> Leták akcie. Kliknutím zväčšíte. · Potrebujete akciovú cenu na konkrétne množstvo? Zavolajte alebo napíšte, cenovú ponuku pripravíme zadarmo.

Prečo: TermoBRIK je v 1. osobe množného čísla a pridáva doložený údaj o doprave (PDF s.1). Pri komíne nahrádza superlatív konkrétna cena z cenníka (PDF s.1). O superlatíve rozhodne majiteľ (FAKTY I-06).

### P10. Výzva pred pätou a Kontakt (všetky stránky build.py:634; kontakt.html:46, 51)

**Pred**
> Cenová ponuka zadarmo · **Pošli nám zoznam materiálu alebo projekt** · Spočítame spotrebu, pripravíme ponuku a dohodneme dopravu na stavbu. [Poslať dopyt e-mailom] [Zavolať 0905 622 223]
> (kontakt) **Príď k nám do Horných Krškán** · Pozývame vás do našej predajne v Nitre-Horných Krškanoch na Novozámockej ulici č. 68… · Zavolaj alebo napíš

**Po**
> Cenová ponuka zadarmo · **Pošlite nám projekt alebo zoznam materiálu** · Spočítame spotrebu, pripravíme cenovú ponuku zadarmo a dohodneme dopravu na stavbu. [Poslať dopyt e-mailom] [Zavolať 0905 622 223]
> (kontakt) **Predajňa a sklad v Nitre – Horných Krškanoch** · Pozývame vás do predajne na Novozámockej ulici 62/68. Radi vám pomôžeme s výberom materiálu. · Telefón a e-mail

Prečo: blok je na 75 stránkach, takže prepis jedného riadku v build.py:634 odstráni 76 tykaní. H1 kontaktu nesie miesto a kľúčové slovo („Nitra, Horné Krškany, predajňa, sklad“).

### Drobný text (mikrocopy)

| Miesto | Pred | Po |
|---|---|---|
| hľadanie, úvod (index.html:65) | Čo hľadáš? Cement, Ytong, škridla, Fakro, polystyrén… | Hľadajte: cement, Ytong, škridla, Fakro, polystyrén |
| hľadanie, katalóg a 404 (build.py:727, 994) | Hľadaj: cement, … | Hľadajte: cement, … (jeden tvar na celom webe) |
| bez výsledku (assets/site.js:931) | Nič sme nenašli. Zavolaj 0905 622 223, poradíme. | Nič sme nenašli. Zavolajte 0905 622 223, poradíme vám. |
| katalóg (build.py:730) | Nenašiel si, čo hľadáš? Zavolaj, poradíme. | Nenašli ste, čo hľadáte? Zavolajte, poradíme vám. |
| kategória (build.py:760) | Chceš cenu na konkrétne množstvo? Zavolaj alebo napíš, cenovú ponuku spravíme zadarmo. | Potrebujete cenu na konkrétne množstvo? Zavolajte alebo napíšte, cenovú ponuku pripravíme zadarmo. |
| 404 (build.py:993) | Adresa, ktorú hľadáš, na webe nie je. Vyber, kam pokračovať, alebo hľadaj v katalógu. | Táto stránka na webe nie je. Pokračujte do katalógu, na akcie alebo nám zavolajte. |
| pás značiek (index.html:77) | Značky, ktoré máme na sklade alebo objednáme | Značky v našej ponuke |
| novinky (index.html:110) | Čo sme pridali do ponuky · Materiály, ktoré u nás nájdeš nové. | Novinky v sortimente · Materiály, ktoré sme nedávno zaradili do ponuky. |
| kontakt (index.html:118) | Zavolaj, poradíme hneď | Zavolajte, poradíme vám |
| štítky akcií (build.py:110–126) | Super ceny | Akciová cena |
| odkaz letáku (akcie/*.html:52) | Akcia - Tehla Pezinska TermoBRIK, Akcia-komín Stadreko, Akcia - Lepidlá, omietky Univerbau. | Leták akcie: Pezinská tehla TermoBRIK (PDF) a pod. |
| H1 novinky (novinky/topstone…:46) | Stone | Kamenný koberec Bianka |
| H1 značky (katalog/kominove-systemy/qatro.html) | Stadreko | Komíny Stadreko (systém Qatro) |
| H1 (katalog/murovaci-material/pezinske-tehelne/stropny-system.html) | Stropný systém + preklady | Stropný systém a preklady |
