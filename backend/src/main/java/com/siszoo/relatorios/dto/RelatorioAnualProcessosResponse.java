package com.siszoo.relatorios.dto;

import java.time.LocalDate;
import java.util.List;

// `bairros` no preview/PDF já vem com o top 9 + 1 linha agregada "Outros (N
// bairros)" (quando ha mais de 9) e, quando existem, com uma linha final
// "Sem ocorrência vinculada" para processos sem denúncia prévia (o vínculo é
// opcional, DER regra 15) — decisões validadas com o usuário. O CSV usa a
// lista completa, sem essas agregações.
public record RelatorioAnualProcessosResponse(
        int ano,
        LocalDate periodoInicio,
        LocalDate periodoFim,
        KpisAnualProcessosResponse kpis,
        String sumarioExecutivo,
        List<CasoPorPatologiaResponse> porPatologia,
        List<ResultadoLaboratorialPorDoencaResponse> resultadosPorDoenca,
        ResultadoLaboratorialPorDoencaResponse totalResultados,
        List<DistribuicaoEspecieResponse> porEspecie,
        List<BairroProcessoResponse> bairros,
        List<LaboratorioUtilizadoResponse> laboratorios) {
}
