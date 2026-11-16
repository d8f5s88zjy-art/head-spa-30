#!/usr/bin/env bash
# Webové veľkosti propagačných grafík majiteľa (Ing. Mário Richtárik, e-mail „nova zakaznicka karta“, 16. 11. 2026).
# Zdroj: zdroj/grafika-maria/*.webp – výrezy zo snímok obrazovky iPhonu bez rozhrania telefónu (bezstratové WebP, pixely
# presne zo snímky; odkiaľ je ktorý výrez, je v zdroj/grafika-maria/vyrezy.tsv). Pôvod a použitie: img/FOTKY.md.
# Spracovanie: len orez, zmenšenie (Lanczos), jemné doostrenie po zmenšení a prevod do AVIF a WebP. Tón, farby ani obsah
# sa nemenia a nič sa nezväčšuje: snímky nesú skutočný detail len ≈ 530–1190 px, preto séria končí na 400 px, ikony
# Kontaktu na 480 px a „Zdarma výpočet“ na 1080 px.
# Výstup img/ilu/ (nové mená, obrázky majú na hostingu cache na rok):
#   séria skupín tovaru (štvorec zo stredu výrezu, strana = kratšia strana zdroja) <názov>-200|400.avif|webp
#   Kontakt: orez 800 × 600 + 260 + 50 (celý rám ikony, menej prázdneho pozadia) kontakt-zavolajte|napiste-288|480
#   Služby: celý výrez 1320 × 720 zdarma-vypocet-480|790|1080
# Použitie (v priečinku webu): bash nastroje/grafika_maria.sh   (ImageMagick a ffmpeg s libaom-av1 a libwebp)
set -euo pipefail
cd "$(dirname "$0")/.."
Z=zdroj/grafika-maria; O=img/ilu
mkdir -p "$O"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

kod() {   # kod <png> <cieľ bez prípony>: WebP a AVIF (WebP cez ffmpeg, ImageMagick 6 pri WebP kvalitu ignoruje)
  ffmpeg -v error -y -i "$1" -c:v libwebp -quality 82 -compression_level 6 "$2.webp"
  ffmpeg -v error -y -i "$1" -vf "scale=out_color_matrix=bt601:out_range=full,format=yuv420p" -c:v libaom-av1 \
    -still-picture 1 -crf 30 -cpu-used 3 -row-mt 1 -color_range pc -colorspace smpte170m "$2.avif"
  echo "$2: $(identify -format '%wx%h' "$2.webp"), webp $(stat -c %s "$2.webp") B, avif $(stat -c %s "$2.avif") B"
}

urob() {   # urob <výrez> <cieľ> <orez WxH+X+Y alebo „stvorec“ alebo „cely“> <šírky…>
  local src=$Z/$1.webp out=$O/$2 orez=$3; shift 3
  local w h s
  read -r w h < <(identify -format '%w %h\n' "$src")
  case $orez in
    stvorec) s=$(( w < h ? w : h )); orez="${s}x${s}+$(( (w - s) / 2 ))+$(( (h - s) / 2 ))" ;;
    cely) orez="${w}x${h}+0+0" ;;
  esac
  for sir in "$@"; do
    # zmenšenie Lanczos v pôvodnom priestore farieb, potom jemné doostrenie (len hrany, priemerná farba sa nemení)
    convert "$src" -crop "$orez" +repage -filter Lanczos -resize "${sir}x" -unsharp 0x0.6+0.45+0.01 -strip "$TMP/x.png"
    kod "$TMP/x.png" "$out-$sir"
  done
}

# séria ilustrácií skupín tovaru: výzva „Potrebujete cenu…“ na stránkach kategórií a „Nenašli ste…“ v Katalógu
for p in sypke-zmesi murovaci-material stresne-krytiny izolacny-material kominovy-system stresne-okna hutny-material \
         okna-dvere rezivo stavebne-naradie sadrokarton fasadny-system farby-laky poradenstvo; do
  urob "kategoria-$p" "$p" stvorec 200 400
done
# Kontakt: karty Zavolajte nám a Napíšte nám (obrázok len pri údajoch, ktoré ukazuje – sprava/sablony/kontakt-karty.html)
urob ikona-zavolajte kontakt-zavolajte 800x600+260+50 288 480
urob ikona-napiste-nam kontakt-napiste 800x600+260+50 288 480
# Služby: výzva pred pätou
urob ikona-zdarma-vypocet zdarma-vypocet cely 480 790 1080
