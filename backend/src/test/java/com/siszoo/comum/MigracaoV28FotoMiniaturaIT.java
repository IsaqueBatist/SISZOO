package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;

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

// Exercita a V28 (miniatura da foto do animal, T45) num schema proprio do
// mesmo PostgreSQL de teste, no padrao de MigracaoV16MicrochipIT: do zero e por
// atualizacao a partir da V27 com um animal com foto, que nao muda.
class MigracaoV28FotoMiniaturaIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v28";
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
    @DisplayName("[T45] V28 aplica do zero: animal.foto_miniatura text, nula")
    void v28DeveAplicarDoZero() {
        MigrateResult resultado = migrarAte("28");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.targetSchemaVersion, equalTo("28"));
        Map<String, Object> coluna = jdbcTemplate.queryForMap("SELECT data_type, is_nullable FROM information_schema.columns"
                + " WHERE table_schema = ? AND table_name = 'animal' AND column_name = 'foto_miniatura'", SCHEMA);
        assertThat(coluna.get("data_type"), equalTo("text"));
        assertThat(coluna.get("is_nullable"), equalTo("YES"));
    }

    @Test
    @DisplayName("[T45] V28 sobre V27 com foto gravada: foto_url intacta, miniatura nula ate o backfill da aplicacao")
    void v28SobreV27PreservaAFoto() {
        migrarAte("27");
        UUID usuario = jdbcTemplate.queryForObject("INSERT INTO " + S + "usuario (email, senha, nome, sobrenome)"
                + " VALUES (?, 'x', 'Migracao', 'Miniatura') RETURNING id", UUID.class,
                "migracao." + UUID.randomUUID().toString().substring(0, 8) + "@itu.sp.gov.br");
        UUID animal = UUID.randomUUID();
        String foto = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ";
        jdbcTemplate.update("INSERT INTO " + S + "animal (id, nome, especie_id, sexo, status_id, motivo_entrada_id,"
                + " data_entrada, criado_por_id, foto_url) SELECT ?, 'Animal', e.id, 'macho', s.id, m.id, now(), ?, ?"
                + " FROM " + S + "especie e, " + S + "status_animal s, " + S + "motivo_entrada m"
                + " WHERE e.codigo = 'canino' AND s.codigo = 'disponivel_adocao' AND m.codigo = 'resgate'",
                animal, usuario, foto);

        assertThat(migrarAte("28").success, equalTo(true));

        Map<String, Object> linha = jdbcTemplate.queryForMap(
                "SELECT foto_url, foto_miniatura FROM " + S + "animal WHERE id = ?", animal);
        assertThat(linha.get("foto_url"), equalTo(foto));
        assertThat(linha.get("foto_miniatura"), nullValue());
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
}
