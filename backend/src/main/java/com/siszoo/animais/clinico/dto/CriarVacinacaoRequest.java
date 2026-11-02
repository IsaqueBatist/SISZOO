package com.siszoo.animais.clinico.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.siszoo.animais.clinico.entity.UnidadeDose;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CriarVacinacaoRequest(
        @NotNull
        UUID animalId,

        @NotBlank
        String vacina,

        @NotNull
        LocalDate dataAplicacao,

        @Positive
        Integer numeroDose,

        @NotNull
        @DecimalMin(value = "0.0", inclusive = false, message = "A dose deve ser maior que zero.")
        BigDecimal doseQuantidade,

        @NotNull
        UnidadeDose doseUnidade,

        @Size(max = 100)
        String lote,

        String observacoes,

        UUID retificaId) {
}
