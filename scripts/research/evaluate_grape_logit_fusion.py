#!/usr/bin/env python3
import argparse,json,hashlib
from pathlib import Path
import numpy as np, torch, joblib
from torchvision import models
from torch import nn
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score,balanced_accuracy_score,f1_score,classification_report,confusion_matrix
p=argparse.ArgumentParser();p.add_argument('--cache',type=Path,required=True);p.add_argument('--checkpoint',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
z=np.load(a.cache,allow_pickle=True); deep=z['deep'];hog=z['hog'];lbp=z['lbp'];shape=z['shape'];color=z['color'];vp=z['vitis_morphology_probabilities'];y=z['labels'];splits=z['splits'];paths=z['paths']
tr=np.where(splits=='train')[0];va=np.where(splits=='validation')[0]
ck=torch.load(a.checkpoint,map_location='cpu',weights_only=True); net=models.mobilenet_v3_small(weights=None);net.classifier[3]=nn.Linear(net.classifier[3].in_features,len(ck['classes']));net.load_state_dict(ck['model']);net.eval()
with torch.no_grad(): logits=net.classifier(torch.from_numpy(deep)).numpy()
classes=ck['classes']; out={}
def fit(name,X):
 m=make_pipeline(StandardScaler(),LogisticRegression(C=.1,max_iter=3000,class_weight='balanced',solver='lbfgs'));m.fit(X[tr],y[tr]);pred=m.predict(X[va]);out[name]={'accuracy':float(accuracy_score(y[va],pred)),'balanced_accuracy':float(balanced_accuracy_score(y[va],pred)),'macro_f1':float(f1_score(y[va],pred,average='macro')),'per_class':classification_report(y[va],pred,target_names=classes,output_dict=True,zero_division=0),'confusion_matrix':confusion_matrix(y[va],pred).tolist()};joblib.dump(m,a.out/f'{name}.joblib');print(name,{k:out[name][k] for k in ('accuracy','balanced_accuracy','macro_f1')},flush=True)
a.out.mkdir(parents=True,exist_ok=True)
for name,X in [
 ('teacher_logits_linear',logits),
 ('teacher_logits_plus_hog_lbp_shape',np.concatenate([logits,hog,lbp,shape],1)),
 ('teacher_logits_plus_morphology_expert',np.concatenate([logits,hog,lbp,shape,vp],1)),
 ('teacher_logits_plus_deep_and_morphology',np.concatenate([logits,deep,hog,lbp,shape,vp],1)),
 ('teacher_logits_plus_deep_morphology_color',np.concatenate([logits,deep,hog,lbp,shape,vp,color],1))]: fit(name,X)
summary={'status':'research_only_validation_only','test_split_loaded':False,'selected_by_validation_macro_f1':max(out,key=lambda k:out[k]['macro_f1']),'results':out,'classes':classes,'limitations':['No plant/farm/session group IDs; only pHash connected components were isolated.','Folder labels are not expert-confirmed.','Validation results only; historical test split intentionally untouched.','Not Syrian field validated; not for production diagnosis.']}
(a.out/'logit-fusion-validation-only.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
