package com.siszoo.animais.clinico.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// F2-007 / RF-A04: exame do animal (Quadro 77 do TG). Registro imutavel:
// correcao = novo POST com `retificaId` (mesmo mecanismo de CriarProcedimentoRequest).
public record CriarExameRequest(
        @NotNull
        UUID animalId,

        @NotBlank
        String tipoExame,

        // Codigo do catalogo de laboratorios (V13); opcional (exame interno).
        String laboratorio,

        @NotNull
        LocalDate dataSolicitacao,

        LocalDate dataResultado,

        @Size(max = 4000)
        String resultado,

        @Size(max = 2000)
        String observacoes,

        // Presenca (nao-nulo) indica que este POST retifica o registro apontado.
        UUID retificaId) {
}
