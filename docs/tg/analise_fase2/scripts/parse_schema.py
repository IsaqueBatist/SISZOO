# -*- coding: utf-8 -*-
"""Reconstroi o schema final a partir das migrations Flyway (V1..V22), em ordem.
Saida: docs/tg/analise_fase2/schema_migrations.json
Cobre: CREATE TABLE (colunas, tipo, NOT NULL, DEFAULT), ALTER TABLE ADD COLUMN, DROP TABLE,
CONSTRAINT UNIQUE/CHECK/FK/PK (nomes e texto), CREATE UNIQUE INDEX, CREATE TRIGGER, INSERT seeds (codigos)."""
import json, os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # analise_fase2
REPO = os.path.abspath(os.path.join(ROOT, '..', '..', '..'))
MIG = os.path.join(REPO, 'backend', 'src', 'main', 'resources', 'db', 'migration')

def strip_comments(sql):
    return re.sub(r'--[^\n]*', '', sql)

def split_top_level(s):
    """divide por virgulas fora de parenteses"""
    parts, depth, cur = [], 0, ''
    for ch in s:
        if ch == '(': depth += 1
        if ch == ')': depth -= 1
        if ch == ',' and depth == 0:
            parts.append(cur); cur = ''
        else:
            cur += ch
    if cur.strip(): parts.append(cur)
    return [p.strip() for p in parts]

tables = {}   # name -> {'columns': {col: {...}}, 'constraints': [], 'indexes': [], 'triggers': [], 'migration': 'Vn'}
seeds = {}    # table -> list of (codigo,...)
order = []
files = sorted(glob.glob(os.path.join(MIG, 'V*__*.sql')), key=lambda p: int(re.search(r'V(\d+)__', os.path.basename(p)).group(1)))
for path in files:
    ver = re.search(r'(V\d+)__', os.path.basename(path)).group(1)
    sql = strip_comments(open(path, encoding='utf-8').read())
    # CREATE TABLE
    for m in re.finditer(r'CREATE TABLE (\w+)\s*\((.*?)\);', sql, flags=re.S):
        name, body = m.group(1), m.group(2)
        t = {'columns': {}, 'constraints': [], 'indexes': [], 'triggers': [], 'migration': ver}
        for part in split_top_level(body):
            if re.match(r'CONSTRAINT', part, flags=re.I):
                t['constraints'].append(re.sub(r'\s+', ' ', part))
            else:
                cm = re.match(r'(\w+)\s+([a-z]+(?:\([^)]*\))?)(.*)', part, flags=re.S)
                if cm:
                    col, typ, rest = cm.group(1), cm.group(2), cm.group(3)
                    t['columns'][col] = {'tipo': typ, 'not_null': 'NOT NULL' in rest.upper(), 'default': (re.search(r'DEFAULT\s+([^\s,]+(?:\([^)]*\))?)', rest, flags=re.I) or [None, None])[1] if re.search(r'DEFAULT', rest, flags=re.I) else None, 'migration': ver}
        tables[name] = t; order.append(name)
    # ALTER TABLE ... ADD COLUMN / ADD CONSTRAINT / DROP CONSTRAINT
    for m in re.finditer(r'ALTER TABLE (\w+)\s+(.*?);', sql, flags=re.S):
        name, body = m.group(1), m.group(2)
        if name not in tables: continue
        for part in split_top_level(body):
            am = re.match(r'ADD COLUMN\s+(\w+)\s+([a-z]+(?:\([^)]*\))?)(.*)', part, flags=re.S | re.I)
            if am:
                col, typ, rest = am.group(1), am.group(2), am.group(3)
                tables[name]['columns'][col] = {'tipo': typ, 'not_null': 'NOT NULL' in rest.upper(), 'default': None, 'migration': ver}
                continue
            if re.match(r'ADD CONSTRAINT', part, flags=re.I):
                tables[name]['constraints'].append(re.sub(r'\s+', ' ', part) + f' [{ver}]')
            elif re.match(r'DROP CONSTRAINT', part, flags=re.I):
                tables[name]['constraints'].append(re.sub(r'\s+', ' ', part) + f' [{ver}]')
    for m in re.finditer(r'DROP TABLE IF EXISTS (\w+)', sql):
        tables.pop(m.group(1), None)
        tables.setdefault('_removidas', {}).setdefault('lista', []).append(f'{m.group(1)} [{ver}]')
    for m in re.finditer(r'CREATE (UNIQUE )?INDEX (\w+) ON (\w+)\s*\(([^)]*)\)(\s*WHERE[^;]*)?;', sql):
        if m.group(3) in tables:
            tables[m.group(3)]['indexes'].append(f'{"UNIQUE " if m.group(1) else ""}{m.group(2)} ({m.group(4).strip()}){(m.group(5) or "").strip()} [{ver}]')
    for m in re.finditer(r'CREATE (?:CONSTRAINT )?TRIGGER (\w+)\s+(.*?)\s+ON (\w+)', sql, flags=re.S):
        if m.group(3) in tables:
            tables[m.group(3)]['triggers'].append(f'{m.group(1)} {re.sub(chr(10), " ", m.group(2))[:60]} [{ver}]')
    for m in re.finditer(r'INSERT INTO (\w+)\s*\(([^)]*)\)\s*VALUES\s*(.*?)(?:ON CONFLICT[^;]*)?;', sql, flags=re.S):
        tbl, cols, vals = m.group(1), [c.strip() for c in m.group(2).split(',')], m.group(3)
        rows = re.findall(r'\(([^()]*)\)', vals)
        for r in rows:
            vs = [v.strip().strip("'") for v in split_top_level(r)]
            seeds.setdefault(tbl, []).append(dict(zip(cols, vs)))

out = {'tabelas': {k: v for k, v in tables.items() if k != '_removidas'}, 'removidas': tables.get('_removidas', {}).get('lista', []), 'seeds': seeds, 'ordem': [t for t in order if t in tables]}
json.dump(out, open(os.path.join(ROOT, 'schema_migrations.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('tabelas:', len(out['tabelas']), '| removidas:', out['removidas'])
for k, v in out['tabelas'].items():
    print(f"{k}: {len(v['columns'])} colunas; triggers={len(v['triggers'])}")
