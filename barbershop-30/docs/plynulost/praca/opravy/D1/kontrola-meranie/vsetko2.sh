#!/bin/bash
# Pokračovanie kontroly merania D1 po prerušení: výkon (A+B), potom čierne okná (C); jeden prehliadač naraz
K=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/kontrola-meranie
bash $K/ab-vykon2.sh >> $K/ab-vykon.log 2>&1
bash $K/ab-cierne.sh >> $K/ab-cierne.log 2>&1
echo "== $(date +%T) VSETKO HOTOVE" >> $K/ab-cierne.log
