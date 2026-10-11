package com.siszoo.animais.clinico.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.animais.clinico.dto.CriarPrescricaoRequest;
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
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.AuditoriaEvento;
import com.siszoo.usuarios.repository.AuditoriaEventoRepository;

import io.restassured.http.ContentType;
import tools.jackson.databind.ObjectMapper;

class PrescricaoControllerIT extends AbstractIntegrationTest {

    private static final String EMAIL_ADMIN = "teste.admin.prescricoes@itu.sp.gov.br";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private PrescricaoRepository prescricaoRepository;

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    @Autowired
    private CategoriaFarmacologicaRepository categoriaFarmacologicaRepository;

    @Autowired
    private AuditoriaEventoRepository auditoriaEventoRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String tokenAdmin;
    private String medicamentoId;
    private LocalDate hoje;

    @BeforeEach
    void autenticarAdminECriarMedicamento() {
        tokenAdmin = fixture.tokenAdmin(EMAIL_ADMIN, "Prescricoes");
        hoje = fixture.hoje();
        medicamentoId = criarMedicamento().toString();
    }

    @Test
    void deveCriarPrescricaoComSucesso() {
        String animalId = fixture.criarAnimal(tokenAdmin);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(requestBase(animalId, null))
                .when()
                .post("/api/prescricoes")
                .then()
                .statusCode(200)
                .body("statusRegistro", equalTo("ATIVO"))
                .body("status", equalTo("ATIVA"));
    }

    @Test
    void deveRetornar422QuandoMedicamentoInvalido() {
        String animalId = fixture.criarAnimal(tokenAdmin);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarPrescricaoRequest(
                        UUID.fromString(animalId), UUID.randomUUID(), hoje, null, null, 8,
                        UnidadeFrequencia.HORAS, new BigDecimal("10.000"), UnidadeDose.MILIGRAMA,
                        ViaAdministracao.ORAL, StatusPrescricao.ATIVA, null))
                .when()
                .post("/api/prescricoes")
                .then()
                .statusCode(422)
                .body("mensagem", equalTo("Medicamento informado nao existe"));
    }

    @Test
    void deveRetornar404QuandoPrescricaoNaoExiste() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/prescricoes/" + UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    @DisplayName("[RN-C01] PUT/PATCH/DELETE em prescricao retornam 405")
    void deveRetornar405ParaPutPatchEDelete() {
        String id = criarPrescricaoViaApi(fixture.criarAnimal(tokenAdmin), null).path("id");

        given().header("Authorization", "Bearer " + tokenAdmin).when().put("/api/prescricoes/" + id)
                .then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).when().patch("/api/prescricoes/" + id)
                .then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).when().delete("/api/prescricoes/" + id)
                .then().statusCode(405);
    }

    @Test
    void deveRetornar403QuandoAgenteSanitarioTentaCriarPrescricao() {
        String tokenAgente = fixture.tokenComCargo(
                "teste.agente.prescricoes@itu.sp.gov.br", "Teste", "Prescricoes",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        String animalId = fixture.criarAnimal(tokenAdmin);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAgente)
                .body(requestBase(animalId, null))
                .when()
                .post("/api/prescricoes")
                .then()
                .statusCode(403);
    }

    @Test
    @DisplayName("[RN-C02][RN-C03] retificacao de prescricao preserva o original e gera ATUALIZACAO")
    void deveRetificarParaEncerrarPrescricaoSemAlterarOriginalEGerarUmEventoDeAuditoria() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        String idOriginal = criarPrescricaoViaApi(animalId, null).path("id");

        Prescricao original = prescricaoRepository.findById(UUID.fromString(idOriginal)).orElseThrow();
        StatusPrescricao statusOriginal = original.getStatus();
        LocalDateTime criadoEmOriginal = original.getCriadoEm();

        CriarPrescricaoRequest encerramento = new CriarPrescricaoRequest(
                UUID.fromString(animalId), UUID.fromString(medicamentoId), hoje, null, hoje,
                8, UnidadeFrequencia.HORAS, new BigDecimal("10.000"), UnidadeDose.MILIGRAMA,
                ViaAdministracao.ORAL, StatusPrescricao.CONCLUIDA, UUID.fromString(idOriginal));

        String idCorrecao = given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(encerramento)
                .when()
                .post("/api/prescricoes")
                .then()
                .statusCode(200)
                .body("retificaId", equalTo(idOriginal))
                .body("status", equalTo("CONCLUIDA"))
                .extract().response().path("id");

        assertThat(idCorrecao, not(equalTo(idOriginal)));

        Prescricao originalReconsultada = prescricaoRepository.findById(UUID.fromString(idOriginal)).orElseThrow();
        assertThat(originalReconsultada.getStatus(), equalTo(statusOriginal));
        assertThat(originalReconsultada.getCriadoEm(), equalTo(criadoEmOriginal));

        given().header("Authorization", "Bearer " + tokenAdmin).when().get("/api/prescricoes/" + idOriginal)
                .then().statusCode(200).body("statusRegistro", equalTo("RETIFICADO")).body("retificadoPorId", equalTo(idCorrecao));

        given().header("Authorization", "Bearer " + tokenAdmin).when().get("/api/prescricoes/" + idCorrecao)
                .then().statusCode(200).body("statusRegistro", equalTo("ATIVO")).body("retificadoPorId", nullValue());

        // Banco de testes compartilhado entre metodos (sem rollback por teste):
        // filtra pelo id da correcao especifica, nao pelo total de eventos do banco.
        List<AuditoriaEvento> eventosDestaCorrecao = auditoriaEventoRepository.findAll().stream()
                .filter(e -> "prescricao".equals(e.getEntidade()) && e.getAcao() == AcaoAuditoria.ATUALIZACAO)
                .filter(e -> idCorrecao.equals(objectMapper.readTree(e.getPayloadDepois()).get("id").asString()))
                .toList();
        assertThat(eventosDestaCorrecao, hasSize(1));
    }

    @Test
    @DisplayName("[RN-C02] prescricao ja retificada nao pode ser retificada de novo (409)")
    void deveRetornar409QuandoRegistroJaFoiRetificado() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        String idOriginal = criarPrescricaoViaApi(animalId, null).path("id");
        criarPrescricaoViaApi(animalId, idOriginal);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(requestBase(animalId, idOriginal))
                .when()
                .post("/api/prescricoes")
                .then()
                .statusCode(409)
                .body("mensagem", equalTo("Registro ja foi retificado por outro"));
    }

    private CriarPrescricaoRequest requestBase(String animalId, String retificaId) {
        return new CriarPrescricaoRequest(
                UUID.fromString(animalId), UUID.fromString(medicamentoId), hoje, null, null, 8,
                UnidadeFrequencia.HORAS, new BigDecimal("10.000"), UnidadeDose.MILIGRAMA,
                ViaAdministracao.ORAL, StatusPrescricao.ATIVA,
                retificaId == null ? null : UUID.fromString(retificaId));
    }

    private io.restassured.response.Response criarPrescricaoViaApi(String animalId, String retificaId) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(requestBase(animalId, retificaId))
                .when()
                .post("/api/prescricoes")
                .then()
                .statusCode(200)
                .extract()
                .response();
    }

    private UUID criarMedicamento() {
        CategoriaFarmacologica categoria = new CategoriaFarmacologica();
        categoria.setNome("Antibiotico Teste " + UUID.randomUUID());
        categoriaFarmacologicaRepository.save(categoria);

        Medicamento medicamento = new Medicamento();
        medicamento.setNome("Amoxicilina Teste");
        medicamento.setCategoria(categoria);
        return medicamentoRepository.save(medicamento).getId();
    }
}
