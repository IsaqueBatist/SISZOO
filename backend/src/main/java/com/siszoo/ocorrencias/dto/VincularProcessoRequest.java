package com.siszoo.ocorrencias.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record VincularProcessoRequest(
        @NotNull
        UUID processoId) {
}
