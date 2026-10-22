package com.siszoo.relatorios.dto;

import com.siszoo.animais.dto.CatalogoItemResponse;

public record CasoRaivaPorEspecieResponse(CatalogoItemResponse especie, long quantidade) {
}
