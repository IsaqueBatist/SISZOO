package com.siszoo.ocorrencias.dto;

import java.util.stream.Stream;

import org.springframework.util.StringUtils;

import jakarta.validation.constraints.Size;

public record DenunciadoRequest(
        @Size(max = 150) String nome,
        @Size(max = 14) String cpf,
        @Size(max = 20) String telefone,
        @Size(max = 255) String endereco,
        String observacoes) {

    public boolean temAlgumDado() {
        return Stream.of(nome, cpf, telefone, endereco, observacoes).anyMatch(StringUtils::hasText);
    }
}
