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
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;

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

// Ordem das migrations V15 (T34 follow-up, PR #98) -> V16 e V17 (auditoria
// de regras de negocio; docs/decisoes/auditoria-rn.md, AR-8), num schema
// proprio do PostgreSQL de teste:
//   - banco limpo: V1..V17 aplicadas em ordem, sem lacuna;
//   - atualizacao: banco parado na V15 com dados de todos os modulos tocados
//     (animais com microchip, registros clinicos, processo com responsavel,
//     amostra e resultado), V16 e V17 aplicadas por cima;
//   - atualizacao recusada: duplicata de microchip na V15 para a V16 sem
//     tocar nos dados e sem aplicar a V17.
// A base da atualizacao e um schema migrado ate a V15 pelas proprias
// migrations: o banco de desenvolvimento esta na V12 com processo minimo da
// T25, que a V13 recusa por decisao (DH-3).
class MigracaoOrdemV15V16V17IT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_ordem_v17";
    private static final String S = SCHEMA + ".";
    private static final List<String> SEM_EXCLUSAO = List.of("vacinacao", "procedimento", "prescricao", "processo_sanitario");
    private static final List<String> TABELAS_CONTADAS = List.of("usuario", "animal", "vacinacao", "procedimento",
            "prescricao", "processo_sanitario", "responsavel_processo", "animal_amostrado", "resultado_processo");

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void removerSchemaDoTeste() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    @Test
    @DisplayName("banco limpo: V1..V17 aplicadas em ordem, sem lacuna, V15 antes de V16 e V17")
    void bancoLimpoAplicaTudoEmOrdem() {
        MigrateResult resultado = migrarAte("17");

        assertThat(resultado.success, equalTo(true));
        assertThat(versoesAplicadasEmOrdem(), equalTo(IntStream.rangeClosed(1, 17).boxed().toList()));
    }

    @Test
    @DisplayName("atualizacao V15 -> V17 com dados: microchips normalizados, constraints e triggers no lugar, nada perdido")
    void atualizacaoDeV15ComDados() throws Exception {
        assertThat(migrarAte("15").targetSchemaVersion, equalTo("15"));
        Dados dados = inserirDadosNaV15();
        Map<String, Integer> contagemAntes = contarTabelas();

        MigrateResult resultado = migrarAte("17");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.migrationsExecuted, equalTo(2));
        assertThat(versoesAplicadasEmOrdem(), equalTo(IntStream.rangeClosed(1, 17).boxed().toList()));
        assertThat(contarTabelas(), equalTo(contagemAntes));

        // V16: dados normalizados e unicidade por indice parcial.
        assertThat(microchipDe(dados.comEspacos), equalTo("985"));
        assertThat(microchipDe(dados.soEspacos), nullValue());
        assertThat(microchipDe(dados.normal), equalTo("ABC123"));
        assertThat(microchipDe(dados.semMicrochip), nullValue());
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM pg_constraint c JOIN pg_namespace n"
                + " ON n.oid = c.connamespace WHERE n.nspname = ? AND c.conname = 'uq_animal_microchip'",
                Integer.class, SCHEMA), equalTo(0));
        assertThat(jdbcTemplate.queryForObject("SELECT indexdef FROM pg_indexes WHERE schemaname = ?"
                + " AND indexname = 'uq_animal_microchip'", String.class, SCHEMA),
                containsString("WHERE (microchip IS NOT NULL)"));
        assertViolacao(transacao(animal(UUID.randomUUID(), dados.usuario, "985")), "23505", "uq_animal_microchip");

        // V17: exclusao recusada nas quatro tabelas, inclusive o processo com resultado.
        for (String tabela : SEM_EXCLUSAO) {
            assertViolacao(transacao("DELETE FROM " + S + tabela), "23514", "não pode ser excluído");
            assertViolacao(transacao("TRUNCATE " + S + tabela + " CASCADE"), "23514", "não podem ser excluídos");
        }

        // V14/V15 continuam valendo depois de V16 e V17.
        assertViolacao(transacao("DELETE FROM " + S + "resultado_processo"), "23514", "é imutável");
        assertViolacao(transacao("TRUNCATE " + S + "resultado_processo"), "23514", "imutável");
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM pg_constraint c JOIN pg_namespace n"
                + " ON n.oid = c.connamespace WHERE n.nspname = ? AND c.conname = 'ck_resultado_processo_retifica_outro'",
                Integer.class, SCHEMA), equalTo(1));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM pg_indexes WHERE schemaname = ?"
                + " AND indexname = 'ix_resultado_processo_processo_id'", Integer.class, SCHEMA), equalTo(1));

        // UPDATE continua permitido no processo (status e vigente mudam).
        assertThat(transacao("UPDATE " + S + "processo_sanitario SET status_processo = 'CONCLUIDO' WHERE id = '"
                + dados.processo + "'"), nullValue());
        assertThat(contarTabelas(), equalTo(contagemAntes));
    }

    @Test
    @DisplayName("atualizacao V15 -> V17 com microchip duplicado apos normalizar: V16 falha, dados intactos, V17 nao aplicada")
    void atualizacaoDeV15ComDuplicataParaNaV16() throws Exception {
        migrarAte("15");
        UUID usuario = inserirUsuario();
        UUID primeiro = UUID.randomUUID();
        UUID segundo = UUID.randomUUID();
        assertThat(transacao(animal(primeiro, usuario, "985"), animal(segundo, usuario, " 98 5")), nullValue());

        FlywayException erro = assertThrows(FlywayException.class, () -> migrarAte("17"));

        assertThat(erro.getMessage(), containsString("microchips duplicados depois da normalização"));
        assertThat(microchipDe(primeiro), equalTo("985"));
        assertThat(microchipDe(segundo), equalTo(" 98 5"));
        assertThat(versoesAplicadasEmOrdem(), equalTo(IntStream.rangeClosed(1, 15).boxed().toList()));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid"
                + " JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = ?"
                + " AND t.tgname LIKE '%_sem_exclusao'", Integer.class, SCHEMA), equalTo(0));
    }

    // ── Apoio ──

    private record Dados(UUID usuario, UUID comEspacos, UUID soEspacos, UUID normal, UUID semMicrochip, UUID processo) {
    }

    // Um registro de cada modulo tocado por V15, V16 e V17, inserido com o
    // schema na V15.
    private Dados inserirDadosNaV15() throws SQLException {
        UUID usuario = inserirUsuario();
        UUID comEspacos = UUID.randomUUID();
        UUID soEspacos = UUID.randomUUID();
        UUID normal = UUID.randomUUID();
        UUID semMicrochip = UUID.randomUUID();
        UUID medicamento = UUID.randomUUID();
        UUID processo = UUID.randomUUID();
        UUID resultado = UUID.randomUUID();
        assertThat(transacao(
                animal(comEspacos, usuario, " 9 85 "),
                animal(soEspacos, usuario, "   "),
                animal(normal, usuario, "ABC123"),
                animal(semMicrochip, usuario, null),
                "INSERT INTO " + S + "vacinacao (animal_id, vacina_id, aplicado_por_id, data_aplicacao, dose_quantidade,"
                        + " dose_unidade) SELECT '" + normal + "', id, '" + usuario + "', DATE '2026-10-11', 1, 'MILILITRO'"
                        + " FROM " + S + "vacina WHERE codigo = 'antirrabica'",
                "INSERT INTO " + S + "procedimento (animal_id, tipo_procedimento_id, executado_por_id, data)"
                        + " SELECT '" + normal + "', id, '" + usuario + "', DATE '2026-10-11'"
                        + " FROM " + S + "tipo_procedimento WHERE codigo = 'castracao'",
                "INSERT INTO " + S + "categoria_farmacologica (nome) VALUES ('Antibiótico')",
                "INSERT INTO " + S + "medicamento (id, nome, categoria_id) SELECT '" + medicamento + "', 'Amoxicilina', id"
                        + " FROM " + S + "categoria_farmacologica",
                "INSERT INTO " + S + "prescricao (animal_id, prescrito_por_id, medicamento_id, data_inicio,"
                        + " frequencia_aplicada, unidade_frequencia, dose_quantidade, dose_unidade, via_administracao, status)"
                        + " VALUES ('" + normal + "', '" + usuario + "', '" + medicamento + "', DATE '2026-10-11', 8,"
                        + " 'HORAS', 1, 'MILILITRO', 'ORAL', 'ATIVA')",
                "INSERT INTO " + S + "processo_sanitario (id, protocolo, data_abertura, criado_por_id, doenca_id,"
                        + " laboratorio_id, status_processo) SELECT '" + processo + "', 'T-ORDEM', DATE '2026-10-11', '"
                        + usuario + "', d.id, l.id, 'AGUARDANDO_RESULTADO' FROM " + S + "doenca d, " + S + "laboratorio l"
                        + " WHERE d.codigo = 'raiva' AND l.codigo = 'pasteur_sp'",
                "INSERT INTO " + S + "responsavel_processo (processo_id, nome) VALUES ('" + processo + "', 'Responsavel')",
                "INSERT INTO " + S + "animal_amostrado (processo_id, animal_id, especie_id, sexo, status_clinico, tipo_abrigo,"
                        + " data_coleta, material_biologico, contato_humano) SELECT '" + processo + "', '" + normal
                        + "', id, 'macho', 'ASSINTOMATICO', 'PERIDOMICILIAR', DATE '2026-10-11', 'SORO', false"
                        + " FROM " + S + "especie WHERE codigo = 'canino'",
                "INSERT INTO " + S + "resultado_processo (id, processo_id, resultado_laboratorial_id, data_resultado,"
                        + " registrado_por_id) SELECT '" + resultado + "', '" + processo + "', id, DATE '2026-10-12', '"
                        + usuario + "' FROM " + S + "resultado_laboratorial WHERE codigo = 'negativo'",
                "UPDATE " + S + "processo_sanitario SET status_processo = 'COM_RESULTADO', data_resultado = DATE '2026-10-12',"
                        + " resultado_laboratorial_id = (SELECT id FROM " + S + "resultado_laboratorial WHERE codigo = 'negativo')"
                        + " WHERE id = '" + processo + "'"), nullValue());
        return new Dados(usuario, comEspacos, soEspacos, normal, semMicrochip, processo);
    }

    private Map<String, Integer> contarTabelas() {
        return TABELAS_CONTADAS.stream().collect(java.util.stream.Collectors.toMap(
                tabela -> tabela,
                tabela -> jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + tabela, Integer.class)));
    }

    private List<Integer> versoesAplicadasEmOrdem() {
        return jdbcTemplate.queryForList("SELECT version::int FROM " + S + "flyway_schema_history"
                + " WHERE success AND version IS NOT NULL ORDER BY installed_rank", Integer.class);
    }

    private static String animal(UUID id, UUID usuario, String microchip) {
        return "INSERT INTO " + S + "animal (id, nome, especie_id, sexo, status_id, motivo_entrada_id, data_entrada,"
                + " criado_por_id, microchip) SELECT '" + id + "', 'Animal', e.id, 'macho', s.id, m.id, now(), '"
                + usuario + "', " + (microchip == null ? "NULL" : "'" + microchip + "'")
                + " FROM " + S + "especie e, " + S + "status_animal s, " + S + "motivo_entrada m"
                + " WHERE e.codigo = 'canino' AND s.codigo = 'disponivel_adocao' AND m.codigo = 'resgate'";
    }

    private String microchipDe(UUID animal) {
        return jdbcTemplate.queryForObject("SELECT microchip FROM " + S + "animal WHERE id = ?", String.class, animal);
    }

    private UUID inserirUsuario() {
        return jdbcTemplate.queryForObject("INSERT INTO " + S + "usuario (email, senha, nome, sobrenome)"
                + " VALUES (?, 'x', 'Migracao', 'Ordem') RETURNING id", UUID.class,
                "migracao." + UUID.randomUUID().toString().substring(0, 8) + "@itu.sp.gov.br");
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
