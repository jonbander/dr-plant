#!/usr/bin/env python3
"""Group-aware linear-probe pilot for French Vitis vinifera leaf morphology."""
import argparse,csv,json,random
from pathlib import Path
import numpy as np,pandas as pd,torch,joblib
from PIL import Image
from torch import nn
from torch.utils.data import Dataset,DataLoader
from torchvision import models,transforms
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler,LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score,balanced_accuracy_score,f1_score,top_k_accuracy_score,confusion_matrix

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from training_gate_guard import extract_training_gate_args, enforce_training_gate
gate_args=extract_training_gate_args()
p=argparse.ArgumentParser()
p.add_argument('--manifest',required=True);p.add_argument('--images-root',required=True);p.add_argument('--weights',required=True);p.add_argument('--out-dir',required=True)
p.add_argument('--batch-size',type=int,default=16);p.add_argument('--threads',type=int,default=2)
a=p.parse_args();enforce_training_gate(gate_args);out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)
torch.set_num_threads(a.threads);torch.manual_seed(42);np.random.seed(42);random.seed(42)
df_all=pd.read_csv(a.manifest)
df_all=df_all[df_all.country=='FRANCE'].copy().reset_index(drop=True)
# A likely spelling alias is kept in the reference manifest but excluded from supervised classes.
df_train=df_all[(df_all.morphology_training_eligible==True)&(df_all.cultivar.str.lower()!='chardonay')].copy().reset_index(drop=True)
counts=df_train.groupby('cultivar').group_id.nunique()
classes=sorted(counts[counts>=3].index.tolist())
df_train=df_train[df_train.cultivar.isin(classes)].reset_index(drop=True)
if len(classes)<2 or any(df_train.groupby('cultivar').group_id.nunique()<3): raise RuntimeError('At least three independent vine groups per class required')

net=models.mobilenet_v3_small(weights=None)
state=torch.load(a.weights,map_location='cpu',weights_only=True);net.load_state_dict(state)
backbone=nn.Sequential(net.features,net.avgpool,nn.Flatten(1)).eval()
for q in backbone.parameters():q.requires_grad=False
transform=transforms.Compose([transforms.Resize((224,224)),transforms.ToTensor(),transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
class LeafDataset(Dataset):
 def __init__(self,frame):self.frame=frame
 def __len__(self):return len(self.frame)
 def __getitem__(self,i):
  r=self.frame.iloc[i];p=Path(a.images_root)/r.relative_path
  with Image.open(p) as im:x=transform(im.convert('RGB'))
  return x,i
loader=DataLoader(LeafDataset(df_all),batch_size=a.batch_size,shuffle=False,num_workers=0)
features=np.zeros((len(df_all),576),dtype=np.float32)
with torch.no_grad():
 for xb,idx in loader:
  f1=backbone(xb);f2=backbone(torch.flip(xb,dims=[3]));features[idx.numpy()]=((f1+f2)/2).cpu().numpy()
train_idx=df_all.index[df_all.relative_path.isin(df_train.relative_path)].to_numpy()
X=features[train_idx];df=df_all.iloc[train_idx].reset_index(drop=True)
np.savez_compressed(out/'french-reference-embeddings.npz',features=features,labels=df_all.cultivar.to_numpy(),groups=df_all.group_id.to_numpy(),paths=df_all.relative_path.to_numpy(),training_eligible=df_all.morphology_training_eligible.to_numpy())
le=LabelEncoder();y=le.fit_transform(df.cultivar);groups=df.group_id.to_numpy()
cv=StratifiedGroupKFold(n_splits=3,shuffle=True,random_state=42)
fold_rows=[];pred_all=np.full(len(df),-1,dtype=int);metrics=[]
for fold,(tr,te) in enumerate(cv.split(X,y,groups),1):
 if set(y[tr])!=set(range(len(le.classes_))): raise RuntimeError(f'fold {fold} training misses a class')
 if set(y[te])!=set(range(len(le.classes_))): raise RuntimeError(f'fold {fold} test misses a class')
 pipe=make_pipeline(StandardScaler(),LogisticRegression(C=0.1,max_iter=3000,class_weight='balanced',solver='lbfgs'))
 pipe.fit(X[tr],y[tr]);pred=pipe.predict(X[te]);proba=pipe.predict_proba(X[te]);pred_all[te]=pred
 m={'fold':fold,'train_images':len(tr),'test_images':len(te),'train_vines':len(set(groups[tr])),'test_vines':len(set(groups[te])),'accuracy':accuracy_score(y[te],pred),'balanced_accuracy':balanced_accuracy_score(y[te],pred),'macro_f1':f1_score(y[te],pred,average='macro'),'top3_accuracy':top_k_accuracy_score(y[te],proba,k=min(3,len(le.classes_)),labels=np.arange(len(le.classes_)))}
 metrics.append(m)
 for j,i in enumerate(te):fold_rows.append({'relative_path':df.iloc[i].relative_path,'cultivar':df.iloc[i].cultivar,'group_id':groups[i],'fold':fold,'true_label':le.classes_[y[i]],'predicted_label':le.classes_[pred[j]],'correct':bool(pred[j]==y[i])})
 print(json.dumps(m),flush=True)

report={'task':'French grape cultivar morphology recognition (not disease diagnosis)','status':'experimental_controlled_image_domain_not_field_validated','dataset':'Vitis vinifera leaf images, CC0-1.0','all_french_reference_images':len(df_all),'supervised_images':len(df),'classes':list(le.classes_),'class_image_counts':df.cultivar.value_counts().to_dict(),'class_vine_group_counts':df.groupby('cultivar').group_id.nunique().to_dict(),'split':'3-fold StratifiedGroupKFold by real vine position (block-row-vine); same vine never appears in train and test','feature_extractor':'ImageNet pretrained MobileNetV3-Small, frozen; average original + horizontal-flip embeddings','classifier':'StandardScaler + LogisticRegression(C=0.1,class_weight=balanced)','fold_metrics':metrics,'mean_accuracy':float(np.mean([m['accuracy'] for m in metrics])),'mean_balanced_accuracy':float(np.mean([m['balanced_accuracy'] for m in metrics])),'mean_macro_f1':float(np.mean([m['macro_f1'] for m in metrics])),'mean_top3_accuracy':float(np.mean([m['top3_accuracy'] for m in metrics])),'limitations':['controlled backlit/light-box images, not field photos','cultivar recognition only; no disease labels','Chardonay spelling alias excluded pending source verification','no claim of field performance or disease diagnostic accuracy']}
(out/'metrics.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
with (out/'fold-predictions.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.DictWriter(f,fieldnames=list(fold_rows[0].keys()));w.writeheader();w.writerows(fold_rows)
cm=confusion_matrix(y,pred_all,labels=np.arange(len(le.classes_)))
pd.DataFrame(cm,index=le.classes_,columns=le.classes_).to_csv(out/'confusion-matrix.csv')
final=make_pipeline(StandardScaler(),LogisticRegression(C=0.1,max_iter=3000,class_weight='balanced',solver='lbfgs'))
final.fit(X,y)
joblib.dump({'pipeline':final,'label_encoder':le,'classes':list(le.classes_),'feature_extractor':'mobilenet_v3_small_imagenet1k_v1','input_size':224,'grouping':'block-row-vine','status':'experimental_controlled_image_domain_not_field_validated'},out/'morphology-classifier.joblib')
print('FINAL_REPORT',json.dumps(report,ensure_ascii=False),flush=True)
