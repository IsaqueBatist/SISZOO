package com.siszoo.processos;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;

// F2-012 (Fase 3 do TG, RF-B01 / limitacao 3.5.2): numeros GAL e SINAN
// informados manualmente na abertura do processo e devolvidos no detalhe.
class ProcessoGalSinanIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAgente;

    @BeforeEach
    void preparar() {
        tokenAgente = fixture.tokenComCargo("agente.galsinan@itu.sp.gov.br", "Agente", "GalSinan",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
    }

    @Test
    @DisplayName("[F2-012] abertura com GAL e SINAN grava, normaliza espacos e devolve os numeros")
    void abreComGalESinan() {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        corpo.put("galNumero", "  GAL-2026-000123  ");
        corpo.put("sinanNumero", "SINAN-77889");

        String id = given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAgente)
                .body(corpo).when().post("/api/processos")
                .then().statusCode(200)
                .body("galNumero", equalTo("GAL-2026-000123"))
                .body("sinanNumero", equalTo("SINAN-77889"))
                .extract().path("id");

        given().header("Authorization", "Bearer " + tokenAgente).when().get("/api/processos/" + id)
                .then().statusCode(200).body("galNumero", equalTo("GAL-2026-000123")).body("sinanNumero", equalTo("SINAN-77889"));
        org.hamcrest.MatcherAssert.assertThat(jdbcTemplate.queryForObject(
                "SELECT gal_numero FROM processo_sanitario WHERE id = CAST(? AS uuid)", String.class, id), equalTo("GAL-2026-000123"));
    }

    @Test
    @DisplayName("[F2-012] sem GAL/SINAN (ou em branco): processo abre normalmente com os campos nulos")
    void abreSemGalESinan() {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        corpo.put("galNumero", "   ");

        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAgente)
                .body(corpo).when().post("/api/processos")
                .then().statusCode(200).body("galNumero", nullValue()).body("sinanNumero", nullValue());
    }

    @Test
    @DisplayName("[F2-012] GAL com mais de 40 caracteres: 422")
    void galLongoRecusado() {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        corpo.put("galNumero", "G".repeat(41));

        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAgente)
                .body(corpo).when().post("/api/processos").then().statusCode(422);
    }
}
