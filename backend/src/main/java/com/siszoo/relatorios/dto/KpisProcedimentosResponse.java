package com.siszoo.relatorios.dto;

public record KpisProcedimentosResponse(
        long totalProcedimentos,
        long castracoes,
        long castracoesMachos,
        long castracoesFemeas,
        long atendimentosClinicos,
        long cirurgiasMaiores) {
}
