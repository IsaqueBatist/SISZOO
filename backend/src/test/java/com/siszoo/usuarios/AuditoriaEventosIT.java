package com.siszoo.usuarios;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.in;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.usuarios.entity.Usuario;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

// T43: camada de auditoria de eventos (DER §3.8). Toda verificacao le
// auditoria_evento por SQL depois da requisicao HTTP real (RestAssured, porta
// aleatoria): a transacao do servidor ja terminou, entao a linha lida e a que
// foi commitada. Os payloads sao comparados com a linha do negocio lida do
// banco, nao com o corpo enviado: o evento tem de registrar o estado gravado.
class AuditoriaEventosIT extends AbstractIntegrationTest {

    private static final Set<String> IPS_LOOPBACK = Set.of("127.0.0.1", "0:0:0:0:0:0:0:1");
    private static final String EMAIL_ADMIN = "admin.auditoria.eventos@itu.sp.gov.br";
    private static final String SENHA_PADRAO = "SenhaTeste123";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private String tokenAdmin;
    private UUID adminId;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin(EMAIL_ADMIN, "Eventos");
        adminId = usuarioId(EMAIL_ADMIN);
    }

    // ── CRIACAO / ATUALIZACAO / DESATIVACAO ──────────────

    @Test
    @DisplayName("[T43] criar, editar e excluir (soft-delete) baia: um evento por operacao, com autor, IP e o estado do banco")
    void baiaComEstadoDoBanco() throws Exception {
        String baiaId = comToken(tokenAdmin).contentType(ContentType.JSON)
                .body(corpoBaia("T43 Baia " + marcador(), (short) 3)).when().post("/api/baias")
                .then().statusCode(200).extract().path("id");
        Map<String, Object> criada = baiaNoBanco(baiaId);

        comToken(tokenAdmin).contentType(ContentType.JSON).body(corpoBaia("T43 Editada " + marcador(), (short) 9))
                .when().put("/api/baias/" + baiaId).then().statusCode(200);
        Map<String, Object> editada = baiaNoBanco(baiaId);

        comToken(tokenAdmin).when().delete("/api/baias/" + baiaId).then().statusCode(200);
        Map<String, Object> excluida = baiaNoBanco(baiaId);

        List<Map<String, Object>> eventos = eventos("baia", baiaId);
        assertThat(eventos.stream().map(e -> e.get("acao")).toList(),
                equalTo(List.of("CRIACAO", "ATUALIZACAO", "DESATIVACAO")));
        for (Map<String, Object> evento : eventos) {
            assertThat(evento.get("usuario_id"), equalTo(adminId));
            assertThat((String) evento.get("ip"), in(IPS_LOOPBACK));
            assertThat(evento.get("ocorreu_em"), notNullValue());
        }

        // CRIACAO: sem estado anterior; posterior = linha criada.
        assertThat(eventos.get(0).get("antes"), nullValue());
        assertMesmaBaia(json(eventos.get(0).get("depois")), criada);
        // ATUALIZACAO: anterior = o que estava gravado; posterior = o gravado depois.
        assertMesmaBaia(json(eventos.get(1).get("antes")), criada);
        assertMesmaBaia(json(eventos.get(1).get("depois")), editada);
        // DESATIVACAO (DELETE e soft-delete, DER §3.3): a linha continua
        // existindo, entao o posterior e a linha inativa, nao "inexistente".
        assertMesmaBaia(json(eventos.get(2).get("antes")), editada);
        assertMesmaBaia(json(eventos.get(2).get("depois")), excluida);
        assertThat(excluida.get("ativa"), equalTo(false));
    }

    @Test
    @DisplayName("[T43] operacao recusada pela regra de negocio (422) nao deixa evento nem altera o registro")
    void operacaoRecusadaNaoDeixaEvento() {
        String baiaId = comToken(tokenAdmin).contentType(ContentType.JSON)
                .body(corpoBaia("T43 Recusa " + marcador(), (short) 2)).when().post("/api/baias")
                .then().statusCode(200).extract().path("id");
        Map<String, Object> antes = baiaNoBanco(baiaId);

        Map<String, Object> invalido = corpoBaia("T43 Nao Gravada", (short) 5);
        invalido.put("tipoBaia", "inexistente");
        comToken(tokenAdmin).contentType(ContentType.JSON).body(invalido)
                .when().put("/api/baias/" + baiaId).then().statusCode(422);

        assertThat(eventos("baia", baiaId).stream().map(e -> e.get("acao")).toList(), equalTo(List.of("CRIACAO")));
        assertThat(baiaNoBanco(baiaId), equalTo(antes));
    }

    // ── IP ───────────────────────────────────────────────

    @Test
    @DisplayName("[T43] IP do evento e o do socket: X-Forwarded-For enviado pelo cliente e ignorado")
    void ipIgnoraXForwardedFor() {
        String baiaId = comToken(tokenAdmin).header("X-Forwarded-For", "203.0.113.9")
                .contentType(ContentType.JSON).body(corpoBaia("T43 IP " + marcador(), (short) 2))
                .when().post("/api/baias").then().statusCode(200).extract().path("id");

        List<Map<String, Object>> eventos = eventos("baia", baiaId);
        assertThat(eventos, hasSize(1));
        assertThat((String) eventos.get(0).get("ip"), in(IPS_LOOPBACK));
    }

    // ── Estado anterior em DESATIVACAO/REATIVACAO e ATUALIZACAO ──

    @Test
    @DisplayName("[T43] desativar e reativar usuario registram ativo antes/depois, com o admin como autor")
    void statusDeUsuarioComAntesEDepois() throws Exception {
        Usuario alvo = fixture.criarUsuarioSemCargo(emailUnico("status"), "Status", "Alvo");

        comToken(tokenAdmin).contentType(ContentType.JSON).body(Map.of("ativo", false))
                .when().patch("/api/usuarios/" + alvo.getId() + "/status").then().statusCode(200);
        comToken(tokenAdmin).contentType(ContentType.JSON).body(Map.of("ativo", true))
                .when().patch("/api/usuarios/" + alvo.getId() + "/status").then().statusCode(200);

        List<Map<String, Object>> eventos = eventos("usuario", alvo.getId().toString());
        assertThat(eventos.stream().map(e -> e.get("acao")).toList(), equalTo(List.of("DESATIVACAO", "REATIVACAO")));
        eventos.forEach(evento -> assertThat(evento.get("usuario_id"), equalTo(adminId)));
        assertThat(json(eventos.get(0).get("antes")), equalTo(objectMapper.readTree("{\"ativo\": true}")));
        assertThat(json(eventos.get(0).get("depois")), equalTo(objectMapper.readTree("{\"ativo\": false}")));
        assertThat(json(eventos.get(1).get("antes")), equalTo(objectMapper.readTree("{\"ativo\": false}")));
        assertThat(json(eventos.get(1).get("depois")), equalTo(objectMapper.readTree("{\"ativo\": true}")));
        assertThat(jdbcTemplate.queryForObject("SELECT ativo FROM usuario WHERE id = ?", Boolean.class, alvo.getId()),
                equalTo(true));
    }

    @Test
    @DisplayName("[T43] preferencias: a primeira gravacao e CRIACAO sem antes; a seguinte e ATUALIZACAO com o antes do banco")
    void preferenciasComEstadoDoBanco() throws Exception {
        String email = emailUnico("preferencias");
        String token = fixture.tokenComCargo(email, "Preferencias", "Eventos", ApiTesteFixture.CARGO_VETERINARIO_ID);
        UUID usuarioId = usuarioId(email);
        // A fixture cria o usuario sem passar pelo UsuarioService: sem linha de
        // preferencias ate a primeira gravacao.
        assertThat(preferenciasNoBanco(usuarioId), nullValue());

        comToken(token).contentType(ContentType.JSON).body(corpoPreferencias("DARK", "COMPACTO", false))
                .when().patch("/api/usuarios/me/preferencias").then().statusCode(200);
        Map<String, Object> primeira = preferenciasNoBanco(usuarioId);
        comToken(token).contentType(ContentType.JSON).body(corpoPreferencias("LIGHT", "CONFORTAVEL", true))
                .when().patch("/api/usuarios/me/preferencias").then().statusCode(200);
        Map<String, Object> segunda = preferenciasNoBanco(usuarioId);

        List<Map<String, Object>> eventos = eventos("preferencia_usuario", primeira.get("id").toString());
        assertThat(eventos.stream().map(e -> e.get("acao")).toList(), equalTo(List.of("CRIACAO", "ATUALIZACAO")));
        eventos.forEach(evento -> assertThat(evento.get("usuario_id"), equalTo(usuarioId)));
        assertThat(eventos.get(0).get("antes"), nullValue());
        assertMesmasPreferencias(json(eventos.get(0).get("depois")), primeira);
        assertMesmasPreferencias(json(eventos.get(1).get("antes")), primeira);
        assertMesmasPreferencias(json(eventos.get(1).get("depois")), segunda);
    }

    @Test
    @DisplayName("[T43] troca de senha registra so senhaAlteradaEm antes/depois, igual ao gravado, sem senha nem hash")
    void trocaDeSenhaSemSegredos() throws Exception {
        String email = emailUnico("senha");
        String token = fixture.tokenComCargo(email, "Senha", "Eventos", ApiTesteFixture.CARGO_VETERINARIO_ID);
        UUID usuarioId = usuarioId(email);
        String novaSenha = "NovaSenhaT43-" + marcador();

        for (int i = 0; i < 2; i++) {
            comToken(token).contentType(ContentType.JSON)
                    .body(Map.of("novaSenha", novaSenha + i, "confirmarSenha", novaSenha + i))
                    .when().post("/api/auth/senha").then().statusCode(204);
        }
        LocalDateTime gravada = jdbcTemplate.queryForObject("SELECT senha_alterada_em FROM usuario WHERE id = ?",
                Timestamp.class, usuarioId).toLocalDateTime();
        String hash = jdbcTemplate.queryForObject("SELECT senha FROM usuario WHERE id = ?", String.class, usuarioId);

        List<Map<String, Object>> trocas = eventos("usuario", usuarioId.toString()).stream()
                .filter(e -> "ATUALIZACAO".equals(e.get("acao"))).toList();
        assertThat(trocas, hasSize(2));
        JsonNode primeiraDepois = json(trocas.get(0).get("depois"));
        // Primeira troca: nunca tinha trocado (antes nulo). Segunda: o antes e
        // o depois da primeira, e o depois e exatamente o valor gravado.
        assertThat(json(trocas.get(0).get("antes")), equalTo(objectMapper.readTree("{\"senhaAlteradaEm\": null}")));
        assertThat(json(trocas.get(1).get("antes")), equalTo(primeiraDepois));
        JsonNode segundaDepois = json(trocas.get(1).get("depois"));
        assertThat(segundaDepois.size() == 1 && segundaDepois.has("senhaAlteradaEm"), equalTo(true));
        assertThat(LocalDateTime.parse(segundaDepois.get("senhaAlteradaEm").asString()), equalTo(gravada));
        for (Map<String, Object> troca : trocas) {
            String linha = troca.toString();
            assertThat(linha, not(containsString(novaSenha)));
            assertThat(linha, not(containsString(hash)));
            assertThat(linha, not(containsString("$2a$")));
        }
    }

    // ── LOGIN ────────────────────────────────────────────

    @Test
    @DisplayName("[T43] login bem-sucedido gera exatamente um LOGIN, com IP e sem senha, hash nem token")
    void loginUmEventoSemSegredos() {
        String email = emailUnico("login");
        Usuario usuario = fixture.criarUsuarioSemCargo(email, "Login", "Eventos");

        Response resposta = given().contentType(ContentType.JSON)
                .body(Map.of("email", email, "senha", SENHA_PADRAO)).when().post("/api/auth/login");
        resposta.then().statusCode(200);
        String token = resposta.path("token");

        List<Map<String, Object>> eventos = eventos("usuario", usuario.getId().toString());
        assertThat(eventos, hasSize(1));
        Map<String, Object> login = eventos.get(0);
        assertThat(login.get("acao"), equalTo("LOGIN"));
        assertThat(login.get("usuario_id"), equalTo(usuario.getId()));
        assertThat((String) login.get("ip"), in(IPS_LOOPBACK));
        assertThat(login.get("antes"), nullValue());
        assertThat(login.get("depois"), nullValue());
        String linha = linhaCompleta(usuario.getId());
        assertThat(linha, not(containsString(token)));
        assertThat(linha, not(containsString(SENHA_PADRAO)));
        assertThat(linha, not(containsString(usuario.getSenha())));
    }

    @Test
    @DisplayName("[T43] login recusado (senha errada ou usuario inativo) nao gera evento (fora do escopo aprovado)")
    void loginRecusadoNaoGeraEvento() {
        String email = emailUnico("recusado");
        Usuario usuario = fixture.criarUsuarioSemCargo(email, "Recusado", "Eventos");

        given().contentType(ContentType.JSON).body(Map.of("email", email, "senha", "SenhaErrada123"))
                .when().post("/api/auth/login").then().statusCode(401);
        jdbcTemplate.update("UPDATE usuario SET ativo = false WHERE id = ?", usuario.getId());
        given().contentType(ContentType.JSON).body(Map.of("email", email, "senha", SENHA_PADRAO))
                .when().post("/api/auth/login").then().statusCode(401);

        assertThat(eventos("usuario", usuario.getId().toString()), hasSize(0));
    }

    // ── EXPORTACAO ───────────────────────────────────────

    @Test
    @DisplayName("[T43] exportar CSV e PDF gera EXPORTACAO ligada ao relatorio_gerado, com o contexto e sem o conteudo")
    void exportacaoGeraEventoSemConteudo() throws Exception {
        for (String formato : List.of("csv", "pdf")) {
            byte[] arquivo = comToken(tokenAdmin).contentType(ContentType.JSON).body(corpoExportacao(formato))
                    .when().post("/api/relatorios/exportar").then().statusCode(200).extract().asByteArray();
            Map<String, Object> registro = jdbcTemplate.queryForMap("SELECT id, doc_id, tamanho_bytes"
                    + " FROM relatorio_gerado WHERE gerado_por_id = ? ORDER BY gerado_em DESC, doc_id DESC LIMIT 1",
                    adminId);

            List<Map<String, Object>> eventos = eventos("relatorio_gerado", registro.get("id").toString());
            assertThat(eventos, hasSize(1));
            Map<String, Object> evento = eventos.get(0);
            assertThat(evento.get("acao"), equalTo("EXPORTACAO"));
            assertThat(evento.get("usuario_id"), equalTo(adminId));
            assertThat((String) evento.get("ip"), in(IPS_LOOPBACK));
            assertThat(evento.get("antes"), nullValue());
            JsonNode depois = json(evento.get("depois"));
            assertThat(depois, equalTo(objectMapper.readTree("""
                    {"docId": "%s", "tipoRelatorio": "vacinacao", "formato": "%s", "periodoInicio": "2026-01-01",
                     "periodoFim": "2026-09-10", "tamanhoBytes": %d}
                    """.formatted(registro.get("doc_id"), formato, arquivo.length))));
            assertThat(registro.get("tamanho_bytes"), equalTo(arquivo.length));
        }
    }

    @Test
    @DisplayName("[T43] exportacao recusada (formato invalido, 422) nao deixa EXPORTACAO nem relatorio_gerado")
    void exportacaoRecusadaNaoDeixaEvento() {
        long relatoriosAntes = relatoriosDe(adminId);
        long exportacoesAntes = exportacoesDe(adminId);

        comToken(tokenAdmin).contentType(ContentType.JSON).body(corpoExportacao("xlsx"))
                .when().post("/api/relatorios/exportar").then().statusCode(422);

        assertThat(relatoriosDe(adminId), equalTo(relatoriosAntes));
        assertThat(exportacoesDe(adminId), equalTo(exportacoesAntes));
    }

    @Test
    @DisplayName("[T43] se o INSERT da EXPORTACAO falha, a resposta e 500 sem o arquivo e nada fica gravado")
    void falhaNaAuditoriaDaExportacaoImpedeAEntrega() {
        String email = "admin.falha.exportacao@itu.sp.gov.br";
        String token = fixture.tokenAdmin(email, "FalhaExportacao");
        UUID usuarioId = usuarioId(email);
        long relatoriosAntes = relatoriosDe(usuarioId);
        // Gatilho temporario: recusa so a EXPORTACAO deste usuario, sem mock.
        jdbcTemplate.execute("""
                CREATE OR REPLACE FUNCTION t43_falhar_exportacao() RETURNS trigger AS $$
                BEGIN
                    IF NEW.acao = 'EXPORTACAO' AND NEW.usuario_id = '%s' THEN
                        RAISE EXCEPTION 'falha simulada na auditoria';
                    END IF;
                    RETURN NEW;
                END $$ LANGUAGE plpgsql
                """.formatted(usuarioId));
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS t43_falhar_exportacao ON auditoria_evento");
        jdbcTemplate.execute("CREATE TRIGGER t43_falhar_exportacao BEFORE INSERT ON auditoria_evento"
                + " FOR EACH ROW EXECUTE FUNCTION t43_falhar_exportacao()");
        try {
            for (String formato : List.of("csv", "pdf")) {
                Response resposta = comToken(token).contentType(ContentType.JSON).body(corpoExportacao(formato))
                        .when().post("/api/relatorios/exportar");
                resposta.then().statusCode(500);
                assertThat(resposta.header("Content-Disposition"), nullValue());
                assertThat(resposta.contentType(), not(containsString("text/csv")));
                assertThat(resposta.contentType(), not(containsString("application/pdf")));
                String corpo = new String(resposta.asByteArray(), StandardCharsets.UTF_8);
                assertThat(corpo, not(containsString("%PDF")));
                assertThat(corpo, not(containsString("Vacina;")));
            }
        } finally {
            jdbcTemplate.execute("DROP TRIGGER IF EXISTS t43_falhar_exportacao ON auditoria_evento");
            jdbcTemplate.execute("DROP FUNCTION IF EXISTS t43_falhar_exportacao()");
        }

        assertThat(relatoriosDe(usuarioId), equalTo(relatoriosAntes));
        assertThat(exportacoesDe(usuarioId), equalTo(0L));
    }

    // ── Apoio ────────────────────────────────────────────

    private static String marcador() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    // O login exige e-mail so com letras e pontos (LoginRequest): o sufixo
    // aleatorio vira letras.
    private static String emailUnico(String prefixo) {
        String letras = marcador().chars().mapToObj(c -> String.valueOf((char) ('a' + c % 26)))
                .reduce("", String::concat);
        return "t." + prefixo + "." + letras + "@itu.sp.gov.br";
    }

    private RequestSpecification comToken(String token) {
        return given().header("Authorization", "Bearer " + token);
    }

    private UUID usuarioId(String email) {
        return jdbcTemplate.queryForObject("SELECT id FROM usuario WHERE email = ?", UUID.class, email);
    }

    private static Map<String, Object> corpoBaia(String nome, short capacidade) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("nome", nome);
        corpo.put("tipoBaia", "interna");
        corpo.put("capacidade", capacidade);
        corpo.put("finalidade", "Auditoria T43");
        return corpo;
    }

    private static Map<String, Object> corpoPreferencias(String tema, String densidade, boolean flags) {
        return Map.of("tema", tema, "densidade", densidade, "notifAlertasCriticos", true,
                "notifVacinaVencendo", flags, "notifSuperlotacao", !flags, "notifResultadoLab", flags,
                "notifEmailDiario", !flags);
    }

    private static Map<String, Object> corpoExportacao(String formato) {
        return Map.of("tipo", "vacinacao", "periodoInicio", "2026-01-01", "periodoFim", "2026-09-10",
                "formato", formato);
    }

    private Map<String, Object> baiaNoBanco(String baiaId) {
        return jdbcTemplate.queryForMap("SELECT b.nome, t.codigo AS tipo, b.capacidade, b.finalidade, b.ativa,"
                + " b.observacoes FROM baia b JOIN tipo_baia t ON t.id = b.tipo_baia_id WHERE b.id = CAST(? AS uuid)",
                baiaId);
    }

    private void assertMesmaBaia(JsonNode payload, Map<String, Object> linha) {
        assertThat(payload.get("nome").asString(), equalTo(linha.get("nome")));
        assertThat(payload.get("tipoBaiaCodigo").asString(), equalTo(linha.get("tipo")));
        assertThat(payload.get("capacidade").asInt(), equalTo(((Number) linha.get("capacidade")).intValue()));
        assertThat(payload.get("finalidade").asString(), equalTo(linha.get("finalidade")));
        assertThat(payload.get("ativa").asBoolean(), equalTo(linha.get("ativa")));
    }

    private Map<String, Object> preferenciasNoBanco(UUID usuarioId) {
        List<Map<String, Object>> linhas = jdbcTemplate.queryForList("SELECT id, tema, densidade,"
                + " notif_alertas_criticos, notif_vacina_vencendo, notif_superlotacao, notif_resultado_lab,"
                + " notif_email_diario FROM preferencia_usuario WHERE usuario_id = ?", usuarioId);
        return linhas.isEmpty() ? null : linhas.get(0);
    }

    private void assertMesmasPreferencias(JsonNode payload, Map<String, Object> linha) {
        assertThat(payload.get("tema").asString(), equalTo(linha.get("tema")));
        assertThat(payload.get("densidade").asString(), equalTo(linha.get("densidade")));
        assertThat(payload.get("notifAlertasCriticos").asBoolean(), equalTo(linha.get("notif_alertas_criticos")));
        assertThat(payload.get("notifVacinaVencendo").asBoolean(), equalTo(linha.get("notif_vacina_vencendo")));
        assertThat(payload.get("notifSuperlotacao").asBoolean(), equalTo(linha.get("notif_superlotacao")));
        assertThat(payload.get("notifResultadoLab").asBoolean(), equalTo(linha.get("notif_resultado_lab")));
        assertThat(payload.get("notifEmailDiario").asBoolean(), equalTo(linha.get("notif_email_diario")));
    }

    private long relatoriosDe(UUID usuarioId) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM relatorio_gerado WHERE gerado_por_id = ?", Long.class,
                usuarioId);
    }

    private long exportacoesDe(UUID usuarioId) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM auditoria_evento WHERE acao = 'EXPORTACAO'"
                + " AND usuario_id = ?", Long.class, usuarioId);
    }

    private JsonNode json(Object payload) {
        return objectMapper.readTree((String) payload);
    }

    // Eventos de um registro, na ordem em que ocorreram.
    private List<Map<String, Object>> eventos(String entidade, String entidadeId) {
        return jdbcTemplate.queryForList("SELECT acao, usuario_id, ip, ocorreu_em, payload_antes::text AS antes,"
                + " payload_depois::text AS depois FROM auditoria_evento"
                + " WHERE entidade = ? AND entidade_id = CAST(? AS uuid) ORDER BY ocorreu_em, id", entidade, entidadeId);
    }

    // Todos os eventos do usuario como texto (todas as colunas).
    private String linhaCompleta(UUID usuarioId) {
        return String.join("\n", jdbcTemplate.queryForList("SELECT CAST(to_jsonb(e) AS text) FROM auditoria_evento e"
                + " WHERE usuario_id = ? OR entidade_id = ?", String.class, usuarioId, usuarioId));
    }
}
