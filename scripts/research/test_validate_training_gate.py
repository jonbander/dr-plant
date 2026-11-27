#!/usr/bin/env python3
"""Integration tests for the fail-closed data training gate."""
import csv, hashlib, json, os, subprocess, tempfile, unittest
from pathlib import Path

SCRIPT=Path(__file__).with_name('validate-training-gate.py')

def run(cmd):
    p=subprocess.run(cmd,capture_output=True,text=True)
    if p.returncode: raise AssertionError(p.stdout+'\n'+p.stderr)
    return p

def sign(private, source, signature):
    run(['openssl','pkeyutl','-sign','-inkey',str(private),'-rawin','-in',str(source),'-out',str(signature)])

class TrainingGateTests(unittest.TestCase):
    def test_valid_classification_profile_passes_research_only(self):
        with tempfile.TemporaryDirectory() as td:
            base=Path(td); payload=base/'payload'; payload.mkdir()
            (payload/'a.jpg').write_bytes(b'image-a')
            (payload/'b.jpg').write_bytes(b'image-b')
            (payload/'c.jpg').write_bytes(b'image-c')
            priv=base/'private.pem'; pub=base/'public.pem'
            run(['openssl','genpkey','-algorithm','ED25519','-out',str(priv)])
            run(['openssl','pkey','-in',str(priv),'-pubout','-out',str(pub)])
            def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
            delivery={'dataset_id':'unit-test','dataset_version':'1.0','delivery_id':'delivery-001','hash_scope':'extracted_file_bytes','files':[{'path':p.name,'bytes':p.stat().st_size,'sha256':sha(p),'record_count':1} for p in sorted(payload.iterdir())]}
            dm=base/'delivery.json'; dm.write_text(json.dumps(delivery),encoding='utf-8'); dms=base/'delivery.sig'; sign(priv,dm,dms)
            dataset={'spdx_version':'SPDX-3.0','dataset_id':'unit-test','dataset_version':'1.0','source_url':'https://example.org/dataset','provider':'Example','license_expression':'CC-BY-4.0','license_status':'verified','research_training_use':'allowed','commercial_use':'allowed','redistribution':'allowed','model_weight_distribution':'allowed','attribution':'Required','collection_method':'documented','processing_method':'documented','human_review':{'reviewer_id':'reviewer-1','reviewer_role':'data-license-reviewer','review_date':'2026-11-27','decision':'approved_for_declared_scope'}}
            dp=base/'dataset-profile.json'; dp.write_text(json.dumps(dataset),encoding='utf-8'); dps=base/'dataset-profile.sig'; sign(priv,dp,dps)
            split=base/'split.csv'
            with split.open('w',newline='',encoding='utf-8') as f:
                w=csv.DictWriter(f,fieldnames=['image_path','group_id','split','sha256','phash','near_duplicate_group_id','source_class']); w.writeheader()
                for i,p in enumerate(sorted(payload.iterdir())): w.writerow({'image_path':p.name,'group_id':f'group-{i}','split':['train','val','test'][i],'sha256':sha(p),'phash':f'{i:016x}','near_duplicate_group_id':f'near-{i}','source_class':'Disease A'})
            near=base/'near.json'; near.write_text(json.dumps({'status':'PASS','cross_split_pairs':0,'unresolved_pairs':0,'near_duplicate_pairs':0,'reviewed_pairs':0,'algorithm':'test-phash-v1','implementation':'test','threshold_hamming':6,'audited_manifest_sha256':hashlib.sha256(split.read_bytes()).hexdigest()}),encoding='utf-8')
            taxonomy=base/'taxonomy.json'; taxonomy.write_text(json.dumps({'classes':[{'source_class':'Disease A','decision':'MAP_EPPO','eppo_code':'ABCD01','eppo_rank':'species','eppo_reference_url':'https://gd.eppo.int/','eppo_validation_status':'verified','reviewer':'reviewer-1','review_date':'2026-11-27'}]}),encoding='utf-8')
            split_sig=base/'split.sig'; sign(priv,split,split_sig)
            near_sig=base/'near.sig'; sign(priv,near,near_sig)
            tax_sig=base/'taxonomy.sig'; sign(priv,taxonomy,tax_sig)
            profile={'schema_version':1,'dataset_id':'unit-test','task_scope':['classification'],'grouping_unit':'vineyard_or_block','delivery_manifest':'delivery.json','delivery_signature':'delivery.sig','dataset_profile':'dataset-profile.json','dataset_profile_signature':'dataset-profile.sig','split_manifest':'split.csv','split_manifest_signature':'split.sig','near_duplicate_audit':'near.json','near_duplicate_audit_signature':'near.sig','taxonomy_map':'taxonomy.json','taxonomy_map_signature':'taxonomy.sig','gold_mask_audit':None}
            pf=base/'profile.json'; pf.write_text(json.dumps(profile),encoding='utf-8'); pfs=base/'profile.sig'; sign(priv,pf,pfs)
            out=run(['python3',str(SCRIPT),'--profile',str(pf),'--profile-signature',str(pfs),'--data-root',str(payload),'--trusted-public-key',str(pub)])
            result=json.loads(out.stdout)
            self.assertEqual(result['status'],'RESEARCH-GO')
            self.assertTrue(result['research_training_allowed'])
            self.assertFalse(result['hybrid_adoption_allowed'])
            # Any unlisted file in the delivery root is rejected.
            rogue=payload/'rogue.jpg'; rogue.write_bytes(b'unlisted')
            rogue_result=subprocess.run(['python3',str(SCRIPT),'--profile',str(pf),'--profile-signature',str(pfs),'--data-root',str(payload),'--trusted-public-key',str(pub)],capture_output=True,text=True)
            self.assertEqual(rogue_result.returncode,2)
            self.assertIn('unlisted_assets:rogue.jpg',rogue_result.stdout)
            rogue.unlink()
            # A biological group moved across train/test must block the same signed profile.
            with split.open(newline='',encoding='utf-8') as f: split_rows=list(csv.DictReader(f))
            split_rows[1]['group_id']=split_rows[0]['group_id']
            with split.open('w',newline='',encoding='utf-8') as f:
                w=csv.DictWriter(f,fieldnames=list(split_rows[0])); w.writeheader(); w.writerows(split_rows)
            sign(priv,split,split_sig)
            near_data=json.loads(near.read_text()); near_data['audited_manifest_sha256']=hashlib.sha256(split.read_bytes()).hexdigest(); near.write_text(json.dumps(near_data),encoding='utf-8'); sign(priv,near,near_sig)
            blocked=subprocess.run(['python3',str(SCRIPT),'--profile',str(pf),'--profile-signature',str(pfs),'--data-root',str(payload),'--trusted-public-key',str(pub)],capture_output=True,text=True)
            self.assertEqual(blocked.returncode,2)
            self.assertIn('biological_group_cross_split',blocked.stdout)


    def test_training_entrypoint_guard_blocks_missing_gate_arguments(self):
        code="import sys; sys.path.insert(0, 'scripts'); from training_gate_guard import extract_training_gate_args; extract_training_gate_args()"
        out=subprocess.run(['python3','-c',code],capture_output=True,text=True)
        self.assertNotEqual(out.returncode,0)
        self.assertIn('NO-GO',out.stderr+out.stdout)

    def test_training_entrypoint_guard_preserves_help(self):
        code="import sys; sys.argv=['train.py','--help']; sys.path.insert(0, 'scripts'); from training_gate_guard import extract_training_gate_args; assert extract_training_gate_args() is None"
        run(['python3','-c',code])

    def test_incomplete_profile_fails_closed(self):
        with tempfile.TemporaryDirectory() as td:
            base=Path(td); payload=base/'payload'; payload.mkdir(); (payload/'extra.jpg').write_bytes(b'extra')
            profile=base/'profile.json'; profile.write_text(json.dumps({'schema_version':1,'task_scope':['classification'],'grouping_unit':'tree'}),encoding='utf-8')
            out=subprocess.run(['python3',str(SCRIPT),'--profile',str(profile),'--profile-signature',str(base/'missing-profile.sig'),'--data-root',str(payload),'--trusted-public-key',str(base/'missing-public.pem')],capture_output=True,text=True)
            self.assertEqual(out.returncode,2)
            self.assertFalse(json.loads(out.stdout)['research_training_allowed'])

if __name__=='__main__': unittest.main()
