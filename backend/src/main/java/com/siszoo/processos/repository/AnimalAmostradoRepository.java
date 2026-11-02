package com.siszoo.processos.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.siszoo.comum.repository.ContagemCatalogoProjection;
import com.siszoo.processos.entity.AnimalAmostrado;

public interface AnimalAmostradoRepository extends JpaRepository<AnimalAmostrado, UUID> {

    @EntityGraph(attributePaths = {"especie", "animal", "sintomas"})
    List<AnimalAmostrado> findByProcessoIdOrderByCriadoEmAscIdAsc(UUID processoId);

    default List<ContagemCatalogoProjection> contarRaivaPorEspecie(int ano) {
        return contarRaivaPorEspecieEntre(LocalDate.of(ano, 1, 1), LocalDate.of(ano, 12, 31));
    }

    @Query("SELECT a.especie.codigo AS codigo, a.especie.nome AS nome, "
            + "COUNT(DISTINCT a.processo) AS quantidade "
            + "FROM AnimalAmostrado a WHERE a.processo.doenca.codigo = 'raiva' "
            + "AND a.processo.dataAbertura BETWEEN :inicio AND :fim "
            + "GROUP BY a.especie.codigo, a.especie.nome")
    List<ContagemCatalogoProjection> contarRaivaPorEspecieEntre(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT COUNT(DISTINCT a.processo) FROM AnimalAmostrado a "
            + "WHERE a.contatoHumano = true AND a.processo.dataAbertura BETWEEN :inicio AND :fim")
    long contarProcessosComContatoHumano(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT COUNT(DISTINCT a.processo) FROM AnimalAmostrado a "
            + "WHERE a.contatoHumano IS NULL AND a.processo.dataAbertura BETWEEN :inicio AND :fim")
    long contarProcessosComContatoNaoInformado(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT a.especie.codigo AS codigo, a.especie.nome AS nome, "
            + "COUNT(DISTINCT a.processo) AS quantidade "
            + "FROM AnimalAmostrado a WHERE a.processo.dataAbertura BETWEEN :inicio AND :fim "
            + "GROUP BY a.especie.codigo, a.especie.nome")
    List<ContagemCatalogoProjection> contarPorEspecieNoPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT a.processo.laboratorio.codigo AS codigo, a.processo.laboratorio.nome AS nome, COUNT(a) AS quantidade "
            + "FROM AnimalAmostrado a WHERE a.processo.dataAbertura BETWEEN :inicio AND :fim "
            + "GROUP BY a.processo.laboratorio.codigo, a.processo.laboratorio.nome")
    List<ContagemCatalogoProjection> contarAmostrasPorLaboratorio(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}
