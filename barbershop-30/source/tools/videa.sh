#!/usr/bin/env bash
# Videá majiteľa ako zábery filmu (len telefón): úseky, stabilizácia, kódovanie. Bez farebnej úpravy.
# Spustenie: OUT=assets/video bash source/tools/videa.sh (z koreňa barbershop-30).
# Spúšťať z priečinka, kam majú ísť výstupy; zdroj sú originály v source/video.
set -euo pipefail
V=/home/user/head-spa-30/barbershop-30/source/video
OUT=${OUT:-./out}; mkdir -p "$OUT" tmp
# bez farebnej úpravy (fotky ani videá sa netónujú); na konci vždy 4:2:0 (inak VP9 profil 1 / H.264 4:4:4)
GRADE="format=yuv420p"
H264_INTRA="-c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p -crf 26 -g 1 -keyint_min 1 -bf 0 -tune film -movflags +faststart -an"
H264_PLAY="-c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p -crf 25 -g 60 -movflags +faststart -an"
VP9_PLAY="-c:v libvpx-vp9 -pix_fmt yuv420p -crf 36 -b:v 0 -g 120 -row-mt 1 -deadline good -cpu-used 2 -an"
VP9_SCROLL="-c:v libvpx-vp9 -pix_fmt yuv420p -crf 38 -b:v 0 -g 5 -row-mt 1 -deadline good -cpu-used 2 -an"   # len záloha pre prehliadače bez H.264

stab() { # $1 zdroj, $2 začiatok, $3 dĺžka, $4 výstup: medzivýsledok bez straty, vid.stab (vyhladenie 0,5 s, orez 1,4 %)
  ffmpeg -v error -y -ss "$2" -i "$1" -t "$3" -an -c:v libx264 -crf 8 -preset veryfast tmp/cut.mp4
  ffmpeg -v error -y -i tmp/cut.mp4 -vf vidstabdetect=shakiness=5:accuracy=15:result=tmp/t.trf -f null -
  ffmpeg -v error -y -i tmp/cut.mp4 -vf "vidstabtransform=input=tmp/t.trf:smoothing=15:optzoom=1:zoomspeed=0.2:interpol=bicubic,unsharp=5:5:0.4" -c:v libx264 -crf 8 -preset veryfast "$4"
}
poster() { # $1 video, $2 čas, $3 meno bez prípony
  ffmpeg -v error -y -ss "$2" -i "$1" -frames:v 1 tmp/p.png
  ffmpeg -v error -y -i tmp/p.png -c:v libaom-av1 -still-picture 1 -crf 32 -b:v 0 -pix_fmt yuv420p "$3.avif"
  ffmpeg -v error -y -i tmp/p.png -c:v libwebp -quality 80 "$3.webp"
  ffmpeg -v error -y -i tmp/p.png -q:v 3 "$3.jpg"
}
seamless() { # $1 zdroj, $2 od, $3 do, $4 prelínanie švu (s), $5 výstup bez prípony: slučka bez skoku (koniec sa prelinie do začiatku)
  local L; L=$(python3 -c "print($3-$2)")
  local OFF; OFF=$(python3 -c "print(round($3-$2-2*$4,3))")
  ffmpeg -v error -y -i "$1" -filter_complex "[0:v]trim=start=$(python3 -c "print($2+$4)"):end=$3,setpts=PTS-STARTPTS[b];[0:v]trim=start=$2:end=$(python3 -c "print($2+$4)"),setpts=PTS-STARTPTS[h];[b][h]xfade=transition=fade:duration=$4:offset=$OFF,$GRADE[o]" -map "[o]" $H264_PLAY "$5.mp4"
  ffmpeg -v error -y -i "$5.mp4" $VP9_PLAY "$5.webm"
}

# 1) vstup dnu: video-3 0,0–5,0 s, nájazd do sály popod lampy (skrol, 15 snímok/s, každá kľúčová)
stab "$V/video-3.mp4" 0 9.4 tmp/v3-stab.mp4
ffmpeg -v error -y -i tmp/v3-stab.mp4 -t 5.0 -vf "fps=15,$GRADE" $H264_INTRA "$OUT/vstup-dnu-576.mp4"
ffmpeg -v error -y -i tmp/v3-stab.mp4 -t 5.0 -vf "fps=15,$GRADE" $VP9_SCROLL "$OUT/vstup-dnu-576.webm"
# plagát = snímka, ktorú film ukáže ako prvú (asi 1,2 s), aby pri prepnutí na video obraz neposkočil
poster "$OUT/vstup-dnu-576.mp4" 1.2 "$OUT/vstup-dnu-poster-576"
# 2) okolo kresla: video-3 5,0–9,3 s, kamera obchádza barbera (skrol); ten istý stabilizovaný záber, nadväzuje bez strihu
ffmpeg -v error -y -ss 5.0 -i tmp/v3-stab.mp4 -t 4.3 -vf "fps=15,$GRADE" $H264_INTRA "$OUT/okolo-kresla-576.mp4"
ffmpeg -v error -y -ss 5.0 -i tmp/v3-stab.mp4 -t 4.3 -vf "fps=15,$GRADE" $VP9_SCROLL "$OUT/okolo-kresla-576.webm"
poster "$OUT/okolo-kresla-576.mp4" 1.0 "$OUT/okolo-kresla-poster-576"
# 5) tím (slučka v čase): video-2 1,0–9,0 s, šev 0,6 s; video-2 je stabilné samo (chvenie 0,033 % š), bez vid.stab
seamless "$V/video-2.mp4" 1.0 9.0 0.6 "$OUT/tim-slucka-576"
poster "$OUT/tim-slucka-576.mp4" 0 "$OUT/tim-slucka-poster-576"   # slučka začína od 0
ls -la "$OUT"
