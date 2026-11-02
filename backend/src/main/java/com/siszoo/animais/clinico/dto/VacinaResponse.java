package com.siszoo.animais.clinico.dto;

import java.util.UUID;

public record VacinaResponse(
        UUID id,
        String codigo,
        String nome,
        Integer intervaloMeses,
        boolean ativo) {
}
