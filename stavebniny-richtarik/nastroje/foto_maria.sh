#!/usr/bin/env bash
# Webové veľkosti fotiek katalógu a log značiek od majiteľa (Ing. Mário Richtárik, e-mail 17. 11. 2026: „Ešte raz Vám
# posielam všetky fotky, ktoré treba vymeniť v katalógu výrobkov“; preposlal Lajko 17. 11. 2026).
# Zdroj: zdroj/foto-maria/*.webp – výrezy zo snímok obrazovky iPhonu bez rozhrania Mailu (bezstratové WebP, pixely presne zo
# snímky; odkiaľ je ktorý výrez, je v zdroj/foto-maria/vyrezy.tsv). Pôvod a použitie: img/FOTKY.md.
# Spracovanie: len orez, zmenšenie (Lanczos), jemné doostrenie po zmenšení a prevod do AVIF a WebP. Tón, farby ani obsah sa
# nemenia a nič sa nezväčšuje: najväčší súbor má skutočnú šírku výrezu (1030 – 1320 px).
# Výstup (nové mená, obrázky majú na hostingu cache na rok):
#   img/kat/<názov>-480|720|960|<šírka>.avif|webp   fotka hlavičky hlavnej stránky kategórie (build.py HLAVICKA_FOTO, „kat:“)
#   img/kat/hlavicka/<názov>-720.avif|webp          výrez 720 × 468 pre telefón (rám 230 px vysoký, ako zdroj/hlavicky.sh)
#   img/logo/stadreko.webp, img/logo/rg-plast-deva.webp   logá na kartách značiek (popisy.LOGA_ZNACIEK), 360 px
# Vysoké výrezy (farby, fasáda, podkrovie) sa orežú na 4 : 3 – pomer rámu hlavičky na počítači; ostatné majú pomer 1,33 – 1,55
# a orezávajú sa len v ráme (object-fit). Použitie (v priečinku webu): bash nastroje/foto_maria.sh   (ImageMagick a ffmpeg)
set -euo pipefail
cd "$(dirname "$0")/.."
Z=zdroj/foto-maria; O=img/kat; L=img/logo
mkdir -p "$O/hlavicka" "$L"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

kod() {   # kod <png> <cieľ bez prípony> [crf] [kvalita webp]: WebP a AVIF (WebP cez ffmpeg, ImageMagick 6 pri WebP kvalitu ignoruje)
  local crf=${3:-30} q=${4:-80}
  ffmpeg -v error -y -i "$1" -c:v libwebp -quality "$q" -compression_level 6 "$2.webp"
  ffmpeg -v error -y -i "$1" -vf "scale=out_color_matrix=bt601:out_range=full,format=yuv420p" -c:v libaom-av1 \
    -still-picture 1 -crf "$crf" -cpu-used 3 -row-mt 1 -color_range pc -colorspace smpte170m "$2.avif"
  echo "$2: $(identify -format '%wx%h' "$2.webp"), webp $(stat -c %s "$2.webp") B, avif $(stat -c %s "$2.avif") B"
}

fotka() {   # fotka <výrez> <orez WxH+X+Y alebo „cely“>: sada šírok a výrez pre telefón
  local m=$1 orez=$2 w h sir cw ch x y
  read -r w h < <(identify -format '%w %h\n' "$Z/$m.webp")
  [ "$orez" = cely ] && orez="${w}x${h}+0+0"
  convert "$Z/$m.webp" -crop "$orez" +repage -strip "$TMP/o.png"
  read -r w h < <(identify -format '%w %h\n' "$TMP/o.png")
  for sir in 480 720 960 "$w"; do
    [ "$sir" -gt "$w" ] && continue
    if [ "$sir" -eq "$w" ]; then cp "$TMP/o.png" "$TMP/x.png"   # najväčší súbor = skutočná šírka výrezu, bez zmenšenia
    else convert "$TMP/o.png" -filter Lanczos -resize "${sir}x" -unsharp 0x0.6+0.45+0.01 -strip "$TMP/x.png"; fi
    kod "$TMP/x.png" "$O/$m-$sir"
    [ "$sir" -eq "$w" ] && break
  done
  # telefón: výrez s pomerom 720 : 468 v plnej šírke alebo výške, v strede (object-position 50 % 50 %), zmenšený na 720 px
  if [ $((w * 468)) -gt $((h * 720)) ]; then ch=$h; cw=$((h * 720 / 468)); else cw=$w; ch=$((w * 468 / 720)); fi
  x=$(( (w - cw) / 2 )); y=$(( (h - ch) / 2 ))
  convert "$TMP/o.png" -crop "${cw}x${ch}+${x}+${y}" +repage -filter Lanczos -resize 720x468 -unsharp 0x0.6+0.45+0.01 -strip "$TMP/t.png"
  kod "$TMP/t.png" "$O/hlavicka/$m-720" 32 78
}

# kategória ← fotka (rozhodnutie podľa Máriovho zoznamu; README časť Karty značiek a fotky kategórií)
fotka stresne-kritiny-strecha      cely              # strešné krytiny: škridly na streche, ruka s plánom (IMG_0355 dole)
fotka sypke-zmesy-univer-bau       cely              # sypké zmesi: palety vriec Univer Bau (IMG_0356)
fotka stavebne-rezivo-hranoly      cely              # stavebné rezivo: hranoly na snehu (IMG_0355 hore)
fotka murovaci-material-porotherm  cely              # murovací materiál: keramické tehly (IMG_0354 stred)
fotka hutny-material-rury          cely              # hutný materiál: rúry v regáli (IMG_0352)
fotka izolacny-material-podkrovie  1284x963+0+250    # izolačný materiál: podkrovie s rolami (IMG_0353), 4 : 3 s oknom a rolami
fotka fasadny-system-rez           1320x990+0+350    # fasádny systém: rez zatepľovacím systémom (IMG_0351), 4 : 3 s vrstvami a soklom
fotka farby-laky-chemolak          1320x990+0+0      # farby a laky: regály Chemolak (IMG_0350), 4 : 3 s tabuľou Chemolak
fotka dlazby-vzorkova-plocha       cely              # dlažby a ploty: vzorková plocha (IMG_0349)
fotka podhlady-pvc-pergola         cely              # podhľady a PVC: pergola s lavicami (IMG_0354 dole, nad tlačidlami Mailu)

# logá: tesný orez okolo nápisu s bielym okrajom, 360 px (karta ukazuje logo najviac 180 × 72 px)
logo() {   # logo <výrez> <cieľ> <orez>
  convert "$Z/$1.webp" -crop "$3" +repage -filter Lanczos -resize 360x -unsharp 0x0.6+0.45+0.01 -strip "$TMP/l.png"
  ffmpeg -v error -y -i "$TMP/l.png" -c:v libwebp -quality 90 -compression_level 6 "$L/$2.webp"
  echo "$L/$2.webp: $(identify -format '%wx%h' "$L/$2.webp"), $(stat -c %s "$L/$2.webp") B"
}
logo logo-stadreko      stadreko      530x96+5+209   # nápis STADREKO so znakom (v snímke x 77 – 607, y 557 – 653)
logo logo-rg-plast-deva rg-plast-deva 1032x399+0+0   # celé logo RG plast deva s bielym okrajom 24 px
