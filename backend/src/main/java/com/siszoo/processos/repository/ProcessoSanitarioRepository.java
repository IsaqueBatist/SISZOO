package com.siszoo.processos.repository;

import java.util.Collection;
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

import com.siszoo.processos.entity.ProcessoSanitario;

import jakarta.persistence.LockModeType;

public interface ProcessoSanitarioRepository
        extends JpaRepository<ProcessoSanitario, UUID>, JpaSpecificationExecutor<ProcessoSanitario> {

    // Relacoes to-one usadas pela listagem; sem isto, N+1 por linha.
    @Override
    @EntityGraph(attributePaths = {"doenca", "ocorrencia"})
    Page<ProcessoSanitario> findAll(Specification<ProcessoSanitario> spec, Pageable pageable);

    Optional<ProcessoSanitario> findByOcorrenciaId(UUID ocorrenciaId);

    // Uma consulta por pagina da listagem de ocorrencias.
    List<ProcessoSanitario> findByOcorrenciaIdIn(Collection<UUID> ocorrenciaIds);

    // Travado sempre DEPOIS da ocorrencia (ordem global de locks, ver
    // OcorrenciaService.vincularProcesso).
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM ProcessoSanitario p WHERE p.id = :id")
    Optional<ProcessoSanitario> findByIdForUpdate(@Param("id") UUID id);

    // Grafico "Casos Suspeitos" / doenca (com.siszoo.relatorios, T38): 1
    // processo = 1 caso, por ano de abertura (decisao registrada em
    // docs/contratos/dashboard-graficos.md — doenca vive direto no processo,
    // nao na amostra). O service preenche com quantidade:0 as doencas do
    // catalogo sem nenhuma linha aqui.
    @Query("SELECT p.doenca.codigo AS codigo, p.doenca.nome AS nome, COUNT(p) AS quantidade "
            + "FROM ProcessoSanitario p WHERE YEAR(p.dataAbertura) = :ano "
            + "GROUP BY p.doenca.codigo, p.doenca.nome")
    List<ContagemCatalogoProjection> contarPorDoenca(@Param("ano") int ano);

    // Grafico "Resultados Laboratoriais" (com.siszoo.relatorios, T38): so
    // positivo/negativo do RESULTADO VIGENTE do processo (campo
    // resultadoLaboratorial, nao o historico de ResultadoProcesso) —
    // aguardando/inconclusivo/material_inadequado/nao_realizado nunca contam
    // como positivo nem negativo. Ano = ano em que o resultado foi lancado
    // (dataResultado), nao o ano de abertura do processo. Lista dinamica por
    // natureza: so aparecem as doencas com pelo menos 1 linha aqui.
    @Query("SELECT p.doenca.codigo AS codigo, p.doenca.nome AS nome, "
            + "SUM(CASE WHEN p.resultadoLaboratorial.codigo = 'positivo' THEN 1L ELSE 0L END) AS positivos, "
            + "SUM(CASE WHEN p.resultadoLaboratorial.codigo = 'negativo' THEN 1L ELSE 0L END) AS negativos "
            + "FROM ProcessoSanitario p WHERE p.resultadoLaboratorial.codigo IN ('positivo', 'negativo') "
            + "AND YEAR(p.dataResultado) = :ano GROUP BY p.doenca.codigo, p.doenca.nome")
    List<ResultadoCatalogoProjection> contarResultadosPorDoenca(@Param("ano") int ano);
}
