#!/bin/bash
SP=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad
OUT=$SP/barber/opravy/D1/kontrola-kod/pokus-21-10/testy
export NODE_PATH=/opt/node22/lib/node_modules
: > $OUT/prehlad2.txt
cd $SP/hs2/barbershop-30
s=$(date +%s); timeout 1500 node source/tools/app-smoke.mjs > $OUT/app-smoke-2.txt 2>&1; echo "app-smoke HEAD (2. beh) exit=$? OK=$(grep -c '^OK' $OUT/app-smoke-2.txt) FAIL=$(grep -c '^FAIL' $OUT/app-smoke-2.txt) $(( $(date +%s) - s )) s" >> $OUT/prehlad2.txt
cd $SP/barber/opravy/pred-D1/barbershop-30
s=$(date +%s); timeout 1500 node source/tools/app-smoke-d1.mjs > $OUT/app-smoke-pred-novy-test.txt 2>&1; echo "app-smoke (nový test) na strome PRED exit=$? OK=$(grep -c '^OK' $OUT/app-smoke-pred-novy-test.txt) FAIL=$(grep -c '^FAIL' $OUT/app-smoke-pred-novy-test.txt) $(( $(date +%s) - s )) s" >> $OUT/prehlad2.txt
s=$(date +%s); timeout 1500 node source/tools/i18n-test-d1.mjs > $OUT/i18n-test-pred-novy-test.txt 2>&1; echo "i18n-test (nový test) na strome PRED exit=$? FAIL=$(grep -c 'CHYBA\|^FAIL' $OUT/i18n-test-pred-novy-test.txt) $(( $(date +%s) - s )) s" >> $OUT/prehlad2.txt
echo hotovo >> $OUT/prehlad2.txt
