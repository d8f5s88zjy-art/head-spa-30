#!/bin/bash
# A2 kolo 0 – pokračovanie prechodu po reštarte stroja (index p320..d1366 hotové): zvyšné šírky index, potom rez, en, karta, 404.
N=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit-celok/nastroje
K=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit-celok/A2-vzhlad/kolo-0
cd $N
echo "== $(date +%T) pokračovanie (uptime: $(uptime))" >> $K/beh-prechod.log
node a2-vzhlad.cjs --stranky=index --vp=d1440,d1512,d1920,d2560 --port=8871 >> $K/beh-prechod.log 2>&1
node a2-vzhlad.cjs --stranky=rez,en,karta,404 --port=8871 >> $K/beh-prechod.log 2>&1
echo "== $(date +%T) HOTOVO-PRECHOD" >> $K/beh-prechod.log
