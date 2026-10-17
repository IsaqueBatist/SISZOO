package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

// Processo completo numa unica requisicao (T29, DH-2): as etapas do wizard
// sao da interface; o servidor nao guarda rascunho. Doenca e laboratorio sao
// codigos de catalogo. `urgente` nao e mais informado: deriva das amostras
// (DER regra 18). ocorrenciaId e o vinculo da etapa 1 (opcional).
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

        String observacoes) {
}
