#!/bin/sh
# Opakovateľný beh opravy 6 nad stromom (aj nad kópiou aeaafb7 v o6/strom-pred):  sh beh.sh <predpona> [strom/barbershop-30]
S5=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/lahky-telefon/v2/stavba-v5
R=${2:-/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-recepcia/barbershop-30}
P=${1:-po}
cd $S5
{ echo "# strom $R, $(date -u +%FT%TZ)"
  echo "## node k4/trieda-k4.mjs"; node k4/trieda-k4.mjs $R
  echo "## sondy W, D, M, Z (o6/sondy-w-d.txt)"; node k1-skusaj.mjs $R < o6/sondy-w-d.txt
  echo "## skeptik/otazky.txt"; node k1-skusaj.mjs $R < skeptik/otazky.txt
  echo "## skeptik/otazky2.txt"; node k1-skusaj.mjs $R < skeptik/otazky2.txt
} > o6/$P.txt 2>&1
for s in A B C2 D1 D2; do node slepe/spust-slepe-v2.mjs $R slepe/sada-$s.jsonl > o6/$P-$s.jsonl; done
cd o6 && python3 -I zarad.py $P-A.jsonl $P-B.jsonl $P-C2.jsonl $P-D1.jsonl $P-D2.jsonl > $P-zarad.txt
grep -E '^[AB] ' $P.txt; grep SPOLU $P-zarad.txt
