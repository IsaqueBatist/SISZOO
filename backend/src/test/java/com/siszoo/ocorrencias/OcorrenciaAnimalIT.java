package com.siszoo.ocorrencias;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

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
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

@Import(RelogioTesteConfig.class)
class OcorrenciaAnimalIT extends AbstractIntegrationTest {

    private static final String ROTA = "/api/ocorrencias";
    private static final LocalDate HOJE = RelogioTesteConfig.HOJE;

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAdmin;
    private String tokenAgente;
    private String tokenVet;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin("admin.ocorrencia.animal@itu.sp.gov.br", "OcorrenciaAnimal");
        tokenAgente = fixture.tokenComCargo("agente.ocorrencia.animal@itu.sp.gov.br", "Agente", "OcorrenciaAnimal",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        tokenVet = fixture.tokenComCargo("vet.ocorrencia.animal@itu.sp.gov.br", "Vet", "OcorrenciaAnimal",
                ApiTesteFixture.CARGO_VETERINARIO_ID);
    }

    @Test
    @DisplayName("ocorrencia criada sem animal fica sem vinculo")
    void criarSemAnimal() {
        criar(tokenAgente, corpo(false)).then().statusCode(200).body("animalVinculado", nullValue());
    }

    @Test
    @DisplayName("ocorrencia criada com animal ja nasce vinculada")
    void criarComAnimal() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        Map<String, Object> corpo = corpo(false);
        corpo.put("animalId", animalId);

        criar(tokenAgente, corpo).then().statusCode(200)
                .body("animalVinculado.id", equalTo(animalId))
                .body("animalVinculado.nome", equalTo("Animal de Teste"));
    }

    @Test
    @DisplayName("vincular animal existente persiste e grava auditoria ATUALIZACAO com animalId no depois")
    void vincularAnimalExistenteEAuditado() {
        String ocorrenciaId = criar(tokenAgente, corpo(false)).then().statusCode(200).extract().path("id");
        String animalId = fixture.criarAnimal(tokenAdmin);

        vincular(tokenAgente, ocorrenciaId, animalId).then().statusCode(200)
                .body("animalVinculado.id", equalTo(animalId));

        String gravado = jdbcTemplate.queryForObject(
                "SELECT CAST(animal_id AS text) FROM ocorrencia WHERE id = CAST(? AS uuid)", String.class, ocorrenciaId);
        assertThat(gravado, equalTo(animalId));
        List<Map<String, Object>> eventos = jdbcTemplate.queryForList(
                "SELECT CAST(payload_antes AS text) AS antes, CAST(payload_depois AS text) AS depois"
                        + " FROM auditoria_evento WHERE entidade = 'ocorrencia' AND acao = 'ATUALIZACAO'"
                        + " AND entidade_id = CAST(? AS uuid)", ocorrenciaId);
        assertThat(eventos, hasSize(1));
        assertThat((String) eventos.get(0).get("antes"), containsString("\"animalId\": null"));
        assertThat((String) eventos.get(0).get("depois"), containsString(animalId));
    }

    @Test
    @DisplayName("vincular animal inexistente da 404")
    void vincularAnimalInexistente() {
        String ocorrenciaId = criar(tokenAgente, corpo(false)).then().statusCode(200).extract().path("id");

        vincular(tokenAgente, ocorrenciaId, UUID.randomUUID().toString()).then().statusCode(404);
    }

    @Test
    @DisplayName("o mesmo animal nao pode ser origem de duas ocorrencias")
    void animalJaVinculadoAOutraOcorrencia() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        String primeira = criar(tokenAgente, corpo(false)).then().statusCode(200).extract().path("id");
        String segunda = criar(tokenAgente, corpo(false)).then().statusCode(200).extract().path("id");
        vincular(tokenAgente, primeira, animalId).then().statusCode(200);

        vincular(tokenAgente, segunda, animalId).then().statusCode(409);
    }

    @Test
    @DisplayName("ocorrencia encerrada aceita o vinculo uma vez e recusa a troca")
    void encerradaAceitaUmaVezERecusaTroca() {
        String ocorrenciaId = criar(tokenAgente, corpo(false)).then().statusCode(200).extract().path("id");
        comToken(tokenAgente).contentType(ContentType.JSON).body(Map.of("status", "EM_ATENDIMENTO"))
                .when().patch(ROTA + "/" + ocorrenciaId + "/status").then().statusCode(200);
        comToken(tokenAgente).contentType(ContentType.JSON).body(Map.of("providenciaTomada", "captura_remocao"))
                .when().post(ROTA + "/" + ocorrenciaId + "/encerramento").then().statusCode(200);
        String primeiro = fixture.criarAnimal(tokenAdmin);
        String segundo = fixture.criarAnimal(tokenAdmin);

        vincular(tokenAgente, ocorrenciaId, primeiro).then().statusCode(200)
                .body("statusOcorrencia", equalTo("ENCERRADA"))
                .body("animalVinculado.id", equalTo(primeiro));
        vincular(tokenAgente, ocorrenciaId, segundo).then().statusCode(409);
    }

    @Test
    @DisplayName("vincular exige escrita em ocorrencias")
    void vincularExigeEscrita() {
        String ocorrenciaId = criar(tokenAgente, corpo(false)).then().statusCode(200).extract().path("id");
        String animalId = fixture.criarAnimal(tokenAdmin);

        vincular(tokenVet, ocorrenciaId, animalId).then().statusCode(403);
    }

    @Test
    @DisplayName("ficha do animal lista a origem; em sigilosa so o protocolo, sem dados do denunciante")
    void origemDoAnimalSemDadosDoDenuncianteQuandoSigilosa() {
        String animalPublico = fixture.criarAnimal(tokenAdmin);
        String animalSigiloso = fixture.criarAnimal(tokenAdmin);
        Response publica = criar(tokenAgente, corpo(false));
        Response sigilosa = criar(tokenAgente, corpo(true));
        vincular(tokenAgente, publica.path("id"), animalPublico).then().statusCode(200);
        vincular(tokenAgente, sigilosa.path("id"), animalSigiloso).then().statusCode(200);

        comToken(tokenVet).when().get("/api/animais/" + animalPublico + "/origem").then().statusCode(200)
                .body("$", hasSize(1))
                .body("[0].protocolo", equalTo(publica.path("protocolo")))
                .body("[0].sigilosa", equalTo(false))
                .body("[0].tipoOcorrenciaNome", not(nullValue()));

        Response origemSigilosa = comToken(tokenVet).when().get("/api/animais/" + animalSigiloso + "/origem");
        origemSigilosa.then().statusCode(200)
                .body("$", hasSize(1))
                .body("[0].protocolo", equalTo(sigilosa.path("protocolo")))
                .body("[0].sigilosa", equalTo(true))
                .body("[0].tipoOcorrenciaNome", nullValue())
                .body("[0].dataAbertura", nullValue());
        assertThat(origemSigilosa.asString(), not(containsString("Denunciante Sigiloso")));
    }

    private Map<String, Object> corpo(boolean sigilosa) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "zoonose");
        corpo.put("dataAbertura", HOJE.toString());
        corpo.put("endereco", "Rua das Acacias, 145");
        corpo.put("bairro", "Vila Esperanca");
        corpo.put("descricao", "Cao solto recolhido");
        corpo.put("urgente", false);
        corpo.put("sigilosa", sigilosa);
        corpo.put("anonima", false);
        corpo.put("denunciante", Map.of("nome", sigilosa ? "Denunciante Sigiloso" : "Maria Teste"));
        return corpo;
    }

    private Response criar(String token, Map<String, Object> corpo) {
        return comToken(token).contentType(ContentType.JSON).body(corpo).when().post(ROTA);
    }

    private Response vincular(String token, String ocorrenciaId, String animalId) {
        return comToken(token).contentType(ContentType.JSON).body(Map.of("animalId", animalId))
                .when().put(ROTA + "/" + ocorrenciaId + "/animal");
    }

    private RequestSpecification comToken(String token) {
        return given().header("Authorization", "Bearer " + token);
    }
}
