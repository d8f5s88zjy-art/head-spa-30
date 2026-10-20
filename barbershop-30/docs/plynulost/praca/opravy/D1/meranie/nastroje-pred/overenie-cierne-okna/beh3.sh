#!/usr/bin/env bash
# Tretia sada: A/B decoding=sync pre prvý obraz úvodu (CO-4), švih cez tím a cenník (CO-6), čas rozbalenia záloh.
cd "$(dirname "$0")"
run() { n=$1; shift; timeout 900 node over2.mjs --name="$n" "$@" > "runs-$n.log" 2>&1; python3 over2.py "runs/$n" > "runs/$n.txt" 2>&1; head -3 "runs/$n.txt"; }
run r10-d-f4-cpu4-cold-uvod-def-sync --dev=desk --net=fast4g --cpu=4 --q="" --cache=cold --scen=uvod --uvodms=8000 --inject=ab-sync.js
run r11-d-f4-cpu4-cold-uvod-off --dev=desk --net=fast4g --cpu=4 --q="film=off" --cache=cold --scen=uvod --uvodms=8000
run r12-d-f4-cpu4-cold-uvod-def-b --dev=desk --net=fast4g --cpu=4 --q="" --cache=cold --scen=uvod --uvodms=8000
echo "== CO-6 švih (cache)"; timeout 600 node odhal-svih.mjs --cache=warm
echo "== CO-6 švih (prvá návšteva)"; timeout 600 node odhal-svih.mjs --cache=cold
echo "== rozbalenie"; timeout 300 node dekod-cas.mjs
echo HOTOVO3
