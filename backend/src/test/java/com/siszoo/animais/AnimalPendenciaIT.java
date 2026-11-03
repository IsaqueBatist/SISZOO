package com.siszoo.animais;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import com.siszoo.animais.clinico.dto.CriarProcedimentoRequest;
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
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

import io.restassured.http.ContentType;

@Import(RelogioTesteConfig.class)
class AnimalPendenciaIT extends AbstractIntegrationTest {

    private static final LocalDate HOJE = RelogioTesteConfig.HOJE;

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
        tokenAdmin = fixture.tokenAdmin("teste.admin.pendencia@itu.sp.gov.br", "Pendencia");
    }

    @Test
    @DisplayName("a listagem por pendencia tem o mesmo total do alerta correspondente do dashboard")
    void totalDaListagemIgualAoDoAlerta() {
        fixture.criarAnimal(tokenAdmin);

        Map<String, Long> alertas = totalPorTipoDeAlerta();
        for (String pendencia : List.of("ficha_incompleta", "sem_avaliacao_30d", "nao_castrado")) {
            assertThat(pendencia, totalDaPendencia(pendencia), equalTo(alertas.get(pendencia)));
        }
    }

    @Test
    @DisplayName("animal novo aparece em ficha_incompleta, nao_castrado e sem_avaliacao_30d")
    void animalNovoApareceNasPendencias() {
        String animalId = fixture.criarAnimal(tokenAdmin);

        assertThat(idsDaPendencia("ficha_incompleta"), hasItem(animalId));
        assertThat(idsDaPendencia("nao_castrado"), hasItem(animalId));
        assertThat(idsDaPendencia("sem_avaliacao_30d"), hasItem(animalId));
    }

    @Test
    @DisplayName("procedimento recente tira o animal de sem_avaliacao_30d; castracao tira de nao_castrado")
    void procedimentoResolveAPendencia() {
        String animalId = fixture.criarAnimal(tokenAdmin);

        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarProcedimentoRequest(UUID.fromString(animalId), "castracao", HOJE.minusDays(1), null, null, null))
                .when().post("/api/procedimentos")
                .then().statusCode(200);

        assertThat(idsDaPendencia("sem_avaliacao_30d"), not(hasItem(animalId)));
        assertThat(idsDaPendencia("nao_castrado"), not(hasItem(animalId)));
    }

    @Test
    @DisplayName("medicacao_ativa lista o animal com prescricao ATIVA terminando em 7 dias e ignora a de 8 dias")
    void medicacaoTerminandoRespeitaAJanela() {
        String dentroDaJanela = fixture.criarAnimal(tokenAdmin);
        criarPrescricaoAtiva(dentroDaJanela, HOJE.plusDays(7));
        String foraDaJanela = fixture.criarAnimal(tokenAdmin);
        criarPrescricaoAtiva(foraDaJanela, HOJE.plusDays(8));

        List<String> ids = idsDaPendencia("medicacao_ativa");
        assertThat(ids, hasItem(dentroDaJanela));
        assertThat(ids, not(hasItem(foraDaJanela)));
    }

    @Test
    @DisplayName("animal fora da custodia nao entra em ficha_incompleta")
    void foraDaCustodiaNaoEntraEmFichaIncompleta() {
        String adotado = fixture.criarAnimal(tokenAdmin, "adotado");

        assertThat(idsDaPendencia("ficha_incompleta"), not(hasItem(adotado)));
    }

    @Test
    @DisplayName("422 para pendencia desconhecida")
    void pendenciaDesconhecidaRetorna422() {
        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get("/api/animais?pendencia=qualquer_coisa")
                .then().statusCode(422);
    }

    private long totalDaPendencia(String pendencia) {
        return given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get("/api/animais?pendencia=" + pendencia + "&tamanho=1")
                .then().statusCode(200)
                .extract().jsonPath().getLong("totalItens");
    }

    private List<String> idsDaPendencia(String pendencia) {
        return given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get("/api/animais?pendencia=" + pendencia + "&tamanho=500")
                .then().statusCode(200)
                .extract().jsonPath().getList("itens.id", String.class);
    }

    private Map<String, Long> totalPorTipoDeAlerta() {
        List<Map<String, Object>> alertas = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when().get("/api/dashboard/kpis")
                .then().statusCode(200)
                .extract().jsonPath().getList("alertas");
        return alertas.stream().collect(Collectors.toMap(
                alerta -> (String) alerta.get("tipo"),
                alerta -> ((Number) alerta.get("total")).longValue()));
    }

    private void criarPrescricaoAtiva(String animalId, LocalDate dataFimPrevista) {
        CategoriaFarmacologica categoria = new CategoriaFarmacologica();
        categoria.setNome("Categoria Pendencia " + UUID.randomUUID());
        categoriaFarmacologicaRepository.save(categoria);

        Medicamento medicamento = new Medicamento();
        medicamento.setNome("Medicamento Pendencia " + UUID.randomUUID());
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
