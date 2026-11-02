package com.siszoo.relatorios.dto;

public record LinhaOcupacaoBaiaResponse(
        String baia,
        int capacidade,
        long atual,
        int percentualOcupacao,
        String status,
        String rotuloStatus) {
}
