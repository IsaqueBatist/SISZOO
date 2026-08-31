package com.siszoo.animais.clinico.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.siszoo.animais.clinico.entity.UnidadeDose;

public record VacinacaoResponse(
        UUID id,
        UUID animalId,
        String vacinaCodigo,
        String vacinaNome,
        UUID aplicadoPorId,
        String aplicadoPorNome,
        LocalDate dataAplicacao,
        LocalDate dataValidade,
        Integer numeroDose,
        BigDecimal doseQuantidade,
        UnidadeDose doseUnidade,
        String lote,
        String observacoes,
        UUID retificaId,
        UUID retificadoPorId,
        String statusRegistro,
        LocalDateTime criadoEm) {
}
