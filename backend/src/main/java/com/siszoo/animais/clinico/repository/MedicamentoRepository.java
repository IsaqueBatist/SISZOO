package com.siszoo.animais.clinico.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.siszoo.animais.clinico.entity.Medicamento;

public interface MedicamentoRepository extends JpaRepository<Medicamento, UUID>, JpaSpecificationExecutor<Medicamento> {

    @Override
    @EntityGraph(attributePaths = {"categoria"})
    Page<Medicamento> findAll(Specification<Medicamento> spec, Pageable pageable);
}
