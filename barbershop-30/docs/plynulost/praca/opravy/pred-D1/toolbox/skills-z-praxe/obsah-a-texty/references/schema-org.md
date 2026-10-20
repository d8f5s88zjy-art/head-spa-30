# Štruktúrované dáta (schema.org, JSON-LD) v súlade s textom

Zásada: dáta pre vyhľadávače hovoria **to isté** čo text stránky. Nič, čo nie je overené a viditeľné,
do nich nepatrí (hodnotenie, rok založenia, ocenenie).

## HEAD SPA 30 (`index.html`, jeden `<script type="application/ld+json">` s `@graph`)

| Uzol | Polia | Odkiaľ sa berú |
| --- | --- | --- |
| `["DaySpa","HealthAndBeautyBusiness"]`, `@id` `.../#salon` | `name`, `url`, `image` (og a fotky galérie), `logo`, `telephone`, `email`, `address` (`PostalAddress`), `geo`, `hasMap`, `areaServed`, `currenciesAccepted` | kontakt v `CLAUDE.md` a v sekcii Kontakt |
| | `openingHoursSpecification` (Po až Pi 09:00 až 18:00, So 09:00 až 15:00) | rovnaké ako blok `#nastavenia` (`hodiny`) a text v kontakte |
| | `priceRange` „45 € až 135 €“ | najnižšia a najvyššia cena kariet rituálov |
| | `potentialAction`: `ReserveAction` s `EntryPoint` na kalendár Booqme | rovnaká adresa ako tlačidlá Rezervovať |
| | `hasOfferCatalog`: 17 × `Offer` so `Service` (`name`, `serviceType` = kategória, `provider`, `duration` `PT40M`), `price`, `priceCurrency`, `url` `#id karty`, `availability` | karty `<article id data-min data-price>` |
| | `sameAs`: Instagram | odkazy na siete na stránke |
| `WebSite` `.../#web` | `name`, `inLanguage` `sk-SK`, `publisher` → `#salon` | |
| `FAQPage` `.../#faq` | 17 × `Question` s `acceptedAnswer` | `.faq-item` na stránke, rovnaký text |

Fúkaná a žehlenie (služby v `li[data-booqme]`) v ponukách nie sú; `priceRange` sa počíta z rituálov.

## BARBERSHOP 30 (`barbershop-30/index.html`)

Jeden objekt `BarberShop`: `name`, `alternateName` (zápis z právnych údajov), `foundingDate` „2019“
(overený rok z webu podniku, nie nesúhlasné tvrdenie majiteľa), adresa, hodiny, `sameAs` (Instagram,
Facebook), `potentialAction` `ReserveAction` s `target` na vlastný rezervačný systém podniku,
`hasOfferCatalog` s 15 ponukami (názov a cena, bez `url`). Žiadne `aggregateRating`: hodnotenie
z tretej strany je na webe len odkazom (`CONTENT_SOURCES.md`).

## Ako dáta držať zhodné

1. Zmena ceny, dĺžky alebo názvu služby = zmena karty **aj** ponuky. Párovanie je cez `url` končiace
   `#<id karty>`; `id` karty sa preto nemení, ani keď sa zmení názov (HEAD SPA 30 má `id` ešte zo
   starých slovenských názvov, napr. `relaxacny-head-spa` pre Head Spa Relax).
2. Zmena rozpätia = `priceRange`, meta popis, odpoveď v otázkach, preklady.
3. Zmena otázky alebo odpovede = `FAQPage` (admin ju zosúladí podľa textu na stránke, ak počet otázok sedí;
   inak nechá dáta bez zmeny a upozorní).
4. Zmena siete = `sameAs` (admin zosúladí).
5. Kontrola z koreňa projektu: `python3 -I toolbox/skills-z-praxe/obsah-a-texty/scripts/ld-zhoda.py index.html` (ponuky s `#id` proti kartám, ponuky bez `#id`
   aspoň proti textu stránky, `priceRange`, FAQ). Na BARBERSHOP 30 aj HEAD SPA 30 dnes hlási zhodu.

## Ako to robí admin (`admin/index.html`, ukladanie)

```js
const reLd = /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/;
const ld = JSON.parse(html.match(reLd)[2]);
...
const off = offers.find((x) => String(x.url || '').endsWith('#' + r.id));
if (off) { off.price = String(price); if (off.itemOffered) off.itemOffered.duration = `PT${min}M`; }
...
biz.priceRange = `${n4[2]} € až ${n4[3]} €`;
```

JSON sa načíta ako objekt, upraví a zapíše späť celý, len ak sa naozaj zmenil. Regulárne úpravy
JSON textu by sa ľahko pokazili; objekt nie.

## Pasce

- **Dáta bez textu**: číslo, ktoré nie je na stránke (hodnotenie 5,0, počet recenzií), do dát nedávaj.
- **Dva zdroje hodín**: hodiny v texte, v schéme a v skripte musia byť rovnaké naraz (README, Kontakt).
- **Adresa rezervácie** v `ReserveAction` sa mení spolu s tlačidlami (pri presune Booqme z
  `barbershop-30` na `salon-30-head-spa` sa menila aj táto hodnota).
- **Pri presune domény** zmeň `@id`, `url`, `image`, `canonical`, `og:url`, `og:image` a `hreflang`
  (README, Nasadenie; balík pre FTP prepisuje adresy skriptom `tools/ftp-balik.sh`).
