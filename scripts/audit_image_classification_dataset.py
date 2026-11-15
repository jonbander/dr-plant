#!/usr/bin/env python3
"""Audit class-folder image archives; never invent provenance or review status."""
from __future__ import annotations
import argparse, csv, hashlib, json
from collections import Counter, defaultdict
from pathlib import Path

EXTS={".jpg",".jpeg",".png",".webp",".bmp",".tif",".tiff"}
FIELDS=["relative_path","sha256","class_label","source_dataset_id","source_version","source_license","provenance_verified","expert_label_review","near_duplicate_review","group_id_for_split"]

def digest(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""): h.update(chunk)
    return h.hexdigest()

def audit(root,dataset_id,version,license_name,verify_images=False):
    if not root.is_dir(): raise ValueError(f"Dataset root not found: {root}")
    Image=None
    if verify_images:
        try: from PIL import Image
        except ImportError as exc: raise ValueError("Install Pillow to use --verify-images") from exc
    rows=[]; counts=Counter(); hashes=defaultdict(list); unreadable=[]; ignored=[]
    for folder in sorted(p for p in root.iterdir() if p.is_dir() and not p.is_symlink()):
        for path in sorted(folder.rglob("*")):
            if path.is_symlink() or not path.is_file(): continue
            if path.suffix.lower() not in EXTS:
                ignored.append(path.relative_to(root).as_posix()); continue
            rel=path.relative_to(root).as_posix(); sha=digest(path); hashes[sha].append(rel)
            if verify_images:
                try:
                    with Image.open(path) as im: im.verify()
                except Exception: unreadable.append(rel)
            rows.append({"relative_path":rel,"sha256":sha,"class_label":folder.name,"source_dataset_id":dataset_id,"source_version":version,"source_license":license_name,"provenance_verified":"no","expert_label_review":"no","near_duplicate_review":"no","group_id_for_split":""})
            counts[folder.name]+=1
    dup={k:v for k,v in hashes.items() if len(v)>1}
    report={"status":"archive_inventory_created_review_required","dataset_root":str(root),"dataset_id":dataset_id,"dataset_version":version,"license_claim_from_argument":license_name,"image_count":len(rows),"class_image_counts":dict(sorted(counts.items())),"unique_sha256_count":len(hashes),"exact_duplicate_groups":len(dup),"exact_duplicate_files":sum(map(len,dup.values())),"unreadable_images":unreadable,"ignored_non_image_files":ignored,"manifest":"image-manifest.csv","review_required":["Verify exact archive/version and required attribution.","Verify file-level provenance and reuse terms; landing-page license alone is not a per-image provenance audit.","Have labels reviewed by a qualified plant-health reviewer.","Review near-duplicates perceptually; SHA-256 detects byte-identical files only.","Populate group_id_for_split from verified site/plant/session metadata; never infer groups from filenames.","Do not split/train until all review flags are yes and every class has at least three independent groups."],"model_trained":False}
    return rows,report

def main():
    p=argparse.ArgumentParser(description=__doc__); p.add_argument("dataset_root",type=Path); p.add_argument("--dataset-id",required=True); p.add_argument("--version",required=True); p.add_argument("--license",required=True,dest="license_name"); p.add_argument("--out",required=True,type=Path); p.add_argument("--verify-images",action="store_true"); a=p.parse_args()
    rows,report=audit(a.dataset_root,a.dataset_id,a.version,a.license_name,a.verify_images); a.out.mkdir(parents=True,exist_ok=True)
    with (a.out/"image-manifest.csv").open("w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=FIELDS); w.writeheader(); w.writerows(rows)
    (a.out/"archive-audit-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8"); print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=="__main__": main()
