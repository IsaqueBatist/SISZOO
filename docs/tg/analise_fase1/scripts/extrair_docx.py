# -*- coding: utf-8 -*-
"""Etapa 0 - Extracao do .docx (stdlib apenas).

Saidas em docs/tg/analise_fase1/:
  texto/blocos.json            lista ordenada de blocos (P/TBL) com estilo, texto, rIds, celulas
  texto/documento_completo.md  texto na ordem original, quadros como tabelas markdown
  quadros/quadro_NN.csv        um CSV por quadro (tabelas consecutivas consolidadas)
  quadros/quadros.json         legenda, fonte, indice dos blocos e linhas de cada quadro
  figuras/imageNN.*            midia extraida
  figuras/mapeamento_figuras.csv  Figura -> rId -> arquivo -> secao -> legenda -> Fonte -> pagina (conforme sumario)
"""
import csv, json, os, re, sys, zipfile
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCX = os.path.join(os.path.dirname(os.path.dirname(ROOT)), 'tg', 'SISZOO_versao_limpa.docx') if False else \
       os.path.normpath(os.path.join(ROOT, '..', 'SISZOO_versao_limpa.docx'))
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
PR = 'http://schemas.openxmlformats.org/package/2006/relationships'
NS = {'w': W, 'r': R, 'a': A}

for d in ['texto', 'quadros', 'figuras', 'figuras/recortes', 'figuras/transcricoes']:
    os.makedirs(os.path.join(ROOT, d), exist_ok=True)

z = zipfile.ZipFile(DOCX)

# --- midia ---
media = [n for n in z.namelist() if re.match(r'word/media/image\d+\.', n)]
for n in media:
    with open(os.path.join(ROOT, 'figuras', os.path.basename(n)), 'wb') as f:
        f.write(z.read(n))

# --- rels ---
rels = {}
for rel in ET.fromstring(z.read('word/_rels/document.xml.rels')):
    if rel.get('Target', '').startswith('media/'):
        rels[rel.get('Id')] = os.path.basename(rel.get('Target'))

# --- documento ---
doc = ET.fromstring(z.read('word/document.xml'))
body = doc.find('w:body', NS)

def para_text(p):
    out = []
    for node in p.iter():
        tag = node.tag
        if tag == f'{{{W}}}t':
            out.append(node.text or '')
        elif tag == f'{{{W}}}tab':
            out.append('\t')
        elif tag in (f'{{{W}}}br', f'{{{W}}}cr'):
            out.append('\n')
        elif tag == f'{{{W}}}sym':
            out.append('?')
    return ''.join(out)

def para_style(p):
    ps = p.find('w:pPr/w:pStyle', NS)
    return ps.get(f'{{{W}}}val') if ps is not None else None

def para_embeds(p):
    return [b.get(f'{{{R}}}embed') for b in p.iter(f'{{{A}}}blip') if b.get(f'{{{R}}}embed')]

def para_fields(p):
    return [(it.text or '').strip() for it in p.iter(f'{{{W}}}instrText')]

def table_rows(tbl):
    rows = []
    for tr in tbl.findall('w:tr', NS):
        cells = []
        for tc in tr.findall('w:tc', NS):
            txt = '\n'.join(para_text(p) for p in tc.findall('w:p', NS)).strip()
            span = tc.find('w:tcPr/w:gridSpan', NS)
            span = int(span.get(f'{{{W}}}val')) if span is not None else 1
            vm = tc.find('w:tcPr/w:vMerge', NS)
            vmerge = None if vm is None else (vm.get(f'{{{W}}}val') or 'continue')
            cells.append({'t': txt, 'span': span, 'vmerge': vmerge})
        rows.append(cells)
    return rows

def flatten(parent):
    """Percorre filhos do body, entrando em w:sdt/w:sdtContent (sumario, listas)."""
    for el in parent:
        tag = el.tag.split('}')[1]
        if tag == 'sdt':
            content = el.find('w:sdtContent', NS)
            if content is not None:
                yield from flatten(content)
        else:
            yield el

blocks = []
for el in flatten(body):
    tag = el.tag.split('}')[1]
    if tag == 'p':
        blocks.append({'i': len(blocks), 'k': 'P', 'style': para_style(el), 'text': para_text(el),
                       'embeds': para_embeds(el), 'fields': para_fields(el)})
    elif tag == 'tbl':
        rows = table_rows(el)
        emb = [b.get(f'{{{R}}}embed') for b in el.iter(f'{{{A}}}blip')]
        blocks.append({'i': len(blocks), 'k': 'TBL', 'style': None, 'rows': rows, 'embeds': emb,
                       'text': ' | '.join(c['t'] for r in rows[:1] for c in r)})
    elif tag == 'sectPr':
        pass

with open(os.path.join(ROOT, 'texto', 'blocos.json'), 'w', encoding='utf-8') as f:
    json.dump(blocks, f, ensure_ascii=False, indent=1)

# --- secao corrente para cada bloco ---
HEAD = {'2': 1, '3': 2, '4': 3}
UNSTYLED_HEAD = re.compile(r'^\s*(RESUMO|ABSTRACT|LISTA DE [A-ZÇÃÕÉ ]+|SUM[ÁA]RIO)\s*$')
section_of = []
cur = 'Pré-textual'
for b in blocks:
    if b['k'] == 'P':
        if b['style'] in HEAD and b['text'].strip():
            cur = b['text'].strip()
        elif b['style'] is None and UNSTYLED_HEAD.match(b['text']):
            cur = b['text'].strip()
    section_of.append(cur)

# --- indices do sumario / listas (pagina conforme sumario) ---
def strip_page(t):
    m = re.match(r'^(.*?)(\d{1,3})\s*$', t.strip())
    return (m.group(1).strip(), int(m.group(2))) if m else (t.strip(), None)

lista_fig_idx = next(i for i, b in enumerate(blocks) if b['k'] == 'P' and b['text'].strip() == 'LISTA DE FIGURAS')
lista_qua_idx = next(i for i, b in enumerate(blocks) if b['k'] == 'P' and b['text'].strip() == 'LISTA DE QUADROS')
intro_idx = next(i for i, b in enumerate(blocks) if b['k'] == 'P' and b['style'] == '2')
lista_figuras, lista_quadros = [], []
for i in range(lista_fig_idx + 1, lista_qua_idx):
    t = blocks[i]['text']
    if re.match(r'^\s*Figura \d+', t):
        title, pg = strip_page(t)
        lista_figuras.append({'bloco': i, 'num': int(re.match(r'^\s*Figura (\d+)', t).group(1)), 'titulo': title, 'pagina_sumario': pg, 'fields': blocks[i]['fields']})
for i in range(lista_qua_idx + 1, intro_idx):
    t = blocks[i]['text']
    if re.match(r'^\s*Quadro \d+', t):
        title, pg = strip_page(t)
        lista_quadros.append({'bloco': i, 'num': int(re.match(r'^\s*Quadro (\d+)', t).group(1)), 'titulo': title, 'pagina_sumario': pg, 'fields': blocks[i]['fields']})
# campos TOC presentes nas listas? (instrText por bloco + fldChar bruto no XML)
toc_fields = [(i, blocks[i]['fields']) for i in range(0, intro_idx) if blocks[i]['fields']]
raw = z.read('word/document.xml').decode('utf-8')
toc_fields.append(('fldChar_total', len(re.findall(r'<w:fldChar ', raw))))
toc_fields.append(('fldSimple_total', len(re.findall(r'<w:fldSimple', raw))))
toc_fields.append(('sdt_total', len(re.findall(r'<w:sdt>', raw))))
with open(os.path.join(ROOT, 'texto', 'listas_pre_textuais.json'), 'w', encoding='utf-8') as f:
    json.dump({'lista_figuras': lista_figuras, 'lista_quadros': lista_quadros, 'campos_toc': toc_fields}, f, ensure_ascii=False, indent=1)

# --- quadros (corpo) ---
CAP_Q = re.compile(r'^\s*Quadro (\d+)\s*[–\-—]\s*(.*)$')
CAP_F = re.compile(r'^\s*Figura (\d+)\s*[–\-—]\s*(.*)$')
quadros = []
i = intro_idx
while i < len(blocks):
    b = blocks[i]
    m = CAP_Q.match(b['text']) if b['k'] == 'P' else None
    if m:
        num = int(m.group(1)); titulo = m.group(2).strip()
        tabs, j, fonte = [], i + 1, None
        while j < len(blocks):
            nb = blocks[j]
            if nb['k'] == 'TBL':
                tabs.append(j)
            elif nb['k'] == 'P':
                t = nb['text'].strip()
                if t.startswith('Fonte'):
                    fonte = t; j += 1; break
                if CAP_Q.match(t) or CAP_F.match(t) or (nb['style'] in HEAD and t):
                    break
                if t and tabs:  # texto apos a tabela sem Fonte: encerra
                    break
            j += 1
        # consolidar linhas
        rows = []
        for ti in tabs:
            for r in blocks[ti]['rows']:
                rows.append([c['t'] for c in r])
        quadros.append({'num': num, 'titulo': titulo, 'bloco_legenda': i, 'blocos_tabela': tabs, 'n_tabelas': len(tabs),
                        'fonte': fonte, 'secao': section_of[i], 'linhas': rows, 'n_colunas': max((len(r) for r in rows), default=0)})
        with open(os.path.join(ROOT, 'quadros', f'quadro_{num:02d}.csv'), 'w', encoding='utf-8-sig', newline='') as f:
            w = csv.writer(f, delimiter=';')
            w.writerow([f'Quadro {num} – {titulo}'])
            for r in rows:
                w.writerow(r)
        i = j
        continue
    i += 1
with open(os.path.join(ROOT, 'quadros', 'quadros.json'), 'w', encoding='utf-8') as f:
    json.dump(quadros, f, ensure_ascii=False, indent=1)

# --- figuras (corpo): legenda ANTES da imagem (ou placeholder), "Fonte:" depois ---
figuras = []
cap_idx = [i for i in range(intro_idx, len(blocks)) if blocks[i]['k'] == 'P' and CAP_F.match(blocks[i]['text'].strip())]
for n, i in enumerate(cap_idx):
    t = blocks[i]['text'].strip()
    m = CAP_F.match(t)
    num = int(m.group(1))
    end = cap_idx[n + 1] if n + 1 < len(cap_idx) else len(blocks)
    emb, ph, fonte, fonte_idx = [], None, None, None
    for j in range(i + 1, end):
        nb = blocks[j]
        emb.extend(nb['embeds'])
        tt = nb['text'].strip() if nb['k'] == 'P' else ''
        if nb['k'] == 'P' and tt.startswith('[') and tt.endswith(']') and ph is None:
            ph = tt
        if nb['k'] == 'P' and tt.startswith('Fonte'):
            fonte, fonte_idx = tt, j
            break
        if nb['k'] == 'P' and nb['style'] in HEAD and tt:
            break
    # imagem antes da legenda? (fallback, sinalizado)
    antes = []
    if not emb and not ph:
        for j in range(i - 1, max(intro_idx, i - 4), -1):
            if blocks[j]['embeds']:
                antes = blocks[j]['embeds']; break
            if blocks[j]['k'] == 'P' and (CAP_F.match(blocks[j]['text'].strip()) or blocks[j]['text'].strip().startswith('Fonte')):
                break
    sep = re.match(r'^\s*Figura \d+\s*([–\-—])', t).group(1)
    figuras.append({'num': num, 'titulo': m.group(2).strip(), 'separador': sep, 'bloco_legenda': i, 'secao': section_of[i],
                    'rIds': emb, 'arquivos': [rels.get(r, '?') for r in emb], 'placeholder': ph, 'fonte': fonte,
                    'bloco_fonte': fonte_idx, 'imagem_antes_da_legenda': antes})

lf = {e['num']: e for e in lista_figuras}
with open(os.path.join(ROOT, 'figuras', 'mapeamento_figuras.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f, delimiter=';')
    w.writerow(['Figura', 'Separador', 'Titulo (legenda do corpo)', 'Secao', 'Bloco', 'rIds', 'Arquivos', 'Placeholder', 'Fonte',
                'Titulo na Lista de Figuras', 'Pagina (conforme sumario)'])
    for fg in figuras:
        e = lf.get(fg['num'])
        w.writerow([fg['num'], fg['separador'], fg['titulo'], fg['secao'], fg['bloco_legenda'], ','.join(fg['rIds']), ','.join(fg['arquivos']),
                    fg['placeholder'] or '', fg['fonte'] or '', e['titulo'] if e else '(ausente)', e['pagina_sumario'] if e else ''])
with open(os.path.join(ROOT, 'figuras', 'figuras.json'), 'w', encoding='utf-8') as f:
    json.dump(figuras, f, ensure_ascii=False, indent=1)

# --- documento completo em markdown ---
lines = []
qi = {q['bloco_legenda']: q for q in quadros}
skip = set()
for q in quadros:
    skip.update(q['blocos_tabela'])
for b in blocks:
    if b['i'] in skip:
        continue
    if b['k'] == 'P':
        t = b['text']
        if not t.strip() and not b['embeds']:
            continue
        pre = ''
        if b['style'] in HEAD and t.strip():
            pre = '#' * (HEAD[b['style']] + 0) + ' '
        elif b['style'] is None and UNSTYLED_HEAD.match(t):
            pre = '# '
        emb = ''.join(f' ![{r}]({rels.get(r, "?")})' for r in b['embeds'])
        lines.append(f'<!-- b{b["i"]} -->{pre}{t}{emb}')
        if b['i'] in qi:
            q = qi[b['i']]
            rows = q['linhas']
            if rows:
                nc = q['n_colunas']
                def esc(c): return c.replace('|', '\\|').replace('\n', '<br>')
                lines.append('')
                lines.append('| ' + ' | '.join(esc(c) for c in rows[0] + [''] * (nc - len(rows[0]))) + ' |')
                lines.append('|' + '---|' * nc)
                for r in rows[1:]:
                    lines.append('| ' + ' | '.join(esc(c) for c in r + [''] * (nc - len(r))) + ' |')
                lines.append('')
    else:
        # tabela sem legenda de quadro
        rows = [[c['t'] for c in r] for r in b['rows']]
        nc = max((len(r) for r in rows), default=0)
        lines.append(f'<!-- b{b["i"]} TABELA SEM LEGENDA -->')
        for r in rows:
            lines.append('| ' + ' | '.join(c.replace('|', '\\|').replace('\n', '<br>') for c in r) + ' |')
        lines.append('')
with open(os.path.join(ROOT, 'texto', 'documento_completo.md'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

# --- resumo ---
print('blocos:', len(blocks), '| tabelas:', sum(1 for b in blocks if b['k'] == 'TBL'))
print('midia extraida:', len(media), '| rels media:', len(rels))
print('quadros no corpo:', len(quadros), '| nums:', sorted(q['num'] for q in quadros) == list(range(1, 95)))
print('quadros com n_tabelas != 1:', [(q['num'], q['n_tabelas']) for q in quadros if q['n_tabelas'] != 1])
print('quadros sem Fonte:', [q['num'] for q in quadros if not q['fonte']])
print('figuras no corpo:', len(figuras), '| distintas:', len({f['num'] for f in figuras}))
print('figuras com >1 imagem ou 0 imagem e sem placeholder:', [(f['num'], f['rIds'], f['placeholder']) for f in figuras if len(f['rIds']) != 1 and not f['placeholder']])
print('figuras com imagem E placeholder:', [(f['num'], f['rIds'], f['placeholder']) for f in figuras if f['rIds'] and f['placeholder']])
print('lista figuras:', len(lista_figuras), '| lista quadros:', len(lista_quadros), '| campos TOC nas listas:', toc_fields[:4])
used = {r for f in figuras for r in f['rIds']}
print('rIds de midia nao associados a figura:', sorted(set(rels) - used, key=lambda s: int(s[3:])))
