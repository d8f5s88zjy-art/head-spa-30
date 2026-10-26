#!/usr/bin/env bash
# A1 – rad prehliadačových kontrol po sebe (jeden prehliadač naraz): počká na dobehnutie a1-oprava.log a spustí
# sondu kotiev, tma-test (kópia s dlhším limitom snímky), film na telefóne, koliesko nad asistentom, atmosfera-test,
# admin-test a základ na počítači (po oprave klikania). Každý krok má časový limit; logy v A1-funkcie/kolo-0/testy/.
#   bash a1-rad.sh
set -u
N=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit-celok/nastroje
K=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit-celok/A1-funkcie/kolo-0
S=$K/tmp-strom/barbershop-30
export NODE_PATH=/opt/node22/lib/node_modules
until grep -q '^exit ' "$K/testy/a1-oprava.log"; do sleep 3; done
krok() { # názov, limit s, príkaz…
  local n=$1 lim=$2; shift 2
  echo "== $n začiatok $(date -u +%H:%M:%S)"
  ( cd "$S" && timeout -k 15 "$lim" "$@" ) > "$K/testy/$n.log" 2>&1; echo "exit $?" >> "$K/testy/$n.log"
  echo "== $n koniec $(date -u +%H:%M:%S): $(tail -1 "$K/testy/$n.log") · $(grep -c '^FAIL' "$K/testy/$n.log") FAIL"
}
krok kotvy-snimka 600 node $N/a1-kotvy-snimka.cjs --port=8862 --strom=$K/tmp-strom --out=$K/snimky
krok tma-test-desktop 1800 node source/tools/tma-test-a1.mjs --only=desktop --out=$K/testy/out-tma-test
krok tma-test-mobile 1800 node source/tools/tma-test-a1.mjs --only=mobile --out=$K/testy/out-tma-test
krok a1-film-telefon 900 node $N/a1-funkcie.cjs --len=film --zar=telefon --port=8863 --strom=$K/tmp-strom --out=$K/vystup-film-telefon
krok koliesko-asistent 600 node $N/a1-koliesko-asistent.cjs --port=8864 --strom=$K/tmp-strom --out=$K/snimky
krok atmosfera-test 900 node source/tools/atmosfera-test.mjs --snimky=$K/testy/out-atmosfera-test
krok admin-test 1200 node source/tools/admin-test.mjs --out=$K/testy/out-admin-test
krok a1-oprava-zaklad 900 node $N/a1-funkcie.cjs --len=zaklad --zar=pocitac --port=8865 --strom=$K/tmp-strom --out=$K/vystup-oprava-zaklad
echo "== RAD HOTOVÝ $(date -u +%H:%M:%S)"
