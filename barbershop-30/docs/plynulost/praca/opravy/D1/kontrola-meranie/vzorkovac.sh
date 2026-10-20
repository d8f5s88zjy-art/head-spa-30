#!/bin/bash
# Každé 2 s zapíše čas, záťaž a počet cudzích prehliadačov (na dodatočné vyradenie behov, ktoré sa prekrývali s inými agentmi)
K=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/kontrola-meranie
while true; do echo "$(date +%s) $(cut -d' ' -f1 /proc/loadavg) $(bash $K/cudzie.sh)"; sleep 2; done
