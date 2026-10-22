package com.siszoo.animais.clinico.mapper;

import java.util.UUID;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.siszoo.animais.clinico.dto.ExameResponse;
import com.siszoo.animais.clinico.entity.Exame;
import com.siszoo.usuarios.entity.Usuario;

@Mapper(componentModel = "spring")
public interface ExameMapper {

    @Mapping(target = "animalId", source = "exame.animal.id")
    @Mapping(target = "tipoExameCodigo", source = "exame.tipoExame.codigo")
    @Mapping(target = "tipoExameNome", source = "exame.tipoExame.nome")
    @Mapping(target = "laboratorioCodigo", source = "exame.laboratorio.codigo")
    @Mapping(target = "laboratorioNome", source = "exame.laboratorio.nome")
    @Mapping(target = "solicitadoPorId", source = "exame.solicitadoPor.id")
    @Mapping(target = "solicitadoPorNome", source = "exame.solicitadoPor", qualifiedByName = "nomeCompleto")
    @Mapping(target = "retificaId", source = "exame.retifica.id")
    @Mapping(target = "retificadoPorId", source = "retificadoPorId")
    @Mapping(target = "statusRegistro", expression = "java(retificadoPorId != null ? \"RETIFICADO\" : \"ATIVO\")")
    ExameResponse toResponse(Exame exame, UUID retificadoPorId);

    @Named("nomeCompleto")
    default String nomeCompleto(Usuario usuario) {
        return usuario == null ? null : usuario.getNome() + " " + usuario.getSobrenome();
    }
}
