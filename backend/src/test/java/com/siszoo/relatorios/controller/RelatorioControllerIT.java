package com.siszoo.relatorios.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.not;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

// Endpoints de relatorios (T41): GET /tipos, GET /preview, POST /exportar,
// GET /historico. PR1 so tem ocupacao_baias e vacinacao implementados — os
// outros 4 tipos (PR2) devem recusar com 422 "nao implementado" em vez de
// 404/500, ate la.
class RelatorioControllerIT extends AbstractIntegrationTest {

    private static final String ROTA = "/api/relatorios";

    @Autowired
    private ApiTesteFixture fixture;

    private String tokenAdmin;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin("teste.admin.relatorios@itu.sp.gov.br", "Relatorios");
    }

    @Test
    @DisplayName("401 sem token em todos os endpoints")
    void deveRetornar401SemToken() {
        given().when().get(ROTA + "/tipos").then().statusCode(401);
        given().when().get(ROTA + "/preview?tipo=vacinacao&periodoInicio=2026-01-01&periodoFim=2026-09-10").then().statusCode(401);
        given().when().get(ROTA + "/historico").then().statusCode(401);
        given().contentType(ContentType.JSON).body(corpoExportarVacinacao("csv"))
                .when().post(ROTA + "/exportar").then().statusCode(401);
    }

    @Test
    @DisplayName("403 para perfil sem RELATORIOS:leitura")
    void deveRetornar403ParaPerfilSemAcesso() {
        String tokenSemAcesso = fixture.tokenLeitorOcorrencias("teste.leitor.relatorios@itu.sp.gov.br", "Relatorios");
        given().header("Authorization", "Bearer " + tokenSemAcesso).when().get(ROTA + "/tipos").then().statusCode(403);
    }

    @Test
    @DisplayName("GET /tipos sempre lista os 6 tipos do catalogo do DER")
    void tiposDeveListarOsSeisTipos() {
        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA + "/tipos")
                .then().statusCode(200)
                .body("codigo", org.hamcrest.Matchers.containsInAnyOrder(
                        "anual_processos", "vacinacao", "adocoes", "procedimentos", "ocupacao_baias", "ocorrencias_bairro"));
    }

    @Test
    @DisplayName("422 para tipo inexistente")
    void previewDeveRecusarTipoInvalido() {
        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA + "/preview?tipo=nao_existe")
                .then().statusCode(422);
    }

    @Test
    @DisplayName("422 para periodo invertido (dataFim < dataInicio)")
    void previewDeveRecusarPeriodoInvertido() {
        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA + "/preview?tipo=vacinacao&periodoInicio=2026-09-10&periodoFim=2026-01-01")
                .then().statusCode(422);
    }

    @Test
    @DisplayName("422 para tipo do catalogo ainda nao implementado nesta PR (ex.: adocoes)")
    void exportarDeveRecusarTipoAindaNaoImplementado() {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipo", "adocoes");
        corpo.put("periodoInicio", "2026-01-01");
        corpo.put("periodoFim", "2026-09-10");
        corpo.put("formato", "csv");

        given().header("Authorization", "Bearer " + tokenAdmin).contentType(ContentType.JSON).body(corpo)
                .when().post(ROTA + "/exportar")
                .then().statusCode(422);
    }

    @Test
    @DisplayName("preview de ocupacao_baias com janela ultimos_6_meses responde 200 com os KPIs esperados")
    void previewOcupacaoBaiasDeveResponder200() {
        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA + "/preview?tipo=ocupacao_baias&janela=ultimos_6_meses")
                .then().statusCode(200)
                .body("kpis.capacidadeTotal", greaterThanOrEqualTo(0))
                .body("baias", org.hamcrest.Matchers.notNullValue());
    }

    @Test
    @DisplayName("exportar CSV de vacinacao: Content-Type, Content-Disposition e BOM/separador corretos, e grava relatorio_gerado")
    void exportarCsvDeVacinacaoDeveGerarArquivoERegistrarHistorico() {
        long totalAntes = totalNoHistorico();

        Response resposta = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(ContentType.JSON)
                .body(corpoExportarVacinacao("csv"))
                .when().post(ROTA + "/exportar")
                .then().statusCode(200)
                .contentType(containsString("text/csv"))
                .header("Content-Disposition", containsString("attachment"))
                .header("Content-Disposition", containsString("vacinacao"))
                .extract().response();

        byte[] corpo = resposta.asByteArray();
        // BOM UTF-8 (EF BB BF) no inicio do arquivo, para o Excel PT-BR abrir
        // a acentuacao corretamente.
        assertThat(corpo[0] & 0xFF, equalTo(0xEF));
        assertThat(corpo[1] & 0xFF, equalTo(0xBB));
        assertThat(corpo[2] & 0xFF, equalTo(0xBF));
        String texto = new String(corpo, 3, corpo.length - 3, StandardCharsets.UTF_8);
        assertThat(texto, containsString("Vacina;Aplicações;Cobertura atual;Vencendo em 30 dias"));

        assertThat(totalNoHistorico(), equalTo(totalAntes + 1));
    }

    @Test
    @DisplayName("exportar PDF de ocupacao_baias: Content-Type correto e sem texto de assinatura/recomendação")
    void exportarPdfDeOcupacaoBaiasNaoDeveConterAssinaturaOuRecomendacao() throws Exception {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipo", "ocupacao_baias");
        corpo.put("janela", "ultimos_6_meses");
        corpo.put("formato", "pdf");

        byte[] pdf = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(ContentType.JSON)
                .body(corpo)
                .when().post(ROTA + "/exportar")
                .then().statusCode(200)
                .contentType(equalTo("application/pdf"))
                .extract().asByteArray();

        assertThat(pdf.length, greaterThanOrEqualTo(1));
        // %PDF no inicio do arquivo confirma que e um PDF valido, nao so bytes quaisquer.
        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII), equalTo("%PDF"));

        // Extracao de texto via OpenPDF (ja e dependencia transitiva do Flying
        // Saucer — sem precisar de Apache PDFBox so pra isso).
        com.lowagie.text.pdf.PdfReader leitor = new com.lowagie.text.pdf.PdfReader(pdf);
        String texto = new com.lowagie.text.pdf.parser.PdfTextExtractor(leitor).getTextFromPage(1)
                .toLowerCase(java.util.Locale.ROOT);
        assertThat(texto, containsString("ocupação de baias"));
        assertThat(texto, not(containsString("assinatura")));
        assertThat(texto, not(containsString("assinado")));
        assertThat(texto, not(containsString("recomendação")));
        assertThat(texto, not(containsString("recomendacao")));
        assertThat(texto, not(containsString("sugestão")));
        assertThat(texto, not(containsString("sugestao")));
    }

    @Test
    @DisplayName("historico paginado devolve os campos esperados, sem arquivoUrl (arquivo nao e persistido)")
    void historicoDeveListarGeracoesRecentes() {
        given().header("Authorization", "Bearer " + tokenAdmin)
                .contentType(ContentType.JSON).body(corpoExportarVacinacao("csv"))
                .when().post(ROTA + "/exportar").then().statusCode(200);

        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA + "/historico?pagina=0&tamanho=5")
                .then().statusCode(200)
                .body("itens", org.hamcrest.Matchers.not(org.hamcrest.Matchers.empty()))
                .body("itens[0].docId", containsString("DOC-"))
                .body("itens[0].geradoPorNome", org.hamcrest.Matchers.notNullValue());
    }

    private long totalNoHistorico() {
        return given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA + "/historico?pagina=0&tamanho=1")
                .then().statusCode(200)
                .extract().jsonPath().getLong("totalItens");
    }

    private Map<String, Object> corpoExportarVacinacao(String formato) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipo", "vacinacao");
        corpo.put("periodoInicio", "2026-01-01");
        corpo.put("periodoFim", "2026-09-10");
        corpo.put("formato", formato);
        return corpo;
    }
}
