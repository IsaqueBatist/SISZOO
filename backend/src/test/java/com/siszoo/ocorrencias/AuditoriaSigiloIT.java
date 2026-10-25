package com.siszoo.ocorrencias;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.in;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private static final Set<String> IPS_LOOPBACK = Set.of("127.0.0.1", "0:0:0:0:0:0:0:1");

    private static final String EMAIL_ADMIN = "admin.sigilo@itu.sp.gov.br";
    private static final String EMAIL_AGENTE = "agente.sigilo@itu.sp.gov.br";
    private static final String EMAIL_LEITOR = "leitor.sigilo@itu.sp.gov.br";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

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
        tokenLeitor = fixture.tokenLeitorOcorrencias(EMAIL_LEITOR, "Sigilo");
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
    }

    // T43: o 403 do Vet vem da permissao do modulo (PreAutorizacaoInterceptor),
    // nao da regra de sigilo — ele e barrado em toda ocorrencia, sigilosa ou
    // nao. Por decisao, nao gera ACESSO_NEGADO.
    @Test
    @DisplayName("[T26/T43] Vet no detalhe e no download de sigilosa: 403 de acesso ao modulo (V11), nenhum dado, zero eventos")
    void vetRecebe403SemEvento() {
        String marcador = marcador();
        String id = criarSigilosaComDenunciante(marcador, false);
        String anexoId = anexar(id);

        Response detalhe = detalhe(tokenVet, id);
        detalhe.then().statusCode(403);
        assertThat(detalhe.asString(), not(containsString(marcador)));
        baixar(tokenVet, id, anexoId).then().statusCode(403);

        assertThat(eventosDaOcorrencia(id), equalTo(0));
        assertThat(acessosNegados(id), equalTo(0));
    }

    // T43 (revisa a T26-7): a recusa pela regra de sigilo passa a ser auditada.
    // O 403 e o detalhe mascarado nao mudam; o evento e commitado mesmo com o
    // 403 (noRollbackFor) e nao leva nenhum dado pessoal.
    @Test
    @DisplayName("[T43] leitor sem denunciante_sigiloso: detalhe mascarado e download 403, um ACESSO_NEGADO cada,"
            + " nenhum VISUALIZACAO")
    void leitorSemAPermissaoGeraAcessoNegado() throws Exception {
        String marcador = marcador();
        String id = criarSigilosaComDenunciante(marcador, false);
        String anexoId = anexar(id);
        UUID denuncianteId = denuncianteDe(id);
        UUID leitorId = usuarioId(EMAIL_LEITOR);

        Response detalhe = detalhe(tokenLeitor, id);
        detalhe.then().statusCode(200);
        assertThat(detalhe.path("denunciante.nome"), nullValue());
        assertThat(detalhe.path("podeVerDenunciante"), equalTo(false));
        assertThat(detalhe.asString(), not(containsString(marcador)));
        Response download = baixar(tokenLeitor, id, anexoId);
        download.then().statusCode(403);
        assertThat(objectMapper.readTree(download.asString()), equalTo(objectMapper.readTree("{\"mensagem\":\"Acesso negado\"}")));

        assertThat(eventosDaOcorrencia(id), equalTo(0));
        List<Map<String, Object>> negados = new ArrayList<>(eventos("denunciante", denuncianteId, leitorId));
        negados.addAll(eventos("anexo_ocorrencia", UUID.fromString(anexoId), leitorId));
        assertThat(negados, hasSize(2));
        for (Map<String, Object> evento : negados) {
            assertThat(evento.get("acao"), equalTo("ACESSO_NEGADO"));
            assertThat(evento.get("antes"), nullValue());
            assertThat((String) evento.get("ip"), in(IPS_LOOPBACK));
            JsonNode payload = objectMapper.readTree((String) evento.get("depois"));
            assertThat(payload.size() == 1 && payload.has("ocorrenciaId"), equalTo(true));
            assertThat(payload.get("ocorrenciaId").asString(), equalTo(id));
            assertSemDadoPessoal((String) evento.get("depois"), marcador);
        }
        assertThat(acessosNegados(id), equalTo(2));
    }

    @Test
    @DisplayName("[T43] se o INSERT do ACESSO_NEGADO falha (erro generico ou violacao de integridade), detalhe e"
            + " download respondem 500 sem dado e nada fica gravado")
    void falhaNaAuditoriaDoAcessoNegadoResponde500() {
        for (String erro : List.of("RAISE EXCEPTION 'falha simulada na auditoria'",
                "RAISE EXCEPTION 'falha simulada na auditoria' USING ERRCODE = 'check_violation'")) {
            String marcador = marcador();
            String id = criarSigilosaComDenunciante(marcador, true);
            String anexoId = anexar(id);
            // Gatilho temporario: recusa so o ACESSO_NEGADO desta ocorrencia. A
            // violacao de integridade (23514) cairia no handler generico (409)
            // sem a FalhaAuditoriaException; aqui tem de ser 500 nos dois casos.
            jdbcTemplate.execute("""
                    CREATE OR REPLACE FUNCTION t43_falhar_acesso_negado() RETURNS trigger AS $$
                    BEGIN
                        IF NEW.acao = 'ACESSO_NEGADO' AND EXISTS (SELECT 1 FROM ocorrencia
                                WHERE id::text = NEW.payload_depois ->> 'ocorrenciaId' AND descricao LIKE '%s%%') THEN
                            %s;
                        END IF;
                        RETURN NEW;
                    END $$ LANGUAGE plpgsql
                    """.formatted(MARCA_FALHA, erro));
            jdbcTemplate.execute("DROP TRIGGER IF EXISTS t43_falhar_acesso_negado ON auditoria_evento");
            jdbcTemplate.execute("CREATE TRIGGER t43_falhar_acesso_negado BEFORE INSERT ON auditoria_evento"
                    + " FOR EACH ROW EXECUTE FUNCTION t43_falhar_acesso_negado()");
            try {
                Response detalhe = detalhe(tokenLeitor, id);
                detalhe.then().statusCode(500);
                assertThat(detalhe.asString(), not(containsString(marcador)));
                assertThat(detalhe.asString(), not(containsString("111.222.333-44")));
                assertThat(detalhe.asString(), not(containsString("falha simulada")));

                Response download = baixar(tokenLeitor, id, anexoId);
                download.then().statusCode(500);
                assertThat(download.contentType(), not(containsString("image/png")));
                assertThat(download.asByteArray(), not(equalTo(PNG)));
                assertThat(download.asString(), not(containsString("falha simulada")));
            } finally {
                jdbcTemplate.execute("DROP TRIGGER IF EXISTS t43_falhar_acesso_negado ON auditoria_evento");
                jdbcTemplate.execute("DROP FUNCTION IF EXISTS t43_falhar_acesso_negado()");
            }

            assertThat(acessosNegados(id), equalTo(0));
        }
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
    @DisplayName("[T26/T43] sigilosa sem denunciante cadastrado: detalhe nao entrega dado pessoal e nao gera evento"
            + " (nem VISUALIZACAO, nem ACESSO_NEGADO)")
    void sigilosaSemDenuncianteNaoGeraEvento() {
        String id = criarOcorrencia(true, null, null);

        for (String token : List.of(tokenAdmin, tokenLeitor)) {
            Response resposta = detalhe(token, id);
            resposta.then().statusCode(200);
            assertThat(resposta.path("denunciante"), nullValue());
        }

        assertThat(eventosDaOcorrencia(id), equalTo(0));
        assertThat(acessosNegados(id), equalTo(0));
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
    @DisplayName("[T26/T43] ocorrencia ou anexo inexistentes: 404 e zero eventos, inclusive para o leitor sem a permissao")
    void inexistenteNaoGeraEvento() {
        String id = criarSigilosaComDenunciante(marcador(), false);
        long antes = totalVisualizacoes();
        long negadosAntes = totalAcessosNegados();

        for (String token : List.of(tokenAdmin, tokenLeitor)) {
            comToken(token).when().get(ROTA + "/" + UUID.randomUUID()).then().statusCode(404);
            baixar(token, id, UUID.randomUUID().toString()).then().statusCode(404);
        }

        assertThat(totalVisualizacoes(), equalTo(antes));
        assertThat(totalAcessosNegados(), equalTo(negadosAntes));
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
            assertSemDadoPessoal(payload, marcador);
        }
    }

    private static void assertSemDadoPessoal(String texto, String marcador) {
        for (String pessoal : List.of("Nome " + marcador, "111.222.333-44", "9" + marcador.substring(0, 4),
                "email" + marcador, "13300-222", "Rua do Denunciante " + marcador, "Residencial" + marcador)) {
            assertThat(texto, not(containsString(pessoal)));
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

    // ── Respostas de mutacao (A04) ───────────────────────
    // Edicao, status, encerramento, notas e vinculo devolvem o denunciante de
    // sigilosa mascarado ate para o Administrador, sem VISUALIZACAO: o dado
    // completo so sai pelo detalhe, que registra o acesso.

    @Test
    @DisplayName("[A04] PUT de sigilosa pelo Admin: resposta mascarada e nenhum VISUALIZACAO")
    void edicaoDevolveDenuncianteMascarado() {
        String marcador = marcador();
        String id = criarSigilosaComDenunciante(marcador, false);
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "zoonose");
        corpo.put("dataAbertura", RelogioTesteConfig.HOJE.toString());
        corpo.put("endereco", "Rua da Ocorrencia, 10");
        corpo.put("bairro", "Centro");
        corpo.put("descricao", "Descricao revisada");
        corpo.put("urgente", false);
        corpo.put("sigilosa", true);
        corpo.put("anonima", false);

        Response resposta = comToken(tokenAdmin).contentType(ContentType.JSON).body(corpo)
                .when().put(ROTA + "/" + id);

        assertMascaradaSemVisualizacao(resposta, marcador, id);
    }

    @Test
    @DisplayName("[A04] PATCH de status de sigilosa pelo Admin: resposta mascarada e nenhum VISUALIZACAO")
    void mudancaDeStatusDevolveDenuncianteMascarado() {
        String marcador = marcador();
        String id = criarSigilosaComDenunciante(marcador, false);

        Response resposta = comToken(tokenAdmin).contentType(ContentType.JSON)
                .body(Map.of("status", "EM_ATENDIMENTO")).when().patch(ROTA + "/" + id + "/status");

        assertMascaradaSemVisualizacao(resposta, marcador, id);
    }

    @Test
    @DisplayName("[A04] encerramento de sigilosa pelo Admin: resposta mascarada e nenhum VISUALIZACAO")
    void encerramentoDevolveDenuncianteMascarado() {
        String marcador = marcador();
        String id = criarSigilosaComDenunciante(marcador, false);

        Response resposta = comToken(tokenAdmin).contentType(ContentType.JSON)
                .body(Map.of("providenciaTomada", "sem_acao")).when().post(ROTA + "/" + id + "/encerramento");

        assertMascaradaSemVisualizacao(resposta, marcador, id);
    }

    @Test
    @DisplayName("[A04/T43] nota em sigilosa pelo Admin: resposta mascarada, nenhum VISUALIZACAO e um CRIACAO da"
            + " movimentacao sem o texto da nota")
    void notaDevolveDenuncianteMascarado() throws Exception {
        String marcador = marcador();
        String id = criarSigilosaComDenunciante(marcador, false);
        // Marcador proprio: o texto da nota sai (corretamente) na timeline da
        // resposta, que nao pode conter o marcador do denunciante.
        String texto = "Nota interna " + marcador();

        Response resposta = comToken(tokenAdmin).contentType(ContentType.JSON)
                .body(Map.of("descricao", texto)).when().post(ROTA + "/" + id + "/notas");

        assertMascaradaSemVisualizacao(resposta, marcador, id);
        UUID notaId = jdbcTemplate.queryForObject("SELECT id FROM movimentacao_ocorrencia"
                + " WHERE ocorrencia_id = CAST(? AS uuid) AND tipo_movimentacao = 'NOTA_INTERNA'", UUID.class, id);
        List<Map<String, Object>> eventos = eventos("movimentacao_ocorrencia", notaId, usuarioId(EMAIL_ADMIN));
        assertThat(eventos, hasSize(1));
        assertThat(eventos.get(0).get("acao"), equalTo("CRIACAO"));
        assertThat(eventos.get(0).get("antes"), nullValue());
        assertThat(objectMapper.readTree((String) eventos.get(0).get("depois")), equalTo(objectMapper.readTree(
                "{\"ocorrenciaId\": \"%s\", \"tipoMovimentacao\": \"NOTA_INTERNA\"}".formatted(id))));
        assertThat((String) eventos.get(0).get("depois"), not(containsString(texto)));
    }

    @Test
    @DisplayName("[A04] vinculo de processo a sigilosa pelo Admin: resposta mascarada e nenhum VISUALIZACAO")
    void vinculoDevolveDenuncianteMascarado() {
        String marcador = marcador();
        String id = criarSigilosaComDenunciante(marcador, false);
        String processoId = fixture.postarProcesso(tokenAdmin, null, false).then().statusCode(200).extract().path("id");

        Response resposta = comToken(tokenAdmin).contentType(ContentType.JSON)
                .body(Map.of("processoId", processoId)).when().post(ROTA + "/" + id + "/processo");

        assertMascaradaSemVisualizacao(resposta, marcador, id);
    }

    // A mutacao teve efeito (200), nao entregou nenhum dado pessoal nem gerou
    // VISUALIZACAO; o detalhe continua entregando o dado ao Admin (D6 intacta).
    private void assertMascaradaSemVisualizacao(Response resposta, String marcador, String id) {
        resposta.then().statusCode(200);
        assertThat(resposta.path("denunciante.nome"), nullValue());
        assertThat(resposta.path("denunciante.cpf"), nullValue());
        assertThat(resposta.path("podeVerDenunciante"), equalTo(true));
        assertThat(resposta.asString(), not(containsString(marcador)));
        assertThat(resposta.asString(), not(containsString("111.222.333-44")));
        assertThat(eventosDaOcorrencia(id), equalTo(0));

        assertThat(detalhe(tokenAdmin, id).path("denunciante.nome"), equalTo("Nome " + marcador));
        assertThat(eventosDaOcorrencia(id), equalTo(1));
    }

    // ── Apoio ────────────────────────────────────────────

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
        return jdbcTemplate.queryForList("SELECT acao, CAST(usuario_id AS varchar) AS usuario, ip,"
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

    // T43: ACESSO_NEGADO ligados a ocorrencia, pelas duas entidades auditadas.
    private Integer acessosNegados(String ocorrenciaId) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM auditoria_evento"
                + " WHERE acao = 'ACESSO_NEGADO' AND payload_depois ->> 'ocorrenciaId' = ?", Integer.class, ocorrenciaId);
    }

    private long totalAcessosNegados() {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM auditoria_evento WHERE acao = 'ACESSO_NEGADO'",
                Long.class);
    }
}
