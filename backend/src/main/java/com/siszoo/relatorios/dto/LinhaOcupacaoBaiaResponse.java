package com.siszoo.relatorios.dto;

// status: "normal" | "proximo_limite" | "superlotada" (atual == capacidade e
// "proximo_limite", nao "superlotada" — so acima da capacidade conta como
// superlotada; mesmo criterio da tabela do protótipo, docs/prototipo/relatorio-ocupacao.html).
public record LinhaOcupacaoBaiaResponse(
        String baia,
        int capacidade,
        long atual,
        int percentualOcupacao,
        String status) {
}
