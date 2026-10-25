import json,re,sys,collections
NELEG={'odovzdanie','bez-ceny'}
def cena(r): return r['typ']=='odpoved' and bool(re.search(r'€|\d+\s*(min|perc|хв|хвилин|минут|мин)', r.get('text',''), re.I))
def zarad(r):
    e=r['ocakavane']; ok={e}|set(x for x in r.get('prijatelne','').split(',') if x) if isinstance(r.get('prijatelne',''),str) else {e}|set(r.get('prijatelne') or [])
    t=r['typ']; i=r['id']
    if i=='trvanie' and r.get('sluzba'):
        i = 'trvanie' if 'trvanie' in ok else r['sluzba']
    if e in NELEG:
        if t in ('nevieme','fallback','zdvorilost'): return 'OK'
        if t=='vyber': return 'VYBER-NELEG'
        if i in ok: return 'OK'
        if cena(r): return 'CHYBA'
        if e=='bez-ceny': return 'OK'
        return 'ODCHYLKA'   # odpoveď bez ceny na tému odovzdanie
    # legitímna
    if t=='odpoved' and i in ok: return 'OK'
    if t in ('nevieme','fallback','zdvorilost'): return 'OK' if 'odovzdanie' in ok else 'BEZPECNE'
    if t=='vyber': return 'BEZPECNE' if set(r['kand'])&ok else 'VYBER-MIMO'
    if cena(r): return 'CHYBA'
    return 'ODCHYLKA'
for f in sys.argv[1:]:
    rows=[json.loads(l) for l in open(f)]
    c=collections.Counter()
    for r in rows:
        r['trieda_v']=zarad(r); c[r['trieda_v']]+=1
    print(f,len(rows),dict(c))
    for r in rows:
        if r['trieda_v'] not in ('OK',): print(' ',r['trieda_v'],'|',r['jazyk'],'|',r['otazka'],'| oc=',r['ocakavane'],r.get('prijatelne',''),'| ->',r['typ'],r['id'],r.get('sluzba',''),r.get('kand',''),'|',r.get('text','')[:70])
    json.dump(rows,open(f.replace('.jsonl','-zarad.json'),'w'),ensure_ascii=False)
