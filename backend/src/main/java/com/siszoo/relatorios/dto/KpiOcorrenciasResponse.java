package com.siszoo.relatorios.dto;

// mediaPorHora nulo quando horasDecorridas == 0 (virada do dia): evita
// mostrar uma media falsa de "0/0" no card (mesmo criterio do front hoje,
// ver dashboardApi.ts::buscarKpiOcorrencias).
public record KpiOcorrenciasResponse(long registradasHoje, Double mediaPorHora) {
}
