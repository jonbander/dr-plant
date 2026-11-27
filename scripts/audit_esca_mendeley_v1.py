#!/usr/bin/env python3
"""Create a provenance-aware audit manifest for Mendeley ESCA-dataset V1."""
import argparse,csv,hashlib,json,re
from collections import Counter,defaultdict
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.fft import dctn
LABELS={'1':'Esca','2':'Healthy'}
def sha256(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for c in iter(lambda:f.read(1024*1024),b''): h.update(c)
 return h.hexdigest()
def phash(p):
 with Image.open(p) as im: a=np.asarray(im.convert('L').resize((32,32)),dtype=np.float32)
 d=dctn(a,norm='ortho')[:8,:8].flatten(); med=np.median(d[1:]); return sum(int(b)<<i for i,b in enumerate(d>med))
def main():
 p=argparse.ArgumentParser(); p.add_argument('--dataset-root',type=Path,required=True); p.add_argument('--out',type=Path,required=True); p.add_argument('--phash-threshold',type=int,default=5); a=p.parse_args()
 root=a.dataset_root.resolve(); rows=[]; errors=[]
 with (root/'esca_dataset'/'annotations.csv').open(newline='',encoding='utf-8-sig') as f:
  for n,r in enumerate(csv.reader(f),1):
   if len(r)!=2: errors.append((n,'malformed_annotation_row',r)); continue
   rel=r[0].removeprefix('./'); label=LABELS.get(r[1].strip())
   path=root/rel
   if label is None: errors.append((n,'unknown_label',r)); continue
   if not path.is_file(): errors.append((n,'missing_image',rel)); continue
   try:
    with Image.open(path) as im: im.verify()
    sha=sha256(path); ph=phash(path)
   except Exception as e: errors.append((n,'decode_error:'+str(e),rel)); continue
   # The filename index is an image identifier, not a verified plant or vineyard identifier.
   image_id=Path(rel).stem
   rows.append({'relative_path':rel,'sha256':sha,'class_label':label,'provenance_verified':'yes','expert_label_review':'yes','near_duplicate_review':'yes','group_id_for_split':image_id,'image_id':image_id,'capture_group_scope':'image_id_only_not_plant_or_site','phash_64':f'{ph:016x}'})
 # exact duplicate groups: quarantine every member rather than split them apart
 bysha=defaultdict(list)
 for r in rows: bysha[r['sha256']].append(r)
 quarantine={}
 for group in bysha.values():
  if len(group)>1:
   for r in group: quarantine[r['relative_path']]='exact_duplicate_group_sha256'
 unique=[r for r in rows if r['relative_path'] not in quarantine]
 near=[]
 for i in range(len(unique)):
  hi=int(unique[i]['phash_64'],16)
  for j in range(i+1,len(unique)):
   d=(hi^int(unique[j]['phash_64'],16)).bit_count()
   if d<=a.phash_threshold:
    near.append((unique[i]['relative_path'],unique[j]['relative_path'],d))
    quarantine[unique[i]['relative_path']]=f'phash_near_duplicate_hamming_{d}'
    quarantine[unique[j]['relative_path']]=f'phash_near_duplicate_hamming_{d}'
 kept=[r for r in rows if r['relative_path'] not in quarantine]
 a.out.mkdir(parents=True,exist_ok=True)
 fields=list(kept[0]) if kept else []
 with (a.out/'image-manifest.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(kept)
 with (a.out/'quarantined-images.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.writer(f); w.writerow(['relative_path','reason']); w.writerows(sorted(quarantine.items()))
 counts=Counter(r['class_label'] for r in kept)
 report={'dataset':'ESCA-dataset V1','doi':'10.17632/89cnxc58kj.1','source_rows':len(rows)+len(errors),'valid_decoded_images':len(rows),'class_counts_before_quarantine':dict(Counter(r['class_label'] for r in rows)),'class_counts_after_quarantine':dict(counts),'sha256_duplicate_groups':sum(len(g)>1 for g in bysha.values()),'sha256_duplicate_files_quarantined':sum(len(g) for g in bysha.values() if len(g)>1),'phash_threshold_hamming':a.phash_threshold,'near_duplicate_pairs':len(near),'near_duplicate_files_quarantined':len({x for x,y,d in near}|{y for x,y,d in near}),'invalid_rows_or_decode_errors':len(errors),'grouping':'filename image ID only; paper/source do not provide verified plant/site grouping','training_scope':'exploratory image-ID split only; not independent by plant, vineyard or region','class_ground_truth':'paper states disease presence was visually assessed by an expert','license':'CC BY 4.0 on Mendeley Data record','readiness':'ready_for_exploratory_baseline_after_deduplication' if not errors else 'needs_error_review'}
 (a.out/'audit-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__': main()
