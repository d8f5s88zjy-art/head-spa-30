#!/bin/sh
# Overenie etapy: sh over-stav.sh <n>  (strom už obsahuje etapu n zo stavy.py)
S5=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/lahky-telefon/v2/stavba-v5
R=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-recepcia/barbershop-30
n=$1; cd $S5/o6
{ echo "## etapa S$n, $(date -u +%FT%TZ)"
  (cd $R && node --test source/tools/recepcia-test.mjs 2>&1 | grep -E "^# (tests|pass|fail)|^not ok|gzip: (recepcia|sk|uk)")
  (cd $R && node --test source/tools/recepcia-kombinacie-test.mjs 2>&1 | grep -E "^# (tests|pass|fail)|^not ok|otázok")
} > stav$n.txt
for s in A B C2 D1 D2; do node $S5/slepe/spust-slepe-v2.mjs $R $S5/slepe/sada-$s.jsonl > stav$n-$s.jsonl; done
python3 -I zarad.py stav$n-A.jsonl stav$n-B.jsonl stav$n-C2.jsonl stav$n-D1.jsonl stav$n-D2.jsonl | grep SPOLU >> stav$n.txt
cat stav$n.txt
