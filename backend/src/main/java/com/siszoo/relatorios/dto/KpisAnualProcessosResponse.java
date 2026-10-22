package com.siszoo.relatorios.dto;

public record KpisAnualProcessosResponse(
        long processosAbertos,
        long confirmadosPositivos,
        int percentualPositividade,
        long comContatoHumano,
        Double tempoMedioDias) {
}
