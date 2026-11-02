package com.siszoo.relatorios.dto;

import java.time.LocalDate;
import java.util.List;

public record RelatorioVacinacaoResponse(
        LocalDate periodoInicio,
        LocalDate periodoFim,
        KpisVacinacaoResponse kpis,
        List<AplicacaoPorVacinaResponse> porVacina,
        List<AplicacaoPorVeterinarioResponse> porVeterinario,
        List<AnimalVacinaVencidaResponse> animaisVencidos,
        long animaisVencidosExcedente) {
}
