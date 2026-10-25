package com.siszoo.animais.clinico.mapper;

import java.util.UUID;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.siszoo.animais.clinico.dto.VacinacaoResponse;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.usuarios.entity.Usuario;

@Mapper(componentModel = "spring")
public interface VacinacaoMapper {

    @Mapping(target = "animalId", source = "vacinacao.animal.id")
    @Mapping(target = "vacinaCodigo", source = "vacinacao.vacina.codigo")
    @Mapping(target = "vacinaNome", source = "vacinacao.vacina.nome")
    @Mapping(target = "aplicadoPorId", source = "vacinacao.aplicadoPor.id")
    @Mapping(target = "aplicadoPorNome", source = "vacinacao.aplicadoPor", qualifiedByName = "nomeCompleto")
    @Mapping(target = "dataValidade", expression = "java(vacinacao.calcularDataValidade())")
    @Mapping(target = "retificaId", source = "vacinacao.retifica.id")
    @Mapping(target = "retificadoPorId", source = "retificadoPorId")
    @Mapping(target = "statusRegistro", expression = "java(retificadoPorId != null ? \"RETIFICADO\" : \"ATIVO\")")
    VacinacaoResponse toResponse(Vacinacao vacinacao, UUID retificadoPorId);

    @Named("nomeCompleto")
    default String nomeCompleto(Usuario usuario) {
        return usuario == null ? null : usuario.nomeCompleto();
    }
}
