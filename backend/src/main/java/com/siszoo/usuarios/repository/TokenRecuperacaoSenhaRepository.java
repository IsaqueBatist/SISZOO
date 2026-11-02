package com.siszoo.usuarios.repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.siszoo.usuarios.entity.TokenRecuperacaoSenha;

import jakarta.persistence.LockModeType;

public interface TokenRecuperacaoSenhaRepository extends JpaRepository<TokenRecuperacaoSenha, UUID> {

    @Query("select t from TokenRecuperacaoSenha t join fetch t.usuario where t.tokenHash = :hash")
    Optional<TokenRecuperacaoSenha> buscarPorHash(@Param("hash") String hash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from TokenRecuperacaoSenha t join fetch t.usuario where t.tokenHash = :hash")
    Optional<TokenRecuperacaoSenha> buscarPorHashParaAtualizar(@Param("hash") String hash);

    @Modifying(flushAutomatically = true)
    @Query("""
            update TokenRecuperacaoSenha t set t.invalidadoEm = :agora
            where t.usuario.id = :usuarioId and t.usadoEm is null and t.invalidadoEm is null
            """)
    int invalidarPendentesDoUsuario(@Param("usuarioId") UUID usuarioId, @Param("agora") LocalDateTime agora);

    @Modifying(flushAutomatically = true)
    @Query("""
            update TokenRecuperacaoSenha t set t.invalidadoEm = :agora
            where t.usuario.id = :usuarioId and t.id <> :exceto and t.usadoEm is null and t.invalidadoEm is null
            """)
    int invalidarOutrosPendentesDoUsuario(@Param("usuarioId") UUID usuarioId, @Param("exceto") UUID exceto,
            @Param("agora") LocalDateTime agora);

    @Modifying
    @Query("delete from TokenRecuperacaoSenha t where t.expiraEm < :limite")
    int apagarExpiradosAntesDe(@Param("limite") LocalDateTime limite);
}
