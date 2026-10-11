---
name: video-a-sekvencie
description: Plynulé video na webe pri skrolovaní a slučky bez švu pre displeje 60 až 240 Hz. Video rozložené na snímky po 0,1 s (ffmpeg, Pillow, AVIF/WebP), sťahovanie od hrubých k jemným, LRU textúr vo WebGL (three.js), prelínanie dvoch snímok a ostrý obraz v pokoji; slučky cez vidstab, lanczos, CAS, minterpolate na 60 fps a šev bez skoku; kódovanie H.264/VP9. Použi, keď video pri skrole seká alebo stojí (scroll-driven video, scrubbing, image sequence), pri seamless loop, autoplay na iPhone v úspornom režime alebo pri teste plynulosti.
---

# Plynulé video pri skrolovaní a slučky bez švu

Video, ktoré má ísť so skrolom, sa nepretáča. Rozloží sa na fotky po 0,1 s a prehrávač pri každej snímke
displeja vyberie dve susedné fotky podľa presnej polohy a prelína ich. Video, ktoré beží samo, je tichá slučka
60 snímok/s so švom, ktorý nevidno. Postup vznikol na webe BARBERSHOP 30 (`barbershop-30/`), október 2026, po
sťažnosti majiteľa, že videá pôsobia zaseknuto.

## Kedy použiť

- Video pri skrolovaní na telefóne trhá, skáče alebo pri zastavení stojí.
- Treba pohyb kamery priestorom riadený skrolom (scrollytelling, „prejdi sa podnikom“).
- Treba krátku slučku (ľudia pri práci, detail) bez viditeľného skoku na konci.
- Ladíš autoplay na iPhone (úsporný režim), veľkosť videí alebo test plynulosti bez grafickej karty.

Nepoužívaj na dlhé videá so zvukom (tam patrí bežný prehrávač s ovládaním). Film zo statických fotiek s hĺbkou,
strihy a bránu WebGL rieši skill `film-z-fotiek`, všeobecný výkon a Lighthouse `rychly-web`.

## Najprv vyber režim

| situácia | režim | v tomto repozitári |
| --- | --- | --- |
| pohyb kamery, ktorý vedie skrol | sekvencia snímok (`data-video-mode="seq"`) | Poď ďalej, Povedz, ako to chceš |
| dej, ktorý beží sám | slučka v čase (`play`), 60 snímok/s, šev prelínaním | video tímu vo filme |
| okienko s videom vedľa textu | `<video muted playsinline loop preload="none">` + IntersectionObserver | pás tímu (`app.js`) |
| pretáčanie `currentTime` skrolom | nepoužívať (`scroll`) | zrušené 2026-10-11 |

## Prečo pretáčanie videa skrolom seká

- Každý posun je hľadanie v súbore, ktoré dekóduje od najbližšej kľúčovej snímky. Ďalší posun má zmysel poslať až
  po dokončení predošlého (`!v.seeking`), takže obraz skáče po celých snímkach videa a zaostáva za skrolom.
- Ladenie súboru to nevyrieši: prvá verzia mala 15 snímok/s a každú snímku kľúčovú (`-g 1`), druhá (kvôli ostrosti,
  CHECKS 11) kľúčovú každú 4. Režim scroll ostal na telefóne „pri posune trhané a pri zastavení stojí“ (komentár
  v `film.js`, commit c96b95a).
- Safari podľa komentára v `film.js` dodáva snímky pri posune až po tom, čo sa video raz pustí v geste (ťuknutie).
- Sekvencia obrázkov nečaká na dekodér videa: snímky sú dopredu rozbalené v grafike a zmes dvoch textúr stojí
  jeden riadok shadera, takže pohyb ide pri každej snímke displeja (60 až 240 Hz).

## Postup A: sekvencia snímok po 0,1 s

### 1. Priprav zdroj

Stabilizuj (vid.stab, dva prechody), medzivýsledky takmer bez straty. Zo `barbershop-30/source/tools/sekvencie.sh`:

```bash
ffmpeg -v error -y -i "$T/cut.mp4" -vf vidstabdetect=shakiness=5:accuracy=15:result="$T/t.trf" -f null -
ffmpeg -v error -y -i "$T/cut.mp4" -vf "vidstabtransform=input=$T/t.trf:smoothing=15:optzoom=1:zoomspeed=0.2:interpol=bicubic" -c:v libx264 -crf 6 -preset veryfast "$T/stab.mp4"
```

Netónuj farby. Video, ktoré je stabilné samo, nestabilizuj (video-2 malo chvenie 0,033 % šírky).

### 2. Rozlož na snímky, zväčši a zakóduj

```bash
UP="scale=720:1280:flags=lanczos+accurate_rnd+full_chroma_int,cas=strength=0.5"
local n; n=$(python3 -c "print(round(($3-$2)*10)+1)")
ffmpeg -v error -y -ss "$2" -i "$T/stab.mp4" -an -vf "select='not(mod(n\,3))',$UP,format=rgb24" -fps_mode vfr -frames:v "$n" "$T/$1/f%03d.png"
```

```python
im.save(a, quality=56, speed=6); im.save(w, quality=80, method=5)   # AVIF hlavný, WebP záloha (Pillow)
```

- Krok 0,1 s = každá 3. snímka pri 30 snímkach/s (pri 60 každá 6.). `n` zahŕňa oba konce úseku.
- `-fps_mode vfr` je nutné: bez neho ffmpeg 6.1 doplní duplikáty (2 s úsek: 59 PNG namiesto 20).
- Zväčšuj lanczos + CAS v príprave, prehliadač zväčšuje bilineárne. Doostruj až po zväčšení.
- Výsledok 720 × 1280: 51 snímok = 1990 kB AVIF (asi 39 kB na snímku), WebP o štvrtinu väčšie.

Podrobne s tabuľkou parametrov: [references/ffmpeg-prikazy.md](references/ffmpeg-prikazy.md).

### 3. Vlož do stránky

Kotva nesie priečinok, počet snímok, rozmer, bod záujmu a plagát (`barbershop-30/index.html`, riadok 216):

```html
data-video="assets/seq/vstup-dnu" data-video-mode="seq" data-video-n="51" data-video-size="720x1280" data-video-f="0.56,0.5" data-video-poster="assets/seq/vstup-dnu/f025"
```

Plagát je stredná snímka, lebo keď film stojí na kotve záberu (pri titulnej karte stred jej pripnutia), je poloha
v zábere 0,5 (pri párnom počte snímok dosadne na jednu z dvoch stredných). Tú istú snímku daj aj do statickej
zálohy `<picture>` pre telefón (`<source media="(max-width: 720px)">`), nič potom neposkočí. V repozitári to tak má
`#vstup-dnu`; `#remeslo` má v zálohe pre telefón zatiaľ fotku `stol-m`.

### 4. Prehrávač: sedem pravidiel

Implementácia: `barbershop-30/assets/film.js`, funkcie `seqStart`, `seqFetch`, `seqTex`, `seqDrive`, `seqStop`.

1. **Sťahuj až po pohybe návštevníka a len blízko scény.** Meranie stránky bez pohybu (Lighthouse) nič nestiahne.
2. **Od hrubých k jemným**, 4 naraz, `priority: 'low'`; posledná snímka hneď za prvou, aby fungoval celý rozsah:
   ```js
   for (const st of [8, 4, 2, 1]) for (let i = 0; i < n; i += st) if (!seen.has(i)) { seen.add(i); order.push(i); }
   if (!seen.has(n - 1)) order.splice(1, 0, n - 1);
   ```
   Súbory drž ako `Blob` (asi 40 kB na snímku), návrat k scéne už nesťahuje. AVIF zlyhá → prepni na `.webp`.
3. **Rozbaľuj mimo hlavného vlákna** (`createImageBitmap(blob)`) a len okolo polohy; v smere pohybu vopred
   `[hi + dir, lo - dir, hi + 2 * dir]`, keď sa nečaká na viac ako 2 iné.
4. **Najviac 2 nahratia do grafiky za snímku displeja, najbližšie k polohe prvé, zastarané zahoď:**
   ```js
   for (let k = q.up.length - 1; k >= 0; k--) if (Math.abs(q.up[k][0] - ft) > 4) { q.up[k][1].close(); q.up.splice(k, 1); }
   q.up.sort((a, b) => Math.abs(a[0] - ft) - Math.abs(b[0] - ft));
   ```
   Po `renderer.initTexture(t)` hneď `bitmap.close()`.
5. **LRU 6 textúr**: `Map` (zmazať a vložiť = posun na koniec), uvoľňuj od začiatku, nikdy nie práve kreslenú.
6. **Nikdy nečakaj na presnú snímku.** Chýba v sieti → najbližšia stiahnutá; chýba v grafike → najbližšia nahratá
   na oboch stranách polohy. Obraz nesmie stáť.
7. **Prelínaj len v strednej tretine, v pokoji dosadni na celú snímku:**
   ```js
   const goal = still > 0.25 ? Math.round(raw) : smooth(0.33, 0.67, raw);
   if (a !== q.lo || z !== q.hi) q.m = goal;              // nová dvojica snímok: bez dobiehania
   else q.m += (goal - q.m) * (1 - Math.pow(0.0005, dt));
   ```
   Shader len zmieša dve textúry: `mix(texture2D(uMap, vUv).rgb, texture2D(uMap2, vUv).rgb, uMix)`.

Poloha sa berie z kamery, ktorá ide za skrolom cez tlmenú pružinu (nie priamo zo `scrollY`), takže sekvencia
ide plynulo aj pri zárezoch kolieska. Kým sa niečo sťahuje, rozbaľuje alebo nahráva, slučka kreslenia beží aj bez
skrolu. Rozbor kódu riadok po riadku: [references/prehravac.md](references/prehravac.md).

## Postup B: slučka bez švu, 60 snímok/s

Zo `barbershop-30/source/tools/videa.sh`, funkcia `seamless` (zdroj, od, do, šev X, výstup):

1. **Šev prelínaním:** koniec úseku sa prelinie do jeho začiatku (`xfade`, `offset = L − 2X`). Perióda T = L − X.
2. **60 snímok/s aj cez šev:** slučka trikrát za sebou, medzisnímky z pohybu, vystrihne sa prostredná perióda:
   ```bash
   ffmpeg -v error -y -stream_loop 2 -i tmp/loop30.mp4 -an -vf "$MI,trim=start=$T:end=$(python3 -c "print(2*$T)"),setpts=PTS-STARTPTS,$UP,$GRADE" $H264_PLAY "$5.mp4"
   ```
   `MI="minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"`, pred zväčšením (presnejší odhad).
   Interpolácia jedného súboru by šev nevidela; prostredná kópia má susedov na oboch stranách.
3. **Zväčšenie** `scale=864:1536:flags=lanczos…,cas=strength=0.5`, na konci vždy `format=yuv420p`.
4. **Plagát z času 0** (slučka začína od 0), AVIF, WebP aj JPEG.
5. **Over šev:** rozdiel posledná → prvá snímka má byť ako bežný krok. Tím: 1,57 pri priemere susedných 1,68.

Prehrávanie (`film.js`, `attachUrl`, `drive`): `muted`, `playsinline`, `loop`, prvok vložený do stránky (Safari
mimo dokumentu snímky dodávať nemusí), súbor stiahnutý celý ako blob, nová snímka cez `requestVideoFrameCallback`.
Hrá len záber na obrazovke a nie po 3 minútach bez pohybu. Prvé ťuknutie (`touchend`, `click`) skúsi `play()`
znova a odomkne aj videá mimo obrazovky (pustí a hneď zastaví). Keď video nejde, ostáva plagát s nájazdom kamery.

## Kódovanie a veľkosti

| výstup | parametre | výsledok v repozitári |
| --- | --- | --- |
| sekvencia | 720 × 1280, AVIF `quality=56, speed=6`, WebP `quality=80, method=5` | 51 snímok: 1990 / 2481 kB; 44 snímok: 1568 / 1936 kB |
| slučka H.264 | `-profile:v high -level 4.2 -pix_fmt yuv420p -crf 21 -g 120 -movflags +faststart -an` | 864 × 1536, 60 snímok/s, 7,4 s, 3,4 MB |
| slučka VP9 | `-crf 32 -b:v 0 -g 240 -row-mt 1 -deadline good -cpu-used 2 -an` | 2,9 MB |
| plagát | AVIF `libaom-av1 -still-picture 1 -crf 26`, WebP `-quality 84`, JPEG `-q:v 3` | 28 / 54 / 99 kB |

Prehliadač dostane MP4, keď `canPlayType('video/mp4; codecs="avc1.640028"')` vráti `probably` (alebo aspoň `maybe`
a WebM VP9 nejde), inak WebM; keď nejde ani jedno, ostáva plagát (`vType` v `film.js`).

## Meranie a realita fps

- Bez grafickej karty (kontajner, SwiftShader, asi 7 snímok/s) sa plynulosť zmerať nedá. Testuj logiku:
  `window.BS30_FILM.state.seq` dáva `got/n`, `lo`, `hi`, `mix`, `tex`. Počas skrolu sa dvojica mení so skrolom,
  v pokoji je `mix` 0 alebo 1, v grafike najviac 6 snímok a na kotve stredná snímka (plagát).
  Hotový test: [scripts/seq-stav.mjs](scripts/seq-stav.mjs).
- Softvérové kreslenie má výpadky aj 2 s; nečakaj pevný čas, čakaj na `state.S === state.T` a dve rovnaké čítania.
- Safari na iPhone kreslí stránky najviac 60 snímok/s (CHECKS 12); 90 až 240 Hz má Chrome na Androide a rýchle
  monitory. Film nemá strop: interval displeja berie z najrýchlejšej snímky (najmenej 1/250 s) a pri zaostávaní
  zníži rozlíšenie o 0,25, nie snímkovú frekvenciu.
- Na skutočnom telefóne zatiaľ nemerané. Tvrdenia auditov over vlastným meraním: pri audite výkonu stránky
  (CHECKS 13) audit uvádzal prepočet štýlu 48,7 → 7,4 ms, vlastné meranie dalo 5,1 → 4,8 ms (hlavné vlákno
  10,9 → 9,6 ms na snímku).

Všetky čísla a vývoj riešenia krok po kroku: [references/merania.md](references/merania.md).

## Pasce a lekcie

1. **Pretáčanie skrolom** neopravíš kľúčovými snímkami ani nižšími fps. Rozlož na obrázky.
2. **Trvalé prelínanie dvoch snímok** pri rýchlom pohybe kamery zdvojuje hrany. Zmes len v strednej tretine.
3. **Bez dosadnutia v pokoji** ostane duch dvoch snímok. Po 0,25 s pokoja zaokrúhli na celú snímku.
4. **Pri novej dvojici snímok** nastav zmes hneď, bez dobiehania; stará hodnota patrí inej dvojici.
5. **Veľa nahratí naraz** zasekne snímku. Najviac 2 za snímku displeja, najbližšie prvé.
6. **Rýchly skrol** nechá rozbalené snímky, ktoré už nikto neukáže. Zahoď ich (`|i − ft| > 4`) a zavri (`close()`).
7. **Čakanie na presnú snímku** zastaví obraz. Vždy kresli najbližšie, čo máš.
8. **`select` bez `-fps_mode vfr`** dá duplikáty a zlý krok.
9. **Interpolácia samotnej slučky** nechá šev bez medzisnímky. Strojnásob a vystrihni stred.
10. **Bez `format=yuv420p` na konci** vznikne VP9 profil 1 alebo H.264 4:4:4 (komentár v `videa.sh`).
11. **Plagát z iného času** ako prvý zobrazený obraz poskočí. Slučka: snímka 0; sekvencia: stredná snímka.
    Pri párnom počte snímok je stred medzi dvomi: `#remeslo` (44) na kotve dosadol na `f021`, plagát je `f022`.
12. **Žiadosti s rozsahom bajtov** prehliadač často nevezme z cache. Video stiahni celé ako blob.
13. **iPhone v úspornom režime** nespustí video sám. Skús `play()` znova v geste; sekvencia to nepotrebuje.
14. **Presah videa za okraj** malý zdroj ďalej zväčšuje. Video má presah 1,12, fotky 1,24 (`OVER_V`, `OVER`).
15. **Test s krátkym čakaním** v softvérovom kreslení hlási falošné chyby. Čakaj na stav, nie na čas.
16. **Komentáre a dokumenty starnú**: `film.js` uvádza pre scroll „-g 1“, skript mal naposledy `-g 4`; blob „1 až 2 MB“,
    slučka má 3,4 MB. Platí kód a merania.

## V tomto repozitári

| čo | kde |
| --- | --- |
| príprava sekvencií | `barbershop-30/source/tools/sekvencie.sh` (výstup `assets/seq/<meno>/f000.avif` a `.webp`, pracovné `./tmp-seq`) |
| príprava slučky a plagátov | `barbershop-30/source/tools/videa.sh` (`stab`, `poster`, `seamless`; `OUT=assets/video`) |
| zdrojové videá | `barbershop-30/source/video/video-1..3.mp4` (576 × 1024, 30 snímok/s) |
| hotové sekvencie | `barbershop-30/assets/seq/vstup-dnu` (51), `assets/seq/okolo-kresla` (44) |
| hotová slučka | `barbershop-30/assets/video/tim-slucka-864.{mp4,webm}` + `tim-slucka-poster-864.{avif,webp,jpg}` |
| prehrávač vo filme | `barbershop-30/assets/film.js`: `videoOf`, `FRAG_SEQ`, `loadClip`, `attach`, `attachUrl`, `detach`, `seqStart` až `seqDrive`, `drive`, `gesture`, `state` |
| okienko s videom | `barbershop-30/assets/app.js`, časť 11 `setupVideos` |
| kotvy | `barbershop-30/index.html`: `#vstup-dnu`, `#remeslo` (seq), `#tim` (play) |
| merania a rozhodnutia | `barbershop-30/docs/CHECKS.md` časti 11 až 13, `docs/TOUR_DIRECTION.md`, `docs/MEDIA_SELECTION.md` |
| test stavu sekvencie | `toolbox/skills-z-praxe/video-a-sekvencie/scripts/seq-stav.mjs [--id=remeslo]` |

HEAD SPA 30 (koreň repozitára) video nemá, jeho film (`assets/world.js`) ide len z fotiek.

## Čo ostáva rozhodnúť

- **Zdroj v 60 snímkach/s** (napr. iPhone 4K60): pravých 60 snímok bez dopočítavania a ostrejší obraz ako
  576 × 1024. Natáča a rozhoduje majiteľ.
- Meranie na skutočnom iPhone a Androide s 120 Hz; prispôsobivé pásma nahrávania s limitom bajtov aj pre sekvencie
  (z auditu, nezapracované).

## Kontrolný zoznam

- [ ] Režim zvolený podľa tabuľky; pretáčanie `currentTime` skrolom nikde.
- [ ] Zdroj stabilizovaný, netónovaný; zväčšenie lanczos + CAS v príprave, `format=yuv420p` na konci.
- [ ] Sekvencia: krok 0,1 s, `-fps_mode vfr`, počet snímok `round(dĺžka × 10) + 1` sedí s `data-video-n`.
- [ ] AVIF aj WebP pre každú snímku; plagát = stredná snímka, tá istá v statickej zálohe pre telefón.
- [ ] Sťahovanie až po pohybe a blízko scény, od hrubých k jemným, najviac 4 naraz, nízka priorita.
- [ ] Najviac 2 nahratia za snímku, zastarané zahodené a zavreté, v grafike najviac 6 textúr.
- [ ] Počas skrolu zmes len v strednej tretine, v pokoji `mix` 0 alebo 1.
- [ ] Slučka: šev prelínaním, 60 snímok/s cez strojnásobenie, rozdiel na šve ako bežný krok.
- [ ] Video `muted playsinline`, v dokumente, hrá len na obrazovke, odomknutie gestom, plagát ako záloha.
- [ ] `node toolbox/skills-z-praxe/video-a-sekvencie/scripts/seq-stav.mjs` prejde pre každú scénu so sekvenciou.
- [ ] Overené na skutočnom telefóne alebo jasne napísané, že nemerané.
