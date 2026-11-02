package com.siszoo.relatorios.dto;

import java.time.LocalDate;
import java.util.List;

public record RelatorioAnualProcessosResponse(
        int ano,
        LocalDate periodoInicio,
        LocalDate periodoFim,
        KpisAnualProcessosResponse kpis,
        String sumarioExecutivo,
        List<CasoPorPatologiaResponse> porPatologia,
        List<ResultadoLaboratorialPorDoencaResponse> resultadosPorDoenca,
        ResultadoLaboratorialPorDoencaResponse totalResultados,
        List<DistribuicaoEspecieResponse> porEspecie,
        List<BairroProcessoResponse> bairros,
        List<LaboratorioUtilizadoResponse> laboratorios) {
}
