package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertThrows;

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

// Exercita a V7 isoladamente num schema proprio do mesmo PostgreSQL de teste:
// o Flyway da aplicacao ja migrou o schema public ate a ultima versao, entao
// aqui as migrations sao aplicadas de novo, por API, num schema descartavel —
// primeiro ate a V6 (estado anterior a T24), depois a V7.
class MigracaoV7RegistroClinicoIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v7";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void removerSchemaDoTeste() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    @Test
    @DisplayName("[RN-C05] V7 aplica sem erro num banco sem dados")
    void v7DeveAplicarEmBancoVazio() {
        MigrateResult resultado = migrarAte("7");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.targetSchemaVersion, equalTo("7"));
    }

    // Banco com vacinacao legada sem unidade (o formulario anterior a T24
    // permitia): a V7 nao pode abortar nem inventar unidade clinica — o
    // registro legado fica nulo e so linhas novas passam a exigir unidade.
    @Test
    @DisplayName("[RN-C05] V7 preserva vacinacao legada sem unidade e passa a exigir unidade em linha nova")
    void v7DevePreservarLegadoSemUnidadeEExigirUnidadeEmLinhaNova() {
        migrarAte("6");
        UUID idLegado = inserirVacinacao(null);

        MigrateResult resultado = migrarAte("7");

        assertThat(resultado.success, equalTo(true));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT dose_unidade FROM " + SCHEMA + ".vacinacao WHERE id = ?", String.class, idLegado),
                nullValue());
        // NOT VALID: a constraint existe, mas nao foi validada contra as linhas antigas.
        assertThat(jdbcTemplate.queryForObject("""
                SELECT c.convalidated FROM pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                WHERE n.nspname = ? AND c.conname = 'ck_vacinacao_dose_unidade_obrigatoria'
                """, Boolean.class, SCHEMA), equalTo(false));

        DataIntegrityViolationException erro =
                assertThrows(DataIntegrityViolationException.class, () -> inserirVacinacao(null));
        assertThat(erro.getMessage(), containsString("ck_vacinacao_dose_unidade_obrigatoria"));

        UUID idNovo = inserirVacinacao("MILILITRO");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT dose_unidade FROM " + SCHEMA + ".vacinacao WHERE id = ?", String.class, idNovo),
                equalTo("MILILITRO"));
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

    // Grava direto em SQL, sem a API: simula um dado ja existente no banco,
    // inclusive o caso legado sem unidade que a API atual nao aceitaria.
    private UUID inserirVacinacao(String doseUnidade) {
        UUID autorId = jdbcTemplate.queryForObject("INSERT INTO " + SCHEMA + ".usuario (email, senha, nome, sobrenome)"
                + " VALUES (?, 'x', 'Legado', 'Migracao') RETURNING id", UUID.class,
                "legado." + UUID.randomUUID() + "@itu.sp.gov.br");
        UUID animalId = jdbcTemplate.queryForObject("INSERT INTO " + SCHEMA + ".animal"
                + " (nome, especie_id, sexo, status_id, motivo_entrada_id, data_entrada, criado_por_id)"
                + " SELECT 'Animal Legado', e.id, 'macho', s.id, m.id, TIMESTAMP '2025-01-10 10:00', ?"
                + " FROM " + SCHEMA + ".especie e, " + SCHEMA + ".status_animal s, " + SCHEMA + ".motivo_entrada m"
                + " WHERE e.codigo = 'canino' AND s.codigo = 'em_tratamento' AND m.codigo = 'resgate'"
                + " RETURNING id", UUID.class, autorId);
        return jdbcTemplate.queryForObject("INSERT INTO " + SCHEMA + ".vacinacao"
                + " (animal_id, vacina_id, aplicado_por_id, data_aplicacao, dose_quantidade, dose_unidade)"
                + " SELECT ?, v.id, ?, DATE '2025-01-10', 1.000, CAST(? AS varchar) FROM " + SCHEMA + ".vacina v"
                + " WHERE v.codigo = 'antirrabica' RETURNING id", UUID.class, animalId, autorId, doseUnidade);
    }
}
