package com.siszoo.animais.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CriarBaiaRequest(
        @NotBlank
        @Size(max = 40)
        String nome,

        @NotBlank
        String tipoBaia,

        @NotNull
        @Positive
        Short capacidade,

        @Size(max = 80)
        String finalidade,

        String observacoes) {
}
