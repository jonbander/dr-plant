import importlib.util,tempfile,unittest
from pathlib import Path
P=Path(__file__).with_name("audit_image_classification_dataset.py")
S=importlib.util.spec_from_file_location("audit_image_classification_dataset",P); M=importlib.util.module_from_spec(S); S.loader.exec_module(M)
class AuditTests(unittest.TestCase):
 def test_manifest_defaults_closed(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t); (root/"healthy").mkdir(); (root/"scab").mkdir(); (root/"healthy"/"a.jpg").write_bytes(b"a"); (root/"scab"/"b.jpg").write_bytes(b"b")
   rows,report=M.audit(root,"test","3","CC BY 4.0")
   self.assertEqual(len(rows),2); self.assertEqual(report["class_image_counts"],{"healthy":1,"scab":1})
   self.assertTrue(all(x["provenance_verified"]=="no" and x["expert_label_review"]=="no" and x["near_duplicate_review"]=="no" and x["group_id_for_split"]=="" for x in rows))
   self.assertFalse(report["model_trained"])
 def test_exact_duplicate_hashes(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t); (root/"a").mkdir(); (root/"b").mkdir(); (root/"a"/"x.jpg").write_bytes(b"same"); (root/"b"/"y.jpg").write_bytes(b"same")
   _,report=M.audit(root,"test","1","CC BY 4.0")
   self.assertEqual(report["exact_duplicate_groups"],1); self.assertEqual(report["exact_duplicate_files"],2)
 def test_non_images_ignored(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t); (root/"a").mkdir(); (root/"a"/"readme.txt").write_text("x")
   rows,report=M.audit(root,"test","1","CC BY 4.0"); self.assertEqual(rows,[]); self.assertEqual(report["ignored_non_image_files"],["a/readme.txt"])
if __name__=="__main__": unittest.main()
