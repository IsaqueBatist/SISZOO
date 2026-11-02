package com.siszoo.relatorios.dto;

import java.time.LocalDate;
import java.util.List;

public record RelatorioAdocoesResponse(
        LocalDate periodoInicio,
        LocalDate periodoFim,
        KpisAdocoesResponse kpis,
        List<PerfilAdocaoResponse> perfil,
        String notaLimitacao) {
}
