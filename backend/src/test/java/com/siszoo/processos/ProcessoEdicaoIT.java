package com.siszoo.processos;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

// Decisao funcional de 31/10/2026: so o Administrador edita processo ja
// registrado, com justificativa e historico completo na auditoria.
@Import(RelogioTesteConfig.class)
class ProcessoEdicaoIT extends AbstractIntegrationTest {

    private static final String JUSTIFICATIVA = "Dados digitados errados na abertura do processo.";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAdmin;
    private String tokenVet;
    private String tokenAgente;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin("edicao.processo.admin@itu.sp.gov.br", "Edicao");
        tokenVet = fixture.tokenComCargo("edicao.processo.vet@itu.sp.gov.br", "Vet", "Edicao",
                ApiTesteFixture.CARGO_VETERINARIO_ID);
        tokenAgente = fixture.tokenComCargo("edicao.processo.agente@itu.sp.gov.br", "Agente", "Edicao",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
    }

    private RequestSpecification comToken(String token) {
        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON);
    }

    private Response criarProcesso() {
        Response criado = fixture.postarProcesso(tokenAgente, null, false);
        criado.then().statusCode(200);
        return criado;
    }

    // Corpo da edicao a partir do GET: mesmos dados, com a amostra no formato de
    // entrada. Mutavel, para cada teste variar um campo.
    private Map<String, Object> corpoEdicao(Response criado) {
        Map<String, Object> amostra = new HashMap<>();
        amostra.put("especie", criado.<String>path("amostras[0].especie.codigo"));
        amostra.put("sexo", criado.<String>path("amostras[0].sexo"));
        amostra.put("statusClinico", criado.<String>path("amostras[0].statusClinico"));
        amostra.put("tipoAbrigo", criado.<String>path("amostras[0].tipoAbrigo"));
        amostra.put("dataColeta", criado.<String>path("amostras[0].dataColeta"));
        amostra.put("materialBiologico", criado.<String>path("amostras[0].materialBiologico"));
        amostra.put("contatoHumano", false);

        Map<String, Object> editada = new HashMap<>();
        editada.put("id", criado.<String>path("amostras[0].id"));
        editada.put("dados", amostra);

        Map<String, Object> corpo = new HashMap<>();
        corpo.put("doenca", criado.<String>path("doenca.codigo"));
        corpo.put("laboratorio", criado.<String>path("laboratorio.codigo"));
        corpo.put("responsavel", new HashMap<>(Map.of("nome", "Responsavel Corrigido", "cpf", "123.456.789-09")));
        corpo.put("amostras", new ArrayList<>(List.of(editada)));
        corpo.put("observacoes", "Observacao corrigida");
        corpo.put("galNumero", "GAL-123");
        corpo.put("sinanNumero", "SINAN-456");
        corpo.put("justificativa", JUSTIFICATIVA);
        return corpo;
    }

    private Response editar(String token, String id, Map<String, Object> corpo) {
        return comToken(token).body(corpo).put("/api/processos/" + id);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> dadosDaAmostra(Map<String, Object> corpo) {
        return (Map<String, Object>) ((List<Map<String, Object>>) corpo.get("amostras")).get(0).get("dados");
    }

    @Test
    @DisplayName("administrador edita dados, responsavel e amostra")
    void administradorEdita() {
        Response criado = criarProcesso();
        Map<String, Object> corpo = corpoEdicao(criado);
        dadosDaAmostra(corpo).put("materialBiologico", "SANGUE");

        editar(tokenAdmin, criado.path("id"), corpo).then().statusCode(200)
                .body("responsavel.nome", equalTo("Responsavel Corrigido"))
                .body("observacoes", equalTo("Observacao corrigida"))
                .body("galNumero", equalTo("GAL-123"))
                .body("amostras[0].materialBiologico", equalTo("SANGUE"))
                .body("protocolo", equalTo(criado.path("protocolo")))
                .body("dataAbertura", equalTo(criado.path("dataAbertura")))
                .body("statusProcesso", equalTo(criado.path("statusProcesso")));
    }

    @Test
    @DisplayName("veterinario e agente recebem 403, sem alterar nada nem gerar evento")
    void demaisPerfisNaoEditam() {
        Response criado = criarProcesso();
        String id = criado.path("id");
        Map<String, Object> corpo = corpoEdicao(criado);

        editar(tokenVet, id, corpo).then().statusCode(403);
        editar(tokenAgente, id, corpo).then().statusCode(403);

        comToken(tokenAgente).get("/api/processos/" + id).then().body("responsavel.nome", equalTo("Responsavel Teste"));
        assertThat(jdbcTemplate.queryForObject("""
                select count(*) from auditoria_evento
                where entidade = 'processo_sanitario' and entidade_id = ?::uuid and acao = 'ATUALIZACAO'
                """, Integer.class, id), equalTo(0));
    }

    @Test
    @DisplayName("sem token: 401; historico de alteracoes so para o administrador")
    void autorizacaoDaConsulta() {
        String id = criarProcesso().path("id");

        given().contentType(ContentType.JSON).body(corpoEdicao(criarProcesso()))
                .put("/api/processos/" + id).then().statusCode(401);
        comToken(tokenVet).get("/api/processos/" + id + "/alteracoes").then().statusCode(403);
        comToken(tokenAgente).get("/api/processos/" + id + "/alteracoes").then().statusCode(403);
        comToken(tokenAdmin).get("/api/processos/" + UUID.randomUUID() + "/alteracoes").then().statusCode(404);
    }

    @Test
    @DisplayName("justificativa e obrigatoria, com pelo menos 10 caracteres")
    void justificativaObrigatoria() {
        Response criado = criarProcesso();
        Map<String, Object> corpo = corpoEdicao(criado);

        corpo.remove("justificativa");
        editar(tokenAdmin, criado.path("id"), corpo).then().statusCode(422)
                .body("campos[0].campo", equalTo("justificativa"));

        corpo.put("justificativa", "curta");
        editar(tokenAdmin, criado.path("id"), corpo).then().statusCode(422);
    }

    @Test
    @DisplayName("auditoria: autor, data, antes e depois, justificativa e responsavel, consultaveis pelo administrador")
    void auditaAEdicao() {
        Response criado = criarProcesso();
        String id = criado.path("id");

        editar(tokenAdmin, id, corpoEdicao(criado)).then().statusCode(200);

        Response alteracoes = comToken(tokenAdmin).get("/api/processos/" + id + "/alteracoes");
        alteracoes.then().statusCode(200).body("acao", hasItem("ATUALIZACAO"));
        String antes = alteracoes.path("find { it.acao == 'ATUALIZACAO' }.payloadAntes");
        String depois = alteracoes.path("find { it.acao == 'ATUALIZACAO' }.payloadDepois");
        assertThat(alteracoes.<String>path("find { it.acao == 'ATUALIZACAO' }.usuarioEmail"),
                equalTo("edicao.processo.admin@itu.sp.gov.br"));
        assertThat(alteracoes.<String>path("find { it.acao == 'ATUALIZACAO' }.ocorreuEm"), not(equalTo(null)));

        assertThat(antes, containsString("Responsavel Teste"));
        assertThat(depois, containsString("Responsavel Corrigido"));
        assertThat(depois, containsString("123.456.789-09"));
        assertThat(depois, containsString(JUSTIFICATIVA));
        assertThat(antes, not(containsString(JUSTIFICATIVA)));
    }

    @Test
    @DisplayName("edicao nao toca no historico: resultado original preservado e sem novo lancamento")
    void preservaOHistorico() {
        Response criado = criarProcesso();
        String id = criado.path("id");
        comToken(tokenAgente).body(Map.of("status", "AGUARDANDO_RESULTADO")).patch("/api/processos/" + id + "/status")
                .then().statusCode(200);
        comToken(tokenAgente).body(Map.of("resultado", "negativo", "dataResultado", fixture.hoje().toString()))
                .post("/api/processos/" + id + "/resultados").then().statusCode(200);
        Integer eventosAntes = jdbcTemplate.queryForObject(
                "select count(*) from auditoria_evento where entidade_id = ?::uuid", Integer.class, id);

        editar(tokenAdmin, id, corpoEdicao(criado)).then().statusCode(200)
                .body("resultado.codigo", equalTo("negativo"))
                .body("statusProcesso", equalTo("COM_RESULTADO"));

        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from resultado_processo where processo_id = ?::uuid", Integer.class, id), equalTo(1));
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from auditoria_evento where entidade_id = ?::uuid", Integer.class, id),
                greaterThanOrEqualTo(eventosAntes + 1));
    }

    @Test
    @DisplayName("doenca muda antes do resultado, com o CID novo, e nao muda depois")
    void doencaSoAntesDoResultado() {
        Response criado = criarProcesso();
        String id = criado.path("id");
        Map<String, Object> corpo = corpoEdicao(criado);
        corpo.put("doenca", "esporotricose");

        editar(tokenAdmin, id, corpo).then().statusCode(200).body("doenca.codigo", equalTo("esporotricose"));

        comToken(tokenAgente).body(Map.of("status", "AGUARDANDO_RESULTADO")).patch("/api/processos/" + id + "/status")
                .then().statusCode(200);
        comToken(tokenAgente).body(Map.of("resultado", "negativo", "dataResultado", fixture.hoje().toString()))
                .post("/api/processos/" + id + "/resultados").then().statusCode(200);

        corpo.put("doenca", "raiva");
        editar(tokenAdmin, id, corpo).then().statusCode(422);
    }

    @Test
    @DisplayName("processo concluido tambem pode ser corrigido pelo administrador")
    void processoConcluido() {
        Response criado = criarProcesso();
        String id = criado.path("id");
        comToken(tokenAgente).body(Map.of("status", "AGUARDANDO_RESULTADO")).patch("/api/processos/" + id + "/status");
        comToken(tokenAgente).body(Map.of("resultado", "negativo", "dataResultado", fixture.hoje().toString()))
                .post("/api/processos/" + id + "/resultados");
        comToken(tokenAgente).body(Map.of("status", "CONCLUIDO")).patch("/api/processos/" + id + "/status")
                .then().statusCode(200);

        editar(tokenAdmin, id, corpoEdicao(criado)).then().statusCode(200)
                .body("statusProcesso", equalTo("CONCLUIDO"));
    }

    @Test
    @DisplayName("contato corrigido recalcula a urgencia nos dois sentidos")
    void contatoRecalculaUrgencia() {
        Response criado = criarProcesso();
        String id = criado.path("id");
        Map<String, Object> corpo = corpoEdicao(criado);
        Map<String, Object> amostra = dadosDaAmostra(corpo);

        amostra.put("contatoHumano", true);
        amostra.put("nivelContato", "DIRETA");
        amostra.put("agrediuHumano", false);
        editar(tokenAdmin, id, corpo).then().statusCode(200).body("urgente", equalTo(true));

        amostra.remove("contatoHumano");
        amostra.remove("nivelContato");
        amostra.remove("agrediuHumano");
        editar(tokenAdmin, id, corpo).then().statusCode(200)
                .body("urgente", equalTo(false))
                .body("amostras[0].contatoHumano", nullValue());
    }

    @Test
    @DisplayName("nao inclui, remove nem troca amostra, e valida a amostra como na criacao")
    void amostrasIntocaveis() {
        Response criado = criarProcesso();
        String id = criado.path("id");

        Map<String, Object> outraAmostra = corpoEdicao(criado);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> amostras = (List<Map<String, Object>>) outraAmostra.get("amostras");
        amostras.get(0).put("id", UUID.randomUUID().toString());
        editar(tokenAdmin, id, outraAmostra).then().statusCode(422);

        Map<String, Object> duplicada = corpoEdicao(criado);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> repetidas = (List<Map<String, Object>>) duplicada.get("amostras");
        repetidas.add(repetidas.get(0));
        editar(tokenAdmin, id, duplicada).then().statusCode(422);

        Map<String, Object> vazia = corpoEdicao(criado);
        vazia.put("amostras", List.of());
        editar(tokenAdmin, id, vazia).then().statusCode(422);

        Map<String, Object> coletaFutura = corpoEdicao(criado);
        dadosDaAmostra(coletaFutura).put("dataColeta", fixture.hoje().plusDays(1).toString());
        editar(tokenAdmin, id, coletaFutura).then().statusCode(422);
    }

    @Test
    @DisplayName("processo inexistente: 404")
    void processoInexistente() {
        Response criado = criarProcesso();

        editar(tokenAdmin, UUID.randomUUID().toString(), corpoEdicao(criado)).then().statusCode(404);
    }
}
