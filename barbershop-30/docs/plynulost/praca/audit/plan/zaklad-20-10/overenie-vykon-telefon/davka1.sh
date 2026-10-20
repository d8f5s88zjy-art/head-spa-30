#!/usr/bin/env bash
# Dávka A/B (film=off, telefón CPU 4×, stredný švih celou stránkou): T3 (--sp), T4 (animácie s hudbou), T5 (will-change karty)
cd "$(dirname "$0")"
A='.hudba-eq i,.btn-primary::after,.beam-line::before,.marquee-track{animation-play-state:paused!important}'
for r in 1 2; do
node skrol2.mjs --film=off --cpu=4 --meno=d1-zaklad-r$r
node skrol2.mjs --film=off --cpu=4 --js=ab/bez-sp.js --meno=d1-bez-sp-r$r
node skrol2.mjs --film=off --cpu=4 --hudba=on --meno=d1-hudba-r$r
node skrol2.mjs --film=off --cpu=4 --hudba=on --css="$A" --meno=d1-hudba-bez-animacii-r$r
node skrol2.mjs --film=off --cpu=4 --css=".title-frame{will-change:opacity}" --meno=d1-wc-karta-r$r
done
