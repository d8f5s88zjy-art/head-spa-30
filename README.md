# HEAD SPA 30, Nitra

Profesionálny web pre HEAD SPA 30 (Salón 30, Mostná 30, Nitra, www.salon30.sk). Čisté HTML, CSS a JavaScript, bez build kroku a bez externých závislostí.

## Štruktúra

- `index.html` – celá stránka v poradí: úvod, 34 rituálov v dvoch skupinách a piatich kategóriách s cenami, rezervácia, objednávka darčekového poukazu, ako to prebieha (5 krokov), rituály pre chodidlá (5 krokov), prečo k nám (4 fakty), materský salón (Salón 30), galéria, otázky, kontakt s mapou. V hlavičke sú štruktúrované dáta (schema.org: salón so súradnicami, otváracie hodiny, 17 ponúk s cenou a trvaním, FAQ)
- `assets/style.css` – štýly
- `assets/app.js` – scrollom riadená úvodná scéna (misa s teplou vodou, prúd vody, kruhy, para a zlaté svetlo, bez kreslenej postavy), otvárací moment (zelené dvere sa otvoria, značka prejde do lišty), animácie, filter rituálov, objednávkový formulár poukazov. Na telefóne a pri obmedzení pohybu sa namiesto scrollovanej cesty ukáže jedna živá scéna nad nadpisom.
- `assets/img/dvere.jpg` – fotografia vstupných dverí (galéria); ďalšie fotky z rituálov sem pribudnú po nafotení
- `assets/fonts/` – písma Fraunces (400, 500, 300 kurzíva), Manrope (400, 600, 700) a JetBrains Mono (400, 600), hostované lokálne, každý rez v jednom súbore orezanom na latinku so slovenskou, českou, poľskou a maďarskou diakritikou
- `assets/img/dvere*.{avif,webp,jpg}` – fotografia dverí v dvoch veľkostiach a troch formátoch, prehliadač si vyberie najmenší, ktorý vie zobraziť
- `robots.txt`, `sitemap.xml` – pre vyhľadávače, nasadzujú sa spolu s webom
- `assets/og.jpg` – obrázok pre zdieľanie na sociálnych sieťach
- `assets/favicon.svg` – ikona

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
