#!/usr/bin/env python3
"""Verify group/hash/source isolation in a CSV manifest.

Example:
  python scripts/research/verify-splits.py results/citrus-field-v3/manifest.csv \
    --group-col tree_id --split-col split --hash-col sha256

A PASS only certifies the columns actually present in the supplied manifest.
It does not prove that the group IDs are biologically correct or that metadata
is complete. Missing required columns or missing group IDs fail closed.
"""
import argparse, csv, json, sys
from collections import defaultdict
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('manifest', type=Path)
    ap.add_argument('--group-col', required=True)
    ap.add_argument('--split-col', default='split')
    ap.add_argument('--hash-col')
    ap.add_argument('--source-col')
    ap.add_argument('--cv-fold-col', help='For out-of-fold CV manifests: verify each group is assigned to only one held-out fold.')
    ap.add_argument('--allow-splits', default='train,val,validation,calibration,test')
    ap.add_argument('--report', type=Path)
    a = ap.parse_args()
    errors=[]; warnings=[]
    if not a.manifest.is_file():
        print(json.dumps({'status':'FAIL','errors':['manifest_not_found']})); return 2
    with a.manifest.open(newline='',encoding='utf-8-sig') as f:
        reader=csv.DictReader(f); rows=list(reader); cols=reader.fieldnames or []
    required=[a.group_col,a.split_col]
    if a.hash_col: required.append(a.hash_col)
    if a.source_col: required.append(a.source_col)
    if a.cv_fold_col: required.append(a.cv_fold_col)
    missing=[c for c in required if c not in cols]
    if missing: errors.append('missing_columns:'+','.join(missing))
    if not rows: errors.append('empty_manifest')
    if errors:
        result={'status':'FAIL','manifest':str(a.manifest),'rows':len(rows),'errors':errors,'warnings':warnings}
    else:
        allowed={x.strip().lower() for x in a.allow_splits.split(',') if x.strip()}
        group_splits=defaultdict(set); hash_splits=defaultdict(set); source_splits=defaultdict(set); cv_group_folds=defaultdict(set)
        missing_groups=0; missing_hashes=0; missing_sources=0
        for i,r in enumerate(rows,2):
            split=(r.get(a.split_col) or '').strip().lower()
            group=(r.get(a.group_col) or '').strip()
            if not split: errors.append(f'row_{i}:missing_split')
            elif split not in allowed: warnings.append(f'row_{i}:unrecognized_split:{split}')
            if not group: missing_groups+=1
            else: group_splits[group].add(split)
            if a.hash_col:
                h=(r.get(a.hash_col) or '').strip().lower()
                if not h: missing_hashes+=1
                else: hash_splits[h].add(split)
            if a.cv_fold_col and group:
                fold=(r.get(a.cv_fold_col) or '').strip()
                if fold: cv_group_folds[group].add(fold)
            if a.source_col:
                s=(r.get(a.source_col) or '').strip()
                if not s: missing_sources+=1
                else: source_splits[s].add(split)
        if missing_groups: errors.append(f'missing_group_ids:{missing_groups}')
        if a.hash_col and missing_hashes: warnings.append(f'missing_hashes:{missing_hashes}')
        if a.source_col and missing_sources: errors.append(f'missing_source_ids:{missing_sources}')
        group_leaks={k:sorted(v) for k,v in group_splits.items() if len(v)>1}
        hash_leaks={k:sorted(v) for k,v in hash_splits.items() if len(v)>1}
        source_leaks={k:sorted(v) for k,v in source_splits.items() if len(v)>1}
        if group_leaks: errors.append(f'group_leakage:{len(group_leaks)}')
        cv_leaks={k:sorted(v) for k,v in cv_group_folds.items() if len(v)>1}
        if cv_leaks: errors.append(f'cv_group_assigned_to_multiple_folds:{len(cv_leaks)}')
        if hash_leaks: errors.append(f'exact_hash_leakage:{len(hash_leaks)}')
        if source_leaks: errors.append(f'source_leakage:{len(source_leaks)}')
        result={'status':'PASS' if not errors else 'FAIL','manifest':str(a.manifest),'rows':len(rows),
                'split_counts':dict(sorted(__import__('collections').Counter((r.get(a.split_col) or '').strip() for r in rows).items())),
                'unique_groups':len(group_splits),'unique_hashes':len(hash_splits) if a.hash_col else None,
                'unique_sources':len(source_splits) if a.source_col else None,
                'group_leakage_count':len(group_leaks),'exact_hash_leakage_count':len(hash_leaks),
                'source_leakage_count':len(source_leaks),'cv_group_fold_conflicts':len(cv_leaks),'errors':errors,'warnings':warnings,
                'scope_note':'PASS covers only supplied manifest fields; it does not validate the biological truth/completeness of group IDs or detect perceptual duplicates unless pre-grouped.'}
    out=json.dumps(result,ensure_ascii=False,indent=2)
    print(out)
    if a.report: a.report.write_text(out+'\n',encoding='utf-8')
    return 0 if result['status']=='PASS' else 2

if __name__=='__main__': sys.exit(main())
