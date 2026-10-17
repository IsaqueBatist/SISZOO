package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.siszoo.animais.dto.CatalogoItemResponse;

// Um registro do historico de resultados; autor no padrao dos registros
// clinicos (VacinacaoResponse).
public record ResultadoProcessoResponse(
        UUID id,
        CatalogoItemResponse resultado,
        LocalDate dataResultado,
        String observacoes,
        UUID retificaId,
        UUID registradoPorId,
        String registradoPorNome,
        LocalDateTime registradoEm) {
}
