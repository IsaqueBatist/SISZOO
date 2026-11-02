package com.siszoo.comum;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import io.restassured.config.DecoderConfig;
import io.restassured.config.RestAssuredConfig;

class CompressaoRespostasIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Test
    void jsonGrandeSaiComGzipParaQuemAceita() {
        String token = fixture.tokenAdmin("admin.compressao@itu.sp.gov.br", "Compressao");

        given().header("Authorization", "Bearer " + token).header("Accept-Encoding", "gzip")
                .when().get("/api/animais/catalogos")
                .then().statusCode(200).header("Content-Encoding", equalTo("gzip"));

        given().config(SEM_ACCEPT_ENCODING).header("Authorization", "Bearer " + token)
                .when().get("/api/animais/catalogos")
                .then().statusCode(200).header("Content-Encoding", nullValue());
    }

    private static final RestAssuredConfig SEM_ACCEPT_ENCODING =
            RestAssuredConfig.config().decoderConfig(DecoderConfig.decoderConfig().noContentDecoders());

    @Test
    void respostaPequenaNaoEComprimida() {
        given().header("Accept-Encoding", "gzip")
                .when().get("/api/health")
                .then().statusCode(200).header("Content-Encoding", nullValue());
    }
}
