package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CriarProcessoRequest(
        @NotNull
        LocalDate dataAbertura,

        @NotBlank
        String doenca,

        @NotBlank
        String laboratorio,

        UUID ocorrenciaId,

        @NotNull
        @Valid
        ResponsavelProcessoRequest responsavel,

        @NotEmpty
        List<@NotNull @Valid AmostraAnimalRequest> amostras,

        String observacoes,

        @Size(max = 40)
        String galNumero,

        @Size(max = 40)
        String sinanNumero) {
}
