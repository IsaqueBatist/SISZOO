package com.siszoo.ocorrencias.dto;

import jakarta.validation.constraints.NotBlank;

public record CriarNotaRequest(
        @NotBlank
        String descricao) {
}
