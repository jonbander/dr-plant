#!/usr/bin/env python3
import csv,hashlib,json
from pathlib import Path
from collections import Counter
import numpy as np
from PIL import Image
from sklearn.model_selection import StratifiedGroupKFold
ROOT=Path('/workspace/dr-plant/data/external/2026-11/ngld-mendeley-v5/extracted/Niphad Grape Leaf Disease Dataset (NGLD)/Niphad Grape Leaf Disease Dataset (NGLD)/Grapes Disease Dataset')
AUDIT=Path('/workspace/dr-plant-coastal-sources/data/ngld-v5-audit')
OUT=Path('/workspace/dr-plant/results/ngld-v5'); OUT.mkdir(parents=True,exist_ok=True)
EXT={'.jpg','.jpeg','.png','.webp','.bmp','.tif','.tiff'}
files=sorted(p for p in ROOT.rglob('*') if p.is_file() and p.suffix.lower() in EXT)
bysha={}; rows=[]; path_to_index={}
for p in files:
 h=hashlib.sha256(p.read_bytes()).hexdigest()
 if h in bysha:
  path_to_index[str(p.relative_to(ROOT))]=bysha[h]
  continue
 try:
  with Image.open(p) as im: im.verify()
  with Image.open(p) as im: w,hh=im.size
 except Exception as e: print('BAD',p,e); continue
 rows.append({'relative_path':str(p.relative_to(ROOT)),'class_label':p.parent.name,'sha256':h,'width':w,'height':hh})
 bysha[h]=len(rows)-1
 path_to_index[str(p.relative_to(ROOT))]=len(rows)-1
idx=path_to_index
# Use the previously reviewed audit's pHash candidate list (462 pairs), not a newly computed incompatible hash implementation.
pairfile=AUDIT/'near-duplicate-review-pairs.csv'; pairs=list(csv.DictReader(pairfile.open(encoding='utf-8-sig')))
parent=list(range(len(rows)))
def find(x):
 while parent[x]!=x: parent[x]=parent[parent[x]]; x=parent[x]
 return x
def union(a,b):
 a=find(a); b=find(b)
 if a!=b: parent[b]=a
quarantine=set(); cross=[]
for p in pairs:
 a,b=p['image_a'],p['image_b']
 if a not in idx or b not in idx: raise ValueError(f'Pair path missing: {a} / {b}')
 i,j=idx[a],idx[b]
 if p['class_a']!=p['class_b']:
  quarantine|={i,j}; cross.append(p)
 else: union(i,j)
for i,r in enumerate(rows): r['group_id_for_split']=f'ngld-phash-audit-{find(i)}'
usable=[i for i in range(len(rows)) if i not in quarantine]
labels=np.array([rows[i]['class_label'] for i in usable]); groups=np.array([rows[i]['group_id_for_split'] for i in usable]); ix=np.arange(len(usable))
skf=StratifiedGroupKFold(n_splits=5,shuffle=True,random_state=20261125)
trv_rel,te_rel=next(skf.split(ix,labels,groups)); trv=np.array(usable)[trv_rel]; test=np.array(usable)[te_rel]
skf2=StratifiedGroupKFold(n_splits=4,shuffle=True,random_state=20261126)
tr_rel,va_rel=next(skf2.split(trv,np.array([rows[i]['class_label'] for i in trv]),np.array([rows[i]['group_id_for_split'] for i in trv])))
train=trv[tr_rel]; val=trv[va_rel]
split={int(i):'train' for i in train}; split.update({int(i):'validation' for i in val}); split.update({int(i):'test' for i in test})
sets={s:{rows[i]['group_id_for_split'] for i in split if split[i]==s} for s in ['train','validation','test']}
assert not (sets['train']&sets['validation'] or sets['train']&sets['test'] or sets['validation']&sets['test'])
for i,r in enumerate(rows): r['split']=split.get(i,'quarantined_cross_class_near_duplicate')
cols=['relative_path','class_label','split','group_id_for_split','sha256','width','height','source_dataset_id','source_version','source_license','provenance_verified','expert_label_review','near_duplicate_review']
with (OUT/'image-manifest.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.DictWriter(f,fieldnames=cols); w.writeheader()
 for r in rows: w.writerow({'relative_path':r['relative_path'],'class_label':r['class_label'],'split':r['split'],'group_id_for_split':r['group_id_for_split'],'sha256':r['sha256'],'width':r['width'],'height':r['height'],'source_dataset_id':'NGLD','source_version':'Mendeley-V5-2025-05-29','source_license':'CC BY 4.0','provenance_verified':'yes','expert_label_review':'no','near_duplicate_review':'462 audit pairs grouped; cross-class candidates quarantined'})
summary={'dataset':'Niphad Grape Leaf Disease Dataset V5','doi':'10.17632/8nnd2ypcv3.5','license':'CC BY 4.0','archive_sha256':hashlib.sha256(Path('/workspace/dr-plant/data/external/2026-11/ngld-mendeley-v5/NGLD-V5.zip').read_bytes()).hexdigest(),'source_images':len(files),'readable_unique_images':len(rows),'exact_duplicates_removed':len(files)-len(rows),'class_counts_unique':dict(Counter(r['class_label'] for r in rows)),'near_duplicate_pairs_from_prior_audit':len(pairs),'cross_class_near_duplicate_pairs':len(cross),'quarantined_cross_class_candidate_images':len(quarantine),'usable_images':len(usable),'split_counts':dict(Counter(split.values())),'class_split_counts':{c:dict(Counter(split[i] for i in split if rows[i]['class_label']==c)) for c in sorted(set(labels))},'groups_per_split':{s:len(sets[s]) for s in sets},'split_group_disjoint':True,'biological_group_ids':'not present in source; pHash components only prevent near-duplicate leakage, not plant/site/session leakage','expert_label_review':'not completed; source folder labels retained but not independently expert-verified','training_scope':'exploratory source-specific image classifier only; not independent biological validation or Syrian field validation'}
(OUT/'audit-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
with (OUT/'near-duplicate-review-pairs.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.writer(f); w.writerow(['image_a','class_a','image_b','class_b','hamming_distance','action'])
 for p in pairs: w.writerow([p['image_a'],p['class_a'],p['image_b'],p['class_b'],p['hamming_distance'],'quarantine_cross_class_pair' if p['class_a']!=p['class_b'] else 'same_class_grouped_for_split'])
print(json.dumps(summary,ensure_ascii=False,indent=2))
