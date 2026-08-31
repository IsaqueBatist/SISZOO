package com.siszoo.animais.clinico.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProcedimentoResponse(
        UUID id,
        UUID animalId,
        String tipoProcedimentoCodigo,
        String tipoProcedimentoNome,
        UUID executadoPorId,
        String executadoPorNome,
        LocalDate data,
        String descricao,
        String resultado,
        UUID retificaId,
        UUID retificadoPorId,
        String statusRegistro,
        LocalDateTime criadoEm) {
}
