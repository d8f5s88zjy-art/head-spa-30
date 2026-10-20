#!/bin/bash
# A/B striedavo s vlastnou predponou (neprepíše iné behy): bash ab3.sh <predpona> <scen> <n> <q> <variant...>
# variant: zaklad alebo zoznam záplat oddelený čiarkou (zaplaty.mjs); výsledok ab-<predpona>-<variant>-<i>/vysledok.json
cd "$(dirname "$0")"
PRE=$1; SCEN=$2; N=$3; Q=$4; shift 4
for i in $(seq 1 $N); do
  for P in "$@"; do
    if [ "$P" = "zaklad" ]; then timeout 600 node skrol.mjs --q="$Q" --scen=$SCEN --out=ab-$PRE-zaklad-$i ${EXTRA:-} > /dev/null 2>&1 || echo "chyba zaklad $i";
    else timeout 600 node skrol.mjs --q="$Q" --scen=$SCEN --patch=$P --out=ab-$PRE-${P//,/+}-$i ${EXTRA:-} > /dev/null 2>&1 || echo "chyba $P $i"; fi
  done
done
