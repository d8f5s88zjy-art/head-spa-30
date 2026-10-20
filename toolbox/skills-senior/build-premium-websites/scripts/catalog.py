#!/usr/bin/env python3
"""Bounded offline lookup of the premium web research catalogs."""
import argparse,json,re,unicodedata
from pathlib import Path

DATA=Path(__file__).resolve().parents[1]/'assets'/'catalogs'
def load(name):return json.loads((DATA/(name+'.json')).read_text())
def norm(s):return ''.join(c for c in unicodedata.normalize('NFKD',str(s)).lower() if not unicodedata.combining(c))
def prompt(id):
    with (DATA/'prompts.jsonl').open() as f:
        for line in f:
            p=json.loads(line)
            if p['id']==id:return p
    return None
def main():
    ap=argparse.ArgumentParser(description=__doc__);sub=ap.add_subparsers(dest='action',required=True)
    sub.add_parser('stats')
    ss=sub.add_parser('search');ss.add_argument('--kind',choices=['websites','tools','prompts','social','techniques','sources','chapters','designer-prompts'],default='websites');ss.add_argument('--query',default='');ss.add_argument('--reference');ss.add_argument('--phase');ss.add_argument('--family',choices=['motion','transition','camera','vfx','interaction']);ss.add_argument('--domain');ss.add_argument('--origin',choices=['published_original','original_adaptation']);ss.add_argument('--limit',type=int,default=5)
    sh=sub.add_parser('show');sh.add_argument('id')
    rt=sub.add_parser('route');rt.add_argument('id',choices=[r['id'] for r in load('chapter-routes')])
    a=ap.parse_args()
    if a.action=='stats':out=load('manifest')
    elif a.action=='route':
        route=next(r for r in load('chapter-routes') if r['id']==a.id)
        chapters={r['id']:r for r in load('chapters')}
        out={**route,'chapters':[{k:chapters[id][k] for k in ['id','title','path','use']} for id in route['chapter_ids']]}
    elif a.action=='show':
        if a.id.startswith(('O','P')):out=prompt(a.id)
        else:
            key=next((kind for prefix,kind in [('FX','techniques'),('C','chapters'),('D','designer-prompts'),('S','sources'),('W','websites'),('TT','social'),('T','tools')] if a.id.startswith(prefix)),None)
            if key is None:ap.error('Unknown catalog id: '+a.id)
            out=next((r for r in load(key) if r['id']==a.id),None)
        if out is None:ap.error('Unknown catalog id: '+a.id)
    else:
        if not 1<=a.limit<=20:ap.error('--limit must be between 1 and 20')
        rows=load('prompt_index' if a.kind=='prompts' else a.kind)
        terms=re.findall(r'\w+',norm(a.query));ranked=[]
        search_keys=['id','name','name_sk','title','category','tags','origin','phase','family','domain','domain_name_sk','purpose','implementation','fallback','failure','checks','reference_id','reference_name','preview_observation','proposed_transfer','practice_project','practice_goal','use','caution','caption_excerpt','creator','decision','deliverable','acceptance']
        for r in rows:
            if a.reference and r.get('reference_id')!=a.reference:continue
            if a.phase and r.get('phase')!=a.phase:continue
            if a.origin and r.get('origin')!=a.origin:continue
            if a.family and r.get('family')!=a.family:continue
            if a.domain and r.get('domain')!=a.domain:continue
            hay=norm(' '.join(str(r.get(k,'')) for k in search_keys));tokens=set(re.findall(r'\w+',hay))
            matched=[any(t==word or (len(t)>=4 and word.startswith(t)) for word in tokens) for t in terms]
            if terms and not all(matched):continue
            title_tokens=set(re.findall(r'\w+',norm(r.get('name',r.get('title','')))))
            score=sum(3 if t in title_tokens else 1 for t in terms)
            ranked.append((score,r))
        ranked.sort(key=lambda t:(-t[0],t[1]['id']))
        keys=['id','name','name_sk','title','category','origin','phase','family','domain','path','master_path','chapter_ids','purpose','cost','fallback','validation_status','reference_id','url','source_url','evidence_level','preview_observation','proposed_transfer','use','caution','license','status','review_flags']
        out={'matches':len(ranked),'returned':min(a.limit,len(ranked)),'items':[{k:v for k,v in r.items() if k in keys} for _,r in ranked[:a.limit]]}
    print(json.dumps(out,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
