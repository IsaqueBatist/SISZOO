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

import com.siszoo.animais.clinico.entity.Procedimento;

// Sem metodo de update/delete: registro clinico imutavel (CLAUDE.md). Ver
// VacinacaoRepository.
public interface ProcedimentoRepository extends JpaRepository<Procedimento, UUID>, JpaSpecificationExecutor<Procedimento> {

    // tipoProcedimento/executadoPor sao carregados via getter no
    // ProcedimentoMapper (nao so o id): sem isto, listar() sofre N+1. Ver
    // comentario equivalente em VacinacaoRepository.
    @Override
    @EntityGraph(attributePaths = {"tipoProcedimento", "executadoPor"})
    Page<Procedimento> findAll(Specification<Procedimento> spec, Pageable pageable);

    boolean existsByRetificaId(UUID retificaId);

    Optional<Procedimento> findByRetificaId(UUID retificaId);

    List<Procedimento> findByRetificaIdIn(Collection<UUID> retificaIds);
}
