#!/usr/bin/env bash
# Overenie auditu „čierne okná“ – sada nahrávok pred/po oprave (server: python3 -m http.server 8359 v koreni stromu).
#   bash beh.sh [prípona]      -> runs/<meno><prípona>/over.json, súhrn na výstupe
# Film: rozhoduje „film prázdne plátno (WebGL)“ (pravda z clear/draw), nie pixely (screencast pri SwiftShaderi mešká).
# Pokojná verzia: rozhodujú pixely + snímky v kluc/ (tmavé časti fotiek sú falošné nálezy, pozri plochu a snímku).
cd "$(dirname "$0")"
S=${1:-}
run() { n=$1; shift; timeout 600 node over.mjs --name="$n$S" "$@" > /dev/null 2>&1; python3 over.py "runs/$n$S" | head -14; }
run co1-p1-f4-cpu1-cold --dev=phone --dpr=1 --net=fast4g --cpu=1 --q="film=on&uvod=off" --cache=cold --scen=skok --ciele="#sluzby,#vstup-dnu,PATA,HORE"
run co1-p1-n0-cpu1-warm --dev=phone --dpr=1 --net=none --cpu=1 --q="film=on&uvod=off" --cache=warm --scen=skok --ciele="#sluzby,#vstup-dnu,#galeria,PATA,HORE"
run co5-p1-f4-cpu1-cold-svih --dev=phone --dpr=1 --net=fast4g --cpu=1 --q="film=on&uvod=off" --cache=cold --scen=svih
run co5-p1-n0-cpu1-warm-svih --dev=phone --dpr=1 --net=none --cpu=1 --q="film=on&uvod=off" --cache=warm --scen=svih
python3 pruzina.py "runs/co5-p1-f4-cpu1-cold-svih$S"; python3 pruzina.py "runs/co5-p1-n0-cpu1-warm-svih$S"
run co2-p3-f4-cpu4-warm-svih --dev=phone --net=fast4g --cpu=4 --q="film=off" --cache=warm --scen=svih
run co2-p3-f4-cpu4-warm-skok --dev=phone --net=fast4g --cpu=4 --q="film=off" --cache=warm --scen=skok --ciele="#sluzby,#vstup-dnu,#galeria,#tim"
run co2-p3-f4-cpu4-cold-svih --dev=phone --net=fast4g --cpu=4 --q="film=off" --cache=cold --scen=svih
run co3-p3-s4-cpu4-cold-skok --dev=phone --net=slow4g --cpu=4 --q="film=off" --cache=cold --scen=skok --ciele="#sluzby,#tim,#galeria,#kontakt" --wait=6000
run co4-d-def-s4-cpu4-cold-uvod --dev=desk --net=slow4g --cpu=4 --q="" --cache=cold --scen=uvod --uvodms=9000
node odhal.mjs; node pata-geo.mjs; node pata-shot.mjs
