package com.siszoo.ocorrencias.dto;

import java.time.LocalDateTime;
import java.util.UUID;

// So metadados; o conteudo sai em GET /api/ocorrencias/{id}/anexos/{anexoId}.
public record AnexoOcorrenciaResponse(
        UUID id,
        String nome,
        String mimeType,
        int tamanho,
        LocalDateTime criadoEm) {
}
