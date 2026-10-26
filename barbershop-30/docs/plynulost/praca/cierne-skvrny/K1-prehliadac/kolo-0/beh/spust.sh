#!/bin/bash
# K1 kolo 0: behy detektora po sebe (jeden prehliadač naraz), port 8801
U='http://127.0.0.1:8801/barbershop-30/index.html?asistent=ukazka&objednavka=ukazka'
D=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/cierne-skvrny/nastroje/k1-detektor.cjs
O=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/cierne-skvrny/K1-prehliadac/kolo-0/beh
cd $O
node $D --url "$U" --okno 1512x982@0.5 --gpu swiftshader --rezimy uvod,pomaly,spat,rychly --usadit 12 --snimky 1 --max-vyrezov 24 --out $O/hlavny > $O/hlavny.log 2>&1
node $D --url "$U" --okno 390x844@1 --gpu swiftshader --rezimy uvod,pomaly,rychly --usadit 0 --snimky 1 --max-vyrezov 16 --out $O/telefon > $O/telefon.log 2>&1
node $D --url "$U" --okno 1512x982@2 --gpu swiftshader --rezimy pomaly --od 2300 --do 3600 --usadit 6 --snimky 1 --max-vyrezov 6 --out $O/dpr2 > $O/dpr2.log 2>&1
node $D --url "$U" --okno 1440x900@0.5,1920x1080@0.5,1280x800@0.5 --gpu swiftshader --rezimy pomaly,rychly --usadit 0 --snimky 1 --max-vyrezov 8 --out $O/okna > $O/okna.log 2>&1
node $D --url "$U" --okno 1512x982@0.5 --gpu angle-gl --rezimy pomaly --od 2300 --do 3600 --usadit 6 --snimky 1 --max-vyrezov 4 --out $O/angle-gl > $O/angle-gl.log 2>&1
node $D --url "$U" --okno 1512x982@0.5 --gpu swiftshader --rezimy pomaly,rychly --znacka --usadit 0 --snimky 1 --max-vyrezov 8 --out $O/znacka > $O/znacka.log 2>&1
echo VSETKO-HOTOVO > $O/hotovo.txt
