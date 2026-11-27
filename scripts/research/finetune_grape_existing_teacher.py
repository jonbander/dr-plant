#!/usr/bin/env python3
"""Conservative continual fine-tuning of the existing grape disease model.

Only train/validation are loaded. The historical test split is intentionally
excluded because it was already evaluated by the previous run.
"""
import argparse,csv,json,random,hashlib
from pathlib import Path
from collections import Counter
import numpy as np, torch
from PIL import Image
from torch import nn
from torch.utils.data import Dataset,DataLoader,WeightedRandomSampler
from torchvision import models,transforms
from sklearn.metrics import accuracy_score,balanced_accuracy_score,f1_score,classification_report,confusion_matrix

class LeafRows(Dataset):
 def __init__(self,rows,root,classes,train=False):
  self.rows=rows;self.root=root;self.lookup={c:i for i,c in enumerate(classes)}
  self.tf=transforms.Compose(([transforms.Resize((176,176)),transforms.RandomResizedCrop(160,scale=(.88,1.0),ratio=(.92,1.08)),transforms.RandomHorizontalFlip(),transforms.RandomRotation(8),transforms.ColorJitter(brightness=.10,contrast=.10,saturation=.08)] if train else [transforms.Resize((160,160))])+[transforms.ToTensor(),transforms.Normalize([.485,.456,.406],[.229,.224,.225])])
 def __len__(self):return len(self.rows)
 def __getitem__(self,i):
  r=self.rows[i]
  with Image.open(self.root/r['processed_path']) as im:x=self.tf(im.convert('RGB'))
  return x,self.lookup[r['class_label'].replace(' ','_')]

def evaluate(model,loader,device,classes):
 model.eval(); ys=[]; ps=[]
 with torch.no_grad():
  for x,y in loader:
   z=model(x.to(device)); ps.extend(z.argmax(1).cpu().tolist());ys.extend(y.tolist())
 return {'accuracy':float(accuracy_score(ys,ps)),'balanced_accuracy':float(balanced_accuracy_score(ys,ps)),
         'macro_f1':float(f1_score(ys,ps,average='macro',zero_division=0)),
         'per_class':classification_report(ys,ps,target_names=classes,output_dict=True,zero_division=0),
         'confusion_matrix':confusion_matrix(ys,ps).tolist()}

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from training_gate_guard import extract_training_gate_args, enforce_training_gate

def main():
 gate_args=extract_training_gate_args()
 p=argparse.ArgumentParser();p.add_argument('--dataset-root',type=Path,required=True);p.add_argument('--manifest',type=Path,required=True);p.add_argument('--teacher',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--epochs',type=int,default=4);p.add_argument('--batch-size',type=int,default=16);p.add_argument('--threads',type=int,default=4);a=p.parse_args();enforce_training_gate(gate_args, data_root=a.dataset_root, split_manifest=a.manifest)
 random.seed(43);np.random.seed(43);torch.manual_seed(43);torch.set_num_threads(a.threads);device=torch.device('cpu')
 ck=torch.load(a.teacher,map_location='cpu',weights_only=True);classes=ck['classes']
 with a.manifest.open(newline='',encoding='utf-8-sig') as f:allrows=list(csv.DictReader(f))
 rows=[r for r in allrows if r['split'] in ('train','val','validation')]
 for r in rows:
  if not (a.dataset_root/r['processed_path']).is_file():raise FileNotFoundError(r['processed_path'])
  if r['split']=='val':r['split']='validation'
 groups={s:{r['group_id'] for r in rows if r['split']==s} for s in ('train','validation')}
 if groups['train']&groups['validation']:raise RuntimeError('near-duplicate group leakage')
 train_rows=[r for r in rows if r['split']=='train']; val_rows=[r for r in rows if r['split']=='validation']
 counts=Counter(r['class_label'].replace(' ','_') for r in train_rows)
 if set(counts)!=set(classes):raise RuntimeError('class order/coverage mismatch')
 train_ds=LeafRows(train_rows,a.dataset_root,classes,True);val_ds=LeafRows(val_rows,a.dataset_root,classes,False)
 sample_weights=[1.0/counts[r['class_label'].replace(' ','_')] for r in train_rows]
 sampler=WeightedRandomSampler(sample_weights,num_samples=len(sample_weights),replacement=True)
 tl=DataLoader(train_ds,batch_size=a.batch_size,sampler=sampler,num_workers=2)
 vl=DataLoader(val_ds,batch_size=a.batch_size,shuffle=False,num_workers=2)
 model=models.mobilenet_v3_small(weights=None);model.classifier[3]=nn.Linear(model.classifier[3].in_features,len(classes));model.load_state_dict(ck['model']);model.to(device)
 baseline=evaluate(model,vl,device,classes)
 for p0 in model.parameters():p0.requires_grad=False
 for i,block in enumerate(model.features):
  if i>=10:
   for p0 in block.parameters():p0.requires_grad=True
 for p0 in model.classifier.parameters():p0.requires_grad=True
 backbone=[p0 for i,b in enumerate(model.features) if i>=10 for p0 in b.parameters()]
 head=list(model.classifier.parameters())
 opt=torch.optim.AdamW([{'params':backbone,'lr':1e-5},{'params':head,'lr':7e-5}],weight_decay=1e-4)
 loss_fn=nn.CrossEntropyLoss(label_smoothing=.03)
 a.out.mkdir(parents=True,exist_ok=True)
 history=[];best=-1;best_epoch=0
 for epoch in range(1,a.epochs+1):
  model.train()
  for i,b in enumerate(model.features):
   if i<10:b.eval()
  total=0;seen=0
  for x,y in tl:
   x,y=x.to(device),y.to(device);opt.zero_grad(set_to_none=True);loss=loss_fn(model(x),y);loss.backward();nn.utils.clip_grad_norm_(model.parameters(),1.0);opt.step();total+=loss.item()*len(y);seen+=len(y)
  val=evaluate(model,vl,device,classes)
  item={'epoch':epoch,'train_loss':total/max(seen,1),**val};history.append(item)
  torch.save({'model':model.state_dict(),'optimizer':opt.state_dict(),'epoch':epoch,'classes':classes,'teacher_sha256':hashlib.sha256(a.teacher.read_bytes()).hexdigest(),'history':history},a.out/'last-state.pt')
  if val['macro_f1']>best:
   best=val['macro_f1'];best_epoch=epoch
   torch.save({'model':model.state_dict(),'epoch':epoch,'classes':classes,'teacher_sha256':hashlib.sha256(a.teacher.read_bytes()).hexdigest()},a.out/'best-candidate.pt')
  print(json.dumps(item,ensure_ascii=False),flush=True)
 summary={'status':'research_only_validation_only','teacher_sha256':hashlib.sha256(a.teacher.read_bytes()).hexdigest(),'teacher_validation':baseline,'best_candidate_validation':max(history,key=lambda x:x['macro_f1']),'best_epoch':best_epoch,'history':history,'data':{'train':len(train_rows),'validation':len(val_rows),'test_images_loaded':0,'train_groups':len(groups['train']),'validation_groups':len(groups['validation']),'classes':classes},'method':'Continue from existing MobileNetV3-Small best.pt; freeze features[0:10], fine-tune features[10:13] and classifier; weighted sampler; mild geometry-preserving augmentation; low differential learning rates.','limitations':['Folder labels not independently expert-confirmed.','No plant/farm/session metadata; split isolates only known pHash connected components.','No Syrian coastal field validation.','Historical test split deliberately untouched.','Do not promote to production or generate pesticide advice.']}
 (a.out/'continual-finetune-validation-only.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
 print('SUMMARY',json.dumps({'teacher_macro_f1':baseline['macro_f1'],'candidate_macro_f1':best,'best_epoch':best_epoch},ensure_ascii=False),flush=True)
if __name__=='__main__':main()
