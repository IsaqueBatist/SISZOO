package com.siszoo.animais.clinico.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.animais.clinico.dto.CriarCategoriaFarmacologicaRequest;
import com.siszoo.animais.clinico.entity.CategoriaFarmacologica;
import com.siszoo.animais.clinico.repository.CategoriaFarmacologicaRepository;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;

class CategoriaFarmacologicaControllerIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private CategoriaFarmacologicaRepository categoriaFarmacologicaRepository;

    private String tokenAdmin;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin("teste.admin.categorias@itu.sp.gov.br", "Categorias");
    }

    @Test
    void deveCriarCategoriaComNomeSemEspacosEListarEntreAsAtivas() {
        String nome = "Antibiotico " + UUID.randomUUID();

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarCategoriaFarmacologicaRequest("  " + nome + "  "))
                .when()
                .post("/api/categorias-farmacologicas")
                .then()
                .statusCode(200)
                .body("nome", equalTo(nome))
                .body("ativo", equalTo(true));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/categorias-farmacologicas")
                .then()
                .statusCode(200)
                .body("nome", hasItem(nome));
    }

    @Test
    void naoListaCategoriaInativa() {
        CategoriaFarmacologica inativa = new CategoriaFarmacologica();
        inativa.setNome("Inativa " + UUID.randomUUID());
        inativa.setAtivo(false);
        categoriaFarmacologicaRepository.save(inativa);

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/categorias-farmacologicas")
                .then()
                .statusCode(200)
                .body("nome", not(hasItem(inativa.getNome())));
    }

    @Test
    void deveRetornar409QuandoNomeJaExisteIgnorandoMaiusculas() {
        String nome = "Analgesico " + UUID.randomUUID();
        postar(tokenAdmin, nome).then().statusCode(200);

        postar(tokenAdmin, nome.toUpperCase())
                .then()
                .statusCode(409)
                .body("mensagem", equalTo("Categoria farmacologica ja cadastrada"));
    }

    @Test
    void deveRetornar422QuandoNomeVazio() {
        postar(tokenAdmin, " ")
                .then()
                .statusCode(422)
                .body("campos[0].campo", equalTo("nome"));
    }

    @Test
    void agenteSanitarioListaMasNaoCria() {
        String tokenAgente = fixture.tokenComCargo(
                "teste.agente.categorias@itu.sp.gov.br", "Teste", "Categorias",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);

        given()
                .header("Authorization", "Bearer " + tokenAgente)
                .when()
                .get("/api/categorias-farmacologicas")
                .then()
                .statusCode(200);

        postar(tokenAgente, "Agente " + UUID.randomUUID()).then().statusCode(403);
    }

    private io.restassured.response.Response postar(String token, String nome) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + token)
                .body(new CriarCategoriaFarmacologicaRequest(nome))
                .when()
                .post("/api/categorias-farmacologicas");
    }
}
