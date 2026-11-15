import importlib.util,unittest
from pathlib import Path
P=Path(__file__).with_name("prepare_classification_splits.py"); S=importlib.util.spec_from_file_location("prepare_classification_splits",P); M=importlib.util.module_from_spec(S); S.loader.exec_module(M)
def row(path,g,label,d): return {"relative_path":path,"sha256":(d*64)[:64],"class_label":label,"provenance_verified":"yes","expert_label_review":"yes","near_duplicate_review":"yes","group_id_for_split":g}
class SplitTests(unittest.TestCase):
 def fixture(self): return [row(f"{c}-{i}.jpg",f"{c}-site-{i}",c,f"{i:x}{ord(c[0]):x}") for c in ("healthy","scab") for i in range(6)]
 def test_group_isolated_and_class_complete(self):
  rows=self.fixture(); groups=M.validate(rows); assignment=M.assign(rows,groups,42); self.assertEqual(set(assignment.values()),set(M.SPLITS))
  for label in ("healthy","scab"):
   for split in M.SPLITS: self.assertTrue(any(assignment[g]==split and label in labels for g,labels in groups.items()))
 def test_unreviewed_rows_rejected(self):
  rows=self.fixture(); rows[0]["near_duplicate_review"]="no"
  with self.assertRaises(M.GateError): M.validate(rows)
 def test_duplicate_hashes_rejected(self):
  rows=self.fixture(); rows[1]["sha256"]=rows[0]["sha256"]
  with self.assertRaises(M.GateError): M.validate(rows)
if __name__=="__main__": unittest.main()
