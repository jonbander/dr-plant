#!/usr/bin/env python3
"""Audit original-only Multi-Fruit Leaf Image Dataset; augmented data excluded.

This is a leaf-condition dataset, not a verified disease-only taxonomy. The
source provides 18 depositor labels, but location metadata is only partly
recoverable from EXIF GPS; the supplied CSV is class counts, not a per-image
location table. The split is exploratory and not independent by orchard.
"""
from __future__ import annotations
import argparse,csv,hashlib,json,random
from collections import Counter,defaultdict
from pathlib import Path
import numpy as np
from PIL import Image,ExifTags
from scipy.fftpack import dctn
EXTS={'.jpg','.jpeg','.png','.webp'}

def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def phash(path):
 with Image.open(path) as im:a=np.asarray(im.convert('L').resize((32,32),Image.Resampling.LANCZOS),dtype=np.float32)
 d=dctn(a,norm='ortho')[:8,:8].flatten();bits=d[1:]>np.median(d[1:]);n=0
 for b in bits:n=(n<<1)|int(b)
 return f'{n:016x}'
def rat(x):
 try:return float(x)
 except:return float(x[0])/float(x[1])
def coord(v,ref):
 a,b,c=map(rat,v);x=a+b/60+c/3600;return -x if ref in ('S','W') else x
def find(p,x):
 while p[x]!=x:p[x]=p[p[x]];x=p[x]
 return x
def union(p,x,y):
 x=find(p,x);y=find(p,y)
 if x!=y:p[y]=x

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('root',type=Path);ap.add_argument('--out',required=True,type=Path);ap.add_argument('--seed',type=int,default=42);a=ap.parse_args();a.out.mkdir(parents=True,exist_ok=True)
 rows=[];bad=[];gps_counts=Counter();gps_clusters=Counter();date_counts=Counter();camera_counts=Counter()
 for folder in sorted(p for p in a.root.iterdir() if p.is_dir()):
  for f in sorted(folder.iterdir()):
   if not f.is_file() or f.suffix.lower() not in EXTS:continue
   try:
    with Image.open(f) as im:im.verify()
    with Image.open(f) as im:
     ex=im.getexif();d={ExifTags.TAGS.get(k,k):v for k,v in ex.items()};g=ex.get_ifd(34853) if 34853 in ex else {}
     gps=None
     if g and 2 in g and 4 in g:
      lat=coord(g[2],g.get(1,'N'));lon=coord(g[4],g.get(3,'E'));gps=f'{lat:.6f},{lon:.6f}'
     dt=str(d.get('DateTimeOriginal',d.get('DateTime','')));camera=str(d.get('Model',''))
     width,height=im.size
   except Exception as e:bad.append({'path':str(f),'error':str(e)});continue
   label=folder.name;gps_counts[label]+=gps is not None
   if gps:gps_clusters[(label,round(lat,3),round(lon,3))]+=1
   if dt:date_counts[(label,dt[:10])]+=1
   if camera:camera_counts[(label,camera.strip('\x00'))]+=1
   rows.append({'relative_path':f.relative_to(a.root).as_posix(),'sha256':sha(f),'phash_64':phash(f),'class_label':label,'width':width,'height':height,'exif_datetime':dt,'camera_model':camera,'gps':gps})
 bysha=defaultdict(list)
 for r in rows:bysha[r['sha256']].append(r)
 duplicate_groups=[v for v in bysha.values() if len(v)>1];unique=[];exact_q=[]
 for h,items in sorted(bysha.items()):
  items=sorted(items,key=lambda r:r['relative_path']);unique.append(items[0])
  for r in items[1:]:exact_q.append({**r,'quarantine_reason':'exact_sha256_duplicate_of:'+items[0]['relative_path']})
 vals=np.array([int(r['phash_64'],16) for r in unique],dtype=np.uint64);xor=np.bitwise_xor(vals[:,None],vals[None,:]);lut=np.array([int(i).bit_count() for i in range(256)],dtype=np.uint8);dist=lut[xor.view(np.uint8).reshape(len(unique),len(unique),8)].sum(axis=2)
 ii,jj=np.where(np.triu(dist<=6,k=1));pairs=[];cross=set();
 for i,j in zip(ii.tolist(),jj.tolist()):
  x,y=unique[i],unique[j];is_cross=x['class_label']!=y['class_label']
  pairs.append({'path_a':x['relative_path'],'class_a':x['class_label'],'path_b':y['relative_path'],'class_b':y['class_label'],'hamming_distance':int(dist[i,j]),'cross_label':is_cross})
  if is_cross:cross.update((x['relative_path'],y['relative_path']))
 clean=[r for r in unique if r['relative_path'] not in cross];idx={r['relative_path']:i for i,r in enumerate(clean)};parent=list(range(len(clean)))
 for q in pairs:
  if not q['cross_label'] and q['path_a'] in idx and q['path_b'] in idx:union(parent,idx[q['path_a']],idx[q['path_b']])
 groups=defaultdict(list)
 for i,r in enumerate(clean):groups[find(parent,i)].append(r)
 byclass=defaultdict(list)
 for items in groups.values():
  labs={r['class_label'] for r in items}
  if len(labs)==1:byclass[next(iter(labs))].append(items)
 rng=random.Random(a.seed);assign={}
 for label,gg in sorted(byclass.items()):
  rng.shuffle(gg);n=len(gg)
  if n<3:continue
  nt=max(1,round(n*.15));nv=max(1,round(n*.15))
  if nt+nv>=n:nt=nv=1
  for k,items in enumerate(gg):
   split='test' if k<nt else 'validation' if k<nt+nv else 'train';gid='phash-cluster:'+hashlib.sha1('|'.join(sorted(r['relative_path'] for r in items)).encode()).hexdigest()[:12]
   for r in items:assign[r['relative_path']]=(split,gid)
 out=[]
 for r in clean:
  if r['relative_path'] not in assign:continue
  split,gid=assign[r['relative_path']];out.append({**r,'split':split,'group_id_for_split':gid,'provenance_verified':'no','expert_label_review':'no','near_duplicate_review':'no'})
 with (a.out/'image-manifest.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
 with (a.out/'unique-image-manifest.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=list(unique[0]));w.writeheader();w.writerows(unique)
 with (a.out/'exploratory-splits.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=list(out[0]) if out else list(unique[0])+['split','group_id_for_split','provenance_verified','expert_label_review','near_duplicate_review']);w.writeheader();w.writerows(out)
 with (a.out/'near-duplicate-pairs.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=['path_a','class_a','path_b','class_b','hamming_distance','cross_label']);w.writeheader();w.writerows(pairs)
 for name,items,fields in [('quarantined-exact-duplicates.csv',exact_q,list(exact_q[0]) if exact_q else list(rows[0])+['quarantine_reason']),('quarantined-cross-label-near-duplicates.csv',[{**r,'quarantine_reason':'cross_label_perceptual_near_duplicate_hamming_le_6'} for r in unique if r['relative_path'] in cross],list(unique[0])+['quarantine_reason'])]:
  with (a.out/name).open('w',newline='',encoding='utf-8') as f:w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(items)
 report={'status':'exploratory_leaf_condition_audit_complete','dataset':'Multi-Fruit Leaf Image Dataset: Guava, Jackfruit, Mango, and Olive','doi':'10.17632/82vn9k44ky.1','license':'CC BY 4.0','original_images':len(rows),'class_counts':dict(Counter(r['class_label'] for r in rows)),'unique_sha256_images':len(unique),'exact_duplicate_groups':len(duplicate_groups),'extra_exact_duplicate_copies_quarantined':len(exact_q),'perceptual_near_duplicate_pairs_hamming_le_6':len(pairs),'cross_label_near_duplicate_paths_quarantined':len(cross),'images_in_exploratory_split':len(out),'split_counts':dict(Counter(r['split'] for r in out)),'split_class_counts':{c:dict(Counter(r['split'] for r in out if r['class_label']==c)) for c in sorted({r['class_label'] for r in out})},'gps_count_by_class':dict(gps_counts),'gps_clusters_by_class_location':[{'class':k[0],'lat_round_0_001':k[1],'lon_round_0_001':k[2],'images':v} for k,v in sorted(gps_clusters.items())],'camera_models_top':[{'class':k[0],'camera':k[1],'count':v} for k,v in camera_counts.most_common(20)],'top_dates_by_class':[{'class':k[0],'date':k[1],'count':v} for k,v in date_counts.most_common(30)],'augmented_images_excluded':18000,'independent_by_site_plant_session':False,'taxonomy_warning':'Labels include health/condition/growth-stage and pest damage, not only confirmed diseases. Keep as a separate leaf-condition task.','limitations':['No per-image CSV with orchard/site metadata was present in the original-only ZIP; the CSV in the outer archive lists only class totals.','GPS coverage is incomplete and many classes are captured at one coordinate cluster; GPS points do not prove separate orchards.','No independent plant-pathologist review by Dr Plant.','The split is image-level/near-duplicate-cluster only and not independent by site or plant.','All images are from Bangladesh and require external validation before use in Syrian orchards.'],'training_decision':'exploratory_condition_classifier_only; not disease diagnosis'}
 (a.out/'audit-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
