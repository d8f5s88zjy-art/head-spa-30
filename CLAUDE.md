# HEAD SPA 30, web salónu v Nitre

Tento súbor číta Claude Code na začiatku každej práce v repozitári. Drž sa ho.

## O čom to je
- Statický web HEAD SPA 30 (Head Spa rituály, Mostná 30, Nitra). HEAD SPA 30 je samostatná časť
  s vlastným tímom, sídli v priestoroch Salónu 30.
- Nasadenie: GitHub Pages z vetvy `main`, adresa https://d8f5s88zjy-art.github.io/head-spa-30/
- Rezervácie a poukazy idú do Booqme: kalendár https://booqme.app/sk/rezervacia/barbershop-30,
  obchod s poukazmi https://booqme.app/sk/eshop/barbershop-30. Na webe nie sú žiadne formuláre, každé tlačidlo vedie rovno do Booqme.

## Pravidlá obsahu (majiteľ ich dal, nemeň ich)
- Iba to, čo salón ponúka: 17 rituálov (12 Head Spa, 2 pre dvoch, 3 pre chodidlá) z `docs/booqme-sluzby.csv`, nič nevymýšľaj
  (názvy, ceny, trvania, telefón 0911 153 136, adresa). Keď niečo nevieš, spýtaj sa alebo vynechaj.
- Poukaz je vždy na konkrétny rituál, nie na sumu (`docs/booqme-poukazy.csv`).
- Nikde nepíš „Barber shop 30“ ani „salón 30“ ako názov tohto webu. HEAD SPA 30 je samostatná časť
  s vlastným tímom v priestoroch Salónu 30; o majiteľovi sa na webe nepíše nič. Salón 30 sa môže spomenúť
  (odkaz www.salon30.sk), ale nie ako by bol HEAD SPA 30 jeho súčasťou alebo značkou. Služby Salónu 30 (kaderníctvo, kozmetika) na web nepatria.
- Žiadna zmienka o AI na webe, v kóde, v commitoch ani v názvoch vetiev.
- Rituály pre chodidlá sú tri (Klasický, Ovocný a bylinkový, Zlatý rituál 24K); žiadny
  strieborný ani zlatý Head Spa rituál, tie salón neponúka.
- Texty krátke, najviac jeden až dva riadky, tykanie, bez pomlčiek typu em dash.
- Šesť jazykov: každý nový text potrebuje kľúč v `assets/i18n/*.json` (kľúč je slovenský text).

## Technika
- Dve písma: Lora (nadpisy, zlatá kurzíva ako jediný akcent, čitateľná aj v malých veľkostiach) a Manrope (text aj štítky).
  Písma sú vyrezané v `assets/fonts/`, nepridávaj ďalšie.
- Zdrojové súbory: `assets/style.css`, `assets/app.js`, `assets/i18n.js`. Vrstva V9
  (`assets/premium-v9.*`) sa už nenačítava, jej efekty pôsobili lacno. Web načítava
  minifikované verzie, preto po každej zmene spusti `node tools/build.mjs` (potrebuje esbuild).
- Štýl je elegantný a zdržanlivý (sekcia Luxusná vrstva na konci `assets/style.css`):
  veľa priestoru, vlasové linky namiesto kariet, ploché hranaté tlačidlá s verzálkami,
  rádius 2 px, zlatá len ako detail, žiadne žiary, prechody farieb, efekty pod kurzorom,
  čiastočky ani poskakovanie. Rituály sú v pokojných okienkach (tenký rámik, bez ikon).
  Čitateľnosť má prednosť: tlačidlá, odkazy, filtre a popisky polí normálnym písmom (verzálky
  len na malých nadpiskoch sekcií), polia formulára ako zreteľné okienka. Žiadna zelená plocha,
  všetko v tónoch orecha so zlatou. Časti oddeľuje zlatá linka s lotosom, obsah sa pri
  skrolovaní nevysúva ani neskladá. Nepridávaj ozdoby navyše.
- Pozadie webu je film zo skutočných fotiek salónu s hĺbkovou mapou (`assets/world.js`,
  `assets/img/film/`, README Film zo skutočných fotiek). Nič vymodelované, fotky bez tónovania
  (len vinetácia a krátke šero pri prelínaní). Kreslí pri pohybe a v pokoji ešte 25 s jemné
  dýchanie kamery 30 snímok za sekundu, potom stojí. Záloha je pokojný úvod s fotkou (`makeReel`).
- Dvere v úvode zostávajú a sú skutočné: fotka dverí salónu, krídla sa otvoria dnu (README Úvodné dvere).
- Cieľ: Lighthouse desktop 100, mobil 95 a viac. Žiadny backdrop-filter na mobile.
- Komentáre v kóde po slovensky. Commity po slovensky, bez podpisov a bez odkazov na nástroje.

## Postup nasadenia
0. Admin (`admin/`) ukladá priamo do `main`, preto pred prácou `git fetch origin main && git merge origin/main`.
1. Práca na vetve `claude/head-spa-30-page-uil3m0`, commit, `git push -u origin <vetva>`.
2. `git checkout main && git merge --ff-only <vetva> && git push origin main`.
3. Overiť naživo (Pages beží zhruba minútu).

## Booqme
- Prihlasovacie údaje nikdy necommituj; skripty ich berú z premenných prostredia.
- Služby: 17 rituálov v 5 kategóriách, poukazy: 17 typov, platnosť 365 dní.
- Platby kartou fungujú až po prepojení Stripe Connect (robí majiteľ v Booqme).

## Nástroje
- `toolbox/` obsahuje skills na dizajn, témy, testovanie a tvorbu skills, plus zoznam zdrojov.
