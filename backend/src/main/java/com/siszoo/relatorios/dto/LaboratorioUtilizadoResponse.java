package com.siszoo.relatorios.dto;

// tempoMedioDias e proxy (dataAbertura -> dataResultado do processo, nao
// envio -> retorno da amostra, campo nunca preenchido no schema atual) —
// decisao validada com o usuario.
public record LaboratorioUtilizadoResponse(
        String laboratorio, long amostras, int percentualDoTotal, Double tempoMedioDias) {
}
