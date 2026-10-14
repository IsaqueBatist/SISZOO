package com.siszoo.processos.dto;

import java.util.UUID;

public record ResponsavelProcessoResponse(
        UUID id,
        String nome,
        String cpf,
        String telefone,
        String email,
        String cep,
        String endereco,
        String bairroResidencial,
        String bairroOcorrencia) {
}
