#!/usr/bin/env bash
# Dávka 2: T1 pri CPU 1× (čas vlákna bez odpočtu spomaľovača: pri CPU 4× sa čakanie započíta do času vlákna),
# s filmom 0 → 2 900 px: základ, bez sekvencií, 1 nahratie za snímku; film=off celá stránka so stopou (dlhé úlohy)
cd "$(dirname "$0")"
while pgrep -f davka1.sh >/dev/null; do sleep 5; done
node skrol2.mjs --film=on --cpu=1 --do=2900 --js=ab/gl-pocitadlo.js --meno=d2-on-cpu1-zaklad --stopa=1 --cakaj=8000
node skrol2.mjs --film=on --cpu=1 --do=2900 --js=ab/gl-pocitadlo.js --sub=zamena-bez-seq.json --meno=d2-on-cpu1-bez-seq --stopa=1 --cakaj=8000
node skrol2.mjs --film=on --cpu=1 --do=2900 --js=ab/gl-pocitadlo.js --sub=zamena-seq1.json --meno=d2-on-cpu1-seq1 --stopa=1 --cakaj=8000
node skrol2.mjs --film=off --cpu=1 --meno=d2-off-cpu1 --stopa=1
node skrol2.mjs --film=off --cpu=4 --gesto=svih --meno=d2-off-cpu4-svih --stopa=1
