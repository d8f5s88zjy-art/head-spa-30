#!/usr/bin/env bash
# A/B T3 (zápis --sp), telefón CPU 4×, film=off, stredný švih celou stránkou; striedavo, 2 opakovania
cd "$(dirname "$0")"
for r in 1 2; do
  for v in zaklad bez-sp sp-priamo; do
    js=""; [ "$v" != zaklad ] && js="--js=ab/$v.js"
    node skrol.mjs --film=off --cpu=4 --od=0 --do=15400 --gesto=stredne $js --meno=t3-$v-r$r --maxs=300
  done
done
