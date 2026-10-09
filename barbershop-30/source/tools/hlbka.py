import sys, numpy as np, onnxruntime as ort
from PIL import Image
sess = ort.InferenceSession(sys.argv[1], providers=['CPUExecutionProvider'])
inp = sess.get_inputs()[0]; print('input', inp.name, inp.shape)
def run(path, out, size=518):
    im = Image.open(path).convert('RGB'); W,H = im.size
    # rozmery násobok 14, dlhšia strana = size
    if W >= H: w = size; h = int(round(H*size/W/14))*14
    else: h = size; w = int(round(W*size/H/14))*14
    x = np.asarray(im.resize((w,h), Image.BICUBIC)).astype(np.float32)/255.0
    x = (x - [0.485,0.456,0.406]) / [0.229,0.224,0.225]
    x = x.transpose(2,0,1)[None].astype(np.float32)
    d = sess.run(None, {inp.name: x})[0][0]
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)   # svetlá = blízko (Depth Anything dáva inverznú hĺbku)
    dm = Image.fromarray((d*255).astype(np.uint8)).resize((W,H), Image.BICUBIC)
    dm.save(out, quality=90); return d.shape
import time
for p,o in zip(sys.argv[2::2], sys.argv[3::2]):
    t=time.time(); print(p, run(p,o), round(time.time()-t,1),'s', flush=True)
