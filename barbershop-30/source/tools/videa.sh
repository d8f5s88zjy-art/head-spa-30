#!/usr/bin/env bash
# Videá majiteľa ako zábery filmu (len telefón): úseky, stabilizácia, kódovanie. Bez farebnej úpravy.
# Spustenie: OUT=assets/video bash source/tools/videa.sh (z koreňa barbershop-30).
# Spúšťať z priečinka, kam majú ísť výstupy; zdroj sú originály v source/video.
set -euo pipefail
V=/home/user/head-spa-30/barbershop-30/source/video
OUT=${OUT:-./out}; mkdir -p "$OUT" tmp
# bez farebnej úpravy (fotky ani videá sa netónujú); na konci vždy 4:2:0 (inak VP9 profil 1 / H.264 4:4:4)
GRADE="format=yuv420p"
# ostrosť (majiteľ 2026‑10‑11: čo najostrejšie): originály majú len 576×1024, telefón ich zväčšuje asi 2,5×.
# Zväčšenie na 864×1536 kvalitným filtrom (lanczos) a jemné doostrenie CAS tu, nie v prehliadači, ktorý
# zväčšuje bilineárne; menšia kompresia (crf 21). Detaily nepribúdajú, ubúda rozmazanie a kocky.
UP="scale=864:1536:flags=lanczos+accurate_rnd+full_chroma_int,cas=strength=0.5"
# 60 snímok za sekundu (majiteľ 2026‑10‑11: celá stránka 60 až 120 snímok): originály sú 30 snímok/s, každá druhá
# snímka sa dopočíta z pohybu (kompenzácia pohybu, obojsmerný odhad), ešte pred zväčšením (presnejší odhad).
# Skontrolované na rukách a nožniciach: medzisnímky bez krivenia. Skutočné 60 snímok dá len originál nahraný v 60.
MI="minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"
H264_PLAY="-c:v libx264 -profile:v high -level 4.2 -pix_fmt yuv420p -crf 21 -g 120 -movflags +faststart -an"
VP9_PLAY="-c:v libvpx-vp9 -pix_fmt yuv420p -crf 32 -b:v 0 -g 240 -row-mt 1 -deadline good -cpu-used 2 -an"

stab() { # $1 zdroj, $2 začiatok, $3 dĺžka, $4 výstup: medzivýsledok bez straty, vid.stab (vyhladenie 0,5 s, orez 1,4 %); doostruje sa až po zväčšení (UP)
  ffmpeg -v error -y -ss "$2" -i "$1" -t "$3" -an -c:v libx264 -crf 8 -preset veryfast tmp/cut.mp4
  ffmpeg -v error -y -i tmp/cut.mp4 -vf vidstabdetect=shakiness=5:accuracy=15:result=tmp/t.trf -f null -
  ffmpeg -v error -y -i tmp/cut.mp4 -vf "vidstabtransform=input=tmp/t.trf:smoothing=15:optzoom=1:zoomspeed=0.2:interpol=bicubic" -c:v libx264 -crf 6 -preset veryfast "$4"
}
poster() { # $1 video, $2 čas, $3 meno bez prípony
  ffmpeg -v error -y -ss "$2" -i "$1" -frames:v 1 tmp/p.png
  ffmpeg -v error -y -i tmp/p.png -c:v libaom-av1 -still-picture 1 -crf 26 -b:v 0 -pix_fmt yuv420p "$3.avif"
  ffmpeg -v error -y -i tmp/p.png -c:v libwebp -quality 84 "$3.webp"
  ffmpeg -v error -y -i tmp/p.png -q:v 3 "$3.jpg"
}
seamless() { # $1 zdroj, $2 od, $3 do, $4 prelínanie švu (s), $5 výstup bez prípony: slučka bez skoku (koniec sa prelinie do začiatku)
  local L; L=$(python3 -c "print($3-$2)")
  local OFF; OFF=$(python3 -c "print(round($3-$2-2*$4,3))")
  ffmpeg -v error -y -i "$1" -filter_complex "[0:v]trim=start=$(python3 -c "print($2+$4)"):end=$3,setpts=PTS-STARTPTS[b];[0:v]trim=start=$2:end=$(python3 -c "print($2+$4)"),setpts=PTS-STARTPTS[h];[b][h]xfade=transition=fade:duration=$4:offset=$OFF,$MI,$UP,$GRADE[o]" -map "[o]" $H264_PLAY "$5.mp4"
  ffmpeg -v error -y -i "$5.mp4" $VP9_PLAY "$5.webm"
}

# Videá vo filme hrajú v čase ako slučky (60 snímok/s), nie podľa skrolu: posun videa skrolom bol na telefóne
# trhaný (pretáčanie pri každom posune) a pri zastavení obraz stál (majiteľ 2026‑10‑11: video pôsobí zaseknuto).
# Šev slučky je prelínanie konca do začiatku, plagát = prvá snímka slučky (pri prepnutí na video nič neposkočí).
stab "$V/video-3.mp4" 0 13.2 tmp/v3-stab.mp4
# 1) vstup dnu: video-3 0,0–5,6 s, nájazd do sály popod lampy k barberovi, šev 0,6 s
seamless tmp/v3-stab.mp4 0.0 5.6 0.6 "$OUT/vstup-dnu-864"
poster "$OUT/vstup-dnu-864.mp4" 0 "$OUT/vstup-dnu-poster-864"
# 2) okolo kresla: video-3 5,0–12,6 s, kamera obchádza barbera a odstúpi do sály, šev 0,8 s
seamless tmp/v3-stab.mp4 5.0 12.6 0.8 "$OUT/okolo-kresla-864"
poster "$OUT/okolo-kresla-864.mp4" 0 "$OUT/okolo-kresla-poster-864"
# 5) tím (slučka v čase): video-2 1,0–9,0 s, šev 0,6 s; video-2 je stabilné samo (chvenie 0,033 % š), bez vid.stab
seamless "$V/video-2.mp4" 1.0 9.0 0.6 "$OUT/tim-slucka-864"
poster "$OUT/tim-slucka-864.mp4" 0 "$OUT/tim-slucka-poster-864"   # slučka začína od 0
ls -la "$OUT"
