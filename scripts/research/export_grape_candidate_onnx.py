#!/usr/bin/env python3
import argparse,csv,json,hashlib
from pathlib import Path
import numpy as np,torch,onnx,onnxruntime as ort
from PIL import Image
from torchvision import models,transforms
from torch import nn
from torch.utils.data import Dataset,DataLoader
from sklearn.metrics import accuracy_score,balanced_accuracy_score,f1_score
class DS(Dataset):
 def __init__(self,rows,root,classes):
  self.rows=rows;self.root=root;self.idx={c:i for i,c in enumerate(classes)}
  self.tf=transforms.Compose([transforms.Resize((160,160)),transforms.ToTensor(),transforms.Normalize([.485,.456,.406],[.229,.224,.225])])
 def __len__(self):return len(self.rows)
 def __getitem__(self,i):
  r=self.rows[i]
  with Image.open(self.root/r['processed_path']) as im:x=self.tf(im.convert('RGB'))
  return x,self.idx[r['class_label'].replace(' ','_')]
def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--manifest',type=Path,required=True);p.add_argument('--checkpoint',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
 ck=torch.load(a.checkpoint,map_location='cpu',weights_only=True);classes=ck['classes'];m=models.mobilenet_v3_small(weights=None);m.classifier[3]=nn.Linear(m.classifier[3].in_features,len(classes));m.load_state_dict(ck['model']);m.eval()
 dummy=torch.zeros(1,3,160,160)
 onnx_path=a.out/'grape-morphology-fusion-candidate-160.onnx'
 torch.onnx.export(m,dummy,str(onnx_path),input_names=['images'],output_names=['logits'],dynamic_axes={'images':{0:'batch'},'logits':{0:'batch'}},opset_version=17,dynamo=False)
 onnx.checker.check_model(onnx.load(str(onnx_path)))
 with a.manifest.open(newline='',encoding='utf-8-sig') as f:allrows=list(csv.DictReader(f))
 rows=[r for r in allrows if r['split']=='val']
 ds=DS(rows,a.root,classes);dl=DataLoader(ds,batch_size=16,shuffle=False,num_workers=2)
 sess=ort.InferenceSession(str(onnx_path),providers=['CPUExecutionProvider']);truth=[];pt=[];op=[];maxdiff=0.
 with torch.no_grad():
  for x,y in dl:
   ptl=m(x).numpy();otl=sess.run(['logits'],{'images':x.numpy()})[0]
   maxdiff=max(maxdiff,float(np.max(np.abs(ptl-otl))));pt.extend(ptl.argmax(1).tolist());op.extend(otl.argmax(1).tolist());truth.extend(y.tolist())
 report={'status':'ONNX_export_and_validation_passed','task':'research-only grape leaf five-class candidate','input_shape':'NCHW RGB 160x160','opset':17,'onnx_bytes':onnx_path.stat().st_size,'onnx_sha256':hashlib.sha256(onnx_path.read_bytes()).hexdigest(),'checkpoint_sha256':hashlib.sha256(a.checkpoint.read_bytes()).hexdigest(),'validation_images':len(rows),'historical_test_loaded':False,'onnxruntime':'1.32.0','pytorch_onnx_prediction_agreement':float(np.mean(np.asarray(pt)==np.asarray(op))),'max_absolute_logit_difference':maxdiff,'pytorch_validation':{'accuracy':float(accuracy_score(truth,pt)),'balanced_accuracy':float(balanced_accuracy_score(truth,pt)),'macro_f1':float(f1_score(truth,pt,average='macro'))},'onnx_validation':{'accuracy':float(accuracy_score(truth,op)),'balanced_accuracy':float(balanced_accuracy_score(truth,op)),'macro_f1':float(f1_score(truth,op,average='macro'))},'limitations':['Validation only; not Syrian field validated.','Labels inherited from dataset folders; no expert review.','No farm/plant/session identifiers.','Not approved for app diagnosis or pesticide advice.']}
 (a.out/'onnx-validation-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n');print(json.dumps(report,indent=2,ensure_ascii=False))
if __name__=='__main__':main()
