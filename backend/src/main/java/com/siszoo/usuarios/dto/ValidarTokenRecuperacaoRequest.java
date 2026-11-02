package com.siszoo.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ValidarTokenRecuperacaoRequest(
        @NotBlank
        @Size(max = 128)
        String token) {
}
