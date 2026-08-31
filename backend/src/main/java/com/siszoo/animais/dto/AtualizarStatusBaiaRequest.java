package com.siszoo.animais.dto;

import jakarta.validation.constraints.NotNull;

public record AtualizarStatusBaiaRequest(
        @NotNull
        Boolean ativa) {
}
