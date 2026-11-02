package com.siszoo.animais.clinico.mapper;

import org.mapstruct.Mapper;

import com.siszoo.animais.clinico.dto.VacinaResponse;
import com.siszoo.animais.clinico.entity.Vacina;

@Mapper(componentModel = "spring")
public interface VacinaMapper {

    VacinaResponse toResponse(Vacina vacina);
}
