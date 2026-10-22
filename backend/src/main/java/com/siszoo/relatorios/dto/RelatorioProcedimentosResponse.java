package com.siszoo.relatorios.dto;

import java.time.LocalDate;
import java.util.List;

public record RelatorioProcedimentosResponse(
        LocalDate periodoInicio,
        LocalDate periodoFim,
        KpisProcedimentosResponse kpis,
        List<ProcedimentoPorTipoResponse> porTipo,
        List<ProdutividadeVeterinarioResponse> porVeterinario,
        ProdutividadeVeterinarioResponse totalVeterinarios,
        List<CirurgiaRealizadaResponse> cirurgias,
        long cirurgiasExcedente) {
}
