package com.siszoo.relatorios.dto;

public record KpisAnualProcessosResponse(
        long processosAbertos,
        long confirmadosPositivos,
        int percentualPositividade,
        long comContatoHumano,
        long contatoNaoInformado,
        Double tempoMedioDias) {
}
