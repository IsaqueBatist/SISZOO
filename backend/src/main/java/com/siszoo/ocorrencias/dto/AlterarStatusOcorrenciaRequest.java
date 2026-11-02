package com.siszoo.ocorrencias.dto;

import com.siszoo.ocorrencias.entity.StatusOcorrencia;

import jakarta.validation.constraints.NotNull;

public record AlterarStatusOcorrenciaRequest(
        @NotNull
        StatusOcorrencia status) {
}
