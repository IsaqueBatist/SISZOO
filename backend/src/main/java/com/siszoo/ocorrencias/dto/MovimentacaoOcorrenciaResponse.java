package com.siszoo.ocorrencias.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.siszoo.ocorrencias.entity.StatusOcorrencia;
import com.siszoo.ocorrencias.entity.TipoMovimentacaoOcorrencia;

public record MovimentacaoOcorrenciaResponse(
        UUID id,
        TipoMovimentacaoOcorrencia tipoMovimentacao,
        StatusOcorrencia statusAnterior,
        StatusOcorrencia statusNovo,
        LocalDateTime data,
        String descricao,
        UUID usuarioId,
        String usuarioNome) {
}
