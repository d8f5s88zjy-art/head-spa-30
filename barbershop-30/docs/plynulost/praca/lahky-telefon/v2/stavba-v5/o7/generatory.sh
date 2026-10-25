#!/bin/sh
# Oprava 7: spustí VŠETKY generátory tried z k4/, k5/, skeptik/, skeptik2/ nad stromom cez obal, ktorý zapíše ich otázky.
#   sh generatory.sh <strom/barbershop-30> <priečinok výstupu>
# Výstup: <priečinok>/<generátor>.log (vlastný výstup generátora s jeho orákulom) a <generátor>.jsonl.gz (otázky na sudcu).
S5=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/lahky-telefon/v2/stavba-v5
R=$1; O=$2; mkdir -p $O/obal/barbershop-30/assets
ln -sfn $R/assets/recepcia $O/obal/barbershop-30/assets/recepcia
ln -sfn $R/assets/i18n $O/obal/barbershop-30/assets/i18n
ln -sfn $R/index.html $O/obal/barbershop-30/index.html
cp $S5/o7/zachyt-modul.mjs $O/obal/barbershop-30/assets/recepcia.js
B=$O/obal/barbershop-30
export RECEPCIA_MODUL=$R/assets/recepcia.js
cd $S5
g() { n=$1; shift; echo "### $n: $*" > $O/$n.log; ZACHYT=$O/$n.jsonl.gz "$@" >> $O/$n.log 2>&1; echo "koniec $n $(date -u +%T)" >> $O/$n.log; }
g k4-trieda node k4/trieda-k4.mjs $B
g k5-dlzka node k5/dlzka-k5.mjs $B
g k5-p6f-medzera node k5/p6f-medzera.mjs $B
g skeptik2-n1 node skeptik2/n1-dlzka.mjs $B
g skeptik2-detail node skeptik2/detail.mjs $B skeptik2/otazky-v5-2.txt skeptik2/otazky-v5-2b.txt
g k5-trieda node o7/k5kopia/trieda-k5.mjs $B $O/k5-trieda-vystup.txt
# dátový lint kontroly 5 a merania času (bez obalu, priamo nad stromom)
echo "### k5-lint" > $O/k5-lint.log; node k5/lint-k5.mjs $R >> $O/k5-lint.log 2>&1
echo "### k5-cas (najpomalšie otázky z k5 + 200 znakov)" > $O/k5-cas.log; node k5/cas-k5.mjs $R >> $O/k5-cas.log 2>&1
echo "### skeptik2-cas" > $O/skeptik2-cas.log; ZAHRIAT=1 node skeptik2/cas-s2.mjs $R skeptik2/otazky-v5-2.txt skeptik2/otazky-v5-2b.txt >> $O/skeptik2-cas.log 2>&1
for f in k4/sondy-k4.txt k4/sondy-k4b.txt k4/sondy-k4c.txt; do echo "### k4-cas $f" >> $O/k4-cas.log; node k4/cas-k4.mjs $R $f >> $O/k4-cas.log 2>&1; done
echo hotovo
