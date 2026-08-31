package com.siszoo.animais.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.siszoo.animais.entity.Animal;

public interface AnimalRepository extends JpaRepository<Animal, UUID>, JpaSpecificationExecutor<Animal> {

    Optional<Animal> findByMicrochip(String microchip);

    long countByBaia_IdAndStatus_CodigoNotIn(UUID baiaId, Collection<String> codigosExcluidos);

    // Agregação única (GROUP BY) para evitar N+1 ao calcular a ocupação de
    // várias baias na listagem (DER §3.3): uma query por baia degradaria a
    // paginação em máquinas com ~2GB RAM (CLAUDE.md, restrições de infra).
    @Query("SELECT a.baia.id AS baiaId, COUNT(a) AS total FROM Animal a "
            + "WHERE a.baia.id IN :baiaIds AND a.status.codigo NOT IN :codigosExcluidos "
            + "GROUP BY a.baia.id")
    List<OcupacaoBaiaProjection> contarOcupacaoPorBaia(
            @Param("baiaIds") Collection<UUID> baiaIds,
            @Param("codigosExcluidos") Collection<String> codigosExcluidos);
}
