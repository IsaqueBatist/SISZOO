package com.siszoo.ocorrencias.dto;

import jakarta.validation.constraints.NotBlank;

public record EncerrarOcorrenciaRequest(
        @NotBlank
        String providenciaTomada,

        String descricaoEncerramento) {
}
