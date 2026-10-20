#!/usr/bin/env python3
"""Kontrola štruktúry JSON schém a overenie vzorových výstupov (len štandardná knižnica).

Použitie: python3 -I kontrola_schem.py schemy.json priklady.json
- štruktúra: každé `required` je v `properties`, `enum` nie je prázdny, typy sú platné, minItems <= maxItems
- príklady: {"NAZOV_SCHEMY": {"platne": [...], "neplatne": [...]}}; platné musia prejsť, neplatné zlyhať
- skúška výstupu agenta: daj jeho JSON ako jediný platný príklad schémy
Kód 0 = všetko sedí, 1 = chyba v schéme alebo príklade, 2 = zlé argumenty alebo nečitateľný súbor.
Vzniklo pri rozbore Agency Agents (V5, 2026-10-19); schémy roly 9 a eskalácie sú v ../assets/.
"""
import json
import sys

TYPY = {"object", "array", "string", "integer", "number", "boolean", "null"}


def struktura(s, cesta, chyby):
    t = s.get("type")
    if t not in TYPY:
        chyby.append(f"{cesta}: neplatný type {t!r}")
    if "enum" in s and not s["enum"]:
        chyby.append(f"{cesta}: prázdny enum")
    if t == "object":
        props = s.get("properties", {})
        for r in s.get("required", []):
            if r not in props:
                chyby.append(f"{cesta}: required {r!r} nie je v properties")
        for k, v in props.items():
            struktura(v, f"{cesta}.{k}", chyby)
    if t == "array":
        if "items" not in s:
            chyby.append(f"{cesta}: pole bez items")
        else:
            struktura(s["items"], f"{cesta}[]", chyby)
        if "minItems" in s and "maxItems" in s and s["minItems"] > s["maxItems"]:
            chyby.append(f"{cesta}: minItems > maxItems")


def over(s, x, cesta, chyby):
    t = s["type"]
    ok = {
        "object": isinstance(x, dict), "array": isinstance(x, list), "string": isinstance(x, str),
        "integer": isinstance(x, int) and not isinstance(x, bool), "boolean": isinstance(x, bool),
        "number": isinstance(x, (int, float)) and not isinstance(x, bool), "null": x is None,
    }[t]
    if not ok:
        chyby.append(f"{cesta}: očakávaný typ {t}")
        return
    if "enum" in s and x not in s["enum"]:
        chyby.append(f"{cesta}: {x!r} nie je v enum")
    if t in ("integer", "number"):
        if "minimum" in s and x < s["minimum"]:
            chyby.append(f"{cesta}: {x} je pod minimom {s['minimum']}")
        if "maximum" in s and x > s["maximum"]:
            chyby.append(f"{cesta}: {x} je nad maximom {s['maximum']}")
    if t == "object":
        for r in s.get("required", []):
            if r not in x:
                chyby.append(f"{cesta}: chýba {r}")
        for k, v in x.items():
            if k in s.get("properties", {}):
                over(s["properties"][k], v, f"{cesta}.{k}", chyby)
    if t == "array":
        if "minItems" in s and len(x) < s["minItems"]:
            chyby.append(f"{cesta}: počet položiek {len(x)} je pod minimom {s['minItems']}")
        if "maxItems" in s and len(x) > s["maxItems"]:
            chyby.append(f"{cesta}: počet položiek {len(x)} je nad maximom {s['maxItems']}")
        for i, v in enumerate(x):
            over(s["items"], v, f"{cesta}[{i}]", chyby)


def main():
    if len(sys.argv) != 3:
        print("použitie: python3 -I kontrola_schem.py schemy.json priklady.json", file=sys.stderr)
        sys.exit(2)
    try:
        with open(sys.argv[1], encoding="utf-8") as f:
            schemy = json.load(f)
        with open(sys.argv[2], encoding="utf-8") as f:
            priklady = json.load(f)
    except (OSError, ValueError) as e:
        print(f"súbor sa nedá prečítať: {e}", file=sys.stderr)
        sys.exit(2)
    zle = 0
    for meno, s in schemy.items():
        chyby = []
        struktura(s, meno, chyby)
        print(f"{meno}: štruktúra {'OK' if not chyby else 'CHYBA'}")
        for c in chyby:
            print("   ", c)
        zle += bool(chyby)
        p = priklady.get(meno, {})
        for i, x in enumerate(p.get("platne", [])):
            ch = []
            over(s, x, meno, ch)
            print(f"   platný príklad {i + 1}: {'prešiel' if not ch else 'ZLYHAL ' + '; '.join(ch)}")
            zle += bool(ch)
        for i, x in enumerate(p.get("neplatne", [])):
            ch = []
            over(s, x, meno, ch)
            print(f"   neplatný príklad {i + 1}: {'správne odmietnutý (' + ch[0] + ')' if ch else 'CHYBNE PREŠIEL'}")
            zle += not ch
        if not p:
            print("   bez príkladov")
            zle += 1
    sys.exit(1 if zle else 0)


if __name__ == "__main__":
    main()
