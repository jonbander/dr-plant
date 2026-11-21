#!/usr/bin/env python3
"""Baseline transfer-learning trainer for Dr Plant research datasets.

Expected directory layout:
  DATA_ROOT/
    train/<class_name>/*.(jpg|jpeg|png)
    val/<class_name>/*.(jpg|jpeg|png)
    test/<class_name>/*.(jpg|jpeg|png)

IMPORTANT: create these splits by farm/site/plant/season BEFORE augmentation.
This script intentionally does not create random image-level splits.
"""
from __future__ import annotations
import argparse, json, random, time
from pathlib import Path
import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

def seed_everything(seed: int) -> None:
    random.seed(seed); np.random.seed(seed); torch.manual_seed(seed)
    if torch.cuda.is_available(): torch.cuda.manual_seed_all(seed)

def loaders(root: Path, size: int, batch: int, workers: int):
    norm = transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
    train_tf = transforms.Compose([transforms.Resize((size,size)),
        transforms.RandomHorizontalFlip(), transforms.RandomRotation(12),
        transforms.ColorJitter(brightness=.12,contrast=.12,saturation=.08), transforms.ToTensor(), norm])
    eval_tf = transforms.Compose([transforms.Resize((size,size)),transforms.ToTensor(),norm])
    ds = {s: datasets.ImageFolder(root/s, train_tf if s=="train" else eval_tf)
          for s in ("train","val","test")}
    classes = ds["train"].classes
    for s in ("val","test"):
        if ds[s].classes != classes:
            raise ValueError(f"Class folders differ in {s}; expected {classes}, got {ds[s].classes}")
    return ({s: DataLoader(d,batch_size=batch,shuffle=(s=="train"),num_workers=workers,
             pin_memory=torch.cuda.is_available()) for s,d in ds.items()}, classes,
            {s:len(d) for s,d in ds.items()})

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--data",required=True); p.add_argument("--out",default="outputs/dr-plant-baseline")
    p.add_argument("--epochs",type=int,default=25); p.add_argument("--batch-size",type=int,default=32)
    p.add_argument("--image-size",type=int,default=224); p.add_argument("--workers",type=int,default=2)
    p.add_argument("--lr",type=float,default=3e-4); p.add_argument("--seed",type=int,default=42)
    a=p.parse_args(); seed_everything(a.seed)
    root=Path(a.data); out=Path(a.out); out.mkdir(parents=True,exist_ok=True)
    dl,classes,counts=loaders(root,a.image_size,a.batch_size,a.workers)
    device=torch.device("cuda" if torch.cuda.is_available() else "cpu")
    weights=models.MobileNet_V3_Small_Weights.DEFAULT
    model=models.mobilenet_v3_small(weights=weights)
    model.classifier[-1]=nn.Linear(model.classifier[-1].in_features,len(classes))
    model.to(device); opt=torch.optim.AdamW(model.parameters(),lr=a.lr)
    loss_fn=nn.CrossEntropyLoss()
    best=-1.0; history=[]
    for epoch in range(1,a.epochs+1):
        row={"epoch":epoch}
        for phase in ("train","val"):
            model.train(phase=="train"); total=correct=loss_sum=0
            for x,y in dl[phase]:
                x,y=x.to(device),y.to(device); opt.zero_grad(set_to_none=True)
                with torch.set_grad_enabled(phase=="train"):
                    logits=model(x); loss=loss_fn(logits,y)
                    if phase=="train": loss.backward(); opt.step()
                total+=y.size(0); loss_sum+=loss.item()*y.size(0)
                correct+=(logits.argmax(1)==y).sum().item()
            row[phase+"_loss"]=loss_sum/max(total,1); row[phase+"_accuracy"]=correct/max(total,1)
        history.append(row)
        print(json.dumps(row))
        if row["val_accuracy"]>best:
            best=row["val_accuracy"]
            torch.save({"model":model.state_dict(),"classes":classes,"epoch":epoch,
                        "val_accuracy":best,"image_size":a.image_size},out/"best.pt")
        with open(out/"history.json","w") as f: json.dump(history,f,indent=2)
    # Evaluate the held-out test set once after model selection.
    ckpt=torch.load(out/"best.pt",map_location=device,weights_only=False)
    model.load_state_dict(ckpt["model"]); model.eval()
    total=correct=0; per_class={c:{"n":0,"correct":0} for c in classes}
    with torch.no_grad():
        for x,y in dl["test"]:
            logits=model(x.to(device)); pred=logits.argmax(1).cpu()
            total+=y.size(0); correct+=(pred==y).sum().item()
            for t,q in zip(y.tolist(),pred.tolist()):
                per_class[classes[t]]["n"]+=1; per_class[classes[t]]["correct"]+=int(t==q)
    report={"test_accuracy":correct/max(total,1),"test_count":total,"class_metrics":per_class,
            "class_order":classes,"split_counts":counts,"device":str(device),
            "warning":"Exploratory benchmark only; not validated for Syrian coastal deployment."}
    (out/"test_report.json").write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2))

if __name__=="__main__": main()
