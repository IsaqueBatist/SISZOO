package com.siszoo.animais.clinico.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CriarProcedimentoRequest(
        @NotNull
        UUID animalId,

        @NotBlank
        String tipoProcedimento,

        @NotNull
        LocalDate data,

        String descricao,

        String resultado,

        // Presenca (nao-nulo) indica que este POST retifica o registro apontado.
        UUID retificaId) {
}
