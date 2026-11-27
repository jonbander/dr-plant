#!/usr/bin/env python3
"""Research-only grape morphology fusion pilot.

Uses the already-trained five-class grape classifier as the teacher/backbone,
adds explicit edge/texture/leaf-geometry descriptors, and optionally the
recovered French Vitis cultivar-morphology expert probabilities.

IMPORTANT: this run reads only train and validation images. The historical
test split is intentionally untouched because it was already used by the
previous baseline. No production claim is made.
"""
import argparse, csv, json, math, random, hashlib
from pathlib import Path
from collections import Counter
import numpy as np
import torch, joblib
from PIL import Image
from scipy import ndimage
from scipy.spatial import ConvexHull
from torchvision import models, transforms
from torch import nn
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score, classification_report, confusion_matrix

def hog_features(gray):
    gx = ndimage.sobel(gray, axis=1, mode="reflect")
    gy = ndimage.sobel(gray, axis=0, mode="reflect")
    mag = np.hypot(gx, gy)
    ang = np.mod(np.arctan2(gy, gx), np.pi)
    bins = np.floor(ang * (9.0 / np.pi)).astype(np.int32) % 9
    cell = 8
    h, w = gray.shape
    hist = np.zeros((h // cell, w // cell, 9), np.float32)
    for cy in range(h // cell):
        for cx in range(w // cell):
            sl = np.s_[cy*cell:(cy+1)*cell, cx*cell:(cx+1)*cell]
            hist[cy, cx] = np.bincount(bins[sl].ravel(), weights=mag[sl].ravel(), minlength=9)
    out = []
    for y in range(hist.shape[0]-1):
        for x in range(hist.shape[1]-1):
            block = hist[y:y+2, x:x+2].ravel()
            block /= np.sqrt(np.dot(block, block) + 1e-6)
            out.extend(block.tolist())
    return np.asarray(out, np.float32)

def lbp_features(gray):
    c = gray[1:-1, 1:-1]
    neighbors = [gray[:-2, :-2], gray[:-2, 1:-1], gray[:-2, 2:],
                 gray[1:-1, 2:], gray[2:, 2:], gray[2:, 1:-1],
                 gray[2:, :-2], gray[1:-1, :-2]]
    code = np.zeros(c.shape, np.uint8)
    for i, n in enumerate(neighbors):
        code |= ((n >= c).astype(np.uint8) << i)
    hist = np.bincount(code.ravel(), minlength=256).astype(np.float32)
    return hist / max(hist.sum(), 1.0)

def shape_features(rgb):
    # Estimate foreground against border colour and green/saturated leaf pixels.
    # This is a weak unsupervised mask: mask-quality statistics are retained.
    a = rgb.astype(np.float32) / 255.0
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]], axis=0)
    bg = np.median(border, axis=0)
    dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = mx - mn
    r, g, b = a[:,:,0], a[:,:,1], a[:,:,2]
    greenish = (g > r * 0.82) & (g > b * 0.78) & (g-r > -0.015)
    mask = (dist > 0.12) & ((sat > 0.075) | greenish)
    mask = ndimage.binary_closing(mask, iterations=2)
    mask = ndimage.binary_opening(mask, iterations=1)
    labels, n = ndimage.label(mask)
    if n:
        counts = np.bincount(labels.ravel()); counts[0] = 0
        mask = labels == int(counts.argmax())
    coverage = float(mask.mean())
    if coverage < 0.025 or coverage > 0.92:
        mask = (sat > 0.11) & (dist > 0.08)
        labels, n = ndimage.label(ndimage.binary_closing(mask, iterations=1))
        if n:
            counts = np.bincount(labels.ravel()); counts[0] = 0
            mask = labels == int(counts.argmax())
    yy, xx = np.where(mask)
    area = float(len(xx))
    h, w = mask.shape
    if area < 8:
        return np.asarray([coverage, 0,0,0,0,0,0,0,0,0,0,0,0,0], np.float32)
    y0,y1,x0,x1 = yy.min(),yy.max()+1,xx.min(),xx.max()+1
    bbox_area = float((y1-y0)*(x1-x0))
    perimeter = float(np.logical_xor(mask, ndimage.binary_erosion(mask)).sum())
    coords = np.column_stack([xx, yy])
    eig = np.linalg.eigvalsh(np.cov(coords.T)) if len(coords) > 2 else np.array([0.,0.])
    ecc = float(np.sqrt(max(0., 1 - eig[0]/max(eig[1],1e-6)))) if eig[1] > 0 else 0.
    hull_area = area
    try:
        hull_area = float(ConvexHull(coords).volume) if len(coords) >= 4 else area
    except Exception:
        pass
    solidity = min(1.0, area/max(hull_area,1.0))
    circularity = min(1.0, 4*np.pi*area/max(perimeter*perimeter,1.0))
    # Distribution of foreground along rows and columns captures lobing/irregularity.
    row = mask.sum(axis=1).astype(np.float32); col = mask.sum(axis=0).astype(np.float32)
    row = row / max(row.sum(),1); col = col / max(col.sum(),1)
    row_entropy = float(-(row[row>0]*np.log(row[row>0])).sum()/np.log(h))
    col_entropy = float(-(col[col>0]*np.log(col[col>0])).sum()/np.log(w))
    boundary = mask & ~ndimage.binary_erosion(mask)
    edge_density = float(boundary.sum()/max(area,1))
    filled = ndimage.binary_fill_holes(mask)
    hole_ratio = float((filled.sum()-mask.sum())/max(area,1))
    return np.asarray([
        coverage, area/(h*w), (y1-y0)/h, (x1-x0)/w,
        (x1-x0)/max(y1-y0,1), bbox_area/max(area,1),
        perimeter/np.sqrt(max(area,1)), circularity, solidity, ecc,
        row_entropy, col_entropy, edge_density, hole_ratio
    ], np.float32)

def handcrafted(path):
    with Image.open(path) as im:
        im = im.convert("RGB").resize((64,64), Image.Resampling.BILINEAR)
        rgb = np.asarray(im)
    gray = (0.299*rgb[:,:,0] + 0.587*rgb[:,:,1] + 0.114*rgb[:,:,2]).astype(np.float32)/255
    hog = hog_features(gray)
    lbp = lbp_features(gray)
    shp = shape_features(rgb)
    # Small HSV histogram is a separate ablation, never the only evidence.
    hsv = np.asarray(Image.fromarray(rgb).convert("HSV"), dtype=np.uint8)
    hhist = np.histogram(hsv[:,:,0], bins=12, range=(0,256))[0].astype(np.float32)
    shist = np.histogram(hsv[:,:,1], bins=8, range=(0,256))[0].astype(np.float32)
    vhist = np.histogram(hsv[:,:,2], bins=8, range=(0,256))[0].astype(np.float32)
    color = np.concatenate([hhist,shist,vhist]); color /= max(color.sum(),1)
    return hog, lbp, shp, color

def load_rows(manifest, image_root):
    with manifest.open(newline="", encoding="utf-8-sig") as f:
        all_rows = list(csv.DictReader(f))
    rows = [r for r in all_rows if r["split"] in ("train","val","validation")]
    for r in rows:
        p = image_root / r["processed_path"]
        if not p.is_file():
            raise FileNotFoundError(p)
        r["_path"] = str(p)
        if r["split"] == "val": r["split"] = "validation"
    groups = {s:{r["group_id"] for r in rows if r["split"]==s} for s in ("train","validation")}
    if groups["train"] & groups["validation"]:
        raise RuntimeError("near-duplicate group leakage between train and validation")
    classes = sorted({r["class_label"].replace(" ","_") for r in rows})
    for split in ("train","validation"):
        if {r["class_label"].replace(" ","_") for r in rows if r["split"]==split} != set(classes):
            raise RuntimeError(f"Class missing from {split}")
    return rows, classes

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from training_gate_guard import extract_training_gate_args, enforce_training_gate

def main():
    gate_args=extract_training_gate_args()
    p=argparse.ArgumentParser()
    p.add_argument("--dataset-root",type=Path,required=True)
    p.add_argument("--manifest",type=Path,required=True)
    p.add_argument("--disease-checkpoint",type=Path,required=True)
    p.add_argument("--vitis-weights",type=Path,required=True)
    p.add_argument("--vitis-classifier",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    p.add_argument("--batch-size",type=int,default=16)
    p.add_argument("--threads",type=int,default=4)
    a=p.parse_args();enforce_training_gate(gate_args)
    random.seed(42); np.random.seed(42); torch.manual_seed(42)
    torch.set_num_threads(a.threads)
    device=torch.device("cpu")  # box currently has no CUDA device
    rows, classes=load_rows(a.manifest,a.dataset_root)
    labels={c:i for i,c in enumerate(classes)}
    # Existing grape disease checkpoint is reused intact as the deep feature teacher.
    dck=torch.load(a.disease_checkpoint,map_location="cpu",weights_only=True)
    disease=models.mobilenet_v3_small(weights=None)
    disease.classifier[3]=nn.Linear(disease.classifier[3].in_features,len(dck["classes"]))
    disease.load_state_dict(dck["model"])
    disease.eval()
    dback=nn.Sequential(disease.features,disease.avgpool,nn.Flatten(1)).eval()
    dtransform=transforms.Compose([transforms.Resize((160,160)),transforms.ToTensor(),transforms.Normalize([.485,.456,.406],[.229,.224,.225])])
    # Recovered French Vitis morphology expert: controlled-image cultivar signal only.
    vnet=models.mobilenet_v3_small(weights=None)
    vnet.load_state_dict(torch.load(a.vitis_weights,map_location="cpu",weights_only=True))
    vback=nn.Sequential(vnet.features,vnet.avgpool,nn.Flatten(1)).eval()
    vtransform=transforms.Compose([transforms.Resize((224,224)),transforms.ToTensor(),transforms.Normalize([.485,.456,.406],[.229,.224,.225])])
    vitis=joblib.load(a.vitis_classifier)
    hogs=[]; lbps=[]; shapes=[]; colors=[]; deep=[]; vitis_probs=[]; original_logits=[]; ys=[]; splits=[]; paths=[]
    with torch.no_grad():
        for start in range(0,len(rows),a.batch_size):
            batch=rows[start:start+a.batch_size]
            dimgs=[]; vimgs=[]
            for r in batch:
                with Image.open(r["_path"]) as im:
                    rgb=im.convert("RGB")
                    dimgs.append(dtransform(rgb))
                    vimgs.append(vtransform(rgb))
                h,l,s,c=handcrafted(Path(r["_path"]))
                hogs.append(h); lbps.append(l); shapes.append(s); colors.append(c)
                paths.append(r["processed_path"]); ys.append(labels[r["class_label"].replace(" ","_")]); splits.append(r["split"])
            dx=torch.stack(dimgs); vx=torch.stack(vimgs)
            dfeat=dback(dx)
            logits=disease.classifier(dfeat)
            vf=(vback(vx)+vback(torch.flip(vx,dims=[3])))/2
            vp=vitis["pipeline"].predict_proba(vf.numpy())
            deep.extend(dfeat.numpy()); original_logits.extend(logits.numpy()); vitis_probs.extend(vp)
            print(f"features {min(start+len(batch),len(rows))}/{len(rows)}",flush=True)
    deep=np.asarray(deep,np.float32); logits=np.asarray(original_logits,np.float32)
    hogs=np.asarray(hogs,np.float32); lbps=np.asarray(lbps,np.float32); shapes=np.asarray(shapes,np.float32); colors=np.asarray(colors,np.float32); vitis_probs=np.asarray(vitis_probs,np.float32)
    y=np.asarray(ys); splits=np.asarray(splits)
    tr=np.where(splits=="train")[0]; va=np.where(splits=="validation")[0]
    # Direct teacher baseline on validation; test split is never loaded.
    direct=np.argmax(logits[va],axis=1)
    reports={"task":"research-only French grape leaf morphology-aware disease feature-fusion pilot",
             "status":"research_only_not_expert_confirmed_not_syria_validated",
             "dataset":{"source":"Mendeley Data 10.17632/378c69nwk5.1","license":"CC BY 4.0","raw_unique_images":2574,
                        "used_train":int(len(tr)),"used_validation":int(len(va)),"test_images_loaded":0,
                        "classes":classes,"split":"existing pHash connected-component grouped split; no site/plant/session IDs"},
             "teacher":{"checkpoint":str(a.disease_checkpoint),"epoch":dck.get("epoch"),"class_order":dck.get("classes"),
                        "sha256":hashlib.sha256(a.disease_checkpoint.read_bytes()).hexdigest()},
             "french_morphology_expert":{"task":"cultivar similarity only; not disease diagnosis","classes":vitis["classes"],
                        "source_status":vitis.get("status"),"weights_sha256":hashlib.sha256(a.vitis_weights.read_bytes()).hexdigest()},
             "validation_only_comparison":{}}
    def score(name, X):
        pipe=make_pipeline(StandardScaler(),LogisticRegression(C=0.1,max_iter=3000,class_weight="balanced",solver="lbfgs"))
        pipe.fit(X[tr],y[tr]); pred=pipe.predict(X[va])
        return pipe,{"accuracy":float(accuracy_score(y[va],pred)),
                     "balanced_accuracy":float(balanced_accuracy_score(y[va],pred)),
                     "macro_f1":float(f1_score(y[va],pred,average="macro",zero_division=0)),
                     "per_class":classification_report(y[va],pred,target_names=classes,output_dict=True,zero_division=0),
                     "confusion_matrix":confusion_matrix(y[va],pred).tolist()}
    reports["validation_only_comparison"]["existing_finetuned_grape_model"]={
        "accuracy":float(accuracy_score(y[va],direct)),
        "balanced_accuracy":float(balanced_accuracy_score(y[va],direct)),
        "macro_f1":float(f1_score(y[va],direct,average="macro",zero_division=0)),
        "per_class":classification_report(y[va],direct,target_names=classes,output_dict=True,zero_division=0),
        "confusion_matrix":confusion_matrix(y[va],direct).tolist()}
    experiments=[
        ("deep_embedding_linear_probe",deep),
        ("deep_plus_hog_edges_lbp_texture_shape",np.concatenate([deep,hogs,lbps,shapes],axis=1)),
        ("deep_plus_morphology_expert_probabilities",np.concatenate([deep,hogs,lbps,shapes,vitis_probs],axis=1)),
        ("deep_plus_morphology_and_color_ablation",np.concatenate([deep,hogs,lbps,shapes,vitis_probs,colors],axis=1))]
    fitted={}
    for name,X in experiments:
        pipe,metrics=score(name,X); fitted[name]=pipe
        reports["validation_only_comparison"][name]=metrics
        print(name,json.dumps({k:metrics[k] for k in ("accuracy","balanced_accuracy","macro_f1")}),flush=True)
    best=max(experiments,key=lambda z:reports["validation_only_comparison"][z[0]]["macro_f1"])[0]
    a.out.mkdir(parents=True,exist_ok=True)
    # Keep all ablations; validation selects the research candidate only.
    joblib.dump({"pipeline":fitted[best],"feature_order":best,"classes":classes,
                 "status":"research_only_not_expert_confirmed_not_syria_validated",
                 "feature_schema":{"deep":int(deep.shape[1]),"hog":int(hogs.shape[1]),"lbp":int(lbps.shape[1]),
                                   "shape":int(shapes.shape[1]),"vitis_morphology_probabilities":int(vitis_probs.shape[1]),
                                   "color":int(colors.shape[1])}},a.out/"best-validation-candidate.joblib")
    for name,pipe in fitted.items(): joblib.dump(pipe,a.out/f"{name}.joblib")
    reports["selected_by_validation_macro_f1"]=best
    reports["feature_dimensions"]={"deep":int(deep.shape[1]),"hog":int(hogs.shape[1]),"lbp":int(lbps.shape[1]),
                                    "shape":int(shapes.shape[1]),"vitis_morphology_probabilities":int(vitis_probs.shape[1]),
                                    "color":int(colors.shape[1])}
    reports["interpretation_limits"]=[
        "Validation split is grouped only by perceptual near-duplicate components, not by plant/farm/session.",
        "The source labels are inherited from folders and have not been independently confirmed by a plant pathologist.",
        "The French Vitis morphology expert was trained on controlled light-box cultivar images; its probabilities are exploratory features under strong domain shift.",
        "Shape masks are weak unsupervised estimates, not human-annotated leaf segmentation.",
        "The historical test split was deliberately not loaded or evaluated in this run.",
        "No model is promoted to production and no pesticide/treatment advice may be generated from this model."
    ]
    (a.out/"metrics-validation-only.json").write_text(json.dumps(reports,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    np.savez_compressed(a.out/"feature-cache.npz",deep=deep,hog=hogs,lbp=lbps,shape=shapes,color=colors,
                        vitis_morphology_probabilities=vitis_probs,labels=y,splits=splits,paths=np.asarray(paths))
    print("FINAL",json.dumps({"best":best,"validation":{k:{m:reports["validation_only_comparison"][k][m] for m in ("accuracy","balanced_accuracy","macro_f1")} for k,_ in experiments},"teacher_validation":reports["validation_only_comparison"]["existing_finetuned_grape_model"]},ensure_ascii=False),flush=True)

if __name__=="__main__": main()
