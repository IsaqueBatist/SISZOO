package com.siszoo.animais.clinico.mapper;

import org.mapstruct.Mapper;

import com.siszoo.animais.clinico.dto.VacinaResponse;
import com.siszoo.animais.clinico.entity.Vacina;

// Sem @Mapping: os nomes batem um a um (diferente do MedicamentoMapper, que
// precisa deles por causa da categoria aninhada).
@Mapper(componentModel = "spring")
public interface VacinaMapper {

    VacinaResponse toResponse(Vacina vacina);
}
