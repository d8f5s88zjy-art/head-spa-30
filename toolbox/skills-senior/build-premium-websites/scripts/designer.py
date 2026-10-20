#!/usr/bin/env python3
"""Compose an original, detailed designer prompt without invoking a design service."""
import argparse,json
from pathlib import Path
from studio import read_json

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'assets/catalogs'

def records():
    return json.loads((DATA/'designer-prompts.json').read_text())

def validate_brief(value):
    if not isinstance(value,dict):
        raise ValueError('Brief must be a JSON object.')
    for name in ('verified_facts','supplied_assets','references','brand_constraints','scope_constraints','known_unknowns'):
        if name in value and not isinstance(value[name],list):
            raise ValueError(f'{name} must be a list.')
    if 'primary_action' in value and value['primary_action'] is not None and not isinstance(value['primary_action'],dict):
        raise ValueError('primary_action must be an object or null.')
    for name in ('project_name','business_goal','audience','delivery_format','language'):
        if name in value and value[name] is not None and not isinstance(value[name],str):
            raise ValueError(f'{name} must be a string or null.')
    return value

def missing_inputs(brief):
    missing=[k for k in ('project_name','business_goal','audience','delivery_format') if not brief.get(k)]
    if not brief.get('verified_facts'): missing.append('verified_facts')
    if not (brief.get('primary_action') or {}).get('destination'): missing.append('primary_action.destination')
    return missing

def render(task_id,brief):
    validate_brief(brief)
    entry=next((r for r in records() if r['id']==task_id),None)
    if entry is None: raise ValueError(f'Unknown designer task: {task_id}')
    master=(ROOT/entry['master_path']).read_text().strip()
    task=(ROOT/entry['path']).read_text().strip()
    missing=missing_inputs(brief)
    note=('Neuzavreté kľúčové vstupy: '+', '.join(missing)+'. Doplň ich zo skutočných podkladov, alebo ich ponechaj výslovne neznáme. Otázku polož iba vtedy, keď chýbajúci údaj materiálne blokuje správnosť požadovaného výstupu.') if missing else 'Základné vstupy sú vyplnené; ich prítomnosť sama osebe nepotvrdzuje pravdivosť ani úplnosť.'
    if brief.get('template'):
        note='Toto je nevyplnená pracovná šablóna, nie potvrdené klientské zadanie. '+note
    # Keep arbitrary supplied content literal and separate; do not interpolate it into code.
    payload=json.dumps(brief,ensure_ascii=False,indent=2,allow_nan=False)
    # A supplied string can contain backtick fences, so choose a fence it cannot close.
    fence='```'
    while fence in payload: fence+='`'
    return f'{master}\n\n## Projektový vstup\n\n{note}\n\n{fence}json\n{payload}\n{fence}\n\n{task}\n'

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    sub=ap.add_subparsers(dest='action',required=True)
    sub.add_parser('list')
    r=sub.add_parser('render');r.add_argument('id');r.add_argument('--brief',type=Path,required=True);r.add_argument('--output',type=Path)
    a=ap.parse_args()
    try:
        if a.action=='list':
            print(json.dumps([{'id':r['id'],'title':r['title'],'chapter_ids':r['chapter_ids']} for r in records()],ensure_ascii=False,indent=2));return
        output=render(a.id,read_json(a.brief))
        if a.output:
            if a.output.resolve()==a.brief.resolve(): raise ValueError('Output must not overwrite the input brief.')
            a.output.write_text(output)
            print(json.dumps({'written':str(a.output),'task':a.id,'note':'Prompt composed; no design service invoked.'},ensure_ascii=False))
        else: print(output,end='')
    except (ValueError,OSError,TypeError) as e: ap.error(str(e))

if __name__=='__main__':main()
