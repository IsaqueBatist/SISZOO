package com.siszoo.ocorrencias.dto;

public record DenunciadoResponse(
        String nome,
        String cpf,
        String telefone,
        String endereco,
        String observacoes) {
}
