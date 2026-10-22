package com.siszoo.relatorios.dto;

// Resultado de uma exportacao (CSV ou PDF), ainda sem ser gravado no corpo da
// resposta HTTP — RelatorioController monta o ResponseEntity a partir disto.
public record ArquivoRelatorio(byte[] conteudo, String nomeArquivo, String contentType) {
}
