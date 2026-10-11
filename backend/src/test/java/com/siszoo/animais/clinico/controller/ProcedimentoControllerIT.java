package com.siszoo.animais.clinico.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.animais.clinico.dto.CriarProcedimentoRequest;
import com.siszoo.animais.clinico.entity.Procedimento;
import com.siszoo.animais.clinico.repository.ProcedimentoRepository;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.AuditoriaEvento;
import com.siszoo.usuarios.repository.AuditoriaEventoRepository;

import io.restassured.http.ContentType;
import tools.jackson.databind.ObjectMapper;

class ProcedimentoControllerIT extends AbstractIntegrationTest {

    private static final String EMAIL_ADMIN = "teste.admin.procedimentos@itu.sp.gov.br";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private ProcedimentoRepository procedimentoRepository;

    @Autowired
    private AuditoriaEventoRepository auditoriaEventoRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String tokenAdmin;
    private LocalDate hoje;

    @BeforeEach
    void autenticarAdmin() {
        tokenAdmin = fixture.tokenAdmin(EMAIL_ADMIN, "Procedimentos");
        hoje = fixture.hoje();
    }

    @Test
    void deveCriarProcedimentoComSucesso() {
        String animalId = fixture.criarAnimal(tokenAdmin);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarProcedimentoRequest(
                        UUID.fromString(animalId), "castracao", hoje, "Castracao de rotina",
                        "Sem intercorrencia", null))
                .when()
                .post("/api/procedimentos")
                .then()
                .statusCode(200)
                .body("tipoProcedimentoCodigo", equalTo("castracao"))
                .body("statusRegistro", equalTo("ATIVO"));
    }

    @Test
    void deveRetornar422QuandoTipoProcedimentoInvalido() {
        String animalId = fixture.criarAnimal(tokenAdmin);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarProcedimentoRequest(
                        UUID.fromString(animalId), "tipo-inexistente", hoje, null, null, null))
                .when()
                .post("/api/procedimentos")
                .then()
                .statusCode(422)
                .body("mensagem", equalTo("Tipo de procedimento informado nao existe"));
    }

    @Test
    void deveRetornar404QuandoProcedimentoNaoExiste() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/procedimentos/" + UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    @DisplayName("[RN-C01] PUT/PATCH/DELETE em procedimento retornam 405")
    void deveRetornar405ParaPutPatchEDelete() {
        String id = criarProcedimentoViaApi(fixture.criarAnimal(tokenAdmin), null).path("id");

        given().header("Authorization", "Bearer " + tokenAdmin).when().put("/api/procedimentos/" + id)
                .then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).when().patch("/api/procedimentos/" + id)
                .then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).when().delete("/api/procedimentos/" + id)
                .then().statusCode(405);
    }

    @Test
    void deveRetornar403QuandoAgenteSanitarioTentaCriarProcedimento() {
        String tokenAgente = fixture.tokenComCargo(
                "teste.agente.procedimentos@itu.sp.gov.br", "Teste", "Procedimentos",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        String animalId = fixture.criarAnimal(tokenAdmin);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAgente)
                .body(new CriarProcedimentoRequest(UUID.fromString(animalId), "castracao", hoje, null, null, null))
                .when()
                .post("/api/procedimentos")
                .then()
                .statusCode(403);
    }

    @Test
    @DisplayName("[RN-C02][RN-C03] retificacao de procedimento preserva o original e gera ATUALIZACAO")
    void deveRetificarSemAlterarOriginalEGerarUmEventoDeAuditoria() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        String idOriginal = criarProcedimentoViaApi(animalId, null).path("id");

        Procedimento original = procedimentoRepository.findById(UUID.fromString(idOriginal)).orElseThrow();
        String descricaoOriginal = original.getDescricao();
        LocalDateTime criadoEmOriginal = original.getCriadoEm();

        String idCorrecao = given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarProcedimentoRequest(
                        UUID.fromString(animalId), "castracao", hoje, "Descricao corrigida",
                        "Resultado corrigido", UUID.fromString(idOriginal)))
                .when()
                .post("/api/procedimentos")
                .then()
                .statusCode(200)
                .body("retificaId", equalTo(idOriginal))
                .extract().response().path("id");

        assertThat(idCorrecao, not(equalTo(idOriginal)));

        Procedimento originalReconsultado = procedimentoRepository.findById(UUID.fromString(idOriginal)).orElseThrow();
        assertThat(originalReconsultado.getDescricao(), equalTo(descricaoOriginal));
        assertThat(originalReconsultado.getCriadoEm(), equalTo(criadoEmOriginal));

        given().header("Authorization", "Bearer " + tokenAdmin).when().get("/api/procedimentos/" + idOriginal)
                .then().statusCode(200).body("statusRegistro", equalTo("RETIFICADO")).body("retificadoPorId", equalTo(idCorrecao));

        given().header("Authorization", "Bearer " + tokenAdmin).when().get("/api/procedimentos/" + idCorrecao)
                .then().statusCode(200).body("statusRegistro", equalTo("ATIVO")).body("retificadoPorId", nullValue());

        // Banco de testes compartilhado entre metodos (sem rollback por teste):
        // filtra pelo id da correcao especifica, nao pelo total de eventos do banco.
        List<AuditoriaEvento> eventosDestaCorrecao = auditoriaEventoRepository.findAll().stream()
                .filter(e -> "procedimento".equals(e.getEntidade()) && e.getAcao() == AcaoAuditoria.ATUALIZACAO)
                .filter(e -> idCorrecao.equals(objectMapper.readTree(e.getPayloadDepois()).get("id").asString()))
                .toList();
        assertThat(eventosDestaCorrecao, hasSize(1));
    }

    @Test
    @DisplayName("[RN-C02] procedimento ja retificado nao pode ser retificado de novo (409)")
    void deveRetornar409QuandoRegistroJaFoiRetificado() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        String idOriginal = criarProcedimentoViaApi(animalId, null).path("id");
        criarProcedimentoViaApi(animalId, idOriginal);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarProcedimentoRequest(
                        UUID.fromString(animalId), "castracao", hoje, null, null, UUID.fromString(idOriginal)))
                .when()
                .post("/api/procedimentos")
                .then()
                .statusCode(409)
                .body("mensagem", equalTo("Registro ja foi retificado por outro"));
    }

    private io.restassured.response.Response criarProcedimentoViaApi(String animalId, String retificaId) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarProcedimentoRequest(
                        UUID.fromString(animalId), "castracao", hoje, "Descricao original", "Resultado original",
                        retificaId == null ? null : UUID.fromString(retificaId)))
                .when()
                .post("/api/procedimentos")
                .then()
                .statusCode(200)
                .extract()
                .response();
    }
}
