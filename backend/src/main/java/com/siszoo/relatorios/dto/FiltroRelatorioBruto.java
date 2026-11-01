package com.siszoo.relatorios.dto;

import java.time.LocalDate;

import com.siszoo.relatorios.entity.TipoRelatorio;

// Filtro cru recebido do request (GET /preview em query params, POST
// /exportar no corpo): cada tipo usa um subconjunto diferente destes campos
// (ano para anual_processos; periodoInicio/Fim para os tipos por periodo;
// nenhum para adocoes e ocupacao_baias) - FiltroRelatorioResolver valida e
// resolve para datas concretas antes de qualquer agregacao ou persistencia.
public record FiltroRelatorioBruto(
        TipoRelatorio tipo,
        LocalDate periodoInicio,
        LocalDate periodoFim,
        Integer ano) {
}
