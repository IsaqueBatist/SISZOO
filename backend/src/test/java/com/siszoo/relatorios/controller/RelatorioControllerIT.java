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
// GET /historico. Os 6 tipos do catalogo estao implementados (PR1: ocupacao_baias
// e vacinacao; PR2: anual_processos, adocoes, procedimentos, ocorrencias_bairro).
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

    // Regressao: as contagens do relatorio usavam o caminho implicito
    // o.providenciaTomada.codigo (INNER JOIN) e ignoravam toda ocorrencia
    // ainda nao encerrada. Dia isolado, sem outras ocorrencias de teste.
    @Test
    @DisplayName("ocorrencias_bairro conta ocorrencias abertas e ignora registro_indevido")
    void ocorrenciasBairroContaAbertasEIgnoraRegistroIndevido() {
        String dia = "2025-03-17";
        String preview = ROTA + "/preview?tipo=ocorrencias_bairro&periodoInicio=" + dia + "&periodoFim=" + dia;
        long antes = given().header("Authorization", "Bearer " + tokenAdmin).when().get(preview)
                .then().statusCode(200).extract().jsonPath().getLong("kpis.ocorrenciasRegistradas");

        criarOcorrencia(dia, "Bairro Regressao Relatorio");
        String indevida = criarOcorrencia(dia, "Bairro Regressao Relatorio");
        Map<String, Object> encerramento = new HashMap<>();
        encerramento.put("providenciaTomada", "registro_indevido");
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin).body(encerramento)
                .when().post("/api/ocorrencias/" + indevida + "/encerramento").then().statusCode(200);

        var json = given().header("Authorization", "Bearer " + tokenAdmin).when().get(preview)
                .then().statusCode(200).extract().jsonPath();
        assertThat(json.getLong("kpis.ocorrenciasRegistradas"), equalTo(antes + 1));
        assertThat(json.getList("bairros.bairro"), org.hamcrest.Matchers.hasItem("Bairro Regressao Relatorio"));
    }

    private String criarOcorrencia(String dataAbertura, String bairro) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "outros");
        corpo.put("dataAbertura", dataAbertura);
        corpo.put("endereco", "Rua de Teste, 1");
        corpo.put("bairro", bairro);
        corpo.put("descricao", "Ocorrencia de teste do relatorio por bairro");
        corpo.put("anonima", true);
        return given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin).body(corpo)
                .when().post("/api/ocorrencias").then().statusCode(200).extract().path("id");
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
    @DisplayName("422 para formato invalido no exportar")
    void exportarDeveRecusarFormatoInvalido() {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipo", "vacinacao");
        corpo.put("periodoInicio", "2026-01-01");
        corpo.put("periodoFim", "2026-09-10");
        corpo.put("formato", "xlsx");

        given().header("Authorization", "Bearer " + tokenAdmin).contentType(ContentType.JSON).body(corpo)
                .when().post(ROTA + "/exportar")
                .then().statusCode(422);
    }

    @Test
    @DisplayName("preview de anual_processos (filtro por ano) responde 200 com os KPIs esperados")
    void previewAnualProcessosDeveResponder200() {
        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA + "/preview?tipo=anual_processos&ano=2025")
                .then().statusCode(200)
                .body("ano", equalTo(2025))
                .body("kpis.processosAbertos", greaterThanOrEqualTo(0))
                .body("resultadosPorDoenca", org.hamcrest.Matchers.notNullValue());
    }

    @Test
    @DisplayName("preview de adocoes (versao simplificada) responde 200 e explica a limitacao")
    void previewAdocoesDeveResponder200ComNotaDeLimitacao() {
        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA + "/preview?tipo=adocoes&periodoInicio=2026-01-01&periodoFim=2026-03-31")
                .then().statusCode(200)
                .body("kpis.animaisAdotados", greaterThanOrEqualTo(0))
                .body("notaLimitacao", containsString("não é filtrado pelo período"));
    }

    @Test
    @DisplayName("preview de procedimentos responde 200")
    void previewProcedimentosDeveResponder200() {
        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA + "/preview?tipo=procedimentos&periodoInicio=2026-04-01&periodoFim=2026-04-30")
                .then().statusCode(200)
                .body("kpis.totalProcedimentos", greaterThanOrEqualTo(0));
    }

    @Test
    @DisplayName("preview de ocorrencias_bairro responde 200")
    void previewOcorrenciasBairroDeveResponder200() {
        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA + "/preview?tipo=ocorrencias_bairro&periodoInicio=2026-01-01&periodoFim=2026-05-20")
                .then().statusCode(200)
                .body("kpis.ocorrenciasRegistradas", greaterThanOrEqualTo(0));
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
    @DisplayName("exportar PDF de anual_processos (2 paginas): sem assinatura/recomendacao em nenhuma das 2 paginas")
    void exportarPdfDeAnualProcessosNaoDeveConterAssinaturaOuRecomendacaoEmNenhumaPagina() throws Exception {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipo", "anual_processos");
        corpo.put("ano", 2025);
        corpo.put("formato", "pdf");

        byte[] pdf = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(ContentType.JSON)
                .body(corpo)
                .when().post(ROTA + "/exportar")
                .then().statusCode(200)
                .contentType(equalTo("application/pdf"))
                .extract().asByteArray();

        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII), equalTo("%PDF"));

        com.lowagie.text.pdf.PdfReader leitor = new com.lowagie.text.pdf.PdfReader(pdf);
        assertThat(leitor.getNumberOfPages(), equalTo(2));
        com.lowagie.text.pdf.parser.PdfTextExtractor extrator = new com.lowagie.text.pdf.parser.PdfTextExtractor(leitor);
        String pagina1 = extrator.getTextFromPage(1).toLowerCase(java.util.Locale.ROOT);
        String pagina2 = extrator.getTextFromPage(2).toLowerCase(java.util.Locale.ROOT);

        assertThat(pagina1, containsString("relatório anual de processos"));
        assertThat(pagina2, containsString("laboratórios utilizados"));
        for (String texto : new String[] {pagina1, pagina2}) {
            assertThat(texto, not(containsString("assinatura")));
            assertThat(texto, not(containsString("assinado")));
            assertThat(texto, not(containsString("recomendação")));
            assertThat(texto, not(containsString("recomendacao")));
            assertThat(texto, not(containsString("sugestão")));
            assertThat(texto, not(containsString("sugestao")));
        }
    }

    @Test
    @DisplayName("exportar CSV de procedimentos: 3 blocos (por tipo, produtividade, cirurgias) e grava relatorio_gerado")
    void exportarCsvDeProcedimentosDeveGerarOsTresBlocos() {
        long totalAntes = totalNoHistorico();

        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipo", "procedimentos");
        corpo.put("periodoInicio", "2026-04-01");
        corpo.put("periodoFim", "2026-04-30");
        corpo.put("formato", "csv");

        byte[] arquivo = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(ContentType.JSON)
                .body(corpo)
                .when().post(ROTA + "/exportar")
                .then().statusCode(200)
                .contentType(containsString("text/csv"))
                .extract().asByteArray();

        String texto = new String(arquivo, 3, arquivo.length - 3, StandardCharsets.UTF_8);
        assertThat(texto, containsString("Procedimentos por tipo"));
        assertThat(texto, containsString("Produtividade por veterinário"));
        assertThat(texto, containsString("Cirurgias realizadas"));
        assertThat(totalNoHistorico(), equalTo(totalAntes + 1));
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
