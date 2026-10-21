#!/bin/bash
SP=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad
T=$SP/barber/opravy/D1/kontrola-kod/pokus-21-10/testy
export NODE_PATH=/opt/node22/lib/node_modules
cd $SP/hs2/barbershop-30
: > $T/prehlad3.txt
run() { local name=$1; shift; local s=$(date +%s); timeout 1500 "$@" > "$T/$name.txt" 2>&1; echo "$name exit=$? $(( $(date +%s) - s )) s" >> $T/prehlad3.txt; }
run uvod-shot node source/tools/uvod-shot.mjs --out=$T/uvod
run uvod-meranie node source/tools/uvod-meranie.mjs --out=$T/meranie
run uvod-zhoda python3 -I source/tools/uvod-zhoda.py $T/meranie
run karty-shot node source/tools/karty-shot.mjs --wait=5000 --out=$T/karty
run strih-shot node source/tools/strih-shot.mjs --out=$T/strihy
echo hotovo >> $T/prehlad3.txt
