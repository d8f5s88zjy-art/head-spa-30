#!/bin/bash
# Fáza A+B: výkon telefónu pred/po (D1), striedavo pred/po, skrol 3×, ostatné 2×; nástroje z kópií nastroje-{pred,po}.
# Každý beh: riadok do behy.tsv (meno, začiatok, koniec v sekundách) na porovnanie so vzorkovačom cudzích prehliadačov.
. /tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/kontrola-meranie/spolocne.sh
beh() { local meno=$1 dir=$2 out=$3; shift 3; brana; log "$meno"; local a=$(date +%s)
  ( cd $dir && timeout 1500 "$@" < /dev/null > $out 2>&1 ) || echo "   chyba $meno"; echo -e "$meno\t$a\t$(date +%s)" >> $K/behy.tsv; }
skrol() { local pre=$1 scen=$2 n=$3 q=$4; for i in $(seq 1 $n); do for s in pred po; do
  beh "skrol $pre-$s-$i" $K/nastroje-$s/$KS /dev/null node skrol.mjs --q="$q" --scen=$scen --out=ab-$pre-$s-$i; done; done; }
iny() { local dir=$1 name=$2 n=$3; shift 3; for i in $(seq 1 $n); do for s in pred po; do
  beh "$name-$s-$i" $K/nastroje-$s/$dir $name-$s-$i.txt "$@"; done; done; }
skrol k1 stredne 3 uvod=off
skrol k1s svih 3 uvod=off
skrol k1pd prvy-dotyk 2 'uvod=off&hudba=off'
skrol k1pdh prvy-dotyk 2 uvod=off
skrol k1k kontakt 2 uvod=off
for i in 1 2 3; do for s in pred po; do beh "skrol2-cpu1-$s-$i" $K/nastroje-$s/$VT skrol2-cpu1-$s-$i.txt node skrol2.mjs --film=off --cpu=1 --meno=k1-cpu1-$s-$i; done; done
for i in 1 2; do for s in pred po; do beh "skrol2-cpu4-$s-$i" $K/nastroje-$s/$VT skrol2-cpu4-$s-$i.txt node skrol2.mjs --film=off --cpu=4 --meno=k1-cpu4-$s-$i; done; done
iny $KS over-audio 1 node over-audio.mjs --n=2
iny $KS over-intl 1 node over-intl.mjs --n=3
iny $KS hlavicka 1 node hlavicka.mjs
iny $KS over-property 1 node over-property.mjs
iny $KS over-menu 1 node over-menu.mjs --n=3 '--q=uvod=off&hudba=off' --v=zaklad
iny $KS cena-sceny 1 node cena-sceny.mjs
iny $KS jazyk-uvod 1 node jazyk-uvod.mjs
iny $VT vrstvy 2 node vrstvy.mjs --film=off
for i in 1 2; do for s in pred po; do for c in 4 6; do beh "inp$c-$s-$i" $K/nastroje-$s/$VT inp$c-$s-$i.txt node inp.mjs --film=off --cpu=$c --meno=k1-inp$c-$s-$i; done; done; done
for i in 1 2; do for s in pred po; do beh "nacitanie-$s-$i" $K/nastroje-$s/$VT nacitanie-$s-$i.txt node nacitanie.mjs --film=off --cpu=4 --meno=k1-nac-$s-$i; done; done
for i in 1 2; do for s in pred po; do p=$([ $s = pred ] && echo 8430 || echo 8432); beh "scena-$s-$i" $K/vlastne scena-$s-$i.txt node scena-skrol.mjs --port=$p --meno=scena-$s-$i; done; done
log "koniec fázy výkonu"
