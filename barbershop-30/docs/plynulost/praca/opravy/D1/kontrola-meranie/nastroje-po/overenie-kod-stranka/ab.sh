#!/bin/bash
# A/B striedavo: zaklad vs. zaplata (zaplaty.mjs), scenár a počet opakovaní; výsledky ab-<scen>-<variant>-<i>/vysledok.json
# použitie: bash ab.sh <scen> <zaplata> <n> [q]
cd "$(dirname "$0")"
SCEN=$1; P=$2; N=${3:-3}; Q=${4:-uvod=off}
for i in $(seq 1 $N); do
  timeout 600 node skrol.mjs --q=$Q --scen=$SCEN --out=ab-$SCEN-zaklad-$i > /dev/null 2>&1 || echo "chyba zaklad $i"
  timeout 600 node skrol.mjs --q=$Q --scen=$SCEN --patch=$P --out=ab-$SCEN-$P-$i > /dev/null 2>&1 || echo "chyba $P $i"
done
