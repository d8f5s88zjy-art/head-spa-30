# Rozparsuje dáta rezervačného komponentu starého webu (služby, texty)
import sys,re,html,json
s=open(sys.argv[1],encoding='utf-8').read()
m=re.search(r'<v-order-component\s+data="([^"]*)"\s+ajax-url="([^"]*)"\s+lang="([^"]*)"',s,re.S)
data=json.loads(html.unescape(m.group(1)))
lang=json.loads(html.unescape(m.group(3)))
out=sys.argv[2]
json.dump({'data':data,'ajax':m.group(2),'lang':lang},open(out,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('kľúče data:',list(data.keys()))
for sv in data.get('services',[]):
    print(sv['id'],'|',sv['name'],'|',sv['price'],'€|',sv['time'],'min| main',sv.get('main'),'| pos',sv.get('position'),'| upd',sv.get('updated_at'))
for k in data:
    if k!='services': print(k, json.dumps(data[k],ensure_ascii=False)[:1500])
print('---- LANG')
for k,v in lang.items(): print(k,'=',v)
