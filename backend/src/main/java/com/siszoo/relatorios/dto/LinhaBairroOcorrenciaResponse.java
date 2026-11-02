package com.siszoo.relatorios.dto;

public record LinhaBairroOcorrenciaResponse(
        String bairro, long ocorrencias, String tipoPredominante, Double tempoMedioHoras) {
}
