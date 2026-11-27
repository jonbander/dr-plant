#!/usr/bin/env python3
"""Prevent accidental ungated Python training entry points."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]

def main():
    candidates=list((ROOT/'scripts').glob('train_*.py'))
    candidates += [p for p in (ROOT/'scripts'/'research').glob('*.py') if p.name.startswith(('train_','cv_grape_finetune','finetune_grape_existing_teacher'))]
    candidates += list((ROOT/'results').glob('*/train_*.py'))
    missing=[]
    for path in candidates:
        text=path.read_text(encoding='utf-8')
        if 'extract_training_gate_args' not in text or 'enforce_training_gate' not in text:
            missing.append(str(path.relative_to(ROOT)))
    if missing: raise SystemExit('Ungated training entry points: '+', '.join(missing))
    code=("import sys; sys.path.insert(0, 'scripts'); "
          "sys.argv=['scripts/research/train_grape_morphology_fusion.py', "
          "'--training-profile','p','--training-profile-signature','s', "
          "'--training-data-root','d','--training-trusted-public-key','k']; "
          "from training_gate_guard import extract_training_gate_args; "
          "assert extract_training_gate_args()['expected_task']=='mask_derived_shape'")
    import subprocess
    probe=subprocess.run(['python3','-c',code],capture_output=True,text=True)
    if probe.returncode: raise SystemExit('Morphology trainer task binding failed: '+probe.stderr+probe.stdout)
    print(f'PASS: {len(candidates)} Python training entry points require the signed Phase 0 gate and fixed task binding.')

if __name__=='__main__': main()
