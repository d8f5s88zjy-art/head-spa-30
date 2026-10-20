#!/bin/bash
# Fáza C: čierne okná pred/po (rec.mjs + ana.py z auditu), striedavo pred/po, 2 opakovania; surové snímky po rozbore zmazať
. /tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/kontrola-meranie/spolocne.sh
for rep in 1 2; do
  grep -v '^#' $K/matica-cierne.txt | while read -r name dev net cpu film cache scen extra; do
    [ -z "$name" ] && continue
    for s in pred po; do
      n=$name-$s-$rep; D=$K/nastroje-$s/$CO
      [ -f $D/runs/$n/ana.json ] && { echo "== $n hotové"; continue; }
      brana; log "cierne $n"
      ( cd $D && timeout 900 node rec.mjs --name="$n" --dev="$dev" --net="$net" --cpu="$cpu" --film="$film" --cache="$cache" --scen="$scen" $extra < /dev/null > rec-$n.log 2>&1 ) || echo "   rec zlyhal $n: $(tail -2 $D/rec-$n.log)"
      mkdir -p $D/runs/$n; mv $D/rec-$n.log $D/runs/$n/rec.log 2>/dev/null
      ( cd $D && python3 ana.py runs/$n < /dev/null 2>&1 | head -12 )
      rm -rf $D/runs/$n/frames
    done
  done
done
log "koniec fázy čiernych okien"
