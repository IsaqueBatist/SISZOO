package com.siszoo.comum.exception;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.startsWith;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.service.LogCapturado;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
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

    // LGPD: o WARN da violacao de integridade leva so constraint e SQLState.
    // A mensagem do PostgreSQL ("Key (codigo)=(adotado) already exists",
    // "Failing row contains (...)") pode trazer dado pessoal da linha e fica so
    // no DEBUG, que nao e o nivel de producao.
    @Test
    void violacaoDeConstraintLogaEmWarnSemValoresDaLinha() {
        try (LogCapturado log = LogCapturado.de(GlobalExceptionHandler.class)) {
            given().header("Authorization", "Bearer " + tokenAdmin)
                    .when().post("/api/teste/integridade/violacao")
                    .then().statusCode(409);

            List<ILoggingEvent> avisos = log.doNivel(Level.WARN);
            assertThat(avisos, hasSize(1));
            ILoggingEvent aviso = avisos.get(0);
            assertThat(aviso.getFormattedMessage(), startsWith("Violacao de integridade de dados barrada pelo banco ("));
            assertThat(aviso.getFormattedMessage(), containsString("sqlState=23505"));
            for (String valorDaLinha : new String[] {"adotado", "Duplicado", "Key (", "Failing row", "INSERT"}) {
                assertThat(aviso.getFormattedMessage(), not(containsString(valorDaLinha)));
            }
            assertThat(aviso.getThrowableProxy(), nullValue());

            List<String> detalhes = log.textos(Level.DEBUG);
            assertThat(detalhes, hasSize(1));
            assertThat(detalhes.get(0), containsString("adotado"));
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
