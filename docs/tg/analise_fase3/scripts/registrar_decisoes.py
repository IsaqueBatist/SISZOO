# -*- coding: utf-8 -*-
"""Fase 3 — registra as decisões dos autores (22/10/2026) nas colunas decisao_autor / observacao_autor
da matriz da Fase 2 (docs/tg/analise_fase2/matriz_rastreabilidade.csv). Reexecutável (sobrescreve as duas colunas)."""
import csv, os, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.normpath(os.path.join(HERE, '..', '..', 'analise_fase2', 'matriz_rastreabilidade.csv'))
rows = list(csv.DictReader(open(CSV, encoding='utf-8-sig'), delimiter=';'))
cols = list(rows[0].keys())

# Decisões específicas por ID (ID -> (decisao_autor, observacao_autor))
ESP = {
    'F2-004': ('IMPLEMENTAR (Opção A)', 'Implementar numero_medalha, data_implantacao_chip e procedencia: migration, entidade, DTO, validação, formulário e ficha. Atualizar o documento conforme a implementação.'),
    'F2-057': ('IMPLEMENTAR (segue F2-004)', 'Data de implantação do chip passa a existir; RN01 permanece como está.'),
    'F2-310': ('IMPLEMENTAR (segue F2-004)', 'numero_medalha.'), 'F2-311': ('IMPLEMENTAR (segue F2-004)', 'data_implantacao_chip.'), 'F2-327': ('IMPLEMENTAR (segue F2-004)', 'procedencia.'),
    'F2-028': ('IMPLEMENTAR (segue F2-004)', 'Cadastrar Animal passa a ter os 3 campos; porte/baia continuam opcionais (ATUALIZAR_DOC em RN07).'),
    'F2-008': ('IMPLEMENTAR PARCIAL (somente o laudo)', 'Implementar apenas o laudo de eutanásia, validado só na transição para obito_eutanasia (não invalida registros existentes). Adoção, devolução e data_saida: documento (trabalho futuro / limitação).'),
    'F2-030': ('IMPLEMENTAR PARCIAL (segue F2-008)', 'Saída/desfecho: laudo obrigatório em óbito por eutanásia; sem data_saida (limitação no documento).'),
    'F2-329': ('NÃO IMPLEMENTAR — LIMITAÇÃO NO DOCUMENTO', 'Animal.data_saida: o documento passa a tratá-lo como limitação; o texto não pode afirmar que o campo existe.'),
    'F2-014': ('IMPLEMENTAR (Opção C) + DOCUMENTAR PENDÊNCIA', 'Voltar a notificar também em resultado Inconclusivo (reverter decisão anterior). E-mail à Vigilância Epidemiológica não será implementado: documentar como pendência e trabalho futuro em RN10, no caso de uso Registrar Resultado Laboratorial e nas Considerações Finais.'),
    'F2-066': ('IMPLEMENTAR (segue F2-014)', 'RN10: Positivo e Inconclusivo notificam o responsável; Vigilância = pendência/trabalho futuro.'),
    'F2-047': ('IMPLEMENTAR (segue F2-014)', 'UC Registrar Resultado Laboratorial: Positivo/Inconclusivo notificam; Vigilância documentada como pendência.'),
    'F2-027': ('IMPLEMENTAR (Opção A)', 'Tela de Logs já existe (branch fix/ui-pos-revisao, rota /logs, só Admin). Implementar no backend os filtros de GET /api/auditoria (acao, entidade, usuarioId, de, ate; payloadAntes/Depois no DTO) e ligar a tela a eles sem reescrevê-la.'),
    'F2-059': ('MANTER CÓDIGO (Opção B) + ATUALIZAR_DOC', 'Manter acesso do Agente Sanitário ao denunciante sigiloso, com auditoria. Atualizar RN03, RF-E02 e Quadro 38. Garantir no código (teste) que o acesso gera registro de auditoria.'),
    'F2-065': ('MANTER CÓDIGO (Opção A) + ATUALIZAR_DOC', 'Manter a matriz de permissões do código; atualizar RN09, Quadro 4 e Quadro 15.'),
    'F2-105': ('MANTER CÓDIGO (segue F2-065)', 'T04: Agente lê animais.'), 'F2-112': ('MANTER CÓDIGO (segue F2-065)', 'T11: Veterinário também acessa.'),
    'F2-113': ('MANTER CÓDIGO (segue F2-065)', 'T12: três perfis.'), 'F2-114': ('MANTER CÓDIGO (segue F2-065)', 'T13: três perfis; resultado conforme F2-014.'),
    # RF-A04 (exames e anexos clínicos): "execute" (autor, 22/10)
    'F2-007': ('IMPLEMENTAR (decisão do autor: "RF-A04, execute")', 'Escopo mínimo definido na Fase 3: Exame (+ TipoExame) com registro imutável e AnexoAnimal (upload no padrão de anexo_ocorrencia). Anexos por vacinação/procedimento/exame só se houver tempo; o que não entrar vai para bloqueios.md.'),
    'F2-037': ('IMPLEMENTAR (segue F2-007)', 'UC Registrar Exame.'), 'F2-039': ('IMPLEMENTAR (segue F2-007)', 'UC Anexar Documento ao Animal.'),
    # Trabalhos futuros explícitos
    'F2-154': ('TRABALHO FUTURO', 'Playwright: não implementar; retirar do Quadro 14 como ferramenta em uso e registrar nas Considerações Finais.'),
    'F2-017': ('TRABALHO FUTURO — manter na modelagem', 'Documento do processo: não implementar. Manter nos diagramas, dicionário e casos de uso com a indicação "modelado; implementação prevista em trabalhos futuros"; retirar apenas do que é apresentado como implementado (cap. 5, telas, status dos RFs).'),
    'F2-050': ('TRABALHO FUTURO — manter na modelagem', 'UC Gerar Documento do Processo: manter com indicação de trabalho futuro.'),
    'F2-031': ('TRABALHO FUTURO — manter na modelagem', 'UC Registrar Adoção: manter com indicação de trabalho futuro.'),
    'F2-155': ('INVERTIDO — ViaCEP EXISTE APÓS O MERGE', 'A branch fix/ui-pos-revisao trouxe a consulta ViaCEP nos formulários. Manter o passo no Quadro 35 e incluir ViaCEP no Quadro 14; registrar o fallback manual quando a rede falhar.'),
    'F2-010': ('APROVADO + IMPLEMENTAR FILTRO DE PERÍODO', 'Filtro de período em ocorrências aprovado pelo autor (após a prioridade 2; contrato docs/contratos/ocorrencias-filtro-data.md).'),
    'F2-043': ('APROVADO + IMPLEMENTAR FILTRO DE PERÍODO', 'Segue F2-010.'),
}

def classificar(r):
    i, dec, item = r['ID'], r['Decisão recomendada'], r['Item']
    if i in ESP:
        return ESP[i]
    if re.search(r'Adocao|Adoção|Adoções', item) and r['Status'] in ('SÓ NO DOCUMENTO', 'PARCIAL'):
        return ('TRABALHO FUTURO — manter na modelagem', 'Adoção: manter nos diagramas/dicionário/casos de uso com indicação "modelado; implementação prevista em trabalhos futuros"; retirar do que é apresentado como implementado.')
    if re.search(r'DocumentoProcesso|TipoDocumentoProcesso|StatusDocumento', item):
        return ('TRABALHO FUTURO — manter na modelagem', 'Documento do processo: idem F2-017.')
    if re.search(r'^(Entidade|Atributo).*\b(Exame|TipoExame|AnexoExame|AnexoAnimal|AnexoVacinacao|AnexoProcedimento)\b', item) or item.startswith(('Exame.', 'TipoExame.', 'AnexoExame.', 'AnexoAnimal.', 'AnexoVacinacao.', 'AnexoProcedimento.')):
        return ('IMPLEMENTAR (segue F2-007)', 'Escopo mínimo: Exame, TipoExame e AnexoAnimal; demais anexos se houver tempo (ver bloqueios.md).')
    if dec in ('ATUALIZAR_CODIGO', 'AMBOS'):
        return ('APROVADO', 'Implementar conforme recomendado.')
    if dec in ('ATUALIZAR_DOC', 'REMOVER_DO_DOC'):
        return ('APROVADO', '')
    if dec == 'DECISAO_AUTORES':
        return ('NÃO APLICAR — registrar em bloqueios.md', 'Item DECISAO_AUTORES sem decisão explícita.')
    return ('', '')

cont = {}
for r in rows:
    d, o = classificar(r)
    r['decisao_autor'], r['observacao_autor'] = d, o
    cont[d.split(' (')[0].split(' —')[0]] = cont.get(d.split(' (')[0].split(' —')[0], 0) + 1

with open(CSV, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f, delimiter=';', quoting=csv.QUOTE_ALL)
    w.writerow(cols)
    for r in rows:
        w.writerow([r[c] for c in cols])
for k, v in sorted(cont.items(), key=lambda x: -x[1]):
    print(f'{v:4d}  {k}')
print('sem decisão:', [r['ID'] for r in rows if not r['decisao_autor']])
print('bloqueados (DECISAO_AUTORES sem decisão):', [r['ID'] for r in rows if r['decisao_autor'].startswith('NÃO APLICAR')])
