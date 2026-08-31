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

    // categoria e carregada via getter no MedicamentoMapper (nao so o id): sem
    // isto, listar() sofre N+1 (mesma correcao ja aplicada em
    // Vacinacao/Procedimento/PrescricaoRepository).
    @Override
    @EntityGraph(attributePaths = {"categoria"})
    Page<Medicamento> findAll(Specification<Medicamento> spec, Pageable pageable);
}
