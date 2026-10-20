#!/usr/bin/env python3
"""Plan bounded website work and validate evidence records, never certify a site."""
import argparse
import hashlib
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / 'assets/catalogs/acceptance-checks.json'
FLAGS = ('wants_motion', 'needs_3d_interaction', 'has_verified_model',
         'has_verified_video', 'has_verified_images', 'cms',
         'form_submission', 'commerce')
PROJECTS = {'service_site', 'product_launch', 'portfolio', 'web_app'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def finite_number(value):
    return type(value) in (int, float) and math.isfinite(value)


def read_json(path):
    def unique_pairs(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, f'Duplicate JSON key: {key}')
            result[key] = value
        return result
    return json.loads(Path(path).read_text(encoding='utf-8'),
                      object_pairs_hook=unique_pairs,
                      parse_constant=lambda x: (_ for _ in ()).throw(ValueError(f'Invalid number: {x}')))


def validate_brief(brief):
    require(isinstance(brief, dict), 'Brief must be an object')
    fields = {'schema_version', 'project_type', 'existing_stack', 'goal',
              'budget_eur', 'timeline_days', *FLAGS}
    require(set(brief) == fields, f'Brief fields must be exactly: {sorted(fields)}')
    require(type(brief['schema_version']) is int and brief['schema_version'] == 1,
            'Unsupported brief schema')
    require(brief['project_type'] in PROJECTS, 'Unknown project_type')
    require(nonempty(brief['existing_stack']) and nonempty(brief['goal']),
            'State existing_stack (or unknown) and goal')
    for name in FLAGS:
        require(type(brief[name]) is bool, f'{name} must be boolean')
    for name in ('budget_eur', 'timeline_days'):
        value = brief[name]
        require(value is None or (finite_number(value) and value > 0),
                f'{name} must be positive or null')
    return brief


def registry():
    items = read_json(REGISTRY)
    require(isinstance(items, list), 'Check registry must be an array')
    require(len({item['id'] for item in items}) == len(items), 'Duplicate registry check')
    return items


def plan(brief):
    b = validate_brief(brief)
    checks = ['truth', 'visual', 'journey', 'responsive', 'keyboard',
              'loading', 'performance', 'build', 'handoff']
    if any(b[k] for k in ('has_verified_images', 'has_verified_video', 'has_verified_model')):
        checks.append('media')
    if b['wants_motion'] or b['needs_3d_interaction']:
        checks += ['motion', 'reduced_motion']
    for flag, check in [('cms', 'cms'), ('form_submission', 'form'),
                        ('commerce', 'commerce'), ('needs_3d_interaction', 'three_d')]:
        if b[flag]:
            checks.append(check)
    missing = []
    if b['needs_3d_interaction']:
        preferred = 'interactive_3d'
        if not b['has_verified_model']:
            missing.append('Verified model and variant/part mapping required for the requested interaction')
        fallback = 'Semantic specifications and real choice controls; verified poster when available'
    elif b['wants_motion'] and b['has_verified_video']:
        preferred = 'prepared_video_with_dom'
        fallback = 'Verified poster and complete semantic content'
    elif b['has_verified_images']:
        preferred = 'photography_with_native_motion' if b['wants_motion'] else 'photography_with_dom'
        fallback = 'Complete semantic content and still photographs'
    else:
        preferred = 'semantic_dom_first'
        fallback = 'Complete semantic content; truthful empty/media states'
        missing.append('No verified imagery supplied: do not invent venue/product evidence')
    risk = []
    if b['existing_stack'].strip().lower() == 'unknown':
        risk.append('Inspect the actual stack before selecting dependencies')
    if b['timeline_days'] and b['timeline_days'] < 14 and (b['needs_3d_interaction'] or b['cms']):
        risk.append('Short schedule with asset/CMS dependencies: validate one vertical slice early')
    if b['commerce']:
        risk.append('Use the actual provider and authorized test path; animation cannot prove checkout')
    return {
        'schema_version': 1, 'kind': 'original_planning_heuristic',
        'goal': b['goal'], 'preserve_stack': b['existing_stack'],
        'media': {'preferred': preferred, 'fallback': fallback, 'missing_inputs': missing},
        'risk_notes': risk,
        'budget_note': 'Budget is a user constraint; no price, effort or commercial value is guaranteed',
        'required_checks': [item['id'] for item in registry() if item['id'] in checks],
        'sequence': ['inspect facts and assets', 'compare still compositions',
                     'complete the main journey', 'verify one signature scene',
                     'exercise content and failure states', 'review and correct', 'handoff'],
    }


def init_review(brief, build_id):
    require(nonempty(build_id), 'build_id must be nonempty')
    p = plan(brief)
    return {'schema_version': 1, 'build_id': build_id,
            'checks': [{'id': check, 'build_id': build_id, 'status': 'not_run',
                        'method': '', 'environment': '', 'observation': '', 'evidence': []}
                       for check in p['required_checks']]}


def check_review(brief, review, evidence_root, build_id):
    expected = plan(brief)['required_checks']
    require(nonempty(build_id), 'Expected build ID must be nonempty')
    require(isinstance(review, dict) and type(review.get('schema_version')) is int
            and review['schema_version'] == 1, 'Invalid review schema')
    require(isinstance(review.get('checks'), list), 'Review checks must be an array')
    root = Path(evidence_root).resolve(strict=True)
    require(root.is_dir(), 'Evidence root must be a directory')
    definitions = {x['id']: x for x in registry()}
    errors, seen = [], set()
    if review.get('build_id') != build_id:
        errors.append('Review build does not match expected build')
    for item in review['checks']:
        if not isinstance(item, dict):
            errors.append('Check must be an object')
            continue
        cid = item.get('id')
        if not isinstance(cid, str) or cid not in definitions:
            errors.append('Unknown check ID')
            continue
        if cid in seen:
            errors.append(f'{cid}: duplicate check')
        seen.add(cid)
        if cid not in expected:
            errors.append(f'{cid}: not in the selected brief; reconcile scope first')
        if item.get('build_id') != build_id:
            errors.append(f'{cid}: stale build ID')
        if item.get('status') != 'pass':
            errors.append(f'{cid}: required check is {item.get("status", "missing")}')
            continue
        if item.get('method') not in definitions[cid]['evidence_methods']:
            errors.append(f'{cid}: incompatible evidence method')
        for field in ('environment', 'observation'):
            if not nonempty(item.get(field)):
                errors.append(f'{cid}: missing {field}')
        evidence = item.get('evidence')
        if not isinstance(evidence, list) or not evidence:
            errors.append(f'{cid}: missing evidence artifacts')
            continue
        for entry in evidence:
            if not isinstance(entry, dict) or not nonempty(entry.get('path')):
                errors.append(f'{cid}: malformed evidence entry')
                continue
            relative = Path(entry['path'])
            if relative.is_absolute():
                errors.append(f'{cid}: evidence path must be relative')
                continue
            try:
                path = (root / relative).resolve(strict=True)
                if not path.is_relative_to(root):
                    errors.append(f'{cid}: evidence escapes root')
                    continue
                if not path.is_file() or path.stat().st_size == 0:
                    errors.append(f'{cid}: evidence is not a nonempty file')
                    continue
                digest = entry.get('sha256', '')
                if not isinstance(digest, str) or not re.fullmatch('[0-9a-f]{64}', digest):
                    errors.append(f'{cid}: invalid SHA-256')
                    continue
                if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
                    errors.append(f'{cid}: evidence hash mismatch')
            except (OSError, RuntimeError, ValueError):
                errors.append(f'{cid}: evidence cannot be read safely')
    for cid in expected:
        if cid not in seen:
            errors.append(f'{cid}: missing required check')
    return {'status': 'incomplete_or_inconsistent' if errors else 'record_consistent',
            'required_count': len(expected), 'errors': errors,
            'boundary': 'Validates records and local file hashes only; does not execute or authenticate checks or certify the site'}


def estimate_memory(spec):
    require(isinstance(spec, dict) and type(spec.get('schema_version')) is int
            and spec['schema_version'] == 1, 'Invalid memory schema')
    require(isinstance(spec.get('items'), list) and bool(spec['items']), 'Need memory items')
    totals, total, seen = [], 0, set()
    for item in spec['items']:
        require(isinstance(item, dict), 'Memory item must be an object')
        require(set(item) == {'id', 'width', 'height', 'bytes_per_pixel', 'count', 'mipmaps'},
                'Memory item fields must match the template')
        require(nonempty(item['id']) and item['id'] not in seen, 'Need unique memory item ID')
        seen.add(item['id'])
        for key in ('width', 'height', 'bytes_per_pixel', 'count'):
            require(type(item[key]) is int and 0 < item[key] <= 1000000,
                    f'{key} must be a bounded positive integer')
        require(type(item['mipmaps']) is bool, 'mipmaps must be boolean')
        w, h, pixels = item['width'], item['height'], 0
        while True:
            pixels += w * h
            if not item['mipmaps'] or (w == 1 and h == 1):
                break
            w, h = max(1, w // 2), max(1, h // 2)
        size = pixels * item['bytes_per_pixel'] * item['count']
        total += size
        totals.append({'id': item['id'], 'nominal_bytes': size, 'nominal_mib': round(size / 1048576, 3)})
    return {'items': totals, 'nominal_bytes': total, 'nominal_mib': round(total / 1048576, 3),
            'boundary': 'Declared decoded payload only; excludes allocator/driver overhead, unlisted buffers and compression effects'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    p = commands.add_parser('plan'); p.add_argument('brief')
    p = commands.add_parser('init-review'); p.add_argument('brief'); p.add_argument('--build', required=True)
    p = commands.add_parser('check'); p.add_argument('brief'); p.add_argument('review')
    p.add_argument('--root', required=True); p.add_argument('--build', required=True)
    p = commands.add_parser('memory'); p.add_argument('spec')
    args = parser.parse_args()
    try:
        if args.command == 'plan':
            result = plan(read_json(args.brief))
        elif args.command == 'init-review':
            result = init_review(read_json(args.brief), args.build)
        elif args.command == 'check':
            result = check_review(read_json(args.brief), read_json(args.review), args.root, args.build)
        else:
            result = estimate_memory(read_json(args.spec))
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 1 if result.get('status') == 'incomplete_or_inconsistent' else 0
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(json.dumps({'status': 'invalid_input', 'error': str(error)}, ensure_ascii=False))
        return 2


if __name__ == '__main__':
    sys.exit(main())
