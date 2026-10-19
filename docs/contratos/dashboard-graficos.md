# Contrato — GET /api/dashboard/graficos

Status: **proposta do frontend, endpoint ainda não implementado** (pacote
`com.siszoo.relatorios` é um esqueleto vazio — ver `docs/modulo5-relatorios.dbml`).

Alimenta 2 dos 4 gráficos do mural no dashboard: "Casos Suspeitos" (donuts de
doença e de raiva por espécie) e "Resultados Laboratoriais" (barras).

**Não inclui ocupação por baia.** Esse gráfico já é real hoje, consumido
direto de `GET /baias` (módulo `animais`, já implementado) — não precisa de
nada novo no backend.

Enquanto este endpoint não existe, o frontend usa um mock local
(`frontend/src/features/graficos/api/graficosApi.mock.ts`), selecionado pela
env var `VITE_USE_MOCK_GRAFICOS` (default `true`). Trocar para a API real
exige só mudar essa variável para `false`.

## Requisição

```
GET /api/dashboard/graficos?ano=2026
Authorization: Bearer <token>
```

`ano` (opcional): filtra os dados ao ano informado. Sem o parâmetro, o
backend assume o ano corrente no fuso `America/São_Paulo` (fixo no
projeto).

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

### `casosPorDoenca`

Contagem de processos sanitários abertos no ano filtrado, agrupados por
`doenca` (catálogo de 6 itens: `raiva`, `esporotricose`,
`leishmaniose_visceral`, `leptospirose`, `febre_maculosa`, `febre_amarela`).
**Sempre devolver as 6 doenças**, mesmo com `quantidade: 0` — o frontend
exibe a fatia zerada no gráfico em vez de omitir a categoria.

### `casosRaivaPorEspecie`

Mesma contagem, mas só para `doenca = raiva`, agrupada por `especie` da
amostra (catálogo de 4 itens: `canino`, `felino`, `quiroptero`, `pnh`).
Mesma regra: sempre as 4 espécies, mesmo com `quantidade: 0`.

### `resultadosPorDoenca`

**Lista dinâmica** (diferente das duas acima): só entram as doenças que
tiveram pelo menos 1 resultado laboratorial (`positivo` ou `negativo`)
lançado no ano filtrado. `positivos` e `negativos` contam processos distintos
(resultado vigente de cada processo, não o histórico de retificações — ver
`resultado_processo` no módulo `processos`).

## Dúvida para o backend

"Casos" aqui significa processo sanitário aberto (`processo_sanitario.doenca`)
ou amostra individual dentro do processo? O protótipo (`dashboard.html`) não
deixa claro. O frontend assumiu "processo" (1 processo = 1 caso) porque é a
granularidade mais próxima do que já existe em `GET /processos` — mas isso
precisa de confirmação de quem implementar, já que um processo pode ter
várias amostras.
