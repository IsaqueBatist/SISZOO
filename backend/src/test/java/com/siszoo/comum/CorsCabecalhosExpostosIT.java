package com.siszoo.comum;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.startsWith;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import io.restassured.http.ContentType;

// O front roda em outra origem (VITE_API_BASE_URL, sem proxy) e le o nome do
// arquivo exportado no Content-Disposition (relatoriosApi.ts). Sem o header
// em Access-Control-Expose-Headers o navegador o esconde e o download cai
// em "relatorio.<formato>".
class CorsCabecalhosExpostosIT extends AbstractIntegrationTest {

    private static final String ORIGEM_DO_FRONT = "http://localhost:5173";

    @Autowired
    private ApiTesteFixture fixture;

    @Test
    void exportacaoExpoeContentDispositionParaAOrigemDoFront() {
        String token = fixture.tokenAdmin("admin.cors@itu.sp.gov.br", "Cors");

        given().header("Authorization", "Bearer " + token).header("Origin", ORIGEM_DO_FRONT)
                .contentType(ContentType.JSON)
                .body(Map.of("tipo", "vacinacao", "periodoInicio", "2026-01-01", "periodoFim", "2026-01-31",
                        "formato", "csv"))
                .when().post("/api/relatorios/exportar")
                .then().statusCode(200)
                .header("Access-Control-Allow-Origin", equalTo(ORIGEM_DO_FRONT))
                .header("Access-Control-Expose-Headers", containsString("Content-Disposition"))
                .header("Content-Disposition", startsWith("attachment"));
    }
}
