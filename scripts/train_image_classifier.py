#!/usr/bin/env python3
"""Train/evaluate MobileNetV3-Small from an audited, group-isolated CSV manifest."""
import argparse,csv,json,random
from collections import Counter
from pathlib import Path
import numpy as np
import torch
from PIL import Image
from sklearn.metrics import accuracy_score,classification_report,confusion_matrix,f1_score
from torch import nn
from torch.utils.data import DataLoader,Dataset
from torchvision import models,transforms
class Images(Dataset):
 def __init__(self,rows,root,indices,tf): self.rows,self.root,self.indices,self.tf=rows,root,indices,tf
 def __len__(self): return len(self.rows)
 def __getitem__(self,i):
  r=self.rows[i]
  with Image.open(self.root/r["relative_path"]) as im: x=self.tf(im.convert("RGB"))
  return x,self.indices[r["class_label"]]
def load_manifest(path,root,exploratory=False):
 with path.open(newline="",encoding="utf-8-sig") as f: rows=list(csv.DictReader(f))
 needed={"relative_path","class_label","split","group_id_for_split","provenance_verified","expert_label_review","near_duplicate_review"}
 if not rows or not needed.issubset(rows[0]): raise ValueError("Manifest missing required fields or has no rows")
 for r in rows:
  if r["split"] not in {"train","validation","test"}: raise ValueError("Invalid split")
  if not exploratory and any(r[k].strip().lower()!="yes" for k in ("provenance_verified","expert_label_review","near_duplicate_review")): raise ValueError("Training blocked: review flags are not all yes")
  if not r["group_id_for_split"].strip(): raise ValueError("Training blocked: empty group ID")
  if not (root/r["relative_path"]).is_file(): raise ValueError("Missing image: "+r["relative_path"])
 groups={s:{r["group_id_for_split"] for r in rows if r["split"]==s} for s in ("train","validation","test")}
 if groups["train"]&groups["validation"] or groups["train"]&groups["test"] or groups["validation"]&groups["test"]: raise ValueError("Group leakage across splits")
 classes={r["class_label"] for r in rows}
 for s in ("train","validation","test"):
  if {r["class_label"] for r in rows if r["split"]==s}!=classes: raise ValueError("Every class must occur in all splits")
 return rows,sorted(classes)
def predict(model,loader,device):
 model.eval(); truth=[]; pred=[]
 with torch.no_grad():
  for x,y in loader: pred.extend(model(x.to(device)).argmax(1).cpu().tolist()); truth.extend(y.tolist())
 return truth,pred
def main():
 p=argparse.ArgumentParser(description=__doc__); p.add_argument("image_root",type=Path); p.add_argument("split_manifest",type=Path); p.add_argument("--out",required=True,type=Path); p.add_argument("--epochs",type=int,default=12); p.add_argument("--batch-size",type=int,default=32); p.add_argument("--learning-rate",type=float,default=.0003); p.add_argument("--seed",type=int,default=42); p.add_argument("--pretrained",action="store_true"); p.add_argument("--exploratory-non-independent",action="store_true",help="Permit provisional depositor labels and image-level split; metrics are NOT independent validation."); a=p.parse_args()
 if a.epochs<1 or a.batch_size<1: p.error("epochs and batch size must be positive")
 random.seed(a.seed); np.random.seed(a.seed); torch.manual_seed(a.seed)
 if torch.cuda.is_available(): torch.cuda.manual_seed_all(a.seed)
 rows,classes=load_manifest(a.split_manifest,a.image_root,a.exploratory_non_independent); a.out.mkdir(parents=True,exist_ok=True); indexes={c:i for i,c in enumerate(classes)}
 train_tf=transforms.Compose([transforms.Resize((232,232)),transforms.RandomResizedCrop(224,scale=(.82,1)),transforms.RandomHorizontalFlip(),transforms.RandomRotation(8),transforms.ToTensor(),transforms.Normalize((.485,.456,.406),(.229,.224,.225))])
 eval_tf=transforms.Compose([transforms.Resize((224,224)),transforms.ToTensor(),transforms.Normalize((.485,.456,.406),(.229,.224,.225))])
 loaders={}
 for split in ("train","validation","test"):
  subset=[r for r in rows if r["split"]==split]; ds=Images(subset,a.image_root,indexes,train_tf if split=="train" else eval_tf)
  loaders[split]=DataLoader(ds,batch_size=a.batch_size,shuffle=split=="train",num_workers=2,pin_memory=torch.cuda.is_available())
 weights=models.MobileNet_V3_Small_Weights.DEFAULT if a.pretrained else None
 model=models.mobilenet_v3_small(weights=weights); model.classifier[3]=nn.Linear(model.classifier[3].in_features,len(classes))
 device=torch.device("cuda" if torch.cuda.is_available() else "cpu"); model.to(device); opt=torch.optim.AdamW(model.parameters(),lr=a.learning_rate); loss_fn=nn.CrossEntropyLoss()
 best=-1.; state=None; history=[]
 for epoch in range(1,a.epochs+1):
  model.train(); total=0.; seen=0
  for x,y in loaders["train"]:
   x,y=x.to(device),y.to(device); opt.zero_grad(set_to_none=True); loss=loss_fn(model(x),y); loss.backward(); opt.step(); total+=loss.item()*len(y); seen+=len(y)
  yt,yp=predict(model,loaders["validation"],device); acc=float(accuracy_score(yt,yp)); history.append({"epoch":epoch,"train_loss":total/max(seen,1),"validation_accuracy":acc,"validation_macro_f1":float(f1_score(yt,yp,average="macro",zero_division=0))})
  if acc>best: best=acc; state={k:v.detach().cpu().clone() for k,v in model.state_dict().items()}
 if state is None: raise RuntimeError("No best checkpoint")
 model.load_state_dict(state); yt,yp=predict(model,loaders["test"],device)
 metrics={"status":"exploratory_non_independent_baseline" if a.exploratory_non_independent else "trained_and_tested","evaluation_scope":"within-source image-level exploratory holdout; not independent by site/plant/session" if a.exploratory_non_independent else "group-isolated held-out test","architecture":"MobileNetV3-Small","pretrained_imagenet":bool(a.pretrained),"seed":a.seed,"epochs_requested":a.epochs,"best_validation_accuracy":best,"test_accuracy":float(accuracy_score(yt,yp)),"test_macro_f1":float(f1_score(yt,yp,average="macro",zero_division=0)),"classes":classes,"test_classification_report":classification_report(yt,yp,target_names=classes,output_dict=True,zero_division=0),"test_confusion_matrix":confusion_matrix(yt,yp).tolist(),"history":history,"images_per_split":dict(Counter(r["split"] for r in rows)),"groups_per_split":{s:len({r["group_id_for_split"] for r in rows if r["split"]==s}) for s in ("train","validation","test")},"limitations":["Metrics apply only to these source datasets and this split, not Syrian coastal orchards.","Dataset class labels may not be laboratory-confirmed pathogens.","This is a baseline, not a production-validated model."] + (["Exploratory mode bypasses expert-label and near-duplicate review gates; image-level split may leak plant/session/background information and is not independent validation. Do not advertise these metrics as accuracy on unseen farms."] if a.exploratory_non_independent else [])}
 torch.save({"state_dict":model.state_dict(),"classes":classes,"architecture":"mobilenet_v3_small"},a.out/"best-model.pt")
 (a.out/"metrics.json").write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps({k:metrics[k] for k in ("status","architecture","best_validation_accuracy","test_accuracy","test_macro_f1","images_per_split","groups_per_split")},ensure_ascii=False,indent=2))
if __name__=="__main__": main()
