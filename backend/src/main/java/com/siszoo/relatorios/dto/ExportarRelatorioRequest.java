package com.siszoo.relatorios.dto;

import java.time.LocalDate;

public record ExportarRelatorioRequest(
        String tipo,
        LocalDate periodoInicio,
        LocalDate periodoFim,
        Integer ano,
        String formato) {
}
