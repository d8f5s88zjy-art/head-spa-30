---
name: kratke-video
description: Krátke vertikálne video (Instagram reels, TikTok, YouTube Shorts) zo skutočných fotiek a záberov podniku: scenár JSON v troch vetách, pomalý nájazd po fotke bez trasenia, prelínanie, titulky písmom značky v bezpečnej zóne, prekrytia s alfou (lower third, motion graphics z After Effects alebo motion-grafika), hlas a hudba len s pôvodom a licenciou, -14 LUFS, MP4 9:16, 16:9, 1:1. Použi, keď majiteľ chce reel, short, video z fotiek (slideshow) na sociálne siete. Poučené z MoneyPrinterTurbo, bez fotobanky a bez automatického uverejnenia.
---

# Krátke video zo skutočných záberov

Z jedného scenára JSON vznikne hotové krátke video: zábery a fotky podniku, pomalý pohyb kamery
po fotkách, prelínanie, titulky písmom značky, voliteľne prekrytie s pohyblivou grafikou, hlas
a hudba. Nástroj `scripts/reel.py` beží bez siete (python3, Pillow, fontTools, ffmpeg) a nič
neuverejňuje. Vznikol 2026-10-11 podľa troch videí z TikToku (MoneyPrinterTurbo dvakrát, Higgsfield
v After Effects raz, `references/zdroj-videa.md`), ale pre naše pravidlá: skutočné zábery od
majiteľa namiesto fotobanky, fakty zo zdrojov, uverejňuje majiteľ.

## Kedy použiť

- „Sprav reel / TikTok / short“, „video z týchto fotiek“, „krátke video na Instagram“.
- Majiteľ poslal zábery alebo fotky a chce z nich video s textom.
- Treba to isté video v inom formáte (9 : 16, 16 : 9, 1 : 1).
- Treba položiť hotovú pohyblivú grafiku (lower third, štítok) zo skillu `../motion-grafika/` na záber.

Nepoužívaj na dlhé videá s rozhovorom (tam patrí strihový program), na video na web pri skrolovaní
(`../video-a-sekvencie/`) ani na film z fotiek s hĺbkou (`../film-z-fotiek/`).

## Zásady

1. **Len skutočné zábery a fotky podniku.** Nič z fotobanky, nič vymodelované ani vygenerované.
   Čo chýba, napíš do „Materiál, ktorý treba natočiť“ (`references/od-majitela.md`).
2. **Fakty len zo zdrojov**, prečítaných v ten deň: BARBERSHOP 30 `barbershop-30/docs/CONTENT_SOURCES.md`,
   HEAD SPA 30 `CLAUDE.md` a CSV v `docs/`. Každý záber s textom má pole `zdroj`.
3. **Text pre zákazníkov:** slovenčina, tykanie, krátko, bez pomlčiek em dash a en dash, nikdy
   zmienka o AI. Nástroj to kontroluje a pri chybe nerenderuje.
4. **Ľudia v zábere** podľa súhlasov: zamestnanci so súhlasom, klienti zozadu alebo nerozpoznateľní,
   deti len so súhlasom rodičov (`barbershop-30/docs/MEDIA_SELECTION.md`, `CHECKS.md` časť 5).
   Pole `ludia` ide do zoznamu „Treba potvrdiť“.
5. **Hlas** len nahratý majiteľom alebo tímom, alebo služba s výslovným súhlasom a rozpočtom majiteľa
   (pole `povod` povinné). **Hudba** len s licenciou od majiteľa (pole `licencia` povinné), inak bez hudby.
6. **Platené generovanie nikdy nespúšťaj sám** (napr. pripojený Higgsfield, služby na hlas alebo
   obraz). V návrhu ho môžeš spomenúť ako možnosť, ktorá ide až so súhlasom a rozpočtom majiteľa.
7. **Nič sa neuverejňuje automaticky.** Výstup sú súbory a zoznam „Treba potvrdiť“; uverejní majiteľ.
8. Výstupy ukážok a pracovné súbory do dočasného priečinka (scratchpad), nie do repozitára.

## Postup krok za krokom

Reťaz je ako v MoneyPrinterTurbo (téma, scenár, zábery, hlas, titulky, hudba, render), ale každý
krok je pod kontrolou (`references/moneyprinterturbo.md`).

1. **Podnik a téma.** Pre koho a čo má video povedať. Jedno video, jedna myšlienka.
2. **Scenár v troch vetách** podľa `../instagram-salon/` (režim Reel Scripter): 00 sľub, 01 čo
   dostaneš, 02 ako si rezervuješ. Každú vetu over v zdroji a zapíš `zdroj`.
3. **Zábery.** Ku každej vete záber, ktorý ju naozaj ukazuje (rozpoznateľné miesto, práca, dvere).
   Pre naše podniky sú v repozitári fotky filmu a videá majiteľa (tabuľka nižšie), inak si ich vypýtaj.
4. **Scenár JSON** podľa `references/scenar-vzor.json` (všetky polia s vysvetlením). Hotové:
   `references/scenar-barbershop-30.json`, `references/scenar-head-spa-30.json`.
5. **Kontrola:** `python3 -I scripts/reel.py scenar.json --kontrola` (texty, súbory, písma, rozloženie).
6. **Render:** `python3 -I scripts/reel.py scenar.json -o <scratchpad>/reel.mp4`.
7. **Pozri sa na výsledok** (`scripts/prehlad.py --zona`, detail, `scripts/plynulost.py`) a oprav
   kompozíciu: text nesmie ležať na hlavnom predmete ani na svetlom detaile (pozri Pasce).
8. **Odovzdanie:** MP4, titulná snímka JPG, SRT, zoznam „Treba potvrdiť“ a návrh popisu
   (`../instagram-salon/`, Post Writer). Nepíš, že je uverejnené.

## Príkazy

Z koreňa repozitára (cesty v hotových scenároch sú od koreňa, `zaklad` v scenári):

```bash
S=toolbox/skills-z-praxe/kratke-video
python3 -I $S/scripts/reel.py $S/references/scenar-barbershop-30.json --kontrola
python3 -I $S/scripts/reel.py $S/references/scenar-barbershop-30.json -o /tmp/reel/barbershop30-reel.mp4
python3 -I $S/scripts/reel.py $S/references/scenar-head-spa-30.json -o /tmp/reel/headspa30-reel.mp4 --format 1:1
python3 -I $S/scripts/prehlad.py /tmp/reel/barbershop30-reel.mp4 -o /tmp/reel/prehlad.jpg --zona
python3 -I $S/scripts/prehlad.py /tmp/reel/barbershop30-reel.mp4 --detail 1.5 -o /tmp/reel/detail.png
python3 -I $S/scripts/plynulost.py /tmp/reel/barbershop30-reel.mp4 --od 0.6 --do 3.4 --vyrez 400
python3 -I $S/scripts/reel.py --casy-hlasu hlas.m4a      # vety v nahrávke hlasu -> dĺžky záberov
```

`reel.py` voľby: `-o` výstup (vedľa neho `-titulka.jpg` a `.srt`), `--format 9:16|16:9|1:1`,
`--zaklad DIR` (odkiaľ sú relatívne cesty), `--prac DIR` a `--nechaj` (pracovné súbory: medzivýsledky
záberov, `titulky.ass`, `graf.txt`, písma), `--kontrola`. Návratový kód 1 = chyba (vypíše prečo).

## Čo nástroj robí

| časť | ako | prečo |
| --- | --- | --- |
| výstup | MP4 H.264 High 4.1, yuv420p, 30 snímok/s, BT.709, faststart; AAC 48 kHz len so zvukom; JPG obálka; SRT | to, čo prijmú Instagram, TikTok aj YouTube; platformy aj tak prekódujú |
| formáty | 9 : 16 1080 × 1920 (predvolený), 16 : 9 1920 × 1080, 1 : 1 1080 × 1080 | jeden scenár, tri miesta |
| fotka | výrez na pomer výstupu okolo `stred`, pohyb `najazd`, `odjazd`, `vlavo`, `vpravo`, `hore`, `dole`, `ziadny`; každá snímka lanczos z desatinného výrezu (Pillow) | žiadne skákanie po pixeloch (ffmpeg `zoompan` trasie, merané) |
| video | úsek `od`/`do`, výrez okolo `stred` alebo `vypln: pas`; zväčšenie lanczos + CAS ako `videa.sh`; voliteľne `stabilizuj`; HDR → SDR; zvuk videa sa zahodí | zdroj 576 × 1024 je malý; hlasy klientov nechceme |
| prechody | `strih` (predvolený) alebo `prelinanie` (xfade, 0,4 s) do záberu | pokojné, bez efektov |
| text | `stitok` (verzálky s linkou), `text` (veta, `*kurzíva*` ako akcent), `riadok`; vyvážené zalomenie, najviac 2 riadky; v bezpečnej zóne; mäkký lem a stmavenie len za textom | ako titulné karty webov |
| prekrytie | `overlay`: ProRes 4444 alebo WebM VP9 s alfou, od začiatku záberu cez celý obraz | rozhranie so skillom `motion-grafika` |
| zvuk | `hlas` (od času `od`) a `hudba` (pod hlasom stíšená), `loudnorm` dva prechody na -14 LUFS, špička -1,5 dBTP | bežná hlasitosť krátkych videí |
| kódovanie | kľúčové snímky len na hraniciach záberov | kľúčová snímka v strede nájazdu „cukne“ textúrou (merané) |
| kontrola | zakázané tvrdenia (všeobecné aj podľa značky v `references/znacky.json`), `zdroj`, `ludia`, `licencia`, `povod`, písma so všetkými slovenskými znakmi | pravidlá podnikov v kóde, nie len v hlave |

Podrobnosti, čísla a merania: `references/technika.md`.

## Rozhranie s motion-grafika (záväzné)

- Skill `../motion-grafika/` vyrába prekrytia s priehľadnosťou ako **ProRes 4444 `.mov`
  (`yuva444p10le`)** a **WebM VP9 s alfou (`yuva420p`)**, predvolene v rozmere výstupu reelu
  (1080 × 1920 pri 9 : 16).
- V scenári pri zábere: `"overlay": "<cesta k .mov alebo .webm>"`. `reel.py` ho položí cez celý obraz
  od začiatku záberu: `scale` na rozmer výstupu, `format=yuva420p` (alebo `yuva444p` pri 4:4:4),
  `overlay`. Trvá svoju dĺžku, najviac do konca záberu; iný rozmer alebo snímková frekvencia sa prevedie.
- WebM sa dekóduje cez `libvpx-vp9` (natívny dekodér alfu zahodí a prekrytie by zakrylo celý obraz).
- Titulky scenára idú nad prekrytie. Ak prekrytie nesie vlastný text, záber nech nemá `text`.

## Zábery v tomto repozitári

| podnik | čo | kde | poznámka |
| --- | --- | --- | --- |
| BARBERSHOP 30 | fotky filmu (AVIF/WebP, vo vysokom rozlíšení; `-m` = výrez na výšku) | `barbershop-30/assets/img/film/` (zoznam a pôvod `film.json`, kotvy `data-shot` v `barbershop-30/index.html`) | originály `barbershop-30/source/web-povodny/gallery/*.jpg` 4096 × 2731 dovolia vlastný výrez |
| BARBERSHOP 30 | videá majiteľa 576 × 1024, 30 snímok/s | `barbershop-30/source/video/video-1..3.mp4` | úseky a ľudia v `barbershop-30/docs/MEDIA_SELECTION.md`; súhlasy potvrdiť |
| BARBERSHOP 30 | písma, farby | `barbershop-30/assets/fonts/` (Fraunces, Manrope), `barbershop-30/assets/style.css` (`--paper`, `--ink`, `--lamp`) | predvoľba `barbershop-30` |
| HEAD SPA 30 | fotky filmu 2172 × 2896 na výšku, dvere 2400 × 2976 | `assets/img/film/`, `assets/img/dvere-2400.webp` | bez ľudí, netónované |
| HEAD SPA 30 | písma, farby | `assets/fonts/` (Lora, Manrope), `assets/style.css` (Luxusná vrstva: `--text-primary`, `--accent`) | predvoľba `head-spa-30`; zlatá kurzíva ako jediný akcent |

Ukážky z 2026-10-11 (scratchpad, nie v repozitári): BARBERSHOP 30 12 s (čakáreň, sála z video-2,
vstup), HEAD SPA 30 11,6 s (dvere, voda, lôžka); oba bez hudby, lebo licenciu nemáme.

## Pasce a lekcie

| pasca | čo sa stalo | riešenie |
| --- | --- | --- |
| text na svetlom detaile | nadpisok ležal na bielej tabuli Route 66 (čakáreň, výrez `-m`) | vlastný výrez z originálu (`stred` 0.62), tabuľa vpravo od textu |
| text na hlavnom predmete | HEAD SPA: nadpis zakryl zlaté kruhy dverí; zlatá kurzíva na zlatom oblúku vody | `"poloha": "hore"` na pokojnej ploche |
| text na čísle v obraze | telefón 0911 153 136 ležal na displeji lôžka so stupňami | iná poloha; čísla v obraze nemiešať s číslami v texte |
| `zoompan` trasie | výrez po celých pixeloch, mihotanie (CV 0,36; so 4x prevzorkovaním 0,27) | Pillow `resize(box=...)` s desatinným výrezom (CV 0,03) |
| „cuknutie“ v strede nájazdu | kľúčová snímka každé 2 s obnoví textúru | kľúčové snímky len v strede prelínaní, `-g` 10 s |
| WebM prekrytie zakryje všetko | natívny dekodér VP9 dá alfu 255 | `-c:v libvpx-vp9` pred vstupom |
| farba prekrytia mimo | prekrytie bez značky farieb (BT.601) na BT.709 | `scale=...:out_color_matrix=bt709` |
| testovacie prekrytie neviditeľné | `drawbox` na snímke s alfou nezapíše alfu | `drawbox=...:replace=1` |
| text menší, posunutý | libass berie veľkosť písma ako výšku riadka OS/2 win, nie em | `Fontsize = em × (winA + winD) / upem` (overené na pixel) |
| zlá hrúbka písma | Manrope vo woff2 má rodinu „Manrope ExtraLight“ pri všetkých hrúbkach | písma premenované na jedinečné rodiny „R30 …“ |
| výrez `-m` na šírku | `vstup-m` pri 16 : 9 sa zväčšuje 1,43x | pri 16 : 9 fotky na šírku (bez `-m`), video `vypln: pas` |
| tichá nahrávka hlasu | pevný prah -35 dB nenašiel žiadnu vetu | prah 12 dB pod priemerom nahrávky |
| fakty z pamäti | „8 rokov“, vzťah so Salónom 30, káva „pri recepcii“ | kontrola zakázaných tvrdení: prvé dve zastavia render, tretie upozorní |

## Mimo tohto repozitára

Skill sa dá použiť v inom chate: v Claude Code skopíruj priečinok `kratke-video` do
`~/.claude/skills/kratke-video/` (alebo do `.claude/skills/` projektu); v Claude.ai ho nahraj ako zip
priečinka medzi Skills v nastaveniach (Settings, Capabilities). Potom treba:

- **Programy:** python3 (3.9 alebo novší), Pillow s podporou AVIF a WebP (over
  `python3 -c "from PIL import features; print(features.check('avif'))"`), fontTools a brotli
  (`pip install pillow fonttools brotli`), ffmpeg s libass a libx264 (overené na 6.1; filtre `ass`,
  `xfade`, `cas`, `loudnorm`), pre WebM prekrytia libvpx, pre HDR zábery zscale (libzimg); fc-match
  (fontconfig) na náhradné písmo. Sieť netreba. Ak prostredie ffmpeg nemá (napr. niektoré webové
  chaty), skill pripraví scenár a príkazy a render spustí majiteľ na počítači.
- **Písma značky:** súbory TTF, OTF alebo WOFF2 (cesty do scenára: `"pisma": {"nadpis": …,
  "kurziva": …, "stitok": …, "riadok": …}`). Nástroj overí slovenské znaky; bez písiem použije
  DejaVu s upozornením. Farby do scenára (`"farby": {"text": "#…", "akcent": "#…", …}`) alebo vlastná
  značka v `references/znacky.json` (vzor: `barbershop-30`). Farby ber z CSS webu podniku, nie odhadom.
- **Zábery od majiteľa:** originály na výšku, 3 až 6 s na záber, ľudia so súhlasom
  (`references/od-majitela.md`). Cesty v scenári sú relatívne k `zaklad` (alebo `--zaklad`).
- **Fakty od majiteľa:** zoznam zdrojov s dátumom a stupňom overenia (vzor `barbershop-30/docs/CONTENT_SOURCES.md`),
  z ktorého sa berie `zdroj` každej vety; zakázané tvrdenia daj do `zakazane` vlastnej značky.
- **Hlas a hudba:** len súbory s pôvodom (`povod`) a licenciou (`licencia`) od majiteľa.

## Kontrolný zoznam

- [ ] Tri vety: sľub, čo dostaneš, ako si rezervuješ; každá s `zdroj` overeným dnes.
- [ ] Každý záber je skutočný záber podniku a ukazuje to, čo hovorí veta.
- [ ] `--kontrola` prešla bez chyby; upozornenia vyriešené alebo vysvetlené.
- [ ] Prehľad `--zona`: text mimo spodných 20 % a pravých 12 %, neleží na hlavnom predmete ani na
      svetlom detaile, diakritika v poriadku (detail v plnom rozlíšení).
- [ ] `plynulost.py` na úsekoch fotiek: plynulé (CV pod 0,15, bez zastavení a skokov).
- [ ] Výstup: H.264 High, yuv420p, 30 snímok/s, faststart áno; so zvukom okolo -14 LUFS.
- [ ] Hudba len s licenciou, hlas len s pôvodom; nič platené bez súhlasu a rozpočtu majiteľa.
- [ ] „Treba potvrdiť“ (súhlasy ľudí, licencie, fakty) odovzdané majiteľovi; nič neuverejnené.
