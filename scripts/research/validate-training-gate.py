#!/usr/bin/env python3
"""Fail-closed Phase 0 data gate for a dataset-specific Dr.Plant training profile."""
import argparse, csv, hashlib, json, shutil, subprocess, sys
from collections import defaultdict
from pathlib import Path

class GateFailure(Exception):
    pass

def read_json(path):
    try: return json.loads(path.read_text(encoding='utf-8'))
    except Exception as exc: raise GateFailure(f'invalid_json:{path}:{exc}')

def resolve(base, value):
    p = (base / value).resolve()
    try: p.relative_to(base.resolve())
    except ValueError: raise GateFailure(f'path_escapes_profile_directory:{value}')
    return p

def verify_signature(file_path, sig_path, public_key):
    if not all(p.is_file() for p in (file_path, sig_path, public_key)):
        raise GateFailure(f'signature_inputs_missing:{file_path.name}')
    if not shutil.which('openssl'):
        raise GateFailure('openssl_required_for_ed25519_signature_verification')
    proc = subprocess.run(['openssl','pkeyutl','-verify','-pubin','-inkey',str(public_key),'-sigfile',str(sig_path),'-rawin','-in',str(file_path)],capture_output=True,text=True)
    if proc.returncode != 0:
        raise GateFailure(f'signature_invalid:{file_path.name}:{(proc.stderr or proc.stdout).strip()}')

def verify_delivery(root, manifest_path):
    m = read_json(manifest_path)
    if m.get('hash_scope') != 'extracted_file_bytes': raise GateFailure('delivery_manifest_hash_scope_must_be_extracted_file_bytes')
    for k in ('dataset_id','dataset_version','delivery_id'):
        if not str(m.get(k,'')).strip(): raise GateFailure(f'delivery_manifest_missing:{k}')
    entries = m.get('files')
    if not isinstance(entries,list) or not entries: raise GateFailure('delivery_manifest_files_empty')
    declared=set(); total=0
    for item in entries:
        rel=str(item.get('path','')).strip()
        if not rel or rel in declared: raise GateFailure(f'duplicate_or_empty_manifest_path:{rel}')
        declared.add(rel)
        p=(root / rel).resolve()
        try: p.relative_to(root.resolve())
        except ValueError: raise GateFailure(f'asset_path_escapes_root:{rel}')
        if not p.is_file(): raise GateFailure(f'asset_missing:{rel}')
        size=p.stat().st_size
        if not isinstance(item.get('bytes'),int) or item['bytes'] != size: raise GateFailure(f'asset_size_mismatch:{rel}')
        expected=str(item.get('sha256','')).lower()
        if len(expected)!=64 or any(c not in '0123456789abcdef' for c in expected): raise GateFailure(f'asset_sha256_invalid:{rel}')
        h=hashlib.sha256(p.read_bytes()).hexdigest()
        if h != expected: raise GateFailure(f'asset_sha256_mismatch:{rel}')
        if not isinstance(item.get('record_count'),int) or item['record_count'] < 0: raise GateFailure(f'asset_record_count_invalid:{rel}')
        suffix=p.suffix.lower()
        if suffix == '.csv':
            with p.open(newline='',encoding='utf-8-sig') as f: actual_records=max(0,sum(1 for _ in csv.reader(f))-1)
        elif suffix == '.json':
            payload=json.loads(p.read_text(encoding='utf-8'))
            actual_records=len(payload) if isinstance(payload,list) else (len(payload.get('records',[])) if isinstance(payload,dict) and isinstance(payload.get('records'),list) else 1)
        else: actual_records=1
        if item['record_count'] != actual_records: raise GateFailure(f'asset_record_count_mismatch:{rel}:expected={item["record_count"]}:actual={actual_records}')
        total += 1
    archive=m.get('archive')
    archive_rel=None
    if archive:
        archive_rel=str(archive.get('path','')).strip()
        if not archive_rel: raise GateFailure('archive_path_missing')
        ap=(root/archive_rel).resolve()
        try: ap.relative_to(root.resolve())
        except ValueError: raise GateFailure('archive_path_escapes_root')
        if not ap.is_file(): raise GateFailure('compressed_archive_missing')
        if ap.stat().st_size != archive.get('bytes'): raise GateFailure('compressed_archive_size_mismatch')
        if hashlib.sha256(ap.read_bytes()).hexdigest() != str(archive.get('sha256','')).lower(): raise GateFailure('compressed_archive_sha256_mismatch')
    actual={str(p.relative_to(root)) for p in root.rglob('*') if p.is_file() and p != manifest_path and str(p.relative_to(root)) != archive_rel}
    # Signatures and profile files must be outside the payload root; the root contains payload files only.
    extra=actual-declared
    missing=declared-actual
    if extra: raise GateFailure('unlisted_assets:'+','.join(sorted(extra)[:10]))
    if missing: raise GateFailure('manifest_entries_missing:'+','.join(sorted(missing)[:10]))
    return {'files_verified':total,'dataset_id':m['dataset_id'],'dataset_version':m['dataset_version'],'delivery_id':m['delivery_id']}

def verify_dataset_profile(profile):
    d=read_json(profile)
    required=('spdx_version','dataset_id','dataset_version','source_url','provider','license_expression','license_status','research_training_use','commercial_use','redistribution','model_weight_distribution','attribution','collection_method','processing_method','human_review')
    for k in required:
        if k not in d or d[k] in (None,'',[]): raise GateFailure(f'dataset_profile_missing:{k}')
    if d['license_status'] != 'verified': raise GateFailure('dataset_license_not_verified')
    if d['research_training_use'] != 'allowed': raise GateFailure('research_training_use_not_allowed')
    if d['commercial_use'] not in ('allowed','prohibited'): raise GateFailure('commercial_use_must_be_explicit')
    if d['redistribution'] not in ('allowed','prohibited','restricted','unknown'): raise GateFailure('redistribution_must_be_explicit')
    if d['model_weight_distribution'] not in ('allowed','prohibited','restricted','unknown'): raise GateFailure('model_weight_distribution_must_be_explicit')
    h=d['human_review']
    for k in ('reviewer_id','reviewer_role','review_date','decision'):
        if not str(h.get(k,'')).strip(): raise GateFailure(f'human_license_review_missing:{k}')
    if h['decision'] != 'approved_for_declared_scope': raise GateFailure('human_license_review_not_approved_for_scope')
    return {'license_expression':d['license_expression'],'research_training_use':d['research_training_use'],'commercial_use':d['commercial_use'],'redistribution':d['redistribution'],'model_weight_distribution':d['model_weight_distribution'],'reviewer_role':h['reviewer_role']}

def verify_splits(path, near_path, image_root):
    with path.open(newline='',encoding='utf-8-sig') as f:
        reader=csv.DictReader(f); rows=list(reader); cols=reader.fieldnames or []
    req={'image_path','group_id','split','sha256','phash','near_duplicate_group_id','source_class'}
    if not rows or not req.issubset(cols): raise GateFailure('split_manifest_empty_or_missing_columns:'+','.join(sorted(req-set(cols))))
    groups=defaultdict(set); hashes=defaultdict(set); hash_counts=defaultdict(int); dup_groups=defaultdict(set)
    for i,r in enumerate(rows,2):
        split=r['split'].strip().lower(); group=r['group_id'].strip(); sha=r['sha256'].strip().lower(); near=r['near_duplicate_group_id'].strip()
        if split not in ('train','val','validation','calibration','test'): raise GateFailure(f'invalid_split_row_{i}')
        if not group: raise GateFailure(f'missing_biological_group_row_{i}')
        if len(sha)!=64 or any(c not in '0123456789abcdef' for c in sha): raise GateFailure(f'invalid_sha256_row_{i}')
        ph=r['phash'].strip().lower()
        if len(ph)!=16 or any(c not in '0123456789abcdef' for c in ph): raise GateFailure(f'invalid_64bit_dct_phash_row_{i}')
        if not r['near_duplicate_group_id'].strip(): raise GateFailure(f'missing_near_duplicate_group_row_{i}')
        if not r['source_class'].strip(): raise GateFailure(f'missing_source_class_row_{i}')
        image=(image_root/r['image_path']).resolve()
        try: image.relative_to(image_root.resolve())
        except ValueError: raise GateFailure(f'split_image_path_escapes_root_row_{i}')
        if not image.is_file(): raise GateFailure(f'split_image_missing_row_{i}:{r["image_path"]}')
        if hashlib.sha256(image.read_bytes()).hexdigest()!=sha: raise GateFailure(f'split_image_sha256_mismatch_row_{i}')
        groups[group].add(split); hashes[sha].add(split); hash_counts[sha]+=1
        if near: dup_groups[near].add(split)
    if any(len(v)>1 for v in groups.values()): raise GateFailure('biological_group_cross_split')
    if any(len(v)>1 for v in hashes.values()): raise GateFailure('exact_sha256_cross_split')
    if any(n>1 for n in hash_counts.values()): raise GateFailure('exact_duplicate_images_must_be_deduplicated')
    if any(len(v)>1 for v in dup_groups.values()): raise GateFailure('near_duplicate_group_cross_split')
    near=read_json(near_path)
    split_hash=hashlib.sha256(path.read_bytes()).hexdigest()
    if near.get('audited_manifest_sha256') != split_hash: raise GateFailure('near_duplicate_audit_manifest_hash_mismatch')
    pairs=int(near.get('near_duplicate_pairs',0))
    if pairs and (near.get('reviewed_pairs')!=pairs or not str(near.get('review_resolution_ref','')).strip()): raise GateFailure('near_duplicate_pairs_not_fully_reviewed')
    if near.get('status') != 'PASS' or near.get('cross_split_pairs') != 0 or near.get('unresolved_pairs',0) != 0 or not near.get('algorithm') or not near.get('implementation') or not isinstance(near.get('threshold_hamming'),int):
        raise GateFailure('near_duplicate_audit_not_pass_or_incomplete')
    return {'rows':len(rows),'unique_groups':len(groups),'splits':sorted({r['split'].strip().lower() for r in rows}),'near_duplicate_algorithm':near['algorithm']}

def verify_taxonomy(path):
    t=read_json(path); classes=t.get('classes')
    if not isinstance(classes,list) or not classes: raise GateFailure('taxonomy_classes_empty')
    seen=set()
    for c in classes:
        name=str(c.get('source_class','')).strip()
        if not name or name in seen: raise GateFailure('taxonomy_class_empty_or_duplicate')
        seen.add(name)
        status=c.get('decision')
        if status=='MAP_EPPO':
            if not str(c.get('eppo_code','')).strip() or not str(c.get('eppo_rank','')).strip() or not str(c.get('eppo_reference_url','')).strip() or c.get('eppo_validation_status')!='verified' or not str(c.get('reviewer','')).strip() or not str(c.get('review_date','')).strip():
                raise GateFailure(f'eppo_mapping_incomplete:{name}')
        elif status=='MAP_NON_DISEASE':
            if c.get('category') not in ('symptom','healthy_state','cultivar','nutrient_state','phenology','general_condition','abiotic_stress','pest_group') or not str(c.get('rationale','')).strip() or c.get('eppo_validation_status')!='verified' or not str(c.get('reviewer','')).strip() or not str(c.get('review_date','')).strip():
                raise GateFailure(f'non_disease_mapping_incomplete:{name}')
        elif status=='EXCLUDE':
            if not str(c.get('exclusion_reason','')).strip() or not str(c.get('category','')).strip():
                raise GateFailure(f'taxonomy_exclusion_incomplete:{name}')
        else: raise GateFailure(f'taxonomy_decision_invalid:{name}')
    return {'classes_reviewed':len(classes),'eppo_mapped':sum(c['decision']=='MAP_EPPO' for c in classes),'non_disease_mapped':sum(c['decision']=='MAP_NON_DISEASE' for c in classes),'excluded_with_reason':sum(c['decision']=='EXCLUDE' for c in classes),'class_names':sorted(seen),'trainable_classes':sorted(c['source_class'] for c in classes if c['decision'] in ('MAP_EPPO','MAP_NON_DISEASE'))}

def verify_masks(path, tasks):
    if not any(t in tasks for t in ('segmentation','mask_derived_shape')): return {'required':False,'status':'NOT_REQUIRED_FOR_TASK_SCOPE'}
    if not path or not path.is_file(): raise GateFailure('gold_mask_audit_required_for_task_scope')
    m=read_json(path)
    expected='lesion_mask' if 'segmentation' in tasks else 'leaf_mask'
    if m.get('status')!='PASS' or m.get('mask_type')!=expected:
        raise GateFailure(f'gold_mask_audit_not_pass_or_expected_{expected}')
    if m.get('independent_reviewers',0)<2 or m.get('reviewed_images',0)<1 or m.get('double_reviewed_images')!=m.get('reviewed_images') or m.get('minimum_images',0)<1 or m.get('reviewed_images',0)<m.get('minimum_images',0):
        raise GateFailure('gold_mask_double_review_missing')
    reviewers=m.get('reviewer_records',[])
    if len(reviewers)<2 or any(not all(str(r.get(k,'')).strip() for k in ('reviewer_id','reviewer_role','review_date')) for r in reviewers): raise GateFailure('gold_mask_reviewer_records_incomplete')
    metrics=m.get('agreement_metrics') or {}; thresholds=m.get('acceptance_thresholds') or {}
    required_metrics={'mean_pairwise_iou','mean_pairwise_dice','boundary_f1'}
    if not required_metrics.issubset(metrics) or not required_metrics.issubset(thresholds) or not m.get('conflict_resolution'): raise GateFailure('gold_mask_iou_dice_boundary_thresholds_or_resolution_missing')
    for metric, threshold in thresholds.items():
        observed=metrics.get(metric)
        if not isinstance(observed,(int,float)): raise GateFailure(f'gold_mask_metric_missing:{metric}')
        if isinstance(threshold,dict):
            if 'min' in threshold and observed < threshold['min']: raise GateFailure(f'gold_mask_metric_below_threshold:{metric}')
            if 'max' in threshold and observed > threshold['max']: raise GateFailure(f'gold_mask_metric_above_threshold:{metric}')
        elif observed < threshold: raise GateFailure(f'gold_mask_metric_below_threshold:{metric}')
    if int(m['conflict_resolution'].get('unresolved_cases',-1)) != 0 or not str(m['conflict_resolution'].get('method','')).strip(): raise GateFailure('gold_mask_conflicts_unresolved_or_method_missing')
    return {'required':True,'status':'PASS','mask_type':m['mask_type'],'reviewed_images':m['reviewed_images'],'independent_reviewers':m['independent_reviewers']}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--profile',required=True,type=Path)
    ap.add_argument('--data-root',required=True,type=Path)
    ap.add_argument('--report',type=Path)
    ap.add_argument('--trusted-public-key',required=True,type=Path,help='Trusted Ed25519 public key supplied by protected CI configuration, never by the dataset package.')
    ap.add_argument('--profile-signature',required=True,type=Path,help='Detached Ed25519 signature for the profile itself.')
    a=ap.parse_args(); result={'status':'NO-GO','research_training_allowed':False,'hybrid_adoption_allowed':False,'gates':{},'errors':[]}
    try:
        profile=a.profile.resolve(); base=profile.parent; root=a.data_root.resolve()
        verify_signature(profile,a.profile_signature.resolve(),a.trusted_public_key.resolve())
        cfg=read_json(profile)
        result['gates']['profile_signature']='PASS'
        if cfg.get('schema_version')!=1: raise GateFailure('unsupported_profile_schema_version')
        tasks=cfg.get('task_scope') or []
        if not tasks: raise GateFailure('task_scope_empty')
        grouping=cfg.get('grouping_unit')
        if grouping not in ('vineyard_or_block','tree','source_site_acquisition','source'):
            raise GateFailure('grouping_unit_must_be_biologically_or_operationally_justified')
        def rp(k):
            v=cfg.get(k)
            if not v: return None
            return resolve(base,v)
        manifest=rp('delivery_manifest'); sig=rp('delivery_signature'); pub=a.trusted_public_key.resolve()
        dp=rp('dataset_profile'); dsig=rp('dataset_profile_signature')
        split_path=rp('split_manifest'); split_sig=rp('split_manifest_signature')
        near_path=rp('near_duplicate_audit'); near_sig=rp('near_duplicate_audit_signature')
        tax_path=rp('taxonomy_map'); tax_sig=rp('taxonomy_map_signature')
        for f in (manifest,sig,pub,dp,dsig,split_path,split_sig,near_path,near_sig,tax_path,tax_sig):
            if f is None or not f.is_file(): raise GateFailure('required_profile_evidence_missing')
        verify_signature(manifest,sig,pub); result['gates']['delivery_signature']='PASS'
        if cfg.get('dataset_id') != read_json(manifest).get('dataset_id'): raise GateFailure('profile_dataset_id_mismatch')
        result['gates']['assets']=verify_delivery(root,manifest)
        verify_signature(dp,dsig,pub); result['gates']['license_signature']='PASS'
        verify_signature(split_path,split_sig,pub); result['gates']['split_manifest_signature']='PASS'
        verify_signature(near_path,near_sig,pub); result['gates']['near_duplicate_audit_signature']='PASS'
        verify_signature(tax_path,tax_sig,pub); result['gates']['taxonomy_signature']='PASS'
        license_result=verify_dataset_profile(dp)
        dm=read_json(manifest); dp_data=read_json(dp)
        if dm.get('dataset_id') != dp_data.get('dataset_id'): raise GateFailure('dataset_id_mismatch_between_delivery_and_spdx_profile')
        if dm.get('dataset_version') != dp_data.get('dataset_version'): raise GateFailure('dataset_version_mismatch_between_delivery_and_spdx_profile')
        result['gates']['license']=license_result
        result['gates']['split']=verify_splits(split_path,near_path,root)
        near_data=read_json(near_path)
        if int(near_data.get('near_duplicate_pairs',0))>0:
            review_ref=resolve(near_path.parent,near_data.get('review_resolution_ref',''))
            review_sig=resolve(near_path.parent,near_data.get('review_resolution_signature',''))
            verify_signature(review_ref,review_sig,pub)
            result['gates']['near_duplicate_human_resolution_signature']='PASS'
        result['gates']['split']['grouping_unit']=grouping
        tax=verify_taxonomy(tax_path)
        with split_path.open(newline='',encoding='utf-8-sig') as f: split_labels={r['source_class'].strip() for r in csv.DictReader(f)}
        unmapped=split_labels-set(tax['class_names'])
        if unmapped: raise GateFailure('training_classes_missing_from_taxonomy:'+','.join(sorted(unmapped)))
        excluded=split_labels-set(tax['trainable_classes'])
        if excluded: raise GateFailure('training_contains_excluded_or_unmapped_classes:'+','.join(sorted(excluded)))
        result['gates']['taxonomy']={k:v for k,v in tax.items() if k not in ('class_names','trainable_classes')}
        mask_path=rp('gold_mask_audit')
        if any(t in tasks for t in ('segmentation','mask_derived_shape')):
            mask_sig=rp('gold_mask_audit_signature')
            if not mask_sig: raise GateFailure('gold_mask_audit_signature_missing')
            verify_signature(mask_path,mask_sig,pub); result['gates']['gold_mask_signature']='PASS'
        result['gates']['gold_masks']=verify_masks(mask_path,tasks)
        result['status']='RESEARCH-GO'; result['research_training_allowed']=True
        result['hybrid_adoption_allowed']=False
        result['phase1_note']='A separate, independent ablation report is required before hybrid adoption; Phase 0 GO does not imply hybrid superiority.'
    except Exception as exc:
        result['errors'].append(str(exc))
    out=json.dumps(result,ensure_ascii=False,indent=2)
    print(out)
    if a.report:
        a.report.parent.mkdir(parents=True,exist_ok=True); a.report.write_text(out+'\n',encoding='utf-8')
    return 0 if result['research_training_allowed'] else 2
if __name__=='__main__': sys.exit(main())
