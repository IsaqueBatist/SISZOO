package com.siszoo.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// O token vai no corpo, nunca na URL da API: URLs ficam em logs de acesso e
// no historico do navegador.
public record ValidarTokenRecuperacaoRequest(
        @NotBlank
        @Size(max = 128)
        String token) {
}
