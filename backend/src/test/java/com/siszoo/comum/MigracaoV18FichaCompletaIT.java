package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

import java.util.UUID;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

// Exercita a V18 (backfill de ficha_completa) num schema proprio, no padrao
// das outras MigracaoV*IT: dados legados gravados em SQL na V15 (ultima da
// main quando a V18 foi escrita) e a V18 aplicada por cima.
class MigracaoV18FichaCompletaIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v18";
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
    void v18RecalculaFichaCompletaPelaRegraDoDer() {
        migrarAte("15");
        UUID autor = inserirUsuario();

        // Regra antiga (so microchip) gravou true sem vacinacao: vira false.
        UUID chipSemVacina = inserirAnimal("985000000000001", true, autor);
        // Microchip e vacinacao: continua true.
        UUID chipComVacina = inserirAnimal("985000000000002", true, autor);
        inserirVacinacao(chipComVacina, autor, null);
        // Microchip e vacinacao, gravado como false: vira true.
        UUID chipComVacinaIncompleto = inserirAnimal("985000000000003", false, autor);
        inserirVacinacao(chipComVacinaIncompleto, autor, null);
        // Sem microchip, com vacinacao: false.
        UUID semChip = inserirAnimal(null, false, autor);
        inserirVacinacao(semChip, autor, null);
        // Microchip so com espacos (dado anterior a normalizacao) conta como
        // ausente, como o StringUtils.hasText do servico: false.
        UUID chipEmBranco = inserirAnimal("   ", true, autor);
        inserirVacinacao(chipEmBranco, autor, null);
        // Vacinacao retificada: a correcao e a vigente, o animal continua com vacina.
        UUID chipComRetificacao = inserirAnimal("985000000000004", false, autor);
        UUID original = inserirVacinacao(chipComRetificacao, autor, null);
        inserirVacinacao(chipComRetificacao, autor, original);
        String atualizadoAntes = atualizadoEm(chipSemVacina);

        MigrateResult resultado = migrarAte("18");

        assertThat(resultado.success, equalTo(true));
        assertThat(fichaCompleta(chipSemVacina), equalTo(false));
        assertThat(fichaCompleta(chipComVacina), equalTo(true));
        assertThat(fichaCompleta(chipComVacinaIncompleto), equalTo(true));
        assertThat(fichaCompleta(semChip), equalTo(false));
        assertThat(fichaCompleta(chipEmBranco), equalTo(false));
        assertThat(fichaCompleta(chipComRetificacao), equalTo(true));
        // So a coluna ficha_completa muda. (O microchip em branco nao e
        // conferido aqui: a V16 da fix/auditoria-rn, quando estiver na
        // sequencia, o normaliza para NULL antes da V18.)
        assertThat(atualizadoEm(chipSemVacina), equalTo(atualizadoAntes));
        assertThat(jdbcTemplate.queryForObject("SELECT microchip FROM " + S + "animal WHERE id = ?", String.class,
                chipSemVacina), equalTo("985000000000001"));
    }

    @Test
    void v18AplicaDoZeroSemAnimais() {
        MigrateResult resultado = migrarAte("18");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.targetSchemaVersion, equalTo("18"));
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

    private UUID inserirUsuario() {
        return jdbcTemplate.queryForObject("INSERT INTO " + S + "usuario (email, senha, nome, sobrenome)"
                + " VALUES (?, 'x', 'Legado', 'V18') RETURNING id", UUID.class,
                "legado." + UUID.randomUUID() + "@itu.sp.gov.br");
    }

    private UUID inserirAnimal(String microchip, boolean fichaCompleta, UUID autor) {
        return jdbcTemplate.queryForObject("INSERT INTO " + S + "animal"
                + " (nome, especie_id, sexo, status_id, motivo_entrada_id, data_entrada, criado_por_id, microchip,"
                + " ficha_completa, atualizado_em)"
                + " SELECT 'Animal Legado', e.id, 'macho', s.id, m.id, TIMESTAMP '2025-01-10 10:00', ?, ?, ?,"
                + " TIMESTAMP '2025-02-01 08:00'"
                + " FROM " + S + "especie e, " + S + "status_animal s, " + S + "motivo_entrada m"
                + " WHERE e.codigo = 'canino' AND s.codigo = 'em_tratamento' AND m.codigo = 'resgate'"
                + " RETURNING id", UUID.class, autor, microchip, fichaCompleta);
    }

    private UUID inserirVacinacao(UUID animal, UUID autor, UUID retifica) {
        return jdbcTemplate.queryForObject("INSERT INTO " + S + "vacinacao"
                + " (animal_id, vacina_id, aplicado_por_id, data_aplicacao, dose_quantidade, dose_unidade, retifica_id)"
                + " SELECT ?, v.id, ?, DATE '2025-01-10', 1.000, 'MILILITRO', ? FROM " + S + "vacina v"
                + " WHERE v.codigo = 'antirrabica' RETURNING id", UUID.class, animal, autor, retifica);
    }

    private boolean fichaCompleta(UUID animal) {
        return jdbcTemplate.queryForObject("SELECT ficha_completa FROM " + S + "animal WHERE id = ?", Boolean.class,
                animal);
    }

    private String atualizadoEm(UUID animal) {
        return jdbcTemplate.queryForObject("SELECT atualizado_em::text FROM " + S + "animal WHERE id = ?", String.class,
                animal);
    }
}
