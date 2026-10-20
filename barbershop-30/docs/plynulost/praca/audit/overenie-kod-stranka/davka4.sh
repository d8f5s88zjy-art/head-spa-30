#!/bin/bash
# Overenie auditu kod-stranka – dávka 4 (po dávke 3): dekódovanie záloh a portrétov (K04)
cd "$(dirname "$0")"
until grep -q "koniec davky 3" davka3.log 2>/dev/null; do sleep 3; done
echo "== $(date +%T) over-dekod"; timeout 1200 node over-dekod.mjs --n=2 > over-dekod.txt 2>&1 || echo "chyba dekod"
python3 -I over-dekod.py dekod > over-dekod-rozbor.txt 2>&1
echo "== $(date +%T) koniec davky 4"
