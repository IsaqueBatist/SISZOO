package com.siszoo.relatorios.dto;

// GET /api/relatorios/tipos: os 6 cards da tela principal (docs/prototipo/relatorios.html).
// "filtro" e "ano" | "janela" | "periodo" — diz ao front qual campo mostrar no card.
public record TipoRelatorioResponse(String codigo, String nome, String filtro) {
}
