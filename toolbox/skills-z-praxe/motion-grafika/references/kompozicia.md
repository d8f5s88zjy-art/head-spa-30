# Kompozícia, parametre a značka

Kompozícia je obyčajný HTML súbor. Beh obstaráva `sablony/mg.js` (texty, farby, písma, časy vrstiev,
priebeh, deterministický čas), spoločný vzhľad `sablony/mg.css`. Renderer `scripts/render.mjs` do stránky
vloží `window.MG_PARAMETRE` a potom snímku po snímke volá `MG.seek(t)`.

## Kostra novej šablóny

```html
<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<title>Moja šablóna</title>
<link rel="stylesheet" href="mg.css">
<style>
  .moja { font-size: calc(var(--j) * 64px); }          /* rozmery v jednotkách --j (1 = strana 1080 px) */
</style>
</head>
<body>
<div id="kompozicia" data-dlzka="4" data-zarovnanie="vlavo" data-zvisle="dole">
  <div class="zona">
    <p class="mg-nadpis mg-tien moja" data-layer="Nadpis" data-text="nadpis" data-in="0.3" data-out="-0.3"
       data-vstup="hore" data-odchod="dole" data-popis="čo vrstva robí (ide do zoznamu vrstiev)"></p>
  </div>
</div>
<script type="application/json" id="predvolene">
{ "texty": { "nadpis": "Predvolený text" }, "nastavenia": {} }
</script>
<script src="mg.js"></script>
</body>
</html>
```

Šablónu ulož do `sablony/<meno>.html` (alebo kamkoľvek a v parametroch daj cestu). Otvorená priamo
v prehliadači sa prehrá s predvolenými textami a časovou osou (písma značky vtedy chýbajú; presný náhľad
dá `render.mjs --html`).

## Atribúty

| kde | atribút | význam |
| --- | --- | --- |
| `#kompozicia` | `data-dlzka`, `data-sirka`, `data-vyska`, `data-fps` | predvolené hodnoty (parametre ich prepíšu); 4 s, 1080, 1920, 30 |
| | `data-zarovnanie` | `vlavo`, `stred`, `vpravo` (pri strede je zóna súmerná, `--zona-bok`) |
| | `data-zvisle` | `hore`, `stred`, `dole` v rámci zóny |
| | `data-priebeh-od`, `data-priebeh-do`, `data-krivka` | jeden priebeh na kompozíciu: `--p` 0 až 1 medzi dvoma časmi, `plynulo` alebo `linear` |
| vrstva | `data-layer="Meno"` | pomenovaná vrstva (meno sa používa v `vrstvy` parametrov a v zozname) |
| | `data-in`, `data-out` | sekundy; záporné = od konca, `koniec` = dĺžka; viditeľná pre `in <= t < out` |
| | `data-vstup` | `fade`, `hore`, `zlava`, `stierka`, `stierka-hore`, `linka`, `nic` (začína v `in`) |
| | `data-odchod` | `fade`, `dole`, `stierka`, `nic` (končí presne v `out`) |
| | `data-vstup-ms`, `data-odchod-ms`, `data-posun` | dĺžky v ms, posun pri `hore` a `zlava` v px pri 1080 (18) |
| | `data-popis` | opis do zoznamu vrstiev |
| | `data-mimo-zony` | vrstva smie presahovať bezpečnú zónu (clona cez celý obraz) |
| obsah | `data-text="kluc"` | vloží `texty.kluc`; `*slovo*` = `<em>`, `\n` = nový riadok; prázdny text skryje celú vrstvu |
| | `data-ak="kluc"` alebo `data-ak="@kluc"` | vrstva len vtedy, keď text (alebo nastavenie) nie je prázdny |
| | `data-prisposob="0.6"` | dlhý text sa zmenšuje po 3 %, kým sa nezmestí, najviac na 60 % (varovanie v renderi) |
| | `data-pocitadlo`, `data-od`, `data-do`, `data-format`, `data-desatinne` | číslo podľa `--p`; formát `{n}`, `{mm}:{ss}`; odpočet (`do < od`) zaokrúhľuje nahor |
| | `data-kroky` + deti `data-prah="auto"` | kroky rovnomerne 0 až 1 (`--poloha`), `--hotovo` 0 až 1 a `data-stav` podľa priebehu |
| hodnota | `"@kluc"` | hodnota z `nastavenia.kluc` (napr. `data-od="@pocitadlo_od"`) |

## Premenné CSS, ktoré dosadí mg.js

| premenná | odkiaľ |
| --- | --- |
| `--f-podklad`, `--f-plocha`, `--f-text`, `--f-text-2`, `--f-text-3`, `--f-akcent`, `--f-na-akcente`, `--f-stitok`, `--f-linka`, `--f-linka-silna`, `--f-doska`, `--f-zvyraznenie` | `farby` značky (zo style.css), prepíše `farby` v parametroch |
| `--f-<farba>-rgb` | tá istá farba ako `r, g, b` na `rgba(var(--f-podklad-rgb), .7)` |
| `--p-nadpis`, `--p-nadpis-vaha`, `--p-nadpis-rozostup`, `--p-zvyraznenie-vaha`, `--p-text`, `--p-riadok-vaha`, `--p-stitok-vaha`, `--p-stitok-rozostup`, `--p-vyzva-velkost`, `--p-vyzva-rozostup` | `premenne` značky |
| `--r-doska`, `--r-tlacidlo`, `--tien-text`, `--tien-nadpis` | `premenne` značky (zo style.css) |
| `--e-vstup`, `--e-odchod` | krivky pohybu značky |
| `--j`, `--sirka`, `--vyska`, `--zona-hore`, `--zona-dole`, `--zona-vlavo`, `--zona-vpravo`, `--zona-bok` | rozmer výstupu a bezpečná zóna |
| `--clona` | `nastavenia.clona` |
| `--p` (na `#kompozicia`), `--poloha`, `--hotovo` | priebeh a kroky |
| `--in`, `--out` (na každej vrstve) | čas vrstvy v sekundách, na vlastné CSS animácie |

Triedy: `.zona` (bezpečná zóna), `.mg-nadpis`, `.mg-stitok`, `.mg-riadok`, `.mg-vyzva`, `.mg-linka`, `.mg-tien`.

## Vlastná animácia

Hotové nástupy menia len `opacity`, `translate`, `scale` a `clip-path`, takže vlastný `transform` šablóny
(napr. centrovanie) ostáva. Vlastný pohyb:

```css
@keyframes posun { from { transform: translateX(0) } to { transform: translateX(500px) } }
.stvorec { animation: posun 1s linear calc(var(--in) * 1s) both; }
```

alebo v skripte pred `mg.js`: `el.animate(keyframes, { duration: 1000, delay: 500, fill: 'both' })`.
Overené: pri `in` 0,5 s je štvorec v čase 1,0 s presne v polovici (250 px).

Zakázané, lebo by render nebol deterministický alebo by sa vrstva rozbila:

- **CSS `transition`**: beží v reálnom čase; pri renderovaní ich `mg.css` vypína (`html.mg-render`).
- **`display: none` na časovanie**: zruší CSS animácie vrstvy. Čas vrstvy rieši `visibility` (`.mg-mimo`).
- **`setTimeout`, `requestAnimationFrame` na pohyb, `Date.now()`, náhoda**: všetko odvodzuj od `t` cez animácie.
- **Video a GIF vnútri kompozície**: nehrajú podľa `seek`. Zábery patria pod prekrytie (`--zaber` alebo `kratke-video`).
- **`backdrop-filter`, žiary, rozmazanie, čiastočky, poskakovanie**: pravidlá webov (CLAUDE.md, ART_DIRECTION.md).

## Parametre (JSON)

```json
{
  "sablona": "lower-third",             // meno v sablony/ alebo cesta k HTML (vzhľadom na tento súbor)
  "znacka": "barbershop-30",            // meno v sablony/znacky/ alebo cesta k JSON značky
  "sirka": 1080, "vyska": 1920, "fps": 30, "dlzka": 4,
  "texty": { "meno": "Barbershop 30", "info": "Mostná 30, Nitra" },
  "nastavenia": { "zarovnanie": "vlavo", "zvisle": "dole" },
  "farby": { "akcent": "#e0601c" },     // výnimočne; inak platí značka zo style.css
  "vrstvy": { "Info": { "in": 0.9 }, "Doska": { "skry": true } },
  "zona": { "dole": 520 },              // px; inak naša pracovná zóna (nižšie)
  "zaber": "../video.mp4", "zaber_od": 1,
  "vystup": "/tmp/vystup", "meno": "bs30-lower-third",
  "zdroje_faktov": { "meno": "súbor a časť, odkiaľ je fakt" }
}
```

Komentáre `//` sú len tu v dokumente, v súbore JSON nesmú byť. `zdroje_faktov` renderer nečíta; je pre
ľudí a pre kontrolu faktov. Prepínače príkazového riadka (`--text kluc=hodnota`, `--nastav kluc=hodnota`,
`--dlzka`, `--sirka`, `--vyska`, `--fps`, `--zaber`, `--zaber-od`) prepíšu súbor.

Bezpečná zóna (ak `zona` chýba): na výšku hore 11,5 % výšky (221 px), dole 24 % (461 px), vľavo 6 % šírky
(65 px), vpravo 14 % (151 px, ikony aplikácie); inak 5 % dookola. Je to naša pracovná zóna odvodená od
rozloženia aplikácií (hore meno účtu, vpravo ikony, dole popis), nie údaj platforiem; pred uverejnením over
na snímke obrazovky z telefónu.

## Značka (JSON v sablony/znacky/)

```json
{
  "nazov": "BARBERSHOP 30",
  "css": "barbershop-30/assets/style.css",            // vzhľadom na koreň repozitára (--koren)
  "farby": { "akcent": "{--lamp}", "doska": "{--board}", "na-akcente": "{--ink}" },
  "farby_zaloha": { "akcent": "#e0601c" },             // len keď style.css nie je k dispozícii
  "pohyb": { "vstup": "{--ease-out}", "odchod": "{--ease-in-out}", "vstup_ms": "{--t-text}", "odchod_ms": 400 },
  "premenne": { "--p-nadpis": "\"Fraunces\", Georgia, serif", "--r-doska": "{--radius}", "--tien-text": "{--halo}" },
  "fonty": [ { "rodina": "Fraunces", "vaha": 800, "styl": "normal", "subor": "barbershop-30/assets/fonts/Fraunces-800.woff2" } ]
}
```

`{--premenna}` sa pri každom renderovaní dosadí z `:root` súboru `css` (len bloky na najvyššej úrovni,
neskorší prepíše skorší, takže pri HEAD SPA 30 platí Luxusná vrstva na konci súboru); `var(--x)` vnútri
hodnoty sa dosadí tiež. Chýbajúca premenná: použije sa záloha a render to vypíše. Farby sa teda neodhadujú:
zmena v style.css webu sa prejaví v ďalšom renderi. Renderer vypíše každú farbu aj s premennou, odkiaľ je.

Písmo: `fonty` sú súbory woff2 (ide aj ttf, otf) načítané cez `FontFace`. Pred renderom sa každý znak textov
overí v súbore písma, ktorým sa naozaj kreslí (`scripts/fonty.py`); chýbajúci znak render zastaví.

## Rozhranie window.MG (pre vlastné skripty a testy)

| volanie | vráti |
| --- | --- |
| `await MG.ready` | `true` po načítaní písma, textov a vytvorení animácií; chyba písma = zamietnuté |
| `await MG.seek(t)` | nastaví čas `t` (s) všetkým animáciám, vrstvám, priebehu a počká dve snímky |
| `MG.vrstvy()` | `[{ poradie, meno, in, out, vstup, vstupMs, odchod, odchodMs, popis, prazdna, mimoZony }]` |
| `MG.kontrola(t)` | zoznam problémov v čase `t`: vrstva mimo zóny, text pretečie (len vrstvy v pokoji) |
| `MG.ramec(t)` | spoločný rámik viditeľných vrstiev (na výrez detailu) |
| `MG.info()` | rozmer, fps, dĺžka, zóna, texty, nastavenia |
| `MG.varovania` | varovania z behu (neznámy nástup, čas za koncom, zmenšený text) |
