package com.siszoo.ocorrencias.dto;

public record DenuncianteResponse(
        String nome,
        String cpf,
        String telefone,
        String email,
        String cep,
        String endereco,
        String bairroResidencial) {
}
