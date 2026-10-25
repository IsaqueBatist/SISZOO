# Pendências de documentação (DER / diagramas)

Notas de divergências entre o código real e os documentos de modelagem,
encontradas durante o desenvolvimento do frontend. Não corrigidas aqui
(fora do escopo de PRs de frontend) — registradas para quem mantém o DER/TCC
corrigir.

Nenhuma pendência aberta.

## Resolvidas

- **`AcaoAuditoria` sem `VISUALIZACAO` no DBML** — resolvida na T43:
  `docs/modulo1-usuarios-acesso.dbml` passou a listar `VISUALIZACAO` (T26,
  V12) e `ACESSO_NEGADO` (T43, V27), além da coluna `entidade_id` (V9).
