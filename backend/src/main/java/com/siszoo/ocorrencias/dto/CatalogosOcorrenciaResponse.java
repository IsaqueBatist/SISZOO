package com.siszoo.ocorrencias.dto;

import java.util.List;

import com.siszoo.comum.dto.CatalogoItemResponse;

public record CatalogosOcorrenciaResponse(
        List<CatalogoItemResponse> tiposOcorrencia,
        List<CatalogoItemResponse> providencias) {
}
