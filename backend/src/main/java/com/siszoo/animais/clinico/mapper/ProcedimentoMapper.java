package com.siszoo.animais.clinico.mapper;

import java.util.UUID;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.siszoo.animais.clinico.dto.ProcedimentoResponse;
import com.siszoo.animais.clinico.entity.Procedimento;
import com.siszoo.usuarios.entity.Usuario;

@Mapper(componentModel = "spring")
public interface ProcedimentoMapper {

    @Mapping(target = "animalId", source = "procedimento.animal.id")
    @Mapping(target = "tipoProcedimentoCodigo", source = "procedimento.tipoProcedimento.codigo")
    @Mapping(target = "tipoProcedimentoNome", source = "procedimento.tipoProcedimento.nome")
    @Mapping(target = "executadoPorId", source = "procedimento.executadoPor.id")
    @Mapping(target = "executadoPorNome", source = "procedimento.executadoPor", qualifiedByName = "nomeCompleto")
    @Mapping(target = "retificaId", source = "procedimento.retifica.id")
    @Mapping(target = "retificadoPorId", source = "retificadoPorId")
    @Mapping(target = "statusRegistro", expression = "java(retificadoPorId != null ? \"RETIFICADO\" : \"ATIVO\")")
    ProcedimentoResponse toResponse(Procedimento procedimento, UUID retificadoPorId);

    @Named("nomeCompleto")
    default String nomeCompleto(Usuario usuario) {
        return usuario == null ? null : usuario.getNome() + " " + usuario.getSobrenome();
    }
}
