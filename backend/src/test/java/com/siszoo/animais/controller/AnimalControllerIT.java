package com.siszoo.animais.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.animais.dto.AtualizarAnimalRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.animais.repository.TipoBaiaRepository;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;

class AnimalControllerIT extends AbstractIntegrationTest {

    private static final String EMAIL_ADMIN = "teste.admin.animais@itu.sp.gov.br";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private BaiaRepository baiaRepository;

    @Autowired
    private TipoBaiaRepository tipoBaiaRepository;

    private String tokenAdmin;

    @BeforeEach
    void autenticarAdmin() {
        tokenAdmin = fixture.tokenAdmin(EMAIL_ADMIN, "Animais");
    }

    @Test
    void deveCriarAnimalComMicrochipUnicoERotulosDeCatalogo() {
        Baia baia = criarBaia("Baia AnimalControllerIT 1");
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Rex", "canino", "macho", "SRD", "Preto", "curta", "medio", null, "2 anos", null,
                fixture.microchipUnico(), false, null, "disponivel_adocao", "resgate", fixture.agora(),
                baia.getId(), null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200)
                .body("especieNome", equalTo("Canino"))
                .body("statusNome", equalTo("Disponível"))
                .body("motivoEntradaNome", equalTo("Resgate"))
                .body("baiaNome", equalTo("Baia AnimalControllerIT 1"))
                .body("tipoBaiaNome", equalTo("Interna"))
                .body("fichaCompleta", equalTo(true));
    }

    @Test
    void deveCriarAnimalSemMicrochip() {
        CriarAnimalRequest request = animalMinimo(null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200)
                .body("microchip", nullValue())
                .body("fichaCompleta", equalTo(false));
    }

    @Test
    void deveRetornar409QuandoMicrochipDuplicado() {
        String microchip = fixture.microchipUnico();

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(animalMinimo(microchip))
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(animalMinimo(microchip))
                .when()
                .post("/api/animais")
                .then()
                .statusCode(409);
    }

    @Test
    void deveRetornar422QuandoEspecieInvalida() {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Rex", "especie-inexistente", "macho", null, null, null, null, null, null, null,
                null, false, null, "disponivel_adocao", "resgate", fixture.agora(), null, null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar422QuandoStatusInvalido() {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                null, false, null, "status-inexistente", "resgate", fixture.agora(), null, null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar422QuandoMotivoEntradaInvalido() {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                null, false, null, "disponivel_adocao", "motivo-inexistente", fixture.agora(), null, null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar422QuandoBaiaInvalida() {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                null, false, null, "disponivel_adocao", "resgate", fixture.agora(), UUID.randomUUID(), null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(422);
    }

    @Test
    void deveListarComFiltroStatusEEspecie() {
        criarAnimalViaApi(new CriarAnimalRequest(
                "Mimi", "felino", "femea", null, null, null, null, null, null, null,
                fixture.microchipUnico(), false, null, "em_quarentena", "abandono", fixture.agora(), null, null, null));
        criarAnimalViaApi(new CriarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                fixture.microchipUnico(), false, null, "disponivel_adocao", "resgate", fixture.agora(), null, null, null));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .queryParam("status", "em_quarentena")
                .queryParam("especie", "felino")
                .queryParam("pagina", 0)
                .queryParam("tamanho", 20)
                .when()
                .get("/api/animais")
                .then()
                .statusCode(200)
                .body("itens.size()", greaterThanOrEqualTo(1))
                .body("itens.statusCodigo", not(hasItem("disponivel_adocao")))
                .body("itens.especieCodigo", not(hasItem("canino")))
                .body("pagina", equalTo(0))
                .body("tamanho", equalTo(20));
    }

    @Test
    void deveRetornar404QuandoAnimalNaoExiste() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/animais/" + UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    void deveAtualizarAnimal() {
        String id = criarAnimalViaApi(animalMinimo(null)).path("id");

        AtualizarAnimalRequest atualizacao = new AtualizarAnimalRequest(
                "Rex Atualizado", "canino", "macho", null, null, null, null, null, null, null,
                null, false, null, "em_tratamento", "resgate", fixture.agora(), null, null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(atualizacao)
                .when()
                .put("/api/animais/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Rex Atualizado"))
                .body("statusCodigo", equalTo("em_tratamento"));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/animais/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Rex Atualizado"));
    }

    @Test
    void deveRejeitarAlteracaoDeMicrochip() {
        String microchipOriginal = fixture.microchipUnico();
        String id = criarAnimalViaApi(animalMinimo(microchipOriginal)).path("id");

        AtualizarAnimalRequest atualizacao = new AtualizarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                fixture.microchipUnico(), false, null, "disponivel_adocao", "resgate", fixture.agora(), null, null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(atualizacao)
                .when()
                .put("/api/animais/" + id)
                .then()
                .statusCode(422);

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/animais/" + id)
                .then()
                .statusCode(200)
                .body("microchip", equalTo(microchipOriginal));
    }

    @Test
    void deveDefinirMicrochipQuandoAusente() {
        String id = criarAnimalViaApi(animalMinimo(null)).path("id");
        String novoMicrochip = fixture.microchipUnico();

        AtualizarAnimalRequest atualizacao = new AtualizarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                novoMicrochip, false, null, "disponivel_adocao", "resgate", fixture.agora(), null, null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(atualizacao)
                .when()
                .put("/api/animais/" + id)
                .then()
                .statusCode(200)
                .body("microchip", equalTo(novoMicrochip));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/animais/" + id)
                .then()
                .statusCode(200)
                .body("microchip", equalTo(novoMicrochip));
    }

    @Test
    void deveRetornar403QuandoAgenteSanitarioTentaCriarE200QuandoLista() {
        String tokenAgente = fixture.tokenComCargo(
                "teste.agente.animais@itu.sp.gov.br", "Teste", "Perfil", ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAgente)
                .body(animalMinimo(null))
                .when()
                .post("/api/animais")
                .then()
                .statusCode(403);

        given()
                .header("Authorization", "Bearer " + tokenAgente)
                .when()
                .get("/api/animais")
                .then()
                .statusCode(200);
    }

    @Test
    void deveListarCatalogosSeedados() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/animais/catalogos")
                .then()
                .statusCode(200)
                .body("especies.size()", equalTo(4))
                .body("status.size()", equalTo(7))
                .body("motivosEntrada.size()", equalTo(5))
                .body("tiposBaia.size()", equalTo(3));
    }

    private CriarAnimalRequest animalMinimo(String microchip) {
        return new CriarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                microchip, false, null, "disponivel_adocao", "resgate", fixture.agora(), null, null, null);
    }

    private io.restassured.response.Response criarAnimalViaApi(CriarAnimalRequest request) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200)
                .extract()
                .response();
    }

    private Baia criarBaia(String nome) {
        Baia baia = new Baia();
        baia.setNome(nome);
        baia.setTipoBaia(tipoBaiaRepository.findByCodigo("interna").orElseThrow());
        baia.setCapacidade((short) 5);
        return baiaRepository.save(baia);
    }
}
