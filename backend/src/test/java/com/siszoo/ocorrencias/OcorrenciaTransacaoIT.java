package com.siszoo.ocorrencias;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;
import com.siszoo.comum.service.ProtocoloService;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import tools.jackson.databind.ObjectMapper;

// Transacao e concorrencia da T25: rollback de status + movimentacao (D4),
// protocolo unico sob concorrencia (D13), limite de anexos com lock (D24) e
// ordem de locks no vinculo. O rollback e provocado por um gatilho temporario
// que faz o INSERT da movimentacao falhar so para ocorrencias marcadas — sem
// mock, exercitando a transacao real do PostgreSQL.
@Import(RelogioTesteConfig.class)
class OcorrenciaTransacaoIT extends AbstractIntegrationTest {

    private static final String ROTA = "/api/ocorrencias";
    private static final String MARCA_FALHA = "FALHA-MOVIMENTACAO";
    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01};

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private String tokenAgente;

    @BeforeEach
    void preparar() {
        tokenAgente = fixture.tokenComCargo("agente.transacao@itu.sp.gov.br", "Agente", "Transacao",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        jdbcTemplate.execute("""
                CREATE OR REPLACE FUNCTION t25_falhar_movimentacao() RETURNS trigger AS $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM ocorrencia WHERE id = NEW.ocorrencia_id AND descricao LIKE '%s%%') THEN
                        RAISE EXCEPTION 'falha simulada na movimentacao';
                    END IF;
                    RETURN NEW;
                END $$ LANGUAGE plpgsql
                """.formatted(MARCA_FALHA));
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS t25_falhar_movimentacao ON movimentacao_ocorrencia");
        jdbcTemplate.execute("CREATE TRIGGER t25_falhar_movimentacao BEFORE INSERT ON movimentacao_ocorrencia"
                + " FOR EACH ROW EXECUTE FUNCTION t25_falhar_movimentacao()");
    }

    @AfterEach
    void removerGatilho() {
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS t25_falhar_movimentacao ON movimentacao_ocorrencia");
        jdbcTemplate.execute("DROP FUNCTION IF EXISTS t25_falhar_movimentacao()");
    }

    // ── Rollback (D4) ────────────────────────────────────

    @Test
    @DisplayName("[D4] falha ao gravar a movimentacao do cadastro desfaz a ocorrencia e o incremento do protocolo")
    void falhaNoCadastroDesfazTudo() throws Exception {
        Integer ultimoAntes = ultimoProtocolo("OCORRENCIA", RelogioTesteConfig.HOJE.getYear());
        String marca = MARCA_FALHA + " " + UUID.randomUUID();

        Response resposta = criar(corpo(marca));

        resposta.then().statusCode(500);
        // Nenhum detalhe interno no corpo do 500: sem stack trace, SQL ou mensagem da excecao.
        String corpo = resposta.asString();
        for (String interno : List.of("falha simulada", "movimentacao_ocorrencia", "INSERT", "PSQLException",
                "Exception", "at com.siszoo", "trace", "message")) {
            assertThat(corpo, corpo, not(containsString(interno)));
        }
        assertThat(corpo, objectMapper.readTree(corpo).propertyNames(),
                containsInAnyOrder("timestamp", "status", "error", "path"));

        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM ocorrencia WHERE descricao = ?", Integer.class, marca),
                equalTo(0));
        assertThat(ultimoProtocolo("OCORRENCIA", RelogioTesteConfig.HOJE.getYear()), equalTo(ultimoAntes));
    }

    @Test
    @DisplayName("[D4] falha ao gravar a movimentacao de status mantem o status anterior")
    void falhaNaMudancaDeStatusMantemStatus() {
        Map<String, Object> corpo = corpo("Normal");
        String id = idDe(criar(corpo));
        // Marca a ocorrencia para o gatilho so depois do cadastro (o PUT nao gera movimentacao, D10).
        corpo.put("descricao", MARCA_FALHA + " " + id);
        given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON).body(corpo)
                .when().put(ROTA + "/" + id).then().statusCode(200);

        given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON)
                .body(Map.of("status", "EM_ATENDIMENTO"))
                .when().patch(ROTA + "/" + id + "/status").then().statusCode(500);

        Response detalhe = given().header("Authorization", "Bearer " + tokenAgente).when().get(ROTA + "/" + id);
        assertThat(detalhe.path("statusOcorrencia"), equalTo("ABERTA"));
        assertThat(detalhe.path("movimentacoes"), hasSize(1));
    }

    // ── Protocolo (D13) ──────────────────────────────────

    @Test
    @DisplayName("[D13] criacoes concorrentes recebem protocolos distintos e sequenciais")
    void protocolosConcorrentes() throws Exception {
        ProtocoloService servico = servicoNoAno(2091);
        jdbcTemplate.update("DELETE FROM protocolo_sequencia WHERE ano = 2091");
        int threads = 8;
        CountDownLatch largada = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        try {
            List<Future<String>> futuros = new ArrayList<>();
            for (int i = 0; i < threads; i++) {
                futuros.add(executor.submit(() -> {
                    largada.await();
                    return transactionTemplate.execute(status -> servico.proximo(ProtocoloService.Entidade.OCORRENCIA));
                }));
            }
            largada.countDown();
            List<String> protocolos = new ArrayList<>();
            for (Future<String> futuro : futuros) {
                protocolos.add(futuro.get(30, TimeUnit.SECONDS));
            }
            assertThat(protocolos, containsInAnyOrder(IntStream.rangeClosed(1, threads)
                    .mapToObj(n -> String.format("%03d/2091", n)).toArray(String[]::new)));
        } finally {
            executor.shutdownNow();
            jdbcTemplate.update("DELETE FROM protocolo_sequencia WHERE ano = 2091");
        }
    }

    @Test
    @DisplayName("[D13] acima de 999 o numero cresce; a sequencia e por entidade e por ano")
    void protocoloAcimaDe999EPorAno() {
        jdbcTemplate.update("DELETE FROM protocolo_sequencia WHERE ano IN (2092, 2093)");
        try {
            jdbcTemplate.update("INSERT INTO protocolo_sequencia (entidade, ano, ultimo) VALUES ('OCORRENCIA', 2092, 998)");
            ProtocoloService em2092 = servicoNoAno(2092);

            assertThat(proximo(em2092, ProtocoloService.Entidade.OCORRENCIA), equalTo("999/2092"));
            assertThat(proximo(em2092, ProtocoloService.Entidade.OCORRENCIA), equalTo("1000/2092"));
            assertThat(proximo(em2092, ProtocoloService.Entidade.PROCESSO), equalTo("001/2092"));
            assertThat(proximo(servicoNoAno(2093), ProtocoloService.Entidade.OCORRENCIA), equalTo("001/2093"));
        } finally {
            jdbcTemplate.update("DELETE FROM protocolo_sequencia WHERE ano IN (2092, 2093)");
        }
    }

    // ── Concorrencia de anexos e de vinculo ──────────────

    @Test
    @DisplayName("[D24] dois uploads simultaneos para o quinto anexo: um 200, um 422, total 5")
    void quintoAnexoConcorrente() throws Exception {
        String id = idDe(criar(corpo("Anexos concorrentes")));
        for (int i = 1; i <= 4; i++) {
            anexar(id).then().statusCode(200);
        }

        CountDownLatch largada = new CountDownLatch(1);
        CompletableFuture<Integer> primeiro = CompletableFuture.supplyAsync(() -> aguardarEAnexar(largada, id));
        CompletableFuture<Integer> segundo = CompletableFuture.supplyAsync(() -> aguardarEAnexar(largada, id));
        largada.countDown();

        List<Integer> status = List.of(primeiro.get(30, TimeUnit.SECONDS), segundo.get(30, TimeUnit.SECONDS));
        assertThat(status, containsInAnyOrder(200, 422));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM anexo_ocorrencia WHERE ocorrencia_id = CAST(? AS uuid)",
                Integer.class, id), equalTo(5));
    }

    @Test
    @DisplayName("Ordem de locks: vinculos concorrentes pelos dois caminhos terminam sem deadlock (um 200, um 409)")
    void vinculosConcorrentesSemDeadlock() throws Exception {
        String id = idDe(criar(corpo("Vinculo concorrente")));
        String processoExistente = criarProcesso(null).path("id");

        CountDownLatch largada = new CountDownLatch(1);
        CompletableFuture<Integer> peloProcesso = CompletableFuture.supplyAsync(() -> {
            aguardar(largada);
            return criarProcesso(id).statusCode();
        });
        CompletableFuture<Integer> pelaOcorrencia = CompletableFuture.supplyAsync(() -> {
            aguardar(largada);
            return given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON)
                    .body(Map.of("processoId", processoExistente))
                    .when().post(ROTA + "/" + id + "/processo").statusCode();
        });
        largada.countDown();

        List<Integer> status = List.of(peloProcesso.get(30, TimeUnit.SECONDS), pelaOcorrencia.get(30, TimeUnit.SECONDS));
        assertThat(status, containsInAnyOrder(200, 409));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM processo_sanitario WHERE ocorrencia_id = CAST(? AS uuid)",
                Integer.class, id), equalTo(1));
    }

    // ── Apoio ────────────────────────────────────────────

    private Map<String, Object> corpo(String descricao) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "zoonose");
        corpo.put("dataAbertura", RelogioTesteConfig.HOJE.toString());
        corpo.put("endereco", "Rua Teste, 1");
        corpo.put("bairro", "Centro");
        corpo.put("descricao", descricao);
        corpo.put("urgente", false);
        corpo.put("sigilosa", false);
        corpo.put("anonima", false);
        corpo.put("denunciante", Map.of("nome", "Denunciante Teste"));
        return corpo;
    }

    private Response criar(Map<String, Object> corpo) {
        return given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON).body(corpo)
                .when().post(ROTA);
    }

    private Response criarProcesso(String ocorrenciaId) {
        return fixture.postarProcesso(tokenAgente, ocorrenciaId, false);
    }

    private Response anexar(String id) {
        return given().header("Authorization", "Bearer " + tokenAgente)
                .multiPart("arquivo", "foto.png", PNG, "image/png")
                .when().post(ROTA + "/" + id + "/anexos");
    }

    private int aguardarEAnexar(CountDownLatch largada, String id) {
        aguardar(largada);
        return anexar(id).statusCode();
    }

    private static void aguardar(CountDownLatch largada) {
        try {
            largada.await(30, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    }

    private ProtocoloService servicoNoAno(int ano) {
        Clock clock = Clock.fixed(Instant.parse(ano + "-06-15T15:00:00Z"), ZoneId.of("America/Sao_Paulo"));
        return new ProtocoloService(jdbcTemplate, clock);
    }

    // Fora do proxy do Spring, a exigencia de transacao (MANDATORY) nao se
    // aplica; o TransactionTemplate reproduz o uso real, dentro de transacao.
    private String proximo(ProtocoloService servico, ProtocoloService.Entidade entidade) {
        return transactionTemplate.execute(status -> servico.proximo(entidade));
    }

    private Integer ultimoProtocolo(String entidade, int ano) {
        return jdbcTemplate.query("SELECT ultimo FROM protocolo_sequencia WHERE entidade = ? AND ano = ?",
                rs -> rs.next() ? rs.getInt(1) : null, entidade, ano);
    }

    private static String idDe(Response resposta) {
        resposta.then().statusCode(200);
        return resposta.path("id");
    }
}
