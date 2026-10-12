package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;

// Exercita a V11 (Veterinario sem acesso a ocorrencias) num schema proprio do
// mesmo PostgreSQL de teste, no padrao de MigracaoV7RegistroClinicoIT: primeiro
// ate a V10 (estado com a leitura concedida pela V3), depois a V11.
class MigracaoV11AcessoVetIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v11";
    private static final String CARGO_VETERINARIO_ID = "00000000-0000-4000-8000-000000000002";

    // Uma linha da matriz: cargo, modulo, feature e as tres flags.
    private static final String MATRIZ = "SELECT CAST(cargo_id AS varchar) AS cargo_id, modulo, feature,"
            + " leitura, escrita, exclusao FROM " + SCHEMA + ".cargo_permissao"
            + " ORDER BY cargo_id, modulo, feature";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void removerSchemaDoTeste() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    @Test
    @DisplayName("V11 aplica do zero sobre V1-V10")
    void v11DeveAplicarDoZero() {
        MigrateResult resultado = migrarAte("11");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.targetSchemaVersion, equalTo("11"));
        assertThat(linhasDoVetComAcessoAOcorrencias(), equalTo(0));
    }

    @Test
    @DisplayName("V11 zera a leitura do Veterinario em OCORRENCIAS_DENUNCIAS e nao muda o resto da matriz")
    void v11DeveZerarSoALinhaDoVeterinario() {
        migrarAte("10");
        // Estado defeituoso herdado da V3: o Veterinario le o modulo.
        assertThat(flagsDoVetEmOcorrencias(), equalTo(Map.of("leitura", true, "escrita", false, "exclusao", false)));
        List<Map<String, Object>> antes = jdbcTemplate.queryForList(MATRIZ);

        MigrateResult resultado = migrarAte("11");

        assertThat(resultado.success, equalTo(true));
        assertThat(flagsDoVetEmOcorrencias(), equalTo(Map.of("leitura", false, "escrita", false, "exclusao", false)));
        assertThat(linhasDoVetComAcessoAOcorrencias(), equalTo(0));

        // Fora a linha corrigida, a matriz fica identica: as outras linhas do
        // Veterinario (animais RW, processos RW, relatorios R) e as de
        // Administrador e Agente, inclusive denunciante_sigiloso.
        List<Map<String, Object>> depois = jdbcTemplate.queryForList(MATRIZ);
        assertThat(depois.size(), equalTo(antes.size()));
        for (int i = 0; i < antes.size(); i++) {
            Map<String, Object> linha = antes.get(i);
            if (ehLinhaCorrigida(linha)) {
                continue;
            }
            assertThat(depois.get(i), equalTo(linha));
        }
    }

    @Test
    @DisplayName("Reexecutar o UPDATE da V11 nao muda nada (idempotente)")
    void v11DeveSerIdempotente() throws IOException {
        migrarAte("11");
        List<Map<String, Object>> antes = jdbcTemplate.queryForList(MATRIZ);

        String v11 = new ClassPathResource("db/migration/V11__remove_acesso_vet_ocorrencias.sql")
                .getContentAsString(StandardCharsets.UTF_8);
        String update = v11.substring(v11.indexOf("UPDATE cargo_permissao"))
                .replace("UPDATE cargo_permissao", "UPDATE " + SCHEMA + ".cargo_permissao")
                .replace(";", "")
                .trim();
        jdbcTemplate.update(update);

        assertThat(jdbcTemplate.queryForList(MATRIZ), equalTo(antes));
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

    private Map<String, Object> flagsDoVetEmOcorrencias() {
        return jdbcTemplate.queryForMap("SELECT leitura, escrita, exclusao FROM " + SCHEMA + ".cargo_permissao"
                + " WHERE cargo_id = CAST(? AS uuid) AND modulo = 'OCORRENCIAS_DENUNCIAS' AND feature = 'geral'",
                CARGO_VETERINARIO_ID);
    }

    // Qualquer feature do modulo, nao so 'geral'.
    private Integer linhasDoVetComAcessoAOcorrencias() {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + SCHEMA + ".cargo_permissao"
                + " WHERE cargo_id = CAST(? AS uuid) AND modulo = 'OCORRENCIAS_DENUNCIAS'"
                + " AND (leitura OR escrita OR exclusao)", Integer.class, CARGO_VETERINARIO_ID);
    }

    private static boolean ehLinhaCorrigida(Map<String, Object> linha) {
        return CARGO_VETERINARIO_ID.equals(linha.get("cargo_id"))
                && "OCORRENCIAS_DENUNCIAS".equals(linha.get("modulo"))
                && "geral".equals(linha.get("feature"));
    }
}
