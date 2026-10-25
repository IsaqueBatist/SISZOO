# Pedido — filtro de data em GET /api/ocorrencias

Status: **implementado (22/10/2026, alinhamento com o TG — `docs/decisoes/alinhamento-tg.md` AT-11)**.
`GET /api/ocorrencias?de=AAAA-MM-DD&ate=AAAA-MM-DD` filtra pela `data_abertura` (limites inclusivos; qualquer um dos
dois pode faltar), combinável com `tipo`, `status` e `q`. A tela de Ocorrências expõe os dois campos de data.
Teste: `OcorrenciaFiltroDataIT`. O KPI "ocorrências registradas hoje" do dashboard é calculado no backend
(`DashboardService`, T38), então o pedido abaixo ficou coberto pelos dois lados. O texto abaixo é o pedido original.

## Contexto

O KPI "Ocorrências registradas hoje" do dashboard (ver
`docs/contratos/dashboard-kpis.md`) busca `GET /api/ocorrencias` com uma
página grande (`tamanho` fixo em constante nomeada) e filtra "hoje" no
cliente, porque o endpoint só filtra por `tipo`/`status`/`q`, sem data.

Isso tem dois limites: (1) se o CCZ tiver mais ocorrências do que o
`tamanho` pedido, o KPI fica incompleto silenciosamente; (2) o cliente baixa
mais dado do que precisa para calcular um número do dia.

(O gráfico "Distribuição de ocorrências por bairro" tem uma limitação
parecida, mas de volume total, não de data — ver pedido separado em
`docs/contratos/distribuicao-ocorrencias-bairro.md`.)

## Pedido

Parâmetro opcional de data em `GET /api/ocorrencias`, por exemplo:

```
GET /api/ocorrencias?dataAbertura=2026-05-20
```

ou um intervalo (`?de=2026-05-01&ate=2026-05-20`), o que for mais simples de
implementar — qualquer um resolve o problema do frontend. Sem o parâmetro,
comportamento atual inalterado (retrocompatível).
