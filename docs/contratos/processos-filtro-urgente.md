# Pedido — filtro `urgente` em GET /api/processos

Status: **pedido do frontend, endpoint existente, filtro ainda não suportado**.

## Contexto

O dashboard (T39) tem um card de alerta para processos sanitários urgentes
(contato humano-animal, regra 18 — já aplicada 100% no backend ao criar o
processo, o frontend nunca recalcula isso). Hoje `GET /api/processos` ordena
`urgente desc, dataAbertura desc`, mas não tem um parâmetro de query para
filtrar só os urgentes.

O card atual (`frontend/src/features/dashboard/hooks/useAlertaProcessosUrgentes.ts`)
contorna isso pedindo uma página de `tamanho=50` e filtrando `urgente ===
true` no cliente. Funciona porque o backend já ordena urgentes primeiro, mas
tem um limite: se houver mais de 50 processos urgentes abertos ao mesmo
tempo, o card perde itens silenciosamente (sem erro — só não aparecem).

## Pedido

Adicionar um parâmetro de query opcional em `GET /api/processos`:

```
GET /api/processos?urgente=true&pagina=0&tamanho=20
```

Quando presente, filtra a listagem para só os processos com `urgente =
true` (mantendo a paginação normal). Sem o parâmetro, comportamento atual
inalterado (retrocompatível).

Alternativa equivalente, se for mais simples de implementar: um endpoint
dedicado de contagem/lista curta, ex. `GET /api/processos/urgentes`, sem
paginação, já que o volume esperado de urgentes simultâneos é pequeno.
Qualquer uma das duas resolve o problema do frontend — a decisão de qual é
mais simples no backend fica com quem for implementar.
