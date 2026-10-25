# Pendências de documentação (DER / diagramas / TG)

Notas de divergências entre o código real e os documentos de modelagem, registradas para quem mantém o DER/TG corrigir.

## Abertas

- **Figuras 7–25 do TG (DER, lógicos, classes, enumerações)** são as originais e divergem do schema atual nos pontos
  listados em `docs/tg/analise_fase3/diagramas_para_revisar.md`; PNG fiéis ao código em `docs/tg/analise_fase3/diagramas/`.
  Os autores decidem a substituição no `.docx`.
- **Folha de aprovação** do TG não inserida (NBR 14724) — decisão dos autores em 23/10/2026.
- **Quadros e figuras não citados** no texto do TG antes de aparecerem (achados F1-053/F1-054).
- **V28 (`animal.foto_miniatura`, T45)** consta no cabeçalho de estado do `DER.md` e no DBML do módulo 2, mas a regra de
  geração da miniatura ainda não está descrita em §3.2.
- **`usuario.dois_fatores_ativo`** existe no schema e não é usado pela aplicação (reservado); decidir remover em
  migration futura ou implementar.
- **`V11__remove_acesso_vet_ocorrencias.sql`** traz no comentário da linha 1 o placeholder `[fonte: ______]` (a origem da
  decisão de tirar o Veterinário de ocorrências nunca foi preenchida). A migration já foi aplicada e não pode ser editada:
  qualquer mudança, até em comentário, altera o checksum do Flyway e quebra a validação nos bancos existentes. A fonte
  deve ser registrada aqui ou em `decisoes/` quando os autores a identificarem.

## Resolvidas

- **Seed oficial criava ocorrências encerradas antes da abertura** (tempo médio negativo no relatório "Ocorrências por
  Bairro", `docs/tg/analise_fase3/relatorio_fase4.md` P4-06) — o `scripts/seed-test-data.mjs` foi substituído em
  25/10/2026 pelo seed Java (`com.siszoo.seed`), que encerra pelo `OcorrenciaService` com o Clock: o encerramento nunca é
  anterior ao registro (`docs/decisoes/seed-dev.md`).

- **`AcaoAuditoria` sem `VISUALIZACAO` no DBML** — resolvida na T43 (`VISUALIZACAO`, `ACESSO_NEGADO`, `entidade_id`).
- **DBML dos módulos 2–5 desatualizados** (enums `EM_ANDAMENTO`, `StatusRelatorio`, `Sexo FÊMEA`, `numero_microchip`,
  `Animal.data_entrada date`, `responsavel_id` no processo, tabelas sem `retifica_id`) — reescritos em 25/10/2026 a partir
  das migrations V1–V28; tabelas só modeladas levam `Note: 'modelo-alvo…'`.
- **DER.md §3.2/§3.4/§3.5/§3.8 sem as mudanças do alinhamento com o TG** (V23–V26, RN10 com `inconclusivo`, filtros
  `de`/`ate`, filtros de auditoria, auditoria de animal/baia) — atualizado em 25/10/2026 (`docs/decisoes/alinhamento-tg.md`).
- **Contratos `auditoria-filtros`, `ocorrencias-filtro-data`, `processos-filtro-urgente`, `distribuicao-ocorrencias-bairro`**
  — atendidos (22/10/2026 e T45); status atualizado nos arquivos.
