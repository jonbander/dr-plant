#!/usr/bin/env python3
"""3-fold group CV for one-epoch conservative fine-tuning; historical test is excluded."""
import argparse,csv,json,random,hashlib
from pathlib import Path
from collections import Counter
import numpy as np, torch
from PIL import Image
from torch import nn
from torch.utils.data import Dataset,DataLoader,WeightedRandomSampler
from torchvision import models,transforms
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.metrics import accuracy_score,balanced_accuracy_score,f1_score,classification_report,confusion_matrix

class DS(Dataset):
 def __init__(self,rows,root,idx,train):
  self.rows=rows;self.root=root;self.idx=idx
  self.tf=transforms.Compose(([transforms.Resize((176,176)),transforms.RandomResizedCrop(160,scale=(.88,1),ratio=(.92,1.08)),transforms.RandomHorizontalFlip(),transforms.RandomRotation(8),transforms.ColorJitter(brightness=.10,contrast=.10,saturation=.08)] if train else [transforms.Resize((160,160))])+[transforms.ToTensor(),transforms.Normalize([.485,.456,.406],[.229,.224,.225])])
 def __len__(self):return len(self.rows)
 def __getitem__(self,i):
  r=self.rows[i]
  with Image.open(self.root/r['processed_path']) as im:x=self.tf(im.convert('RGB'))
  return x,self.idx[r['class_label'].replace(' ','_')]

def ev(m,dl,dev,classes):
 m.eval();y=[];p=[]
 with torch.no_grad():
  for x,t in dl:p.extend(m(x.to(dev)).argmax(1).cpu().tolist());y.extend(t.tolist())
 return {'accuracy':float(accuracy_score(y,p)),'balanced_accuracy':float(balanced_accuracy_score(y,p)),'macro_f1':float(f1_score(y,p,average='macro',zero_division=0)),'per_class':classification_report(y,p,target_names=classes,output_dict=True,zero_division=0),'confusion_matrix':confusion_matrix(y,p).tolist()}

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from training_gate_guard import extract_training_gate_args, enforce_training_gate

def main():
 gate_args=extract_training_gate_args()
 p=argparse.ArgumentParser();p.add_argument('--dataset-root',type=Path,required=True);p.add_argument('--manifest',type=Path,required=True);p.add_argument('--teacher',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--threads',type=int,default=4);a=p.parse_args();enforce_training_gate(gate_args, data_root=a.dataset_root, split_manifest=a.manifest)
 torch.set_num_threads(a.threads);dev=torch.device('cpu');ck=torch.load(a.teacher,map_location='cpu',weights_only=True);classes=ck['classes'];idx={c:i for i,c in enumerate(classes)}
 with a.manifest.open(newline='',encoding='utf-8-sig') as f:allrows=list(csv.DictReader(f))
 rows=[r for r in allrows if r['split'] in ('train','val','validation')]
 for r in rows:
  if not (a.dataset_root/r['processed_path']).is_file():raise FileNotFoundError(r['processed_path'])
 y=np.asarray([idx[r['class_label'].replace(' ','_')] for r in rows]);groups=np.asarray([r['group_id'] for r in rows])
 if len(set(groups))!=len(groups):
  pass
 cv=StratifiedGroupKFold(n_splits=3,shuffle=True,random_state=77);out=[];a.out.mkdir(parents=True,exist_ok=True)
 for fold,(tr,va) in enumerate(cv.split(np.zeros(len(rows)),y,groups),1):
  random.seed(100+fold);np.random.seed(100+fold);torch.manual_seed(100+fold)
  train=[rows[i] for i in tr];valid=[rows[i] for i in va]
  td=DS(train,a.dataset_root,idx,True);vd=DS(valid,a.dataset_root,idx,False)
  counts=Counter(r['class_label'].replace(' ','_') for r in train);weights=[1/counts[r['class_label'].replace(' ','_')] for r in train]
  tl=DataLoader(td,batch_size=16,sampler=WeightedRandomSampler(weights,len(weights),replacement=True),num_workers=2)
  vl=DataLoader(vd,batch_size=16,shuffle=False,num_workers=2)
  m=models.mobilenet_v3_small(weights=None);m.classifier[3]=nn.Linear(m.classifier[3].in_features,len(classes));m.load_state_dict(ck['model']);m.to(dev)
  teacher=ev(m,vl,dev,classes)
  for q in m.parameters():q.requires_grad=False
  for i,b in enumerate(m.features):
   if i>=10:
    for q in b.parameters():q.requires_grad=True
  for q in m.classifier.parameters():q.requires_grad=True
  bb=[q for i,b in enumerate(m.features) if i>=10 for q in b.parameters()];head=list(m.classifier.parameters())
  opt=torch.optim.AdamW([{'params':bb,'lr':1e-5},{'params':head,'lr':7e-5}],weight_decay=1e-4);lossfn=nn.CrossEntropyLoss(label_smoothing=.03)
  m.train()
  for i,b in enumerate(m.features):
   if i<10:b.eval()
  total=0;seen=0
  for x,t in tl:
   x,t=x.to(dev),t.to(dev);opt.zero_grad(set_to_none=True);loss=lossfn(m(x),t);loss.backward();nn.utils.clip_grad_norm_(m.parameters(),1.0);opt.step();total+=loss.item()*len(t);seen+=len(t)
  cand=ev(m,vl,dev,classes)
  torch.save({'model':m.state_dict(),'classes':classes,'fold':fold,'teacher_sha256':hashlib.sha256(a.teacher.read_bytes()).hexdigest()},a.out/f'fold-{fold}-candidate.pt')
  row={'fold':fold,'train_images':len(train),'validation_images':len(valid),'train_groups':len(set(groups[tr])),'validation_groups':len(set(groups[va])),'train_loss':total/max(seen,1),'teacher':teacher,'candidate':cand,'delta_macro_f1':cand['macro_f1']-teacher['macro_f1']}
  out.append(row);print(json.dumps({'fold':fold,'teacher_macro_f1':teacher['macro_f1'],'candidate_macro_f1':cand['macro_f1'],'delta':row['delta_macro_f1']},ensure_ascii=False),flush=True)
 summary={'status':'research_only_group_cv_no_test','method':'3-fold StratifiedGroupKFold on prior train+validation rows only; groups are pHash components, not plants/farms; one-epoch fine-tuning from same teacher per fold.','test_split_loaded':False,'teacher_sha256':hashlib.sha256(a.teacher.read_bytes()).hexdigest(),'folds':out,'mean_teacher_macro_f1':float(np.mean([r['teacher']['macro_f1'] for r in out])),'mean_candidate_macro_f1':float(np.mean([r['candidate']['macro_f1'] for r in out])),'mean_delta_macro_f1':float(np.mean([r['delta_macro_f1'] for r in out])),'limitations':['No plant/farm/session IDs; pHash group isolation only.','Folder labels not independently expert-confirmed.','No Syrian coastal validation.','Historical test set deliberately excluded.']}
 (a.out/'three-fold-group-cv.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
 print('SUMMARY',json.dumps({k:summary[k] for k in ('mean_teacher_macro_f1','mean_candidate_macro_f1','mean_delta_macro_f1')},ensure_ascii=False),flush=True)
if __name__=='__main__':main()
