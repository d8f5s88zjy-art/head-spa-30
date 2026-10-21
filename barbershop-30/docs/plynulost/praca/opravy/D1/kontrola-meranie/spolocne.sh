# Spoločné funkcie kontroly merania D1 (nezávislá kontrola QA): brána voľného stroja, zápis záťaže, striedanie pred/po.
SP=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad
K=$SP/barber/opravy/D1/kontrola-meranie
KS=overenie-kod-stranka; VT=overenie-vykon-telefon; CO=cierne-okna
# čaká, kým nebeží cudzí prehliadač (headless_shell aj chrome; najviac 40 min – iní agenti bežia dlho) a záťaž klesne pod 2,5 (najviac 3 min)
brana() {
  local t0=$(date +%s)
  while [ "$(bash $K/cudzie.sh)" -gt 0 ] && [ $(( $(date +%s) - t0 )) -lt 2400 ]; do sleep 5; done
  local t1=$(date +%s)
  while awk '{exit !($1 > 2.5)}' /proc/loadavg && [ $(( $(date +%s) - t1 )) -lt 180 ]; do sleep 5; done
}
log() { echo "== $(date +%T) $* (záťaž $(cut -d' ' -f1-3 /proc/loadavg), cudzie prehliadače $(bash $K/cudzie.sh), HEAD $(git -C $SP/hs2 rev-parse --short HEAD)$(git -C $SP/hs2 status --short | grep -q . && echo ' ŠPINAVÝ'))"; }
