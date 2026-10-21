package com.siszoo.relatorios.dto;

import com.siszoo.animais.dto.CatalogoItemResponse;

public record ResultadoPorDoencaResponse(CatalogoItemResponse doenca, long positivos, long negativos) {
}
