package com.siszoo.usuarios.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.entity.UsuarioCargoId;

public interface UsuarioCargoRepository extends JpaRepository<UsuarioCargo, UsuarioCargoId> {

    List<UsuarioCargo> findByUsuario_IdIn(Collection<UUID> usuarioIds);
}
