package com.siszoo.relatorios.dto;

// Cabecalho/rodape comuns aos 6 templates de PDF (docId, data de emissao,
// nome de quem gerou, subtitulo de periodo ja formatado) — construido pelo
// RelatorioGeradoService antes de chamar o renderer, para o template ficar
// sem logica de formatacao de data.
public record MetadadosDocumento(String docId, String emitidoEm, String geradoPor, String subtituloPeriodo) {
}
