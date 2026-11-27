import csv, subprocess, sys, tempfile, unittest
from pathlib import Path
SCRIPT=Path(__file__).with_name('verify-splits.py')
class VerifySplitTests(unittest.TestCase):
    def run_check(self, text, args):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'m.csv'; p.write_text(text,encoding='utf-8')
            return subprocess.run([sys.executable,str(SCRIPT),str(p),*args],capture_output=True,text=True)
    def test_passes_group_disjoint(self):
        r=self.run_check('tree,split\nT1,train\nT2,test\n',['--group-col','tree'])
        self.assertEqual(r.returncode,0,r.stdout+r.stderr)
        self.assertIn('"status": "PASS"',r.stdout)
    def test_fails_group_leakage(self):
        r=self.run_check('tree,split\nT1,train\nT1,test\n',['--group-col','tree'])
        self.assertEqual(r.returncode,2)
        self.assertIn('group_leakage:1',r.stdout)
    def test_fails_missing_group(self):
        r=self.run_check('tree,split\n,train\nT2,test\n',['--group-col','tree'])
        self.assertEqual(r.returncode,2)
        self.assertIn('missing_group_ids:1',r.stdout)
    def test_fails_exact_hash_leakage(self):
        r=self.run_check('tree,split,sha\nT1,train,abc\nT2,test,abc\n',['--group-col','tree','--hash-col','sha'])
        self.assertEqual(r.returncode,2)
        self.assertIn('exact_hash_leakage:1',r.stdout)
    def test_empty_template_fails_closed(self):
        r=self.run_check('dataset_id,image_path,group_id,split,sha256\n', ['--group-col','group_id','--hash-col','sha256'])
        self.assertEqual(r.returncode,2)
        self.assertIn('empty_manifest',r.stdout)
    def test_require_all_splits(self):
        r=self.run_check('tree,split\nT1,train\nT2,test\n',['--group-col','tree','--require-all-splits'])
        self.assertEqual(r.returncode,2)
        self.assertIn('empty_required_splits:val',r.stdout)
    def test_cv_group_has_single_fold(self):
        r=self.run_check('tree,fold\nT1,1\nT2,2\nT1,2\n',['--group-col','tree','--split-col','fold','--cv-fold-col','fold','--allow-splits=1,2'])
        self.assertEqual(r.returncode,2)
        self.assertIn('cv_group_assigned_to_multiple_folds:1',r.stdout)
if __name__=='__main__': unittest.main()
