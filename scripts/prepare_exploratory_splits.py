#!/usr/bin/env python3
"""Create an explicitly non-independent exploratory image-level split.

Exact byte-identical images are kept together by SHA-256. This does NOT prevent
near-duplicate, same-plant, same-session, or same-site leakage. Never use its
metrics as evidence of generalization to unseen farms.
"""
import argparse,csv,json,random
from collections import Counter,defaultdict
from pathlib import Path
def main():
 p=argparse.ArgumentParser(description=__doc__); p.add_argument("manifest",type=Path); p.add_argument("--out",required=True,type=Path); p.add_argument("--seed",type=int,default=42); a=p.parse_args()
 with a.manifest.open(newline="",encoding="utf-8-sig") as f: rows=list(csv.DictReader(f))
 required={"relative_path","sha256","class_label"}
 if not rows or not required.issubset(rows[0]): p.error("Manifest is empty or missing relative_path, sha256, class_label")
 hashes={}; hash_labels=defaultdict(set); class_groups=defaultdict(list)
 for r in rows:
  sha=r["sha256"].strip().lower(); label=r["class_label"].strip()
  if len(sha)!=64 or any(c not in "0123456789abcdef" for c in sha): p.error("Invalid SHA-256: "+r["relative_path"])
  if not label: p.error("Empty class label: "+r["relative_path"])
  hashes.setdefault(sha,[]).append(r); hash_labels[sha].add(label)
 for sha,labels in hash_labels.items():
  if len(labels)!=1: p.error("Identical bytes have conflicting labels; quarantine: "+", ".join(x["relative_path"] for x in hashes[sha]))
  class_groups[next(iter(labels))].append(sha)
 assignment={}
 rng=random.Random(a.seed)
 for label,groups in sorted(class_groups.items()):
  if len(groups)<3: p.error(f"Class {label!r} has fewer than 3 unique images; cannot form 3 splits")
  rng.shuffle(groups)
  n=len(groups); n_test=max(1,round(n*.15)); n_val=max(1,round(n*.15))
  if n_test+n_val>=n: n_test=n_val=1
  for i,sha in enumerate(groups):
   split="test" if i<n_test else "validation" if i<n_test+n_val else "train"
   assignment[sha]=split
 out=[]
 for sha,items in hashes.items():
  for r in items:
   item=dict(r); item["split"]=assignment[sha]; item["group_id_for_split"]="exact-sha256:"+sha
   out.append(item)
 a.out.mkdir(parents=True,exist_ok=True)
 with (a.out/"exploratory-splits.csv").open("w",newline="",encoding="utf-8") as f:
  w=csv.DictWriter(f,fieldnames=list(out[0])); w.writeheader(); w.writerows(out)
 report={"status":"exploratory_non_independent_split","split_method":"stratified image-level 70/15/15 within each class; exact SHA-256 duplicates kept together","images_per_split":dict(Counter(x["split"] for x in out)),"classes":dict(Counter(x["class_label"] for x in out)),"exact_duplicate_hash_groups":len(hashes),"group_leakage_check":"exact byte-identical files kept together only","independent_by_site_plant_session":False,"near_duplicate_review":"not performed by this split; perceptual near-duplicates may cross splits","expert_label_review":"not performed by this split","warning":"Exploratory debugging baseline only. Results must not be reported as independent test accuracy or generalization to new farms/regions."}
 (a.out/"exploratory-split-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8"); print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=="__main__": main()
