#!/usr/bin/env python3
"""Deduplicate and perceptually audit Citrus Leaf Disease Zenodo v1; create exploratory split only.

Exact duplicate copies are reduced to one canonical image. Same-label
perceptual clusters stay in one split. Cross-label near-duplicate pairs are
quarantined. The resulting split is still not independent by orchard, plant,
country, or capture session because the source does not expose those IDs.
"""
from __future__ import annotations
import argparse,csv,hashlib,json,random
from collections import Counter,defaultdict
from pathlib import Path
import numpy as np
from PIL import Image,ExifTags
from scipy.fftpack import dctn

EXTS={'.jpg','.jpeg','.png','.webp','.bmp'}

def phash(path):
 with Image.open(path) as im:
  a=np.asarray(im.convert('L').resize((32,32),Image.Resampling.LANCZOS),dtype=np.float32)
 d=dctn(a,norm='ortho')[:8,:8].flatten(); bits=d[1:]>np.median(d[1:]); n=0
 for b in bits:n=(n<<1)|int(b)
 return f'{n:016x}'

def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()

def find(parent,x):
 while parent[x]!=x: parent[x]=parent[parent[x]];x=parent[x]
 return x

def union(parent,x,y):
 x=find(parent,x);y=find(parent,y)
 if x!=y:parent[y]=x

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('root',type=Path);p.add_argument('source_manifest',type=Path);p.add_argument('--out',required=True,type=Path);p.add_argument('--seed',type=int,default=42);a=p.parse_args()
 a.out.mkdir(parents=True,exist_ok=True)
 with a.source_manifest.open(newline='',encoding='utf-8-sig') as f: rows=list(csv.DictReader(f))
 by_hash=defaultdict(list)
 for r in rows:by_hash[r['sha256']].append(r)
 duplicate_groups=[v for v in by_hash.values() if len(v)>1]
 # One canonical copy per exact hash; list all other copies for quarantine.
 unique=[]; exact_quarantine=[]
 for digest,items in sorted(by_hash.items()):
  items=sorted(items,key=lambda x:x['relative_path'])
  unique.append(items[0])
  for r in items[1:]:exact_quarantine.append({**r,'quarantine_reason':'exact_sha256_duplicate_of:'+items[0]['relative_path']})
 # Compute pHash and EXIF inventory on canonical images.
 gps=Counter();exif=Counter();dates=Counter();cameras=Counter()
 for r in unique:
  path=a.root/r['relative_path'];r['phash_64']=phash(path)
  with Image.open(path) as im:
   e=im.getexif(); has_gps=34853 in e
   exif[r['class_label']]+=bool(e);gps[r['class_label']]+=has_gps
   d={ExifTags.TAGS.get(k,k):v for k,v in e.items()}
   if 'DateTimeOriginal' in d:dates[r['class_label']]+=1
   if 'Model' in d:cameras[(r['class_label'],str(d['Model']))]+=1
 # Vectorized pairwise Hamming distances for 64-bit perceptual hashes.
 vals=np.array([int(r['phash_64'],16) for r in unique],dtype=np.uint64)
 xor=np.bitwise_xor(vals[:,None],vals[None,:])
 lut=np.array([int(i).bit_count() for i in range(256)],dtype=np.uint8)
 byte_view=xor.view(np.uint8).reshape(len(unique),len(unique),8)
 dist=lut[byte_view].sum(axis=2)
 ii,jj=np.where(np.triu(dist<=6,k=1))
 pairs=[];cross_paths=set();parent=list(range(len(unique)))
 for i,j in zip(ii.tolist(),jj.tolist()):
  ra,rb=unique[i],unique[j];cross=ra['class_label']!=rb['class_label']
  pairs.append({'path_a':ra['relative_path'],'class_a':ra['class_label'],'path_b':rb['relative_path'],'class_b':rb['class_label'],'hamming_distance':int(dist[i,j]),'cross_label':cross})
  if cross:cross_paths.update((ra['relative_path'],rb['relative_path']))
  else:union(parent,i,j)
 # Remove all images involved in cross-label near-duplicate pairs.
 clean=[r for r in unique if r['relative_path'] not in cross_paths]
 clean_idx={r['relative_path']:i for i,r in enumerate(clean)};parent2=list(range(len(clean)))
 for q in pairs:
  if not q['cross_label'] and q['path_a'] in clean_idx and q['path_b'] in clean_idx:
   union(parent2,clean_idx[q['path_a']],clean_idx[q['path_b']])
 groups=defaultdict(list)
 for i,r in enumerate(clean):groups[find(parent2,i)].append(r)
 class_groups=defaultdict(list)
 for items in groups.values():
  labels={r['class_label'] for r in items}
  if len(labels)==1:class_groups[next(iter(labels))].append(items)
 # Stratified cluster split, explicitly exploratory.
 rng=random.Random(a.seed);assign={}
 for label,gg in sorted(class_groups.items()):
  rng.shuffle(gg)
  if len(gg)<3:continue
  ntest=max(1,round(len(gg)*.15));nval=max(1,round(len(gg)*.15))
  if ntest+nval>=len(gg):ntest=nval=1
  for k,items in enumerate(gg):
   split='test' if k<ntest else 'validation' if k<ntest+nval else 'train'
   gid='phash-cluster:'+hashlib.sha1('|'.join(sorted(r['relative_path'] for r in items)).encode()).hexdigest()[:12]
   for r in items:assign[r['relative_path']]=(split,gid)
 output=[]
 for r in clean:
  if r['relative_path'] not in assign:continue
  split,gid=assign[r['relative_path']]
  output.append({**r,'split':split,'group_id_for_split':gid,'provenance_verified':'no','expert_label_review':'no','near_duplicate_review':'no'})
 fields=list(output[0]) if output else []
 with (a.out/'unique-image-manifest.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=list(unique[0]));w.writeheader();w.writerows(unique)
 with (a.out/'exploratory-splits.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(output)
 with (a.out/'near-duplicate-pairs.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=['path_a','class_a','path_b','class_b','hamming_distance','cross_label']);w.writeheader();w.writerows(pairs)
 cross_quarantine=[{**r,'quarantine_reason':'cross_label_perceptual_near_duplicate_hamming_le_6'} for r in unique if r['relative_path'] in cross_paths]
 with (a.out/'quarantined-exact-duplicates.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=list(exact_quarantine[0]) if exact_quarantine else list(rows[0]) + ['quarantine_reason']);w.writeheader();w.writerows(exact_quarantine)
 with (a.out/'quarantined-cross-label-near-duplicates.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=list(cross_quarantine[0]) if cross_quarantine else list(unique[0]) + ['quarantine_reason']);w.writeheader();w.writerows(cross_quarantine)
 report={'status':'exploratory_audit_complete_training_not_independent','dataset':'Citrus Leaf Disease Dataset','doi':'10.5281/zenodo.11148332','license':'CC BY 4.0','images_in_archive_manifest':len(rows),'original_class_counts':dict(Counter(r['class_label'] for r in rows)),'unique_sha256_images':len(unique),'exact_duplicate_groups':len(duplicate_groups),'files_in_exact_duplicate_groups':sum(map(len,duplicate_groups)),'extra_exact_duplicate_copies_quarantined':len(exact_quarantine),'near_duplicate_pairs_hamming_le_6':len(pairs),'cross_label_near_duplicate_paths_quarantined':len(cross_paths),'images_in_exploratory_split':len(output),'split_counts':dict(Counter(r['split'] for r in output)),'split_class_counts':{c:dict(Counter(r['split'] for r in output if r['class_label']==c)) for c in sorted({r['class_label'] for r in output})},'exif_records_by_class':dict(exif),'gps_records_by_class':dict(gps),'datetime_original_records_by_class':dict(dates),'camera_models_top':[{"class":k[0],"model":k[1],"count":v} for k,v in cameras.most_common(12)],'independent_by_site_plant_session':False,'limitations':['No verified orchard/site/plant/session group identifiers are supplied in the source page/archive.','No independent expert or laboratory label review has been performed by Dr Plant.','Image-level near-duplicate-cluster split is exploratory only and cannot establish unseen-orchard generalization.','Class imbalance is material: Leaf Miner dominates, and the dataset contains no Healthy class.','Cross-source overlap with other grape datasets must be checked before consolidated retraining.'],'training_decision':'exploratory_baseline_only_after_perceptual_review; not production diagnosis'}
 (a.out/'audit-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
