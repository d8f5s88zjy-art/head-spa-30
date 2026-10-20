#!/usr/bin/env bash
# Dávka 3: T8 prvé načítanie (film s prológom pri CPU 1× a 4×, film=off, predvolene), T1 samostatné nahratie pri CPU 1×, T7 pri CPU 6×
cd "$(dirname "$0")"
while pgrep -f davka2.sh >/dev/null; do sleep 5; done
node nacitanie.mjs --film=on --uvod=znova --cpu=1 --meno=nac-on-cpu1 --stopa=1
node nacitanie.mjs --film=on --uvod=znova --cpu=4 --meno=nac-on-cpu4
node nacitanie.mjs --film=off --cpu=4 --meno=nac-off-cpu4
node nacitanie.mjs --film=off --cpu=1 --meno=nac-off-cpu1
node nacitanie.mjs --film=predvolene --cpu=4 --meno=nac-predvolene-cpu4
node nahratie-vlakno.mjs --cpu=1
node inp.mjs --film=off --cpu=6 --meno=inp-off-cpu6 --stopa=1
node inp.mjs --film=off --cpu=4 --meno=inp-off-cpu4-b --stopa=1
echo DAVKA3-KONIEC
