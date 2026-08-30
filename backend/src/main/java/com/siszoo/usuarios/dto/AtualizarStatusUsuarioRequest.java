package com.siszoo.usuarios.dto;

import jakarta.validation.constraints.NotNull;

public record AtualizarStatusUsuarioRequest(
        @NotNull
        Boolean ativo) {
}
