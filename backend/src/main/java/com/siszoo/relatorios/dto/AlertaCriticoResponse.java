package com.siszoo.relatorios.dto;

public record AlertaCriticoResponse(String tipo, String severidade, String titulo, String descricao, long total) {
}
