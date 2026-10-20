#!/bin/bash
# D1 – opakovanie testov, ktoré v testy2.sh spadli na zaťaženom kontajneri (súbežne bežal iný prehliadač: zavretý prehliadač, timeout snímky).
SP=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad
W=$SP/hs2/barbershop-30; T=$SP/barber/opravy/D1/impl/testy2
cd $W
export NODE_PATH=/opt/node22/lib/node_modules
run() { local name=$1; shift; echo "== $(date +%T) $name (záťaž $(cut -d' ' -f1-3 /proc/loadavg), iné prehliadače $(pgrep -c -f 'headless_shell|chrome' ))"; timeout 1800 "$@" > "$T/$name.txt" 2>&1; echo "   exit $?"; }
run app-smoke node source/tools/app-smoke.mjs
run i18n-test node source/tools/i18n-test.mjs
run uvod-shot node source/tools/uvod-shot.mjs --out=$T/uvod
run karty-shot node source/tools/karty-shot.mjs --wait=5000 --out=$T/karty
echo "== $(date +%T) koniec testov"
