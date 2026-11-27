#!/usr/bin/env python3
"""Train/evaluate MobileNetV3-Small from an audited manifest, with visible progress and resumable checkpoints."""
import argparse, csv, json, random, os
from collections import Counter
from pathlib import Path
import numpy as np
import torch
from PIL import Image
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms

class Images(Dataset):
    def __init__(self, rows, root, indices, tf):
        self.rows, self.root, self.indices, self.tf = rows, root, indices, tf
    def __len__(self): return len(self.rows)
    def __getitem__(self, i):
        r = self.rows[i]
        with Image.open(self.root / r["relative_path"]) as im:
            x = self.tf(im.convert("RGB"))
        return x, self.indices[r["class_label"]]

def load_manifest(path, root, exploratory=False):
    with path.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    needed = {"relative_path","class_label","split","group_id_for_split","provenance_verified","expert_label_review","near_duplicate_review"}
    if not rows or not needed.issubset(rows[0]):
        raise ValueError("Manifest missing required fields or has no rows")
    for r in rows:
        if r["split"] not in {"train","validation","test"}: raise ValueError("Invalid split")
        if not exploratory and any(r[k].strip().lower() != "yes" for k in ("provenance_verified","expert_label_review","near_duplicate_review")):
            raise ValueError("Training blocked: review flags are not all yes")
        if not r["group_id_for_split"].strip(): raise ValueError("Training blocked: empty group ID")
        if not (root / r["relative_path"]).is_file(): raise ValueError("Missing image: " + r["relative_path"])
    groups = {s:{r["group_id_for_split"] for r in rows if r["split"] == s} for s in ("train","validation","test")}
    if groups["train"] & groups["validation"] or groups["train"] & groups["test"] or groups["validation"] & groups["test"]:
        raise ValueError("Group leakage across splits")
    classes = {r["class_label"] for r in rows}
    for s in ("train","validation","test"):
        if {r["class_label"] for r in rows if r["split"] == s} != classes:
            raise ValueError("Every class must occur in all splits")
    return rows, sorted(classes)

def predict(model, loader, device):
    model.eval(); truth=[]; pred=[]
    with torch.no_grad():
        for x,y in loader:
            pred.extend(model(x.to(device)).argmax(1).cpu().tolist())
            truth.extend(y.tolist())
    return truth,pred

def atomic_save(payload, path):
    tmp = path.with_suffix(path.suffix + ".tmp")
    torch.save(payload, tmp)
    os.replace(tmp, path)

from training_gate_guard import extract_training_gate_args, enforce_training_gate

def main():
    gate_args=extract_training_gate_args()
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("image_root",type=Path); p.add_argument("split_manifest",type=Path)
    p.add_argument("--out",required=True,type=Path); p.add_argument("--epochs",type=int,default=8)
    p.add_argument("--batch-size",type=int,default=16); p.add_argument("--learning-rate",type=float,default=.0003)
    p.add_argument("--seed",type=int,default=42); p.add_argument("--pretrained",action="store_true")
    p.add_argument("--exploratory-non-independent",action="store_true")
    p.add_argument("--resume",action="store_true",help="Resume from training-checkpoint.pt if present")
    p.add_argument("--freeze-backbone",action="store_true",help="Freeze MobileNet feature extractor and train the final classifier layer (fast CPU baseline)")
    p.add_argument("--image-size",type=int,default=224)
    p.add_argument("--workers",type=int,default=0)
    p.add_argument("--init-from",type=Path,default=None,help="Initialize weights from an existing best-model.pt")
    p.add_argument("--unfreeze-last-blocks",type=int,default=0,help="Unfreeze the final N MobileNet feature blocks for fine-tuning")
    a=p.parse_args()
    enforce_training_gate(gate_args, data_root=a.image_root, split_manifest=a.split_manifest)
    if a.epochs<1 or a.batch_size<1: p.error("epochs and batch size must be positive")
    random.seed(a.seed); np.random.seed(a.seed); torch.manual_seed(a.seed)
    if torch.cuda.is_available(): torch.cuda.manual_seed_all(a.seed)
    rows,classes=load_manifest(a.split_manifest,a.image_root,a.exploratory_non_independent)
    a.out.mkdir(parents=True,exist_ok=True); indexes={c:i for i,c in enumerate(classes)}
    train_tf=transforms.Compose([transforms.Resize((a.image_size+8,a.image_size+8)),transforms.RandomResizedCrop(a.image_size,scale=(.82,1)),transforms.RandomHorizontalFlip(),transforms.RandomRotation(8),transforms.ToTensor(),transforms.Normalize((.485,.456,.406),(.229,.224,.225))])
    eval_tf=transforms.Compose([transforms.Resize((a.image_size,a.image_size)),transforms.ToTensor(),transforms.Normalize((.485,.456,.406),(.229,.224,.225))])
    loaders={}
    for split in ("train","validation","test"):
        subset=[r for r in rows if r["split"]==split]
        ds=Images(subset,a.image_root,indexes,train_tf if split=="train" else eval_tf)
        loaders[split]=DataLoader(ds,batch_size=a.batch_size,shuffle=split=="train",num_workers=a.workers,pin_memory=torch.cuda.is_available())
    device=torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}; train={len(loaders['train'].dataset)} validation={len(loaders['validation'].dataset)} test={len(loaders['test'].dataset)}; classes={len(classes)}",flush=True)
    if device.type=="cpu":
        print("WARNING: No GPU detected. Training will be slow; switch Colab runtime to GPU before continuing.",flush=True)
    weights=models.MobileNet_V3_Small_Weights.DEFAULT if a.pretrained else None
    model=models.mobilenet_v3_small(weights=weights)
    model.classifier[3]=nn.Linear(model.classifier[3].in_features,len(classes))
    if a.init_from:
        init=torch.load(a.init_from,map_location="cpu",weights_only=False)
        if init.get("classes") != classes: raise ValueError("Initial model class order differs from manifest")
        model.load_state_dict(init["state_dict"])
        print(f"Initialized weights from {a.init_from}",flush=True)
    if a.freeze_backbone or a.unfreeze_last_blocks:
        for param in model.parameters(): param.requires_grad=False
        for param in model.classifier.parameters(): param.requires_grad=True
        if a.unfreeze_last_blocks:
            for block in list(model.features.children())[-a.unfreeze_last_blocks:]:
                for param in block.parameters(): param.requires_grad=True
            print(f"Fine-tuning final {a.unfreeze_last_blocks} MobileNet feature blocks plus classifier.",flush=True)
        else:
            print("Frozen feature extractor; training final classifier layer only.",flush=True)
    model.to(device); opt=torch.optim.AdamW((p for p in model.parameters() if p.requires_grad),lr=a.learning_rate); loss_fn=nn.CrossEntropyLoss()
    best=-1.; best_state=None; history=[]; start_epoch=1
    checkpoint_path=a.out/"training-checkpoint.pt"
    if a.resume and checkpoint_path.is_file():
        ck=torch.load(checkpoint_path,map_location=device,weights_only=False)
        if ck.get("classes") != classes: raise ValueError("Checkpoint class order differs from current dataset; refusing unsafe resume.")
        model.load_state_dict(ck["state_dict"]); opt.load_state_dict(ck["optimizer"])
        best=float(ck["best_validation_accuracy"]); best_state=ck["best_state"]
        history=ck["history"]; start_epoch=int(ck["epoch"])+1
        print(f"Resuming at epoch {start_epoch} (best validation accuracy={best:.4f})",flush=True)
    for epoch in range(start_epoch,a.epochs+1):
        model.train(); total=0.; seen=0
        for step,(x,y) in enumerate(loaders["train"],1):
            x,y=x.to(device),y.to(device); opt.zero_grad(set_to_none=True)
            loss=loss_fn(model(x),y); loss.backward(); opt.step()
            total+=loss.item()*len(y); seen+=len(y)
            if step % 10 == 0 or step == len(loaders["train"]):
                print(f"Epoch {epoch}/{a.epochs} batch {step}/{len(loaders['train'])} loss={loss.item():.4f}",flush=True)
        yt,yp=predict(model,loaders["validation"],device)
        acc=float(accuracy_score(yt,yp)); macro=float(f1_score(yt,yp,average="macro",zero_division=0))
        history.append({"epoch":epoch,"train_loss":total/max(seen,1),"validation_accuracy":acc,"validation_macro_f1":macro})
        if acc>best:
            best=acc; best_state={k:v.detach().cpu().clone() for k,v in model.state_dict().items()}
        atomic_save({"epoch":epoch,"state_dict":model.state_dict(),"optimizer":opt.state_dict(),"best_validation_accuracy":best,"best_state":best_state,"classes":classes,"history":history},checkpoint_path)
        atomic_save({"state_dict":best_state,"classes":classes,"architecture":"mobilenet_v3_small"},a.out/"best-model.pt")
        print(f"Epoch {epoch}/{a.epochs} complete | train_loss={total/max(seen,1):.4f} | val_accuracy={acc:.4f} | val_macro_f1={macro:.4f} | best={best:.4f} | checkpoint saved",flush=True)
    if best_state is None: raise RuntimeError("No best checkpoint")
    model.load_state_dict(best_state); yt,yp=predict(model,loaders["test"],device)
    metrics={"status":"exploratory_non_independent_baseline" if a.exploratory_non_independent else "trained_and_tested","evaluation_scope":"within-source image-level exploratory holdout; not independent by site/plant/session" if a.exploratory_non_independent else "group-isolated held-out test","architecture":"MobileNetV3-Small","pretrained_imagenet":bool(a.pretrained),"freeze_backbone":bool(a.freeze_backbone),"unfreeze_last_blocks":a.unfreeze_last_blocks,"initialized_from":str(a.init_from) if a.init_from else None,"image_size":a.image_size,"seed":a.seed,"epochs_requested":a.epochs,"epochs_completed":len(history),"best_validation_accuracy":best,"test_accuracy":float(accuracy_score(yt,yp)),"test_macro_f1":float(f1_score(yt,yp,average="macro",zero_division=0)),"classes":classes,"test_classification_report":classification_report(yt,yp,target_names=classes,output_dict=True,zero_division=0),"test_confusion_matrix":confusion_matrix(yt,yp).tolist(),"history":history,"images_per_split":dict(Counter(r["split"] for r in rows)),"groups_per_split":{s:len({r["group_id_for_split"] for r in rows if r["split"]==s}) for s in ("train","validation","test")},"limitations":["Metrics apply only to these source datasets and this split, not Syrian coastal orchards.","Dataset class labels may not be laboratory-confirmed pathogens.","This is a baseline, not a production-validated model."] + (["Exploratory mode bypasses expert-label and near-duplicate review gates; image-level split may leak plant/session/background information and is not independent validation. Do not advertise these metrics as accuracy on unseen farms."] if a.exploratory_non_independent else [])}
    atomic_save({"state_dict":model.state_dict(),"classes":classes,"architecture":"mobilenet_v3_small"},a.out/"best-model.pt")
    (a.out/"metrics.json").write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:metrics[k] for k in ("status","architecture","best_validation_accuracy","test_accuracy","test_macro_f1","images_per_split","groups_per_split")},ensure_ascii=False,indent=2),flush=True)

if __name__=="__main__": main()
