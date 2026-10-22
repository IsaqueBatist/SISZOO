package com.siszoo.relatorios.dto;

import java.time.LocalDate;

// Corpo de POST /api/relatorios/exportar. "tipo" e "janela" chegam como os
// codigos lowercase do catalogo (DER §3.6) — FiltroRelatorioResolver resolve
// "tipo" para o enum e "ano"/"janela"/periodo para um PeriodoRelatorio
// concreto antes de qualquer agregacao.
public record ExportarRelatorioRequest(
        String tipo,
        LocalDate periodoInicio,
        LocalDate periodoFim,
        Integer ano,
        String janela,
        String formato) {
}
