# Rozhranie HTML ↔ film: atribúty, triedy, premenné, API

Zdroj: hlavička `barbershop-30/assets/film.js` (riadky 8 až 40), funkcie `shotOf`, `videoOf`, `measure`,
`barbershop-30/index.html`, `barbershop-30/assets/style.css`, `barbershop-30/assets/app.js`.
Pri rozpore platí kód.

## Atribúty kotvy `.film-shot[data-shot]`

Súradnice bodov sú vždy 0 až 1 zľava a zhora fotky.

| Atribút | Význam | Predvolené |
| --- | --- | --- |
| `data-shot="meno"` | meno záberu, súbory `img/film/<meno>-<šírka>.{avif,webp}` a `<meno>-hlbka.webp` | povinné |
| `data-f="x,y"` | bod záujmu na fotke (kam sa pozerá kamera) | `0.5,0.5` |
| `data-fm="x,y"` | bod záujmu pre telefón (vo výreze, ak je `data-m`) | bez neho `data-f` |
| `data-mv` | pohyb kamery: `in`, `right`, `left`, `rise`, `down`, `near` (aj `door`, `still`) | `in` |
| `data-size="ŠxV"` | rozmery fotky, keď ich nedá `<img width height>` | pomer z `<img>`, inak 1,5 |
| `data-tiers="1086,1448,…"` | stupne šírky, ktoré pre záber existujú | `1086,1448,2172` |
| `data-m="meno-m"` | výrez na výšku pre telefón | bez výrezu fotka na šírku |
| `data-m-size`, `data-m-tiers` | rozmery a stupne výrezu | pomer 1,5 (z `<img>` sa pre výrez nečíta), stupne `1086,1448,2172` |
| `data-place="text"` | popis miesta (popisok „Prehliadka podniku“ vľavo dole, len kde ho nezakrýva doska; v BARBERSHOP 30 ho CSS vypína, miesto pomenuje nadpisok karty) | žiadny |
| `data-cut="druh …"` | strih z predchádzajúceho záberu do tohto (references/strihy.md) | tabuľka `CUTS` |
| `data-desk="skip"` | kotva má záber len na telefóne (video); na počítači ju film preskočí | nie |
| `data-card="left\|right\|center"` | poloha titulnej karty (len CSS, film ho nečíta) | bez neho zarovnanie ako `left` |

Prológ (úvod ako film) má atribúty na kotve úvodu s predponou `data-pro`: `data-pro="meno"`, `data-pro-f`,
`data-pro-fm`, `data-pro-mv` (v praxi `door`), `data-pro-size`, `data-pro-tiers`, `data-pro-m`,
`data-pro-m-size`, `data-pro-m-tiers`, `data-pro-place`. Záber prológu nemá vlastnú kotvu: stojí v ceste
jednu obrazovku pred začiatkom stránky (index 0), skrolom sa k nemu vrátiť nedá.

Video ako záber (`data-video`, `data-video-mode="seq|play|scroll"`, `data-video-n`, `data-video-size`,
`data-video-f`, `data-video-poster`, `data-video-t`, `data-video-fps`, `data-video-mv`, `data-video-on`)
popisuje skill `video-a-sekvencie`. Pre film je dôležité: video nemá hĺbkovú mapu (rovina bez posunu
popredia), presah má 1,12 namiesto 1,24 a predvolený pohyb `still`; na počítači je kotva bežný záber
fotky, ak nie je `data-video-on="all"`.

Ako sa z kotiev počíta cesta (`measure()`):
- kotva sa vezme, len keď je viditeľná (`offsetParent`, alebo `position: fixed`);
- kotva prológu má polohu `-výška okna`, ostatné horný okraj kotvy (pri sticky alebo fixed predkovi
  horný okraj jeho rodiča);
- titulná karta (`.is-title`, nie úvod s prológom) má polohu záberu v strede svojej voľnej dĺžky
  (pri `.title-long` bez poslednej výšky okna) a strih na hornom okraji kotvy; keď pred ňou je pás
  `.band`, strih je o 1,5 výšky okna skôr, aby záber spod pásu vyšiel hotový;
- poloha musí oproti predchádzajúcej kotve narásť o viac než 1 px, inak sa kotva preskočí;
- zmena poradia záberov (napr. filter) nastaví film na nové miesto bez jazdy.

## Statická záloha `<picture class="film-still">`

Generuje ju `stills.py` (references/priprava-zaberov.md). Inline premenné v `style`:

| Premenná | Význam |
| --- | --- |
| `--fx`, `--fy` | bod záujmu v percentách (`object-position`, pokojná verzia) |
| `--fmx`, `--fmy` | to isté vo výreze na telefón |
| `--fxn`, `--fyn`, `--fmxn`, `--fmyn` | to isté bez jednotiek, pre rámovanie ako prvý snímok filmu |
| `--pa`, `--pam` | pomer strán fotky a výrezu |
| `--z0` (v CSS) | vzdialenosť kamery v prvom snímku: −0,04 bežne, −0,005 pri `data-mv="near"`, 0,05 pri `.film-still-pro` |

`film.js` navyše zapíše na kotvu `--fx` a `--fy` z `data-f`. Pri bežiacom filme (`world-in`) sa zálohy
prelínajú preč za 0,7 s; pri `world-off` ostávajú navždy.

## Triedy na `<html>`

| Trieda | Kto ju dáva | Význam |
| --- | --- | --- |
| `world` | hlavička (inak `film.js`) | lacné podmienky splnené, film sa skúsi |
| `world-in` | `film.js` v snímke po prvom nakreslenom | film beží, zálohy zmiznú (0,7 s), plátno sa rozsvieti (1,2 s), HTML popisok miesta `.place-tag` sa skryje |
| `world-off` | `film.js` alebo hlavička pri `?film=off` / `?motion=off` | film nejde, zálohy ostávajú |
| `world-frame` | `film.js` po neúspešnej kontrole GPU | záloha si nechá rámovanie prvého snímku (nič neposkočí) |
| `pro` | hlavička (raz za návštevu) | úvod ako film; zloží ju `endPro` |
| `outside` | `film.js` | kamera stojí pred podnikom po „Späť na ulicu“ |
| `karty` | hlavička | titulné karty a zábery stoja cez celé okno (P11 v style.css) |
| `data-film="force"` | vývojová stránka | obíde bránu aj čakanie na pohyb |

## Premenné a triedy, ktoré píše `app.js` na kotvy (CSS premenné nikdy na `<html>`)

| Názov | Význam |
| --- | --- |
| `--sp` | lokálne t kotvy: 0 keď stred okna vstúpi na jej horný okraj, 1 keď vyjde spodným |
| `--o` | krytie titulnej karty: nábeh 0 až 0,12 voľnej dĺžky (`CARD_IN`), odchod posledných 0,08 (`CARD_OUT`); úvod bez nábehu |
| `is-on` | karta je vidieť (`--o` > 0,01); skryté karty nemajú klikateľné odkazy |
| `--so` | krytie zálohy v pokojnej verzii: ďalší záber sa prelína navrch počas nábehu svojej karty |
| `is-shown` | záloha je vidieť (`--so` > 0,001) |
| `is-near` | záloha sa smie načítať (aktuálna karta, dve ďalšie, jedna predchádzajúca; pred `load` len úvod) |
| `--hint` | výzva a dvere v úvode, 1 → 0 v prvých 2 % skrolu, len na kotve úvodu |

`setVar` zapisuje len pri zmene nad 0,002 (krajné hodnoty 0 a 1 vždy presne).

## URL parametre a úložisko

| Čo | Účinok |
| --- | --- |
| `?film=off`, `?motion=off` | film vypnutý, pokojná verzia |
| `?film=on` | vynechá kontrolu GPU, pustí film aj pri softvérovom kreslení (testy) |
| `?uvod=znova` | prológ aj pri opakovanej návšteve |
| `?uvod=off` | bez prológu (merania Lighthouse) |
| `sessionStorage.bs30uvod` | prológ raz za návštevu (BARBERSHOP 30) |
| `sessionStorage.hs30open` | dvere raz za návštevu (HEAD SPA 30) |

## Ladiace API `window.BS30_FILM`

| Člen | Čo robí |
| --- | --- |
| `ready` | Promise: `true` po prvom snímku, `false` keď film nejde |
| `shots` | mená fotiek všetkých záberov zo stránky vrátane prológu (`photo`, na telefóne výrez `-m` alebo `-video`) |
| `state` | `S`, `T`, `dpr`, `mix`, aktuálny strih, `anchors`, `firstFrameMs`, stav prológu, `ready` každého záberu (veľkosť, hĺbka), stav videí a sekvencií |
| `goTo(meno, t)` | skok na záber bez jazdy, `t` 0 až 1 v jeho pohybe (0,5 = kotva) |
| `cutFreeze(meno, mix)` | zastaví strih zo záberu `meno` (`pro` = prológ) na `mix` aj s kamerou; `null` pustí |
| `fadeFreeze(v)` | zastaví prechod na `v` |
| `proFreeze(s)` | zastaví prológ na polohe `s` (0 fasáda, 1 úvod); `null` pokračuje z toho miesta |
| `pause(v)` | prestane kresliť (snímky pri pomalej grafike) |
| `dbg(1\|2)` | ukáže hĺbku odchádzajúceho alebo prichádzajúceho záberu |
| `cuts` | zoznam strihov v ceste (`from`, `to`, `cut`, `dir`, `rev`) |
| `uvod.von()`, `uvod.znova()` | von na ulicu, znova dnu |

HEAD SPA verzia (`assets/world.js`) API nemá; zábery sú tam v poli `SHOTS` priamo v skripte (selektor
sekcie, fotka, bod záujmu, pohyb) a kategórie cenníka sa pridajú z `#cennik .cat[data-cat] img[data-photo]`.
