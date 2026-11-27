"""Mandatory preflight guard shared by every Python training entry point."""
import json, subprocess, sys
from pathlib import Path

REQUIRED = {
    '--training-profile': 'profile',
    '--training-profile-signature': 'profile_signature',
    '--training-data-root': 'data_root',
    '--training-trusted-public-key': 'trusted_public_key',
}

# Task requirements are tied to the checked-in entry point, not supplied by the caller.
ENTRYPOINT_TASKS = {
    'scripts/train_image_classifier.py': 'classification',
    'scripts/train_multicrop_full_v2.py': 'classification',
    'scripts/research/cv_grape_finetune.py': 'classification',
    'scripts/research/finetune_grape_existing_teacher.py': 'classification',
    'scripts/research/train_grape_morphology_fusion.py': 'mask_derived_shape',
    'scripts/research/train_ngld_self_supervised_distillation.py': 'self_supervised',
    'results/multicrop-plantvillage-v1/train_image_classifier.py': 'classification',
    'results/multicrop-plantvillage-v2/train_multicrop_full_v2.py': 'classification',
    'results/plasmopara-v2-exploratory-2026-11-25/train_image_classifier.py': 'classification',
}

BLOCKED_ENTRYPOINTS = {
    'scripts/train_citrus_field_v3.py': 'builds its own split instead of consuming the signed split manifest',
    'scripts/train_lemon_v3_exploratory.py': 'creates a random image-level split instead of consuming the signed split manifest',
    'scripts/research/train_vitis_morphology.py': 'creates internal cross-validation folds instead of consuming the signed split manifest',
}

def extract_training_gate_args():
    args=list(sys.argv[1:])
    if '-h' in args or '--help' in args: return None
    repo_root=Path(__file__).resolve().parents[1]
    try:
        entrypoint=Path(sys.argv[0]).resolve().relative_to(repo_root).as_posix()
    except ValueError:
        raise SystemExit('NO-GO: training entry point is outside the registered Dr.Plant repository paths')
    if entrypoint in BLOCKED_ENTRYPOINTS:
        raise SystemExit(f'NO-GO: {entrypoint} is blocked until it consumes the signed Phase 0 split manifest: {BLOCKED_ENTRYPOINTS[entrypoint]}')
    expected_task=ENTRYPOINT_TASKS.get(entrypoint)
    if expected_task is None:
        raise SystemExit(f'NO-GO: unregistered training entry point: {entrypoint}')
    found={}; i=0; kept=[]
    while i < len(args):
        token=args[i]
        if token in REQUIRED:
            if i+1 >= len(args) or args[i+1].startswith('--'):
                raise SystemExit(f'{token} requires a value; training is blocked without a validated Phase 0 profile')
            key=REQUIRED[token]
            if key in found: raise SystemExit(f'duplicate {token}; training is blocked')
            found[key]=args[i+1]; i+=2
        else:
            kept.append(token); i+=1
    missing=set(REQUIRED.values())-set(found)
    if missing:
        raise SystemExit('NO-GO: every training command must supply --training-profile, --training-profile-signature, --training-data-root and --training-trusted-public-key; missing '+','.join(sorted(missing)))
    sys.argv=[sys.argv[0],*kept]
    found['expected_task']=expected_task
    return found

def enforce_training_gate(gate_args, *, data_root=None, split_manifest=None):
    if gate_args is None: return
    if data_root is None or split_manifest is None:
        raise SystemExit('NO-GO: the training entry point must bind its actual data root and split manifest to the signed Phase 0 profile.')
    actual_root=Path(data_root).resolve()
    signed_root=Path(gate_args['data_root']).resolve()
    if actual_root != signed_root:
        raise SystemExit(f'NO-GO: training data root mismatch: actual={actual_root} signed={signed_root}')
    profile_path=Path(gate_args['profile']).resolve()
    try:
        profile=json.loads(profile_path.read_text(encoding='utf-8'))
        split_ref=Path(profile['split_manifest'])
        if split_ref.is_absolute() or '..' in split_ref.parts:
            raise ValueError('unsafe split_manifest path in signed profile')
        signed_split=(profile_path.parent/split_ref).resolve()
        signed_split.relative_to(profile_path.parent.resolve())
    except Exception as exc:
        raise SystemExit(f'NO-GO: cannot resolve signed split manifest: {exc}')
    actual_split=Path(split_manifest).resolve()
    if actual_split != signed_split:
        raise SystemExit(f'NO-GO: training split manifest mismatch: actual={actual_split} signed={signed_split}')
    validator=Path(__file__).resolve().parent/'research'/'validate-training-gate.py'
    command=[sys.executable,str(validator),'--profile',str(profile_path),'--profile-signature',gate_args['profile_signature'],'--data-root',str(actual_root),'--trusted-public-key',gate_args['trusted_public_key'],'--expected-task',gate_args['expected_task']]
    completed=subprocess.run(command,check=False)
    if completed.returncode != 0:
        raise SystemExit('NO-GO: Phase 0 training gate failed; training process was not started.')
