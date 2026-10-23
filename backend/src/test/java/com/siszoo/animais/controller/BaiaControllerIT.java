package com.siszoo.animais.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.MatcherAssert.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.animais.dto.AtualizarBaiaRequest;
import com.siszoo.animais.dto.AtualizarStatusBaiaRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.dto.CriarBaiaRequest;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;

class BaiaControllerIT extends AbstractIntegrationTest {

    private static final String EMAIL_ADMIN = "teste.admin.baias@itu.sp.gov.br";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private BaiaRepository baiaRepository;

    private String tokenAdmin;

    @BeforeEach
    void autenticarAdmin() {
        tokenAdmin = fixture.tokenAdmin(EMAIL_ADMIN, "Baias");
    }

    @Test
    void deveCriarBaiaComSucesso() {
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarBaiaRequest("Baia Criar 1", "interna", (short) 5, "Cães porte médio", null))
                .when()
                .post("/api/baias")
                .then()
                .statusCode(200)
                .body("nome", equalTo("Baia Criar 1"))
                .body("tipoBaiaNome", equalTo("Interna"))
                .body("capacidade", equalTo(5))
                .body("ativa", equalTo(true))
                .body("ocupacaoAtual", equalTo(0))
                .body("superlotada", equalTo(false));
    }

    @Test
    void deveRetornar422QuandoTipoBaiaInvalido() {
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarBaiaRequest("Baia Tipo Invalido", "tipo-inexistente", (short) 5, null, null))
                .when()
                .post("/api/baias")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar404QuandoBaiaNaoExiste() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/baias/" + UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    void deveAtualizarBaia() {
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Original", "interna", (short) 5, null, null)).path("id");

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new AtualizarBaiaRequest("Baia Renomeada", "gatil", (short) 8, "Filhotes", null))
                .when()
                .put("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Baia Renomeada"))
                .body("tipoBaiaNome", equalTo("Gatil"))
                .body("capacidade", equalTo(8));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Baia Renomeada"));
    }

    @Test
    void deveDesativarBaiaViaDeleteEReativarViaPatchStatus() {
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Delete", "interna", (short) 5, null, null)).path("id");

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .delete("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("ativa", equalTo(false));

        Baia baiaDesativada = baiaRepository.findById(UUID.fromString(id)).orElseThrow();
        assertThat(baiaDesativada.isAtiva(), equalTo(false));

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new AtualizarStatusBaiaRequest(true))
                .when()
                .patch("/api/baias/" + id + "/status")
                .then()
                .statusCode(200)
                .body("ativa", equalTo(true));

        Baia baiaReativada = baiaRepository.findById(UUID.fromString(id)).orElseThrow();
        assertThat(baiaReativada.isAtiva(), equalTo(true));
    }

    @Test
    void deveRetornar403QuandoAgenteSanitarioTentaExcluirBaia() {
        String tokenAgente = fixture.tokenComCargo(
                "teste.agente.baias@itu.sp.gov.br", "Teste", "Baias", ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Protegida", "interna", (short) 5, null, null)).path("id");

        given()
                .header("Authorization", "Bearer " + tokenAgente)
                .when()
                .delete("/api/baias/" + id)
                .then()
                .statusCode(403);
    }

    @Test
    void deveFiltrarListagemPorAtiva() {
        String idAtiva = criarBaiaViaApi(new CriarBaiaRequest("Baia Ativa Filtro", "interna", (short) 5, null, null)).path("id");
        String idInativa = criarBaiaViaApi(new CriarBaiaRequest("Baia Inativa Filtro", "interna", (short) 5, null, null)).path("id");

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .delete("/api/baias/" + idInativa)
                .then()
                .statusCode(200);

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .queryParam("ativa", false)
                .queryParam("tamanho", 100)
                .when()
                .get("/api/baias")
                .then()
                .statusCode(200)
                .body("itens.id", hasItem(idInativa))
                .body("itens.id", not(hasItem(idAtiva)));
    }

    @Test
    void deveCalcularOcupacaoAbaixoDaCapacidade() {
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Ocupacao Abaixo", "interna", (short) 5, null, null)).path("id");
        criarAnimalNaBaia(id, "disponivel_adocao");
        criarAnimalNaBaia(id, "disponivel_adocao");

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("ocupacaoAtual", equalTo(2))
                .body("superlotada", equalTo(false));
    }

    @Test
    void deveCalcularOcupacaoIgualACapacidadeComoSuperlotada() {
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Ocupacao Igual", "interna", (short) 2, null, null)).path("id");
        criarAnimalNaBaia(id, "disponivel_adocao");
        criarAnimalNaBaia(id, "disponivel_adocao");

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("ocupacaoAtual", equalTo(2))
                .body("superlotada", equalTo(true));
    }

    @Test
    void devePersistirAtualizacaoSemRollbackQuandoOcupacaoAcimaDaCapacidade() {
        // O cadastro de animal recusa baia cheia (409): a ocupacao acima da
        // capacidade so acontece reduzindo a capacidade depois, no PUT abaixo.
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Ocupacao Acima", "interna", (short) 3, null, null)).path("id");
        criarAnimalNaBaia(id, "disponivel_adocao");
        criarAnimalNaBaia(id, "disponivel_adocao");
        criarAnimalNaBaia(id, "disponivel_adocao");

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new AtualizarBaiaRequest("Baia Ocupacao Acima Editada", "interna", (short) 2, "Superlotada de proposito", null))
                .when()
                .put("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Baia Ocupacao Acima Editada"))
                .body("ocupacaoAtual", equalTo(3))
                .body("superlotada", equalTo(true));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Baia Ocupacao Acima Editada"));
    }

    @Test
    void naoDeveContarAnimaisComStatusForaDaOcupacao() {
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Status Excluidos", "interna", (short) 10, null, null)).path("id");
        criarAnimalNaBaia(id, "disponivel_adocao");
        criarAnimalNaBaia(id, "adotado");
        criarAnimalNaBaia(id, "obito_natural");
        criarAnimalNaBaia(id, "obito_eutanasia");
        criarAnimalNaBaia(id, "transferido");

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("ocupacaoAtual", equalTo(1))
                .body("superlotada", equalTo(false));
    }

    private io.restassured.response.Response criarBaiaViaApi(CriarBaiaRequest request) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/baias")
                .then()
                .statusCode(200)
                .extract()
                .response();
    }

    private void criarAnimalNaBaia(String baiaId, String statusCodigo) {
        // F2-008: o destino obito_eutanasia exige o laudo do responsavel tecnico.
        String laudo = "obito_eutanasia".equals(statusCodigo) ? "Laudo de teste: quadro irreversivel" : null;
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Animal Teste", "canino", "macho", null, null, null, null, null, null, null,
                fixture.microchipUnico(), false, null, statusCodigo, "resgate", fixture.agora(),
                UUID.fromString(baiaId), null, null, null, null, null, laudo);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200);
    }
}
