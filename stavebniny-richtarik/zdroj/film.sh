#!/usr/bin/env bash
# Úvodný film Stavebniny Richtárik: z klipu z dronu (biele IVECO odbočí z ulice do dvora plného paliet) vyrobí
# snímky pre prehrávač ovládaný skrolovaním (img/film/) a vloží ich údaje do index.html (<script id="film-data">).
#
# Použitie:  zdroj/film.sh <priečinok so zdrojmi> <pracovný priečinok>
#   zdroje:  klip-4k.mp4 (4K zväčšenie klipu, 24 snímok/s; inak klip-720.mp4) a start-ulica.png (ostrý prvý záber
#            toho istého klipu). Pracovný priečinok drží medzisnímky (asi 4 GB), opakované spustenie ich použije znova.
# Potrebuje: ffmpeg (libaom-av1, libwebp, minterpolate), ImageMagick 6 (convert), node 18+.
#
# Postup:
#  1. pohyb      rozdiel susedných snímok klipu (320×180), z neho výber N snímok s rovnomernejším pohybom (film.mjs plan)
#  2. medzisnímky klip 2880×1624 dopočítaný na 48 snímok/s (minterpolate mci), aby výber mohol brať aj polovičné kroky
#  3. štart      ostrý start-ulica.png zarovnaný na prvú snímku klipu (mierka 1,424 a posun 1/−4 px v 4K, nájdené
#                hľadaním najmenšieho rozdielu jasu), je to snímka 0 aj prvý obraz stránky
#  2b. 4K pás    pre ostrejšiu sadu telefónu t960 medzisnímky 48/s zo 4K klipu len v páse x 1440–3200 (plné rozlíšenie)
#  4. výrezy     telefón 9:19,5 (720×1560 a 540×1170) so stredom na aute, počítač 16:9 (1920×1080 a 1280×720);
#                t960 (960×2080, telefón s hustotou od 2) ten istý výrez zo 4K pásu, štart priamo zo start-ulica.png
#  5. balíky     každá sada: kľúčové snímky (každá 8., polovičné rozlíšenie, 6×3 v jednom AVIF) a 18 blokov po 8
#                po sebe idúcich snímkach (4×2 v jednom AVIF); prvé obrazy AVIF + WebP do 150 kB, og.jpg
#  4c. posledný záber  ostrá statická posledná snímka filmu (img .posl, ukáže sa, keď film dobehne) priamo zo 4K zdroja
#                (pôvodná snímka klipu KONIEC_H/2), rovnaký výrez ako snímka filmu, doostrenie v dvoch mierkach, AVIF
#                vo vysokej kvalite: posl-t960/t720 (telefón na výšku), posl-p1920/p1280 (širší záber)
#  6. údaje      počet snímok, časy, ohniská a posledná snímka filmu (koniec, KONIEC_H=408) do index.html
set -euo pipefail
WEB=$(cd "$(dirname "$0")/.." && pwd)
ZDROJ=$(cd "${1:?priečinok so zdrojmi}" && pwd)
mkdir -p "${2:?pracovný priečinok}"; PRACA=$(cd "$2" && pwd)
OUT="$WEB/img/film"
N=${N:-144}; W=${W:-0.55}; JOBS=${JOBS:-4}
# kvalita AVIF (crf, menšie = lepšie) pre bloky a kľúčové snímky
CRF_T720=${CRF_T720:-43}; CRF_T540=${CRF_T540:-46}; CRF_P1920=${CRF_P1920:-42}; CRF_P1280=${CRF_P1280:-44}; CRF_KLUC=${CRF_KLUC:-44}
# t960: crf 45, jedna dlaždica AVIF (-tile-columns/-rows 0): dekóduje sa jedným vláknom, takže dekódovanie bloku počas
# skrolovania nevezme kreslenie všetky jadrá (10-bit a 4 dlaždice dávali na telefóne s 4× pomalším CPU snímky 67–83 ms);
# 960 px pri ~220 kB na blok mal na displeji 1170 px ostrejšie hrany než 1080 px pri rovnakých bajtoch (odovzdávka film2)
CRF_T960=${CRF_T960:-45}; OSTR_T960=${OSTR_T960-0x0.9+0.8+0.01}
# doostrenie blokov telefónu (výrez 720 px sa na displeji s hustotou 3 zväčšuje 1,6×): jemná neostrá maska pred kódovaním,
# Laplace 3,65 → 4,62 pri +1,5 % bajtov (o CRF vyššie); prázdne = bez doostrenia
OSTR_T=${OSTR_T-0x0.8+0.6+0.01}
# SADY obmedzí kódovanie na vybrané sady, KLUC_LEN=1 prekóduje len kľúčové snímky (napr. po zmene CRF_KLUC)
SADY=${SADY:-t960 t720 t540 p1920 p1280}; KLUC_LEN=${KLUC_LEN:-0}
KLIP="$ZDROJ/klip-4k.mp4"; [ -f "$KLIP" ] || KLIP="$ZDROJ/klip-720.mp4"
START="$ZDROJ/start-ulica.png"
FILM="node $WEB/zdroj/film.mjs"
cd "$PRACA"
echo "klip: $KLIP"

# 1. pohyb a výber snímok
[ -s pohyb.json ] || $FILM pohyb "$KLIP" > pohyb.json
$FILM plan pohyb.json "$N" "$W" > plan.json

# 2. medzisnímky 48/s: štyri úseky po 60 snímkach naraz; každý úsek berie o 2 snímky viac (minterpolate posledné
#    dve výstupné snímky úseku nevydá), z úseku sa berú indexy 2A..2B. Posledná snímka (480) je pôvodná snímka 240,
#    479 je priemer 478 a 480 (na konci klipu niet z čoho dopočítať).
if [ ! -s m48/0480.png ]; then
  mkdir -p m48
  for s in 0 1 2 3; do
    A=$((s * 60)); B=$((A + 60)); mkdir -p "seg$s"
    ffmpeg -v error -y -i "$KLIP" -vf "trim=start_frame=$A:end_frame=$((B + 3)),setpts=PTS-STARTPTS,scale=2880:1624:flags=lanczos,minterpolate=fps=48:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none" \
      -compression_level 2 -start_number $((2 * A)) "seg$s/%04d.png" &
  done
  wait
  for s in 0 1 2 3; do
    A=$((s * 60)); B=$((A + 60))
    for i in $(seq $((2 * A)) $((2 * B))); do f=$(printf '%04d.png' "$i"); [ -f "seg$s/$f" ] && mv -f "seg$s/$f" "m48/$f"; done
    rm -rf "seg$s"
  done
  ffmpeg -v error -y -i "$KLIP" -vf "select=eq(n\,240),scale=2880:1624:flags=lanczos" -frames:v 1 -compression_level 2 m48/0480.png
  convert m48/0478.png m48/0480.png -evaluate-sequence mean m48/0479.png
fi

# 2b. 4K pás pre t960 (len keď je 4K klip): x 1440–3200 × 2160, rovnaké úseky a rovnaké dopočítanie ako v kroku 2
if [[ " $SADY " == *" t960 "* ]] && [ "$KLIP" = "$ZDROJ/klip-4k.mp4" ] && [ ! -s m48t/0480.png ]; then
  mkdir -p m48t
  for s in 0 1 2 3; do
    A=$((s * 60)); B=$((A + 60)); mkdir -p "segt$s"
    ffmpeg -v error -y -i "$KLIP" -vf "trim=start_frame=$A:end_frame=$((B + 3)),setpts=PTS-STARTPTS,crop=1760:2160:1440:0,minterpolate=fps=48:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none" \
      -compression_level 1 -start_number $((2 * A)) "segt$s/%04d.png" &
  done
  wait
  for s in 0 1 2 3; do
    A=$((s * 60)); B=$((A + 60))
    for i in $(seq $((2 * A)) $((2 * B))); do f=$(printf '%04d.png' "$i"); [ -f "segt$s/$f" ] && mv -f "segt$s/$f" "m48t/$f"; done
    rm -rf "segt$s"
  done
  ffmpeg -v error -y -i "$KLIP" -vf "select=eq(n\,240),crop=1760:2160:1440:0" -frames:v 1 -compression_level 1 m48t/0480.png
  convert m48t/0478.png m48t/0480.png -evaluate-sequence mean m48t/0479.png
fi

# 3. ostrý štart zarovnaný na geometriu medzisnímok (4K → 2880: × 2880/3830)
if [ ! -s start-2880.png ]; then
  read -r A TX TY < <(node -e 'const k=2880/3830; console.log((1.424*k).toFixed(6), (1*k).toFixed(4), (-4*k).toFixed(4))')
  convert "$START" -virtual-pixel edge -filter Lanczos -define distort:viewport=2880x1624+0+0 \
    -distort AffineProjection "$A,0,0,$A,$TX,$TY" +repage -depth 8 start-2880.png
fi

# 4. výrezy všetkých snímok do štyroch sád (PNG)
mkdir -p s/t720 s/t540 s/p1920 s/p1280
node -e '
const p = require(process.argv[1]);
for (const o of p.snimky) {
  const k = String(o.k).padStart(3, "0"), src = o.src === "start" ? "start-2880.png" : o.src;
  const fs = require("fs");
  if (["t720", "t540", "p1920", "p1280"].every((d) => fs.existsSync(`s/${d}/${k}.png`))) continue;
  console.log([src, `${o.P.w}x${o.P.h}+${o.P.x}+${o.P.y}`, `${o.L.w}x${o.L.h}+${o.L.x}+${o.L.y}`, k].join(" "));
}' "$PRACA/plan.json" | xargs -r -P "$JOBS" -L 1 sh -c '
  convert "$0" -filter Lanczos \( +clone -crop "$1" +repage \( +clone -resize 540x1170! -write "s/t540/$3.png" +delete \) -resize 720x1560! -write "s/t720/$3.png" +delete \) \
    -crop "$2" +repage \( +clone -resize 1280x720! -write "s/p1280/$3.png" +delete \) -resize 1920x1080! "s/p1920/$3.png"'

# t960: výrez zo 4K pásu (afinná projekcia, Lanczos), snímka 0 priamo z ostrého start-ulica.png
if [[ " $SADY " == *" t960 "* ]] && [ -s m48t/0480.png ]; then
  mkdir -p s/t960
  $FILM vyrez4k "$PRACA/plan.json" 960 2080 | while read -r src aff k; do [ -s "s/t960/$k.png" ] || echo "$src $aff $k"; done |
    START="$START" xargs -r -P "$JOBS" -L 1 sh -c '[ "$0" = start ] && s="$START" || s="$0"; convert "$s" -virtual-pixel edge -filter Lanczos -define distort:viewport=960x2080+0+0 -distort AffineProjection "$1" +repage -depth 8 "s/t960/$2.png"'
fi

# 4b. nápis    v klipe je písmo na bočnici auta pokrivené už od snímky 1 (v zdroji „STAVEDNINY“); ostrá bočnica zo snímky 0
#              (start-ulica.png) sa sleduje homografiou a vkladá do snímok 1–28 (napis.mjs: celá bočnica do 14, potom len
#              panel STAVEBNINY RICHTÁRIK do 22, prelínanie do 28) v sade t960 (bez 4K klipu v t720); ostatné sady majú
#              tú istú geometriu, zmenená oblasť sa do nich len prenesie (t720/t540 zmenšením, p1920 mierkou a posunom
#              podľa P.x snímky, p1280 zmenšením p1920)
napis_prenes() {   # zdroj cieľ [p = výrez telefónu → záber počítača podľa P.x, inak zmenšenie na rozmer cieľa]
  local z=$1 c=$2 g zw zh; g=$(identify -format %wx%h "s/$c/000.png"); zw=$(identify -format %w "s/$z/000.png"); zh=$(identify -format %h "s/$z/000.png")
  for k in $(seq -f %03g 1 28); do
    local geo=(-filter Lanczos -resize "${g}!")
    if [ "${3:-}" = p ]; then
      local aff; aff=$(node -e 'const [f,k,w,h]=process.argv.slice(1),p=require(f).snimky[+k];console.log([750/w*2/3,0,0,1624/h*2/3,p.P.x*2/3,-2*2/3].map(v=>v.toFixed(6)).join(","))' "$PRACA/plan.json" "$((10#$k))" "$zw" "$zh")
      geo=(-virtual-pixel black -define "distort:viewport=${g}+0+0" -filter Lanczos -distort AffineProjection "$aff")
    fi
    # zmenená oblasť = rozdiel novej (s/) a pôvodnej (s0/) snímky zdrojovej sady
    convert "s/$z/$k.png" "s0/$z/$k.png" -compose difference -composite -colorspace gray -threshold 1.5% -morphology Close Disk:4 -morphology Dilate Disk:4 -blur 0x3 "${geo[@]}" "n/m.png"
    convert "s/$c/$k.png" \( "s/$z/$k.png" "${geo[@]}" \) "n/m.png" -composite -depth 8 "s/$c/$k.png"
  done
}
if [ ! -f s/.napis ]; then
  mkdir -p n s0
  Z=t960; Q="203,1248;940,1378;925,1540;203,1370"; QA="203,1248;511,1302;507,1432;203,1370"; SK=1
  if [ ! -s s/t960/000.png ]; then Z=t720; SK=0.75
    Q=$(node -e 'console.log(process.argv[1].split(";").map(p=>p.split(",").map(v=>(v*0.75).toFixed(1)).join(",")).join(";"))' "$Q")
    QA=$(node -e 'console.log(process.argv[1].split(";").map(p=>p.split(",").map(v=>(v*0.75).toFixed(1)).join(",")).join(";"))' "$QA"); fi
  for d in t960 t720 t540 p1920 p1280; do [ -d "s/$d" ] && { mkdir -p "s0/$d"; for k in $(seq -f %03g 1 28); do cp "s/$d/$k.png" "s0/$d/$k.png"; done; }; done
  SK=$SK node "$WEB/zdroj/napis.mjs" "s/$Z" "n/$Z" "$Q" 14 17 "$QA" 22 28 14
  for k in $(seq -f %03g 1 28); do cp "n/$Z/$k.png" "s/$Z/$k.png"; done
  if [ "$Z" = t960 ]; then napis_prenes t960 t720; fi
  napis_prenes "$Z" t540
  napis_prenes "$Z" p1920 p
  napis_prenes p1920 p1280
  touch s/.napis
fi

# 4c. posledný záber (img/film/posl-*.avif): posledná snímka filmu je pôvodná snímka klipu h = KONIEC_H (h/2 v 24 snímkach/s)
export KONIEC_H=${KONIEC_H:-408}
mkdir -p "$OUT" posl
PK=$(node -e 'const p=require(process.argv[1]);console.log(p.snimky.findLastIndex((o)=>o.h<=+process.argv[2]))' "$PRACA/plan.json" "$KONIEC_H")
PH=$(printf '%04d' "$KONIEC_H")
avifp() { ffmpeg -v error -y -i "$1" -c:v libaom-av1 -still-picture 1 -crf "$2" -cpu-used 4 -row-mt 1 -tile-columns 1 -tile-rows 1 -pix_fmt yuv420p "$3"; }
# telefón: ten istý výrez ako t960 (vyrez4k) zo 4K pásu, inak snímka t720 zväčšená na 960
if [ -s "m48t/$PH.png" ]; then
  read -r _ AFF _ < <($FILM vyrez4k "$PRACA/plan.json" 960 2080 | awk -v k="$(printf '%03d' "$PK")" '$3==k')
  convert "m48t/$PH.png" -virtual-pixel edge -filter Lanczos -define distort:viewport=960x2080+0+0 -distort AffineProjection "$AFF" +repage -depth 8 posl/t-zaklad.png
else convert "s/t720/$(printf '%03d' "$PK").png" -filter Lanczos -resize 960x2080! posl/t-zaklad.png; fi
convert posl/t-zaklad.png -unsharp 0x3+0.35+0.02 -unsharp 0x0.9+0.9+0.01 posl/t960.png
convert posl/t-zaklad.png -filter Lanczos -resize 720x1560! -unsharp 0x2.3+0.35+0.02 -unsharp 0x0.75+0.85+0.01 posl/t720.png
# širší záber: výrez L zo 4K snímky (súradnice plánu sú v mierke 2880/3830), inak snímka p1920
if [ "$KLIP" = "$ZDROJ/klip-4k.mp4" ]; then
  ffmpeg -v error -y -i "$KLIP" -vf "select=eq(n\,$((KONIEC_H / 2)))" -frames:v 1 -compression_level 1 posl/4k.png
  AFFP=$(node -e 'const p=require(process.argv[1]).snimky[+process.argv[2]],k=2880/3830,sx=1920/(p.L.w/k),sy=1080/(p.L.h/k);console.log([sx,0,0,sy,-(p.L.x/k)*sx,-(p.L.y/k)*sy].map((v)=>+v.toFixed(6)).join(","))' "$PRACA/plan.json" "$PK")
  convert posl/4k.png -virtual-pixel edge -filter Lanczos -define distort:viewport=1920x1080+0+0 -distort AffineProjection "$AFFP" +repage -depth 8 posl/p-zaklad.png
else cp "s/p1920/$(printf '%03d' "$PK").png" posl/p-zaklad.png; fi
convert posl/p-zaklad.png -unsharp 0x3+0.3+0.02 -unsharp 0x0.8+0.7+0.01 posl/p1920.png
convert posl/p-zaklad.png -filter Lanczos -resize 1280x720! -unsharp 0x2.3+0.3+0.02 -unsharp 0x0.75+0.75+0.01 posl/p1280.png
avifp posl/t960.png 20 "$OUT/posl-t960.avif"; avifp posl/t720.png 20 "$OUT/posl-t720.avif"
avifp posl/p1920.png 24 "$OUT/posl-p1920.avif"; avifp posl/p1280.png 24 "$OUT/posl-p1280.avif"
[ "${LEN_POSL:-0}" = 1 ] && exit 0   # len posledný záber

[ "${LEN_VYREZY:-0}" = 1 ] && exit 0   # kontrola výrezov pred kódovaním

# 5. balíky AVIF
mkdir -p "$OUT" b
avif() { ffmpeg -v error -y -i "$1" -c:v libaom-av1 -still-picture 1 -crf "$2" -cpu-used 4 -row-mt 1 -tile-columns "${DLAZ:-1}" -tile-rows "${DLAZ:-1}" -pix_fmt yuv420p "$3"; }
for sada in $SADY; do
  DLAZ=1; [ "$sada" = t960 ] && DLAZ=0
  case $sada in t960) CRF=$CRF_T960;; t720) CRF=$CRF_T720;; t540) CRF=$CRF_T540;; p1920) CRF=$CRF_P1920;; p1280) CRF=$CRF_P1280;; esac
  # kľúčové snímky (0, 8, 16, …) v polovičnom rozlíšení, mriežka 6×3
  keys=(); for k in $(seq 0 8 $((N - 1))); do keys+=("s/$sada/$(printf '%03d' "$k").png"); done
  convert \( "${keys[@]:0:6}" +append \) \( "${keys[@]:6:6}" +append \) \( "${keys[@]:12:6}" +append \) -append -filter Lanczos -resize 50% "b/$sada-k.png"
  avif "b/$sada-k.png" "$CRF_KLUC" "$OUT/$sada-k.avif" &
  # bloky po 8 snímkach, mriežka 4×2
  [ "$KLUC_LEN" = 1 ] && continue
  for b in $(seq 0 $((N / 8 - 1))); do
    f=(); for j in $(seq 0 7); do f+=("s/$sada/$(printf '%03d' $((8 * b + j))).png"); done
    ostr=(); [ -n "$OSTR_T" ] && [ "${sada:0:1}" = t ] && ostr=(-unsharp "$OSTR_T")
    [ "$sada" = t960 ] && ostr=(); [ "$sada" = t960 ] && [ -n "$OSTR_T960" ] && ostr=(-unsharp "$OSTR_T960")
    convert \( "${f[@]:0:4}" +append \) \( "${f[@]:4:4}" +append \) -append "${ostr[@]}" "b/$sada-$b.png"
    avif "b/$sada-$b.png" "$CRF" "$OUT/$sada-$(printf '%02d' "$b").avif" &
    while [ "$(jobs -rp | wc -l)" -ge "$JOBS" ]; do wait -n; done
  done
done
wait

# prvé obrazy: snímka 0 (ostrý štart) v lepšej kvalite, najviac 150 kB; hľadá najlepšiu kvalitu, ktorá sa zmestí
DLAZ=1
for sada in $SADY; do
  for crf in 18 20 22 24 26 28 30 32 34 36 38 40 42 44 46; do
    avif "s/$sada/000.png" "$crf" "$OUT/prvy-$sada.avif"; [ "$(stat -c %s "$OUT/prvy-$sada.avif")" -le 150000 ] && break
  done
  [ "$sada" = p1920 ] && continue   # záloha WebP (prehliadače bez AVIF) má na počítači len 1280 px: 1920 sa do 150 kB nezmestí
  for q in 90 86 82 78 74 70 66 62 58 54 50 46 42 38 34 30; do
    ffmpeg -v error -y -i "s/$sada/000.png" -c:v libwebp -quality "$q" -compression_level 6 "$OUT/prvy-$sada.webp"
    [ "$(stat -c %s "$OUT/prvy-$sada.webp")" -le 150000 ] && break
  done
done
# náhľad pre zdieľanie (og:image) 1200×630 z prvého obrazu počítača
convert s/p1920/000.png -filter Lanczos -resize 1200x675 -gravity center -crop 1200x630+0+10 +repage -strip -quality 84 "$WEB/img/uvod/og.jpg"

# 6. údaje pre stránku
$FILM data plan.json > data.json
$FILM bg s/t720/000.png s/p1920/000.png plan.json > bg.txt
grep -q 'id="film-data"' "$WEB/index.html" && $FILM vloz "$WEB/index.html" data.json bg.txt

echo "veľkosti (B):"
for sada in t960 t720 t540 p1920 p1280; do
  [ -f "$OUT/prvy-$sada.avif" ] || continue
  s=$(cat "$OUT/$sada"-*.avif | wc -c); p=$(stat -c %s "$OUT/prvy-$sada.avif")
  echo "  $sada: film $s, prvý obraz $p, spolu $((s + p))"
done
