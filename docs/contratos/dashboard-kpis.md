# Contrato — GET /api/dashboard/kpis

Status: **proposta do frontend, endpoint ainda não implementado** (pacote
`com.siszoo.relatorios` é um esqueleto vazio — ver `docs/modulo5-relatorios.dbml`).

Importante: isso **não** é o mesmo mecanismo da tabela `RelatorioGerado`
(módulo 05, relatórios gerados de forma assíncrona e baixados como arquivo).
É um endpoint de leitura síncrona, calculado on-the-fly a partir das tabelas
já existentes (animais, vacinações, adoções/status, ocorrências) — sem
persistir nada novo.

**Atualização**: `animais` e `ocorrencias` já são calculados em tempo real no
frontend hoje, a partir de `GET /animais` e `GET /ocorrencias` (já existem e
estão em produção) — ver `frontend/src/features/dashboard/api/dashboardApi.ts::buscarKpisParciaisReais`.
Esses dois blocos **não dependem mais deste endpoint**; implementá-lo, para
eles, seria só uma otimização (uma query agregada no backend em vez de
`tamanho` grande + filtro no cliente). Só `vacinacao` e `adocoes` continuam
bloqueados: não existe hoje endpoint que conte "animais com vacina em dia",
nem campo de data de adoção em `Animal` para calcular "adoções no mês".

Enquanto o endpoint não existe, o frontend usa um mock local só para
`vacinacao`/`adocoes` (`frontend/src/features/dashboard/api/dashboardApi.mock.ts`),
selecionado pela env var `VITE_USE_MOCK_KPIS` (default `true`). Trocar para a
API real exige só mudar essa variável para `false` — nenhum componente
precisa mudar.

## Requisição

```
GET /api/dashboard/kpis
Authorization: Bearer <token>
```

Sem parâmetros por ora. Os quatro números abaixo são "hoje"/"mês corrente"/
"semana corrente", calculados no fuso `America/São_Paulo` (fixo no projeto).

## Resposta — 200 OK

```json
{
  "animais": {
    "total": 147,
    "caninos": 123,
    "felinos": 24,
    "variacaoSemanal": 12
  },
  "vacinacao": {
    "percentualVacinados": 84,
    "vacinados": 123,
    "total": 147,
    "variacaoSemanalPontos": 5.2
  },
  "adocoes": {
    "noMes": 8,
    "metaMensal": 12,
    "variacaoSemanal": 2
  },
  "ocorrencias": {
    "registradasHoje": 4,
    "mediaPorHora": 1,
    "variacaoSemanal": -2
  }
}
```

`ocorrencias.registradasHoje` conta **qualquer status** (não só `ABERTA`) —
é volume de registro do dia, não contagem de ocorrências em aberto.

### Campos opcionais

`animais.variacaoSemanal`, `vacinacao.variacaoSemanalPontos`,
`adocoes.variacaoSemanal`, `ocorrencias.mediaPorHora` e
`ocorrencias.variacaoSemanal` são **opcionais**: quando não houver uma janela
de comparação válida (ex. primeira semana de operação do sistema, sem dado
da semana anterior), omita o campo em vez de mandar `0` — o card do
dashboard esconde o delta quando o campo está ausente, em vez de mostrar uma
variação falsa de "0%".

### Significado de cada campo

| Campo | Descrição |
|---|---|
| `animais.total` | Total de animais sob custódia (status ≠ adotado/óbito/transferido) |
| `animais.caninos` / `.felinos` | Subtotal por espécie, dentro do total acima |
| `animais.variacaoSemanal` | Delta de `total` vs. mesmo indicador há 7 dias (pode ser negativo) |
| `vacinacao.percentualVacinados` | `vacinados / total * 100`, arredondado |
| `vacinacao.vacinados` / `.total` | Numerador/denominador do percentual, para exibir "123 de 147" |
| `vacinacao.variacaoSemanalPontos` | Delta em **pontos percentuais** (não %) vs. 7 dias atrás |
| `adocoes.noMes` | Adoções concluídas desde o 1º dia do mês corrente |
| `adocoes.metaMensal` | Meta institucional do mês (parâmetro de configuração do CCZ — a decidir onde fica armazenado) |
| `ocorrencias.registradasHoje` | Ocorrências com `dataAbertura` = hoje (fuso America/São_Paulo), qualquer status |
| `ocorrencias.mediaPorHora` | `registradasHoje / horas decorridas do dia`, arredondado |

## Dúvida para o backend

Onde fica a "meta mensal de adoções" (`adocoes.metaMensal`)? Não há campo
correspondente no DER hoje. Pode ser uma constante de configuração, uma
tabela de parâmetros, ou algo a decidir junto com quem for implementar — o
frontend só consome o valor que a API devolver, não assume de onde vem.
