package com.siszoo.animais.clinico.mapper;

import org.mapstruct.Mapper;

import com.siszoo.animais.clinico.dto.CategoriaFarmacologicaResponse;
import com.siszoo.animais.clinico.entity.CategoriaFarmacologica;

@Mapper(componentModel = "spring")
public interface CategoriaFarmacologicaMapper {

    CategoriaFarmacologicaResponse toResponse(CategoriaFarmacologica categoria);
}
