#!/bin/sh
# Opakovateľný beh oprava 5: triedy kontroly 4, sondy, otázky skeptika, slepé sady.  sh beh.sh <výstupná predpona>
S5=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/lahky-telefon/v2/stavba-v5
R=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-recepcia/barbershop-30
P=${1:-po}
cd $S5
{ echo "# HEAD $(git -C $R rev-parse --short HEAD) + pracovný strom ($(git -C $R status --short | wc -l) zmenených), $(date -u +%FT%TZ)"
  echo "## node k4/trieda-k4.mjs"; node k4/trieda-k4.mjs $R
  echo "## sondy-k4c (V1)"; node k1-skusaj.mjs $R < k4/sondy-k4c.txt
  echo "## sondy-k4b (V2–V5, S1)"; node k1-skusaj.mjs $R < k4/sondy-k4b.txt
  echo "## skeptik/otazky.txt"; node k1-skusaj.mjs $R < skeptik/otazky.txt
  echo "## skeptik/otazky2.txt"; node k1-skusaj.mjs $R < skeptik/otazky2.txt
} > o5/$P.txt 2>&1
for s in A B C2; do node slepe/spust-slepe.mjs $R slepe/sada-$s.jsonl > o5/$P-$s.jsonl; done
cd o5 && python3 -I hodnot.py $P-A.jsonl $P-B.jsonl $P-C2.jsonl > $P-hodnotenie.txt
grep -E '^[AB] ' $P.txt; grep -E '^(SPOLU|po|pred)' $P-hodnotenie.txt
