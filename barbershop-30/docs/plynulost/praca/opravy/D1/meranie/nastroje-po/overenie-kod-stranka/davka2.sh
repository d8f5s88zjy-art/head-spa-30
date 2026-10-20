#!/bin/bash
# Overenie auditu kod-stranka – dávka 2 (A/B skrolov), spúšťa sa po dávke 1
cd "$(dirname "$0")"
until grep -q "koniec davky 1" davka1.log 2>/dev/null; do sleep 3; done
echo "== $(date +%T) K10 scrollcache (nad premenne)"; bash ab3.sh k10 stredne 2 "uvod=off" premenne premenne,scrollcache
echo "== $(date +%T) K01 premenne2"; bash ab3.sh k01b stredne 2 "uvod=off" premenne2
echo "== $(date +%T) K02 prvy-dotyk"; bash ab3.sh k02 prvy-dotyk 2 "uvod=off&hudba=off" zaklad bezfontface
echo "== $(date +%T) K06 kontakt"; bash ab3.sh k06 kontakt 2 "uvod=off" zaklad bezflap
echo "== $(date +%T) K04 dekod"; timeout 900 node over-dekod.mjs --n=2 > over-dekod.txt 2>&1 || echo chyba dekod
echo "== $(date +%T) K17"; EXTRA="--inv --save" bash ab3.sh k17 stredne 1 "uvod=off" premenne,bezanim premenne,bezanim,bezkinfilter
echo "== $(date +%T) koniec davky 2"
