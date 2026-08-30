package com.siszoo.usuarios.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.siszoo.usuarios.dto.AuditoriaEventoResponse;
import com.siszoo.usuarios.entity.AuditoriaEvento;

@Mapper(componentModel = "spring")
public interface AuditoriaEventoMapper {

    @Mapping(target = "usuarioEmail", source = "usuario.email")
    AuditoriaEventoResponse toResponse(AuditoriaEvento evento);
}
