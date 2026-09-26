# Darčekové poukážky HEAD SPA 30

Podľa nového vzoru od majiteľa (poukážka Head Spa, ktorá ide do tlače): čierny mramor so
zlatými žilkami, zlatá saténová mašľa so stuhou po ľavom okraji (`dl/stuha.png`, vystrihnutá
zo vzoru), lotos a nápis SALON30 · NITRA, zlaté „DARČEKOVÁ“ a písané „poukážka“, fotka vpravo
za zlatým kruhom až po okraj, zlatá olivová vetvička a zlatá pečať s lotosom
(PRE KRAJŠÍ DEŇ · PRE TEBA). Formát DL na šírku, 210 × 99 mm, tlačové PDF má spadávku 3 mm
(216 × 105 mm). Mramor je `dl/mramor.jpg`. V PDF je zlatý text plnou farbou (prechod textom
tlačiarne nespracujú dobre), v JPG má jemný zlatý prechod.

## Štrnásť líc a spoločný rub

Prvé štyri Head Spa rituály majú spoločnú poukážku presne podľa vzoru majiteľa. Každý ďalší
rituál má vlastnú poukážku v tom istom štýle, s názvom rituálu, dĺžkou a fotkou, ktorá
ukazuje práve ten rituál.

| Súbor | Rituál | Fotografia |
| --- | --- | --- |
| `poukaz-head-spa` | Head Spa Classic, Head Spa Relax, Head Spa Harmony, Hĺbkový rituál pre pokožku hlavy | vlastná: zlatý vodný oblúk |
| `poukaz-head-spa-beauty-ritual` | Head Spa Beauty Ritual | pleťová maska štetcom |
| `poukaz-head-spa-fruit-fresh-ritual` | Head Spa Fruit & Fresh Ritual | uhorky na očiach, maska |
| `poukaz-head-spa-signature-ritual` | Head Spa Signature Ritual | vlastná: Budha a sviečky |
| `poukaz-gentlemen-head-spa` | Gentlemen Head Spa | masáž hlavy muža |
| `poukaz-gentlemen-harmony-ritual` | Gentlemen Harmony Ritual | muž s bradou pri masáži |
| `poukaz-gentlemen-deep-scalp-ritual` | Gentlemen Deep Scalp Ritual | masáž pokožky hlavy |
| `poukaz-gentlemen-signature-experience` | Gentlemen Signature Experience | muž v pokoji, ruky na hlave |
| `poukaz-little-fruit-head-spa` | Little Fruit Head Spa | dievča s uhorkami na očiach |
| `poukaz-spolocny-head-spa-ritual` | Spoločný Head Spa rituál | vlastná: dve lôžka zhora |
| `poukaz-spolocny-ritual-pod-hviezdami` | Spoločný rituál pod hviezdami | vlastná: dve lôžka pri sviečke |
| `poukaz-klasicky-ritual-pre-chodidla` | Klasický rituál pre chodidlá | masáž chodidiel |
| `poukaz-ovocny-a-bylinkovy-ritual-pre-chodidla` | Ovocný a bylinkový rituál pre chodidlá | citrus a soľ |
| `poukaz-zlaty-ritual-24k` | Zlatý rituál 24K | chodidlá v kúpeli |
| `poukaz-back` | rub pre všetky: ako poukážku využiť, platnosť 365 dní, QR kód do online kalendára | |

Dlhé názvy (viac ako 21 znakov) sú menším písmom na dva riadky, zlatý prechod má každý riadok zvlášť.

Polia na vyplnenie rukou: Rituál, Pre, Od, Platnosť do, Kód (vzor má štyri, pole Rituál je navyše). Poukážka je vždy na
konkrétny rituál, nie na sumu, preto je prvé pole Rituál.

## Kde sú súbory

- `dl/jpg/` v repozitári: JPG 2592 × 1260 px na e-mail a tlač náhľadov; `dl/jpg/booqme/` užšia verzia
  1,4 : 1 bez polí (2352 × 1680 px) pre Booqme a sociálne siete, lebo obchod obrázok oreže na takmer štvorec.
- `dl/png/` a `dl/pdf/` sa generujú (`node dl/build.mjs`), do repozitára sa neukladajú.
  PDF `poukaz-vsetky.pdf` má všetkých štrnásť líc a rub, jednotlivé PDF majú líce a rub.
- `dl/foto/` fotografie: Head Spa, Signature a oba rituály pre dvoch sú vlastné fotky salónu,
  ostatné sú z Pexels (autori v `dl/FOTKY.md`), kým salón nenafotí vlastné rituály. Nová fotka
  sa uloží pod rovnakým názvom a spustí sa build.

## Booqme

Každý zo 17 typov poukazov v Booqme dostane obrázok zo `dl/jpg/booqme/` podľa tabuľky vyššie
(prvé štyri Head Spa rituály ten istý `poukaz-head-spa`). Skript nahrá obrázok cez pole
`photoInput` na stránke úpravy typu poukazu. Obchod s poukazmi:
https://booqme.app/sk/eshop/barbershop-30

## Zmena textov

Texty líc sú v `dl/build.mjs` (`VARIANTY`: názov rituálu pod čiarou, kategória a dĺžka,
jedna veta z popisu v Booqme), texty rubu v tej istej funkcii `back()`. Štýly sú v `dl/poukaz.html`.
Písma sú tie isté ako na webe: Lora a Manrope z `assets/fonts/`, plus písané Pinyon Script
(`dl/pismo/`, licencia OFL) len na slovo „poukážka“, na webe sa nepoužíva.
