# Darčekové poukážky HEAD SPA 30

Podľa vzoru salónu (poukážka Head Spa na webe, `assets/img/poukaz/vzor-*`): čierny mramor so
zlatými žilkami, zlatá saténová mašľa so stuhou po ľavom okraji (`dl/stuha.png`), lotos a nápis
SALON30 · NITRA, zlaté „DARČEKOVÁ“ a písané „poukážka“, fotka vpravo za zlatým kruhom až po okraj,
zlatá olivová vetvička a zlatá pečať s lotosom (PRE KRAJŠÍ DEŇ · PRE VÁS). Texty vykajú ako vzor.
Formát DL na šírku, 210 × 99 mm, tlačové PDF má spadávku 3 mm (216 × 105 mm). Mramor je
`dl/mramor.jpg`. V PDF je zlatý text plnou farbou (prechod textom tlačiarne nespracujú dobre),
v JPG má jemný zlatý prechod. Nikde nie je barbershop: web je www.headspa30.sk, online kalendár
a QR kód vedú na booqme.app/salon-30-head-spa. (Vzor salónu má v spodnom riadku salon30nitra.sk,
taká doména zatiaľ neexistuje, preto je na poukážkach www.headspa30.sk, ktorá vedie na tento web.)

## Osemnásť líc a spoločný rub

Všeobecná poukážka Head Spa (Relax • Obnova • Harmónia) a vlastná poukážka pre každý zo 17 rituálov
z webu, s názvom rituálu, druhom, dĺžkou a jednou vetou z webu. Žiadne sumy, poukážka je vždy na rituál.

| Súbor | Rituál | Fotografia |
| --- | --- | --- |
| `poukaz-head-spa` | všeobecná Head Spa | vlastná: zlatý vodný oblúk |
| `poukaz-head-spa-classic` | Head Spa Classic | vlastná: neónový nápis HEAD SPA salon30 |
| `poukaz-head-spa-relax` | Head Spa Relax | vlastná: nápis SPA relax nad lôžkom |
| `poukaz-head-spa-harmony` | Head Spa Harmony | vlastná: lôžko s orchideami a sviečkami |
| `poukaz-hlbkovy-ritual-pre-pokozku-hlavy` | Hĺbkový rituál pre pokožku hlavy | vlastná: miestnosť s vodným oblúkom |
| `poukaz-head-spa-beauty-ritual` | Head Spa Beauty Ritual | pleťová maska štetcom |
| `poukaz-head-spa-fruit-fresh-ritual` | Head Spa Fruit & Fresh Ritual | uhorky na očiach, maska |
| `poukaz-head-spa-signature-ritual` | Head Spa Signature Ritual | vlastná: Budha a sviečky |
| `poukaz-gentlemen-head-spa` | Gentlemen Head Spa | masáž hlavy muža |
| `poukaz-gentlemen-harmony-ritual` | Gentlemen Harmony Ritual | muž s bradou pri masáži |
| `poukaz-gentlemen-deep-scalp-ritual` | Gentlemen Deep Scalp Ritual | vlastná: komoda s uterákmi a Budhom |
| `poukaz-gentlemen-signature-experience` | Gentlemen Signature Experience | muž v pokoji, ruky na hlave |
| `poukaz-little-fruit-head-spa` | Little Fruit Head Spa | dievča s uhorkami na očiach |
| `poukaz-spolocny-head-spa-ritual` | Spoločný Head Spa rituál | vlastná: dve lôžka zhora |
| `poukaz-spolocny-ritual-pod-hviezdami` | Spoločný rituál pod hviezdami | vlastná: dve lôžka pri sviečke |
| `poukaz-klasicky-ritual-pre-chodidla` | Klasický rituál pre chodidlá | masáž chodidiel |
| `poukaz-ovocny-a-bylinkovy-ritual-pre-chodidla` | Ovocný a bylinkový rituál pre chodidlá | citrus a soľ |
| `poukaz-zlaty-ritual-24k` | Zlatý rituál 24K | chodidlá v kúpeli |
| `poukaz-back` | rub pre všetky: ako poukážku využiť, platnosť 365 dní, QR kód do online kalendára | |

Dlhé názvy (viac ako 21 znakov) sú menším písmom na dva riadky, zlatý prechod má každý riadok zvlášť.

Polia na vyplnenie rukou ako vo vzore: Pre, Od, Platnosť do, Kód.

## Kde sú súbory

- `dl/jpg/` v repozitári: JPG 2592 × 1260 px na e-mail a tlač náhľadov; `dl/jpg/booqme/` užšia verzia
  1,4 : 1 bez polí (2352 × 1680 px) pre Booqme a sociálne siete, lebo obchod obrázok oreže na takmer štvorec.
- `dl/png/` a `dl/pdf/` sa generujú (`node dl/build.mjs`), do repozitára sa neukladajú.
  PDF `poukaz-vsetky.pdf` má všetkých osemnásť líc a rub, jednotlivé PDF majú líce a rub.
- `dl/foto/` fotografie: Head Spa, Classic, Relax, Harmony, Hĺbkový rituál, Signature, Gentlemen Deep Scalp a oba rituály pre dvoch sú vlastné fotky salónu,
  ostatné sú z Pexels (autori v `dl/FOTKY.md`), kým salón nenafotí vlastné rituály. Nová fotka
  sa uloží pod rovnakým názvom a spustí sa build.

## Booqme

Každý zo 17 typov poukazov v Booqme dostane obrázok zo `dl/jpg/booqme/` podľa tabuľky vyššie
(každý rituál vlastný). Skript nahrá obrázok cez pole
`photoInput` na stránke úpravy typu poukazu. Obchod s poukazmi:
https://booqme.app/sk/eshop/salon-30-head-spa

## Motívy rituálov

Ovocné rituály majú namiesto olivovej vetvičky ovocnú vetvičku v zlatej razbe (`dl/motivy.mjs`):
Head Spa Fruit & Fresh Ritual čerešne, plátok pomaranča a jahodu, Little Fruit Head Spa jahody
a čerešne, Ovocný a bylinkový rituál pre chodidlá rozmarín, plátky citróna a pomaranča a mätu.
Spoločný rituál pod hviezdami má pri oblúku fotky zlaté hviezdy, Zlatý rituál 24K plátkové zlato.
Motív sa volí poľom `motiv` vo `VARIANTY`.

## Zmena textov

Texty líc sú v `dl/build.mjs` (`VARIANTY`: názov rituálu pod čiarou, druh a dĺžka, jedna veta
z webu, `web` je id karty rituálu na stránke), texty rubu vo funkcii `back()`, adresa webu a kalendára
v konštantách `WEB` a `KALENDAR`. QR kód je statický `dl/qr-kalendar.png` (420 × 420 px, vyrobený knižnicou
segno z https://booqme.app/salon-30-head-spa): pri zmene `KALENDAR` treba vyrobiť aj nový QR. Rýchly náhľad bez PDF: `NOPDF=1 node build.mjs`. Štýly sú v `dl/poukaz.html`. Build zapíše aj `dl/varianty.json`.
Na web idú poukážky rituálov ako `assets/img/poukaz/<súbor bez poukaz->-{480,800,1290}.{avif,webp}`
a `-800.jpg` (z `dl/png/`), pás s nimi je v sekcii Poukazy pod poukážkou salónu.
Písma sú tie isté ako na webe: Lora a Manrope z `assets/fonts/`, plus písané Pinyon Script
(`dl/pismo/`, licencia OFL) len na slovo „poukážka“, na webe sa nepoužíva.
