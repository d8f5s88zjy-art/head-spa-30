#!/usr/bin/env bash
# Druhá sada overenia (2026-10-20): rozklad čakania filmu pri DPR 3 (casovac.js), A/B dekódovania záloh (ab-sync.js),
# prvý obraz úvodu (CO-4). Server: python3 -m http.server 8312 v koreni stromu.   bash beh2.sh
cd "$(dirname "$0")"
run() { n=$1; shift; timeout 900 node over2.mjs --name="$n" "$@" > "runs-$n.log" 2>&1; python3 over2.py "runs/$n" > "runs/$n.txt" 2>&1; head -3 "runs/$n.txt"; [ -f "runs/$n/cas.json" ] && python3 rozklad-v.py "runs/$n" > "runs/$n.rozklad.txt" 2>&1; }
run r1-p3-f4-cpu1-cold-film --dev=phone --net=fast4g --cpu=1 --q="film=on&uvod=off" --cache=cold --scen=skok --ciele="#sluzby,#vstup-dnu,#galeria,PATA,HORE,#tim,LOGO" --wait=6000 --inject=casovac.js
run r2-p3-n0-cpu1-warm-film --dev=phone --net=none --cpu=1 --q="film=on&uvod=off" --cache=warm --scen=skok --ciele="#sluzby,#vstup-dnu,#galeria,PATA,HORE,#tim,LOGO" --wait=6000 --inject=casovac.js
run r3-p3-f4-cpu4-warm-svih-sync --dev=phone --net=fast4g --cpu=4 --q="film=off" --cache=warm --scen=svih --inject=ab-sync.js
run r4-p3-f4-cpu4-warm-skok-async --dev=phone --net=fast4g --cpu=4 --q="film=off" --cache=warm --scen=skok --ciele="#sluzby,#vstup-dnu,#galeria,#tim"
run r5-p3-f4-cpu4-warm-skok-sync --dev=phone --net=fast4g --cpu=4 --q="film=off" --cache=warm --scen=skok --ciele="#sluzby,#vstup-dnu,#galeria,#tim" --inject=ab-sync.js
run r6-p3-f4-cpu4-warm-svih --dev=phone --net=fast4g --cpu=4 --q="film=off" --cache=warm --scen=svih
run r7-p3-f4-cpu4-cold-uvod-def --dev=phone --net=fast4g --cpu=4 --q="" --cache=cold --scen=uvod --uvodms=6000
run r8-p3-s4-cpu4-cold-uvod-off --dev=phone --net=slow4g --cpu=4 --q="film=off" --cache=cold --scen=uvod --uvodms=8000
run r9-d-f4-cpu4-cold-uvod-def --dev=desk --net=fast4g --cpu=4 --q="" --cache=cold --scen=uvod --uvodms=8000
echo HOTOVO2
