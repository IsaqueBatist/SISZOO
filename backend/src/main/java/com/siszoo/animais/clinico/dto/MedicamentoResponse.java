package com.siszoo.animais.clinico.dto;

import java.util.UUID;

public record MedicamentoResponse(
        UUID id,
        String nome,
        UUID categoriaId,
        String categoriaNome,
        boolean ativo) {
}
