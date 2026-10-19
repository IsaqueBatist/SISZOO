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

// Exercita a V16 (microchip normalizado e unico quando presente, RN01) num
// schema proprio do mesmo PostgreSQL de teste, no padrao de
// MigracaoV14ResultadoProcessoIT: do zero, por atualizacao a partir da V14 com
// animais existentes, a recusa com duplicatas e a unicidade parcial.
class MigracaoV16MicrochipIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v16";
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
    @DisplayName("[RN01] V16 aplica do zero e troca o UNIQUE da V4 por indice unico parcial com o mesmo nome")
    void v16DeveAplicarDoZero() {
        MigrateResult resultado = migrarAte("16");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.targetSchemaVersion, equalTo("16"));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM pg_constraint c JOIN pg_namespace n"
                + " ON n.oid = c.connamespace WHERE n.nspname = ? AND c.conname = 'uq_animal_microchip'",
                Integer.class, SCHEMA), equalTo(0));
        String indice = jdbcTemplate.queryForObject("SELECT indexdef FROM pg_indexes"
                + " WHERE schemaname = ? AND indexname = 'uq_animal_microchip'", String.class, SCHEMA);
        assertThat(indice, containsString("CREATE UNIQUE INDEX"));
        assertThat(indice, containsString("WHERE (microchip IS NOT NULL)"));
    }

    @Test
    @DisplayName("[RN01] V16 sobre V14 normaliza os microchips existentes: sem espacos, vazio vira NULL")
    void v16NormalizaMicrochipsExistentes() throws Exception {
        migrarAte("14");
        UUID usuario = inserirUsuario();
        UUID comEspacos = UUID.randomUUID();
        UUID soEspacos = UUID.randomUUID();
        UUID vazio = UUID.randomUUID();
        UUID normal = UUID.randomUUID();
        UUID semMicrochip = UUID.randomUUID();
        assertThat(transacao(
                animal(comEspacos, usuario, " 9 85 "),
                animal(soEspacos, usuario, "   "),
                animal(vazio, usuario, ""),
                animal(normal, usuario, "123"),
                animal(semMicrochip, usuario, null)), nullValue());

        assertThat(migrarAte("16").success, equalTo(true));

        assertThat(microchipDe(comEspacos), equalTo("985"));
        assertThat(microchipDe(soEspacos), nullValue());
        assertThat(microchipDe(vazio), nullValue());
        assertThat(microchipDe(normal), equalTo("123"));
        assertThat(microchipDe(semMicrochip), nullValue());
    }

    @Test
    @DisplayName("[RN01] V16 falha com mensagem clara se dois microchips colidem depois da normalizacao, sem alterar nada")
    void v16FalhaComDuplicataAposNormalizar() throws Exception {
        migrarAte("14");
        UUID usuario = inserirUsuario();
        UUID primeiro = UUID.randomUUID();
        UUID segundo = UUID.randomUUID();
        assertThat(transacao(animal(primeiro, usuario, "985"), animal(segundo, usuario, " 98 5")), nullValue());

        FlywayException erro = assertThrows(FlywayException.class, () -> migrarAte("16"));

        assertThat(erro.getMessage(), containsString("microchips duplicados depois da normalização"));
        assertThat(erro.getMessage(), containsString("985 (animais"));
        assertThat(erro.getMessage(), containsString(primeiro.toString()));
        assertThat(erro.getMessage(), containsString(segundo.toString()));
        assertThat(microchipDe(primeiro), equalTo("985"));
        assertThat(microchipDe(segundo), equalTo(" 98 5"));
        // A V16 nao ficou aplicada (as anteriores, inclusive uma V15 quando
        // existir, podem ter sido aplicadas antes dela na mesma chamada).
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "flyway_schema_history"
                + " WHERE success AND version::int >= 16", Integer.class), equalTo(0));
    }

    @Test
    @DisplayName("[RN01] depois da V16: varios animais sem microchip; o mesmo microchip duas vezes da 23505")
    void microchipUnicoQuandoPresente() throws Exception {
        migrarAte("16");
        UUID usuario = inserirUsuario();

        assertThat(transacao(animal(UUID.randomUUID(), usuario, null), animal(UUID.randomUUID(), usuario, null)),
                nullValue());
        assertThat(transacao(animal(UUID.randomUUID(), usuario, "ABC123")), nullValue());

        SQLException erro = transacao(animal(UUID.randomUUID(), usuario, "ABC123"));
        assertThat(erro == null ? null : erro.getSQLState(), equalTo("23505"));
        assertThat(erro.getMessage(), containsString("uq_animal_microchip"));
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
                + " VALUES (?, 'x', 'Migracao', 'Microchip') RETURNING id", UUID.class,
                "migracao." + UUID.randomUUID().toString().substring(0, 8) + "@itu.sp.gov.br");
    }
}
