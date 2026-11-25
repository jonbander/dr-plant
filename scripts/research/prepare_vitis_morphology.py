#!/usr/bin/env python3
"""Audit and manifest Vitis vinifera leaf images with vine-level grouping."""
import argparse,csv,hashlib,json,re,collections
from pathlib import Path
from PIL import Image
import pandas as pd

p=argparse.ArgumentParser()
p.add_argument('--images-root',required=True)
p.add_argument('--key-csv',required=True)
p.add_argument('--out-dir',required=True)
a=p.parse_args(); root=Path(a.images_root); out=Path(a.out_dir); out.mkdir(parents=True,exist_ok=True)
key=pd.read_csv(a.key_csv,encoding='utf-8-sig')
key['row']=key['row'].astype(int); key['vine']=key['vine'].astype(int)
lookup={}
for _,r in key.iterrows():
 gid=f"{str(r['block']).strip()}{int(r['row']):02d}{int(r['vine']):02d}"
 lookup[gid]={'dvit':str(r['dvit']),'cultivar':str(r['cultivar']).strip(),'country':str(r['country']).strip().upper(),'block':str(r['block']).strip(),'row':int(r['row']),'vine':int(r['vine'])}
rows=[]; unmatched=[]; invalid=[]
for f in sorted(root.rglob('*')):
 if not f.is_file() or f.suffix.lower() not in ('.jpg','.jpeg','.png'): continue
 m=re.fullmatch(r'([A-Z])(\d{2})(\d{2})([A-Z])\.(jpg|jpeg|png)',f.name,re.I)
 if not m:
  unmatched.append(str(f)); continue
 block,row,vine,suffix,ext=m.groups(); gid=f'{block.upper()}{int(row):02d}{int(vine):02d}'
 meta=lookup.get(gid)
 if not meta:
  unmatched.append(str(f)); continue
 try:
  h=hashlib.sha256();
  with f.open('rb') as stream:
   for chunk in iter(lambda:stream.read(1024*1024),b''): h.update(chunk)
  with Image.open(f) as im:
   im.verify()
  with Image.open(f) as im:
   w,hgt=im.size; mode=im.mode; fmt=im.format
 except Exception as e:
  invalid.append({'path':str(f),'error':str(e)}); continue
 rows.append({'relative_path':str(f.relative_to(root)),'filename':f.name,'image_number':f.stem,'group_id':gid,'block':meta['block'],'row':meta['row'],'vine':meta['vine'],'dvit':meta['dvit'],'cultivar':meta['cultivar'],'country':meta['country'],'sha256':h.hexdigest(),'width':w,'height':hgt,'mode':mode,'format':fmt,'file_bytes':f.stat().st_size,'french_subset':meta['country']=='FRANCE'})
# Deduplicate group metadata and compute eligibility.
byhash=collections.defaultdict(list)
for r in rows:byhash[r['sha256']].append(r)
byclass=collections.defaultdict(set)
for r in rows:
 if r['country']=='FRANCE': byclass[r['cultivar']].add(r['group_id'])
class_counts={k:len(v) for k,v in sorted(byclass.items())}
eligible=sorted(k for k,v in class_counts.items() if v>=3 and k.lower()!='chardonay')
for r in rows:r['morphology_training_eligible']=r['country']=='FRANCE' and r['cultivar'] in eligible
with (out/'image-manifest.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0].keys()));w.writeheader();w.writerows(rows)
fr=[r for r in rows if r['country']=='FRANCE']
report={'dataset':'Vitis vinifera leaf images','doi':'10.5061/dryad.g79cnp5mn','zenodo_record':'5001792','license':'CC0-1.0 (NLM catalog rights)','image_count':len(rows),'matched_to_key':len(rows),'unmatched_files':len(unmatched),'invalid_images':len(invalid),'unique_sha256':len(byhash),'exact_duplicate_groups':sum(len(v)>1 for v in byhash.values()),'exact_duplicate_extra_files':sum(len(v)-1 for v in byhash.values()),'french_image_count':len(fr),'french_vine_groups':len({r['group_id'] for r in fr}),'french_cultivar_count':len({r['cultivar'] for r in fr}),'french_cultivar_vine_group_counts':class_counts,'eligible_classes_ge_3_vines_excluding_possible_spelling_alias':eligible,'excluded_possible_alias':['Chardonay'],'group_id_definition':'block+row+vine parsed from image filename and matched to key.csv; multiple images from one vine remain in one group','domain_limit':'controlled light-box/backlit leaf images, not field disease images; use for normal morphology/cultivar reference only','training_status':'pending final audit and group-split check; not a disease classifier'}
(out/'audit-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
(out/'unmatched-files.json').write_text(json.dumps(unmatched,indent=2)+'\n')
(out/'invalid-images.json').write_text(json.dumps(invalid,indent=2)+'\n')
print(json.dumps(report,indent=2,ensure_ascii=False))
