#!/usr/bin/env python3
"""Research-only leaf silhouette extraction and shape features for light-box Vitis images.

Masks are automatic candidates, never gold annotations. This script does not
produce disease labels or diagnostic models.
"""
from __future__ import annotations
import argparse,csv,json,math
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage as ndi
from scipy.spatial import ConvexHull,QhullError

FEATURES=['area_fraction','perimeter_norm','aspect_ratio','extent','solidity','eccentricity','compactness','convexity_deficit','radial_cv','radial_q10','radial_q50','radial_q90','hu1','hu2','hu3','hu4','hu5','hu6','hu7']

def components(rgb: np.ndarray):
    hsv=np.asarray(Image.fromarray(rgb).convert('HSV'))
    # Low-saturation, high-value light-box background is excluded. Thresholds
    # are fixed before model evaluation and must be checked against overlays.
    mask=(hsv[:,:,1]>=35)&(hsv[:,:,2]<=205)
    mask=ndi.binary_closing(mask,structure=np.ones((5,5),bool),iterations=1)
    mask=ndi.binary_opening(mask,structure=np.ones((3,3),bool),iterations=1)
    mask=ndi.binary_fill_holes(mask)
    labels,n=ndi.label(mask)
    total=mask.size
    found=[]
    for lab in range(1,n+1):
        yy,xx=np.where(labels==lab)
        area=len(xx)
        if area < total*0.012: continue
        x0,x1=int(xx.min()),int(xx.max())+1; y0,y1=int(yy.min()),int(yy.max())+1
        w=x1-x0; h=y1-y0; ar=w/max(h,1)
        if ar<0.35 or ar>2.8 or w>rgb.shape[1]*0.82 or h>rgb.shape[0]*0.88: continue
        if x0<=1 or y0<=1 or x1>=rgb.shape[1]-1 or y1>=rgb.shape[0]-1: continue
        found.append((area,labels==lab,(x0,y0,x1,y1)))
    found.sort(key=lambda z:z[0],reverse=True)
    return found[:2],mask

def shape_features(mask: np.ndarray):
    yy,xx=np.where(mask); area=len(xx); h,w=mask.shape
    if area<20: return None
    x0,x1=xx.min(),xx.max()+1; y0,y1=yy.min(),yy.max()+1
    bw=x1-x0; bh=y1-y0
    perimeter=int(np.count_nonzero(mask & ~ndi.binary_erosion(mask)))
    coords=np.column_stack((xx,yy)).astype(float)
    centered=coords-coords.mean(axis=0)
    cov=np.cov(centered,rowvar=False)
    eig=np.linalg.eigvalsh(cov); eig=np.maximum(eig,0)
    ecc=math.sqrt(max(0,1-eig[0]/max(eig[1],1e-9)))
    compact=4*math.pi*area/max(perimeter*perimeter,1)
    try:
        # Convex hull on a deterministic spatial subsample keeps CPU cost low.
        pts=coords[::max(1,len(coords)//4000)]
        hull=ConvexHull(pts)
        hull_area=float(hull.volume)
        hull_per=float(hull.area)
        solidity=area/max(hull_area,1)
    except (QhullError,ValueError):
        hull_area=float(area); hull_per=float(perimeter); solidity=0.0
    # Normalized central moments and Hu invariants, stable to translation/scale.
    m00=float(area); cx=float(xx.mean()); cy=float(yy.mean())
    mu20=float(np.sum((xx-cx)**2)); mu02=float(np.sum((yy-cy)**2)); mu11=float(np.sum((xx-cx)*(yy-cy)))
    mu30=float(np.sum((xx-cx)**3)); mu03=float(np.sum((yy-cy)**3)); mu12=float(np.sum((xx-cx)*(yy-cy)**2)); mu21=float(np.sum((xx-cx)**2*(yy-cy)))
    def eta(mu,p,q): return mu/(m00**(1+(p+q)/2))
    n20,n02,n11=eta(mu20,2,0),eta(mu02,0,2),eta(mu11,1,1)
    n30,n03,n12,n21=eta(mu30,3,0),eta(mu03,0,3),eta(mu12,1,2),eta(mu21,2,1)
    a=n30-3*n12; b=3*n21-n03
    hu=[n20+n02,(n20-n02)**2+4*n11**2,a*a+b*b,(n30+n12)**2+(n21+n03)**2,
        a*(n30+n12)*((n30+n12)**2-3*(n21+n03)**2)+b*(n21+n03)*(3*(n30+n12)**2-(n21+n03)**2),
        (n20-n02)*((n30+n12)**2-(n21+n03)**2)+4*n11*(n30+n12)*(n21+n03),
        b*(n30+n12)*((n30+n12)**2-3*(n21+n03)**2)-a*(n21+n03)*(3*(n30+n12)**2-(n21+n03)**2)]
    # Radial contour distribution is a lightweight proxy for lobing/serration.
    r=np.sqrt((xx-cx)**2+(yy-cy)**2); r=r/max(float(np.sqrt(r.mean()**2)),1e-9)
    return [area/(h*w),perimeter/math.sqrt(h*w),bw/max(bh,1),area/max(bw*bh,1),
            min(solidity,1.5),ecc,compact,1-solidity,float(r.std()),*np.quantile(r,[.1,.5,.9]).tolist(),
            *[math.copysign(math.log10(abs(v)+1e-30),v) for v in hu]]

def process_image(path: Path):
    with Image.open(path) as im:
        im=im.convert('RGB'); im.thumbnail((512,384)); rgb=np.asarray(im)
    found,raw=components(rgb)
    feats=[shape_features(x[1]) for x in found]
    feats=[x for x in feats if x is not None]
    if len(feats)==2:
        arr=np.asarray(feats,float); vector=np.r_[arr.mean(0),arr.std(0),len(feats)]
        status='auto_candidate_two_leaves'
    else:
        vector=np.r_[np.full(len(FEATURES)*2,np.nan),len(feats)]
        status='review_required_component_count_'+str(len(feats))
    return rgb,found,vector,status

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--manifest',required=True);ap.add_argument('--images-root',required=True);ap.add_argument('--out-dir',required=True);ap.add_argument('--preview-count',type=int,default=16)
    a=ap.parse_args(); manifest=list(csv.DictReader(open(a.manifest,encoding='utf-8-sig'))); root=Path(a.images_root); out=Path(a.out_dir); out.mkdir(parents=True,exist_ok=True)
    rows=[]; previews=[]
    for i,r in enumerate(manifest):
        if str(r.get('french_subset','')).lower()!='true': continue
        p=root/r['relative_path']; rgb,found,vec,status=process_image(p)
        row={k:r.get(k,'') for k in ['relative_path','filename','group_id','cultivar','country','sha256']}
        row.update({'mask_status':status,'component_count':len(found)})
        for j,name in enumerate(FEATURES): row['leaf_mean_'+name]=float(vec[j]) if np.isfinite(vec[j]) else ''
        for j,name in enumerate(FEATURES): row['leaf_std_'+name]=float(vec[len(FEATURES)+j]) if np.isfinite(vec[len(FEATURES)+j]) else ''
        rows.append(row)
        if len(previews)<a.preview_count:
            base=Image.fromarray(rgb).convert('RGBA'); overlay=Image.new('RGBA',base.size,(0,0,0,0)); d=ImageDraw.Draw(overlay)
            colors=[(255,0,0,90),(0,80,255,90)]
            for j,(_,mask,bbox) in enumerate(found):
                m=Image.fromarray((mask*255).astype('uint8')).convert('L'); layer=Image.new('RGBA',base.size,colors[j]); overlay.paste(layer,(0,0),m)
                d.rectangle(bbox,outline=(255,0,0,255) if j==0 else (0,80,255,255),width=2)
            canvas=Image.new('RGB',(512,430),'white'); canvas.paste(base.convert('RGB'),(0,0)); canvas.paste(overlay,(0,0),overlay)
            d=ImageDraw.Draw(canvas); d.text((5,390),f"{r['filename']} | {status}",fill='black'); d.text((5,407),r.get('cultivar',''),fill='black'); previews.append(canvas)
    fields=list(rows[0].keys()) if rows else []
    with (out/'shape-features-candidates.csv').open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
    if previews:
        sheet=Image.new('RGB',(512*4,430*((len(previews)+3)//4)),'#ddd')
        for i,im in enumerate(previews):sheet.paste(im,((i%4)*512,(i//4)*430))
        sheet.save(out/'mask-preview-contact-sheet.jpg',quality=88)
    counts={}
    for r in rows:counts[r['mask_status']]=counts.get(r['mask_status'],0)+1
    report={'status':'automatic_mask_candidates_only','images':len(rows),'mask_status_counts':counts,'features_per_leaf':len(FEATURES),'feature_columns':FEATURES,'segmentation':'PIL HSV saturation>=35 and value<=205; scipy closing/opening/fill holes; two largest plausible interior components','important_limit':'No manual ground-truth masks; overlays must be reviewed before treating these as leaf masks. No disease or production claim.'}
    (out/'shape-extraction-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
