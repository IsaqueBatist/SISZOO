# Pedido — filtros de servidor em GET /api/auditoria

Status: **pedido do frontend, endpoint existente, sem filtro de servidor**.

## Contexto

A tela de Logs (`frontend/src/features/auditoria/components/Logs.tsx`, rota
`/logs`, só Admin) consome `GET /api/auditoria?pagina=&tamanho=`
(`AuditoriaController.java`), que já existe e funciona — só pagina, sem
filtrar por `acao`/`entidade`/`usuarioId`/data.

Hoje os filtros da tela (ação, entidade, usuário) atuam **só sobre a página
já carregada** — cada opção de filtro é montada a partir dos próprios
eventos da página atual, não de um catálogo completo. Isso fica visível na
UI: quando algum filtro está ativo, a tela mostra "Filtro aplicado aos N
eventos desta página (de X no total)" — não finge que o filtro cobre todo o
histórico.

## Pedido

Parâmetros opcionais em `GET /api/auditoria`, por exemplo:

```
GET /api/auditoria?acao=LOGIN&entidade=usuario&usuarioId=<uuid>&de=2026-05-01&ate=2026-05-20&pagina=0&tamanho=20
```

Sem os parâmetros, comportamento atual inalterado (retrocompatível). Resolve
a limitação acima e evita que o volume de eventos de auditoria cresça sem
uma forma real de filtrar no servidor.

Também seria útil um parâmetro `modulo` (`USUARIOS_ACESSO`, `GESTAO_ANIMAIS`,
`OCORRENCIAS_DENUNCIAS`, `PROCESSOS_SANITARIOS`, `RELATORIOS`). Hoje a tela
agrupa visualmente por módulo inferindo-o no frontend a partir da string
livre `entidade` (`frontend/src/features/auditoria/utils/moduloDaEntidade.ts`),
porque `auditoria_evento` não guarda módulo — só funciona enquanto as
strings de entidade usadas pelo backend não mudarem.

## Pedido adicional — valor antes/depois do evento

`auditoria_evento` já tem as colunas `payload_antes`/`payload_depois`, mas
`AuditoriaEventoResponse` (DTO) não as expõe — a tela de Logs não tem acesso
a esse dado hoje, mesmo que quisesse mostrá-lo. Pedido: incluir
`payloadAntes`/`payloadDepois` (ou nomes equivalentes) em
`AuditoriaEventoResponse`, para permitir mostrar o valor antes/depois de cada
alteração na tela de auditoria. Sem isso, essa informação continua invisível
na UI, apesar de já existir no banco.
