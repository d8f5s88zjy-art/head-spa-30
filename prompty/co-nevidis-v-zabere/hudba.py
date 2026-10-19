#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hudba.py – vlastná hudba k 30 s vertikálnemu shortu „ČO NEVIDÍŠ V ZÁBERE“ (bez hlasu, text v obraze).

Všetko je syntéza v numpy + scipy: žiadne cudzie vzorky, žiadne nahrávky, žiadne knižnice zvukov.
Deterministický seed → pri každom spustení vznikne rovnaký súbor (bit po bite).

Charakter: vážny, dokumentárny, napätý, nie akčný. Tónina G mol.
  * tep        – subbas G1 (49 Hz) s krátkym počiatočným poklesom výšky, „lub-dub“ ako srdce, ~84 BPM,
                 mierne nepravidelný (±2,5 % na dobu), v hustej časti zrýchli na ~88 BPM
  * plocha     – rozladené píly (±0,4 %) + sínus, dolná priepusť sa pomaly otvára, drobný chorus, dozvuk
  * perkusie   – filtrovaný šum a mäkké tlmené údery (120–500 Hz a 600–1800 Hz), žiadne hi-haty,
                 nič, čo by znelo ako skutočný zvuk udalosti (žiadne sirény, výstrely, krik, dav)
  * vyšší hlas – v hustej časti pomalý pohyb D4–Eb4–D4–C4–Bb3–C4–A3 nad meniacimi sa akordmi
  * nádych     – filtrovaný šum s otvárajúcim sa pásmom (na hook a pred zmenami)

Oblúk (32,0 s):
  0,0–1,5 s    takmer ticho: jeden nádych, ktorý vyústi do jedného úderu (hook)
  1,5–12 s     napätie rastie: tep + plocha, filter plochy sa otvára, od 6 s prvé tlmené údery
  12–22 s      najhustejšie: perkusie, vyšší hlas, akordy Gm → Ebmaj7 → Gm → Cm9 → Dsus4
  22–22,8 s    prudké, ale plynulé stíšenie: tep a perkusie končia, plocha klesne o 4 dB → celkovo ~10–12 dB,
               ostáva len plocha (Gm)
  22,8–29 s    ticho s plochou
  29–31,8 s    dobeh do ticha (kosínusový fade), 31,8–32,0 s úplné ticho

Spustenie (z adresára zvuk/):
  python3 -I hudba.py                     → hudba.wav (základný variant)
  python3 -I hudba.py --variant tmavsia   → hudba-tmavsia.wav
  python3 -I hudba.py --vsetky            → všetky varianty naraz
Výstup: WAV 48 kHz, stereo, 32-bit float, dĺžka presne 32,0 s, špička ≤ -3,5 dBFS,
integrovaná hlasitosť ≈ -20 LUFS (vlastný merač podľa ITU-R BS.1770-4; nezávisle over cez
`ffmpeg -af ebur128=peak=true`, pozri zmeraj.sh).
"""

import argparse
import os

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, lfilter, sosfilt, sosfilt_zi

# ----------------------------------------------------------------------------------------------
# Základné konštanty
# ----------------------------------------------------------------------------------------------
SR = 48000                        # vzorkovacia frekvencia (Hz)
DUR = 32.0                        # dĺžka skladby (s)
N = int(SR * DUR)                 # počet vzoriek (1 536 000)
SEED = 20261019                   # deterministický seed (dátum výroby)
T = np.arange(N) / SR             # časová os (s)

# Časové body oblúka (s)
T_HOOK = 0.45                     # úder na hook (nádych začína ~0,4 s pred ním)
T_PULZ = 1.5                      # nástup tepu a plochy
T_HUSTE = 12.0                    # začiatok najhustejšej časti
T_POKLES = 22.0                   # začiatok prudkého stíšenia
T_POKLES_KONIEC = 22.8            # koniec rampy stíšenia (plocha ostáva o 10 dB tichšie)
T_FADE = 29.0                     # začiatok dobehu
T_TICHO = 31.8                    # úplné ticho (do 32,0 s)

CIEL_LUFS = -20.0                 # cieľová integrovaná hlasitosť
MAX_SPICKA_DBFS = -3.5            # strop vzorkovej špičky (0,5 dB rezerva pod -3 dBFS; true peak býva o ~0,1–0,3 dB vyšší)
POKLES_DB = 4.0                   # o koľko dB klesne plocha v rampe 22–22,8 s; spolu s koncom tepu a perkusií (~8 dB)
                                  # je celkový pokles hudby ~10–12 dB (zmerané: krátkodobá S 16–22 s vs. 24–29 s)

# Varianty parametrov – menia len hustotu/farbu, oblúk je rovnaký.
VARIANTY = {
    'zakladna': dict(subor='hudba.wav', perkusie=1.0, filter_max=1400.0, vyssi_hlas=1.0, tep=1.0,
                     popis='základný variant: plný oblúk, perkusie v hustej časti, filter plochy do 1,4 kHz'),
    'tmavsia': dict(subor='hudba-tmavsia.wav', perkusie=0.25, filter_max=650.0, vyssi_hlas=0.5, tep=1.1,
                    popis='tmavšia: perkusie len náznakom (25 %), filter plochy len do 0,65 kHz, vyšší hlas na 50 %, tep o 10 % silnejší'),
    'hustejsia': dict(subor='hudba-hustejsia.wav', perkusie=1.6, filter_max=2400.0, vyssi_hlas=1.4, tep=1.0,
                      popis='hustejšia: viac perkusií (160 %), otvorenejší filter do 2,4 kHz, vyšší hlas na 140 %'),
}

# Akordy plochy: (začiatok s, koniec s, MIDI noty). Hranice akordov sa prelínajú (nábeh 0,6 s, dobeh 0,9 s).
AKORDY = [
    (0.0, 12.0, [43, 50, 58, 62]),    # G mol      G2 D3 Bb3 D4 – statické napätie, filter sa otvára
    (12.0, 15.0, [39, 50, 55, 58]),   # Eb maj7    Eb2 D3 G3 Bb3 – prvý harmonický pohyb
    (15.0, 17.5, [43, 50, 58, 62]),   # G mol
    (17.5, 19.8, [48, 51, 55, 62]),   # C mol 9    C3 Eb3 G3 D4
    (19.8, 22.0, [38, 50, 55, 57]),   # D sus4     D2 D3 G3 A3 – nerozvedené napätie pred stíšením
    (22.0, DUR, [43, 50, 58, 62]),    # G mol      uvoľnenie, ostáva len plocha
]

# Vyšší hlas (len v hustej časti): (začiatok s, MIDI). Posledný záznam je koniec.
VYSSI_HLAS = [(12.0, 62), (13.4, 63), (14.8, 62), (16.2, 60), (17.6, 58), (19.0, 60), (20.4, 57), (22.0, None)]


# ----------------------------------------------------------------------------------------------
# Pomocné funkcie
# ----------------------------------------------------------------------------------------------
def hz(midi):
    """MIDI číslo → frekvencia v Hz (A4 = 440 Hz)."""
    return 440.0 * 2.0 ** ((midi - 69) / 12.0)


def lp(x, f, rad=2):
    """Dolná priepusť (Butterworth)."""
    return sosfilt(butter(rad, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, rad=2):
    """Horná priepusť (Butterworth)."""
    return sosfilt(butter(rad, f, 'high', fs=SR, output='sos'), x)


def bp(x, a, b, rad=2):
    """Pásmová priepusť (Butterworth)."""
    return sosfilt(butter(rad, [a, b], 'band', fs=SR, output='sos'), x)


def obalka(n, nabeh, dobeh):
    """Obálka: lineárny nábeh (nabeh v s), potom exponenciálny dobeh (časová konštanta v s)."""
    e = np.empty(n)
    na = max(1, min(n, int(nabeh * SR)))
    e[:na] = np.linspace(0.0, 1.0, na)
    e[na:] = np.exp(-np.arange(n - na) / SR / max(dobeh, 1e-3))
    return e


def obalka_kos(n, nabeh, dobeh):
    """Obálka s kosínusovým nábehom a dobehom (pre dlhé tóny plochy a hlasu – bez cvaknutia)."""
    e = np.ones(n)
    na = min(n, int(nabeh * SR))
    nd = min(n - na, int(dobeh * SR))
    e[:na] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, na))
    if nd > 0:
        e[n - nd:] = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, nd))
    return e


def vyhladit(krivka, tau=0.03):
    """Jednopólové vyhladenie krivky (bez prekmitov) – zaoblí rohy lineárnych rámp, aby nič nepočuteľne nestupňovalo."""
    a = 1.0 - np.exp(-1.0 / (tau * SR))
    y, _ = lfilter([a], [1.0, -(1.0 - a)], krivka, zi=[(1.0 - a) * krivka[0]])
    return y


def krivka(body):
    """Po častiach lineárna krivka na celej časovej osi z bodov [(čas s, hodnota), ...], vyhladená."""
    cas, hod = zip(*body)
    return vyhladit(np.interp(T, cas, hod))


def pridaj(buf, sig, cas, gain=1.0):
    """Pridá (mono) signál do mono bufra na čas `cas` (s)."""
    i = int(round(cas * SR))
    n = min(len(sig), len(buf) - i)
    if i < 0 or n <= 0:
        return
    buf[i:i + n] += sig[:n] * gain


def pridaj_stereo(L, R, sig, cas, gain=1.0, pan=0.0):
    """Pridá mono signál do stereo mixu s panoramou (-1 vľavo … +1 vpravo, konštantný výkon)."""
    uhol = (pan + 1.0) * np.pi / 4.0
    pridaj(L, sig, cas, gain * np.cos(uhol) * np.sqrt(2.0))
    pridaj(R, sig, cas, gain * np.sin(uhol) * np.sqrt(2.0))


def pila(f, n, rozladenie=0.0, faza=0.0):
    """Pílový priebeh; pri rozladení dva hlasy f·(1±rozladenie) (jemné „chvenie“ plochy)."""
    k = np.arange(n) / SR
    if rozladenie == 0.0:
        return 2.0 * ((faza + k * f) % 1.0) - 1.0
    p1 = 2.0 * ((faza + k * f * (1.0 + rozladenie)) % 1.0) - 1.0
    p2 = 2.0 * ((faza + 0.37 + k * f * (1.0 - rozladenie)) % 1.0) - 1.0
    return 0.5 * (p1 + p2)


def lp_premenlivy(x, fc, blok=240):
    """Dolná priepusť 2. rádu, ktorej medzná frekvencia sa mení v čase podľa krivky `fc` (Hz, rovnako dlhá ako x).
    Počíta sa po blokoch 5 ms a stav filtra sa prenáša, takže pomalá zmena koeficientov necvaká."""
    y = np.empty_like(x)
    zi = None
    for i in range(0, len(x), blok):
        f = float(np.clip(fc[min(i + blok // 2, len(x) - 1)], 60.0, 20000.0))
        sos = butter(2, f, 'low', fs=SR, output='sos')
        if zi is None:
            zi = sosfilt_zi(sos) * x[0]
        y[i:i + blok], zi = sosfilt(sos, x[i:i + blok], zi=zi)
    return y


def chorus(x, stred_ms=7.0, hlbka_ms=1.4, rychlost=0.21, faza=0.0, mix=0.45):
    """Drobný chorus: modulované oneskorenie stred ± hĺbka (ms) pri pomalej rýchlosti (Hz), lineárna interpolácia.
    Rôzna fáza modulácie pre ľavý a pravý kanál dá plochu do šírky."""
    n = len(x)
    d = (stred_ms + hlbka_ms * np.sin(2 * np.pi * rychlost * np.arange(n) / SR + faza)) * SR / 1000.0
    y = np.interp(np.arange(n) - d, np.arange(n), x, left=0.0, right=0.0)
    return x + mix * y


def dozvuk_ir(rng, dlzka=2.6, cas=0.75):
    """Impulzová odozva dozvuku: exponenciálne doznievajúci šum, tmavší chvost (dolná priepusť 4,5 kHz),
    malé predoneskorenie 15 ms. Normalizovaná na jednotkovú energiu."""
    n = int(dlzka * SR)
    ir = rng.normal(0.0, 1.0, n) * np.exp(-np.arange(n) / SR / cas)
    ir = lp(ir, 4500.0)
    pre = int(0.015 * SR)
    ir[:pre] *= np.linspace(0.0, 1.0, pre)
    return ir / np.sqrt(np.sum(ir ** 2))


def dozvuk(x, ir, wet=0.3):
    """Zmieša suchý signál s dozvukom (konvolúcia cez FFT)."""
    return x * (1.0 - wet) + fftconvolve(x, ir)[:len(x)] * wet


# ----------------------------------------------------------------------------------------------
# Zvukové „nástroje“ – všetko syntéza
# ----------------------------------------------------------------------------------------------
def tep_uder(f0=49.0, dobeh=0.22, dlzka=0.6):
    """Jeden úder tepu: sínus, ktorého výška klesne z ~91 Hz na f0 = 49 Hz (G1) za ~30 ms, potom mäkká saturácia
    (pridá 2.–3. harmonickú, aby bolo pulz cítiť aj na reproduktore telefónu, ktorý 49 Hz nezahrá)."""
    n = int(dlzka * SR)
    tt = np.arange(n) / SR
    f = f0 + 42.0 * np.exp(-tt / 0.03)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * obalka(n, 0.003, dobeh)
    return np.tanh(1.6 * s) / np.tanh(1.6)


def uder_tlmeny(rng):
    """Mäkký tlmený úder: šum 120–500 Hz + krátky sínus 160 → 110 Hz. Znie ako dlaň na kartónovú škatuľu."""
    n = int(0.3 * SR)
    tt = np.arange(n) / SR
    sum_ = bp(rng.normal(0.0, 1.0, n), 120.0, 500.0) * obalka(n, 0.002, 0.06)
    f = 110.0 + 50.0 * np.exp(-tt / 0.02)
    ton = np.sin(2 * np.pi * np.cumsum(f) / SR) * obalka(n, 0.002, 0.05)
    s = 0.7 * sum_ / np.max(np.abs(sum_)) + 0.8 * ton
    return s / np.max(np.abs(s))


def tik(rng):
    """Tlmený šumový tik 600–1800 Hz, dobeh 20 ms. Nie hi-hat: nad 2 kHz nie je nič."""
    n = int(0.1 * SR)
    s = bp(rng.normal(0.0, 1.0, n), 600.0, 1800.0) * obalka(n, 0.001, 0.02)
    return s / np.max(np.abs(s))


def nadych(rng, dlzka=0.8, f_od=250.0, f_do=1500.0, vrchol=0.8):
    """Nádych: filtrovaný šum, ktorého dolná priepusť sa otvára od f_od po f_do; obálka rastie po `vrchol`
    (podiel dĺžky) a potom rýchlo klesne – ako nadýchnutie pred úderom."""
    n = int(dlzka * SR)
    fc = f_od * (f_do / f_od) ** (np.arange(n) / n)
    s = lp_premenlivy(hp(rng.normal(0.0, 1.0, n), 180.0), fc)
    nv = int(vrchol * n)
    e = np.empty(n)
    e[:nv] = np.sin(np.linspace(0.0, np.pi / 2, nv)) ** 1.5
    e[nv:] = np.cos(np.linspace(0.0, np.pi / 2, n - nv)) ** 1.5
    s *= e
    return s / np.max(np.abs(s))


# ----------------------------------------------------------------------------------------------
# Vrstvy skladby
# ----------------------------------------------------------------------------------------------
def mriezka_tepu(rng):
    """Časy úderov tepu od T_PULZ po T_POKLES: ~84 BPM, každá doba o ±2,5 % iná (ako skutočný tep),
    medzi 12 a 16 s tempo plynulo stúpne na ~88 BPM. Po T_POKLES tep nie je."""
    casy = []
    t = T_PULZ
    while t < T_POKLES - 0.05:
        casy.append(t)
        bpm = 84.0 + 4.0 * np.clip((t - T_HUSTE) / 4.0, 0.0, 1.0)
        t += 60.0 / bpm * (1.0 + rng.normal(0.0, 0.025))
    return np.array(casy)


def vrstva_tep(rng, udery, sila):
    """Tep: na každej dobe hlavný úder („lub“) a o ~190 ms neskôr slabší („dub“).
    Sila rastie z 55 % (1,5 s) na 100 % (12 s). Mono, v strede."""
    out = np.zeros(N)
    u1 = tep_uder(dobeh=0.22)
    u2 = tep_uder(dobeh=0.13)
    for b in udery:
        g = sila * (0.55 + 0.45 * np.clip((b - T_PULZ) / (T_HUSTE - T_PULZ), 0.0, 1.0)) * (0.92 + 0.08 * rng.random())
        pridaj(out, u1, b, g)
        pridaj(out, u2, b + 0.19 + rng.normal(0.0, 0.006), 0.5 * g)
    return out


def vrstva_perkusie(rng, udery, sila):
    """Tlmené perkusie. 6–12 s: zriedkavé, postupne hustejšie. 12–22 s: údery na 2. a 4. dobe,
    občas na „3 a“, tiky na osminách, zriedka šestnástina pred 1. dobou. Humanizácia ±6 ms a ±10 % sily."""
    L = np.zeros(N)
    R = np.zeros(N)
    U = uder_tlmeny(rng)
    K = tik(rng)
    pocet = [0]

    def hum():
        pocet[0] += 1
        return rng.normal(0.0, 0.006), 0.9 + 0.1 * rng.random()

    for k in range(len(udery) - 1):
        b, b2 = udery[k], udery[k + 1]
        osmina = (b2 - b) / 2.0
        doba = k % 4
        if b < T_HUSTE:
            r = (b - 6.0) / (T_HUSTE - 6.0)         # 0 pri 6 s → 1 pri 12 s
            if r <= 0.0:
                continue
            if doba == 3 and rng.random() < 0.9 * r:
                dt, v = hum(); pridaj_stereo(L, R, U, b + dt, 0.5 * r * v * sila, pan=0.15)
            if doba == 1 and rng.random() < 0.6 * r:
                dt, v = hum(); pridaj_stereo(L, R, K, b + osmina + dt, 0.25 * r * v * sila, pan=-0.2)
        else:
            d = min(1.0, 0.55 + 0.45 * (b - T_HUSTE) / 2.0)  # hustota 12 → 14 s stúpa na plnú
            if doba in (1, 3):
                dt, v = hum(); pridaj_stereo(L, R, U, b + dt, 0.85 * d * v * sila, pan=0.1 if doba == 1 else -0.1)
            if doba == 2 and rng.random() < 0.55:
                dt, v = hum(); pridaj_stereo(L, R, U, b + osmina + dt, 0.45 * d * v * sila, pan=0.25)
            if doba in (0, 1, 3) and rng.random() < 0.75:
                dt, v = hum(); pridaj_stereo(L, R, K, b + osmina + dt, 0.3 * d * v * sila, pan=0.3 if doba == 1 else -0.3)
            if doba == 3 and rng.random() < 0.35:
                dt, v = hum(); pridaj_stereo(L, R, K, b + 1.5 * osmina + dt, 0.22 * d * v * sila, pan=0.0)
    return L, R, pocet[0]


def vrstva_plocha(rng, ir, filter_max):
    """Atmosférická plocha: pre každý akord rozladené píly + sínus na základnej frekvencii, prelínanie cez hranice
    akordov, potom pomaly sa otvárajúca dolná priepusť, chorus (iná fáza vľavo/vpravo) a dozvuk."""
    suche = np.zeros(N)
    for zac, kon, noty in AKORDY:
        n = min(N - int(zac * SR), int((kon - zac + 0.9) * SR))
        seg = np.zeros(n)
        for k, m in enumerate(noty):
            f = hz(m)
            vaha = 1.0 if k == 0 else 0.55
            seg += pila(f, n, 0.004, rng.random()) * vaha
            seg += np.sin(2 * np.pi * f * np.arange(n) / SR + rng.random() * 2 * np.pi) * 0.35 * vaha
        seg *= obalka_kos(n, 0.6, 0.9)
        pridaj(suche, seg, zac)

    # Krivka medznej frekvencie: tma → otváranie → najotvorenejšie 18–22 s → zavretie po stíšení.
    fc = krivka([(0.0, 260.0), (T_PULZ, 300.0), (T_HUSTE, 900.0), (18.0, filter_max), (T_POKLES, filter_max),
                 (T_POKLES_KONIEC, 650.0), (T_FADE, 450.0), (DUR, 400.0)])
    x = lp_premenlivy(suche, fc)
    x = hp(x, 70.0)                        # pod 70 Hz patrí len tep
    x /= np.max(np.abs(x))
    L = dozvuk(chorus(x, faza=0.0), ir, 0.35)
    R = dozvuk(chorus(x, stred_ms=8.0, faza=np.pi / 2), ir, 0.35)
    # Úroveň plochy: v úvode takmer nič, rastie do 16 s, potom drží (globálne stíšenie rieši hlavná obálka).
    lvl = krivka([(0.0, 0.0), (0.3, 0.05), (T_PULZ, 0.14), (6.0, 0.45), (T_HUSTE, 0.8), (16.0, 1.0), (DUR, 1.0)])
    return L * lvl, R * lvl


def vrstva_vyssi_hlas(rng, ir):
    """Vyšší hlas (12–22 s): sínus + 2. a 3. harmonická, jemné vibrato, legato (prelínanie 0,3/0,5 s), chorus, dozvuk."""
    out = np.zeros(N)
    for (zac, m), (kon, _) in zip(VYSSI_HLAS[:-1], VYSSI_HLAS[1:]):
        n = int((kon - zac + 0.5) * SR)
        tt = np.arange(n) / SR
        f = hz(m) * (1.0 + 0.003 * np.sin(2 * np.pi * 4.5 * tt + rng.random() * 2 * np.pi))
        ph = 2 * np.pi * np.cumsum(f) / SR
        s = (np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)) * obalka_kos(n, 0.3, 0.5)
        pridaj(out, s, zac)
    out /= np.max(np.abs(out))
    L = dozvuk(chorus(out, mix=0.3, faza=0.0), ir, 0.5)
    R = dozvuk(chorus(out, mix=0.3, stred_ms=8.5, faza=np.pi), ir, 0.5)
    lvl = krivka([(0.0, 0.0), (T_HUSTE, 0.0), (T_HUSTE + 0.5, 0.6), (14.5, 1.0), (DUR, 1.0)])
    return L * lvl, R * lvl


def hlavna_obalka():
    """Globálna obálka: 1,0 do 22 s → kosínusová rampa o POKLES_DB nadol do 22,8 s → drží → kosínusový
    dobeh 29–31,8 s do nuly → ticho. (Tep a perkusie v tom čase už nehrajú, takže celkový pokles je väčší.)"""
    e = np.ones(N)
    dole = 10 ** (-POKLES_DB / 20.0)
    i0, i1 = int(T_POKLES * SR), int(T_POKLES_KONIEC * SR)
    e[i0:i1] = 1.0 - (1.0 - dole) * (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, i1 - i0)))
    e[i1:] = dole
    j0, j1 = int(T_FADE * SR), int(T_TICHO * SR)
    e[j0:j1] = dole * (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, j1 - j0)))
    e[j1:] = 0.0
    return e


# ----------------------------------------------------------------------------------------------
# Merač hlasitosti (ITU-R BS.1770-4) – na nastavenie výstupnej úrovne bez externých nástrojov
# ----------------------------------------------------------------------------------------------
def lufs_integrovana(L, R):
    """Integrovaná hlasitosť podľa BS.1770-4: K-váženie (dva biquady pre 48 kHz), bloky 400 ms s krokom 100 ms,
    absolútna brána -70 LUFS a relatívna brána -10 LU. Vracia (I v LUFS, pole hlasitostí blokov)."""
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]

    def k(x):
        return lfilter(b2, a2, lfilter(b1, a1, x))

    kl, kr = k(L), k(R)
    blok, krok = int(0.4 * SR), int(0.1 * SR)
    cs = np.concatenate([[0.0], np.cumsum(kl ** 2 + kr ** 2)])
    zac = np.arange(0, N - blok + 1, krok)
    z = (cs[zac + blok] - cs[zac]) / blok
    lk = -0.691 + 10 * np.log10(z + 1e-20)
    m = lk > -70.0
    if not m.any():
        return -np.inf, lk
    rel = -0.691 + 10 * np.log10(z[m].mean()) - 10.0
    m2 = m & (lk > rel)
    return -0.691 + 10 * np.log10(z[m2].mean()), lk


# ----------------------------------------------------------------------------------------------
# Skladba
# ----------------------------------------------------------------------------------------------
def zloz(variant):
    """Poskladá celú skladbu pre daný variant. Vracia (L, R) ako float64 v rozsahu ±1 (po normalizácii)."""
    p = VARIANTY[variant]
    rng = np.random.default_rng(SEED)
    ir = dozvuk_ir(rng)
    L = np.zeros(N)
    R = np.zeros(N)

    # 1) Hook: nádych 0,02–0,52 s, ktorý vyústi do jedného hlbokého úderu s dozvukom.
    #    Úroveň je zámerne nižšia než hustá časť (0–1,5 s má byť takmer ticho s jedným úderom).
    nd = nadych(rng, dlzka=0.5, f_od=200.0, f_do=1200.0, vrchol=0.85)
    pridaj_stereo(L, R, nd, 0.02, 0.15)
    hook = dozvuk(tep_uder(dobeh=0.45, dlzka=1.6), ir, 0.4)
    pridaj_stereo(L, R, hook, T_HOOK, 0.36 * p['tep'])

    # 2) Tep (subbas) od 1,5 s do 22 s.
    udery = mriezka_tepu(rng)
    tep = vrstva_tep(rng, udery, p['tep'])
    L += 0.5 * tep
    R += 0.5 * tep

    # 3) Plocha.
    pl, pr = vrstva_plocha(rng, ir, p['filter_max'])
    L += 0.30 * pl
    R += 0.30 * pr

    # 4) Perkusie.
    kl, kr, pocet_perk = vrstva_perkusie(rng, udery, p['perkusie'])
    L += 0.16 * kl
    R += 0.16 * kr

    # 5) Vyšší hlas v hustej časti.
    hl, hr = vrstva_vyssi_hlas(rng, ir)
    L += 0.10 * p['vyssi_hlas'] * hl
    R += 0.10 * p['vyssi_hlas'] * hr

    # 6) Nádychy pred zmenami: pred 12 s (hustá časť) a pred 19,8 s (Dsus4).
    pridaj_stereo(L, R, nadych(rng, dlzka=0.9, f_od=250.0, f_do=1600.0, vrchol=0.85), T_HUSTE - 0.85, 0.16)
    pridaj_stereo(L, R, nadych(rng, dlzka=0.8, f_od=250.0, f_do=1400.0, vrchol=0.85), 19.8 - 0.75, 0.11)

    # 7) Globálna obálka (stíšenie o 10 dB pri 22 s, dobeh do ticha) a odstránenie jednosmernej zložky.
    e = hlavna_obalka()
    L = hp(L * e, 20.0)
    R = hp(R * e, 20.0)

    # 8) Úroveň: cieľ -20 LUFS, ale špička nikdy nad MAX_SPICKA_DBFS (platí prísnejšia z podmienok).
    i0, _ = lufs_integrovana(L, R)
    g_lufs = 10 ** ((CIEL_LUFS - i0) / 20.0)
    spicka = max(np.max(np.abs(L)), np.max(np.abs(R)))
    g_peak = 10 ** (MAX_SPICKA_DBFS / 20.0) / spicka
    g = min(g_lufs, g_peak)
    L *= g
    R *= g
    i1, bloky = lufs_integrovana(L, R)
    info = dict(variant=variant, subor=p['subor'], popis=p['popis'], lufs=i1,
                spicka_dbfs=20 * np.log10(max(np.max(np.abs(L)), np.max(np.abs(R)))),
                obmedzene_spickou=g_peak < g_lufs, pocet_uderov_tepu=len(udery), pocet_perkusii=pocet_perk,
                bloky=bloky)
    return L, R, info


def uloz(cesta, L, R):
    """Uloží stereo 32-bit float WAV, 48 kHz."""
    wavfile.write(cesta, SR, np.stack([L, R], axis=1).astype(np.float32))


def main():
    ap = argparse.ArgumentParser(description='Vlastná hudba k shortu „ČO NEVIDÍŠ V ZÁBERE“ (syntéza).')
    ap.add_argument('--variant', choices=sorted(VARIANTY), default='zakladna')
    ap.add_argument('--vsetky', action='store_true', help='vyrobiť všetky varianty')
    ap.add_argument('--adresar', default=os.path.dirname(os.path.abspath(__file__)), help='kam uložiť WAV')
    a = ap.parse_args()
    for v in (sorted(VARIANTY) if a.vsetky else [a.variant]):
        L, R, info = zloz(v)
        cesta = os.path.join(a.adresar, info['subor'])
        uloz(cesta, L, R)
        # Momentálna hlasitosť (400 ms bloky) po sekundách – rýchla kontrola oblúka priamo zo skriptu.
        b = info['bloky']
        sek = [float(np.max(b[i * 10:(i + 1) * 10])) for i in range(int(DUR))]
        print(f"{info['subor']}: {info['popis']}")
        print(f"  I = {info['lufs']:.1f} LUFS (vlastný merač), špička = {info['spicka_dbfs']:.1f} dBFS, "
              f"úderov tepu = {info['pocet_uderov_tepu']}, úderov perkusií = {info['pocet_perkusii']} "
              f"(sila ×{VARIANTY[v]['perkusie']}), obmedzené špičkou = {info['obmedzene_spickou']}")
        print('  max. momentálna hlasitosť po sekundách (LUFS): ' + ' '.join(f'{s:.0f}' for s in sek))
        print(f'  uložené: {cesta}')


if __name__ == '__main__':
    main()
