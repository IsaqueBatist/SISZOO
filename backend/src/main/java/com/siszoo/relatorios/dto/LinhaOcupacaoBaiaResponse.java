package com.siszoo.relatorios.dto;

// status: "normal" | "proximo_limite" | "superlotada", com o rotulo de exibicao
// em rotuloStatus (NivelLotacao, a mesma regra da tela de baias e do Dashboard).
public record LinhaOcupacaoBaiaResponse(
        String baia,
        int capacidade,
        long atual,
        int percentualOcupacao,
        String status,
        String rotuloStatus) {
}
