# HEAD SPA 30, Nitra

Profesionálny web pre HEAD SPA 30 (Salón 30, Mostná 30, Nitra, www.salon30.sk). Čisté HTML, CSS a JavaScript, bez build kroku a bez externých závislostí.

## Štruktúra

- `index.html` – celá stránka v poradí: úvod, 34 rituálov v dvoch skupinách a piatich kategóriách s cenami, rezervácia, objednávka darčekového poukazu, ako to prebieha (5 krokov), rituály pre chodidlá (5 krokov), prečo k nám (4 fakty), materský salón (Salón 30), galéria, otázky, kontakt s mapou. V hlavičke sú štruktúrované dáta (schema.org: salón so súradnicami, otváracie hodiny, 17 ponúk s cenou a trvaním, FAQ)
- `assets/style.css` – štýly
- `assets/app.js` – scrollom riadená úvodná scéna (misa s teplou vodou, prúd vody, kruhy, para a zlaté svetlo, bez kreslenej postavy), otvárací moment (zelené dvere sa otvoria, značka prejde do lišty), animácie, filter rituálov, objednávkový formulár poukazov. Na telefóne a pri obmedzení pohybu sa namiesto scrollovanej cesty ukáže jedna živá scéna nad nadpisom.
- `assets/img/dvere.jpg` – fotografia vstupných dverí (galéria); ďalšie fotky z rituálov sem pribudnú po nafotení
- `assets/fonts/` – písma Fraunces (400, 500, 300 kurzíva), Manrope (400, 600, 700) a JetBrains Mono (400, 600), hostované lokálne, každý rez v jednom súbore orezanom na latinku so slovenskou, českou, poľskou a maďarskou diakritikou
- `assets/img/dvere*.{avif,webp,jpg}` – fotografia dverí v dvoch veľkostiach a troch formátoch, prehliadač si vyberie najmenší, ktorý vie zobraziť
- `barbershop/` – samostatný web BARBERSHOP 30 na tej istej adrese, vlastné písma a kód, pozri nižšie
- `robots.txt`, `sitemap.xml` – pre vyhľadávače, nasadzujú sa spolu s webom
- `assets/og.jpg` – obrázok pre zdieľanie na sociálnych sieťach
- `assets/favicon.svg` – ikona

## BARBERSHOP 30, samostatný web v `barbershop/`

Samostatná stránka pánskeho barbershopu na tej istej adrese (Mostná 226/30, Nitra), nasadená
na https://d8f5s88zjy-art.github.io/head-spa-30/barbershop/. **Je to vlastný web, nie podstránka
HEAD SPA 30:** má vlastné písma, vlastné štýly aj skript, žiadny odkaz ani zmienku o Head Spa
a nezdieľa s ním ani jeden súbor. Celý priečinok `barbershop/` sa dá presunúť na vlastnú doménu
tak, ako je (potom stačí prepísať `canonical`, `og:url` a `og:image` v `index.html`).

- `barbershop/index.html` – kinematické otvorenie, úvod s fotografiou prevádzky pod tmavým závojom,
  bežiaci pás služieb, cenník 16 služieb v piatich kategóriách s filtrom a rozbaľovacím obsahom,
  ako to prebieha (5 krokov), U nás vnútri (fotka s bodmi) a Galéria, poukážky,
  otázky, kontakt s mapou. V hlavičke sú štruktúrované dáta (schema.org `BarberShop`, otváracie
  hodiny, 16 ponúk s cenou a trvaním, FAQ)
- `barbershop/style.css`, `barbershop/app.js` – štýly a správanie
- `barbershop/assets/fonts.css`, `barbershop/assets/fonts/` – vlastná kópia písiem Fraunces, Manrope
  a JetBrains Mono, aby priečinok fungoval samostatne
- `barbershop/og.jpg`, `barbershop/favicon.svg` – obrázok pre zdieľanie a ikona

### Identita: čierna a zlatá

Podkladom je päť fotografií interiéru (september 2026). Stránka je čierno-zlatá a farbu nesie
len zlatá; oranžová z priemyselných lámp zostala tam, kam patrí, teda na fotografiách.

| Na fotke | Na stránke |
| --- | --- |
| Mosadz na kreslách, zrkadlách a nástenných svietidlách | `--gold: #d4b062`, `--gold-hi: #f0d694`, `--gold-deep: #a8842f` |
| Tmavé drevo, čierny obklad, tlmené svetlo | `--canvas: #0a0a09`, `--panel: #141413` |
| Oranžové lampy | ponechané fotografiám, v rozhraní nie sú |
| Nápis na rohožke a neón na stene | názov **BARBERSHOP 30**, podnázov **Holičstvo** |
| Kondenzované písmo na rohožke | nadpisy **Oswald**, verzálky |
| Ozdobná trojka v logu | čísla a značka zostali vo **Fraunces** |

Zlatá robí všetko naraz: tlačidlá, zvýraznené slová v nadpisoch, popisky, čísla, ikony, linky,
rámiky aj neón v úvodnej scéne. Na tlačidlách je zlatá plocha s takmer čiernym textom, inde zlatý
text na čiernom. Kontrast zlatej na plátne je 9,6 : 1, tmavého textu na zlatom tlačidle 5,5 až
12,8 : 1 podľa miesta v prechode.

Písmo Oswald je jeden variabilný súbor na dva rozsahy (`Oswald-latin.woff2`,
`Oswald-latin-ext.woff2`, spolu 40 kB), hostovaný lokálne ako ostatné.

Texty majú jeden rebríček odtieňov na celú stránku: `--text-primary: #fbf8f3`,
`--text-secondary: #d5cfc5`, `--text-tertiary: #aaa298`. Najslabší prípad má kontrast 6,8 : 1.
Nikde na stránke nie je farba textu zapísaná ako literál, všetko ide cez tieto premenné.

### Fotografie

V `barbershop/foto/` je päť záberov z prevádzky: `interier`, `kresla`, `recepcia`, `neon`,
`stanice`. Každý je v dvoch formátoch, `.webp` a `.jpg`. Všade sú vložené cez `<picture>`,
takže prehliadač stiahne len WebP a JPEG si vezme, len ak WebP nevie. Päť fotiek váži v WebP
spolu 789 kB, v JPEG by to bolo 1,5 MB.

Zdrojom sú **snímky z Instagram stories**, teda nie originály. Rozhranie Instagramu je orezané
preč. Export ide z pôvodných snímok v ich vlastnej šírke 1290 px, bez zmenšovania, s doostrením
(`UnsharpMask`, radius 1.1, 115 %, prah 3) a v kvalite 89 bez podvzorkovania farieb. Skoršia
verzia bola zmenšená na 1160 px a v kvalite 78, preto vyzerala mäkko.

**Keď budú po ruke originály**, nahraď súbory v `foto/` rovnakým názvom. Treba prepísať obe
prípony, inak prehliadač ukáže starú WebP verziu. `.webp` sa vyrobí z `.jpg` takto:

```python
from PIL import Image
Image.open('barbershop/foto/interier.jpg').save(
    'barbershop/foto/interier.webp', 'WEBP', quality=86, method=6)
```

Fotky sú vložené priamo v `index.html`, nie dosadzované skriptom. Výrez v dlaždici galérie riadi
`--pos` (mapuje sa na `object-position`).

**Animácie fotky nezväčšujú viac ako o 5 %.** Pôvodne sa v úvode približovala o 12 % a dlaždice
dosadali zo 14 %, čo pri zdroji so šírkou 1290 px viditeľne rozmazávalo. Cez fotku v úvode je
navyše jemné zrno, ktoré zvyšok mäkkosti skryje.

### U nás vnútri a Galéria

Celá stránka je jedna tmavá miestnosť, tak ako prevádzka. Stredná kapitola (`#interier`
a `#galeria`) sa od zvyšku odlišuje len o odtieň svetlejším podkladom a oranžovou linkou navrchu,
nie prevrátenou paletou. Skoršia verzia mala v strede krémový pás; to bol cudzí prvok, prevádzka
nič také nemá.

**U nás vnútri** (`#interier`) je fotografia prevádzky, do ktorej je vložených päť bodov. Po
ťuknutí alebo prejdení myšou povedia, čo je čo: oranžové lampy, neón na lamelách, sud s uterákmi,
kreslá, vchod s recepciou. Body sú umiestnené v percentách (`--x`, `--y`), takže sedia pri každej
šírke. Na počítači sa text ukáže v bubline pri bode, na telefóne by sa bublina nezmestila, preto
ide do panela `.spot-read` pod fotkou. Otvorený je vždy len jeden bod, zatvára ho Escape aj klik
mimo. Bod pri ľavom okraji má triedu `left`, pri pravom `right`, aby bublina neutiekla z obrazu.

**Galéria** (`#galeria`) je mozaika šiestich dlaždíc: päť fotografií z prevádzky a jedna oranžová
typografická dlaždica, ktorá opakuje nápis z rohožky pri vchode. Kliknutie ktorúkoľvek fotografiu
zväčší (`<dialog class="lb">`).

### Pohyb odpísaný z prevádzky

Každá animácia má predlohu v miestnosti, nie je to efekt pre efekt:

| V prevádzke | Na stránke |
| --- | --- |
| Neón na drevenej stene | názov v úvodnej scéne sa zapáli zlatou s krátkym zablikaním (`neonOn`) |
| Svetlo lámp v tmavej miestnosti | zlatý kruh svetla nad fotkou v úvode pulzuje (`lampPulse`), svetlá v pozadí dýchajú (`envBreathe`) |
| Barber stĺp | pásik medzi kapitolami je otáčajúci sa stĺp v čiernej a zlatej (`.pole-rule`) |
| Kruhové svetlá pri zrkadlách | tlačidlo späť hore má pulzujúci prstenec (`ringLight`) |
| Pomalý pohľad po miestnosti | fotka v úvode sa pomaly približuje (`kenburns`), ostatné fotky dosadnú z mierneho priblíženia |
| Mosadz, ktorá chytá svetlo | zvýraznené slová v nadpisoch nie sú vyplnené plochou farbou, ale zlatým prechodom, ktorý sa raz za jedenásť sekúnd posunie a prebehne po písmenách (`goldSheen`) |
| Odlesk na hrane kovu | pri prejdení myšou obieha po ráme karty v cenníku zlaté vlákno (`cardBeam`) |

Pri zapaľovaní neónu bliká len žiara, nie farba písmen, takže nápis je čitateľný po celý čas.
Lesk na nadpisoch beží cez `background-clip: text`; kde ho prehliadač nevie, zostane plná zlatá
z pravidla nad ním. Obiehajúce vlákno po ráme karty potrebuje `@property` na animovanie uhla,
bez neho sa jednoducho nezobrazí a karta vyzerá ako predtým.
Pri `prefers-reduced-motion: reduce` stojí všetko a všetko je viditeľné.

Fotografie sú okrem úvodu, sekcie U nás vnútri a galérie aj v sekcii Ako to prebieha (vedľa krokov,
v lepiacom stĺpci) a pod panelom s poukážkami (ako podklad pod závojom).

### Detaily, ktoré držia dojem

Drahé weby nepoznať podľa toho, že sa na nich viac hýbe, ale podľa toho, že im nič nechýba pod
rukou. Preto k stránke pribudlo sedem drobností, každá s vlastným vypínačom:

| Detail | Čo robí | Kedy sa neukáže |
| --- | --- | --- |
| Mosadzný prstenec pod myšou (`.cursor`) | sleduje ruku, nad odkazom sa zväčší, nad fotkou v galérii sa zmení na zlatú pilulku s nápisom **Zväčšiť**, nad tlačidlom rezervácie **Rezervovať**, nad telefónom **Zavolať** | na dotykovom displeji, pri obmedzení pohybu, v otvorenom dialógu (menu, zväčšená fotka) a nad mapou, kde patrí systémový kurzor |
| Bočný register kapitol (`.rail`) | vpravo pri okraji ukazuje, v ktorej sekcii si; po prejdení myšou vysvieti názov | pod 1260 px šírky a kým si v úvode |
| Stojatý popis a šípka v úvode (`.hside`, `.hcue`) | adresa postavená na výšku pri ľavom okraji a odkaz na cenník so stekajúcim svetlom | pod 900 px šírky |
| Krokovanie galérie | zväčšenú fotku posunieš šípkami na obrazovke, klávesmi ← a →, alebo ťahom prsta; v popise je počítadlo **1 / 5** | — |
| Mosadzná pilulka vo filtri (`.chip-ind`) | podklad stlačenej kategórie sa presunie k novej, nepreblikne | pilulku stavia skript, bez neho ostáva pôvodné zlaté tlačidlo |
| Počet služieb v lište filtra | tally sa presunul z vlastného riadka do pravej časti lepiacej lišty | pod 901 px sa vráti pod čipy |
| Vlasový rám stránky (`.frame`) | zlatá linka po obvode okna, ako orezová značka na tlači | pod 1260 px šírky |

Zlatý prechod na hlavných tlačidlách sa pri prejdení myšou posunie po ploche, takže mosadz chytí
svetlo namiesto toho, aby len zosvetlela.

### Dve chyby, ktoré pri tom vyšli najavo

- **Úvodná scéna sa vôbec neprehrávala.** Pri skoršom mazaní kresieb sa v `app.js` zduplikoval
  koniec súboru, takže funkcia `opening()` tam bola dvakrát. Prvá scénu spustila, druhá ju hneď
  odstránila, lebo v `sessionStorage` už našla značku od prvej. Navyše na `body` zostala trieda
  `intro-on`, čiže zamknuté rolovanie. Koniec skriptu je poskladaný načisto.
- **Pásik služieb sa nehýbal.** Jeho `IntersectionObserver` bol vytvorený bez premennej, ktorá by
  ho držala, a prehliadač ho zahodil. Viditeľnosť pásika teraz počíta ten istý scrollový priechod
  ako zvyšok stránky (`onDrive`), takže nemá čo zmiznúť.

**Kontakty a hodiny sú prevzaté z prvej verzie webu (september 2026), keď ešte bežal pod značkou
Barbershop30:** telefón 0951 267 203, e-mail info@barbershop30.sk, Instagram barbershop30_nitra,
rezervácia https://booqme.app/sk/rezervacia/barbershop-30, otváracie hodiny pondelok až piatok
09:00 až 19:00, sobota 09:00 až 14:00, nedeľa zatvorené. Pred spustením ich treba overiť
s prevádzkou. Hodiny sú na troch miestach naraz: v schéme, v kontakte a v `barbershop/app.js`
(konštanta `HOURS`).

**Cenník je NÁVRH, čaká na potvrdenie prevádzky.** Názvy, dĺžky, ceny aj obsah krokov sú odvodené
z bežnej ponuky slovenských barbershopov, nie prevzaté zo zdroja prevádzky. Pri zmene ceny alebo
dĺžky treba upraviť `data-min`, `data-price` a text `.meta` na karte, `Offer` v štruktúrovaných
dátach, prípadne čísla v úvode (16 služieb, 10 až 75 minút, strih od 13 €),
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

Náhľad: `npx http-server -p 8080` v koreni projektu a otvoriť `http://localhost:8080/barbershop/`.
Stránka je v `.github/workflows/pages.yml` aj v `sitemap.xml`.

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

## Plagát na losovanie

`barbershop/plagat/index.html` – plagát A3 na výšku (297 × 420 mm) pre losovanie o rok strihania
zadarmo. Jeden hárok postavený ako vstupenka do losovania: perforácia s nožnicami, pod ňou útržok
s dátumom, QR kódom a podmienkami. Farby a písma sú tie isté ako na stránke, písma sa načítavajú
z `barbershop/assets/fonts/` cez `../assets/`.

Rozmery vnútri hárku sú v `cqw` (1 cqw = 1 % šírky hárku = 2,97 mm), takže jedny čísla platia na
obrazovke aj v tlači. Tlačový hárok drží `@page{size:A3 portrait;margin:0}` a `print-color-adjust:exact`.

- `barbershop/plagat/qr.svg` – QR kód na Instagram, vygenerovaný cez `segno` (ECC úroveň Q, 33
  modulov), tmavé moduly na svetlej podložke, aby sa dal naskenovať z tmavého plagátu
- `barbershop/plagat/barbershop30-losovanie-A3.pdf` – tlačové PDF, jedna strana, písma vložené
- `barbershop/plagat/barbershop30-losovanie.png` – náhľad na sociálne siete

Prerender po zmene (beží lokálny server nad `barbershop/`):

```
python3 -m http.server 8766   # v priečinku barbershop/
node -e "…playwright… page.pdf({width:'297mm',height:'420mm',printBackground:true})"
```

**Termíny, výhra aj podmienky sú NÁVRH, čakajú na potvrdenie prevádzky.** Obdobie 17. 9. – 31. 10.
2026, losovanie 31. 10. 2026 o 14:00, výhra 12 strihov po 18 € (216 €). Pri zmene treba prepísať
horný pás, blok `03`, `.when` a text `.fine`. Text podmienok nie je právne overený.
