package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;

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
import org.springframework.jdbc.core.JdbcTemplate;

// Exercita a V17 (RN06: historico veterinario e processo sanitario nao podem
// ser excluidos) num schema proprio do mesmo PostgreSQL de teste, no padrao
// de MigracaoV14ResultadoProcessoIT: do zero, DELETE e TRUNCATE recusados nas
// quatro tabelas com 23514 e UPDATE ainda permitido. Cada comando roda numa
// transacao JDBC propria; o erro devolvido traz o SQLSTATE e a mensagem.
class MigracaoV17RegistrosCriticosIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v17";
    private static final String S = SCHEMA + ".";
    private static final List<String> TABELAS = List.of("vacinacao", "procedimento", "prescricao", "processo_sanitario");

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void removerSchemaDoTeste() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    @Test
    @DisplayName("[RN06] V17 aplica do zero com triggers de DELETE (linha) e TRUNCATE (comando) nas quatro tabelas")
    void v17DeveAplicarDoZero() {
        MigrateResult resultado = migrarAte("17");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.targetSchemaVersion, equalTo("17"));
        for (String tabela : TABELAS) {
            assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid"
                    + " JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = ? AND c.relname = ?"
                    + " AND t.tgname IN (?, ?)", Integer.class, SCHEMA, tabela,
                    "tg_" + tabela + "_sem_exclusao", "tg_" + tabela + "_sem_truncate"), equalTo(2));
        }
    }

    @Test
    @DisplayName("[RN06] DELETE de vacinacao, procedimento, prescricao e processo e recusado com 23514; nada e removido")
    void deleteRecusadoNasQuatroTabelas() throws Exception {
        migrarAte("17");
        Registros registros = inserirRegistros();

        for (String tabela : TABELAS) {
            assertViolacao(transacao("DELETE FROM " + S + tabela), "23514", "não pode ser excluído");
            assertThat(contar(tabela), equalTo(1));
        }
        // O processo apagado junto com amostras e responsavel (caminho aceito
        // antes da V17): a transacao inteira e desfeita.
        assertViolacao(transacao(
                "DELETE FROM " + S + "animal_amostrado WHERE processo_id = '" + registros.processo + "'",
                "DELETE FROM " + S + "responsavel_processo WHERE processo_id = '" + registros.processo + "'",
                "DELETE FROM " + S + "processo_sanitario WHERE id = '" + registros.processo + "'"),
                "23514", "não pode ser excluído");
        assertThat(contar("animal_amostrado"), equalTo(1));
        assertThat(contar("responsavel_processo"), equalTo(1));
    }

    @Test
    @DisplayName("[RN06] TRUNCATE das quatro tabelas e recusado com 23514, inclusive por CASCADE a partir do animal")
    void truncateRecusadoNasQuatroTabelas() throws Exception {
        migrarAte("17");
        inserirRegistros();

        assertViolacao(transacao("TRUNCATE " + S + "vacinacao"), "23514", "não podem ser excluídos");
        assertViolacao(transacao("TRUNCATE " + S + "procedimento"), "23514", "não podem ser excluídos");
        assertViolacao(transacao("TRUNCATE " + S + "prescricao"), "23514", "não podem ser excluídos");
        // processo_sanitario e referenciado por responsavel e amostras: sem
        // CASCADE o PostgreSQL recusa antes por FK; com CASCADE, o trigger recusa.
        assertViolacao(transacao("TRUNCATE " + S + "processo_sanitario CASCADE"), "23514", "não podem ser excluídos");
        assertViolacao(transacao("TRUNCATE " + S + "animal CASCADE"), "23514", "não podem ser excluídos");

        for (String tabela : TABELAS) {
            assertThat(contar(tabela), equalTo(1));
        }
        assertThat(contar("animal"), equalTo(1));
    }

    @Test
    @DisplayName("[RN06] a V17 bloqueia so exclusao: UPDATE continua permitido nas quatro tabelas")
    void updateContinuaPermitido() throws Exception {
        migrarAte("17");
        inserirRegistros();

        assertThat(transacao(
                "UPDATE " + S + "vacinacao SET observacoes = 'x'",
                "UPDATE " + S + "procedimento SET descricao = 'x'",
                "UPDATE " + S + "prescricao SET data_fim_real = DATE '2026-10-12'",
                "UPDATE " + S + "processo_sanitario SET status_processo = 'AGUARDANDO_RESULTADO'"), nullValue());
    }

    // ── Apoio ──

    private record Registros(UUID animal, UUID processo) {
    }

    // Uma linha em cada tabela protegida, com as dependencias minimas.
    private Registros inserirRegistros() throws SQLException {
        UUID usuario = jdbcTemplate.queryForObject("INSERT INTO " + S + "usuario (email, senha, nome, sobrenome)"
                + " VALUES (?, 'x', 'Migracao', 'Imutabilidade') RETURNING id", UUID.class,
                "migracao." + UUID.randomUUID().toString().substring(0, 8) + "@itu.sp.gov.br");
        UUID animal = UUID.randomUUID();
        UUID medicamento = UUID.randomUUID();
        UUID processo = UUID.randomUUID();
        assertThat(transacao(
                "INSERT INTO " + S + "animal (id, nome, especie_id, sexo, status_id, motivo_entrada_id, data_entrada,"
                        + " criado_por_id) SELECT '" + animal + "', 'Animal', e.id, 'macho', s.id, m.id, now(), '"
                        + usuario + "' FROM " + S + "especie e, " + S + "status_animal s, " + S + "motivo_entrada m"
                        + " WHERE e.codigo = 'canino' AND s.codigo = 'disponivel_adocao' AND m.codigo = 'resgate'",
                "INSERT INTO " + S + "vacinacao (animal_id, vacina_id, aplicado_por_id, data_aplicacao, dose_quantidade,"
                        + " dose_unidade) SELECT '" + animal + "', id, '" + usuario + "', DATE '2026-10-11', 1, 'MILILITRO'"
                        + " FROM " + S + "vacina WHERE codigo = 'antirrabica'",
                "INSERT INTO " + S + "procedimento (animal_id, tipo_procedimento_id, executado_por_id, data)"
                        + " SELECT '" + animal + "', id, '" + usuario + "', DATE '2026-10-11'"
                        + " FROM " + S + "tipo_procedimento WHERE codigo = 'castracao'",
                "INSERT INTO " + S + "categoria_farmacologica (nome) VALUES ('Antibiótico')",
                "INSERT INTO " + S + "medicamento (id, nome, categoria_id) SELECT '" + medicamento + "', 'Amoxicilina', id"
                        + " FROM " + S + "categoria_farmacologica",
                "INSERT INTO " + S + "prescricao (animal_id, prescrito_por_id, medicamento_id, data_inicio,"
                        + " frequencia_aplicada, unidade_frequencia, dose_quantidade, dose_unidade, via_administracao, status)"
                        + " VALUES ('" + animal + "', '" + usuario + "', '" + medicamento + "', DATE '2026-10-11', 8,"
                        + " 'HORAS', 1, 'MILILITRO', 'ORAL', 'ATIVA')",
                "INSERT INTO " + S + "processo_sanitario (id, protocolo, data_abertura, criado_por_id, doenca_id,"
                        + " laboratorio_id) SELECT '" + processo + "', 'T-V17', DATE '2026-10-11', '" + usuario
                        + "', d.id, l.id FROM " + S + "doenca d, " + S + "laboratorio l"
                        + " WHERE d.codigo = 'raiva' AND l.codigo = 'pasteur_sp'",
                "INSERT INTO " + S + "responsavel_processo (processo_id, nome) VALUES ('" + processo + "', 'Responsavel')",
                "INSERT INTO " + S + "animal_amostrado (processo_id, especie_id, sexo, status_clinico, tipo_abrigo,"
                        + " data_coleta, material_biologico, contato_humano) SELECT '" + processo
                        + "', id, 'macho', 'ASSINTOMATICO', 'PERIDOMICILIAR', DATE '2026-10-11', 'SORO', false"
                        + " FROM " + S + "especie WHERE codigo = 'canino'"), nullValue());
        return new Registros(animal, processo);
    }

    private Integer contar(String tabela) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + tabela, Integer.class);
    }

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
}
