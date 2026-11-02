package com.siszoo.ocorrencias.repository;

import java.time.LocalDate;
import java.util.List;
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

import com.siszoo.comum.repository.ContagemCatalogoProjection;
import com.siszoo.ocorrencias.entity.Ocorrencia;

import jakarta.persistence.LockModeType;

public interface OcorrenciaRepository extends JpaRepository<Ocorrencia, UUID>, JpaSpecificationExecutor<Ocorrencia> {

    @Override
    @EntityGraph(attributePaths = {"tipoOcorrencia"})
    Page<Ocorrencia> findAll(Specification<Ocorrencia> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"tipoOcorrencia", "registradoPor", "providenciaTomada", "encerradaPor"})
    @Query("SELECT o FROM Ocorrencia o WHERE o.id = :id")
    Optional<Ocorrencia> findDetalheById(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Ocorrencia o WHERE o.id = :id")
    Optional<Ocorrencia> findByIdForUpdate(@Param("id") UUID id);

    @Query("SELECT COUNT(o) FROM Ocorrencia o LEFT JOIN o.providenciaTomada pt WHERE o.dataAbertura = :hoje "
            + "AND (pt IS NULL OR pt.codigo <> 'registro_indevido')")
    long contarRegistradasEm(@Param("hoje") LocalDate hoje);

    @Query("SELECT COUNT(o) FROM Ocorrencia o LEFT JOIN o.providenciaTomada pt "
            + "WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND (pt IS NULL OR pt.codigo <> 'registro_indevido')")
    long contarRegistradasNoPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT COUNT(o) FROM Ocorrencia o LEFT JOIN o.providenciaTomada pt "
            + "WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND o.statusOcorrencia = 'ENCERRADA' "
            + "AND (pt IS NULL OR pt.codigo <> 'registro_indevido')")
    long contarEncerradasNoPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT COUNT(DISTINCT o.bairro) FROM Ocorrencia o LEFT JOIN o.providenciaTomada pt "
            + "WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND (pt IS NULL OR pt.codigo <> 'registro_indevido')")
    long contarBairrosAtingidos(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT o.bairro AS bairro, COUNT(o) AS quantidade FROM Ocorrencia o LEFT JOIN o.providenciaTomada pt "
            + "WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND (pt IS NULL OR pt.codigo <> 'registro_indevido') "
            + "GROUP BY o.bairro ORDER BY COUNT(o) DESC")
    List<ContagemPorBairroProjection> contarPorBairro(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT o.bairro AS bairro, COUNT(o) AS quantidade FROM Ocorrencia o "
            + "WHERE o.bairro IS NOT NULL AND TRIM(o.bairro) <> '' "
            + "GROUP BY o.bairro ORDER BY COUNT(o) DESC, o.bairro")
    List<ContagemPorBairroProjection> contarTodasPorBairro();

    @Query("SELECT o.bairro AS bairro, o.tipoOcorrencia.nome AS tipo, COUNT(o) AS quantidade FROM Ocorrencia o "
            + "LEFT JOIN o.providenciaTomada pt WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND (pt IS NULL OR pt.codigo <> 'registro_indevido') "
            + "GROUP BY o.bairro, o.tipoOcorrencia.nome")
    List<BairroTipoProjection> contarPorBairroETipo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT o.tipoOcorrencia.codigo AS codigo, o.tipoOcorrencia.nome AS nome, COUNT(o) AS quantidade FROM Ocorrencia o "
            + "LEFT JOIN o.providenciaTomada pt WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND (pt IS NULL OR pt.codigo <> 'registro_indevido') "
            + "GROUP BY o.tipoOcorrencia.codigo, o.tipoOcorrencia.nome ORDER BY COUNT(o) DESC")
    List<ContagemCatalogoProjection> contarPorTipo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT o.bairro AS bairro, o.criadoEm AS criadoEm, o.encerradaEm AS encerradaEm FROM Ocorrencia o "
            + "LEFT JOIN o.providenciaTomada pt WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND o.statusOcorrencia = 'ENCERRADA' "
            + "AND (pt IS NULL OR pt.codigo <> 'registro_indevido')")
    List<TempoAtendimentoProjection> listarTemposDeAtendimento(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}
