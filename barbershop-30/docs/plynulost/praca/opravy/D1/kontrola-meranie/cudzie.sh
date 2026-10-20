#!/bin/bash
# Počet cudzích prehliadačov (hlavný proces headless_shell/chrome bez --type=, ktorého rodič nebeží v priečinku
# kontroly merania D1). Moje nástroje bežia s pracovným priečinkom pod $K, cudzie (iní agenti) nie.
K=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/kontrola-meranie
n=0
for p in $(pgrep -x headless_shell; pgrep -x chrome); do
  a=$(tr '\0' ' ' < /proc/$p/cmdline 2>/dev/null); case "$a" in *--type=*) continue;; esac
  pp=$(awk '{print $4}' /proc/$p/stat 2>/dev/null); cw=$(readlink /proc/$pp/cwd 2>/dev/null)
  case "$cw" in $K*) ;; *) n=$((n+1));; esac
done
echo $n
