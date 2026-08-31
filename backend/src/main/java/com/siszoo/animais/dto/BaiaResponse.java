package com.siszoo.animais.dto;

import java.util.UUID;

public record BaiaResponse(
        UUID id,
        String nome,
        String tipoBaiaCodigo,
        String tipoBaiaNome,
        short capacidade,
        String finalidade,
        boolean ativa,
        String observacoes,
        long ocupacaoAtual,
        boolean superlotada) {
}
