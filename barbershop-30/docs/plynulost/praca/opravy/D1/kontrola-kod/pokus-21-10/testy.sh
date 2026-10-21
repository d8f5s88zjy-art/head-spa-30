#!/bin/bash
# Testy D1 na HEAD (stromu hs2), sekvenčne; výstupy do testy/
SP=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad
OUT=$SP/barber/opravy/D1/kontrola-kod/pokus-21-10/testy
cd $SP/hs2/barbershop-30 || exit 1
export NODE_PATH=/opt/node22/lib/node_modules
for t in app-smoke i18n-test atmosfera-test koliesko-test; do
  s=$(date +%s)
  timeout 1500 node source/tools/$t.mjs > $OUT/$t.txt 2>&1
  echo "$t exit=$? $(( $(date +%s) - s )) s" >> $OUT/prehlad.txt
done
echo hotovo >> $OUT/prehlad.txt
