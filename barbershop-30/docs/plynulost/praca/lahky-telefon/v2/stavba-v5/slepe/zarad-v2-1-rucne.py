# ručné rozhodnutia nad zarad-v2-1.py (hodnotenie v2-1); výstup vysledky-*-v2-1-final.json + súhrn
import json,collections
CHYBA={('D2','V pondelok o 9:00 na bradu?'),('D2','Střih pro syna (8) a pro mě, kolik?'),('D2','Strzyżenie dla syna (8 lat) i dla mnie?')}
ODCH_LEG={'chcem sa objednat na strih','Dobry den, chcel by som sa objednat na strih, ako na to?','Môžem sa objednať na strih na zajtra ráno?','Můžu se objednat na střih na zítra ráno?'}
ODCH_NELEG={'Máte TikTok?','Hundefriseur?','Máte wifi v čakárni?'}
CAS_PRI_CENE={'My hair is quite long, over 10 cm. Is it more expensive?','Mám vlasy dlho nestrihané, asi 15 cm, koľko?'}
NELEG={'odovzdanie','bez-ceny'}
def okset(r):
    p=r.get('prijatelne') or []
    if isinstance(p,str): p=[x for x in p.split(',') if x]
    return {r['ocakavane']}|set(p)
T=collections.Counter(); L=F=0; rows_all=[]
print('| sada | spolu | OK | ODCHÝLKA (bez tvrdenia) | ODOVZDANIE‑NAVYŠE | CHYBA | legit | fallback_legit |')
for s in ['A','B','C2','D1','D2']:
    rows=json.load(open(f'vysledky-{s}-v2-1-zarad.json')); c=collections.Counter(); l=f=0
    for r in rows:
        q=r['otazka']; t=r['trieda']
        if (s,q) in CHYBA: t='CHYBA'
        elif q in ODCH_LEG or q in ODCH_NELEG: t='ODCHYLKA'
        elif q in CAS_PRI_CENE: t='ODOVZDANIE-NAVYSE'; r['podtrieda']='volba-trvania-pri-cene'
        assert t!='CHYBA-KANDIDAT',(s,q)
        r['trieda_final']=t; c[t]+=1
        if not okset(r)<=NELEG:
            l+=1; f+= t in ('ODOVZDANIE-NAVYSE','ODCHYLKA')
    json.dump(rows,open(f'vysledky-{s}-v2-1-final.json','w'),ensure_ascii=False,indent=0)
    T.update(c); L+=l; F+=f
    print(f"| {s} | {len(rows)} | {c['OK']} | {c['ODCHYLKA']} | {c['ODOVZDANIE-NAVYSE']} | {c['CHYBA']} | {l} | {f} ({100*f/l:.1f} %) |")
print(f"| spolu | {sum(T.values())} | {T['OK']} | {T['ODCHYLKA']} | {T['ODOVZDANIE-NAVYSE']} | {T['CHYBA']} | {L} | {F} ({100*F/L:.2f} %) |")
