package com.siszoo.relatorios.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import com.siszoo.animais.clinico.entity.CategoriaFarmacologica;
import com.siszoo.animais.clinico.entity.Medicamento;
import com.siszoo.animais.clinico.entity.Prescricao;
import com.siszoo.animais.clinico.entity.StatusPrescricao;
import com.siszoo.animais.clinico.entity.UnidadeDose;
import com.siszoo.animais.clinico.entity.UnidadeFrequencia;
import com.siszoo.animais.clinico.entity.ViaAdministracao;
import com.siszoo.animais.clinico.repository.CategoriaFarmacologicaRepository;
import com.siszoo.animais.clinico.repository.MedicamentoRepository;
import com.siszoo.animais.clinico.repository.PrescricaoRepository;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

import io.restassured.http.ContentType;

// Endpoints de agregacao do dashboard (T38): GET /api/dashboard/kpis e
// GET /api/dashboard/graficos. O banco de teste e compartilhado entre
// metodos sem rollback (AbstractIntegrationTest) e contagens globais (total
// de animais, casos por doenca etc.) acumulam dado de OUTROS testes — por
// isso os cenarios abaixo sempre medem o "antes" e verificam o DELTA exato
// apos criar o cenario, nunca um valor absoluto, exceto onde a entidade e
// nova (baia recem-criada).
@Import(RelogioTesteConfig.class)
class DashboardControllerIT extends AbstractIntegrationTest {

    private static final String ROTA_KPIS = "/api/dashboard/kpis";
    private static final String ROTA_GRAFICOS = "/api/dashboard/graficos";
    private static final LocalDate HOJE = RelogioTesteConfig.HOJE;
    private static final int ANO = HOJE.getYear();

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private PrescricaoRepository prescricaoRepository;

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    @Autowired
    private CategoriaFarmacologicaRepository categoriaFarmacologicaRepository;

    private String tokenAdmin;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin("teste.admin.dashboard@itu.sp.gov.br", "Dashboard");
    }

    // ---- Seguranca ----

    @Test
    @DisplayName("401 sem token em /kpis e /graficos")
    void deveRetornar401SemToken() {
        given().when().get(ROTA_KPIS).then().statusCode(401);
        given().when().get(ROTA_GRAFICOS).then().statusCode(401);
    }

    @Test
    @DisplayName("403 para perfil sem RELATORIOS:leitura")
    void deveRetornar403ParaPerfilSemAcesso() {
        // Cargo de teste com so OCORRENCIAS_DENUNCIAS:leitura (ApiTesteFixture) —
        // nenhum cargo real do seed (V3) fica sem RELATORIOS:leitura, entao o
        // cenario de "perfil sem acesso" so existe com este cargo de teste.
        String tokenSemAcesso = fixture.tokenLeitorOcorrencias("teste.leitor.dashboard@itu.sp.gov.br", "Dashboard");

        given().header("Authorization", "Bearer " + tokenSemAcesso).when().get(ROTA_KPIS).then().statusCode(403);
        given().header("Authorization", "Bearer " + tokenSemAcesso).when().get(ROTA_GRAFICOS).then().statusCode(403);
    }

    @Test
    @DisplayName("200 para Admin em /kpis e /graficos")
    void deveRetornar200ParaAdmin() {
        given().header("Authorization", "Bearer " + tokenAdmin).when().get(ROTA_KPIS).then().statusCode(200);
        given().header("Authorization", "Bearer " + tokenAdmin).when().get(ROTA_GRAFICOS).then().statusCode(200);
    }

    // ---- Formato / DER §3.7 ----

    @Test
    @DisplayName("kpis.alertas sempre tem os 7 tipos do DER §3.7 (vacina_vencendo e vacina_vencida separados)")
    void kpisDeveTrazerOsSeteTiposDeAlerta() {
        List<String> tipos = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA_KPIS)
                .then().statusCode(200)
                .extract().jsonPath().getList("alertas.tipo", String.class);

        assertThat(tipos, hasSize(7));
        assertThat(tipos, containsInAnyOrder(
                "vacina_vencendo", "vacina_vencida", "sem_avaliacao_30d", "baia_superlotada",
                "medicacao_ativa", "ficha_incompleta", "nao_castrado"));
    }

    @Test
    @DisplayName("graficos.casosPorDoenca sempre tem as 6 doencas do catalogo, mesmo com quantidade 0")
    void graficosDeveTrazerAsSeisDoencasSempre() {
        List<String> codigos = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA_GRAFICOS + "?ano=1999") // ano sem nenhum processo: so testa o zero-fill
                .then().statusCode(200)
                .extract().jsonPath().getList("casosPorDoenca.doenca.codigo", String.class);

        assertThat(codigos, hasSize(6));
        assertThat(codigos, containsInAnyOrder(
                "raiva", "esporotricose", "leishmaniose_visceral", "leptospirose", "febre_maculosa", "febre_amarela"));
    }

    @Test
    @DisplayName("graficos.casosRaivaPorEspecie sempre tem as 4 especies do catalogo, mesmo com quantidade 0")
    void graficosDeveTrazerAsQuatroEspeciesSempre() {
        List<String> codigos = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA_GRAFICOS + "?ano=1999")
                .then().statusCode(200)
                .extract().jsonPath().getList("casosRaivaPorEspecie.especie.codigo", String.class);

        assertThat(codigos, hasSize(4));
        assertThat(codigos, containsInAnyOrder("canino", "felino", "quiroptero", "pnh"));
    }

    // ---- Cenarios: KPI "animais" ----

    @Test
    @DisplayName("kpis.animais soma +1 no total e em caninos ao criar 1 canino sob custodia")
    void kpiAnimaisDeveSomarMaisUmCanino() {
        Map<String, Long> antes = kpisAnimais();

        fixture.criarAnimal(tokenAdmin);

        Map<String, Long> depois = kpisAnimais();
        assertThat(depois.get("total"), equalTo(antes.get("total") + 1));
        assertThat(depois.get("caninos"), equalTo(antes.get("caninos") + 1));
    }

    // ---- Cenarios: animal recem-criado contribui pra 3 alertas ao mesmo tempo ----
    // fixture.criarAnimal cria SEM vacinacao (ficha_completa exige >=1 vacina
    // vigente, nao so microchip), com esterilizado=false e status
    // disponivel_adocao, e SEM procedimento algum — por isso um unico animal
    // novo entra simultaneamente em ficha_incompleta, nao_castrado e
    // sem_avaliacao_30d.
    @Test
    @DisplayName("animal novo (sem vacina, sem procedimento, disponivel p/ adocao) soma +1 em 3 alertas")
    void animalNovoContribuiParaTresAlertasAoMesmoTempo() {
        Map<String, Long> antes = totalPorTipoDeAlerta(tokenAdmin);

        fixture.criarAnimal(tokenAdmin);

        Map<String, Long> depois = totalPorTipoDeAlerta(tokenAdmin);
        assertThat(depois.get("ficha_incompleta"), equalTo(antes.get("ficha_incompleta") + 1));
        assertThat(depois.get("nao_castrado"), equalTo(antes.get("nao_castrado") + 1));
        assertThat(depois.get("sem_avaliacao_30d"), equalTo(antes.get("sem_avaliacao_30d") + 1));
    }

    // ---- Cenarios: alerta de vacina (reaproveita AlertaVacinalService) ----

    @Test
    @DisplayName("vacina a 7 dias do vencimento soma +1 em vacina_vencendo; vencida ha 1 dia soma +1 em vacina_vencida")
    void deveSomarAlertasDeVacinaPorSeveridade() {
        Map<String, Long> antes = totalPorTipoDeAlerta(tokenAdmin);

        String animalAVencer = fixture.criarAnimal(tokenAdmin);
        fixture.criarVacinacao(tokenAdmin, animalAVencer, HOJE.minusMonths(12).plusDays(7), null);

        String animalVencido = fixture.criarAnimal(tokenAdmin);
        fixture.criarVacinacao(tokenAdmin, animalVencido, HOJE.minusMonths(12).minusDays(1), null);

        Map<String, Long> depois = totalPorTipoDeAlerta(tokenAdmin);
        assertThat(depois.get("vacina_vencendo"), equalTo(antes.get("vacina_vencendo") + 1));
        assertThat(depois.get("vacina_vencida"), equalTo(antes.get("vacina_vencida") + 1));
    }

    // ---- Cenarios: KPI "% vacinados" ----

    @Test
    @DisplayName("animal com vacina aplicada hoje conta como vacinado no KPI de vacinacao")
    void kpiVacinacaoDeveContarAnimalComVacinaVigenteNaoVencida() {
        long vacinadosAntes = given().header("Authorization", "Bearer " + tokenAdmin).when().get(ROTA_KPIS)
                .then().statusCode(200).extract().jsonPath().getLong("vacinacao.vacinados");
        long totalAntes = given().header("Authorization", "Bearer " + tokenAdmin).when().get(ROTA_KPIS)
                .then().statusCode(200).extract().jsonPath().getLong("vacinacao.total");

        String animalId = fixture.criarAnimal(tokenAdmin);
        fixture.criarVacinacao(tokenAdmin, animalId, HOJE, null);

        long vacinadosDepois = given().header("Authorization", "Bearer " + tokenAdmin).when().get(ROTA_KPIS)
                .then().statusCode(200).extract().jsonPath().getLong("vacinacao.vacinados");
        long totalDepois = given().header("Authorization", "Bearer " + tokenAdmin).when().get(ROTA_KPIS)
                .then().statusCode(200).extract().jsonPath().getLong("vacinacao.total");

        assertThat(vacinadosDepois, equalTo(vacinadosAntes + 1));
        assertThat(totalDepois, equalTo(totalAntes + 1));
    }

    // ---- Cenario: baia_superlotada (entidade nova, assercao absoluta e segura) ----

    @Test
    @DisplayName("baia recem-criada com capacidade 1 e 1 animal soma +1 em baia_superlotada")
    void deveContarBaiaSuperlotadaComEntidadeNova() {
        Map<String, Long> antes = totalPorTipoDeAlerta(tokenAdmin);

        // nome tem limite de 40 chars (CriarBaiaRequest) — so os 8 primeiros
        // caracteres do UUID bastam pra evitar colisao entre execucoes.
        String baiaId = criarBaia("Baia T38 " + UUID.randomUUID().toString().substring(0, 8), (short) 1);
        criarAnimalNaBaia(baiaId);

        Map<String, Long> depois = totalPorTipoDeAlerta(tokenAdmin);
        assertThat(depois.get("baia_superlotada"), equalTo(antes.get("baia_superlotada") + 1));
    }

    // ---- Cenario: medicacao_ativa (Prescricao gravada direto, sem endpoint
    // de catalogo de medicamentos disponivel no fixture) ----

    @Test
    @DisplayName("prescricao ATIVA com fim previsto em 7 dias soma +1 em medicacao_ativa")
    void deveContarMedicacaoAtivaTerminandoEm7Dias() {
        Map<String, Long> antes = totalPorTipoDeAlerta(tokenAdmin);

        String animalId = fixture.criarAnimal(tokenAdmin);
        criarPrescricaoAtivaDireta(animalId, HOJE.plusDays(7));

        Map<String, Long> depois = totalPorTipoDeAlerta(tokenAdmin);
        assertThat(depois.get("medicacao_ativa"), equalTo(antes.get("medicacao_ativa") + 1));
    }

    @Test
    @DisplayName("prescricao ATIVA com fim previsto em 8 dias NAO soma em medicacao_ativa (fora da janela de 7 dias)")
    void naoDeveContarMedicacaoAtivaForaDaJanela() {
        Map<String, Long> antes = totalPorTipoDeAlerta(tokenAdmin);

        String animalId = fixture.criarAnimal(tokenAdmin);
        criarPrescricaoAtivaDireta(animalId, HOJE.plusDays(8));

        Map<String, Long> depois = totalPorTipoDeAlerta(tokenAdmin);
        assertThat(depois.get("medicacao_ativa"), equalTo(antes.get("medicacao_ativa")));
    }

    // ---- Cenarios: graficos (processo + resultado) ----

    @Test
    @DisplayName("processo de raiva com amostra canina soma +1 em casosPorDoenca.raiva e casosRaivaPorEspecie.canino")
    void deveSomarUmProcessoDeRaivaNosGraficos() {
        long raivaAntes = casosPorDoenca("raiva");
        long caninoAntes = casosRaivaPorEspecie("canino");

        fixture.postarProcesso(tokenAdmin, null, false).then().statusCode(200);

        assertThat(casosPorDoenca("raiva"), equalTo(raivaAntes + 1));
        assertThat(casosRaivaPorEspecie("canino"), equalTo(caninoAntes + 1));
    }

    @Test
    @DisplayName("resultado positivo lancado soma +1 em resultadosPorDoenca.raiva.positivos")
    void deveSomarResultadoPositivoNoGrafico() {
        long positivosAntes = resultadosPorDoencaPositivos("raiva");

        String processoId = fixture.postarProcesso(tokenAdmin, null, false)
                .then().statusCode(200).extract().path("id");

        // D18/T34: resultado so e aceito a partir de AGUARDANDO_RESULTADO —
        // processo nasce ABERTO (ProcessoSanitario), precisa avancar 1 passo
        // (StatusProcesso#podeTransicionarPara) antes do POST /resultados.
        avancarParaAguardandoResultado(processoId);

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("resultado", "positivo");
        resultado.put("dataResultado", HOJE.toString());
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(resultado)
                .when().post("/api/processos/" + processoId + "/resultados")
                .then().statusCode(200);

        assertThat(resultadosPorDoencaPositivos("raiva"), equalTo(positivosAntes + 1));
    }

    // ---- Helpers ----

    private Map<String, Long> kpisAnimais() {
        var json = given().header("Authorization", "Bearer " + tokenAdmin).when().get(ROTA_KPIS)
                .then().statusCode(200).extract().jsonPath();
        Map<String, Long> valores = new HashMap<>();
        valores.put("total", json.getLong("animais.total"));
        valores.put("caninos", json.getLong("animais.caninos"));
        valores.put("felinos", json.getLong("animais.felinos"));
        return valores;
    }

    private Map<String, Long> totalPorTipoDeAlerta(String token) {
        List<Map<String, Object>> alertas = given()
                .header("Authorization", "Bearer " + token)
                .when().get(ROTA_KPIS)
                .then().statusCode(200)
                .extract().jsonPath().getList("alertas");

        Map<String, Long> totais = new HashMap<>();
        for (Map<String, Object> alerta : alertas) {
            totais.put((String) alerta.get("tipo"), ((Number) alerta.get("total")).longValue());
        }
        return totais;
    }

    private long casosPorDoenca(String codigoDoenca) {
        List<Map<String, Object>> itens = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA_GRAFICOS + "?ano=" + ANO)
                .then().statusCode(200)
                .extract().jsonPath().getList("casosPorDoenca");
        return quantidadeDoCatalogo(itens, "doenca", codigoDoenca, "quantidade");
    }

    private long casosRaivaPorEspecie(String codigoEspecie) {
        List<Map<String, Object>> itens = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA_GRAFICOS + "?ano=" + ANO)
                .then().statusCode(200)
                .extract().jsonPath().getList("casosRaivaPorEspecie");
        return quantidadeDoCatalogo(itens, "especie", codigoEspecie, "quantidade");
    }

    private long resultadosPorDoencaPositivos(String codigoDoenca) {
        List<Map<String, Object>> itens = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA_GRAFICOS + "?ano=" + ANO)
                .then().statusCode(200)
                .extract().jsonPath().getList("resultadosPorDoenca");
        return quantidadeDoCatalogo(itens, "doenca", codigoDoenca, "positivos");
    }

    @SuppressWarnings("unchecked")
    private long quantidadeDoCatalogo(
            List<Map<String, Object>> itens, String chaveCatalogo, String codigo, String campoQuantidade) {
        return itens.stream()
                .filter(item -> codigo.equals(((Map<String, Object>) item.get(chaveCatalogo)).get("codigo")))
                .map(item -> ((Number) item.get(campoQuantidade)).longValue())
                .findFirst()
                .orElse(0L);
    }

    private String criarBaia(String nome, short capacidade) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("nome", nome);
        corpo.put("tipoBaia", "interna");
        corpo.put("capacidade", capacidade);
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(corpo)
                .when().post("/api/baias")
                .then().statusCode(200)
                .extract().path("id");
    }

    private void avancarParaAguardandoResultado(String processoId) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("status", "AGUARDANDO_RESULTADO");
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(corpo)
                .when().patch("/api/processos/" + processoId + "/status")
                .then().statusCode(200);
    }

    private void criarAnimalNaBaia(String baiaId) {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Animal Baia Teste", "canino", "macho", null, null, null, null, null, null, null,
                fixture.microchipUnico(), false, null, "disponivel_adocao", "resgate", fixture.agora(),
                UUID.fromString(baiaId), null, null);
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when().post("/api/animais")
                .then().statusCode(200);
    }

    // Prescricao gravada direto no repositorio (sem endpoint de catalogo de
    // medicamentos disponivel no fixture) — mesmo padrao de
    // AlertaVacinalControllerIT#salvarVacinacaoDireta para entidades de teste
    // fora do catalogo real.
    private void criarPrescricaoAtivaDireta(String animalId, LocalDate dataFimPrevista) {
        CategoriaFarmacologica categoria = new CategoriaFarmacologica();
        categoria.setNome("Categoria Teste T38 " + UUID.randomUUID());
        categoriaFarmacologicaRepository.save(categoria);

        Medicamento medicamento = new Medicamento();
        medicamento.setNome("Medicamento Teste T38 " + UUID.randomUUID());
        medicamento.setCategoria(categoria);
        medicamentoRepository.save(medicamento);

        Prescricao prescricao = new Prescricao();
        prescricao.setAnimal(animalRepository.findById(UUID.fromString(animalId)).orElseThrow());
        prescricao.setMedicamento(medicamento);
        prescricao.setDataInicio(HOJE);
        prescricao.setDataFimPrevista(dataFimPrevista);
        prescricao.setFrequenciaAplicada(1);
        prescricao.setUnidadeFrequencia(UnidadeFrequencia.DIAS);
        prescricao.setDoseQuantidade(new BigDecimal("1.000"));
        prescricao.setDoseUnidade(UnidadeDose.MILILITRO);
        prescricao.setViaAdministracao(ViaAdministracao.ORAL);
        prescricao.setStatus(StatusPrescricao.ATIVA);
        prescricaoRepository.save(prescricao);
    }
}
