package com.siszoo.ocorrencias.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.siszoo.ocorrencias.entity.Ocorrencia;

import jakarta.persistence.LockModeType;

public interface OcorrenciaRepository extends JpaRepository<Ocorrencia, UUID>, JpaSpecificationExecutor<Ocorrencia> {

    // Relacoes to-one usadas pelo mapper da listagem; sem isto, N+1 por linha.
    @Override
    @EntityGraph(attributePaths = {"tipoOcorrencia"})
    Page<Ocorrencia> findAll(Specification<Ocorrencia> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"tipoOcorrencia", "registradoPor", "providenciaTomada", "encerradaPor"})
    @Query("SELECT o FROM Ocorrencia o WHERE o.id = :id")
    Optional<Ocorrencia> findDetalheById(@Param("id") UUID id);

    // Toda escrita que depende do estado atual (status, contagem de anexos,
    // vinculo) trava a ocorrencia primeiro (D24). Ordem global de locks:
    // ocorrencia antes de processo (ver OcorrenciaService).
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Ocorrencia o WHERE o.id = :id")
    Optional<Ocorrencia> findByIdForUpdate(@Param("id") UUID id);
}
