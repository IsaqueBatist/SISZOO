package com.siszoo.relatorios.dto;

public record ResultadoLaboratorialPorDoencaResponse(
        String doenca,
        long investigados,
        long positivos,
        long negativos,
        long inconclusivos,
        long aguardando,
        int percentualPositividade) {
}
