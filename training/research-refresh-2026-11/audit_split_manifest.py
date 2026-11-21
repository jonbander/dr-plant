#!/usr/bin/env python3
"""Fail closed if a dataset manifest leaks groups or exact duplicate files across splits.

CSV columns required: path,label,split,group_id,source_id
group_id should identify the strongest available unit (farm/plot/plant/season).
Run before training; never use a random image-level split as a substitute.
"""
import argparse,csv,hashlib,sys
from collections import defaultdict
from pathlib import Path

def sha256(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""): h.update(chunk)
    return h.hexdigest()

def main():
    p=argparse.ArgumentParser()
    p.add_argument("manifest",help="CSV with path,label,split,group_id,source_id")
    p.add_argument("--root",default=".",help="Root used to resolve relative image paths")
    a=p.parse_args(); root=Path(a.root)
    required={"path","label","split","group_id","source_id"}
    rows=list(csv.DictReader(open(a.manifest,newline="",encoding="utf-8")))
    if not rows: raise SystemExit("FAIL: manifest is empty")
    if not required.issubset(rows[0]): raise SystemExit(f"FAIL: missing columns {sorted(required-set(rows[0]))}")
    errors=[]; groups=defaultdict(set); hashes=defaultdict(set); class_splits=defaultdict(set)
    for i,r in enumerate(rows,2):
        split=r["split"].strip(); path=root/r["path"]
        if split not in {"train","val","test"}: errors.append(f"line {i}: invalid split {split!r}")
        if not r["group_id"].strip(): errors.append(f"line {i}: group_id missing")
        groups[r["group_id"]].add(split); class_splits[r["label"]].add(split)
        if not path.is_file(): errors.append(f"line {i}: file missing: {path}")
        else: hashes[sha256(path)].add(split)
    for group,splits in groups.items():
        if len(splits)>1: errors.append(f"group leakage {group}: {sorted(splits)}")
    for digest,splits in hashes.items():
        if len(splits)>1: errors.append(f"exact duplicate image appears in multiple splits: {digest}")
    for label,splits in class_splits.items():
        if splits!={"train","val","test"}: errors.append(f"class {label!r} missing split(s): {sorted({'train','val','test'}-splits)}")
    if errors:
        print("\n".join("FAIL: "+e for e in errors)); sys.exit(1)
    print(f"PASS: {len(rows)} images; {len(groups)} groups; no cross-split group/hash leakage.")
    print("NOTE: perceptual near-duplicates and cross-source derivatives still require separate review.")

if __name__=="__main__": main()
