package com.siszoo.comum.exception;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.not;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.response.Response;

class GlobalExceptionHandlerIT extends AbstractIntegrationTest {

    private static final String EMAIL_ADMIN = "teste.admin.erros@itu.sp.gov.br";

    @Autowired
    private ApiTesteFixture fixture;

    private String tokenAdmin;

    @BeforeEach
    void autenticarAdmin() {
        tokenAdmin = fixture.tokenAdmin(EMAIL_ADMIN, "Erros");
    }

    @Test
    void violacaoDeConstraintDoBancoDeveRetornar409GenericoSemExporSql() {
        Response resposta = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .post("/api/teste/integridade/violacao");

        resposta.then()
                .statusCode(409)
                .body("mensagem", equalTo("Operacao viola uma regra de integridade dos dados"));
        // O detalhe do PostgreSQL (SQL, tabela, constraint, valor) fica so no log.
        String corpo = resposta.asString();
        for (String detalheInterno : new String[] {
                "status_animal", "uq_status_animal_codigo", "INSERT", "SQL", "adotado", "duplicate"}) {
            assertThat(corpo, not(containsString(detalheInterno)));
        }
    }

    // Compatibilidade do campo aditivo `campos`: fora de erro de validacao o
    // corpo continua sendo so {"mensagem": ...}.
    @Test
    void erroForaDeValidacaoNaoDeveIncluirCampos() {
        Map<String, Object> corpo = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/vacinacoes/" + UUID.randomUUID())
                .then()
                .statusCode(404)
                .extract()
                .jsonPath()
                .getMap("$");

        assertThat(corpo, equalTo(Map.of("mensagem", "Vacinacao nao encontrada")));
    }
}
