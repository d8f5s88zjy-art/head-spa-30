# Dizajnový brief webu VISIONARY LIVING

Záväzný brief, podľa ktorého je web postavený (generátor `source/zostav.py`, štýl `assets/style.css`, správanie
`assets/site.js`). Vznikol porovnaním troch nezávislých návrhov (A „Deň v Černíku“, B „Projektová dokumentácia,
ktorá ožíva“, C „Cesta ku kľúčom“) tromi hodnotiteľmi (kupujúci, dizajnér, inžinier) a syntézou víťazného smeru B
s najlepšími prvkami A a C. Kde sa stavba od briefu odchýlila, je to uvedené v README (časť Odchýlky od briefu).

---

# VISIONARY LIVING, Černík – záväzný dizajnový brief

Syntéza poroty (súčty: B 142, A 129, C 123; B vyhral u všetkých troch porotcov). Základ je návrh B
„Projektová dokumentácia, ktorá ožíva“. Z A je prevzatá zeleň, svetlo v oknách zvoleného bytu, disciplína
slučky skrolu a predvolene zvolený byt; z C telefón v lište aj na mobile, dvojica výziev, cesta so skrolom
odvíjanou čiarou (Financovanie, „Čo nasleduje“ na detaile) a „Mám záujem o byt X“. Všetko, čo porota označila
za chybu, je buď odstránené, alebo nižšie výslovne opravené. Jediný zdroj faktov je `source/obsah.json`
a `docs/ZDROJE.md`; nič sa nedomýšľa, texty vykajú.

## 1. Myšlienka a ten jeden zapamätateľný prvok

Web je projektová dokumentácia, ktorá ožíva: svetlý plotrový papier s jemnou mriežkou, tušové linky, kóty
a rohová pečiatka s údajmi projektu – každá stránka je ďalší list dokumentácie (titulný list, technická
správa, pohľad, pôdorys, splátkový plán), nie šablóna s kartami a ikonami. Ten jeden zapamätateľný prvok je
**nakreslený pohľad na fasádu, na ktorom si návštevník vyberá byt**: fasáda sa pri príchode nakreslí podlažie
po podlaží, v byte pod kurzorom sa rozsvietia okná, zvolený byt dostane okrovú výplň prevzatú z klientových
pôdorysov a vedľa sa stena za stenou nakreslí jeho schematický pôdorys s očíslovanou legendou miestností.
Okolo tohto prvku je všetko tiché a presné; teplo dodáva zeleň lesa (tlačidlá, odkazy, stav „voľný“) a väčší
priestor pre fotografie prírody (lúka s deťmi, dron nad obcou), aby web presvedčil rodinu, nie len investora.

## 2. Tokeny

### Farby

| Meno | Hex | Použitie | Kontrast |
| --- | --- | --- | --- |
| Papier | `#F5F6F3` | pozadie celého webu; mriežka 48 px linkami `rgba(28,35,40,.06)` (na mobile 32 px, `.04`); sekcie s fotkami bez mriežky | – |
| Tuš | `#1C2328` | bežný text, nadpisy, všetky kreslené linky, rámy výkresov, lišta, sekundárne (obrysové) tlačidlo | na Papieri 14,7:1; na Betóne 12,5:1 |
| Grafit | `#5A6168` | kóty, popisy podlaží, legenda, popisky obrázkov, menej dôležitý text (min. 13 px) | na Papieri 5,8:1; na Betóne 4,95:1 (porota: pôvodný `#7C858C` mal 3,5:1 – nepoužiť) |
| Okr | `#B9891F` | **len výplne a linky, nikdy text**: výplň zvoleného bytu (opacity .34), podlažie pod kurzorom (.16), svetlo v oknách, podčiarknutie aktívnej položky menu (2 px), fokusový rám (2 px + 2 px odsadenie) | ako text 2,9:1 – zakázané |
| Okr tmavý | `#7F5C12` | okrový text, kde je nevyhnutný: „2. podlažie“ pri zvolenom byte, číslo kroku na ceste, popis aktívneho filtra | na Papieri 5,6:1; na Betóne 4,8:1 |
| Les | `#2C4A33` | primárne tlačidlá (biely text), odkazy v texte, aktívny filter, stav „voľný“ (bodka + text), čiara cesty na Financovaní, loggia v schéme pôdorysu | na Papieri 9,1:1; biely text na Lese 9,8:1 |
| Mach | `#7E9A63` | **len výplne**: tráva a terén pod fasádou, výplň loggie v schéme (opacity .35), uzol cesty, keď ho čiara dosiahne | ako text 2,9:1 – zakázané |
| Betón | `#E3E5E0` | šrafovanie strechy a terénu, výplne miestností v schéme pod linkami, pozadie tabuliek (každý druhý riadok), vypnuté tlačidlo | – |
| Okrová výplň | `#EFE3C4` | podkres zvoleného riadku v tabuľke bytov, zvýraznená bunka v pečiatke (nepovinné) | Tuš na nej 12,5:1 |

Pravidlo: text pod 18 px (resp. pod 14 px tučný) má vždy kontrast ≥ 4,5:1, preto okrový a machový text
neexistuje; stav „voľný“ je Les, nie Lúka (`#4F7D4C` mala na Papieri 4,4:1). Stav „rezervovaný“/„predaný“
(ak sa objaví v obsah.json) je Grafit so sivou bodkou.

### Písma (Google Fonts, Latin Extended – overené mäkčene Č, š, ž, ľ, ť, ň, ď, ô, ä)

| Rodina | Rezy | Rola |
| --- | --- | --- |
| Bricolage Grotesque | 500, 700; os `wdth` len **87,5 až 100**, `opsz` 12..96 | nadpisy H1 až H3, označenia bytov (A1…L3), ceny, plochy, veľké čísla v pečiatke, kóty a popisy výkresov (vo `wdth` 87,5, nikdy užšie – porota videla rozpad slova „Vráb le“ v zúženom reze) |
| Instrument Sans | 400, 500, 600 (bez kurzívy) | text, odseky, menu, tlačidlá, tabuľky, formuláre, pätka |

Načítanie: `<link rel="preconnect">` na `fonts.googleapis.com` a `fonts.gstatic.com`, jedno CSS s obmedzenými
osami (`Bricolage+Grotesque:opsz,wdth,wght@12..96,87.5..100,500..700` + `Instrument+Sans:wght@400..600`),
`display=swap`. Zobrazenie obsahu sa **nikdy** neviaže na `document.fonts.ready`. Odporúčanie pre nasadenie
(nie podmienka): rezy stiahnuť, orezať na latin + latin-ext a vložiť cez `@font-face` s preloadom dvoch rezov
prvej obrazovky (Bricolage 700, Instrument 400).

Veľkostná stupnica (`clamp`, mobil → počítač):

| Token | Veľkosť | Riadkovanie | Použitie |
| --- | --- | --- | --- |
| `--t-h1` | 40 → 72 px, Bricolage 700, `wdth` 92, letter-spacing −0,02 em | 1,0 | H1 titulného listu |
| `--t-h2` | 32 → 48 px, Bricolage 700 | 1,05 | nadpisy listov (Byty, Lokalita, Splátkový plán) |
| `--t-h3` | 22 → 28 px, Bricolage 600/700 | 1,15 | „Byt E2“, nadpisy krokov, pilierov |
| `--t-num` | 28 → 36 px, Bricolage 700, tabuľkové číslice `font-variant-numeric: tabular-nums` | 1,0 | ceny, plochy, sumy |
| `--t-lead` | 18 → 20 px, Instrument 400 | 1,5 | podtitul, úvodné odseky |
| `--t-body` | 17 px, Instrument 400 | 1,6 | text; riadok max. 62 znakov (`max-width: 36rem`) |
| `--t-small` | 14 → 15 px, Instrument 500 | 1,4 | tabuľky, popisky obrázkov, pätka |
| `--t-kota` | 13 → 14 px, Bricolage 500 `wdth` 87,5, Grafit | 1,2 | kóty, popisy podlaží, legenda plôch (nikdy pod 13 px) |

### Medzery, zaoblenia, tiene, šírka

- Medzery: stupnica 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 px (`--s-1` … `--s-10`). Zvislý rytmus sekcií
  96 px na počítači, 64 px na mobile. Bočný okraj 16 px od 320 px, 24 px od 640 px, 40 px od 1024 px.
- Šírka obsahu: rám výkresu max. 1360 px (vnútorný obsah 1280 px); text v odsekoch max. 36 rem; dvojstĺpec
  od 900 px, trojstĺpec pilierov od 720 px.
- Zaoblenia: **0** na rámoch, tabuľkách, tlačidlách a výkresoch (výkresová reč; odôvodnené témou, nie default).
  Jediná výnimka: bodka stavu (kruh 8 px) a uzly cesty (kruh 14 px).
- Linky: tuš 1,5 px na rámoch a lište, 1 px na tabuľkách a kótach, 1 px čiarkovaná `4 4` na obryse druhej bytovky
  a na loggii v schéme. Rohové značky (10 × 10 px, 1,5 px) okolo fotografií.
- Tiene: žiadne na kartách ani tlačidlách. Jediný tieň je na otvorenom dialógu lupy a na mobilnom menu:
  `0 12px 32px rgba(28,35,40,.18)`, statický, nikdy animovaný.
- Fokus: `outline: 2px solid var(--okr); outline-offset: 2px` všade, viditeľný aj v tmavom paneli.

## 3. Rozloženie stránok

Spoločné prvky na každej stránke:

- **Lišta** (`position: sticky`, výška 64 px, pozadie Papier `rgba(245,246,243,.98)` bez `backdrop-filter`,
  spodná tušová linka 1,5 px): vľavo textová značka „VISIONARY LIVING“ (Bricolage 600, kapitálky s rozpalom
  0,08 em) s dvoma rohovými značkami v SVG (podľa loga 2025_03_vl.png; PNG logo sa v lište nepoužije, lebo má
  veľa prázdneho miesta a 58 kB), v strede menu Úvod, O projekte, Byty, Financovanie, Galéria, Kontakt (aktívna
  položka má okrové podčiarknutie 2 px), vpravo telefón **0908 545 096** ako obrysové tlačidlo (`tel:+421908545096`).
  Na mobile (do 900 px): značka vľavo, vpravo tlačidlo „Zavolať“ (obrys, min. 44 × 44 px, href tel:) a tlačidlo
  „Menu“ (aria-expanded), menu sa vysunie pod lištou ako zoznam s telefónom a e-mailom na konci. Telefón je na mobile
  vždy viditeľný (chyba B opravená).
- **Pätka**: štyri stĺpce (na mobile dva): značka a slogan „Bývanie s víziou“; kontakt (0908 545 096,
  info@visionaryliving.sk); Facebook a Instagram (textové odkazy na facebook.com/visionaryliving.sk a
  instagram.com/visionary.living); prevádzkovateľ Outlet, s.r.o., odkazy Zásady ochrany osobných údajov
  (aktualizácia 31. marec 2025) a Cookies. Pod tým jeden riadok Grafit: „Ceny a dostupnosť bytov podľa stavu
  ponuky k 13. 10. 2026.“ Horná tušová linka.
- **Rám listu**: hlavný obsah každej stránky stojí v ráme 1,5 px s názvom listu v ľavom hornom rohu
  (napr. „List 3 – Pohľad“ v `--t-kota`); číslovanie listov je odôvodnené, lebo dokumentácia je postupnosť.

### Úvod (`index.html`) – „Titulný list“

1. **Titulný list**: dvojstĺpec (od 900 px) zarovnaný na vrch. Vľavo H1 „Moderné bývanie uprostred prírody –
   Černík“ (štyri riadky, žiadne slovo v inej farbe ani kurzíve), podtitul „Dvojizbové a trojizbové byty v obci
   Černík – ideálne pre rodiny aj investorov.“, dve výzvy vedľa seba: **Vybrať byt** (plné, Les, biely text,
   odkaz na `byty.html`) a **Zavolať 0908 545 096** (obrys Tuš, `tel:`). Vpravo vizualizácia
   `2025_04_01-1024x576-3.jpg` v rohových značkách (`<picture>` AVIF/WebP/JPEG, stupne 480/768/1024,
   `width="1024" height="576"`, `fetchpriority="high"`, `<link rel="preload">` s rovnakým `srcset`/`sizes`;
   obrázok je **vždy viditeľný**, opacity sa neanimuje). Pod obrázkom kóta vzdialeností Černík → Šurany 11 km →
   Podhájska 17 km → Vráble 18 km → Nitra 23 km v mierke (0 až 23 km na celú šírku stĺpca); popisy v dvoch
   pevných úrovniach – horná: Černík, Šurany 11 km, Vráble 18 km; dolná: Podhájska 17 km, Nitra 23 km – so
   zvislými vlasovými linkami od značky k popisu, `wdth` 87,5, min. 13 px, žiadne prekrývanie (chyba B).
   Pod 640 px sa kóta prepne na zvislý zoznam štyroch riadkov s veľkými číslicami (Bricolage 700, 28 px)
   „11 km Šurany“, „17 km Podhájska“, „18 km Vráble“, „23 km Nitra“ s tenkou ľavou linkou.
2. **Rohová pečiatka** pod listom (tabuľka s linkami, 4 × 2 na počítači, 2 × 4 na mobile): Projekt – Visionary
   Living, Bývanie s víziou; Obec – Černík, okres Nové Zámky; Objekt – Dve dispozične rovnaké bytovky, 3 nadzemné
   podlažia; Byty – 12 bytov, dvojizbové a trojizbové; Dvojizbový byt – 114 900 €, 44,20 m²; Trojizbový byt –
   149 900 €, 68,67 m²; Zahájenie výstavby – Jar 2025; Ukončenie výstavby – Jar 2026. Čísla v Bricolage 700,
   popisy v `--t-kota`. (Toto je „pás čísel“ z C v reči výkresu, bez počítadla. Termín Jar 2026 ostáva podľa
   zdroja; poznámka pre klienta ide do HTML komentára a do `docs/ZDROJE.md`, nie na web.)
3. **List Pohľad (skrátený výber bytu)**: nadpis „Byty“ s okrovým podčiarknutím, veta „Vyberte si byt priamo na
   fasáde.“ + `projekt.charakteristika_bytov` skrátené na prvé dve vety, filter Všetky / Dvojizbové / Trojizbové
   s počtom, kreslená fasáda (celý komponent z časti 5) a panel zvoleného bytu; pod tým odkaz „Všetky byty
   a pôdorysy“ na `byty.html`. Vizualizácia 2025_04_vyberovnik s pásmi podlaží sa **nepoužíva** (porota: pásy
   polohované odhadom, orezaná, prekrývala obrys).
4. **List Situácia (lokalita s prírodou)**: vľavo dron `2025_04_dron-1-1024x576-2.jpg` v rohových značkách
   (lazy), vpravo `lokalita.uvod`, tri čísla obce ako kóty na jednej linke (315 ha lesov, 900+ ha
   poľnohospodárskej pôdy, 1 339 ha rozloha obce), pod nimi riadok vzdialeností textom (Šurany 11 km, Podhájska
   17 km, Vráble 18 km, Nitra 23 km) a odkaz „Viac o lokalite“ na `o-projekte.html#lokalita`. Pod tým na celú
   šírku rámu fotografia `2025_04_02-1024x576-2.jpg` (lúka s kvetmi a deti) s popisom „Zelená výsadba lúčnych
   kvetov a stromov v okolí“ (z `projekt.body`). Sekcia bez mriežky pozadia.
5. **Tri piliere** (`uvod.piliere`): tri stĺpce oddelené zvislými tušovými linkami, názov Bricolage 600 a text;
   bez ikon, bez kariet, bez číslovania (nie sú sekvencia). Nad nimi `uvod.preco_kratko` ako úvodná veta,
   `uvod.o_projekte_kratko` ako záver.
6. **Skrátená cesta** „Ako prebieha kúpa“: tri kroky na vodorovnej kóte – Vyberte si byt; Rezervačný poplatok
   5 000 €; 1. splátka 20 % – s textami skrátenými na jednu vetu z `financovanie.kroky`; číslovanie je na mieste
   (postupnosť). Odkaz „Celý splátkový plán“ na `financovanie.html`.
7. **Kontakt v skratke**: telefón a e-mail veľkým (Bricolage 700), tlačidlo „Napísať správu“ na `kontakt.html`.

### O projekte (`o-projekte.html`) – „Technická správa“

1. Hlavička: H1 `projekt.nadpis` „Moderné bývanie v obci Černík“, `projekt.popis`, tri body `projekt.body` ako
   odrážky s tušovou linkou (nie ikony).
2. Dvojstĺpec: vľavo `projekt.charakteristika_bytov` (celý text), vpravo **Charakteristika bytového domu** ako
   tabuľka s linkami (Stav, Typy bytov, Vybavenie, Parkovanie, Energie z `projekt.charakteristika_domu`).
3. Vizualizácia `2025_04_03-1024x576-2.jpg` na celú šírku rámu v rohových značkách.
4. **Výhody** (`projekt.vyhody`, 4): jeden rad štyroch stĺpcov (mobil 2 × 2), každý s malou kreslenou schémou
   z liniek (tepelné čerpadlo, okno, ihrisko, parkovacie miesto; SVG inline, 48 × 48, tuš 1,5 px), názov a text.
   Bez krúžkov, bez kariet.
5. **Harmonogram** ako dve kóty na jednej časovej osi: Jar 2025 – Zahájenie výstavby, Jar 2026 – Ukončenie
   výstavby (`projekt.harmonogram`).
6. **Lokalita** (`id="lokalita"`): H2 „Lokalita“, `lokalita.uvod`, `lokalita.popis`, `lokalita.priroda`,
   `lokalita.investicia`; kóta vzdialeností (rovnaký komponent ako na úvode); susedné obce ako jeden riadok
   textu „Susedné obce: Mojzesovo, Vinodol, Komjatice, Maňa, Kmeťovo, Michal nad Žitavou“ (čiarky, nie bodky);
   mriežka vizualizácií 02, 04, 05 (lazy) a dron s popismi.
7. **Prečo Černík** (`lokalita.preco`, 6): dvojstĺpcová legenda (názov tučne, text), oddelená vlasovými linkami.
8. Záver: odkazy „Vybrať byt“ a „Financovanie“.

### Byty (`byty.html`) – „Pohľad“

1. H1 „Byty“, `projekt.charakteristika_bytov` (prvé dve vety) a veta „Vyberte si byt priamo na fasáde alebo v
   zozname pod ňou.“
2. **Filter** Všetky / Dvojizbové / Trojizbové (prepínač s `role="radiogroup"`, každé tlačidlo `aria-checked`),
   vedľa počet „12 bytov“ / „6 bytov“ (`aria-live="polite"`), v tlačidlách typov druhý riadok s cenou a plochou
   (Dvojizbové – 114 900 €, 44,20 m²).
3. **Výberovník**: vľavo kreslená fasáda (časť 5), vpravo lepiaci panel zvoleného bytu (`position: sticky;
   top: 80px` od 1024 px). Pod fasádou legenda plôch ako kóta (44,20 / 68,67 / 68,67 / 44,20 m²) a popis
   „Dve dispozične rovnaké bytovky, 3 nadzemné podlažia, 4 byty na podlaží.“
4. **Zoznam 12 bytov** ako obyčajná HTML tabuľka (Byt, Podlažie, Typ, Plocha, Cena, Stav, odkaz Detail) zoradená
   A1 → L3, zapísaná priamo v HTML (generátor), funguje bez skriptu a číta ju vyhľadávač; filter ju stlmí
   rovnako ako fasádu (riadky opacity .35, nie `display:none`); zvolený byt má okrovú výplň riadku.
5. `projekt.standard_kratko` a odsek o parkovaní v cene; výzvy „Mám záujem“ (kontakt) a telefón.

### Detail bytu (`byty/a1.html` až `byty/l3.html`) – „Pôdorys“

Generované z `obsah.json` jednou šablónou (`source/zostav.py`).

1. Hlavička: drobný riadok „List – Pôdorys“ a navigácia späť „Byty“; H1 „Byt A1“ (Bricolage 700, 48 → 72 px),
   pod ním typ a podlažie („Dvojizbový byt, 1. podlažie“) a stav „voľný“ (Les, bodka). Vpravo cena **114 900 €**
   a plocha **44,20 m²** v `--t-num`.
2. **Pôdorys klienta** `2025_03_a1-scaled.jpg` na celú šírku rámu v rohových značkách: stupne 800/1200/1600 px
   AVIF/WebP (dnes 430 kB JPEG 2560 × 1440 – zmenšiť), `width/height`, `loading="lazy"`; klik otvorí natívny
   `<dialog>` s plnou verziou 2560 × 1440 (lupa), zatvorenie Esc a tlačidlom; prechod len opacity a scale .98 → 1.
   **Pred nasadením**: pôdorysy nesú cudzie logo a názov „POD VINOHRADMI“ – vyžiadať od klienta verziu bez neho
   alebo pravý horný roh orezať (`object-fit` s výrezom nie je riešenie, treba nový súbor).
3. Dvojstĺpec: vľavo schematický pôdorys (rovnaký SVG komponent ako v paneli, väčší, kreslí sa pri príchode),
   vpravo **tabuľka miestností** s číslami 1 až 5 (resp. 1 až 9), názvami a plochami, súčet „Spolu 44,20 m²
   vrátane loggie“.
4. **Štandard bytu** (`projekt.standard_kratko`) a riadok „Loggia a vlastné parkovacie miesto v cene“.
5. **Interiérové vizualizácie**: pás obrázkov s pevnými rozmermi (byt-a1 séria pre A1; pre ostatné byty 8a, 8,
   10, 11, 14, 17, 19, 31 – rovnaký vzorový interiér, popísaný ako „Vzorový interiér v prémiovom štandarde“,
   lebo web neuvádza, ktorá vizualizácia patrí ktorému bytu), lazy, klik otvára rovnaký dialóg ako galéria.
6. **Čo nasleduje**: skrátená cesta so štyrmi uzlami (Rezervačný poplatok 5 000 € → 1. splátka 20 % → 2. splátka
   → 3. splátka po kolaudácii) ako zvislá linka s uzlami, bez skrolom riadeného odvíjania (len nakreslenie pri
   príchode); odkaz na `financovanie.html`.
7. Výzvy: **Mám záujem o byt A1** (Les; odkaz `kontakt.html?byt=A1`, formulár predvyplní správu „Mám záujem
   o byt A1.“) a **Zavolať 0908 545 096**. Na mobile pevný spodný pruh s týmito dvoma tlačidlami (výška 56 px,
   `position: sticky; bottom: 0`, bez rozmazania).
8. **Susedné byty**: odkazy predošlý / ďalší (A1 ↔ B1 …) a mini fasáda (SVG, 12 buniek, statická) s rozsvieteným
   práve týmto bytom, každá bunka odkaz na svoj detail.

### Financovanie (`financovanie.html`) – „Splátkový plán“

1. H1 „Financovanie“, `financovanie.uvod` (sprostredkovanie hypotéky a poistenia).
2. **Cesta** (prevzaté z C, v reči výkresu): zvislá tušová linka vľavo (na počítači v ľavej tretine, vľavo od nej
   pripnutý stĺpec s „krokomerom“: číslo kroku Bricolage 700 48 px, názov kroku, „krok 2 zo 4“, `aria-live`
   vypnutý – krokomer je len vizuálny, čítačka číta kroky v poradí); štyri kroky z `financovanie.kroky`:
   1 Rezervačný poplatok – 5 000 €; 2 1. splátka kúpnej ceny – 20 %; 3 2. splátka kúpnej ceny; 4 3. splátka
   kúpnej ceny; každý s názvom, sumou (`--t-num`, Tuš) a plným textom. Čiara sa odvíja so skrolom (Les),
   uzol sa vyplní Machom, keď ho čiara dosiahne; aktuálny uzol má okrový prstenec (statický, bez pulzu).
   Na mobile krokomer nie je pripnutý (stĺpec je nad krokmi, statický), linka a uzly ostávajú.
3. Kontakt na finančných špecialistov: telefón, e-mail, tlačidlo „Napísať správu“.

### Galéria (`galeria.html`) – „Vizualizácie“

1. H1 „Galéria“, dve skupiny podľa `galeria`: **Exteriér** (01, 02, 03, 04, 05, dron; 16:9) a **Interiér**
   (16 záberov; 4:3 na šírku a 3:4 na výšku podľa originálov 1024 × 768 / 768 × 1024, 600 × 450, 600 × 800).
2. Mriežka s rohovými značkami a popisom (Grafit): stĺpce `repeat(auto-fill, minmax(280px, 1fr))`, záber na výšku
   zaberá dva riadky (`grid-row: span 2`) – mozaika bez rovnakých kariet; všetky obrázky `width/height`,
   `loading="lazy"` okrem prvých dvoch, `<picture>` AVIF/WebP.
3. Klik otvorí natívny `<dialog>` na celú obrazovku: obrázok `object-fit: contain`, popis, tlačidlá Predošlý /
   Ďalší / Zavrieť (min. 44 px), klávesy ← → Esc, fokus uväznený v dialógu, po zavretí sa vráti na pôvodný
   obrázok. Prechod opacity 320 ms a scale .98 → 1; výmena záberu len opacity 140 ms.

### Kontakt (`kontakt.html`) – „Kontakt“

1. H1 „Kontakt“, dvojstĺpec: vľavo telefón 0908 545 096 a e-mail info@visionaryliving.sk veľkým (Bricolage 700,
   odkazy `tel:`/`mailto:`), Facebook a Instagram ako textové odkazy, prevádzkovateľ Outlet, s.r.o.,
   lokalita „Černík, okres Nové Zámky, Nitriansky kraj“.
2. Vpravo **formulár** (`kontakt.formy_kontaktu`): Meno a priezvisko, Telefón, E-mail, Správa; štýl výkresovej
   tabuľky (polia s tušovou linkou dole, 1,5 px; fokus okrový rám), `label` viditeľné nad poľom, `autocomplete`,
   tlačidlo „Odoslať správu“ (Les). Parameter `?byt=A1` predvyplní Správu textom „Mám záujem o byt A1.“
   (skriptom; bez skriptu ostane prázdne). Chybové hlásenie vecné pod poľom („Zadajte e-mail v tvare
   meno@domena.sk“), Tuš, bez červenej krikľavosti; po odoslaní tlačidlo prepne text na „Správa odoslaná“
   (zmena textu a triedy, prechod len opacity). Odosielanie: `action` na formulárovú službu klienta /
   `mailto:` ako záloha – doplní klient, web nič nepredstiera.
3. Pod tým fotografia `2025_04_05-1024x576-2.jpg` (parkovisko, stromy) na celú šírku rámu, popis „Vlastné
   parkovacie miesto pri bytovom dome je v cene bytu“ (z `projekt.vyhody`).
4. Odkaz na Zásady ochrany osobných údajov (aktualizácia 31. marec 2025), zodpovedná osoba Ing. Jakub Dobšinský
   len na stránke ochrany údajov.

## 4. Pohybový systém

**Osobnosť**: technická a rozhodná – pero plotra (archetyp Corporate). Rovné dráhy, 0 % overshoot, žiadne
pohupovanie, žiadne nekonečné animácie. Linky sa „kreslia“ škálovaním (`scaleX`/`scaleY` z `transform-origin`
v začiatku linky), výplne a popisy sa objavujú opacity. Animujú sa **výhradne** `transform` a `opacity`.
Jedna orchestrovaná sekvencia na titulnom liste; inak sa hýbe len to, čo je výkres (fasáda, pôdorys, kóta, os
splátok) alebo čo odpovedá na akciu návštevníka.

**Podpisový easing**: `cubic-bezier(.2, 0, 0, 1)` pre 80 % pohybov (vstupy, kreslenie, zmeny stavu).
Odchody `cubic-bezier(.3, 0, 1, 1)`, kratšie a len opacity. Skrolom riadená čiara cesty: lineárne 1:1 bez easingu.

**Trvania** (CSS premenné):

| Token | Hodnota | Použitie |
| --- | --- | --- |
| `--d-fast` | 140 ms | hover, fokus, stlačenie tlačidla (`scale(.98)`), podčiarknutie v menu, svetlo v oknách, výmena obrázka v lupe |
| `--d-base` | 320 ms | rozsvietenie bytu a podlažia, filter, výplň miestnosti, otvorenie menu a dialógu, prepis panelu |
| `--d-slow` | 560 ms | kreslenie liniek, rámu, osi kóty, podlažia fasády, usadenie fotky (760 ms = `--d-slow` × 1,35 pre veľké plochy) |

Odstupy v kaskádach 60 až 90 ms, žiadna sekvencia nad 1,2 s. Pri `prefers-reduced-motion: reduce` sú všetky
trvania a oneskorenia 0,01 ms a konečné stavy okamžité (globálne pravidlo) **a navyše** po prvkoch: linky
nakreslené, čiara cesty vyplnená, panel bez prelínania, `scroll-behavior: auto`, `scrollIntoView` bez
`smooth`. `navigator.connection.saveData` dáva rovnakú pokojnú verziu.

**Úvodná sekvencia** (len `index.html`, čisté CSS `@keyframes … both`; východiskové stavy sú **iba pod triedou
`.js`**, ktorú pridá inline skript v `<head>` – bez skriptu je všetko hneď viditeľné; vizualizácia a navigácia
nikdy nezačínajú na opacity 0):

| Čas | Prvok | Pohyb |
| --- | --- | --- |
| 0 ms | rám listu – vodorovné linky | `scaleX` 0 → 1, 560 ms |
| 120 ms | rám listu – zvislé linky | `scaleY` 0 → 1, 560 ms |
| 140 / 210 / 280 / 350 ms | štyri riadky H1 | `translateY(24px)` → 0 + opacity, 420 ms každý |
| 420 ms | podtitul | opacity, 320 ms |
| 520 ms | výzvy Vybrať byt / Zavolať | opacity + `translateY(12px)` → 0, 320 ms |
| 0 ms | vizualizácia 01 | **viditeľná od začiatku**; len `scale(1.03)` → 1, 760 ms (LCP sa neodkladá) |
| 640 ms | rohové značky fotky | opacity, 320 ms |
| 640 ms | os kóty vzdialeností | `scaleX` 0 → 1 zľava, 700 ms |
| 760 / 860 / 960 / 1 060 ms | značky Šurany, Podhájska, Vráble, Nitra | `scaleY` 0 → 1 (značka) + opacity (popis), 240 ms, v poradí vzdialeností |
| 820 ms | rohová pečiatka | opacity + `translateY(8px)` → 0, 420 ms |

Celkom 1,2 s. Lišta sa neanimuje (je hneď na mieste).

**Pri skrole**:

- Žiadne plošné „fade-up“ sekcií. Text, tabuľky, piliere, fotografie a pätka sú vždy viditeľné.
- Kreslí sa len výkres, raz, pri príchode do okna (IntersectionObserver, prah 25 %, `rootMargin: 0 0 -10%`,
  po nakreslení `unobserve`): fasáda (terén a strecha → podlažia zdola nahor s odstupom 260 ms → v podlaží
  priečky a okná byt po byte po 90 ms → čiarkovaný obrys druhej bytovky; spolu ≤ 1,2 s), schematický pôdorys
  na detaile bytu, kóty na O projekte, harmonogram, os skrátenej cesty na úvode, uzly „Čo nasleduje“.
  Triedu `.draw` dáva skript; bez skriptu sú linky nakreslené (východiskový stav `scale(0)` je len pod `.js`).
- Jediný skrolom riadený prvok na webe: čiara cesty na `financovanie.html`. Jedna slučka `requestAnimationFrame`
  cez pasívny `scroll` listener: `scrollY` sa číta raz na začiatku snímky, rozmery trasy len v `measure()` po
  `resize` (oneskorenie 150 ms), `ResizeObserver` a `fonts.ready`; `--p` sa zapisuje **len na prvok čiary**
  (`transform: scaleY(var(--p))`) a len pri zmene > 0,002; uzol dostane triedu `is-on` pri prekročení svojej
  polohy; krokomer prepíše číslo a názov (zmena textu je zriedkavá – raz na krok). Žiadny `getBoundingClientRect`
  v snímke, žiadna premenná na `<html>`, `will-change` len na čiare.
- Lišta `sticky` bez rozmazania; panel zvoleného bytu `sticky` od 1024 px.
- Žiadny parallax, žiadna pevná celoobrazovková vrstva, žiadny `mix-blend-mode`, žiadny `backdrop-filter`.

**Hover a fokus** (hover len v `@media (hover: hover)`, fokus vždy):

- Tlačidlá: plné – `transform: translateY(-1px)` + opacity .92 (140 ms); stlačenie `scale(.98)`; obrysové –
  podkres Betón cez `::before` s opacity (nie `background`).
- Odkazy v menu: okrové podčiarknutie `scaleX` 0 → 1 (140 ms).
- Bunka bytu na fasáde: okrová výplň bunky opacity 0 → .16 a **svetlo v oknách** (okná a loggia bytu dostanú
  okrovú výplň opacity 0 → .55, 140 ms); popis podlažia vľavo prejde do Okru tmavého; kurzor pointer.
- Riadok tabuľky bytov: podkres Betón (opacity).
- Obrázky v galérii: rohové značky sa roztiahnu o 4 px (`translate`), 140 ms; žiadne zväčšovanie fotky.
- Polia formulára: tušová linka zhrubne (`scaleY` 1 → 1,5 na pseudo-prvku) a okrový fokusový rám.

**Čo sa NEANIMUJE**: `box-shadow`, `background`, `color`, `border`, `width`/`height`, `filter`; `textContent`
(žiadne počítadlá čísel); fotky v galérii (len rohové značky); lišta; text a tabuľky; pätka; nič nekonečne
(žiadny pulz uzla – nahradený statickým prstencom); nič pod `prefers-reduced-motion` a `saveData`.

## 5. Výberovník bytov

**Dáta**: jeden zdroj – `obsah.json` (`byty`, `typy`). Generátor zapíše fasádu, panel aj tabuľku **priamo do
HTML** (nie `innerHTML` skriptom – chyba B opravená), každý byt nesie `data-id`, `data-typ`, `data-podlazie`,
`data-stav`; skript do HTML len vkladá `aria-pressed`, `tabindex` a triedy. Predvolene je zvolený **A1**
(panel nikdy nie je prázdny).

**Geometria fasády** (pomer 1000 : 420 cez `aspect-ratio`, šírka 100 % stĺpca, max. 640 px): 3 podlažia ×
4 byty, poradie zľava podľa pôdorysov 2-izbový, 3-izbový, 3-izbový, 2-izbový (A/E/I, B/F/J, C/G/K, D/H/L), šírky
buniek úmerné plochám 44,20 / 68,67 / 68,67 / 44,20 m² (196 / 304 / 304 / 196 jednotiek), hrubšia zvislá linka
v strede (schodisko medzi 2. a 3. bytom), vchod v strede prízemia, šrafovaná strecha, sokel a pás terénu
(Mach, opacity .35), vľavo popisy „3. podlažie / 2. podlažie / 1. podlažie“ (Grafit, 13 px), za fasádou vpravo
posunutý čiarkovaný obrys druhej rovnakej bytovky (Grafit). Každá bunka: označenie bytu (Bricolage 700, 18 px,
Tuš) vľavo dole, 2-izbový má loggiu + okno, 3-izbový okno + loggia + okno (obdĺžniky 1 px Tuš). Pod fasádou
kóta plôch (4 úseky s popismi m²).

**Technika**: fasáda je **HTML mriežka**, nie SVG s hotspotmi – CSS grid s `grid-template-columns: 196fr 304fr
304fr 196fr` a tromi riadkami; každá bunka je skutočné `<button type="button" class="flat" data-id="E2"
aria-label="Byt E2, dvojizbový byt, 2. podlažie, voľný, 114 900 €" aria-pressed="false">` s natívnym fokusom
a klávesnicou (model B). Okná a loggie sú vnútorné `<span aria-hidden="true">`, linky sú `border`
a `::before`/`::after`; dekoračné SVG (strecha, terén, obrys druhej bytovky, kóta plôch) je absolútne
umiestnené pod mriežkou a má `aria-hidden="true"`.

**Stavy**:

| Stav | Vzhľad | Technika |
| --- | --- | --- |
| voľný (pokoj) | bunka Papier, linky Tuš, okná obrys | – |
| hover / fokus | výplň Okr opacity .16, okná a loggia Okr .55 („svetlo v oknách“), popis podlažia Okr tmavý, `outline` okrový pri fokuse | opacity 140 ms |
| vybraný (`is-on`, `aria-pressed="true"`) | výplň Okr .34, okná .75, označenie bytu Tuš 700, riadok v tabuľke Okrová výplň | opacity 320 ms; iba jeden byt naraz |
| mimo filtra (`is-off`) | opacity .18, `tabindex="-1"`, `aria-hidden="false"` (ostáva v strome, len mimo tabulátora), `pointer-events: none` | opacity 320 ms; žiadne `display:none`, nič neposkočí |
| rezervovaný / predaný (ak v dátach) | šrafovanie Betón, označenie Grafit, `aria-label` „…, rezervovaný“, v paneli sivý štítok, tlačidlo „Mám záujem“ skryté | statické |

**Počítač (od 1024 px)**: fasáda vľavo (max. 640 px), panel vpravo (`sticky`, `top: 80px`, šírka 360 až 400 px,
rám 1,5 px). Panel: „Byt E2“ (H3) ako odkaz na `byty/e2.html`, stav „voľný“ s bodkou Les, „Dvojizbový byt,
2. podlažie“, cena `--t-num` a plocha, schematický pôdorys (SVG 2-izbový: 5 miestností; 3-izbový: 9
miestností; linky Tuš, výplne Betón, loggia Mach .35 s čiarkovaným obrysom, čísla miestností Bricolage 500),
legenda miestností s plochami (číslo, názov, m²), tlačidlá **Detail bytu E2** (Les) a **Mám záujem** (obrys,
`kontakt.html?byt=E2`). Krátky stavový riadok `<p class="visually-hidden" aria-live="polite">` prečíta
„Byt E2, dvojizbový byt, 2. podlažie, 114 900 €, 44,20 m²“ – `aria-live` **nie** na celom paneli (chyba B).

**Výber** (klik, Enter, medzerník): predošlý byt stratí `is-on`, nový dostane; panel sa na 140 ms stlmí
(opacity .4), prepíše sa (text, odkazy, dáta z `data-*` a z JSON vloženého v `<script type="application/json">`),
vráti sa na opacity 1; schematický pôdorys sa nakreslí stena za stenou (linky `scaleX`/`scaleY` s odstupom
60 ms, výplne a čísla opacity, 2-izbový ≤ 700 ms, 3-izbový ≤ 1,1 s); riadky legendy nabehnú kaskádou po
30 ms. Pri rovnakom type bytu (napr. E2 → I3) sa pôdorys nekreslí znova, len sa vymení označenie – rovnaký
výkres sa neprekresľuje.

**Klávesnica**: Tab prechádza byty v poradí I3, J3, K3, L3, E2, …, D1 (ako čítanie fasády zhora); šípky ← →
po podlaží, ↑ ↓ medzi podlažiami (rovnaký stĺpec), Home/End prvý/posledný byt podlažia; Enter/medzerník vyberie.
Fokus okrový `outline` 2 px.

**Filter** (`role="radiogroup"`, Všetky / Dvojizbové / Trojizbové, `aria-checked`; vždy práve jeden aktívny,
takže „posledný typ sa nedá vypnúť“ je dané konštrukciou): nevyhovujúce byty a riadky tabuľky `is-off`, počet
„6 bytov“ sa prepíše a oznámi cez `aria-live`; ak bol zvolený byt mimo filtra, zvolí sa prvý vyhovujúci byt
od A1 (panel nikdy nie je prázdny – model A). Vyhovujúce označenia raz pulznú `scale(1) → 1,08 → 1`, 320 ms
(jednorazové, nie nekonečné). Filter je v URL ako `#dvojizbove` (stav sa dá zdieľať; bez skriptu neškodí).

**Telefón (do 1024 px, overené pri 320 / 375 / 390 / 430 px)**: filter ako vodorovný pás troch tlačidiel
(`overflow-x: auto`, `position: relative`, min. 44 px výška); fasáda na celú šírku, okná a loggie skryté,
označenia bytov v strede buniek (18 px), riadky podlaží min. 52 px (bunka 2-izbového ≈ 60 px na 320 px –
cieľ ≥ 44 px), popisy podlaží „3. / 2. / 1.“ v Grafite 13 px; obrys druhej bytovky skrytý (šetrí šírku), kóta plôch
pod fasádou ostáva. Žiadne hover stavy (`hover: none`), svetlo v oknách sa nezobrazuje (okná sú skryté), výber
= `is-on`. Panel je **staticky pod fasádou** (nie lepiaci, nie dialóg), v jednom stĺpci; po ťuknutí na byt sa
panel posunie do okna (`scrollIntoView({block: 'start'})`, `smooth` len bez reduced-motion). Tabuľka bytov pod
panelom sa na mobile zalomí na riadky „A1 – Dvojizbový byt – 1. podlažie – 44,20 m² – 114 900 € – voľný –
Detail“ (každá bunka `display:block` s `data-label`). Prekreslenie medzi mobilom a počítačom rieši len CSS
(médiá), skript nič negeneruje; zvolený byt a filter ostávajú pri zmene šírky.

**Bez skriptu**: fasáda je nakreslená staticky (tlačidlá bez reakcie, ale viditeľné), panel ukazuje A1,
tabuľka 12 bytov s odkazmi funguje, filter sú odkazy na kotvy. **Čítačky**: tlačidlá s `aria-label`
a `aria-pressed`, radiogroup filtra, stavový riadok `aria-live`, tabuľka s `<th scope>`; dekoračné SVG
`aria-hidden="true"`. Mini fasáda na detaile bytu je rovnaký komponent v režime `static` (bunky = odkazy).

## 6. Komponenty na postavenie a riziká

**Komponenty** (čisté CSS a JS, bez knižníc; jeden `style.css`, jeden `app.js` ≤ 12 kB, kritické CSS prvej
obrazovky inline ≤ 14 kB gzip spolu s HTML):

1. Mriežka papiera a rám listu s názvom listu (`.list`, `.list__rohy`), rohové značky na fotkách (`.pic`).
2. Lišta so značkou (text + SVG rohy), menu, telefónnym tlačidlom; mobilné menu s `aria-expanded`.
3. Tlačidlá: plné (Les), obrysové (Tuš), telefónne; stavy hover/fokus/stlačené/vypnuté.
4. Titulný list s úvodnou sekvenciou (`.js` východiskové stavy, `@keyframes` s `both`).
5. Kóta vzdialeností (SVG v mierke, dve úrovne popisov; mobilný zvislý zoznam) – znovu použitá na O projekte.
6. Rohová pečiatka (tabuľka 4 × 2 / 2 × 4).
7. Fasáda bytovky (HTML grid tlačidiel + dekoračné SVG) v troch režimoch: plný (Byty), skrátený (Úvod),
   statický mini (Detail bytu).
8. Panel zvoleného bytu + schematický pôdorys (SVG 2-izbový a 3-izbový s kresliacou sekvenciou) + legenda
   miestností + stavový riadok `aria-live`.
9. Filter typov (radiogroup) s počtom.
10. Tabuľka 12 bytov (desktop tabuľka / mobilné riadky s `data-label`).
11. Kóty obce (315 ha, 900+ ha, 1 339 ha), harmonogram ako časová os, kreslené schémy výhod (4 SVG).
12. Piliere (tri stĺpce s linkami), legenda „Prečo Černík“, tabuľka charakteristiky domu.
13. Cesta: plná (Financovanie, skrolom odvíjaná čiara + krokomer), skrátená vodorovná (Úvod, 3 kroky),
    zvislá statická „Čo nasleduje“ (Detail bytu).
14. Galéria: mozaika + natívny `<dialog>` lupy s klávesnicou a uväzneným fokusom (zdieľaný s pôdorysom a
    interiérmi na detaile).
15. Formulár kontaktu s validáciou, predvyplnením z `?byt=` a stavom „Správa odoslaná“.
16. Pätka.
17. Nástroje: generátor `source/zostav.py` (všetky stránky + 12 detailov z `obsah.json`), skript na obrázky
    (AVIF/WebP, stupne 480/768/1024 pre vizualizácie, 800/1200/1600 pre pôdorysy, kvalita prvej fotky nižšia),
    `skrol-vlakno.mjs` pred a po každom efekte, kontrola `scrollWidth <= innerWidth` na 320/375/390/430 bez JS,
    Lighthouse telefón 5 behov (medián ≥ 95).

**Riziká a čo s nimi**:

1. Pôdorysy klienta nesú cudzie logo a názov „POD VINOHRADMI“ – pred nasadením vyžiadať verziu bez neho alebo
   orezať súbory; do nasadenia ich v paneli nezobrazovať (panel ukazuje vlastnú schému), na detaile bytu až po
   odsúhlasení klientom.
2. Pečiatka a harmonogram uvádzajú „Ukončenie výstavby Jar 2026“ – podľa zdroja je to minulosť; web uvádza údaj
   ako je, poznámka pre klienta v `docs/ZDROJE.md` a HTML komentári; pätka nesie dátum stavu ponuky 13. 10. 2026.
3. Poradie bytov na fasáde (2-izb., 3-izb., 3-izb., 2-izb.) a to, či 12 bytov je jedna alebo obe bytovky, web
   neuvádza – fasáda je schéma („Dve dispozične rovnaké bytovky…“), klient má potvrdiť orientáciu; preto sa
   nepoužíva fotka s pásmi podlaží.
4. Schematický pôdorys nie je v mierke – tvary miestností sú priblížené podľa klientových výkresov, plochy sú
   z `obsah.json`; pri paneli uviesť „schéma, nie v mierke“ v popise (Grafit 13 px).
5. Písma: Bricolage s troma osami je ťažká – osi obmedziť v požiadavke na Google Fonts (`wdth` 87,5..100,
   `wght` 500..700), neviazať obsah na `fonts.ready`; pre produkciu samohosting podsady latin-ext s preloadom
   dvoch rezov. Pred stavbou vykresliť „š ň č ť ľ ž ď Ľ Č ô ä“ v oboch rodinách a skontrolovať mäkčene.
6. Kóta vzdialeností má Podhájsku 17 a Vráble 18 km blízko seba – vyriešené dvoma úrovňami popisov s pevnými
   odstupmi a zvislými vodiacimi linkami; pri doplnení ďalších miest prehodnotiť; pod 640 px zoznam.
7. Fasáda s 12 tlačidlami a pseudo-prvkami: hover mení len opacity na bunke a jej oknách (nie premenné na
   `<html>`); overiť skrol s CPU 4× a `skrol-vlakno.mjs`; prvé nakreslenie ≤ 1,2 s a len raz.
8. Prvý obraz: vizualizácia 01 musí mať stupeň pre 390 px pod 80 kB, `fetchpriority="high"` a preload; H1,
   navigácia a fotka viditeľné bez JS; HTML + kritické CSS ≤ 14 kB gzip (žiadne vložené dátové URI, značka
   ako text + malé SVG rohy).
9. Stav bytov sa mení – jediný zdroj `obsah.json` → `data-stav`; pri „rezervovaný“ sa šrafuje bunka, mení
   `aria-label`, skryje „Mám záujem“; po zmene stačí spustiť generátor.
10. Formulár nemá server – `action` doplní klient (formulárová služba); do nasadenia tlačidlo odošle `mailto:`
    s predvyplneným predmetom; web nič nepredstiera (žiadne falošné „odoslané“ bez skutočného odoslania).
11. Dialóg lupy a galérie: natívny `<dialog>` potrebuje `inert` pre pozadie a vrátenie fokusu; otestovať
    VoiceOver/NVDA; overiť, že `<dialog>` bez JS nie je otvorený.
12. Interiérové vizualizácie okrem série byt-a1 nie sú priradené k bytom – označiť ich ako vzorový interiér;
    klient môže priradiť.
