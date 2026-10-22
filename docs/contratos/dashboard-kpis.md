# Contrato — GET /api/dashboard/kpis

Status: **implementado (T38)** — `com.siszoo.relatorios.controller.DashboardController`.

Importante: isso **não** é o mesmo mecanismo da tabela `relatorio_gerado`
(módulo 05, relatórios gerados de forma assíncrona e baixados como arquivo).
É um endpoint de leitura síncrona, calculado on-the-fly a partir das tabelas
já existentes (animal, vacinacao, prescricao, baia, ocorrencia) — sem
persistir nada novo. Protegido por `RELATORIOS:leitura`, seedado para os 3
perfis (Administrador, Veterinário, Agente Sanitário — `V3__seed_cargos.sql`).
Cacheado por 5 minutos (Caffeine, `CacheConfig`) — ver "Atraso do cache"
abaixo.

## Requisição

```
GET /api/dashboard/kpis
Authorization: Bearer <token>
```

Sem parâmetros. "Hoje"/"mês corrente" são calculados no fuso
`America/Sao_Paulo` (fixo no projeto, `ClockConfig`).

## Resposta — 200 OK

```json
{
  "animais": {
    "total": 147,
    "caninos": 123,
    "felinos": 24
  },
  "vacinacao": {
    "percentualVacinados": 84,
    "vacinados": 123,
    "total": 147
  },
  "ocorrencias": {
    "registradasHoje": 4,
    "mediaPorHora": 0.5
  },
  "alertas": [
    { "tipo": "vacina_vencendo", "severidade": "atencao", "titulo": "3 vacina(s) vencendo em até 7 dias", "descricao": "...", "total": 3 },
    { "tipo": "vacina_vencida", "severidade": "critico", "titulo": "1 vacina(s) vencida(s)", "descricao": "...", "total": 1 },
    { "tipo": "sem_avaliacao_30d", "severidade": "atencao", "titulo": "...", "descricao": "...", "total": 2 },
    { "tipo": "baia_superlotada", "severidade": "critico", "titulo": "...", "descricao": "...", "total": 0 },
    { "tipo": "medicacao_ativa", "severidade": "info", "titulo": "...", "descricao": "...", "total": 1 },
    { "tipo": "ficha_incompleta", "severidade": "info", "titulo": "...", "descricao": "...", "total": 5 },
    { "tipo": "nao_castrado", "severidade": "info", "titulo": "...", "descricao": "...", "total": 9 }
  ]
}
```

### Sem bloco `adocoes` (divergência DER vs. código, decisão registrada)

O DER documenta uma tabela `adocao` (com `data_adocao`), mas ela **nunca foi
implementada** — sem migration, sem entidade, sem rastro em auditoria
(`AnimalService` não grava quando o status muda para `adotado`). Não existe
hoje nenhuma fonte de dados confiável para "adoções no mês" nem para a meta
mensal. Decisão (consultada com o time): o bloco fica **fora da resposta**
até uma tarefa futura criar essa tabela — o frontend continua usando o mock
local (`VITE_USE_MOCK_KPIS`) só para esse card.

### `alertas` — os 6 alertas críticos do DER §3.7

7 entradas no array: o DER fala em "6 alertas críticos", mas o alerta de
vacina tem 2 severidades (`vacina_vencendo` e `vacina_vencida`, enum
`tipo_alerta` do DER) — contadas e exibidas separadamente, reaproveitando
`com.siszoo.alertas.AlertaVacinalService` (T21, `GET /api/alertas/vacinas`)
em vez de duplicar a regra RN-A01..A05. Os outros 5 tipos são novos desta
tarefa. Cada entrada sempre aparece, mesmo com `total: 0`.

| `tipo` | Regra (DER §3.7) |
|---|---|
| `vacina_vencendo` | Vacinação vigente com `dataValidade` entre hoje e hoje+7d |
| `vacina_vencida` | Vacinação vigente com `dataValidade` < hoje |
| `sem_avaliacao_30d` | Animal sob custódia sem procedimento vigente nos últimos 30 dias (inclui quem nunca teve procedimento) |
| `baia_superlotada` | Baia ativa com ocupação ≥ capacidade (mesmo critério de `BaiaResponse.superlotada`) |
| `medicacao_ativa` | Prescrição `ATIVA` com `dataFimPrevista` entre hoje e hoje+7d |
| `ficha_incompleta` | `Animal.fichaCompleta = false` |
| `nao_castrado` | `Animal.esterilizado = false` e `status = disponivel_adocao` |

Todos os alertas consideram só animais/baias sob custódia
(`StatusAnimal.CODIGOS_SOB_CUSTODIA`), exceto `baia_superlotada` (todas as
baias ativas) e `nao_castrado` (só `disponivel_adocao`, não todo "sob
custódia" — regra literal do DER).

### Significado de cada campo

| Campo | Descrição |
|---|---|
| `animais.total` | Total de animais sob custódia (status ≠ adotado/óbito/transferido) |
| `animais.caninos` / `.felinos` | Subtotal por espécie, dentro do total acima |
| `vacinacao.percentualVacinados` | `vacinados / total * 100`, arredondado |
| `vacinacao.vacinados` | Animais sob custódia com **ao menos uma** vacinação vigente não vencida (decisão de produto: não existe conceito de "protocolo vacinal completo" no modelo — `Vacina` é um catálogo sem vínculo de espécie ou obrigatoriedade) |
| `vacinacao.total` | Mesmo valor de `animais.total` |
| `ocorrencias.registradasHoje` | Ocorrências com `dataAbertura` = hoje, qualquer status, **excluindo** `providenciaTomada = registro_indevido` (decisão registrada em `V10__schema_ocorrencias.sql`) |
| `ocorrencias.mediaPorHora` | `registradasHoje / hora atual (0-23) em America/Sao_Paulo` — omitido (`null`) na virada do dia (hora 0) |

### Sem campos de variação semanal

Nenhum bloco tem `variacaoSemanal*`: o sistema não guarda nenhum snapshot
histórico de contagem (sem tabela de série temporal), então não há como
calcular um delta real vs. 7 dias atrás sem inventar um mecanismo novo fora
do escopo desta tarefa. Fica para uma tarefa futura, se o CCZ precisar do
indicador.

### Atraso do cache

TTL de 5 minutos (Caffeine, sem `@CacheEvict`): uma mudança real (nova
vacinação, novo animal, baia lotando) pode levar até 5 minutos para aparecer
no dashboard. Decisão aceita para não recalcular as agregações a cada
refresh/polling em máquinas com ~2GB RAM.
