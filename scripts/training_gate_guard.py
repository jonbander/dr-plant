"""Mandatory preflight guard shared by every Python training entry point."""
import subprocess, sys
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
    'scripts/train_citrus_field_v3.py': 'classification',
    'scripts/train_lemon_v3_exploratory.py': 'classification',
    'scripts/train_multicrop_full_v2.py': 'classification',
    'scripts/research/cv_grape_finetune.py': 'classification',
    'scripts/research/finetune_grape_existing_teacher.py': 'classification',
    'scripts/research/train_grape_morphology_fusion.py': 'mask_derived_shape',
    'scripts/research/train_ngld_self_supervised_distillation.py': 'self_supervised',
    'scripts/research/train_vitis_morphology.py': 'classification',
    'results/multicrop-plantvillage-v1/train_image_classifier.py': 'classification',
    'results/multicrop-plantvillage-v2/train_multicrop_full_v2.py': 'classification',
    'results/plasmopara-v2-exploratory-2026-11-25/train_image_classifier.py': 'classification',
}

def extract_training_gate_args():
    args=list(sys.argv[1:])
    if '-h' in args or '--help' in args: return None
    repo_root=Path(__file__).resolve().parents[1]
    try:
        entrypoint=Path(sys.argv[0]).resolve().relative_to(repo_root).as_posix()
    except ValueError:
        raise SystemExit('NO-GO: training entry point is outside the registered Dr.Plant repository paths')
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

def enforce_training_gate(gate_args):
    if gate_args is None: return
    validator=Path(__file__).resolve().parent/'research'/'validate-training-gate.py'
    command=[sys.executable,str(validator),'--profile',gate_args['profile'],'--profile-signature',gate_args['profile_signature'],'--data-root',gate_args['data_root'],'--trusted-public-key',gate_args['trusted_public_key'],'--expected-task',gate_args['expected_task']]
    completed=subprocess.run(command,check=False)
    if completed.returncode != 0:
        raise SystemExit('NO-GO: Phase 0 training gate failed; training process was not started.')
