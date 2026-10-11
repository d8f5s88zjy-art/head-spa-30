# Vymaže zo šablóny nápisy, ktoré sa na poukážke menia (názov, podtitul, doména), a doplní pozadie.
import os, cv2, numpy as np
os.chdir(os.path.dirname(os.path.abspath(__file__)))
im = cv2.imread('sablona.png')
lum = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(int)
mask = np.zeros(lum.shape, np.uint8)
def zona(x0, y0, x1, y1, prah):
    sub = lum[y0:y1, x0:x1]
    mask[y0:y1, x0:x1][sub > prah] = 255
# názov HEAD SPA aj s linkami po stranách, podtitul RELAX • OBNOVA • HARMÓNIA
zona(232, 372, 584, 436, 18)
# doména v pätičke (linky po stranách ostávajú)
zona(528, 590, 762, 612, 18)
mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=2)
out = cv2.inpaint(im, mask, 7, cv2.INPAINT_TELEA)
cv2.imwrite('sablona-cista.png', out)
print('maskovaných px', int((mask > 0).sum()))
