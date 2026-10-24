package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.UUID;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.usuarios.entity.AcaoAuditoria;

// Exercita a V27 (T43) num schema proprio do mesmo PostgreSQL de teste, no
// padrao de MigracaoV12AuditoriaIT e MigracaoV17RegistrosCriticosIT: acao
// ACESSO_NEGADO no CHECK e auditoria_evento imutavel (UPDATE/DELETE/TRUNCATE
// recusados com 23514), com a unica excecao do ON DELETE SET NULL da FK do
// usuario. Cada comando roda numa transacao JDBC propria; o erro devolvido
// traz o SQLSTATE e a mensagem.
class MigracaoV27AuditoriaIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v27";
    private static final String S = SCHEMA + ".";
    private static final List<String> ACOES_ANTERIORES = List.of("CRIACAO", "ATUALIZACAO", "DESATIVACAO",
            "REATIVACAO", "LOGIN", "LOGOUT", "EXPORTACAO", "ENCERRAMENTO", "VISUALIZACAO");
    private static final String RECUSA = "não pode ser alterado nem excluído";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void removerSchemaDoTeste() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    // ── Acao ACESSO_NEGADO ───────────────────────────────

    @Test
    @DisplayName("[T43] V27 aplica do zero sobre V1-V26 e aceita ACESSO_NEGADO")
    void v27DeveAplicarDoZero() {
        MigrateResult resultado = migrarAte("27");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.targetSchemaVersion, equalTo("27"));
        inserirEvento("ACESSO_NEGADO", null);
    }

    @Test
    @DisplayName("[T43] V27 sobre V26 preserva os eventos existentes e aceita as 9 acoes anteriores e ACESSO_NEGADO")
    void v27DevePreservarEventosEAceitarAcoes() {
        migrarAte("26");
        for (String acao : ACOES_ANTERIORES) {
            inserirEvento(acao, null);
        }
        // Antes da V27 a nova acao e recusada pelo CHECK da V12.
        assertThrows(DataIntegrityViolationException.class, () -> inserirEvento("ACESSO_NEGADO", null));

        MigrateResult resultado = migrarAte("27");

        assertThat(resultado.success, equalTo(true));
        assertThat(contarEventos(), equalTo(ACOES_ANTERIORES.size()));
        for (String acao : ACOES_ANTERIORES) {
            inserirEvento(acao, null);
        }
        inserirEvento("ACESSO_NEGADO", null);
    }

    @Test
    @DisplayName("[T43] V27 continua recusando acao invalida (inclusive em minusculas)")
    void v27DeveRecusarAcaoInvalida() {
        migrarAte("27");

        for (String invalida : List.of("NEGADO", "acesso_negado", "")) {
            DataIntegrityViolationException erro =
                    assertThrows(DataIntegrityViolationException.class, () -> inserirEvento(invalida, null));
            assertThat(erro.getMessage(), containsString("ck_auditoria_evento_acao"));
        }
    }

    // Na versao mais recente (nao so na V27): quem acrescentar um valor ao enum
    // sem migration que o aceite quebra este teste.
    @Test
    @DisplayName("[T43] todo valor de AcaoAuditoria e aceito pelo CHECK da versao mais recente")
    void enumECheckAlinhados() {
        migrarAte(MigrationVersion.LATEST);

        for (AcaoAuditoria acao : AcaoAuditoria.values()) {
            inserirEvento(acao.name(), null);
        }
    }

    // ── Imutabilidade ────────────────────────────────────

    @Test
    @DisplayName("[T43] V27 cria os triggers de UPDATE/DELETE (linha) e TRUNCATE (comando) em auditoria_evento")
    void v27CriaOsTriggers() {
        migrarAte("27");

        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid"
                + " JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = ? AND c.relname = 'auditoria_evento'"
                + " AND t.tgname IN ('tg_auditoria_evento_imutavel', 'tg_auditoria_evento_sem_truncate')",
                Integer.class, SCHEMA), equalTo(2));
    }

    @Test
    @DisplayName("[T43] UPDATE de qualquer coluna do evento e recusado com 23514 e nada muda")
    void updateRecusado() throws Exception {
        migrarAte("27");
        UUID usuario = inserirUsuario();
        UUID evento = inserirEvento("CRIACAO", usuario);
        String original = linha(evento);

        for (String alteracao : List.of(
                "payload_depois = '{\"nome\": \"adulterado\"}'::jsonb",
                "payload_antes = '{}'::jsonb",
                "ip = '203.0.113.9'",
                "acao = 'ATUALIZACAO'",
                "entidade = 'outra'",
                "entidade_id = gen_random_uuid()",
                "ocorreu_em = ocorreu_em - interval '1 day'",
                "usuario_id = usuario_id")) {
            assertViolacao(transacao("UPDATE " + S + "auditoria_evento SET " + alteracao + " WHERE id = '" + evento + "'"),
                    RECUSA);
        }
        assertThat(linha(evento), equalTo(original));
    }

    @Test
    @DisplayName("[T43] usuario_id -> NULL por SQL direto e recusado, sozinho ou com outra coluna, com o usuario existente")
    void setNullDiretoRecusado() throws Exception {
        migrarAte("27");
        UUID usuario = inserirUsuario();
        UUID evento = inserirEvento("LOGIN", usuario);

        assertViolacao(transacao("UPDATE " + S + "auditoria_evento SET usuario_id = NULL WHERE id = '" + evento + "'"),
                RECUSA);
        assertViolacao(transacao("UPDATE " + S + "auditoria_evento SET usuario_id = NULL, ip = '203.0.113.9'"
                + " WHERE id = '" + evento + "'"), RECUSA);
        assertThat(usuarioDoEvento(evento), equalTo(usuario));
    }

    @Test
    @DisplayName("[T43] excluir o usuario poe usuario_id em NULL (ON DELETE SET NULL) sem alterar mais nada do evento")
    void exclusaoDoUsuarioContinuaPondoNulo() throws Exception {
        migrarAte("27");
        UUID usuario = inserirUsuario();
        UUID evento = inserirEvento("LOGIN", usuario);
        String original = linhaSemUsuario(evento);

        assertThat(transacao("DELETE FROM " + S + "usuario WHERE id = '" + usuario + "'"), nullValue());

        assertThat(usuarioDoEvento(evento), nullValue());
        assertThat(linhaSemUsuario(evento), equalTo(original));
    }

    // Prova a condicao "nenhuma outra coluna muda" no mesmo contexto da acao
    // referencial (dentro de um trigger, com o usuario ja excluido): um trigger
    // de teste em usuario, que dispara antes do da FK (nomes "A..." < "RI_..."),
    // faz o SET NULL. Sozinho ele passa; combinado com outra coluna, a exclusao
    // inteira e desfeita.
    @Test
    @DisplayName("[T43] dentro da exclusao do usuario, SET NULL combinado com outra coluna e recusado")
    void setNullCombinadoNaExclusaoRecusado() throws Exception {
        migrarAte("27");
        UUID combinado = inserirUsuario();
        UUID eventoCombinado = inserirEvento("LOGIN", combinado);
        UUID simples = inserirUsuario();
        UUID eventoSimples = inserirEvento("LOGIN", simples);
        jdbcTemplate.execute("CREATE FUNCTION " + S + "fn_teste_set_null() RETURNS trigger LANGUAGE plpgsql AS $$"
                + " BEGIN"
                + "   IF OLD.sobrenome = 'Combinado' THEN"
                + "     UPDATE " + S + "auditoria_evento SET usuario_id = NULL, ip = '203.0.113.9' WHERE usuario_id = OLD.id;"
                + "   ELSE"
                + "     UPDATE " + S + "auditoria_evento SET usuario_id = NULL WHERE usuario_id = OLD.id;"
                + "   END IF;"
                + "   RETURN OLD;"
                + " END $$");
        jdbcTemplate.execute("CREATE TRIGGER \"A_teste_set_null\" AFTER DELETE ON " + S + "usuario"
                + " FOR EACH ROW EXECUTE FUNCTION " + S + "fn_teste_set_null()");
        jdbcTemplate.update("UPDATE " + S + "usuario SET sobrenome = 'Combinado' WHERE id = ?", combinado);

        assertViolacao(transacao("DELETE FROM " + S + "usuario WHERE id = '" + combinado + "'"), RECUSA);
        assertThat(usuarioDoEvento(eventoCombinado), equalTo(combinado));
        assertThat(jdbcTemplate.queryForObject("SELECT ip FROM " + S + "auditoria_evento WHERE id = ?", String.class,
                eventoCombinado), nullValue());

        assertThat(transacao("DELETE FROM " + S + "usuario WHERE id = '" + simples + "'"), nullValue());
        assertThat(usuarioDoEvento(eventoSimples), nullValue());
    }

    @Test
    @DisplayName("[T43] DELETE e TRUNCATE de auditoria_evento sao recusados com 23514 e nada e removido")
    void exclusaoRecusada() throws Exception {
        migrarAte("27");
        UUID usuario = inserirUsuario();
        UUID evento = inserirEvento("CRIACAO", usuario);

        assertViolacao(transacao("DELETE FROM " + S + "auditoria_evento WHERE id = '" + evento + "'"), RECUSA);
        assertViolacao(transacao("TRUNCATE " + S + "auditoria_evento"), "Os eventos de auditoria não podem ser excluídos");

        assertThat(contarEventos(), equalTo(1));
        assertThat(usuarioDoEvento(evento), equalTo(usuario));
    }

    // ── Apoio ────────────────────────────────────────────

    private MigrateResult migrarAte(String versao) {
        return migrarAte(MigrationVersion.fromVersion(versao));
    }

    private MigrateResult migrarAte(MigrationVersion versao) {
        return Flyway.configure()
                .dataSource(dataSource)
                .schemas(SCHEMA)
                .locations("classpath:db/migration")
                .target(versao)
                .load()
                .migrate();
    }

    private UUID inserirUsuario() {
        return jdbcTemplate.queryForObject("INSERT INTO " + S + "usuario (email, senha, nome, sobrenome)"
                + " VALUES (?, 'x', 'Migracao', 'Auditoria') RETURNING id", UUID.class,
                "migracao." + UUID.randomUUID().toString().substring(0, 8) + "@itu.sp.gov.br");
    }

    // Grava direto em SQL: o objetivo e provar as constraints e os triggers,
    // nao o service.
    private UUID inserirEvento(String acao, UUID usuario) {
        return jdbcTemplate.queryForObject("INSERT INTO " + S + "auditoria_evento (acao, entidade, entidade_id,"
                + " usuario_id, payload_depois) VALUES (?, 'teste_v27', gen_random_uuid(), ?, '{\"campo\": 1}'::jsonb)"
                + " RETURNING id", UUID.class, acao, usuario);
    }

    private String linha(UUID evento) {
        return jdbcTemplate.queryForObject("SELECT CAST(to_jsonb(e) AS text) FROM " + S + "auditoria_evento e"
                + " WHERE id = ?", String.class, evento);
    }

    private String linhaSemUsuario(UUID evento) {
        return jdbcTemplate.queryForObject("SELECT CAST(to_jsonb(e) - 'usuario_id' AS text) FROM " + S
                + "auditoria_evento e WHERE id = ?", String.class, evento);
    }

    private UUID usuarioDoEvento(UUID evento) {
        return jdbcTemplate.queryForObject("SELECT usuario_id FROM " + S + "auditoria_evento WHERE id = ?", UUID.class,
                evento);
    }

    private Integer contarEventos() {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "auditoria_evento", Integer.class);
    }

    private SQLException transacao(String... comandos) throws SQLException {
        try (Connection conexao = dataSource.getConnection()) {
            conexao.setAutoCommit(false);
            try (Statement statement = conexao.createStatement()) {
                for (String comando : comandos) {
                    statement.execute(comando);
                }
                conexao.commit();
                return null;
            } catch (SQLException erro) {
                conexao.rollback();
                return erro;
            } finally {
                conexao.setAutoCommit(true);
            }
        }
    }

    private static void assertViolacao(SQLException erro, String trecho) {
        assertThat("esperava falha 23514 contendo '" + trecho + "'", erro == null ? null : erro.getSQLState(),
                equalTo("23514"));
        assertThat(erro.getMessage(), containsString(trecho));
    }
}
