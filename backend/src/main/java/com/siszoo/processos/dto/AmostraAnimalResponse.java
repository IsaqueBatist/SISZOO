package com.siszoo.processos.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.siszoo.comum.dto.CatalogoItemResponse;
import com.siszoo.processos.entity.MaterialBiologico;
import com.siszoo.processos.entity.NivelContato;
import com.siszoo.processos.entity.StatusClinicoAmostra;
import com.siszoo.processos.entity.TipoAbrigo;

// animalId e so a referencia: a identificacao abaixo e a gravada na amostra
// (snapshot), nunca a ficha atual do animal.
public record AmostraAnimalResponse(
        UUID id,
        UUID animalId,
        CatalogoItemResponse especie,
        String sexo,
        String raca,
        String coloracao,
        String pelagem,
        String idadeAprox,
        BigDecimal pesoKg,
        StatusClinicoAmostra statusClinico,
        TipoAbrigo tipoAbrigo,
        String alteracaoComportamental,
        LocalDate dataColeta,
        MaterialBiologico materialBiologico,
        boolean contatoHumano,
        NivelContato nivelContato,
        Boolean agrediuHumano,
        String observacoes,
        List<CatalogoItemResponse> sintomas) {
}
