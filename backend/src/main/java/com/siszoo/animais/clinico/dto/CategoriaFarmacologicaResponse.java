package com.siszoo.animais.clinico.dto;

import java.util.UUID;

public record CategoriaFarmacologicaResponse(
        UUID id,
        String nome,
        boolean ativo) {
}
