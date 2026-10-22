package com.siszoo.relatorios.dto;

import java.util.List;

public record DashboardGraficosResponse(
        List<CasoPorDoencaResponse> casosPorDoenca,
        List<CasoRaivaPorEspecieResponse> casosRaivaPorEspecie,
        List<ResultadoPorDoencaResponse> resultadosPorDoenca) {
}
