package com.siszoo.animais.clinico;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

// F2-007 / RF-A04 (Fase 3 do TG): exame como registro clinico imutavel (V25),
// no mesmo contrato de vacinacoes/procedimentos (retificacao por novo POST).
class ExameControllerIT extends AbstractIntegrationTest {

    private static final String EMAIL_VET = "teste.vet.exames@itu.sp.gov.br";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenVet;
    private String animalId;

    @BeforeEach
    void preparar() {
        tokenVet = fixture.tokenComCargo(EMAIL_VET, "Vet", "Exames", ApiTesteFixture.CARGO_VETERINARIO_ID);
        animalId = fixture.criarAnimal(fixture.tokenAdmin("teste.admin.exames@itu.sp.gov.br", "Exames"));
    }

    @Test
    @DisplayName("[F2-007] registra exame solicitado (sem resultado) e depois um com resultado; lista por animal com auditoria")
    void registraEListaExames() {
        Response solicitado = criar(corpo(fixture.hoje().minusDays(5).toString(), null, null, "hemograma", "ial_sorocaba"));
        solicitado.then().statusCode(200)
                .body("tipoExameCodigo", equalTo("hemograma"))
                .body("tipoExameNome", equalTo("Hemograma"))
                .body("laboratorioCodigo", equalTo("ial_sorocaba"))
                .body("solicitadoPorNome", equalTo("Vet Exames"))
                .body("dataResultado", nullValue())
                .body("statusRegistro", equalTo("ATIVO"));

        criar(corpo(fixture.hoje().minusDays(3).toString(), fixture.hoje().minusDays(1).toString(),
                "Sem alteracoes", "raspado_pele", null))
                .then().statusCode(200).body("resultado", equalTo("Sem alteracoes")).body("laboratorioCodigo", nullValue());

        Response lista = given().header("Authorization", "Bearer " + tokenVet)
                .when().get("/api/exames?animalId=" + animalId);
        lista.then().statusCode(200).body("totalItens", equalTo(2));
        List<String> tipos = lista.path("itens.tipoExameCodigo");
        assertThat(tipos, equalTo(List.of("raspado_pele", "hemograma")));

        Integer eventos = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM auditoria_evento WHERE entidade = 'exame' AND acao = 'CRIACAO'", Integer.class);
        assertThat(eventos, notNullValue());
        assertThat(eventos >= 2, equalTo(true));
    }

    @Test
    @DisplayName("[F2-007/RN06] retificacao: novo registro vinculado, original marcado RETIFICADO, segunda correcao recusada, DELETE 405")
    void retificacaoImutavel() {
        String originalId = criar(corpo(fixture.hoje().minusDays(2).toString(), null, null, "hemograma", null))
                .then().statusCode(200).extract().path("id");

        Map<String, Object> correcao = corpo(fixture.hoje().minusDays(2).toString(), fixture.hoje().toString(), "Anemia leve", "hemograma", null);
        correcao.put("retificaId", originalId);
        String correcaoId = criar(correcao).then().statusCode(200)
                .body("retificaId", equalTo(originalId)).body("statusRegistro", equalTo("ATIVO"))
                .extract().path("id");

        given().header("Authorization", "Bearer " + tokenVet).when().get("/api/exames/" + originalId)
                .then().statusCode(200).body("statusRegistro", equalTo("RETIFICADO")).body("retificadoPorId", equalTo(correcaoId));

        criar(correcao).then().statusCode(409);
        given().header("Authorization", "Bearer " + tokenVet).when().delete("/api/exames/" + originalId).then().statusCode(405);
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM exame WHERE animal_id = CAST(? AS uuid)", Integer.class, animalId),
                equalTo(2));
    }

    @Test
    @DisplayName("[F2-007] validacoes: tipo inexistente 422, data futura 422, resultado sem data 422, agente sem escrita 403")
    void validacoes() {
        criar(corpo(fixture.hoje().toString(), null, null, "inexistente", null)).then().statusCode(422);
        criar(corpo(fixture.hoje().plusDays(1).toString(), null, null, "hemograma", null))
                .then().statusCode(422).body("campos[0].campo", equalTo("dataSolicitacao"));
        criar(corpo(fixture.hoje().toString(), null, "Resultado sem data", "hemograma", null))
                .then().statusCode(422).body("campos[0].campo", equalTo("resultado"));

        String tokenAgente = fixture.tokenComCargo("teste.agente.exames@itu.sp.gov.br", "Agente", "Exames",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAgente)
                .body(corpo(fixture.hoje().toString(), null, null, "hemograma", null))
                .when().post("/api/exames").then().statusCode(403);
        given().header("Authorization", "Bearer " + tokenAgente).when().get("/api/exames?animalId=" + animalId)
                .then().statusCode(200).body("itens", hasSize(0));
    }

    private Response criar(Map<String, Object> corpo) {
        return given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenVet)
                .body(corpo).when().post("/api/exames");
    }

    private Map<String, Object> corpo(String dataSolicitacao, String dataResultado, String resultado, String tipo, String laboratorio) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("animalId", animalId);
        corpo.put("tipoExame", tipo);
        corpo.put("laboratorio", laboratorio);
        corpo.put("dataSolicitacao", dataSolicitacao);
        corpo.put("dataResultado", dataResultado);
        corpo.put("resultado", resultado);
        corpo.put("observacoes", null);
        return corpo;
    }
}
