package com.siszoo.animais.dto;

import java.time.LocalDateTime;
import java.util.UUID;

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
