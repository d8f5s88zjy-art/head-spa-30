#!/bin/bash
# D1 – meranie „pred“ (strom pred-D1 = bcd487e, server 8310), postupne, nikdy dva prehliadače naraz.
# Výstupy *.txt a ab-*/ v kópii nástrojov nastroje-pred; záťaž sa zapisuje pred každým krokom.
N=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/meranie/nastroje-pred
run() { local dir=$1 name=$2; shift 2; echo "== $(date +%T) $name (záťaž $(cut -d' ' -f1-3 /proc/loadavg), chrom $(pgrep -c chrom))"; ( cd "$N/$dir" && timeout 1500 "$@" > "$name.txt" 2>&1 ) || echo "   chyba $name ($?)"; }
K=overenie-kod-stranka; V=overenie-vykon-telefon
run $K ab-stredne bash ab3.sh d1 stredne 3 uvod=off zaklad
run $K ab-svih bash ab3.sh d1s svih 3 uvod=off zaklad
run $K ab-prvy-dotyk bash ab3.sh d1pd prvy-dotyk 2 'uvod=off&hudba=off' zaklad
run $K ab-prvy-dotyk-hudba bash ab3.sh d1pdh prvy-dotyk 2 uvod=off zaklad
run $K ab-kontakt bash ab3.sh d1k kontakt 2 uvod=off zaklad
run $K over-audio node over-audio.mjs --n=2
run $K over-intl node over-intl.mjs --n=3
run $K cena-sceny node cena-sceny.mjs
run $K hlavicka node hlavicka.mjs
run $K over-property node over-property.mjs
run $K over-menu node over-menu.mjs --n=3 '--q=uvod=off&hudba=off' --v=zaklad
run $K jazyk-uvod node jazyk-uvod.mjs
run $V skrol2-cpu1 node skrol2.mjs --film=off --cpu=1 --meno=d1-cpu1
run $V skrol2-cpu4 node skrol2.mjs --film=off --cpu=4 --meno=d1-cpu4
run $V vrstvy node vrstvy.mjs --film=off
run $V inp-cpu4 node inp.mjs --film=off --cpu=4
run $V inp-cpu6 node inp.mjs --film=off --cpu=6
( cd $N/$K && for p in d1 d1s d1pd d1pdh d1k; do echo "### $p"; python3 ab-suhrn.py $p; done > suhrn-pred.txt 2>&1 )
echo "== $(date +%T) koniec merania pred"
