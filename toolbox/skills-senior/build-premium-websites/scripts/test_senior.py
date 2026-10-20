#!/usr/bin/env python3
"""Targeted checks for bounded chapter routing and literal designer prompt composition."""
import json,subprocess,sys,tempfile,unittest
from pathlib import Path
import designer

ROOT=Path(__file__).resolve().parents[1]
def cli(*args):
    return subprocess.run([sys.executable,str(ROOT/'scripts/catalog.py'),*args],capture_output=True,text=True)

class SeniorToolsTests(unittest.TestCase):
    def test_minor_change_route_stays_small(self):
        r=cli('route','minor-fix');self.assertEqual(r.returncode,0,r.stderr)
        self.assertEqual(json.loads(r.stdout)['chapter_ids'],['C001','C082','C100'])

    def test_routes_resolve_real_unique_chapters(self):
        routes=json.loads((ROOT/'assets/catalogs/chapter-routes.json').read_text())
        for route in routes:
            result=cli('route',route['id']);self.assertEqual(result.returncode,0,result.stderr)
            data=json.loads(result.stdout)
            self.assertEqual(len(data['chapters']),len(set(data['chapter_ids'])))
            self.assertTrue(all((ROOT/c['path']).is_file() for c in data['chapters']))

    def test_slovak_diacritics_resolve_same_chapter(self):
        a=json.loads(cli('search','--kind','chapters','--query','rezervácie').stdout)
        b=json.loads(cli('search','--kind','chapters','--query','rezervacie').stdout)
        self.assertEqual(a,b);self.assertIn('C066',[x['id'] for x in a['items']])
        designer_query=json.loads(cli('search','--kind','chapters','--query','grafika').stdout)
        self.assertIn('C014',[x['id'] for x in designer_query['items']])

    def test_domain_filter_is_bounded(self):
        data=json.loads(cli('search','--kind','chapters','--domain','cinema','--limit','2').stdout)
        self.assertEqual(data['matches'],10);self.assertEqual(data['returned'],2)
        self.assertTrue(all(x['domain']=='cinema' for x in data['items']))

    def test_unknown_ids_and_unbounded_output_rejected(self):
        for args in [('show','C101'),('show','D025'),('route','not-a-route'),('search','--kind','chapters','--limit','0'),('search','--kind','chapters','--limit','100')]:
            self.assertNotEqual(cli(*args).returncode,0)

    def test_every_designer_task_composes_master_and_specific_deliverable(self):
        brief={'project_name':'Synthetic local test','verified_facts':[]}
        for entry in designer.records():
            value=designer.render(entry['id'],brief)
            self.assertIn('# Hlavný prompt',value)
            self.assertIn('# '+entry['id'],value)
            self.assertIn('## Povinný výstup',value)
            self.assertIn('## Akceptácia',value)
            self.assertIn('Neuzavreté kľúčové vstupy',value)

    def test_unknown_designer_task_rejected(self):
        with self.assertRaises(ValueError):designer.render('D025',{})

    def test_invalid_brief_shapes_rejected(self):
        for value in [[],None,{'verified_facts':'invented'}, {'primary_action':[]},{'audience':42}]:
            with self.assertRaises(ValueError):designer.render('D007',value)

    def test_untrusted_values_preserved_as_literal_data(self):
        value={'project_name':'A `literal` $(value)','business_goal':'line one\n```\nline two','verified_facts':['Price unknown'],'supplied_assets':['path with spaces.png']}
        out=designer.render('D007',value)
        self.assertIn('````json\n',out)
        payload=out.split('````json\n',1)[1].split('\n````',1)[0]
        self.assertEqual(json.loads(payload),value)
        self.assertNotIn('confirmed price',out)

    def test_template_remains_explicitly_unfilled(self):
        brief=json.loads((ROOT/'assets/templates/designer-brief.json').read_text())
        out=designer.render('D009',brief)
        self.assertIn('nevyplnená pracovná šablóna',out)
        self.assertIn('"budget_eur": null',out)
        self.assertIn('primary_action.destination',out)

    def test_cli_will_not_overwrite_input_brief(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'brief.json';original='{"project_name":"Synthetic"}'
            path.write_text(original)
            result=subprocess.run([sys.executable,str(ROOT/'scripts/designer.py'),'render','D007','--brief',str(path),'--output',str(path)],capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0)
            self.assertEqual(path.read_text(),original)

if __name__=='__main__':unittest.main()
