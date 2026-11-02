package com.siszoo.relatorios.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record RelatorioGeradoResponse(
        String docId,
        String tipo,
        String tipoNomeExibicao,
        LocalDate periodoInicio,
        LocalDate periodoFim,
        String geradoPorNome,
        OffsetDateTime geradoEm,
        Integer tamanhoBytes,
        String parametrosJson) {
}
