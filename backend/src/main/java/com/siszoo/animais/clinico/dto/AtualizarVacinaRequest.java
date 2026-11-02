package com.siszoo.animais.clinico.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record AtualizarVacinaRequest(
        @NotBlank
        @Size(max = 100)
        String nome,

        @Positive
        @Max(1200)
        Integer intervaloMeses,

        @NotNull
        Boolean ativo) {
}
