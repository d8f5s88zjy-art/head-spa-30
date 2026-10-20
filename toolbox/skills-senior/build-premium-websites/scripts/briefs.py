#!/usr/bin/env python3
"""Bounded discovery and composition of original scenario briefs."""
import argparse
import json
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def normalize(value):
    return ''.join(c for c in unicodedata.normalize('NFKD', value.casefold()) if not unicodedata.combining(c))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    search = commands.add_parser('search')
    search.add_argument('query')
    search.add_argument('--limit', type=int, choices=range(1, 21), default=5)
    show = commands.add_parser('show')
    show.add_argument('id')
    args = parser.parse_args()
    rows = json.loads((ROOT / 'assets/catalogs/designer-briefs.json').read_text())
    if args.command == 'search':
        terms = normalize(args.query).split()
        if not terms:
            parser.error('Supply a topic or effect.')
        matches = [r for r in rows if all(t in normalize(' '.join([r['id'], r['title'], r['effect'], r['reference_name']])) for t in terms)]
        print(json.dumps(matches[:args.limit], ensure_ascii=False, indent=2))
        return
    row = next((r for r in rows if r['id'] == args.id.upper()), None)
    if row is None:
        parser.error('Unknown brief; use Z001–Z100.')
    print((ROOT / 'assets/designer-briefs/common.md').read_text())
    print((ROOT / row['path']).read_text())

if __name__ == '__main__':
    main()
