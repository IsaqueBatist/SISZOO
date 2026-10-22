package com.siszoo.animais.dto;

import java.time.LocalDateTime;
import java.util.UUID;

// So metadados; o conteudo sai em GET /api/animais/{id}/anexos/{anexoId} (F2-007 / RF-A04).
public record AnexoAnimalResponse(
        UUID id,
        UUID animalId,
        String nome,
        String mimeType,
        int tamanho,
        String descricao,
        UUID criadoPorId,
        String criadoPorNome,
        LocalDateTime criadoEm) {
}
