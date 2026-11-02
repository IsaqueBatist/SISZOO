package com.siszoo.relatorios.dto;

import java.util.List;

public record DashboardKpisResponse(
        KpiAnimaisResponse animais,
        KpiVacinacaoResponse vacinacao,
        KpiOcorrenciasResponse ocorrencias,
        KpiAdocoesResponse adocoes,
        List<AlertaCriticoResponse> alertas) {
}
