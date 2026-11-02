package com.siszoo.relatorios.dto;

import java.time.LocalDate;

public record CirurgiaRealizadaResponse(
        LocalDate data, String animal, String procedimento, String veterinario, String resultado) {
}
