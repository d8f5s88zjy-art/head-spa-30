#!/usr/bin/env bash
# Celé meranie 1 za sebou (jeden prehliadač naraz). Pred každou sériou: loadavg a počet cudzích prehliadačov.
M=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/lahky-telefon/stavba/meranie-1
N=$M/nastroje/meraj.mjs
stav() { echo "== $(date -u +%H:%M:%S) $1 | loadavg $(cat /proc/loadavg) | prehliadačov $(ps -eo args | grep -cE '^/opt/pw-browsers') | disk $(df -h / | awk 'NR==2{print $4}')"; }
stav "start pred/po"; node $N start --prof=c4f,c6f,c4s,c6s --n=2
stav "start pred0 (D1 bez GPU)"; node $N start --prof=c4f --n=2 --stromy=pred0
stav "scen"; node $N scen --prof=c4f --n=2
stav "pc"; node $N pc --n=2
stav "skrol c4f,c6f pred/po/pred0"; node $N skrol --prof=c4f,c6f --n=3 --stromy=pred,po,pred0
stav "skrol c4s,c6s pred/po"; node $N skrol --prof=c4s,c6s --n=3
stav "koniec"
