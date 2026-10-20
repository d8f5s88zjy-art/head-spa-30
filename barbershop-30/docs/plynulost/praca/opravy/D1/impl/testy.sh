#!/bin/bash
# D1 – testy z barbershop-30/source/tools (PLAN časť 3) na HEAD pracovného stromu, postupne (jeden prehliadač naraz).
SP=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad
W=$SP/hs2/barbershop-30; T=$SP/barber/opravy/D1/impl/testy
mkdir -p $T/uvod $T/meranie $T/karty $T/strihy
cd $W
export NODE_PATH=/opt/node22/lib/node_modules
run() { local name=$1; shift; echo "== $(date +%T) $name (záťaž $(cut -d' ' -f1-3 /proc/loadavg))"; timeout 1800 "$@" > "$T/$name.txt" 2>&1; echo "   exit $?"; }
run uvod-shot node source/tools/uvod-shot.mjs --out=$T/uvod
run uvod-meranie node source/tools/uvod-meranie.mjs --out=$T/meranie
run uvod-zhoda python3 -I source/tools/uvod-zhoda.py $T/meranie
run karty-shot node source/tools/karty-shot.mjs --wait=5000 --out=$T/karty
run strih-shot node source/tools/strih-shot.mjs --out=$T/strihy
echo "== $(date +%T) koniec testov"
