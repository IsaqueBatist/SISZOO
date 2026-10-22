package com.siszoo.relatorios.dto;

// tempoMedioHoras nulo quando o bairro nao tem nenhuma ocorrencia ENCERRADA
// no periodo (sem dado para calcular a media).
public record LinhaBairroOcorrenciaResponse(
        String bairro, long ocorrencias, String tipoPredominante, Double tempoMedioHoras) {
}
