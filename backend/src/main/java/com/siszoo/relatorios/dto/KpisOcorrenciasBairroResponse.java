package com.siszoo.relatorios.dto;

public record KpisOcorrenciasBairroResponse(
        long ocorrenciasRegistradas,
        long bairrosAtingidos,
        Double tempoMedioHoras,
        long encerradas,
        int percentualEncerradas) {
}
