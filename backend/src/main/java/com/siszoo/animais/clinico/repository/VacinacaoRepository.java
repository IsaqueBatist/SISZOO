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

import com.siszoo.animais.clinico.entity.Vacinacao;

// Sem metodo de update/delete: registro clinico imutavel (CLAUDE.md). Ver
// com.siszoo.animais.clinico.service.VacinacaoService para o mecanismo de
// retificacao (novo registro + `retifica`), e RegistrosClinicosSemMutacaoTest
// para o teste que trava essa garantia por reflection.
public interface VacinacaoRepository extends JpaRepository<Vacinacao, UUID>, JpaSpecificationExecutor<Vacinacao> {

    // vacina/aplicadoPor sao carregados via getter no VacinacaoMapper (nao so
    // o id): sem isto, listar() sofre N+1 (um SELECT extra por linha para cada
    // relacao). Ambos sao @ManyToOne (to-one) — nunca incluir aqui uma colecao
    // @OneToMany/@ManyToMany, que forcaria o Hibernate a paginar em memoria.
    @Override
    @EntityGraph(attributePaths = {"vacina", "aplicadoPor"})
    Page<Vacinacao> findAll(Specification<Vacinacao> spec, Pageable pageable);

    boolean existsByRetificaId(UUID retificaId);

    Optional<Vacinacao> findByRetificaId(UUID retificaId);

    List<Vacinacao> findByRetificaIdIn(Collection<UUID> retificaIds);
}
