# Zadanie: web HEAD SPA 30 zjednotiť s prevádzkou

Skopíruj celý text pod čiarou ako zadanie do novej relácie nad repozitárom `d8f5s88zjy-art/head-spa-30`.

---

Pracuješ na webe HEAD SPA 30 (pod značkou Salón 30, Mostná 30, Nitra). Živá verzia je na vetve
`main`, nasadená na https://d8f5s88zjy-art.github.io/head-spa-30/. Začni z `main`.

**Najprv si prečítaj `CLAUDE.md` a drž sa ho bez výnimky.** Hlavne: iba 17 rituálov
z `docs/booqme-sluzby.csv`, nič nevymýšľaj, krátke texty s tykaním, bez em dash, žiadna zmienka
o AI, dve písma (Lora + Manrope), každý nový text preložiť do `assets/i18n/*.json`, po zmene
spustiť `node tools/build.mjs`, Lighthouse desktop 100 a mobil 95+.

## Cieľ

Web má vyzerať ako tá istá miestnosť, do ktorej zákazník vojde. Dnes je salón nafotený
(12 fotiek v `assets/img/galeria/`), ale fotky žijú len v galérii a zvyšok stránky stojí na
kresbách a všeobecnej tmavozelenej so zlatou. Chcem, aby farby, materiály, značka aj nálada
boli odpísané z fotiek a aby fotky boli tam, kde zákazník rozhoduje.

## Čo je na fotkách (predloha identity)

Pozri si všetkých 12 fotiek, kým čokoľvek zmeníš. Z nich:

| V prevádzke | Na webe |
| --- | --- |
| Svietiace logo: kruh z machu a papradia, v ňom teplý neón, tvár s rukami na hlave, **HEAD SPA** verzálkami, pod tým písané **salon30**, lotos a **NITRA** | značka v lište, v úvode aj v pätičke v tejto skladbe (verzálky Lora + písaný podnázov + lotos); lotos ako jediný ozdobný znak na oddeľovače a odrážky |
| Fľaškovo zelené dvojkrídlové dvere s mosadznými kruhmi | hlavná zelená plochy a tlačidiel druhej úrovne; kruhy ostávajú motívom (dvere v úvode ostávajú, viď CLAUDE.md) |
| Tapeta so zlatohnedými a tmavými tropickými listami | jemný vzor v pozadí svetlejších sekcií, veľmi nízky kontrast, nikdy pod textom |
| Orech, drevená mozaika za logom, parkety rybia kosť | teplý hnedý tón do panelov a kariet (dnes sú zelenočierne), linky a rámiky v tóne dreva |
| Olivové zamatové závesy, olivová stena | druhá zelená, na pásy medzi kapitolami |
| Mosadzné misky, zlaté rámy, teplé LED pásy, sviečky | zlatá ostáva jediným akcentom; žiara ako od LED pásu za logom (spodný teplý svit), nie studený lesk |
| Biele uteráky, orchidey, labute z uterákov | krémová pre svetlé plochy, orchideová ružová najviac ako drobný detail, nie farba rozhrania |
| Vodné vane s modrým a zeleným svetlom | tyrkys vody (`--water`) len pri vode a kroku umývania, nič iné |

Zapíš nové farby ako premenné v `:root` v `assets/style.css` (drevo, oliva, krémová, žiara) a
nahraď nimi literály. Kontrast textu drž aspoň 4,5 : 1, over ho a čísla zapíš do README.

## Fotky tam, kde rozhoduje zákazník

Použi existujúce súbory (každá fotka má `-480/-800/-1200` vo `.avif`, `.webp` a `-800.jpg`),
vždy cez `<picture>` so `srcset`, `width`/`height` a `loading="lazy"` okrem prvej obrazovky.
Návrh, kam čo patrí (uprav, ak sa výrez nehodí):

- **Úvod**: `neon-head-spa` alebo `miestnost` pod tmavým závojom za nadpisom; dvere ostávajú.
  Na mobile menší rez, aby LCP ostalo rýchle (preload len jednej veľkosti).
- **Ako to prebieha / rituál**: `voda`, `lozka-sviecka` (vane s vodou), `zhora`, pri krokoch.
- **Cenník**: jedna fotka na kategóriu v hlavičke kategórie (Head Spa: `lozko`/`spa-relax-lozko`,
  Pre dvoch: `miestnost` alebo `lozka-spa`, Chodidlá: fotka z `docs/poukazky/dl/foto/chodidla.jpg`
  len ak ju prevedieš do formátov ako ostatné).
- **Poukážky**: rovnaké fotky ako na tlačených poukážkach v `docs/poukazky/dl/foto/`, aby web
  a poukaz vyzerali ako jedna vec.
- **Salón 30**: `komoda`, `buddha`, `okna`.
- **Kontakt**: `neon-spa` alebo dvere, aby bolo jasné, čo hľadať na Mostnej.
- **Galéria** ostáva, ale zoraď ju ako prechádzku: dvere, logo, miestnosť, vane, detaily.

Kresby na `<canvas>`, ktoré dnes nahrádzajú fotky, odstráň tam, kde ich nahradí skutočná
fotka. Úvodnú animáciu nerob ťažšiu. Fotky pri animácii nezväčšuj o viac ako 5 %.

Každý `alt` popisuje, čo je na fotke naozaj (a má preklad v šiestich jazykoch).

## Pohyb podľa miestnosti

Len jemne a len s predlohou v prevádzke: teplý svit LED pásu sa pomaly nadýchne pod logom,
plameň sviečky ako jemné blikanie žiary (nie textu), para nad vodou. Pri
`prefers-reduced-motion: reduce` všetko stojí a všetko je viditeľné. Žiadny `backdrop-filter`
na mobile.

## Čo nemeníš

Ceny, názvy a trvania rituálov, kontakty, otváracie hodiny, odkazy na Booqme, poradie jazykov,
štruktúrované dáta (okrem pridania `image` s fotkami
do `DaySpa`, to áno). Nič nové nevymýšľaj; ak chýba informácia, vynechaj ju a napíš mi, čo chýba.

## Výstup

1. Pracuj na vetve podľa `CLAUDE.md`, commity po slovensky, malé a pomenované podľa toho,
   čo sa zmenilo (napríklad „Farby z prevádzky: orech a oliva“, „Fotky v cenníku“).
2. Pred každým commitom `node tools/build.mjs`.
3. Over v prehliadači (Playwright, Chromium je predinštalovaný) na šírke 390 px a 1440 px:
   screenshot každej sekcie pred a po, žiadny vodorovný posun, žiadna chyba v konzole,
   Lighthouse mobil 95+ a desktop 100.
4. Do README dopíš sekciu „Identita z prevádzky“ s tabuľkou fotka → prvok webu a zoznamom,
   kde je ktorá fotka použitá.
5. Na konci mi pošli zoznam zmien a screenshoty pred/po. Na `main` nasaď až po mojom súhlase.
