# Darčekové poukážky HEAD SPA 30

Podľa vzoru od majiteľa: tmavá karta so zlatým rámom, stuhou s mašľou v rohu,
fotografiou v oblúkovom ráme a zlatou pečaťou. Formát DL na šírku, 210 × 99 mm,
tlačové PDF má spadávku 3 mm (216 × 105 mm).

## Päť líc podľa kategórie a spoločný rub

| Súbor | Pre koho | Fotografia |
| --- | --- | --- |
| `poukaz-head-spa` | Head Spa rituály (Classic, Relax, Harmony, Hĺbkový, Beauty, Fruit & Fresh, Signature) | žena pri masáži hlavy |
| `poukaz-pansky` | Gentlemen rituály | muž pri umývadle u barbera |
| `poukaz-detsky` | Little Fruit Head Spa | dieťa v kresle |
| `poukaz-pre-dvoch` | Spoločný Head Spa rituál, Spoločný rituál pod hviezdami | dvojica pri masáži |
| `poukaz-chodidla` | Klasický, Ovocný a bylinkový, Zlatý rituál 24K | masáž chodidiel |
| `poukaz-back` | rub pre všetky: ako poukážku využiť, platnosť 365 dní, QR kód do online kalendára | |

Polia na vyplnenie rukou: Rituál, Pre, Od, Platnosť do, Kód. Poukážka je vždy na
konkrétny rituál, nie na sumu, preto je prvé pole Rituál.

## Kde sú súbory

- `dl/jpg/` v repozitári: JPG 2592 × 1260 px na e-mail a tlač náhľadov; `dl/jpg/booqme/` užšia verzia
  1,4 : 1 bez polí (2352 × 1680 px) pre Booqme a sociálne siete, lebo obchod obrázok oreže na takmer štvorec.
- `dl/png/` a `dl/pdf/` sa generujú (`node dl/build.mjs`), do repozitára sa neukladajú.
  PDF `poukaz-vsetky.pdf` má všetkých päť líc a rub, jednotlivé PDF majú líce a rub.
- `dl/foto/` fotografie z Pexels, autori v `dl/FOTKY.md`. Keď budú vlastné fotky zo
  salónu, nahradia sa pod rovnakými názvami a spustí sa build.

## Booqme

Každý zo 17 typov poukazov v Booqme má obrázok podľa kategórie (skript nahrá PNG
cez pole `photoInput` na stránke úpravy typu poukazu). Obchod s poukazmi:
https://booqme.app/sk/eshop/barbershop-30

## Zmena textov

Texty líc sú v `dl/build.mjs` (`VARIANTY`: nadpis pod čiarou, tri slová kategórie,
jedna veta), texty rubu v tej istej funkcii `back()`. Štýly sú v `dl/poukaz.html`.
Písma sú tie isté ako na webe: Lora a Manrope z `assets/fonts/`.
