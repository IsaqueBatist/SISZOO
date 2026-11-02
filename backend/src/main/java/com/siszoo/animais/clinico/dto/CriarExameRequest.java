package com.siszoo.animais.clinico.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CriarExameRequest(
        @NotNull
        UUID animalId,

        @NotBlank
        String tipoExame,

        String laboratorio,

        @NotNull
        LocalDate dataSolicitacao,

        LocalDate dataResultado,

        @Size(max = 4000)
        String resultado,

        @Size(max = 2000)
        String observacoes,

        UUID retificaId) {
}
