package com.siszoo.usuarios.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import com.siszoo.usuarios.entity.AcaoAuditoria;

import com.siszoo.usuarios.entity.AuditoriaEvento;

public interface AuditoriaEventoRepository extends JpaRepository<AuditoriaEvento, UUID>, JpaSpecificationExecutor<AuditoriaEvento> {

    // F2-027: valores distintos para os filtros da tela de Logs (toda a trilha).
    @Query("select distinct e.acao from AuditoriaEvento e order by e.acao")
    List<AcaoAuditoria> acoesDistintas();

    @Query("select distinct e.entidade from AuditoriaEvento e order by e.entidade")
    List<String> entidadesDistintas();

    @Query("select distinct u.email from AuditoriaEvento e join e.usuario u order by u.email")
    List<String> usuariosDistintos();

    // T37: mini trilha de auditoria de uma entidade especifica (ex.: um
    // processo sanitario), para quem so tem permissao de leitura do proprio
    // modulo (nao USUARIOS_ACESSO:leitura, que e so do Administrador).
    List<AuditoriaEvento> findByEntidadeAndEntidadeIdOrderByOcorreuEmAsc(String entidade, UUID entidadeId);
}
