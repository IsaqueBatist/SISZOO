package com.siszoo.animais.clinico.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.siszoo.animais.clinico.entity.StatusPrescricao;
import com.siszoo.animais.clinico.entity.UnidadeDose;
import com.siszoo.animais.clinico.entity.UnidadeFrequencia;
import com.siszoo.animais.clinico.entity.ViaAdministracao;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CriarPrescricaoRequest(
        @NotNull
        UUID animalId,

        @NotNull
        UUID medicamentoId,

        @NotNull
        LocalDate dataInicio,

        LocalDate dataFimPrevista,

        LocalDate dataFimReal,

        @NotNull
        @Positive
        Integer frequenciaAplicada,

        @NotNull
        UnidadeFrequencia unidadeFrequencia,

        @NotNull
        @DecimalMin(value = "0.0", inclusive = false, message = "A dose deve ser maior que zero.")
        BigDecimal doseQuantidade,

        @NotNull
        UnidadeDose doseUnidade,

        @NotNull
        ViaAdministracao viaAdministracao,

        @NotNull
        StatusPrescricao status,

        UUID retificaId) {
}
