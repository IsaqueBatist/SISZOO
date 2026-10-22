package com.siszoo.relatorios.dto;

public record ProdutividadeVeterinarioResponse(
        String veterinario, long atendimentos, long castracoes, long cirurgias, long vacinacoes, long total) {
}
