#!/bin/bash
# Kontrola kódu D1: vynútené rozloženia v hlavnej slučke (app.js readTarget) pri tabuli hodín – HEAD s tabuľou,
# HEAD bez tabule (zaplata vypflap) a HEAD so scrollY z udalosti scroll (zaplata scrollcache2); scenár kontakt, CPU 4×
K=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/kontrola-kod
cd $K/nastroje-po/overenie-kod-stranka
for i in 1 2; do
  for v in zaklad vypflap scrollcache2; do
    echo "== $(date +%T) $v $i (záťaž $(cut -d' ' -f1-3 /proc/loadavg))"
    if [ $v = zaklad ]; then nice -n 10 timeout 600 node skrol.mjs --q=uvod=off --scen=kontakt --out=fv-$v-$i > /dev/null 2>&1
    else nice -n 10 timeout 600 node skrol.mjs --q=uvod=off --scen=kontakt --patch=$v --out=fv-$v-$i > /dev/null 2>&1; fi
    echo "   exit $?"
  done
done
python3 - <<'PY'
import json,glob,re
base='/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/kontrola-kod/nastroje-po/overenie-kod-stranka/'
for d in sorted(glob.glob(base+'fv-*')):
    j=json.load(open(d+'/vysledok.json'))
    agg={}
    for x in j['vynutene']:
        k=re.sub(r':\d+$','',x['k']); agg.setdefault(k,[0,0]); agg[k][0]+=x['n']; agg[k][1]+=x['ms']
    sk={re.sub(r':\d+$','',x['k']):(x['n'],round(x['ms'],1)) for x in j['skripty'] if 'krok' in x['k'] or 'tick' in x['k']}
    print(d.split('/')[-1], '| vynútené:', '; '.join(f"{k} n={a[0]} {a[1]:.0f} ms" for k,a in sorted(agg.items())), '| skripty:', sk, '| snímky p95', j['snimky'].get('p95'), '| flap_b', j['dom'].get('flap_b'))
PY
