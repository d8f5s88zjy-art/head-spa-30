# Pohyb obrazu filmu v pokoji (len "dýchanie" kamery z place(), film.js:999-1004) na telefóne:
# kamera v eye+off, pozerá na eye+0.08*off, FOV 50°, DIST 10, rovina záberu (výrez 0.5625) s presahom 1.24,
# body roviny posunuté k oku o (1 - AMT*z), AMT 0.3 (telefón), DRIFT 0.6. Plátno 780x1688 (DPR 2).
import numpy as np
FOV=50; DIST=10; W,H=780,1688; aspect=W/H
vh=2*DIST*np.tan(np.radians(FOV)/2); vw=vh*aspect
pa=0.5625; pw=vw*1.24; ph=pw/pa
if ph<vh*1.24: ph=vh*1.24; pw=ph*pa
AMT=0.3; DR=0.6
def off(t):
    s=t
    x=(np.sin(s*0.37)*0.006+np.sin(s*0.13+0.7)*0.011)*DR*vw
    y=(np.sin(s*0.29+1.3)*0.004+np.sin(s*0.09+2.1)*0.006)*DR*vh
    z=(np.sin(s*0.21+0.4)*0.008+np.sin(s*0.07+1.9)*0.014)*DIST*DR
    return np.array([x,y,z])
def proj(P,t):
    o=off(t); eye=np.array([0,0,DIST])
    cam=eye+o; tgt=np.array([o[0]*0.08,o[1]*0.08,0.0])
    f=tgt-cam; f/=np.linalg.norm(f); r=np.cross(f,[0,1,0]); r/=np.linalg.norm(r); u=np.cross(r,f)
    out=[]
    for p,z in P:
        w=eye+(p-eye)*(1-AMT*z)   # posun k oku (uEye = pokojné miesto kamery)
        d=w-cam; xc=d@r; yc=d@u; zc=d@f
        sx=(xc/zc)/np.tan(np.radians(FOV)/2)/aspect; sy=(yc/zc)/np.tan(np.radians(FOV)/2)
        out.append(((sx*0.5+0.5)*W,(sy*0.5+0.5)*H))
    return np.array(out)
pts=[(np.array([x*vw/2,y*vh/2,0.0]),z) for x in (-0.9,0,0.9) for y in (-0.9,0,0.9) for z in (0.0,1.0)]
mx=0; ts=np.arange(0,120,1/60)
prev=proj(pts,0)
for t in ts[1:]:
    cur=proj(pts,t); d=np.max(np.linalg.norm(cur-prev,axis=1)); mx=max(mx,d); prev=cur
print('najväčší posun bodu obrazu za snímku 60 Hz: %.3f px plátna (DPR 2)'%mx)
print('t.j. %.1f px/s; pri kreslení 15 Hz by krok bol %.2f px, pri 10 Hz %.2f px'%(mx*60, mx*4, mx*6))
