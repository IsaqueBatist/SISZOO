# -*- coding: utf-8 -*-
"""Gera inventario_especificacao.json, achados_fase1.csv e relatorio_fase1_analise_documental.md."""
import csv, json, os, re, sys
from collections import Counter, OrderedDict
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dados_diagramas as D
import dados_achados as AC

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bruto = json.load(open(os.path.join(ROOT, 'texto', 'inventario_bruto_quadros.json'), encoding='utf-8'))
cruz = json.load(open(os.path.join(ROOT, 'texto', 'cruzamentos_automaticos.json'), encoding='utf-8'))
figs = json.load(open(os.path.join(ROOT, 'figuras', 'figuras.json'), encoding='utf-8'))
listas = json.load(open(os.path.join(ROOT, 'texto', 'listas_pre_textuais.json'), encoding='utf-8'))
pag_q = {e['num']: e['pagina_sumario'] for e in listas['lista_quadros']}
pag_f = {e['num']: e['pagina_sumario'] for e in listas['lista_figuras']}

def com_pagina(s):
    """Acrescenta '(p. N conforme sumário)' após cada 'Quadro N' / 'Figura N' (primeira ocorrência de cada)."""
    vistos = set()
    def rq(m):
        n = int(m.group(2)); k = (m.group(1), n)
        if k in vistos: return m.group(0)
        vistos.add(k)
        if m.group(1).startswith('Quadro'):
            p = pag_q.get(n); return f'{m.group(0)} (p. {p} conforme sumário)' if p else m.group(0)
        p = pag_f.get(n)
        if n >= 56: return f'{m.group(0)} (sem página: ausente da Lista de Figuras)'
        if 49 <= n <= 54: return f'{m.group(0)} (p. {p} conforme sumário – página da lista refere-se às telas do Ap. E)'
        return f'{m.group(0)} (p. {p} conforme sumário)' if p else m.group(0)
    return re.sub(r'\b(Quadros?|Figuras?|Fig\.) (\d+)\b', rq, s)

# ---------------- INVENTARIO ----------------
rf, rnf, rn, uc, telas, dic = bruto['rf'], bruto['rnf'], bruto['rn'], bruto['uc'], bruto['telas'], bruto['dicionario']
def mod_of_rf(k): return {'C': 1, 'A': 2, 'E': 3, 'B': 4, 'D': 5}[k.split('-')[1][0]]
inv = OrderedDict()
inv['_meta'] = {'fonte_unica': 'docs/tg/SISZOO_versao_limpa.docx', 'gerado_em': '2026-10-22', 'fase': 1,
                'contagens': {'quadros': 94, 'figuras_numeradas': 63, 'legendas_de_figura_no_corpo': 69, 'imagens_embutidas': 46, 'figuras_sem_imagem_placeholder': 23,
                              'rf': len(rf), 'rnf': len(rnf), 'rn': len(rn), 'casos_de_uso': len(uc), 'tabelas_dicionario': len(dic), 'telas_quadro15': len(telas), 'telas_citadas': 23},
                'convencao_paginas': 'páginas citadas provêm das Listas de Figuras/Quadros do próprio documento ("conforme sumário"); o Sumário está vazio',
                'convencao_cardinalidade_der': 'transcrita literalmente como "(min,max) junto a <entidade>"; convenção de leitura não declarada no documento'}
inv['modulos'] = D.MODULOS
inv['mapeamento_rf_modulo'] = D.MAPEAMENTO_RF_MODULO
inv['perfis_atores'] = D.PERFIS
inv['requisitos_nao_funcionais'] = [{'id': k, **v, 'origem': 'Quadro 12 (p. 32 conforme sumário)'} for k, v in rnf.items()]
inv['regras_negocio'] = [{'id': k, **v, 'origem': 'Quadro 13 (p. 32 conforme sumário)', 'referenciada_em': ''} for k, v in rn.items()]
inv['enumeracoes'] = {'diagrama_classes': {fig: v.get('enums', {}) for fig, v in D.CLASSES.items() if v.get('enums')}, 'dicionario_tipos_enum_citados': cruz['dicionario_enums'], 'texto_e_apendice_A': D.ENUMS_NO_TEXTO}
inv['relatorios'] = D.RELATORIOS
inv['tecnologias'] = D.TECNOLOGIAS
inv['fora_do_escopo'] = D.FORA_DO_ESCOPO
inv['prototipos'] = D.PROTOTIPOS
inv['telas'] = [{'codigo': k, **v, **D.TELAS_FIGURAS.get(k, {}), 'origem': 'Quadro 15 (p. 79 conforme sumário)'} for k, v in telas.items()] + \
               [{'codigo': k, 'nome': v['nome'], 'perfis': None, 'req': None, 'substitui': None, **v, 'origem': 'Apêndice E e Lista de Figuras (ausente do Quadro 15)'} for k, v in D.TELAS_FIGURAS.items() if k >= 'T18']
inv['casos_de_uso_nome_diagrama_vs_quadro'] = D.UC_NOME_DIAGRAMA_VS_QUADRO
inv['diagrama_casos_de_uso_geral'] = D.UC_DIAGRAMAS['Figura 1']
inv['por_modulo'] = []
dic_mod = {1: range(52, 58), 2: range(58, 80), 3: range(80, 87), 4: range(87, 94), 5: range(94, 95)}
uc_mod = {1: range(16, 23), 2: range(23, 35), 3: range(35, 40), 4: range(40, 46), 5: range(46, 52)}
figmap = {1: ('Figura 2', 'Figura 7', 'Figura 12', ['Figura 17']), 2: ('Figura 3', 'Figura 8', 'Figura 13', ['Figura 18', 'Figura 19', 'Figura 20', 'Figura 21']),
          3: ('Figura 4', 'Figura 9', 'Figura 14', ['Figura 22']), 4: ('Figura 5', 'Figura 10', 'Figura 15', ['Figura 23', 'Figura 24']), 5: ('Figura 6', 'Figura 11', 'Figura 16', ['Figura 25'])}
for m in range(1, 6):
    md = next(x for x in D.MODULOS if x['numero'] == m)
    fuc, fder, flog, fcls = figmap[m]
    ent = OrderedDict()
    for t, v in dic.items():
        if v['quadro'] in dic_mod[m]:
            ent[t] = {'dicionario': {'origem': f'Quadro {v["quadro"]} (p. {pag_q.get(v["quadro"])} conforme sumário)', 'campos': v['campos']}}
    for t, cols in D.LOGICO[flog]['tabelas'].items():
        ent.setdefault(t, {})['logico'] = {'origem': D.LOGICO[flog]['origem'], 'colunas': cols}
    for t, attrs in D.DER[fder]['entidades'].items():
        ent.setdefault(t, {})['der_conceitual'] = {'origem': D.DER[fder]['origem'], 'atributos': attrs}
    for fc in fcls:
        for c, v in D.CLASSES[fc].get('classes', {}).items():
            ent.setdefault(c, {})['classes'] = {'origem': D.CLASSES[fc]['origem'], **v}
    inv['por_modulo'].append(OrderedDict([
        ('modulo', m), ('nome', md['nome_canonico']), ('variacoes_nome', md['variacoes']), ('letra_rf', md['letra_rf']),
        ('requisitos_funcionais', [{'id': k, **v, 'origem': f'Quadro {v["quadro"]} (p. {pag_q.get(v["quadro"])} conforme sumário)', 'casos_de_uso': cruz['rf_para_uc'].get(k, [])} for k, v in rf.items() if mod_of_rf(k) == m]),
        ('diagrama_casos_de_uso', D.UC_DIAGRAMAS[fuc]),
        ('casos_de_uso_baixo_nivel', [{**v, 'origem': f'Quadro {v["quadro"]} (p. {pag_q.get(v["quadro"])} conforme sumário)'} for v in uc.values() if v['quadro'] in uc_mod[m]]),
        ('der_conceitual', D.DER[fder]), ('diagrama_logico', D.LOGICO[flog]),
        ('diagrama_classes', {fc: D.CLASSES[fc] for fc in fcls}),
        ('entidades_consolidadas', ent),
        ('metodos_dominio', {c: v['metodos'] for fc in fcls for c, v in D.CLASSES[fc].get('classes', {}).items() if v['metodos']}),
    ]))
inv['figuras_mapeamento'] = [{'figura': f['num'], 'titulo': f['titulo'], 'secao': f['secao'], 'arquivo': ','.join(f['arquivos']) or None, 'placeholder': f['placeholder'], 'pagina_conforme_sumario': pag_f.get(f['num'])} for f in figs]
inv['cruzamentos_automaticos'] = {k: cruz[k] for k in ['rf_para_uc', 'rf_sem_uc', 'uc_sem_rf', 'rn_referenciadas', 'telas_figura_sem_quadro15', 'figuras_duplicadas', 'lista_figuras_ausentes', 'referencias_nao_citadas', 'variacoes_nome_modulo']}
json.dump(inv, open(os.path.join(ROOT, 'inventario_especificacao.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------------- ACHADOS ----------------
ordem = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
sev_rank = {'CRÍTICA': 0, 'ALTA': 1, 'MÉDIA': 2, 'BAIXA': 3}
ach = sorted(AC.A, key=lambda a: (ordem.index(a['verif']), sev_rank[a['sev']]))
for i, a in enumerate(ach, 1):
    a['id'] = f'F1-{i:03d}'; a['locA_p'] = com_pagina(a['locA']); a['locB_p'] = com_pagina(a['locB'])
cols = ['ID', 'Verificação', 'Severidade', 'Tipo', 'Localização A', 'Localização B', 'O que diz A (trecho literal)', 'O que diz B (trecho literal)', 'Por que é um problema', 'Correção sugerida']
with open(os.path.join(ROOT, 'achados_fase1.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f, delimiter=';', quoting=csv.QUOTE_ALL); w.writerow(cols)
    for a in ach:
        w.writerow([a['id'], a['verif'], a['sev'], a['tipo'], a['locA_p'], a['locB_p'], a['dizA'], a['dizB'], a['problema'], a['correcao']])
    for i, p in enumerate(AC.PEND, 1):
        w.writerow([f'P-{i:03d}', 'PENDÊNCIA', '—', 'PENDÊNCIA', com_pagina(p['loc']), '—', p['texto'], '—', p['impacto'], 'Preencher antes da entrega'])

# ---------------- RELATORIO ----------------
nomes_verif = {'A': 'Requisitos × Casos de uso', 'B': 'Perfis e permissões', 'C': 'Regras de negócio', 'D': 'Modelagem de dados (DER × lógico × dicionário × classes)', 'E': 'Relatórios', 'F': 'Telas', 'G': 'Escopo, tecnologia e coerência geral', 'H': 'Estrutura e ABNT'}
sem_div = {
    'A': ['Todo RF (20) tem ao menos um caso de uso que o cita em "Requisitos relacionados" e todo caso de uso (36) cita ao menos um RF (verificação automática, cruzamentos_automaticos.json: rf_sem_uc = [], uc_sem_rf = []).',
          'Os 36 casos de uso dos diagramas (Figuras 2–6) têm quadro próprio (Quadros 16–51) e vice-versa; 33 nomes são idênticos.',
          'Relações «include»/«extend» dos diagramas coincidem com o campo "Caso de Uso Geral" dos quadros (Quadro 20 "inclusão", Quadros 21/26/34/36/37/47/48 "extensão") e as condições [destino = ADOTADO], [há denunciado], [há documento], [status = CONCLUIDO] têm correspondência nos fluxos.',
          'Prefixos de RF ↔ módulos: RF-C→Quadro 6 (M1), RF-A→Quadro 7 (M2), RF-E→Quadro 8 (M3), RF-B→Quadro 9 (M4), RF-D→Quadro 10 (M5), exatamente como declarado na introdução do Cap. 3 e nas letras de RN09.'],
    'B': ['Os três perfis do Quadro 4 são os três atores das Figuras 1–6 e dos Quadros 16–51; a herança Administrador→Veterinário/Agente Sanitário é idêntica nas seis figuras e no texto 4.1; não existe perfil Recepcionista (Seção 2.2 justifica).'],
    'C': ['Todas as 12 RN referenciadas (RN01–RN12) existem no Quadro 13 e todas são citadas fora dele; nenhuma RNF ou RF inexistente é citada.',
          'RN01 (microchip único): coerente em 1.7, RF-A01, Quadros 23/24, Quadro 67 (UQ), Figura 13 (UQ) e Animal.registrarMicrochip().',
          'RN05 (bloqueio de encerramento): coerente em RF-E03, Quadro 39, Figura 4 (nota), 5.2 e Ocorrencia.podeSerEncerrada()/ProcessoSanitario.possuiResultado().',
          'RN10 (notificação Positivo/Inconclusivo ao responsável e à Vigilância Epidemiológica, uma vez): coerente em 1.3, Resumo, RF-B03, Quadro 42, Figura 5 (nota), 5.2, ProcessoSanitario.notificado_em/exigeNotificacao() e ResponsavelProcesso.email/podeReceberNotificacao().',
          'RN12 (ciclo ABERTO→EM_ANDAMENTO→AGUARDANDO_RESULTADO→CONCLUIDO): coerente com Quadros 42/44, enum StatusProcesso (Fig. 24) e avancarStatus().',
          'Prazo do alerta vacinal (7 dias): coerente em Resumo, RF-A03, RF-D01, Quadros 29/46/47/56, Apêndice C.'],
    'D': ['Classes «external» (Usuario, Animal, Laboratorio, Sintoma, Ocorrencia, ProcessoSanitario) correspondem a classes definidas em outro módulo.',
          'Módulos 3, 4 e 5: dicionário × lógico coincidem em tabelas e colunas (exceto protocolo varchar(9)); Módulo 5 coincide nos quatro artefatos.',
          'Valores de enumeração: ResultadoLaboratorial, StatusProcesso, StatusAnimal (destinos), StatusRelatorio/StatusDocumento, Especie, TipoAbrigo, TipoRelatorio, Porte, UnidadeFrequencia, TemaUsuario coincidem entre diagramas de classes, descrições do dicionário e texto.',
          'Tabelas associativas UsuarioCargo, AmostraSintoma, AnimalSintoma e VacinaEspecie são coerentes entre lógico, dicionário e classes (AnimalSintoma e VacinaEspecie faltam só no DER M2 – achado F1 sobre a Figura 8).'],
    'E': ['Os seis relatórios do Quadro 11 coincidem, em nome e quantidade, com o enum TipoRelatorio (Fig. 25), o Quadro 49, o Quadro 94, o protótipo da Figura 30 e as telas T18–T23 do Apêndice E.'],
    'F': ['Códigos e nomes das telas T01–T17 coincidem entre Quadro 15, legendas das Figuras 31–47 e descrições da Seção 5.2; os cinco protótipos (Figuras 26–30) referem-se a telas existentes (T02, T06, T10, T07, T14).'],
    'G': ['Nenhum item da Seção 3.4 aparece como requisito, caso de uso ou entidade (SISSAÚDE/VivoPet/app móvel/portal público ausentes do modelo); a exceção é o mapa no protótipo T10 (achado).',
          'Tecnologias da Seção 2.3 coincidem com o Quadro 14 e a Seção 5.1; as versões (Java 21, Spring Boot 3, React 18, PostgreSQL 16) aparecem uma única vez e o Quadro 14 não informa versões (sem conflito).',
          'RNFs coerentes com o texto: RNF02 (~2 GB RAM) com o Apêndice C; RNF03 com idb/IndexedDB; RNF06 com bcrypt/HTTPS/LGPD; RNF10 com AuditoriaEvento.'],
    'H': ['Numeração dos quadros (1–94) sequencial, sem lacunas; Lista de Quadros confere com as 94 legendas (títulos e numeração).',
          'Todas as 94 legendas de quadro e 69 de figura têm "Fonte:".',
          'Numeração de seções (Introdução, 1–5, Considerações Finais, Referências, Apêndices A–E, Anexo A) coerente; subseções 1.1–1.13, 2.1–2.4, 3.1–3.5, 4.1–4.6, 5.1–5.2, A.1–A.5, B.1–B.5.',
          '46 das 48 referências são citadas no texto; todas as citações autor-data localizadas têm referência (exceto as fontes institucionais do achado H sobre "CCZ de Itu (2026)").',
          'Contagens das Considerações Finais ("20 requisitos funcionais, 10 requisitos não funcionais e 12 regras de negócio ... 36 especificações de baixo nível") conferem: 20 RF (3+5+3+7+2), 10 RNF, 12 RN, 36 Quadros 16–51.'],
}
top10_idx = []
def find(pred):
    for a in ach:
        if pred(a): return a['id']
top10 = [find(lambda a: 'Sessao' in a['locA']), find(lambda a: 'DER M2' in a['locA'] and a['sev'] == 'ALTA'), find(lambda a: 'Adocao' in a['locA']),
         find(lambda a: 'animais_alojados' in a['locA']), find(lambda a: 'Gera' in a['locA']), find(lambda a: 'RN08' in a['locA']), find(lambda a: 'RN03' in a['locA']),
         find(lambda a: 'RF-A05' in a['locA'] and a['sev'] == 'ALTA'), find(lambda a: 'Telas do SISZOO' in a['locA']), find(lambda a: 'Apêndice D (b1205' in a['locA'])]
by_sev = Counter(a['sev'] for a in ach); by_ver = Counter(a['verif'] for a in ach)
by_tipo = Counter(a['tipo'] for a in ach)
L = []
L.append('# Relatório – Fase 1: análise documental do TG SISZOO\n')
L.append('Fonte única: `docs/tg/SISZOO_versao_limpa.docx` (extraído em `texto/`, `quadros/`, `figuras/`). Páginas citadas são as das Listas de Figuras/Quadros do próprio documento ("conforme sumário"). Referências "bNNN" são índices de bloco em `texto/blocos.json` e `texto/documento_completo.md`.\n')
L.append('## 1. Resumo executivo\n')
L.append(f'- Quadros lidos: 94/94 (Quadros 1–94, um CSV por quadro em `quadros/`). Figuras: 63 números, 69 legendas, 46 imagens embutidas lidas e transcritas (`figuras/transcricoes/`), 23 figuras sem imagem (placeholders).')
L.append(f'- Achados de inconsistência: **{len(ach)}** (fora das pendências). Por severidade: ' + ', '.join(f'{k} {by_sev[k]}' for k in ['CRÍTICA', 'ALTA', 'MÉDIA', 'BAIXA']) + '. Por tipo: ' + ', '.join(f'{k} {v}' for k, v in by_tipo.items()) + '.')
L.append('- Por verificação: ' + ', '.join(f'{k} ({nomes_verif[k]}) {by_ver[k]}' for k in ordem) + '.')
L.append(f'- Pendências editoriais (seção 5, fora da contagem): {len(AC.PEND)} grupos, incluindo 23 capturas de tela ausentes e 4 placeholders nas Considerações Finais.')
L.append('- Autoverificação (Etapa 3): os achados CRÍTICA/ALTA foram reconferidos nas transcrições e no texto; nenhum foi removido; dois foram rebaixados durante a revisão (protocolo nos protótipos → MÉDIA; RN07 × NOT NULL → INFERÊNCIA, pela legibilidade da Figura 13).\n')
L.append('### Os 10 achados mais importantes\n')
L.append('| # | ID | Sev. | Resumo |\n|---|---|---|---|')
for n, tid in enumerate(top10, 1):
    a = next(x for x in ach if x['id'] == tid)
    L.append(f'| {n} | {tid} | {a["sev"]} | {a["problema"][:260]} |')
L.append('\n## 2. Achados por verificação\n')
L.append('Formato: ID | Severidade | Tipo | Localização A | Localização B | O que diz A | O que diz B | Por que é um problema | Correção sugerida.\n')
for v in ordem:
    L.append(f'### {v}. {nomes_verif[v]}\n')
    L.append('**Sem divergências em:**')
    for s in sem_div[v]: L.append(f'- {s}')
    L.append('')
    for a in [x for x in ach if x['verif'] == v]:
        L.append(f'**{a["id"]} | {a["sev"]} | {a["tipo"]}**')
        L.append(f'- Localização A: {a["locA_p"]}')
        L.append(f'- Localização B: {a["locB_p"]}')
        L.append(f'- O que diz A: {a["dizA"]}')
        L.append(f'- O que diz B: {a["dizB"]}')
        L.append(f'- Por que é um problema: {a["problema"]}')
        L.append(f'- Correção sugerida: {a["correcao"]}\n')
L.append('## 3. DÚVIDAS que só os autores podem decidir\n')
for a in ach:
    if a['tipo'] == 'DÚVIDA' or 'DÚVIDA' in a['correcao']:
        L.append(f'- **{a["id"]}** ({a["verif"]}, {a["sev"]}): {a["problema"]} → {a["correcao"]}')
L.append('- Convenção de leitura das cardinalidades (min,max) do brModelo (Seção 1.12 não a declara): decide a interpretação de vários mínimos nas Figuras 7–10.')
L.append('- Denunciante obrigatório ou opcional (denúncia anônima?): Quadro 35 e DER dizem obrigatório; lógico e classes, opcional.')
L.append('- Quantidade de baias externas (E1–E8 × E1–E4) e nomes das baias ("Gatil") nos protótipos.')
L.append('- Alcance do bloqueio de encerramento de processo sem resultado (todos os processos × só urgentes).')
L.append('- Base do alerta vacinal (data de validade informada × data calculada pelo intervalo da vacina).')
L.append('- Significado de "imutável" em RN06 (sem exclusão/correção × sem qualquer atualização).\n')
L.append('## 4. Limitações\n')
L.append('- **Figura 13 (lógico M2, image13.png 1385×1031)**: texto muito pequeno; as marcas NN de sexo, porte, data_entrada, motivo_entrada_id e baia_id foram lidas como ausentes em recortes na resolução original, mas a leitura não é segura (achado sobre RN07 classificado como INFERÊNCIA). Baia.animais_alojados e os tipos das colunas foram lidos com segurança.')
L.append('- **Figura 8 (DER M2, image8.png 1382×902)**: lido por seis recortes; nomes de entidades/atributos legíveis; as cardinalidades menores de alguns relacionamentos (Cadastra, Aplica, Executa, Prescrita) não foram transcritas.')
L.append('- **Figura 7**: a segunda entidade ligada ao relacionamento "concede" (CargoPermissao) não pôde ser identificada com segurança (linha passa por trás de "produz").')
L.append('- **Figura 52 (foto da capa de processo)**: o carimbo parece "002 05/01/26", enquanto o texto diz "numerado (007)"; a foto não permite confirmar.')
L.append('- **Convenção (min,max)**: o documento só diz "cardinalidades no formato (mínima, máxima)"; a transcrição registra a posição literal e os achados de cardinalidade dependentes de convenção estão marcados como DÚVIDA.')
L.append('- **Páginas**: o Sumário está vazio e as listas pré-textuais são estáticas; as páginas citadas vêm dessas listas e podem estar desatualizadas (as Figuras 56–63 não têm página; as Figuras 49–54 têm a página das telas do Ap. E).')
L.append('- **Figuras sem imagem (23)**: 31–47 e 49–54 (Ap. E) são placeholders "[INSERIR CAPTURA...]"; nada foi verificado sobre as telas implementadas.')
L.append('- **Apêndice C (transcrição da entrevista)**: lido integralmente, usado apenas como contexto; não é artefato de especificação.')
L.append('- **Mapeamento figura→imagem**: todas as 46 imagens foram associadas pela ordem no document.xml (legenda imediatamente antes da imagem; "Fonte:" imediatamente depois); nenhuma associação ficou ambígua. Tabela completa em `figuras/mapeamento_figuras.csv`.\n')
L.append('## 5. PENDÊNCIAS (placeholders e capturas ausentes – fora da contagem de inconsistências)\n')
L.append('| ID | Localização | Texto literal | Impacto |\n|---|---|---|---|')
for i, p in enumerate(AC.PEND, 1):
    L.append(f'| P-{i:03d} | {com_pagina(p["loc"])} | {p["texto"]} | {p["impacto"]} |')
L.append('\n## 6. Mapeamento figura → imagem embutida\n')
L.append('| Figura | Seção | Arquivo | Placeholder | p. (conf. sumário) |\n|---|---|---|---|---|')
for f in figs:
    L.append(f'| {f["num"]} – {f["titulo"][:60]} | {f["secao"][:28]} | {",".join(f["arquivos"]) or "—"} | {(f["placeholder"] or "—")[:45]} | {pag_f.get(f["num"], "—")} |')
L.append('\n## 7. Arquivos intermediários\n')
L.append('- `scripts/extrair_docx.py`, `recortar_figuras.py`, `cruzamentos.py`, `dados_diagramas.py`, `dados_achados.py`, `gerar_saidas.py`')
L.append('- `texto/documento_completo.md`, `texto/blocos.json`, `texto/listas_pre_textuais.json`, `texto/notas_leitura_texto.md`, `texto/cruzamentos_automaticos.json`, `texto/inventario_bruto_quadros.json`')
L.append('- `quadros/quadro_01.csv` … `quadro_94.csv`, `quadros/quadros.json`')
L.append('- `figuras/image1–46`, `figuras/mapeamento_figuras.csv`, `figuras/figuras.json`, `figuras/recortes/`, `figuras/transcricoes/`')
open(os.path.join(ROOT, 'relatorio_fase1_analise_documental.md'), 'w', encoding='utf-8').write('\n'.join(L))

# ---------------- verificacao de completude ----------------
print('achados:', len(ach), dict(by_sev), dict(by_ver), '| pendencias:', len(AC.PEND))
print('top10:', top10)
print('csv quadros:', len([f for f in os.listdir(os.path.join(ROOT, 'quadros')) if f.endswith('.csv')]))
print('imagens:', len([f for f in os.listdir(os.path.join(ROOT, 'figuras')) if re.match(r'image\d+\.', f)]), '| figuras no mapeamento:', len(figs), '| placeholders:', sum(1 for f in figs if f['placeholder']))
print('modulos no inventario:', len(inv['por_modulo']), '| entidades consolidadas:', sum(len(m['entidades_consolidadas']) for m in inv['por_modulo']))
print('ids sequenciais:', [a['id'] for a in ach][:3], '...', ach[-1]['id'])
