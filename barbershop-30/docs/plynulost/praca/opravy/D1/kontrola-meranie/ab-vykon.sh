#!/bin/bash
# Fáza A+B: výkon telefónu pred/po (D1), striedavo pred/po, skrol 3×, ostatné 2×; nástroje z kópií nastroje-{pred,po}
. /tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/kontrola-meranie/spolocne.sh
skrol() { local pre=$1 scen=$2 n=$3 q=$4; for i in $(seq 1 $n); do for s in pred po; do brana
  log "skrol $pre $scen $s $i"; ( cd $K/nastroje-$s/$KS && timeout 900 node skrol.mjs --q="$q" --scen=$scen --out=ab-$pre-$s-$i > /dev/null 2>&1 ) || echo "   chyba $pre $s $i"; done; done; }
iny() { local dir=$1 name=$2 n=$3; shift 3; for i in $(seq 1 $n); do for s in pred po; do brana
  log "$name $s $i"; ( cd $K/nastroje-$s/$dir && timeout 1500 "$@" > $name-$s-$i.txt 2>&1 ) || echo "   chyba $name $s $i"; done; done; }
skrol k1 stredne 3 uvod=off
skrol k1s svih 3 uvod=off
skrol k1pd prvy-dotyk 2 'uvod=off&hudba=off'
skrol k1pdh prvy-dotyk 2 uvod=off
skrol k1k kontakt 2 uvod=off
for i in 1 2 3; do for s in pred po; do brana; log "skrol2 cpu1 $s $i"; ( cd $K/nastroje-$s/$VT && timeout 900 node skrol2.mjs --film=off --cpu=1 --meno=k1-cpu1-$s-$i > skrol2-cpu1-$s-$i.txt 2>&1 ) || echo "   chyba"; done; done
for i in 1 2; do for s in pred po; do brana; log "skrol2 cpu4 $s $i"; ( cd $K/nastroje-$s/$VT && timeout 900 node skrol2.mjs --film=off --cpu=4 --meno=k1-cpu4-$s-$i > skrol2-cpu4-$s-$i.txt 2>&1 ) || echo "   chyba"; done; done
iny $KS over-audio 1 node over-audio.mjs --n=2
iny $KS over-intl 1 node over-intl.mjs --n=3
iny $KS hlavicka 1 node hlavicka.mjs
iny $KS over-property 1 node over-property.mjs
iny $KS over-menu 1 node over-menu.mjs --n=3 '--q=uvod=off&hudba=off' --v=zaklad
iny $KS cena-sceny 1 node cena-sceny.mjs
iny $KS jazyk-uvod 1 node jazyk-uvod.mjs
iny $VT vrstvy 2 node vrstvy.mjs --film=off
for i in 1 2; do for s in pred po; do for c in 4 6; do brana; log "inp cpu$c $s $i"; ( cd $K/nastroje-$s/$VT && timeout 900 node inp.mjs --film=off --cpu=$c --meno=k1-inp$c-$s-$i > inp$c-$s-$i.txt 2>&1 ) || echo "   chyba"; done; done; done
for i in 1 2; do for s in pred po; do brana; log "nacitanie $s $i"; ( cd $K/nastroje-$s/$VT && timeout 900 node nacitanie.mjs --film=off --cpu=4 --meno=k1-nac-$s-$i > nacitanie-$s-$i.txt 2>&1 ) || echo "   chyba"; done; done
log "koniec fázy výkonu"
