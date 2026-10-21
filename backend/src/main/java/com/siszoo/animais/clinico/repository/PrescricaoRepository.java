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

// Sem metodo de update/delete: registro clinico imutavel (regra de negocio). Ver
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

    // Alerta "medicacao_ativa" (DER §3.7): prescricao ATIVA com fim previsto
    // dentro da janela de 7 dias, so para animais sob custodia. Prescricao
    // sem dataFimPrevista (em aberto) nao entra — segue o texto literal do
    // DER (BETWEEN hoje e hoje+7d).
    long countByStatusAndDataFimPrevistaBetweenAndAnimal_Status_CodigoNotIn(
            StatusPrescricao status,
            LocalDate inicioJanela,
            LocalDate fimJanela,
            Collection<String> codigosForaDaCustodia);
}
