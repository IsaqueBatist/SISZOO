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

import com.siszoo.animais.clinico.entity.Prescricao;

// Sem metodo de update/delete: registro clinico imutavel (CLAUDE.md). Ver
// VacinacaoRepository.
public interface PrescricaoRepository extends JpaRepository<Prescricao, UUID>, JpaSpecificationExecutor<Prescricao> {

    // medicamento/prescritoPor sao carregados via getter no PrescricaoMapper
    // (nao so o id): sem isto, listar() sofre N+1. Ver comentario equivalente
    // em VacinacaoRepository.
    @Override
    @EntityGraph(attributePaths = {"medicamento", "prescritoPor"})
    Page<Prescricao> findAll(Specification<Prescricao> spec, Pageable pageable);

    boolean existsByRetificaId(UUID retificaId);

    Optional<Prescricao> findByRetificaId(UUID retificaId);

    List<Prescricao> findByRetificaIdIn(Collection<UUID> retificaIds);
}
