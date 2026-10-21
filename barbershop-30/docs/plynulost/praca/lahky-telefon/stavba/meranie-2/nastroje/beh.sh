#!/usr/bin/env bash
# Celé meranie 2 za sebou (jeden prehliadač naraz). Pred každou sériou: loadavg, počet prehliadačov (ps, nie pgrep -f), disk.
M=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/lahky-telefon/stavba/meranie-2
N=$M/nastroje/meraj.mjs
export OSTRA_T=8
stav() { echo "== $(date -u +%H:%M:%S) $1 | loadavg $(cat /proc/loadavg) | prehliadačov $(ps -eo args | grep -cE '^/opt/pw-browsers') | disk $(df -h / | awk 'NR==2{print $4}')"; }
stav "start pred/po"; node $N start --prof=c4f,c6f,c4s,c6s --n=2
stav "start predoff (D1 ?film=off)"; node $N start --prof=c4f --n=2 --stromy=predoff
stav "scen"; node $N scen --prof=c4f --n=2
stav "pc"; node $N pc --n=2
stav "brana"; node $N brana
stav "filmon"; node $M/nastroje/filmon.mjs
stav "skrol c4f,c6f pred/po/predoff"; node $N skrol --prof=c4f,c6f --n=3 --stromy=pred,po,predoff
stav "skrol c4s,c6s pred/po"; node $N skrol --prof=c4s,c6s --n=3
stav "koniec"
