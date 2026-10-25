package com.siszoo.relatorios.dto;

import com.siszoo.comum.dto.CatalogoItemResponse;

public record CasoPorDoencaResponse(CatalogoItemResponse doenca, long quantidade) {
}
