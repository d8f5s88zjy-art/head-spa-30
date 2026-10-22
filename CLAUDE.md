# HEAD SPA 30, web salónu v Nitre

Tento súbor číta Claude Code na začiatku každej práce v repozitári. Drž sa ho.

## O čom to je
- Statický web HEAD SPA 30 (Head Spa rituály, Mostná 30, Nitra). HEAD SPA 30 je samostatná časť
  s vlastným tímom, sídli v priestoroch Salónu 30.
- Nasadenie: GitHub Pages z vetvy `main`, adresa https://d8f5s88zjy-art.github.io/head-spa-30/
- Rezervácie a poukazy idú do Booqme: kalendár https://booqme.app/sk/rezervacia/salon-30-head-spa,
  obchod s poukazmi https://booqme.app/sk/eshop/salon-30-head-spa. Na webe nie sú žiadne formuláre, každé tlačidlo vedie rovno do Booqme.

## Pracovné preferencie zadávateľa (zapísané 2026‑10‑21, platia pre všetky weby v repozitári)
- So mnou komunikuj po slovensky. Texty pre zákazníkov (web, asistent) píš prirodzenou, gramaticky správnou slovenčinou.
- Telefón je hlavný zážitok: žiadne prázdne čierne plochy, čierne okraje médií, prázdne kontajnery po skrytom videu,
  vodorovné pretekanie ani prekrývajúce sa ovládače. Kontroluj 360, 390 a 430 px, tablet aj počítač a vždy rozlíš
  emuláciu v prehliadači od skúšky na skutočnom zariadení.
- Pohyb má zmysel a filmový rytmus (presné strihy, kontrolované odhalenia, jemná hĺbka, odozva tlačidiel). Žiadny únos
  skrolu, blikanie, dlhé úvody ani animácie, ktoré zdržia informácie. Obsah musí byť vidieť aj bez skriptu, rešpektuj
  prefers-reduced-motion a slabšie zariadenia zjednoduš.
- Video na telefóne len ostré, dobre orezané a úsporné; inak kvalitná fotka s pokojným pohybom. Snímkovú frekvenciu
  nikdy nefalšuj (metadáta, zdvojené snímky) a dopočítané snímky (interpoláciu) vždy priznaj.
- Dizajn vedie k objednávke: hlavná akcia „Objednať sa“ (skutočný rezervačný systém), „Zavolať a potvrdiť termín“
  s fungujúcim tel: na overené číslo. Každé tlačidlo vedie k skutočnej akcii; úspešnú rezerváciu nikdy neukazuj bez
  skutočného potvrdenia.
- AI asistent Barber (okno na webe Barbershop 30, ikona je ich logo) je zreteľne označený ako AI; je to výslovná výnimka zadávateľa z pravidla
  „žiadna zmienka o AI“, len pre okno asistenta a jeho stránku o ochrane údajov. Odpovedá poctivo len z overených
  údajov; voľné termíny len z overeného, aktuálneho kalendára, vždy ako predbežné a s telefónom („Zavolaj nám,
  v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme.“). Nikdy nevymýšľaj termíny, otváracie hodiny ani 24/7.
- Neznáme rozhrania over v oficiálnej dokumentácii a otestuj; netvrď, že niečo funguje, kým to nie je overené.
- Pred zverejnením (zlúčenie do `main`, nasadenie), odosielaním správ von alebo väčšou útratou kreditov sa vždy opýtaj.
  Najprv priprav konkrétny výsledok na kontrolu (náhľad, snímky).

## Pravidlá obsahu (majiteľ ich dal, nemeň ich)
- Recenzie len doslovne a len z vlastných profilov HEAD SPA 30, nikdy zo Salónu 30 (docs/recenzie.md).
- Iba to, čo salón ponúka: 17 rituálov (12 Head Spa, 2 pre dvoch, 3 pre chodidlá) z `docs/booqme-sluzby.csv`, nič nevymýšľaj
  (názvy, ceny, trvania, telefón 0911 153 136, adresa). Keď niečo nevieš, spýtaj sa alebo vynechaj.
- Poukaz je vždy na konkrétny rituál, nie na sumu (`docs/booqme-poukazy.csv`).
- Ceny, dĺžky a obsah rituálov sa riadia online kalendárom Booqme (salón ich mení tam). Po zmene v Booqme
  sa web zosúladí a `node tools/booqme-kontrola.mjs` musí hlásiť, že kalendár sedí. Fúkaná a žehlenie sú
  v online kalendári HEAD SPA 30 (pridal ich salón), preto sú v cenníku pod rituálmi v časti Fúkaná a žehlenie
  (`li[data-booqme]`); nie sú to rituály a poukaz sa na ne nepredáva.
- Nikde nepíš „Barber shop 30“ ani „salón 30“ ako názov tohto webu. HEAD SPA 30 je samostatná časť
  s vlastným tímom v priestoroch Salónu 30; o majiteľovi sa na webe nepíše nič. Salón 30 sa môže spomenúť
  (odkaz www.salon30.sk), ale nie ako by bol HEAD SPA 30 jeho súčasťou alebo značkou. Služby Salónu 30 (kaderníctvo, kozmetika) na web nepatria.
- Žiadna zmienka o AI na webe, v kóde, v commitoch ani v názvoch vetiev. (Výnimka: okno AI asistenta Barbershopu 30, pozri Pracovné preferencie.)
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
Nasadzuj (kroky 2 a 3) až so súhlasom zadávateľa; dovtedy práca ostáva na vetve.
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
- `toolbox/skills-z-praxe/` sú naše overené postupy z prác na weboch (film z fotiek, plynulé video, výkon,
  testy a nasadenie, texty, Booqme, Instagram, učenie z videí, workflowy). Pred podobnou prácou si prečítaj príslušný SKILL.md.
- Prevádzka webu (nahratie na headspa30.sk, Booqme, poukážky): `toolbox/head-spa-30/SKILL.md`.
- Asistent na otázky na webe Barbershop 30 (`asistent/`, server na headspa30.sk): `asistent/README.md`. Po zmene
  cenníka, hodín alebo tímu Barbershopu zmeň aj `asistent/znalosti/barbershop.md` a `barbershop-otazky.json`.
- Záznam postupu na Barbershop 30 (hotové, rozpracované, čo čaká na zadávateľa): `barbershop-30/docs/POSTUP.md`.
  Prečítaj ho pred prácou na Barbershope a po každom kroku ho doplň.
