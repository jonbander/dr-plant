import json,csv
from pathlib import Path
import numpy as np, torch, onnx, onnxruntime as ort
from sklearn.metrics import accuracy_score,f1_score
from torch.utils.data import DataLoader,Dataset
from torchvision import models,transforms
from PIL import Image
from torch import nn
ROOT=Path(__file__).resolve().parents[1]
class RowsDS(Dataset):
 def __init__(self,rows,classes,tf,base=None): self.rows,self.classes,self.tf,self.base=rows,classes,tf,base
 def __len__(self): return len(self.rows)
 def __getitem__(self,i):
  r=self.rows[i];p=Path(r['path']);p=(self.base/p) if self.base and not p.is_absolute() else p
  with Image.open(p) as im:x=self.tf(im.convert('RGB'))
  return x,self.classes.index(r['label'])
def check(tag,model_path,manifest_path,image_size,base=None):
 onnx.checker.check_model(str(model_path),full_check=False)
 rows=list(csv.DictReader(open(manifest_path,encoding='utf-8-sig')))
 classes=sorted({r['label'] for r in rows})
 rows=[r for r in rows if r.get('split') in ('test','Test')]
 tf=transforms.Compose([transforms.Resize((image_size,image_size)),transforms.ToTensor(),transforms.Normalize((.485,.456,.406),(.229,.224,.225))])
 loader=DataLoader(RowsDS(rows,classes,tf,base),batch_size=16,shuffle=False,num_workers=0)
 model=models.mobilenet_v3_small(weights=None);model.classifier[-1]=nn.Linear(model.classifier[-1].in_features,len(classes))
 ck=ROOT/('results/citrus-field-v3/best-model.pt' if tag=='citrus-field-v3' else 'results/lemon-v3/best-model.pt')
 state=torch.load(ck,map_location='cpu',weights_only=False)['state_dict'];model.load_state_dict(state);model.eval()
 sess=ort.InferenceSession(str(model_path),providers=['CPUExecutionProvider']); inp=sess.get_inputs()[0].name
 truth=[];ptpred=[];orpred=[];maxdiff=0
 with torch.no_grad():
  for x,y in loader:
   a=model(x).numpy();b=sess.run(None,{inp:x.numpy()})[0]
   maxdiff=max(maxdiff,float(np.max(np.abs(a-b))))
   truth+=y.tolist();ptpred+=a.argmax(1).tolist();orpred+=b.argmax(1).tolist()
 report={'onnx_checker':'passed','onnxruntime':'loaded','test_images':len(truth),'torch_accuracy':float(accuracy_score(truth,ptpred)),'onnx_accuracy':float(accuracy_score(truth,orpred)),'torch_macro_f1':float(f1_score(truth,ptpred,average='macro',zero_division=0)),'onnx_macro_f1':float(f1_score(truth,orpred,average='macro',zero_division=0)),'prediction_agreement':float(np.mean(np.array(ptpred)==np.array(orpred))),'max_abs_logit_difference':maxdiff,'classes':classes}
 out=ROOT/'results'/tag/'onnx-validation.json';out.write_text(json.dumps(report,indent=2,ensure_ascii=False));print(tag,json.dumps(report,ensure_ascii=False))
check('citrus-field-v3',ROOT/'results/citrus-field-v3/citrus-field-v3-mobilenetv3-small.onnx',ROOT/'results/citrus-field-v3/manifest.csv',160,ROOT/'data/external/2026-11/citrus-field-v3/Field-Based Citrus Leaf Disease Image Dataset/Moroccan Citrus Leaf Dataset')
check('lemon-v3',ROOT/'results/lemon-v3/lemon-v3-mobilenetv3-small.onnx',ROOT/'results/lemon-v3/manifest.csv',128)
