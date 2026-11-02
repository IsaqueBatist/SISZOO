package com.siszoo.comum;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

@Import(RelogioTesteConfig.class)
class CastracaoContatoNaoInformadoIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String token() {
        return fixture.tokenAdmin("nao.informado@itu.sp.gov.br", "Teste");
    }

    private RequestSpecification comToken(String token) {
        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON);
    }

    private Map<String, Object> corpoAnimal() {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("nome", "Sem Resposta");
        corpo.put("especie", "canino");
        corpo.put("sexo", "macho");
        corpo.put("status", "disponivel_adocao");
        corpo.put("motivoEntrada", "resgate");
        corpo.put("dataEntrada", fixture.agora().toString());
        return corpo;
    }

    private Response criarAnimal(String token, Map<String, Object> corpo) {
        return comToken(token).body(corpo).post("/api/animais");
    }

    private Boolean colunaEsterilizado(String id) {
        return jdbcTemplate.queryForObject("select esterilizado from animal where id = ?::uuid", Boolean.class, id);
    }

    @Test
    @DisplayName("animal sem resposta de castracao e salvo como nao informado, sem virar false")
    void animalSemRespostaFicaNulo() {
        String token = token();

        Response criado = criarAnimal(token, corpoAnimal());

        criado.then().statusCode(200).body("esterilizado", nullValue());
        assertThat(colunaEsterilizado(criado.path("id")), nullValue());
        comToken(token).get("/api/animais/" + criado.<String>path("id")).then().body("esterilizado", nullValue());
    }

    @Test
    @DisplayName("sim e nao continuam sendo respostas distintas de nao informado")
    void respostasExplicitasSaoPreservadas() {
        String token = token();
        Map<String, Object> corpo = corpoAnimal();
        corpo.put("esterilizado", false);

        Response criado = criarAnimal(token, corpo);

        criado.then().statusCode(200).body("esterilizado", equalTo(false));
        assertThat(colunaEsterilizado(criado.path("id")), equalTo(false));
    }

    @Test
    @DisplayName("data de castracao sem resposta afirmativa continua recusada")
    void dataDeCastracaoExigeCastrado() {
        Map<String, Object> corpo = corpoAnimal();
        corpo.put("dataEsterilizacao", RelogioTesteConfig.HOJE.toString());

        criarAnimal(token(), corpo).then().statusCode(422).body("campos[0].campo", equalTo("dataEsterilizacao"));
    }

    @Test
    @DisplayName("alerta de nao castrado conta so a resposta nao, nunca o nao informado")
    void alertaIgnoraNaoInformado() {
        String token = token();
        int antes = alertaNaoCastrado(token);

        criarAnimal(token, corpoAnimal()).then().statusCode(200);
        assertThat(alertaNaoCastrado(token), equalTo(antes));

        Map<String, Object> naoCastrado = corpoAnimal();
        naoCastrado.put("esterilizado", false);
        criarAnimal(token, naoCastrado).then().statusCode(200);
        assertThat(alertaNaoCastrado(token), equalTo(antes + 1));
    }

    private int alertaNaoCastrado(String token) {
        return comToken(token).get("/api/dashboard/kpis").then().statusCode(200).extract()
                .path("alertas.find { it.tipo == 'nao_castrado' }.total");
    }

    private Map<String, Object> corpoProcesso(String ocorrenciaId, Map<String, Object> ajustesDaAmostra) {
        Map<String, Object> corpo = new HashMap<>(fixture.corpoProcesso(ocorrenciaId, false));
        @SuppressWarnings("unchecked")
        Map<String, Object> amostra = new HashMap<>(((List<Map<String, Object>>) corpo.get("amostras")).get(0));
        amostra.remove("contatoHumano");
        amostra.putAll(ajustesDaAmostra);
        corpo.put("amostras", List.of(amostra));
        return corpo;
    }

    @Test
    @DisplayName("amostra sem resposta de contato: processo criado, nao urgente e sem virar false")
    void amostraSemRespostaFicaNula() {
        String token = token();

        Response criado = fixture.postarProcesso(token, corpoProcesso(null, Map.of()));

        criado.then().statusCode(200)
                .body("urgente", equalTo(false))
                .body("amostras[0].contatoHumano", nullValue());
        assertThat(jdbcTemplate.queryForObject(
                "select contato_humano from animal_amostrado where processo_id = ?::uuid",
                Boolean.class, criado.<String>path("id")), nullValue());
    }

    @Test
    @DisplayName("sem resposta de contato nao aceita nivel nem agressao; com contato exige os dois")
    void coerenciaDoContato() {
        String token = token();
        Map<String, Object> semRespostaComNivel = new HashMap<>();
        semRespostaComNivel.put("nivelContato", "DIRETA");
        fixture.postarProcesso(token, corpoProcesso(null, semRespostaComNivel)).then().statusCode(422);

        fixture.postarProcesso(token, corpoProcesso(null, Map.of("contatoHumano", true))).then().statusCode(422);
        fixture.postarProcesso(token, corpoProcesso(null,
                Map.of("contatoHumano", true, "nivelContato", "DIRETA", "agrediuHumano", false)))
                .then().statusCode(200).body("urgente", equalTo(true));
    }

    @Test
    @DisplayName("relatorio anual separa com contato de nao informado, na previa e no CSV")
    void relatorioDiferenciaNaoInformado() {
        String token = token();
        int ano = RelogioTesteConfig.HOJE.getYear();
        long antes = kpiContatoNaoInformado(token, ano);

        fixture.postarProcesso(token, corpoProcesso(null, Map.of())).then().statusCode(200);

        assertThat(kpiContatoNaoInformado(token, ano) > antes, equalTo(true));
        String csv = comToken(token).body(Map.of("tipo", "anual_processos", "formato", "csv", "ano", ano))
                .post("/api/relatorios/exportar").then().statusCode(200).extract().asString();
        assertThat(csv, containsString("Contato humano-animal"));
        assertThat(csv, containsString("Não informado"));
    }

    private long kpiContatoNaoInformado(String token, int ano) {
        return ((Number) comToken(token).queryParam("tipo", "anual_processos").queryParam("ano", ano)
                .get("/api/relatorios/preview").then().statusCode(200).extract()
                .path("kpis.contatoNaoInformado")).longValue();
    }
}
