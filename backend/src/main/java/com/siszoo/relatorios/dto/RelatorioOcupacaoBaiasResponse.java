package com.siszoo.relatorios.dto;

import java.time.LocalDate;
import java.util.List;

public record RelatorioOcupacaoBaiasResponse(
        LocalDate periodoInicio,
        LocalDate periodoFim,
        KpisOcupacaoBaiasResponse kpis,
        List<LinhaOcupacaoBaiaResponse> baias) {
}
