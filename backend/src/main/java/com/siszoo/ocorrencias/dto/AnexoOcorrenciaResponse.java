package com.siszoo.ocorrencias.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AnexoOcorrenciaResponse(
        UUID id,
        String nome,
        String mimeType,
        int tamanho,
        LocalDateTime criadoEm) {
}
