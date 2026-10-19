#!/usr/bin/env bash
# Časy strihov a hustota záberov v krátkom videu (referencia z TikToku alebo náš hotový short).
#
#   bash strihy.sh video.mp4 [priečinok] [--prah 0.25] [--zlucit 0.3] [--okno 5] [--harok]
#
# --prah    citlivosť detekcie zmeny obrazu (ffmpeg select gt(scene,prah)); 0.25 našlo tvrdé strihy,
#           0.12 nájde aj prelínania a zmeny len v časti obrazu (overené na videách V1 až V3, 2026-10-17)
# --zlucit  detekcie bližšie ako toľko sekúnd sú jedna udalosť (záblesk sa rozpadne na 3 až 6 snímok)
# --okno    dĺžka okna v sekundách pre hustotu strihov
# --harok   hárok: prostredná snímka každého záberu (číslo dlaždice = číslo záberu), na ručnú kontrolu
#
# Výstup do priečinka (predvolene vedľa videa, <meno>-strihy/): detekcie.txt (čas a skóre každej detekcie),
# zabery.csv (číslo;od;do;dĺžka v sekundách), suhrn.txt (to isté, čo vypíše na obrazovku), voliteľne harok.jpg.
# Čísla s desatinnou bodkou. Ffmpeg strih nájde len pri zmene celého obrazu; zmenu v časti obrazu
# (delená obrazovka, karta nad videom) treba overiť na hárku. Detekcia nie je počet záberov, kým ju nepozrieš.
#
# Návratové kódy: 0 v poriadku, 1 video sa nedá prečítať alebo chýba ffmpeg, 2 zlé argumenty.
set -euo pipefail
export LC_ALL=C

pouzitie() { sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'; }

VIDEO="" ; OUT="" ; PRAH=0.25 ; ZLUCIT=0.3 ; OKNO=5 ; HAROK=0
while [ $# -gt 0 ]; do
  case "$1" in
    --prah|--zlucit|--okno) [ $# -ge 2 ] || { echo "voľba $1 potrebuje hodnotu" >&2; exit 2; } ;;
  esac
  case "$1" in
    --prah) PRAH="${2:-}"; shift 2 ;;
    --zlucit) ZLUCIT="${2:-}"; shift 2 ;;
    --okno) OKNO="${2:-}"; shift 2 ;;
    --harok) HAROK=1; shift ;;
    -h|--help) pouzitie; exit 0 ;;
    -*) echo "neznáma voľba: $1" >&2; pouzitie >&2; exit 2 ;;
    *) if [ -z "$VIDEO" ]; then VIDEO="$1"; elif [ -z "$OUT" ]; then OUT="$1"; else echo "priveľa argumentov: $1" >&2; exit 2; fi; shift ;;
  esac
done
[ -n "$VIDEO" ] || { pouzitie >&2; exit 2; }
[ -f "$VIDEO" ] || { echo "súbor neexistuje: $VIDEO" >&2; exit 2; }
for x in "$PRAH" "$ZLUCIT" "$OKNO"; do
  [[ "$x" =~ ^[0-9]+(\.[0-9]+)?$ ]] || { echo "číslo očakávané, prišlo: $x" >&2; exit 2; }
done
awk -v o="$OKNO" 'BEGIN { exit !(o > 0) }' || { echo "--okno musí byť väčšie ako 0" >&2; exit 2; }

FF=$(command -v ffmpeg || true)
if [ -z "$FF" ]; then
  FF=$(python3 -I -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())' 2>/dev/null || true)
fi
[ -n "$FF" ] || { echo "chýba ffmpeg (ani v PATH, ani imageio_ffmpeg)" >&2; exit 1; }

meno=$(basename "${VIDEO%.*}")
[ -n "$OUT" ] || OUT="$(dirname "$VIDEO")/${meno}-strihy"
mkdir -p "$OUT"

# dĺžka a rozmer z výpisu ffmpeg -i (ffprobe nemusí byť k dispozícii)
info=$("$FF" -hide_banner -i "$VIDEO" 2>&1 || true)
DUR=$(printf '%s\n' "$info" | sed -n 's/.*Duration: \([0-9]*\):\([0-9]*\):\([0-9.]*\).*/\1 \2 \3/p' | head -1 | awk '{ printf "%.3f", $1*3600 + $2*60 + $3 }')
[ -n "$DUR" ] || { echo "video sa nedá prečítať: $VIDEO" >&2; exit 1; }
ROZMER=$(printf '%s\n' "$info" | grep -m1 -o 'Video: .*' | grep -o ', [0-9]\{2,5\}x[0-9]\{2,5\}' | head -1 | tr -d ', ' || true)

# 1. detekcie: čas a skóre zmeny obrazu
"$FF" -hide_banner -nostats -i "$VIDEO" -an \
  -vf "select='gt(scene,$PRAH)',metadata=print:key=lavfi.scene_score" -f null - 2>&1 \
  | awk '/pts_time:/ { for (i = 1; i <= NF; i++) if ($i ~ /^pts_time:/) { split($i, a, ":"); t = a[2] } }
         /lavfi.scene_score=/ { split($0, b, "lavfi.scene_score="); printf "%.3f %.3f\n", t, b[2] }' \
  > "$OUT/detekcie.txt"

# 2. zlúčenie blízkych detekcií, zábery, štatistika, hustota
awk -v dur="$DUR" -v zl="$ZLUCIT" -v okno="$OKNO" -v prah="$PRAH" -v video="$VIDEO" -v rozmer="$ROZMER" \
    -v csv="$OUT/zabery.csv" '
  { det++; if (n == 0 || $1 - posl > zl) { n++; cut[n] = $1 } ; posl = $1 }
  END {
    # hranice záberov: 0, strihy, koniec (strih v prvých 0,05 s nie je strih)
    m = 0; hr[m] = 0
    for (i = 1; i <= n; i++) if (cut[i] > 0.05 && cut[i] < dur - 0.05) { m++; hr[m] = cut[i] }
    m++; hr[m] = dur
    print "číslo;od;do;dĺžka" > csv
    for (i = 1; i <= m; i++) {
      d[i] = hr[i] - hr[i-1]; sum += d[i]
      printf "%d;%.2f;%.2f;%.2f\n", i, hr[i-1], hr[i], d[i] >> csv
    }
    # medián (triedenie vkladaním, záberov je málo)
    for (i = 1; i <= m; i++) s[i] = d[i]
    for (i = 2; i <= m; i++) { v = s[i]; j = i - 1; while (j > 0 && s[j] > v) { s[j+1] = s[j]; j-- } ; s[j+1] = v }
    med = (m % 2) ? s[(m+1)/2] : (s[m/2] + s[m/2+1]) / 2
    printf "video: %s (%s, %.2f s)\n", video, rozmer, dur
    printf "prah %s, zlúčené do %s s: %d detekcií, %d udalostí, %d strihov vnútri videa\n", prah, zl, det, n, m - 1
    printf "záberov %d, priemer %.2f s, medián %.2f s, najkratší %.2f s, najdlhší %.2f s\n", m, sum / m, med, s[1], s[m]
    printf "prvá zmena obrazu: %s\n", (m > 1) ? sprintf("%.2f s", hr[1]) : "žiadna"
    printf "strihov za minútu: %.1f\n", (m - 1) * 60 / dur
    printf "strihy (s):"; for (i = 1; i < m; i++) printf " %.2f", hr[i]; printf "\n"
    printf "hustota po %s s:", okno
    k = 0
    for (t = 0; t < dur - 0.001; t += okno) {
      c = 0; for (i = 1; i < m; i++) if (hr[i] >= t && hr[i] < t + okno) c++
      printf " %g-%g:%d", t, (t + okno < dur ? t + okno : dur), c
    }
    printf "\n"
    # najdlhšie zábery bez zmeny (pravidlo receptu: nič nad 3,5 s bez zmeny)
    dl = ""; for (i = 1; i <= m; i++) if (d[i] > 3.5) dl = dl sprintf(" %d (%.2f až %.2f s)", i, hr[i-1], hr[i])
    printf "zábery nad 3,5 s:%s\n", (dl == "") ? " žiadne" : dl
  }' "$OUT/detekcie.txt" | tee "$OUT/suhrn.txt"

# 3. voliteľný hárok: prostredná snímka každého záberu
if [ "$HAROK" = 1 ]; then
  tmp="$OUT/.harok"; rm -rf "$tmp"; mkdir -p "$tmp"
  i=0
  tail -n +2 "$OUT/zabery.csv" | while IFS=';' read -r c od do dl; do
    t=$(awk -v a="$od" -v b="$do" 'BEGIN { printf "%.3f", (a + b) / 2 }')
    "$FF" -nostdin -v error -y -ss "$t" -i "$VIDEO" -frames:v 1 -vf "scale=180:-2" "$tmp/z$(printf '%03d' "$c").png"
  done
  pocet=$(ls "$tmp" | wc -l)
  stlpce=8; riadky=$(( (pocet + stlpce - 1) / stlpce ))
  "$FF" -v error -y -framerate 1 -i "$tmp/z%03d.png" -vf "tile=${stlpce}x${riadky}:padding=4:margin=4" -frames:v 1 "$OUT/harok.jpg"
  rm -rf "$tmp"
  echo "hárok: $OUT/harok.jpg ($pocet záberov, poradie zľava doprava, zhora nadol)"
fi
echo "súbory: $OUT/detekcie.txt, $OUT/zabery.csv, $OUT/suhrn.txt"
