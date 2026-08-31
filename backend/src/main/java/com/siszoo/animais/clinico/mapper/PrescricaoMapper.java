package com.siszoo.animais.clinico.mapper;

import java.util.UUID;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.siszoo.animais.clinico.dto.PrescricaoResponse;
import com.siszoo.animais.clinico.entity.Prescricao;
import com.siszoo.usuarios.entity.Usuario;

@Mapper(componentModel = "spring")
public interface PrescricaoMapper {

    @Mapping(target = "animalId", source = "prescricao.animal.id")
    @Mapping(target = "medicamentoId", source = "prescricao.medicamento.id")
    @Mapping(target = "medicamentoNome", source = "prescricao.medicamento.nome")
    @Mapping(target = "prescritoPorId", source = "prescricao.prescritoPor.id")
    @Mapping(target = "prescritoPorNome", source = "prescricao.prescritoPor", qualifiedByName = "nomeCompleto")
    @Mapping(target = "retificaId", source = "prescricao.retifica.id")
    @Mapping(target = "retificadoPorId", source = "retificadoPorId")
    @Mapping(target = "statusRegistro", expression = "java(retificadoPorId != null ? \"RETIFICADO\" : \"ATIVO\")")
    PrescricaoResponse toResponse(Prescricao prescricao, UUID retificadoPorId);

    @Named("nomeCompleto")
    default String nomeCompleto(Usuario usuario) {
        return usuario == null ? null : usuario.getNome() + " " + usuario.getSobrenome();
    }
}
