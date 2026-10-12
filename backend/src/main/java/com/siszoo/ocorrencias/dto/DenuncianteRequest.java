package com.siszoo.ocorrencias.dto;

import java.util.stream.Stream;

import org.springframework.util.StringUtils;

import jakarta.validation.constraints.Size;

// Todos opcionais no formato; o nome e exigido pelo service quando a
// ocorrencia nao e sigilosa nem anonima (D19).
public record DenuncianteRequest(
        @Size(max = 150) String nome,
        @Size(max = 14) String cpf,
        @Size(max = 20) String telefone,
        @Size(max = 150) String email,
        @Size(max = 10) String cep,
        @Size(max = 255) String endereco,
        @Size(max = 80) String bairroResidencial) {

    // Bloco enviado sem nenhum campo preenchido conta como ausente.
    public boolean temAlgumDado() {
        return Stream.of(nome, cpf, telefone, email, cep, endereco, bairroResidencial).anyMatch(StringUtils::hasText);
    }
}
