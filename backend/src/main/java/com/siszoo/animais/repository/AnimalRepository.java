package com.siszoo.animais.repository;

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

import com.siszoo.animais.entity.Animal;

public interface AnimalRepository extends JpaRepository<Animal, UUID>, JpaSpecificationExecutor<Animal> {

    // Relacoes to-one que o AnimalMapper le na listagem; sem isto, N+1 por
    // linha (uma consulta por especie/status/motivo/baia/tipo de baia/autor).
    // So *ToOne: a paginacao continua no banco.
    @Override
    @EntityGraph(attributePaths = {"especie", "status", "motivoEntrada", "baia", "baia.tipoBaia", "criadoPor"})
    Page<Animal> findAll(Specification<Animal> spec, Pageable pageable);

    Optional<Animal> findByMicrochip(String microchip);

    // F2-004: medalha única quando informada (uq_animal_numero_medalha, V23).
    Optional<Animal> findByNumeroMedalha(String numeroMedalha);

    long countByBaia_IdAndStatus_CodigoNotIn(UUID baiaId, Collection<String> codigosExcluidos);

    // Agregação única (GROUP BY) para evitar N+1 ao calcular a ocupação de
    // várias baias na listagem (DER §3.3): uma query por baia degradaria a
    // paginação em máquinas com ~2GB RAM (restrições de infra).
    @Query("SELECT a.baia.id AS baiaId, COUNT(a) AS total FROM Animal a "
            + "WHERE a.baia.id IN :baiaIds AND a.status.codigo NOT IN :codigosExcluidos "
            + "GROUP BY a.baia.id")
    List<OcupacaoBaiaProjection> contarOcupacaoPorBaia(
            @Param("baiaIds") Collection<UUID> baiaIds,
            @Param("codigosExcluidos") Collection<String> codigosExcluidos);

    // KPI "animais" do dashboard (com.siszoo.relatorios, T38): total sob
    // custodia e subtotal por especie numa unica query agregada — o service
    // soma os totais para "total" e le "canino"/"felino" do mapa para os
    // subtotais, em vez de uma query por especie.
    @Query("SELECT a.especie.codigo AS especieCodigo, COUNT(a) AS total FROM Animal a "
            + "WHERE a.status.codigo NOT IN :codigosForaDaCustodia GROUP BY a.especie.codigo")
    List<ContagemPorEspecieProjection> contarSobCustodiaPorEspecie(
            @Param("codigosForaDaCustodia") Collection<String> codigosForaDaCustodia);

    // Alerta "ficha_incompleta" (DER §3.7). ficha_completa e mantido por
    // FichaCompletaService a cada cadastro/edicao/vacinacao — aqui e so um
    // COUNT direto, sem recalcular nada.
    long countByFichaCompletaFalseAndStatus_CodigoNotIn(Collection<String> codigosForaDaCustodia);

    // Alerta "nao_castrado" (DER §3.7): so quem esta disponivel para adocao
    // (os demais status sob custodia — em tratamento/quarentena — nao entram
    // nessa regra).
    long countByEsterilizadoFalseAndStatus_Codigo(String statusCodigo);

    // Alerta "sem_avaliacao_30d" (DER §3.7): animal sob custodia sem nenhum
    // procedimento (vigente, isto e, nao retificado) nos ultimos 30 dias —
    // inclui quem nunca teve procedimento algum, porque o NOT EXISTS nao
    // encontra nenhuma linha para esses casos. Mesmo padrao de "vigente" de
    // VacinacaoRepository#findVigentesParaAlertaVacinal, aplicado a Procedimento.
    @Query("""
            SELECT COUNT(a) FROM Animal a
            WHERE a.status.codigo NOT IN :codigosForaDaCustodia
              AND NOT EXISTS (
                  SELECT 1 FROM Procedimento p
                  WHERE p.animal = a
                    AND p.data >= :dataLimite
                    AND NOT EXISTS (SELECT 1 FROM Procedimento r WHERE r.retifica = p)
              )
            """)
    long countSemAvaliacaoDesde(
            @Param("codigosForaDaCustodia") Collection<String> codigosForaDaCustodia,
            @Param("dataLimite") LocalDate dataLimite);

    // Denominador de "% Animais vacinados" no relatorio de vacinacao (T41):
    // total sob custodia, sem quebra por especie (ao contrario de
    // contarSobCustodiaPorEspecie, usado pelo KPI do dashboard).
    long countByStatus_CodigoNotIn(Collection<String> codigosForaDaCustodia);

    // Relatorio de adocoes (T41): snapshot ATUAL (status = 'adotado'), nao
    // filtrado por periodo — nao ha campo de data de adocao no schema hoje
    // (sem tabela `adocao`, DER §3.2 modelo-alvo ainda nao implementado).
    // Decisao de simplificacao validada com o usuario.
    long countByStatus_Codigo(String codigoStatus);

    @Query("SELECT a.especie.nome AS caracteristica, COUNT(a) AS quantidade FROM Animal a "
            + "WHERE a.status.codigo = :codigoStatus GROUP BY a.especie.nome")
    List<ContagemPorCaracteristicaProjection> contarPorEspecieComStatus(@Param("codigoStatus") String codigoStatus);

    @Query("SELECT a.porte AS caracteristica, COUNT(a) AS quantidade FROM Animal a "
            + "WHERE a.status.codigo = :codigoStatus AND a.porte IS NOT NULL GROUP BY a.porte")
    List<ContagemPorCaracteristicaProjection> contarPorPorteComStatus(@Param("codigoStatus") String codigoStatus);
}
