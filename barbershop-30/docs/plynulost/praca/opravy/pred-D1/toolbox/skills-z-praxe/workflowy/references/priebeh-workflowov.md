# Priebeh workflowov, ktoré sme spustili

Poradie je časové (október 2026, web BARBERSHOP 30 a potom tento toolbox). Pri každom: cieľ, fázy, čo dostali
agenti, čo vrátili, výsledok v repozitári a lekcia. Skripty sú v [`../priklady/`](../priklady/); počty agentov
sú spočítané z kódu. Výsledky sú zapísané v `barbershop-30/docs/` (CHECKS.md, INTEGRATION_LOG.md, CONTENT_SOURCES.md,
MEDIA_SELECTION.md); správy kontrolórov `docs/reviews/*.md` v repozitári nie sú.

## 1. Audit podkladov (`audit-webu.js`, 6 agentov)

- **Cieľ**: pred stavbou zistiť, čo o podniku naozaj vieme, čo je na fotkách, aké pravidlá plynú z dodaných
  referencií a či funguje technika (three.js, písma, screenshoty WebGL v headless Chromiu).
- **Fázy naraz**: výskum (WebSearch a WebFetch načítané cez ToolSearch, dotazy po slovensky aj anglicky, `effort: 'high'`),
  fotky (45 súborov v troch dávkach po 15, každú fotku otvoriť nástrojom Read, rozmery cez PIL), referencie
  (najviac 80 pravidiel, každé jedna overiteľná veta so zdrojom), technika.
- **Výstup**: `{ business, photos, photo_batch_notes, refs, tech }`; pri fotkách bod záujmu (`focal_x`, `focal_y`),
  `alt_sk`, `people_visible`, `near_duplicate_of`.
- **Výsledok**: `CONTENT_SOURCES.md` (dátum získania 2026-10-09) má prvé tri stupne zo schémy po slovensky
  (overené‑oficiálne, tretia strana, slabé), namiesto `not-found` stupeň neoverené; polia fotiek ako
  v `MEDIA_SELECTION.md` (focal, alt, ľudia).
- **Lekcia**: údaje iného podniku na tej istej adrese treba výslovne oddeliť („údaje Salónu 30 NIE sú údaje
  barbershopu“); nedostupné zdroje zapisovať (`blocked_sources`), nie obchádzať hádaním.

## 2. Stavba po moduloch (`stavba-webu.js`, 4 agenti)

- **Cieľ**: prvá verzia webu.
- **Fázy**: Stavba (3D kreslo, stránka s obsahom, režisér `app.js` naraz cez `Promise.all`), Integrácia.
- **Vstupy**: `docs/CONTRACT.md` (záväzné rozhrania), `SCENE_MAP.md`, `ART_DIRECTION.md`, `CONTENT_SOURCES.md`,
  `MEDIA_SELECTION.md`, `assets/img/manifest.json` (práve sa generoval skriptom, agent má počkať), nástroj
  `source/shot.mjs` s presnými parametrami.
- **Výstup**: `RESULT` s poľom `notes_for_integrator`. Integrátor zjednotí názvy podľa kontraktu, napíše
  `scenes-shot.mjs`, odfotí sedem scén na počítači aj telefóne, každú snímku otvorí, opraví a zapíše
  `docs/INTEGRATION_LOG.md`.
- **Lekcia**: autor 3D kresla mal iterovať aspoň trikrát a ukladať porovnávacie snímky
  (`docs/screenshots/kreslo-iteracia-N.png`). Smer s 3D kreslom majiteľ neskôr zrušil (pozri 4).

## 3. Integrácia a štyri kontroly (`integracia-a-kontrola.js`, 6 agentov)

- **Cieľ**: spojiť moduly s 3D modelom kresla a videami, nechať web nezávisle skontrolovať a opraviť.
- **Fázy**: Integrácia (záväzné „REŽISÉRSKE ROZHODNUTIA“ A až G: materiál, kompozícia scén, postery, videá,
  presunuteľnosť do samostatného repozitára, snímkovací skript, mapa scén), Kontrola (prístupnosť a odolnosť,
  pravdivosť a SEO, výkon, kreatívny posudok naraz), Oprava.
- **Vstupy kontrolórov**: spoločný kontext, stav po integrácii (súhrn a otvorené body), pravidlo „Web NEUPRAVUJ“.
  Pravdivosť porovnáva všetkých 15 cien a trvaní strojovo so zdrojom; výkon meria Playwright s CDP (telefón 390×844,
  4× CPU, Slow 4G) a uvádza podmienky (SwiftShader nie je GPU).
- **Výstup**: `REVIEW` (verdikt, spustené kontroly, nálezy so závažnosťou a dôkazom, cesta k správe); opravár
  dostane nálezy blocker, high a medium zoradené a zapíše `docs/CHECKS.md` a `docs/COMPARISON.md`.
- **Lekcia**: ak integrátor zlyhá, workflow skončí („kontrola sa neskúša na nehotovom webe“).

## 4. Prestavba na prehliadku (`prehliadka-filmu.js`, 8 agentov, 2026-10-09)

- **Cieľ**: nový smer majiteľa, prehliadka podniku na skutočných fotkách, 3D kreslo sa maže.
- **Fázy**: Stavba (film a stránka naraz), Integrácia (integrátor a art director), Kontrola (štyri oblasti), Oprava.
- **Rozhranie** priamo v `BASE`: „ROZHRANIE FILM ↔ STRÁNKA (záväzné pre oba moduly)“ (kotvy `.film-shot`,
  zálohy `.film-still`, doska `.board`, triedy `world`, `world-in`, `world-off`, z-index).
- **Prenos techniky**: autor filmu dostal vzor z HEAD SPA 30 (`assets/world.js`) s pokynom zachovať, čo je dobré,
  a odstrániť všetko špecifické pre HEAD SPA (cenník, i18n, dvere, globály).
- **Výsledok** (`docs/INTEGRATION_LOG.md`, 2026-10-09): `film.css` bol nepoužitý duplikát pravidiel v `style.css`
  a zmazal sa; dymový test hľadal zálohu úvodu podľa `[data-shot="vstup"]`, opravený na `#uvod`; šero v strede
  prelínania bolo takmer čierne, zjemnené.
- **Lekcia**: zadania dali pravidlá pre `.film-still` obom autorom (`film.css` aj `style.css`). V rozhraní má
  každá trieda a súbor jedného vlastníka.

## 5. Kontrola po maximálnom detaile (`kontrola-ostrosti-prechodov.js`, 4 + 2 agenti na nález)

- **Cieľ**: nezávislý pohľad na nové stupne veľkosti záberov, výrezy na telefón, mipmapy a nový prechod.
- **Fázy**: Kontrola (kód, stránka a súbory, kompozícia na telefóne, výkon a pamäť), Overenie (dvaja skeptici
  na každý nález okrem low).
- **Vstupy**: zoznam dnešných zmien s parametrami, `git diff` voči nasadenej verzii, cesty k hotovým snímkam;
  zákaz spúšťať Playwright (súbežné testy). Kontrolór kódu dostal zoznam konkrétnych miest (a) až (i).
- **Výsledok**: CHECKS.md časť 8 zhŕňa nálezy a opravy tejto kontroly aj kontroly 6 (napríklad preload fasády
  bez stupňa 4096, tabuľky preloadu sa odvtedy generujú z `film.json`). Tamtiež: „Nepotvrdené skeptikmi (limit
  relácie), nálezy prijaté po vlastnom overení kódu a snímok.“

## 6. Kontrola po návrate na ulicu (`kontrola-kodu-kompozicie-vykonu.js`, 3 + 2 agenti na nález)

- **Cieľ**: to isté po ďalšej sade zmien (prológ, návrat na otváraciu scénu, hook úvodu).
- **Fázy**: Kontrola (kód `film.js`, kompozícia a hook, výkon a pamäť), Overenie.
- **Výsledok**: CHECKS.md časť 8 (spolu s kontrolou 5), napríklad mipmapy sa v skutočnosti netvorili (three
  s `generateMipmaps=false` vyhradí jednu úroveň), na ulici bežalo kreslenie naplno, zotrvačnosť kolieska mohla
  vyviesť von.
- **Lekcia**: aj bez overenia skeptikmi priniesla kontrola skutočné chyby; nedobehnuté overenie sa nahradilo
  vlastným overením kódu a snímok a zapísalo sa to.

## 7. Filmový návrh podľa videa (`filmovy-navrh-podla-videa.js`, 10 agentov)

- **Cieľ**: vojdenie a celý web na telefóne „ako na referenčnom videu“, texty so silným hookom.
- **Fázy**: Rozbor (referenčné video snímku po snímke: prechody, typografia, rytmus, 6 až 10 merateľných vlastností),
  Texty (traja textári: zdržanlivý, hook, Nitra; porotcovia pravidlá a zákazník; syntéza), Rozloženie a Videá
  (naraz, každý s prototypom v kópii webu), Kritika.
- **Vstupy**: `args` (`site`, `scratch`, `ref`), snímky súčasného stavu, pravidlá webu (MASTER_BRIEF, ART_DIRECTION,
  TOUR_DIRECTION, CONTENT_SOURCES), zoznam scén s tým, čo na nich je dnes.
- **Výsledok**: CHECKS.md časť 10 (rozbor po snímkach, texty po porote s pôvodom každého údaja, titulné karty
  bez dosky, skutočné videá vo filme).
- **Lekcia**: návrhová fáza needituje repozitár; implementácia prišla potom samostatne (CHECKS.md časť 10).

## 8. Strihači prechodov (`strihaci-prechodov.js`, 6 agentov)

Bežal súbežne so 7 („Súbežne kolegovia navrhujú nové texty scén, filmové rozloženie a zapojenie skutočných
videí majiteľa ako záberov“), preto zadanie žiada strih, ktorý funguje aj pre video bez hĺbky.

- **Cieľ**: každý prechod medzi miestnosťami vlastný strih, jeden vkus, ostrý obraz mimo prechodu.
- **Fázy**: Strihači (kamera, svetlo, tvar; slovník 4 až 6 strihov, mapa strihov na prechody, prototyp v kópii
  `film.js`, pás snímok priebehu na telefóne aj počítači, diff), Porota (strihač filmu, technický kontrolór),
  Syntéza (jeden post shader, strih podľa atribútu kotvy `data-cut`).
- **Vstupy**: rozpočet (najviac asi 16 vzoriek textúry na pixel navyše, 60 snímok/s na iPhone), zákaz lacných
  efektov, záber bez hĺbky (video) musí fungovať.
- **Výsledok**: CHECKS.md časť 10: porota a syntéza nedobehli (limit relácie), zvolený slovník strihača „kamera“;
  na telefóne 12, na počítači 16 vzoriek na pixel počas strihu. Podrobne [`../../film-z-fotiek/references/strihy.md`](../../film-z-fotiek/references/strihy.md).
- **Lekcia**: zadanie kázalo uložiť diff a snímky do súborov, takže práca strihačov ostala použiteľná aj bez syntézy.

## 9. Textári popisov (`textari-popisov.js`, 7 agentov, 2026-10-11)

- **Cieľ**: krátky elegantný popis ku každému z desiatich barberov, bez faktov o osobe.
- **Fázy**: Písanie (uhly remeslo, hosť, charakter), Porota (pravidlá a fakty; zákazník), Syntéza, Kontrola.
- **Vstupy**: brief s ôsmimi pravidlami (najviac 95 znakov, žiadne pomlčky, výkričníky ani úvodzovky, rod pri žene
  v tíme, opakovanie slov najviac dvakrát v desiatke), ukážky existujúcich viet webu.
- **Výsledok**: `barbershop-30/index.html` (`.team-bio`), 43 až 68 znakov (CHECKS.md časť 11). Podrobne
  [`../../obsah-a-texty/references/popisy-ludi.md`](../../obsah-a-texty/references/popisy-ludi.md).

## 10. Audit plynulosti (`audit-fps.js`, 6 agentov, 2026-10-11)

- **Cieľ**: celá stránka 60 až 120 snímok za sekundu pri zachovaní ostrosti a vzhľadu.
- **Fázy**: pipeline cez oblasti JS filmu, grafika, stránka a CSS; po každej oblasti hneď skeptik.
- **Vstupy**: zákaz upravovať súbory, ako merať (CDP `Performance.getMetrics`, 4× CPU), čo merať nejde (GPU
  v kontajneri), čo už je známe a mení sa súbežne.
- **Výsledok**: CHECKS.md časť 13. Zapracované overené nálezy s nízkym rizikom (premenné nie na `<html>`, `scrollY`
  raz za snímku, správa okolia najviac raz za 100 ms, hĺbkové mapy do 768 px). Zamietnuté `width: 200%`.
  Prepočet štýlu na snímku: sľub auditu 48,7 → 7,4 ms, namerané 5,1 → 4,8 ms (hlavné vlákno 10,9 → 9,6 ms;
  telefón 390×844, CPU 4×, film vypnutý).
  Podrobne [`../../rychly-web/references/audit.md`](../../rychly-web/references/audit.md).

## 11. Spísanie toolboxu (`spisanie-toolboxu.js`, 14 agentov)

- **Cieľ**: postupy z práce zapísať do `toolbox/skills-z-praxe/` tak, aby sa dali použiť aj na inom webe.
- **Fázy**: pipeline cez sedem položiek (niektoré so dvoma skills); autor číta skutočný kód, dokumenty a spoločný
  podklad, hneď po ňom overovateľ porovná každé tvrdenie s kódom a chyby opraví v súboroch skillu.
- **Vstupy**: spoločné pravidlá v `BASE` (frontmatter, jazyk, úryvky zo skutočných súborov s cestou, žiadne
  pomlčky em dash a en dash, žiadne osobné ani prihlasovacie údaje, písať len do vlastného priečinka).
