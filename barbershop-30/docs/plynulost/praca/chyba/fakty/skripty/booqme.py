# Vytiahne služby z Booqme stránky rezervácie (id, názov, cena, trvanie, kategória, platba vopred)
import sys,re,html,json
s=open(sys.argv[1],encoding='utf-8').read()
out=[]
cards=list(re.finditer(r'<div class="card clickable[^"]*js-checkServiceCard[^"]*"([^>]*)>',s))
for i,m in enumerate(cards):
    a=dict(re.findall(r'([\w-]+)="([^"]*)"',m.group(1)))
    end=cards[i+1].start() if i+1<len(cards) else len(s)
    body=s[m.end():end]
    dur=re.search(r'Dĺžka trvania:\s*</[^>]+>\s*(?:<[^>]+>\s*)*([^<]+)',body)
    # kategória: posledný nadpis skupiny pred kartou
    pre=s[:m.start()]
    cat=re.findall(r'<h\d[^>]*>\s*([^<]{2,80}?)\s*</h\d>',pre)
    out.append({'id':a.get('data-service_id','').split('-')[-1],'nazov':html.unescape(a.get('data-service_name','')).strip(),
      'cena':a.get('data-price-raw'),'zlava':a.get('data-discount'),'trvanie':(dur.group(1).strip() if dur else None),
      'kategoria':html.unescape(cat[-1]).strip() if cat else None,'platba_povinna':a.get('data-payment-required'),
      'zaloha':a.get('data-advance-payment'),'schvalenie':a.get('data-approve-required'),'osoby':a.get('data-group-size-to')})
seen=set()
for o in out:
    if o['id'] in seen: continue
    seen.add(o['id']); print(json.dumps(o,ensure_ascii=False))
