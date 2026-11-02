package com.siszoo.animais.dto;

import java.util.List;

import com.siszoo.comum.dto.CatalogoItemResponse;

public record CatalogosAnimalResponse(
        List<CatalogoItemResponse> especies,
        List<CatalogoItemResponse> status,
        List<CatalogoItemResponse> motivosEntrada,
        List<CatalogoItemResponse> tiposBaia,
        List<CatalogoItemResponse> tiposExame,
        List<CatalogoItemResponse> laboratorios,
        List<VacinaCatalogoResponse> vacinas,
        List<CatalogoItemResponse> tiposProcedimento,
        List<CatalogoItemResponse> condicoesSaude) {
}
