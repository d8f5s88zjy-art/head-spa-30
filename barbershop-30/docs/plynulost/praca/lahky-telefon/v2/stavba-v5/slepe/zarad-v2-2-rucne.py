# ručné rozhodnutia nad zarad-v2-1.py (hodnotenie v2-2, HEAD 854e849); výstup vysledky-*-v2-2-final.json + tabuľka
import json,collections
CHYBA=set()
OK_RUCNE={('E2','Kann ich mir meinen Barber aussuchen?')}   # odpoveď tim obsahuje celú vetu vyber-barbera
ODCH_LEG={  # pravdivá priama odpoveď, ale neodpovie na celú otázku -> rátané do fallback_legit
 ('A','chcem sa objednat na strih'):'rezervácia → výber barbera',
 ('D1','Dobry den, chcel by som sa objednat na strih, ako na to?'):'rezervácia → výber barbera',
 ('E2','Dá sa objednať cez net aj o polnoci?'):'online → rezervácia (bez 24/7)',
 ('E2','Kedy máte v sobotu otvorené a kde presne ste?'):'hodiny bez adresy',
 ('E2','dajte mi broj i mejl'):'telefón bez e-mailu',
 ('E2','Jak dlouho trvá úprava vousů a kolik stojí?'):'trvanie bez ceny',
 ('E2','Wie lange dauert ein Haarschnitt und was kostet er?'):'trvanie bez ceny',
 ('E2','Koliko košta šišanje i koliko traje?'):'trvanie bez ceny'}
ODCH_NELEG={('B','Máte TikTok?'),('B','Hundefriseur?'),('D1','Máte wifi v čakárni?')}
NELEG={'odovzdanie','bez-ceny'}
def okset(r):
    p=r.get('prijatelne') or []
    if isinstance(p,str): p=[x for x in p.split(',') if x]
    return {r['ocakavane']}|set(p)
T=collections.Counter(); L=F=0
print('| sada | spolu | OK | ODCHÝLKA (bez tvrdenia) | ODOVZDANIE‑NAVYŠE | CHYBA | legitímne | fallback_legit |')
print('|---|---|---|---|---|---|---|---|')
for s in ['A','B','C2','D1','D2','E2']:
    rows=json.load(open(f'vysledky-{s}-v2-2-zarad.json')); c=collections.Counter(); l=f=0
    for r in rows:
        k=(s,r['otazka']); t=r['trieda']
        if k in CHYBA: t='CHYBA'
        elif k in OK_RUCNE: t='OK'; r['podtrieda']='rucne-ekvivalent'
        elif k in ODCH_LEG: t='ODCHYLKA'; r['podtrieda']=ODCH_LEG[k]
        elif k in ODCH_NELEG: t='ODCHYLKA'; r['podtrieda']='tema-odovzdania-info-polozka'
        assert t!='CHYBA-KANDIDAT',k
        r['trieda_final']=t; c[t]+=1
        if not okset(r)<=NELEG:
            l+=1; f+= t in ('ODOVZDANIE-NAVYSE','ODCHYLKA')
    json.dump(rows,open(f'vysledky-{s}-v2-2-final.json','w'),ensure_ascii=False,indent=0)
    T.update(c); L+=l; F+=f
    print(f"| {s} | {len(rows)} | {c['OK']} | {c['ODCHYLKA']} | {c['ODOVZDANIE-NAVYSE']} | {c['CHYBA']} | {l} | {f} ({100*f/l:.1f} %) |".replace('.',','))
print(f"| **spolu** | **{sum(T.values())}** | {T['OK']} | {T['ODCHYLKA']} | {T['ODOVZDANIE-NAVYSE']} | **{T['CHYBA']}** | {L} | **{F} ({100*F/L:.2f} %)** |".replace('.',','))
