package com.siszoo.ocorrencias;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

import io.restassured.http.ContentType;

// D9: o conteudo dos anexos (bytea) fica em anexo_ocorrencia_conteudo e so e
// lido no download. Listagem e detalhe nunca podem consulta-lo.
@Import(RelogioTesteConfig.class)
@TestPropertySource(properties =
        "spring.jpa.properties.hibernate.session_factory.statement_inspector=com.siszoo.ocorrencias.SqlCapturado")
class AnexoOcorrenciaQueriesIT extends AbstractIntegrationTest {

    private static final String TABELA_CONTEUDO = "anexo_ocorrencia_conteudo";
    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01};

    @Autowired
    private ApiTesteFixture fixture;

    @Test
    @DisplayName("[D9] listagem e detalhe nao consultam o conteudo dos anexos; o download consulta")
    void conteudoSoNoDownload() {
        String token = fixture.tokenComCargo("agente.consultas@itu.sp.gov.br", "Agente", "Consultas",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        String id = criarOcorrenciaComAnexo(token);

        SqlCapturado.limpar();
        given().header("Authorization", "Bearer " + token).when().get("/api/ocorrencias").then().statusCode(200);
        given().header("Authorization", "Bearer " + token).when().get("/api/ocorrencias/" + id).then().statusCode(200);
        List<String> consultas = SqlCapturado.comandos();
        assertThat(consultas, not(empty()));
        assertThat(consultas, everyItem(not(containsString(TABELA_CONTEUDO))));

        String anexoId = given().header("Authorization", "Bearer " + token).when().get("/api/ocorrencias/" + id)
                .path("anexos[0].id");
        SqlCapturado.limpar();
        given().header("Authorization", "Bearer " + token).when().get("/api/ocorrencias/" + id + "/anexos/" + anexoId)
                .then().statusCode(200);
        assertThat(SqlCapturado.comandos(), hasItem(containsString(TABELA_CONTEUDO)));
    }

    private String criarOcorrenciaComAnexo(String token) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "zoonose");
        corpo.put("dataAbertura", RelogioTesteConfig.HOJE.toString());
        corpo.put("endereco", "Rua Teste, 1");
        corpo.put("bairro", "Centro");
        corpo.put("descricao", "Ocorrencia com anexo");
        corpo.put("denunciante", Map.of("nome", "Denunciante Teste"));
        String id = given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON).body(corpo)
                .when().post("/api/ocorrencias").then().statusCode(200).extract().path("id");
        given().header("Authorization", "Bearer " + token).multiPart("arquivo", "foto.png", PNG, "image/png")
                .when().post("/api/ocorrencias/" + id + "/anexos").then().statusCode(200);
        return id;
    }
}
