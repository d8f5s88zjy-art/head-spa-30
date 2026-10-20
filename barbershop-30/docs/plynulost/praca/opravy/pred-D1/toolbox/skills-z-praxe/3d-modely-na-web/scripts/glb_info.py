#!/usr/bin/env python3
"""Rozbor súboru GLB a kontrola rozpočtu pre web (len štandardná knižnica).

Použitie:
  python3 -I glb_info.py model.glb [ďalší.glb ...]
  python3 -I glb_info.py model.glb --rozpocet            # predvolený rozpočet pre web na telefóne
  python3 -I glb_info.py model.glb --rozpocet --max-mb 2 --max-trojuholnikov 60000 --max-textura 1024
  python3 -I glb_info.py model.glb --json                # výstup ako JSON

Vypíše veľkosť, trojuholníky, vrcholy, atribúty, materiály, textúry (typ, rozmer, bajty),
odhad pamäte textúr v grafike a rozšírenia glTF. S --rozpocet vráti kód 1, keď niečo
prekročí limit, 0 keď je všetko v rozpočte, 2 pri chybe súboru.

Odhad pamäte textúr: obrázky PNG, JPEG a WebP sa v grafike rozbalia na 4 bajty na pixel,
mipmapy pridajú tretinu. KTX2 (Basis) ostáva v grafike komprimované, preto ho nepočítame.
"""
import argparse
import json
import struct
import sys

# Rozšírenia, ktoré načíta three.js (GLTFLoader) aj <model-viewer>. Iné v extensionsRequired = riziko.
ZNAME_ROZSIRENIA = {
    'EXT_texture_webp', 'KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_texture_basisu',
    'KHR_mesh_quantization', 'KHR_texture_transform', 'KHR_materials_emissive_strength',
    'KHR_materials_clearcoat', 'KHR_materials_transmission', 'KHR_materials_ior', 'KHR_materials_specular',
    'KHR_materials_sheen', 'KHR_materials_volume', 'KHR_materials_unlit', 'KHR_materials_variants',
    'KHR_materials_iridescence', 'KHR_materials_anisotropy', 'KHR_materials_dispersion',
}


def rozmer_obrazka(b, mime):
    """Šírka a výška z hlavičky PNG, JPEG alebo WebP bez Pillow; (None, None) pri neznámom formáte."""
    try:
        if b[:8] == b'\x89PNG\r\n\x1a\n':
            return struct.unpack('>II', b[16:24])
        if b[:4] == b'RIFF' and b[8:12] == b'WEBP':
            typ = b[12:16]
            if typ == b'VP8 ':
                w, h = struct.unpack('<HH', b[26:30])
                return w & 0x3FFF, h & 0x3FFF
            if typ == b'VP8L':
                v = int.from_bytes(b[21:25], 'little')
                return (v & 0x3FFF) + 1, ((v >> 14) & 0x3FFF) + 1
            if typ == b'VP8X':
                return int.from_bytes(b[24:27], 'little') + 1, int.from_bytes(b[27:30], 'little') + 1
        if b[:2] == b'\xff\xd8':
            i = 2
            while i < len(b) - 9:
                if b[i] != 0xFF:
                    i += 1
                    continue
                m = b[i + 1]
                if m in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                    h, w = struct.unpack('>HH', b[i + 5:i + 9])
                    return w, h
                if m in (0xD8, 0x01) or 0xD0 <= m <= 0xD7:
                    i += 2
                    continue
                i += 2 + struct.unpack('>H', b[i + 2:i + 4])[0]
    except Exception:
        pass
    return None, None


def nacitaj(path):
    data = open(path, 'rb').read()
    if len(data) < 20 or data[:4] != b'glTF':
        raise ValueError('nie je GLB (chýba hlavička glTF)')
    off, js, binarne = 12, None, b''
    while off + 8 <= len(data):
        dlzka, typ = struct.unpack_from('<II', data, off)
        kus = data[off + 8: off + 8 + dlzka]
        if typ == 0x4E4F534A:
            js = json.loads(kus)
        elif typ == 0x004E4942:
            binarne = kus
        off += 8 + dlzka
    if js is None:
        raise ValueError('chýba JSON časť')
    return data, js, binarne


def rozbor(path):
    data, js, binarne = nacitaj(path)
    acc, bvs = js.get('accessors', []), js.get('bufferViews', [])
    trojuholniky = vrcholy = primitivy = 0
    atributy = set()
    komprimovane = False
    for m in js.get('meshes', []):
        for p in m.get('primitives', []):
            primitivy += 1
            atributy |= set(p.get('attributes', {}).keys())
            ext = p.get('extensions') or {}
            if 'KHR_draco_mesh_compression' in ext:
                komprimovane = True
            if 'POSITION' in p.get('attributes', {}):
                vrcholy += acc[p['attributes']['POSITION']].get('count', 0)
            mode = p.get('mode', 4)
            if mode == 4:
                if 'indices' in p:
                    trojuholniky += acc[p['indices']].get('count', 0) // 3
                elif 'POSITION' in p.get('attributes', {}):
                    trojuholniky += acc[p['attributes']['POSITION']].get('count', 0) // 3
    textury, bajty_obrazkov, gpu = [], 0, 0
    for im in js.get('images', []):
        mime = im.get('mimeType', '')
        if 'bufferView' in im:
            bv = bvs[im['bufferView']]
            zac = bv.get('byteOffset', 0)
            b = binarne[zac: zac + bv['byteLength']]
            w, h = rozmer_obrazka(b, mime)
            n = len(b)
        else:
            w = h = None
            n = 0
            mime = mime or 'externý súbor: ' + str(im.get('uri', ''))[:40]
        bajty_obrazkov += n
        if w and h and mime != 'image/ktx2':
            gpu += int(w * h * 4 * 4 / 3)
        textury.append({'typ': mime, 'sirka': w, 'vyska': h, 'bajty': n})
    materialy = []
    for mt in js.get('materials', []):
        pbr = mt.get('pbrMetallicRoughness', {})
        materialy.append({
            'alphaMode': mt.get('alphaMode', 'OPAQUE'),
            'baseColorTexture': 'baseColorTexture' in pbr,
            'metallicRoughnessTexture': 'metallicRoughnessTexture' in pbr,
            'normalTexture': 'normalTexture' in mt,
            'occlusionTexture': 'occlusionTexture' in mt,
            'rozsirenia': sorted((mt.get('extensions') or {}).keys()),
        })
    pouzite = js.get('extensionsUsed') or []
    povinne = js.get('extensionsRequired') or []
    if 'EXT_meshopt_compression' in pouzite or 'KHR_draco_mesh_compression' in pouzite:
        komprimovane = True
    return {
        'subor': path,
        'mb': round(len(data) / 1e6, 2),
        'generator': (js.get('asset') or {}).get('generator'),
        'primitivy': primitivy,
        'trojuholniky': trojuholniky,
        'vrcholy': vrcholy,
        'atributy': sorted(atributy),
        'geometria_mb': round((len(binarne) - bajty_obrazkov) / 1e6, 2),
        'obrazky_mb': round(bajty_obrazkov / 1e6, 2),
        'textury': textury,
        'gpu_textury_mb_odhad': round(gpu / 1e6, 1),
        'materialy': materialy,
        'extensionsUsed': pouzite,
        'extensionsRequired': povinne,
        'komprimovana_geometria': komprimovane,
    }


def kontrola(r, a):
    chyby = []
    if r['mb'] > a.max_mb:
        chyby.append(f"súbor {r['mb']} MB > {a.max_mb} MB")
    if r['trojuholniky'] > a.max_trojuholnikov:
        chyby.append(f"trojuholníky {r['trojuholniky']} > {a.max_trojuholnikov}")
    for t in r['textury']:
        if t['sirka'] and max(t['sirka'], t['vyska']) > a.max_textura:
            chyby.append(f"textúra {t['sirka']}x{t['vyska']} > {a.max_textura} px")
    if r['gpu_textury_mb_odhad'] > a.max_gpu_mb:
        chyby.append(f"pamäť textúr v grafike ~{r['gpu_textury_mb_odhad']} MB > {a.max_gpu_mb} MB")
    nezname = [e for e in r['extensionsRequired'] if e not in ZNAME_ROZSIRENIA]
    if nezname:
        chyby.append('povinné rozšírenia, ktoré prehliadač nemusí načítať: ' + ', '.join(nezname))
    upozornenia = []
    if not r['komprimovana_geometria'] and r['geometria_mb'] > 1:
        upozornenia.append('geometria bez kompresie (Meshopt alebo Draco)')
    if r['materialy'] and not any(m['normalTexture'] for m in r['materialy']) and r['trojuholniky'] > 200000:
        upozornenia.append('bez normálovej mapy: po zjednodušení sa stratí jemný reliéf, treba ho zapiecť')
    return chyby, upozornenia


def main():
    p = argparse.ArgumentParser(description='Rozbor GLB a kontrola rozpočtu pre web')
    p.add_argument('subory', nargs='+')
    p.add_argument('--json', action='store_true')
    p.add_argument('--rozpocet', action='store_true', help='skontroluj limity a vráť kód 1 pri prekročení')
    p.add_argument('--max-mb', type=float, default=3.0)
    p.add_argument('--max-trojuholnikov', type=int, default=100000)
    p.add_argument('--max-textura', type=int, default=2048)
    p.add_argument('--max-gpu-mb', type=float, default=64.0)
    a = p.parse_args()
    kod = 0
    vystup = []
    for s in a.subory:
        try:
            r = rozbor(s)
        except Exception as e:
            print(f'{s}: chyba: {e}', file=sys.stderr)
            kod = 2
            continue
        if a.rozpocet:
            r['chyby'], r['upozornenia'] = kontrola(r, a)
            if r['chyby'] and kod == 0:
                kod = 1
        vystup.append(r)
        if a.json:
            continue
        print(f"{s}: {r['mb']} MB, generátor {r['generator']}")
        print(f"  trojuholníky {r['trojuholniky']}, vrcholy {r['vrcholy']}, primitívy {r['primitivy']}, atribúty {', '.join(r['atributy'])}")
        print(f"  geometria {r['geometria_mb']} MB, obrázky {r['obrazky_mb']} MB, pamäť textúr v grafike ~{r['gpu_textury_mb_odhad']} MB (odhad)")
        for t in r['textury']:
            print(f"  textúra {t['typ']} {t['sirka']}x{t['vyska']}, {t['bajty'] / 1e6:.2f} MB")
        for m in r['materialy']:
            print(f"  materiál alphaMode {m['alphaMode']}, farba {m['baseColorTexture']}, kov a drsnosť {m['metallicRoughnessTexture']}, normálová mapa {m['normalTexture']}, AO {m['occlusionTexture']}")
        print(f"  rozšírenia použité {r['extensionsUsed']}, povinné {r['extensionsRequired']}, kompresia geometrie {r['komprimovana_geometria']}")
        if a.rozpocet:
            print('  ROZPOČET: ' + ('V PORIADKU' if not r['chyby'] else 'PREKROČENÝ'))
            for c in r['chyby']:
                print('   - ' + c)
            for u in r['upozornenia']:
                print('   ~ ' + u)
    if a.json:
        print(json.dumps(vystup, ensure_ascii=False, indent=1))
    return kod


if __name__ == '__main__':
    sys.exit(main())
