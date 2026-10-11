package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;

// Processo minimo (D2/D3). `urgente` e informado aqui como proxy de "contato
// humano-animal" ate existirem as amostras (task de processos). Opcional
// (ausente = false): o Jackson 3 recusa null em boolean primitivo.
public record CriarProcessoRequest(
        @NotNull
        LocalDate dataAbertura,

        Boolean urgente,

        UUID ocorrenciaId) {

    public boolean isUrgente() {
        return Boolean.TRUE.equals(urgente);
    }
}
