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
    // Ano como intervalo de datas, como em contarPorDoenca (indice de data_abertura).
    default List<ContagemCatalogoProjection> contarRaivaPorEspecie(int ano) {
        return contarRaivaPorEspecieEntre(LocalDate.of(ano, 1, 1), LocalDate.of(ano, 12, 31));
    }

    @Query("SELECT a.especie.codigo AS codigo, a.especie.nome AS nome, "
            + "COUNT(DISTINCT a.processo) AS quantidade "
            + "FROM AnimalAmostrado a WHERE a.processo.doenca.codigo = 'raiva' "
            + "AND a.processo.dataAbertura BETWEEN :inicio AND :fim "
            + "GROUP BY a.especie.codigo, a.especie.nome")
    List<ContagemCatalogoProjection> contarRaivaPorEspecieEntre(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    // ── Relatorio Anual de Processos (T41) ──────────────────────────────

    // "Com contato humano" (KPI do topo): mesmo padrao "processo = 1 caso"
    // de contarRaivaPorEspecie, mas por QUALQUER doenca e por periodo (nao ano).
    @Query("SELECT COUNT(DISTINCT a.processo) FROM AnimalAmostrado a "
            + "WHERE a.contatoHumano = true AND a.processo.dataAbertura BETWEEN :inicio AND :fim")
    long contarProcessosComContatoHumano(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    // "Distribuição por Espécie" (secao 4): mesmo padrao de contarRaivaPorEspecie,
    // mas sem o filtro de doenca = 'raiva' (todas as doencas do periodo).
    @Query("SELECT a.especie.codigo AS codigo, a.especie.nome AS nome, "
            + "COUNT(DISTINCT a.processo) AS quantidade "
            + "FROM AnimalAmostrado a WHERE a.processo.dataAbertura BETWEEN :inicio AND :fim "
            + "GROUP BY a.especie.codigo, a.especie.nome")
    List<ContagemCatalogoProjection> contarPorEspecieNoPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    // "Laboratórios utilizados" (secao 6): "Amostras" conta linhas de
    // animal_amostrado (nao processos) — um processo com 2 amostras conta 2
    // vezes, ja que o laboratorio e do processo mas a unidade exibida e a amostra.
    @Query("SELECT a.processo.laboratorio.codigo AS codigo, a.processo.laboratorio.nome AS nome, COUNT(a) AS quantidade "
            + "FROM AnimalAmostrado a WHERE a.processo.dataAbertura BETWEEN :inicio AND :fim "
            + "GROUP BY a.processo.laboratorio.codigo, a.processo.laboratorio.nome")
    List<ContagemCatalogoProjection> contarAmostrasPorLaboratorio(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}
