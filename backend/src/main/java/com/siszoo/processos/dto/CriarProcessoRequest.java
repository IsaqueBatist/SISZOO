package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Processo completo numa unica requisicao: as etapas do wizard
// sao da interface; o servidor nao guarda rascunho. Doenca e laboratorio sao
// codigos de catalogo. `urgente` nao e informado: deriva das amostras
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

        String observacoes,

        // RF-B01 / limitacao 3.5.2: numeros dos sistemas
        // estaduais, registrados manualmente (sem integracao). Opcionais.
        @Size(max = 40)
        String galNumero,

        @Size(max = 40)
        String sinanNumero) {
}
