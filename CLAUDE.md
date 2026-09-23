# HEAD SPA 30, web salónu v Nitre

Tento súbor číta Claude Code na začiatku každej práce v repozitári. Drž sa ho.

## O čom to je
- Statický web HEAD SPA 30 (Head Spa rituály, súčasť Salónu 30, Mostná 30, Nitra).
- Nasadenie: GitHub Pages z vetvy `main`, adresa https://d8f5s88zjy-art.github.io/head-spa-30/
- Rezervácie a poukazy idú do Booqme: kalendár https://booqme.app/sk/rezervacia/barbershop-30,
  obchod s poukazmi https://booqme.app/sk/eshop/barbershop-30. Formuláre na webe sú druhá cesta.

## Pravidlá obsahu (majiteľ ich dal, nemeň ich)
- Iba to, čo salón ponúka: 17 rituálov (12 Head Spa, 2 pre dvoch, 3 pre chodidlá) z `docs/booqme-sluzby.csv`, nič nevymýšľaj
  (názvy, ceny, trvania, telefón 0911 153 136, adresa). Keď niečo nevieš, spýtaj sa alebo vynechaj.
- Poukaz je vždy na konkrétny rituál, nie na sumu (`docs/booqme-poukazy.csv`).
- Nikde nepíš „Barber shop 30“ ani samostatne „salón 30“ ako názov tohto webu; správne je
  „HEAD SPA 30, pod značkou Salón 30“.
- Žiadna zmienka o AI na webe, v kóde, v commitoch ani v názvoch vetiev.
- Rituály pre chodidlá sú tri (Klasický, Ovocný a bylinkový, Zlatý rituál 24K); žiadny
  strieborný ani zlatý Head Spa rituál, tie salón neponúka.
- Texty krátke, najviac jeden až dva riadky, tykanie, bez pomlčiek typu em dash.
- Šesť jazykov: každý nový text potrebuje kľúč v `assets/i18n/*.json` (kľúč je slovenský text).

## Technika
- Dve písma: Lora (nadpisy, zlatá kurzíva ako jediný akcent, čitateľná aj v malých veľkostiach) a Manrope (text aj štítky).
  Písma sú vyrezané v `assets/fonts/`, nepridávaj ďalšie.
- Zdrojové súbory: `assets/style.css`, `assets/app.js`, `assets/i18n.js` a prémiová vrstva V9
  `assets/premium-v9.css` + `assets/premium-v9.js` (načítava sa po základných súboroch, nič
  z obsahu nemení). Web načítava minifikované verzie, preto po každej zmene spusti
  `node tools/build.mjs` (potrebuje esbuild).
- Úvod je filmový prelet miestnosťou, štyri fotky zo salónu na celú obrazovku (`makeReel`,
  README Úvodná cesta). Pohyb len cez transform a priehľadnosť. Mobil má vlastnú kameru (`CAM_P`)
  a časovanie kapitol (`data-ma`/`data-mb`). Dvere v úvode zostávajú.
- Cieľ: Lighthouse desktop 100, mobil 95 a viac. Žiadny backdrop-filter na mobile.
- Komentáre v kóde po slovensky. Commity po slovensky, bez podpisov a bez odkazov na nástroje.

## Postup nasadenia
1. Práca na vetve `claude/profesionalny-web-l7ozjk`, commit, `git push -u origin <vetva>`.
2. `git checkout main && git merge --ff-only <vetva> && git push origin main`.
3. Overiť naživo (Pages beží zhruba minútu).

## Booqme
- Prihlasovacie údaje nikdy necommituj; skripty ich berú z premenných prostredia.
- Služby: 17 rituálov v 5 kategóriách, poukazy: 17 typov, platnosť 365 dní.
- Platby kartou fungujú až po prepojení Stripe Connect (robí majiteľ v Booqme).

## Nástroje
- `toolbox/` obsahuje skills na dizajn, témy, testovanie a tvorbu skills, plus zoznam zdrojov.
