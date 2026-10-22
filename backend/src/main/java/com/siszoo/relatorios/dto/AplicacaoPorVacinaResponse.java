package com.siszoo.relatorios.dto;

public record AplicacaoPorVacinaResponse(
        String vacina,
        long aplicacoes,
        int coberturaAtualPercentual,
        long vencendoEm30Dias) {
}
