#!/usr/bin/env python3
"""Validate the skill's internal links, catalog relationships and example contracts."""
import csv,json,re,subprocess,sys
from collections import Counter
from pathlib import Path
import studio
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'assets/catalogs'
errors=[]
def check(condition,message):
    if not condition: errors.append(message)
def load(name): return json.loads((DATA/f'{name}.json').read_text())
manifest=load('manifest')
tech=load('techniques');sources=load('sources');source_ids={s['id'] for s in sources}
check(len(source_ids)==len(sources),'Duplicate source IDs')
check(len({t['id'] for t in tech})==len(tech),'Duplicate technique IDs')
check(len(tech)==manifest['cinematic_extension']['techniques'],'Technique count mismatch')
check(len(sources)==manifest['cinematic_extension']['primary_source_records'],'Source count mismatch')
for item in tech:
    for field in ['id','name','name_sk','family','purpose','implementation','cost','mobile','reduced_motion','fallback','failure','checks','source_ids','validation_status']:
        check(bool(item.get(field)),f"{item.get('id')}: missing {field}")
    check(set(item['source_ids'])<=source_ids,f"{item['id']}: unknown source")
for file in ROOT.rglob('*.md'):
    text=file.read_text()
    for target in re.findall(r'\]\(([^)]+)\)',text):
        if '://' in target or target.startswith('#'):continue
        check((file.parent/target.split('#')[0]).exists(),f'{file.relative_to(ROOT)}: missing {target}')
    if file.name not in ['SKILL.md']:
        for source_id in re.findall(r'\bS\d{3}\b',text):check(source_id in source_ids,f'Unknown source {source_id}')
for name in ['websites','tools']:
    check(len(load(name))==manifest[name],f'{name} legacy count changed')
with (DATA/'prompts.jsonl').open() as f:
    prompts=[json.loads(line) for line in f if line.strip()]
check(len(prompts)==manifest['prompts_total'],'Legacy prompt count changed')
spec=json.loads((ROOT/'assets/templates/motion-spec.json').read_text())
check(set(spec['technique_ids'])<={x['id'] for x in tech},'Motion spec has invalid FX ids')
plan=json.loads((ROOT/'assets/templates/shot-plan.json').read_text())
check(plan['keyframes'][0]['progress']==0 and plan['keyframes'][-1]['progress']==1,'Shot plan endpoints')
with (ROOT/'assets/templates/acceptance-matrix.csv').open() as f:
    checks=list(csv.DictReader(f))
check(all(x['status']=='not_run' for x in checks),'Template must not claim pre-run acceptance')
upgrade=manifest.get('production_upgrade',{})
acceptance=load('acceptance-checks');cases=load('application-cases')
check(len(acceptance)==upgrade.get('acceptance_checks'),'Acceptance registry count mismatch')
check(len({x['id'] for x in acceptance})==len(acceptance),'Duplicate acceptance check IDs')
allowed_methods={'source_review','visual_review','browser_behavior','runtime_measurement','build_or_targeted_test','handoff_review'}
for entry in acceptance:
    check(bool(entry.get('observe')),f"{entry['id']}: missing observable result")
    check(bool(entry.get('evidence_methods')) and set(entry['evidence_methods'])<=allowed_methods,f"{entry['id']}: invalid method")
check(len(cases)==upgrade.get('application_case_prompts'),'Application case count mismatch')
check(len({x['id'] for x in cases})==len(cases),'Duplicate application case IDs')
check(all(x.get('runtime_status')=='not_run_by_catalog' for x in cases),'Prompt catalog must not imply test execution')
brief=studio.read_json(ROOT/'assets/templates/project-brief.json')
production_plan=studio.plan(brief)
check(set(production_plan['required_checks'])<={x['id'] for x in acceptance},'Unknown generated check ID')
review=studio.init_review(brief,'unexecuted-template')
check(all(x['status']=='not_run' and not x['evidence'] for x in review['checks']),'Review template must not prefill passes')
memory=studio.estimate_memory(studio.read_json(ROOT/'assets/templates/memory-plan.json'))
check(memory['nominal_bytes']>0,'Memory template must estimate a positive payload')
scene=json.loads((ROOT/'assets/templates/scene-plan.json').read_text())
check(scene['chapters'][0]['start']==0 and scene['chapters'][-1]['end']==1,'Scene template range')
check(len(list((ROOT/'references').glob('*.md')))==manifest['cinematic_extension']['reference_chapters_total'],'Reference chapter count mismatch')
chapters=load('chapters');chapter_ids={r['id'] for r in chapters}
check([r['id'] for r in chapters]==[f'C{i:03d}' for i in range(1,101)],'Chapters must be exactly C001-C100 in order')
check(len({r['path'] for r in chapters})==100,'Chapter paths must be unique')
domain_counts=Counter(r['domain'] for r in chapters)
check(len(domain_counts)==10 and set(domain_counts.values())=={10},'Require exactly ten chapters in each of ten domains')
check(manifest['senior_upgrade']['chapter_count']==len(chapters),'Senior chapter manifest mismatch')
skill=(ROOT/'SKILL.md').read_text()
for chapter in chapters:
    for field in ['title','use','decision','deliverable','acceptance']:
        check(bool(chapter.get(field)),f"{chapter['id']}: missing {field}")
    check((ROOT/chapter['path']).is_file(),f"Missing chapter {chapter['id']}")
    check(f"]({chapter['path']})" in skill,f"Chapter not linked directly from SKILL: {chapter['id']}")
    check(set(chapter['source_ids'])<=source_ids,f"Unknown chapter source: {chapter['id']}")
routes=load('chapter-routes')
check(len(routes)==manifest['senior_upgrade']['chapter_routes'],'Route count mismatch')
for route in routes:
    check(set(route['chapter_ids'])<=chapter_ids,f"Unknown chapter in route {route['id']}")
    check(len(set(route['chapter_ids']))==len(route['chapter_ids']),f"Duplicate route chapter {route['id']}")
designer=load('designer-prompts')
check([x['id'] for x in designer]==[f'D{i:03d}' for i in range(1,25)],'Designer task IDs must be D001-D024')
check(len(designer)==manifest['senior_upgrade']['designer_task_prompts'],'Designer manifest mismatch')
for task in designer:
    check((ROOT/task['path']).is_file() and (ROOT/task['master_path']).is_file(),f"Missing designer prompt {task['id']}")
    check(set(task['chapter_ids'])<=chapter_ids,f"Unknown designer chapter {task['id']}")
    check(task['origin']=='original_designer_task_template',f"Invalid origin for {task['id']}")
commands=[['search','--kind','techniques','--query','prechod','--limit','3'],['search','--kind','techniques','--family','camera','--limit','2'],['show','FX014'],['show','S012'],['search','--kind','prompts','--reference','W005','--phase','motion','--limit','1'],['search','--kind','chapters','--query','rezervacie','--limit','3'],['show','C100'],['show','D007'],['route','minor-fix'],['route','graphic-designer']]
for command in commands:
    result=subprocess.run([sys.executable,str(ROOT/'scripts/catalog.py'),*command],capture_output=True,text=True)
    check(result.returncode==0,f'Catalog failed: {command}: {result.stderr}')
    if result.returncode==0:
        obj=json.loads(result.stdout)
        if command[0]=='search':check(obj['matches']>0,f'Empty expected search {command}')
if errors:
    print('\n'.join(errors));sys.exit(1)
print(json.dumps({'status':'passed','chapters':len(chapters),'domains':dict(domain_counts),'designer_task_prompts':len(designer),'techniques':len(tech),'sources':len(sources),'legacy_prompts':len(prompts),'catalog_queries':len(commands),'acceptance_template_rows':len(checks),'production_checks':len(acceptance),'application_case_prompts':len(cases)},ensure_ascii=False))
