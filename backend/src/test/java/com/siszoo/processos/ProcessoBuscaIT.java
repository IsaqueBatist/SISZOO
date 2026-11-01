package com.siszoo.processos;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.path.json.JsonPath;

// GET /api/processos?q=: acha o processo por protocolo (com ou sem o prefixo da
// tela), nome do responsavel, Nº GAL ou Nº SINAN. E so leitura: as permissoes
// do endpoint nao mudam.
class ProcessoBuscaIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAgente;

    @BeforeEach
    void preparar() {
        tokenAgente = fixture.tokenComCargo("agente.busca.processo@itu.sp.gov.br", "Agente", "BuscaProcesso",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
    }

    @Test
    @DisplayName("q encontra por protocolo, responsavel, GAL e SINAN, e nao traz os demais")
    void buscaPorTermo() {
        String alvo = fixture.postarProcesso(tokenAgente, null, false).then().statusCode(200).extract().path("id");
        String outro = fixture.postarProcesso(tokenAgente, null, false).then().statusCode(200).extract().path("id");

        String protocolo = jdbcTemplate.queryForObject(
                "SELECT protocolo FROM processo_sanitario WHERE id = ?::uuid", String.class, alvo);
        jdbcTemplate.update("UPDATE responsavel_processo SET nome = 'Nome Unico Busca' WHERE processo_id = ?::uuid", alvo);
        jdbcTemplate.update("UPDATE processo_sanitario SET gal_numero = 'GAL-BUSCA-1', sinan_numero = 'SINAN-BUSCA-1'"
                + " WHERE id = ?::uuid", alvo);

        for (String termo : Map.of("protocolo", protocolo, "prefixo", "PS " + protocolo, "responsavel", "unico busca",
                "gal", "gal-busca", "sinan", "SINAN-BUSCA").values()) {
            JsonPath achados = listar(termo);
            assertThat(termo, achados.getList("itens.id"), hasItem(alvo));
            assertThat(termo, achados.getList("itens.id"), not(hasItem(outro)));
        }
    }

    private JsonPath listar(String termo) {
        return given().header("Authorization", "Bearer " + tokenAgente)
                .queryParam("q", termo).queryParam("pagina", 0).queryParam("tamanho", 500)
                .when().get("/api/processos")
                .then().statusCode(200)
                .extract().jsonPath();
    }
}
