package com.siszoo.processos.repository;

import java.time.LocalDate;
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

import com.siszoo.comum.repository.ContagemCatalogoProjection;
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
    // catalogo sem nenhuma linha aqui. O ano vira intervalo de datas (e nao
    // YEAR(col) = :ano) para o filtro usar o indice de data_abertura.
    default List<ContagemCatalogoProjection> contarPorDoenca(int ano) {
        return contarPorDoencaEntre(LocalDate.of(ano, 1, 1), LocalDate.of(ano, 12, 31));
    }

    @Query("SELECT p.doenca.codigo AS codigo, p.doenca.nome AS nome, COUNT(p) AS quantidade "
            + "FROM ProcessoSanitario p WHERE p.dataAbertura BETWEEN :inicio AND :fim "
            + "GROUP BY p.doenca.codigo, p.doenca.nome")
    List<ContagemCatalogoProjection> contarPorDoencaEntre(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    // Grafico "Resultados Laboratoriais" (com.siszoo.relatorios, T38): so
    // positivo/negativo do RESULTADO VIGENTE do processo (campo
    // resultadoLaboratorial, nao o historico de ResultadoProcesso) —
    // aguardando/inconclusivo/material_inadequado/nao_realizado nunca contam
    // como positivo nem negativo. Ano = ano em que o resultado foi lancado
    // (dataResultado), nao o ano de abertura do processo. Lista dinamica por
    // natureza: so aparecem as doencas com pelo menos 1 linha aqui. Intervalo
    // de datas pelo mesmo motivo de contarPorDoenca (indice de data_resultado).
    default List<ResultadoCatalogoProjection> contarResultadosPorDoenca(int ano) {
        return contarResultadosPorDoencaEntre(LocalDate.of(ano, 1, 1), LocalDate.of(ano, 12, 31));
    }

    @Query("SELECT p.doenca.codigo AS codigo, p.doenca.nome AS nome, "
            + "SUM(CASE WHEN p.resultadoLaboratorial.codigo = 'positivo' THEN 1L ELSE 0L END) AS positivos, "
            + "SUM(CASE WHEN p.resultadoLaboratorial.codigo = 'negativo' THEN 1L ELSE 0L END) AS negativos "
            + "FROM ProcessoSanitario p WHERE p.resultadoLaboratorial.codigo IN ('positivo', 'negativo') "
            + "AND p.dataResultado BETWEEN :inicio AND :fim GROUP BY p.doenca.codigo, p.doenca.nome")
    List<ResultadoCatalogoProjection> contarResultadosPorDoencaEntre(
            @Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    // ── Relatorio Anual de Processos (T41) ──────────────────────────────
    // Universo sempre "processos ABERTOS no periodo" (dataAbertura), nao
    // "resultados lancados no periodo" como os metodos do dashboard acima —
    // por isso novas queries em vez de reaproveitar as de cima (so
    // contarPorDoenca(ano) e reaproveitado, ja que tem exatamente o mesmo escopo).

    long countByDataAberturaBetween(LocalDate inicio, LocalDate fim);

    long countByDataAberturaBetweenAndResultadoLaboratorial_Codigo(LocalDate inicio, LocalDate fim, String codigoResultado);

    long countByOcorrenciaIsNullAndDataAberturaBetween(LocalDate inicio, LocalDate fim);

    @Query("""
            SELECT p.doenca.codigo AS codigo, p.doenca.nome AS nome, COUNT(p) AS investigados,
                   SUM(CASE WHEN p.resultadoLaboratorial.codigo = 'positivo' THEN 1L ELSE 0L END) AS positivos,
                   SUM(CASE WHEN p.resultadoLaboratorial.codigo = 'negativo' THEN 1L ELSE 0L END) AS negativos,
                   SUM(CASE WHEN p.resultadoLaboratorial.codigo = 'inconclusivo' THEN 1L ELSE 0L END) AS inconclusivos,
                   SUM(CASE WHEN p.resultadoLaboratorial IS NULL THEN 1L ELSE 0L END) AS aguardando
            FROM ProcessoSanitario p
            WHERE p.dataAbertura BETWEEN :inicio AND :fim
            GROUP BY p.doenca.codigo, p.doenca.nome
            """)
    List<ResultadosLaboratoriaisProjection> contarResultadosDetalhadoPorDoenca(
            @Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT p.dataAbertura AS dataAbertura, p.dataResultado AS dataResultado FROM ProcessoSanitario p "
            + "WHERE p.dataAbertura BETWEEN :inicio AND :fim AND p.dataResultado IS NOT NULL")
    List<TempoResolucaoProjection> listarTemposDeResolucao(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT p.laboratorio.codigo AS laboratorioCodigo, p.dataAbertura AS dataAbertura, p.dataResultado AS dataResultado "
            + "FROM ProcessoSanitario p WHERE p.dataAbertura BETWEEN :inicio AND :fim AND p.dataResultado IS NOT NULL")
    List<TempoResolucaoPorLaboratorioProjection> listarTemposDeResolucaoPorLaboratorio(
            @Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT p.ocorrencia.bairro AS bairro, COUNT(p) AS processos, "
            + "SUM(CASE WHEN p.resultadoLaboratorial.codigo = 'positivo' THEN 1L ELSE 0L END) AS positivos "
            + "FROM ProcessoSanitario p WHERE p.dataAbertura BETWEEN :inicio AND :fim AND p.ocorrencia IS NOT NULL "
            + "GROUP BY p.ocorrencia.bairro ORDER BY COUNT(p) DESC")
    List<BairroProcessoProjection> contarPorBairro(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT p.ocorrencia.bairro AS bairro, p.doenca.nome AS doenca, COUNT(p) AS quantidade FROM ProcessoSanitario p "
            + "WHERE p.dataAbertura BETWEEN :inicio AND :fim AND p.ocorrencia IS NOT NULL "
            + "GROUP BY p.ocorrencia.bairro, p.doenca.nome")
    List<BairroDoencaProjection> contarPorBairroEDoenca(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}
