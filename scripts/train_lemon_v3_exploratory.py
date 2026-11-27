#!/usr/bin/env python3
"""Exploratory Lemon V3 transfer-learning run; image-level split only."""
import argparse,csv,json,random,time
from pathlib import Path
from collections import Counter
import numpy as np, torch
from PIL import Image
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score,f1_score,classification_report,confusion_matrix
from torch import nn
from torch.utils.data import Dataset,DataLoader
from torchvision import models,transforms
class DS(Dataset):
 def __init__(self,rows,classes,tf):self.rows,self.classes,self.tf=rows,classes,tf
 def __len__(self):return len(self.rows)
 def __getitem__(self,i):
  r=self.rows[i]
  with Image.open(r["path"]) as im:x=self.tf(im.convert("RGB"))
  return x,self.classes.index(r["label"])
from training_gate_guard import extract_training_gate_args, enforce_training_gate

def main():
 gate_args=extract_training_gate_args()
 p=argparse.ArgumentParser();p.add_argument("--data",type=Path,required=True);p.add_argument("--out",type=Path,required=True);p.add_argument("--epochs",type=int,default=3);p.add_argument("--batch-size",type=int,default=32);p.add_argument("--image-size",type=int,default=128);p.add_argument("--workers",type=int,default=0);p.add_argument("--seed",type=int,default=42);p.add_argument("--resume",action="store_true");p.add_argument("--unfreeze-last-blocks",type=int,default=2);a=p.parse_args();enforce_training_gate(gate_args)
 random.seed(a.seed);np.random.seed(a.seed);torch.manual_seed(a.seed)
 rows=[]
 for f in a.data.rglob("*"):
  if f.suffix.lower() in {".jpg",".jpeg",".png"}:
   label=f.parent.name;rows.append({"path":str(f),"label":label,"filename":f.name})
 if not rows:raise ValueError("No images found")
 classes=sorted({r["label"] for r in rows})
 trainval,test=train_test_split(rows,test_size=.15,random_state=a.seed,stratify=[r["label"] for r in rows])
 train,val=train_test_split(trainval,test_size=.1764706,random_state=a.seed,stratify=[r["label"] for r in trainval])
 for r,s in [(r,"train") for r in train]+[(r,"val") for r in val]+[(r,"test") for r in test]:r["split"]=s
 a.out.mkdir(parents=True,exist_ok=True)
 with (a.out/"manifest.csv").open("w",newline="",encoding="utf-8") as f:
  w=csv.DictWriter(f,fieldnames=["path","label","split","filename"]);w.writeheader();w.writerows(rows)
 size=a.image_size
 tftr=transforms.Compose([transforms.Resize((size+8,size+8)),transforms.RandomResizedCrop(size,scale=(.82,1)),transforms.RandomHorizontalFlip(),transforms.RandomRotation(10),transforms.ColorJitter(brightness=.12,contrast=.12,saturation=.08),transforms.ToTensor(),transforms.Normalize((.485,.456,.406),(.229,.224,.225))])
 tfev=transforms.Compose([transforms.Resize((size,size)),transforms.ToTensor(),transforms.Normalize((.485,.456,.406),(.229,.224,.225))])
 sets={s:DS([r for r in rows if r["split"]==s],classes,tftr if s=="train" else tfev) for s in ["train","val","test"]}
 loaders={s:DataLoader(d,batch_size=a.batch_size,shuffle=s=="train",num_workers=a.workers) for s,d in sets.items()}
 model=models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
 model.classifier[-1]=nn.Linear(model.classifier[-1].in_features,len(classes))
 for q in model.features.parameters():q.requires_grad=False
 if a.unfreeze_last_blocks>0:
  for block in list(model.features.children())[-a.unfreeze_last_blocks:]:
   for q in block.parameters():q.requires_grad=True
 best=0;best_state=None;hist=[];start_epoch=1;start=time.time()
 if a.resume and (a.out/"best-model.pt").is_file():
  ck=torch.load(a.out/"best-model.pt",map_location="cpu",weights_only=False)
  if ck["classes"]!=classes: raise ValueError("Checkpoint class order mismatch")
  model.load_state_dict(ck["state_dict"]);best_state=ck["state_dict"]
  hp=a.out/"history.json";hist=json.loads(hp.read_text()) if hp.exists() else []
  best=max((x.get("val_accuracy",0) for x in hist),default=0);start_epoch=len(hist)+1
  print(f"Resuming from epoch {start_epoch} with best val={best:.4f}",flush=True)
 model.to("cpu");opt=torch.optim.AdamW((q for q in model.parameters() if q.requires_grad),lr=1.5e-4);lossfn=nn.CrossEntropyLoss()
 for ep in range(start_epoch,a.epochs+1):
  model.train();losses=[]
  for x,y in loaders["train"]:
   opt.zero_grad();z=model(x);loss=lossfn(z,y);loss.backward();opt.step();losses.append(loss.item())
  model.eval();yt=[];yp=[]
  with torch.no_grad():
   for x,y in loaders["val"]:yp+=model(x).argmax(1).tolist();yt+=y.tolist()
  acc=float(accuracy_score(yt,yp));hist.append({"epoch":ep,"train_loss":float(np.mean(losses)),"val_accuracy":acc})
  print(json.dumps(hist[-1]),flush=True)
  if acc>best:best=acc;best_state={k:v.clone() for k,v in model.state_dict().items()};torch.save({"state_dict":best_state,"classes":classes},a.out/"best-model.pt")
  (a.out/"history.json").write_text(json.dumps(hist,indent=2))
 model.load_state_dict(best_state);model.eval();yt=[];yp=[]
 with torch.no_grad():
  for x,y in loaders["test"]:yp+=model(x).argmax(1).tolist();yt+=y.tolist()
 report={"status":"exploratory_image_level_split_non_independent","dataset":"Large-Scale Lemon Leaf Disease and Pest Image Dataset V3","doi":"10.17632/8d9fv6kpt3.3","license":"CC BY 4.0","images":len(rows),"classes":classes,"images_per_split":{s:len(sets[s]) for s in sets},"epochs_completed":len(hist),"best_validation_accuracy":best,"fine_tuned_last_blocks":a.unfreeze_last_blocks,"test_accuracy":float(accuracy_score(yt,yp)),"test_macro_f1":float(f1_score(yt,yp,average="macro",zero_division=0)),"classification_report":classification_report(yt,yp,target_names=classes,output_dict=True,zero_division=0),"confusion_matrix":confusion_matrix(yt,yp).tolist(),"history":hist,"elapsed_seconds":round(time.time()-start,1),"limitations":["No per-image farm/tree/plant IDs were supplied for grouped splitting.","Image-level holdout can share acquisition conditions and source context; not independent external validation.","Images photographed against a plain white background; not orchard-scene field images.","Expert label review is reported by dataset authors but not independently repeated by Dr Plant team.","Not validated on Syrian cultivars or conditions; do not deploy as a diagnostic model."]}
 try:
  torch.onnx.export(model,torch.zeros(1,3,size,size),str(a.out/"lemon-v3-mobilenetv3-small.onnx"),input_names=["images"],output_names=["logits"],dynamic_axes={"images":{0:"batch"},"logits":{0:"batch"}},opset_version=17);report["onnx_export"]="success"
 except Exception as e:report["onnx_export"]="failed: "+repr(e)
 (a.out/"labels.json").write_text(json.dumps(classes,ensure_ascii=False,indent=2)+"\\n")
 (a.out/"metrics.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print(json.dumps({k:report[k] for k in ["status","images","best_validation_accuracy","test_accuracy","test_macro_f1","images_per_split","onnx_export","elapsed_seconds"]},ensure_ascii=False,indent=2),flush=True)
if __name__=="__main__":main()
