#!/usr/bin/env python3
"""Validate model artifact hashes and research input contracts without loading ML runtimes."""
import hashlib, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
errors=[]
manifest=ROOT/'results/2026-11/artifacts.sha256'
for number,line in enumerate(manifest.read_text().splitlines(),1):
    if not line.strip(): continue
    try: expected, rel = line.split(None,1); rel=rel.strip().lstrip('*')
    except ValueError: errors.append(f'{manifest}:{number}: malformed line'); continue
    path=ROOT/rel
    if not path.is_file(): errors.append(f'{rel}: missing file'); continue
    actual=hashlib.sha256(path.read_bytes()).hexdigest()
    if actual != expected: errors.append(f'{rel}: SHA256 mismatch expected={expected} actual={actual}')
contracts={
 'lemon-v3': {'size':[128,128], 'count':18, 'script':'scripts/train_lemon_v3_exploratory.py'},
 'citrus-field-v3': {'size':[160,160], 'count':4, 'script':'scripts/train_citrus_field_v3.py'}
}
for name, expected in contracts.items():
    folder=ROOT/'results'/name
    try: c=json.loads((folder/'model-contract.json').read_text())
    except Exception as e: errors.append(f'{name}: invalid model-contract.json: {e}'); continue
    labels=json.loads((folder/'labels.json').read_text())
    if c.get('status') != 'research_candidate_disabled': errors.append(f'{name}: candidate must remain disabled')
    if c.get('input',{}).get('size') != expected['size']: errors.append(f'{name}: input size contract mismatch')
    if c.get('input',{}).get('resizeMode') != 'stretch': errors.append(f'{name}: training resize must be stretch')
    if c.get('output',{}).get('classCount') != expected['count'] or len(labels) != expected['count']:
        errors.append(f'{name}: labels/output count mismatch')
    source=(ROOT/expected['script']).read_text()
    needle='transforms.Resize((size,size))' if name=='lemon-v3' else 'transforms.Resize((a.image_size,a.image_size))'
    if needle not in source: errors.append(f'{name}: training resize implementation no longer matches contract')
# Production placeholder must not accidentally be enabled or point to an empty model bundle.
p=json.loads((ROOT/'public/models/plant-disease/manifest.json').read_text())
labels=json.loads((ROOT/'public/models/plant-disease/labels.json').read_text())
if p.get('enabled') is not False: errors.append('production placeholder must remain disabled')
if labels: errors.append('production placeholder labels must remain empty until a validated mapping exists')
if errors:
    print('\n'.join('FAIL: '+e for e in errors)); sys.exit(1)
print('PASS: artifact SHA256 manifest, research model contracts, label counts and disabled production placeholder')
