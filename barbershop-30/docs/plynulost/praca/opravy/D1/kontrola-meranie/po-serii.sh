#!/bin/bash
# Po skončení série A/B (vsetko2.sh): vzhľad pred/po (snímky kariet a pásu kontaktu, telefón aj počítač), potom testy
# projektu na HEAD (app-smoke, i18n-test, atmosfera-test, koliesko-test). Beží až keď séria skončí (jeden prehliadač naraz).
. /tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/kontrola-meranie/spolocne.sh
while kill -0 $(cat $K/vsetko2.pid) 2>/dev/null; do sleep 20; done
export NODE_PATH=/opt/node22/lib/node_modules
log "vzhľad pred/po"; ( cd $K/vlastne && node vzhlad.mjs > $K/vzhlad.log 2>&1 ); ( cd $K && python3 -I vzhlad.py vzhlad > $K/vzhlad-tabulka.txt 2>&1 )
log "vzhľad pred/po bez i18n"; ( cd $K/vlastne && node vzhlad.mjs --bez-i18n >> $K/vzhlad.log 2>&1 ); ( cd $K && python3 -I vzhlad.py vzhlad-bez-i18n > $K/vzhlad-bez-i18n-tabulka.txt 2>&1 )
mkdir -p $K/testy; cd $SP/hs2/barbershop-30
for t in app-smoke i18n-test atmosfera-test koliesko-test; do log "test $t (HEAD)"; timeout 1800 node source/tools/$t.mjs > $K/testy/$t.txt 2>&1; echo "   exit $?" ; done
log "koniec po-serii"
