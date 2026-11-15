import csv,io,runpy,sys,tempfile,unittest,contextlib
from pathlib import Path
class ExploratorySplitTests(unittest.TestCase):
 def test_exact_duplicates_stay_together_and_report_warns(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t); manifest=root/"manifest.csv"; out=root/"out"; rows=[]
   for label,prefix in (("healthy","a"),("scab","b")):
    for i in range(10): rows.append({"relative_path":f"{label}/{i}.jpg","sha256":(prefix+f"{i:063x}")[-64:],"class_label":label})
   rows.append(dict(rows[0],relative_path="healthy/duplicate.jpg"))
   with manifest.open("w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
   old=sys.argv; sys.argv=["prepare_exploratory_splits.py",str(manifest),"--out",str(out)]
   try:
    with contextlib.redirect_stdout(io.StringIO()): runpy.run_path(str(Path(__file__).with_name("prepare_exploratory_splits.py")),run_name="__main__")
   finally: sys.argv=old
   with (out/"exploratory-splits.csv").open() as f: split_rows=list(csv.DictReader(f))
   dup=[r for r in split_rows if r["sha256"]==rows[0]["sha256"]]
   self.assertEqual(len({r["split"] for r in dup}),1)
   self.assertIn('"independent_by_site_plant_session": false',(out/"exploratory-split-report.json").read_text())
 def test_rejects_too_few_unique_images_per_class(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t); manifest=root/"manifest.csv"; out=root/"out"
   rows=[{"relative_path":f"{label}/{i}.jpg","sha256":(prefix+f"{i:063x}")[-64:],"class_label":label} for label,prefix in (("healthy","a"),("scab","b")) for i in range(2)]
   with manifest.open("w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
   old=sys.argv; sys.argv=["prepare_exploratory_splits.py",str(manifest),"--out",str(out)]
   try:
    with self.assertRaises(SystemExit),contextlib.redirect_stderr(io.StringIO()):
     runpy.run_path(str(Path(__file__).with_name("prepare_exploratory_splits.py")),run_name="__main__")
   finally: sys.argv=old
if __name__=="__main__": unittest.main()
