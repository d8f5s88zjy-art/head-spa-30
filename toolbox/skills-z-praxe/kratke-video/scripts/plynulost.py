#!/usr/bin/env python3
"""Plynulosť pohybu fotky (nájazd, posun) v hotovom videu: rozdiel medzi susednými snímkami v strede obrazu.

Pri rovnomernom pohybe je rozdiel snímka po snímke skoro rovnaký. Keď výrez skáče po celých pixeloch
(typicky ffmpeg zoompan bez prevzorkovania), striedajú sa snímky bez pohybu (rozdiel blízko 0) a skoky.

  python3 -I plynulost.py video.mp4 --od 0.5 --do 3.5 [--vyrez 480]

Výpis: priemer, variačný koeficient (CV = smerodajná odchýlka / priemer; pod 0,15 je plynulé),
počet zastavení (rozdiel pod 35 % mediánu) a skokov (nad 180 % mediánu). Meraj len úsek jedného záberu
bez prelínania a bez textu, ktorý sa práve objavuje. Potrebuje ffmpeg a Pillow.
"""
import argparse
import statistics
import subprocess
import sys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video')
    ap.add_argument('--od', type=float, required=True)
    ap.add_argument('--do', type=float, required=True)
    ap.add_argument('--vyrez', type=int, default=480, help='strana štvorca v strede obrazu (px)')
    ap.add_argument('--vypis', action='store_true', help='vypíš rozdiel každej snímky')
    a = ap.parse_args()
    from PIL import Image, ImageChops, ImageStat
    v = a.vyrez
    r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a.od), '-i', a.video, '-t', str(a.do - a.od),
                        '-vf', f'crop={v}:{v},format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True)
    n = len(r.stdout) // (v * v)
    snimky = [Image.frombytes('L', (v, v), r.stdout[i * v * v:(i + 1) * v * v]) for i in range(n)]
    d = [ImageStat.Stat(ImageChops.difference(snimky[i], snimky[i + 1])).mean[0] for i in range(n - 1)]
    if len(d) < 3:
        print('málo snímok', file=sys.stderr)
        return 1
    med = statistics.median(d)
    priem = statistics.mean(d)
    cv = statistics.pstdev(d) / priem if priem else 0
    stop = sum(1 for x in d if x < 0.35 * med)
    skok = sum(1 for x in d if x > 1.8 * med)
    if a.vypis:
        print(' '.join(f'{x:.2f}' for x in d))
    print(f'{a.video} {a.od}-{a.do} s: {n} snímok, rozdiel priemer {priem:.3f}, medián {med:.3f}, '
          f'CV {cv:.3f}, zastavenia {stop}, skoky {skok} -> {"plynulé" if cv < 0.15 and not stop and not skok else "nerovnomerné"}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
