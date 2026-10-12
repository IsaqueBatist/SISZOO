package com.siszoo.ocorrencias.dto;

import jakarta.validation.constraints.NotBlank;

// Providencia obrigatoria (DER regra 12); a descricao e exigida pelo service
// quando a providencia e "outro".
public record EncerrarOcorrenciaRequest(
        @NotBlank
        String providenciaTomada,

        String descricaoEncerramento) {
}
