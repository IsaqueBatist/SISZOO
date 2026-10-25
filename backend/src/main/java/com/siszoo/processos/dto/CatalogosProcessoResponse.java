package com.siszoo.processos.dto;

import java.util.List;

import com.siszoo.comum.dto.CatalogoItemResponse;

public record CatalogosProcessoResponse(
        List<CatalogoItemResponse> doencas,
        List<CatalogoItemResponse> laboratorios,
        List<CatalogoItemResponse> sintomas,
        List<CatalogoItemResponse> resultadosLaboratoriais,
        List<CatalogoItemResponse> desfechos) {
}
