package com.siszoo.comum;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import io.restassured.config.DecoderConfig;
import io.restassured.config.RestAssuredConfig;

// T45: o navegador chama a API direto (sem o nginx no meio), e o JSON
// trafegava sem compressao. server.compression: JSON a partir de 1 KB sai em
// gzip para quem aceita; resposta pequena e cliente sem Accept-Encoding nao.
class CompressaoRespostasIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Test
    void jsonGrandeSaiComGzipParaQuemAceita() {
        String token = fixture.tokenAdmin("admin.compressao@itu.sp.gov.br", "Compressao");

        // Catalogos de animais: alguns KB de JSON.
        given().header("Authorization", "Bearer " + token).header("Accept-Encoding", "gzip")
                .when().get("/api/animais/catalogos")
                .then().statusCode(200).header("Content-Encoding", equalTo("gzip"));

        // Sem decodificadores o RestAssured nao anuncia Accept-Encoding (por
        // padrao ele manda gzip,deflate): cliente que nao aceita recebe cru.
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
