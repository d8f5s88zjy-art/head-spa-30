#!/bin/bash
# A2 kolo 0 – po dokončení prechodu (HOTOVO-PRECHOD v beh-prechod.log) ďalšie kontroly, vždy jeden prehliadač.
N=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit-celok/nastroje
K=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit-celok/A2-vzhlad/kolo-0
cd $N
until grep -q HOTOVO-PRECHOD $K/beh-prechod.log 2>/dev/null; do sleep 20; done
echo "== $(date +%T) pismo-dokaz"; node a2-pismo-dokaz.cjs > $K/pismo/dokaz.json 2>&1; echo "   $(wc -c < $K/pismo/dokaz.json) B"
echo "== $(date +%T) pismo-sonda"; node a2-pismo-sonda.cjs > $K/pismo/sonda.log 2>&1; tail -5 $K/pismo/sonda.log
echo "== $(date +%T) stavy"; node a2-vzhlad.cjs --stavy
echo "== $(date +%T) nacitanie"; node a2-vzhlad.cjs --nacitanie
echo "== $(date +%T) karty-sonda"; node a2-karty-sonda.cjs > $K/karty-sonda.log 2>&1; tail -12 $K/karty-sonda.log
echo "== $(date +%T) cls index"; node a2-cls-sonda.cjs index.html 390x844m,1440x900
echo "== $(date +%T) cls rezervacia"; node a2-cls-sonda.cjs rezervacia.html 390x844m,1440x900
echo "== $(date +%T) cls en"; node a2-cls-sonda.cjs en/index.html 390x844m
echo "== $(date +%T) jazyky"; node a2-vzhlad.cjs --jazyky
echo "== $(date +%T) tma"; node a2-vzhlad.cjs --tma
echo "== $(date +%T) skok slow4g"; node a2-skok-sonda.cjs 390 844 1 "asistent=off&hudba=off" slow4g
echo "== $(date +%T) HOTOVO-RETAZ2"
