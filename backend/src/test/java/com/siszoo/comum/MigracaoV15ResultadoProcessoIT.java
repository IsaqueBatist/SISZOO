package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

// Exercita a V15 (integridade do resultado do processo, follow-up da T34) num
// schema proprio, no padrao de MigracaoV14ResultadoProcessoIT: do zero, a
// reconciliacao do legado da D18 por atualizacao a partir da V14, o indice
// por processo, a recusa da linha auto-retificada e do TRUNCATE.
class MigracaoV15ResultadoProcessoIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v15";
    private static final String S = SCHEMA + ".";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void removerSchemaDoTeste() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    // ── Aplicacao da migration ───────────────────────────

    @Test
    @DisplayName("[T34] V15 aplica do zero sobre V1-V14 e cria o indice por processo")
    void v15DeveAplicarDoZero() {
        MigrateResult resultado = migrarAte("15");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.targetSchemaVersion, equalTo("15"));
        assertThat(jdbcTemplate.queryForObject("SELECT indexdef FROM pg_indexes WHERE schemaname = ?"
                + " AND indexname = 'ix_resultado_processo_processo_id'", String.class, SCHEMA),
                containsString("(processo_id)"));
    }

    // ── Reconciliacao do legado (D18) ────────────────────

    @Test
    @DisplayName("[T34] V15 volta COM_RESULTADO sem resultado para AGUARDANDO_RESULTADO; o resto fica intocado")
    void v15ReconciliaComResultadoSemVigente() throws Exception {
        migrarAte("14");
        UUID usuario = inserirUsuario();
        UUID legado = processoEm("COM_RESULTADO", usuario);
        UUID comVigente = processoEm("COM_RESULTADO", usuario);
        assertThat(transacao(resultado(UUID.randomUUID(), comVigente, null, "negativo", usuario),
                "UPDATE " + S + "processo_sanitario SET resultado_laboratorial_id = (SELECT id FROM " + S
                        + "resultado_laboratorial WHERE codigo = 'negativo'), data_resultado = DATE '2026-10-11'"
                        + " WHERE id = '" + comVigente + "'"), nullValue());
        // Historico sem vigente: a API nao produz; a V15 nao o trata de proposito.
        UUID historicoSemVigente = processoEm("COM_RESULTADO", usuario);
        assertThat(transacao(resultado(UUID.randomUUID(), historicoSemVigente, null, "negativo", usuario)), nullValue());
        UUID concluidoSemResultado = processoEm("CONCLUIDO", usuario);
        UUID aguardando = processoEm("AGUARDANDO_RESULTADO", usuario);

        MigrateResult resultado = migrarAte("15");

        assertThat(resultado.success, equalTo(true));
        assertThat(statusDe(legado), equalTo("AGUARDANDO_RESULTADO"));
        assertThat(statusDe(comVigente), equalTo("COM_RESULTADO"));
        assertThat(statusDe(historicoSemVigente), equalTo("COM_RESULTADO"));
        assertThat(statusDe(concluidoSemResultado), equalTo("CONCLUIDO"));
        assertThat(statusDe(aguardando), equalTo("AGUARDANDO_RESULTADO"));
    }

    // ── Linha auto-retificada ────────────────────────────

    // Lacuna da V14 apontada na revisao: a FK composta auto-referente enxerga a
    // propria linha no INSERT e aceita retifica_id = id.
    @Test
    @DisplayName("[T34] na V14 a linha que corrige a si mesma passava pela FK composta")
    void v14AceitavaLinhaAutoRetificada() throws Exception {
        migrarAte("14");
        UUID usuario = inserirUsuario();
        UUID processo = processoEm("AGUARDANDO_RESULTADO", usuario);
        UUID propria = UUID.randomUUID();

        assertThat(transacao(resultado(propria, processo, propria, "negativo", usuario)), nullValue());
    }

    // Pre-condicao da V15 (T34-8): com uma linha auto-retificada ja gravada, a
    // V15 para com mensagem propria antes de mudar qualquer coisa — sem a
    // reconciliacao, sem o indice, e o schema continua na V14.
    @Test
    @DisplayName("[T34] V15 sobre banco com linha auto-retificada falha antes de mudar qualquer coisa")
    void v15FalhaComLinhaAutoRetificadaSemAplicarNada() throws Exception {
        migrarAte("14");
        UUID usuario = inserirUsuario();
        UUID legado = processoEm("COM_RESULTADO", usuario);
        UUID processo = processoEm("AGUARDANDO_RESULTADO", usuario);
        UUID propria = UUID.randomUUID();
        assertThat(transacao(resultado(propria, processo, propria, "negativo", usuario)), nullValue());

        FlywayException erro = assertThrows(FlywayException.class, () -> migrarAte("15"));

        assertThat(erro.getMessage(), containsString("corrige a si mesma"));
        assertThat(statusDe(legado), equalTo("COM_RESULTADO"));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname = ?"
                + " AND indexname = 'ix_resultado_processo_processo_id'", Integer.class, SCHEMA), equalTo(0));
        // version e texto: a ultima aplicada vem pela ordem de instalacao.
        assertThat(jdbcTemplate.queryForObject("SELECT version FROM " + S + "flyway_schema_history WHERE success"
                + " ORDER BY installed_rank DESC LIMIT 1", String.class), equalTo("14"));
        assertThat(contarResultados(), equalTo(1));
    }

    @Test
    @DisplayName("[T34] V15 recusa a linha que corrige a si mesma (CHECK); correcao de outra linha continua aceita")
    void v15RecusaLinhaAutoRetificada() throws Exception {
        migrarAte("15");
        UUID usuario = inserirUsuario();
        UUID processo = processoEm("AGUARDANDO_RESULTADO", usuario);
        UUID original = UUID.randomUUID();
        UUID propria = UUID.randomUUID();

        assertViolacao(transacao(resultado(propria, processo, propria, "negativo", usuario)),
                "23514", "ck_resultado_processo_retifica_outro");
        assertThat(transacao(resultado(original, processo, null, "negativo", usuario)), nullValue());
        assertThat(transacao(resultado(UUID.randomUUID(), processo, original, "positivo", usuario)), nullValue());
        assertThat(contarResultados(), equalTo(2));
    }

    // ── TRUNCATE ─────────────────────────────────────────

    @Test
    @DisplayName("[T34] V15 recusa TRUNCATE do historico, direto ou em cascata a partir do processo")
    void v15RecusaTruncate() throws Exception {
        migrarAte("15");
        UUID usuario = inserirUsuario();
        UUID processo = processoEm("AGUARDANDO_RESULTADO", usuario);
        assertThat(transacao(resultado(UUID.randomUUID(), processo, null, "negativo", usuario)), nullValue());

        assertViolacao(transacao("TRUNCATE " + S + "resultado_processo"), "23514", "é imutável");
        assertViolacao(transacao("TRUNCATE " + S + "processo_sanitario CASCADE"), "23514", "é imutável");

        assertThat(contarResultados(), equalTo(1));
        assertThat(statusDe(processo), equalTo("AGUARDANDO_RESULTADO"));
    }

    // ── Apoio ──

    private MigrateResult migrarAte(String versao) {
        return Flyway.configure()
                .dataSource(dataSource)
                .schemas(SCHEMA)
                .locations("classpath:db/migration")
                .target(MigrationVersion.fromVersion(versao))
                .load()
                .migrate();
    }

    // Executa os comandos numa transacao propria e devolve o erro (ou null se confirmou).
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

    private static void assertViolacao(SQLException erro, String sqlState, String trecho) {
        assertThat("esperava falha contendo '" + trecho + "'", erro == null ? null : erro.getSQLState(),
                equalTo(sqlState));
        assertThat(erro.getMessage(), containsString(trecho));
    }

    // Processo completo (responsavel e amostra, V13) no status pedido.
    private UUID processoEm(String status, UUID usuario) throws SQLException {
        UUID processo = UUID.randomUUID();
        assertThat(transacao(processo(processo, usuario), responsavel(processo), amostra(processo),
                "UPDATE " + S + "processo_sanitario SET status_processo = '" + status + "' WHERE id = '" + processo + "'"),
                nullValue());
        return processo;
    }

    private String statusDe(UUID processo) {
        return jdbcTemplate.queryForObject("SELECT status_processo FROM " + S + "processo_sanitario WHERE id = ?",
                String.class, processo);
    }

    private int contarResultados() {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "resultado_processo", Integer.class);
    }

    private static String resultado(UUID id, UUID processo, UUID retifica, String codigo, UUID usuario) {
        return "INSERT INTO " + S + "resultado_processo (id, processo_id, resultado_laboratorial_id, data_resultado,"
                + " retifica_id, registrado_por_id) SELECT '" + id + "', '" + processo + "', id, DATE '2026-10-11', "
                + (retifica == null ? "NULL" : "'" + retifica + "'") + ", '" + usuario + "'"
                + " FROM " + S + "resultado_laboratorial WHERE codigo = '" + codigo + "'";
    }

    private static String processo(UUID id, UUID usuario) {
        return "INSERT INTO " + S + "processo_sanitario (id, protocolo, data_abertura, criado_por_id, doenca_id,"
                + " laboratorio_id) SELECT '" + id + "', '" + protocoloUnico() + "', DATE '2026-10-11', '" + usuario
                + "', d.id, l.id FROM " + S + "doenca d, " + S + "laboratorio l"
                + " WHERE d.codigo = 'raiva' AND l.codigo = 'pasteur_sp'";
    }

    private static String responsavel(UUID processo) {
        return "INSERT INTO " + S + "responsavel_processo (processo_id, nome) VALUES ('" + processo + "', 'Responsavel')";
    }

    private static String amostra(UUID processo) {
        return "INSERT INTO " + S + "animal_amostrado (processo_id, especie_id, sexo, status_clinico, tipo_abrigo,"
                + " data_coleta, material_biologico, contato_humano) SELECT '" + processo
                + "', id, 'macho', 'ASSINTOMATICO', 'PERIDOMICILIAR', DATE '2026-10-11', 'SORO', false"
                + " FROM " + S + "especie WHERE codigo = 'canino'";
    }

    private UUID inserirUsuario() {
        return jdbcTemplate.queryForObject("INSERT INTO " + S + "usuario (email, senha, nome, sobrenome)"
                + " VALUES (?, 'x', 'Migracao', 'Integridade') RETURNING id", UUID.class,
                "migracao." + UUID.randomUUID().toString().substring(0, 8) + "@itu.sp.gov.br");
    }

    // Protocolo so precisa ser unico dentro do schema do teste (varchar(20)).
    private static String protocoloUnico() {
        return "T" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
