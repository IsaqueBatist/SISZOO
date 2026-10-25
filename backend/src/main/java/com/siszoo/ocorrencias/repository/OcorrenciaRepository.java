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

import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.processos.repository.ContagemCatalogoProjection;

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

    // KPI "ocorrencias" do dashboard (com.siszoo.relatorios, T38): registro
    // duplicado/indevido (providencia "registro_indevido") e excluido por
    // decisao de produto registrada no comentario de
    // V10__schema_ocorrencias.sql ("O dashboard deve exclui-la das
    // contagens") — vale pra qualquer contagem de ocorrencias do dashboard,
    // nao so esta.
    @Query("SELECT COUNT(o) FROM Ocorrencia o WHERE o.dataAbertura = :hoje "
            + "AND (o.providenciaTomada IS NULL OR o.providenciaTomada.codigo <> 'registro_indevido')")
    long contarRegistradasEm(@Param("hoje") LocalDate hoje);

    // Relatorio "Ocorrências por Bairro" (T41) — mesma exclusao de
    // 'registro_indevido' de contarRegistradasEm, aplicada a qualquer
    // contagem de ocorrencias (comentario de V10__schema_ocorrencias.sql).
    @Query("SELECT COUNT(o) FROM Ocorrencia o WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND (o.providenciaTomada IS NULL OR o.providenciaTomada.codigo <> 'registro_indevido')")
    long contarRegistradasNoPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT COUNT(o) FROM Ocorrencia o WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND o.statusOcorrencia = 'ENCERRADA' "
            + "AND (o.providenciaTomada IS NULL OR o.providenciaTomada.codigo <> 'registro_indevido')")
    long contarEncerradasNoPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT COUNT(DISTINCT o.bairro) FROM Ocorrencia o WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND (o.providenciaTomada IS NULL OR o.providenciaTomada.codigo <> 'registro_indevido')")
    long contarBairrosAtingidos(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT o.bairro AS bairro, COUNT(o) AS quantidade FROM Ocorrencia o "
            + "WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND (o.providenciaTomada IS NULL OR o.providenciaTomada.codigo <> 'registro_indevido') "
            + "GROUP BY o.bairro ORDER BY COUNT(o) DESC")
    List<ContagemPorBairroProjection> contarPorBairro(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    // Grafico de distribuicao e sugestoes de bairro da tela de ocorrencias
    // (T45, docs/contratos/distribuicao-ocorrencias-bairro.md): todo o
    // historico, sem o recorte do relatorio (periodo, registro_indevido) —
    // o mesmo universo que a tela contava ao baixar a listagem. Agrupa pela
    // grafia gravada; a juncao de grafias ("Centro"/"centro") segue no cliente.
    @Query("SELECT o.bairro AS bairro, COUNT(o) AS quantidade FROM Ocorrencia o "
            + "WHERE o.bairro IS NOT NULL AND TRIM(o.bairro) <> '' "
            + "GROUP BY o.bairro ORDER BY COUNT(o) DESC, o.bairro")
    List<ContagemPorBairroProjection> contarTodasPorBairro();

    @Query("SELECT o.bairro AS bairro, o.tipoOcorrencia.nome AS tipo, COUNT(o) AS quantidade FROM Ocorrencia o "
            + "WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND (o.providenciaTomada IS NULL OR o.providenciaTomada.codigo <> 'registro_indevido') "
            + "GROUP BY o.bairro, o.tipoOcorrencia.nome")
    List<BairroTipoProjection> contarPorBairroETipo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT o.tipoOcorrencia.codigo AS codigo, o.tipoOcorrencia.nome AS nome, COUNT(o) AS quantidade FROM Ocorrencia o "
            + "WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND (o.providenciaTomada IS NULL OR o.providenciaTomada.codigo <> 'registro_indevido') "
            + "GROUP BY o.tipoOcorrencia.codigo, o.tipoOcorrencia.nome ORDER BY COUNT(o) DESC")
    List<ContagemCatalogoProjection> contarPorTipo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    // "Tempo médio (h)" (T41): registro -> encerramento (criadoEm sempre tem
    // hora cheia; horaAbertura e opcional, por isso nao e usada aqui) — so
    // ocorrencias ENCERRADAS no periodo entram. Uma linha por ocorrencia; o
    // service agrupa/calcula a media em Java (JPQL nao tem diferenca de
    // datas em horas de forma portavel).
    @Query("SELECT o.bairro AS bairro, o.criadoEm AS criadoEm, o.encerradaEm AS encerradaEm FROM Ocorrencia o "
            + "WHERE o.dataAbertura BETWEEN :inicio AND :fim "
            + "AND o.statusOcorrencia = 'ENCERRADA' "
            + "AND (o.providenciaTomada IS NULL OR o.providenciaTomada.codigo <> 'registro_indevido')")
    List<TempoAtendimentoProjection> listarTemposDeAtendimento(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}
