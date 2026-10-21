#!/bin/bash
SP=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad
OUT=$SP/barber/opravy/D1/kontrola-kod/pokus-21-10/testy
export NODE_PATH=/opt/node22/lib/node_modules
: > $OUT/koliesko-ab.txt
for i in 1 2 3 4; do
  for s in pred po; do
    if [ $s = pred ]; then W=$SP/barber/opravy/pred-D1/barbershop-30; else W=$SP/hs2/barbershop-30; fi
    cd $W
    timeout 300 node source/tools/koliesko-test.mjs > $OUT/koliesko-ab-$s-$i.txt 2>&1
    echo "beh $i $s: OK=$(grep -c '^OK' $OUT/koliesko-ab-$s-$i.txt) FAIL=$(grep -c '^FAIL' $OUT/koliesko-ab-$s-$i.txt) load=$(cut -d' ' -f1 /proc/loadavg)" >> $OUT/koliesko-ab.txt
  done
done
echo hotovo >> $OUT/koliesko-ab.txt
