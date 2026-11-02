package com.siszoo.animais.clinico.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ExameResponse(
        UUID id,
        UUID animalId,
        String tipoExameCodigo,
        String tipoExameNome,
        String laboratorioCodigo,
        String laboratorioNome,
        UUID solicitadoPorId,
        String solicitadoPorNome,
        LocalDate dataSolicitacao,
        LocalDate dataResultado,
        String resultado,
        String observacoes,
        UUID retificaId,
        UUID retificadoPorId,
        String statusRegistro,
        LocalDateTime criadoEm) {
}
