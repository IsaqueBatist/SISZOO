package com.siszoo.usuarios.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.siszoo.usuarios.entity.SessaoUsuario;

import jakarta.persistence.LockModeType;

public interface SessaoUsuarioRepository extends JpaRepository<SessaoUsuario, UUID> {

    @Query("""
            select case when s.usuario.senhaAlteradaEm is null then true else false end from SessaoUsuario s
            where s.id = :sessaoId and s.usuario.id = :usuarioId and s.usuario.ativo = true
              and s.encerradaEm is null and s.ultimaAtividadeEm >= :limiteInatividade
            """)
    Optional<Boolean> senhaTemporariaDaSessaoAtiva(@Param("sessaoId") UUID sessaoId, @Param("usuarioId") UUID usuarioId,
            @Param("limiteInatividade") LocalDateTime limiteInatividade);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SessaoUsuario s where s.tokenHash = :hash or s.tokenAnteriorHash = :hash")
    Optional<SessaoUsuario> buscarPorHashParaAtualizar(@Param("hash") String hash);

    @Query("select s from SessaoUsuario s where s.usuario.id = :usuarioId and s.encerradaEm is null")
    List<SessaoUsuario> listarAtivasDoUsuario(@Param("usuarioId") UUID usuarioId);
}
