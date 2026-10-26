#!/bin/sh
# A4 – reťaz meraní po sebe (jeden prehliadač naraz); čaká na dobehnutie PID $1
cd /tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit-celok/A4-vykon/kolo-0/vysledky || exit 1
N=../../../nastroje
[ -n "$1" ] && while kill -0 "$1" 2>/dev/null; do sleep 5; done
echo "RETAZ start $(date +%T) $(cut -d' ' -f1-3 /proc/loadavg)" >> retaz.log
node $N/a4-pismo-test/a4-pismo-test.cjs 8891 > pismo-test.log 2>&1; echo "pismo-test $? $(date +%T)" >> retaz.log
node $N/a4-vykon.cjs klavesnica --port=8890 --zar=oba --maxtab=160 > klavesnica.log 2>&1; echo "klavesnica $? $(date +%T)" >> retaz.log
node $N/a4-vykon.cjs pristupnost --port=8890 --zar=telefon --stranka=admin/index.html --meno=telefon-admin > pristupnost-telefon-admin.log 2>&1; echo "pristupnost-admin $? $(date +%T)" >> retaz.log
node $N/a4-prekrytie.cjs --port=8890 > prekrytie.log 2>&1; echo "prekrytie $? $(date +%T)" >> retaz.log
node $N/a4-vykon.cjs obrazky --port=8890 --zar=oba > obrazky.log 2>&1; echo "obrazky $? $(date +%T)" >> retaz.log
node $N/a4-vykon.cjs pohyb --port=8890 --zar=oba > pohyb.log 2>&1; echo "pohyb $? $(date +%T)" >> retaz.log
echo "RETAZ koniec $(date +%T) $(cut -d' ' -f1-3 /proc/loadavg)" >> retaz.log
