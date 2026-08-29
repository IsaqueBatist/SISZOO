package com.siszoo.usuarios.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.entity.UsuarioCargoId;

public interface UsuarioCargoRepository extends JpaRepository<UsuarioCargo, UsuarioCargoId> {
}
