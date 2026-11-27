"""Mandatory preflight guard shared by every Python training entry point."""
import subprocess, sys
from pathlib import Path

REQUIRED = {
    '--training-profile': 'profile',
    '--training-profile-signature': 'profile_signature',
    '--training-data-root': 'data_root',
    '--training-trusted-public-key': 'trusted_public_key',
}

def extract_training_gate_args():
    args=list(sys.argv[1:])
    if '-h' in args or '--help' in args: return None
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
    return found

def enforce_training_gate(gate_args):
    if gate_args is None: return
    validator=Path(__file__).resolve().parent/'research'/'validate-training-gate.py'
    command=[sys.executable,str(validator),'--profile',gate_args['profile'],'--profile-signature',gate_args['profile_signature'],'--data-root',gate_args['data_root'],'--trusted-public-key',gate_args['trusted_public_key']]
    completed=subprocess.run(command,check=False)
    if completed.returncode != 0:
        raise SystemExit('NO-GO: Phase 0 training gate failed; training process was not started.')
