package com.siszoo.animais;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.nullValue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

// Campo pedido na entrevista de 09/01/2026 (V33): condicoes de saude do animal,
// com as opcoes do prototipo.
class CondicoesSaudeAnimalIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String token;

    @BeforeEach
    void autenticar() {
        token = fixture.tokenAdmin("condicoes.animal@itu.sp.gov.br", "Condicoes");
    }

    private RequestSpecification comToken() {
        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON);
    }

    private Map<String, Object> corpo() {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("nome", "Bidu");
        corpo.put("especie", "canino");
        corpo.put("sexo", "macho");
        corpo.put("status", "disponivel_adocao");
        corpo.put("motivoEntrada", "resgate");
        corpo.put("dataEntrada", fixture.agora().toString());
        return corpo;
    }

    private Response criar(Map<String, Object> corpo) {
        return comToken().body(corpo).post("/api/animais");
    }

    @Test
    @DisplayName("catalogo traz as opcoes do prototipo")
    void catalogo() {
        comToken().get("/api/animais/catalogos").then().statusCode(200)
                .body("condicoesSaude.codigo", hasItems("epilepsia", "cardiopatia", "diabetes", "agressividade",
                        "cegueira", "surdez", "outras"));
    }

    @Test
    @DisplayName("condicoes sao gravadas, devolvidas em ordem e relidas no detalhe")
    void persisteCondicoes() {
        Map<String, Object> corpo = corpo();
        corpo.put("condicoes", List.of("epilepsia", "agressividade"));

        Response criado = criar(corpo);

        criado.then().statusCode(200).body("condicoes.nome", contains("Agressividade", "Epilepsia"));
        comToken().get("/api/animais/" + criado.<String>path("id")).then().statusCode(200)
                .body("condicoes.codigo", contains("agressividade", "epilepsia"));
    }

    @Test
    @DisplayName("sem condicoes e valido, e a listagem nao carrega a colecao de cada animal")
    void semCondicoes() {
        criar(corpo()).then().statusCode(200).body("condicoes", empty()).body("condicoesOutras", nullValue());

        comToken().get("/api/animais?tamanho=5").then().statusCode(200);
    }

    @Test
    @DisplayName("outras exige o texto, e o texto so vale com outras marcada")
    void outrasExigeTexto() {
        Map<String, Object> semTexto = corpo();
        semTexto.put("condicoes", List.of("outras"));
        criar(semTexto).then().statusCode(422).body("campos[0].campo", equalTo("condicoesOutras"));

        Map<String, Object> comTexto = corpo();
        comTexto.put("condicoes", List.of("outras"));
        comTexto.put("condicoesOutras", "  Displasia coxofemoral  ");
        criar(comTexto).then().statusCode(200).body("condicoesOutras", equalTo("Displasia coxofemoral"));

        Map<String, Object> textoSolto = corpo();
        textoSolto.put("condicoesOutras", "Nao deve ficar");
        criar(textoSolto).then().statusCode(200).body("condicoesOutras", nullValue());
    }

    @Test
    @DisplayName("codigo fora do catalogo responde 422 no campo")
    void codigoInvalido() {
        Map<String, Object> corpo = corpo();
        corpo.put("condicoes", List.of("inexistente"));

        criar(corpo).then().statusCode(422).body("campos[0].campo", equalTo("condicoes"));
    }

    @Test
    @DisplayName("edicao troca as condicoes, audita e nao apaga observacoes")
    void edicaoAuditada() {
        Map<String, Object> corpo = corpo();
        corpo.put("condicoes", List.of("diabetes"));
        corpo.put("observacoes", "Observacao preservada");
        String id = criar(corpo).then().statusCode(200).extract().path("id");

        corpo.put("condicoes", List.of("surdez"));
        comToken().body(corpo).put("/api/animais/" + id).then().statusCode(200)
                .body("condicoes.codigo", contains("surdez"))
                .body("observacoes", equalTo("Observacao preservada"));

        String depois = jdbcTemplate.queryForObject("""
                select payload_depois::text from auditoria_evento
                where entidade = 'animal' and entidade_id = ?::uuid and acao = 'ATUALIZACAO'
                order by ocorreu_em desc limit 1
                """, String.class, id);
        assertThat(depois, containsString("Surdez"));
    }
}
