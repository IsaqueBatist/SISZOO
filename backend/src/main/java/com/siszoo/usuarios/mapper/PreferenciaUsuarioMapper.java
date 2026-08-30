package com.siszoo.usuarios.mapper;

import org.mapstruct.Mapper;

import com.siszoo.usuarios.dto.PreferenciaUsuarioResponse;
import com.siszoo.usuarios.entity.PreferenciaUsuario;

@Mapper(componentModel = "spring")
public interface PreferenciaUsuarioMapper {

    PreferenciaUsuarioResponse toResponse(PreferenciaUsuario preferencias);
}
