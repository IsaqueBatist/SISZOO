# Pendências de documentação (DER / diagramas / TG)

Notas de divergências entre o código real e os documentos de modelagem, registradas para quem mantém o DER/TG corrigir.

## Abertas

- **Figuras 7–25 do TG (DER, lógicos, classes, enumerações)** são as originais e divergem do schema atual nos pontos
  listados em `docs/tg/analise_fase3/diagramas_para_revisar.md`; PNG fiéis ao código em `docs/tg/analise_fase3/diagramas/`.
  Os autores decidem a substituição no `.docx`.
- **Folha de aprovação** do TG não inserida (NBR 14724) — decisão dos autores em 23/10/2026.
- **Quadros e figuras não citados** no texto do TG antes de aparecerem (achados F1-053/F1-054).
- **Seed oficial** (`scripts/seed-test-data.mjs`) cria ocorrências encerradas antes da abertura: o relatório
  "Ocorrências por Bairro" mostra tempo médio negativo (`docs/tg/analise_fase3/relatorio_fase4.md` P4-06).
- **V28 (`animal.foto_miniatura`, T45)** consta no cabeçalho de estado do `DER.md` e no DBML do módulo 2, mas a regra de
  geração da miniatura ainda não está descrita em §3.2.
- **`usuario.dois_fatores_ativo`** existe no schema e não é usado pela aplicação (reservado); decidir remover em
  migration futura ou implementar.

## Resolvidas

- **`AcaoAuditoria` sem `VISUALIZACAO` no DBML** — resolvida na T43 (`VISUALIZACAO`, `ACESSO_NEGADO`, `entidade_id`).
- **DBML dos módulos 2–5 desatualizados** (enums `EM_ANDAMENTO`, `StatusRelatorio`, `Sexo FÊMEA`, `numero_microchip`,
  `Animal.data_entrada date`, `responsavel_id` no processo, tabelas sem `retifica_id`) — reescritos em 25/10/2026 a partir
  das migrations V1–V28; tabelas só modeladas levam `Note: 'modelo-alvo…'`.
- **DER.md §3.2/§3.4/§3.5/§3.8 sem as mudanças do alinhamento com o TG** (V23–V26, RN10 com `inconclusivo`, filtros
  `de`/`ate`, filtros de auditoria, auditoria de animal/baia) — atualizado em 25/10/2026 (`docs/decisoes/alinhamento-tg.md`).
- **Contratos `auditoria-filtros`, `ocorrencias-filtro-data`, `processos-filtro-urgente`, `distribuicao-ocorrencias-bairro`**
  — atendidos (22/10/2026 e T45); status atualizado nos arquivos.
