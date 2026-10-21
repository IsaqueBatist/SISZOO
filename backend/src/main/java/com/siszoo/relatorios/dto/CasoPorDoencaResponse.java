package com.siszoo.relatorios.dto;

import com.siszoo.animais.dto.CatalogoItemResponse;

public record CasoPorDoencaResponse(CatalogoItemResponse doenca, long quantidade) {
}
