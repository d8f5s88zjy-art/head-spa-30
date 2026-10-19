#!/bin/bash
# A/B striedavo medzi dvoma zaplátami (prázdna = základ): bash ab2.sh <scen> <zaplataA> <zaplataB> <n> [q]
cd "$(dirname "$0")"
SCEN=$1; A=$2; B=$3; N=${4:-3}; Q=${5:-uvod=off}
for i in $(seq 1 $N); do
  for P in $A $B; do
    if [ "$P" = "zaklad" ]; then timeout 600 node skrol.mjs --q=$Q --scen=$SCEN --out=ab-$SCEN-zaklad-$i > /dev/null 2>&1 || echo "chyba zaklad $i";
    else timeout 600 node skrol.mjs --q=$Q --scen=$SCEN --patch=$P --out=ab-$SCEN-${P//,/+}-$i > /dev/null 2>&1 || echo "chyba $P $i"; fi
  done
done
