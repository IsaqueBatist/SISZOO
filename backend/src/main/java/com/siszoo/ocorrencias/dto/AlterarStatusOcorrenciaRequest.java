package com.siszoo.ocorrencias.dto;

import com.siszoo.ocorrencias.entity.StatusOcorrencia;

import jakarta.validation.constraints.NotNull;

// Encerramento tem endpoint proprio (providencia obrigatoria); aqui so a
// transicao ABERTA -> EM_ATENDIMENTO e aceita.
public record AlterarStatusOcorrenciaRequest(
        @NotNull
        StatusOcorrencia status) {
}
