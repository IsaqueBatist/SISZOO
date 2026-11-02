package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegistrarResultadoRequest(
        @NotBlank
        String resultado,

        @NotNull
        LocalDate dataResultado,

        String observacoes,

        UUID retificaId,

        String desfechoAnimal) {
}
