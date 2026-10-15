# GYM KLUB – poznámky k implementácii redizajnu

Záväzná špecifikácia: `redesign/SPEC.md`. Vetva `redizajn-2026-10` (z `main` 396f446), len lokálne commity, bez push.

Záväzné úpravy zadania, ktoré majú prednosť pred SPEC:

1. **Logo v hlavičke:** plnofarebné `assets/img/gymklub-logo.svg` na bielej kartičke (`.brand--card`, 40 px na ≥ 861 px, 34 px na mobile). Reverzné `gymklub-logo-tmave.svg` sa pripraví (B1), ale nepoužije. Pätička: plnofarebné logo ako v SPEC.
2. **`priestor.uvod`** = „Pozrite si klub ešte pred prvou návštevou.“ (bez „čo si vziať“). Ďalšie nové viditeľné texty len neutrálne a pravdivé.
3. Každý balík = jeden lokálny commit so slovenskou správou.

---

## B0 Príprava prostredia a vzoru (14. 10. 2026)

- **Disk:** pred začatím 16 GB voľných (≥ 0,6 GB). Vyrovnávacie pamäte pip a uv (≈ 440 MB) som nemazal – nebolo to treba (zadanie: „zmaž len ak treba“). `lupa/_site` zmazaný a zostavený znova.
- **Zmrazený vzor:** `python3 nastroje/zostav.py --vystup ../lupa-vzor-cms` na čistom `main` 396f446 **pred** vytvorením vetvy a pred akoukoľvek zmenou. `../lupa-vzor-cms/index.html` sha256 `199291a501dbf6efdda8bea5733dee98125fca26d2bce30597153e44d880297b`.
- **Vetva:** `git switch -c redizajn-2026-10` z 396f446.
- **`nastroje/porovnaj_so_vzorom.mjs`** (len podľa 8.5):
  - prepínač `BEZ_PIXELOV=1` preskočí celý krok 1 (snímky, pixely, výška, texty sekcií, JSON-LD) – podľa vzoru `redesign/audit-cms/skripty/porovnaj-bez-pixelov.mjs`;
  - pri `BEZ_PIXELOV` sa lightbox porovnáva len ako „každý záber sa otvoril a má neprázdny popisok“ (počet záberov sa v redizajne mení); filter, dni, odkazy Tréner a otázky sa porovnávajú celé;
  - `SEKCIE` bez `.ticker`, `.bridge`, `.band`, s `.opener`; `ZIVE`: `#cesta` → `#cesta [data-live]`;
  - *(doplnené po kontrole B0+B1)* pri `BEZ_PIXELOV` sa v kroku 2 (živé texty) neporovnáva počet odkazov – pozri „Opravy po kontrole B0+B1 › 3“.
- **Akceptácia B0:**
  - unittest 70/70 OK (27 s);
  - `node nastroje/test_prehliadac.mjs ../lupa-vzor` – „Všetko v poriadku.“, kód 0 (log `redesign/impl/B0/test_prehliadac-vzor.log`);
  - `BEZ_PIXELOV=1 node nastroje/porovnaj_so_vzorom.mjs ../lupa-vzor-cms ../lupa-vzor-cms …` – „Bez rozdielov“, kód 0; 14 kombinácií šírka × čas, filter 8×, dni 7×, Tréner 11×, otázky 6×, lightbox 22× (výstup `redesign/overenie/porovnanie-B0-vzor-vzor/`).
- **Východiskové merania** (`redesign/overenie/vychodisko-B0.json`, vzor `lupa-vzor-cms`, `reducedMotion: reduce`, Chromium Playwright):
  - gzip: `index.html` 23,9 kB, `style.css` 32,1 kB, `app.js` 11,8 kB, `depth.js` 5,5 kB, logo SVG 21,9 kB;
  - výška stránky: 29,9 obrazovky pri 390 × 844, 20,8 pri 1440 × 900 (s obmedzeným pohybom; audit bez neho uvádza 35,5 / 27,3);
  - prenos po prejdení celej stránky (súčet `content-length`): 7,4 MB pri 390, 6,7 MB pri 1440.
- Snímky pred commitom (390 a 1440: úvod, Kde začať, Prečo, Priestor, Bar, Tréningy, Kontakt) v `redesign/impl/B0/snimky/` – web je nezmenený, bez chýb JS a HTTP.


---

## B1 Médiá a jednotná gradácia (14. 10. 2026)

Commity na vetve `redizajn-2026-10`: B0 `534f588`, B1 `d8fbe2f` (lokálne, bez push; `main` ostáva na 396f446).

### Čo pribudlo

- **`nastroje/fotky.py` – `zjednot(im, rola)`** podľa 7.1, len Pillow (`ImageChops`, `ImageStat`, `ImageEnhance`, LUT cez `point()`), bez numpy. Poradie: EXIF orientácia + sRGB → vyváženie bielej (maska neutrálnych pixelov zo zmenšeniny 256 px) → gama na jas 110 (ohraničenie 0,70–1,40) → rameno svetiel nad 0,72 a čierny bod 0,035 → sýtosť → vinetácia −8 % v rohoch. Výsledok nemá v `info` ICC ani EXIF (pixely sú sRGB).
  - `spracuj()` (fotky nahraté cez CMS) volá `zjednot()` namiesto `exif_transpose` + `_do_srgb` pred orezom (7.1 „používa ju spracuj()“; v 8.3 je to aj v zozname pre B2 – je to už hotové).
  - Poistky: jas pred úpravou < 45 alebo > 180, alebo < 2 % neutrálnych pixelov → len vyváženie bielej (pri 0 neutrálnych pixeloch sa nemení nič). Táto poistka má prednosť pred rolou.
  - `rola == 'trener'`: vyváženie bielej a **len strop** sýtosti (zníženie nad 0,22, nie zvýšenie pod 0,128) – „strop sýtosti“ chápem doslova, je to konzervatívnejšie pre portréty.
- **`TestZjednotenie`** (5 testov): sivý obrázok s nádychom R/B 0,90 a jasom 80 → R/B neutrálnych 1,05 (cieľ 1,06 ± 0,03), jas 109 (110 ± 8); jas 20 sa nemení (± 3); tréner bez zmeny jasu; výsledok bez ICC a EXIF (aj pri vstupe s nimi, všetky roly); v čistom interpreteri (`python -I`) po importe `fotky` a volaní `zjednot()` nie je `numpy` v `sys.modules`. `test_subory_webu` overuje aj `assets/img/gymklub-logo-tmave.svg` (zmena z 8.5, súbor už existuje).
- **`nastroje/media/orezy.json`** (21 id podľa tabuľky 7.2, formát `{id: {zdroj, t:{sirka,x,top,sirky[,pomer]}, w:{top,sirky}}}`; `pomer` len pri 3 : 2 Panda a 4 : 3 bar).
- **`nastroje/media/priprav_fotky.py`** (7.3): originál → `zjednot()` → orez → LANCZOS → `assets/img/f/{id}[-w]-{šírka}.{avif,webp,jpg}` bez metadát; tabuľka veľkostí a kontrola rozpočtu 7.4; `--harok` (kontaktný hárok pred zápisom, porovnanie s `--sucasne`), `--bez-exportu`, `--plagaty`. Zdroj sa hľadá ako `<kód>-image.jpg` (`--zdroj`), `<kód>-orig.png` (`--gymfoto`), `<kód>-1200.jpg` (`--panda`).
  - Spustené: `python3 nastroje/media/priprav_fotky.py --zdroj /root/.claude/uploads/e4fc08a7-9804-506e-a6e2-06fd64c3d915 --gymfoto …/scratchpad/gymfoto --panda /home/user/head-spa-30/lipa-gym/3d/media --sucasne ../lupa-vzor-cms/assets/img/f --harok redesign/overenie/orezy-harok.jpg --plagaty` (kód 0, 70 s).
- **`nastroje/media/metriky_pisma.py`** (2.3, fontTools): výstup v `redesign/overenie/B1/metriky-pisma.txt`:
  ```css
  @font-face{font-family:"Oswald F";src:local("Arial Narrow"),local("Arial");size-adjust:87.31%;ascent-override:136.64%;descent-override:33.10%;line-gap-override:0%}
  @font-face{font-family:"Manrope F";src:local("Arial");size-adjust:105.03%;ascent-override:101.50%;descent-override:28.56%;line-gap-override:0%}
  ```
- **Logo** `assets/img/gymklub-logo-tmave.svg` = bajtová kópia `redesign/znacka/logo-reverz-0dp.svg`: 38 383 B, **14 723 B gzip** (≤ 15 kB), výplne len `#e2412f` a `#f4f2ec` (žiadne stroke, opacity, gradienty). Obrys pri výške 96 px a DPR 2: masky tvarov 23 447 vs 23 453 px, líši sa 1,6 % hranových pixelov (zaokrúhlené súradnice), snímka `redesign/overenie/B1/logo-96px-200pct.png` – tvary písmen totožné. Podľa záväznej úpravy zadania sa **nepoužíva** (hlavička ostáva plnofarebná na kartičke).
- **Video** `assets/video/zapasenie.{mp4,webm}` prekódované z pôvodného súboru (overené `cmp` s `../lupa-vzor-cms`), rozmer 576 × 720, 17,95 s:
  - MP4 **1 163 724 B** (≤ 1,2 MB), H.264 High, yuv420p, AAC 96 kb/s, `moov` pred `mdat` (faststart);
  - WebM **879 532 B** (≤ 0,9 MB), VP9 + Opus 64 kb/s.
- **Plagáty** `assets/video/{zapasenie,mds,ladydefence}-poster.{avif,webp}` z existujúcich `.jpg` (rozmer ako video: 576 × 720, 464 × 832, 464 × 832; AVIF 19,7 / 13,6 / 12,7 kB ≤ 30 kB) a `ladydefence-nahlad.{avif,webp,jpg}` 192 × 256 (stred plagátu 3 : 4). Plagáty sa nezjednocujú – musia sedieť na prvý snímok videa.
- **`.pages.yml`**: `foto_mozaika` + `funkcna-zona-4` (test katalógu), popisky `hlavna-sala-3`, `stroje-3`, `volne-vahy-2` → „(obe)“; `foto_na_vysku` + `funkcna-zona-4`, `hlavna-sala-3`, `stroje-3` (majú teraz sadu t) a `mma-1-32` (8.2). `foto_hlbka` bez zmeny (`funkcna-zona-4` nemá hĺbkovú mapu; komponent ruší B2). Nič sa nemazalo.

### Odchýlky od SPEC a prečo

1. **Video – CRF.** Príkaz zo 7.5 (`-crf 26`, resp. VP9 `-crf 36`) dáva 2,26 MB, resp. 2,58 MB – viac ako pôvodné súbory (zdroj z ruky je zrnitý). Ostatné parametre som nechal a zvýšil CRF, kým súbor nesplnil cieľ: H.264 `-crf 33` (crf 32 = 1,28 MB), VP9 `-crf 53` (crf 52 = 934 kB). Snímok v 9. s porovnaný s originálom (`redesign/impl/B1/video-porovnanie.jpg`): pri zobrazovanej veľkosti bez viditeľných artefaktov, VP9 o niečo mäkšie na žinenkách.
2. **„hrá (ffprobe)“.** `ffprobe` v kontajneri nie je (len statický `ffmpeg`). Náhrada: `ffmpeg -i` (prúdy, trvanie) a úplné dekódovanie `ffmpeg -v error -i … -f null -` bez chýb pre MP4 aj WebM; WebM navyše prehraté v Chromiu (`currentTime` 1,51 s po 1,5 s). Chromium z Playwrightu nemá H.264 (`canPlayType('video/mp4; codecs="avc1.64001f, mp4a.40.2"')` vracia prázdny reťazec – vlastnosť prostredia, nie súboru), preto MP4 len cez ffmpeg. **Ručne overiť MP4 v Safari** (11.5).
3. **Rozpočet WebP/JPG** *(na potvrdenie orchestrátorom, pozri „Opravy po kontrole B0+B1 › 4“)*. „WebP najviac 1,4× AVIF, JPG 2,2× AVIF“ počítam voči **rozpočtu AVIF** danej sady (napr. `-1600`: AVIF ≤ 160, WebP ≤ 224, JPG ≤ 352 kB), nie voči skutočnej veľkosti AVIF (pri AVIF q50 by JPG musel mať kvalitu okolo 55). SPEC určuje krok −4 (najviac 2×) len pre AVIF; pre záložné WebP a JPG (prehliadače bez AVIF) skript povoľuje najviac 5 krokov (WebP ≥ 58, JPG ≥ 62). Najnižšie použité: JPG 62 (`funkcna-zona-7-1600`, `funkcna-zona-5-1600`), WebP 62 (`funkcna-zona-5-1600`). AVIF znížené len 2× o jeden krok (`funkcna-zona-5-1600`, `hlavna-sala-1-1600` → q46).
4. **Metriky písma.** SPEC 2.3 má `ascent-override = hhea.ascent / unitsPerEm`. Chromium však prepísané metriky ešte násobí `size-adjust` – overené testom (`redesign/impl/B1/pismo/`): Oswald 500 pri 100 px má výšku riadka 148 px, záložná tvár podľa vzorca zo SPEC 129 px, s delením `size-adjust` 148 px; Manrope 137 / 144 / 137 px. Skript preto delí ascent/descent hodnotou `size-adjust` (bez toho by sa nadpisy po načítaní písma posunuli – proti cieľu CLS). Ako Arial slúži Liberation Sans (rovnaké šírky znakov). Rezy: Oswald 500 (H2/H3), Manrope 400.
   - **Pre B2:** `size-adjust` 87 % je voči Arial. Ak má zariadenie `Arial Narrow` (prvé v `src` „Oswald F“), záložný text bude asi o 18 % užší, než by mal. Odporúčam v B2 zvážiť `src:local("Arial")` bez Arial Narrow alebo to zmerať.
5. **Orezy `w` posunuté nadol** (pravidlo 7.2 „viac stropu ako dnes → top +0,04 až +0,10“). Dnešnú polohu orezu som zistil porovnaním dnešnej webovej verzie s originálom (OpenCV `matchTemplate`, zhoda 0,96–0,99; `redesign/impl/B1/dnesne_orezy.txt`). Nový top = najmenej +0,04 a aspoň po dnešný horný okraj, najviac +0,10:

   | id | SPEC `w` top | dnes | nový `w` top | voči dnešku |
   |---|---|---|---|---|
   | `funkcna-zona-5` | ,34 | ,348 | **,38** | horný okraj nižšie |
   | `stroje-4` | ,24 | ,339 | **,34** | rovnako ako dnes |
   | `hlavna-sala-4` | ,28 | ,339 | **,34** | rovnako ako dnes |
   | `kardio-1` | ,36 | ,369 | **,40** | horný okraj nižšie |
   | `hlavna-sala-3` | ,32 | ,339 | **,36** | horný okraj nižšie |
   | `stroje-3` | ,32 | ,369 | **,37** | rovnako ako dnes |
   | `volne-vahy-1` | ,30 | ,369 | **,37** | rovnako ako dnes |

   *(Opravené po kontrole B0+B1.)* Presne voči dnešným orezom (`redesign/impl/B1/dnesne_orezy.txt`):
   - **rovnako ako dnes:** `funkcna-zona-7` t (1,00 od ,00, dnes tiež od ,000), `stroje-4` w, `hlavna-sala-4` w, `stroje-3` w a `volne-vahy-1` w (rozdiel ≤ 0,001 je zaokrúhlenie); bar a Panda (dnešný orez = celý záber, zhoda 1,00, len gradácia);
   - **horný okraj nižšie:** orezy `t` so šírkou 0,86, ktoré dnes existujú (od ,12–,16, dnes celá šírka od ,062), `funkcna-zona-5` w, `kardio-1` w, `hlavna-sala-3` w, `funkcna-zona-7` w (,22 vs ,148) a `hlavna-sala-1` w (,30 vs ,209). Pri šírke 0,86 nižší horný okraj kvôli priblíženiu **nezaručuje** menší podiel stropu v zábere; na hárku nie je podiel stropu väčší ako dnes (vizuálna kontrola), teda pravidlo 7.2 („viac stropu → posunúť“) je splnené;
   - **nové, dnes neexistujú:** `funkcna-zona-4` t aj w, `volne-vahy-2` w, `hlavna-sala-3` t, `stroje-3` t.

### Kontrola orezov (`redesign/overenie/orezy-harok.jpg`, 2558 × 11824 px, nový orez vs `lupa-vzor-cms`)

- **Ľudia:** žiadni, ani v zrkadlách. Výrezy 100 % (`redesign/impl/B1/z-*.jpg`): `funkcna-zona-4` w vpravo (zrkadlá – tvar v pravom zrkadle je odraz boxovacieho vreca: tmavé veko, svetlý pás, telo; potvrdené zväčšením originálu 4×), `hlavna-sala-1`, `hlavna-sala-4`, `u-38047dcd`, `tatami-3`, `jednorucky-1`.
- **Strop:** pri žiadnej sade nie viac ako dnes (po posune vyššie); časť orezov je rovnaká ako dnes – presne v bode 5 odchýlok *(opravené po kontrole B0+B1, pôvodne „menej ako dnes pri všetkých sadách“)*.
- **Cudzí nápis – NÁLEZ** (rozhodnuté po kontrole B0+B1, záväzne pre B2: pozri „Opravy po kontrole B0+B1 › 1. Zábery s cudzím nápisom“ nižšie):
  - `funkcna-zona-7` (t aj w): na presklenej stene vzadu čitateľný nápis susednej firmy „SATELITNÁ TECHNIKA – predaj · montáž“ (`redesign/overenie/B1/napis-funkcna-zona-7-{t,w}.jpg`). Na súčasnom webe je tiež (pás funkčnej zóny).
  - `funkcna-zona-5` (t aj w): v oknách plagáty „ANTIK“ a „namiSAT“ (reklama susednej predajne) – pri medzihre na počítači (1440 px, bez prekrytia v pravej polovici) by boli čitateľné (`napis-funkcna-zona-5-{t,w}.jpg`).
  - Orezom sa nápisy odstrániť nedajú (sú v strede záberu) a retuš je zakázaná (1.1). Sady som vyrobil podľa 7.2 (sú aj v dnešnom katalógu), ale podľa pravidla 7.2 by sa tieto zábery **nemali použiť** v úlohách z 4.2 a 4.4. Pôvodný návrh pre B2 (už neplatí – nahradilo ho záväzné rozhodnutie v časti „Opravy po kontrole B0+B1“):
    - úvod na telefóne: `uvod.foto_telefon` = prázdne → sada t z `funkcna-zona-4` (bez nápisov a ľudí, overené výrezom); generátor aj test `test_fotka_na_telefon` túto cestu podporujú;
    - náhľad „Sila a postava“ (len počítač, 420 px): nápis pri tejto veľkosti nečitateľný (≈ 4 px), možno ponechať `funkcna-zona-7`;
    - medzihra: iný záber funkčnej zóny so sadou t aj w bez nápisu nie je (`funkcna-zona-4` je v úvode). Možnosti: ponechať `funkcna-zona-5` (SPEC) a dofotiť (7.8), alebo použiť `funkcna-zona-7` w (nápis menší, ≈ 9 px pri 1440 a pod prekrytím). Predvolene nechávam rozhodnutie na B2/majiteľa.
  - `mma-1-32`: v sále Panda Fight Club je banner „ProFighters.eu“ (partner klubu); orez je totožný s dnešným webom, súvisí s otázkou 13.3 (súhlas klubu).
  - Značky na náradí (Life Fitness, London) a plagát nápoja v zrkadle (`hlavna-sala-1`, zrkadlovo) nepovažujem za nápis cudzej firmy.

### Dočasný stav (do B2)

- Hĺbkové mapy `assets/img/d/` k pregenerovaným záberom (`funkcna-zona-5`, `-7`, `hlavna-sala-1`, `-4`, `kardio-1`, `stroje-4`, `volne-vahy-1`) sedia na staré orezy; týka sa to len WebGL efektu dnešnej šablóny, ktorý B2 ruší (`depth.js`, `assets/img/d/`). **Artefakt je viditeľný pri plnom pohybe** (bez `reduce`): pri 1440 aj 1024 px zubaté roztrhnutie červeného rigu vpravo v páse funkčnej zóny (nález kontroly B0+B1, pozri „Opravy po kontrole B0+B1 › 2“). Moje snímky B1 boli len s `reduce`, preto to nezachytili.
- Starou šablónou pribudla v `srcset` šírka 1600w pri 6 fotkách filmu a pásu so `sizes="100vw"` a `volne-vahy-2` má `src` `-1600.jpg` → telefóny s DPR ≥ 2 v medzistave sťahujú väčšie súbory. Napraví to nová šablóna v B2 (`sizes` podľa 7.4).
- **Z vetvy sa pred B2 nič nenasadzuje.**
- Šablóna, CSS ani JS sa nemenili; web zostavený z vetvy vyzerá ako dnes, len s novým tónom fotiek.

### Akceptácia B1

- `python3 nastroje/zostav.py` → kód 0; `python3 -m unittest discover -s nastroje -p 'test_*.py'` → **75/75 OK** (70 + 5 `TestZjednotenie`; vrátane `test_katalog_a_pages_yml_sa_zhoduju`).
- `python3 nastroje/zostav.py --vypis-fotky` vypíše všetkých 21 id z `orezy.json`, žiadne „NEKOMPLETNÁ“ (`redesign/overenie/B1/vypis-fotky.txt`).
- Rozpočet 7.4: skript skončil s kódom 0, žiadne ✗ (tabuľka nižšie).
- Bez metadát: 225 nových a zmenených súborov (`.avif/.webp/.jpg`) – `getexif()` prázdne, bez ICC a XMP.
- `zapasenie.mp4` 1,16 MB, dekóduje sa celé bez chýb; WebM 0,88 MB, hrá v Chromiu.
- `gymklub-logo-tmave.svg` 14,7 kB gzip, 2 farby.
- Navyše (nad rámec B1): `node nastroje/test_prehliadac.mjs ../lupa-vzor` → „Všetko v poriadku.“; `BEZ_PIXELOV=1 porovnaj_so_vzorom.mjs ../lupa-vzor-cms _site` → bez rozdielov (živé texty 14×, filter 8×, dni 7×, Tréner 11×, otázky 6×, lightbox 22×).
- Snímky 390 a 1440 (úvod, Kde začať, Priestor, pás funkčnej zóny, Bar, Tréningy) prezreté – `redesign/impl/B1/snimky/`, bez chýb JS a HTTP.

### Tabuľka veľkostí (výstup `priprav_fotky.py`; kB = 1000 B; „×AVIF“ = skutočný pomer k AVIF, limit WebP/JPG = 1,4×/2,2× rozpočtu AVIF)

```text
súbor                           rozmer  AVIF kB   q  limit  WebP kB  ×AVIF  JPG kB  ×AVIF
funkcna-zona-4-640             640×800     34.3  50     45     62.6   1.82    90.9   2.65
funkcna-zona-4-1080          1080×1350     79.5  50    110    136.8   1.72   220.3   2.77
funkcna-zona-4-1600          1600×2000    102.3  42    160    209.3   2.05   323.9   3.17
funkcna-zona-4-w-960           960×540     41.2  50     70     77.8   1.89   117.5   2.85
funkcna-zona-4-w-1920        1920×1080    118.7  50    200    200.7   1.69   364.3   3.07
funkcna-zona-7-640             640×800     35.1  50     45     55.4   1.57    89.4   2.54
funkcna-zona-7-1080          1080×1350     86.4  50    110    151.7   1.76   229.0   2.65
funkcna-zona-7-1600          1600×2000    110.0  42    150    206.2   1.87   318.9   2.90
funkcna-zona-7-w-960           960×540     39.4  50     70     74.1   1.88   114.4   2.91
funkcna-zona-7-w-1920        1920×1080    113.6  50    190    196.0   1.73   357.8   3.15
funkcna-zona-5-640             640×800     39.0  50     45     61.9   1.59    96.8   2.49
funkcna-zona-5-1080          1080×1350     93.7  50    110    141.0   1.51   221.2   2.36
funkcna-zona-5-1600          1600×2000    148.6  46    160    211.4   1.42   340.4   2.29
funkcna-zona-5-w-960           960×540     39.1  50     70     71.3   1.82   109.1   2.79
funkcna-zona-5-w-1920        1920×1080    123.7  50    190    202.2   1.63   359.1   2.90
hlavna-sala-1-640              640×800     40.6  50     45     60.6   1.49    94.8   2.34
hlavna-sala-1-1080           1080×1350     98.9  50    110    145.2   1.47   237.7   2.40
hlavna-sala-1-1600           1600×2000    148.7  46    160    221.1   1.49   348.7   2.34
hlavna-sala-1-w-960            960×540     40.8  50     70     75.6   1.85   112.1   2.75
hlavna-sala-1-w-1920         1920×1080    117.6  50    190    191.1   1.63   343.3   2.92
volne-vahy-2-640               640×800     30.4  50     45     51.5   1.69    85.2   2.80
volne-vahy-2-1080            1080×1350     70.7  50    110    118.5   1.68   212.4   3.01
volne-vahy-2-1600            1600×2000    132.9  50    160    205.1   1.54   333.4   2.51
volne-vahy-2-w-960             960×540     31.1  50     70     55.5   1.78    93.6   3.01
volne-vahy-2-w-1920          1920×1080     90.1  50    190    144.4   1.60   292.1   3.24
stroje-4-640                   640×800     34.4  50     45     59.0   1.71    93.2   2.70
stroje-4-1080                1080×1350     80.3  50    110    130.9   1.63   230.5   2.87
stroje-4-1600                1600×2000    150.1  50    160    192.1   1.28   326.5   2.18
stroje-4-w-960                 960×540     35.5  50     70     61.4   1.73   100.1   2.82
stroje-4-w-1920              1920×1080    103.3  50    190    162.4   1.57   313.8   3.04
hlavna-sala-4-640              640×800     37.6  50     45     57.2   1.52    89.0   2.36
hlavna-sala-4-1080           1080×1350     88.0  50    110    144.9   1.65   217.9   2.48
hlavna-sala-4-1600           1600×2000    159.0  50    160    209.7   1.32   344.7   2.17
hlavna-sala-4-w-960            960×540     41.5  50     70     73.9   1.78   112.0   2.70
hlavna-sala-4-w-1920         1920×1080    116.2  50    190    187.8   1.62   344.2   2.96
kardio-1-640                   640×800     32.0  50     45     58.7   1.84    97.3   3.04
kardio-1-1080                1080×1350     74.4  50    110    128.4   1.73   237.9   3.20
kardio-1-1600                1600×2000    145.6  50    160    192.6   1.32   339.8   2.33
kardio-1-w-960                 960×540     39.0  50     70     75.2   1.93   114.8   2.95
kardio-1-w-1920              1920×1080    114.3  50    190    193.6   1.69   358.3   3.13
hlavna-sala-3-640              640×800     40.0  50     45     59.6   1.49    93.8   2.34
hlavna-sala-3-1080           1080×1350    101.9  50    110    146.9   1.44   220.6   2.16
hlavna-sala-3-w-960            960×540     42.9  50     70     78.5   1.83   113.8   2.65
hlavna-sala-3-w-1920         1920×1080    133.5  50    190    215.9   1.62   368.6   2.76
stroje-3-640                   640×800     36.7  50     45     56.7   1.55    98.5   2.69
stroje-3-1080                1080×1350     85.8  50    110    144.2   1.68   219.2   2.55
stroje-3-w-960                 960×540     36.3  50     70     65.0   1.79   103.6   2.85
stroje-3-w-1920              1920×1080    103.7  50    190    173.0   1.67   328.8   3.17
jednorucky-1-640               640×800     27.3  50     45     45.2   1.66    82.3   3.02
jednorucky-1-1080            1080×1350     65.9  50    110    101.9   1.54   208.4   3.16
u-38047dcd-640                 640×800     36.0  50     45     56.7   1.57    90.6   2.52
u-38047dcd-1080              1080×1350     87.8  50    110    152.7   1.74   229.5   2.61
volne-vahy-3-640               640×800     29.3  50     45     47.4   1.62    84.8   2.89
volne-vahy-3-1080            1080×1350     62.4  50    110     97.2   1.56   196.4   3.15
kardio-3-640                   640×800     35.7  50     45     53.5   1.50    95.3   2.67
kardio-3-1080                1080×1350     87.2  50    110    145.1   1.67   216.3   2.48
volne-vahy-1-640               640×800     30.4  50     45     49.0   1.61    86.5   2.84
volne-vahy-1-1080            1080×1350     69.5  50    110    107.1   1.54   211.5   3.05
volne-vahy-1-w-960             960×540     34.7  50     70     58.5   1.69    98.3   2.83
volne-vahy-1-w-1920          1920×1080    102.9  50    190    156.6   1.52   311.8   3.03
stroje-2-640                   640×800     36.6  50     45     56.6   1.55    91.4   2.50
stroje-2-1080                1080×1350     79.3  50    110    132.8   1.68   235.8   2.97
stroje-1-640                   640×800     36.4  50     45     55.4   1.52    95.9   2.64
stroje-1-1080                1080×1350     83.1  50    110    141.9   1.71   234.6   2.82
tatami-3-640                   640×800     12.6  50     45     16.9   1.35    42.8   3.41
tatami-3-1080                1080×1350     26.0  50    110     33.3   1.28    97.7   3.75
mma-1-32-640                   640×427     17.6  50     45     31.6   1.79    51.6   2.92
mma-1-32-1200                 1200×800     46.9  50    110     79.9   1.70   143.7   3.06
bar-pult-640                   640×480     24.2  50     45     48.1   1.99    70.8   2.93
bar-pult-1080                 1080×810     59.3  50    110    109.9   1.85   178.7   3.01
bar-posedenie-640              640×480     28.2  50     45     57.0   2.02    80.6   2.86
bar-posedenie-1080            1080×810     66.5  50    110    130.0   1.96   197.2   2.97
Spolu 72 rozmerov × 3 formáty: 26.99 MB
plagát                                rozmer      kB  limit
video/zapasenie-poster.avif          576×720    19.7   30.0
video/zapasenie-poster.webp          576×720    29.0   42.0
video/mds-poster.avif                464×832    13.6   30.0
video/mds-poster.webp                464×832    19.2   42.0
video/ladydefence-poster.avif        464×832    12.7   30.0
video/ladydefence-poster.webp        464×832    15.4   42.0
video/ladydefence-nahlad.avif        192×256     3.2      –
video/ladydefence-nahlad.webp        192×256     4.3      –
video/ladydefence-nahlad.jpg         192×256     8.4      –
```

---

## Opravy po kontrole B0+B1 (15. 10. 2026)

Nálezy nezávislej kontroly (`redesign/impl/kontrola-B0+B1/`). Každý som najprv overil; všetkých 5 platí. Médiá z B1 sa neprerábali. Commit opráv na vetve `redizajn-2026-10`: `425d49f` (mení len `nastroje/porovnaj_so_vzorom.mjs`; poznámky a dôkazy sú mimo repozitára). Pracovné súbory: `redesign/impl/oprava-B0+B1/`.

### 1. Zábery s cudzím nápisom – záväzné rozhodnutie pre B2 (stredná)

**Overenie:** výrezy 100 % potvrdzujú nález:
- `funkcna-zona-7` t aj w: „SATELITNÁ TECHNIKA“ na presklenej stene (`overenie/B1/napis-funkcna-zona-7-{t,w}.jpg`; na dnešnom webe je v páse, `impl/oprava-B0+B1/snimky/1440-band.png`);
- `funkcna-zona-5` t aj w: plagáty susednej predajne „ANTIK“ a „namiSAT“ v oknách (`overenie/B1/napis-funkcna-zona-5-{t,w}.jpg`);
- `mma-1-32`: dvakrát banner „ProFighters.eu – official fight shop“ na stene sály (`impl/oprava-B0+B1/mma-1-32-banner-100.jpg`).

Orezom sa nápisy odstrániť nedajú a retuš je zakázaná (1.1).

**Rozhodnutie.** Pravidlo 7.2 hovorí, že záber s čitateľným nápisom cudzej firmy sa nepoužije. Súhlas majiteľa s týmito nápismi nemáme, preto platí 7.2 a konzervatívne riešenie podľa úvodu SPEC. B2 zapíše do `obsah/` aj `nastroje/testdata/obsah/` (bajtovo zhodne) tieto hodnoty namiesto hodnôt zo 4.2, 4.3, 4.4 a 8.2:

| Pole | SPEC | **B2 zapíše** | Dôvod a overenie |
|---|---|---|---|
| `texty.uvod.foto_telefon` | `funkcna-zona-7` | **`""`** (prázdne) | Telefón dostane sadu `t` z `funkcna-zona-4` (4.2: „inak sada t fotky uvod.foto“; 8.3: `hero_t`). fz4 t nemá nápis ani ľudí: v oknách vľavo je budova a stromy, v zrkadlách vpravo odraz piliera s loptami BOSU, nie človek (`impl/B1/z-fz4-*.jpg`, `impl/kontrola-B0+B1/fz4t-*.jpg` a `fz4-zrkadlo-4x.jpg`). AVIF `funkcna-zona-4-1600` má 102 kB pri q42, teda ≤ 150 kB (7.3, 7.4, 9). Túto vetvu pokrýva `test_fotka_na_telefon` (8.5). Pole v CMS ostáva (8.2). |
| `texty.cesta.karty[1].foto` („Sila a postava“) | `funkcna-zona-7` | **`volne-vahy-2`** | Náhľad sa ukáže len na počítači. Na zábere sú voľné váhy (lavice, stojany, kotúče), čo zodpovedá textu karty „Voľné váhy, stroje a …“. Výrez 100 % sady t: žiadni ľudia (zrkadlo vzadu odráža len stroje), za oknami tehlová budova bez nápisu, lístok na okne je nečitateľný aj pri 300 %, plagát kulturistu nie je firma (`overenie/B1/cisty-volne-vahy-2-t.jpg`). Tú istú fotku má esej na ploche 2, kam vedie odkaz karty `#priestor`. |
| `texty.funkcna_zona.foto` (medzihra) | `funkcna-zona-5` | **`funkcna-zona-4`** | Iný čistý záber funkčnej zóny so sadou t aj w nie je: fz7 má nápis, fz1 a fz6 sú mäkké a mažú sa (7.7), fz2 má len sadu t, fz3 len w. Daň: medzihra opakuje fotku úvodu (počítač sada w, telefón sada t). Na fz4 je rig a šprintérska dráha z textu medzihry, kettlebelly a vzduchový bicykel nie. |
| `texty.funkcna_zona.popis_fotky` | nový text pre fz5 („… kettlebellmi a vzduchovým bicyklom“) | **dnešná hodnota bez zmeny:** „Funkčná zóna GYM KLUBU so stropom zo šesťuholníkových LED svetiel a rigom Life Fitness“ | Text zo SPEC opisuje fz5. Dnešný popis sedí na fz4 (šesťuholníkový LED strop, rig) a nie je to nový text. |
| `texty.funkcna_zona.ohnisko`, `uvod.ohnisko_pocitac`, `uvod.ohnisko_telefon` | `stred` | `stred` | bez zmeny |
| `texty.cesta.karty[2].foto` („Bojové športy“) | `mma-1-32` | **`mma-1-32`** (ponechať, viazané na 13.3) | „ProFighters.eu“ je nápis cudzej firmy. Je to však výzdoba sály klubu Panda Fight Club, ktorý v GYM KLUBE trénuje (vedľa log GYM KLUB a Panda), nie susedná firma za oknom. Rovnaký záber (`mma-1`) je na dnešnom webe. Čistý záber sály bojových športov neexistuje a súhlas s fotkami Pandy rieši otázka 13.3. Ak majiteľ súhlas nepotvrdí alebo banner nechce, v CMS sa pri karte vyberie iná fotka a sála sa dofotí (7.8). |

**Doplnenie pre zoznam rozhodnutí majiteľa (13, odovzdáva B6):**
- **13.3, rozšírenie:** Na fotke sály Panda je čitateľný banner partnera klubu „ProFighters.eu“. Platí súhlas klubu a banner neprekáža?
- **13.5, nové:** Fotky funkčnej zóny s nápisom susednej firmy za oknom sa predvolene nepoužívajú (`funkcna-zona-7` „SATELITNÁ TECHNIKA“, `funkcna-zona-5` „ANTIK“, „namiSAT“). Úvod na telefóne aj medzihra preto ukazujú `funkcna-zona-4`. Ak majiteľovi nápisy neprekážajú, stačí jedna zmena v CMS: „Fotka úvodu na telefóne“ = fz7, alebo „Fotka“ funkčnej zóny = fz5 a k nej popis fotky podľa 8.2.
- **7.8, doplniť:** Odfotiť funkčnú zónu na šírku aj na výšku tak, aby v oknách nebol čitateľný nápis susednej firmy. Potom medzihra nemusí opakovať fotku úvodu.

### 2. Medzistav B1: WebGL hĺbka a šírka 1600w (nízka)

**Overenie:** nález platí.
- `impl/kontrola-B0+B1/full-1440-band.jpg` (vľavo vzor, vpravo B1): pri plnom pohybe je červený rig vpravo zubato roztrhnutý.
- `diff` medzi zostaveným `_site/index.html` a `../lupa-vzor-cms/index.html` má 21 zmenených riadkov. Všetky sú len `srcset`/`src` s 1600w (6 fotiek filmu a pásu so `sizes="100vw"` a `volne-vahy-2`).

**Urobené:** zapísané v časti „Dočasný stav (do B2)“. Kód medzistavu sa neopravuje, B2 ho celý nahrádza. **Záväzne pre B2:** v jednom commite zmazať `assets/depth.js` aj `assets/img/d/` (7.7), odstrániť ich zo šablóny a z `VERZOVANE` a nasadiť novú šablónu so `sizes` podľa 7.4. Z vetvy sa pred B2 nič nenasadzuje.

### 3. `porovnaj_so_vzorom.mjs` pri BEZ_PIXELOV porovnával počet odkazov (nízka)

**Overenie:** nález platí.
- `texty()` pridáva `out.odkazy` (počet `a[href]` v `header`, `main` a `footer`). Krok 2 (živé texty) mazal len `meta` a `title`.
- V `impl/kontrola-B0+B1/porov-vzor-B1/zive-1440-2026-10-14T1812.json` je `"odkazy": 60 / 60`.
- Po B2 sa počet odkazov zámerne zmení (menu so 7 položkami, bez pásu ponuky a mostíkov, nová pätička). Akceptácia B3 by tak dala 14 falošných rozdielov.
- Rovnakú chybu má aj vzor `audit-cms/skripty/porovnaj-bez-pixelov.mjs`.

**Urobené:** pri `BEZ_PIXELOV` krok 2 maže aj `ta.odkazy` a `tb.odkazy` (s komentárom v kóde).
- Dôvod podľa SPEC: pri BEZ_PIXELOV sa porovnávajú len živé texty a interakcie (8.5, akceptácia B3). Odkazy kontroluje `test_kotvy_maju_ciel` (8.5) a kontrola 6 v `test_vzhlad.mjs` (11.3).
- Bez `BEZ_PIXELOV` sa počet odkazov porovnáva ako doteraz.
- Overenie: `BEZ_PIXELOV=1 node nastroje/porovnaj_so_vzorom.mjs ../lupa-vzor-cms _site ../redesign/overenie/porovnanie-oprava-B0B1` skončil s kódom 0 a výsledkom „Bez rozdielov okrem zámerných zmien“. Prešlo 14 kombinácií šírka × čas, filter 8×, dni 7×, Tréner 11×, otázky 6× a lightbox 22×. Súbory `zive-*.json` už kľúč `odkazy` nemajú.

### 4. Rozpočet WebP/JPG a kvality záložných formátov (nízka) – **na rozhodnutie orchestrátora**

**Overenie:** nález platí, len s malou opravou čísla.
- Doslovný výklad (pomer k skutočnej veľkosti AVIF) prejde v **8 zo 144** kontrol (72 rozmerov × WebP a JPG), napr. `funkcna-zona-4-1600` má WebP 2,05× a JPG 3,17×. Kontrola uvádza 140 neúspešných, no jej vlastný `media-kontrola.txt` má 136 riadkov chýb.
- Pri kvalitách zo 7.3 (WebP 78, JPG 82, AVIF q50) sa doslovný výklad splniť nedá. Voči rozpočtu AVIF prejde všetko.
- `priprav_fotky.py` znižuje záložné formáty viac, než SPEC dovoľuje (7.3 dovoľuje znižovať len AVIF, najviac o 2 kroky):
  - **20 WebP:** 15× q74, 2× q70, 2× q66, 1× q62 (`funkcna-zona-5-1600`);
  - **25 JPG:** 15× q78, 3× q74, 3× q70, 2× q66, 2× q62 (`funkcna-zona-7-1600`, `funkcna-zona-5-1600`);
  - AVIF 2× q46.

**Urobené:** nič som neprerábal. Odchýlka je zapísaná v bode 3 odchýlok B1. Orchestrátor rozhodne o jednej z možností:
- **(a) potvrdiť** výklad „voči rozpočtu AVIF“ aj znižovanie záložných formátov (dnešný stav, menšie súbory pre prehliadače bez AVIF);
- **(b) zamietnuť** a vrátiť pevné kvality 78/82 zo 7.3: v `priprav_fotky.py` nastaviť `MAX_KROKOV` pre WebP a JPG na 0 a sady pregenerovať. Časť záložných súborov potom prekročí 1,4× a 2,2× rozpočtu.

Doslovný 7.4 sa so 7.3 súčasne splniť nedá, takže text 7.4 v SPEC treba v oboch prípadoch upraviť.

### 5. Formulácia „menej stropu ako dnes“ (nízka)

**Overenie:** nález platí a je širší. Rovnako ako dnes sú nielen `funkcna-zona-7` t a `stroje-4` w, ale aj `hlavna-sala-4` w, `stroje-3` w a `volne-vahy-1` w (rozdiel ≤ 0,001), bar a Panda.

**Urobené:** formulácia je opravená v bode 5 odchýlok B1 (stĺpec „voči dnešku“ a zoznam) aj v časti Kontrola orezov. Kritérium 7.2 („viac stropu → posunúť“) je splnené, žiadna sada nemá viac stropu ako dnes. Orezy sa nemenia.

### Overenie opráv

- `python3 nastroje/zostav.py`: kód 0.
- `python3 -m unittest discover -s nastroje -p 'test_*.py'`: 75/75 OK.
- `node nastroje/test_prehliadac.mjs ../lupa-vzor`: „Všetko v poriadku.“, kód 0.
- `node nastroje/test_prehliadac.mjs ../lupa-vzor-cms` (podľa 11.2 povinný až od B3): jedno známe zlyhanie „cache: nový app.js sa pri starej stránke ukončil“. Je očakávané: `lupa-vzor-cms` má rovnaké `GK` ako dnešná stránka a poistku `GK.VERZIA !== 2` pridá až B2. Rovnaký výsledok má aj kontrola (`impl/kontrola-B0+B1/tp-vzor-cms.log`). Ostatné kontroly sú OK.
- `BEZ_PIXELOV=1 porovnaj_so_vzorom.mjs ../lupa-vzor-cms _site`: bez rozdielov (bod 3).
- Snímky 390 a 1440 px (úvod, Kde začať, Prečo, pás funkčnej zóny, Priestor, Bar, Tréningy, Kontakt) som prezrel v `redesign/impl/oprava-B0+B1/snimky/`, bez chýb JS a HTTP. Web sa oproti B1 nezmenil, zmena je len v porovnávacom skripte.
- Logy: `redesign/impl/oprava-B0+B1/{zostav,unittest,test_prehliadac-vzor,test_prehliadac-vzor-cms,porovnaj}.log`.

---

## B2 Obsah, CMS, generátor a šablóna – štruktúra (15. 10. 2026)

Jeden lokálny commit **`50dfa9f`** na vetve `redizajn-2026-10` (183 súborov, bez push, `main` ostáva na 396f446).
Pracovné súbory a dôkazy:
`redesign/impl/B2/`.

### Čo sa zmenilo

- **`.pages.yml`** (8.1, 8.2, 7.7): `foto_hlbka` → `foto_siroka` (12 fotiek so sadou t aj w), nový komponent
  `ohnisko` (5 polôh, `default: stred`), `foto_na_vysku`/`foto_mozaika` podľa katalógu bez zmazaných id;
  `uvod.foto` (foto_siroka, „Fotka úvodu (počítač)“), nové `uvod.foto_telefon`, `uvod.ohnisko_pocitac`,
  `uvod.ohnisko_telefon`; zrušené `pas_ponuky`, `mostiky`, `preco.karty[].foto|nova_foto|popis_fotky`;
  `funkcna_zona.foto` (foto_siroka) + `funkcna_zona.ohnisko`; `film[].foto` (foto_na_vysku), nové `film[].nova_foto`
  a `film[].ohnisko`; `bar.nadpis_maly`; nová položka skupiny `texty-rozhranie` („Tlačidlá a popisky“, 16 polí
  podľa tabuľky 8.2, maxlength 40, default = hodnota); `nadpis_maly` 7 sekcií v menu maxlength 16 s novým popisom;
  8 zmienok „pred ním je číslo 0X“ preč; popisy `film`, `mozaika`, `bar.fotky`, `dlazdica.popis`,
  `cennik.karty[].tlacidlo`, `cesta.karty[].foto|nova_foto` podľa 8.2. Labely položiek 8.1.
- **`obsah/` = `nastroje/testdata/obsah/`** bajtovo (overené `cmp`), hodnoty podľa 8.2 a záväzného rozhodnutia
  „Opravy po kontrole B0+B1 › 1“ (tabuľka nižšie).
- **`nastroje/zostav.py`** (8.3): `VERZOVANE` bez depth, `OHNISKA` + `ohnisko()`, `dosky()` na úrovni modulu,
  `foto_siroka()` (hláška „fotka „X“ nemá verziu na šírku aj na výšku.“), úvod `hero`/`hero_t`/`hero_fx`, LQIP
  vždy, `medzihra` (kľúč `band` zrušený), film `{d, t, w, plna, plna_w, plna_h, fx, fy}`, Detaily bez
  `_vypln_mozaiku`, `preco` bez fotiek, `kedy_riadky`, `ceny.spolocne_tlacidlo`, `GK.VERZIA = 2;` pred `GK.HOURS`,
  `R = TX.rozhranie`, kontrola kotiev v `_skontroluj_html`, `--vypis-fotky` označí `foto_siroka`.
- **`nastroje/fotky.py`**: zrušené `LQIP_V_CSS`, `hlbka_w/t`, `ma_hlbku` a čítanie `assets/img/d/`; nové
  `Foto.siroka`; `lqip(koren, sada_w, sada_t)`. `zjednot()` je v `spracuj()` už od B1. `PLNA_FOTKA` ostáva.
- **`sablona/index.html`** prepísaná podľa 3.1 a 4 so všetkými hákmi 1.1 (overuje `test_haky_v_html`);
  **`sablona/makra.html`**: `zdroje`, nové `pic`, `shot`, `gal(g, skupina)`, `cesta_vrstva`, `coach_face(s, meno)`,
  `mds_logo`, `video`, `hodiny_riadky`; zmazané `pic_why`, `pic_duo`, `pic_cesta`, `ticker`. Triedy pre B3/B4
  (`rv`, `rv-img`, `mask`, `par`, `--i`) sú už v šablóne; trieda `reveal` ani `btn-volt/btn-ghost` v šablóne nie je.
- **Zmazané (7.7):** `assets/depth.js`, `assets/img/d/` (26 súborov), písma Archivo, Bebas Neue, Fraunces,
  JetBrains Mono, fotky 16 id (spolu 129 súborov v `assets/img/f`).
- **`assets/fonts.css`**: 4 tváre Oswald/Manrope (latin, latin-ext) + „Oswald F“, „Manrope F“ s metrikami z B1.
- **`assets/app.js`**: len poistka `if (!GK || !GK.GYM || !GK.TIMETABLE || GK.VERZIA !== 2)` a jej komentár.
- **Testy** (8.5): úpravy `test_subory_webu`, `test_obsah_a_pocty`, `test_odkazy_na_skripty_s_verziou`,
  `test_udaje_pre_skripty`, `test_neznama_fotka`, `test_uvod_bez_sirokej_verzie`, `test_jedna_fotka_navyse_v_bare_bez_diery`,
  `test_katalog_a_pages_yml_sa_zhoduju`; nové `test_dosky`, `test_kotvy_maju_ciel`, `test_kontrola_kotiev_zlyha`,
  `test_kazdy_text_rozhrania_sa_vypise`, `test_spolocne_tlacidlo_cennika`, `test_fotka_na_telefon`, `test_ohnisko`,
  `test_haky_v_html`; navyše `test_ohniska` (mapovanie = hodnoty v CMS) a `test_nahrata_fotka_vo_filme_nejde_na_sirku`.
  `test_css_pravidla` pribudne v B3.
- **Návody:** `NAVOD-PRE-ONDREJA.md` (časti 2, 5, 7 prepísaná, nové 7a, 7b, tabuľka značiek, 9, 11),
  `NASTAVENIE-CMS.md` (zoznamy fotiek, overenie voči schéme CMS, nová časť 3a o nasadení redizajnu),
  `README.md` (štruktúra, generátor, fotky, testy, obmedzenia, nová časť „Redizajn 2026-10“).

### Obsah podľa záväzného rozhodnutia (namiesto 4.2, 4.3, 4.4 a 8.2)

| Pole | Zapísané | Poznámka |
|---|---|---|
| `texty.uvod.foto` | `funkcna-zona-4` | podľa SPEC |
| `texty.uvod.foto_telefon` | `""` | telefón dostane sadu t z fz4 (`hero_t`), preload `max-width: 860px` = fz4 (overené `test_fotka_na_telefon`) |
| `texty.cesta.karty[1].foto` | `volne-vahy-2` | namiesto fz7 |
| `texty.cesta.karty[2].foto` | `mma-1-32` | ponechané, viazané na 13.3 |
| `texty.funkcna_zona.foto` | `funkcna-zona-4` | medzihra opakuje fotku úvodu (13.5) |
| `texty.funkcna_zona.popis_fotky` | dnešná hodnota | sedí na fz4 |
| `ohnisko_*`, `film[].ohnisko`, `funkcna_zona.ohnisko` | `stred` | |
| `texty.priestor.uvod` | „Pozrite si klub ešte pred prvou návštevou.“ | záväzná úprava zadania (bez „čo si vziať“) |

### Odchýlky od SPEC a prečo

1. **Logo v hlavičke** (záväzná úprava zadania): `a.brand.brand--card > img.brand-logo` s plnofarebným
   `gymklub-logo.svg`, `alt` = `P.nazov_cely`, bez `aria-label` (10). Návrat na reverzné logo je v šablóne opísaný
   v komentári Jinja (zmena `src` a triedy). Rozmery kartičky (40/34 px) dodá CSS v B3.
2. **`fonts.css` – „Oswald F“ len `local("Arial")`** (SPEC 2.3: `local("Arial Narrow"),local("Arial")`). Hodnota
   `size-adjust` 87,31 % je počítaná voči Arial (vzorec 2.3); s Arial Narrow (Mac, Office) by bol záložný nadpis
   asi o 18 % užší a po načítaní Oswaldu by riadky poskočili. Odporúčanie z B1 › odchýlka 4. Konzervatívne pre CLS.
3. **`style.css`: zmazaných 6 pravidiel `.depth-canvas`** (plátno, ktoré vytváral zmazaný `depth.js`). 12 hovorí,
   že CSS sa v B2 nemení okrem odstránenia `depth.js`; pravidlá sú jeho súčasťou a bez nich by `git grep depth`
   (akceptácia B2) našiel kód. Iné CSS sa nemenilo.
4. **`git grep depth`** nájde už len `git clone --depth 1` vo workflow (prepínač gitu, nesúvisí) a záporné
   tvrdenia testov (`assertNotIn('depth.js', …)`, `assertNotIn('foto_hlbka', …)`), ktoré 8.5 výslovne žiada;
   ostatné nálezy (zmazané id, `foto_hlbka`, `pas_ponuky`, `mostiky`) sú len v návodoch (README, NASTAVENIE-CMS).
5. **`treningy.karty[0].popis_fotky`**: fotka sa mení na `volne-vahy-1` (4.7), dnešný alt opisoval `volne-vahy-2`.
   Použil som dnešný alt záberu `volne-vahy-1` z prechádzky („Stojan s kotúčovými jednoručkami, lavice, nakladací
   stroj a stojan s pevnými činkami“) – nie je to nový text a sedí na fotku (overené náhľadom).
6. **Bar `bar-posedenie`:** SPEC chce „dnešné popisy pri týchto id“, ale `bar-posedenie` dnes na webe nie je.
   Popis pod zväčšenou fotkou = dnešný popis `bar-kresla` „Kreslá na oddych pri oknách“ (to isté posedenie, pravdivé);
   alt „Kožené kreslá a stolíky pri oknách, v pozadí bar so stoličkami a televízorom“ zložený z dnešných altov
   `bar-kresla` a `bar-napoje`, overený na fotke (`impl/B2/bar-porovnanie.jpg`).
7. **Detaily – texty zo SPEC overené na fotkách** (`impl/B2/detaily-porovnanie.jpg`): `u-38047dcd` je červený rig
   Life Fitness pri oknách so zrkadlom, `kardio-3` svetlá sála s pásmi pri oknách do zelene. „Kardio s výhľadom do
   zelene“ má nezlomiteľnú medzeru za „s“ ako ostatné viditeľné texty v obsahu (alt ju nemá, ako dnes).
8. **Náhradné texty živých údajov:** `[data-open-status]` (okrem úvodu, kde ostáva `hodiny.kratko`) a
   `[data-today-label]` majú namiesto napevno „Otváracie hodiny“ text z CMS `TX.kontakt.hodiny_nadpis` (dnes ten istý
   text; pravidlo 1.2). `<dt data-today-k>Lekcie</dt>` ostáva doslova (4.2: značkovanie kolofónu doslova; GK.paint ho
   hneď prepíše). Neviditeľné texty (`aria-label`, `caption.sr-only`, alt loga MDS) ostali v šablóne.
9. **CMS – popisky nad rámec 8.2** (len `label`/`description`, mená položiek a polí sa nemenia): „Filmový pás
   (prechádzka)“ → „Hlavné zábery priestoru“, „Mozaika – …“ → „Detaily – …“, `dlazdica.popis` „Popis na fotke“ →
   „Popis pod zväčšenou fotkou“, `dlazdica.tvar` (súčet miest platí len pre bar), opravené popisy viazané na starý
   dizajn („zlatý rámik“, „zlaté tlačidlo“, „logo v rohu fotky“, „na telefóne sú skryté“, „Nadpis karty pod fotkou“,
   štítok karty s `{pocet_zaberov_cislom}`). Pri `funkcna-zona-5` a `-7` v zoznamoch `foto_siroka` a `foto_na_vysku`
   je poznámka „(v okne nápis susednej firmy/predajne)“ – pomôže pri otázke 13.5. Recenzie mali s Priestorom
   spoločnú kotvu YAML (`&hlavicka_bez_kariet`); Priestor má teraz maxlength 16 (menu), Recenzie vlastné polia
   s maxlength 30 (nie sú v menu).
10. **Úvodzovka pred prvou recenziou** (4.11) nie je v šablóne – urobí ju CSS `::before` v B3, aby značkovanie
    `<blockquote class="rev …"><p>…</p><footer>…</footer></blockquote>` ostalo doslova (test).
11. **`sizes`, ktoré tabuľka 7.4 nemá:** medzihra sada t `(orientation: portrait) 71svh, 100vw` (88svh × 4/5);
    `.pl-w` pod 760 px sada t cez `media="(max-width: 759px)"`.
12. **Drobnosti značkovania:** v `#nav` je aj `a.btn.btn-p.nav-cta` (CTA mobilného menu, 4.1; na počítači ho skryje
    CSS v B3), dok má `role="group"` (aria-label na `div` bez roly nie je povolený), bodka v úvode je `span.dot`,
    T2 hlavička má ľavý stĺpec `div.sec-t` (štítok + nadpis), `.cesta-pv` má aj triedu `ph`.
13. **Generátor navyše:** varovanie, ak je `uvod.foto_telefon` vyplnené, ale fotka nie je kompletná (telefón potom
    ukáže sadu t fotky úvodu, ako hovorí 8.3).
14. **`test_prehliadac.mjs`:** variant `bar` pridáva kópiu `fotky[1]` (testovací bar má 2 fotky, ako 8.5 pri
    unittest). Kontrola `cache`: stará stránka (vzor) odkazuje aj na súbory zmazané podľa 7.7 – ich 404 sa v počte
    chýb JS nepočíta, ale každá 404 musí byť súbor, ktorý v novom webe naozaj nie je (inak test zlyhá). Chyby JS
    (`pageerror`, ostatné `console.error`) sa kontrolujú ako predtým.
15. **Nález kontroly B0+B1 (rozpočet úvodu na telefóne):** `priprav_fotky.py` `rozpocet_avif()` dáva 150 kB pre t-1600
    každej fotky z `UVOD_T` (fz4 aj fz7). Médiá sa neprerábali (fz4-1600 má 102 kB).
16. **Ladydefence – riziko pre B5:** `aria-label` tlačidla = `TX.mds.ladydefence_video_popis` (8.4). Viditeľný text
    tlačidla („Ladydefence Ukážka z tréningu“) nie je súvislou časťou tohto názvu, Lighthouse môže hlásiť
    `label-content-name-mismatch`. Ak áno, v B5 nechať prístupný názov z viditeľného textu (bez `aria-label`) alebo
    upraviť text v CMS.

### Overenie pred commitom

- `python3 nastroje/zostav.py` → kód 0, „Web je zostavený“, bez varovaní. `index.html` 97,0 kB, gzip 22,95 kB (≤ 25).
- `python3 -m unittest discover -s nastroje -p 'test_*.py'` → **85/85 OK** (vrátane `TestNezavislostOdObsahu`,
  `TestUlozenieVCms`, `test_haky_v_html`, `test_kotvy_maju_ciel`).
- **Pages CMS:** `.pages.yml` overený voči `lib/config-schema.ts` z `pages-cms/pages-cms` 2.1.8 (klon
  `redesign/impl/pagescms`): skript `redesign/impl/B2/cmsval/over_pages_yml.mjs` (Zod 3.25.76, yaml 2.8.3 ako
  v `package-lock.json`, `fieldTypes` z `fields/registry.ts`, postup ako `validateConfig()`) → „ConfigSchema: OK“.
  Skript zachytí chybu (skúška s poľom s `type` aj `component` a neznámym kľúčom → 2 chyby). Správanie polí
  overené v kóde CMS: `select` bez `required` prijme `""` (`fields/core/select`), `options.maxlength` pri `string`,
  zlúčenie komponentu cez `mergeWith` (polia `component` + vlastný `label/description`) ako v `cms_schema._zluc`.
- `node nastroje/test_prehliadac.mjs ../lupa-vzor` aj `../lupa-vzor-cms` → „Všetko v poriadku.“ (podľa 11.2 povinné
  až od B3; poistka `GK.VERZIA` už funguje aj s `lupa-vzor-cms`). Logy `impl/B2/test_prehliadac-vzor*.log`.
- `git grep` – pozri odchýlku 4.
- Navyše (podľa 11.2 až od B3): `BEZ_PIXELOV=1 node nastroje/porovnaj_so_vzorom.mjs ../lupa-vzor-cms _site
  ../redesign/impl/B2/porovnanie` – živé texty 14 kombinácií šírka × čas **bez rozdielov**, filter 8×, dni 7×, odkazy
  Tréner 11× a otázky 6× **bez rozdielov**; jediný rozdiel je lightbox pri 390 aj 1440 px („otvoril sa a má
  neprázdny popisok“ = false): starý `app.js` berie popisok z `figcaption`, dlaždice Detailov a baru ho podľa 4.6
  a 8.4 nemajú (popis je v `data-cap`). Opraví ho nový lightbox v B3 (6.2: „…inak `data-cap`, inak `alt`“).
  Log `impl/B2/porovnaj.log`.
- `impl/B2/kontrola-dom.mjs` (390 px DPR 3, 1440 px): všetky obrázky sa načítajú, žiadna chyba JS ani HTTP, žiadny
  odkaz `#…` bez cieľa, `GK.VERZIA` 2 a starý `app.js` beží (`GK_APP`). Úvod: telefón `funkcna-zona-4-1600.avif`,
  počítač `funkcna-zona-4-w-1920.avif`. Náhľady „Kde začať“ telefón nesťahuje (1 px GIF), počítač 640w.
- **Snímky** 390 a 1440 px (16 sekcií, `impl/B2/snimky/`, hárky `harok-390.jpg`, `harok-1440.jpg`) prezreté:
  obsah a poradie sekcií sedí (úvod, Prečo bez fotiek, Kde začať so štítkom „Bez čakania na stojan“, medzihra fz4,
  esej 5 záberov w–s–p–w, Detaily 6, bar 2, tréningy, MDS, tréneri, rozvrh, cenník so spoločným tlačidlom, otázky,
  kontakt, pätička s plnofarebným logom). **Vzhľad je zámerne rozbitý** – šablóna má novú štruktúru, `style.css`
  je ešte starý (B3): logo bez kartičky (na telefóne obrovské, staré CSS štýlovalo `.brand-card`), list Intro
  prekrýva úvod, pás Detaily a bar sú pri 1440 px tmavé, fotky dua orezané. Nič z toho sa v B2 neopravuje; **z vetvy
  sa pred B3 nič nenasadzuje**.

### Pre B3 (z B2)

- CSS pre nové triedy: `.brand--card`, `.brand-logo`, `.nav-cta`, `.sec-t`, `.why-list/.why-item/.why-h`,
  `.cesta-nav`, `.cesta-pv/.cesta-pic[data-i]`, `.opener/.opener-media/.opener-in/.par`, `.essay/.plate.pl-w|s|p`
  (`.l/.r`), `.shot.pl-*-item`, `.ph/.ph-btn`, `.more-head/.more-t/.strip-nav/.strip-prev/.strip-next`,
  `.mosaic.strip`, `.bar-blok .sec-head`, `.lv/.lv-poster`, `.mds-in/.mds-lady-open/.mds-lady-nahlad/.mds-lady-play`,
  `.coach-txt/.coach-badge/.coach-more`, `.price-cta`, `.faq-in/.faq-head`, `.contact-links`, `.map-addr`,
  `.foot-grid/.foot-logo`, `.lb-stage/.lb-img/.lb-bar`, `.rev-lead::before` (úvodzovka), `--fx-w … --fy-t` na
  `.hero`, `--fx/--fy` na `.shot` a `.opener`.
- `app.js`: `copyAddr` má texty z `data-done` a z tlačidla; lightbox podľa 6.3 (`.lb-a/.lb-b`, `data-group`,
  `data-cap`, `data-w/h`, `button.mds-lady-open[data-lb-video]`); mapa `[data-map-load]`; `.strip-*`;
  `.cesta-pv[data-active]`; dok `.dock-cta` ako doteraz.

---

## B3 Vizuálny systém a funkčné JS – bez pohybu (15. 10. 2026)

Jeden lokálny commit **`da3b479`** na vetve `redizajn-2026-10` (8 súborov, bez push, `main` ostáva na 396f446).
Pracovné súbory a dôkazy: `redesign/impl/B3/` (snímky `vzhlad/snimky/`, hárky `vzhlad/h-*.jpg` a `vzhlad/stavy-*.jpg`, logy `final/`).

### Čo sa zmenilo

- **`assets/style.css`** – nový súbor v jednej vrstve (667 riadkov, 11,3 kB gzip): tokeny 2.1, 2.5 a 5.1, jediný blok
  `prefers-reduced-motion: reduce`, typografia 2.4, komponenty 2.6 (tlačidlá `.btn-p/.btn-g/.btn-lg/.btn-sm`,
  šípka cez masku, `.tlink`, `.ph`, `.ph-btn`, obrysová/zelená bodka, fokus), rozloženia sekcií 4.1–4.15 (T2 hlavičky,
  list Intro, Kde začať s náhľadom, medzihra, esej W/S/P, pás Detaily, mozaika baru „dnešná mriežka“, duo, lekcie
  s lepiacim videom, MDS, tréneri 4 + 4 + 3 a riadky na telefóne, rozvrh so 7 dňami, cenník, kroky, recenzie
  s úvodzovkou, otázky T3, kontakt 6 : 6, pätička s kosteným spodkom, dok, tlačidlo hore, lightbox). Prechody sú len
  farieb a obrysov (`--dur-2`); odhalenia, opona, parallax, pulz bodky, prúžok postupu a prechody stavov dopĺňa B4.
  **Logo v hlavičke** (záväzná úprava zadania): plnofarebné na bielej kartičke `.brand--card .brand-logo` – výška
  40 px (≥ 861 px) a 34 px (telefón), vnútorný okraj 5/9 px (4/8 px), zaoblenie 6 px, jemný tieň `0 1px 2px`;
  odkaz `a.brand` má 44 px na dotyk. Reverzné logo je pripravené (B1), nepoužité.
- **`assets/app.js`** – prepis podľa 6.1 a 6.2 (10,0 kB gzip): poistka `GK.VERZIA !== 2`, `fillFacts`, `hoursTable`,
  `header` (jedna pasívna slučka, číta len `scrollY` a `innerHeight`: `in-hero`, `href` doku, skrytie lišty po prvej
  obrazovke bez animácie, `.totop.is-on` od 3. obrazovky), `menu` (`html.nav-open`, Esc s návratom fokusu na burger,
  zatvorenie pri odkaze a pri ≥ 861 px), `activeNav` (IO `-45% 0px -50% 0px`, `aria-current`, ruší stav mimo
  sekcií), `odhal` (= modul `reveal` zo 6.2, v B3 len `is-in` všetkému), `heroFit`, `timetable` (`data-n`,
  `aria-label`, roving `tabindex`, `textContent` ako dnes), `coaches` (bez VT), `lightbox` (6.3: vrstvy A/B, ďalší
  záber až po `decode()`, popisok a počítadlo v tej istej chvíli, popisok `.shot-t · .shot-d` → `data-cap` → `alt`,
  rozmery z `data-w/h`, ←/→/Home/End, klik na pozadie, návrat fokusu, prednačítanie susedov okrem šetrenia dát,
  potiahnutie prstom; video Ladydefence v tom istom dialógu, pri zatvorení `pause()` a zrušenie zdroja), `strip`,
  `cestaPreview` (bez prelínania), `liveVideo` (lenivý plagát, na telefóne, pri obmedzenom pohybe a šetrení dát len
  po ťuknutí), `dock`, `copyAddr` (texty z tlačidla a `data-done`), `mapEmbed` (tlačidlo aj IO 200 px), `html.sm`.
- **`nastroje/test_vzhlad.mjs`** (nový, 11.3): kontroly 1–13, server na voľnom porte 8100–8999, výber
  `KONTROLY=…`, `SIRKY=…`. Statické kontroly a snímky pri `reducedMotion: 'reduce'`; obdĺžnik textu pre kontrast =
  obdĺžniky riadkov textu (Range), nie celý blok.
- **`nastroje/test_zostav.py`**: nový `TestCssPravidla.test_css_pravidla` (8.5 + 9: ≤ 1 000 riadkov); text
  „Sedem ďalších miest“ (krok 3 z 3.2). Spolu 86 testov.
- **`nastroje/porovnaj_so_vzorom.mjs`**: pri `BEZ_PIXELOV` je rozdiel len vo veľkosti písmen a v medzerách zámerný
  vzhľad (odchýlka 5).
- **Obsah** (`obsah/priestor.json` = `testdata`, bajtovo zhodné): krok 3 z 3.2 – esej má 4 zábery, `hlavna-sala-4`
  prešla do Detailov (vysoká dlaždica za `hlavna-sala-3`, popis „Veža na všetko“ = dnešný nadpis záberu, alt = dnešný
  popis fotky). Esej: W `hlavna-sala-1`, S `volne-vahy-2`, P `stroje-4` + `kardio-1`.
- **`README.md`**: stav po B3, testy (`test_css_pravidla`, `BEZ_PIXELOV`, `test_vzhlad.mjs`), počty záberov.

### Odchýlky od SPEC a prečo

1. **Dĺžka stránky (3.2, kontrola 9).** Prvá verzia CSS presne podľa SPEC mala 21,31 obrazovky pri 1440 × 900 a 26,31
   pri 390 × 844. Postup:
   - kroky 1–3 z 3.2 v poradí: `--sec` na `clamp(64px,8vw,112px)`, duo 16 : 9, esej 4 zábery (obsah aj testdata);
   - ani po nich limit nevyšiel (19,55 / 23,64), preto podľa úvodu SPEC konzervatívne riešenie bez zmeny obsahu a CMS:
     hustejší rytmus – `--sec: clamp(48px,5.6vw,80px)`, `--head-gap: clamp(24px,2.8vw,40px)`,
     `--plate-gap: clamp(40px,5vw,72px)`, nový `--blok: clamp(48px,6vw,88px)` pre odsadenie lekcií, MDS a baru
     (SPEC `clamp(64px,8vw,112px)`), odsadenie Kde začať a krokov `clamp(48px,5vw,72px)` (SPEC do 96 px), štítok
     `.kicker` 16 px pod sebou, menšie medzery v zoznamoch;
   - **H2 bez limitu 14ch** (2.7): so 14ch mali nadpisy pri 1440 px 3–4 riadky (spolu +476 px); teraz ich zalamuje
     stĺpec 7fr, pri 1440 px 2 riadky;
   - tréneri: `.coach-grid` najviac 1 000 px (karta ~226 px, portrét ~282 px – blízko `sizes` 300px); na telefóne je
     „Viac o trénerovi“ v 2. stĺpci vedľa portrétu (SPEC: na celú šírku pod nimi) a jeho 44 px cieľ sa prekrýva
     s okrajmi riadka;
   - videá lekcií a MDS na telefóne najviac 260 px (SPEC max-width 420 px), Ladydefence od 1280 px v dvoch stĺpcoch,
     karty cenníka na telefóne kompaktne (názov a popis vľavo, cena vpravo), čísla krokov na telefóne vľavo od textu,
     pätičkové menu v 3 stĺpcoch aj na telefóne (4.14: „v 3 stĺpcoch“).
   - Výsledok: **18,29 obrazovky pri 1440 × 900 (≤ 18,5) a 22,86 pri 390 × 844 (≤ 23)**. Rezerva je malá (≈ 190 px
     a ≈ 120 px); dlhšie texty v CMS ju môžu minúť – sledovať v B6.
2. **Kontrast H1 na fotke (2.1, kontrola 8).** Červený druhý riadok H1 (L = 0,20) potrebuje pozadie s L ≤ 0,034. So
   závojmi zo 4.2 vyšlo 2,6–2,8 : 1 na počítači a 1,5–2,1 : 1 na telefóne. Úprava: počítač – ľavý prechod
   .88 / .62 / .14 (SPEC .86 / .55 / .12) a spodný do 52 % (SPEC 46 %); telefón – prechod podľa SPEC a navyše clona
   `rgba(11,12,15,.66)` za blokom textu `.hero-in::before` (na nízkom telefóne siaha text vyššie, než kryje prechod).
   Namerané: H1 riadok 2 3,15–4,38 : 1, riadok 1 ≥ 9,6, odsek ≥ 7,6, medzihra H2 ≥ 11,6, odsek ≥ 9,1.
3. **Úvod na nízkom telefóne.** Pri výške okna ≤ 780 px menší H1 rovno v CSS (inak by ho `heroFit` zmenšil až po
   načítaní `app.js` a obsah pod úvodom by poskočil – CLS pri `/#cennik` 0,83 pri 360 × 740). `heroFit` ostáva:
   `is-tight` a ak je úvod vyšší ako okno, záporné `top` lepenia, aby sa celý ukázal skôr, než ho prekryje list
   (4.2 „úvod sa natiahne“); `is-tight2` (skrytie odseku) sa nepoužíva.
4. **Rozvrh ≤ 560 px:** `<small>` v `.tt-day` je skrytý vizuálne (orez 1 px), nie `display:none` – `innerText`
   tlačidla tak ostáva ako dnes (porovnanie dní 7× bez rozdielu); `::after{content:attr(data-n)}` ukazuje počet.
5. **Porovnanie BEZ_PIXELOV:** `innerText` závisí od CSS. Verzálky štítkov Kde začať (4.3 „verzálkami“) a kolofón
   úvodu, ktorý sa na telefóne po novom zobrazuje (4.2; vo vzore bol skrytý a `innerText` vrátil `textContent` bez
   medzier), dávali 21 rozdielov s rovnakým obsahom. Skript ich pri `BEZ_PIXELOV` hlási ako „zámerný vzhľad“, ak sa
   texty zhodujú po zmenšení písmen a odstránení medzier – znaky a poradie sa porovnávajú presne (ako pravidlo pre
   nezlomiteľné medzery). Interakcie (filter 8×, dni 7×, Tréner 11×, otázky 6×, lightbox 13×) bez zmeny pravidla.
6. **Modul `reveal()` sa volá `odhal()`** – akceptácia B3 žiada `grep reveal\b` v `assets` = 0.
7. **Fokus bez `border-radius:inherit`** (2.6): pri tlačidle v nezaoblenom rodičovi by zrušil jeho zaoblenie; obrys
   v Chromiu aj Safari kopíruje vlastné zaoblenie prvku.
8. **Stav v lište počas `in-hero` skrytý** (`visibility:hidden`, ako vo vzore): úvod má vlastný stav; `innerText`
   ostáva ako vo vzore. Pod 1180 px je stav v lište skrytý úplne (ako vo vzore), na telefóne aj tlačidlo lišty –
   je v mobilnom menu (`.nav-cta`, 4.1) a v doku.
9. **CLS pri otvorení s kotvou (9, kontrola 12):** prehliadač kreslí prvú snímku hore a na kotvu skočí až po
   spustení `app.js`, ktorý zatiaľ vykreslí rozvrh (+324 px nad Cenníkom) → CLS 0,22. Riešenie: pri kotve pod
   rozvrhom sa rozvrh vykreslí po `load` (výšku vyrovná ukotvenie posunu); `.tt-days:empty`/`.tt-list:empty`
   majú rezervu; náhradný text dnešných hodín je do spustenia `app.js` v jednom riadku (`.today:not(.is-live)`);
   na `.today` `minmax(0,1fr)` (náhradný text v `nowrap` rozťahoval stránku a telefón ju oddialil);
   `in-hero` sa pri otvorení s kotvou nenastaví (ako skript v hlavičke). Výsledok `/#cennik`: 0 pri 360, 390, 768,
   1024 aj 1440 px.
10. **Lightbox – video Ladydefence už v B3** (bez animácie): 1.3 „videá“ a „lightbox“ musia fungovať od B3; FLIP,
    „krok“ medzi skupinami a ťah 1 : 1 sú v B4. Jednoduché potiahnutie (> 40 px) je funkcia, ostáva.
11. **Logo MDS** (čierny kruh) má na tmavom podklade obrys `1px var(--line-2)` namiesto tieňa (2.5).
12. **Lekcie 1024–1279 px** v dvoch stĺpcoch (9,5rem | obsah) ako 760–1023 px; trojstĺpcové od 1280 px. Pri 1024 px
    mal stĺpec názvu ~120 px a „(no-gi,“ sa rozdelilo na dva riadky (kontrola 2).
13. **Filter trénerov ≥ 760 px** sa zalomí do viacerých riadkov (768 a 1024 px pretekali, kontrola 1); pod 760 px
    jeden posuvný riadok podľa 4.8.

### Známe obmedzenia a pre B4/B5

- Otvorenie `/#rozvrh`: CLS 0,04 (riadky dnešných lekcií pribudnú po `app.js`); kontrola 12 meria `/#cennik`.
  Možné riešenie v B4/B5: predkresliť dnešné riadky skriptom hneď za rozvrhom alebo rezervovať výšku podľa `GK`.
- Prúžok postupu (`.progress`) je do B4 skrytý; triedy `rv`, `mask`, `rv-img`, `par` sú pripravené.
- Mapa: v testoch (Google blokovaný) je rámec po načítaní iframe biely – v prehliadači bez blokovania mapa.
- Kontroly 10 a 11 prechádzajú aj v B3 (žiadne animácie); v B4 ich treba zopakovať.

### Overenie pred commitom (logy `redesign/impl/B3/final/`)

- `python3 nastroje/zostav.py` → kód 0, „Web je zostavený“.
- `python3 -m unittest discover -s nastroje -p 'test_*.py'` → **86/86 OK** (vrátane nového `test_css_pravidla`).
- `node nastroje/test_prehliadac.mjs ../lupa-vzor` aj `../lupa-vzor-cms` → „Všetko v poriadku.“ (19 kontrol, kód 0).
- `BEZ_PIXELOV=1 node nastroje/porovnaj_so_vzorom.mjs ../lupa-vzor-cms _site ../redesign/overenie/porovnanie-B3` →
  kód 0, „Bez rozdielov okrem zámerných zmien“: živé texty 14 kombinácií šírka × čas (21 riadkov „zámerný vzhľad“ –
  odchýlka 5), interakcie filter 8×, dni 7×, Tréner 11×, otázky 6×, lightbox 13× pri 390 aj 1440 px bez rozdielu.
- `node nastroje/test_vzhlad.mjs _site ../redesign/impl/B3/vzhlad` → kód 0, 93 kontrol OK: 1–8 pri 6 šírkach,
  9 (1440: 18,29; 390: 22,86 obrazovky), 10, 11, 12 (CLS `/#cennik` 0,0000 pri 390 aj 1440), 13 (snímky a stavy).
- `grep -rnE "btn-volt|btn-ghost|reveal\b|data-tilt" sablona assets` → 0 nálezov.
- Veľkosti: `style.css` 667 riadkov, 11,3 kB gzip; `app.js` 10,0 kB gzip.
- `obsah/` a `nastroje/testdata/obsah/` bajtovo zhodné (`cmp`).
- **Snímky prezreté** (390, 768, 1024, 1440; aj 360 a 1920; stavy pri 390 a 1440; časy zatvorené a sviatok):
  hárky `impl/B3/vzhlad/h-{390,768,1024,1440}-*.jpg`, `f390*.jpg`, `f1440*.jpg`, `stavy-{390,1440}.jpg`, detail loga
  `impl/B3/logo-*.png`. Nájdené a opravené vady: obsah úvodu a medzihry v mriežke zúžený na šírku textu (centrovaný),
  stav v pätičke svetlým písmom na kostenom podklade, zvuk MDS mimo rámu videa, pretečenie filtra trénerov pri 768
  a 1024 px, rozdelené „(no-gi,“ pri 1024 px, deň v rozvrhu 43 px pri 360 px, dlhé dnešné hodiny zalomené na
  telefóne, mobilné menu bez štýlu po prvom označení aktívnej položky (`a:not([class])` → `:not(.nav-phone,.nav-cta)`),
  úvodzovka recenzie cez text, logo MDS splývajúce s tmavým podkladom. Zostáva: biela plocha mapy v testoch
  (blokovaný Google).

---

## Opravy po kontrole B3 (15. 10. 2026)

Jeden lokálny commit **`4a9840f`** na vetve `redizajn-2026-10` (6 súborov, bez push, `main` ostáva na 396f446). Pracovné súbory a dôkazy:
`redesign/impl/oprava-B3/` (skripty `bodka.mjs`, `bodka_analyza.py`, `lightbox.mjs`, `logo.mjs`; logy `final/`).

### 1. Bodka dnešného dňa v rozvrhu ležala cez písmeno (stredná) – opravené

- Overené: pred opravou bodka 6–12 px od hornej hrany tlačidla, písmo „ST“ od 10 px a mäkčeň „Š“ od 5,7–6 px.
  Bodka teda prekrývala písmeno o 2 px a mäkčeň o 6 px pri 360, 390 aj 1440 px (`impl/oprava-B3/pred/`).
- Oprava (`style.css`): `.tt-day` má horné odsadenie 15 px a spodné 2 px (predtým 6/6), medzera medzi skratkou
  a popiskom 1 px (predtým 2) a bodka `top:4px`. Výška tlačidla ostáva 56 px (`min-height` zo SPEC 4.9) a výška
  stránky sa nemení. Pseudoprvok ostáva `::before`, `textContent` aj `innerText` tlačidla sú rovnaké ako predtým.
- Namerané (`bodka_analyza.py`, pixely snímok pri DPR 2–3): bodka 4–10 px, „ST“/„PO“ od 17 px (medzera 7 px),
  „Š“ s mäkčeňom od 12,7–13,5 px (medzera 2,7–3,0 px). Prípady: streda, štvrtok, sviatok 24. 12. (štvrtok) a pondelok
  pri 360, 390 a 1440 px – 12/12 OK. Hárok `impl/oprava-B3/po-riadky.png`, snímky `vzhlad/snimky/*-rozvrh.jpg`
  a `stavy/*-sviatok-rozvrh.jpg` prezreté.

### 2. Lightbox: prázdny rám, kým sa nestiahne plná fotka (stredná) – opravené

- Overené: `open()` volal `fit()` pred `showModal()`. Zatvorený dialóg má `display:none`, plocha mala 0 × 0 px
  a náhľad dostal `width:0;height:0`. Reprodukované 50 ms po kliknutí pri 390 aj 1440 px pre esej, Detaily aj bar
  (plné fotky spomalené o 1,5 s): 6/6 prípadov 0 × 0 px (`impl/oprava-B3/lb-pred/`).
- Oprava (`app.js`): `dlg.showModal()` a `html.lb-open` sa volajú pred `fit()` náhľadu.
- Po oprave (`lightbox.mjs`): 50 ms po kliknutí je náhľad viditeľný v konečnom rozmere (1440: 1312 × 738 a 1040 × 780;
  390: 390 × 219 a 390 × 293), popisok a počítadlo sú hneď správne; plná fotka ho potom nahradí bez zmeny rozmeru.
  6/6 OK, bez chýb JS. Snímky `impl/oprava-B3/lb-po/lb-*-50ms.jpg` prezreté.

### 3. Porovnávač `BEZ_PIXELOV` toleroval veľkosť písmen a medzery pri všetkých živých textoch (nízka) – opravené

- Overené: v B3 sa tolerancia uplatnila len na `.hero-colo` (7×) a `#cesta [data-live]` (14×), pravidlo však platilo
  pre všetky kľúče `ZIVE`.
- Oprava (`nastroje/porovnaj_so_vzorom.mjs`): nový zoznam `VOLNY_ZAPIS = ['.hero-colo', '#cesta [data-live]']`;
  ostatné živé texty (stav, rozvrh, `.today`, hodiny, `coach-when`, `chip-count`) sa porovnávajú presne. README
  (opis porovnania) doplnený.
- Negatívny test: kópia webu s `.tt-list *{text-transform:lowercase}` – nový skript hlási „text .tt-list sa líši“
  (kód 1), starý ho označil ako „zámerný vzhľad“. Celé porovnanie so zmrazeným vzorom: kód 0, „zámerný vzhľad“ len
  21× pri dvoch povolených kľúčoch.

### 4. Návody s neaktuálnymi počtami záberov (nízka) – opravené

- `NAVOD-PRE-ONDREJA.md` (tabuľka značiek) a `README.md`: „štyri zábery“, „4 zábery“, „sedem ďalších miest“ –
  overené výpočtom `zostav.pocet_slovom/pocet_cislom` z dnešného obsahu (film 4, mozaika 7). Ostatné riadky tabuliek
  (11 trénerov, 4 recenzie, 5 lekcií, 3 kroky) sedia. Príklady „napr. päť záberov“ v popisoch značiek v `zostav.py`
  a „napr. Šesť ďalších miest“ v `.pages.yml` sú výslovne ilustračné, nemenené.

### 5. Plnofarebné logo nad rozpočtom SPEC 9 (nízka) – vyriešené zmenšením SVG

- Overené: `gymklub-logo.svg` 57 341 B, 22,46 kB gzip (> 15 kB).
- Zvolená možnosť bez zmeny rozpočtu SPEC: súradnice ciest zaokrúhlené na celé čísla rovnako ako pri reverznom logu
  (B1). Dáta ciest sú **bajtovo zhodné** s už overeným `gymklub-logo-tmave.svg`, líšia sa len farby (#2a4ea8,
  #1d1d1f, #e2412f ostávajú). Nová veľkosť 38 383 B, **14,73 kB gzip** (≤ 15 kB).
- Vzhľad (`logo.mjs`, výška 34, 40, 96 a 200 px pri DPR 2 a 3, hárok `impl/oprava-B3/logo-porovnanie.png`): rozdiely
  len v antialiasingu hrán (2–4 % pixelov kresby), tvary písmen, činky a malého nápisu totožné. V hlavičke (kartička
  40/34 px) a v pätičke nerozoznateľné. Návrat na pôvodný súbor je jeden súbor z gitu (`git show 396f446:assets/img/gymklub-logo.svg`).
  Ak orchestrátor radšej upraví rozpočet, stačí súbor vrátiť.

### 6. Úvod na telefóne takmer čierny (nízka) – nemenené, na rozhodnutie orchestrátora

- Overené: na 390 × 844 je fotka nad textom viditeľná len v hornej časti (strop); clona `.hero-in::before`
  `rgba(11,12,15,.66)` kryje blok od stavu po tlačidlá.
- Prečo nemenené: kontrola sama žiada potvrdenie orchestrátorom. Väzbou je červený druhý riadok H1 (#e2412f, L = 0,20):
  pre 3 : 1 potrebuje pozadie s L ≤ 0,033 (dnes 3,85 : 1 pri L 0,0154). Obmedzenie clony na H1 + odsek by pomohlo
  málo – tlačidlá a kolofón ležia v pásme prechodu s krytím ≥ .78, takže fotka by sa tam rozjasnila len nepatrne.
  Skutočná páka je výrez fotky na telefóne (`uvod.ohnisko_telefon`, prípadne iný záber v CMS) alebo kratší blok
  textu – to je obsahové rozhodnutie (majiteľ/orchestrátor), nie oprava kódu.

### 7. Úvodzovka pred prvou recenziou bez zálohy `content` (nízka) – opravené

- `style.css`: `.rev-lead::before{content:"„";content:"„" / "";…}` – prehliadač bez alternatívneho textu v `content`
  použije prvú deklaráciu. Snímky `1440-recenzie.jpg` a `390-recenzie.jpg` bez zmeny vzhľadu.

### 8. Trieda `html.sm` bez pravidla v CSS (nízka) – presunuté do B4 (podľa návrhu kontroly)

- Overené: `app.js` pridá `sm` po `load`, `style.css` ju nepoužíva. SPEC 6.1 triedu vyžaduje („plynulé skrolovanie CSS
  až po prvom vykreslení“), takže sa nemaže. Plynulé skrolovanie je pohyb, B3 je bez pohybu. **Pre B4:** doplniť
  `@media (prefers-reduced-motion: no-preference){html.sm{scroll-behavior:smooth}}` (mimo jediného bloku `reduce`)
  a zosúladiť s `jump()` (5.4 #11/#12; `scrollTo({behavior:'instant'})` vo View Transition CSS prebije).

### Overenie pred commitom (logy `redesign/impl/oprava-B3/final/`)

- `python3 nastroje/zostav.py` → kód 0, „Web je zostavený“.
- `python3 -m unittest discover -s nastroje -p 'test_*.py'` → **86/86 OK**.
- `node nastroje/test_prehliadac.mjs ../lupa-vzor` aj `../lupa-vzor-cms` → „Všetko v poriadku.“ (kód 0).
- `BEZ_PIXELOV=1 node nastroje/porovnaj_so_vzorom.mjs ../lupa-vzor-cms _site …/oprava-B3/porovnanie` → kód 0;
  živé texty 14 kombinácií, interakcie filter 8×, dni 7×, Tréner 11×, otázky 6×, lightbox 13× pri 390 aj 1440 px.
- `node nastroje/test_vzhlad.mjs _site …/oprava-B3/vzhlad` → kód 0, 93 kontrol OK; výška 18,29 (1440) a 22,86 (390)
  obrazovky – bez zmeny; kontrast H1 riadok 2: 3,85 (390) a 3,29 (1440).
- `grep -rnE "btn-volt|btn-ghost|reveal\b|data-tilt" sablona assets` → 0.
- Veľkosti: `style.css` 668 riadkov, 11,42 kB gzip; `app.js` 10,13 kB gzip; `index.html` 23,06 kB gzip; logo 14,73 kB gzip.
- Snímky prezreté (Read): rozvrh 390/1440 (dnes, sobota, sviatok), lightbox 390/1440, úvod 390/1440 (logo na kartičke),
  recenzie 1440, pätička 390.

---

## Opravy pred B4 (15. 10. 2026)

Jeden lokálny commit **`fa688ff`** „Opravy pred B4: …“ na vetve `redizajn-2026-10` (bez push, `main` ostáva na 396f446). Pracovné
súbory a dôkazy: `redesign/impl/oprava-pred-B4/` (skripty `skripty/`, stav pred opravou `pred/`, po oprave `po/`,
fotky a výrezy `media/`, celý `test_vzhlad` `vzhlad/`, logy `final/`).

### b) Úvod na telefóne – fitko je vidieť (najdôležitejšia oprava)

**Príčina tmavého úvodu:** orez `t` fotky `funkcna-zona-4` (celá šírka od 4 % výšky) mal v hornej polovici len čierny
strop; samotné fitko (rig, maľba GYM, zrkadlá, dráha) ležalo v strede fotky – presne pod textom a pod clonou
(prechod .78–.95 + `.hero-in::before` .66). Na 390 × 844 začínal text v 20 % výšky.

**Riešenie (telefón a tablet na výšku, `@media (max-width:860px) and (orientation:portrait)`):**
- **Nový orez `t` pre telefón** (`orezy.json`): `funkcna-zona-4` t = šírka 0,84, stred x 0,54, od 21 % výšky
  (pôvodne 1,00 / 0,5 / 0,04). V hornej tretine je LED strop so šesťuholníkovými svetlami, v strede rig, maľba GYM
  a zrkadlá, nižšie červená dráha. Pri šírke 0,84 má orez 1623 px, sada 1600 sa teda len zmenšuje. Hárok orezov
  `media/orezy-harok.jpg` (nový vedľa starého). Počítač (`-w`) bez zmeny.
- **Kompozícia:** fotka je hore (`.hero-cam` a `.hero-shade` vysoké `--txt + 250px`, `object-position` zhora, LQIP
  tiež zhora), text začína najskôr v `--txt = max(34svh, lišta + oznam + 16px)`. Clona je len prechod v spodnej časti
  fotky za textom (od 0 v 330 px nad spodkom fotky po plné `--bg`) a jemný prechod pod lištou; `.hero-in::before`
  sa na výšku nepoužíva. Menšie medzery v bloku textu (stav 10, odsek 12, tlačidlá 20/4, kolofón 16/16/12, `dd` 4 px).
  Červená ostáva značková `--red` (svetlejší odtieň nebol potrebný – H1 riadok 2 stojí na tmavom prechode).
- Ak sa obsah nezmestí, úvod sa natiahne (4.2) a `heroFit` ho prilepí so záporným `top` (390 × 844: úvod 914 px,
  `--hero-top` −70 px; 360 × 740: 856 px, −116 px). Kolofón aj obe tlačidlá ostávajú; kolofón je celý nad dokom po
  posune o ~60–70 px, potom ho prekryje list Intro (`po/posun/harok-*.jpg`).
- **`heroFit` (app.js):** `.is-tight` (menší H1) sa posudzuje bez zámerného horného okraja s fotkou (`padding-top`
  − lišta − 24 px). Inak by sa pri úvode vyššom ako okno H1 po načítaní app.js zmenšil (prototyp to ukázal: H1 76 px
  namiesto 99 px) a obsah by poskočil. Na počítači je okraj 0, správanie sa nemení.
- Na šírku (telefón otočený) ostáva riešenie z B3.

**Meranie** (`skripty/meraj_uvod.mjs`, `pred/uvod/` → `po/uvod/`; Y = priemerná relatívna svetlosť, L* = vnímaný jas,
horných 40 % okna; „len fotka“ = bez textu, lišty a doku):

| okno | pred: snímka Y / L* | pred: len fotka | po: snímka Y / L* | po: len fotka | počítač 1440 × 900 (snímka / len fotka) |
|---|---|---|---|---|---|
| 360 × 740 | 0,075 / 17,2 | 0,043 / 20,8 | **0,149 / 37,0** | 0,127 / 35,5 | 0,080 / 24,0 · 0,064 / 22,7 |
| 390 × 844 | 0,078 / 18,8 | 0,045 / 21,1 | **0,151 / 37,5** | 0,133 / 36,2 | |
| 430 × 932 | – | – | 0,150 / 37,4 | 0,134 / 36,4 | |
| 768 × 1024 | 0,042 / 18,9 | 0,038 / 19,2 | 0,120 / 33,4 | 0,114 / 33,3 | |

Horných 40 % úvodu na telefóne je teraz asi 2× svetlejších než predtým a svetlejších než na počítači (tam ľavú
polovicu zámerne tlmí clona pod veľkým H1). Snímky `po/uvod/harok.jpg`, `vzhlad/h390.jpg`, `vzhlad/h360-768.jpg`:
rozpoznateľný LED strop, rig, maľba GYM a dráha.

**Kontrast na skutočných pixeloch za textom** (text skrytý, priemer pod obdĺžnikmi riadkov; SPEC 10/2.1):

| okno | H1 riadok 1 | H1 riadok 2 (`--red`) | odsek | stav | adresa | Navigovať | kolofón dt / dd |
|---|---|---|---|---|---|---|---|
| 360 × 740 | 15,61 | 4,47 | 11,41 | 9,22 | 7,93 | 17,47 | 7,85 / 17,47 |
| 390 × 844 | 15,66 | 4,50 | 11,49 | 9,54 | 8,31 | 17,47 | 7,85 / 17,49 |
| 768 × 1024 | 17,15 | 4,68 | 11,56 | 16,71 | 10,96 | 17,47 | 7,85 / 17,52 |

(Pred opravou 390: riadok 2 3,85, odsek 9,88.) Nič sa neprekrýva, kontrola 8 v `test_vzhlad` OK pri všetkých 6 šírkach.

### c) Medzihra „Funkčná zóna“ – nový záber `u-38047dcd`

- **Panorámy z videí** (`media/okna-*`, `media/rig-*`, výrezy 100 %): obe sú zlepené snímky videa – mäkké, s pohybovou
  neostrosťou a švami. `pano-funkcna-okna-full`: zdvojená mriežka a šev stropu v strede, rozmazaný stred s duchmi;
  v zrkadle vzadu **fotograf a ďalšia osoba** a odraz nápisu **„SATELIT…“** (`okna-100-c-zrkadla2.jpg`).
  `pano-funkcna-rig-full`: roztrhnutý šev stropu (`rig-100-d-sev.jpg`), rozmazaný stred (`rig-100-a-stred.jpg`), vľavo
  v okne **„…A TECHNIKA predaj · montáž“** (`rig-100-c-vlavo.jpg`); čistý pravý okraj je len detail kotúčov
  „VARNIKA STRENGTH“ pred zrkadlom a na šírku 1920 nemá rozlíšenie. **Nepoužiteľné** (zhodne s inventárom).
- **Ďalšie skutočné zábery funkčnej zóny** (`media/kandidati-harok.jpg`, výrezy 100 %): fz3 `f3cad8ed` – „SATELITNÁ
  TECHNI…“ v okne; `81573039` – v okne za vzduchovým bicyklom plagát „ANTIK“/„nam…SAT“ (`f815-300-plagat.jpg`);
  fz2 `751e5e8a` – biela bunda prehodená vpravo, orez 16 : 9 na plnú šírku (nutný pre sadu 1920 bez zväčšovania)
  ju neodstráni; fz5, fz7 – nápisy (B1); fz1, fz6 – mäkké, zmazané.
- **Zvolené: `u-38047dcd`** (originál `38047dcd`, ostrý iPhone záber): rig Life Fitness pod šesťuholníkovým LED
  stropom, kettlebelly, laná, dráha, okná do budovy a zrkadlo s maľbou klubu. Výrez 100 % (`media/u38-w1920-100-*.jpg`,
  `38047dcd-100-*.jpg`): bez cudzích nápisov (len značky náradia Life Fitness, DBX Bushido), bez ľudí aj v zrkadle,
  bez švov. Nové sady cez `priprav_fotky.py` (zjednotená gradácia): `w` od 24 % výšky (960, 1920) a `t` doplnená
  o 1600 (`sizes` medzihry na telefóne 71svh → DPR 3 chce 1600). AVIF: w-1920 117,4 kB (≤ 190), w-960 41,0 (≤ 70),
  t-1600 139,0 kB pri q46 (≤ 160, jeden krok), 1080 87,8, 640 36,0.
- **Obsah** (`obsah/` = `nastroje/testdata/obsah/`, bajtovo): `texty.funkcna_zona.foto` = `u-38047dcd`; `popis_fotky`
  bez zmeny – „…so stropom zo šesťuholníkových LED svetiel a rigom Life Fitness“ na záber sedí. Záber bol v Detailoch
  („Kruhový tréning pri oknách“) – **z Detailov som ho vypustil**, aby sa fotka na stránke neopakovala (Detaily 6,
  značka `{pocet_dalsich_miest}` → „Šesť ďalších miest“; lightbox 12 záberov). Žiadny nový text.
- `.pages.yml`: `u-38047dcd` pribudol do `foto_siroka` (test katalógu), jednotný popisok „Funkčná zóna – rig pri
  oknách“ (v `foto_mozaika` „(obe)“). `test_obsah_a_pocty`: „Sedem“ → „Šesť ďalších miest“ (testdata sa zmenili).
  Návody (README, NAVOD 7a a tabuľka značiek) podľa toho.

### d) Rozhodnutie k SPEC 7.4 – záložné WebP/JPG

- **SPEC 7.3/7.4 upravené:** rozpočet platí pre AVIF; záložné WebP 78 a JPG 82 sa neznižujú a nemajú pomerový limit;
  150 kB a AVIF q42 platí pre `-1600` fotky, ktorú úvod na telefóne naozaj ukazuje, 200 kB pre `-w-1920` fotky úvodu.
- **`priprav_fotky.py`:** `MAX_KROKOV` webp/jpg = 0, limity WebP/JPG zrušené (tabuľka ich veľkosť a pomer len vypíše),
  fotky úvodu sa čítajú z `obsah/texty.json` (`uvod.foto`, `uvod.foto_telefon` alebo `uvod.foto`) namiesto napevno
  zapísaných fz4/fz7.
- **Pregenerované** (celý beh, `final/priprav_fotky.log`, kód 0, „Rozpočet 7.4: splnený“): kódovanie je deterministické,
  takže sa zmenili len dotknuté súbory – 25 WebP a 28 JPG, ktoré boli predtým znížené (fz5, fz7, hlavna-sala-1/-3/-4,
  kardio-1/-3, stroje-1/-2/-3/-4, volne-vahy-2, u-38047dcd), sady fz4 t (nový orez) a u-38047dcd (nové w a t-1600).
  AVIF sa zmenil len pri fz4 t (orez) a `funkcna-zona-7-1600` (už nie je v úvode: rozpočet 160 kB, q50 → 46).
  Najväčší záložný súbor: JPG `funkcna-zona-5-1600` 545 kB (len pre prehliadače bez AVIF). Súbory bez EXIF/ICC (overené).

### a) Nálezy kontroly B3

1. **Cenník na telefóne (≤ 559 px)** – overené (`pred/nalezy/`): riadky s poznámkou mali pevnú výšku 48 px a obsah
   60 px, linka preškrtávala poznámku a „mesiac“ vytŕčal pod riadok. Oprava: riadok `height:auto; min-height:48px`,
   `padding-block:6px`, `line-height:1.35`, prázdna poznámka sa nevykreslí. Po oprave všetkých 5 riadkov pri 360,
   390 aj 559 px: obsah vnútri riadku, linka pod textom (`po/nalezy/cennik-390-pred-po.png`).
2. **Lightbox** – overené: neaktívna vrstva (`opacity:0`) zachytávala klik vedľa fotky (pri 1440 px pri zábere 2/13 vľavo
   aj vpravo od fotky) a pás popisku sa nezatváral. Oprava: `.lb-img:not(.is-on){pointer-events:none}` a klik na
   `.lb-bar` mimo textu zatvorí. `skripty/nalezy.mjs`: 28 klikov na pozadie (nad, pod, vedľa fotky, pás popisku, roh)
   pri 390 aj 1440 px – všetky zatvoria; klik na fotku a na šípku nezatvorí; bez chýb JS.
3. **`.totop`** – overené: pri 861–1343 px prekrýval pravý okraj obsahu o 8–34 px. Oprava: tlačidlo stojí v pravom
   okraji vedľa `.wrap` (`right: clamp(8px, (okraj − 44px)/2, 24px)`) a ukáže sa **od 1344 px**, keď je okraj aspoň
   60 px. **Odchýlka od 4.15** („≥ 861 px“): pri 861–1343 px tlačidlo nie je – v okraji 34–60 px sa 44 px tlačidlo
   bez prekrytia nezmestí a menšie by nespĺňalo 44 px. Návrat hore ostáva cez lištu (ukáže sa pri posune nahor)
   a kláves Home. Po oprave prekryv 0 px pri 1344, 1366, 1440, 1920.
4. **Menu v lište 861–1100 px** – opravené na **15 px** (SPEC 4.1), medzera medzi položkami 20 px (inak 28). Meranie:
   pri 861 px ostáva 42 px voľna medzi logom a menu, jeden riadok, bez pretečenia.

### e) Čierny úvod v celostránkových snímkach – artefakt snímky, nie chyba webu

- `skripty/cela.mjs`, `cela2.mjs`: po skrolovaní dole a späť hore (koliesko, s pohybom aj s `reduce`, 360/390/1440) je
  úvod viditeľný, `--hero-top`, `hero-dim`/`hero-expo` 0, fotka načítaná (`po/cela/harok-navrat.jpg`).
- Príčina čiernej plochy: `test_vzhlad` robil celostránkovú snímku, keď bola stránka posunutá na medzihru (po kontrole 8).
  Prehliadač vtedy nakreslí lepený úvod (`position: sticky`) na jeho posunutom mieste za listom Intro a pevnú lištu
  v strede stránky – horná časť snímky ostane prázdna (`pred/cela2/harok-390.jpg`: vľavo snímka zhora, vpravo pri
  posune). Oprava v `nastroje/test_vzhlad.mjs`: pred celostránkovou snímkou posun hore. Nové snímky
  `vzhlad/snimky/*-cela.jpg` ukazujú úvod (`vzhlad/h-cela-hore.jpg`; dok v strede je pevný prvok – tiež artefakt).

### Výška stránky

390 × 844: **22,97 obrazovky** (≤ 23; pred opravami 22,86): +70 px úvod (fotka hore), +39 px riadky cenníka
(predtým pretekali, výška bola skrytá). 1440 × 900: 18,29 (bez zmeny). **Rezerva pri 390 px je ~22 px** (23 × 844 = 19 412, stránka 19 390 px) – ak by B4–B6
potrebovali miesto, najväčšia je sekcia Tréningy (5,32 obrazovky; SPEC 3,6) alebo medzihra na telefóne (88svh).

### Pre B4/B5

- `sizes` sady `t` úvodu ostáva podľa 4.2 `(orientation: portrait) 80svh, 100vw`; skutočná šírka fotky na telefóne je
  teraz `max(100vw, 0,8 × (34svh + 250px))` (~430 px pri 390 × 844). Pri DPR 2 sa sťahuje 1600 namiesto 1080 – v B5
  zvážiť presnejšie `sizes` (aj v preloade).
- Otvorenie úvodu (B4): `.hero-cam` a `.hero-shade` sú na telefóne na výšku vysoké `--cam-h`, nie celý úvod;
  `.hero-expo` a `.hero-dim` ostávajú `inset:0`.

### Overenie pred commitom (logy `impl/oprava-pred-B4/final/`)

- `python3 nastroje/zostav.py` → kód 0.
- `python3 -m unittest discover -s nastroje -p 'test_*.py'` → **86/86 OK**.
- `node nastroje/test_prehliadac.mjs ../lupa-vzor` aj `../lupa-vzor-cms` → „Všetko v poriadku.“
- `BEZ_PIXELOV=1 node nastroje/porovnaj_so_vzorom.mjs ../lupa-vzor-cms _site …` → kód 0, „Bez rozdielov okrem
  zámerných zmien“ (živé texty 14 kombinácií, filter 8×, dni 7×, Tréner 11×, otázky 6×, lightbox 12×).
- `node nastroje/test_vzhlad.mjs _site …/vzhlad` → kód 0, všetky kontroly 1–13 (kontrast 8 pri 6 šírkach, výška 9,
  CLS `/#cennik` 0,0000 pri 390 aj 1440).
- `obsah/` = `testdata/obsah/` (cmp); grep `btn-volt|btn-ghost|reveal\b|data-tilt` = 0; `style.css` 689 riadkov,
  12,1 kB gzip; `app.js` 10,3 kB gzip; `index.html` 22,9 kB gzip.
- Snímky prezreté (Read): úvod 360/390/430/768/1024/1440 (aj stavy zatvorené a sviatok), medzihra 360/390/768/1024/1440,
  Detaily, bar, cenník 360/390/1440, rozvrh 1024, menu 390, lightbox 390/1440, posun úvodu 360/390, celostránkové
  snímky zhora. Logo v hlavičke nezmenené (plnofarebné na bielej kartičke).

---

## Opravy po kontrole Opráv pred B4 (15. 10. 2026)

Jeden lokálny commit **`4675cfb`** na vetve `redizajn-2026-10` (bez push, `main` ostáva na 396f446). Mení `assets/style.css`,
`assets/app.js`, `.pages.yml` (len popis poľa), `NAVOD-PRE-ONDREJA.md` a `README.md`; obsah a médiá sa nemenili
(`obsah/` = `testdata/obsah/`). Mimo repozitára: SPEC (4.2, 4.3, 4.4, 4.5, 4.6, 4.15, 7.2, 13). Pracovné súbory a dôkazy:
`redesign/impl/oprava-Opravy/` (skripty `skripty/` – kópie skriptov kontroly s viac oknami a zoznamom všetkého, čo dok
prerezal; stav pred opravou `pred/`, po oprave `po/`, s oznamom `po/uvod-oznam/`, bez JS `po/bezjs/`, posun `po/posun/`,
výrez `vyrez/`, výkon `po/vykon/`, celý `test_vzhlad` `vzhlad/`, logy `final/`). Každý nález som najprv overil.

### 1. Úvod na telefóne vyšší ako okno, dok prerezal kolofón (stredná) – opravené

**Overenie** (`pred/uvod/`, skript kontroly rozšírený o 360 × 800 a 393 × 852): nález platí a je širší – dok prerezal text
pri 360 × 740 (štítky 1. riadka kolofónu), 360 × 800 (hodnoty 1. riadka), 390 × 844 a 393 × 852 (štítky 2. riadka),
412 × 915 a 430 × 932 („Plne klimatizované, šatne a sprchy“). Príčina: text začínal pevne v `--txt = max(34svh, …)`
a fotka mala `--txt + 250px`, takže obsah (≈ 550 px) s fotkou nad ním bol vyšší ako okno.

**Riešenie (CSS, telefón a tablet na výšku):**
- Obsah je opäť dole (`align-content:end`, ako pred Opravami) a horný okraj je len lišta + oznam + 16 px. Úvod má teda
  presne 100svh, kým sa obsah zmestí (SPEC 3.2, 4.2), a kolofón končí 11 px nad dokom (spodný okraj 80 px, dok 69 px).
  Dlhší text z CMS posunie začiatok textu vyššie, nie kolofón pod dok.
- Fotka sady `t` je v ráme 4 : 5 (`aspect-ratio`) celá hore od horného okraja; `--txt` a `--cam-h` sa rušia.
- Clona sa viaže na začiatok textu: `.hero-in::before` od 56 px nad textom (0 → .6 → .9 → `--bg` po 290 px), siaha až
  pod úvod. `.hero-shade` už len tlmí pás pod lištou a posledných 160 px fotky (mäkký koniec fotky). Kontrast preto
  nezávisí od výšky okna.
- **Nízky telefón (výška ≤ 780 px, rovnaká hranica ako menší H1):** obsah sa s fotkou nezmestí, úvod sa natiahne
  (4.2) zámerne tak, aby text končil 8 px nad dokom a celý kolofón začínal pod ním (druhá možnosť z nálezu, ako pri
  375 × 667): `grid-template-rows: minmax(100svh − dok − 8 px − horný okraj, auto) auto`, `.hero-in{align-self:end}`.
  `heroFit` úvod prilepí so záporným `top` (−157 px), po posune o ~160 px je kolofón celý nad dokom, potom ho prekryje
  list Intro (`po/harok-posun.jpg`).
- **`heroFit` (app.js):** `.is-tight` sa určí podľa toho, či nad obsahom ostalo voľné miesto (`hin.offsetTop − padding-top
  < 1`) a úvod je aj tak vyšší ako okno – namiesto odpočtu „okraja s fotkou“, ktorý pri novom rozložení nedáva zmysel.
  Na počítači a na šírku sa správanie nemení (tam pri pretečení obsahu voľné miesto nie je a úvod je vyšší ako okno).
- **Bez JS** nie je `heroFit`: `@media (scripting:none){.hero{position:relative}}` – vyšší úvod sa nelepí, dá sa celý
  doskrolovať (Chromium s vypnutým JS túto podmienku spĺňa, overené).

**Meranie** (`skripty/uvod.mjs` + `analyza_uvod.py`, pohyb zapnutý, `?gk-at=2026-10-14T18:12`; Y = jas horných 40 % okna
zo snímky; „prerezané“ = počet prvkov textu úvodu, ktoré pretína horný okraj doku):

| okno | výška úvodu pred → po | top lepenia | kolofón nad dokom pred → po | prerezané pred → po | Y pred → po | H1 riadok 2 |
|---|---|---|---|---|---|---|
| 360 × 740 | 856 → 897 | −157 | 0/8 → 0/8 (celý pod dokom) | 2 → 0 | 0,149 → 0,169 | 4,66 |
| 375 × 667 | 831 → 824 | −157 | 0/8 → 0/8 (celý pod dokom) | 0 → 0 | 0,137 → 0,143 | 4,52 |
| 360 × 800 | 899 → **800** | 0 | 2/8 → **8/8** | 2 → 0 | 0,154 → 0,137 | 4,52 |
| 390 × 844 | 914 → **844** | 0 | 4/8 → **8/8** | 2 → 0 | 0,151 → 0,148 | 4,53 |
| 393 × 852 | 917 → **852** | 0 | 4/8 → **8/8** | 2 → 0 | 0,152 → 0,147 | 4,53 |
| 412 × 915 | 940 → **915** | 0 | 7/8 → **8/8** | 1 → 0 | 0,152 → 0,144 | 4,59 |
| 430 × 932 | 948 → **932** | 0 | 7/8 → **8/8** | 1 → 0 | 0,150 → 0,147 | 4,58 |
| 768 × 1024 | 1024 → 1024 | 0 | 8/8 → 8/8 | 0 → 0 | 0,119 → 0,169 | 4,54 |
| 1024 × 768, 1440 × 900, 844 × 390 | bez zmeny | | | | | |

Jas ostal ≥ 0,137 (počítač 0,080), H1 riadok 2 ≥ 4,5 : 1, stav ≥ 8,3, adresa ≥ 6,5, odsek ≥ 11,5 (priemer pod textom).
Pri 390 × 844 začína text v 217 px (predtým 287), fotka nad ním ukazuje LED strop, rig a maľbu GYM (`po/harok-uvod1.jpg`,
`vzhlad/snimky/390-top.jpg`). Stavy „zatvorené“ a „sviatok“ (dlhší text živej bunky) sa zmestia tiež.
**Bez JS** (`po/bezjs/`): 390, 412 a 430 px – kolofón celý nad dokom hneď; 360 a 375 px – po posune o 200 px.
**Výška stránky** pri 390 × 844: 22,97 → **22,89** obrazovky (úvod 1,0); 1440 × 900: 18,29 bez zmeny.

Známe, nemenené (už od B3, nie je v náleze): telefón na šírku 844 × 390 – úvod je vyšší ako okno (661 px, lepí sa
s −271 px) a dok na prvej obrazovke prereže odsek; na šírku zostalo riešenie z B3.

### 2. Oznam zakryl hornú časť fotky (nízka) – opravené

- Overené (`site-oznam` zo `obsah` kontroly, oznam 2 riadky, 94 px): fotka bola od 0, oznam ležal na LED strope.
- Oprava: na výšku má rám fotky `top: var(--oznam-h)` – fotka začína pod oznamom. Samotný posun by však pri úvode
  na výšku 100svh nechal fotke len ~60 px (jas 0,096, horšie než 0,117 z kontroly), preto sa telefón s oznamom (výška
  okna do 960 px) správa ako nízky telefón z bodu 1: text končí nad dokom, kolofón je celý pod ním a fotke ostane miesto
  pod oznamom. Trieda `has-oznam` aj `--oznam-h` vznikajú v inline skripte hneď za oznamom (pred úvodom), takže sa nič
  neposúva. Bez JS sa oznam nezobrazí (ako doteraz).
- Meranie s oznamom (`po/uvod-oznam/`): nič prerezané pri žiadnom okne; 390 × 844 Y **0,135** (kontrola 0,117), úvod
  1001 px, H1 riadok 2 4,62; 412/430 px Y 0,144/0,143; 360 × 740 0,114; 375 × 667 0,075 (najmenší telefón: lišta
  + oznam zaberú 154 px z 267 px horných 40 %). Tablet 768 × 1024 a počítač bez zmeny rozloženia.

### 3. Pole „Výrez na telefóne“ na výšku zvisle nič nemenilo (nízka) – vyriešené popisom, pravidlo `0` zrušené

- Overené: `object-position: var(--fx-t) 0` ignorovalo `--fy-t`.
- Po oprave 1 je rám fotky na výšku presne 4 : 5 ako sada `t`, fotka teda nikde nepretečie a ukáže sa celá od horného
  okraja (na tablete 768 × 1024 je celá 768 × 960, nie orezaná na 598 px). Pevné `0` som zrušil, platí
  `var(--fx-t) var(--fy-t)` z pravidla ≤ 860 px – uplatní sa, keď fotka pretečie: na šírku a pri fotke na šírku.
  Overené dočasným zostavením (`vyrez/harok-vyrez.jpg`): `mma-1-32` (3 : 2) s výrezom vľavo/vpravo ukáže ľavú/pravú
  časť (`object-position` 25 % / 75 %), fz4 s „Dolná časť“ ukáže fotku celú od vrchu.
- Zapísané: `NAVOD-PRE-ONDREJA.md` 7a (telefón na výšku ukáže fotku 4 : 5 celú od vrchu, výrez platí na šírku a pri
  fotke na šírku; iný motív = iná fotka pre telefón s motívom v hornej polovici), `README.md` (obmedzenia) a vlastný
  popis poľa `uvod.ohnisko_telefon` v `.pages.yml` (len `description`, meno poľa sa nemení; overené validátorom schémy
  Pages CMS z B2: „ConfigSchema: OK“).

### 4. Plynulosť na počítači pri CPU 4× pod cieľom B4 (nízka) – overené, pre B4

- `skripty/meraj.mjs` (kópia skriptu kontroly s vlastným portom, `po/vykon/`): 1440 px **51,4 fps**, 1,4 % snímok nad
  50 ms, najdlhšia 333 ms; dlhé snímky sú v Tréningoch (36,5 fps, 6,1 %) a v Tréneroch (38,3 fps, 8,1 %), teda
  y ≈ 6 600–11 200 px. Telefón 390 px: 58,6 fps, 0,2 %, CLS 0. Rovnaký obraz ako v kontrole a pred týmto krokom –
  úvod sa na počítači nemenil.
- **Pre B4:** rozobrať trace v Tréningoch a Tréneroch (dekódovanie fotiek dua, plagátov a portrétov, video) pre cieľ
  SPEC 9 (≥ 55 fps, ≤ 1 % snímok nad 50 ms v každej sekcii).

### 5. Text medzihry spomína vzduchový bicykel (nízka) – zapísané ako rozhodnutie majiteľa SPEC 13.5

- Overené (`u38-medzihra.jpg`, w-1920 aj t-1600): rig Life Fitness, kettlebelly, laná, plyo boxy, BOSU a dráha,
  vzduchový bicykel nie. Na predchádzajúcej fz4 tiež nebol. Text sa bez SPEC nemení.
- SPEC 13 doplnená o bod 5 (skrátiť vymenovanie v CMS, alebo dofotiť zónu s bicyklom a bez nápisov v oknách) a SPEC 4.4
  o poznámku. **Pozor pri B6:** návrh „13.5, nové“ (nápisy susedov) z Opráv po kontrole B0+B1 v SPEC zatiaľ nie je;
  v zozname pre majiteľa dostane ďalšie číslo.

### 6. Fotka `volne-vahy-2` sa opakuje (nízka) – overené, nemenené, pre B4/obsah

- Overené: `volne-vahy-2` je v eseji (plocha 2) aj v náhľade „Kde začať“ pri karte „Sila a postava“ (len počítač,
  pri prechode myšou).
- Nemenené v tomto kroku, lebo:
  - opakovanie je výslovná časť záväzného rozhodnutia „Opravy po kontrole B0+B1 › 1“ („Tú istú fotku má esej na ploche
    2, kam vedie odkaz karty `#priestor`“) a samotný nález opravu zaraďuje „pri B4 alebo pri obsahu“;
  - navrhnuté náhrady sa tiež opakujú: `volne-vahy-1` je v Due (Fitness tréning), `jednorucky-1` v Detailoch;
  - jediný nepoužitý záber zóny sily je `hlavna-sala-5` (stroje pod maľbou GYM; `kandidati-karta2.jpg`) – v inventári
    „mäkšia“, nie je v `orezy.json` (nemá zjednotenú gradáciu) a pred použitím potrebuje orez, `priprav_fotky.py`
    a výrez 100 % na ľudí a nápisy.
- **Pre B4/obsah (rozhodne orchestrátor):** (a) ponechať (náhľad = cieľ odkazu), (b) `jednorucky-1` alebo `volne-vahy-1`
  (opakovanie sa len presunie), (c) `hlavna-sala-5` po spracovaní cez `priprav_fotky.py` (bez opakovania). Zmena ide do
  `obsah/` aj `testdata/obsah/`.

### 7. Tabuľky SPEC nezodpovedali stavu (nízka) – doplnené

- SPEC 7.2: riadky `funkcna-zona-4` (orez `t` ,84 / ,54 / ,21), `funkcna-zona-7` a `funkcna-zona-5` (rezerva, nápisy),
  `volne-vahy-2` (aj náhľad karty 2), `hlavna-sala-4` (Detaily), `u-38047dcd` (medzihra, `t` aj 1600, `w` od ,24)
  a poznámka, že zdrojom pravdy je `orezy.json`, s posunmi `w` z B1.
- SPEC 4.4 (medzihra `u-38047dcd`), 4.6 (Detaily 6 záberov), navyše 4.3 (karta 2 `volne-vahy-2`), 4.5 (esej 4 zábery)
  a 4.2 (nové rozloženie úvodu na výšku z tohto kroku) – poznámky „zmenené v …“.
- SPEC 4.15: tlačidlo hore od 1344 px je označené ako **odchýlka na rozhodnutie orchestrátora** (nerozhodoval som).

### Overenie pred commitom (logy `impl/oprava-Opravy/final/`)

- `python3 nastroje/zostav.py` → kód 0, „Web je zostavený“.
- `python3 -m unittest discover -s nastroje -p 'test_*.py'` → **86/86 OK**.
- `node nastroje/test_prehliadac.mjs ../lupa-vzor` aj `../lupa-vzor-cms` → „Všetko v poriadku.“
- `BEZ_PIXELOV=1 node nastroje/porovnaj_so_vzorom.mjs ../lupa-vzor-cms _site …/oprava-Opravy/porovnanie` → kód 0, „Bez
  rozdielov okrem zámerných zmien“ (živé texty 14 kombinácií, filter 8×, dni 7×, Tréner 11×, otázky 6×, lightbox 12×).
- `node nastroje/test_vzhlad.mjs _site …/oprava-Opravy/vzhlad` → kód 0, 93 kontrol OK (kontrast 8 pri 6 šírkach, výška
  390: 22,89 a 1440: 18,29, 10, 11, CLS `/#cennik` 0,0000 pri 390 aj 1440).
- `.pages.yml` – validátor schémy Pages CMS: OK. `obsah/` = `testdata/obsah/`; grep `btn-volt|btn-ghost|reveal\b|data-tilt`
  = 0; `style.css` 698 riadkov, 12,1 kB gzip; `app.js` 10,1 kB gzip.
- Snímky prezreté (Read): úvod 360/375/360×800/390/412/430/768 (aj s oznamom a bez JS), posun 360 a 390, stavy
  zatvorené a sviatok pri 390, 1024 a 1440 (bez zmeny, logo plnofarebné na bielej kartičke), Prečo pri 390.

---

## B4 Pohybový systém (15. 10. 2026)

Jeden lokálny commit **`d450017`** „B4: pohybový systém …“ na vetve `redizajn-2026-10` (bez push, `main` ostáva na 396f446).
Mení `assets/style.css` (časť 18 a prechody stavov v ostatných častiach), `assets/app.js`, `sablona/index.html` (skript
v hlavičke), `sablona/makra.html` (`data-full-t`), `nastroje/test_vzhlad.mjs` (kontrola 11) a `README.md`. Obsah, médiá
a `.pages.yml` sa nemenili (`obsah/` = `testdata/obsah/`), nový viditeľný text nepribudol, logo v hlavičke ostáva
plnofarebné na bielej kartičke. Mimo repozitára: SPEC 5.3, 5.4, 9 a 11.3 (poznámky „zmenené v B4“).

Pracovné súbory a dôkazy: `redesign/impl/B4/` – `skripty/` (kópie skriptov auditu pohybu s vlastným portom a nové
skripty), `pred/` (stav pred B4 = `4675cfb`, kópia `site-pred/`, port 8642), `vzor/` (`../lupa-vzor-cms`, port 8643),
`po/` (B4; `po/final/` = záverečné behy na zostave z commitu, `po/var/` = varianty merania), `video/final/` (videá
a hárky), `spom/` (hárky spomalených záberov), `vzhlad/` (celý `test_vzhlad`), `porovnanie/`, `final/` a `logy/` (logy).

### Čo pribudlo (SPEC 5.2–5.4)

Tokeny 5.1 a jediný blok `prefers-reduced-motion: reduce` sú z B3; každý nový prechod používa len tokeny alebo výpočet
z nich (napr. `calc(var(--dur-2) * .7)` = 140 ms). Animujú sa len `opacity`, `translate`, `scale`, `rotate` (výnimky
podľa 5.2: farby v `--dur-2`, `block-size` pri `::details-content`). Bez JS je všetko viditeľné (skryté stavy len pod
`html.rv-on`, `hx` a `kotva` pridávajú skripty).

- **Odhalenia (5.3, #13–15):** jeden IO (`threshold:0`, `rootMargin:'0px 0px -12% 0px'`, jednorazovo); `.rv` opacity
  a `--rise` s odstupom `--i × --stagger`, nadpis z masky, fotka opona zdola + usadenie `scale` 1,06 → 1, fotka sa
  odhalí až načítaná (najviac 800 ms). Prvky v okne pri štarte, po skoku a po filtri dostanú `.is-in` s `.no-tr` (2 rAF).
- **Otvorenie úvodu (#1–4):** LQIP je pozadím samotného `img` (fotka aj LQIP dosadnú spolu, bez skoku obrazu), `scale`
  1,06 → 1 (`--dur-7`), závoj .5 → 0, riadky H1 z masky (druhý +120 ms), ostatné opacity + 12 px s oneskorením
  200/280/480/560 ms; opakovaná návšteva (`hx-quick`) len prelnutie `--dur-3`.
- **Viazané na skrolovanie (#5, #9, #16)** len cez CSS v `@supports (animation-timeline: view())` a `no-preference`:
  odchod úvodu (`hxOut`, `hxDim`, `hxPush`), prúžok postupu (`.progress` je teraz zapnutý), parallax ±18 px na `.par`
  (medzihra a široké plochy eseje). JS obsluha skrolovania pre efekty nie je.
- **Lišta, menu, dok (#6, #8, #10, #34):** lišta `translate` `--dur-3`, linka aktívnej položky `scale`, burger sa mení na
  krížik cez `translate` + `rotate`; mobilné menu `@starting-style` + `allow-discrete`, odkazy s odstupom 30 ms;
  dok `translate` + opacity. `html{scrollbar-gutter:stable}` – pri otvorení menu (`overflow:hidden`) v prehliadači
  s klasickým posuvníkom stránka neposkočí do strany.
- **Skok (#11, #12) – `jump()`:** poslucháč kliku vo fáze zachytenia pre každé `a[href^="#"]` s cieľom. Blízky cieľ
  (≤ 1,5 okna) plynulo cez prehliadač, vzdialený cez View Transition: lenivé obrázky prvej obrazovky cieľa `eager`
  + `decode()` (najviac 250 ms), vo vnútri prechodu okamžitý posun (`behavior:'instant'`, prebije `html.sm`), zatvorenie
  mobilného menu a odhalenie cieľa; po `finished` `pushState('#id')` a fokus na nadpis (pri `#top` `#h-hero`). Lišta
  a dok stoja (vlastné `view-transition-name`), stará snímka lišty s otvoreným menu sa prelne preč. Obmedzený pohyb
  a prehliadač bez VT: okamžitý skok / `scrollIntoView` smooth.
- **`html.sm{scroll-behavior:smooth}`** pod `no-preference` (bod z B3 › 8) – `jump()` ho pri okamžitom posune obchádza
  (`behavior:'instant'`, záloha: dočasné odobratie triedy).
- **Lightbox (#20–25):** FLIP cez WAAPI (let z náhľadu, `::backdrop` a ovládanie sa prelnú, potom plná fotka po
  `decode()` prelnutím 200 ms), krok ±24 px (240 ms), krok do inej skupiny (stará `scale` 1,04 + opacity 320 ms, nová
  .965 → 1, 420 ms, +60 ms), ťah prstom 1 : 1 (prah 18 % alebo 0,5 px/ms, návrat 240 ms), zatvorenie letom späť do
  náhľadu, ak je v okne, inak opacity + `scale .98`; Esc cez `cancel`. Video Ladydefence v tom istom dialógu bez letu.
  Bez `el.animate` dialóg cez `@starting-style`.
- **Filter trénerov (#26):** View Transition s `c-{index}` na kartách, ktoré sú viditeľné pred alebo po; bez VT prelnutie
  200 ms; klik na už zvolený filter nič nerobí.
- **Rozvrh, otázky, tréner (#27–29):** riadky dňa `ttIn` s odstupom 40 ms (minútové obnovenie `tt-quiet` bez animácie);
  `::details-content` `block-size` pri `interpolate-size`, obsah vždy `fadeUp` `--dur-2`; ikony `rotate`.
- **Kde začať (#17), hover (#18, #19), video (#31), mapa (#32), bodka (#33):** podľa katalógu; bodka `ping` na `scale`
  a opacity pseudoprvku, len `.is-vis` (IO) a len pri otvorenej prevádzke.
- **Otvorenie s kotvou (doplnok, SPEC 5.4 „Zmenené v B4“):** skript v hlavičke pri `location.hash` pridá `html.kotva`
  (`main` a pätička `visibility:hidden`) a odoberie ju pri prvom `scroll` (skok prehliadača na cieľ), po načítaní DOM, ak
  cieľ nie je alebo je hore, inak najneskôr pri `load` alebo po 1,5 s; odhalenia štartujú až potom. Predtým sa na okamih ukázal úvod a stránka
  skočila; `/#rozvrh` na počítači mal CLS 0,0404 (2 z 3 behov aj v stave pred B4, B3 › známe obmedzenia).

### Odchýlky od SPEC a doplnky (zapísané aj v SPEC)

1. **Maska nadpisu `calc(105% + .4em)`, riadky H1 `calc(100% + .35em)`** namiesto 105 % / 110 % – pri pôvodných hodnotách
   vykúkali pod maskou mäkčene a dĺžne (Č, Ť, Í) na spomalených záberoch.
2. **Opona len na `.rv-img::after`**, nie na každom `.ph::after` – portréty a náhľady bez odhalenia nemajú pseudoprvok
   (menej vrstiev a uzlov transformácie).
3. **IO: prvok, ktorý sa objaví v hornej polovici okna** (rýchly posun, skok bez VT, posun nahor), sa ukáže hneď bez
   prechodu. Pôvodný poslucháč `scroll` na detekciu skoku som zrušil – čítanie polohy v ňom vynucovalo prepočet štýlu.
4. **Odchod úvodu:** jeden rozsah pre `.hero-in`, `.hero-colo`, `.hero-dim`, `.hero-cam` od `−--hero-top` po
   `−--hero-top + 100svh` (úvod vyšší ako okno na nízkom telefóne sa najprv doroluje, `heroFit`); text zmizne v 60 %
   rozsahu (`hxOut{60%,to{…}}`), čo zodpovedá 0–60svh zo SPEC. **`fill` `backwards`** pri odchode úvodu aj parallaxe
   (SPEC `both`): za rozsahom úvod celý prekrýva list Intro a parallax je mimo okna, animácia tak nedrží vrstvy
   kompozítora na celej stránke.
5. **`isolation:isolate` na `main>section` a `.foot`** – lepiaci úvod a animované prvky spôsobovali „prekryv“ a vlastnú
   vrstvu pre každú kartu pod nimi (49 → 34 vrstiev, PrePaint asi na polovicu).
6. **View Transition – lišta a dok (#11):** okrem `animation:none` na skupinách sa stará snímka lišty a doku prelne preč
   (140 ms, `mix-blend-mode:normal`). Pri skoku z mobilného menu by inak ostala celých 280 ms plne viditeľná a potom
   zmizla naraz. Menu zatvára `jump()` vo vnútri prechodu (`nav` ho nezavrie, ak bol klik spracovaný, `defaultPrevented`).
7. **Lišta po skoku a po otvorení s kotvou ostane viditeľná** (1,5 s, resp. 2,5 s), hoci posun išiel nadol – inak by
   sa po skoku hneď skryla a stránka by bola bez navigácie.
8. **Lightbox – let cez dočasný rám `.lb-fly`:** náhľad je orezaný (`object-fit:cover`, iný pomer ako fotka), rám preto
   mení `scale` X/Y a fotka v ňom opačnú mierku (24 vzoriek krivky `--ease-out`), takže výrez plynulo prejde do celej
   fotky bez deformácie. Pred letom `img.decode()` rámu aj vrstvy A (najviac 250 ms) a `decoding='sync'` – bez toho
   Chromium (checker-imaging) fotku počas letu nenakreslil a let bol neviditeľný.
9. **Popisok a počítadlo (#21, #22)** sa prelínajú spolu s novou fotkou (rovnaké trvanie a oneskorenie), nie „v tej istej
   snímke“ – inak by sa nový popisok ukázal nad starou fotkou (akceptácia B4).
10. **`data-full-t`, `data-wt`, `data-ht`** pri širokých plochách eseje (`makra.html`): pod 760 px je náhľad zo sady `t`
    (4 : 5) a lightbox ukáže tú istú sadu; predtým letel výrez `t` do fotky `w` 16 : 9 (deformácia, potom skok).
11. **Hover fotky** `calc(var(--dur-4) * 1.09375)` = 700 ms – pevných 700 ms by bežalo aj pri obmedzenom pohybe.
12. **Kontrola 11 v `test_vzhlad`** nepočíta animácie s časovou osou skrolovania (odchod úvodu, prúžok, parallax) – pri
    nečinnosti stoja; vypíše ich počet („viazané na skrolovanie: 7“).
13. **`scrollY` v lište** sa číta v udalosti `scroll` a triedy sa menia v rAF (čítanie v rAF po zmene tried vynucovalo
    prepočet štýlu v každej snímke).

### Plynulosť (SPEC 9, 11.4) – meranie a porovnanie so vzorom

`skripty/meraj.mjs` (audit pohybu), gesto 2 000 px/s, CPU 4×, 1440 × 900 a 390 × 844; snímky = intervaly rAF hlavného
vlákna. „Bez WebGL“ = prepínač `--bezwebgl` (`--disable-3d-apis`, softvérové kompozitovanie). Skript bez neho púšťa
Chromium s prepínačmi SwiftShader GL, ktoré v kontajneri emulujú GPU raster a robia stally až 1,2 s aj na stránke bez
efektov (aj v stave pred B4), preto sú uvedené zvlášť. Súbory: `pred/vykon/`, `vzor/vykon/`, `po/vykon/final/`,
`po/final/vykon/`.

| meranie (CPU 4×) | vzor | pred B4 (`4675cfb`) | **B4** |
|---|---|---|---|
| počítač, bez WebGL: fps / snímky > 50 ms / najdlhšia / dlhé úlohy | 20,4 / 24,8 % / 383 ms / 38 | 53,8 · 53,3 · 51,7 / 0,2–0,8 % / 83 ms / 0 | **40,3 · 38,9 / 3,5–5,0 % / 117 ms / 3** |
| telefón, bez WebGL | 27,5 / 12,2 % / 200 ms / 34 | 57,0 · 44,3 / 0,5–2,3 % / 1 083 ms / 1–2 | **50,0 · 47,4 / 1,2–1,4 % / 250 ms / 2–4** |
| počítač / telefón, prepínače SwiftShader | 5,0 / 12,2 fps | 35,4 / 57,5 fps | 18,7 / 43,5 fps |
| počítač / telefón, CPU 1×, bez WebGL | – | – | 56,8 (0,3 %) / 60,0 (0 %) |
| snímky kompozítora (Display::DrawAndSwap) za s, počítač / telefón | 42,3 / 55,8 | 54,8 / 53,5 | **56,9 / 59,5** |
| medián snímky hlavného vlákna, počítač / telefón | 34,8 / 35,6 ms | 3,9 / 3,4 ms | 15,1 / 9,2 ms |
| CLS počas skrolovania | 0 / 0,0002 | 0 | 0 |
| nečinnosť hlavného vlákna (`necinnost.mjs`: hore / Cenník / dole) | 85 / 93 / 96 % (telefón 93 / 96 / 94 %) | 0 / 0 / 0 % | **1 / 0 / 1 %** (oba) |
| vrstvy kompozítora (najviac, `vrstvy.mjs`) | 81–110 (audit) | – | **34** počítač (Detaily), **35** telefón (úvod) |
| CLS otvorenia s kotvou (9 kotiev × 2 šírky, `kotva_cls.mjs`) | `/#cennik` počítač 0,6972 | `/#rozvrh` počítač 0,0404 | **0 všade** |

Po sekciách (B4, počítač, beh 1): úvod 33,3 fps, Intro 28,9, Priestor 36,2, Tréningy 39,3, Tréneri 38,6, Rozvrh 43,0,
Cenník 40,5, Recenzie 47,1, Otázky 42,9, Kontakt 43,8, pätička 56,8. Telefón: 44,0 / 40,9 / 44,8 / 55,1 / 49,1 / 48,4 /
53,1 / 50,0 / 58,7 / 49,8 / 58,0.

**Výsledok: akceptácia B4 „≥ 55 fps a ≤ 1 % snímok > 50 ms v každej sekcii“ pre snímky hlavného vlákna nie je splnená**
(počítač ~39–40 fps, telefón ~47–50 fps). Oproti vzoru je B4 asi 2× plynulejší (počítač 20 → 40 fps, snímky nad 50 ms
25 % → 4 %, dlhé úlohy 38 → 3, nečinnosť 85–96 % → ≤ 1 %), oproti stavu pred B4 (bez pohybu) pomalší.

**Rozbor** (trace hlavného vlákna a kompozítora, `skripty/snimky_trace.mjs`, `trace_vlakna.mjs`, `paint_uzly.mjs`,
`vrstvy.mjs`, `styl_pocty.mjs`; varianty `po/var/` cez `meraj_var.mjs` s vloženým CSS, stav pred izoláciou, základ 38,4):

- Všetky animácie bežia na kompozítore (len opacity/translate/scale/rotate) – snímky kompozítora sú 57/s a 59,5/s,
  teda viac ako pred B4 aj vo vzore. Pomalé sú snímky hlavného vlákna: kým beží akákoľvek animácia alebo prechod
  (pri skrolovaní takmer stále – odhaľuje sa sekcia za sekciou), Blink v každej snímke prepočíta štýl a PrePaint
  (medián 15 ms pri CPU 4×, pred B4 3,9 ms). Pri CPU 1× je to 56,8 / 60 fps.
- Varianty: bez animácií viazaných na skrolovanie 37,8 fps (bez zlepšenia), bez odhalení 46,4, bez hoveru, pulzu
  a riadkov rozvrhu 36,7, odhalenia kratšie (320–800 ms) 39,6, bez odhalenia kariet 40,6, **bez akéhokoľvek pohybu 55,1**.
  Náklad je rozložený – žiadna jednotlivá časť ho nespôsobuje; zmizne až s celým pohybom.
- Zlepšenia v tomto kroku: čítanie `scrollY` mimo rAF (bod 13), opona len na `.rv-img` (bod 2), `isolation` (bod 5),
  `fill backwards` (bod 4), zrušený poslucháč `scroll` v odhaleniach (bod 3): počítač 35,9 → 40,3 fps.
- Dlhé úlohy počas skrolovania: 3 (50–57 ms) na počítači, 2–4 na telefóne (pred B4 0–2).

**Na rozhodnutie orchestrátora:** (a) prijať plynulosť podľa snímok kompozítora (pohyb je len kompozitný) a prah
hlavného vlákna ponechať pre CPU 1×; (b) menej súčasného pohybu – napr. odhalenia len nadpisov a fotiek, nie kariet
a riadkov (odhad podľa variantov ~46 fps, nie 55); (c) na `lite-root` (telefón) odhalenia vypnúť; (d) iný prah. Pri
voľbe (b) alebo (c) sa zmení vzhľad, preto som ich nerobil sám.

### Ostatné akceptačné body B4

- `test_vzhlad` (`vzhlad/`, log `logy/test_vzhlad.log`): kód 0, 93 kontrol OK – **10** (obmedzený pohyb: 0 animácií, všetko
  odhalené, video nehrá), **11** (nečinnosť: len `ping` viditeľných bodiek, viazaných na skrolovanie 7 sa nepočíta),
  **12** (CLS `/#cennik` 0,0000 pri 390 aj 1440); kontrast 8 pri 6 šírkach; výška stránky 22,89 (390) a 18,29 (1440)
  bez zmeny.
- `necinnost.mjs` ≤ 1 % (≤ 6 %), vrstvy ≤ 35 (≤ 40), `kotva_cls.mjs` 0 pri `top`, `priestor`, `treningy`, `treneri`,
  `rozvrh`, `cennik`, `prva-navsteva`, `faq`, `kontakt` × počítač a telefón (`po/final/kotva/`).
- **Skoky** (`skripty/akceptacia.mjs`, `po/final/akceptacia/`): zo všetkých 7 položiek menu (na telefóne cez burger)
  a 8 odkazov pätičky pri 1440 aj 390 px je nadpis sekcie po 400 ms pod lištou a celý v okne, 0 prázdnych rámov,
  0 neodhalených prvkov; po skončení prechodu adresa `#id` a fokus na nadpise. Pri súbežne bežiacich 3 prehliadačoch
  (preťažené CPU) začal skok na `#priestor` a `#treningy` neskôr ako za 400 ms (čakanie na `decode()` ≤ 250 ms + zachytenie
  snímky); samostatný beh 22/22 OK.
- **Lightbox, popisok:** po každej z 5 šípok (1/12 → 6/12, vrátane prechodu do skupiny Detaily) v čase 0 / 120 / 300 ms
  nie je nový popisok nikdy viditeľnejší ako nová fotka (na telefóne sa nový záber po 120 ms často ešte dekóduje –
  vtedy ostáva starý záber aj starý popisok).
- **Obmedzený pohyb** (`skripty/obmedzeny.mjs`, `po/final/obmedzeny/`, 1440 aj 390): po 150 ms bez `hx`, `rv-on`,
  H1 bez posunu, `scroll-behavior:auto`; pri prechode celou stránkou žiadna bežiaca animácia ani prechod (okrem farby
  a opacity ≤ 200 ms), 0 skrytých prvkov, opony zdvihnuté; skok z menu okamžitý s fokusom a `#cennik`, bez VT;
  lightbox sa otvorí a Esc zavrie hneď bez letu; otázka a filter bez pohybu; žiadne video nehrá samo; bez chýb JS.
- Unittest 86/86, `test_prehliadac` s oboma vzormi OK (nižšie).

### Videá a snímky (prezreté)

- `video/final/prechody-1440.webm`, `prechody-390.webm` (Playwright `recordVideo`, scenár `skripty/video.mjs`: otvorenie
  úvodu, skrolovanie gestom, skok z menu na Cenník, skok hore logom, lightbox – otvorenie, krok, krok do skupiny a späť,
  zatvorenie –, filter, rozvrh, otázka, skok z pätičky, otvorenie `/#cennik`), `kotva-1440-cennik.webm`, `kotva-390-cennik.webm`.
- `skripty/jas.py` (jas každej snímky): **žiadne záblesky** pri 1440; pri 390 len biela stránka `about:blank` pred prvou
  navigáciou (0,12 s, mimo webu). Rezy (prudké zmeny obrazu) sú len pri okamžitých posunoch scenára (`scrollTo` instant)
  a otvorení s kotvou.
- Hárky (`video/final/h-*.jpg`, `spom/h-*.jpg` – spomalené 10× cez CDP `Animation.setPlaybackRate`, `skripty/spomalene.mjs`):
  otvorenie úvodu (fotka a LQIP dosadnú spolu, riadky H1 bez vykúkania diakritiky), odhalenia (opona zdola, maska,
  odstup kariet), **skok z menu cez VT** (`h-1440-skok.jpg`, `h-390-menu-skok.jpg`: stará stránka sa za 2–3 snímky prelne
  do Cenníka, lišta stojí, menu sa prelne preč, žiadna prázdna snímka ani poskočenie), lightbox (`h-1440-lb-otvor.jpg`,
  `h-390-lb-otvor.jpg`, `spom/h-lb-*`: let z náhľadu bez deformácie, krok, krok do skupiny, zatvorenie letom späť),
  filter (`h-1440-filter*.jpg`: karty sa presunú, bez blikania), otvorenie s kotvou (`h-1440-kotva*.jpg`,
  `h-390-kotva*.jpg`: tmavá stránka s lištou a hneď Cenník – úvod sa neukáže, nič neskočí).
- `vzhlad/h-390.jpg`, `h-1440.jpg`, `h-768.jpg`, `h-1024.jpg` (sekcie) a `stavy-390.jpg`, `stavy-1440.jpg` (menu, lightbox,
  filter, sobota, otázka, tréner, zatvorené, sviatok): rozloženie bez zmeny oproti pred B4, logo plnofarebné na bielej
  kartičke, všetko odhalené.

### Overenie pred commitom (logy `impl/B4/final/`, `impl/B4/logy/`)

- `python3 nastroje/zostav.py` → kód 0, „Web je zostavený“.
- `python3 -m unittest discover -s nastroje -p 'test_*.py'` → **86/86 OK** (`test_css_pravidla`: `!important` 2×, jediný
  blok `reduce`, `infinite` len pri `ping`, gzip `style.css` 16,0 kB ≤ 22 kB, `app.js` 14 157 B ≤ 14 kB = 14 336 B).
- `node nastroje/test_prehliadac.mjs ../lupa-vzor` aj `../lupa-vzor-cms` → „Všetko v poriadku.“
- `BEZ_PIXELOV=1 node nastroje/porovnaj_so_vzorom.mjs ../lupa-vzor-cms _site …/B4/porovnanie` → kód 0, „Bez rozdielov okrem
  zámerných zmien“ (živé texty 14 kombinácií, filter 8×, dni 7×, Tréner 11×, otázky 6×, lightbox 12× pri 390 aj 1440).
- `node nastroje/test_vzhlad.mjs _site …/B4/vzhlad` → kód 0, 93 OK.
- `style.css` 838 riadkov, `index.html` 23,2 kB gzip (≤ 25), `obsah/` = `testdata/obsah/`, grep
  `btn-volt|btn-ghost|reveal\b|data-tilt` = 0.

### Otvorené (na rozhodnutie orchestrátora)

- **Plynulosť hlavného vlákna pri CPU 4× < 55 fps** (vyššie: prah, spôsob merania, prípadne menej odhalení).
- Ručné overenie na skutočnom iPhone (Safari 18 bez scroll-timeline a 26.x: VT skok, parallax, ťah v lightboxe,
  `@starting-style` menu) a strednom Androide (SPEC 11.5).
- Nezmenené z predchádzajúcich krokov: úvod na telefóne pri výške okna 781–880 px (fitko takmer zmizne, skok na hranici
  780/781 px – navrhnuté nevyberať variant pevným `max-height:780px`); tlačidlo hore od 1344 px (4.15); `volne-vahy-2`
  dvakrát; text medzihry o bicykli (13.5); číslovanie bodov 13.5 pre B6; telefón na šírku 844 × 390; 375 × 667 s oznamom.

---

## Opravy po kontrole B4 (15. 10. 2026)

Jeden lokálny commit **`809bc02`** na vetve `redizajn-2026-10` (bez push, `main` ostáva na 396f446). Mení `assets/app.js`,
`assets/style.css`, `sablona/index.html` (skript v hlavičke) a `nastroje/test_zostav.py`; obsah, médiá a `.pages.yml` sa
nemenili (`obsah/` = `testdata/obsah/`), nový viditeľný text nepribudol, logo v hlavičke ostáva plnofarebné na bielej
kartičke. Mimo repozitára: SPEC 4.5, 5.1, 5.3, 5.4, 9, 10, 11.4, 12 (B4). Pracovné súbory a dôkazy:
`redesign/impl/oprava-B4/` (skripty kontroly `skripty/` – `cielene.mjs`, `lb_fokus.mjs`, `obmedzeny.mjs`, `meraj.mjs`,
`kompozitor.py`, `akceptacia.mjs` – a nové `rychly_diag.mjs`, `io_diag.mjs`; výstupy `cielene/`, `diag/`, `lightbox/`,
`obmedzeny/`, `akceptacia/`, `vykon/`, `vzhlad/`, `porovnanie/`; logy `*.log`). Každý nález som najprv overil.

### 1. Plynulosť hlavného vlákna pri CPU 4× pod akceptáciou B4 (stredná) – rozhodnutie (a): prah podľa snímok kompozítora

**Overenie:** nález platí a zhoduje sa s meraním B4 (časť B4 › Plynulosť): hlavné vlákno pri CPU 4× bez WebGL dáva na
počítači 39–42 fps a 2,8–5 % snímok > 50 ms, na telefóne 47–50 fps a 1,2–1,4 %; pri CPU 1× 55,8 / 60 fps (0,4 / 0 %).
Stav pred B4 (`4675cfb`, bez pohybu) má v tomto kontajneri na počítači 50,8–54,4 fps – prah 55 hlavného vlákna pri CPU 4×
nedosiahne ani stránka bez jediného prechodu; vzor má 12,5–18,8 fps a 25–48 % snímok > 50 ms. Pohyb B4 je len
kompozitný (opacity, translate, scale, rotate), to, čo návštevník vidí, sú snímky kompozítora: v trace 55,0 / 58,2 za s
(kontrola, s réžiou tracingu) a 56,9 / 59,5 (B4), ≤ 0,6 % intervalov > 50 ms; trhanie sa v screencastoch ani videách
neprejavilo. Hlavné vlákno pri CPU 4× meria réžiu prepočtu štýlu a PrePaint počas bežiacich prechodov (rozbor v B4:
náklad je rozložený, zmizne až s celým pohybom – bez pohybu 55,1 fps).

**Rozhodnutie** (podľa odporúčania kontroly, bez zmeny vzhľadu): prah pre CPU 4× je definovaný na snímkach kompozítora
(`DrawFrame` z trace cez `meraj.mjs --trace` + `kompozitor.py`: ≥ 55 za s, ≤ 1 % intervalov > 50 ms), prah hlavného vlákna
≥ 55 fps a ≤ 1 % snímok > 50 ms (`meraj.mjs`) platí pri CPU 1×; hlavné vlákno pri CPU 4× sa sleduje informatívne.
Zapísané do SPEC 9 (riadok tabuľky a poznámka so zdôvodnením a meraniami), 11.4 a 12 (B4). Voľby (b) odhalenia len
nadpisov a fotiek (odhad ~46 fps, stále pod 55) a (c) odhalenia na `lite-root` vypnúť menia vzhľad, preto som ich
nerobil; ak orchestrátor rozhodne inak, je to zmena v `odhal()` a v šablóne (triedy `.rv`).

**Meranie po opravách** (`vykon/`, zostava z commitu, server 8741, bez WebGL, gesto 2 000 px/s, `beh.sh`): CPU 4× s trace –
snímky kompozítora `DrawFrame` **55,8 za s na počítači (0,6 % intervalov > 50 ms, max 60 ms) a 58,0 za s na telefóne
(0,4 %, max 306 ms – jediná snímka)**, `Scheduler::BeginImplFrame` 56,3 / 59,8 za s; CPU 1× hlavné vlákno **56,0 fps
(0,1 % > 50 ms, 0 dlhých úloh) a 59,8 fps (0 %)** – nový prah je splnený na počítači aj telefóne. Hlavné vlákno pri CPU 4×
(informatívne): bez trace 38,0 fps (6,5 %) / 47,9 fps (1,5 %), s trace 35,4 / 43,8 – rovnako ako v B4 (38,9–40,3 /
47,4–50,0) a v kontrole (39,8–42,4 / 48,9–49,3); opravy výkon nemenia. Po sekciách pri CPU 1× je nad 1 % len Intro na
počítači (3,3 %, 1 snímka z ~30; v kontrole 5,9 %) – krátke sekcie majú málo snímok a Intro nesie dobeh otvorenia úvodu
a dekódovanie fotiek eseje; prah hlavného vlákna pri CPU 1× som preto zapísal pre celú stránku a hodnoty po sekciách ako
informatívne (ak má platiť „v každej sekcii“, rozhodne orchestrátor). Trace (74 a 91 MB) som po výpočte zmazal.

### 2. Po rýchlom posune sa fotky odhalili ako prázdne sivé rámy (stredná) – opravené

**Overenie:** nález platí. `odhal()` v IO odhalil prvok, ktorý sa objavil v hornej polovici okna, hneď (`ukaz(el, true)`)
bez kontroly načítania; to isté `odhalHned()` (po skoku cez VT a po filtri) a `start()` (prvky v okne pri štarte, napr.
otvorenie s kotvou). Na sieti 1,5 Mb/s (`cielene.mjs`, okamžitý posun na `#bar`) mali obe fotky baru `.is-in` s prázdnym
`currentSrc` hneď a nenačítané ešte po 1,5 s – dva sivé rámy (`--bg-2`), do ktorých fotka potom skočila.

**Oprava (`app.js`, `odhal()`):** nová `cakaj(el)`: ak `.rv-img` má `img`, ktorý nie je `complete`, prvok sa neodhalí,
odoberie sa z IO a čaká na `load`/`error`; potom dostane `.is-in` bez `.no-tr`, takže opona odíde animovane. Volá sa
zo všetkých ciest – `ukaz()` (bežné odhalenie aj skratka „hlboko v okne“), `odhalHned()` (skok, filter) aj `start()`
(prvky v okne pri štarte). Dve odchýlky od pôvodného textu SPEC 5.3, zapísané v SPEC:

- podmienka je `img.complete` namiesto `complete && naturalWidth`: hotový obrázok, aj chybný (`complete` bez
  `naturalWidth`, `error` už prebehol), sa odhalí hneď – inak by naň čakanie nikdy neskončilo;
- poistka je **8 s namiesto 800 ms**: fotky baru (`-1080.avif`) sa na 1,5 Mb/s načítajú až po ~2,5 s, s 800 ms by sa
  po 0,8 s odhalil prázdny rám a fotka by doň skočila – presne nález. Poistka tak slúži len požiadavke, ktorá sa nikdy
  neskončí (udalosti `load`/`error` prídu vždy inak).

Pri skoku cez View Transition sa fotky prvej obrazovky cieľa dekódujú vopred (≤ 250 ms), takže sú `complete` a dostanú
`.is-in` s `.no-tr` vo vnútri prechodu ako doteraz. `app.js` je 14 332 B gzip (limit 14 336 B) – komentáre som skrátil,
rezerva je už len 4 B (pre B5 bude treba šetriť).

**Overené** (`cielene.mjs` 1440 aj 390, sieť 1,5 Mb/s, okamžitý posun na `#bar`, `#detaily`, `#treneri`, `.foot`):
0 prvkov `.rv-img.is-in` s nenačítaným obrázkom hneď aj po 1,5 s (predtým 2 pri `#bar`). `rychly_diag.mjs` (posun na `#bar`,
`MutationObserver` na `.is-in`): na pomalej sieti dostanú fotky baru `.is-in` po načítaní (1440: 2 537 / 2 596 ms; 390:
1 299 / 1 795 / 1 924 ms), bez `.no-tr` (opona odíde animovane), dovtedy opona `scale 1 1`; na rýchlej sieti 46–104 ms.
Snímky `cielene/cielene-1440/rychly-bar.png` (120 ms: pod nadpisom Bar nič, žiadne sivé rámy) a `diag/rychly-1440-pomala-8s.png`
(fotky odhalené) prezreté. Zoznam „skrytých v okne“ v skripte kontroly ostáva neprázdny (16–18 pri `#bar`), ale ide o
dlaždice pásu Detaily, ktoré pás oreže (rám pásu končí 6 px nad oknom, dlaždice vyčnievajú 8 px pod ním – `io_diag.mjs`:
`isIntersecting: false`), o prvky mimo šírky okna a o prvky v dolných 12 % (rootMargin); skript ich počíta len podľa
zvislej polohy. `akceptacia.mjs` (skoky zo 7 položiek menu a 8 odkazov pätičky, lightbox 0/120/300 ms): **22/22 OK**
pri 1440 aj 390 – nadpis pod lištou po 400 ms, 0 prázdnych rámov, 0 neodhalených prvkov.

### 3. Otvorenie adresy s `#top` alebo `#main` (nízka) – opravené

**Overenie:** nález platí – skript v hlavičke pri každom `location.hash` pridal `kotva` a skončil pred `in-hero` aj pred
`hx`/`hx-quick`; `header()` čakal na prvý posun. `#top` sa do adresy zapisuje po skoku na logo, obnovenie stránky ho vráti.

**Oprava:** skript v hlavičke (`index.html`) berie `#top` a `#main` (`main#main` leží hore) ako otvorenie bez kotvy –
nepridá `kotva`, pridá `in-hero` a rozhodne `hx`/`hx-quick`; `header()` čaká na posun len pri kotve, ktorá existuje a leží
pod horným okrajom (`getBoundingClientRect().top >= 1` pri `scrollY 0`), inak nastaví `in-hero` v prvej snímke. `#top`
v adrese po skoku na logo som nechal (SPEC 5.4 #11 bod 4; akceptačný skript kontroluje `#id` po každom skoku).
**Overené** (`cielene.mjs`, `/?gk-at=…#top` a `#main`, 1440 aj 390): `html` má `in-hero hx hx-lit hx-go hx-done`,
`.bar::before` opacity 0, úvod otvorený; snímky `cielene-*/otvorenie-top.png`, `otvorenie-main.png` prezreté (úvod ako pri
bežnom otvorení, lišta priehľadná).

### 4. Po otvorení lightboxu mal fokus skrytý `video.lb-video` (nízka) – opravené

**Overenie:** nález platí (Chromium pri `showModal()` zameral `video[controls][hidden]`, `display:none`). **Oprava
(`app.js`, `otvor()`):** po `showModal()` dostane pri fotke (`vid.hidden`) fokus `.lb-close` (`focus({preventScroll:true})`);
pri videu Ladydefence ostáva natívny fokus na viditeľnom videu s ovládaním. Esc vracia fokus na `.ph-btn` ako doteraz.
**Overené** (`lb_fokus.mjs`, Enter na `.ph-btn`, 1440 aj 390): `activeElement` hneď aj po 1,5 s = `BUTTON.lb-close`
(viditeľný, `display:grid`, v dialógu), Tab ďalej `lb-prev` → `lb-next`, po Esc `BUTTON.ph-btn`. SPEC 10 a 5.4 doplnené.

### 5. Pulz bodky pri obmedzenom pohybe vypnutý len tokenom (nízka) – opravené

**Overenie:** nález platí – `.dot::after{animation:none}` (0,1,1) v bloku `reduce` prebíjalo neskoršie
`.is-open .dot.is-vis::after{animation:ping … infinite}` (0,3,1); vypočítaný štýl `ping/0s/infinite`. Prvý pokus
s rovnakým selektorom v bloku `reduce` nestačil (rovnaká špecificita, blok je v súbore skôr – vyhralo pravidlo s `infinite`),
preto má náprotivok `:root .is-open .dot.is-vis::after` (0,4,1). **Test** `test_css_pravidla` nájde každý selektor
s `infinite` a žiada v bloku `reduce` pravidlo `animation:none` so selektorom vyššej špecificity (alebo rovnakej a neskôr
v súbore); negatívna skúška so starým blokom spadne. SPEC 5.1 doplnené.
**Overené** (`obmedzeny.mjs`, 1440 aj 390): vypočítaný štýl `.dot::after` všetkých bodiek `none/0s/1` (predtým `ping/0s/infinite`),
po prejdení stránky 0 animácií, 0 skrytých prvkov, 0 opôn; `test_vzhlad` kontrola 10 (reduce: 0 animácií) a 11 (nečinnosť: len `ping`
viditeľných bodiek pri otvorenej prevádzke) OK pri 390 aj 1440.

### 6. Lightbox na telefóne ukáže pri širokých záberoch eseje výrez 4 : 5 (nízka) – ponechané, zapísané ako zámer

**Overenie:** platí (sada `t` pod 760 px, `data-full-t`; na počítači `w-1920`). **Rozhodnutie:** ponechať – let z náhľadu
do fotky je bez zmeny pomeru a bez deformácie a lightbox ukazuje vo väčšom to, na čo návštevník ťukol (rovnako ako
dlaždice Detailov a Baru, kde je plná fotka tej istej sady ako náhľad). Zapísané do SPEC 4.5 ako zámer; alternatíva
(let do výrezu `t` a po dosadnutí prelnutie na `w` cez `swap('fade')`) mení pomer fotky prelnutím, je to zmena vzhľadu
a ostáva otvoreným rozhodnutím orchestrátora. Bez zmeny kódu.

### Overenie pred commitom (logy `impl/oprava-B4/`)

- `python3 nastroje/zostav.py` → kód 0, „Web je zostavený“.
- `python3 -m unittest discover -s nastroje -p 'test_*.py'` → **86/86 OK** (`test_css_pravidla` s kontrolou náprotivkov v bloku
  `reduce`; negatívna skúška so starým blokom spadne; `app.js` 14 332 B gzip ≤ 14 336 B, `style.css` 16,1 kB ≤ 22 kB, 838 riadkov).
- `node nastroje/test_prehliadac.mjs ../lupa-vzor` aj `../lupa-vzor-cms` → „Všetko v poriadku.“ (na zostave z commitu).
- `BEZ_PIXELOV=1 node nastroje/porovnaj_so_vzorom.mjs ../lupa-vzor-cms _site …/oprava-B4/porovnanie` → kód 0, „Bez rozdielov
  okrem zámerných zmien“ (živé texty, filter 8×, dni 7×, Tréner, otázky, lightbox pri 390 aj 1440).
- `node nastroje/test_vzhlad.mjs _site …/oprava-B4/vzhlad` → kód 0, **93 kontrol OK** (výška 390: 22,89 a 1440: 18,29 bez zmeny,
  kontrast 8 pri 6 šírkach, 10, 11, 12 – CLS `/#cennik` 0,0000); po úprave bloku `reduce` znova `KONTROLY=10,11,12` (`vzhlad2.log`) OK.
- Cielené skripty kontroly na zostave z commitu: `cielene.mjs` (1440, 390), `lb_fokus.mjs`, `obmedzeny.mjs`, `akceptacia.mjs`
  22/22, `rychly_diag.mjs`, `lb_fv.mjs` – výsledky pri nálezoch; plynulosť `vykon/` (bod 1).
- Snímky prezreté (Read): `vzhlad/snimky/` úvod, esej, Detaily, Bar pri 390 a 1440; stavy lightbox (1. záber, Detaily) a menu pri
  390 a 1440 – rozloženie bez zmeny oproti B4, logo plnofarebné na bielej kartičke, v lightboxe na telefóne výrez 4 : 5 (bod 6).
  Tlačidlo × má na snímke lightboxu pri 1440 obrys fokusu, lebo skript pred snímkou stlačil šípky (`lb_fv.mjs`: po kliku myšou
  alebo ťuknutí je `:focus-visible` false, po klávesnici true – správne). Ďalej `cielene-*/otvorenie-top.png`,
  `otvorenie-main.png`, `rychly-bar.png` a `diag/rychly-*-pomala-8s.png`.
- `obsah/` = `testdata/obsah/`; grep `btn-volt|btn-ghost|reveal\b|data-tilt` v `sablona`, `assets` = 0; bez push, `main` nezmenený.

### Otvorené (na rozhodnutie orchestrátora)

- Prah plynulosti: prijaté rozhodnutie (a) – prah pri CPU 4× na snímkach kompozítora, hlavné vlákno pri CPU 1×; ak má
  platiť pôvodný prah hlavného vlákna pri CPU 4×, treba (b) alebo (c) so zmenou vzhľadu.
- Lightbox na telefóne pri širokých záberoch eseje: ponechaná sada `t` (zámer v SPEC 4.5); alternatíva s prelnutím na `w`.
- Rozpočet `app.js` 14 kB gzip je vyčerpaný (rezerva 4 B).
- Nezmenené z B4: ručné overenie na skutočnom iPhone a Androide (SPEC 11.5); úvod na telefóne pri výške okna 781–880 px;
  tlačidlo hore od 1344 px; `volne-vahy-2` dvakrát; text medzihry o bicykli (13.5).
