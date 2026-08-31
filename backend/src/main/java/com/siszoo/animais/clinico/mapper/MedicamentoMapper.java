package com.siszoo.animais.clinico.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.siszoo.animais.clinico.dto.MedicamentoResponse;
import com.siszoo.animais.clinico.entity.Medicamento;

@Mapper(componentModel = "spring")
public interface MedicamentoMapper {

    @Mapping(target = "categoriaId", source = "medicamento.categoria.id")
    @Mapping(target = "categoriaNome", source = "medicamento.categoria.nome")
    MedicamentoResponse toResponse(Medicamento medicamento);
}
