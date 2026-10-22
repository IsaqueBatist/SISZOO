package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.instanceOf;
import static org.hamcrest.Matchers.nullValue;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Map;
import java.util.UUID;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.postgresql.util.PSQLException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

// Exercita a V20 (T35-15/T35-16: positivo definitivo e data do envio da
// notificacao) num schema proprio, no padrao de MigracaoV15ResultadoProcessoIT:
// coluna nova e nula, trigger que recusa a correcao de um positivo por SQL
// direto (o service recusa antes, com 422) e dados anteriores intactos.
class MigracaoV20PositivoDefinitivoIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v20";
    private static final String S = SCHEMA + ".";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void removerSchemaDoTeste() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    @Test
    @DisplayName("[T35-16] V20 aplica do zero e cria data_notificacao_municipe timestamp sem fuso e anulavel")
    void v20DeveAplicarDoZero() {
        MigrateResult resultado = migrarAte("20");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.targetSchemaVersion, equalTo("20"));
        Map<String, Object> coluna = jdbcTemplate.queryForMap("SELECT data_type, is_nullable"
                + " FROM information_schema.columns WHERE table_schema = ? AND table_name = 'processo_sanitario'"
                + " AND column_name = 'data_notificacao_municipe'", SCHEMA);
        assertThat(coluna.get("data_type"), equalTo("timestamp without time zone"));
        assertThat(coluna.get("is_nullable"), equalTo("YES"));
    }

    @Test
    @DisplayName("[T35-15] V20 recusa por SQL a correcao de um positivo, para negativo ou positivo")
    void v20RecusaCorrecaoDePositivo() throws Exception {
        migrarAte("20");
        UUID usuario = inserirUsuario();
        UUID processo = processoEm("AGUARDANDO_RESULTADO", usuario);
        UUID positivo = UUID.randomUUID();
        assertThat(transacao(resultado(positivo, processo, null, "positivo", usuario)), nullValue());

        assertViolacaoDaConstraint(transacao(resultado(UUID.randomUUID(), processo, positivo, "negativo", usuario)),
                "ck_resultado_positivo_definitivo");
        assertViolacao(transacao(resultado(UUID.randomUUID(), processo, positivo, "positivo", usuario)),
                "23514", "definitivo e n");
        assertThat(contarResultados(), equalTo(1));
    }

    // A correcao dos demais resultados continua valendo, inclusive para
    // positivo; o positivo resultante passa a ser definitivo.
    @Test
    @DisplayName("[T35-15] V20 aceita corrigir negativo para positivo; o positivo resultante nao se corrige")
    void v20AceitaCorrecaoDeOutroResultado() throws Exception {
        migrarAte("20");
        UUID usuario = inserirUsuario();
        UUID processo = processoEm("AGUARDANDO_RESULTADO", usuario);
        UUID negativo = UUID.randomUUID();
        UUID positivo = UUID.randomUUID();
        assertThat(transacao(resultado(negativo, processo, null, "negativo", usuario)), nullValue());

        assertThat(transacao(resultado(positivo, processo, negativo, "positivo", usuario)), nullValue());
        assertViolacaoDaConstraint(transacao(resultado(UUID.randomUUID(), processo, positivo, "inconclusivo", usuario)),
                "ck_resultado_positivo_definitivo");
        assertThat(contarResultados(), equalTo(2));
    }

    // Linhas existentes nao mudam: uma correcao de positivo gravada antes da
    // V20 (a API aceitava) fica no historico, e a migration nao falha.
    @Test
    @DisplayName("[T35-15] V20 sobre historico com positivo ja corrigido: aplica e preserva as linhas")
    void v20PreservaHistoricoAnterior() throws Exception {
        migrarAte("19");
        UUID usuario = inserirUsuario();
        UUID processo = processoEm("AGUARDANDO_RESULTADO", usuario);
        UUID positivo = UUID.randomUUID();
        assertThat(transacao(resultado(positivo, processo, null, "positivo", usuario),
                resultado(UUID.randomUUID(), processo, positivo, "negativo", usuario)), nullValue());

        MigrateResult resultado = migrarAte("20");

        assertThat(resultado.success, equalTo(true));
        assertThat(contarResultados(), equalTo(2));
        assertThat(jdbcTemplate.queryForObject("SELECT data_notificacao_municipe FROM " + S + "processo_sanitario"
                + " WHERE id = ?", Object.class, processo), nullValue());
    }

    // ── Apoio (como em MigracaoV15ResultadoProcessoIT) ──

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

    // RAISE ... USING CONSTRAINT nao poe o nome no texto: ele vem no campo
    // proprio da mensagem do servidor, que e o que a aplicacao enxergaria.
    private static void assertViolacaoDaConstraint(SQLException erro, String constraint) {
        assertThat("esperava check_violation de " + constraint, erro == null ? null : erro.getSQLState(),
                equalTo("23514"));
        assertThat(erro, instanceOf(PSQLException.class));
        assertThat(((PSQLException) erro).getServerErrorMessage().getConstraint(), equalTo(constraint));
    }

    // Processo completo (responsavel e amostra, V13) no status pedido.
    private UUID processoEm(String status, UUID usuario) throws SQLException {
        UUID processo = UUID.randomUUID();
        assertThat(transacao(processo(processo, usuario), responsavel(processo), amostra(processo),
                "UPDATE " + S + "processo_sanitario SET status_processo = '" + status + "' WHERE id = '" + processo + "'"),
                nullValue());
        return processo;
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
                + " VALUES (?, 'x', 'Migracao', 'PositivoDefinitivo') RETURNING id", UUID.class,
                "migracao." + UUID.randomUUID().toString().substring(0, 8) + "@itu.sp.gov.br");
    }

    // Protocolo so precisa ser unico dentro do schema do teste (varchar(20)).
    private static String protocoloUnico() {
        return "T" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
