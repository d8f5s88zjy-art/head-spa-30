---
name: motion-grafika
description: Pohyblivá grafika vo vrstvách bez After Effects pre reels, shorts a TikTok podniku (BARBERSHOP 30, HEAD SPA 30, iný): lower third, titulná karta, priebeh a odpočet, značka na konci (end card). HTML kompozícia s pomenovanými vrstvami, texty a farby cez JSON, farby a písma zo style.css webu, render po snímkach (Playwright, ffmpeg) do ProRes 4444 .mov a WebM s alfou ako overlay. Použi pri motion graphics, titulku v obraze či logu na konci, aj keď niekto pošle video s After Effects, Higgsfield alebo MoneyPrinterTurbo.
---

# Pohyblivá grafika vo vrstvách

Grafika do krátkych videí podniku ako priehľadné prekrytie: kompozícia je HTML súbor, každá vrstva je prvok
s menom a časom (`data-layer`, `data-in`, `data-out`), texty a farby prichádzajú ako JSON. `scripts/render.mjs`
ju vykreslí snímku po snímke (Chromium, všetky animácie stoja a dostanú presný čas) do PNG s alfou a ffmpeg
z nich spraví ProRes 4444 `.mov`, WebM VP9 s alfou, náhľad MP4 na šachovnici a na zábere, prehľad snímok
s časovou osou vrstiev a detail na kontrolu ostrosti a okrajov.

Pôvod: video rourke.heath (TikTok, 61 s, pozreté 2026-10-11) ukazuje plugin Higgsfield v After Effects, ktorý
z referencie štýlu a jedného zadania postaví grafiku po pomenovaných, upraviteľných vrstvách. Postup sme si
vzali, nástroje nie: After Effects aj Higgsfield sú platené a generujú obraz, ktorý u nás nesmie predstierať
podnik. Rozbor: `references/after-effects-higgsfield.md`, ďalšie dve videá (MoneyPrinterTurbo):
`references/zdroje-videi.md`.

## Kedy použiť

- Treba lower third (meno a jedna informácia), titulnú kartu (až tri krátke riadky), priebeh krokov alebo
  odpočet, značku na konci (názov, adresa, výzva) do reelu, shorts, TikToku alebo Stories.
- Niekto pošle video s „motion graphics“, After Effects, Higgsfield, MoneyPrinterTurbo a chce to „takto“.
- Skill `kratke-video` potrebuje pri zábere prekrytie (`"overlay"` v scenári).

Nepoužívaj na generovanie záberov, ľudí ani priestoru podniku, na hlas, hudbu ani na uverejňovanie. Strih,
titulky reči a hudbu reelu rieši `../kratke-video/` (ak ho v toolboxe nájdeš), texty `../instagram-salon/`.

## Zásady

1. **Len skutočné zábery a fotky podniku** od majiteľa. Nič vymodelované, vygenerované ani z fotobánky.
2. **Fakty len zo zdrojov**, prečítaných v ten deň: BARBERSHOP 30 `barbershop-30/docs/CONTENT_SOURCES.md`,
   HEAD SPA 30 `CLAUDE.md` a CSV v `docs/`. Ku každému textu zapíš zdroj (`zdroje_faktov` v parametroch).
   Žiadne čísla bez zdroja (hodnotenie, roky praxe, „obsadené“). Čo zdroj nemá, vynechaj alebo sa spýtaj.
3. **Hlas:** slovenčina, tykanie, krátko, bez pomlčiek em dash a en dash, **v texte pre zákazníkov nikdy
   zmienka o AI**. Správny názov značky (Barbershop 30; HEAD SPA 30, Salón 30 len ako miesto).
4. **Ľudia v zábere podľa súhlasov:** zamestnanci so súhlasom, klienti nerozpoznateľní (zozadu, z profilu
   v diaľke), pred uverejnením potvrdiť u majiteľa (`barbershop-30/docs/MEDIA_SELECTION.md`, `CHECKS.md` časť 5).
5. **Nič sa neuverejňuje automaticky.** Výstup je súbor na schválenie; uverejňuje majiteľ.
6. **Platené generovanie nikdy bez súhlasu.** Pripojený Higgsfield v Claude účte, služby na hlas a podobné
   míňajú kredity: spustiť len s výslovným súhlasom majiteľa a rozpočtom povedaným vopred, a nikdy na zábery
   podniku. Táto šablóna nič také nepotrebuje.
7. **Štýl webov:** zdržanlivý. Len krytie, posun do 24 px, stierka, rast linky; žiadne žiary, sklo, čiastočky,
   poskakovanie, rozmazanie textu, blikanie (`CLAUDE.md`, `barbershop-30/docs/ART_DIRECTION.md`).
8. **Výstupy mimo repozitára** (scratchpad, priečinok majiteľa). V repozitári je len skill.

## Rýchla cesta

```bash
S=toolbox/skills-z-praxe/motion-grafika
# lower third BARBERSHOP 30 na 4 s záberu, výstup do scratchpadu
node $S/scripts/render.mjs $S/priklady/bs30-lower-third.json --von <scratchpad>/grafika \
  --zaber barbershop-30/source/video/video-3.mp4 --zaber-od 1
# iný text bez úpravy súboru, samostatný náhľad s časovou osou do prehliadača
node $S/scripts/render.mjs $S/priklady/bs30-lower-third.json --von <scratchpad>/grafika \
  --text "info=Po až Pi 9:00 až 19:00" --html <scratchpad>/grafika/nahlad.html
# celá ukážka (lower third a značka na konci na video-3, aj spojené 8 s)
bash $S/scripts/ukazka.sh <scratchpad>/grafika-demo
# písmo: slovenské znaky, prípadne prevod woff2 na TTF pre iný nástroj
python3 -I $S/scripts/fonty.py --ttf <scratchpad>/ttf barbershop-30/assets/fonts/*.woff2
```

Výstup (`--von`): `<meno>.mov`, `<meno>.webm`, `<meno>-nahlad.mp4` (šachovnica), `<meno>-nahlad-zaber.mp4`
(s `--zaber`), `<meno>-prehlad.png`, `<meno>-detail.png`, `<meno>-vrstvy.txt`; `--nechaj-snimky` nechá PNG,
`--len-snimky` vynechá kódovanie. Návratový kód 1: písmo sa nenačítalo alebo mu chýba znak, ffmpeg, chyba stránky.

## Šablóny

| šablóna | vrstvy (ako na časovej osi) | dĺžka | parametre |
| --- | --- | --- | --- |
| `lower-third` | Doska, Linka, Meno, Info | 4 s | `meno`, `info` |
| `titulna-karta` | Clona, Nadpisok, Riadok 1 až 3 | 3,5 s | `nadpisok`, `riadok1` až `riadok3`, `clona` |
| `priebeh` | Doska, Popis, Počítadlo, Dráha, Výplň, Bod, Kroky | 4,2 s | `popis`, `krok1` až `krok4`, `priebeh_od`, `priebeh_do`, `pocitadlo` |
| `znacka` | Clona, Nadpisok, Názov, Linka, Adresa, Výzva | 4 s | `nazov`, `adresa`, `vyzva`, `nadpisok`, `clona` |

Časy, nástupy a čo ktorá vrstva robí: `references/vrstvy-sablon.md`. Značky: `sablony/znacky/barbershop-30.json`
a `head-spa-30.json` (farby, krivky, polomery a tiene sa pri každom renderovaní dosadia z premenných v :root
style.css webu; písma woff2 z webu). Vzory parametrov v `priklady/` (fakty so zdrojmi). Nová šablóna alebo
značka: `references/kompozicia.md`.

## Postup krok za krokom

1. **Podnik, zdroje, súhlasy.** Zisti značku, prečítaj zdroje faktov, vypýtaj si zábery od majiteľa
   a over súhlasy ľudí v nich.
2. **Zadanie po vrstvách** podľa `references/zadanie-po-vrstvach.md`: čo postaviť, texty so zdrojom, rozmer
   a dĺžka podľa záberu v scenári, poloha, vrstvy, podklady, čo nie.
3. **Parametre:** skopíruj vzor z `priklady/`, prepíš `texty`, `dlzka`, prípadne `nastavenia` a `vrstvy`.
   Kód šablóny kvôli textu nemeň.
4. **Render** s `--zaber` na skutočnom zábere (zväčšenie lanczos + CAS ako v `../video-a-sekvencie/`).
   1080 × 1920 trvá v kontajneri asi 0,1 s na snímku, 4 s grafika s náhľadmi asi minútu.
5. **Pozri prehľad a detail sám** (obrázky otvor, nespoliehaj sa len na čísla):
   - prehľad: nástup a odchod v poradí, nič nenaskočí, čiarkovaný rámik = bezpečná zóna, časová os vrstiev;
   - detail 1 : 1: ostrosť písma, diakritika (á, ľ, ô, ť…), okraj na bielej (tmavý lem) a na čiernej (svetlý lem);
   - konzola: `kontrola` (alfa `.mov` a `.webm`, lem, plynulosť, prvá a posledná snímka) a `varovania`
     (mimo zóny, pretečenie, zmenšený text, chýbajúca premenná zo style.css).
   Oprav a renderuj znova, kým to nie je pekné.
6. **Odovzdanie:** `.mov` (strih, After Effects, `kratke-video`), `.webm` (prehliadač, menší), náhľad na
   schválenie. Pri `kratke-video` daj cestu do `"overlay"` záberu; dĺžka a fps ako záber.
7. **Uverejní majiteľ.** Pripomeň súhlasy a zdroje faktov.

## Rozhranie s kratke-video (záväzné)

motion-grafika vyrába prekrytie ako ProRes 4444 `.mov` (`yuva444p10le`) a WebM VP9 s alfou (`yuva420p`),
predvolene 1080 × 1920 ako výstup reelu pri 9:16. `kratke-video/scripts/reel.py` ho pri zábere s poľom
`"overlay"` položí cez celý obraz od začiatku záberu (`scale` na rozmer výstupu, `format=yuva420p` alebo
`yuva444p`, `overlay`). Dve veci, bez ktorých to nejde:

- **WebM treba dekódovať cez `-c:v libvpx-vp9`** pred `-i`; vstavaný dekodér alfu zahodí a pozadie je čierne
  (overené). `.mov` funguje bez toho.
- **Dĺžka prekrytia = dĺžka záberu.** reel.py (stav 2026-10-11) prekrytie oreže na dĺžku záberu a po konci
  súboru ho nekreslí (`eof_action=pass`). Lower third, titulná karta a priebeh končia priehľadnou snímkou, tam
  to nevadí; značku na konci renderuj s `--dlzka` rovnou dĺžke záberu, inak karta zmizne skôr, než záber skončí.

Overený príkaz, farby (bt709), rovná alfa a ffprobe: `references/rozhranie-prekrytia.md`.

## Pasce a lekcie (z tejto práce)

Prvé tri sa naozaj stali pri stavbe ukážky (2026-10-11); 12 bitov, veľkosť `.mov`, chýbajúci znak a farby sme videli pri testoch; ostatné sú ošetrené v kóde vopred.

| pasca | čo sa stalo | riešenie |
| --- | --- | --- |
| WebM s alfou vo ffmpeg čierny | vstavaný dekodér VP9 alfu ignoruje (alfa mimo o 136 z 255) | `-c:v libvpx-vp9` pred `-i`; pre strih radšej `.mov` |
| snímka z `.mov` na podklade prázdna | `-ss` pred vstupom posunie prvú snímku o zlomok, `overlay` na čase 0 ešte nemá čo kresliť | `setpts=PTS-STARTPTS` na prekrytí |
| okraje v šablóne nefungovali | `#kompozicia p { margin: 0 }` prebilo triedy šablóny (váha id) | nulová váha: `:where(#kompozicia) :where(p, h1, h2)` |
| animácia vrstvy zmizla | `display: none` ruší CSS animácie | čas vrstvy cez `visibility` (`.mg-mimo`) |
| render nesedí s náhľadom | CSS `transition` beží v reálnom čase | pri renderovaní vypnuté; pohyb len animáciami |
| nástup prepísal centrovanie | `transform` v nástupe by prebil `transform` šablóny | nástupy menia `translate`, `scale`, `opacity`, `clip-path` |
| krok priebehu „naskočí“ | zmena farby v jednej snímke | `--hotovo` 0 až 1 podľa priebehu, `color-mix` |
| ffprobe hlási 12 bitov | dekodér ProRes 4444 vydáva vždy `yuva444p12le` | kódované je `yuva444p10le`, je to v poriadku |
| `.mov` je veľký | ProRes 4444 1080 × 1920: lower third 14 MB, karta s jemnou clonou 80 MB za 3,5 s | na strih `.mov`, do prehliadača `.webm` (0,1 až 0,2 MB) |
| písmo bez znaku | renderer vidí len to, čo sa kreslí | `fonty.py` overí každý znak v súbore písma, ktorým sa kreslí; chýbajúci zastaví render |
| farby odhadom | lákavé opísať hex z obrázka | `{--premenna}` zo style.css pri každom renderovaní, výpis farby s premennou |
| vrstva za koncom | `out` dlhší ako dĺžka | záporný `out` (od konca) a varovanie |
| hlavný údaj ako vo videu | vo videu výška hráča, štatistiky | u nás len údaj zo zdroja faktov, žiadne čísla bez zdroja |

## V tomto repozitári

| čo | kde |
| --- | --- |
| renderer, kontrola, písmo, ukážka | `scripts/render.mjs`, `scripts/kontrola.py`, `scripts/fonty.py`, `scripts/ukazka.sh` |
| beh kompozície a základ vzhľadu | `sablony/mg.js`, `sablony/mg.css` |
| šablóny | `sablony/lower-third.html`, `titulna-karta.html`, `priebeh.html`, `znacka.html` |
| značky | `sablony/znacky/barbershop-30.json` (`barbershop-30/assets/style.css`), `head-spa-30.json` (`assets/style.css`) |
| písma značiek | `barbershop-30/assets/fonts/` (Fraunces, Manrope), `assets/fonts/` (Lora, Manrope); všetky majú slovenské znaky (overené `fonty.py`) |
| zábery na ukážky | `barbershop-30/source/video/video-1..3.mp4` (576 × 1024, 30 snímok/s; súhlasy podľa MEDIA_SELECTION.md) |
| vzory parametrov | `priklady/bs30-lower-third.json`, `bs30-znacka.json`, `bs30-priebeh.json`, `hs30-titulna-karta.json`, `odpocet.json` |
| podrobnosti | `references/` (vrstvy šablón, kompozícia, rozhranie, After Effects a Higgsfield, zadanie, zdroje videí) |
| balenie skillu do zipu | `python3 -I toolbox/skills-z-praxe/zabal.py <cieľ> motion-grafika` |

## Mimo tohto repozitára

Skill sa dá použiť aj v inom chate: Claude Code na inom počítači (priečinok `motion-grafika/` do
`~/.claude/skills/`), Claude.ai (zip zo `zabal.py`, Settings, Capabilities, Skills). Treba:

- **Programy:** node (overené 22), Playwright s Chromium (kde chýba, `npx playwright install chromium`
  alebo `--chromium <cesta k prehliadaču>`), ffmpeg s `prores_ks`, `libvpx-vp9` a `libx264` (overené 6.1.1),
  python3 s Pillow, fontTools a brotli (woff2). Bez siete. Kde tieto programy nie sú (napríklad prostredie bez
  prehliadača), skill aj tak poslúži na zadanie po vrstvách a parametre; render spusti tam, kde programy sú.
- **Koreň s webom značky:** renderer hľadá `style.css` a písma podľa JSON značky pod `--koren` (alebo
  `MG_KOREN`, inak tri priečinky nad skillom, inak aktuálny priečinok). Bez nich použije `farby_zaloha`
  a vypíše to; zálohy sú opísané zo style.css k 2026-10-11, pri zmene webu ich oprav.
- **Písma od majiteľa:** pre iný podnik súbory písma (woff2, ttf, otf) s právom na použitie. Pred prvým
  renderom `fonty.py`: musí mať á ä č ď é í ĺ ľ ň ó ô ŕ š ť ú ý ž aj veľké; ak nie, povedz to a vyber náhradu
  so všetkými znakmi. Nástroju, ktorý chce TTF, daj prevod `fonty.py --ttf <priečinok>` (overí ho znova).
- **Farby a tvary od majiteľa:** nová značka dostane vlastný JSON v `sablony/znacky/` s premennými z jej
  style.css; bez webu hodnoty z manuálu značky od majiteľa, nikdy odhad z obrázka.
- **Zábery od majiteľa:** skutočné videá a fotky podniku, ideálne 1080 × 1920 alebo viac; pri ľuďoch súhlas.
- **Fakty od majiteľa:** názov, adresa, výzva, hodiny, služby so zdrojom a dátumom (vzor `CONTENT_SOURCES.md`).
  Bez zdroja sa text nepoužije.

## Kontrolný zoznam

- [ ] Značka a správny názov; každý text má zdroj prečítaný dnes; žiadne číslo bez zdroja.
- [ ] Tykanie, krátko, bez em dash a en dash, bez zmienky o AI.
- [ ] Záber je skutočný od majiteľa; ľudia v ňom so súhlasom, klienti nerozpoznateľní.
- [ ] Farby a písma zo značky (výpis farieb s premennými), `fonty.py` bez chýbajúcich znakov.
- [ ] Render bez varovaní (zóna, pretečenie) alebo s vysvetleným varovaním (zmenšený text).
- [ ] Kontrola: alfa `.mov` aj `.webm` do 2 z 255 (render varuje nad 3), lem 0 %, žiadne osamelé skoky, prvá snímka priehľadná.
- [ ] Prehľad a detail som si pozrel: ostré písmo, diakritika, okraje na bielej a čiernej, bezpečná zóna.
- [ ] Žiadne žiary, sklo, čiastočky, poskakovanie; nástupy pokojné.
- [ ] Výstupy mimo repozitára; uverejní majiteľ; platené generovanie nespustené (alebo so súhlasom a rozpočtom).
