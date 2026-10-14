package com.siszoo.processos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Tamanhos do DER §3.5 (responsavel_processo).
public record ResponsavelProcessoRequest(
        @NotBlank
        @Size(max = 150)
        String nome,

        @Size(max = 14)
        String cpf,

        @Size(max = 20)
        String telefone,

        @Size(max = 150)
        String email,

        @Size(max = 10)
        String cep,

        @Size(max = 255)
        String endereco,

        @Size(max = 80)
        String bairroResidencial,

        @Size(max = 80)
        String bairroOcorrencia) {
}
