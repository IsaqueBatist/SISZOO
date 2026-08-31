package com.siszoo.animais.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.siszoo.animais.dto.BaiaResponse;
import com.siszoo.animais.entity.Baia;

@Mapper(componentModel = "spring")
public interface BaiaMapper {

    @Mapping(target = "tipoBaiaCodigo", source = "baia.tipoBaia.codigo")
    @Mapping(target = "tipoBaiaNome", source = "baia.tipoBaia.nome")
    @Mapping(target = "ocupacaoAtual", source = "ocupacaoAtual")
    @Mapping(target = "superlotada", source = "superlotada")
    BaiaResponse toResponse(Baia baia, long ocupacaoAtual, boolean superlotada);
}
