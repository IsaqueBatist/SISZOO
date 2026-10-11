package com.siszoo.alertas.controller;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.animais.clinico.entity.UnidadeDose;
import com.siszoo.animais.clinico.entity.Vacina;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.animais.clinico.repository.VacinaRepository;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.entity.StatusAnimal;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

// "antirrabica" (seed V5) tem intervalo_meses=12: a data_validade de cada
// cenario e controlada escolhendo dataAplicacao = HOJE.minusMonths(12) +/-
// alguns dias, ja que HOJE (10/09, ver RelogioTesteConfig) esta longe de
// qualquer virada de mes que quebraria plusMonths/minusMonths.
@Import(RelogioTesteConfig.class)
class AlertaVacinalControllerIT extends AbstractIntegrationTest {

    private static final String EMAIL_ADMIN = "teste.admin.alertas@itu.sp.gov.br";
    private static final LocalDate HOJE = RelogioTesteConfig.HOJE;
    private static final LocalDate APLICACAO_VENCIDA_HA_UM_DIA = HOJE.minusMonths(12).minusDays(1);

    // Especificacao da RN-A05 (oraculo do teste, escrito a mao): para cada
    // codigo do catalogo status_animal (V4), se o animal continua sob
    // custodia do CCZ e portanto aparece no alerta.
    private static final Map<String, Boolean> APARECE_NO_ALERTA_POR_STATUS = Map.of(
            "disponivel_adocao", true,
            "em_tratamento", true,
            "em_quarentena", true,
            "adotado", false,
            "obito_natural", false,
            "obito_eutanasia", false,
            "transferido", false);

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private VacinaRepository vacinaRepository;

    @Autowired
    private VacinacaoRepository vacinacaoRepository;

    private String tokenAdmin;

    @BeforeEach
    void autenticarAdmin() {
        tokenAdmin = fixture.tokenAdmin(EMAIL_ADMIN, "Alertas");
    }

    @Test
    @DisplayName("[RN-A01] validade = hoje-1 -> VENCIDA (-1 dia), com dados de animal e veterinario")
    void deveMarcarComoVencidaUmDiaAposOVencimentoEDevolverDadosDeAnimalEVeterinario() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        fixture.criarVacinacao(tokenAdmin, animalId, APLICACAO_VENCIDA_HA_UM_DIA, null);

        Map<String, Object> animal = fixture.buscarAnimalNoAlertaVacinal(tokenAdmin, animalId)
                .orElseThrow(() -> new AssertionError("Animal " + animalId + " nao apareceu nos alertas"));
        assertThat(animal.get("animalEspecieNome"), equalTo("Canino"));
        assertThat(animal.get("animalSexo"), equalTo("macho"));
        assertThat(animal.get("animalBaiaNome"), equalTo(null));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> vacinas = (List<Map<String, Object>>) animal.get("vacinas");
        assertThat(vacinas, hasSize(1));
        assertThat(vacinas.get(0).get("severidade"), equalTo("VENCIDA"));
        assertThat(numero(vacinas.get(0).get("diasRestantes")), equalTo(-1L));
        assertThat(vacinas.get(0).get("veterinarioNome"), equalTo("Admin Alertas"));
    }

    @Test
    @DisplayName("[RN-A01] validade = hoje -> A_VENCER (0 dias)")
    void deveMarcarComoAVencerNoDiaExatoDoVencimento() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        fixture.criarVacinacao(tokenAdmin, animalId, HOJE.minusMonths(12), null);

        List<Map<String, Object>> vacinas = buscarVacinasDoAnimal(animalId);

        assertThat(vacinas, hasSize(1));
        assertThat(vacinas.get(0).get("severidade"), equalTo("A_VENCER"));
        assertThat(numero(vacinas.get(0).get("diasRestantes")), equalTo(0L));
    }

    @Test
    @DisplayName("[RN-A01] validade = hoje+7 -> A_VENCER (limite inclusivo)")
    void deveMarcarComoAVencerNoLimiteSuperiorDaJanelaDeSeteDias() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        fixture.criarVacinacao(tokenAdmin, animalId, HOJE.minusMonths(12).plusDays(7), null);

        List<Map<String, Object>> vacinas = buscarVacinasDoAnimal(animalId);

        assertThat(vacinas, hasSize(1));
        assertThat(vacinas.get(0).get("severidade"), equalTo("A_VENCER"));
        assertThat(numero(vacinas.get(0).get("diasRestantes")), equalTo(7L));
    }

    @Test
    @DisplayName("[RN-A01] validade = hoje+8 -> fora do alerta")
    void naoDeveRetornarVacinaComVencimentoForaDaJanelaDeSeteDias() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        fixture.criarVacinacao(tokenAdmin, animalId, HOJE.minusMonths(12).plusDays(8), null);

        assertThat(fixture.buscarAnimalNoAlertaVacinal(tokenAdmin, animalId).isPresent(), equalTo(false));
    }

    @Test
    @DisplayName("[RN-A02] so a aplicacao mais recente de cada vacina por animal conta")
    void deveConsiderarSoAAplicacaoMaisRecenteDeCadaVacinaPorAnimal() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        // Aplicacao antiga: isolada, estaria VENCIDA ha 12 meses.
        fixture.criarVacinacao(tokenAdmin, animalId, HOJE.minusMonths(24), null);
        // Reforco recente: dataValidade cai bem fora da janela de alerta.
        fixture.criarVacinacao(tokenAdmin, animalId, HOJE, null);

        assertThat(fixture.buscarAnimalNoAlertaVacinal(tokenAdmin, animalId).isPresent(), equalTo(false));
    }

    @Test
    @DisplayName("[RN-A02] desempate de mesma dataAplicacao devolve um so item")
    void deveDevolverUmSoItemQuandoDuasAplicacoesIndependentesTemAMesmaDataAplicacao() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        // Duas vacinacoes independentes (sem retificacao entre elas) para o
        // mesmo animal+vacina, com a mesma dataAplicacao — a query precisa
        // desempatar (por criadoEm, o registro mais recente) e devolver 1 so.
        fixture.criarVacinacao(tokenAdmin, animalId, APLICACAO_VENCIDA_HA_UM_DIA, null);
        fixture.criarVacinacao(tokenAdmin, animalId, APLICACAO_VENCIDA_HA_UM_DIA, null);

        List<Map<String, Object>> vacinas = buscarVacinasDoAnimal(animalId);

        assertThat(vacinas, hasSize(1));
        assertThat(vacinas.get(0).get("severidade"), equalTo("VENCIDA"));
    }

    @Test
    @DisplayName("[RN-A02] so o fim da cadeia de retificacao conta")
    void deveConsiderarSoORegistroFinalDeUmaCadeiaDeRetificacaoComDoisElos() {
        String animalId = fixture.criarAnimal(tokenAdmin);

        String idA = fixture.criarVacinacao(tokenAdmin, animalId, APLICACAO_VENCIDA_HA_UM_DIA, null);
        String idB = fixture.criarVacinacao(tokenAdmin, animalId, APLICACAO_VENCIDA_HA_UM_DIA, idA);
        String idC = fixture.criarVacinacao(tokenAdmin, animalId, APLICACAO_VENCIDA_HA_UM_DIA, idB);

        List<Map<String, Object>> vacinas = buscarVacinasDoAnimal(animalId);

        assertThat(vacinas, hasSize(1));
        assertThat(vacinas.get(0).get("vacinacaoId"), equalTo(idC));
        assertThat(vacinas.get(0).get("severidade"), equalTo("VENCIDA"));
    }

    // Vacina.ativo e true por padrao: so a falta de intervalo explica a ausencia.
    @Test
    @DisplayName("[RN-A03] vacina sem intervalo_meses nao gera alerta")
    void naoDeveAlertarVacinaSemIntervaloDefinidoNoCatalogo() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        Vacina vacinaSemIntervalo = salvarVacinaDeTeste("teste-sem-intervalo-", null, true);
        salvarVacinacaoDireta(animalId, vacinaSemIntervalo, APLICACAO_VENCIDA_HA_UM_DIA);

        assertThat(fixture.buscarAnimalNoAlertaVacinal(tokenAdmin, animalId).isPresent(), equalTo(false));
    }

    // Mesma data que, numa vacina ativa, estaria VENCIDA ha 1 dia: so o
    // ativo=false explica a ausencia no alerta.
    @Test
    @DisplayName("[RN-A03] vacina inativa no catalogo nao gera alerta")
    void naoDeveAlertarVacinaInativaNoCatalogo() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        Vacina vacinaInativa = salvarVacinaDeTeste("teste-inativa-", 12, false);
        salvarVacinacaoDireta(animalId, vacinaInativa, APLICACAO_VENCIDA_HA_UM_DIA);

        assertThat(fixture.buscarAnimalNoAlertaVacinal(tokenAdmin, animalId).isPresent(), equalTo(false));
    }

    // Teste de caracterizacao: o alerta parte das vacinacoes, entao nao ha
    // mutacao de producao que faca um animal sem vacinacao aparecer; o teste
    // documenta o comportamento e garante que o endpoint nao quebra (200).
    @Test
    @DisplayName("[RN-A04] animal sem nenhuma vacinacao nao aparece e nao causa erro")
    void naoDeveListarAnimalSemNenhumaVacinacao() {
        String animalId = fixture.criarAnimal(tokenAdmin);

        // buscarAnimalNoAlertaVacinal ja exige status 200.
        assertThat(fixture.buscarAnimalNoAlertaVacinal(tokenAdmin, animalId).isPresent(), equalTo(false));
    }

    @ParameterizedTest(name = "[RN-A05] status {0} -> aparece no alerta = {1}")
    @MethodSource("statusDoCatalogo")
    @DisplayName("[RN-A05] so animais sob custodia do CCZ geram alerta")
    void deveAlertarSoAnimaisSobCustodiaDoCcz(String status, boolean deveAparecer) {
        String animalId = fixture.criarAnimal(tokenAdmin, status);
        fixture.criarVacinacao(tokenAdmin, animalId, APLICACAO_VENCIDA_HA_UM_DIA, null);

        assertThat(fixture.buscarAnimalNoAlertaVacinal(tokenAdmin, animalId).isPresent(), equalTo(deveAparecer));
    }

    // Trava contra codigo novo no catalogo sem classificacao: todo codigo da
    // tabela status_animal precisa estar na especificacao acima E na
    // classificacao de producao (StatusAnimal), e as duas precisam concordar.
    @Test
    @DisplayName("[RN-A05] todo status do catalogo esta classificado quanto a custodia, sem sobreposicao")
    void todoStatusDoCatalogoDeveEstarClassificadoQuantoACustodia() {
        List<String> codigosDoCatalogo = jdbcTemplate.queryForList("SELECT codigo FROM status_animal", String.class);

        assertThat(codigosDoCatalogo,
                containsInAnyOrder(APARECE_NO_ALERTA_POR_STATUS.keySet().toArray(String[]::new)));
        for (String codigo : codigosDoCatalogo) {
            boolean sobCustodia = StatusAnimal.CODIGOS_SOB_CUSTODIA.contains(codigo);
            boolean foraDaCustodia = StatusAnimal.CODIGOS_FORA_DA_CUSTODIA.contains(codigo);
            assertThat("classificado exatamente uma vez: " + codigo, sobCustodia ^ foraDaCustodia, equalTo(true));
            assertThat("classificacao coerente com a RN-A05: " + codigo,
                    sobCustodia, equalTo(APARECE_NO_ALERTA_POR_STATUS.get(codigo)));
        }
    }

    static Stream<Arguments> statusDoCatalogo() {
        return APARECE_NO_ALERTA_POR_STATUS.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entrada -> Arguments.of(entrada.getKey(), entrada.getValue()));
    }

    private Vacina salvarVacinaDeTeste(String prefixoCodigo, Integer intervaloMeses, boolean ativo) {
        Vacina vacina = new Vacina();
        vacina.setCodigo(prefixoCodigo + UUID.randomUUID().toString().substring(0, 8));
        vacina.setNome("Vacina de Teste");
        vacina.setIntervaloMeses(intervaloMeses);
        vacina.setAtivo(ativo);
        return vacinaRepository.save(vacina);
    }

    // Grava direto no repositorio: a API so aceita vacinas do catalogo por
    // codigo, e estes cenarios precisam de vacinas de teste fora do padrao.
    private void salvarVacinacaoDireta(String animalId, Vacina vacina, LocalDate dataAplicacao) {
        Vacinacao vacinacao = new Vacinacao();
        vacinacao.setAnimal(animalRepository.findById(UUID.fromString(animalId)).orElseThrow());
        vacinacao.setVacina(vacina);
        vacinacao.setDataAplicacao(dataAplicacao);
        vacinacao.setDoseQuantidade(new BigDecimal("1.000"));
        vacinacao.setDoseUnidade(UnidadeDose.MILILITRO);
        vacinacaoRepository.save(vacinacao);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> buscarVacinasDoAnimal(String animalId) {
        return (List<Map<String, Object>>) fixture.buscarAnimalNoAlertaVacinal(tokenAdmin, animalId)
                .orElseThrow(() -> new AssertionError("Animal " + animalId + " nao apareceu nos alertas"))
                .get("vacinas");
    }

    private long numero(Object valor) {
        return ((Number) valor).longValue();
    }
}
