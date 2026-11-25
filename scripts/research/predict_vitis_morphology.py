#!/usr/bin/env python3
"""Predict top cultivar-morphology matches from a Vitis leaf reference image."""
import argparse,json
from pathlib import Path
import torch,joblib
from PIL import Image
from torch import nn
from torchvision import models,transforms
import numpy as np
p=argparse.ArgumentParser();p.add_argument('--image',required=True);p.add_argument('--model',required=True);p.add_argument('--weights',required=True);p.add_argument('--topk',type=int,default=3);a=p.parse_args()
torch.set_num_threads(2)
net=models.mobilenet_v3_small(weights=None);net.load_state_dict(torch.load(a.weights,map_location='cpu',weights_only=True))
backbone=nn.Sequential(net.features,net.avgpool,nn.Flatten(1)).eval()
t=transforms.Compose([transforms.Resize((224,224)),transforms.ToTensor(),transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
with Image.open(a.image) as im:x=t(im.convert('RGB')).unsqueeze(0)
with torch.no_grad():f=((backbone(x)+backbone(torch.flip(x,dims=[3])))/2).numpy()
payload=joblib.load(a.model);probs=payload['pipeline'].predict_proba(f)[0];classes=payload['classes']
order=np.argsort(probs)[::-1][:max(1,a.topk)]
print(json.dumps({'task':'cultivar morphology similarity, not disease diagnosis','status':payload['status'],'top_matches':[{'cultivar':classes[i],'score':float(probs[i])} for i in order]},ensure_ascii=False,indent=2))
