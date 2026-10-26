package com.siszoo.relatorios.dto;

import java.util.List;

// "adocoes" e um snapshot por status do animal (KpiAdocoesResponse): o DER
// documenta a tabela `adocao` (§3.x, data_adocao), mas ela nunca foi
// implementada, entao "adoções no mês" e meta mensal ficam fora até uma tarefa
// futura criar essa tabela. Decisão registrada em docs/contratos/dashboard-kpis.md.
public record DashboardKpisResponse(
        KpiAnimaisResponse animais,
        KpiVacinacaoResponse vacinacao,
        KpiOcorrenciasResponse ocorrencias,
        KpiAdocoesResponse adocoes,
        List<AlertaCriticoResponse> alertas) {
}
