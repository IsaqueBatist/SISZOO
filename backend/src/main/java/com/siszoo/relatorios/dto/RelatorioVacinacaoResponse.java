package com.siszoo.relatorios.dto;

import java.time.LocalDate;
import java.util.List;

// animaisVencidosExcedente: quantos animais ficaram de fora do "top N" de
// animaisVencidos no preview/PDF (secao "Animais com Vacinas Vencidas",
// docs/prototipo/relatorio-vacinacao.html: linha final "+ 8 animais") — o CSV
// exporta a lista completa (GeradorRelatorio#linhasCsv), sem esse corte.
public record RelatorioVacinacaoResponse(
        LocalDate periodoInicio,
        LocalDate periodoFim,
        KpisVacinacaoResponse kpis,
        List<AplicacaoPorVacinaResponse> porVacina,
        List<AplicacaoPorVeterinarioResponse> porVeterinario,
        List<AnimalVacinaVencidaResponse> animaisVencidos,
        long animaisVencidosExcedente) {
}
