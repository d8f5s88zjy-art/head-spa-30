#!/usr/bin/env python3
"""Adversarial record tests using synthetic evidence, not website acceptance."""
import copy
import hashlib
import tempfile
import unittest
from pathlib import Path
import studio


class StudioTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.brief = studio.read_json(studio.ROOT/'assets/templates/project-brief.json')
        self.build = 'synthetic-unit-fixture'
        self.file = self.root/'synthetic-observation.txt'
        self.file.write_text('Synthetic evidence for record validation only; no website was tested.\n')
        self.review = studio.init_review(self.brief, self.build)
        definitions = {x['id']: x for x in studio.registry()}
        for row in self.review['checks']:
            row.update(status='pass', method=definitions[row['id']]['evidence_methods'][0],
                       environment='synthetic unit fixture', observation='Record validation fixture',
                       evidence=[{'path':self.file.name, 'sha256':hashlib.sha256(self.file.read_bytes()).hexdigest()}])

    def result(self):
        return studio.check_review(self.brief,self.review,self.root,self.build)

    def test_valid_records_are_only_record_consistent(self):
        r=self.result()
        self.assertEqual(r['status'],'record_consistent')
        self.assertIn('does not execute',r['boundary'])

    def test_empty_and_unexecuted_reviews_cannot_pass(self):
        self.review['checks']=[]
        self.assertEqual(self.result()['status'],'incomplete_or_inconsistent')
        self.review=studio.init_review(self.brief,self.build)
        self.assertEqual(self.result()['status'],'incomplete_or_inconsistent')

    def test_duplicate_unknown_and_omitted_checks_rejected(self):
        for change in ('duplicate','unknown','missing'):
            with self.subTest(change=change):
                original=copy.deepcopy(self.review)
                if change=='duplicate':self.review['checks'].append(copy.deepcopy(self.review['checks'][0]))
                elif change=='unknown':self.review['checks'][0]['id']='made-up'
                else:self.review['checks'].pop()
                self.assertTrue(self.result()['errors'])
                self.review=original

    def test_wrong_method_cannot_pass_browser_check(self):
        next(x for x in self.review['checks'] if x['id']=='journey')['method']='visual_review'
        self.assertTrue(any('incompatible' in x for x in self.result()['errors']))

    def test_stale_build_rejected_at_review_and_check(self):
        self.review['build_id']='old'
        self.review['checks'][0]['build_id']='old'
        self.assertGreaterEqual(len(self.result()['errors']),2)

    def test_modified_or_empty_artifact_rejected(self):
        self.file.write_text('changed')
        self.assertTrue(any('hash mismatch' in x for x in self.result()['errors']))
        self.file.write_text('')
        self.assertTrue(any('nonempty' in x for x in self.result()['errors']))

    def test_missing_file_and_absolute_path_rejected(self):
        self.review['checks'][0]['evidence'][0]['path']='absent.txt'
        self.assertTrue(self.result()['errors'])
        self.review['checks'][0]['evidence'][0]['path']=str(self.file)
        self.assertTrue(any('relative' in x for x in self.result()['errors']))

    def test_symlink_escape_rejected(self):
        with tempfile.TemporaryDirectory() as outside:
            path=Path(outside)/'outside.txt';path.write_text('outside')
            (self.root/'escape').symlink_to(path)
            e=self.review['checks'][0]['evidence'][0]
            e.update(path='escape',sha256=hashlib.sha256(path.read_bytes()).hexdigest())
            self.assertTrue(any('escapes' in x for x in self.result()['errors']))

    def test_pass_without_observation_or_artifact_rejected(self):
        row=self.review['checks'][0]
        row.update(environment='',observation='',evidence=[])
        self.assertGreaterEqual(len(self.result()['errors']),3)

    def test_required_3d_missing_model_remains_dependency(self):
        self.brief.update(needs_3d_interaction=True,has_verified_model=False)
        p=studio.plan(self.brief)
        self.assertEqual(p['media']['preferred'],'interactive_3d')
        self.assertTrue(p['media']['missing_inputs'])
        self.assertIn('three_d',p['required_checks'])

    def test_production_capabilities_add_required_checks(self):
        self.brief.update(commerce=True,form_submission=True,cms=True)
        self.assertTrue({'commerce','form','cms'}<=set(studio.plan(self.brief)['required_checks']))

    def test_bad_flags_and_numbers_rejected(self):
        for name,value in [('wants_motion','false'),('budget_eur',True),('timeline_days',float('nan'))]:
            with self.subTest(name=name):
                b=copy.deepcopy(self.brief);b[name]=value
                with self.assertRaises(ValueError):studio.plan(b)

    def test_duplicate_json_keys_rejected(self):
        path=self.root/'duplicate.json';path.write_text('{"id":1,"id":2}')
        with self.assertRaises(ValueError):studio.read_json(path)

    def test_nominal_payload_and_mip_chain(self):
        spec={'schema_version':1,'items':[{'id':'frame','width':1920,'height':1080,'bytes_per_pixel':4,'count':12,'mipmaps':False}]}
        self.assertEqual(studio.estimate_memory(spec)['nominal_bytes'],99532800)
        spec['items'][0].update(width=1,height=8,count=1,mipmaps=True)
        self.assertEqual(studio.estimate_memory(spec)['nominal_bytes'],(8+4+2+1)*4)

    def test_memory_rejects_duplicate_ids_zero_and_boolean(self):
        spec=studio.read_json(studio.ROOT/'assets/templates/memory-plan.json')
        for field,value in [('width',0),('count',True),('height',-1)]:
            s=copy.deepcopy(spec);s['items'][0][field]=value
            with self.assertRaises(ValueError):studio.estimate_memory(s)
        spec['items'].append(copy.deepcopy(spec['items'][0]))
        with self.assertRaises(ValueError):studio.estimate_memory(spec)


if __name__=='__main__':
    unittest.main()
