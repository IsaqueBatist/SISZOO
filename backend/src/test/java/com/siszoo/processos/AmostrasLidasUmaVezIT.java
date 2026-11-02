package com.siszoo.processos;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;
import com.siszoo.ocorrencias.SqlCapturado;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

@Import(RelogioTesteConfig.class)
@TestPropertySource(properties =
        "spring.jpa.properties.hibernate.session_factory.statement_inspector=com.siszoo.ocorrencias.SqlCapturado")
class AmostrasLidasUmaVezIT extends AbstractIntegrationTest {

    private static final String LEITURA_DE_AMOSTRAS = "from animal_amostrado ";

    @Autowired
    private ApiTesteFixture fixture;

    private String token;

    @BeforeEach
    void autenticar() {
        token = fixture.tokenAdmin("admin.amostras.uma.vez@itu.sp.gov.br", "AmostrasUmaVez");
    }

    @Test
    @DisplayName("criacao, avanco de status e resultado leem as amostras uma vez cada")
    void amostrasLidasUmaVezPorRequisicao() {
        SqlCapturado.limpar();
        Response criado = fixture.postarProcesso(token, null, false);
        criado.then().statusCode(200);
        int naCriacao = leiturasDeAmostras();
        String id = criado.path("id");

        SqlCapturado.limpar();
        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("status", "AGUARDANDO_RESULTADO"))
                .when().patch("/api/processos/" + id + "/status")
                .then().statusCode(200);
        int noStatus = leiturasDeAmostras();

        SqlCapturado.limpar();
        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("resultado", "negativo", "dataResultado", fixture.hoje().toString()))
                .when().post("/api/processos/" + id + "/resultados")
                .then().statusCode(200);
        int noResultado = leiturasDeAmostras();

        assertThat("leituras de amostras em [criacao, status, resultado]",
                List.of(naCriacao, noStatus, noResultado), equalTo(List.of(1, 1, 1)));
    }

    private static int leiturasDeAmostras() {
        return (int) SqlCapturado.comandos().stream()
                .filter(sql -> sql.toLowerCase().contains(LEITURA_DE_AMOSTRAS))
                .count();
    }
}
