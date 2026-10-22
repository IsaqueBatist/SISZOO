package com.siszoo.relatorios.dto;

public record KpisVacinacaoResponse(
        long vacinasAplicadas,
        int percentualAnimaisVacinados,
        long animaisVacinados,
        long totalSobCustodia,
        long vencidas,
        long aVencerEm30Dias) {
}
