#!/bin/bash
# Overenie auditu kod-stranka – dávka 1 (postupne, nikdy dva prehliadače naraz). Výstupy *.txt v tomto priečinku.
cd "$(dirname "$0")"
until [ -s ab-stredne-suhrn.txt ]; do sleep 2; done
run() { local name=$1; shift; echo "== $(date +%T) $name"; timeout 900 "$@" > "$name.txt" 2>&1 || echo "   chyba $name ($?)"; }
run over-property node over-property.mjs
run over-audio node over-audio.mjs --n=2
run over-intl node over-intl.mjs --n=3
run profil-init node profil-init.mjs
run cena-sceny node cena-sceny.mjs
run cena-cielu node cena-cielu.mjs
run hlavicka node hlavicka.mjs
run jazyk-uvod2 node jazyk-uvod2.mjs
run jazyk-uvod node jazyk-uvod.mjs
run over-galeria node over-galeria.mjs
run over-menu node over-menu.mjs --n=3
run interakcie-1 node interakcie.mjs; cp interakcie.json interakcie-1.json
run interakcie-2 node interakcie.mjs; cp interakcie.json interakcie-2.json
run pokoj node pokoj.mjs
run tim-pas node tim-pas.mjs
echo "== $(date +%T) koniec davky 1"
