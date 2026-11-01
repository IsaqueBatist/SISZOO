package com.siszoo.relatorios.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

// Linha da seção "Relatórios recentes" (GET /api/relatorios/historico,
// paginado). Sem arquivoUrl: o arquivo não é persistido nesta versão - a
// ação do front para esta linha é "Gerar novamente" (reexecuta a exportação
// com os mesmos parametros), não "Baixar". parametrosJson traz o filtro
// bruto original (ver RelatorioGeradoService#serializarParametros) - necessário
// porque periodoInicio/periodoFim aqui já estão resolvidos (ex.: "ano" virou
// 01/01..31/12), e reenviar só o período resolvido quebraria a validação de
// FiltroRelatorioResolver para o tipo que usa "ano". Registros antigos de
// adocoes e ocupacao_baias podem trazer periodo ou "janela": ficam como
// gravados, e o resolver os ignora ao gerar de novo.
public record RelatorioGeradoResponse(
        String docId,
        String tipo,
        String tipoNomeExibicao,
        LocalDate periodoInicio,
        LocalDate periodoFim,
        String geradoPorNome,
        OffsetDateTime geradoEm,
        Integer tamanhoBytes,
        String parametrosJson) {
}
