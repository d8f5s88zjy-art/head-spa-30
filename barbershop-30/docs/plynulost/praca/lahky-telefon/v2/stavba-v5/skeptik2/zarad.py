# skeptik 2: zaradenie odpovedí podľa očakávaní v otazky-v5-2*.txt
import json,sys,collections
a=json.load(open('detail.json',encoding='utf8'))
# ručné rozhodnutia (otázka -> trieda, dôvod)
RUCNE={
 'Kde je váš barbershop?':('ODCHYLKA','holá info inej položky (tím) namiesto adresy'),
 'Kde máte barbershop?':('ODCHYLKA','holá info inej položky (tím) namiesto adresy'),
 'Where is your barbershop?':('ODCHYLKA','holá info inej položky (tím) namiesto adresy'),
 'Wo ist euer Barbershop?':('ODCHYLKA','holá info inej položky (tím) namiesto adresy'),
}
res=[]
for o in a:
    e=o['ocak']; kind,_,iid=e.partition(':'); t=o['typ']; top2=(o.get('volby') or [])[:2]
    holy = t=='odpoved' and (o.get('cena') or o.get('trvanie'))
    if o['q'] in RUCNE: k,why=RUCNE[o['q']]
    elif kind=='cena':
        if t=='odpoved' and o['id']==iid: k,why='OK-HNED',''
        elif t=='odpoved': k,why='CHYBA','iná cena'
        elif t=='vyber' and iid in top2: k,why='OK-VOLBA',''
        else: k,why='ODOVZDANIE-NAVYSE',''
    elif kind=='trvanie':
        if t=='odpoved' and o.get('sluzba')==iid: k,why='OK-HNED',''
        elif holy: k,why='CHYBA','iné trvanie'
        elif t=='vyber' and iid in top2: k,why='OK-VOLBA',''
        else: k,why='ODOVZDANIE-NAVYSE',''
    elif kind=='info':
        if t=='odpoved' and o['id']==iid: k,why='OK-HNED',''
        elif t=='odpoved': k,why='ODCHYLKA','iná info položka'
        elif t=='vyber' and iid in top2: k,why='OK-VOLBA',''
        else: k,why='ODOVZDANIE-NAVYSE',''
    elif kind=='nie-22':
        k,why=('CHYBA','22 € pri dĺžke pod 10 cm') if holy and '22' in json.dumps(o.get('odpoved')) else ('OK','')
    elif kind in ('nie-hola','nevieme'):
        k,why=('CHYBA','holá cena/trvanie, otázka menuje aj ďalšiu vec') if holy else ('OK','')
    o['trieda']=k; o['dovod']=why; res.append(o)
c=collections.Counter(o['trieda'] for o in res)
print('spolu',len(res),dict(c))
for d in 'BVP':
    print(d, dict(collections.Counter(o['trieda'] for o in res if o['druh']==d)))
print('podla jazyka:')
for j in 'sk en de hu pl sr uk cs'.split():
    print(' ',j,dict(collections.Counter(o['trieda'] for o in res if o['j']==j)))
for o in res:
    if o['trieda'] in ('CHYBA','ODCHYLKA','ODOVZDANIE-NAVYSE'):
        print(o['trieda'],'|',o['j'],'|',o['q'],'→',o['typ'],o.get('id',''),(json.dumps(o.get('odpoved'),ensure_ascii=False)[:70] if o['typ']=='odpoved' else o.get('volby') or o.get('odovzdanie') or ''),'|',o['dovod'])
b=[o for o in res if o['druh']=='B']
print('bezne: priamo',sum(o['trieda']=='OK-HNED' for o in b),'/',len(b),'; volba',sum(o['trieda']=='OK-VOLBA' for o in b))
print('cas max ms',max(o['ms'] for o in res))
json.dump(res,open('zarad.json','w',encoding='utf8'),ensure_ascii=False,indent=0)
