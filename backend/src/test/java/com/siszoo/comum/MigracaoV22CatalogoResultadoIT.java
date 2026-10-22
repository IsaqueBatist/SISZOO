package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.instanceOf;
import static org.hamcrest.Matchers.nullValue;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

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

// Exercita a V22 (T35-19: codigo de resultado_laboratorial imutavel) num
// schema proprio, no padrao de MigracaoV21PositivoDefinitivoIT. Sem a V22,
// renomear "positivo" por SQL contornaria o trigger da V21.
class MigracaoV22CatalogoResultadoIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v22";
    private static final String S = SCHEMA + ".";
    private static final String CONSTRAINT = "ck_resultado_laboratorial_codigo_imutavel";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void removerSchemaDoTeste() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    @Test
    @DisplayName("[T35-19] V22 aplica do zero sobre V1-V21")
    void v22DeveAplicarDoZero() {
        MigrateResult resultado = migrarAte("22");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.targetSchemaVersion, equalTo("22"));
    }

    @Test
    @DisplayName("[T35-19] V22 recusa renomear o codigo por SQL, inclusive o positivo e a troca entre dois codigos")
    void v22RecusaAlterarCodigo() throws Exception {
        migrarAte("22");

        assertViolacao(transacao("UPDATE " + S + "resultado_laboratorial SET codigo = 'positivo_antigo'"
                + " WHERE codigo = 'positivo'"));
        // Trocar dois codigos de lugar (positivo <-> negativo) exige renomear
        // ao menos um: tambem recusado.
        assertViolacao(transacao(
                "UPDATE " + S + "resultado_laboratorial SET codigo = 'temporario' WHERE codigo = 'negativo'",
                "UPDATE " + S + "resultado_laboratorial SET codigo = 'negativo' WHERE codigo = 'positivo'"));
        assertViolacao(transacao("UPDATE " + S + "resultado_laboratorial SET codigo = upper(codigo)"));

        assertThat(jdbcTemplate.queryForList("SELECT codigo FROM " + S + "resultado_laboratorial ORDER BY codigo",
                String.class), contains("aguardando", "inconclusivo", "material_inadequado", "nao_realizado",
                "negativo", "positivo"));
    }

    // So o codigo e imutavel: nome e ativo continuam alteraveis, e um UPDATE
    // que regrava o mesmo codigo (ex.: SET codigo = codigo) nao dispara.
    @Test
    @DisplayName("[T35-19] V22 aceita alterar nome e ativo e regravar o mesmo codigo")
    void v22AceitaAlterarNomeEAtivo() throws Exception {
        migrarAte("22");

        assertThat(transacao("UPDATE " + S + "resultado_laboratorial SET nome = 'Positivo (reagente)', ativo = false,"
                + " codigo = codigo WHERE codigo = 'positivo'"), nullValue());

        assertThat(jdbcTemplate.queryForObject("SELECT nome FROM " + S + "resultado_laboratorial"
                + " WHERE codigo = 'positivo'", String.class), equalTo("Positivo (reagente)"));
    }

    // Antes da V22 o banco aceitava o renome: e o contorno que a V22 fecha.
    @Test
    @DisplayName("[T35-19] ate a V21 o renome do codigo era aceito (contorno fechado pela V22)")
    void v21AceitavaRenomearCodigo() throws Exception {
        migrarAte("21");

        assertThat(transacao("UPDATE " + S + "resultado_laboratorial SET codigo = 'positivo_antigo'"
                + " WHERE codigo = 'positivo'"), nullValue());
    }

    // ── Apoio (como em MigracaoV21PositivoDefinitivoIT) ──

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

    // RAISE ... USING CONSTRAINT poe o nome no campo proprio da mensagem do
    // servidor, nao no texto.
    private static void assertViolacao(SQLException erro) {
        assertThat("esperava check_violation de " + CONSTRAINT, erro == null ? null : erro.getSQLState(),
                equalTo("23514"));
        assertThat(erro, instanceOf(PSQLException.class));
        assertThat(((PSQLException) erro).getServerErrorMessage().getConstraint(), equalTo(CONSTRAINT));
    }
}
