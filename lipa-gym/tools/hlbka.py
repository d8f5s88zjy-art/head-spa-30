"""Hĺbkové mapy pre 3D efekt (WebGL) klasického webu: Depth Anything V2 Base (ONNX).
Vstup: assets/img/f/<id>-w-1920.jpg (široké) a <id>-1080.jpg (vysoké) → assets/img/d/<id>-w.png / <id>.png
(512 px na šírku, 8-bit, bližšie = svetlejšie). Model: scratchpad/depth/model.onnx.
python3 tools/hlbka.py"""
import os, sys, time
import numpy as np
from PIL import Image
import onnxruntime as ort

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = os.path.join(ROOT, 'assets', 'img', 'f'); D = os.path.join(ROOT, 'assets', 'img', 'd')
MODEL = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/depth/model.onnx'
WIDE = ['funkcna-zona-6', 'funkcna-zona-7', 'vstup-1', 'recepcia-1', 'hlavna-sala-1', 'hlavna-sala-4', 'volne-vahy-1', 'stroje-4', 'funkcna-zona-1', 'funkcna-zona-5', 'kardio-1', 'terasa-1']
TALL = ['funkcna-zona-6', 'funkcna-zona-7', 'vstup-1', 'recepcia-1', 'hlavna-sala-1', 'hlavna-sala-4', 'volne-vahy-1', 'stroje-4', 'funkcna-zona-1', 'funkcna-zona-5', 'kardio-1', 'terasa-1']
MMA = [('mma-1-w-1200.jpg', 'mma-1-w.png'), ('mma-1-640.jpg', 'mma-1.png')]
mean = np.array([0.485, 0.456, 0.406]); std = np.array([0.229, 0.224, 0.225])


def depth(sess, src, out):
    im = Image.open(src).convert('RGB'); W, H = im.size
    w = 518; h = int(round(H / W * w / 14)) * 14
    x = (np.asarray(im.resize((w, h), Image.BICUBIC)) / 255.0 - mean) / std
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    d = sess.run(None, {'pixel_values': x})[0][0]
    lo, hi = np.percentile(d, 1), np.percentile(d, 99.5); d = np.clip((d - lo) / (hi - lo), 0, 1)
    Image.fromarray((d * 255).astype(np.uint8)).resize((512, int(512 * H / W)), Image.BICUBIC).save(out, optimize=True)


if __name__ == '__main__':
    os.makedirs(D, exist_ok=True)
    sess = ort.InferenceSession(MODEL, providers=['CPUExecutionProvider'])
    jobs = [(f'{s}-w-1920.jpg', f'{s}-w.png') for s in WIDE] + [(f'{s}-1080.jpg', f'{s}.png') for s in TALL] + MMA
    for src, out in jobs:
        if os.path.exists(os.path.join(D, out)): continue
        t = time.time(); depth(sess, os.path.join(F, src), os.path.join(D, out)); print(out, f'{time.time()-t:.1f}s', flush=True)
