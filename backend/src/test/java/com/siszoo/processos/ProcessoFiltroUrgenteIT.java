package com.siszoo.processos;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.path.json.JsonPath;

// T45 (docs/contratos/processos-filtro-urgente.md): GET /api/processos aceita
// `urgente` opcional. O card de urgentes do dashboard deixa de baixar 50
// processos para filtrar no cliente, e passa a ter o total exato (antes, mais
// de 50 urgentes sumiam do card sem aviso). Sem o parametro, nada muda.
class ProcessoFiltroUrgenteIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAgente;

    @BeforeEach
    void preparar() {
        tokenAgente = fixture.tokenComCargo("agente.filtro.urgente@itu.sp.gov.br", "Agente", "FiltroUrgente",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
    }

    @Test
    @DisplayName("[T45] urgente=true lista so urgentes com o total exato; urgente=false, so nao urgentes")
    void filtraPorUrgencia() {
        String urgente = fixture.postarProcesso(tokenAgente, null, true).then().statusCode(200).extract().path("id");
        String naoUrgente = fixture.postarProcesso(tokenAgente, null, false).then().statusCode(200).extract().path("id");

        JsonPath soUrgentes = listar("?urgente=true&pagina=0&tamanho=500");
        assertThat(soUrgentes.getList("itens.urgente", Boolean.class), everyItem(equalTo(true)));
        assertThat(soUrgentes.getList("itens.id"), hasItem(urgente));
        assertThat(soUrgentes.getList("itens.id"), not(hasItem(naoUrgente)));
        assertThat(soUrgentes.getLong("totalItens"), equalTo(
                jdbcTemplate.queryForObject("SELECT count(*) FROM processo_sanitario WHERE urgente", Long.class)));

        JsonPath semUrgentes = listar("?urgente=false&pagina=0&tamanho=500");
        assertThat(semUrgentes.getList("itens.urgente", Boolean.class), everyItem(equalTo(false)));
        assertThat(semUrgentes.getList("itens.id"), hasItem(naoUrgente));

        JsonPath todos = listar("?pagina=0&tamanho=500");
        List<String> ids = todos.getList("itens.id");
        assertThat(ids, hasItem(urgente));
        assertThat(ids, hasItem(naoUrgente));
        assertThat(todos.getLong("totalItens"), equalTo(
                jdbcTemplate.queryForObject("SELECT count(*) FROM processo_sanitario", Long.class)));
    }

    private JsonPath listar(String parametros) {
        return given().header("Authorization", "Bearer " + tokenAgente)
                .when().get("/api/processos" + parametros)
                .then().statusCode(200)
                .extract().jsonPath();
    }
}
