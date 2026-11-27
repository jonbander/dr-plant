#!/usr/bin/env python3
"""Audit original (non-augmented) Plasmopara Zenodo v2 grape images.

The 1,600 pre-augmented derivatives are deliberately excluded. This creates
an exploratory image-level split only; it is not independent by vineyard,
plant, country, or capture session.
"""
from __future__ import annotations
import argparse,csv,hashlib,json
from collections import Counter,defaultdict
from pathlib import Path
import numpy as np
from PIL import Image,ExifTags
from scipy.fftpack import dctn
from sklearn.model_selection import train_test_split

EXTS={'.jpg','.jpeg','.png','.webp'}

def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
 return h.hexdigest()

def phash(path):
 with Image.open(path) as im:
  im=im.convert('L').resize((32,32),Image.Resampling.LANCZOS)
  a=np.asarray(im,dtype=np.float32)
 d=dctn(a,norm='ortho')[:8,:8].flatten()
 med=np.median(d[1:]); bits=d[1:]>med
 value=0
 for bit in bits: value=(value<<1)|int(bit)
 return f'{value:016x}'

def hamming(a,b): return (int(a,16)^int(b,16)).bit_count()

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('root',type=Path);p.add_argument('--out',required=True,type=Path);p.add_argument('--seed',type=int,default=42)
 a=p.parse_args(); a.out.mkdir(parents=True,exist_ok=True)
 rows=[];bad=[];gps_rows=[]
 for cls in ('Disease','Healthy'):
  folder=a.root/cls
  for f in sorted(folder.iterdir()):
   if not f.is_file() or f.suffix.lower() not in EXTS: continue
   try:
    with Image.open(f) as im:
     im.verify()
    with Image.open(f) as im:
     dims=f'{im.width}x{im.height}'; ex=im.getexif(); gps=ex.get_ifd(34853) if 34853 in ex else {}
     make=str(ex.get(271,'')); dt=str(ex.get(36867,''))
     gps_flag='yes' if gps and 2 in gps and 4 in gps else 'no'
   except Exception as e:
    bad.append({'path':str(f),'error':str(e)});continue
   rel=f.relative_to(a.root).as_posix()
   rows.append({'relative_path':rel,'sha256':sha(f),'phash_64':phash(f),'class_label':cls,'dimensions':dims,'exif_gps':gps_flag,'camera_make':make,'datetime_original':dt})
 # Exact and near duplicates
 bysha=defaultdict(list)
 for r in rows: bysha[r['sha256']].append(r)
 exact=[v for v in bysha.values() if len(v)>1]
 pairs=[]
 for i in range(len(rows)):
  for j in range(i+1,len(rows)):
   dist=hamming(rows[i]['phash_64'],rows[j]['phash_64'])
   if dist<=6:
    pairs.append({'path_a':rows[i]['relative_path'],'class_a':rows[i]['class_label'],'path_b':rows[j]['relative_path'],'class_b':rows[j]['class_label'],'hamming_distance':dist,'cross_label':rows[i]['class_label']!=rows[j]['class_label']})
 # Union near-duplicate groups so no similar images cross splits.
 parent=list(range(len(rows)))
 def find(x):
  while parent[x]!=x: parent[x]=parent[parent[x]];x=parent[x]
  return x
 def union(x,y):
  x=find(x);y=find(y)
  if x!=y: parent[y]=x
 for pair in pairs:
  i=next(k for k,r in enumerate(rows) if r['relative_path']==pair['path_a'])
  j=next(k for k,r in enumerate(rows) if r['relative_path']==pair['path_b'])
  if rows[i]['class_label']==rows[j]['class_label']: union(i,j)
 # Conflicting near-duplicate label pairs are quarantined, not force-assigned.
 conflict_paths={x for q in pairs if q['cross_label'] for x in (q['path_a'],q['path_b'])}
 clean=[r for r in rows if r['relative_path'] not in conflict_paths]
 # recompute groups on clean rows
 idx={r['relative_path']:i for i,r in enumerate(clean)}; par=list(range(len(clean)))
 def fnd(x):
  while par[x]!=x: par[x]=par[par[x]];x=par[x]
  return x
 def unn(x,y):
  x=fnd(x);y=fnd(y)
  if x!=y:par[y]=x
 for q in pairs:
  if not q['cross_label'] and q['path_a'] in idx and q['path_b'] in idx: unn(idx[q['path_a']],idx[q['path_b']])
 groups=defaultdict(list)
 for i,r in enumerate(clean):groups[fnd(i)].append(r)
 # stratify near-duplicate clusters by class for exploratory split
 class_groups=defaultdict(list)
 for gid,items in groups.items():
  labels={r['class_label'] for r in items}
  if len(labels)==1: class_groups[next(iter(labels))].append(items)
  else: conflict_paths.update(r['relative_path'] for r in items)
 assignments={}
 rng=np.random.default_rng(a.seed)
 for label,gg in class_groups.items():
  rng.shuffle(gg)
  if len(gg)<3: continue
  ntest=max(1,round(len(gg)*.15));nval=max(1,round(len(gg)*.15))
  if ntest+nval>=len(gg): ntest=nval=1
  for k,items in enumerate(gg):
   split='test' if k<ntest else 'validation' if k<ntest+nval else 'train'
   gid='phash-cluster:'+hashlib.sha1('|'.join(sorted(r['relative_path'] for r in items)).encode()).hexdigest()[:12]
   for r in items: assignments[r['relative_path']]=(split,gid)
 output=[]
 for r in clean:
  if r['relative_path'] in conflict_paths or r['relative_path'] not in assignments: continue
  split,gid=assignments[r['relative_path']]
  output.append({**r,'split':split,'group_id_for_split':gid,'provenance_verified':'no','expert_label_review':'no','near_duplicate_review':'no'})
 fields=list(output[0]) if output else []
 with (a.out/'image-manifest.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
 with (a.out/'exploratory-splits.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=list(output[0]) if output else []);w.writeheader();w.writerows(output)
 with (a.out/'near-duplicate-pairs.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=['path_a','class_a','path_b','class_b','hamming_distance','cross_label']);w.writeheader();w.writerows(pairs)
 counts=Counter(r['class_label'] for r in rows)
 report={'status':'exploratory_audit_complete_training_not_independent','dataset':'Plasmopara disease dataset Zenodo v2','doi':'10.5281/zenodo.17368692','license':'CC BY 4.0','original_images_found':len(rows),'class_counts':dict(counts),'unreadable_images':bad,'unique_sha256':len(bysha),'exact_duplicate_groups':len(exact),'phash_pairs_hamming_le_6':len(pairs),'cross_label_near_duplicate_paths_quarantined':len(conflict_paths),'phash_groups_used_for_split':len(groups),'images_in_exploratory_split':len(output),'split_counts':dict(Counter(r['split'] for r in output)),'split_class_counts':{c:dict(Counter(r['split'] for r in output if r['class_label']==c)) for c in sorted(counts)},'exif_gps_count_by_class':{c:sum(r['exif_gps']=='yes' for r in rows if r['class_label']==c) for c in sorted(counts)},'exif_datetime_count_by_class':{c:sum(bool(r['datetime_original']) for r in rows if r['class_label']==c) for c in sorted(counts)},'augmented_images_excluded':1600,'claimed_images_in_paper_record':281,'limitations':['No verified per-image vineyard, plant, session or country assignment for all images.','A few EXIF GPS records exist but coverage is incomplete and strongly class-imbalanced.','Image-level/near-duplicate-cluster split is exploratory and not independent by vineyard/site/plant.','The archive has 280 originals, one fewer than the 281 claimed on the landing page.','Pre-augmented derivatives are excluded to avoid derivative leakage; source lineage is not mapped.','No independent plant-pathologist review has been performed by Dr Plant.'],'training_decision':'exploratory_baseline_only; not for production diagnosis'}
 (a.out/'audit-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
