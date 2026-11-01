package com.siszoo.usuarios.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.siszoo.usuarios.entity.Usuario;

import jakarta.persistence.LockModeType;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID>, JpaSpecificationExecutor<Usuario> {

    Optional<Usuario> findByEmail(String email);

    // Lock nas linhas: dois administradores rebaixando ou desativando um ao
    // outro ao mesmo tempo nao podem deixar o sistema sem nenhum.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Usuario u join u.cargos uc where uc.cargo.nome = :cargo and u.ativo = true")
    List<Usuario> travarAtivosDoCargo(@Param("cargo") String cargo);
}
