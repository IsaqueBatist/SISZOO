package com.siszoo.animais.clinico.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

// F2-007 / RF-A04. Mesmo contrato de status dos demais registros clinicos:
// statusRegistro ATIVO (vigente) ou RETIFICADO (corrigido por retificadoPorId).
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
