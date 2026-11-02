package com.siszoo.animais.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

import com.siszoo.animais.entity.Animal;

public interface AnimalRepository extends JpaRepository<Animal, UUID>, JpaSpecificationExecutor<Animal> {

    @Override
    @EntityGraph(attributePaths = {"especie", "status", "motivoEntrada", "baia", "baia.tipoBaia", "criadoPor"})
    Page<Animal> findAll(Specification<Animal> spec, Pageable pageable);

    @Query("SELECT a.baia.id AS baiaId, a.id AS id, a.nome AS nome, a.fotoMiniatura AS fotoMiniatura FROM Animal a "
            + "WHERE a.baia IS NOT NULL AND a.status.codigo NOT IN :codigosForaDaCustodia ORDER BY a.nome, a.id")
    List<ResidenteBaiaProjection> listarResidentesDeBaias(
            @Param("codigosForaDaCustodia") Collection<String> codigosForaDaCustodia);

    Optional<Animal> findByMicrochip(String microchip);

    Optional<Animal> findByNumeroMedalha(String numeroMedalha);

    long countByBaia_IdAndStatus_CodigoNotIn(UUID baiaId, Collection<String> codigosExcluidos);

    @Query("SELECT a.baia.id AS baiaId, COUNT(a) AS total FROM Animal a "
            + "WHERE a.baia.id IN :baiaIds AND a.status.codigo NOT IN :codigosExcluidos "
            + "GROUP BY a.baia.id")
    List<OcupacaoBaiaProjection> contarOcupacaoPorBaia(
            @Param("baiaIds") Collection<UUID> baiaIds,
            @Param("codigosExcluidos") Collection<String> codigosExcluidos);

    @Query("SELECT a.especie.codigo AS especieCodigo, COUNT(a) AS total FROM Animal a "
            + "WHERE a.status.codigo NOT IN :codigosForaDaCustodia GROUP BY a.especie.codigo")
    List<ContagemPorEspecieProjection> contarSobCustodiaPorEspecie(
            @Param("codigosForaDaCustodia") Collection<String> codigosForaDaCustodia);

    long countByFichaCompletaFalseAndStatus_CodigoNotIn(Collection<String> codigosForaDaCustodia);

    long countByEsterilizadoFalseAndStatus_Codigo(String statusCodigo);

    long countByEsterilizadoFalseAndDataEntradaBeforeAndStatus_CodigoNotIn(
            LocalDateTime entradaLimite, Collection<String> codigosForaDaCustodia);

    @Query("""
            SELECT a FROM Animal a
            JOIN FETCH a.especie
            JOIN FETCH a.status
            LEFT JOIN FETCH a.baia
            WHERE a.esterilizado = false
              AND a.dataEntrada < :entradaLimite
              AND a.status.codigo NOT IN :codigosForaDaCustodia
            ORDER BY a.dataEntrada, a.id
            """)
    List<Animal> listarNaoEsterilizadosComEntradaAntesDe(
            @Param("entradaLimite") LocalDateTime entradaLimite,
            @Param("codigosForaDaCustodia") Collection<String> codigosForaDaCustodia);

    @Query("""
            SELECT COUNT(a) FROM Animal a
            WHERE a.status.codigo NOT IN :codigosForaDaCustodia
              AND NOT EXISTS (
                  SELECT 1 FROM Procedimento p
                  WHERE p.animal = a
                    AND p.data >= :dataLimite
                    AND NOT EXISTS (SELECT 1 FROM Procedimento r WHERE r.retifica = p)
              )
            """)
    long countSemAvaliacaoDesde(
            @Param("codigosForaDaCustodia") Collection<String> codigosForaDaCustodia,
            @Param("dataLimite") LocalDate dataLimite);

    long countByStatus_CodigoNotIn(Collection<String> codigosForaDaCustodia);

    long countByStatus_Codigo(String codigoStatus);

    @Query("SELECT a.especie.nome AS caracteristica, COUNT(a) AS quantidade FROM Animal a "
            + "WHERE a.status.codigo = :codigoStatus GROUP BY a.especie.nome")
    List<ContagemPorCaracteristicaProjection> contarPorEspecieComStatus(@Param("codigoStatus") String codigoStatus);

    @Query("SELECT a.porte AS caracteristica, COUNT(a) AS quantidade FROM Animal a "
            + "WHERE a.status.codigo = :codigoStatus AND a.porte IS NOT NULL GROUP BY a.porte")
    List<ContagemPorCaracteristicaProjection> contarPorPorteComStatus(@Param("codigoStatus") String codigoStatus);
}
