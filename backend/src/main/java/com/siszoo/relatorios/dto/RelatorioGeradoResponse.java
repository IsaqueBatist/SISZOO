package com.siszoo.relatorios.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

// Linha da seção "Relatórios recentes" (GET /api/relatorios/historico,
// paginado). Sem arquivoUrl: o arquivo não é persistido nesta versão — a
// ação do front para esta linha é "Gerar novamente" (reexecuta a exportação
// com os mesmos tipo/período), não "Baixar".
public record RelatorioGeradoResponse(
        String docId,
        String tipo,
        String tipoNomeExibicao,
        LocalDate periodoInicio,
        LocalDate periodoFim,
        String geradoPorNome,
        OffsetDateTime geradoEm,
        Integer tamanhoBytes) {
}
