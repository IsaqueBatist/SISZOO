package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

// Exercita a V14 (resultado do processo sanitario, T34) num schema proprio do
// mesmo PostgreSQL de teste, no padrao de MigracaoV13ProcessosIT: do zero, por
// atualizacao a partir da V13 com processos existentes, e as garantias do
// banco (original unico, correcao unica e do mesmo processo, imutabilidade).
// Cada comando roda numa transacao JDBC propria, sem o Spring no meio; o
// erro devolvido traz o SQLSTATE e o nome da constraint.
class MigracaoV14ResultadoProcessoIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v14";
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
    @DisplayName("[T34] V14 aplica do zero sobre V1-V13 e cria resultado_processo vazia")
    void v14DeveAplicarDoZero() {
        MigrateResult resultado = migrarAte("14");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.targetSchemaVersion, equalTo("14"));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "resultado_processo", Integer.class),
                equalTo(0));
    }

    @Test
    @DisplayName("[T34] V14 sobre V13 com processo existente preserva o processo, sem resultado vigente")
    void v14SobreV13ComProcesso() throws Exception {
        migrarAte("13");
        UUID usuario = inserirUsuario();
        UUID processo = UUID.randomUUID();
        assertThat(transacao(processo(processo, usuario), responsavel(processo), amostra(processo)), nullValue());

        MigrateResult resultado = migrarAte("14");

        assertThat(resultado.success, equalTo(true));
        Map<String, Object> gravado = jdbcTemplate.queryForMap("SELECT status_processo, resultado_laboratorial_id"
                + " FROM " + S + "processo_sanitario WHERE id = ?", processo);
        assertThat(gravado.get("status_processo"), equalTo("ABERTO"));
        assertThat(gravado.get("resultado_laboratorial_id"), nullValue());
    }

    // ── Cadeia de correcoes ─────────────────────────────

    @Test
    @DisplayName("[T34] um so original por processo; cada resultado corrigido uma vez; cadeia de correcoes aceita")
    void originalUnicoECorrecaoUnica() throws Exception {
        migrarAte("14");
        UUID usuario = inserirUsuario();
        UUID processo = processoCompleto(usuario);
        UUID original = UUID.randomUUID();
        UUID correcao = UUID.randomUUID();

        assertThat(transacao(resultado(original, processo, null, "negativo", usuario)), nullValue());
        assertViolacao(transacao(resultado(UUID.randomUUID(), processo, null, "positivo", usuario)),
                "23505", "uq_resultado_processo_original");

        assertThat(transacao(resultado(correcao, processo, original, "positivo", usuario)), nullValue());
        assertViolacao(transacao(resultado(UUID.randomUUID(), processo, original, "inconclusivo", usuario)),
                "23505", "uq_resultado_processo_retifica_id");
        assertThat(transacao(resultado(UUID.randomUUID(), processo, correcao, "inconclusivo", usuario)), nullValue());

        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "resultado_processo WHERE processo_id = ?",
                Integer.class, processo), equalTo(3));
        // Outro processo tem o proprio original.
        UUID outro = processoCompleto(usuario);
        assertThat(transacao(resultado(UUID.randomUUID(), outro, null, "negativo", usuario)), nullValue());
    }

    @Test
    @DisplayName("[T34] correcao de resultado de outro processo e recusada pela FK composta")
    void correcaoSoDoMesmoProcesso() throws Exception {
        migrarAte("14");
        UUID usuario = inserirUsuario();
        UUID processo = processoCompleto(usuario);
        UUID outro = processoCompleto(usuario);
        UUID doOutro = UUID.randomUUID();
        transacao(resultado(UUID.randomUUID(), processo, null, "negativo", usuario));
        transacao(resultado(doOutro, outro, null, "negativo", usuario));

        assertViolacao(transacao(resultado(UUID.randomUUID(), processo, doOutro, "positivo", usuario)),
                "23503", "fk_resultado_processo_retifica");
        assertViolacao(transacao(resultado(UUID.randomUUID(), processo, UUID.randomUUID(), "positivo", usuario)),
                "23503", "fk_resultado_processo_retifica");
    }

    // ── Imutabilidade ───────────────────────────────────

    @Test
    @DisplayName("[T34] resultado imutavel: UPDATE de qualquer coluna e DELETE recusados, linha intacta")
    void resultadoImutavel() throws Exception {
        migrarAte("14");
        UUID usuario = inserirUsuario();
        UUID processo = processoCompleto(usuario);
        UUID resultado = UUID.randomUUID();
        transacao(resultado(resultado, processo, null, "negativo", usuario));
        Map<String, Object> gravado = jdbcTemplate.queryForMap(
                "SELECT * FROM " + S + "resultado_processo WHERE id = ?", resultado);
        String onde = " WHERE id = '" + resultado + "'";

        assertViolacao(transacao("UPDATE " + S + "resultado_processo SET resultado_laboratorial_id ="
                + " (SELECT id FROM " + S + "resultado_laboratorial WHERE codigo = 'positivo')" + onde),
                "23514", "é imutável");
        assertViolacao(transacao("UPDATE " + S + "resultado_processo SET data_resultado = DATE '2026-10-01'" + onde),
                "23514", "é imutável");
        assertViolacao(transacao("UPDATE " + S + "resultado_processo SET observacoes = observacoes" + onde),
                "23514", "é imutável");
        assertViolacao(transacao("DELETE FROM " + S + "resultado_processo" + onde), "23514", "é imutável");

        assertThat(jdbcTemplate.queryForMap("SELECT * FROM " + S + "resultado_processo WHERE id = ?", resultado),
                equalTo(gravado));
    }

    @Test
    @DisplayName("[T34] NOT NULL de resultado, data e autor; autor e catalogo com FK")
    void colunasObrigatorias() throws Exception {
        migrarAte("14");
        UUID usuario = inserirUsuario();
        UUID processo = processoCompleto(usuario);

        assertViolacao(transacao("INSERT INTO " + S + "resultado_processo (processo_id, data_resultado,"
                + " registrado_por_id) VALUES ('" + processo + "', DATE '2026-10-11', '" + usuario + "')"),
                "23502", "resultado_laboratorial_id");
        assertViolacao(transacao("INSERT INTO " + S + "resultado_processo (processo_id, resultado_laboratorial_id,"
                + " registrado_por_id) SELECT '" + processo + "', id, '" + usuario + "' FROM " + S
                + "resultado_laboratorial WHERE codigo = 'negativo'"), "23502", "data_resultado");
        assertViolacao(transacao("INSERT INTO " + S + "resultado_processo (processo_id, resultado_laboratorial_id,"
                + " data_resultado) SELECT '" + processo + "', id, DATE '2026-10-11' FROM " + S
                + "resultado_laboratorial WHERE codigo = 'negativo'"), "23502", "registrado_por_id");
        assertViolacao(transacao(resultado(UUID.randomUUID(), processo, null, "negativo", UUID.randomUUID())),
                "23503", "fk_resultado_processo_registrado_por");
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

    private UUID processoCompleto(UUID usuario) throws SQLException {
        UUID processo = UUID.randomUUID();
        assertThat(transacao(processo(processo, usuario), responsavel(processo), amostra(processo)), nullValue());
        return processo;
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
                + " VALUES (?, 'x', 'Migracao', 'Resultado') RETURNING id", UUID.class,
                "migracao." + UUID.randomUUID().toString().substring(0, 8) + "@itu.sp.gov.br");
    }

    // Protocolo so precisa ser unico dentro do schema do teste (varchar(20)).
    private static String protocoloUnico() {
        return "T" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
