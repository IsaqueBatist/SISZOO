package com.siszoo.relatorios.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

// Decisao funcional de 31/10/2026: o Veterinario nao ve ocorrencias por bairro em
// nenhuma superficie agregada. Administrador e Agente mantem o acesso.
@Import(RelogioTesteConfig.class)
class RelatorioBairroPermissaoIT extends AbstractIntegrationTest {

    private static final String TITULO_SECAO = "Bairros com mais ocorrências";
    private static final int ANO = RelogioTesteConfig.HOJE.getYear();

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAdmin;
    private String tokenAgente;
    private String tokenVet;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin("bairro.admin@itu.sp.gov.br", "Bairro");
        tokenAgente = fixture.tokenComCargo("bairro.agente@itu.sp.gov.br", "Agente", "Bairro",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        tokenVet = fixture.tokenComCargo("bairro.vet@itu.sp.gov.br", "Vet", "Bairro",
                ApiTesteFixture.CARGO_VETERINARIO_ID);
    }

    private RequestSpecification comToken(String token) {
        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON);
    }

    private Response previaPorBairro(String token) {
        return comToken(token).queryParam("tipo", "ocorrencias_bairro")
                .queryParam("periodoInicio", ANO + "-01-01").queryParam("periodoFim", ANO + "-12-31")
                .get("/api/relatorios/preview");
    }

    private Response exportarPorBairro(String token, String formato) {
        return comToken(token).body(Map.of("tipo", "ocorrencias_bairro", "formato", formato,
                "periodoInicio", ANO + "-01-01", "periodoFim", ANO + "-12-31"))
                .post("/api/relatorios/exportar");
    }

    private Response previaAnual(String token) {
        return comToken(token).queryParam("tipo", "anual_processos").queryParam("ano", ANO)
                .get("/api/relatorios/preview");
    }

    private Response exportarAnual(String token, String formato) {
        return comToken(token).body(Map.of("tipo", "anual_processos", "formato", formato, "ano", ANO))
                .post("/api/relatorios/exportar");
    }

    private int exportacoesDe(String email) {
        return jdbcTemplate.queryForObject("""
                select count(*) from relatorio_gerado r join usuario u on u.id = r.gerado_por_id
                where u.email = ? and r.tipo_relatorio = 'OCORRENCIAS_BAIRRO'
                """, Integer.class, email);
    }

    @Test
    @DisplayName("veterinario: previa e exportacao do relatorio por bairro respondem 403, sem deixar rastro de geracao")
    void veterinarioNaoGeraRelatorioPorBairro() {
        previaPorBairro(tokenVet).then().statusCode(403)
                .body("mensagem", equalTo("Você não tem permissão para acessar este relatório."));
        exportarPorBairro(tokenVet, "csv").then().statusCode(403);
        exportarPorBairro(tokenVet, "pdf").then().statusCode(403);

        assertThat(exportacoesDe("bairro.vet@itu.sp.gov.br"), equalTo(0));
    }

    @Test
    @DisplayName("veterinario tambem nao le o endpoint de estatisticas do modulo de ocorrencias")
    void veterinarioNaoLeEstatisticas() {
        comToken(tokenVet).get("/api/ocorrencias/estatisticas/bairro").then().statusCode(403);
    }

    @ParameterizedTest(name = "formato {0}")
    @ValueSource(strings = {"csv", "pdf"})
    @DisplayName("administrador e agente mantem a exportacao por bairro")
    void demaisPerfisExportam(String formato) {
        exportarPorBairro(tokenAdmin, formato).then().statusCode(200);
        exportarPorBairro(tokenAgente, formato).then().statusCode(200);
    }

    @Test
    @DisplayName("administrador e agente mantem a previa e a secao de bairros do anual")
    void demaisPerfisVemBairros() {
        previaPorBairro(tokenAdmin).then().statusCode(200);
        previaPorBairro(tokenAgente).then().statusCode(200);

        previaAnual(tokenAdmin).then().statusCode(200).body("bairros", notNullValue());
        previaAnual(tokenAgente).then().statusCode(200).body("bairros", notNullValue());
        assertThat(exportarAnual(tokenAgente, "csv").asString(), containsString(TITULO_SECAO));
    }

    @Test
    @DisplayName("veterinario: relatorio anual sai sem a secao de bairros na previa, no CSV e no PDF, e com o resto")
    void anualSemBairrosParaVeterinario() {
        previaAnual(tokenVet).then().statusCode(200)
                .body("bairros", nullValue())
                .body("kpis", notNullValue())
                .body("laboratorios", notNullValue());

        String csv = exportarAnual(tokenVet, "csv").then().statusCode(200).extract().asString();
        assertThat(csv, not(containsString(TITULO_SECAO)));
        assertThat(csv, containsString("Laboratórios utilizados"));

        exportarAnual(tokenVet, "pdf").then().statusCode(200);
    }

    @Test
    @DisplayName("catalogo de tipos: o relatorio por bairro nao aparece para o veterinario")
    void catalogoDeTipos() {
        List<String> tiposVet = comToken(tokenVet).get("/api/relatorios/tipos").then().statusCode(200)
                .extract().path("codigo");
        assertThat(tiposVet, not(hasItem("ocorrencias_bairro")));
        assertThat(tiposVet, hasItem("anual_processos"));

        assertThat(comToken(tokenAgente).get("/api/relatorios/tipos").then().extract().<List<String>>path("codigo"),
                hasItem("ocorrencias_bairro"));
    }

    @Test
    @DisplayName("permissao real no banco: cargo sem a linha e tratado como o veterinario")
    void permissaoVemDoBanco() {
        UUID cargo = UUID.randomUUID();
        jdbcTemplate.update("insert into cargo (id, nome, descricao) values (?, ?, 'Cargo de teste')",
                cargo, "Leitor de relatorios " + cargo);
        jdbcTemplate.update("""
                insert into cargo_permissao (cargo_id, modulo, feature, leitura, escrita, exclusao)
                values (?, 'RELATORIOS', 'geral', true, false, false)
                """, cargo);
        String token = fixture.tokenComCargo("bairro." + cargo.toString().replaceAll("[^a-z]", "") + "x@itu.sp.gov.br",
                "Leitor", "Teste", cargo);

        previaPorBairro(token).then().statusCode(403);
    }
}
