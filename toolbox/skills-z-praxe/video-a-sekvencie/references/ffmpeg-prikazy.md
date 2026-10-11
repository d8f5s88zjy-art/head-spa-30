# Príprava videa: príkazy ffmpeg a Pillow

Zdroj: `barbershop-30/source/tools/sekvencie.sh` a `barbershop-30/source/tools/videa.sh` (stav 2026-10-11),
staršie verzie z `git log -p -- barbershop-30/source/tools/videa.sh`. Oba skripty som znova spustil do
scratchpadu (ffmpeg 6.1.1, Pillow 12.3.0): MP4 slučky a plagáty vyšli zhodné bajt po bajte s tým, čo je v `assets/`,
WebM rovnako veľký; zo 190 súborov sekvencií bolo 188 zhodných, `okolo-kresla/f008` sa pri overení nepatrne líšila
(priemerne 0,6 z 255 v jase), takže beh nie je zaručene deterministický. Beh: sekvencie asi 51 s, slučka s plagátom
asi 4,5 min (väčšinu času berie `minterpolate`).

Zdroj v tomto projekte: tri telefónne videá majiteľa `source/video/video-1..3.mp4`, 576 × 1024, 30 snímok/s,
9,0 / 12,8 / 13,3 s (ffprobe). Fotky ani videá sa netónujú, žiadna farebná úprava.

## 1. Stabilizácia (vid.stab, dva prechody)

`videa.sh`, funkcia `stab` (sekvencie.sh robí to isté s priečinkom `tmp-seq`):

```bash
ffmpeg -v error -y -ss "$2" -i "$1" -t "$3" -an -c:v libx264 -crf 8 -preset veryfast tmp/cut.mp4
ffmpeg -v error -y -i tmp/cut.mp4 -vf vidstabdetect=shakiness=5:accuracy=15:result=tmp/t.trf -f null -
ffmpeg -v error -y -i tmp/cut.mp4 -vf "vidstabtransform=input=tmp/t.trf:smoothing=15:optzoom=1:zoomspeed=0.2:interpol=bicubic" -c:v libx264 -crf 6 -preset veryfast "$4"
```

| parameter | hodnota | prečo (z komentárov skriptu) |
| --- | --- | --- |
| `-crf 8`, `-crf 6`, `veryfast` | medzivýsledky | takmer bez straty, kvalita sa rieši až na konci |
| `smoothing=15` | 15 | vyhladenie 0,5 s pri 30 snímkach/s |
| `optzoom=1`, `zoomspeed=0.2` | optimálny orez | orez okolo 1,4 % |
| `interpol=bicubic` | | |
| doostrenie | až po zväčšení (krok 2) | „doostruje sa až po zväčšení“ |

Video, ktoré je stabilné samo (video-2, chvenie 0,033 % šírky), sa nestabilizuje.

## 2. Zväčšenie a doostrenie (UP)

```bash
# sekvencie.sh: 576 → 720
UP="scale=720:1280:flags=lanczos+accurate_rnd+full_chroma_int,cas=strength=0.5"
# videa.sh: 576 → 864
UP="scale=864:1536:flags=lanczos+accurate_rnd+full_chroma_int,cas=strength=0.5"
```

Prehliadač zväčšuje bilineárne, telefón zdroj 576 px zväčšoval asi 2,5×. Lanczos a CAS v príprave:
„detaily nepribúdajú, ubúda rozmazanie a kocky“. Ostrejší obraz dá len ostrejší originál (1080p alebo 4K).

## 3. Sekvencia snímok po 0,1 s

`sekvencie.sh`, funkcia `seq` (meno, od, do v sekundách):

```bash
local n; n=$(python3 -c "print(round(($3-$2)*10)+1)")
# zdroj má 30 snímok/s: každá tretia snímka je presne o 0,1 s ďalej
ffmpeg -v error -y -ss "$2" -i "$T/stab.mp4" -an -vf "select='not(mod(n\,3))',$UP,format=rgb24" -fps_mode vfr -frames:v "$n" "$T/$1/f%03d.png"
```

```python
im = Image.open(f).convert('RGB')
a, w = os.path.join(out, 'f%03d.avif' % i), os.path.join(out, 'f%03d.webp' % i)
im.save(a, quality=56, speed=6); im.save(w, quality=80, method=5)
```

- Počet snímok `n = round((do − od) × 10) + 1`, teda oba konce úseku. Úsek 0,0 až 5,0 s = 51 snímok,
  5,0 až 9,3 s = 44 snímok.
- `select='not(mod(n\,3))'` vyberie každú 3. snímku (30 snímok/s → krok 0,1 s). Pri inom zdroji krok prepočítaj:
  60 snímok/s → každá 6.
- `-fps_mode vfr` je nutné. Overené na 2 s úseku: s ním 20 PNG, bez neho ffmpeg 6.1 doplní duplikáty a vyjde 59 PNG.
- Medzikrok PNG `rgb24`, kódovanie cez Pillow (AVIF `quality=56, speed=6`, WebP `quality=80, method=5`).
- Výstup `assets/seq/<meno>/f000.avif|webp …`, číslovanie od 0 trojmiestne (prehrávač skladá `f${pad3(i)}`).
- Pracovné súbory idú do `./tmp-seq` v aktuálnom priečinku, výstup do `$OUT` (predvolene `assets/seq`).
  Na skúšku: `OUT=$PWD/seq bash …/sekvencie.sh` v prázdnom priečinku. Beh oboch sekvencií v kontajneri 51 s.

Výsledok (720 × 1280):

| sekvencia | úsek video-3 | snímok | AVIF | WebP | AVIF na snímku |
| --- | --- | --- | --- | --- | --- |
| `vstup-dnu` | 0,0 až 5,0 s | 51 | 1990 kB | 2481 kB | asi 39 kB |
| `okolo-kresla` | 5,0 až 9,3 s | 44 | 1568 kB | 1936 kB | asi 36 kB |

Obe idú z jedného stabilizovaného záberu, takže druhá nadväzuje na prvú bez strihu.

## 4. Slučka bez švu (60 snímok/s)

`videa.sh`, funkcia `seamless` (zdroj, od, do, dĺžka švu X, výstup):

```bash
local OFF; OFF=$(python3 -c "print(round($3-$2-2*$4,3))")
local T; T=$(python3 -c "print(round($3-$2-$4,4))")     # perióda slučky (s)
# 1) slučka 30 snímok/s: koniec sa prelinie do začiatku (medzivýsledok takmer bez straty)
ffmpeg -v error -y -i "$1" -filter_complex "[0:v]trim=start=$(python3 -c "print($2+$4)"):end=$3,setpts=PTS-STARTPTS[b];[0:v]trim=start=$2:end=$(python3 -c "print($2+$4)"),setpts=PTS-STARTPTS[h];[b][h]xfade=transition=fade:duration=$4:offset=$OFF[o]" -map "[o]" -an -c:v libx264 -crf 6 -preset veryfast tmp/loop30.mp4
# 2) 60 snímok/s aj cez šev: slučka trikrát za sebou, medzisnímky sa dopočítajú, vystrihne sa presne prostredná perióda
ffmpeg -v error -y -stream_loop 2 -i tmp/loop30.mp4 -an -vf "$MI,trim=start=$T:end=$(python3 -c "print(2*$T)"),setpts=PTS-STARTPTS,$UP,$GRADE" $H264_PLAY "$5.mp4"
ffmpeg -v error -y -i "$5.mp4" $VP9_PLAY "$5.webm"
```

Ako to funguje (L = do − od):
- `b` je úsek [od + X, do] (dĺžka L − X), `h` je začiatok [od, od + X] (dĺžka X).
- `xfade` s `offset = L − 2X` začne prelínať X sekúnd pred koncom `b`, takže koniec sa prelinie do `h`.
  Výsledok má dĺžku T = L − X a končí snímkou tesne pred časom od + X, kde `b` začína: slučka je súvislá.
- Krok 2: `minterpolate` v jednom súbore nepozná snímku za poslednou, šev by ostal bez medzisnímky.
  `-stream_loop 2` dá slučku 3× za sebou, prostredná perióda [T, 2T] má susedov na oboch stranách,
  a tá sa vystrihne.
- Tím: video-2 1,0 až 9,0 s, šev 0,6 s → T = 7,4 s. ffprobe výsledku: 864 × 1536, 60/1, 444 snímok, 7,400 s.

Interpolácia pohybu (pred zväčšením, odhad pohybu je tak presnejší; skontrolované na rukách a nožniciach,
medzisnímky bez krivenia):

```bash
MI="minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"
```

Skutočných 60 snímok dá len originál nahraný v 60 snímkach/s (komentár skriptu).

### Meranie švu

Priemerný absolútny rozdiel susedných snímok v odtieňoch šedej (216 × 384) a rozdiel posledná → prvá:

```bash
ffmpeg -v error -y -i tim-slucka-864.mp4 -vf "scale=216:384,format=gray" -f rawvideo - > g.raw
python3 -I -c "
import numpy as np
a=np.fromfile('g.raw',dtype=np.uint8).reshape(-1,384,216).astype(np.float32)
d=np.abs(np.diff(a,axis=0)).mean(axis=(1,2))
print('median',np.median(d),'priemer',d.mean(),'max',d.max(),'sev',np.abs(a[0]-a[-1]).mean())"
```

Výsledok pre `tim-slucka-864.mp4`: šev 1,57, priemer susedných 1,68, medián 1,37, maximum 5,35. Šev je teda
ako bežný krok medzi snímkami (CHECKS 12 uvádza 1,6 pri bežnom 1,7).

## 5. Kódovanie pre prehrávanie

```bash
GRADE="format=yuv420p"
H264_PLAY="-c:v libx264 -profile:v high -level 4.2 -pix_fmt yuv420p -crf 21 -g 120 -movflags +faststart -an"
VP9_PLAY="-c:v libvpx-vp9 -pix_fmt yuv420p -crf 32 -b:v 0 -g 240 -row-mt 1 -deadline good -cpu-used 2 -an"
```

- `format=yuv420p` vždy na konci: inak vznikne VP9 profil 1 alebo H.264 4:4:4 (komentár skriptu).
- H.264: kľúčová snímka každých 120 snímok (2 s pri 60 snímkach/s), `+faststart`, bez zvuku.
- VP9: konštantná kvalita (`-crf 32 -b:v 0`), kľúčová každých 240 snímok.
- Pri 30 snímkach/s mal skript `-g 60` a `-g 120` a úroveň 4.1; s 60 snímkami/s sa zdvojnásobili a úroveň je 4.2.
- Veľkosť `tim-slucka-864`: MP4 3,4 MB, WebM 2,9 MB (7,4 s, 864 × 1536, 60 snímok/s).

Prehliadač si vyberá v `film.js` (`vType`): MP4, keď `canPlayType('video/mp4; codecs="avc1.640028"')` vráti
`probably` alebo keď WebM nejde; inak WebM.

## 6. Plagát (prvý obraz, kým video nemá snímku)

```bash
ffmpeg -v error -y -ss "$2" -i "$1" -frames:v 1 tmp/p.png
ffmpeg -v error -y -i tmp/p.png -c:v libaom-av1 -still-picture 1 -crf 26 -b:v 0 -pix_fmt yuv420p "$3.avif"
ffmpeg -v error -y -i tmp/p.png -c:v libwebp -quality 84 "$3.webp"
ffmpeg -v error -y -i tmp/p.png -q:v 3 "$3.jpg"
```

Plagát má byť presne snímka, ktorú prehrávač ukáže ako prvú, inak pri prepnutí obraz poskočí:
- slučka začína od 0, plagát z času 0;
- sekvencia nepotrebuje vlastný plagát: berie strednú snímku (`f025` z 51, `f022` z 44), lebo pri kotve
  na obrazovke je poloha v zábere 0,5 (pozri `prehravac.md`);
- starý režim scroll mal plagát z času, ktorý film ukáže ako prvý (1,2 s a 1,0 s).

## 7. Staršie parametre režimu scroll (už sa nepoužíva)

Z histórie `videa.sh` (commity 205795f a 6af024e), pre porovnanie, keby sa niekto chcel vrátiť k pretáčaniu videa:

```bash
# prvá verzia: každá snímka kľúčová, 15 snímok/s
H264_INTRA="-c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p -crf 26 -g 1 -keyint_min 1 -bf 0 -tune film -movflags +faststart -an"
VP9_SCROLL="-c:v libvpx-vp9 -pix_fmt yuv420p -crf 38 -b:v 0 -g 5 -row-mt 1 -deadline good -cpu-used 2 -an"
# druhá verzia (ostrejšia): kľúčová každá 4. snímka
H264_INTRA="-c:v libx264 -profile:v high -level 4.1 -pix_fmt yuv420p -crf 20 -g 4 -keyint_min 4 -bf 0 -tune film -movflags +faststart -an"
VP9_SCROLL="-c:v libvpx-vp9 -pix_fmt yuv420p -crf 33 -b:v 0 -g 5 -row-mt 1 -deadline good -cpu-used 2 -an"
ffmpeg -v error -y -i tmp/v3-stab.mp4 -t 5.0 -vf "fps=15,$UP,$GRADE" $H264_INTRA "$OUT/vstup-dnu-864.mp4"
```

Výsledok: na telefóne pri posune trhané, pri zastavení obraz stál (2026-10-11 nahradené slučkou, potom sekvenciou).
CHECKS 11 popisuje práve túto druhú verziu („H.264 crf 20, kľúčová každá 4. snímka; VP9 crf 33“); videá vo filme
mali vtedy spolu asi 10 MB H.264.
