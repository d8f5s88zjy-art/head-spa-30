#!/usr/bin/env bash
# Videá s chôdzou kamery ako sekvencie fotiek po 0,1 s (majiteľ 2026‑10‑11): pri skrole sa nepretáča video, film vyberie
# dve susedné snímky podľa polohy a prelína ich (assets/film.js, data-video-mode="seq"), takže pohyb ide pri každej
# snímke displeja (60 až 240 Hz). Zdroj: video-3 majiteľa, stabilizácia ako vo videa.sh, zväčšenie lanczos 576 → 720
# a jemné doostrenie CAS, bez farebnej úpravy. Výstup: assets/seq/<meno>/f000.avif|webp … (AVIF hlavný, WebP záloha).
# Spustenie z ľubovoľného priečinka: bash source/tools/sekvencie.sh (pracovné súbory v ./tmp-seq).
set -euo pipefail
SITE=/home/user/head-spa-30/barbershop-30
V=$SITE/source/video
OUT=${OUT:-$SITE/assets/seq}
T=tmp-seq; mkdir -p "$T"
UP="scale=720:1280:flags=lanczos+accurate_rnd+full_chroma_int,cas=strength=0.5"

# stabilizácia celého video-3 (ako videa.sh: vyhladenie 0,5 s, optimálny orez)
ffmpeg -v error -y -ss 0 -i "$V/video-3.mp4" -t 13.2 -an -c:v libx264 -crf 8 -preset veryfast "$T/cut.mp4"
ffmpeg -v error -y -i "$T/cut.mp4" -vf vidstabdetect=shakiness=5:accuracy=15:result="$T/t.trf" -f null -
ffmpeg -v error -y -i "$T/cut.mp4" -vf "vidstabtransform=input=$T/t.trf:smoothing=15:optzoom=1:zoomspeed=0.2:interpol=bicubic" -c:v libx264 -crf 6 -preset veryfast "$T/stab.mp4"

seq() { # $1 meno, $2 od (s), $3 do (s): snímka každých 0,1 s vrátane oboch koncov
  local n; n=$(python3 -c "print(round(($3-$2)*10)+1)")
  rm -rf "$T/$1" "$OUT/$1"; mkdir -p "$T/$1" "$OUT/$1"
  # zdroj má 30 snímok/s: každá tretia snímka je presne o 0,1 s ďalej
  ffmpeg -v error -y -ss "$2" -i "$T/stab.mp4" -an -vf "select='not(mod(n\,3))',$UP,format=rgb24" -fps_mode vfr -frames:v "$n" "$T/$1/f%03d.png"
  python3 -I - "$T/$1" "$OUT/$1" <<'EOF'
import sys, os, glob
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(os.path.join(src, 'f*.png')))
tot = [0, 0]
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB')
    a, w = os.path.join(out, 'f%03d.avif' % i), os.path.join(out, 'f%03d.webp' % i)
    im.save(a, quality=56, speed=6); im.save(w, quality=80, method=5)
    tot[0] += os.path.getsize(a); tot[1] += os.path.getsize(w)
print(os.path.basename(out), len(fs), 'snímok', round(tot[0] / 1024), 'kB AVIF', round(tot[1] / 1024), 'kB WebP')
EOF
}
# Poď ďalej: video-3 0,0–5,0 s (nájazd do sály popod lampy k barberovi), 51 snímok
seq vstup-dnu 0.0 5.0
# Povedz, ako to chceš: video-3 5,0–9,3 s (kamera obchádza barbera), 44 snímok; nadväzuje na Poď ďalej bez strihu
seq okolo-kresla 5.0 9.3
