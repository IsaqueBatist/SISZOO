package com.siszoo.relatorios.dto;

public record KpisOcupacaoBaiasResponse(
        int ocupacaoMediaPercentual,
        long baiasSuperlotadas,
        long baiasNoLimite,
        int capacidadeTotal) {
}
