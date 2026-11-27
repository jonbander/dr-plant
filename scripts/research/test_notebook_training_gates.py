#!/usr/bin/env python3
"""Ensure every maintained Colab training notebook has the signed-profile gate."""
import json
from pathlib import Path

NOTEBOOKS = [
    'DrPlant_NGLD_Continual_SelfSupervised_Experiment.ipynb',
    'DrPlant_Lemon_Clean_Training_v1.ipynb',
    'DrPlant_Full_Multicrop_Training_v2.ipynb',
    'DrPlant_Lemon_V3_Exploratory_Training.ipynb',
    'DrPlant_Citrus_Field_V3_Training.ipynb',
    'DrPlant_Multicrop_PlantVillage_Training_v1.ipynb',
]
REQUIRED = ('--training-profile', '--training-profile-signature', '--training-data-root', '--training-trusted-public-key')

def main():
    root=Path(__file__).resolve().parents[2]/'notebooks'
    for name in NOTEBOOKS:
        path=root/name
        data=json.loads(path.read_text(encoding='utf-8'))
        cells=data.get('cells',[])
        code='\n'.join(''.join(c.get('source',[])) for c in cells if c.get('cell_type')=='code')
        if 'REQUIRED_DRPLANT_GATE_SECRETS' not in code:
            raise SystemExit(f'Notebook missing mandatory Colab secret guard: {name}')
        if any(flag not in code for flag in REQUIRED):
            raise SystemExit(f'Notebook training command missing required gate arguments: {name}')
    print(f'PASS: {len(NOTEBOOKS)} Colab training notebooks require signed Phase 0 profiles.')

if __name__=='__main__': main()
