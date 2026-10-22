package com.siszoo.relatorios.dto;

// tempoMedioHoras: "registro -> encerramento" (criadoEm -> encerradaEm), nao
// "registro -> atendimento" como o rotulo do protótipo sugere — horaAbertura
// e opcional e nem toda ocorrencia passa por EM_ATENDIMENTO (pode encerrar
// direto de ABERTA). Decisao validada com o usuario na implementacao.
public record KpisOcorrenciasBairroResponse(
        long ocorrenciasRegistradas,
        long bairrosAtingidos,
        Double tempoMedioHoras,
        long encerradas,
        int percentualEncerradas) {
}
