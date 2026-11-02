package com.siszoo.processos.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EditarProcessoRequest(
        @NotBlank(message = "Selecione a doença.")
        String doenca,

        @NotBlank(message = "Selecione o laboratório.")
        String laboratorio,

        @NotNull(message = "Informe os dados do responsável.")
        @Valid
        ResponsavelProcessoRequest responsavel,

        @NotEmpty(message = "Informe as amostras do processo.")
        List<@NotNull @Valid AmostraEditada> amostras,

        String observacoes,

        @Size(max = 40, message = "O número GAL deve ter no máximo 40 caracteres.")
        String galNumero,

        @Size(max = 40, message = "O número SINAN deve ter no máximo 40 caracteres.")
        String sinanNumero,

        @NotBlank(message = "Informe o motivo da alteração.")
        @Size(min = 10, max = 1000, message = "Descreva o motivo da alteração em 10 a 1000 caracteres.")
        String justificativa) {

    public record AmostraEditada(
            @NotNull(message = "Informe a amostra.")
            UUID id,

            @NotNull(message = "Informe os dados da amostra.")
            @Valid
            AmostraAnimalRequest dados) {
    }
}
