#!/usr/bin/env python3
"""Paired 3-fold group-CV comparison: frozen CNN, auto shape, and fusion.

Cultivar morphology recognition only. Automatic masks are unreviewed candidates;
this is an exploratory experiment in the controlled Dryad image domain.
"""
import argparse,csv,json
from pathlib import Path
import numpy as np
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler,LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score,balanced_accuracy_score,f1_score,top_k_accuracy_score

def main():
 p=argparse.ArgumentParser();p.add_argument('--manifest',required=True);p.add_argument('--shape-features',required=True);p.add_argument('--embeddings',required=True);p.add_argument('--leaf-crop-embeddings');p.add_argument('--out-dir',required=True);a=p.parse_args()
 manifest={r['relative_path']:r for r in csv.DictReader(open(a.manifest,encoding='utf-8-sig'))}
 shapes=list(csv.DictReader(open(a.shape_features,encoding='utf-8-sig')))
 z=np.load(a.embeddings,allow_pickle=True)
 emb_paths=[str(x) for x in z['paths'].tolist()]; emb_map={p:z['features'][i] for i,p in enumerate(emb_paths)}
 rows=[]; Xshape=[]; Xcnn=[]
 for r in shapes:
  m=manifest.get(r['relative_path'])
  if not m or str(m.get('morphology_training_eligible','')).lower()!='true' or r['mask_status']!='auto_candidate_two_leaves': continue
  if r['relative_path'] not in emb_map: continue
  fs=[float(r['leaf_mean_'+n]) for n in ['area_fraction','perimeter_norm','aspect_ratio','extent','solidity','eccentricity','compactness','convexity_deficit','radial_cv','radial_q10','radial_q50','radial_q90','hu1','hu2','hu3','hu4','hu5','hu6','hu7']]
  fs += [float(r['leaf_std_'+n]) for n in ['area_fraction','perimeter_norm','aspect_ratio','extent','solidity','eccentricity','compactness','convexity_deficit','radial_cv','radial_q10','radial_q50','radial_q90','hu1','hu2','hu3','hu4','hu5','hu6','hu7']]
  if not np.isfinite(fs).all(): continue
  rows.append(r);Xshape.append(fs);Xcnn.append(emb_map[r['relative_path']])
 Xshape=np.asarray(Xshape,dtype=np.float32);Xcnn=np.asarray(Xcnn,dtype=np.float32)
 labels=np.asarray([r['cultivar'] for r in rows]);groups=np.asarray([r['group_id'] for r in rows]);le=LabelEncoder();y=le.fit_transform(labels)
 counts={c:len(set(groups[labels==c])) for c in le.classes_}
 if min(counts.values())<3: raise RuntimeError(f'not enough independent groups per class: {counts}')
 cv=StratifiedGroupKFold(n_splits=3,shuffle=True,random_state=42)
 configs={'shape_only':Xshape,'cnn_only':Xcnn,'cnn_plus_shape':np.concatenate([Xcnn,Xshape],axis=1)}
 if a.leaf_crop_embeddings:
  zleaf=np.load(a.leaf_crop_embeddings,allow_pickle=True); leaf_map={str(path):zleaf['features'][i] for i,path in enumerate(zleaf['paths'].tolist())}
  Xleaf=np.asarray([leaf_map[r['relative_path']] for r in rows],dtype=np.float32)
  configs['leaf_crop_cnn_only']=Xleaf
  configs['leaf_crop_cnn_plus_shape']=np.concatenate([Xleaf,Xshape],axis=1)
 metrics={};predictions=[]
 splits=list(cv.split(Xcnn,y,groups))
 for name,X in configs.items():
  folds=[];pred_all=np.full(len(y),-1,dtype=int)
  for fold,(tr,te) in enumerate(splits,1):
   if set(y[tr])!=set(range(len(le.classes_))) or set(y[te])!=set(range(len(le.classes_))): raise RuntimeError(f'fold {fold} class coverage failure')
   model=make_pipeline(StandardScaler(),LogisticRegression(C=0.1,max_iter=5000,class_weight='balanced',solver='lbfgs'))
   model.fit(X[tr],y[tr]); pred=model.predict(X[te]);proba=model.predict_proba(X[te]);pred_all[te]=pred
   m={'fold':fold,'train_images':len(tr),'test_images':len(te),'train_vines':len(set(groups[tr])),'test_vines':len(set(groups[te])),'accuracy':float(accuracy_score(y[te],pred)),'balanced_accuracy':float(balanced_accuracy_score(y[te],pred)),'macro_f1':float(f1_score(y[te],pred,average='macro')),'top3_accuracy':float(top_k_accuracy_score(y[te],proba,k=3,labels=np.arange(len(le.classes_))))}
   folds.append(m)
   for i in te: predictions.append({'model':name,'fold':fold,'relative_path':rows[i]['relative_path'],'group_id':groups[i],'cultivar':labels[i],'predicted':le.classes_[pred_all[i]] if pred_all[i]>=0 else le.classes_[pred[list(te).index(i)]],'correct':bool(pred[list(te).index(i)]==y[i])})
  metrics[name]={'folds':folds,**{k:float(np.mean([f[k] for f in folds])) for k in ['accuracy','balanced_accuracy','macro_f1','top3_accuracy']}}
 out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)
 report={'task':'French Vitis cultivar morphology recognition; not disease diagnosis','status':'exploratory_auto_mask_candidates_controlled_domain_only','dataset':'Dryad 10.5061/dryad.g79cnp5mn, CC0-1.0','paired_subset_images':len(rows),'paired_subset_vine_groups':len(set(groups)),'classes':list(le.classes_),'class_vine_groups':counts,'split':'same 3-fold StratifiedGroupKFold by block-row-vine for all feature sets; random_state=42','mask':'automatic HSV segmentation candidates; 444/504 images had two selected components; 100/127 supervised images retained; no manual mask ground truth','shape_features_per_image':int(Xshape.shape[1]),'cnn_features_per_image':int(Xcnn.shape[1]),'leaf_crop_cnn_features_per_image':int(Xleaf.shape[1]) if a.leaf_crop_embeddings else None,'classifier':'StandardScaler + LogisticRegression(C=0.1, class_weight=balanced)','results':metrics,'limitations':['controlled light-box images, not field images','automatic masks not manually validated','two-leaf per photo segmentation may omit/merge lobes or confuse shadows','cultivar classification only; no disease task','subset differs from previous 127-image experiment due mask eligibility; compare only within this paired subset','no tuning on independent external test set']}
 (out/'paired-shape-cnn-fusion-metrics.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
 with (out/'paired-shape-cnn-fusion-predictions.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=list(predictions[0]));w.writeheader();w.writerows(predictions)
 print(json.dumps(report,indent=2,ensure_ascii=False))
if __name__=='__main__':main()
