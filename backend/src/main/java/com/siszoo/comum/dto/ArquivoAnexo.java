package com.siszoo.comum.dto;

// Conteudo de um anexo para download (nao e serializado como JSON).
public record ArquivoAnexo(String nome, String mimeType, byte[] conteudo) {
}
