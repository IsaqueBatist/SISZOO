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
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.processos.repository.ContagemCatalogoProjection;

// Sem metodo de update/delete: registro clinico imutavel (regra de negocio). Ver
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

    // ficha_completa (DER §3.2): o animal tem ao menos uma vacinacao vigente,
    // isto e, que nenhuma outra retifica.
    @Query("""
            SELECT COUNT(v) > 0 FROM Vacinacao v
            WHERE v.animal.id = :animalId
              AND NOT EXISTS (SELECT 1 FROM Vacinacao r WHERE r.retifica = v)
            """)
    boolean existeVigenteDoAnimal(@Param("animalId") UUID animalId);

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
    // RN-A05: so animais sob custodia do CCZ geram alerta — o chamador passa
    // StatusAnimal.CODIGOS_FORA_DA_CUSTODIA (fonte unica, tambem usada pela
    // ocupacao de baia) em vez de repetir os codigos aqui.
    @EntityGraph(attributePaths = {"animal", "animal.especie", "animal.baia", "vacina", "aplicadoPor"})
    @Query("""
            SELECT v FROM Vacinacao v
            WHERE v.vacina.intervaloMeses IS NOT NULL
              AND v.vacina.ativo = true
              AND v.animal.status.codigo NOT IN :codigosForaDaCustodia
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
    List<Vacinacao> findVigentesParaAlertaVacinal(
            @Param("codigosForaDaCustodia") Collection<String> codigosForaDaCustodia);

    // KPI "% vacinados" do dashboard (com.siszoo.relatorios, T38): mesma
    // selecao de "vigente" (NOT EXISTS) de findVigentesParaAlertaVacinal, mas
    // DELIBERADAMENTE uma query separada — essa nao e a janela de alerta de 7
    // dias, e "vacinado" aqui so precisa da vigente mais recente de cada par
    // (animal, vacina), sem relacao com o alerta. dataValidade e calculada em
    // Java pelo service (soma de meses nao e portavel em JPQL), igual
    // AlertaVacinalService#calcularDataValidade.
    @EntityGraph(attributePaths = {"animal", "vacina"})
    @Query("""
            SELECT v FROM Vacinacao v
            WHERE v.vacina.intervaloMeses IS NOT NULL
              AND v.vacina.ativo = true
              AND v.animal.status.codigo NOT IN :codigosForaDaCustodia
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
    List<Vacinacao> findVigentesSobCustodiaParaKpiVacinacao(
            @Param("codigosForaDaCustodia") Collection<String> codigosForaDaCustodia);

    // KPI "Vacinas aplicadas" do relatorio de vacinacao (T41): conta todo
    // evento de aplicacao no periodo, inclusive um que uma retificacao
    // posterior tenha corrigido — e contagem de atividade realizada, nao de
    // vigencia atual (que e o papel de findVigentesSobCustodiaParaKpiVacinacao).
    long countByDataAplicacaoBetween(LocalDate inicio, LocalDate fim);

    // Secao "Aplicações por Vacina" (T41): codigo/nome/quantidade no mesmo
    // formato generico de ContagemCatalogoProjection (dashboard).
    @Query("""
            SELECT v.vacina.codigo AS codigo, v.vacina.nome AS nome, COUNT(v) AS quantidade
            FROM Vacinacao v
            WHERE v.dataAplicacao BETWEEN :inicio AND :fim
            GROUP BY v.vacina.codigo, v.vacina.nome
            """)
    List<ContagemCatalogoProjection> contarAplicacoesPorVacina(
            @Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    // Secao "Aplicações por Veterinário" (T41): sem aplicadoPor (registro
    // legado, campo nao obrigatorio) nao entra na contagem — nao ha "veterinario
    // desconhecido" no protótipo.
    @Query("""
            SELECT CONCAT(v.aplicadoPor.nome, ' ', v.aplicadoPor.sobrenome) AS nome, COUNT(v) AS quantidade
            FROM Vacinacao v
            WHERE v.dataAplicacao BETWEEN :inicio AND :fim AND v.aplicadoPor IS NOT NULL
            GROUP BY v.aplicadoPor.id, v.aplicadoPor.nome, v.aplicadoPor.sobrenome
            ORDER BY COUNT(v) DESC
            """)
    List<AplicacaoPorVeterinarioProjection> contarAplicacoesPorVeterinario(
            @Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}
