#!/bin/sh
# Oprava 3b: zostaví krok 7|8|9 v strome hs-recepcia zo stavu 366c21f (kroky3/base) a spustí test
set -e
K=$1
D=$(cd "$(dirname "$0")" && pwd)
SP=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad
T=$SP/hs-recepcia/barbershop-30
S5=$SP/barber/lahky-telefon/v2/stavba-v5
cp "$D/base/sk.json" "$T/assets/recepcia/sk.json"
cp "$D/base/jazyky_data.py" "$S5/jazyky_data.py"
cp "$D/base/jazyky-gen.py" "$S5/jazyky-gen.py"
python3 -I "$D/dat.py" "$K" "$T/assets/recepcia/sk.json" "$S5/jazyky_data.py" "$S5/jazyky-gen.py"
python3 -I "$S5/jazyky-gen.py" "$T" > /dev/null
python3 -I "$D/js.py" "$K" "$D/js-366c21f.js" "$T/assets/recepcia.js"
python3 -I "$D/tst.py" "$K" "$D/base/recepcia-test.mjs" "$T/source/tools/recepcia-test.mjs"
cd "$T" && node --test source/tools/recepcia-test.mjs > "$D/test-k$K.txt" 2>&1 || true
grep -E "^# (tests|pass|fail)|^not ok|CHYBA|gzip: recepcia|^# otázok|čas:" "$D/test-k$K.txt"
