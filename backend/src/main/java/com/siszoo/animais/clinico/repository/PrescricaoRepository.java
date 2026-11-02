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

import com.siszoo.animais.clinico.entity.Prescricao;
import com.siszoo.animais.clinico.entity.StatusPrescricao;

public interface PrescricaoRepository extends JpaRepository<Prescricao, UUID>, JpaSpecificationExecutor<Prescricao> {

    @Override
    @EntityGraph(attributePaths = {"medicamento", "prescritoPor"})
    Page<Prescricao> findAll(Specification<Prescricao> spec, Pageable pageable);

    boolean existsByRetificaId(UUID retificaId);

    Optional<Prescricao> findByRetificaId(UUID retificaId);

    List<Prescricao> findByRetificaIdIn(Collection<UUID> retificaIds);

    long countByStatusAndDataFimPrevistaBetweenAndAnimal_Status_CodigoNotIn(
            StatusPrescricao status,
            LocalDate inicioJanela,
            LocalDate fimJanela,
            Collection<String> codigosForaDaCustodia);

    long countByDataInicioBetween(LocalDate inicio, LocalDate fim);
}
