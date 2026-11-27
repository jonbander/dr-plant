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
    print(f'PASS: {len(candidates)} Python training entry points require the signed Phase 0 gate.')

if __name__=='__main__': main()
