# Bloqueios e itens não aplicados — Fase 3 (22/10/2026)

Cada item traz a razão e o que falta decidir ou fazer. Atualizado ao longo da fase; a versão final está no
`relatorio_fase3.md`.

## Premissas que precisam de confirmação dos autores

| # | Item | Situação | Motivo / decisão pendente |
|---|---|---|---|
| B-01 | RF-A04 — exames e anexos clínicos | **Implementado em escopo mínimo** (V25/V26, `/api/exames`, `/api/animais/{id}/anexos`, aba Exames e cartão Anexos na ficha) | O marcador "[ESCOLHA]" veio em branco; o autor confirmou "execute" em seguida. Escopo adotado pelo prazo: `exame` (+ catálogo `tipo_exame`) como registro clínico imutável no padrão de `procedimento`, e `anexo_animal` (upload JPG/PNG/PDF no padrão de `anexo_ocorrencia`). Anexos por vacinação/procedimento/exame (`anexo_vacinacao`, `anexo_procedimento`, `anexo_exame`, Quadros 71/73/78) **não** entram: ficam na modelagem do documento com indicação de trabalho futuro. Decisão a confirmar: o documento descreve o anexo como "anexo do animal" (Quadro 69) e os demais como previstos. |
| B-02 | `Animal.data_saida` | Não implementado (decisão do autor) | O documento passa a tratá-lo como **limitação**: a saída é registrada apenas pela mudança de status; não há data de saída específica. O texto não pode afirmar que o campo existe. |

## Itens que ficam para trabalhos futuros (não implementar; manter na modelagem)

| # | Item | IDs da matriz | Tratamento no documento |
|---|---|---|---|
| B-03 | Adoção (tabela `adocao`, adotante, devolução) | F2-008 (parte), F2-031, F2-215 e atributos, relatório de adoções | Mantido em diagramas/dicionário/casos de uso com a indicação "modelado; implementação prevista em trabalhos futuros"; retirado do que é apresentado como implementado (cap. 5, telas, status dos RFs). Relatório de Adoções descrito como snapshot por status. |
| B-04 | Documento do processo (RF-B06, `documento_processo`, `tipo_documento_processo`, `StatusDocumento`) | F2-017, F2-050, F2-224, F2-227, F2-184 | Idem: mantido na modelagem com indicação de trabalho futuro; RN11 reescrita só para a exportação de relatórios. |
| B-05 | Playwright / testes E2E | F2-154 | Não implementado (também não foi adicionado ao projeto para as capturas: usado via `npx` em pasta temporária). Retirado do Quadro 14 como ferramenta em uso; Quadro 5 (S8) ajustado; Considerações Finais. |
| B-06 | E-mail automático à Vigilância Epidemiológica | F2-014 (parte), F2-066 | Decisão do autor (Opção C): não implementar; permanece mock em log (`NotificacaoResultadoService.notificarVigilanciaEpidemiologica`). Documentado como pendência em RN10, no UC "Registrar Resultado Laboratorial" e nas Considerações Finais. |

## Pedidos de backend trazidos pela branch de frontend (docs/contratos/) não tratados nesta fase

| # | Contrato | Situação | Observação |
|---|---|---|---|
| B-07 | `processos-filtro-urgente.md` (filtro `urgente` em GET /api/processos) | Não implementado | Não bloqueante: o card do dashboard pede `tamanho=50` e filtra no cliente. Melhoria P para depois da entrega. |
| B-08 | `ocorrencias-resumo-endereco.md` (endereço no resumo / lista de endereços) | Não implementado | Não bloqueante (só sugestão de preenchimento). Melhoria P. |
| B-09 | `distribuicao-ocorrencias-bairro.md` (agregação por bairro) | Não implementado | Não bloqueante (gráfico agrega no cliente até 500 ocorrências, com aviso). Melhoria M. |

## Dúvidas registradas para os autores

| # | Dúvida | Contexto |
|---|---|---|
| D-01 | Código parcial de itens de trabalho futuro | Existe código parcial relacionado à **adoção**: status `adotado` no catálogo, relatório "Adoções" (snapshot por status) e cartão "Adoções no mês" do dashboard marcado como dado ilustrativo (`isMock`). Nenhum deles foi apagado. O documento descreve o relatório como "perfil dos animais com status adotado" e o cartão do dashboard como indicador ilustrativo; confirmar se preferem omitir o cartão da T02. Para **documento do processo** e **Playwright** não há código parcial. |
| D-02 | `AcaoAuditoria.LOGOUT` e `EXPORTACAO` | Valores existem no enum e no documento, mas nunca são gravados (logout é só no cliente; exportação de relatório não audita). Documento descreve o estado real; implementar os dois eventos é P se os autores quiserem. |

## Itens do documento não aplicados ou aplicados com ressalva

| # | Item | Situação | Motivo |
|---|---|---|---|
| B-10 | Troca das imagens das Figuras 7–25 (diagramas) | Não aplicado (por regra da fase) | Sem fontes das imagens originais; PNG fiéis ao código gerados em `diagramas/` e listados em `diagramas_para_revisar.md` (N-11). |
| B-11 | Números de página da Lista de Figuras e da Lista de Quadros | Não aplicado | Listas estáticas; páginas mudam com as 23 figuras inseridas (N-07). |
| B-12 | Itens ATUALIZAR_DOC de granularidade fina da matriz (F2-141, F2-162, F2-170 em Figura 21, F2-175/F2-176 em Figura 22, F2-177/F2-179–F2-181 em Figura 24, F2-185 em Figura 25, F2-193 em Figuras 7/12, F2-194/F2-195 lógico) | Aplicados apenas no texto e no dicionário | A parte "figura" desses itens depende da troca de diagramas (B-10). |
| B-13 | F2-586 (página "Em construção", rota `*`) e F2-590 (oxlint) | Não aplicados | Opcionais segundo a matriz; sem valor para o documento. |
| B-14 | F2-603 (`usuario.dois_fatores_ativo`) e D-02 (LOGOUT/EXPORTACAO nunca gravados) | Aplicados como "reservado" no Quadro 57/diagrama M1 | Decisão de remover a coluna/valores em migration futura fica com os autores. |

_Itens DECISAO_AUTORES da matriz sem decisão explícita: nenhum (os 19 itens dessa categoria estão cobertos pelas decisões F2-004, F2-008, F2-014, F2-027, F2-059 e F2-065 ou por seus dependentes)._
