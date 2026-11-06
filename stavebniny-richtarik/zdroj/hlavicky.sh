#!/usr/bin/env bash
# Menšie fotky hlavičiek podstránok pre telefón (README, Texty a SEO, časť Rýchlosť podstránok).
# Na telefóne (do 480 px) je rám fotky v hlavičke celá šírka obsahu × 230 px (pomer okolo 1,54). Telefón preto dostane
# výrez 720 × 468 z tej istej fotky: to isté, čo by ukázal rám (object-fit: cover a object-position z build.py), len bez
# častí, ktoré rám oreže. Fotka sa neupravuje, len vyreže a zmenší (nikdy nezväčší). 720 px je aspoň 1,6-násobok šírky
# rámu pri 480 px (444 px), ako žiada README pri fotkách hlavičiek.
# Výstup: img/uvod/hlavicka/<názov>-720.avif|webp a img/hd/hlavicka/<názov>-720.avif|webp. Meno súboru bez „-720“
# je rovnaké ako pri dlaždici, takže prechod medzi stránkami (zdroj/prechody.js, F()) ju berie ako tú istú fotku.
# Použitie (v priečinku webu): bash zdroj/hlavicky.sh   (potrebuje ImageMagick a ffmpeg s libaom-av1)
set -euo pipefail
cd "$(dirname "$0")/.."
SIR=720; VYS=468
vyrez() {   # vyrez <zdroj> <cieľ bez prípony> <x 0–1> <y 0–1>
  local src=$1 out=$2 px=$3 py=$4 w h cw ch x y
  read -r w h < <(identify -format '%w %h\n' "$src")
  # výrez s pomerom 720:468 v plnej šírke alebo výške zdroja, posunutý ako object-position
  if [ $((w * VYS)) -gt $((h * SIR)) ]; then ch=$h; cw=$((h * SIR / VYS)); else cw=$w; ch=$((w * VYS / SIR)); fi
  x=$(python3 -c "print(round(($w - $cw) * $px))"); y=$(python3 -c "print(round(($h - $ch) * $py))")
  mkdir -p "$(dirname "$out")"
  convert "$src" -crop "${cw}x${ch}+${x}+${y}" +repage -resize "${SIR}x${VYS}>" -strip "$out.png"
  # WebP cez ffmpeg (ImageMagick 6 pri WebP kvalitu ignoruje), AVIF ako ostatné fotky webu (libaom, still-picture)
  ffmpeg -v error -y -i "$out.png" -c:v libwebp -quality 78 -compression_level 6 "$out.webp"
  ffmpeg -v error -y -i "$out.png" -vf "scale=out_color_matrix=bt601:out_range=full,format=yuv420p" -c:v libaom-av1 \
    -still-picture 1 -crf 28 -cpu-used 3 -row-mt 1 -color_range pc -colorspace smpte170m "$out.avif"
  rm -f "$out.png"
  echo "$out: výrez ${cw}x${ch}+${x}+${y} z ${w}x${h}, webp $(stat -c %s "$out.webp") B, avif $(stat -c %s "$out.avif") B"
}
# skutočné fotky dvora: najväčší súbor a object-position z UVOD_FOTO v build.py
vyrez img/uvod/zasoba-tehly-856.webp    img/uvod/hlavicka/zasoba-tehly-$SIR    0.50 0.42
vyrez img/uvod/zasoba-porfix-900.webp   img/uvod/hlavicka/zasoba-porfix-$SIR   0.50 0.56
vyrez img/uvod/zasoba-stadreko-900.webp img/uvod/hlavicka/zasoba-stadreko-$SIR 0.50 0.45
vyrez img/uvod/zasoba-rezivo-900.webp   img/uvod/hlavicka/zasoba-rezivo-$SIR   0.50 0.52
vyrez img/uvod/pas-dvor-1920.webp       img/uvod/hlavicka/pas-dvor-$SIR        0.20 0.55
vyrez img/uvod/dvor-predajna-1200.webp  img/uvod/hlavicka/dvor-predajna-$SIR   0.28 0.55
# ilustračné fotky kategórií (img/hd, stred), len tie, ktoré sú v hlavičke niektorej stránky (po behu build.py)
for m in $(grep -rhoE 'img/hd/[a-z-]+-1200\.webp' --include='*.html' . | sed -E 's#.*/([a-z-]+)-1200\.webp#\1#' | sort -u); do
  vyrez "img/hd/$m-1200.webp" "img/hd/hlavicka/$m-$SIR" 0.5 0.5
done
