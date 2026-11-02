package com.siszoo.usuarios.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import com.siszoo.usuarios.entity.AcaoAuditoria;

import com.siszoo.usuarios.entity.AuditoriaEvento;

public interface AuditoriaEventoRepository extends JpaRepository<AuditoriaEvento, UUID>, JpaSpecificationExecutor<AuditoriaEvento> {

    @Override
    @EntityGraph(attributePaths = "usuario")
    Page<AuditoriaEvento> findAll(Specification<AuditoriaEvento> spec, Pageable pageable);

    @Query("select distinct e.acao from AuditoriaEvento e order by e.acao")
    List<AcaoAuditoria> acoesDistintas();

    @Query("select distinct u.email from AuditoriaEvento e join e.usuario u order by u.email")
    List<String> usuariosDistintos();

    List<AuditoriaEvento> findByEntidadeAndEntidadeIdOrderByOcorreuEmAsc(String entidade, UUID entidadeId);
}
