package com.siszoo.processos.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.siszoo.processos.entity.AnimalAmostrado;

public interface AnimalAmostradoRepository extends JpaRepository<AnimalAmostrado, UUID> {

    // Uma consulta para as amostras com especie, animal e sintomas.
    @EntityGraph(attributePaths = {"especie", "animal", "sintomas"})
    List<AnimalAmostrado> findByProcessoIdOrderByCriadoEmAscIdAsc(UUID processoId);

    // Grafico "Raiva por Especie" (com.siszoo.relatorios, T38): mantem
    // "processo = 1 caso" (mesma leitura de
    // ProcessoSanitarioRepository#contarPorDoenca), mas aqui a granularidade
    // da amostra importa — um processo com amostras de especies diferentes
    // conta uma vez EM CADA especie (a soma pode exceder o total de
    // processos de raiva no ano). COUNT(DISTINCT processo) evita contar o
    // mesmo processo duas vezes quando ele tem 2+ amostras da MESMA especie.
    @Query("SELECT a.especie.codigo AS codigo, a.especie.nome AS nome, "
            + "COUNT(DISTINCT a.processo) AS quantidade "
            + "FROM AnimalAmostrado a WHERE a.processo.doenca.codigo = 'raiva' "
            + "AND YEAR(a.processo.dataAbertura) = :ano "
            + "GROUP BY a.especie.codigo, a.especie.nome")
    List<ContagemCatalogoProjection> contarRaivaPorEspecie(@Param("ano") int ano);
}
