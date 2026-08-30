package com.siszoo.animais.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.siszoo.animais.dto.AnimalResponse;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.entity.Baia;
import com.siszoo.usuarios.entity.Usuario;

@Mapper(componentModel = "spring")
public interface AnimalMapper {

    @Mapping(target = "especieCodigo", source = "especie.codigo")
    @Mapping(target = "especieNome", source = "especie.nome")
    @Mapping(target = "statusCodigo", source = "status.codigo")
    @Mapping(target = "statusNome", source = "status.nome")
    @Mapping(target = "motivoEntradaCodigo", source = "motivoEntrada.codigo")
    @Mapping(target = "motivoEntradaNome", source = "motivoEntrada.nome")
    @Mapping(target = "baiaId", source = "baia.id")
    @Mapping(target = "baiaNome", source = "baia.nome")
    @Mapping(target = "tipoBaiaNome", source = "baia", qualifiedByName = "tipoBaiaNome")
    @Mapping(target = "criadoPorId", source = "criadoPor.id")
    @Mapping(target = "criadoPorNome", source = "criadoPor", qualifiedByName = "nomeCompleto")
    AnimalResponse toResponse(Animal animal);

    @Named("tipoBaiaNome")
    default String tipoBaiaNome(Baia baia) {
        return baia == null ? null : baia.getTipoBaia().getNome();
    }

    @Named("nomeCompleto")
    default String nomeCompleto(Usuario usuario) {
        return usuario.getNome() + " " + usuario.getSobrenome();
    }
}
