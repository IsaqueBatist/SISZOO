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

import com.siszoo.animais.clinico.entity.Procedimento;
import com.siszoo.comum.repository.ContagemCatalogoProjection;

public interface ProcedimentoRepository extends JpaRepository<Procedimento, UUID>, JpaSpecificationExecutor<Procedimento> {

    @Override
    @EntityGraph(attributePaths = {"tipoProcedimento", "executadoPor"})
    Page<Procedimento> findAll(Specification<Procedimento> spec, Pageable pageable);

    boolean existsByRetificaId(UUID retificaId);

    Optional<Procedimento> findByRetificaId(UUID retificaId);

    List<Procedimento> findByRetificaIdIn(Collection<UUID> retificaIds);

    long countByTipoProcedimento_CodigoAndDataBetweenAndAnimal_Sexo(
            String codigoTipoProcedimento, LocalDate inicio, LocalDate fim, String sexo);

    @Query("""
            SELECT p.tipoProcedimento.codigo AS codigo, p.tipoProcedimento.nome AS nome, COUNT(p) AS quantidade
            FROM Procedimento p
            WHERE p.data BETWEEN :inicio AND :fim
            GROUP BY p.tipoProcedimento.codigo, p.tipoProcedimento.nome
            """)
    List<ContagemCatalogoProjection> contarPorTipo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("""
            SELECT CONCAT(p.executadoPor.nome, ' ', p.executadoPor.sobrenome) AS nome,
                   p.tipoProcedimento.codigo AS tipoCodigo, COUNT(p) AS quantidade
            FROM Procedimento p
            WHERE p.data BETWEEN :inicio AND :fim AND p.executadoPor IS NOT NULL
            GROUP BY p.executadoPor.id, p.executadoPor.nome, p.executadoPor.sobrenome, p.tipoProcedimento.codigo
            """)
    List<ProdutividadeProcedimentoProjection> contarPorVeterinarioETipo(
            @Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @EntityGraph(attributePaths = {"animal", "executadoPor"})
    @Query("""
            SELECT p FROM Procedimento p
            WHERE p.tipoProcedimento.codigo = 'cirurgia_maior' AND p.data BETWEEN :inicio AND :fim
            ORDER BY p.data DESC
            """)
    List<Procedimento> listarCirurgias(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}
