# Contrato — GET /api/dashboard/graficos

Status: **implementado (T38)** — `com.siszoo.relatorios.controller.DashboardController`.

Alimenta 2 dos 4 gráficos do mural no dashboard: "Casos Suspeitos" (donuts de
doença e de raiva por espécie) e "Resultados Laboratoriais" (barras).
Protegido por `RELATORIOS:leitura` (os 3 perfis). Cacheado por 5 minutos por
ano (Caffeine, `CacheConfig`) — ver `docs/contratos/dashboard-kpis.md` para o
atraso que isso pode introduzir.

**Não inclui ocupação por baia.** Esse gráfico já é real hoje, consumido
direto de `GET /baias` (módulo `animais`) — não precisa de nada novo no
backend.

## Requisição

```
GET /api/dashboard/graficos?ano=2026
Authorization: Bearer <token>
```

`ano` (opcional): filtra os dados ao ano informado. Sem o parâmetro, o
backend assume o ano corrente no fuso `America/Sao_Paulo`. Sem validação de
intervalo — um ano sem nenhum dado simplesmente devolve os catálogos
zerados/listas vazias.

## Resposta — 200 OK

```json
{
  "casosPorDoenca": [
    { "doenca": { "codigo": "raiva", "nome": "Raiva" }, "quantidade": 7 },
    { "doenca": { "codigo": "leishmaniose_visceral", "nome": "Leishmaniose Visceral" }, "quantidade": 5 },
    { "doenca": { "codigo": "leptospirose", "nome": "Leptospirose" }, "quantidade": 4 },
    { "doenca": { "codigo": "esporotricose", "nome": "Esporotricose" }, "quantidade": 3 },
    { "doenca": { "codigo": "febre_maculosa", "nome": "Febre Maculosa" }, "quantidade": 1 },
    { "doenca": { "codigo": "febre_amarela", "nome": "Febre Amarela" }, "quantidade": 0 }
  ],
  "casosRaivaPorEspecie": [
    { "especie": { "codigo": "canino", "nome": "Canino" }, "quantidade": 10 },
    { "especie": { "codigo": "felino", "nome": "Felino" }, "quantidade": 5 },
    { "especie": { "codigo": "pnh", "nome": "Primata não-humano" }, "quantidade": 3 },
    { "especie": { "codigo": "quiroptero", "nome": "Quiróptero" }, "quantidade": 2 }
  ],
  "resultadosPorDoenca": [
    { "doenca": { "codigo": "leishmaniose_visceral", "nome": "Leishmaniose Visceral" }, "positivos": 0, "negativos": 3 },
    { "doenca": { "codigo": "esporotricose", "nome": "Esporotricose" }, "positivos": 2, "negativos": 3 }
  ]
}
```

### `casosPorDoenca` — decisão: "caso" = processo sanitário

Contagem de `ProcessoSanitario` abertos no ano filtrado (`dataAbertura`),
agrupados por `doenca` (catálogo de 6 itens: `raiva`, `esporotricose`,
`leishmaniose_visceral`, `leptospirose`, `febre_maculosa`, `febre_amarela`).
**Sempre devolve as 6 doenças**, mesmo com `quantidade: 0`. "1 processo = 1
caso" porque `doenca` vive direto em `ProcessoSanitario`, não na amostra —
é a granularidade mais próxima do que já existe em `GET /processos`.

### `casosRaivaPorEspecie` — decisão: conta por amostra, pode exceder o total de processos

Mesmo filtro de ano (`dataAbertura`), só `doenca = raiva`, agrupado por
`especie` **da amostra** (catálogo de 4 itens: `canino`, `felino`,
`quiroptero`, `pnh`). Sempre devolve as 4 espécies, mesmo com `quantidade: 0`.

Diferente de `casosPorDoenca`: como um processo pode ter várias amostras
(`animal_amostrado`, 1:N), um processo com amostras de espécies diferentes
**conta uma vez em cada espécie** — a soma de `casosRaivaPorEspecie` pode
ser maior que o total de processos de raiva no ano. Duas amostras do mesmo
processo e da mesma espécie contam só uma vez (`COUNT(DISTINCT processo)`).

### `resultadosPorDoenca` — lista dinâmica, ano do resultado

**Lista dinâmica** (diferente das duas acima): só entram as doenças que
tiveram pelo menos 1 resultado laboratorial **positivo ou negativo**
lançado no ano filtrado. `positivos`/`negativos` contam o **resultado
vigente** de cada processo (`ProcessoSanitario.resultadoLaboratorial`, não o
histórico de retificações em `resultado_processo`). Os demais códigos do
catálogo (`aguardando`, `inconclusivo`, `material_inadequado`,
`nao_realizado`) nunca contam como positivo nem negativo.

O ano filtra pela **data do resultado** (`dataResultado`), não pela data de
abertura do processo — um processo aberto em 2025 com resultado lançado em
2026 aparece em `resultadosPorDoenca` do ano 2026, não 2025.
