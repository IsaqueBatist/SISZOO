# Pendências de documentação (DER / diagramas)

Notas de divergências entre o código real e os documentos de modelagem,
encontradas durante o desenvolvimento do frontend. Não corrigidas aqui
(fora do escopo de PRs de frontend) — registradas para quem mantém o DER/TCC
corrigir.

## `AcaoAuditoria` — falta `VISUALIZACAO` no DER

`docs/modulo1-usuarios-acesso.dbml` (enum `AcaoAuditoria`, módulo
Usuários/Acesso) lista 8 valores:

```
CRIACAO, ATUALIZACAO, DESATIVACAO, REATIVACAO, LOGIN, LOGOUT, EXPORTACAO, ENCERRAMENTO
```

O enum Java real (`backend/src/main/java/com/siszoo/usuarios/entity/AcaoAuditoria.java`)
tem um 9º valor:

```java
public enum AcaoAuditoria {
    CRIACAO, ATUALIZACAO, DESATIVACAO, REATIVACAO, LOGIN, LOGOUT, EXPORTACAO, ENCERRAMENTO,
    // T26 (V12): acesso autorizado ao denunciante de ocorrencia sigilosa.
    VISUALIZACAO
}
```

`VISUALIZACAO` foi adicionado na T26 (migration V12) para auditar o acesso
do Admin aos dados do denunciante em ocorrência sigilosa (regra de LGPD do
projeto) e é usado de verdade em produção
(`com.siszoo.ocorrencias.service.OcorrenciaService`), mas o `.dbml` nunca foi
atualizado.

**Sugestão**: adicionar `VISUALIZACAO` ao enum `AcaoAuditoria` em
`docs/modulo1-usuarios-acesso.dbml`.
