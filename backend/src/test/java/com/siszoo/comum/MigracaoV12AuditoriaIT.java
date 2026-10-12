package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;

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

// Exercita a V12 (acao VISUALIZACAO, T26) num schema proprio do mesmo
// PostgreSQL de teste, no padrao de MigracaoV7RegistroClinicoIT: do zero e
// por atualizacao a partir da V11, com eventos das acoes anteriores.
class MigracaoV12AuditoriaIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v12";
    private static final List<String> ACOES_ANTERIORES = List.of(
            "CRIACAO", "ATUALIZACAO", "DESATIVACAO", "REATIVACAO", "LOGIN", "LOGOUT", "EXPORTACAO", "ENCERRAMENTO");

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void removerSchemaDoTeste() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    @Test
    @DisplayName("[T26] V12 aplica do zero sobre V1-V11 e aceita VISUALIZACAO")
    void v12DeveAplicarDoZero() {
        MigrateResult resultado = migrarAte("12");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.targetSchemaVersion, equalTo("12"));
        inserirEvento("VISUALIZACAO");
    }

    @Test
    @DisplayName("[T26] V12 sobre V11 preserva os eventos existentes e aceita as 8 acoes anteriores e VISUALIZACAO")
    void v12DevePreservarEventosEAceitarAcoes() {
        migrarAte("11");
        for (String acao : ACOES_ANTERIORES) {
            inserirEvento(acao);
        }
        // Antes da V12 a nova acao e recusada pelo CHECK da V2.
        assertThrows(DataIntegrityViolationException.class, () -> inserirEvento("VISUALIZACAO"));

        MigrateResult resultado = migrarAte("12");

        assertThat(resultado.success, equalTo(true));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + SCHEMA + ".auditoria_evento", Integer.class),
                equalTo(ACOES_ANTERIORES.size()));
        for (String acao : ACOES_ANTERIORES) {
            inserirEvento(acao);
        }
        inserirEvento("VISUALIZACAO");
    }

    @Test
    @DisplayName("[T26] V12 continua recusando acao invalida (inclusive em minusculas)")
    void v12DeveRecusarAcaoInvalida() {
        migrarAte("12");

        for (String invalida : List.of("LEITURA", "visualizacao", "")) {
            DataIntegrityViolationException erro =
                    assertThrows(DataIntegrityViolationException.class, () -> inserirEvento(invalida));
            assertThat(erro.getMessage(), containsString("ck_auditoria_evento_acao"));
        }
    }

    @Test
    @DisplayName("[T26] todo valor de AcaoAuditoria e aceito pelo CHECK da V12")
    void enumECheckAlinhados() {
        migrarAte("12");

        for (AcaoAuditoria acao : AcaoAuditoria.values()) {
            inserirEvento(acao.name());
        }
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

    // Grava direto em SQL: o objetivo e provar a constraint, nao o service.
    private void inserirEvento(String acao) {
        jdbcTemplate.update("INSERT INTO " + SCHEMA + ".auditoria_evento (acao, entidade) VALUES (?, 'teste_v12')", acao);
    }
}
