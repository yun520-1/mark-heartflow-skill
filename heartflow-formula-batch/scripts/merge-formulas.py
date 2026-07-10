#!/usr/bin/env python3
"""Merge batch formula files into HeartFlow main library.

Usage:
    python3 merge-formulas.py [formulas_dir]

Defaults to /root/.hermes/skills/heartflow/formulas
"""
import json, glob, os, datetime, sys

formulas_dir = sys.argv[1] if len(sys.argv) > 1 else '/root/.hermes/skills/heartflow/formulas'
os.chdir(formulas_dir)

# Load main library (DICT format: {metadata, formulas})
with open('formulas.json') as f:
    data = json.load(f)

main_list = data['formulas']
existing_ids = {fi['id'] for fi in main_list}
existing_formulas = {fi.get('formula', '') for fi in main_list}
print(f'Main library: {len(main_list)} formulas')

def flatten_items(obj):
    """Recursively flatten nested lists/dicts into list of formula dicts"""
    items = []
    if isinstance(obj, dict):
        if 'formula' in obj and 'id' in obj:
            items.append(obj)
        elif 'formulas' in obj:
            items.extend(flatten_items(obj['formulas']))
        elif 'data' in obj:
            items.extend(flatten_items(obj['data']))
    elif isinstance(obj, list):
        for item in obj:
            items.extend(flatten_items(item))
    return items

# Find all batch files
batch_files = sorted(
    glob.glob('formulas_*batch*.json') +
    glob.glob('formulas_*_new.json') +
    glob.glob('formulas_competition*.json')
)
print(f'Batch files: {len(batch_files)}')

total_new = 0
total_dup = 0
total_invalid = 0

for bf in batch_files:
    with open(bf) as f:
        raw = json.load(f)

    batch = flatten_items(raw)

    new_count = 0
    dup_count = 0
    inv_count = 0

    for fi in batch:
        if not isinstance(fi, dict):
            continue

        fid = fi.get('id', '')
        formula = fi.get('formula', '')

        if '=' not in formula:
            inv_count += 1
            continue

        if fid in existing_ids or formula in existing_formulas:
            dup_count += 1
            continue

        if fid in existing_ids:
            fid = f'{fid}_{len(main_list)+1}'
            fi['id'] = fid

        main_list.append(fi)
        existing_ids.add(fid)
        existing_formulas.add(formula)
        new_count += 1

    if new_count > 0 or dup_count > 0:
        print(f'  {os.path.basename(bf)}: +{new_count}, dup={dup_count}, invalid={inv_count}')
    total_new += new_count
    total_dup += dup_count
    total_invalid += inv_count

# Update metadata
data['metadata']['total_formulas'] = len(main_list)
data['metadata']['last_updated'] = datetime.date.today().isoformat()

all_cats = sorted({fi.get('category', 'unknown') for fi in main_list})
data['metadata']['categories'] = all_cats

sources = set(data['metadata'].get('sources', []))
sources.add('batch_merge')
data['metadata']['sources'] = sorted(list(sources))

with open('formulas.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

print(f'\nResult: +{total_new} new, {total_dup} dup, {total_invalid} invalid')
print(f'Total after merge: {len(main_list)}')

# Category summary
cats = {}
for fi in main_list:
    cat = fi.get('category', 'unknown')
    cats[cat] = cats.get(cat, 0) + 1

print('\nBy category:')
for k, v in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  {k}: {v}')
