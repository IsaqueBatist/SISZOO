package com.siszoo.ocorrencias;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.function.BooleanSupplier;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;
import com.siszoo.ocorrencias.dto.VisualizacaoAuditada;
import com.siszoo.ocorrencias.service.OcorrenciaService;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

// T26: acesso autorizado ao denunciante de ocorrencia sigilosa gera
// VISUALIZACAO — no detalhe (entidade 'denunciante') e no download de anexo
// (entidade 'anexo_ocorrencia'). Toda verificacao le auditoria_evento por SQL
// depois da requisicao HTTP: a transacao do servidor ja terminou (os ITs nao
// usam @Transactional), entao a linha lida e a que foi de fato commitada.
@Import(RelogioTesteConfig.class)
class AuditoriaSigiloIT extends AbstractIntegrationTest {

    private static final String ROTA = "/api/ocorrencias";
    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01};
    private static final String MARCA_FALHA = "FALHA-AUDITORIA";

    private static final String EMAIL_ADMIN = "admin.sigilo@itu.sp.gov.br";
    private static final String EMAIL_AGENTE = "agente.sigilo@itu.sp.gov.br";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OcorrenciaService ocorrenciaService;

    @LocalServerPort
    private int porta;

    private String tokenAdmin;
    private String tokenAgente;
    private String tokenVet;
    private String tokenLeitor;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin(EMAIL_ADMIN, "Sigilo");
        tokenAgente = fixture.tokenComCargo(EMAIL_AGENTE, "Agente", "Sigilo", ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        tokenVet = fixture.tokenComCargo("vet.sigilo@itu.sp.gov.br", "Vet", "Sigilo",
                ApiTesteFixture.CARGO_VETERINARIO_ID);
        tokenLeitor = fixture.tokenLeitorOcorrencias("leitor.sigilo@itu.sp.gov.br", "Sigilo");
    }

    // ── Detalhe ──────────────────────────────────────────

    @Test
    @DisplayName("[T26] Admin e Agente no detalhe de sigilosa: dados completos e um VISUALIZACAO cada, com usuario,"
            + " entidade, entidade_id e payload corretos")
    void detalheAutorizadoGeraUmEvento() throws Exception {
        String marcador = marcador();
        String id = criarSigilosaComDenunciante(marcador, false);
        UUID denuncianteId = denuncianteDe(id);

        for (String[] perfil : new String[][] {{tokenAdmin, EMAIL_ADMIN}, {tokenAgente, EMAIL_AGENTE}}) {
            Response resposta = detalhe(perfil[0], id);
            resposta.then().statusCode(200);
            assertThat(resposta.path("denunciante.nome"), equalTo("Nome " + marcador));
            assertThat(resposta.path("denunciante.cpf"), equalTo("111.222.333-44"));

            List<Map<String, Object>> eventos = eventos("denunciante", denuncianteId, usuarioId(perfil[1]));
            assertThat(eventos, hasSize(1));
            Map<String, Object> evento = eventos.get(0);
            assertThat(evento.get("acao"), equalTo("VISUALIZACAO"));
            assertThat(evento.get("antes"), nullValue());
            JsonNode payload = objectMapper.readTree((String) evento.get("depois"));
            assertThat(payload.size() == 1 && payload.has("ocorrenciaId"), equalTo(true));
            assertThat(payload.get("ocorrenciaId").asString(), equalTo(id));
        }
        assertThat(eventos("denunciante", denuncianteId, null), hasSize(2));
        // Entregas completas nao geram evento compensatorio.
        assertThat(interrupcoesDaOcorrencia(id), equalTo(0));
    }

    @Test
    @DisplayName("[T26] Vet no detalhe e no download de sigilosa: 403 de acesso ao modulo (V11), nenhum dado, zero eventos")
    void vetRecebe403SemEvento() {
        String marcador = marcador();
        String id = criarSigilosaComDenunciante(marcador, false);
        String anexoId = anexar(id);

        Response detalhe = detalhe(tokenVet, id);
        detalhe.then().statusCode(403);
        assertThat(detalhe.asString(), not(containsString(marcador)));
        baixar(tokenVet, id, anexoId).then().statusCode(403);

        assertThat(eventosDaOcorrencia(id), equalTo(0));
    }

    @Test
    @DisplayName("[T26] leitor sem denunciante_sigiloso: detalhe mascarado e download 403, zero eventos")
    void leitorSemAPermissaoNaoGeraEvento() {
        String marcador = marcador();
        String id = criarSigilosaComDenunciante(marcador, false);
        String anexoId = anexar(id);

        Response detalhe = detalhe(tokenLeitor, id);
        detalhe.then().statusCode(200);
        assertThat(detalhe.path("denunciante.nome"), nullValue());
        assertThat(detalhe.path("podeVerDenunciante"), equalTo(false));
        assertThat(detalhe.asString(), not(containsString(marcador)));
        baixar(tokenLeitor, id, anexoId).then().statusCode(403);

        assertThat(eventosDaOcorrencia(id), equalTo(0));
    }

    @Test
    @DisplayName("[T26] nao sigilosa: detalhe e download por Admin e Agente nao geram VISUALIZACAO")
    void naoSigilosaNaoGeraEvento() {
        String id = criarOcorrencia(false, Map.of("nome", "Publico " + marcador()), null);
        String anexoId = anexar(id);

        for (String token : List.of(tokenAdmin, tokenAgente)) {
            detalhe(token, id).then().statusCode(200);
            baixar(token, id, anexoId).then().statusCode(200);
        }

        assertThat(eventosDaOcorrencia(id), equalTo(0));
    }

    @Test
    @DisplayName("[T26] sigilosa sem denunciante cadastrado: detalhe nao entrega dado pessoal e nao gera evento")
    void sigilosaSemDenuncianteNaoGeraEvento() {
        String id = criarOcorrencia(true, null, null);

        Response resposta = detalhe(tokenAdmin, id);
        resposta.then().statusCode(200);
        assertThat(resposta.path("denunciante"), nullValue());

        assertThat(eventosDaOcorrencia(id), equalTo(0));
    }

    @Test
    @DisplayName("[T26] requisicoes repetidas geram eventos independentes (sem deduplicacao)")
    void semDeduplicacao() {
        String id = criarSigilosaComDenunciante(marcador(), false);
        UUID denuncianteId = denuncianteDe(id);

        for (int i = 0; i < 3; i++) {
            detalhe(tokenAdmin, id).then().statusCode(200);
        }

        assertThat(eventos("denunciante", denuncianteId, usuarioId(EMAIL_ADMIN)), hasSize(3));
    }

    @Test
    @DisplayName("[T26] ocorrencia ou anexo inexistentes: 404 e zero eventos")
    void inexistenteNaoGeraEvento() {
        String id = criarSigilosaComDenunciante(marcador(), false);
        long antes = totalVisualizacoes();

        comToken(tokenAdmin).when().get(ROTA + "/" + UUID.randomUUID()).then().statusCode(404);
        baixar(tokenAdmin, id, UUID.randomUUID().toString()).then().statusCode(404);

        assertThat(totalVisualizacoes(), equalTo(antes));
    }

    // ── Download ─────────────────────────────────────────

    @Test
    @DisplayName("[T26] Admin e Agente baixando anexo de sigilosa: um VISUALIZACAO cada em anexo_ocorrencia")
    void downloadAutorizadoGeraUmEvento() throws Exception {
        String id = criarSigilosaComDenunciante(marcador(), false);
        String anexoId = anexar(id);

        for (String[] perfil : new String[][] {{tokenAdmin, EMAIL_ADMIN}, {tokenAgente, EMAIL_AGENTE}}) {
            Response download = baixar(perfil[0], id, anexoId);
            download.then().statusCode(200);
            assertThat(download.asByteArray(), equalTo(PNG));

            List<Map<String, Object>> eventos = eventos("anexo_ocorrencia", UUID.fromString(anexoId), usuarioId(perfil[1]))
                    .stream().filter(e -> "VISUALIZACAO".equals(e.get("acao"))).toList();
            assertThat(eventos, hasSize(1));
            assertThat(eventos.get(0).get("antes"), nullValue());
            JsonNode payload = objectMapper.readTree((String) eventos.get(0).get("depois"));
            assertThat(payload.size() == 1 && payload.has("ocorrenciaId"), equalTo(true));
            assertThat(payload.get("ocorrenciaId").asString(), equalTo(id));
        }
    }

    // ── Payload sem dado pessoal (D23) ───────────────────

    @Test
    @DisplayName("[T26/D23] payloads de VISUALIZACAO nao contem nenhum dado pessoal do denunciante")
    void payloadSemDadoPessoal() {
        String marcador = marcador();
        String id = criarSigilosaComDenunciante(marcador, false);
        String anexoId = anexar(id);
        detalhe(tokenAdmin, id).then().statusCode(200);
        baixar(tokenAgente, id, anexoId).then().statusCode(200);

        List<String> payloads = jdbcTemplate.queryForList("SELECT CAST(payload_depois AS text) FROM auditoria_evento"
                + " WHERE acao = 'VISUALIZACAO' AND payload_depois ->> 'ocorrenciaId' = ?", String.class, id);
        assertThat(payloads, hasSize(2));
        for (String payload : payloads) {
            for (String pessoal : List.of("Nome " + marcador, "111.222.333-44", "9" + marcador.substring(0, 4),
                    "email" + marcador, "13300-222", "Rua do Denunciante " + marcador, "Residencial" + marcador)) {
                assertThat(payload, not(containsString(pessoal)));
            }
        }
    }

    // ── Falha da auditoria: nega a entrega ───────────────

    @Test
    @DisplayName("[T26] se o INSERT da auditoria falha, detalhe e download respondem 500 sem os dados e nada fica gravado")
    void falhaNaAuditoriaNegaAEntrega() {
        String marcador = marcador();
        String id = criarSigilosaComDenunciante(marcador, true);
        String anexoId = anexar(id);
        // Gatilho temporario: recusa so a VISUALIZACAO desta ocorrencia, sem mock.
        jdbcTemplate.execute("""
                CREATE OR REPLACE FUNCTION t26_falhar_auditoria() RETURNS trigger AS $$
                BEGIN
                    IF NEW.acao = 'VISUALIZACAO' AND EXISTS (SELECT 1 FROM ocorrencia
                            WHERE id::text = NEW.payload_depois ->> 'ocorrenciaId' AND descricao LIKE '%s%%') THEN
                        RAISE EXCEPTION 'falha simulada na auditoria';
                    END IF;
                    RETURN NEW;
                END $$ LANGUAGE plpgsql
                """.formatted(MARCA_FALHA));
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS t26_falhar_auditoria ON auditoria_evento");
        jdbcTemplate.execute("CREATE TRIGGER t26_falhar_auditoria BEFORE INSERT ON auditoria_evento"
                + " FOR EACH ROW EXECUTE FUNCTION t26_falhar_auditoria()");
        try {
            Response detalhe = detalhe(tokenAdmin, id);
            detalhe.then().statusCode(500);
            assertThat(detalhe.asString(), not(containsString(marcador)));
            assertThat(detalhe.asString(), not(containsString("111.222.333-44")));

            Response download = baixar(tokenAgente, id, anexoId);
            download.then().statusCode(500);
            assertThat(download.contentType(), not(containsString("image/png")));
            assertThat(download.asByteArray(), not(equalTo(PNG)));
        } finally {
            jdbcTemplate.execute("DROP TRIGGER IF EXISTS t26_falhar_auditoria ON auditoria_evento");
            jdbcTemplate.execute("DROP FUNCTION IF EXISTS t26_falhar_auditoria()");
        }

        assertThat(eventosDaOcorrencia(id), equalTo(0));
    }

    // ── Entrega interrompida: evento compensatorio ───────

    @Test
    @DisplayName("[T26] ENTREGA_INTERROMPIDA e gravado em transacao propria, aponta o VISUALIZACAO e nao o altera")
    void entregaInterrompidaPersisteEApontaOEventoOriginal() throws Exception {
        String marcador = marcador();
        String id = criarSigilosaComDenunciante(marcador, false);
        UUID denuncianteId = denuncianteDe(id);
        UUID adminId = usuarioId(EMAIL_ADMIN);
        detalhe(tokenAdmin, id).then().statusCode(200);
        Map<String, Object> original = eventos("denunciante", denuncianteId, adminId).get(0);
        UUID eventoId = jdbcTemplate.queryForObject("SELECT id FROM auditoria_evento WHERE acao = 'VISUALIZACAO'"
                + " AND entidade_id = ?", UUID.class, denuncianteId);

        // O caminho do controller (escrita que falha) e coberto no
        // OcorrenciaControllerEntregaTest; aqui, a persistencia pelo bean real.
        ocorrenciaService.registrarEntregaInterrompida(
                new VisualizacaoAuditada(eventoId, "denunciante", denuncianteId, UUID.fromString(id)),
                new PermissoesOcorrencia(adminId, true, true));

        List<Map<String, Object>> eventos = eventos("denunciante", denuncianteId, adminId);
        assertThat(eventos, hasSize(2));
        assertThat(eventos.get(0), equalTo(original));
        Map<String, Object> compensacao = eventos.get(1);
        assertThat(compensacao.get("acao"), equalTo("ENTREGA_INTERROMPIDA"));
        assertThat(compensacao.get("antes"), nullValue());
        JsonNode payload = objectMapper.readTree((String) compensacao.get("depois"));
        assertThat(payload.size(), equalTo(2));
        assertThat(payload.get("ocorrenciaId").asString(), equalTo(id));
        assertThat(payload.get("eventoId").asString(), equalTo(eventoId.toString()));
        assertThat((String) compensacao.get("depois"), not(containsString(marcador)));
    }

    @Test
    @DisplayName("[T26] cliente que derruba a conexao (RST) no meio do download de 5 MB: VISUALIZACAO + ENTREGA_INTERROMPIDA")
    void downloadAbortadoPeloClienteGeraCompensacao() throws Exception {
        String id = criarSigilosaComDenunciante(marcador(), false);
        byte[] grande = new byte[5 * 1024 * 1024];
        System.arraycopy(PNG, 0, grande, 0, PNG.length);
        String anexoId = comToken(tokenAgente).multiPart("arquivo", "grande.png", grande, "image/png")
                .when().post(ROTA + "/" + id + "/anexos").then().statusCode(200).extract().path("id");
        UUID anexo = UUID.fromString(anexoId);

        // Buffer de recepcao minimo e nenhuma leitura: o servidor fica preso na
        // escrita dos 5 MB, e o RST (SO_LINGER 0) a faz falhar.
        try (Socket socket = new Socket()) {
            socket.setReceiveBufferSize(1024);
            socket.connect(new InetSocketAddress("localhost", porta), 5_000);
            socket.getOutputStream().write(("GET " + ROTA + "/" + id + "/anexos/" + anexoId + " HTTP/1.1\r\n"
                    + "Host: localhost\r\nAuthorization: Bearer " + tokenAdmin + "\r\nConnection: close\r\n\r\n")
                    .getBytes(StandardCharsets.US_ASCII));
            socket.getOutputStream().flush();
            aguardar(() -> contarAcao("VISUALIZACAO", anexo) == 1);
            socket.setSoLinger(true, 0);
        }

        aguardar(() -> contarAcao("ENTREGA_INTERROMPIDA", anexo) == 1);
        assertThat(contarAcao("VISUALIZACAO", anexo), equalTo(1));
    }

    // ── Apoio ────────────────────────────────────────────

    private Integer contarAcao(String acao, UUID entidadeId) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM auditoria_evento WHERE acao = ? AND entidade_id = ?",
                Integer.class, acao, entidadeId);
    }

    private Integer interrupcoesDaOcorrencia(String ocorrenciaId) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM auditoria_evento"
                + " WHERE acao = 'ENTREGA_INTERROMPIDA' AND payload_depois ->> 'ocorrenciaId' = ?",
                Integer.class, ocorrenciaId);
    }

    // Espera ate 15 s pela condicao (a escrita no servidor e assincrona ao teste).
    private static void aguardar(BooleanSupplier condicao) throws InterruptedException {
        long limite = System.nanoTime() + TimeUnit.SECONDS.toNanos(15);
        while (!condicao.getAsBoolean()) {
            if (System.nanoTime() > limite) {
                throw new AssertionError("condicao nao atingida em 15 s");
            }
            Thread.sleep(100);
        }
    }

    private static String marcador() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private String criarSigilosaComDenunciante(String marcador, boolean marcarFalha) {
        Map<String, Object> denunciante = new HashMap<>();
        denunciante.put("nome", "Nome " + marcador);
        denunciante.put("cpf", "111.222.333-44");
        denunciante.put("telefone", "(11) 9" + marcador.substring(0, 4) + "-0000");
        denunciante.put("email", "email" + marcador + "@exemplo.com");
        denunciante.put("cep", "13300-222");
        denunciante.put("endereco", "Rua do Denunciante " + marcador);
        denunciante.put("bairroResidencial", "Residencial" + marcador);
        return criarOcorrencia(true, denunciante, marcarFalha ? MARCA_FALHA + " " + marcador : null);
    }

    private String criarOcorrencia(boolean sigilosa, Map<String, Object> denunciante, String descricao) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "zoonose");
        corpo.put("dataAbertura", RelogioTesteConfig.HOJE.toString());
        corpo.put("endereco", "Rua da Ocorrencia, 10");
        corpo.put("bairro", "Centro");
        corpo.put("descricao", descricao == null ? "Ocorrencia da auditoria de sigilo" : descricao);
        corpo.put("sigilosa", sigilosa);
        if (denunciante != null) {
            corpo.put("denunciante", denunciante);
        }
        return comToken(tokenAgente).contentType(ContentType.JSON).body(corpo).when().post(ROTA)
                .then().statusCode(200).extract().path("id");
    }

    private String anexar(String id) {
        return comToken(tokenAgente).multiPart("arquivo", "foto.png", PNG, "image/png")
                .when().post(ROTA + "/" + id + "/anexos").then().statusCode(200).extract().path("id");
    }

    private Response detalhe(String token, String id) {
        return comToken(token).when().get(ROTA + "/" + id);
    }

    private Response baixar(String token, String id, String anexoId) {
        return comToken(token).when().get(ROTA + "/" + id + "/anexos/" + anexoId);
    }

    private RequestSpecification comToken(String token) {
        return given().header("Authorization", "Bearer " + token);
    }

    private UUID denuncianteDe(String ocorrenciaId) {
        return jdbcTemplate.queryForObject("SELECT id FROM denunciante WHERE ocorrencia_id = CAST(? AS uuid)",
                UUID.class, ocorrenciaId);
    }

    private UUID usuarioId(String email) {
        return jdbcTemplate.queryForObject("SELECT id FROM usuario WHERE email = ?", UUID.class, email);
    }

    // Eventos de uma entidade (todas as acoes), opcionalmente de um usuario.
    private List<Map<String, Object>> eventos(String entidade, UUID entidadeId, UUID usuarioId) {
        return jdbcTemplate.queryForList("SELECT acao, CAST(usuario_id AS varchar) AS usuario,"
                + " CAST(payload_antes AS text) AS antes, CAST(payload_depois AS text) AS depois"
                + " FROM auditoria_evento WHERE entidade = ? AND entidade_id = ?"
                + " AND (CAST(? AS uuid) IS NULL OR usuario_id = CAST(? AS uuid)) ORDER BY ocorreu_em",
                entidade, entidadeId, usuarioId, usuarioId);
    }

    // VISUALIZACAO ligadas a ocorrencia, pelas duas entidades auditadas.
    private Integer eventosDaOcorrencia(String ocorrenciaId) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM auditoria_evento"
                + " WHERE acao = 'VISUALIZACAO' AND payload_depois ->> 'ocorrenciaId' = ?", Integer.class, ocorrenciaId);
    }

    private long totalVisualizacoes() {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM auditoria_evento WHERE acao = 'VISUALIZACAO'",
                Long.class);
    }
}
