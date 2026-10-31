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

    // Conferido a cada requisicao autenticada (JwtAuthenticationFilter), sem
    // cache: e o que faz logout, revogacao e desativacao valerem na hora.
    @Query("""
            select count(s) > 0 from SessaoUsuario s
            where s.id = :sessaoId and s.usuario.id = :usuarioId and s.usuario.ativo = true
              and s.encerradaEm is null and s.ultimaAtividadeEm >= :limiteInatividade
            """)
    boolean estaAtiva(@Param("sessaoId") UUID sessaoId, @Param("usuarioId") UUID usuarioId,
            @Param("limiteInatividade") LocalDateTime limiteInatividade);

    // Lock na linha: duas renovacoes simultaneas do mesmo token (abas, retry)
    // passam uma de cada vez, e a segunda ja encontra o token rotacionado.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SessaoUsuario s where s.tokenHash = :hash or s.tokenAnteriorHash = :hash")
    Optional<SessaoUsuario> buscarPorHashParaAtualizar(@Param("hash") String hash);

    @Query("select s from SessaoUsuario s where s.usuario.id = :usuarioId and s.encerradaEm is null")
    List<SessaoUsuario> listarAtivasDoUsuario(@Param("usuarioId") UUID usuarioId);
}
