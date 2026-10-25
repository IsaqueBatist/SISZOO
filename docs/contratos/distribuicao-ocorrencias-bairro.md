# Pedido — agregação de ocorrências por bairro

Status: **implementado (T45, PR #113)**. `GET /api/ocorrencias/estatisticas/bairro` devolve a contagem por bairro
agregada no banco; o gráfico e as sugestões de bairro do formulário usam esse endpoint (`ocorrencias/api`,
`useSugestoesBairro`). O texto abaixo é o pedido original.

## Contexto

O gráfico "Distribuição de ocorrências por bairro" (`frontend/src/features/ocorrencias/components/GraficoOcorrenciasPorBairro.tsx`,
na tela de Ocorrências) conta ocorrências por bairro para mostrar os bairros
com mais registros. Hoje isso é calculado 100% no cliente: busca
`GET /api/ocorrencias?pagina=0&tamanho=500` (`LIMITE_OCORRENCIAS_GRAFICO`,
paliativo) e agrupa por `bairro` em `mapearOcorrenciasPorBairro.ts`.

Limite: se o CCZ tiver mais de 500 ocorrências cadastradas, o gráfico passa
a mostrar só "as 500 mais recentes" (aviso já exibido na tela nesse caso),
não a distribuição real de todo o histórico.

## Pedido (não bloqueante — o cliente já tem um fallback aceitável)

Um endpoint de agregação, por exemplo:

```
GET /api/ocorrencias/estatisticas/bairro
```

devolvendo `[{ "bairro": "Centro", "quantidade": 42 }, ...]` já contado no
banco, sem trazer os registros individuais. Resolveria o limite de volume
acima e seria mais barato que baixar até 500 registros só para contar.

## Qualidade do dado

`Ocorrencia.bairro` é texto livre (sem catálogo/enum) — grafias diferentes
da mesma região (ex. "Centro" vs. "centro", ou com/sem acento) hoje são
agrupadas no cliente por uma normalização simples (minúsculo + sem acento),
mas isso é uma correção de leitura, não dos dados — o banco continua com as
grafias originais. Se um catálogo de bairros de Itu/SP vier a existir no
DER, o agrupamento ficaria mais preciso (e essa normalização no cliente
deixaria de ser necessária).
