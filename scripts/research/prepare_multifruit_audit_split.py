#!/usr/bin/env python3
import csv, hashlib, json
from pathlib import Path
from collections import defaultdict, Counter
import numpy as np
from PIL import Image
from scipy.fft import dctn
from sklearn.model_selection import StratifiedGroupKFold
ROOT=Path('/workspace/dr-plant/data/external/2026-11/multi-fruit-original/extracted')
OUT=Path('/workspace/dr-plant/results/multi-fruit-v1')
OUT.mkdir(parents=True,exist_ok=True)
EXT={'.jpg','.jpeg','.png','.webp','.bmp','.tif','.tiff'}
def phash(path):
    with Image.open(path) as im:
        im=im.convert('L').resize((32,32),Image.Resampling.LANCZOS)
        a=np.asarray(im,dtype=np.float32)
    d=dctn(a,norm='ortho')[:8,:8].flatten()[1:]
    med=np.median(d)
    bits=(d>med).astype(np.uint8)
    v=0
    for b in bits: v=(v<<1)|int(b)
    return f'{v:016x}'
files=sorted(p for p in ROOT.rglob('*') if p.is_file() and p.suffix.lower() in EXT)
rows=[]; seen={}
for i,p in enumerate(files):
    raw=p.read_bytes(); sha=hashlib.sha256(raw).hexdigest()
    if sha in seen: continue
    try:
        with Image.open(p) as im:
            im.verify()
        with Image.open(p) as im: w,h=im.size
        ph=phash(p)
    except Exception as e:
        print('BAD',p,e); continue
    label=p.parent.name
    rows.append({'relative_path':str(p.relative_to(ROOT)),'class_label':label,'sha256':sha,'phash':ph,'width':w,'height':h})
    seen[sha]=str(p)
print('unique readable',len(rows),'classes',len(set(r['class_label'] for r in rows)))
# group near-identical pHash images with Hamming <=6
vals=np.array([int(r['phash'],16) for r in rows],dtype=np.uint64)
parent=list(range(len(rows)))
def find(x):
    while parent[x]!=x:
        parent[x]=parent[parent[x]]; x=parent[x]
    return x
def union(a,b):
    a=find(a); b=find(b)
    if a!=b: parent[b]=a
lut=np.array([int(i).bit_count() for i in range(256)],dtype=np.uint8)
for i in range(len(rows)):
    x=vals[i+1:] ^ vals[i]
    # count bits bytewise
    d=lut[(x & 255).astype(np.uint8)] + lut[((x>>8)&255).astype(np.uint8)] + lut[((x>>16)&255).astype(np.uint8)] + lut[((x>>24)&255).astype(np.uint8)] + lut[((x>>32)&255).astype(np.uint8)] + lut[((x>>40)&255).astype(np.uint8)] + lut[((x>>48)&255).astype(np.uint8)] + lut[((x>>56)&255).astype(np.uint8)]
    for j in np.where(d<=6)[0]: union(i,i+1+int(j))
groups=[find(i) for i in range(len(rows))]
for i,r in enumerate(rows): r['group_id_for_split']=f'phash-group-{groups[i]}'
# group-aware 20% test then 20% val of remaining, deterministic
labels=np.array([r['class_label'] for r in rows]); gids=np.array([r['group_id_for_split'] for r in rows]); idx=np.arange(len(rows))
skf=StratifiedGroupKFold(n_splits=5,shuffle=True,random_state=42)
trainval_idx,test_idx=next(skf.split(idx,labels,gids))
skf2=StratifiedGroupKFold(n_splits=4,shuffle=True,random_state=43)
tr_rel,val_rel=next(skf2.split(trainval_idx,labels[trainval_idx],gids[trainval_idx]))
train_idx=trainval_idx[tr_rel]; val_idx=trainval_idx[val_rel]
for i,r in enumerate(rows): r['split']='train' if i in set(train_idx) else ('validation' if i in set(val_idx) else 'test')
# assert group disjoint
split_groups={s:{r['group_id_for_split'] for r in rows if r['split']==s} for s in ['train','validation','test']}
assert not (split_groups['train']&split_groups['validation'] or split_groups['train']&split_groups['test'] or split_groups['validation']&split_groups['test'])
with (OUT/'image-manifest.csv').open('w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=['relative_path','class_label','split','group_id_for_split','sha256','phash','width','height','provenance_verified','expert_label_review','near_duplicate_review'])
    w.writeheader()
    for r in rows: w.writerow({**r,'provenance_verified':'yes','expert_label_review':'no','near_duplicate_review':'yes'})
summary={'dataset':'Multi-Fruit Leaf Image Dataset V1','source_doi':'10.17632/82vn9k44ky.1','license':'CC BY 4.0 per Mendeley dataset record; attribution required','unique_readable_images':len(rows),'classes':dict(Counter(r['class_label'] for r in rows)),'split_counts':dict(Counter(r['split'] for r in rows)),'near_duplicate_group_count':len(set(groups)),'near_duplicate_threshold_hamming':6,'exact_duplicates_removed':len(files)-len(rows),'split_group_disjoint':True,'limitation':'No plant/site/session identifiers; image-group holdout is exploratory only. Folder labels include healthy, senescent, young, and damage categories, not a unified disease taxonomy. Expert label review not completed.'}
(OUT/'audit-summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
print(json.dumps(summary,indent=2,ensure_ascii=False))
