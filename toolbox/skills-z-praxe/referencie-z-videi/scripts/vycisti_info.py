#!/usr/bin/env python3
"""Odstráni z video.info.json (yt-dlp) cookies relácie, podpísané adresy a hlavičky.

    python3 -I vycisti_info.py video.info.json [ďalšie.info.json ...]   # prepíše súbor na mieste
    python3 -I vycisti_info.py --kontrola video.info.json               # len vypíše, čo by zmazal

Prečo: yt-dlp (2026.08.19) zapisuje pri TikToku do info.json kľúč `cookies` (ttwid, tt_csrf_token,
tt_chain_token) v koreni aj pri každom formáte, napriek predvolenému --clean-info-json. Sú to tokeny
anonymnej relácie; do repozitára ani k poznámkam nepatria. Podpísané adresy (`url`, `thumbnail`, `manifest_url`)
po čase expirujú a nesú parametre relácie. Ponechá všetko ostatné (autor, dátum, počty, trvanie,
rozmer, popis), čo potrebuje záznam referencie.

Návratové kódy: 0 v poriadku (alebo nebolo čo mazať), 1 súbor sa nedá prečítať, 2 zlé argumenty.
"""
import json
import sys

KLUCE = ("cookies", "url", "thumbnail", "manifest_url", "fragment_base_url", "http_headers", "fragments")


def vycisti(obj, cesta="", nalezy=None):
    if nalezy is None:
        nalezy = []
    if isinstance(obj, dict):
        for k in list(obj.keys()):
            if k in KLUCE:
                nalezy.append(f"{cesta}/{k}")
                del obj[k]
            else:
                vycisti(obj[k], f"{cesta}/{k}", nalezy)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            vycisti(v, f"{cesta}[{i}]", nalezy)
    return nalezy


def main(argv):
    kontrola = "--kontrola" in argv
    subory = [a for a in argv if a != "--kontrola"]
    if not subory:
        print(__doc__.strip().splitlines()[0], file=sys.stderr)
        return 2
    kod = 0
    for p in subory:
        try:
            with open(p, encoding="utf-8") as f:
                d = json.load(f)
        except (OSError, ValueError) as e:
            print(f"{p}: nedá sa prečítať ({e})", file=sys.stderr)
            kod = 1
            continue
        nalezy = vycisti(d)
        druhy = sorted({n.rsplit("/", 1)[-1] for n in nalezy})
        print(f"{p}: {len(nalezy)} polí ({', '.join(druhy) or 'nič'})" + (" [len kontrola]" if kontrola else ""))
        if nalezy and not kontrola:
            with open(p, "w", encoding="utf-8") as f:
                json.dump(d, f, ensure_ascii=False, indent=1)
    return kod


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
