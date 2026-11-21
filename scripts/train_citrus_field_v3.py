#!/usr/bin/env python3
"""Train a tree-held-out citrus field benchmark from Mendeley V3."""
import argparse,csv,json,random,time
from pathlib import Path
from collections import Counter
import numpy as np
import torch
from PIL import Image
from sklearn.metrics import accuracy_score,classification_report,confusion_matrix,f1_score
from torch import nn
from torch.utils.data import Dataset,DataLoader,WeightedRandomSampler
from torchvision import models,transforms

CLASS_TO_DIR={
 "California red scale-like (Aonidiella aurantii)":"California red scale (Aonidiella aurantii)",
 "Greasy spot-like - Zasmidium citri-griseum (anciennement Mycosphaerella citri)":"Greasy spot - Zasmidium citri-griseum (anciennement Mycosphaerella citri)",
 "greening-like":"Greening",
 "apparently healthy":"Healthy",
}
TREE_SPLIT={
 "T01":"train","T02":"train","T07":"train","T09":"train","T010":"train","T10":"train","T11":"train","T12":"train","T13":"train",
 "T03":"val","T05":"val","T06":"val",
 "T04":"test","T08":"test",
}
class CitrusImages(Dataset):
 def __init__(self,rows,root,classes,tf): self.rows,self.root,self.classes,self.tf=rows,root,classes,tf
 def __len__(self): return len(self.rows)
 def __getitem__(self,i):
  r=self.rows[i]
  with Image.open(self.root/r["path"]) as im: x=self.tf(im.convert("RGB"))
  return x,self.classes.index(r["label"])
def main():
 p=argparse.ArgumentParser()
 p.add_argument("--data",type=Path,required=True);p.add_argument("--out",type=Path,required=True)
 p.add_argument("--epochs",type=int,default=18);p.add_argument("--batch-size",type=int,default=16)
 p.add_argument("--image-size",type=int,default=160);p.add_argument("--workers",type=int,default=0)
 p.add_argument("--seed",type=int,default=42);p.add_argument("--patience",type=int,default=5);p.add_argument("--resume",action="store_true")
 a=p.parse_args()
 random.seed(a.seed);np.random.seed(a.seed);torch.manual_seed(a.seed)
 if torch.cuda.is_available(): torch.cuda.manual_seed_all(a.seed)
 meta=a.data/"metadata.csv"; root=a.data/"Moroccan Citrus Leaf Dataset"
 with meta.open(encoding="utf-8-sig",newline="") as f: source=list(csv.DictReader(f))
 rows=[];quarantined=[]
 for r in source:
  label=r["Class"].strip(); tree=r["Tree_ID"].strip()
  if label not in CLASS_TO_DIR: raise ValueError("Unknown source class: "+label)
  if tree not in TREE_SPLIT: raise ValueError("Tree missing from explicit group split: "+tree)
  path_parts=Path(r["Original_Relative_Path"]).parts
  path_tree=path_parts[-2] if len(path_parts)>=2 else ""
  # Quarantine the one source row whose metadata Tree_ID (T07) conflicts with its
  # on-disk folder (T08); do not silently assign a disputed group to a split.
  if path_tree != tree:
   quarantined.append({"image_id":r["Image_ID"],"metadata_tree":tree,"path_tree":path_tree,"reason":"Tree_ID conflicts with source image folder"})
   continue
  folder=CLASS_TO_DIR[label]
  src_name=Path(r["Original_Relative_Path"]).stem
  candidates=sorted((root/folder/tree).glob(src_name+".*"))
  if not candidates: raise FileNotFoundError(root/folder/tree/(src_name+".*"))
  path=candidates[0].relative_to(root)
  rows.append({"path":str(path),"label":label,"tree_id":tree,"split":TREE_SPLIT[tree],"image_id":r["Image_ID"],"leaf_id":r["Leaf_ID"]})
 classes=sorted({r["label"] for r in rows})
 for s in ("train","val","test"):
  missing=set(classes)-{r["label"] for r in rows if r["split"]==s}
  if missing: raise ValueError(f"{s} missing classes: {sorted(missing)}")
 groups={s:{r["tree_id"] for r in rows if r["split"]==s} for s in ("train","val","test")}
 assert not(groups["train"]&groups["val"] or groups["train"]&groups["test"] or groups["val"]&groups["test"])
 a.out.mkdir(parents=True,exist_ok=True)
 with (a.out/"manifest.csv").open("w",newline="",encoding="utf-8") as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
 tf_train=transforms.Compose([transforms.Resize((a.image_size+16,a.image_size+16)),transforms.RandomResizedCrop(a.image_size,scale=(.78,1)),transforms.RandomHorizontalFlip(),transforms.RandomRotation(12),transforms.ColorJitter(brightness=.15,contrast=.15,saturation=.1),transforms.ToTensor(),transforms.Normalize((.485,.456,.406),(.229,.224,.225))])
 tf_eval=transforms.Compose([transforms.Resize((a.image_size,a.image_size)),transforms.ToTensor(),transforms.Normalize((.485,.456,.406),(.229,.224,.225))])
 sets={s:CitrusImages([r for r in rows if r["split"]==s],root,classes,tf_train if s=="train" else tf_eval) for s in ("train","val","test")}
 counts=Counter(r["label"] for r in rows if r["split"]=="train")
 sample_weights=[1.0/counts[r["label"]] for r in rows if r["split"]=="train"]
 sampler=WeightedRandomSampler(sample_weights,len(sample_weights),replacement=True)
 loaders={s:DataLoader(ds,batch_size=a.batch_size,shuffle=False if s=="train" else False,sampler=sampler if s=="train" else None,num_workers=a.workers) for s,ds in sets.items()}
 device=torch.device("cuda" if torch.cuda.is_available() else "cpu")
 model=models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
 model.classifier[-1]=nn.Linear(model.classifier[-1].in_features,len(classes))
 for p0 in model.features.parameters(): p0.requires_grad=False
 for block in list(model.features.children())[-2:]:
  for p0 in block.parameters(): p0.requires_grad=True
 model.to(device)
 opt=torch.optim.AdamW((p0 for p0 in model.parameters() if p0.requires_grad),lr=2e-4,weight_decay=1e-4)
 weights=torch.tensor([1.0/max(counts[c],1) for c in classes],dtype=torch.float32,device=device)
 weights=weights/weights.mean()
 loss_fn=nn.CrossEntropyLoss(weight=weights)
 best=-1;best_state=None;history=[];stale=0;start=time.time();start_epoch=1
 checkpoint_path=a.out/"training-checkpoint.pt"
 if a.resume and checkpoint_path.is_file():
  ck=torch.load(checkpoint_path,map_location=device,weights_only=False)
  if ck["classes"]!=classes: raise ValueError("Checkpoint class order mismatch")
  model.load_state_dict(ck["state_dict"]);opt.load_state_dict(ck["optimizer"]);best=float(ck["best_val"]);best_state=ck["best_state"];history=ck["history"];start_epoch=int(ck["epoch"])+1
  print(f"Resuming at epoch {start_epoch}",flush=True)
 for epoch in range(start_epoch,a.epochs+1):
  model.train();total=seen=0
  for step,(x,y) in enumerate(loaders["train"],1):
   x,y=x.to(device),y.to(device);opt.zero_grad(set_to_none=True)
   loss=loss_fn(model(x),y);loss.backward();opt.step()
   total+=loss.item()*len(y);seen+=len(y)
  model.eval();yt=[];yp=[]
  with torch.no_grad():
   for x,y in loaders["val"]:
    z=model(x.to(device)).argmax(1).cpu().tolist();yp.extend(z);yt.extend(y.tolist())
  acc=float(accuracy_score(yt,yp));macro=float(f1_score(yt,yp,average="macro",zero_division=0))
  history.append({"epoch":epoch,"train_loss":total/max(seen,1),"val_accuracy":acc,"val_macro_f1":macro})
  print(json.dumps(history[-1]),flush=True)
  if acc>best:
   best=acc;stale=0;best_state={k:v.detach().cpu().clone() for k,v in model.state_dict().items()}
   torch.save({"state_dict":best_state,"classes":classes,"architecture":"mobilenet_v3_small","image_size":a.image_size},a.out/"best-model.pt")
  else: stale+=1
  (a.out/"history.json").write_text(json.dumps(history,indent=2))
  torch.save({"epoch":epoch,"state_dict":model.state_dict(),"optimizer":opt.state_dict(),"best_state":best_state,"best_val":best,"classes":classes,"history":history},a.out/"training-checkpoint.pt")
  if stale>=a.patience: print("Early stopping",flush=True);break
 model.load_state_dict(best_state);model.eval();yt=[];yp=[]
 with torch.no_grad():
  for x,y in loaders["test"]:
   yp.extend(model(x.to(device)).argmax(1).cpu().tolist());yt.extend(y.tolist())
 report={"status":"field_dataset_tree_held_out_exploratory_benchmark","dataset":"Mendeley Field-Based Citrus Leaf Disease Image Dataset V3","doi":"10.17632/szsms728jf.3","license":"CC BY 4.0","architecture":"MobileNetV3-Small","pretrained":"ImageNet weights","image_size":a.image_size,"epochs_completed":len(history),"best_validation_accuracy":best,"test_accuracy":float(accuracy_score(yt,yp)),"test_macro_f1":float(f1_score(yt,yp,average="macro",zero_division=0)),"classes":classes,"quarantined_source_rows":quarantined,"images_per_split":{s:sum(r["split"]==s for r in rows) for s in ("train","val","test")},"class_counts_by_split":{s:dict(Counter(r["label"] for r in rows if r["split"]==s)) for s in ("train","val","test")},"trees_by_split":{s:sorted(groups[s]) for s in groups},"test_classification_report":classification_report(yt,yp,target_names=classes,output_dict=True,zero_division=0),"confusion_matrix":confusion_matrix(yt,yp).tolist(),"history":history,"elapsed_seconds":round(time.time()-start,1),"device":str(device),"limitations":["Tree-held-out split avoids same-tree leakage, but all images originate from one Moroccan orchard/region and a single collection campaign.","Labels describe expert-assigned visual classes, including '-like' symptom labels; not all are laboratory-confirmed pathogens.","Not validated on Syrian coastal farms; not suitable as a production diagnosis model.","Model abstention/calibration and external Syrian validation remain mandatory."]}
 (a.out/"metrics.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
 (a.out/"labels.json").write_text(json.dumps(classes,ensure_ascii=False,indent=2))
 try:
  dummy=torch.zeros(1,3,a.image_size,a.image_size)
  torch.onnx.export(model,dummy,str(a.out/"citrus-field-v3-mobilenetv3-small.onnx"),input_names=["images"],output_names=["logits"],dynamic_axes={"images":{0:"batch"},"logits":{0:"batch"}},opset_version=17)
  report["onnx_export"]="success"
 except Exception as e: report["onnx_export"]="failed: "+repr(e)
 (a.out/"metrics.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print(json.dumps({k:report[k] for k in ["status","test_accuracy","test_macro_f1","best_validation_accuracy","class_counts_by_split","trees_by_split","onnx_export","elapsed_seconds"]},ensure_ascii=False,indent=2),flush=True)
if __name__=="__main__":main()