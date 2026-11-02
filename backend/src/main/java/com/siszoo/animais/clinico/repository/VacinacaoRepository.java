package com.siszoo.animais.clinico.repository;

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
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.comum.repository.ContagemCatalogoProjection;

public interface VacinacaoRepository extends JpaRepository<Vacinacao, UUID>, JpaSpecificationExecutor<Vacinacao> {

    @Override
    @EntityGraph(attributePaths = {"vacina", "aplicadoPor"})
    Page<Vacinacao> findAll(Specification<Vacinacao> spec, Pageable pageable);

    boolean existsByRetificaId(UUID retificaId);

    Optional<Vacinacao> findByRetificaId(UUID retificaId);

    List<Vacinacao> findByRetificaIdIn(Collection<UUID> retificaIds);

    @Query("""
            SELECT COUNT(v) > 0 FROM Vacinacao v
            WHERE v.animal.id = :animalId
              AND NOT EXISTS (SELECT 1 FROM Vacinacao r WHERE r.retifica = v)
            """)
    boolean existeVigenteDoAnimal(@Param("animalId") UUID animalId);

    @EntityGraph(attributePaths = {"animal", "animal.especie", "animal.baia", "vacina", "aplicadoPor"})
    @Query("""
            SELECT v FROM Vacinacao v
            WHERE v.vacina.intervaloMeses IS NOT NULL
              AND v.vacina.ativo = true
              AND v.animal.status.codigo NOT IN :codigosForaDaCustodia
              AND NOT EXISTS (SELECT 1 FROM Vacinacao r WHERE r.retifica = v)
              AND NOT EXISTS (
                  SELECT 1 FROM Vacinacao maisRecente
                  WHERE maisRecente.animal = v.animal
                    AND maisRecente.vacina = v.vacina
                    AND maisRecente <> v
                    AND NOT EXISTS (SELECT 1 FROM Vacinacao r2 WHERE r2.retifica = maisRecente)
                    AND (maisRecente.dataAplicacao > v.dataAplicacao
                         OR (maisRecente.dataAplicacao = v.dataAplicacao AND maisRecente.criadoEm > v.criadoEm)
                         OR (maisRecente.dataAplicacao = v.dataAplicacao AND maisRecente.criadoEm = v.criadoEm AND maisRecente.id > v.id))
              )
            """)
    List<Vacinacao> findVigentesParaAlertaVacinal(
            @Param("codigosForaDaCustodia") Collection<String> codigosForaDaCustodia);

    @EntityGraph(attributePaths = {"animal", "vacina"})
    @Query("""
            SELECT v FROM Vacinacao v
            WHERE v.vacina.intervaloMeses IS NOT NULL
              AND v.vacina.ativo = true
              AND v.animal.status.codigo NOT IN :codigosForaDaCustodia
              AND NOT EXISTS (SELECT 1 FROM Vacinacao r WHERE r.retifica = v)
              AND NOT EXISTS (
                  SELECT 1 FROM Vacinacao maisRecente
                  WHERE maisRecente.animal = v.animal
                    AND maisRecente.vacina = v.vacina
                    AND maisRecente <> v
                    AND NOT EXISTS (SELECT 1 FROM Vacinacao r2 WHERE r2.retifica = maisRecente)
                    AND (maisRecente.dataAplicacao > v.dataAplicacao
                         OR (maisRecente.dataAplicacao = v.dataAplicacao AND maisRecente.criadoEm > v.criadoEm)
                         OR (maisRecente.dataAplicacao = v.dataAplicacao AND maisRecente.criadoEm = v.criadoEm AND maisRecente.id > v.id))
              )
            """)
    List<Vacinacao> findVigentesSobCustodiaParaKpiVacinacao(
            @Param("codigosForaDaCustodia") Collection<String> codigosForaDaCustodia);

    long countByDataAplicacaoBetween(LocalDate inicio, LocalDate fim);

    @Query("""
            SELECT v.vacina.codigo AS codigo, v.vacina.nome AS nome, COUNT(v) AS quantidade
            FROM Vacinacao v
            WHERE v.dataAplicacao BETWEEN :inicio AND :fim
            GROUP BY v.vacina.codigo, v.vacina.nome
            """)
    List<ContagemCatalogoProjection> contarAplicacoesPorVacina(
            @Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("""
            SELECT CONCAT(v.aplicadoPor.nome, ' ', v.aplicadoPor.sobrenome) AS nome, COUNT(v) AS quantidade
            FROM Vacinacao v
            WHERE v.dataAplicacao BETWEEN :inicio AND :fim AND v.aplicadoPor IS NOT NULL
            GROUP BY v.aplicadoPor.id, v.aplicadoPor.nome, v.aplicadoPor.sobrenome
            ORDER BY COUNT(v) DESC
            """)
    List<AplicacaoPorVeterinarioProjection> contarAplicacoesPorVeterinario(
            @Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}
