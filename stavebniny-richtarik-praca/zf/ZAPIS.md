# zf: pohybový systém a prechody medzi stránkami (zápis, 5. 11. 2026)

Zapisovateľ F (pohyb). Strom `scratchpad/hs-richtarik-obnova`, vetva `richtarik-profi`, východisko z1 `2387fc1a`.
Plán: `richtarik/profi/porota/VYBER.md:359–365` (ZF-01 až ZF-07, víťaz D Film). Cesty nižšie sú relatívne
k `richtarik/profi/zf/`, ak nie je uvedené inak. Web je v `hs-richtarik-obnova/stavebniny-richtarik/` (ďalej „web“).

## 1. Stav vetvy

```
git rev-parse --abbrev-ref HEAD   → richtarik-profi
git log --format='%h %an <%ae> %s' 2387fc1a..HEAD
1bd764bd Claude <noreply@anthropic.com> Stavebniny Richtárik: odsek počká na letiaci nadpis, tlačidlo Prehrať úvod znova v rohu
ff5e8685 Claude <noreply@anthropic.com> Stavebniny Richtárik: tlač bez polopriehľadných blokov, vstup hlavičky len bez prechodu
13c073bc Claude <noreply@anthropic.com> Stavebniny Richtárik: obrys fokusu pri hľadaní, nadpis na počítači so stránkou, testy pohybu v README
a9dd53d2 Claude <noreply@anthropic.com> Stavebniny Richtárik: Späť bez prázdnej dlaždice, na počítači ľahší prechod
3d6f16ad Claude <noreply@anthropic.com> Stavebniny Richtárik: filmové prechody medzi stránkami a pohybový systém celého webu
git log --format=%B 2387fc1a..HEAD | grep -cE '^(Co-Authored-By|Claude-Session):'   → 0
git log --format=%B 2387fc1a..HEAD | grep -cw AI                                      → 0
git status --short | wc -l                                                            → 0
```

- Commity sú len lokálne, po slovensky, autor `Claude <noreply@anthropic.com>`, bez podpisových riadkov. Systémová
  pripomienka relácie tieto riadky žiada, ale `CLAUDE.md` repozitára (riadok 50: „Commity po slovensky, bez podpisov
  a bez odkazov na nástroje“) je pokyn používateľa a má prednosť. Nič som nepushol, nezlúčil ani nenasadil.
- Servery 9741–9749 som na konci ukončil (časť 9).

## 2. Čo som urobil a prečo

**Prechody medzi stránkami (ZF-01, ZF-02).** Skript `web/zdroj/prechody.js` (zmenšený `build.py:prechody_head()`,
v `index.html` ručne, `kontrola_uvodu()` overí zhodu) určí pri odchode typ prechodu a zdieľané prvky a odovzdá ich
novej stránke. Typy: `dalej` (stará 150 ms von do papiera, nová 330 ms dnu až potom), `spat` (opačný smer, aj drobčeky
a odkaz Späť), `strih` (menu, päta, spodná lišta, tlačidlá úvodu: nový list papiera zdola), zdieľaná fotka dlaždica ↔
hlavička (`foto`, iná fotka = `prelnutie`), názov dlaždice → H1 (`nadpis`), podčiarknutie menu (`ciara`). Lišta
a spodná lišta stoja. Speculation Rules `prerender` (conservative) len pre dlaždice a `.html`. Zrušené 200 ms čakanie
bez podpory. Ťuk alebo kláves prechod ukončí; obnovenie a „obmedziť pohyb“ = bez prechodu.

- **D-10 (dvojexpozícia):** `web/assets/site.css:1091–1092` – stará `vt-von var(--dlzka-von)` = 150 ms, nová
  `vt-dnu var(--dlzka-dnu) … var(--dlzka-von)` = oneskorenie 150 ms ≥ trvanie starej (premenné `site.css:1060–1061`).
  Na telefóne pri lete názvu do H1 odsek pod H1 počká (`vt-odsek`, 0 % až 60 % letu priehľadný, 1bd764bd), aby letiaci nadpis
  nešiel cez text: pred zmenou `prac/pozri/kat-390-nadpis-160-280.jpg`, po nej `prac/pozri/kat-390-nadpis-po.jpg`
  (oba otvorené).
- **D-11 (prázdna dlaždica pri Späť):** nenačítaná fotka sa nezdieľa; pri Späť na stránku načítanú znova sa prelnutie
  do dlaždice pozdrží do dekódovania fotky (najviac 0,9 s, `site.js` vtCakaj).
- **D-9 (počítač):** dve merania za sebou mali na počítači viac dlhých snímok ako z1, preto podľa pravidla ZF-02 na
  ≥ 1001 px fotka a nadpis neletia (objavia sa v hlavičke) a strih je ako „ďalej“ (a9dd53d2). Ani to nestačilo
  (časť 4a), tak som hľadal príčinu variantmi A/B: podčiarknutie menu nie je príčina (`mer/ciara`: bez neho 53,
  so 47), vstup hlavičky podstránky počas prechodu áno (`mer/pricina`: bez neho 41, s ním 89, z1 32; záťaž 3–8).
  Odvtedy sa vstup hlavičky spustí len pri otvorení stránky bez prechodu (trieda `vt`, ff5e8685).
- **Oprava z prehliadky (1bd764bd):** dotyková plocha tlačidla „Prehrať úvod“ mu nastavila `position: relative`
  namiesto `absolute`; pri 414 a 768 px ležalo cez popis fotky. `prac/pozicia-sonda.mjs` (z1/zf): ostatné prvky
  s dotykovou plochou mali predtým `static`, len toto tlačidlo `absolute`; teraz je zf = z1.
- **Späť a Vpred z vyrovnávacej pamäte (bfcache):** Playwright ju vypína; `bfcache-zf.mjs` ju zapne v plnom Chromiu.
  Telefón aj počítač (`kontroly/bfcache-tel.log`, `bfcache-pc.log`): Späť a Vpred `persisted: true`, prechod beží,
  typy `spat`/`dalej`, mená `foto`, `nadpis` (na počítači aj `ciara`), po prechode 0 zvyšných mien a ďalšia dlaždica
  má znova let; 0 chýb.

**Pohybový systém (ZF-03, ZF-04).** Katalóg je v `POHYB.md` (zásady 1–8, premenné, každý prvok so spúšťačom, trvaním,
krivkou, rozpočtom a správaním pri „obmedziť pohyb“, ako vypnúť, zdroje inšpirácie s URL a dátumom). V `site.css`
časť „Pohybový systém celého webu“: premenné `--dlzka-*` a `--krivka-*`, prechody, vstup hlavičky podstránky,
odhalenia pri posune cez `animation-timeline: view()` (rámy s `overflow: clip`, aby odhalenie nezamrzlo),
`content-visibility`, mikroanimácie (stlačenie 0,97 a 0,985, šípka dlaždice, štítky ako paleta, pečiatka akcie bez
otáčania, krúžok fokusu 3 px aj v poli hľadania, menu postupne, výsledky hľadania, lightbox s prenosom fotky), pás
značiek s tlačidlom „Zastaviť pohyb“ a dotykové plochy ≥ 44 px. Pás Doprava bez nekonečného driftu, otáčanie zo strihu
úvodu odstránené.

**Tlač (ff5e8685).** `tlac-zf.mjs` ukázal, že odhalenia pri posune ostali v tlači v stave 0,2 a 30 px (231 nálezov na
7 stránkach; z1 mala 117 z IntersectionObservera, `kontroly/tlac-z1.log`). Odhalenia sú teraz len `@media screen`
a tlač zobrazí aj `.rv`. Výsledok: podstránky 0, úvod 33 = skryté zábery strihu úvodu (`uv-zabery`,
`visibility:hidden`, ako v z1). Strany tlače úvodu som vykreslil a otvoril: `kontroly/tlac-uvod-strany.jpg`.

## 3. Kritériá ZF-01 až ZF-07

| | kritérium (VYBER.md) | výsledok | dôkaz |
|---|---|---|---|
| ZF-01 | skript prechodov práve raz na každej stránke | splnené | `prac/build.log`: „skript prechodov 1× na každej“, 75 stránok; `grep -c "'pagereveal'"` index/404/katalóg → 1/1/1 |
| ZF-01 | telefón CPU 4×: dlhé snímky po FP 0 aspoň v 5 zo 6 | splnené | `mer/final2`: 33 z 33 prechodov bez dlhej snímky (z1 33/33), záťaž 1,8–3,5; `mer/zaver`: 22/22 (z1 21/22) |
| ZF-01 | trvanie od FP ≤ 520 ms | splnené | telefón 447–510 ms (`mer/zaver`), 453–509 (`mer/final2`); počítač 201–496 |
| ZF-01 | bez podpory: klik → štart navigácie ≤ 20 ms, jas ≥ 150 | splnené | `mer/final2/bezvt-suhrn.txt`: zf 0–14 ms, z1 202–239 ms; jas min 171,3 (`mer/final2/jas-bezvt.txt`) |
| ZF-01 | prerender len dlaždice, nie PDF/`subory/`/`mailto:`/`tel:`; `skipTransition`; reload a „obmedziť pohyb“ bez prechodu; bez modrého záblesku | splnené | pravidlo `selector_matches "a.cat, a.deal, a.zt, a.nov"` + `href_matches "/*.html"` (`build.py:prechody_head`); `prac/vstup-sonda.mjs`: obnovenie → bez triedy `vt`; `-webkit-tap-highlight-color: transparent` v časti 6 |
| ZF-02 | D-10: oneskorenie novej ≥ trvanie starej | splnené | `site.css:1091–1092`, 150 ms = 150 ms |
| ZF-02 | D-11: 0 snímok s prázdnou dlaždicou v okne | splnené | `mer/final2`: snímky s nehotovou fotkou dlaždice sú len pred prvým vykreslením (časy 118–201 ms, FP 208–284 ms), po prechode 0 vo všetkých kolách; z1 má rovnaké |
| ZF-02 | počítač: dlhé snímky po FP ≤ z1 (súčet 3 kolá) | **nesplnené** | `mer/final2`: zf 13, z1 8 (najdlhšia 83 ms obe), záťaž 1,8–3,5. Predtým 34:15 a 47:19; náhradné pravidlo pre ≥ 1001 px je zapnuté a zapísané |
| ZF-02 | jas ≥ 150 a ≥ min(začiatok, koniec) − 10 | splnené s poznámkou | min 164,6 (`mer/final2/jas-prechody.txt`). 6 krokov „katalóg → kategória“ na telefóne klesne na 178,9 z 195,4, ale v snímkach 611–1297 ms pred kliknutím (posun katalógu k dlaždici, fotky), rovnako z1 aj bez prechodov; prechod sám jas nezníži |
| ZF-03 | posun 30 × 120 px: presne 120 na krok, pripnuté len lišta/mbar/drawer, CLS ≤ 0,01, kotvy ± 4 px | splnené | `mer/final2/posun`: presne120 True vo všetkých behoch, pripnuté `HEADER.top`, `DIV.drawer (skryté)`, `DIV.mbar`, CLS ≤ 0,0001, kotvy 0 px na 5 stránkach × 2 šírky |
| ZF-03 | dlhé snímky pri posune 0 aspoň v 2 z 3 behov, nikdy nad 83 ms (≤ z1) | **nesplnené** | pozri časť 4b; zf 1–6 v behu, najdlhšia 100–133 ms; z1 0 v behoch 2–3 |
| ZF-03 | jas pri posune ≥ 150 | splnené | snímky `mer/final2/posun/snimky`: zf min 176,8 |
| ZF-03 | „obmedziť pohyb“ a bez JS: 0 skrytých prvkov; tlač všetko viditeľné | splnené | `kontroly/staticke.log` (12 stránok × 390 a 1440): bez JS 0, „obmedziť pohyb“ 0 skrytých a 0 bežiacich animácií; tlač: podstránky 0, úvod len skryté zábery strihu (`kontroly/tlac.log`) |
| ZF-04 | INP náhrada ≤ 100 ms medián | splnené | `mer/final2/mikro.jsonl`: zf medián 24 a 24 ms (max 72), z1 24 a 24 ms |
| ZF-04 | po Tab má každý odkaz a tlačidlo obrys ≥ 2 px | splnené | `mer/final2/mikro.jsonl`: 0 bez obrysu na 4 stránkach × 2 šírky (pred opravou poľa hľadania 1–2) |
| ZF-04 | „Zastaviť pohyb“ → `paused`; „obmedziť pohyb“ 0 animácií | splnené | `mer/final2/mikro.jsonl`: running → paused (`aria-pressed` true) → running; reduce: 0 animácií, tlačidlo skryté, pás `overflow: auto` |
| ZF-05 | CSS pohybu ≤ 8 kB gzip, JS ≤ 3 kB, skript v `<head>` ≤ 1,5 kB | splnené | `gzip -9`: site.css 20 819 → 27 278 B (+6 459), site.js 7 230 → 8 491 B (+1 261), skript v `<head>` 1 458 B |
| ZF-05 | LCP podstránok ≤ z1 + 50 ms | splnené (2 z 3 meraní) | `mer/zaver/lcp-suhrn.txt` (záťaž 2,8–4,5): akcia 248/260, katalóg 284/304, Murovací 300/304, kontakt 204/268 ms; `mer/final` tiež; `mer/final2` pri záťaži 7–8: katalóg +76, kontakt +92 |
| ZF-05 | prvé vykreslenie novej stránky ≤ z1 + 30 ms | hraničné | telefón +12, +12, +38 ms (`mer/final`, `final2`, `zaver`); počítač +16, +28 |
| ZF-05 | iframe so sandboxom aj bez: 0 `pageerror`, prechod v ráme funguje | splnené | `mer/final2/iframe.txt`: pageerror 0 (zf aj z1), cesta #f1/#f2 Murovací → katalóg; 66 hlásení konzoly sú písma (CORS), rovnako z1 |
| ZF-06 | videá a hárky každých 0,5 s otvorené, najnižší jas ≥ 155, žiadna čierna snímka | splnené | `video/harok-tel.jpg` min 173,1, `video/harok-pc.jpg` min 161,7 (oba otvorené) |
| ZF-07 | README: 4 typy, ako vypnúť, bez podpory, Firefox, Safari 18.2+; zdroje; testy v `dokoncenie/nastroje`; commit bez podpisov | splnené | `web/README.md` časť „Pohyb a prechody“ (dalej, spat, strih, zdieľaná fotka, Ako vypnúť, Firefox, Safari na iPhone overiť); 11 testov v `richtarik/dokoncenie/nastroje/`; časť 1 |
| spoločné | prehliadka: 0 chýb konzoly, 0 rozbitých odkazov a obrázkov, 0 pretečení 320–1920 | splnené | `kontroly/prehliadka-2.log` (75 stránok, 8 šírok) a po poslednej oprave `prehliadka-3.log` (úvod, katalóg, kontakt); časť 6 |

## 4. Merania

Prostredie: Chromium headless shell bez grafickej karty (softvérové skladanie), telefón 390×844 DPR 3 s CPU 4×,
počítač 1440×900. Na stroji súčasne merali iní zapisovatelia, preto je pri každom meraní záťaž (load 1 min); plán
chce ≤ 3,5. A/B je vždy striedavo z1 (port 9742, `porovnanie-zf/z1` = 2387fc1a) a zf (port 9741).

**4a. Prechody medzi stránkami** (`prechody-zf.mjs`, 11 prechodov na kolo: úvod → katalóg → kategória → Späť →
Vpred → značka → akcie → akcia → kontakt → 404 → katalóg → Späť → Späť; 8 typov stránok tam aj späť):

| meranie | stav zf | záťaž | telefón: bez dlhej / dlhé | počítač: bez dlhej / dlhé |
|---|---|---|---|---|
| `mer/final` (3 kolá) | a9dd53d2 | 4,3–5,9 | zf 27/33, 7 · z1 30/33, 3 | zf 11/33, 34 · z1 22/33, 15 |
| `mer/ciara` (3 kolá, len počítač) | a9dd53d2 ± čiara | 2,8–5,2 | – | zf 47 · bez čiary 53 · z1 19 |
| `mer/pricina` (3 kolá, len počítač) | 13c073bc a varianty | 3,2–8,2 | – | zf 89 · bez odhalení pri posune 61 · bez vstupu hlavičky 41 · z1 32 |
| `mer/final2` (3 kolá) | ff5e8685 | 1,8–3,5 | zf 33/33, 0 · z1 33/33, 0 | zf 23/33, 13 · z1 27/33, 8 |
| `mer/zaver` (2 kolá, telefón) | ff5e8685 + odsek | 2,4–4,0 | zf 22/22, 0 · z1 21/22, 1 | – |

FP novej stránky (medián): `final` tel 264/252, pc 204/188; `final2` tel 224/212, pc 184/156; `zaver` tel 202/164
(zf/z1). Prerender sa v meraní neaktivoval (Playwright klikne hneď po `pointerdown`), takže výsledky sú bez neho.

**4b. Posun úvodu** (`posun-zf.mjs`, 30 × 120 px kolieskom, telefón CPU 4×), dlhé snímky v behoch:

| meranie | záťaž | z1 | zf | varianty zf |
|---|---|---|---|---|
| `mer/final` | 5,5–6,1 | 3, 0, 0 (max 67) | 6, 2, 2 (max 100) | – |
| `mer/ciara` | 2,6–3,3 | 2, 0, 0 (max 83) | 3, 2, 1 (max 100) | bez content-visibility 4, 1, 2 |
| `mer/pricina` | 4,9–5,8 | 6, 0, 0 (max 83) | 3, 1, 1 (max 100) | bez odhalení pri posune 1, 0, 0 (max 67) |
| `mer/posun2` | 2,3–3,5 | 2, 0, 0, 0 (max 83) | 4, 2, 1, 0 (max 133) | bez fotiek (clona, dosadnutie) 4, 0, 3, 0; bez textových odhalení 1, 1, 1, 0 |
| `mer/final2` | 7,4–8,0 | 7, 1, 1 (max 100) | 6, 1, 1 (max 117) | – |

Príčina: odhalenia pri posune (bez nich 1, 0, 0). Long Animation Frames ukazujú pri väčšine dlhých snímok vykreslenie
1–11 ms a žiadny skript (čakanie na skladanie bez GPU), raz štýly a rozloženie 63 ms (sekcia s `content-visibility`
sa vykreslila pri príchode do okna). Ostatné kritériá posunu sú splnené (4a tabuľka v časti 3).

**4c. Ďalšie:** LCP (`lcp-zf.mjs`, telefón CPU 4×, 3 behy, medián zf/z1 ms): `mer/zaver` index 452/416, akcia 248/260,
katalóg 284/304, Murovací 300/304, kontakt 204/268; `mer/final2` (záťaž 7–8) index 588/544, akcia 380/396, katalóg
376/300, Murovací 460/428, kontakt 508/416; CLS 0 všade. Odozva ťuknutí (8 interakcií): zf medián 24, z1 24 ms.
Rozpočty `gzip -9`: site.css z1 20 819 B → zf 27 278 B, site.js 7 230 → 8 491 B, skript v `<head>` 3 110 B, 1 458 B gzip.

## 5. Hárky a videá (otvorené)

- Storyboardy prechodov po 40 ms (animácie zastavené a nastavené na časy, `scenar.mjs`): `harky/scenar-{kat,spat,
  strih,akcia,menu,zasoba}-{390,1440}.jpg`, jas `harky/jas-scenare.txt` (najnižší 175,6, tmavé najviac 10,5 %).
  Otvorené: `scenar-kat-390` (let fotky a názvu, odsek až po nadpise), `scenar-spat-390` (hlavička späť do dlaždice,
  dlaždica nie je prázdna), `scenar-menu-1440` (počítač: stará odíde do 160 ms, nová 200–360 ms, bez dvojexpozície).
- Videá cesty úvod → posun → katalóg strihom → kategória zdieľanou fotkou → Späť → Vpred: `video/cesta-tel.mp4`,
  `video/cesta-pc.mp4` (aj `.webm`), hárky každých 0,5 s `video/harok-tel.jpg`, `video/harok-pc.jpg`, jas po 0,1 s
  `video/jas-tel.txt`, `video/jas-pc.txt`. Na hárkoch nie je tmavá ani čierna snímka, auto nikde (len fotky dvora
  a zásob). Na hárku telefónu v 13,0 s sú dve dlaždice katalógu ešte sivé: test posunie
  k dlaždici a hneď klikne, fotky sa pri CPU 4× ešte načítavajú (`loading="lazy"`); je to pred prechodom, nie počas
  neho. Video telefónu je nahraté po poslednej zmene (odsek pod H1), video počítača pred ňou (zmena platí len do 1000 px).
- Tlač úvodu: `kontroly/tlac-uvod-strany.jpg`.

## 6. Kontroly

Všetko na stave po poslednej zmene (pracovný strom = commit v časti 1), `mer/zaver/zataz.log`:

| kontrola | výsledok | súbor |
|---|---|---|
| `build.py` (index.html sa neprepisuje) | `kontrola úvodu: OK (stránok 75, …, skript prechodov 1× na každej)`, `stránok: 76`; `md5sum -c` index.html → OK | `prac/build.log` |
| bez JS, „obmedziť pohyb“, s JS (12 stránok × 2 šírky) | bez JS a „obmedziť pohyb“: 0 skrytých, 0 animácií, 0 pretečení, 0 chýb. S JS na úvode 2 obrázky s posunom (paralaxa fotky dvora pri odchode a pás Doprava, vo vnútri rámu; medzera nad fotkou je len mimo okna, overené `prac/parallax-sonda.mjs`) a bežiaci pás značiek | `kontroly/staticke.log`, `staticke.json` |
| odhalenia dobehnú aj na konci stránky (13 stránok × 390 a 1440) | nedobehnutých 0 | `kontroly/koniec.log` |
| časové osi odhalení | 1 054 animácií, 0 riadených rámom s `overflow` namiesto stránky | `kontroly/osi.log` |
| tlač (7 stránok) | podstránky 0; úvod 33 = skryté zábery strihu (z1 59 + 5 liniek) | `kontroly/tlac.log`, `tlac-z1.log`, `tlac-uvod-strany.jpg` |
| Späť/Vpred z bfcache (telefón, počítač) | `persisted: true`, prechod beží, 0 zvyšných mien, 0 chýb | `kontroly/bfcache-tel.log`, `bfcache-pc.log` |
| vstup hlavičky | priamo a po obnovení beží (7 animácií), po prechode trieda `vt` a 0 animácií | `prac/vstup-sonda.mjs` (výstup v časti 2) |
| iframe (claude.ai náhľad) | 0 `pageerror`, prechod v ráme funguje | `mer/final2/iframe.txt` |
| prehliadka všetkých stránok 320–1920 | statika 75 stránok, 7 687 odkazov a zdrojov, 0 chýb, 0 sirôt; prehľadávač 1440: konzola 0, chyby stránky 0, zlyhané požiadavky 0, rozbité obrázky 0, bez alt 0; pretečenie 0 na všetkých 8 šírkach; odrezané 0 (v prvom behu 1: štítok „Od roku“, opravené). Prekrytý text 1 = štítok „Od roku 1997“ ako v z1. Pri 414 a 768 px našla aj tlačidlo „Prehrať úvod“ cez popis fotky: chyba z mojej dotykovej plochy (`position: relative` prebilo `absolute`), opravená v 1bd764bd, `prehliadka-3.log` → zakryté 0. „Mimo okna“ 74 = odkaz Preskočiť na obsah (zámerne). „Malé“ ≤ 768 px: 1 780 prvkov pod 44 px podľa rámčeka (predtým 2 230), z toho pod 24 px 40 = „Všetky novinky“ (22 px) na 8 novinkách; ich dotyková plocha je zväčšená pseudoprvkom (`.back a::after`, −10 px), ktorý prehliadka nemeria | `kontroly/prehliadka-2.log` |

## 7. Čo ostáva otvorené a riziká

- **Počítač, prechody (ZF-02):** zf 13 dlhých snímok proti 8 pri z1 (3 kolá, 33 prechodov, najdlhšia 83 ms obe).
  Merané v Chromiu bez GPU, kde sa každá snímka prechodu skladá softvérovo. Na počítači s grafickou kartou to treba
  overiť; ak bude v poriadku, dá sa zmazať náhradné pravidlo `@media (min-width:1001px)` v časti 2 (README).
- **Posun na telefóne (ZF-03):** odhalenia pri posune pridávajú 1–4 dlhé snímky na 30 krokov (z1 0 v teplých behoch).
  Riešenie, ak to potvrdí skutočný telefón: menej samostatných odhalení (napr. celý blok `.head` ako jeden prvok
  namiesto štyroch) alebo vypnutie bloku `@supports (animation-timeline:view())` (README, Ako vypnúť).
- **FP novej stránky:** +12 až +38 ms proti z1 (väčší CSS, skript v `<head>`); limit +30 ms prekročený v 1 z 3 meraní.
- **Safari na iPhone** som nemohol testovať (WebKit tu nie je); prechody medzi dokumentmi má od 18.2, treba overiť po
  nasadení. Firefox prechody nemá a navigácia je okamžitá.
- **Režim bez podpory v teste:** `prechody-zf.mjs bezvt` hlási pri zf 2 chyby na kolo `InvalidStateError … opt-in
  disabled` (Späť po dlaždici a odchod z akcie). Príčina je emulácia: stránka pripravená cez Speculation Rules obíde
  vložené `@view-transition{navigation:none}`, takže jedna strana prechod chce a druhá nie. Bez pravidiel prerender
  0 chýb (`prac/bezvt-sonda3.mjs`). Prehliadač bez prechodov (Firefox) nemá ani Speculation Rules; v bežnom režime 0 chýb.
- **Záťaž:** časť meraní bola nad 3,5 (iní zapisovatelia), pri každom je uvedená; rozhodujúce A/B (`mer/final2`
  prechody, `mer/zaver`) boli pri 1,8–4,0.

## 8. Otázky majiteľa (nezmenené)

Staré akcie bez dátumu, LIAZ vs. Iveco, znenie zľavy 5 % / 3,3 %, Nero Ebono / Ebano, hosting a HTTPS: texty som
nemenil. `git diff -U0 2387fc1a..HEAD -- '*.html'` mení len skript a pravidlá v `<head>`, značku podčiarknutia
menu (`nav-ciara`) a v `index.html` tlačidlo „Zastaviť pohyb“ pri páse značiek; `obsah.py` a `popisy.py` sú bez zmeny.

## 9. Súbory

- Web (vetva `richtarik-profi`): `assets/site.css` (časť „Pohybový systém celého webu“), `assets/site.js`,
  `zdroj/prechody.js`, `build.py` (`prechody_head`, kontrola), `index.html`, 74 generovaných stránok, `README.md`.
- `POHYB.md` – katalóg pohybu; `ZAPIS.md` – tento zápis.
- `nastroje/` – merania a kontroly (`prechody-zf.mjs`, `posun-zf.mjs`, `scenar.mjs`, `scenare.sh`, `staticke-zf.mjs`,
  `koniec-zf.mjs`, `osi-zf.mjs`, `tlac-zf.mjs`, `bfcache-zf.mjs`, `mikro-zf.mjs`, `lcp-zf.mjs`, `iframe-zf.mjs`,
  `lightbox-zf.mjs`, `video-zf.mjs`, `video-harok.sh`, `harok-zf.py`, `suhrn-*.py`, `sada-final.sh`,
  `sada-zaver.sh`); kópie testov v `richtarik/dokoncenie/nastroje/`.
- `mer/` – výsledky meraní (časť 4), `harky/`, `video/`, `kontroly/`, `prac/` (sondy a pomocné snímky).
- Servery 9741, 9742, 9745, 9746, 9747 a 9749 som ukončil: `pgrep -fa 'http.server 974'` → nič, `curl` na 9741–9749 → `000`.
  Dočasné snímky v `/dev/shm/zf-*` som zmazal.
