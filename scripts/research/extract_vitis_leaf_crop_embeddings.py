#!/usr/bin/env python3
"""Extract ImageNet MobileNetV3 embeddings from auto-segmented individual leaves."""
import argparse,importlib.util,json
from pathlib import Path
import numpy as np,torch
from PIL import Image
from torch import nn
from torchvision import models,transforms
spec=importlib.util.spec_from_file_location('shape',Path(__file__).with_name('extract_vitis_leaf_shape.py'));shape=importlib.util.module_from_spec(spec);spec.loader.exec_module(shape)

def main():
 p=argparse.ArgumentParser();p.add_argument('--manifest',required=True);p.add_argument('--images-root',required=True);p.add_argument('--weights',required=True);p.add_argument('--out',required=True);p.add_argument('--threads',type=int,default=2);a=p.parse_args()
 import csv
 rows=[r for r in csv.DictReader(open(a.manifest,encoding='utf-8-sig')) if r.get('french_subset','').lower()=='true' and r.get('morphology_training_eligible','').lower()=='true']
 torch.set_num_threads(a.threads);torch.manual_seed(42)
 net=models.mobilenet_v3_small(weights=None);net.load_state_dict(torch.load(a.weights,map_location='cpu',weights_only=True));backbone=nn.Sequential(net.features,net.avgpool,nn.Flatten(1)).eval()
 for q in backbone.parameters():q.requires_grad=False
 tf=transforms.Compose([transforms.Resize((224,224)),transforms.ToTensor(),transforms.Normalize([.485,.456,.406],[.229,.224,.225])])
 feats=[];paths=[];statuses=[]
 for r in rows:
  path=Path(a.images_root)/r['relative_path']
  with Image.open(path) as im:
   im=im.convert('RGB');im.thumbnail((512,384));rgb=np.asarray(im)
  found,_=shape.components(rgb)
  if len(found)!=2:
   statuses.append((r['relative_path'],len(found)));continue
  crop_features=[]
  for _,mask,bbox in found:
   x0,y0,x1,y1=bbox
   crop=rgb[y0:y1,x0:x1].copy();m=mask[y0:y1,x0:x1]
   crop[~m]=255
   im=Image.fromarray(crop)
   x=tf(im).unsqueeze(0)
   with torch.no_grad():
    f1=backbone(x);f2=backbone(torch.flip(x,dims=[3]));crop_features.append(((f1+f2)/2).squeeze(0).numpy())
  feats.append(np.mean(crop_features,axis=0));paths.append(r['relative_path'])
 out=Path(a.out);out.parent.mkdir(parents=True,exist_ok=True)
 np.savez_compressed(out,features=np.asarray(feats,dtype=np.float32),paths=np.asarray(paths),mask_status=np.asarray(['auto_candidate_two_leaves']*len(paths)))
 report={'status':'research_only_auto_masked_leaf_crop_embeddings','images_embedded':len(paths),'skipped_non_two_component':len(statuses),'embedding_dim':576,'backbone':'MobileNetV3-Small ImageNet pretrained frozen','crop_policy':'two largest interior HSV candidate masks; background whitened; 224x224; average horizontal flip and two leaf embeddings','ground_truth_masks':False}
 out.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
if __name__=='__main__':main()
