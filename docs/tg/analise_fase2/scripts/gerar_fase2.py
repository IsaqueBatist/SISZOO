# -*- coding: utf-8 -*-
"""Fase 2 — gera matriz_rastreabilidade.csv, decisoes_pendentes.md e relatorio_fase2.md.
Entradas: ../analise_fase1/inventario_especificacao.json, ../analise_fase1/achados_fase1.csv,
          ../schema_migrations.json, dados_fase2_a.py, dados_fase2_b.py.
Execução: py -3 docs/tg/analise_fase2/scripts/gerar_fase2.py
"""
import csv, json, os, re, sys, io
from collections import Counter, OrderedDict, defaultdict

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                       # analise_fase2
F1 = os.path.join(os.path.dirname(ROOT), 'analise_fase1')
sys.path.insert(0, HERE)
from dados_fase2_a import LINHAS_A, R, SVC, MIG, FE
from dados_fase2_b import (LINHAS_B, MAPA_ENTIDADES, MAPA_COLUNAS, AUSENTES, EXTRAS_JUST, TABELAS_SO_CODIGO, RESOLUCAO_F1)

inv = json.load(open(os.path.join(F1, 'inventario_especificacao.json'), encoding='utf-8'))
schema = json.load(open(os.path.join(ROOT, 'schema_migrations.json'), encoding='utf-8'))
achados = list(csv.DictReader(open(os.path.join(F1, 'achados_fase1.csv'), encoding='utf-8-sig'), delimiter=';'))
TABELAS = schema['tabelas']
DATA = '22/10/2026'
COMMIT = 'b3ce1de'

# ------------------------------------------------------------------ utilidades
def base_tipo(t):
    t = (t or '').strip()
    low = t.lower()
    if t and t[0].isupper():
        return 'enum'
    m = re.match(r'([a-z]+)', low)
    b = m.group(1) if m else low
    if b in ('smallint', 'integer', 'bigint', 'int'):
        return 'int'
    if b in ('timestamptz',):
        return 'timestamp'
    if b in ('text',):
        return 'varchar'
    return b

def tem_unique(tabela, coluna):
    t = TABELAS[tabela]
    alvo = f'({coluna})'
    for c in t['constraints']:
        if 'UNIQUE' in c and alvo in c.replace(' ', ''):
            return True
    for i in t['indexes']:
        if i.startswith('UNIQUE') and alvo in i.replace(' ', ''):
            return True
    return False

def entidade_inventario(nome):
    for pm in inv['por_modulo']:
        ec = pm['entidades_consolidadas']
        if nome in ec:
            return pm['modulo'], ec[nome]
    return None, None

def mod_label(n):
    return f'M{n}' if n else 'Geral'

# ------------------------------------------------------------------ linhas automáticas: entidades e atributos
ENT_ROWS, ATTR_ROWS, EXTRA_ROWS = [], [], []
colunas_cobertas = defaultdict(set)   # tabela -> colunas do código referenciadas por algum campo do documento
ESF_AUSENTE = {'Adocao': 'G', 'Exame': 'G', 'TipoExame': 'G', 'AnexoExame': 'G', 'AnexoAnimal': 'G', 'AnexoVacinacao': 'G',
               'AnexoProcedimento': 'G', 'DocumentoProcesso': 'G', 'TipoDocumentoProcesso': 'G', 'VacinaEspecie': 'M',
               'AnimalSintoma': 'M', 'Sessao': 'P'}
F1_ENT = {'Sessao': 'F1-023', 'Adocao': 'F1-024; F1-006', 'Baia': 'F1-025', 'AmostraAnimal': 'F1-032', 'CargoPermissao': 'F1-035',
          'AuditoriaEvento': 'F1-037', 'Usuario': 'F1-028', 'PreferenciaUsuario': 'F1-029; F1-021', 'Ocorrencia': 'F1-027; F1-031',
          'ProcessoSanitario': 'F1-027; F1-030; F1-015', 'Exame': 'F1-017; F1-026', 'DocumentoProcesso': 'F1-018', 'RelatorioGerado': 'F1-039',
          'VacinaEspecie': 'F1-026', 'AnimalSintoma': 'F1-026', 'AnexoAnimal': 'F1-026', 'AnexoVacinacao': 'F1-026', 'AnexoProcedimento': 'F1-026',
          'TipoExame': 'F1-026', 'AnexoExame': 'F1-026', 'Denunciante': 'F1-031', 'Denunciado': 'F1-031', 'ResponsavelProcesso': 'F1-030'}

for nome, (tabela, mig, jpa, obs) in MAPA_ENTIDADES.items():
    modn, ent = entidade_inventario(nome)
    mod = mod_label(modn)
    dic = (ent or {}).get('dicionario') or {}
    campos = dic.get('campos', [])
    origem = dic.get('origem') or ('Figura 7 / Figura 12 (DER e lógico M1)' if nome == 'Sessao' else 'Apêndice B')
    f1 = F1_ENT.get(nome, '')
    if tabela is None:
        if nome == 'Sessao':
            logico = inv['por_modulo'][0]['diagrama_logico']['tabelas'].get('Sessao', [])
            ENT_ROWS.append(R('Entidade', mod, f'Entidade {nome}', origem, 'Sessao: ' + ', '.join(logico),
                              f'{MIG}/V2__schema_usuarios.sql (cria sessao); {MIG}/V8__remove_tabela_sessao.sql (DROP TABLE); {SVC}/comum/config/SecurityConfig.java:39 (STATELESS)',
                              'Tabela removida na V8; sessão não persistida (JWT stateless).', 'SÓ NO DOCUMENTO', 'FATO', f1, 'ATUALIZAR_DOC',
                              'Resolve F1-023: a versão stateless (texto, dicionário, classes) é a do código. Remover Sessao do DER (Fig. 7) e do lógico (Fig. 12).', 'P', 'Baixo', 'Figura 7; Figura 12', '—'))
            continue
        esf = ESF_AUSENTE.get(nome, 'G')
        dec = 'REMOVER_DO_DOC'
        just = f'Entidade sem tabela, entidade JPA, DTO ou tela ({obs}). Esforço de implementação {esf}; critério 3: mover para Trabalhos futuros.' + (' Decisão final na linha RF-A05 (DECISAO_AUTORES).' if nome == 'Adocao' else '')
        ENT_ROWS.append(R('Entidade', mod, f'Entidade {nome}', origem, f'{len(campos)} atributos no dicionário: ' + ', '.join(c['campo'] for c in campos),
                          f'Buscas "{nome}|{re.sub(r"(?<!^)(?=[A-Z])", "_", nome).lower()}" em backend/src/main e frontend/src → nenhuma tabela/classe/endpoint (ver relatorio_fase2.md §Autoverificação)',
                          'Não existe.', 'SÓ NO DOCUMENTO', 'FATO', f1, dec, just, esf, 'Baixo' if esf != 'G' else 'Médio', f'{origem.split(" (")[0]}; DER/lógico/classes do módulo', '—'))
        for c in campos:
            ATTR_ROWS.append(R('Atributo', mod, f'{nome}.{c["campo"]}', origem, f'{c["campo"]} {c["tipo"]} {c.get("chave","")}'.strip(),
                               f'Entidade {nome} inexistente no código', '—', 'SÓ NO DOCUMENTO', 'FATO', f1, dec, f'Segue a decisão da entidade {nome}.', esf, 'Baixo', origem.split(' (')[0], '—'))
        continue

    # entidade existente
    t = TABELAS[tabela]
    mapa = MAPA_COLUNAS.get(nome, {})
    faltantes, divergentes = [], []
    for c in campos:
        campo, tipo_doc, chave = c['campo'], c['tipo'], (c.get('chave') or '')
        alvo = mapa.get(campo, campo if campo in t['columns'] else (campo + '_id' if campo + '_id' in t['columns'] else None))
        if campo in mapa and mapa[campo] is None:
            alvo = None
        trecho_doc = f'{campo} {tipo_doc}{(" " + chave) if chave else ""}'
        if alvo is None:
            termos, dec, just, esf = AUSENTES.get((nome, campo), (f'busca "{campo}" em migrations/entidades → 0', 'ATUALIZAR_DOC', 'Coluna não existe; remover do dicionário/lógico.', 'P'))
            faltantes.append(campo)
            ATTR_ROWS.append(R('Atributo', mod, f'{nome}.{campo}', origem, trecho_doc, f'{MIG}/{mig.split(" ")[0]} (tabela {tabela} sem a coluna); {termos}', 'Coluna ausente.',
                               'SÓ NO DOCUMENTO', 'FATO', f1 if campo in ('data_validade', 'status', 'url_expira_em') else '', dec, just, esf, 'Baixo', origem.split(' (')[0], '—'))
            continue
        if isinstance(alvo, tuple):
            outra = alvo[1]
            tb, col = outra.split('.')
            colunas_cobertas[tb].add(col)
            divergentes.append(campo)
            ATTR_ROWS.append(R('Atributo', mod, f'{nome}.{campo}', origem, trecho_doc, f'{MIG}/{mig.split(" ")[0]}: FK está em {outra} (UNIQUE)', f'{outra} uuid NOT NULL UNIQUE → relação 1:0..1 (ou 1:1) modelada no filho.',
                               'PARCIAL', 'FATO', f1, 'ATUALIZAR_DOC', 'Direção da FK invertida em relação ao documento; semântica equivalente. Critério 4: alinhar lógico/dicionário ao código.', 'P', 'Baixo', origem.split(' (')[0] + '; Figura lógica do módulo', '—'))
            continue
        colunas_cobertas[tabela].add(alvo)
        cc = t['columns'][alvo]
        tcod = f'{alvo} {cc["tipo"]}{" NOT NULL" if cc["not_null"] else ""}'
        bd, bc = base_tipo(tipo_doc), base_tipo(cc['tipo'])
        notas, status = [], 'CONFORME'
        if alvo != campo:
            notas.append(f'renomeado ({campo} → {alvo})')
        if bd == 'enum' and alvo.endswith('_id'):
            status = 'PARCIAL'; notas.append('enum do documento é catálogo em tabela no código (FK)')
        elif bd == 'enum' and bc == 'varchar':
            notas.append('enum como varchar + CHECK')
        elif bd != bc:
            status = 'PARCIAL'; notas.append(f'tipo difere ({tipo_doc} × {cc["tipo"]})')
        elif tipo_doc.lower() != cc['tipo'].lower() and bd in ('varchar', 'int', 'decimal', 'timestamp'):
            notas.append(f'tamanho/precisão difere ({tipo_doc} × {cc["tipo"]})')
        if 'UQ' in chave and not tem_unique(tabela, alvo):
            status = 'PARCIAL'; notas.append('UQ do documento não existe no código')
        if 'FK' in chave and not any(f'({alvo})' in c.replace(' ', '') and 'FOREIGN' in c for c in t['constraints']) and not alvo.endswith('_id'):
            notas.append('FK do documento não encontrada como constraint')
        cat_cod = alvo.endswith('_id') and bd == 'enum'
        just = ('Conforme.' if status == 'CONFORME' and not notas else
                ('Conforme com diferença de representação: ' + '; '.join(notas) + '.' if status == 'CONFORME' else
                 'Critério 4 (nomenclatura/tipo): alinhar dicionário e lógico ao código — ' + '; '.join(notas) + '.'))
        if status != 'CONFORME':
            divergentes.append(campo)
        ATTR_ROWS.append(R('Atributo', mod, f'{nome}.{campo}', origem, trecho_doc, f'{MIG}/{cc["migration"]}__*.sql ({tabela}.{alvo}); {SVC}/{jpa}' if jpa else f'{MIG}/{cc["migration"]}__*.sql ({tabela}.{alvo})',
                           tcod, status, 'FATO', '', 'ATUALIZAR_DOC', just, 'P', 'Baixo', origem.split(' (')[0] if status != 'CONFORME' or notas else '—', '—'))
    # linha da entidade
    extras = [c for c in t['columns'] if c not in colunas_cobertas[tabela] and c != 'id']
    st = 'CONFORME' if not faltantes and not divergentes else 'PARCIAL'
    resumo = []
    if faltantes: resumo.append('ausentes no código: ' + ', '.join(faltantes))
    if divergentes: resumo.append('divergentes: ' + ', '.join(divergentes))
    if extras: resumo.append('só no código: ' + ', '.join(extras))
    ENT_ROWS.append(R('Entidade', mod, f'Entidade {nome} → tabela {tabela}', origem, f'{len(campos)} atributos no dicionário', f'{MIG}/{mig}; {SVC}/{jpa if jpa else "(sem entidade própria)"}',
                      f'{len(t["columns"])} colunas; {len(t["constraints"])} constraints; {len(t["triggers"])} triggers. ' + ('; '.join(resumo) if resumo else 'Todas as colunas do documento existem.') + (f' Obs.: {obs}.' if obs else ''),
                      st, 'FATO', f1, 'ATUALIZAR_DOC', 'Tabela existe e é validada pelo Hibernate (ddl-auto: validate).' + (' Ajustar dicionário/lógico conforme as linhas de atributo.' if resumo else ''), 'P', 'Baixo', origem.split(' (')[0] + '; DER/lógico/classes do módulo', '—'))
    for col in extras:
        cc = t['columns'][col]
        chave = f'{tabela}.{col}'
        just = EXTRAS_JUST.get(chave, 'Coluna presente no código e ausente no dicionário; incluir no documento.')
        EXTRA_ROWS.append(R('Atributo', mod, f'{tabela}.{col} (só no código)', '— (não consta no dicionário)', '—', f'{MIG}/{cc["migration"]}__*.sql; {SVC}/{jpa}' if jpa else f'{MIG}/{cc["migration"]}__*.sql',
                            f'{col} {cc["tipo"]}{" NOT NULL" if cc["not_null"] else ""}', 'SÓ NO CÓDIGO', 'FATO', 'F1-037' if col == 'entidade_id' else '', 'ATUALIZAR_DOC', just, 'P', 'Baixo', origem.split(' (')[0], '—'))

TAB_ROWS = []
for tb, (mig, just) in TABELAS_SO_CODIGO.items():
    t = TABELAS[tb]
    modn = {'protocolo_sequencia': 3, 'resultado_processo': 4, 'anexo_ocorrencia_conteudo': 3, 'especie': 2, 'status_animal': 2, 'resultado_laboratorial': 4, 'desfecho_animal': 4}[tb]
    TAB_ROWS.append(R('Entidade', mod_label(modn), f'Tabela {tb} (só no código)', '— (não consta no DER/lógico/dicionário)', '—', f'{MIG}/{mig}', 'Colunas: ' + ', '.join(f'{c} {d["tipo"]}' for c, d in t['columns'].items()) + (f'; triggers: {len(t["triggers"])}' if t['triggers'] else ''),
                       'SÓ NO CÓDIGO', 'FATO', 'F1-022' if tb == 'protocolo_sequencia' else '', 'ATUALIZAR_DOC', just, 'P', 'Baixo', 'DER, lógico e dicionário do módulo; Seção 4.3', '—'))

# ------------------------------------------------------------------ montagem final e IDs
ORDEM_CAT = ['RF', 'UC', 'RN', 'RNF', 'Perfil', 'Relatório', 'Tela', 'Tecnologia', 'Enum', 'Entidade', 'Atributo']
doc_rows = [r for r in LINHAS_A + LINHAS_B if r['status'] != 'SÓ NO CÓDIGO'] + ENT_ROWS + ATTR_ROWS
code_rows = [r for r in LINHAS_A + LINHAS_B if r['status'] == 'SÓ NO CÓDIGO'] + TAB_ROWS + EXTRA_ROWS
doc_rows.sort(key=lambda r: ORDEM_CAT.index(r['cat']) if r['cat'] in ORDEM_CAT else 99)
code_rows.sort(key=lambda r: ORDEM_CAT.index(r['cat']) if r['cat'] in ORDEM_CAT else 99)
rows = doc_rows + code_rows
for i, r in enumerate(rows, 1):
    r['id'] = f'F2-{i:03d}'

# ------------------------------------------------------------------ CSV
COLS = ['ID', 'Categoria', 'Módulo', 'Item', 'Origem no documento', 'Trecho do documento', 'Evidência no código', 'Trecho do código', 'Status',
        'Tipo', 'Achado Fase 1 relacionado', 'Decisão recomendada', 'Justificativa', 'Esforço', 'Risco', 'Locais a alterar no documento',
        'Arquivos a alterar no código', 'decisao_autor', 'observacao_autor']
with open(os.path.join(ROOT, 'matriz_rastreabilidade.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f, delimiter=';', quoting=csv.QUOTE_ALL)
    w.writerow(COLS)
    for r in rows:
        w.writerow([r['id'], r['cat'], r['mod'], r['item'], r['orig'], r['tdoc'], r['evid'], r['tcod'], r['status'], r['tipo'], r['f1'], r['dec'], r['just'], r['esf'], r['risco'], r['locdoc'], r['arqcod'], '', ''])

# ------------------------------------------------------------------ estatísticas
inv_rows = [r for r in rows if r['status'] != 'SÓ NO CÓDIGO']
by_status = Counter(r['status'] for r in rows)
by_dec = Counter(r['dec'] for r in rows)
by_mod = defaultdict(Counter)
for r in rows: by_mod[r['mod']][r['status']] += 1
by_cat = defaultdict(Counter)
for r in rows: by_cat[r['cat']][r['status']] += 1
STATUSES = ['CONFORME', 'PARCIAL', 'DIVERGENTE', 'SÓ NO DOCUMENTO', 'NÃO VERIFICÁVEL', 'SÓ NO CÓDIGO']
def pct(a, b): return f'{(100.0 * a / b):.1f}%' if b else '—'
n_inv = len(inv_rows)
n_conf = sum(1 for r in inv_rows if r['status'] == 'CONFORME')
n_conf_parc = sum(1 for r in inv_rows if r['status'] in ('CONFORME', 'PARCIAL'))
n_verif = sum(1 for r in inv_rows if r['status'] != 'NÃO VERIFICÁVEL')
func_rows = [r for r in inv_rows if r['cat'] in ('RF', 'UC', 'RN', 'RNF', 'Perfil', 'Relatório', 'Tela')]
n_func_conf = sum(1 for r in func_rows if r['status'] == 'CONFORME')

def find(item_prefix):
    for r in rows:
        if r['item'].startswith(item_prefix):
            return r
    raise KeyError(item_prefix)

TOP15 = ['RN03 ', 'RF-B03 ', 'RF-A05 ', 'RN09 ', 'RN02 ', 'RF-A04 ', 'RF-B06 ', 'RF-D02 ', 'RN12 ', 'RF-A01 ', 'RNF10 ', 'RF-B01 ', 'UC "Editar Dados do Animal"', 'UC "Consultar Trilha de Auditoria"', 'Entidade Sessao']

# esforço em código
DIAS = {'P': 0.5, 'M': 2.0, 'G': 5.0}
cod_rec = [r for r in rows if r['dec'] in ('ATUALIZAR_CODIGO', 'AMBOS')]
cod_dec = [r for r in rows if r['dec'] == 'DECISAO_AUTORES' and r['arqcod'] not in ('—', '')]

# ------------------------------------------------------------------ decisoes_pendentes.md
pend = [r for r in rows if r['dec'] == 'DECISAO_AUTORES' or (r['dec'] in ('ATUALIZAR_CODIGO', 'AMBOS') and r['esf'] in ('M', 'G'))]
# só uma linha por "assunto": omitir linhas que apenas remetem a outra ("Ver RF-...") quando a principal já está presente
principais = [r for r in pend if not re.match(r'^(Ver |Idem|Perfis divergem|Veterinário também acessa|Segue a decisão)', r['just'])]
with open(os.path.join(ROOT, 'decisoes_pendentes.md'), 'w', encoding='utf-8') as f:
    f.write('# Decisões pendentes dos autores — Fase 2 (SISZOO)\n\n')
    f.write(f'Gerado em {DATA} a partir de `matriz_rastreabilidade.csv` (commit `{COMMIT}`). Contém **somente** os itens com decisão recomendada `DECISAO_AUTORES` e os `ATUALIZAR_CODIGO`/`AMBOS` com esforço M ou G. '
            f'Itens que apenas remetem a outro (ex.: telas e casos de uso cuja decisão é a de RN09) estão listados ao final como dependentes.\n\n')
    f.write(f'Premissa de prazo: entrega em 23/10/2026 (CLAUDE.md) ou 25/10/2026 (Quadro 5, S9); hoje é {DATA}. Só mudanças de código de esforço P são viáveis antes da entrega; '
            'as de esforço M/G devem ser decididas como "documentar como está" ou "trabalho futuro", salvo prorrogação.\n\n')
    f.write('Legenda de esforço (código): P ≤ 0,5 dia · M 1–3 dias · G > 3 dias. Risco: impacto de errar a decisão (regra crítica/LGPD = Alto).\n\n')
    f.write('| ID | Item | Status | Decisão | Esforço | Risco |\n|---|---|---|---|---|---|\n')
    for r in principais:
        f.write(f"| {r['id']} | {r['item']} | {r['status']} | {r['dec']} | {r['esf']} | {r['risco']} |\n")
    f.write('\n---\n')
    for r in principais:
        f.write(f"\n## {r['id']} — {r['item']}\n\n")
        f.write(f"- **Módulo:** {r['mod']} · **Status:** {r['status']} · **Tipo de evidência:** {r['tipo']} · **Achados F1:** {r['f1'] or '—'}\n")
        f.write(f"- **Documento diz** ({r['orig']}): {r['tdoc']}\n")
        f.write(f"- **Código faz** ({r['evid']}): {r['tcod']}\n")
        f.write(f"- **Análise:** {r['just']}\n")
        f.write(f"- **Esforço em código:** {r['esf']} · **Risco:** {r['risco']}\n")
        f.write(f"- **Locais no documento:** {r['locdoc']}\n- **Arquivos no código:** {r['arqcod']}\n")
        f.write('\n**Opções:**\n\n| Opção | Prós | Contras |\n|---|---|---|\n')
        if r.get('opcoes'):
            for o, pro, con in r['opcoes']:
                f.write(f'| {o} | {pro} | {con} |\n')
        else:
            f.write(f"| A. Implementar no código para atender ao documento (esforço {r['esf']}) | Documento permanece como está | Prazo; arquivos: {r['arqcod']} |\n")
            f.write('| B. Atualizar o documento para refletir o código (e, se for o caso, mover o restante para Trabalhos futuros) | Esforço só documental; código já testado | Requisito/regra reescrito |\n')
        f.write('\n**Decisão dos autores:** ☐ A  ☐ B  ☐ C  — observação: ______________________\n')
    dependentes = [r for r in pend if r not in principais]
    if dependentes:
        f.write('\n---\n\n## Itens dependentes (seguem a decisão de outro item)\n\n| ID | Item | Depende de | Status |\n|---|---|---|---|\n')
        for r in dependentes:
            f.write(f"| {r['id']} | {r['item']} | {r['just']} | {r['status']} |\n")

# ------------------------------------------------------------------ relatorio_fase2.md
sev = {a['ID']: a['Severidade'] for a in achados}
loc = {a['ID']: a['Localização A'] for a in achados}
with open(os.path.join(ROOT, 'relatorio_fase2.md'), 'w', encoding='utf-8') as f:
    f.write('# Relatório da Fase 2 — Rastreabilidade documento × código (SISZOO)\n\n')
    f.write(f'Data: {DATA}. Commit analisado: `{COMMIT}` (branch main). Modo somente leitura: nenhum arquivo fora de `docs/tg/analise_fase2/` foi alterado. '
            'Especificação de referência: `docs/tg/analise_fase1/inventario_especificacao.json` (Fase 1). Mapa do código: `mapa_codigo.md`. '
            'Matriz completa: `matriz_rastreabilidade.csv` (UTF-8 com BOM, separador `;`). Decisões: `decisoes_pendentes.md`.\n\n')
    f.write('**Premissa de prazo** (o prompt deixou "[PREENCHER: DATA]"): entrega em 23/10/2026 (CLAUDE.md) / 25/10/2026 (Quadro 5, S9). Com um a três dias restantes, '
            'só mudanças de código de esforço **P** são consideradas viáveis; tudo o que é M/G foi recomendado como ATUALIZAR_DOC/REMOVER_DO_DOC ou deixado para DECISAO_AUTORES.\n\n')
    f.write('Convenção de esforço: estimativa em **código** para tornar o item conforme ao documento (P ≤ 0,5 dia; M 1–3 dias; G > 3 dias). Para REMOVER_DO_DOC, o esforço indica o custo de implementar, que justifica a remoção; para ATUALIZAR_DOC, P significa ajuste textual.\n\n')

    f.write('## 1. Resumo executivo\n\n')
    f.write(f'- Linhas na matriz: **{len(rows)}** — {n_inv} itens do inventário da Fase 1 e {len(rows) - n_inv} itens SÓ NO CÓDIGO.\n')
    f.write(f'- Conformidade estrita (CONFORME / itens do inventário): **{pct(n_conf, n_inv)}** ({n_conf}/{n_inv}). Excluindo NÃO VERIFICÁVEL: {pct(n_conf, n_verif)}.\n')
    f.write(f'- Conformidade ampla (CONFORME + PARCIAL): **{pct(n_conf_parc, n_inv)}**.\n')
    f.write(f'- Itens funcionais (RF, UC, RN, RNF, perfis, relatórios, telas): {len(func_rows)} linhas, {n_func_conf} CONFORME ({pct(n_func_conf, len(func_rows))}).\n')
    f.write(f'- Build: backend `mvnw verify` **OK** (230 unitários + 445 integração, 0 falhas); frontend `npm run build` **OK**; `npm test` com 6 falhas de configuração de ambiente (492/498 ok) — ver §3.\n')
    f.write(f'- Mudanças de código recomendadas (ATUALIZAR_CODIGO/AMBOS): {len(cod_rec)} itens, todos de esforço P (≈ {sum(DIAS[r["esf"]] for r in cod_rec):.1f} dias). Itens que dependem de decisão dos autores com opção de código: {len(cod_dec)}.\n\n')

    f.write('### 1.1 Totais por status\n\n| Status | Linhas | % do total |\n|---|---|---|\n')
    for s in STATUSES:
        f.write(f'| {s} | {by_status.get(s, 0)} | {pct(by_status.get(s, 0), len(rows))} |\n')
    f.write('\n### 1.2 Totais por decisão recomendada\n\n| Decisão | Linhas |\n|---|---|\n')
    for d in ['ATUALIZAR_DOC', 'ATUALIZAR_CODIGO', 'AMBOS', 'REMOVER_DO_DOC', 'DECISAO_AUTORES']:
        f.write(f'| {d} | {by_dec.get(d, 0)} |\n')
    f.write('\n### 1.3 Por módulo (linhas por status)\n\n| Módulo | ' + ' | '.join(STATUSES) + ' | Total |\n|---|' + '---|' * (len(STATUSES) + 1) + '\n')
    for m in ['M1', 'M2', 'M3', 'M3/M4', 'M4', 'M5', 'Geral']:
        if m in by_mod:
            c = by_mod[m]
            f.write(f'| {m} | ' + ' | '.join(str(c.get(s, 0)) for s in STATUSES) + f' | {sum(c.values())} |\n')
    f.write('\n### 1.4 Por categoria\n\n| Categoria | ' + ' | '.join(STATUSES) + ' | Total | % CONFORME (inventário) |\n|---|' + '---|' * (len(STATUSES) + 2) + '\n')
    for cat in ORDEM_CAT:
        c = by_cat[cat]
        tot_inv = sum(v for s, v in c.items() if s != 'SÓ NO CÓDIGO')
        f.write(f'| {cat} | ' + ' | '.join(str(c.get(s, 0)) for s in STATUSES) + f' | {sum(c.values())} | {pct(c.get("CONFORME", 0), tot_inv)} |\n')

    f.write('\n### 1.5 Os 15 itens mais importantes\n\n| # | ID | Item | Status | Decisão | Esforço | Risco | Síntese |\n|---|---|---|---|---|---|---|---|\n')
    for i, k in enumerate(TOP15, 1):
        r = find(k)
        f.write(f"| {i} | {r['id']} | {r['item']} | {r['status']} | {r['dec']} | {r['esf']} | {r['risco']} | {r['just'][:220]}{'…' if len(r['just']) > 220 else ''} |\n")

    f.write('\n### 1.6 Regras críticas (verificação dirigida)\n\n| Regra | Resultado | Evidência |\n|---|---|---|\n')
    for k, res, ev in [('RN01 microchip único', 'CONFORME (índice único parcial; imutável após definido; data de implantação não existe)', 'V16; AnimalService.java:185-202'),
                       ('RN02 protocolo NNN/AAAA com lock', 'DIVERGENTE só no formato (3 dígitos, sequência por entidade); concorrência OK', 'ProtocoloService.java:41-56; V10 protocolo_sequencia'),
                       ('RN03 sigilo no backend + auditoria do Admin', 'Mecanismo CONFORME; Agente também vê (DECISAO_AUTORES)', 'OcorrenciaMapper.java:28-31; OcorrenciaService.java:618; V10/V12'),
                       ('RN04 contato humano → urgente', 'CONFORME', 'ProcessoSanitarioService.java:233-234'),
                       ('RN06 imutabilidade + auditoria', 'CONFORME (retifica_id + triggers V14/V17 + AuditoriaEvento)', 'V6, V14, V17; VacinacaoService.java:115-118'),
                       ('RF-A03 alerta 7 dias', 'CONFORME (aplicação + intervalo_meses; sob demanda, sem job)', 'AlertaVacinalService.java:30,46,85'),
                       ('RN10 e-mail de resultado (destinatários exatos)', 'DIVERGENTE: só Positivo; Vigilância Epidemiológica apenas log mock', 'NotificacaoResultadoService.java:51,161-166'),
                       ('RN05/RF-E03 bloqueio de encerramento', 'DIVERGENTE (mais estrito: processo CONCLUIDO)', 'OcorrenciaService.java:371-375'),
                       ('RF-B05 conclusão sem resultado', 'CONFORME (todo processo)', 'ProcessoSanitarioService.java:414-419'),
                       ('RNF06 JWT stateless', 'CONFORME (tabela sessao removida na V8)', 'SecurityConfig.java:39; V8'),
                       ('RNF03 rascunho local', 'CONFORME (IndexedDB nativo)', 'rascunhoDb.ts:13-37'),
                       ('E-mail institucional ^[a-z.]+@itu\\.sp\\.gov\\.br$', 'CONFORME', 'CriarUsuarioRequest.java:15'),
                       ('RNF02 2 GB RAM / leveza', 'CONFORME por inferência (lazy, cache, paginação); não medido', 'AppRoutes.tsx; application.yml:55-58'),
                       ('RNF07 navegadores', 'NÃO VERIFICÁVEL (sem E2E)', '—')]:
        f.write(f'| {k} | {res} | {ev} |\n')

    f.write('\n## 2. Método e evidências\n\n')
    f.write('Etapa 0: mapa do código (`mapa_codigo.md`) com schema reconstruído das 22 migrations (`schema_migrations.json` via `scripts/parse_schema.py`). '
            'Etapa 1: cada item do inventário foi procurado no código (controller/service/DTO/migration/rota); linhas manuais em `scripts/dados_fase2_a.py` e `scripts/dados_fase2_b.py`; '
            'linhas de entidade/atributo geradas automaticamente por `scripts/gerar_fase2.py` comparando o dicionário (Quadros 52–94) com as colunas reais, com mapeamento explícito de nomes (`MAPA_COLUNAS`). '
            'Etapa 2: varredura inversa (tabelas, colunas, endpoints, telas e tecnologias sem correspondente no documento). Etapa 3: resolução dos achados da Fase 1 (§4). '
            'Etapa 4: decisões (`decisoes_pendentes.md`). Etapa 5: autoverificação (§6).\n\n'
            'Tipo de evidência: FATO = lido no código/migration citado; INFERÊNCIA = conclusão a partir de ausência ou de estrutura; DÚVIDA = não decidível por leitura.\n\n')

    f.write('## 3. Estado do build e dos testes (executados em 22/10/2026)\n\n')
    f.write('| Comando | Resultado | Log |\n|---|---|---|\n')
    f.write('| `backend> ./mvnw -q -DskipTests compile` | OK (EXIT 0) | `log_backend_compile.txt` |\n')
    f.write('| `backend> ./mvnw verify` (surefire + failsafe/Testcontainers) | **BUILD SUCCESS**; unitários 230/230; integração 445/445; 0 falhas | `log_backend_verify.txt` |\n')
    f.write('| `frontend> npm run build` (tsc -b && vite build) | OK em 6,0 s | `log_frontend_build.txt` |\n')
    f.write('| `frontend> npm test` (vitest) | 83 arquivos, 498 testes: **492 ok, 6 falhas** (EXIT 1) | `log_frontend_test.txt` |\n\n')
    f.write('As 6 falhas (useDashboardKpis.test, Dashboard.test ×3, useGraficos.test, GraficosDashboard.test) ocorrem porque os testes assumem o modo mock dos KPIs/gráficos e `frontend/.env` define `VITE_USE_MOCK_KPIS=false` e `VITE_USE_MOCK_GRAFICOS=false`; o MSW recusa `/api/dashboard/kpis|graficos` ("no matching request handler"). É configuração de ambiente de teste, não regra de negócio; não foi corrigida (modo somente leitura). Nenhuma migration foi executada fora dos containers efêmeros do Testcontainers e nenhum banco real foi acessado.\n\n')

    f.write('## 4. Resolução dos achados da Fase 1 à luz do código\n\n')
    cnt = Counter(v[0] for v in RESOLUCAO_F1.values())
    f.write(f"Total: {len(RESOLUCAO_F1)} achados/pendências. Resolvidos pelo código: **{cnt['RESOLVE']}**; parcialmente: **{cnt['PARCIAL']}**; o código não resolve (questão documental/ABNT ou funcionalidade inexistente): **{cnt['NAO_RESOLVE']}**.\n\n")
    f.write('| Achado | Sev. | Veredito | O que o código faz / qual versão confirma |\n|---|---|---|---|\n')
    for fid, (ver, txt) in RESOLUCAO_F1.items():
        v = {'RESOLVE': 'resolve', 'PARCIAL': 'parcial', 'NAO_RESOLVE': 'o código não resolve'}[ver]
        f.write(f'| {fid} | {sev.get(fid, "—")} | {v} | {txt} |\n')

    f.write('\n## 5. Estimativa de esforço em código\n\n')
    f.write('### 5.1 Recomendado (ATUALIZAR_CODIGO / AMBOS)\n\n| ID | Item | Esforço | Arquivos |\n|---|---|---|---|\n')
    for r in cod_rec:
        f.write(f"| {r['id']} | {r['item']} | {r['esf']} | {r['arqcod']} |\n")
    f.write(f"\nTotal recomendado: {len(cod_rec)} itens · ≈ **{sum(DIAS[r['esf']] for r in cod_rec):.1f} dias** (P = 0,5 d). Todos cabem antes da entrega se iniciados imediatamente; cada um exige também atualizar o teste de integração correspondente.\n\n")
    f.write('### 5.2 Dependente de decisão dos autores (opção "implementar")\n\n| ID | Item | Esforço | Risco |\n|---|---|---|---|\n')
    for r in cod_dec:
        f.write(f"| {r['id']} | {r['item']} | {r['esf']} | {r['risco']} |\n")
    tot_dec = sum(DIAS[r['esf']] for r in cod_dec)
    f.write(f"\nSe TODAS as opções de implementação fossem escolhidas: ≈ **{tot_dec:.1f} dias** — inviável no prazo; por isso a recomendação padrão é documentar o estado atual e mover o restante para Trabalhos futuros.\n\n")
    f.write('### 5.3 Itens recomendados para Limitações/Trabalhos futuros (REMOVER_DO_DOC)\n\n')
    rem = [r for r in rows if r['dec'] == 'REMOVER_DO_DOC' and r['cat'] in ('RF', 'UC', 'Enum', 'Tecnologia', 'Entidade')]
    for r in rem:
        f.write(f"- {r['id']} {r['item']} (esforço para implementar: {r['esf']})\n")

    f.write('\n## 6. Autoverificação (Etapa 5)\n\n')
    f.write('Todos os itens com status SÓ NO DOCUMENTO e todas as recomendações ATUALIZAR_CODIGO foram reconfirmados com uma segunda busca (sinônimos, inglês, snake_case/camelCase) em `backend/src/main` e `frontend/src` (arquivos .java, .sql, .ts, .tsx, .yml, excluindo testes). Resultado: **nenhum item precisou ser removido (0 removidos)**. Ocorrências encontradas e por que não contradizem o status:\n\n')
    f.write('| Item | Termos | Ocorrências | Interpretação |\n|---|---|---|---|\n')
    for item, termos, occ, interp in [
        ('Adocao/adotante/devolução', 'adotante, devolução, class Adocao, adocao, tabela adocao', '12 arquivos', 'Todos se referem ao status `adotado`, ao TipoRelatorio ADOCOES e ao KPI mock; o comentário em DashboardKpisResponse.java:5-8 e RelatorioAdocoesService.java:21-33 afirmam que a tabela não existe.'),
        ('Exame', 'exame, tipo_exame, TipoExame', '6 arquivos', 'AbaExames.tsx (placeholder), classes CSS de timeline ("vacina/exame/cirurgia") e comentários; nenhuma entidade/endpoint.'),
        ('Anexos clínicos', 'anexo_animal, AnexoAnimal, anexo_vacinacao, anexo_procedimento, anexo_exame', '0', '—'),
        ('DocumentoProcesso/StatusDocumento', 'documento_processo, DocumentoProcesso, StatusDocumento, tipo_documento', '1 arquivo', 'Comentário em V13__schema_processos.sql dizendo que a tabela não foi criada.'),
        ('StatusRelatorio/url_expira_em', 'StatusRelatorio, url_expira, urlExpira, EM_PROCESSAMENTO', '0', '—'),
        ('Sessao/token_hash', 'token_hash, class Sessao, tabela sessao, sessao', '5 arquivos', 'V2 cria e V8 remove a tabela; SecurityConfig/application.yml/AuthContext usam "sessão" no sentido de JWT/sessionStorage.'),
        ('numero_medalha/data_implantacao_chip/procedencia/data_saida', 'medalha, implanta, procedencia, data_saida, dataSaida', '1 arquivo', 'AnimalService.java:181 — comentário "implantado no animal" sobre o microchip; nenhuma coluna.'),
        ('Laudo de eutanásia', 'laudo, eutan', '7 arquivos', 'Status/desfecho `obito_eutanasia` (V4/V13) e comentário "a coleta e o laudo podem anteceder a abertura" (ProcessoSanitarioService.java:447); nenhum campo de laudo.'),
        ('Playwright/E2E', 'playwright, e2e', '0', '—'),
        ('Consulta externa de CEP', 'viacep, brasilapi, consultaCep, buscarCep', '0', '—'),
        ('TipoAmostra', 'tipo_amostra, TipoAmostra, IN_NATURA, FORMOL', '0', '—'),
        ('VacinaEspecie/AnimalSintoma', 'vacina_especie, VacinaEspecie, animal_sintoma, AnimalSintoma', '0', '—'),
        ('Status "resgatado"', 'resgatad', '0', '—'),
        ('LOGOUT/EXPORTACAO em uso', 'AcaoAuditoria.LOGOUT, AcaoAuditoria.EXPORTACAO', '0', 'Valores existem no enum, mas nunca são gravados.'),
        ('GAL/SINAN informáveis', 'galNumero, sinanNumero, gal_numero, sinan_numero', '3 arquivos', 'Entidade e V13 têm as colunas; ProcessoSanitarioResponse.java:19 comenta que "galNumero/sinanNumero ... nao entram aqui"; nenhum DTO de entrada nem tela — confirma ATUALIZAR_CODIGO (P).'),
        ('Job agendado', '@Scheduled, EnableScheduling', '1 arquivo', 'Comentário em AlertaVacinalService.java:25-26 confirmando que não há @EnableScheduling.'),
        ('E-mail diário', 'emailDiario, email_diario, resumo di', '9 arquivos', 'Só persistência/exibição da preferência; nenhum envio.'),
    ]:
        f.write(f'| {item} | {termos} | {occ} | {interp} |\n')

    f.write('\n## 7. Limitações desta análise\n\n')
    f.write('- Análise estática: a UI não foi exercitada manualmente nem com E2E; comportamentos de tela são inferidos do código das páginas e dos testes unitários (Vitest).\n'
            '- Nenhum banco real foi acessado; o schema foi reconstruído das migrations (`parse_schema.py`) e corroborado pelas entidades JPA (`ddl-auto: validate`, confirmado pelos 445 testes de integração que sobem PostgreSQL via Testcontainers).\n'
            '- RNF01/RNF02/RNF05/RNF07/RNF09 não são verificáveis por leitura de código (sem medições no repositório); RNF04 e HTTPS dependem da infraestrutura de implantação.\n'
            f'- Linhas de código citadas valem para o commit `{COMMIT}`; alterações posteriores podem deslocá-las.\n'
            '- Linhas de atributo comparam nome e tipo-base; comprimentos de varchar e precisão são anotados, não tratados como divergência. NOT NULL foi comparado apenas onde o documento o afirma (RN07, RN08, Figuras lógicas).\n'
            '- Métodos de domínio dos diagramas de classes (Figuras 17–25) não foram rastreados um a um: as entidades JPA do código são anêmicas (lógica nos services), de modo que a comparação é de responsabilidade, não de assinatura; isso está refletido nas linhas de RF/UC/RN.\n'
            '- Prazo de entrega assumido (23–25/10/2026) por não constar no prompt; se houver prorrogação, as recomendações M (edição de usuário, filtros, campos do animal, tela de auditoria) tornam-se candidatas a ATUALIZAR_CODIGO.\n'
            '- As 6 falhas do `npm test` não foram corrigidas (modo somente leitura); a correção é P (ajustar `frontend/.env`/handlers MSW dos testes).\n')

print(f'linhas: {len(rows)} | inventário: {n_inv} | só código: {len(rows) - n_inv}')
print('status:', dict(by_status))
print('decisão:', dict(by_dec))
print('pendentes (principais):', len(principais), '| dependentes:', len(pend) - len(principais))
print('conformidade estrita:', pct(n_conf, n_inv), '| ampla:', pct(n_conf_parc, n_inv))
