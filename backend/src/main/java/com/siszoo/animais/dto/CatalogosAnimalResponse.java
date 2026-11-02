package com.siszoo.animais.dto;

import java.util.List;

import com.siszoo.comum.dto.CatalogoItemResponse;

public record CatalogosAnimalResponse(
        List<CatalogoItemResponse> especies,
        List<CatalogoItemResponse> status,
        List<CatalogoItemResponse> motivosEntrada,
        List<CatalogoItemResponse> tiposBaia,
        // RF-A04: catalogos do registro de exame (aditivos).
        List<CatalogoItemResponse> tiposExame,
        List<CatalogoItemResponse> laboratorios,
        // Catalogos do registro de vacinacao e de procedimento (V5).
        //
        // `vacinas` usa um record proprio porque leva tambem o
        // `intervaloMeses`, de que o formulario precisa para prever o proximo
        // reforco. Ver VacinaCatalogoResponse.
        List<VacinaCatalogoResponse> vacinas,
        List<CatalogoItemResponse> tiposProcedimento,
        List<CatalogoItemResponse> condicoesSaude) {
}
