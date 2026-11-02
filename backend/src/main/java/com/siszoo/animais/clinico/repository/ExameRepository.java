package com.siszoo.animais.clinico.repository;

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

import com.siszoo.animais.clinico.entity.Exame;

public interface ExameRepository extends JpaRepository<Exame, UUID>, JpaSpecificationExecutor<Exame> {

    @Override
    @EntityGraph(attributePaths = {"tipoExame", "laboratorio", "solicitadoPor"})
    Page<Exame> findAll(Specification<Exame> spec, Pageable pageable);

    boolean existsByRetificaId(UUID retificaId);

    Optional<Exame> findByRetificaId(UUID retificaId);

    List<Exame> findByRetificaIdIn(Collection<UUID> retificaIds);
}
