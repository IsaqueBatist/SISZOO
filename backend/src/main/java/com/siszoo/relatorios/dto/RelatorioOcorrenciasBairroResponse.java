package com.siszoo.relatorios.dto;

import java.time.LocalDate;
import java.util.List;

public record RelatorioOcorrenciasBairroResponse(
        LocalDate periodoInicio,
        LocalDate periodoFim,
        KpisOcorrenciasBairroResponse kpis,
        List<LinhaBairroOcorrenciaResponse> bairros,
        List<TipoOcorrenciaContagemResponse> tipos,
        String notaFocoGeografico) {
}
