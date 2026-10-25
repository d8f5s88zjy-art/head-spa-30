# zaradenie výsledkov podľa zásad zhody v2 (hodnotenie v2-1)
# OK / ODOVZDANIE-NAVYSE / CHYBA-KANDIDAT (ručná kontrola) + pomocné podtriedy
import json,re,sys,collections
NELEG={'odovzdanie','bez-ceny'}
def num(r): return r['typ']=='odpoved' and bool(re.search(r'€|\d+\s*(min|perc|хв|мин)', r.get('text',''), re.I))
def okset(r):
    p=r.get('prijatelne') or []
    if isinstance(p,str): p=[x for x in p.split(',') if x]
    return {r['ocakavane']}|set(p)
def volby(ok): return [x[6:].split(',') for x in ok if x.startswith('volba:')]
def zarad(r):
    ok=okset(r); t=r['typ']; i=r['id']; e=r['ocakavane']
    if i=='trvanie' and r.get('sluzba'): i2=r['sluzba']
    else: i2=i
    leg = not (ok<=NELEG|{x for x in ok if x in NELEG})
    neleg_only = ok<=NELEG
    pas = lambda: 'odovzdanie' in ok
    if t=='odpoved' and num(r) and '€' in r.get('text','') and r.get('vyrez') is None and i!='ceny-konecne':
        return 'CHYBA-KANDIDAT','cena-bez-vyrezu'
    if neleg_only:
        if t in ('nevieme','fallback','zdvorilost'): return 'OK','odovzdanie'
        if t=='vyber': return 'OK','vyber-neleg'
        if i in ok: return 'OK','priama'
        if num(r): return 'CHYBA-KANDIDAT','hola-cena-neleg'
        if e=='bez-ceny': return 'OK','bez-ceny-odpoved'
        return 'CHYBA-KANDIDAT','hola-sluzba-neleg'
    V=volby(ok)
    if t=='odpoved':
        if i in ok or (i=='trvanie' and (i2 in ok or 'trvanie' in ok)): return 'OK','priama' if i!='trvanie' else 'trvanie'
        if num(r): return 'CHYBA-KANDIDAT','hola-cena-ina'
        return 'CHYBA-KANDIDAT','hola-sluzba-ina'
    if t=='vyber':
        k=r['kand']
        if any(all(x in k for x in v) for v in V): return 'OK','volba-vsetky'
        if set(k[:2])&ok or (r.get('cas') and 'trvanie' in ok and k): return 'OK','volba-top2'
        if any(set(v)&set(k) for v in V): return 'ODOVZDANIE-NAVYSE','volba-ciastocne'
        if set(k)&ok: return 'ODOVZDANIE-NAVYSE','volba-nizko'
        if pas(): return 'OK','vyber-pri-odovzdani'
        return 'ODOVZDANIE-NAVYSE','vyber-mimo'
    if pas(): return 'OK','odovzdanie'
    return 'ODOVZDANIE-NAVYSE',t
files=sys.argv[1:]; tot=collections.Counter(); legn=0; legf=0; allrows=[]
for f in files:
    rows=[json.loads(l) for l in open(f)]
    c=collections.Counter(); sub=collections.Counter(); ln=lf=0
    for r in rows:
        r['trieda'],r['podtrieda']=zarad(r); c[r['trieda']]+=1; sub[r['trieda']+'/'+r['podtrieda']]+=1
        leg=not okset(r)<=NELEG
        if leg: ln+=1; lf+= r['trieda']=='ODOVZDANIE-NAVYSE'
    legn+=ln; legf+=lf; tot.update(c); allrows+= [(f,r) for r in rows]
    print(f,len(rows),dict(c),'leg',ln,'fb',lf,f'{100*lf/ln:.1f}%'); print('   ',dict(sorted(sub.items())))
    json.dump(rows,open(f.replace('.jsonl','-zarad.json'),'w'),ensure_ascii=False,indent=0)
print('SPOLU',dict(tot),'leg',legn,'fb',legf,f'{100*legf/legn:.2f}%')
