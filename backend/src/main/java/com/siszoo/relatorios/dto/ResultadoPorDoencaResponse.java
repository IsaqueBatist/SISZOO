package com.siszoo.relatorios.dto;

import com.siszoo.comum.dto.CatalogoItemResponse;

public record ResultadoPorDoencaResponse(CatalogoItemResponse doenca, long positivos, long negativos) {
}
