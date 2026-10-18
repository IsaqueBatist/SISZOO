package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// Lancamento do resultado laboratorial (T34). resultado e o codigo do
// catalogo (positivo, negativo, inconclusivo, material_inadequado,
// nao_realizado); aguardando nao e resultado. Sem retificaId, e o primeiro
// resultado do processo; com ele, a correcao do resultado vigente.
public record RegistrarResultadoRequest(
        @NotBlank
        String resultado,

        @NotNull
        LocalDate dataResultado,

        String observacoes,

        UUID retificaId) {
}
