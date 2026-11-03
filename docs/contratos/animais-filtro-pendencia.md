# Contrato - filtro `pendencia` em GET /api/animais

Status: **implementado (02/11/2026)**. `AnimalController` aceita `pendencia` opcional ao lado de `status`, `custodia`,
`especie`, `baiaId` e `q`; o filtro é montado em `AnimalService.predicadoDaPendencia` e as regras ficam em
`animais/service/PendenciaAnimal.java`, que o `DashboardService` também usa. Teste: `AnimalPendenciaIT`.

## Motivo

Os alertas do dashboard (`GET /api/dashboard/kpis`, campo `alertas`) traziam só a contagem. O funcionário via
"6 animal(is) com ficha incompleta" sem saber quais eram nem como chegar até eles. Com o filtro, o alerta mostra
alguns nomes e leva à listagem com exatamente os mesmos registros.

## Parâmetro

```
GET /api/animais?pendencia=ficha_incompleta&pagina=0&tamanho=20
```

| Valor | Regra (mesma do alerta do dashboard) |
|---|---|
| `ficha_incompleta` | Sob custódia e `ficha_completa = false` (sem microchip ou sem vacinação vigente, `FichaCompletaService`). |
| `sem_avaliacao_30d` | Sob custódia e sem procedimento não retificado com data nos últimos 30 dias. |
| `nao_castrado` | Status `disponivel_adocao` e `esterilizado = false`. |
| `medicacao_ativa` | Sob custódia e com prescrição `ATIVA` cuja `data_fim_prevista` está entre hoje e hoje + 7 dias. |

- Sem o parâmetro, a listagem não muda (retrocompatível). Combina com os demais filtros e com a paginação.
- Valor desconhecido: **422**, campo `pendencia`.
- `medicacao_ativa` conta **animais**; o alerta `medicacao_ativa` de `/dashboard/kpis` conta **prescrições**. Um animal
  com duas prescrições terminando na janela aparece uma vez na listagem e duas vezes no alerta. O dashboard do
  frontend usa a listagem, então mostra animais.

## Uso no frontend

- `features/dashboard/hooks/usePendenciasDashboard.ts` pede `tamanho=3` por pendência: usa `totalItens` como
  quantidade e os itens como os nomes exibidos.
- `features/animais/components/Animais.tsx` aceita `?pendencia=` no link, mostra o filtro "Pendência" e explica a regra
  (`features/animais/utils/pendenciasAnimal.ts`).
