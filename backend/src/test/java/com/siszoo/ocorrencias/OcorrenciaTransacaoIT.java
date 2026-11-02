package com.siszoo.ocorrencias;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.fail;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
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
import java.util.concurrent.TimeoutException;
import java.util.stream.IntStream;

import javax.sql.DataSource;

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
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import tools.jackson.databind.ObjectMapper;

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

    @Autowired
    private OcorrenciaRepository ocorrenciaRepository;

    @Autowired
    private DataSource dataSource;

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
        RelogioTesteConfig.restaurar();
    }

    @Test
    @DisplayName("[D4] falha ao gravar a movimentacao do cadastro desfaz a ocorrencia e o incremento do protocolo")
    void falhaNoCadastroDesfazTudo() throws Exception {
        Integer ultimoAntes = ultimoProtocolo("OCORRENCIA", RelogioTesteConfig.HOJE.getYear());
        String marca = MARCA_FALHA + " " + UUID.randomUUID();

        Response resposta = criar(corpo(marca));

        resposta.then().statusCode(500);
        String corpo = resposta.asString();
        for (String interno : List.of("falha simulada", "movimentacao_ocorrencia", "INSERT", "PSQLException",
                "Exception", "at com.siszoo", "trace", "message")) {
            assertThat(corpo, corpo, not(containsString(interno)));
        }
        assertThat(corpo, objectMapper.readTree(corpo).propertyNames(),
                containsInAnyOrder("timestamp", "status", "error", "path", "mensagem"));

        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM ocorrencia WHERE descricao = ?", Integer.class, marca),
                equalTo(0));
        assertThat(ultimoProtocolo("OCORRENCIA", RelogioTesteConfig.HOJE.getYear()), equalTo(ultimoAntes));
    }

    @Test
    @DisplayName("[D4] falha ao gravar a movimentacao de status mantem o status anterior")
    void falhaNaMudancaDeStatusMantemStatus() {
        Map<String, Object> corpo = corpo("Normal");
        String id = idDe(criar(corpo));
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

    @Test
    @DisplayName("[T30] alterar a ocorrencia pela entidade nao muda o protocolo gravado")
    void protocoloNaoEntraNoUpdateDaOcorrencia() {
        Response criada = criar(corpo("Protocolo imutavel"));
        String id = idDe(criada);
        String protocolo = criada.path("protocolo");

        transactionTemplate.executeWithoutResult(status -> {
            Ocorrencia ocorrencia = ocorrenciaRepository.findById(UUID.fromString(id)).orElseThrow();
            ocorrencia.setProtocolo("000/1999");
            ocorrencia.setDescricao("Protocolo imutavel, descricao alterada");
        });

        Map<String, Object> gravada = jdbcTemplate.queryForMap(
                "SELECT protocolo, descricao FROM ocorrencia WHERE id = CAST(? AS uuid)", id);
        assertThat(gravada.get("descricao"), equalTo("Protocolo imutavel, descricao alterada"));
        assertThat(gravada.get("protocolo"), equalTo(protocolo));
    }

    @Test
    @DisplayName("[D13/T30] virada do ano: UTC ja em 2098 e Sao Paulo ainda em 2097 gera 001/2097")
    void viradaDoAnoUtcAdiantadoUsaAnoDeSaoPaulo() {
        jdbcTemplate.update("DELETE FROM protocolo_sequencia WHERE ano IN (2097, 2098)");
        try {
            ProtocoloService servico = servicoNoInstante("2098-01-01T02:00:00Z");

            assertThat(proximo(servico, ProtocoloService.Entidade.PROCESSO), equalTo("001/2097"));
            assertThat(ultimoProtocolo("PROCESSO", 2097), equalTo(1));
            assertThat(ultimoProtocolo("PROCESSO", 2098), nullValue());
        } finally {
            jdbcTemplate.update("DELETE FROM protocolo_sequencia WHERE ano IN (2097, 2098)");
        }
    }

    @Test
    @DisplayName("[D13/T30] virada do ano: UTC e Sao Paulo ja em 2098 gera 001/2098")
    void viradaDoAnoJaNoAnoNovoEmSaoPaulo() {
        jdbcTemplate.update("DELETE FROM protocolo_sequencia WHERE ano IN (2097, 2098)");
        try {
            ProtocoloService servico = servicoNoInstante("2098-01-01T03:00:00Z");

            assertThat(proximo(servico, ProtocoloService.Entidade.PROCESSO), equalTo("001/2098"));
            assertThat(ultimoProtocolo("PROCESSO", 2098), equalTo(1));
            assertThat(ultimoProtocolo("PROCESSO", 2097), nullValue());
        } finally {
            jdbcTemplate.update("DELETE FROM protocolo_sequencia WHERE ano IN (2097, 2098)");
        }
    }

    private static final int CRIACOES_CONCORRENTES = 6;
    private static final long TIMEOUT_SEGUNDOS = 30;

    @Test
    @DisplayName("[T30] POST /api/ocorrencias simultaneos: todos 200, protocolos 001..N do ano, sem duplicata nem lacuna")
    void ocorrenciasConcorrentesPelaApi() throws Exception {
        int ano = 2096;
        assertThat("ocorrencias ja existentes em " + ano, jdbcTemplate.queryForObject(
                "SELECT count(*) FROM ocorrencia WHERE protocolo LIKE ?", Integer.class, "%/" + ano), equalTo(0));
        jdbcTemplate.update("DELETE FROM protocolo_sequencia WHERE entidade = 'OCORRENCIA' AND ano = ?", ano);
        RelogioTesteConfig.fixarEm(Instant.parse(ano + "-06-15T15:00:00Z"));
        try {
            String token = fixture.tokenComCargo("agente.concorrencia.ocorrencias@itu.sp.gov.br", "Agente",
                    "Concorrencia", ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
            Map<String, Object> corpo = corpo("Ocorrencia concorrente");
            corpo.put("dataAbertura", "2026-01-01");

            List<Response> respostas = postarOcorrenciasEmParalelo(token, corpo, ano);

            List<String> protocolos = new ArrayList<>();
            List<Integer> numeros = new ArrayList<>();
            for (Response resposta : respostas) {
                resposta.then().statusCode(200);
                String protocolo = resposta.path("protocolo");
                assertThat(protocolo, matchesPattern("\\d{3,}/" + ano));
                assertThat(jdbcTemplate.queryForObject("SELECT protocolo FROM ocorrencia WHERE id = CAST(? AS uuid)",
                        String.class, (String) resposta.path("id")), equalTo(protocolo));
                protocolos.add(protocolo);
                numeros.add(Integer.parseInt(protocolo.substring(0, protocolo.indexOf('/'))));
            }
            Collections.sort(numeros);
            assertThat(numeros, equalTo(IntStream.rangeClosed(1, CRIACOES_CONCORRENTES).boxed().toList()));
            assertThat(jdbcTemplate.queryForList("SELECT protocolo FROM ocorrencia WHERE protocolo LIKE ?",
                    String.class, "%/" + ano), containsInAnyOrder(protocolos.toArray(String[]::new)));
        } finally {
            RelogioTesteConfig.restaurar();
        }
    }

    private List<Response> postarOcorrenciasEmParalelo(String token, Map<String, Object> corpo, int ano)
            throws Exception {
        CountDownLatch largada = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(CRIACOES_CONCORRENTES);
        Throwable falha = null;
        try (Connection bloqueio = dataSource.getConnection()) {
            bloqueio.setAutoCommit(false);
            int pidBloqueio = pidDe(bloqueio);
            List<Future<Response>> futuros = new ArrayList<>();
            try {
                try (PreparedStatement insert = bloqueio.prepareStatement(
                        "INSERT INTO protocolo_sequencia (entidade, ano, ultimo) VALUES ('OCORRENCIA', ?, 1)")) {
                    insert.setInt(1, ano);
                    insert.executeUpdate();
                }
                for (int i = 0; i < CRIACOES_CONCORRENTES; i++) {
                    futuros.add(executor.submit(() -> {
                        if (!largada.await(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS)) {
                            throw new IllegalStateException("largada nao liberada em " + TIMEOUT_SEGUNDOS + " s");
                        }
                        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                                .body(corpo).when().post(ROTA);
                    }));
                }
                largada.countDown();
                aguardarUpsertsBloqueados(futuros, pidBloqueio);
            } finally {
                bloqueio.rollback();
            }

            List<Response> respostas = new ArrayList<>();
            for (Future<Response> futuro : futuros) {
                try {
                    respostas.add(futuro.get(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS));
                } catch (TimeoutException e) {
                    fail("POST " + ROTA + " nao terminou em " + TIMEOUT_SEGUNDOS + " s (bloqueio ou deadlock?)");
                }
            }
            return respostas;
        } catch (Throwable t) {
            falha = t;
            throw t;
        } finally {
            executor.shutdownNow();
            if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
                AssertionError pendentes = new AssertionError("Requisicoes ainda em execucao apos o encerramento;"
                        + " o servidor nao cancela o trabalho ja iniciado");
                if (falha != null) {
                    falha.addSuppressed(pendentes);
                } else {
                    throw pendentes;
                }
            }
        }
    }

    private static int pidDe(Connection conexao) throws Exception {
        try (Statement consulta = conexao.createStatement();
                ResultSet resultado = consulta.executeQuery("SELECT pg_backend_pid()")) {
            resultado.next();
            return resultado.getInt(1);
        }
    }

    private void aguardarUpsertsBloqueados(List<Future<Response>> futuros, int pidBloqueio) throws Exception {
        long limite = System.nanoTime() + TimeUnit.SECONDS.toNanos(TIMEOUT_SEGUNDOS);
        int bloqueados = 0;
        while (System.nanoTime() < limite) {
            for (Future<Response> futuro : futuros) {
                if (futuro.isDone()) {
                    throw new AssertionError("Uma requisicao terminou sem esperar as demais: " + futuro.get().asString());
                }
            }
            bloqueados = jdbcTemplate.queryForObject("""
                    SELECT count(*) FROM pg_stat_activity
                    WHERE pid <> pg_backend_pid() AND state = 'active'
                      AND wait_event_type = 'Lock' AND wait_event = 'transactionid'
                      AND ? = ANY(pg_blocking_pids(pid))
                      AND query ILIKE '%insert into protocolo_sequencia%'
                    """, Integer.class, pidBloqueio);
            if (bloqueados == futuros.size()) {
                return;
            }
            Thread.sleep(50);
        }
        throw new AssertionError("Esperadas " + futuros.size() + " transacoes paradas no upsert do protocolo;"
                + " vistas " + bloqueados);
    }

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
        return servicoNoInstante(ano + "-06-15T15:00:00Z");
    }

    private ProtocoloService servicoNoInstante(String instante) {
        Clock clock = Clock.fixed(Instant.parse(instante), ZoneId.of("America/Sao_Paulo"));
        return new ProtocoloService(jdbcTemplate, clock);
    }

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
