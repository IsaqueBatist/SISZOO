package com.siszoo.relatorios.dto;

import java.time.LocalDate;
import java.util.List;

// `bairros` no preview/PDF já vem com o top 9 + 1 linha agregada "Outros (N
// bairros)" quando há mais de 9 (mesmo padrão "top N + Outros" dos demais
// tipos) — o CSV usa a lista completa (GeradorRelatorio#blocosCsv), sem essa
// agregação.
public record RelatorioOcorrenciasBairroResponse(
        LocalDate periodoInicio,
        LocalDate periodoFim,
        KpisOcorrenciasBairroResponse kpis,
        List<LinhaBairroOcorrenciaResponse> bairros,
        List<TipoOcorrenciaContagemResponse> tipos,
        String notaFocoGeografico) {
}
