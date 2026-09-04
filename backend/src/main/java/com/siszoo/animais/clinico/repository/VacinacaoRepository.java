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
import org.springframework.data.jpa.repository.Query;

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

    // Alerta de reforco vacinal (com.siszoo.alertas): devolve so a aplicacao
    // vigente de cada par (animal, vacina) — a mais recente entre as nao
    // retificadas — via NOT EXISTS. Ao contrario de um finder que trouxesse
    // todo o historico, o resultado nao cresce com anos de vacinacoes ja
    // registradas: e limitado pelos pares (animal, vacina) atualmente
    // ativos. Desempate de mesma dataAplicacao: criadoEm mais recente vence;
    // se ainda empatar (mesmo timestamp de criacao), id maior vence — cada
    // NOT EXISTS garante exatamente uma linha vencedora por par, mesmo numa
    // cadeia de retificacao com mais de um elo (A retificado por B,
    // retificado por C: A e B ficam de fora, so C sobra).
    @EntityGraph(attributePaths = {"animal", "animal.especie", "animal.baia", "vacina", "aplicadoPor"})
    @Query("""
            SELECT v FROM Vacinacao v
            WHERE v.vacina.intervaloMeses IS NOT NULL
              AND v.vacina.ativo = true
              AND NOT EXISTS (SELECT 1 FROM Vacinacao r WHERE r.retifica = v)
              AND NOT EXISTS (
                  SELECT 1 FROM Vacinacao maisRecente
                  WHERE maisRecente.animal = v.animal
                    AND maisRecente.vacina = v.vacina
                    AND maisRecente <> v
                    AND NOT EXISTS (SELECT 1 FROM Vacinacao r2 WHERE r2.retifica = maisRecente)
                    AND (maisRecente.dataAplicacao > v.dataAplicacao
                         OR (maisRecente.dataAplicacao = v.dataAplicacao AND maisRecente.criadoEm > v.criadoEm)
                         OR (maisRecente.dataAplicacao = v.dataAplicacao AND maisRecente.criadoEm = v.criadoEm AND maisRecente.id > v.id))
              )
            """)
    List<Vacinacao> findVigentesParaAlertaVacinal();
}
