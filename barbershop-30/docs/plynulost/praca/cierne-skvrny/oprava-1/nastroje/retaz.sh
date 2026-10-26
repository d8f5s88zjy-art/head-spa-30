#!/bin/bash
# Oprava 1: prehliadačové behy po sebe (jeden prehliadač naraz), porty 8840 (PO) a 8841 (PRED), K4 vlastný server 8842
O=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/cierne-skvrny/oprava-1; N=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/cierne-skvrny/oprava-1/nastroje; K=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/cierne-skvrny/nastroje; L=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/cierne-skvrny/oprava-1/log; S=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad
U0='http://127.0.0.1:8840/barbershop-30/index.html?asistent=ukazka&objednavka=ukazka'
krok() { echo "$(date +%T) $1 kód $2" >> $L/retaz.txt; }
node $N/op-predpo.cjs --port 8841 --out $O/harok/pred --rezim harok > $L/harok-pred.log 2>&1; krok harok-pred $?
node $K/k4-reprodukcia.cjs --root $S/hs-skvrny --port 8842 --okno 1350x960@1 --gpu swiftshader --rezimy chromium,alfa --pozadie '#ff00ff' --out $O/k4-po > $L/k4-po.log 2>&1; krok k4-po $?
node $N/op-predpo.cjs --port 8841 --out $O/video/pred --rezim video > $L/video-pred.log 2>&1; krok video-pred $?
node $N/op-predpo.cjs --port 8840 --out $O/video/po --rezim video > $L/video-po.log 2>&1; krok video-po $?
node $N/op-predpo.cjs --port 8841 --out $O/telefon/pred --rezim telefon > $L/telefon-pred.log 2>&1; krok telefon-pred $?
node $N/op-predpo.cjs --port 8840 --out $O/telefon/po --rezim telefon > $L/telefon-po.log 2>&1; krok telefon-po $?
node $K/k1-detektor.cjs --url "$U0" --okno 1512x982@0.5 --gpu swiftshader --rezimy uvod,pomaly,rychly --usadit 12 --snimky 1 --max-vyrezov 24 --out $O/k1/pc > $L/k1-pc.log 2>&1; krok k1-pc $?
node $K/k1-detektor.cjs --url "$U0" --okno 390x844@1 --gpu swiftshader --rezimy uvod,pomaly,rychly --usadit 0 --snimky 1 --max-vyrezov 16 --out $O/k1/telefon > $L/k1-telefon.log 2>&1; krok k1-telefon $?
node $N/op-vykon.cjs --out $O/vykon --kola 3 --zariadenie pc > $L/vykon-pc.log 2>&1; krok vykon-pc $?
node $N/op-vykon.cjs --out $O/vykon --kola 3 --zariadenie telefon > $L/vykon-telefon.log 2>&1; krok vykon-telefon $?
krok RETAZ-HOTOVO 0
