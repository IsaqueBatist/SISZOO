package com.siszoo.relatorios.dto;

import java.time.LocalDate;

import com.siszoo.relatorios.entity.TipoRelatorio;

public record FiltroRelatorioBruto(
        TipoRelatorio tipo,
        LocalDate periodoInicio,
        LocalDate periodoFim,
        Integer ano) {
}
