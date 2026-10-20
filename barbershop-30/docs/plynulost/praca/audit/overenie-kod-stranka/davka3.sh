#!/bin/bash
# Overenie auditu kod-stranka – dávka 3 (po dávke 2): menu bez hudby a bez zamknutia, galéria s presnou šírkou súboru
cd "$(dirname "$0")"
until grep -q "koniec davky 2" davka2.log 2>/dev/null; do sleep 3; done
run() { local name=$1; shift; echo "== $(date +%T) $name"; timeout 1200 "$@" > "$name.txt" 2>&1 || echo "   chyba $name ($?)"; }
run over-menu-bezhudby node over-menu.mjs --n=3 "--v=zaklad/menufix/menufix,nolock" "--q=uvod=off&hudba=off"
run over-galeria node over-galeria.mjs
echo "== $(date +%T) koniec davky 3"
