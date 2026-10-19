package com.siszoo.comum;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import io.restassured.http.ContentType;

// Datas de negocio sao LocalDate/LocalDateTime em colunas `date`/`timestamp`
// sem fuso: o valor enviado e o horario de parede do CCZ e tem de chegar ao
// banco e voltar exatamente igual, qualquer que seja o fuso da JVM. A suite
// roda com o fuso da maquina (America/Sao_Paulo no desenvolvimento) e em UTC
// no CI (ubuntu-latest); os testes nao passam pelo main(), que fixa o fuso em
// producao. Com hibernate.jdbc.time_zone=America/Sao_Paulo e a JVM em UTC, o
// LocalDateTime era gravado 3 h antes (09:30 virava 06:30).
class FusoHorarioPersistenciaIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void dataDeEntradaENascimentoChegamAoBancoEVoltamComoEnviadas() {
        String token = fixture.tokenAdmin("teste.fuso.persistencia@itu.sp.gov.br", "Fuso");

        String id = given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "nome", "Fuso", "especie", "canino", "sexo", "macho", "esterilizado", false,
                        "status", "em_tratamento", "motivoEntrada", "resgate",
                        "dataEntrada", "2026-09-10T09:30:00",
                        "dataNascimentoAprox", "2026-01-15"))
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200)
                .extract()
                .path("id");

        Map<String, Object> gravado = jdbcTemplate.queryForMap(
                "SELECT data_entrada::text AS entrada, data_nascimento_aprox::text AS nascimento"
                        + " FROM animal WHERE id = CAST(? AS uuid)", id);
        assertThat(gravado.get("entrada"), equalTo("2026-09-10 09:30:00"));
        assertThat(gravado.get("nascimento"), equalTo("2026-01-15"));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/api/animais/" + id)
                .then()
                .statusCode(200)
                .body("dataEntrada", equalTo("2026-09-10T09:30:00"))
                .body("dataNascimentoAprox", equalTo("2026-01-15"));
    }
}
