#!/bin/bash
# D1 – meranie „po“ striedavo s „pred“ (pred = strom pred-D1 na porte 8310, po = HEAD hs2 na porte 8312), tá istá
# metóda a tie isté nástroje (kópie nastroje-pred a nastroje-po). Skrol 3×, ostatné 2×, medián; nikdy dva prehliadače naraz.
M=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/meranie
K=overenie-kod-stranka; V=overenie-vykon-telefon
log() { echo "== $(date +%T) $* (záťaž $(cut -d' ' -f1-3 /proc/loadavg), chrom $(pgrep -c chrom))"; }
# skrol.mjs: výsledok do ab-<predpona>-<pred|po>-<i> v priečinku kópie nástrojov
skrol() { local pre=$1 scen=$2 n=$3 q=$4; for i in $(seq 1 $n); do for s in pred po; do
  log "$pre $scen $s $i"; ( cd $M/nastroje-$s/$K && timeout 900 node skrol.mjs --q="$q" --scen=$scen --out=ab-$pre-$s-$i > /dev/null 2>&1 ) || echo "   chyba $pre $s $i"; done; done; }
# ostatné nástroje: výstup <meno>-<pred|po>-<i>.txt
iny() { local dir=$1 name=$2 n=$3; shift 3; for i in $(seq 1 $n); do for s in pred po; do
  log "$name $s $i"; ( cd $M/nastroje-$s/$dir && timeout 1500 "$@" > $name-$s-$i.txt 2>&1 ) || echo "   chyba $name $s $i"; done; done; }
skrol d1ab stredne 3 uvod=off
skrol d1abs svih 3 uvod=off
skrol d1abpd prvy-dotyk 2 'uvod=off&hudba=off'
skrol d1abpdh prvy-dotyk 2 uvod=off
skrol d1abk kontakt 2 uvod=off
iny $K over-audio 1 node over-audio.mjs --n=2
iny $K over-intl 1 node over-intl.mjs --n=3
iny $K hlavicka 1 node hlavicka.mjs
iny $K over-property 1 node over-property.mjs
iny $K over-menu 1 node over-menu.mjs --n=3 '--q=uvod=off&hudba=off' --v=zaklad
iny $K jazyk-uvod 1 node jazyk-uvod.mjs
iny $K cena-sceny 1 node cena-sceny.mjs
for i in 1 2 3; do for s in pred po; do log "skrol2 cpu1 $s $i"; ( cd $M/nastroje-$s/$V && timeout 900 node skrol2.mjs --film=off --cpu=1 --meno=d1ab-cpu1-$s-$i > skrol2-cpu1-$s-$i.txt 2>&1 ) || echo "   chyba"; done; done
for i in 1 2; do for s in pred po; do log "skrol2 cpu4 $s $i"; ( cd $M/nastroje-$s/$V && timeout 900 node skrol2.mjs --film=off --cpu=4 --meno=d1ab-cpu4-$s-$i > skrol2-cpu4-$s-$i.txt 2>&1 ) || echo "   chyba"; done; done
iny $V vrstvy 2 node vrstvy.mjs --film=off
for i in 1 2; do for s in pred po; do for c in 4 6; do log "inp cpu$c $s $i"; ( cd $M/nastroje-$s/$V && timeout 900 node inp.mjs --film=off --cpu=$c --meno=d1ab-inp$c-$s-$i > inp$c-$s-$i.txt 2>&1 ) || echo "   chyba"; done; done; done
# súhrn skrolu: pred aj po do jedného priečinka
S=$M/ab-suhrn; mkdir -p $S; cp $M/nastroje-po/$K/ab-suhrn.py $S/
for s in pred po; do for d in $M/nastroje-$s/$K/ab-d1ab*-$s-*; do rm -rf $S/$(basename $d); cp -r $d $S/; done; done
( cd $S && for p in d1ab d1abs d1abpd d1abpdh d1abk; do echo "### $p"; python3 ab-suhrn.py $p; done > $M/suhrn-ab.txt 2>&1 )
log "koniec merania pred/po"
