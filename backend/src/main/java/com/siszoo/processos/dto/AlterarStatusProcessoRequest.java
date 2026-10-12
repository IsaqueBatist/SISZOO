package com.siszoo.processos.dto;

import com.siszoo.processos.entity.StatusProcesso;

import jakarta.validation.constraints.NotNull;

public record AlterarStatusProcessoRequest(
        @NotNull
        StatusProcesso status) {
}
