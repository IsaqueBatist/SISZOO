package com.siszoo.comum.exception;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

class RespostasDeErroIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    private String token;

    @BeforeEach
    void autenticar() {
        token = fixture.tokenAdmin("respostas.erro@itu.sp.gov.br", "Erro");
    }

    private static void semDetalheInterno(Response resposta) {
        String corpo = resposta.asString();
        for (String interno : new String[] {"Exception", "com.siszoo", "org.springframework", "SELECT", "trace"}) {
            assertThat(corpo, not(containsString(interno)));
        }
    }

    @Test
    @DisplayName("401 e 403 explicam o que aconteceu, com o mesmo status")
    void autenticacaoEAutorizacao() {
        given().get("/api/usuarios").then().statusCode(401)
                .body("mensagem", equalTo("Sua sessão expirou. Entre novamente para continuar."));

        String vet = fixture.tokenComCargo("respostas.vet@itu.sp.gov.br", "Vet", "Erro",
                ApiTesteFixture.CARGO_VETERINARIO_ID);
        given().header("Authorization", "Bearer " + vet).get("/api/usuarios").then().statusCode(403)
                .body("mensagem", equalTo("Você não tem permissão para realizar esta ação."));
    }

    @Test
    @DisplayName("validacao fica em portugues mesmo com Accept-Language em ingles")
    void validacaoNaoDependeDoIdiomaDoNavegador() {
        given().header("Authorization", "Bearer " + token).header("Accept-Language", "en-US")
                .contentType(ContentType.JSON).body(Map.of("nome", ""))
                .post("/api/animais")
                .then().statusCode(422)
                .body("mensagem", equalTo("Não foi possível salvar. Verifique os campos destacados e tente novamente."))
                .body("campos.find { it.campo == 'nome' }.mensagem", equalTo("Preencha este campo."));
    }

    @Test
    @DisplayName("JSON ilegivel: 400, com mensagem e sem detalhe da excecao")
    void corpoIlegivel() {
        Response resposta = given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body("{quebrado").post("/api/animais");

        resposta.then().statusCode(400).body("mensagem", notNullValue());
        semDetalheInterno(resposta);
    }

    @Test
    @DisplayName("id em formato errado: 400, com mensagem")
    void parametroInvalido() {
        Response resposta = given().header("Authorization", "Bearer " + token).get("/api/animais/nao-e-um-id");

        resposta.then().statusCode(400).body("mensagem", notNullValue());
        semDetalheInterno(resposta);
    }

    @Test
    @DisplayName("metodo nao suportado: 405, com mensagem, e o corpo padrao continua")
    void metodoNaoSuportado() {
        Response resposta = given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body("{}").patch("/api/usuarios");

        resposta.then().statusCode(405).body("mensagem", notNullValue()).body("status", equalTo(405));
        semDetalheInterno(resposta);
    }

    @Test
    @DisplayName("falha de integridade nao expoe tabela, coluna nem valores")
    void falhaDeIntegridade() {
        Response resposta = given().header("Authorization", "Bearer " + token).post("/api/teste/violacao-integridade");

        semDetalheInterno(resposta);
    }
}
