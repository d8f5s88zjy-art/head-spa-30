# Booqme: rezervácie a poukazy HEAD SPA 30

Stav overený 11. 10. 2026. Profil v Booqme sa volá „Salon 30 - Head Spa“ (property 7494).

## Adresy

| Čo | Adresa |
| --- | --- |
| Rezervácia | https://booqme.app/sk/rezervacia/salon-30-head-spa (krátko: https://booqme.app/salon-30-head-spa) |
| Obchod s poukazmi | https://booqme.app/sk/eshop/salon-30-head-spa |
| Iné jazyky | `/cs/rezervace/`, `/hu/foglalas/`, `/en/`, `/de/`, `/pl/` a `/uk/reservation/`; eshop vždy `/{jazyk}/eshop/` (web prepína sám, `booqmeLang` v app.js) |
| Administrácia | https://dashboard.booqme.app (prihlásenie e-mailom a heslom alebo cez Google) |
| Typy poukazov | https://dashboard.booqme.app/gift-cards/types |
| Úprava poukazu | https://dashboard.booqme.app/gift-cards/types/edit/{ID} (cesta existuje, bez prihlásenia presmeruje na login) |

Stará adresa `booqme.app/sk/rezervacia/barbershop-30` (aj eshop) vracia 404. Ak sa niekde ešte objaví
(Instagram, Google, starý web), rezervácia tam nefunguje.

## Služby v kalendári

17 rituálov a 4 kadernícke služby (fúkaná a žehlenie), pracovníčky Simona a Vanesa. Ceny a dĺžky
sa zhodujú s webom (`node tools/booqme-kontrola.mjs`). Kalendár ponúka aj sviatky (24. – 26. 12., 1. 1., 6. 1.),
salón ich má zablokovať, ak je zatvorené.

Rezervačná stránka je verejné HTML: služby majú `data-service_name`, popis má tvar
„Popis. Obsah rituálu: krok · krok · …“. Oba Signature rituály majú v Booqme dva zoznamy „Obsah rituálu“
(krátky a plný).

Test rezervácie bez odoslania: Playwright, kategória, služba, pracovník, dátum; zastaviť pred formulárom
s údajmi. Chromium v kontajneri nedôveruje certifikátu proxy: `newContext({ ignoreHTTPSErrors: true })`.

## Keď salón zmení ceny alebo obsah v Booqme

Booqme je zdroj pravdy, web sa zosúladí. Miesta, ktoré sa menia:

- `index.html`: `<article data-min data-price data-id>`, cena v `.meta strong`, zoznam krokov `<ol>`,
  kadernícke služby v `#fukana` (`li[data-booqme][data-min][data-price]`);
- JSON-LD (offers, priceRange), meta description a rozsah cien v otázkach;
- `admin/index.html`;
- kľúče zmenených textov vo všetkých šiestich `assets/i18n/*.json`;
- `docs/booqme-sluzby.csv` a `docs/booqme-poukazy.csv` (oddeľovač `;`, konce riadkov CRLF ponechať);
- potom `docs/poukazky/sablona/ceny.py`, `export.py` a nové ceny poukazov v obchode Booqme.

Overenie: `node tools/booqme-kontrola.mjs` musí hlásiť, že kalendár sedí.

## Poukazy (17 typov)

| ID | Poukaz | Cena (kalendár) |
| --- | --- | --- |
| 2342 | Head Spa Classic | 50 € |
| 2343 | Head Spa Relax | 67 € |
| 2344 | Head Spa Harmony | 86 € |
| 2345 | Hĺbkový rituál pre pokožku hlavy | 88 € |
| 2346 | Head Spa Beauty Ritual | 73 € |
| 2347 | Head Spa Fruit & Fresh Ritual | 80 € |
| 2348 | Head Spa Signature Ritual | 123 € |
| 2349 | Gentlemen Head Spa | 55 € |
| 2350 | Gentlemen Harmony Ritual | 61 € |
| 2351 | Gentlemen Deep Scalp Ritual | 80 € |
| 2352 | Gentlemen Signature Experience | 92 € |
| 2353 | Little Fruit Head Spa | 55 € |
| 2354 | Spoločný Head Spa rituál | 123 € |
| 2355 | Spoločný rituál pod hviezdami | 135 € |
| 2360 | Klasický rituál pre chodidlá | 45 € |
| 2361 | Ovocný a bylinkový rituál pre chodidlá | 55 € |
| 2362 | Zlatý rituál 24K | 110 € |

Názov v obchode je vždy „Poukaz: {názov rituálu}“. Aktuálny stav obchodu (cena, dátum obrázka)
vypíše `scripts/booqme-poukazy.py`.

Obrázok poukazu sa nahráva poľom `photoInput` na stránke úpravy typu poukazu (do 10 MB, png alebo jpg).
Obchod ho ukazuje v ráme vysokom 200 px s object-fit: cover; šírka rámu podľa okna: 320 px → 241,
390 → 311 až 318, 414 až 767 → 318, 768 → 192, 992 → 192, 1280 a viac → 263. Preto obrázky do Booqme
robíme **1600 × 1200 (4 : 3)** s poukážkou 2 : 1 na celú šírku v strede (`docs/poukazky/sablona/export.py`,
simulácia orezu `scripts/vyrez-booqme.py`). Obrázky nahraté 22. 9. majú v obchode 1400 × 1000 (či ich Booqme
zmenšuje, nie je isté). Booqme pravdepodobne používa ten istý obrázok aj ako pozadie PDF poukazu
pre zákazníka (nepotvrdené).

Na ručnú výmenu: `python3 toolbox/head-spa-30/scripts/booqme-balik.py <cieľ> --stranka` vyrobí ZIP
s obrázkami a postupom a stránku do mobilu (obrázok, stará a nová cena, odkaz na úpravu, odškrtávanie).
Stránku možno zverejniť ako súkromnú a zdieľať správcovi salónu.

## Prihlásenie

Prihlásenie do Booqme robí majiteľ alebo správca salónu sám. Prihlasovacie údaje sa neposielajú
do chatu ani správou; ak tam predsa skončia, nepoužívať ich a odporučiť zmenu hesla.

Ak má výmenu robiť skript, majiteľ uloží údaje do nastavení prostredia ako `BOOQME_EMAIL`
a `BOOQME_HESLO` (načíta ich až nová relácia) a skript ich číta len z premenných prostredia
(pravidlo v CLAUDE.md). Prihlasovací formulár: `#loginForm` s poľami `#loginEmail` a `#loginPassword`;
cookies držať len dočasne a po práci zmazať. Takto boli nahraté obrázky 22. 9. (commit 94ad3dd).

Bezpečnejšia možnosť: zamestnanecký účet v Booqme s vlastným e-mailom a právomocami po sekciách
(Rezervácie, Zákazníci, Služby, Transakcie, Nastavenia…, zmena sa prejaví do 10 minút); či existuje
samostatné právo na poukazy, nie je overené. Verejné API pre tento balík Booqme nemá (len v Ultimate).

## Booqme v skratke (z booqme.app, 11. 10. 2026)

- Webový rezervačný systém od DigitalFox s.r.o. (Kysucká 14C, Senec), podpora po slovensky po – pi 9 – 16,
  +421 918 793 080. Bez natívnej aplikácie (webová aplikácia na plochu).
- Balíky (ročne, bez DPH): Starter 0 € (50 rez./mes.; FAQ uvádza 100), Lite 6,90 € (100), Business 16,90 € (500),
  Ultimate 26,90 € (neobmedzene). Mesačne 9,90 / 19,90 / 29,90 €. Počet zamestnancov neobmedzený vo všetkých.
- Po prekročení limitu Booqme blokuje nové rezervácie do konca mesiaca alebo do zvýšenia balíka.
- Bez provízie z rezervácií. Online platby cez Stripe Connect priamo na účet salónu, 0,49 % Booqme + Stripe
  (spolu od 1,99 %), minimálna platba 3 €. SMS 0,07 € s DPH za 70 znakov.
- Silné stránky: cena nezávisí od počtu ľudí, žiadna provízia, lacné SMS, vernostné karty v Apple a Google
  Wallet, zákazník si sám presunie termín, poukazy a zálohy v každom balíku.
- Slabé stránky: žiadny katalóg ani aplikácia, ktorá by priviedla nových klientov (Reservio má reservio.sk),
  nízke limity lacných balíkov, platby len cez Stripe, čakacia listina len v Ultimate, menšia firma,
  takmer žiadne nezávislé recenzie (5,0 / 71 je len na ich webe), web si miestami protirečí.
- Porovnanie: Bookio (2 používatelia a 1 000 rez. za 14,90 € je lacnejší pre malý tím), Reservio (katalóg
  v SK/CZ, natívne aplikácie, vyššie poplatky za platby na nižších balíkoch), Fresha a Booksy (veľké
  katalógy, v Nitre takmer bez zákazníkov, 20 – 30 % z nových klientov).
- Otázka „Čo je Booqme…“ je predvyplnená na booqme.app pre AI asistentov; odpoveď opierať o ich obchodné
  podmienky a cenníky konkurencie, nie o ich marketing.
