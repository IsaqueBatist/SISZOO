package com.siszoo.ocorrencias.dto;

// Em ocorrencia sigilosa, todos os campos vem null para quem nao tem
// OCORRENCIAS_DENUNCIAS:denunciante_sigiloso:leitura.
public record DenuncianteResponse(
        String nome,
        String cpf,
        String telefone,
        String email,
        String cep,
        String endereco,
        String bairroResidencial) {
}
