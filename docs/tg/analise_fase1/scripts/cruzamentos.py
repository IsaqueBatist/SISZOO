# -*- coding: utf-8 -*-
"""Etapa 2 - cruzamentos mecanicos a partir de texto/blocos.json e quadros/quadros.json.
Saida: texto/cruzamentos_automaticos.json e impressao em tela."""
import json, os, re, sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = json.load(open(os.path.join(ROOT, 'texto', 'blocos.json'), encoding='utf-8'))
Q = {q['num']: q for q in json.load(open(os.path.join(ROOT, 'quadros', 'quadros.json'), encoding='utf-8'))}
F = json.load(open(os.path.join(ROOT, 'figuras', 'figuras.json'), encoding='utf-8'))
L = json.load(open(os.path.join(ROOT, 'texto', 'listas_pre_textuais.json'), encoding='utf-8'))
out = {}

def tbl_text(q):
    return ' '.join(c for r in q['linhas'] for c in r)

intro = next(i for i, b in enumerate(B) if b['k'] == 'P' and b['style'] == '2')
ref_idx = next(i for i, b in enumerate(B) if b['k'] == 'P' and b['text'].strip() == 'REFERÊNCIAS')
apA_idx = next(i for i, b in enumerate(B) if b['k'] == 'P' and b['text'].strip().startswith('APÊNDICE A'))
apC_idx = next(i for i, b in enumerate(B) if b['k'] == 'P' and b['text'].strip().startswith('APÊNDICE C'))
apD_idx = next(i for i, b in enumerate(B) if b['k'] == 'P' and b['text'].strip().startswith('APÊNDICE D'))

# ---------- 1. RF / RNF / RN ----------
rf = {}
for n in range(6, 11):
    for r in Q[n]['linhas'][1:]:
        rf[r[0].strip()] = {'nome': r[1], 'descricao': r[2], 'prioridade': r[3], 'quadro': n}
rnf = {r[0].strip(): {'categoria': r[1], 'nome': r[2], 'descricao': r[3]} for r in Q[12]['linhas'][1:]}
rn = {r[0].strip(): {'regra': r[1], 'descricao': r[2]} for r in Q[13]['linhas'][1:]}
out['rf_ids'] = sorted(rf); out['rnf_ids'] = sorted(rnf); out['rn_ids'] = sorted(rn)
prefix_mod = Counter((k.split('-')[1][0], rf[k]['quadro']) for k in rf)
out['rf_prefixo_por_quadro'] = {f'{p}->Quadro {q}': c for (p, q), c in prefix_mod.items()}

# ---------- 2. Casos de uso (Quadros 16-51) ----------
uc = {}
for n in range(16, 52):
    rows = Q[n]['linhas']
    nome = rows[0][0].strip()
    d = {'quadro': n, 'nome': nome}
    for r in rows:
        if len(r) >= 2 and r[0].strip() in ('Caso de Uso Geral', 'Ator Principal', 'Atores Secundários', 'Resumo', 'Pré-Condições', 'Pós-Condições', 'Restrições/Validações', 'Requisitos relacionados') or r[0].strip().startswith('Fluxo Alternativo'):
            d[r[0].strip()] = r[1].strip()
    d['texto'] = tbl_text(Q[n])
    d['rf'] = sorted(set(re.findall(r'RF-[A-E]\d{2}', d['texto'])))
    d['rn'] = sorted(set(re.findall(r'RN\d{2}', d['texto'])))
    d['rnf'] = sorted(set(re.findall(r'RNF\d{2}', d['texto'])))
    uc[nome] = d
out['uc'] = {k: {kk: vv for kk, vv in v.items() if kk != 'texto'} for k, v in uc.items()}
# RF sem UC / UC sem RF (campo "Requisitos relacionados")
rf_cobertos = defaultdict(list)
for k, v in uc.items():
    for r in re.findall(r'RF-[A-E]\d{2}', v.get('Requisitos relacionados', '')):
        rf_cobertos[r].append(k)
out['rf_sem_uc'] = sorted(set(rf) - set(rf_cobertos))
out['rf_para_uc'] = {k: v for k, v in sorted(rf_cobertos.items())}
out['uc_sem_rf'] = [k for k, v in uc.items() if not re.findall(r'RF-[A-E]\d{2}', v.get('Requisitos relacionados', ''))]
out['rf_referenciados_inexistentes'] = sorted({r for v in uc.values() for r in v['rf']} - set(rf))

# ---------- 3. RN referenciadas em todo o documento ----------
alltext = ' '.join(b['text'] for b in B) + ' ' + ' '.join(tbl_text(q) for q in Q.values())
out['rn_referenciadas'] = sorted(set(re.findall(r'\bRN\d{2}\b', alltext)))
out['rn_referenciadas_inexistentes'] = sorted(set(re.findall(r'\bRN\d{2}\b', alltext)) - set(rn))
out['rn_nunca_referenciadas_fora_quadro13'] = sorted(set(rn) - set(re.findall(r'\bRN\d{2}\b', ' '.join(b['text'] for b in B) + ' '.join(tbl_text(q) for n, q in Q.items() if n != 13))))
out['rnf_referenciadas_inexistentes'] = sorted(set(re.findall(r'\bRNF\d{2}\b', alltext)) - set(rnf))
out['rnf_nunca_referenciadas_fora_quadro12'] = sorted(set(rnf) - set(re.findall(r'\bRNF\d{2}\b', ' '.join(b['text'] for b in B) + ' '.join(tbl_text(q) for n, q in Q.items() if n != 12))))
out['rf_nunca_referenciados_fora_quadros6a10'] = sorted(set(rf) - set(re.findall(r'RF-[A-E]\d{2}', ' '.join(b['text'] for b in B) + ' '.join(tbl_text(q) for n, q in Q.items() if n not in range(6, 11)))))

# ---------- 4. Telas (Quadro 15) ----------
telas = {}
for r in Q[15]['linhas'][1:]:
    telas[r[0].strip()] = {'nome': r[1], 'perfis': r[2], 'req': r[3], 'substitui': r[4]}
out['telas_quadro15'] = sorted(telas)
telas_fig = sorted(set(re.findall(r'Tela (T\d{2})', ' '.join(f['titulo'] for f in F))))
out['telas_em_figuras'] = telas_fig
out['telas_figura_sem_quadro15'] = sorted(set(telas_fig) - set(telas))
out['telas_quadro15_sem_figura'] = sorted(set(telas) - set(telas_fig))

# ---------- 5. Figuras/quadros: citacao antes da aparicao, numeracao, Fonte ----------
def first_mention(kind, num):
    pat = re.compile(rf'\b{kind}s? (?:\d+ (?:a|e|,) )*{num}\b')
    for i in range(intro, len(B)):
        if B[i]['k'] == 'P' and pat.search(B[i]['text']) and not re.match(rf'^\s*{kind} {num}\s*[–\-—]', B[i]['text']):
            return i
        if B[i]['k'] == 'TBL' and pat.search(tbl_text({'linhas': [[c['t'] for c in r] for r in B[i]['rows']]})):
            return i
    return None
cit = {}
for q in Q.values():
    fm = first_mention('Quadro', q['num'])
    cit[f'Quadro {q["num"]}'] = {'legenda': q['bloco_legenda'], 'primeira_citacao': fm, 'citado_antes': (fm is not None and fm < q['bloco_legenda']), 'citado': fm is not None}
for f in F:
    fm = first_mention('Figura', f['num'])
    key = f'Figura {f["num"]} (bloco {f["bloco_legenda"]})'
    cit[key] = {'legenda': f['bloco_legenda'], 'primeira_citacao': fm, 'citado_antes': (fm is not None and fm < f['bloco_legenda']), 'citado': fm is not None}
out['nao_citados_antes'] = [k for k, v in cit.items() if not v['citado_antes']]
out['nunca_citados'] = [k for k, v in cit.items() if not v['citado']]
out['figuras_duplicadas'] = [n for n, c in Counter(f['num'] for f in F).items() if c > 1]
out['figuras_separador_hifen'] = [f['num'] for f in F if f['separador'] != '–']
lf = {e['num']: e for e in L['lista_figuras']}
out['lista_figuras_entradas'] = len(L['lista_figuras'])
out['lista_figuras_ausentes'] = sorted({f['num'] for f in F} - set(lf))
out['lista_figuras_titulo_divergente'] = []
for f in F:
    e = lf.get(f['num'])
    if e and re.sub(r'\s+', ' ', e['titulo']).strip() != re.sub(r'\s+', ' ', f'Figura {f["num"]} – {f["titulo"]}').strip():
        out['lista_figuras_titulo_divergente'].append({'num': f['num'], 'lista': e['titulo'], 'legenda': f'Figura {f["num"]} {f["separador"]} {f["titulo"]}', 'secao': f['secao']})
lq = {e['num']: e for e in L['lista_quadros']}
out['lista_quadros_titulo_divergente'] = [{'num': q['num'], 'lista': lq[q['num']]['titulo'], 'legenda': f'Quadro {q["num"]} – {q["titulo"]}'} for q in Q.values() if q['num'] in lq and re.sub(r'\s+', ' ', lq[q['num']]['titulo']).strip() != re.sub(r'\s+', ' ', f'Quadro {q["num"]} – {q["titulo"]}').strip()]
out['fonte_sem_ponto_final'] = [(i, B[i]['text'].strip()) for i in range(intro, len(B)) if B[i]['k'] == 'P' and B[i]['text'].strip().startswith('Fonte') and not B[i]['text'].strip().endswith('.')]
out['placeholders'] = [(i, B[i]['text'].strip()) for i in range(0, len(B)) if B[i]['k'] == 'P' and re.search(r'\[[A-ZÇÃÕÉÍÓÚÂÊ][^\]]{8,}\]', B[i]['text'])]
out['sumario_texto'] = [B[i]['text'] for i in range(0, intro) if 'table of contents' in B[i]['text'].lower()]

# ---------- 6. Citacoes x referencias ----------
refs = [B[i]['text'].strip() for i in range(ref_idx + 1, apA_idx) if B[i]['k'] == 'P' and B[i]['text'].strip()]
out['n_referencias'] = len(refs)
# chave de cada referencia: autor (maiusculas iniciais) + ano
def ref_key(r):
    m = re.match(r'^([A-ZÀ-Ú][A-ZÀ-Ú\s\.\-]+?)(?:\s*\(.*?\))?[\.,]', r)
    autor = m.group(1).strip() if m else r[:30]
    anos = re.findall(r'\b((?:\[)?(?:19|20)\d{2}[a-d]?(?:\])?)\b', r)
    return autor, anos
ref_keys = [(ref_key(r), r[:80]) for r in refs]
out['referencias_chaves'] = [f'{a} | {",".join(y)} | {t}' for (a, y), t in ref_keys]
# citacoes no corpo (ate o inicio das referencias) + apendices A/B (sem transcricao C)
corpo = ' '.join(B[i]['text'] for i in range(intro, ref_idx)) + ' ' + ' '.join(tbl_text(q) for q in Q.values())
cits = set()
for m in re.finditer(r'\(([^()]{3,120}?,\s*\[?(?:19|20)\d{2}[a-d]?\]?(?:;[^()]*)?)\)', corpo):
    for part in m.group(1).split(';'):
        part = part.strip()
        mm = re.match(r'^([A-ZÀ-Ú][^,]+?)(?:\s+et al\.)?,\s*(\[?(?:19|20)\d{2}[a-d]?\]?)', part)
        if mm:
            cits.add((mm.group(1).strip().upper(), mm.group(2)))
# citacoes narrativas "Autor (ano)" e "Autor (ano; ano)"
for m in re.finditer(r'\b([A-ZÀ-Ú][a-zà-ú]+(?: (?:e|;) [A-ZÀ-Ú][a-zà-ú]+)*) \(((?:\[?(?:19|20)\d{2}[a-d]?\]?)(?:;\s*\[?(?:19|20)\d{2}[a-d]?\]?)*)\)', corpo):
    for y in m.group(2).split(';'):
        cits.add((m.group(1).upper(), y.strip()))
# Fonte do Quadro 1: "Brasil (2016; 2023; ...)" e "São Paulo (2026)"
out['citacoes_encontradas'] = sorted(f'{a} {y}' for a, y in cits)
ref_norm = [(a.upper(), set(y.strip('[]') for y in ys)) for (a, ys), _ in ref_keys]
def ref_match(a, y):
    y0 = y.strip('[]')
    for ra, rys in ref_norm:
        if (ra.startswith(a.split(';')[0].strip()) or a.split(';')[0].strip() in ra) and y0 in rys:
            return True
    return False
out['citacoes_sem_referencia'] = sorted(f'{a} {y}' for a, y in cits if not ref_match(a, y))
cited_refs = set()
for a, y in cits:
    for idx, (ra, rys) in enumerate(ref_norm):
        if (ra.startswith(a.split(';')[0].strip()) or a.split(';')[0].strip() in ra) and y.strip('[]') in rys:
            cited_refs.add(idx)
out['referencias_nao_citadas'] = [ref_keys[i][1] for i in range(len(ref_keys)) if i not in cited_refs]

# ---------- 7. Nomes de modulos (variacoes) ----------
mods = Counter(m.strip() for m in re.findall(r'M[óo]dulo \d\s*[–\-:]\s*[A-ZÁ-Ú][^\.\(\);\n\t|]{3,60}', alltext))
out['variacoes_nome_modulo'] = {k: v for k, v in mods.most_common()}

# ---------- 8. Dicionario de dados: tabelas, enums ----------
dic = {}
for n in range(52, 95):
    tab = Q[n]['titulo'].split('tabela')[-1].strip()
    dic[tab] = {'quadro': n, 'campos': [{'campo': r[0], 'tipo': r[1], 'chave': r[2], 'descricao': r[3]} for r in Q[n]['linhas'][1:]]}
out['dicionario_tabelas'] = sorted(dic)
enums = Counter(c['tipo'] for t in dic.values() for c in t['campos'] if re.match(r'^[A-Z][A-Za-z]+$', c['tipo']))
out['dicionario_enums'] = dict(enums)
out['dicionario_grafias_criado_em'] = sorted({c['campo'] for t in dic.values() for c in t['campos'] if re.search(r'cria|modific|atualiz', c['campo'])})

json.dump(out, open(os.path.join(ROOT, 'texto', 'cruzamentos_automaticos.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump({'rf': rf, 'rnf': rnf, 'rn': rn, 'uc': out['uc'], 'telas': telas, 'dicionario': dic}, open(os.path.join(ROOT, 'texto', 'inventario_bruto_quadros.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for k, v in out.items():
    if k in ('uc', 'referencias_chaves', 'citacoes_encontradas'):
        continue
    print(f'== {k}:', json.dumps(v, ensure_ascii=False)[:1500])
