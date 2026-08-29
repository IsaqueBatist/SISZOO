package com.siszoo.usuarios.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.usuarios.entity.PreferenciaUsuario;

public interface PreferenciaUsuarioRepository extends JpaRepository<PreferenciaUsuario, UUID> {

    Optional<PreferenciaUsuario> findByUsuarioId(UUID usuarioId);
}
