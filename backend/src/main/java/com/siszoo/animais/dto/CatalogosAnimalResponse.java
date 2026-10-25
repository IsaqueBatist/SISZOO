package com.siszoo.animais.dto;

import java.util.List;

import com.siszoo.comum.dto.CatalogoItemResponse;

public record CatalogosAnimalResponse(
        List<CatalogoItemResponse> especies,
        List<CatalogoItemResponse> status,
        List<CatalogoItemResponse> motivosEntrada,
        List<CatalogoItemResponse> tiposBaia,
        // F2-007 / RF-A04: catalogos do registro de exame (aditivos).
        List<CatalogoItemResponse> tiposExame,
        List<CatalogoItemResponse> laboratorios,
        // Catalogos do registro de vacinacao e de procedimento (V5): antes
        // copiados no front (catalogoClinico.ts, FIXME(T22)).
        List<CatalogoItemResponse> vacinas,
        List<CatalogoItemResponse> tiposProcedimento) {
}
