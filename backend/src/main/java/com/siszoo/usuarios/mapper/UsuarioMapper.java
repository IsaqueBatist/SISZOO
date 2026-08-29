package com.siszoo.usuarios.mapper;

import java.util.List;
import java.util.Set;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.siszoo.usuarios.dto.UsuarioResponse;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    @Mapping(target = "cargos", source = "cargos", qualifiedByName = "cargoNomes")
    UsuarioResponse toResponse(Usuario usuario);

    @Named("cargoNomes")
    default List<String> cargoNomes(Set<UsuarioCargo> cargos) {
        return cargos.stream()
                .map(usuarioCargo -> usuarioCargo.getCargo().getNome())
                .sorted()
                .toList();
    }
}
