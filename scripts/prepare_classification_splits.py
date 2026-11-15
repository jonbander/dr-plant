#!/usr/bin/env python3
"""Create group-isolated image-classification splits only after evidence review."""
import argparse,csv,json,random
from collections import Counter,defaultdict
from pathlib import Path
SPLITS=("train","validation","test"); RATIOS={"train":.70,"validation":.15,"test":.15}
REQUIRED={"relative_path","sha256","class_label","provenance_verified","expert_label_review","near_duplicate_review","group_id_for_split"}
class GateError(ValueError): pass
def load_rows(path):
 with path.open(newline="",encoding="utf-8-sig") as f:
  r=csv.DictReader(f); missing=REQUIRED-set(r.fieldnames or [])
  if missing: raise GateError("Missing columns: "+", ".join(sorted(missing)))
  rows=list(r)
 if not rows: raise GateError("Manifest is empty")
 return rows
def validate(rows):
 errors=[]; hashes={}; gc=defaultdict(set); cg=defaultdict(set)
 for n,r in enumerate(rows,2):
  path=r.get("relative_path","").strip() or f"line {n}"; why=[]
  for flag in ("provenance_verified","expert_label_review","near_duplicate_review"):
   if r.get(flag,"").strip().lower()!="yes": why.append(flag+" is not yes")
  group=r.get("group_id_for_split","").strip()
  if not group: why.append("group_id_for_split is empty")
  sha=r.get("sha256","").strip().lower()
  if len(sha)!=64 or any(c not in "0123456789abcdef" for c in sha): why.append("invalid SHA-256")
  elif sha in hashes: why.append("exact duplicate of "+hashes[sha])
  else: hashes[sha]=path
  label=r.get("class_label","").strip()
  if not label: why.append("class_label is empty")
  if why: errors.append(path+": "+"; ".join(why)); continue
  gc[group].add(label); cg[label].add(group)
 if errors: raise GateError("Review gate rejected rows:\n"+"\n".join(errors[:15]))
 rare={k:len(v) for k,v in cg.items() if len(v)<3}
 if rare: raise GateError("Each class needs at least 3 independent groups: "+", ".join(f"{k}={v}" for k,v in sorted(rare.items())))
 return gc
def assign(rows,gc,seed):
 sizes=Counter(r["group_id_for_split"].strip() for r in rows); gl=defaultdict(Counter); totals=Counter()
 for r in rows: gl[r["group_id_for_split"].strip()][r["class_label"].strip()]+=1; totals[r["class_label"].strip()]+=1
 rarity={g:sum(1/len([x for x in gc if label in gc[x]]) for label in labels) for g,labels in gc.items()}
 def cost(a):
  sizes_by=Counter(); labels_by={s:Counter() for s in SPLITS}
  for g,s in a.items(): sizes_by[s]+=sizes[g]; labels_by[s].update(gl[g])
  score=0.; total=len(rows)
  for s in SPLITS:
   target=total*RATIOS[s]; score+=((sizes_by[s]-target)/max(target,1))**2
   for label,count in totals.items():
    t=count*RATIOS[s]; score+=1.5*((labels_by[s][label]-t)/max(t,1))**2
  return score
 best=None; best_cost=float("inf"); base=sorted(sizes,key=lambda g:(-rarity[g],-sizes[g],g))
 for attempt in range(1000):
  rng=random.Random(seed+attempt); order=sorted(base,key=lambda g:(-rarity[g],-sizes[g],rng.random())); a={}
  for i,g in enumerate(order):
   empty=[s for s in SPLITS if s not in a.values()]; choices=empty if len(order)-i==len(empty) else list(SPLITS)
   a[g]=min((cost(a|{g:s}),rng.random(),s) for s in choices)[2]
  covered=all(any(a[g]==s and label in gc[g] for g in gc) for label in totals for s in SPLITS)
  if covered and cost(a)<best_cost: best,best_cost=a,cost(a)
 if best is None: raise GateError("No group-isolated assignment covers every class in all splits; more independent groups or a narrower class scope are required.")
 return best
def main():
 p=argparse.ArgumentParser(description=__doc__); p.add_argument("manifest",type=Path); p.add_argument("--out",required=True,type=Path); p.add_argument("--seed",type=int,default=42); a=p.parse_args()
 try: rows=load_rows(a.manifest); gc=validate(rows); assignment=assign(rows,gc,a.seed)
 except (OSError,GateError) as e: p.error(str(e))
 out=[]
 for r in rows: x=dict(r); x["split"]=assignment[r["group_id_for_split"].strip()]; out.append(x)
 a.out.mkdir(parents=True,exist_ok=True)
 with (a.out/"training-splits.csv").open("w",newline="",encoding="utf-8") as f:
  w=csv.DictWriter(f,fieldnames=list(out[0])); w.writeheader(); w.writerows(out)
 report={"status":"group_aware_split_ready_not_trained","seed":a.seed,"images_per_split":dict(Counter(x["split"] for x in out)),"groups_per_split":{s:len({x["group_id_for_split"] for x in out if x["split"]==s}) for s in SPLITS},"class_counts_per_split":{s:dict(Counter(x["class_label"] for x in out if x["split"]==s)) for s in SPLITS},"group_leakage_check":"passed","model_trained":False}
 (a.out/"split-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8"); print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=="__main__": main()
