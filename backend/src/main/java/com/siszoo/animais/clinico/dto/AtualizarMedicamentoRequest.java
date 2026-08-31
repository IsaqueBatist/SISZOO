package com.siszoo.animais.clinico.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AtualizarMedicamentoRequest(
        @NotBlank
        @Size(max = 100)
        String nome,

        @NotNull
        UUID categoriaId) {
}
