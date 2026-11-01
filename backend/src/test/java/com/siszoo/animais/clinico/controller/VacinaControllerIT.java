package com.siszoo.animais.clinico.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.animais.clinico.dto.AtualizarVacinaRequest;
import com.siszoo.animais.clinico.dto.CriarVacinaRequest;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

/**
 * IMPORTANTE: nenhum teste daqui pode desativar uma vacina do seed da V5.
 * {@code ApiTesteFixture.postarVacinacao} usa o codigo "antirrabica" fixo e e
 * compartilhada por varios ITs; como o banco e o mesmo para toda a JVM e
 * vacina inativa passou a recusar vacinacao nova, desativar uma do seed
 * quebraria esses testes conforme a ordem de execucao. Cada teste cria a sua,
 * com nome unico.
 */
class VacinaControllerIT extends AbstractIntegrationTest {

    // A listagem sempre tem pelo menos as 8 do seed, mais as criadas por
    // outros testes: nunca assertar totalItens nem posicao.
    private static final int TAMANHO_AMPLO = 500;

    @Autowired
    private ApiTesteFixture fixture;

    private String tokenAdmin;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin("teste.admin.vacinas@itu.sp.gov.br", "Vacinas");
    }

    private static String nomeUnico() {
        return "Vacina Teste " + UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    void deveCriarVacinaComIntervaloDeReforco() {
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinaRequest("Antirrabica Felina Teste", 12))
                .when()
                .post("/api/vacinas")
                .then()
                .statusCode(200)
                .body("codigo", equalTo("antirrabica_felina_teste"))
                .body("nome", equalTo("Antirrabica Felina Teste"))
                .body("intervaloMeses", equalTo(12))
                .body("ativo", equalTo(true));
    }

    @Test
    void deveCriarVacinaSemIntervaloDeReforco() {
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinaRequest(nomeUnico(), null))
                .when()
                .post("/api/vacinas")
                .then()
                .statusCode(200)
                .body("intervaloMeses", nullValue());
    }

    // Nomes diferentes que derivam o mesmo codigo.
    @Test
    void deveRetornar409QuandoONomeDerivaUmCodigoJaUsado() {
        criarVacinaViaApi("V9 (felinos)", 12);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinaRequest("V9 felinos", 12))
                .when()
                .post("/api/vacinas")
                .then()
                .statusCode(409);
    }

    @Test
    void deveOrientarAReativarQuandoAVacinaEmConflitoEstaInativa() {
        String nome = nomeUnico();
        String id = criarVacinaViaApi(nome, 12).path("id");
        desativarViaApi(id);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinaRequest(nome, 12))
                .when()
                .post("/api/vacinas")
                .then()
                .statusCode(409)
                .body("mensagem", org.hamcrest.Matchers.containsString("Reative-a"));
    }

    @Test
    void deveRetornar422QuandoNomeVazio() {
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinaRequest("   ", 12))
                .when()
                .post("/api/vacinas")
                .then()
                .statusCode(422)
                .body("campos.campo", hasItem("nome"));
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1})
    void deveRetornar422QuandoIntervaloNaoEPositivo(int intervalo) {
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinaRequest(nomeUnico(), intervalo))
                .when()
                .post("/api/vacinas")
                .then()
                .statusCode(422)
                .body("campos.campo", hasItem("intervaloMeses"));
    }

    // Truncar o codigo faria nomes diferentes colidirem: recusa com 422.
    @Test
    void deveRetornar422QuandoONomeNaoCabeNoCodigo() {
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinaRequest("Vacina polivalente para felinos domesticos adultos", 12))
                .when()
                .post("/api/vacinas")
                .then()
                .statusCode(422)
                .body("campos.campo", hasItem("nome"));
    }

    @Test
    void deveRetornar404QuandoVacinaNaoExiste() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/vacinas/" + UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    void deveAtualizarNomeEIntervaloSemAlterarOCodigo() {
        Response criada = criarVacinaViaApi(nomeUnico(), 12);
        String id = criada.path("id");
        String codigoOriginal = criada.path("codigo");

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new AtualizarVacinaRequest("Nome Completamente Outro", 24, true))
                .when()
                .put("/api/vacinas/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Nome Completamente Outro"))
                .body("intervaloMeses", equalTo(24))
                // A chave dos registros ja gravados nao muda.
                .body("codigo", equalTo(codigoOriginal));
    }

    @Test
    void deveReativarPeloPut() {
        Response criada = criarVacinaViaApi(nomeUnico(), 12);
        String id = criada.path("id");
        String nome = criada.path("nome");
        desativarViaApi(id);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new AtualizarVacinaRequest(nome, 12, true))
                .when()
                .put("/api/vacinas/" + id)
                .then()
                .statusCode(200)
                .body("ativo", equalTo(true));
    }

    @Test
    void desativarFazSoftDeleteEMantemALinha() {
        String id = criarVacinaViaApi(nomeUnico(), 12).path("id");

        desativarViaApi(id);

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/vacinas/" + id)
                .then()
                .statusCode(200)
                .body("ativo", equalTo(false));
    }

    @Test
    void deveFiltrarPorSituacao() {
        String idAtiva = criarVacinaViaApi(nomeUnico(), 12).path("id");
        String idInativa = criarVacinaViaApi(nomeUnico(), 12).path("id");
        desativarViaApi(idInativa);

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .queryParam("ativo", false)
                .queryParam("tamanho", TAMANHO_AMPLO)
                .when()
                .get("/api/vacinas")
                .then()
                .statusCode(200)
                .body("itens.id", hasItem(idInativa))
                .body("itens.id", not(hasItem(idAtiva)))
                .body("itens.ativo", everyItem(equalTo(false)));
    }

    // Guarda contra o risco descrito no topo da classe: se algum teste
    // desativar uma vacina do seed, os ITs que gravam vacinacao com
    // "antirrabica" passam a falhar conforme a ordem de execucao.
    @Test
    void asVacinasDoSeedContinuamAtivas() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .queryParam("ativo", true)
                .queryParam("tamanho", TAMANHO_AMPLO)
                .when()
                .get("/api/vacinas")
                .then()
                .statusCode(200)
                .body("itens.codigo", hasItem("antirrabica"))
                .body("itens.codigo", hasItem("v10"))
                .body("itens.codigo", hasItem("leishmaniose"));
    }

    @Test
    void agenteLeOCatalogoMasNaoEscreve() {
        String tokenAgente = fixture.tokenComCargo(
                "teste.agente.vacinas@itu.sp.gov.br", "Agente", "Vacinas", ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        String id = criarVacinaViaApi(nomeUnico(), 12).path("id");

        given()
                .header("Authorization", "Bearer " + tokenAgente)
                .queryParam("tamanho", TAMANHO_AMPLO)
                .when()
                .get("/api/vacinas")
                .then()
                .statusCode(200)
                .body("itens", hasSize(org.hamcrest.Matchers.greaterThan(0)));

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAgente)
                .body(new CriarVacinaRequest(nomeUnico(), 12))
                .when()
                .post("/api/vacinas")
                .then()
                .statusCode(403);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAgente)
                .body(new AtualizarVacinaRequest("Outro Nome", 12, true))
                .when()
                .put("/api/vacinas/" + id)
                .then()
                .statusCode(403);

        given()
                .header("Authorization", "Bearer " + tokenAgente)
                .when()
                .delete("/api/vacinas/" + id)
                .then()
                .statusCode(403);
    }

    private Response criarVacinaViaApi(String nome, Integer intervaloMeses) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinaRequest(nome, intervaloMeses))
                .when()
                .post("/api/vacinas")
                .then()
                .statusCode(200)
                .extract()
                .response();
    }

    private void desativarViaApi(String id) {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .delete("/api/vacinas/" + id)
                .then()
                .statusCode(200);
    }
}
