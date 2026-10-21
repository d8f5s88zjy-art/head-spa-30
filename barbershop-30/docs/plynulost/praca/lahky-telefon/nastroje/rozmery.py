# Rozmery obrázkov z hlavičiek (AVIF ispe, WebP VP8/VP8L/VP8X, JPEG SOF, PNG IHDR), bez knižníc.
import sys, struct, os
def avif(b):
    i = b.find(b'ispe')
    if i < 0: return None
    return struct.unpack('>II', b[i+8:i+16])
def webp(b):
    if b[:4]!=b'RIFF' or b[8:12]!=b'WEBP': return None
    c=b[12:16]
    if c==b'VP8X': return (1+int.from_bytes(b[24:27],'little'), 1+int.from_bytes(b[27:30],'little'))
    if c==b'VP8 ': w,h=struct.unpack('<HH', b[26:30]); return (w&0x3fff, h&0x3fff)
    if c==b'VP8L':
        v=int.from_bytes(b[21:25],'little'); return ((v&0x3fff)+1, ((v>>14)&0x3fff)+1)
def png(b):
    if b[:8]!=b'\x89PNG\r\n\x1a\n': return None
    return struct.unpack('>II', b[16:24])
def jpg(b):
    if b[:2]!=b'\xff\xd8': return None
    i=2
    while i<len(b):
        if b[i]!=0xff: i+=1; continue
        m=b[i+1]
        if m in (0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf):
            h,w=struct.unpack('>HH', b[i+5:i+9]); return (w,h)
        if m in (0xd8,0x01) or 0xd0<=m<=0xd7: i+=2; continue
        L=struct.unpack('>H', b[i+2:i+4])[0]; i+=2+L
def dims(p):
    with open(p,'rb') as f: b=f.read(1<<16) if not p.endswith('.jpg') else f.read()
    for fn in (avif if p.endswith('.avif') else None, webp, png, jpg):
        if fn:
            r=fn(b)
            if r: return r
    return None
for p in sys.argv[1:]:
    if not os.path.isfile(p): print(f"CHÝBA\t{p}"); continue
    d=dims(p); s=os.path.getsize(p)
    if d: print(f"{s}\t{d[0]}x{d[1]}\t{d[0]*d[1]/1e6:.2f}MP\t{p}")
    else: print(f"{s}\t?\t?\t{p}")
