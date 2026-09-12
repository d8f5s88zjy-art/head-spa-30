# HEAD SPA 30, Nitra

Profesionálny web pre HEAD SPA 30 (Salón 30, Mostná 30, Nitra, www.salon30.sk). Čisté HTML, CSS a JavaScript, bez build kroku a bez externých závislostí.

## Štruktúra

- `index.html` – celá stránka v poradí: úvod, 34 rituálov v dvoch skupinách a piatich kategóriách s cenami, rezervácia, objednávka darčekového poukazu, ako to prebieha (5 krokov), rituály pre chodidlá (5 krokov), prečo k nám (4 fakty), materský salón (Salón 30), galéria, otázky, kontakt s mapou. V hlavičke sú štruktúrované dáta (schema.org: salón so súradnicami, otváracie hodiny, 17 ponúk s cenou a trvaním, FAQ)
- `assets/style.css` – štýly
- `assets/app.js` – scrollom riadená úvodná scéna (misa s teplou vodou, prúd vody, kruhy, para a zlaté svetlo, bez kreslenej postavy), otvárací moment (zelené dvere sa otvoria, značka prejde do lišty), animácie, filter rituálov, objednávkový formulár poukazov. Na telefóne a pri obmedzení pohybu sa namiesto scrollovanej cesty ukáže jedna živá scéna nad nadpisom.
- `assets/img/dvere.jpg` – fotografia vstupných dverí (galéria); ďalšie fotky z rituálov sem pribudnú po nafotení
- `assets/fonts/` – písma Fraunces (400, 500, 300 kurzíva), Manrope (400, 600, 700) a JetBrains Mono (400, 600), hostované lokálne, každý rez v jednom súbore orezanom na latinku so slovenskou, českou, poľskou a maďarskou diakritikou
- `assets/img/dvere*.{avif,webp,jpg}` – fotografia dverí v dvoch veľkostiach a troch formátoch, prehliadač si vyberie najmenší, ktorý vie zobraziť
- `barbershop/` – samostatná stránka BARBER SHOP 30 na tej istej adrese, pozri nižšie
- `robots.txt`, `sitemap.xml` – pre vyhľadávače, nasadzujú sa spolu s webom
- `assets/og.jpg` – obrázok pre zdieľanie na sociálnych sieťach
- `assets/favicon.svg` – ikona

## BARBER SHOP 30, podstránka `barbershop/`

Samostatná stránka pánskeho barbershopu na tej istej adrese (Mostná 226/30, Nitra), nasadená
na https://d8f5s88zjy-art.github.io/head-spa-30/barbershop/. Rovnaký dizajnový jazyk ako HEAD SPA 30
(tmavé plátno, mosadzné zlato, písma Fraunces a Manrope zdieľané z `assets/fonts/`), ale vlastný,
oveľa jednoduchší kód bez scrollovanej scény a bez prekladov:

- `barbershop/index.html` – úvod s animovaným barber stĺpom (čisté CSS, bez obrázka), cenník
  16 služieb v piatich kategóriách s filtrom a rozbaľovacím obsahom, ako to prebieha (5 krokov),
  prečo k nám, odkaz na HEAD SPA 30, poukážky, otázky, kontakt s mapou. V hlavičke sú štruktúrované
  dáta (schema.org `BarberShop`, otváracie hodiny, 16 ponúk s cenou a trvaním, FAQ)
- `barbershop/style.css`, `barbershop/app.js` – štýly a správanie (menu, hlásenie Dnes otvorené,
  odhaľovanie pri rolovaní, filter cenníka, rozbaľovanie kariet a otázok)
- `barbershop/og.jpg`, `barbershop/favicon.svg` – obrázok pre zdieľanie a ikona

Stránka je v `.github/workflows/pages.yml` aj v `sitemap.xml`. HEAD SPA 30 na barbershop
neodkazuje (zámerne, pozri históriu commitov), barbershop na HEAD SPA 30 áno.

**Kontakty a hodiny sú prevzaté z prvej verzie webu HEAD SPA 30 (september 2026), keď ešte bežal
pod značkou Barbershop30:** telefón 0951 267 203, e-mail info@barbershop30.sk, Instagram
barbershop30_nitra, rezervácia https://booqme.app/sk/rezervacia/barbershop-30, otváracie hodiny
pondelok až piatok 09:00 až 19:00, sobota 09:00 až 14:00, nedeľa zatvorené. Pred spustením ich treba
overiť s prevádzkou. Hodiny sú na troch miestach naraz: v schéme, v kontakte a v `barbershop/app.js`
(konštanta `HOURS`).

**Cenník je NÁVRH, čaká na potvrdenie prevádzky.** Názvy, dĺžky, ceny aj obsah krokov sú odvodené
z bežnej ponuky slovenských barbershopov, nie prevzaté zo zdroja prevádzky. Pri zmene ceny alebo
dĺžky treba upraviť `data-min`, `data-price` a text `.meta` na karte, `Offer` v štruktúrovaných
dátach, prípadne čísla v úvode (16 služieb, 10 až 75 minút, strih od 13 €), v sekcii Prečo k nám,
v otázkach a hodnoty poukazov (15, 20, 30 a 40 €, spodná pokryje študentský strih, horná
kompletný servis za 36 €).

| Služba | Trvanie | Cena |
| --- | --- | --- |
| Klasický pánsky strih | 30 min | 18 € |
| Strih strojčekom | 20 min | 13 € |
| Fade a skin fade | 45 min | 22 € |
| Strih s umytím a stylingom | 45 min | 24 € |
| Úprava brady | 20 min | 12 € |
| Brada s kontúrami britvou a horúcim uterákom | 30 min | 17 € |
| Klasické holenie britvou | 30 min | 18 € |
| Strih a brada | 60 min | 30 € |
| Strih, brada a holenie kontúr | 75 min | 36 € |
| Otec a syn | 60 min / 2 os. | 28 € |
| Detský strih do 12 rokov | 25 min | 13 € |
| Študentský strih | 30 min | 15 € |
| Čierna maska na tvár | 15 min | 8 € |
| Kamufláž šedín, vlasy alebo brada | 20 min | 12 € |
| Vosk: nos, uši, obočie | 10 min | 6 € |
| Umytie a styling | 15 min | 8 € |

Náhľad: `npx http-server -p 8080` v koreni projektu a otvoriť `http://localhost:8080/barbershop/`
(písma sa načítavajú z `../assets/`, preto dvojklik na súbor bez servera ukáže náhradné písmo).

## Čo web robí sám

- Na telefóne a tablete má menu (ikona vpravo hore), na počítači odkazy v lište. Lišta sa pri čítaní smerom dole schová a pri prvom pohybe hore sa vráti.
- V kontakte a v menu ukazuje, či je salón práve otvorený (počíta sa podľa času v Bratislave z otváracích hodín v kóde, `HOURS` v `app.js`).
- Sekcie sa objavujú pri rolovaní, na počítači s jemnou myšou (tlačidlá sa nakláňajú k ruke, karty nesú svetlo pod kurzorom). Pri zapnutom obmedzení pohybu je všetko statické.
- Mapa v kontakte je vložená Google mapa adresy; keby sa nenačítala, ostane adresa a odkaz na navigáciu.

## Náhľad

Dvojklik na `index.html` funguje. Pre plný zážitok so scrollom spustite lokálny server v priečinku projektu:

```
npx http-server -p 8080
```

a otvorte `http://localhost:8080`.

## Nasadenie

Web beží zadarmo na GitHub Pages: https://d8f5s88zjy-art.github.io/head-spa-30/. Nasadenie robí automaticky `.github/workflows/pages.yml` pri každom pushi (repozitár musí byť verejný, alebo účet s GitHub Pro). Pri presune na vlastnú doménu upravte v `index.html` značky `canonical`, `og:url` a `og:image` (miesto je označené komentárom `DEPLOY STEP`) a v nastaveniach Pages zadajte doménu.

## Rezervácia

Sekcia Rezervácia (vlastná položka v lište) umožňuje vybrať ktorýkoľvek z 34 rituálov, deň a časové okno. Tlačidlo Rezervovať pri rituáli v cenníku daný rituál rovno predvyberie. Formulár kontroluje otváracie hodiny, dĺžku rituálu a nedele, potom otvorí hotovú správu vo WhatsApp (0911 153 136) alebo v e-maile. Web nič neukladá, správa odchádza z telefónu zákazníka. Odkaz sa dá aj zdieľať s predvybraným rituálom, napríklad `?ritual=zlaty-ritual-24k#rezervacia`.

Kalendár Booqme zostáva ako druhá možnosť pod formulárom.

## Darčekové poukážky

Sekcia Poukážky (vlastná položka v lište) má dve cesty: tlačidlo Kúpiť poukaz online vedie na rezervačnú stránku Booqme (https://booqme.app/sk/rezervacia/salon-30), kde sa po vytvorení typov poukážok v administrácii Booqme automaticky objaví ich predaj kartou. Druhá cesta je objednávkový formulár (hodnota alebo konkrétny rituál, pre koho, kontakt, venovanie, doručenie), ktorý otvorí pripravený e-mail na info@salon30.sk.

## Galéria

Sekcia Galéria je mozaika šiestich dlaždíc: fotografia dverí, makro detail zlatých kruhov (výrez z tej istej fotky), tri kreslené zábery (teplá voda, para, zlaté svetlo) a jedna typografická dlaždica. Kreslené zábery sa jemne hýbu, ale len keď sú na obrazovke, a stoja pri zapnutom obmedzení pohybu aj po 45 sekundách nečinnosti. Fotografia sa dá zväčšiť kliknutím.

Výmena kreslených záberov za skutočné fotografie nevyžaduje zásah do kódu. Stačí uložiť súbor do `assets/img/galeria/` s presným názvom a spustiť `python3 scratchpad/build.py`:

- `voda.jpg` nahradí záber Teplá voda
- `para.jpg` nahradí záber Para a ticho
- `zlate.jpg` nahradí záber Zlaté svetlo
- `kruhy.jpg` nahradí makro detail kruhov

Ak fotografia existuje, použije sa namiesto kresby a štítok Kresba zmizne.

## Rezervácie

Všetky tlačidlá Rezervovať vedú na rezervačnú stránku Booqme https://booqme.app/sk/rezervacia/salon-30 (adresa je v `scratchpad/build.py` ako `BOOK` a v šablóne). Zoznam 17 programov na nahratie do Booqme je v `docs/booqme-programy.xlsx`. Telefón a e-mail sú v sekcii Kontakt.

## Kontakt a otváracie hodiny

Všetky kontakty na stránke patria Salónu 30, materskej prevádzke: telefón 0911 153 136,
e-mail info@salon30.sk, web www.salon30.sk, Instagram salon30_nitra, Facebook Salon30_nitra,
adresa Mostná 226/30, 949 01 Nitra. Otváracie hodiny sú prevzaté zo salon30.sk:
pondelok až piatok 09:00 až 18:00, sobota 09:00 až 15:00, nedeľa zatvorené.
Rovnaké hodiny sú v schéme `openingHoursSpecification`, v pätičke, v kontakte,
v hlásení Dnes otvorené (`assets/app.js`, konštanta `HOURS`) a v kontrole termínov.
Ak sa hodiny zmenia, treba ich upraviť na všetkých týchto miestach naraz.

## Sekcia Salón 30

Sekcia `#salon` opisuje materské kaderníctvo: kozmetika Oroexpert, trichologické vyšetrenie
mikrokamerou (vlasová stylistka Kristína Salayová), šesť kaderníčok a orientačné ceny
kaderníckych služieb. Všetko je prevzaté z www.salon30.sk, stav 11. 9. 2026. Nič nie je vymyslené.

## Hodnoty darčekových poukazov

Rebríček je odvodený od cenníka, nie zvolený od oka: **45, 70, 100, 149 a 249 €**.
Spodná hodnota presne pokryje najlacnejší rituál (45 €), horná aj ten najdrahší
(Zlatý Head Spa rituál 24K pre dvoch za 249 €). Vyššie hodnoty zámerne nie sú,
aby obdarovanému nezostal zostatok, ktorý nemá ako minúť.

Sú to dva ručne udržiavané zoznamy v rôznych častiach `index.html`: hodnoty
poukazu (`name="hodnota"`) a ceny rituálov (`data-price` na kartách). Keď sa
rozídu, `assets/app.js` vypíše varovanie do konzoly prehliadača:

```
HEAD SPA 30: poukaz za 400 € presahuje najdrahší rituál (249 €).
```

Kontrola sa ozve len vtedy, keď je naozaj čo hlásiť. **Pri zmene cien rituálov
preto treba prejsť aj hodnoty poukazov** a upraviť aj vetu pod nimi, ktorá obe
čísla menuje, plus jej preklady v šiestich jazykových súboroch.


## Výber podľa času a rozpočtu

Pri 34 rituáloch nestačí filter podľa kategórie. Nad zoznamom sú preto dva
výbery, ktoré sa kombinujú s kategóriou: **Mám čas** (do 45, 60, 75 alebo 90 minút)
a **Rozpočet** (do 60, 90, 130 alebo 160 €).

Každá karta má `data-min` a `data-price`, takže sa filtruje priamo z hodnôt,
nie z parsovania textu. Nadpis kategórie zmizne, keď v nej po obmedzení nič
nezostane, a keď nezodpovedá nič, zobrazí sa vysvetlenie s návrhom, čo zmeniť.
Tlačidlo Zrušiť obmedzenia sa objaví len vtedy, keď je naozaj čo rušiť.

Riadok "Zobrazených N z 34 rituálov" sa skladá až v prehliadači, preto má
vlastné preklady v `assets/app.js` (`COUNT_WORDS`), rovnako ako text otváracích
hodín. Po zmene jazyka sa prekreslí.

Pozor pri úprave cien alebo trvaní: hodnoty v `data-min` a `data-price` musia
sedieť s tým, čo je napísané v `.meta` karty, inak filter ukáže niečo iné,
než karta tvrdí.


## Sekcia Rituály pre chodidlá

Tri rituály pre chodidlá (Klasický 45 €, Ovocný a bylinkový 65 €, Zlatý rituál 24K 119 €)
boli od začiatku v cenníku, ale až na jeho konci za filtrom, takže ich nikto nevidel.
Sekcia `#chodidla` ich vyťahuje dopredu: päť krokov rituálu odvodených z obsahu kariet
a tri odkazy s trvaním a cenou.

Odkazy majú `data-cat-jump="feet"`. Po kliknutí sa cenník prepne na kategóriu Chodidlá
a ak odkaz mieri na konkrétnu kartu, tá sa rovno rozbalí. Ten istý mechanizmus sa dá použiť
pre ktorúkoľvek kategóriu, stačí `data-cat-jump` s jej kľúčom (`classic`, `gentlemen`,
`kids`, `couple`, `feet`).

Vodná línia v sekcii Ako to prebieha aj v sekcii pre chodidlá beží samostatne,
`assets/app.js` si drží pole `streams`, jeden záznam na každý blok `.steps`.

### Animácia v sekcii chodidiel

Kresba nôh v mise je čisté SVG a CSS, žiadny obrázok ani knižnica. Celá scéna
beží v jednom osemsekundovom kruhu, aby jednotlivé pohyby na seba nadväzovali:

1. kvapka padá z výšky a pri dopade sa sploští (`faDrop`),
2. z miesta dopadu sa rozbehnú dva kruhy (`faRing`, druhý s odstupom pol sekundy),
3. chodidlá sa o dva a pol pixela prepadnú a prsty sa uvoľnia (`faSink`, `faToes`),
4. zo štyroch miest stúpne para a rozplynie sa (`faSteam`),
5. zlatá žiara pod misou v polovici kruhu zosilnie (`faGlow`).

Hladina sa vlní nezávisle v troch vrstvách s rôznou dĺžkou (9, 11 a 13 sekúnd),
takže sa vzor viditeľne neopakuje. Citrusový plátok sa kolíše v šiestich sekundách.
Spolu šestnásť animovaných častí.

Pri `prefers-reduced-motion: reduce` sa zastaví všetko, kvapka sa skryje
a para zostane staticky viditeľná, takže kresba dáva zmysel aj bez pohybu.

Sekcia má vlastnú scénu pozadia `data-scene="chodidla"`: zelená žiara klesne
nižšie k zemi, zlatá sa stlmí. Predtým si požičiavala scénu od rituálu pre hlavu.


## Rituály pre chodidlá: čo je overené a čo je návrh

Cenník má dve rovnaké polovice: **17 rituálov pre hlavu** a **17 rituálov pre chodidlá**, obe
v rovnakých piatich kategóriách (klasické, pánske, detské, pre dvoch, luxusné).
Filter má preto dva riadky a v každom je aj tlačidlo na celú skupinu.

**Overené z ponuky prevádzky (3):**

| Rituál | Trvanie | Cena |
| --- | --- | --- |
| Klasický rituál pre chodidlá | 40 min | 45 € |
| Ovocný a bylinkový rituál pre chodidlá | 60 min | 65 € |
| Zlatý rituál 24K | 90 min | 119 € |

**NÁVRH, čaká na potvrdenie prevádzky (14).** Názvy, dĺžky, ceny aj obsah krokov sú
odvodené zo štruktúry hlavového menu a zo slovníka troch overených rituálov pre chodidlá.
Nie sú prevzaté zo žiadneho zdroja prevádzky.

| Rituál | Trvanie | Cena |
| --- | --- | --- |
| Relaxačný rituál pre chodidlá | 60 min | 59 € |
| Harmónia pre chodidlá | 75 min | 75 € |
| Hĺbkový rituál pre chodidlá a päty | 90 min | 85 € |
| Kozmetický rituál pre chodidlá | 60 min | 69 € |
| Prémiový rituál pre chodidlá | 120 min | 139 € |
| Pánsky rituál pre chodidlá | 45 min | 49 € |
| Pánsky harmonický rituál pre chodidlá | 60 min | 69 € |
| Pánsky hĺbkový rituál pre chodidlá | 90 min | 89 € |
| Prémiový pánsky rituál pre chodidlá | 120 min | 139 € |
| Detský ovocný rituál pre chodidlá | 40 min | 45 € |
| Spoločný rituál pre chodidlá | 60 min / 2 os. | 115 € |
| Spoločný rituál pre chodidlá pod hviezdami | 75 min / 2 os. | 139 € |
| Strieborný rituál pre chodidlá | 75 min | 99 € |
| Zlatý rituál 24K pre dvoch | 90 min / 2 os. | 229 € |

**Pred spustením treba tých 14 rituálov potvrdiť a založiť v Booqme**, inak si ich
zákazník na stránke vyberie, ale v rezervačnom systéme ich nenájde. Ak sa niektorý
neschváli, stačí vymazať jeho `<article class="card">` z `index.html`, jeho `<option>`
z výberu `#v-ritual` a jeho `Offer` zo `hasOfferCatalog` v štruktúrovaných dátach.

Cenová logika návrhu kopíruje hlavové menu: rovnaké dĺžky (40, 45, 60, 75, 90, 120 min),
ceny pre chodidlá o niečo nižšie ako za rovnako dlhý rituál pre hlavu, pri rituáloch
pre dvoch platí cena za obe osoby.

## Luxusné rituály pre hlavu (NÁVRH)

Aby mala hlavová polovica rovnakých 17 rituálov ako chodidlová, pribudla kategória
Luxusné Head Spa rituály. Tri položky, všetky **NÁVRH**, rovnako ako 14 návrhov
pri chodidlách. Treba ich potvrdiť a založiť v Booqme.

| Rituál | Trvanie | Cena |
| --- | --- | --- |
| Strieborný Head Spa rituál | 75 min | 109 € |
| Zlatý Head Spa rituál 24K | 90 min | 129 € |
| Zlatý Head Spa rituál 24K pre dvoch | 90 min / 2 os. | 249 € |

Spolu je teda z 34 rituálov **overených 17** (14 pre hlavu z pôvodnej ponuky
a 3 pre chodidlá) a **17 je návrh**.

## Jazyky

Stránka je v siedmich jazykoch: slovenčina, čeština, poľština, maďarčina,
nemčina, ukrajinčina a angličtina. Teda Slovensko a všetky susedné krajiny plus angličtina.

Ako to funguje:

- Slovenčina je priamo v `index.html`, žiadny zvláštny súbor nepotrebuje.
- `assets/i18n/<jazyk>.json` je objekt, kde kľúč je slovenský text zo stránky
  a hodnota je jeho preklad. Kľúčuje sa textom, nie poradím, takže presun sekcií
  v HTML preklady nerozbije. Text bez kľúča zostane po slovensky.
- `assets/i18n.js` po načítaní prejde textové uzly a vybrané atribúty
  (`placeholder`, `aria-label`, `alt`, `title`, meta popisy, `<title>`) a vymení ich.
  HTML preto nepotrebuje žiadne značky navyše. Element s `data-no-i18n` sa preskočí.
- Jazyk sa vyberie v poradí: `?lang=xx` v odkaze, uložená voľba v `localStorage`,
  jazyk prehliadača, inak slovenčina. Voľba sa zapíše do adresy, takže sa dá poslať odkaz.
- Text "Dnes otvorené do 18:00" vzniká až v prehliadači, preto má vlastné preklady
  priamo v `assets/app.js` (`TODAY_WORDS`), nie v JSON súboroch.
- Keď sa preklad nestiahne, stránka zostane slovenská a plne funkčná.
- V hlavičke sú `hreflang` odkazy na všetkých sedem jazykov plus `x-default`,
  to isté má aj `sitemap.xml`.

**Keď pribudne nový text v `index.html`**, stačí doň pridať nový kľúč do šiestich
jazykových súborov. Kým tam nie je, tá jedna veta sa zobrazí po slovensky
a zvyšok stránky ostane preložený.
