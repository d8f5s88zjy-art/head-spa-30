#!/bin/sh
# Oprava 7 – opakovateľný beh tried STAV 3 a generátorov nad stromom:  sh beh.sh <výstup.txt> [strom/barbershop-30]
S5=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/lahky-telefon/v2/stavba-v5
R=${2:-/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-recepcia/barbershop-30}
OUT=$1
cd $S5
{ echo "# strom $R, $(date -u +%FT%TZ), load $(cut -d' ' -f1-3 /proc/loadavg)"
  echo "## sondy tried STAV 3 (o7/sondy-p7.txt) – node o7/skusaj.mjs"; node o7/skusaj.mjs $R < o7/sondy-p7.txt
  echo "## kontrola 5: k5/sondy-k5.txt + sondy-k5b.txt"; cat k5/sondy-k5.txt k5/sondy-k5b.txt | node o7/skusaj.mjs $R
  echo "## skeptik 2: node skeptik2/n1-dlzka.mjs (vlastné orákulum: holá cena)"; node skeptik2/n1-dlzka.mjs $R
  echo "## kontrola 5: node k5/dlzka-k5.mjs (vlastné orákulum: odpoveď cena-dlhe)"; node k5/dlzka-k5.mjs $R
  echo "## kontrola 4: node k4/trieda-k4.mjs"; node k4/trieda-k4.mjs $R | grep -E '^[AB] '
  echo "## CSS: výška volieb a tlačidiel, formulár"; grep -noE '\.rc-btn\{[^}]*\}|\.rc-chip,\.rc-btn\{min-height:[0-9]+px|\.rc-form[^{]*\{[^}]*\}' $R/assets/recepcia.css
  echo "## prvá otázka v novom procese (studený JIT), 3 procesy"; for i in 1 2 3; do node o7/prva-otazka.mjs $R sk 'Koľko stojí strih a brada pre syna v sobotu?'; done
} > $OUT 2>&1
