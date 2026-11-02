package com.siszoo.relatorios.dto;

public record LaboratorioUtilizadoResponse(
        String laboratorio, long amostras, int percentualDoTotal, Double tempoMedioDias) {
}
