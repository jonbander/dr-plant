#!/usr/bin/env python3
"""Regression tests for exact Phase 0 data-root and split-manifest binding."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts'))
from training_gate_guard import enforce_training_gate, extract_training_gate_args

class TrainingGateBindingTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.base=Path(self.tmp.name)
        self.profile_dir=self.base/'profiles'
        self.profile_dir.mkdir()
        self.data_root=self.base/'dataset'
        self.data_root.mkdir()
        self.split=self.profile_dir/'split.csv'
        self.split.write_text('image_path,group_id,split\nleaf.jpg,vine-1,train\n',encoding='utf-8')
        self.profile=self.profile_dir/'profile.json'
        self.profile.write_text(json.dumps({'split_manifest':'split.csv'}),encoding='utf-8')
        self.args={'profile':str(self.profile),'profile_signature':str(self.profile_dir/'profile.sig'),
                   'data_root':str(self.data_root),'trusted_public_key':str(self.base/'trusted.pem'),
                   'expected_task':'classification'}

    def tearDown(self):
        self.tmp.cleanup()

    def test_rejects_actual_data_root_different_from_signed_root(self):
        other=self.base/'other'; other.mkdir()
        with self.assertRaisesRegex(SystemExit,'data root mismatch'):
            enforce_training_gate(self.args,data_root=other,split_manifest=self.split)

    def test_rejects_actual_split_different_from_signed_split(self):
        other=self.profile_dir/'other-split.csv'; other.write_text('different',encoding='utf-8')
        with self.assertRaisesRegex(SystemExit,'split manifest mismatch'):
            enforce_training_gate(self.args,data_root=self.data_root,split_manifest=other)

    def test_exact_data_root_and_split_are_passed_to_validator(self):
        with patch('training_gate_guard.subprocess.run') as run:
            run.return_value.returncode=0
            enforce_training_gate(self.args,data_root=self.data_root,split_manifest=self.split)
            command=run.call_args.args[0]
            self.assertIn('--expected-task',command)
            self.assertIn('classification',command)
            self.assertIn(str(self.data_root.resolve()),command)

    def test_legacy_trainers_with_internal_splits_are_blocked(self):
        for rel in ('scripts/train_citrus_field_v3.py','scripts/train_lemon_v3_exploratory.py',
                    'scripts/research/train_vitis_morphology.py'):
            with self.subTest(entrypoint=rel), patch.object(sys,'argv',[str(ROOT/rel)]):
                with self.assertRaisesRegex(SystemExit,'blocked until it consumes the signed Phase 0 split manifest'):
                    extract_training_gate_args()

if __name__=='__main__':
    unittest.main(verbosity=2)
